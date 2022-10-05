import { TypedClient } from '../../../types/socket-types'
import { Player } from '../../../types/player-types'
import { ClientGameState } from './ClientGameState'
import { createGameUI } from './html/helpers'
import { GRID_SIZE } from '../../../constants/constants'

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
  }

  createGameUI(opponent: Player) {
    // hide the players list
    const playersList = document.querySelector('#players') as HTMLUListElement
    playersList?.remove()

    let alreadyForfeited = false
    const forfeitCallback = (e: Event) => {
      e.stopPropagation()
      if (!alreadyForfeited) {
        // forfeit the game
        alreadyForfeited = true
        this.socket.emit('forfeit')
      }
    }

    const outOfTimeCallback = () => {
      // fire a random value between 0 and GRID_SIZE
      const randomX = Math.floor(Math.random() * GRID_SIZE)
      const randomY = Math.floor(Math.random() * GRID_SIZE)
      this.socket.emit('fire', randomX, randomY)
    }

    let timer: NodeJS.Timer

    const MAX_TIME_PER_TURN = 8

    this.socket.on('yourTurn', () => {
      let timerElement = document.querySelector('#timer-element')
      let timeLeftElement = document.querySelector('#time-left')
      if (!(timerElement instanceof HTMLDivElement)) return
      if (!(timeLeftElement instanceof HTMLSpanElement)) return

      timerElement.style.display = 'inline-block'
      timeLeftElement.innerText = MAX_TIME_PER_TURN.toString()

      // countdown timer till move ends
      let timeLeft = MAX_TIME_PER_TURN - 1
      // create a countdown timer for the challenge of MAX_TIME_PER_TURN seconds
      timer = setInterval(() => {
        if (timeLeft <= 0) {
          clearInterval(timer)
          outOfTimeCallback()
        } else {
          if (timeLeftElement) {
            timeLeftElement.innerHTML = `${timeLeft}`
          }
        }
        timeLeft -= 1
      }, 1000)
    })

    this.socket.on('endTurn', () => {
      clearInterval(timer)
      let timerElement = document.querySelector('#timer-element')
      if (!(timerElement instanceof HTMLDivElement)) return
      timerElement.style.display = 'none'
    })

    const gameContainer = createGameUI(opponent, forfeitCallback)
    this.uiLayer.appendChild(gameContainer)
  }

  destroyGameUI() {
    const gameContainer = document.querySelector('#game-container')
    gameContainer?.remove()
  }
}
