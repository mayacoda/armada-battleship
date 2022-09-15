import { TypedClient } from '../../../types/socket-types'
import { EventEmitter } from '../engine/utilities/EventEmitter'
import { Player } from '../../../types/player-types'

export class ClientGameState extends EventEmitter {
  private yourTurn: boolean = false
  private socket: TypedClient
  private playersMap: Record<string, Player> = {}

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
      this.playersMap = players
      this.emit('updatePlayers', players)
    })
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
}
