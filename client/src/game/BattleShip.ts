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

export class BattleShip implements Experience {
  resources = []
  socket!: TypedClient
  uiManager!: UIManager
  gameState!: ClientGameState

  otherPlayers: Record<string, THREE.Object3D> = {}

  boat: Boat = new Boat('#bb4a0d')
  globe: Globe = new Globe()

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
    for (const player of Object.values(this.otherPlayers)) {
      player.lookAt(this.globe.position)
    }

    this.updatePlayerPosition()
    this.updateCameraPosition()
  }

  resize() {}

  private initializeScene() {
    let scale = this.gameState.globeScale
    this.globe.scale.setScalar(scale)
    this.engine.scene.add(this.globe)
    this.engine.scene.add(this.boat)

    this.updatePlayerPosition()
    this.updateCameraPosition()
  }

  // move to player class
  private updateCameraPosition() {
    const lookAtOffset = new THREE.Vector3(0, 1.15, 0)
    const objectPosition = new THREE.Vector3()
    this.boat.getWorldPosition(objectPosition)

    const globePosition = new THREE.Vector3()
    this.globe.getWorldPosition(globePosition)
    const boatPosition = new THREE.Vector3()
    this.boat.getWorldPosition(boatPosition)

    const direction = boatPosition.clone().sub(globePosition).normalize()

    const cameraPosition = objectPosition
      .clone()
      .add(direction.multiplyScalar(6))
    const cameraLookAt = objectPosition.clone().add(lookAtOffset)

    this.engine.camera.instance.position.copy(cameraPosition)
    this.engine.camera.instance.lookAt(
      cameraLookAt.x,
      cameraLookAt.y,
      cameraLookAt.z
    )
  }

  // move to player class
  private updatePlayerPosition() {
    let position = new THREE.Vector3(1, 1, 0)

    if (this.gameState?.currentPlayer) {
      const { x, y, z } = this.gameState.currentPlayer.position
      position = new THREE.Vector3(x, y, z)
    }

    position.normalize().multiplyScalar(this.gameState?.globeScale ?? 1)

    this.boat.position.set(position.x, position.y, position.z)
    this.boat.lookAt(this.globe.position)
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
        this.otherPlayers[player.id] = new Boat()
        this.otherPlayers[player.id].name = player.id
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
