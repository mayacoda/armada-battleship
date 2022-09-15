import { Player } from '../../../types/player-types'
import { TypedClient } from '../../../types/socket-types'
import { GameUIManager } from './GameUIManager'
import { ClientGameState } from './ClientGameState'

export class UIManager {
  uiLayer: HTMLDivElement
  socket: TypedClient
  gameState: ClientGameState
  gameUIManager: GameUIManager | null = null
  players: Record<string, Player> = {}
  isGameActive: boolean = false

  constructor(socket: TypedClient, gameState: ClientGameState) {
    this.socket = socket
    this.gameState = gameState
    this.uiLayer = document.querySelector('#ui') as HTMLDivElement
    this.init()
  }

  async init() {
    const userName = await this.showLogin()
    this.socket.emit('login', userName)

    this.socket.on('updatePlayers', (players) => {
      this.updatePlayerList(players, this.socket.id)
    })

    this.socket.on('challenge', (attackerId: string) => {
      this.showChallenge(attackerId)
    })

    this.socket.on('startGame', (opponentId: string) => {
      this.startGame(opponentId)
    })

    this.socket.on(
      'gameOver',
      (reason: 'win' | 'lose' | 'disconnect' | 'forfeit') => {
        this.showGameOverModal(reason)
      }
    )
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
    this.players = players

    if (this.isGameActive) return
    const playersListElement = this.getPlayerListElement()

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
    const challengeElement = document.createElement('div')
    challengeElement.id = 'challenge'
    challengeElement.innerHTML = `
      <p>${this.players[attacker]?.name ?? attacker} is challenging you!</p>
      <button id="accept">Accept</button>
      <button id="reject">Reject</button>
    `
    challengeElement.style.padding = '1rem'
    challengeElement.style.position = 'fixed'
    challengeElement.style.top = '0'
    challengeElement.style.left = '0'
    challengeElement.style.width = '100%'
    challengeElement.style.backgroundColor = '#fff'

    this.uiLayer.appendChild(challengeElement)

    const acceptButton = challengeElement.querySelector(
      '#accept'
    ) as HTMLButtonElement
    acceptButton.addEventListener('click', () => {
      this.socket.emit('accept', attacker)
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
    // create overlay to prevent user from clicking on anything else
    const overlay = document.createElement('div')
    overlay.style.position = 'fixed'
    overlay.style.top = '0'
    overlay.style.left = '0'
    overlay.style.width = '100%'
    overlay.style.height = '100%'
    overlay.style.backgroundColor = 'rgba(0,0,0,0.5)'
    this.uiLayer.appendChild(overlay)

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

    const button = gameOverModal.querySelector(
      '#play-again'
    ) as HTMLButtonElement
    button.addEventListener('click', () => {
      this.gameUIManager?.destroyGameUI()
      this.gameUIManager = null
      this.isGameActive = false
      overlay.remove()
      this.updatePlayerList(this.players, this.socket.id)
    })
  }

  startGame(opponentId: string) {
    // start the game
    this.isGameActive = true

    this.gameUIManager = new GameUIManager(
      this.uiLayer,
      this.socket,
      this.gameState
    )

    const opponent = this.players[opponentId]
    if (!opponent) return // todo handle not being able to find the opponent

    this.gameUIManager.createGameUI(opponent)
  }
}
