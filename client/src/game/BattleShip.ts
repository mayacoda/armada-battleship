import { Experience } from '../engine/Experience'
import { io } from 'socket.io-client'
import { TypedClient } from '../../../types/socket-types'
import { UIManager } from './UIManager'
import { ClientGameState } from './ClientGameState'
import * as THREE from 'three'
import { Boat } from './Boat'
import { Engine } from '../engine/Engine'
import { Player } from '../../../types/player-types'
import { tryCatch } from './html/helpers'
import { PlayerBoat } from './PlayerBoat'
import { Water } from './Water'

export class BattleShip implements Experience {
  resources = []
  socket!: TypedClient
  uiManager!: UIManager
  gameState!: ClientGameState

  otherPlayers: Record<string, Boat> = {}

  currentPlayer!: PlayerBoat
  water!: Water

  ready: boolean = false

  constructor(private engine: Engine) {}

  async init() {
    this.socket = io(import.meta.env.VITE_SERVER_URL ?? 'ws://localhost:3000', {
      transports: ['websocket'],
    }) as TypedClient

    this.engine.setSocket(this.socket)

    this.gameState = new ClientGameState(this.socket)
    this.uiManager = new UIManager(this.engine, this.gameState)

    this.gameState.on('updatePlayers', () => {
      if (this.gameState.scene === 'idle') {
        tryCatch(() => {
          this.updateWater()
        })
      }
    })

    this.gameState.on('sceneChanged', () => {
      if (this.gameState.scene === 'idle') {
        tryCatch(() => {
          this.endGame()
        })
      } else if (this.gameState.scene === 'playing') {
        tryCatch(() => {
          this.startGame()
        })
      }
    })

    this.startLoginScene()
  }

  update() {
    if (!this.ready) return

    if (this.gameState.scene === 'idle') {
      Object.values(this.otherPlayers).forEach((boat) => boat.update())
      this.currentPlayer.update()
    }
  }

  resize() {}

  private startGame() {
    this.cleanUpIdleScene()
    this.startPlayingScene()
  }

  private endGame() {
    this.cleanUpPlayingScene()
    this.startIdleScene()
    this.updateWater()
  }

  private startLoginScene() {
    this.currentPlayer = new PlayerBoat(
      this.socket,
      this.engine,
      this.gameState
    )
    this.water = new Water()

    let scale = this.gameState.waterScale
    this.water.scale.setScalar(scale)

    this.engine.scene.add(this.water)
    this.engine.scene.add(this.currentPlayer)

    this.currentPlayer.update()

    this.ready = true
  }

  private startIdleScene() {
    this.currentPlayer.reboot()
    this.engine.scene.add(this.currentPlayer)
    this.engine.scene.add(this.water)
  }

  private cleanUpIdleScene() {
    Object.values(this.otherPlayers).forEach((boat) => {
      this.engine.scene.remove(boat)
      boat.cleanup()
    })

    this.engine.scene.remove(this.currentPlayer)
    this.currentPlayer.cleanup()

    this.engine.scene.remove(this.water)

    this.otherPlayers = {}
  }

  private cleanUpPlayingScene() {}

  private startPlayingScene() {}

  private updateWater() {
    // update the globe's size based on how many players there are
    let scale = this.gameState.waterScale
    this.water.scale.setScalar(scale)

    // update the boats to show the players
    // and their positions
    for (const player of Object.values(this.gameState.players)) {
      if (player.id === this.gameState.id) continue

      if (!this.otherPlayers[player.id]) {
        const boat = new Boat(this.engine)
        boat.userData.id = player.id
        boat.updateName(player.name)
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
    let scale = this.gameState.waterScale
    const { x, z } = player.position

    let otherPlayer = this.otherPlayers[player.id]
    otherPlayer?.position.set(x * scale, 0, z * scale)
    if (player.rotation) {
      otherPlayer?.rotation.setFromQuaternion(
        player.rotation as THREE.Quaternion
      )
    }
  }
}
