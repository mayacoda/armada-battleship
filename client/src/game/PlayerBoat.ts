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
    this.material.color.set('#bb4a0d')
    this.positionCamera()

    const clickListener = (event: THREE.Intersection[]) => {
      this.listenForClick(event)
    }

    this.userData.isPlayer = true

    this.socket.on('initPlayer', (player: Player) => {
      const { x, y, z } = player.position
      this.setPositionFromVector(new THREE.Vector3(x, y, z))
      this.updateName(player.name)
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
    super.update()
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
      } else if (
        hit.object.name === 'boat' &&
        hit.object instanceof Boat &&
        !hit.object.userData.isPlayer
      ) {
        hit.object.showChallengeButton()
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
