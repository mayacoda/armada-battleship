import { Experience } from '../engine/Experience'
import { io } from 'socket.io-client'

export class BattleShip implements Experience {
  resources = []

  init() {
    const socket = io(import.meta.env.SERVER_URL ?? 'ws://localhost:3000', {
      transports: ['websocket'],
    })

    socket.on('status', console.log)
  }

  update() {}

  resize() {}
}
