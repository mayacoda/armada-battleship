import { EndState } from '../../../types/socket-types'
import { GameUIManager } from './GameUIManager'
import { ClientGameState } from './ClientGameState'
import { createGameOverOverlay } from './html/helpers'
import { Engine } from '../engine/Engine'
import boatImage from '../../assets/images/boat.svg'
import bombImage from '../../assets/images/bomb.svg'

export class UIManager {
  uiLayer: HTMLDivElement
  gameUIManager: GameUIManager | null = null

  constructor(private engine: Engine, private gameState: ClientGameState) {
    this.uiLayer = this.engine.ui.container
    this.init()
  }

  async init() {
    const userName = await this.showLogin()

    this.engine.socket.on('challenge', (attackerId: string) => {
      this.showChallenge(attackerId)
    })

    this.engine.socket.on('startGame', ({ attacker, defender }) => {
      if (this.engine.socket.id === attacker) {
        this.startGame(defender)
      } else {
        this.startGame(attacker)
      }
    })

    this.engine.socket.on('gameOver', (state: EndState) => {
      const reason = state[this.gameState.id]
      this.showGameOverModal(reason)
    })

    this.engine.socket.emit('login', userName)
    this.gameState.setScene('idle')
  }

  // Login
  async showLogin(): Promise<string> {
    const loginModal = document.createElement('div')
    loginModal.classList.add('overlay', 'login-modal')
    loginModal.id = 'login'
    loginModal.innerHTML = `
<div class="container">
    <h1>Armada Battleship</h1>
    <div class="emoji"><img src="${boatImage}" />️</div>
</div>`

    const loginForm = document.createElement('form')
    loginForm.id = 'login-form'
    loginForm.innerHTML = `
      <input type="text" name="username" placeholder="Enter player name" autocomplete="off" />
      <input type="submit" class="primary" value="Play!" />
    `
    // add padding and style to log in form
    loginForm.style.padding = '1rem'

    loginModal.querySelector('.container')!.appendChild(loginForm)
    this.uiLayer.appendChild(loginModal)

    return new Promise((resolve) => {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault()
        const username = loginForm.querySelector(
          'input[name="username"]'
        ) as HTMLInputElement
        if (!username.value) return
        resolve(username.value)
        loginModal.remove()
      })
    })
  }

  showChallenge(attacker: string) {
    if (document.querySelector('#challenge')) return

    let timeLeft = 9
    // create a countdown timer for the challenge of 10 seconds
    const timer = setInterval(() => {
      if (timeLeft <= 0) {
        clearInterval(timer)
        removeChallengeElement()
      } else {
        // floor time left to the nearest second
        acceptButton.innerText = `Accept (${timeLeft})`
      }
      timeLeft -= 1
    }, 1000)

    const challengeElement = document.createElement('div')
    challengeElement.classList.add('toast')
    challengeElement.id = 'challenge'
    challengeElement.innerHTML = `
      <p><em>${
        this.gameState.players[attacker]?.name ?? attacker
      }</em> is challenging you! <span class="emoji"><img src="${bombImage}" /></span></p>
      <div>
        <button id="reject">Reject</button>
        <button id="accept" class="primary">Accept (${timeLeft + 1})</button>
      </div>
    `

    function removeChallengeElement() {
      challengeElement.classList.remove('visible')
      setTimeout(() => {
        challengeElement.remove()
      }, 400)
    }

    this.uiLayer.appendChild(challengeElement)
    setTimeout(() => {
      challengeElement.classList.add('visible')
    })

    const acceptButton = challengeElement.querySelector(
      '#accept'
    ) as HTMLButtonElement

    acceptButton.addEventListener('click', (event) => {
      event.stopPropagation()
      this.engine.socket.emit('accept', attacker)
      this.cleanUpGame()
      removeChallengeElement()
    })

    const rejectButton = challengeElement.querySelector(
      '#reject'
    ) as HTMLButtonElement
    rejectButton.addEventListener('click', (event) => {
      event.stopPropagation()
      removeChallengeElement()
    })
  }

  showGameOverModal(reason: 'win' | 'lose' | 'disconnect' | 'forfeit') {
    const overlay = createGameOverOverlay(reason, (e: Event) => {
      e.stopPropagation()
      this.cleanUpGame()
    })
    this.uiLayer.appendChild(overlay)
  }

  cleanUpGame() {
    this.gameUIManager?.destroyGameUI()
    this.gameUIManager = null
    this.gameState.setScene('idle')
    this.uiLayer.querySelector('#overlay')?.remove()
  }

  startGame(opponentId: string) {
    const opponent = this.gameState.players[opponentId]
    if (!opponent) return // todo handle not being able to find the opponent

    // start the game
    this.gameState.setScene('playing')

    this.gameUIManager = new GameUIManager(
      this.uiLayer,
      this.engine.socket,
      this.gameState
    )

    this.gameUIManager.createGameUI(opponent)
  }
}
