import { Experience } from '../engine/Experience'
import { io } from 'socket.io-client'
import { TypedClient } from '../../../types/socket-types'
import { UIManager } from './UIManager'
import { ClientGameState } from './ClientGameState'
import * as THREE from 'three'
import { Boat } from './Boat'
import { Globe } from './Globe'
import { Engine } from '../engine/Engine'
import { Player } from '../../../types/player-types'
import { tryCatch } from './html/helpers'
import { PlayerBoat } from './PlayerBoat'

export class BattleShip implements Experience {
  resources = []
  socket!: TypedClient
  uiManager!: UIManager
  gameState!: ClientGameState

  otherPlayers: Record<string, THREE.Object3D> = {}

  currentPlayer!: PlayerBoat
  globe!: Globe

  ready: boolean = false

  constructor(private engine: Engine) {}

  async init() {
    this.socket = io(import.meta.env.VITE_SERVER_URL ?? 'ws://localhost:3000', {
      transports: ['websocket'],
    }) as TypedClient

    this.gameState = new ClientGameState(this.socket)
    this.uiManager = new UIManager(this.socket, this.gameState)

    this.gameState.on('updatePlayers', () => {
      if (this.gameState.scene === 'idle') {
        tryCatch(() => {
          this.updateGlobe()
        })
      }
    })

    this.initializeScene()
  }

  update() {
    if (!this.ready) return
    for (const player of Object.values(this.otherPlayers)) {
      player.lookAt(this.globe.position)
    }

    this.currentPlayer.update()
  }

  resize() {}

  private initializeScene() {
    this.currentPlayer = new PlayerBoat(
      this.socket,
      this.engine,
      this.gameState
    )
    this.globe = new Globe()

    let scale = this.gameState.globeScale
    this.globe.scale.setScalar(scale)

    this.engine.scene.add(this.globe)
    this.engine.scene.add(this.currentPlayer)

    this.currentPlayer.update()

    this.ready = true
  }

  private updateGlobe() {
    // update the globe's size based on how many players there are
    let scale = this.gameState.globeScale
    this.globe.scale.setScalar(scale)

    // update the boats to show the players
    // and their positions
    for (const player of Object.values(this.gameState.players)) {
      if (player.id === this.gameState.id) continue

      if (!this.otherPlayers[player.id]) {
        const boat = new Boat()
        boat.userData.id = player.id
        this.otherPlayers[player.id] = boat
        this.engine.scene.add(this.otherPlayers[player.id])
      }

      this.positionPlayer(player)
    }

    for (const boats of Object.keys(this.otherPlayers)) {
      if (!this.gameState.players[boats]) {
        this.engine.scene.remove(this.otherPlayers[boats])
        delete this.otherPlayers[boats]
      }
    }
  }

  private positionPlayer(player: Player) {
    let scale = this.gameState.globeScale
    const { x, y, z } = player.position
    this.otherPlayers[player.id]?.position.set(x * scale, y * scale, z * scale)
  }
}
