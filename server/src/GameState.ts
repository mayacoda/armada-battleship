import { Player } from '../../types/player-types'
import { TypedServer } from '../../types/socket-types'
import { EventEmitter } from 'events'
import { GRID_SIZE } from '../../constants/constants.js'

export class GameState extends EventEmitter {
  gameId: string
  attacker: Player
  defender: Player
  io: TypedServer

  attackerGrid: number[][] = []
  defenderGrid: number[][] = []

  constructor(attacker: Player, defender: Player, io: TypedServer) {
    super()
    this.attacker = attacker
    this.defender = defender

    this.gameId = `${attacker.id}-${defender.id}`

    this.io = io
    this.io.to(this.attacker.id).emit('startGame', this.defender.id)
    this.io.to(this.defender.id).emit('startGame', this.attacker.id)

    this.initGrids()

    this.io.to(this.attacker.id).emit('initGrid', this.attackerGrid)
    this.io.to(this.defender.id).emit('initGrid', this.defenderGrid)
    console.log(this.attackerGrid)
    console.log(this.defenderGrid)
  }

  initGrids() {
    // set up 6 x 6 grid for each player
    for (let i = 0; i < GRID_SIZE; i++) {
      this.attackerGrid.push([])
      this.defenderGrid.push([])
      for (let j = 0; j < GRID_SIZE; j++) {
        this.attackerGrid[i].push(0)
        this.defenderGrid[i].push(0)
      }
    }

    // set up ships randomly for each player
    this.placeShip(this.attackerGrid, 4)
    this.placeShip(this.attackerGrid, 3)
    this.placeShip(this.attackerGrid, 2)
    this.placeShip(this.attackerGrid, 1)

    this.placeShip(this.defenderGrid, 4)
    this.placeShip(this.defenderGrid, 3)
    this.placeShip(this.defenderGrid, 2)
    this.placeShip(this.defenderGrid, 1)
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

  endGame(reason: 'disconnect' | 'forfeit' | 'win') {
    // cleanup
    this.emit('endGame', reason)
  }
}
