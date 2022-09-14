import { Player } from '../../types/player-types'
import { TypedServer } from '../../types/socket-types'
import { EventEmitter } from 'events'
import { GRID_SIZE, TOTAL_SHIPS } from '../../constants/constants.js'

type BattleshipPlayer = Player & {
  grid: number[][]
  shipsSunk: number
}

export class BattleshipGameInstance extends EventEmitter {
  gameId: string
  player1: BattleshipPlayer
  player2: BattleshipPlayer
  io: TypedServer

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
      // todo: end game here for both players
    }

    player1Socket.emit('startGame', this.player2.id)
    player2Socket.emit('startGame', this.player1.id)

    this.initGrids()

    // should show both grids, not just the players own
    // the enemy's grid should be sanitized
    player1Socket.emit('initGrid', this.player1.grid)
    player2Socket.emit('initGrid', this.player2.grid)

    player1Socket.emit('yourTurn')

    player1Socket.on('fire', (x: number, y: number) => {
      this.fire(this.player2, this.player1, x, y)
      player1Socket.emit('endTurn')
      player2Socket.emit('yourTurn')
    })

    player2Socket.on('fire', (x: number, y: number) => {
      this.fire(this.player1, this.player2, x, y)
      player2Socket.emit('endTurn')
      player1Socket.emit('yourTurn')
    })
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
    this.placeShip(this.player1.grid, 4)
    this.placeShip(this.player1.grid, 3)
    this.placeShip(this.player1.grid, 2)
    this.placeShip(this.player1.grid, 1)

    this.placeShip(this.player2.grid, 4)
    this.placeShip(this.player2.grid, 3)
    this.placeShip(this.player2.grid, 2)
    this.placeShip(this.player2.grid, 1)
  }

  placeShip(grid: number[][], size: number) {
    const x = Math.floor(Math.random() * (GRID_SIZE - 1))
    const y = Math.floor(Math.random() * (GRID_SIZE - 1))
    const direction = Math.floor(Math.random() * 2)
    let valid = true
    for (let i = 0; i < size; i++) {
      if (direction === 0) {
        if (x + i >= GRID_SIZE || grid[x + i][y] !== 0) {
          valid = false
        }
      } else {
        if (y + i >= GRID_SIZE || grid[x][y + i] !== 0) {
          valid = false
        }
      }
    }
    if (valid) {
      for (let i = 0; i < size; i++) {
        if (direction === 0) {
          grid[x + i][y] = size
        } else {
          grid[x][y + i] = size
        }
      }
    } else {
      this.placeShip(grid, size)
    }
  }

  fire(
    receiving: BattleshipPlayer,
    firing: BattleshipPlayer,
    x: number,
    y: number
  ) {
    console.log(`got a fire from ${firing.id} at ${x}, ${y}`)
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
        this.endGame('win')
      }
    }
  }

  endGame(reason: 'disconnect' | 'forfeit' | 'win') {
    // cleanup
    this.emit('endGame', reason)
  }
}
