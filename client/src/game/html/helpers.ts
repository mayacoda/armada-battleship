import { Player } from '../../../../types/player-types'
import sparkles from '../../../assets/images/sparkles.svg'
import cry from '../../../assets/images/cry.svg'
import scream from '../../../assets/images/scream.svg'
import brokenHeart from '../../../assets/images/broken_heart.svg'
import whiteFlag from '../../../assets/images/white_flag.svg'

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
      text = `You won! <span class="emoji"><img src="${sparkles}"></span>`
      break
    case 'lose':
      text = `You lost! <span class="emoji"><img src="${cry}"></span>`
      break
    case 'forfeit':
      text = `You forfeited! <span class="emoji"><img src="${scream}"></span>`
      break
    case 'disconnect':
      text = `Your opponent disconnected! <span class="emoji"><img src="${brokenHeart}"></span>`
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

  const timerElement = document.createElement('div')
  timerElement.id = 'timer-element'
  timerElement.style.marginBottom = '1rem'
  timerElement.style.textAlign = 'center'
  timerElement.style.display = 'none'
  timerElement.innerHTML = `
    Time left: <span id="time-left">10</span>
  `

  gameContainer.appendChild(timerElement)

  // show forfeit game button
  const forfeitButton = document.createElement('button')
  forfeitButton.id = 'forfeit-button'
  forfeitButton.innerHTML = `<span class="emoji"><img src="${whiteFlag}"></span> Forfeit`
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
