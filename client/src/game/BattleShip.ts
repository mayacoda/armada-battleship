import { Experience } from '../engine/Experience'
import { io } from 'socket.io-client'
import { TypedClient } from '../../../types/socket-types'
import { UIManager } from './UIManager'

export class BattleShip implements Experience {
  resources = []
  socket!: TypedClient
  uiManager!: UIManager

  constructor() {}

  async init() {
    this.socket = io(import.meta.env.SERVER_URL ?? 'ws://localhost:3000', {
      transports: ['websocket'],
    }) as TypedClient

    this.uiManager = new UIManager(this.socket)
  }

  update() {}

  resize() {}
}
