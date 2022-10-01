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
import { GameBoard } from './GameBoard'
import { Resource } from '../engine/Resources'

export class BattleShip implements Experience {
  resources: Resource[] = [Boat.resource, GameBoard.resource]
  socket!: TypedClient
  uiManager!: UIManager
  gameState!: ClientGameState

  otherPlayers: Record<string, Boat> = {}

  currentPlayer!: PlayerBoat
  water!: Water

  gameBoard!: GameBoard

  ready: boolean = false

  constructor(private engine: Engine) {}

  async init() {
    this.socket = io(import.meta.env.VITE_SERVER_URL ?? 'ws://localhost:3000', {
      transports: ['websocket'],
    }) as TypedClient

    this.socket.on('disconnect', (reason, description) => {
      console.error('disconnected', reason, description)
    })

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

    this.initializeLights()

    this.startLoginScene()
  }

  update(delta: number) {
    if (!this.ready) return

    if (this.gameState.scene === 'idle') {
      Object.values(this.otherPlayers).forEach((boat) => boat.update(delta))
      this.currentPlayer.update(delta)
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

    const background = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({
        color: '#2f8c9b',
      })
    )
    background.rotation.x = -Math.PI / 2
    background.position.y = -0.01
    background.name = 'background'
    this.engine.scene.add(background)

    this.gameBoard = new GameBoard(this.engine)

    let scale = this.gameState.waterScale
    this.water.scale.setScalar(scale)

    this.engine.scene.add(this.water)
    this.engine.scene.add(this.currentPlayer)

    this.currentPlayer.update(0)

    this.ready = true
  }

  private startIdleScene() {
    this.currentPlayer.reboot()
    this.engine.scene.add(this.currentPlayer)
    this.engine.scene.add(this.water)

    this.engine.scene.traverse((obj) => {
      if (obj.name === 'background') obj.visible = true
    })
  }

  private cleanUpIdleScene() {
    Object.values(this.otherPlayers).forEach((boat) => {
      this.engine.scene.remove(boat)
      boat.cleanUp()
    })

    this.engine.scene.traverse((obj) => {
      if (obj.name === 'background') obj.visible = false
    })

    this.engine.scene.remove(this.currentPlayer)
    this.currentPlayer.cleanUp()

    this.engine.scene.remove(this.water)

    this.otherPlayers = {}
  }

  private startPlayingScene() {
    this.engine.scene.add(this.engine.camera.instance)
    this.engine.camera.instance.position.set(0, 0, 10)
    this.engine.camera.instance.lookAt(0, 0, 0)

    this.engine.scene.add(this.gameBoard)
  }

  private cleanUpPlayingScene() {
    this.gameBoard.cleanUp()
    this.engine.scene.remove(this.engine.camera.instance)
    this.engine.scene.remove(this.gameBoard)
  }

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

    for (const boat of Object.keys(this.otherPlayers)) {
      if (!this.gameState.players[boat]) {
        this.otherPlayers[boat].cleanUp()
        this.engine.scene.remove(this.otherPlayers[boat])
        delete this.otherPlayers[boat]
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

  private initializeLights() {
    const hemisphereLight = new THREE.HemisphereLight(
      '#ffddc7',
      '#b2e8f5',
      1.99
    )
    this.engine.debug.gui.add(hemisphereLight, 'intensity', 0, 5, 0.01)
    // add hemisphere skyColor and groundColor to debug gui
    this.engine.debug.gui.addColor(hemisphereLight, 'color').name('skyColor')
    this.engine.debug.gui.addColor(hemisphereLight, 'groundColor')

    this.engine.scene.add(hemisphereLight)

    const directionalLight = new THREE.DirectionalLight('#fff8cc', 2.91)
    directionalLight.shadow.camera.far = 50
    directionalLight.position.set(0, 7.2, 8)
    directionalLight.castShadow = true

    const cameraSize = 10
    directionalLight.shadow.camera.right = cameraSize
    directionalLight.shadow.camera.left = -cameraSize
    directionalLight.shadow.camera.top = cameraSize
    directionalLight.shadow.camera.bottom = -cameraSize

    directionalLight.shadow.mapSize.x = 2048
    directionalLight.shadow.mapSize.y = 2048

    // add directional light to debug
    this.engine.debug.gui.add(directionalLight, 'intensity', 0, 5, 0.01)
    this.engine.debug.gui.addColor(directionalLight, 'color').name('lightColor')
    this.engine.debug.gui.add(directionalLight.position, 'x', -10, 10, 0.01)
    this.engine.debug.gui.add(directionalLight.position, 'y', -10, 10, 0.01)
    this.engine.debug.gui.add(directionalLight.position, 'z', -10, 10, 0.01)

    this.engine.scene.add(directionalLight)
  }
}
