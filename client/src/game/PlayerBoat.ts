import { Boat } from './Boat'
import * as THREE from 'three'
import { ClientGameState } from './ClientGameState'
import { Engine } from '../engine/Engine'
import { TypedClient } from '../../../types/socket-types'
import { tryCatch } from './html/helpers'
import { Player } from '../../../types/player-types'

export class PlayerBoat extends Boat {
  targetPosition: THREE.Vector3 | null = null
  lookAtPoint: THREE.Quaternion | null = null

  constructor(
    private socket: TypedClient,
    engine: Engine,
    private gameState: ClientGameState
  ) {
    super(engine)
    this.positionCamera()

    this.userData.isPlayer = true

    this.socket.on('initPlayer', (player: Player) => {
      const { x, y, z } = player.position
      this.setPositionFromVector(new THREE.Vector3(x, y, z))
      this.updateName(player.name)
    })

    let unregisterClickListener: (() => void) | null = null

    this.gameState.on('sceneChanged', () => {
      tryCatch(() => {
        if (this.gameState.scene === 'idle') {
          if (!unregisterClickListener) {
            unregisterClickListener = this.engine.raycaster.on(
              'click',
              (event: THREE.Intersection[]) => {
                this.listenForClick(event)
              }
            )
          }
        } else if (unregisterClickListener) {
          unregisterClickListener()
          unregisterClickListener = null
        }
      })
    })

    this.gameState.on(
      'reposition',
      ({ x, y, z }: { x: number; y: number; z: number }) => {
        tryCatch(() => {
          this.setPositionFromVector(new THREE.Vector3(x, y, z))
        })
      }
    )
  }

  update(delta: number) {
    this.updatePlayerPosition(delta)
    super.update(delta)
  }

  private positionCamera() {
    this.engine.camera.instance.position.set(0, 4, -5)
    this.add(this.engine.camera.instance)

    this.engine.camera.instance.lookAt(this.position)
  }

  private listenForClick(event: THREE.Intersection[]) {
    if (event.length > 0) {
      let hit = event[0]
      if (hit.object.name === 'water') {
        this.lookAtPoint = this.smoothLookAt(hit.point)
        this.targetPosition = hit.point
      } else if (hit.object.name === 'boat' && !hit.object.userData.isPlayer) {
        hit.object.userData.showChallengeButton()
      }
    }
  }

  private setPositionFromVector(vec3: THREE.Vector3) {
    let scale = this.gameState?.waterScale ?? 1
    vec3.multiplyScalar(scale)

    this.position.copy(vec3)
    this.lookAt(new THREE.Vector3(0, 0, 0))
  }

  private updatePlayerPosition(delta: number) {
    if (this.targetPosition) {
      const direction = this.targetPosition.clone().sub(this.position)
      const distance = direction.length()
      const speed = 1.2 * delta
      const move = Math.min(distance, speed)
      this.position.add(direction.normalize().multiplyScalar(move))

      if (distance < 0.1) {
        this.targetPosition = null
        this.lookAtPoint = null
      }

      let newPosition = this.position
        .clone()
        .divideScalar(this.gameState.waterScale)
      this.socket.emit('move', newPosition)
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

  cleanUp() {
    this.remove(this.engine.camera.instance)
    super.cleanUp()
  }

  reboot() {
    this.positionCamera()
    this.engine.ui.container.appendChild(this.nameElement)
    this.engine.ui.container.appendChild(this.challengeButton)
  }
}
