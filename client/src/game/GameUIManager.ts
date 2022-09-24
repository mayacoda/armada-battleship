import { TypedClient } from '../../../types/socket-types'
import { Player } from '../../../types/player-types'
import { ClientGameState } from './ClientGameState'
import { createGameUI, tryCatch } from './html/helpers'

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
      tryCatch(() => {
        if (this.gameState.isYourTurn) {
          this.showYourTurn()
        } else {
          this.hideYourTurn()
        }
      })
    })
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

    const gameContainer = createGameUI(opponent, forfeitCallback)
    this.uiLayer.appendChild(gameContainer)
  }

  destroyGameUI() {
    const gameContainer = document.querySelector('#game-container')
    gameContainer?.remove()
  }

  showYourTurn() {
    const yourTurnBadge = document.querySelector('#your-turn')
    if (yourTurnBadge instanceof HTMLElement) {
      yourTurnBadge.style.display = 'block'
    }
  }

  hideYourTurn() {
    const yourTurnBadge = document.querySelector('#your-turn')
    if (yourTurnBadge instanceof HTMLElement) {
      yourTurnBadge.style.display = 'none'
    }
  }
}
