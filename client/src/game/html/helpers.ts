import { Player } from '../../../../types/player-types'

export function createGameOverOverlay(
  reason: 'win' | 'lose' | 'disconnect' | 'forfeit',
  listener: (e: Event) => void
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
  forfeitCallback: (e: Event) => void
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
  const forfeitButton = document.createElement('button')
  forfeitButton.innerText = 'Forfeit Game'
  forfeitButton.addEventListener('click', forfeitCallback)

  gameContainer.appendChild(forfeitButton)

  const yourTurnBadge = document.createElement('span')
  yourTurnBadge.id = 'your-turn'
  yourTurnBadge.innerText = 'Your Turn'
  yourTurnBadge.style.display = 'none'
  yourTurnBadge.style.backgroundColor = 'green'
  yourTurnBadge.style.color = '#fff'

  gameContainer.appendChild(yourTurnBadge)

  return gameContainer
}

export function tryCatch(cb: (...args: any[]) => void) {
  try {
    cb()
  } catch (e) {
    console.error(e)
  }
}
