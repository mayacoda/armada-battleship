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
        isPlaying: false,
      })
    })
    socket.on('challenge', (playerId) => {
      this.challengePlayer(socket.id, playerId)
    })
    socket.on('accept', (playerId) => {
      this.startGame(playerId, socket.id)
    })
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
    const player1 = this.players[attacker]
    const player2 = this.players[defender]
    player1.isPlaying = true
    player2.isPlaying = true
    this.io.emit('updatePlayers', this.players)

    const game = new BattleshipGameInstance(player1, player2, this.io)
    this.games[game.gameId] = game
    game.on('gameOver', () => {
      player1.isPlaying = false
      player2.isPlaying = false
      this.io.emit('updatePlayers', this.players)
      delete this.games[game.gameId]
    })
  }
}
