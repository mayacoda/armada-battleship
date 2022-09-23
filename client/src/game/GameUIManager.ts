import { TypedClient } from '../../../types/socket-types'
import { Player } from '../../../types/player-types'
import { ClientGameState } from './ClientGameState'
import { createGameUI, markResult } from './html/helpers'

export class GameUIManager {
  uiLayer: HTMLDivElement
  socket: TypedClient
  gameState: ClientGameState

  constructor(
    uiLayer: HTMLDivElement,
    socket: TypedClient,
    gameState: ClientGameState
  ) {
    this.socket = socket
    this.uiLayer = uiLayer
    this.gameState = gameState

    this.gameState.on('turnChanged', () => {
      if (this.gameState.isYourTurn) {
        this.showYourTurn()
      } else {
        this.hideYourTurn()
      }
    })

    this.socket.on('initGrid', (grid: number[][]) => {
      this.initGrid(grid)
    })

    this.socket.on('result', ({ x, y, hit, firedBy }) => {
      if (this.gameState.id === firedBy) {
        // show the result in the enemies table
        const enemyTable = document.querySelector(
          '#enemy-table'
        ) as HTMLTableElement
        markResult(enemyTable, x, y, hit)
      } else {
        // show the result in the players table
        const playerTable = document.querySelector(
          '#player-table'
        ) as HTMLTableElement
        markResult(playerTable, x, y, hit)
      }
    })
  }

  createGameUI(opponent: Player) {
    // hide the players list
    const playersList = document.querySelector('#players') as HTMLUListElement
    playersList?.remove()

    const fireCallback = (e: Event) => {
      e.stopPropagation()
      this.fireAtEnemy(e)
    }

    let alreadyForfeited = false
    const forfeitCallback = (e: Event) => {
      e.stopPropagation()
      if (!alreadyForfeited) {
        // forfeit the game
        alreadyForfeited = true
        this.socket.emit('forfeit')
      }
    }

    const gameContainer = createGameUI(opponent, forfeitCallback, fireCallback)
    this.uiLayer.appendChild(gameContainer)
  }

  initGrid(grid: number[][]) {
    const playerTable = document.querySelector(
      '#player-table'
    ) as HTMLTableElement
    // mark player table with ships
    grid.forEach((row, rowIndex) => {
      row.forEach((cell, cellIndex) => {
        if (cell !== 0) {
          const cellElement = playerTable.rows[rowIndex].cells[cellIndex]
          cellElement.classList.add('ship')
          cellElement.innerText = cell.toString()
        }
      })
    })
  }

  destroyGameUI() {
    const gameContainer = document.querySelector('#game-container')
    gameContainer?.remove()
  }

  fireAtEnemy(e: Event) {
    if (e.target instanceof HTMLTableCellElement) {
      let parentElement = e.target.parentElement as HTMLTableRowElement
      const x = parentElement?.rowIndex ?? 0
      const y = e.target.cellIndex
      if (this.gameState.isYourTurn && x !== undefined && y !== undefined) {
        this.socket.emit('fire', x, y)
      }
    }
  }

  showYourTurn() {
    const enemyTable = document.querySelector(
      '#enemy-table'
    ) as HTMLTableElement
    enemyTable.style.border = '2px solid #f00'
  }

  hideYourTurn() {
    const enemyTable = document.querySelector(
      '#enemy-table'
    ) as HTMLTableElement
    enemyTable.style.border = '1px solid #000'
  }
}
