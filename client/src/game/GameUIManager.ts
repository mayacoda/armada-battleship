import { TypedClient } from '../../../types/socket-types'
import { Player } from '../../../types/player-types'
import { ClientGameState } from './ClientGameState'
import { createTable, markResult } from './html/helpers'

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
      console.log('turn changed')
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
      console.log('got result', { x, y, hit, firedBy })
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

    const gameContainer = document.createElement('div')
    gameContainer.style.padding = '1rem'
    gameContainer.id = 'game-container'

    // show opponent name
    const opponentName = opponent.name
    const opponentNameElement = document.createElement('h2')
    opponentNameElement.style.marginTop = '0'
    opponentNameElement.innerText = `Playing against ${opponentName}`

    gameContainer.appendChild(opponentNameElement)

    // show forfeit game button
    const cancelButton = document.createElement('button')
    cancelButton.innerText = 'Forfeit Game'
    let alreadyForfeited = false
    cancelButton.addEventListener('click', () => {
      if (!alreadyForfeited) {
        // forfeit the game
        alreadyForfeited = true
        this.socket.emit('forfeit')
      }
    })

    gameContainer.appendChild(cancelButton)

    // show screen for battleship game
    const battleshipGame = document.createElement('div')
    battleshipGame.id = 'battleship-game'

    // add title "Enemy Ships"
    const enemyTitle = document.createElement('h3')
    enemyTitle.innerText = 'Enemy Ships'
    battleshipGame.appendChild(enemyTitle)

    // create a 6 x 6 table for battleship for enemy ships
    const enemyTable = createTable()
    enemyTable.id = 'enemy-table'
    enemyTable.addEventListener('click', (e) => {
      this.fireAtEnemy(e)
    })
    battleshipGame.appendChild(enemyTable)

    // add title "Your Ships"
    const yourTitle = document.createElement('h3')
    yourTitle.innerText = 'Your Ships'
    battleshipGame.appendChild(yourTitle)

    // create a 6 x 6 table for battleship for player ships
    const playerTable = createTable()
    playerTable.id = 'player-table'
    battleshipGame.appendChild(playerTable)

    gameContainer.appendChild(battleshipGame)
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
      console.log(`${this.gameState.id} is firing at ${x}, ${y}`)
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
