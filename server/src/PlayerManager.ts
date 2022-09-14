import { Player } from '../../types/player-types'
import { TypedServer, TypedSocket } from '../../types/socket-types'
import { BattleshipGameInstance } from './BattleshipGameInstance.js'

export class PlayerManager {
  players: Record<string, Player> = {}
  io: TypedServer
  games: Record<string, BattleshipGameInstance> = {}

  constructor(io: TypedServer) {
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
      this.startGame(playerId, socket.id)
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
    const game = new BattleshipGameInstance(
      this.players[attacker],
      this.players[defender],
      this.io
    )
    this.games[game.gameId] = game
    game.on('endGame', () => {
      delete this.games[game.gameId]
    })
  }

  forfeitGame(playerId: string) {}
}
