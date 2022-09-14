import { Player } from '../../../types/player-types'
import { TypedClient } from '../../../types/socket-types'
import { GameUIManager } from './GameUIManager'
import { ClientGameState } from './ClientGameState'

export class UIManager {
  uiLayer: HTMLDivElement
  socket: TypedClient
  gameState: ClientGameState
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
      console.log('starting the game?')
      this.startGame(opponentId)
    })
  }

  // Login
  async showLogin(): Promise<string> {
    const loginForm = document.createElement('form')
    loginForm.id = 'login-form'
    loginForm.innerHTML = `
      <input type="text" name="username" placeholder="Username" />
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

  startGame(opponentId: string) {
    console.log('Starting game with', opponentId)
    // start the game
    this.isGameActive = true

    const gameManager = new GameUIManager(
      this.uiLayer,
      this.socket,
      this.gameState
    )

    const opponent = this.players[opponentId]
    if (!opponent) return // todo handle not being able to find the opponent

    gameManager.createGameUI(opponent)
  }
}
