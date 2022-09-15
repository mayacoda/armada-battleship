import { GRID_SIZE } from '../../../../constants/constants'
import { Player } from '../../../../types/player-types'

export function createTable() {
  const table = document.createElement('table')
  table.style.border = '1px solid black'
  table.style.margin = '15px'
  table.style.borderCollapse = 'collapse'
  for (let i = 0; i < GRID_SIZE; i++) {
    const tr = document.createElement('tr')
    for (let j = 0; j < GRID_SIZE; j++) {
      const td = document.createElement('td')
      td.style.border = '1px solid black'
      td.style.width = '48px'
      td.style.height = '48px'
      td.style.textAlign = 'center'
      td.style.verticalAlign = 'middle'
      tr.appendChild(td)
    }
    table.appendChild(tr)
  }
  return table
}

export function markResult(
  table: HTMLTableElement,
  x: number,
  y: number,
  hit: boolean
) {
  const cell = table.rows[x].cells[y]
  if (hit) {
    cell.style.backgroundColor = '#f00'
  } else {
    cell.style.backgroundColor = '#bbb'
  }
}

export function createGameOverOverlay(
  reason: 'win' | 'lose' | 'disconnect' | 'forfeit',
  listener: () => void
) {
  // create overlay to prevent user from clicking on anything else
  const overlay = document.createElement('div')
  overlay.style.position = 'fixed'
  overlay.style.top = '0'
  overlay.style.left = '0'
  overlay.style.width = '100%'
  overlay.style.height = '100%'
  overlay.style.backgroundColor = 'rgba(0,0,0,0.5)'
  overlay.id = 'overlay'

  let text = ''
  switch (reason) {
    case 'win':
      text = 'You won! ✨'
      break
    case 'lose':
      text = 'You lost! 😢'
      break
    case 'forfeit':
      text = 'You forfeited! 😱'
      break
    case 'disconnect':
      text = 'Your opponent disconnected! 💔'
      break
  }

  const gameOverModal = document.createElement('div')
  gameOverModal.id = 'game-over-modal'
  gameOverModal.innerHTML = `
      <h1>Game Over</h1>
      <p>${text}</p>
      <button id="play-again">Okay</button>
    `
  gameOverModal.style.padding = '1rem'
  gameOverModal.style.backgroundColor = '#fff'
  gameOverModal.style.textAlign = 'center'
  overlay.appendChild(gameOverModal)

  const button = gameOverModal.querySelector('#play-again') as HTMLButtonElement

  button.addEventListener('click', listener)
  return overlay
}

export function createGameUI(
  opponent: Player,
  forfeitCallback: () => void,
  fireCallback: (e: Event) => void
) {
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
  cancelButton.addEventListener('click', forfeitCallback)

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

  enemyTable.addEventListener('click', fireCallback)
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
  return gameContainer
}
