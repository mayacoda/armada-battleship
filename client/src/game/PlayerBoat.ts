import { Boat } from './Boat'
import * as THREE from 'three'
import { ClientGameState } from './ClientGameState'
import { Engine } from '../engine/Engine'
import { TypedClient } from '../../../types/socket-types'

export class PlayerBoat extends Boat {
  targetPosition: THREE.Vector3 | null = null

  constructor(
    private socket: TypedClient,
    private engine: Engine,
    private gameState: ClientGameState
  ) {
    super()
    this.material.color.set('#bb4a0d')

    this.setPositionFromVector(new THREE.Vector3(1, 1, 0))

    const clickListener = (event: THREE.Intersection[]) => {
      this.listenForClick(event)
    }
    this.engine.raycaster.on('click', clickListener)

    this.gameState.on('sceneChanged', () => {
      if (this.gameState.scene === 'idle') {
        const { x, y, z } = this.gameState.currentPlayer.position
        const vec3 = new THREE.Vector3(x, y, z)
        this.setPositionFromVector(vec3)

        this.engine.raycaster.on('click', clickListener)
      } else {
        this.engine.raycaster.off('click', clickListener)
      }
    })
  }

  update() {
    this.updatePlayerPosition()
    this.updateCameraPosition()
  }

  private listenForClick(event: THREE.Intersection[]) {
    if (event.length > 0) {
      let hit = event[0]
      if (hit.object.name === 'globe') {
        console.log('hit the globe')
        this.targetPosition = hit.point
      } else if (
        hit.object.name === 'boat' &&
        hit.object.userData.id !== this.gameState.currentPlayer?.id
      ) {
        console.log('hit another boat!')
        // show the boat's menu
      }
    }
  }

  private setPositionFromVector(vec3: THREE.Vector3) {
    vec3
      .clone()
      .normalize()
      .multiplyScalar(this.gameState?.globeScale ?? 1)

    this.position.set(vec3.x, vec3.y, vec3.z)
    this.lookAt(new THREE.Vector3(0, 0, 0))
  }

  private updatePlayerPosition() {
    if (this.targetPosition) {
      const direction = this.targetPosition.clone().sub(this.position)
      const distance = direction.length()
      const speed = 0.1
      const move = Math.min(distance, speed)
      this.position.add(direction.normalize().multiplyScalar(move))
      if (distance < 0.1) {
        this.targetPosition = null
      }

      this.socket.emit('move', this.position.normalize())
    }

    this.position.normalize().multiplyScalar(this.gameState?.globeScale ?? 1)

    this.lookAt(new THREE.Vector3(0, 0, 0))
  }

  private updateCameraPosition() {
    const lookAtOffset = new THREE.Vector3(0, 1.15, 0)
    const objectPosition = new THREE.Vector3()
    this.getWorldPosition(objectPosition)

    const boatPosition = new THREE.Vector3()
    this.getWorldPosition(boatPosition)

    const direction = boatPosition.clone().normalize()

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
}
