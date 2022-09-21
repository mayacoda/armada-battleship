import { Player } from '../../../types/player-types'
import { EndState, TypedClient } from '../../../types/socket-types'
import { GameUIManager } from './GameUIManager'
import { ClientGameState } from './ClientGameState'
import { createGameOverOverlay } from './html/helpers'
import { Engine } from '../engine/Engine'

export class UIManager {
  uiLayer: HTMLDivElement
  gameUIManager: GameUIManager | null = null
  players: Record<string, Player> = {}

  constructor(
    private engine: Engine,
    private socket: TypedClient,
    private gameState: ClientGameState
  ) {
    this.uiLayer = this.engine.ui.container
    this.init()
  }

  async init() {
    const userName = await this.showLogin()

    this.gameState.on('updatePlayers', (players: Record<string, Player>) => {
      this.updatePlayerList(players, this.socket.id)
    })

    this.socket.on('challenge', (attackerId: string) => {
      this.showChallenge(attackerId)
    })

    this.socket.on('startGame', ({ attacker, defender }) => {
      if (this.socket.id === attacker) {
        this.startGame(defender)
      } else {
        this.startGame(attacker)
      }
    })

    this.socket.on('gameOver', (state: EndState) => {
      const reason = state[this.gameState.id]
      this.showGameOverModal(reason)
    })

    this.socket.emit('login', userName)
    this.gameState.setScene('idle')
  }

  // Login
  async showLogin(): Promise<string> {
    const loginForm = document.createElement('form')
    loginForm.id = 'login-form'
    loginForm.innerHTML = `
      <input type="text" name="username" placeholder="Username" autocomplete="off" />
      <input type="submit" value="Login" />
    `
    // add padding and style to log in form
    loginForm.style.padding = '1rem'
    this.uiLayer.appendChild(loginForm)

    return new Promise((resolve) => {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault()
        const username = loginForm.querySelector(
          'input[name="username"]'
        ) as HTMLInputElement
        resolve(username.value)
        loginForm.remove()
      })
    })
  }

  // Players List
  updatePlayerList(players: Record<string, Player>, currentPlayerId: string) {
    if (this.gameState.scene !== 'idle') return
    const playersListElement = this.getPlayerListElement()
    playersListElement.style.maxWidth = '100%'

    playersListElement.innerHTML = ''
    Object.values(players).forEach((player) => {
      const li = document.createElement('li')
      li.innerText = `${player.name} - ${player.id}`
      li.style.padding = '0.5rem'
      const challengeButton = document.createElement('button')
      challengeButton.style.marginLeft = '1rem'
      if (player.id === currentPlayerId) {
        challengeButton.disabled = true
        challengeButton.innerText = 'You'
      } else if (player.isPlaying) {
        challengeButton.disabled = true
        challengeButton.innerText = 'Playing'
      } else {
        challengeButton.innerText = 'Challenge'
        challengeButton.addEventListener('click', () => {
          this.socket.emit('challenge', player.id)
        })
      }
      li.appendChild(challengeButton)
      playersListElement.appendChild(li)
    })
  }

  getPlayerListElement() {
    let playersList = document.querySelector('#players') as HTMLUListElement
    if (!playersList) {
      playersList = document.createElement('ul')
      playersList.id = 'players'
      this.uiLayer.appendChild(playersList)
    }
    return playersList
  }

  showChallenge(attacker: string) {
    let timeLeft = 9
    // create a countdown timer for the challenge of 10 seconds
    const timer = setInterval(() => {
      if (timeLeft <= 0) {
        clearInterval(timer)
        challengeElement.remove()
      } else {
        // floor time left to the nearest second
        acceptButton.innerText = `Accept (${timeLeft})`
      }
      timeLeft -= 1
    }, 1000)

    const challengeElement = document.createElement('div')
    challengeElement.id = 'challenge'
    challengeElement.innerHTML = `
      <p>${
        this.gameState.players[attacker]?.name ?? attacker
      } is challenging you!</p>
      <button id="accept">Accept (${timeLeft + 1})</button>
      <button id="reject">Reject</button>
    `
    challengeElement.style.padding = '1rem'
    challengeElement.style.position = 'fixed'
    challengeElement.style.bottom = '0'
    challengeElement.style.left = '0'
    challengeElement.style.width = '100%'
    challengeElement.style.backgroundColor = '#fff'
    challengeElement.style.textAlign = 'center'
    challengeElement.style.boxSizing = 'border-box'

    this.uiLayer.appendChild(challengeElement)

    const acceptButton = challengeElement.querySelector(
      '#accept'
    ) as HTMLButtonElement

    acceptButton.addEventListener('click', () => {
      this.socket.emit('accept', attacker)
      this.cleanUpGame()
      challengeElement.remove()
    })

    const rejectButton = challengeElement.querySelector(
      '#reject'
    ) as HTMLButtonElement
    rejectButton.addEventListener('click', () => {
      challengeElement.remove()
    })
  }

  showGameOverModal(reason: 'win' | 'lose' | 'disconnect' | 'forfeit') {
    const overlay = createGameOverOverlay(reason, () => {
      this.cleanUpGame()
      this.updatePlayerList(this.gameState.players, this.socket.id)
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
      this.socket,
      this.gameState
    )

    this.gameUIManager.createGameUI(opponent)
  }
}
