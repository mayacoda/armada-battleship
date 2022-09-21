import { Boat } from './Boat'
import * as THREE from 'three'
import { ClientGameState } from './ClientGameState'
import { Engine } from '../engine/Engine'
import { TypedClient } from '../../../types/socket-types'
import { tryCatch } from './html/helpers'
import { Vec3 } from '../../../types/player-types'

export class PlayerBoat extends Boat {
  targetPosition: THREE.Vector3 | null = null
  lookAtPoint: THREE.Quaternion | null = null

  constructor(
    private socket: TypedClient,
    private engine: Engine,
    private gameState: ClientGameState
  ) {
    super()
    this.material.color.set('#bb4a0d')

    this.engine.camera.instance.position.set(0, 4, -5)
    this.add(this.engine.camera.instance)

    this.engine.camera.instance.lookAt(this.position)

    const clickListener = (event: THREE.Intersection[]) => {
      this.listenForClick(event)
    }

    this.socket.on('setPosition', ({ x, y, z }: Vec3) => {
      console.log('set position', x, y, z)
      this.setPositionFromVector(new THREE.Vector3(x, y, z))
      console.log(this.quaternion)
    })

    this.gameState.on('sceneChanged', () => {
      tryCatch(() => {
        if (this.gameState.scene === 'idle') {
          this.engine.raycaster.on('click', clickListener)
        } else {
          this.engine.raycaster.off('click', clickListener)
        }
      })
    })
  }

  update() {
    this.updatePlayerPosition()
  }

  private listenForClick(event: THREE.Intersection[]) {
    if (event.length > 0) {
      let hit = event[0]
      if (hit.object.name === 'water') {
        console.log('hit the water')
        this.lookAtPoint = this.smoothLookAt(hit.point)
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
    vec3.multiplyScalar(this.gameState?.waterScale ?? 1)

    this.position.set(vec3.x, vec3.y, vec3.z)
    this.lookAt(new THREE.Vector3(0, 0, 0))
  }

  private updatePlayerPosition() {
    if (this.targetPosition) {
      const direction = this.targetPosition.clone().sub(this.position)
      const distance = direction.length()
      const speed = 0.02
      const move = Math.min(distance, speed)
      this.position.add(direction.normalize().multiplyScalar(move))

      if (distance < 0.1) {
        this.targetPosition = null
        this.lookAtPoint = null
      }

      this.socket.emit('move', this.position.clone().normalize())
    }

    if (this.lookAtPoint) {
      this.quaternion.slerp(this.lookAtPoint, 0.02)
      this.socket.emit('rotation', this.quaternion)
    }
  }

  private smoothLookAt(target: THREE.Vector3) {
    const mock = new THREE.Object3D()

    this.parent!.add(mock)
    mock.position.copy(this.position)
    mock.lookAt(target)

    const targetQuaternion = mock.quaternion.clone()

    mock.parent!.remove(mock)

    return targetQuaternion
  }
}
