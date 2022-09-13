import { Player } from './player-types'
import { Server, Socket } from 'socket.io'
import { Socket as ClientSocket } from 'socket.io-client'

export type ServerToClientEvents = {
  updatePlayers: (players: Record<string, Player>) => void
  challenge: (attacker: string) => void
  startGame: (opponent: string) => void
  initGrid: (grid: number[][]) => void
}

export type ClientToServerEvents = {
  login: (name: string) => void
  challenge: (playerId: string) => void
  accept: (playerId: string) => void
  forfeit: () => void
}

export type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>

export type TypedClient = ClientSocket<
  ServerToClientEvents,
  ClientToServerEvents
>

export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>
