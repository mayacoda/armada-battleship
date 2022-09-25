import { TypedClient } from '../../../types/socket-types'
import { EventEmitter } from '../engine/utilities/EventEmitter'
import { Player } from '../../../types/player-types'
import { tryCatch } from './html/helpers'

export type SceneType = 'login' | 'idle' | 'playing'

export class ClientGameState extends EventEmitter {
  private yourTurn: boolean = false
  private socket: TypedClient
  private playersMap: Record<string, Player> = {}

  private currentScene: SceneType = 'login'

  constructor(socket: TypedClient) {
    super()
    this.socket = socket

    this.socket.on('yourTurn', () => {
      this.yourTurn = true
      this.emit('turnChanged')
    })

    this.socket.on('endTurn', () => {
      this.yourTurn = false
      this.emit('turnChanged')
    })

    this.socket.on('updatePlayers', (players: Record<string, Player>) => {
      tryCatch(() => {
        const scaleChange =
          Object.keys(players).length !== Object.keys(this.players).length
        this.playersMap = players
        if (scaleChange && this.scene === 'idle') {
          this.emit('reposition', players[this.id]?.position)
        }
        this.emit('updatePlayers', players)
      })
    })
  }

  setScene(scene: SceneType) {
    this.currentScene = scene
    this.emit('sceneChanged', scene)
  }

  get isYourTurn() {
    return this.yourTurn
  }

  get id() {
    return this.socket.id
  }

  get players() {
    return this.playersMap
  }

  get scene() {
    return this.currentScene
  }

  get waterScale() {
    return 4 + Math.sqrt(Object.keys(this.players).length)
  }

  get currentPlayer(): Player | undefined {
    return this.players[this.id]
  }
}
