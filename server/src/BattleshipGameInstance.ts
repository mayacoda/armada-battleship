import { Player } from '../../types/player-types'
import { EndState, TypedServer, TypedSocket } from '../../types/socket-types'
import { EventEmitter } from 'events'
import { GRID_SIZE, TOTAL_SHIPS } from '../../constants/constants.js'
import { placeShip } from './game-logic.js'

type BattleshipPlayer = Player & {
  grid: number[][]
  shipsSunk: number
}

type FireParams = {
  receiving: BattleshipPlayer
  firing: BattleshipPlayer
  x: number
  y: number
}

type Listener = () => void

export class BattleshipGameInstance extends EventEmitter {
  gameId: string
  player1: BattleshipPlayer
  player2: BattleshipPlayer
  io: TypedServer

  disconnectOffHandlers: Listener[] = []

  constructor(attacker: Player, defender: Player, io: TypedServer) {
    super()
    this.io = io

    this.player1 = { ...attacker, shipsSunk: 0, grid: [] }
    this.player2 = { ...defender, shipsSunk: 0, grid: [] }

    this.gameId = `${attacker.id}-${defender.id}`

    const player1Socket = this.io.sockets.sockets.get(attacker.id)
    const player2Socket = this.io.sockets.sockets.get(defender.id)

    if (!player1Socket || !player2Socket) {
      return
    }

    // both players join the same room
    player1Socket.join(this.gameId)
    player2Socket.join(this.gameId)

    this.io
      .to(this.gameId)
      .emit('startGame', { attacker: attacker.id, defender: defender.id })

    this.initGrids()

    // should show both grids, not just the players own
    // the enemy's grid should be sanitized
    player1Socket.emit('initGrid', this.player1.grid)
    player2Socket.emit('initGrid', this.player2.grid)

    player1Socket.emit('yourTurn')

    this.handleFireEvents(player1Socket, player2Socket)
    this.handleForfeitEvents(player1Socket, player2Socket)
    this.handleDisconnectEvents(player1Socket, player2Socket)
  }

  private handleFireEvents(...sockets: TypedSocket[]) {
    for (const socket of sockets) {
      socket.on('fire', (x: number, y: number) => {
        this.fire({
          receiving: this.findEnemy(socket.id),
          firing: this.findPlayer(socket.id),
          x,
          y,
        })
        socket.emit('endTurn')
        socket.to(this.gameId).emit('yourTurn')
      })
    }
  }

  private handleForfeitEvents(...sockets: TypedSocket[]) {
    for (const socket of sockets) {
      socket.on('forfeit', () => {
        const endState: EndState = {}
        for (const soc of sockets) {
          endState[soc.id] = soc.id === socket.id ? 'forfeit' : 'win'
        }
        this.io.to(this.gameId).emit('gameOver', endState)
        this.cleanUp()
      })
    }
  }

  private handleDisconnectEvents(...sockets: TypedSocket[]) {
    for (const socket of sockets) {
      const disconnectListener = () => {
        const endState: EndState = {}
        for (const soc of sockets) {
          endState[soc.id] = 'disconnect'
        }
        this.io.to(this.gameId).emit('gameOver', endState)
        this.cleanUp()
      }
      this.disconnectOffHandlers.push(() => {
        socket.off('disconnect', disconnectListener)
      })
      socket.on('disconnect', disconnectListener)
    }
  }

  initGrids() {
    // set up 6 x 6 grid for each player
    for (let i = 0; i < GRID_SIZE; i++) {
      this.player1.grid.push([])
      this.player2.grid.push([])
      for (let j = 0; j < GRID_SIZE; j++) {
        this.player1.grid[i].push(0)
        this.player2.grid[i].push(0)
      }
    }

    // set up ships randomly for each player
    placeShip(this.player1.grid, 4)
    placeShip(this.player1.grid, 3)
    placeShip(this.player1.grid, 2)
    placeShip(this.player1.grid, 1)

    placeShip(this.player2.grid, 4)
    placeShip(this.player2.grid, 3)
    placeShip(this.player2.grid, 2)
    placeShip(this.player2.grid, 1)
  }

  fire({ receiving, firing, x, y }: FireParams) {
    const receivingSocket = this.io.sockets.sockets.get(receiving.id)
    const firingSocket = this.io.sockets.sockets.get(firing.id)

    if (!receivingSocket || !firingSocket) {
      return
    }

    let result = { firedBy: firing.id, x, y, hit: false }

    if (receiving.grid[x][y] === 0) {
      receiving.grid[x][y] = -1
      result.hit = false

      firingSocket.emit('result', result)
      receivingSocket.emit('result', result)
    } else if (receiving.grid[x][y] < 0) {
      // already fired here
      return
    } else {
      receiving.grid[x][y] = -2
      result.hit = true

      receivingSocket.emit('result', result)
      firingSocket.emit('result', result)

      receiving.shipsSunk++
      if (receiving.shipsSunk === TOTAL_SHIPS) {
        this.io.to(this.gameId).emit('gameOver', {
          [receiving.id]: 'lose',
          [firing.id]: 'win',
        })
        this.cleanUp()
      }
    }
  }

  findPlayer(socketId: string) {
    return this.player1.id === socketId ? this.player1 : this.player2
  }

  findEnemy(socketId: string) {
    return this.player1.id === socketId ? this.player2 : this.player1
  }

  cleanUp() {
    this.io
      .in(this.gameId)
      .allSockets()
      .then((socketIds) => {
        for (const socketId of socketIds) {
          // remove 'forfeit' and 'fire' listeners
          this.io.sockets.sockets.get(socketId)?.removeAllListeners('forfeit')
          this.io.sockets.sockets.get(socketId)?.removeAllListeners('fire')
        }
      })

    // remove disconnect listeners
    for (const offHandler of this.disconnectOffHandlers) {
      offHandler()
    }

    this.io.socketsLeave(this.gameId)
    this.emit('gameOver')
  }
}
