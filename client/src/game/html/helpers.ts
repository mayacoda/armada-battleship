import { Player } from '../../../../types/player-types'

export function createGameOverOverlay(
  reason: 'win' | 'lose' | 'disconnect' | 'forfeit',
  listener: (e: Event) => void
) {
  // create overlay to prevent user from clicking on anything else
  const overlay = document.createElement('div')
  overlay.classList.add('overlay')
  overlay.id = 'overlay'

  let text = ''
  switch (reason) {
    case 'win':
      text = 'You won! <span class="emoji">✨</span>'
      break
    case 'lose':
      text = 'You lost! <span class="emoji">😢</span>'
      break
    case 'forfeit':
      text = 'You forfeited! <span class="emoji">😱</span>'
      break
    case 'disconnect':
      text = 'Your opponent disconnected! <span class="emoji">💔</span>'
      break
  }

  const gameOverModal = document.createElement('div')
  gameOverModal.id = 'game-over-modal'
  gameOverModal.classList.add('container')
  gameOverModal.innerHTML = `
      <h1>Game Over</h1>
      <p>${text}</p>
      <button id="play-again">Okay</button>
    `
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
  forfeitButton.innerHTML = '<span class="emoji">🏳</span> Forfeit'
  forfeitButton.addEventListener('click', forfeitCallback)

  gameContainer.appendChild(forfeitButton)

  return gameContainer
}

export function tryCatch(cb: (...args: any[]) => void) {
  try {
    cb()
  } catch (e) {
    console.error(e)
  }
}
