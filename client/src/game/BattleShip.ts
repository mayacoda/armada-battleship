import { Experience } from '../engine/Experience'
import { io } from 'socket.io-client'
import { TypedClient } from '../../../types/socket-types'
import { UIManager } from './UIManager'
import { ClientGameState } from './ClientGameState'

export class BattleShip implements Experience {
  resources = []
  socket!: TypedClient
  uiManager!: UIManager
  gameState!: ClientGameState

  constructor() {}

  async init() {
    this.socket = io(import.meta.env.SERVER_URL ?? 'ws://localhost:3000', {
      transports: ['websocket'],
    }) as TypedClient

    this.gameState = new ClientGameState(this.socket)
    this.uiManager = new UIManager(this.socket, this.gameState)
  }

  update() {}

  resize() {}
}
