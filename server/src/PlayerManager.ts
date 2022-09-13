import EventEmitter from 'events'
import { Player } from '../../types/player-types'
import { TypedServer, TypedSocket } from '../../types/socket-types'

export class PlayerManager extends EventEmitter {
  players: Record<string, Player> = {}
  io: TypedServer

  constructor(io: TypedServer) {
    super()
    this.io = io
  }

  initPlayerCommunication(socket: TypedSocket) {
    socket.on('disconnect', () => {
      this.removePlayer(socket.id)
    })
    socket.on('login', (name) => {
      this.addPlayer({
        id: socket.id,
        name: name,
      })
    })
    socket.on('challenge', (playerId) => {
      this.challengePlayer(socket.id, playerId)
    })
    socket.on('accept', (playerId) => {
      this.startGame(socket.id, playerId)
    })

    socket.on('forfeit', () => {})
  }

  addPlayer(player: Player) {
    this.players[player.id] = player
    this.io.emit('updatePlayers', this.players)
  }

  removePlayer(playerId: string) {
    delete this.players[playerId]
    this.io.emit('updatePlayers', this.players)
  }

  challengePlayer(attacker: string, defender: string) {
    this.io.to(defender).emit('challenge', attacker)
  }

  startGame(attacker: string, defender: string) {
    this.io.to(attacker).emit('startGame', defender)
    this.io.to(defender).emit('startGame', attacker)
  }

  forfeitGame(playerId: string) {}
}
