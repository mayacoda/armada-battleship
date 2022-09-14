import { TypedClient } from '../../../types/socket-types'
import { EventEmitter } from '../engine/utilities/EventEmitter'

export class ClientGameState extends EventEmitter {
  private yourTurn: boolean = false
  private socket: TypedClient

  constructor(socket: TypedClient) {
    super()
    this.socket = socket

    this.socket.on('yourTurn', () => {
      console.log('your turn from socket')
      this.yourTurn = true
      this.emit('turnChanged')
    })

    this.socket.on('endTurn', () => {
      console.log('end tern from socket')
      this.yourTurn = false
      this.emit('turnChanged')
    })
  }

  get isYourTurn() {
    return this.yourTurn
  }

  get id() {
    return this.socket.id
  }
}
