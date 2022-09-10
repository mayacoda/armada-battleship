import { Experience } from '../engine/Experience'
import { io } from 'socket.io-client'

export class BattleShip implements Experience {
  resources = []

  init() {
    const hostname = window.location.hostname
    const socket = io(`${hostname}:3000`, {
      transports: ['websocket'],
    })

    socket.on('status', console.log)
  }

  update() {}

  resize() {}
}
