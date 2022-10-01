import * as THREE from 'three'
import { Engine } from '../engine/Engine'
import { Resource } from '../engine/Resources'

const frustum = new THREE.Frustum()

export class Boat extends THREE.Object3D {
  static resource: Resource = {
    name: 'rowboat',
    path: '/rowboat.glb',
    type: 'gltf',
  }

  nameElement: HTMLDivElement
  challengeButton: HTMLButtonElement

  constructor(protected engine: Engine) {
    super()
    const gltfScene = this.engine.resources.getItem(Boat.resource.name)
    let clone = gltfScene.scene.clone()
    this.add(...clone.children)

    this.userData.showChallengeButton = () => {
      this.showChallengeButton()
    }

    this.traverse((child: THREE.Object3D) => {
      child.name = 'boat'
      child.userData = this.userData

      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        if (
          child.material instanceof THREE.MeshStandardMaterial &&
          child.material.map
        ) {
          child.material.map.minFilter = THREE.LinearFilter
          child.material.map.magFilter = THREE.LinearFilter
        }
      }
    })

    this.nameElement = document.createElement('div')
    this.nameElement.classList.add('boat-name')
    this.engine.ui.container.appendChild(this.nameElement)

    this.nameElement.addEventListener('click', (event) => {
      if (!this.userData.isPlayer) {
        event.stopPropagation()
        event.preventDefault()
        this.showChallengeButton()
      }
    })

    this.challengeButton = document.createElement('button')
    this.challengeButton.classList.add('challenge-button')
    this.challengeButton.innerHTML = '<span class="emoji">💣</span>'
    this.challengeButton.style.display = 'none'
    this.engine.ui.container.appendChild(this.challengeButton)

    this.challengeButton.addEventListener('click', (event) => {
      event.stopPropagation()
      event.preventDefault()
      this.engine.socket.emit('challenge', this.userData.id)
      this.hideChallengeButton()
    })
  }

  get screenPosition() {
    const screenPosition = this.position.clone()
    screenPosition.project(this.engine.camera.instance)
    const x = screenPosition.x * this.engine.sizes.width * 0.5
    const y = -screenPosition.y * this.engine.sizes.height * 0.5

    return { x, y }
  }

  updateElementsPosition() {
    if (!this.isInView) {
      this.nameElement.style.display = 'none'
      this.challengeButton.style.display = 'none'
      return
    }

    this.nameElement.style.display = 'block'
    const { x, y } = this.screenPosition
    const xOffsetName = this.nameElement.clientWidth / 2
    const yOffsetName = 80

    this.nameElement.style.transform = `translateX(${
      x - xOffsetName
    }px) translateY(${y - yOffsetName}px)`

    const xOffsetButton = this.challengeButton.clientWidth / 2
    const yOffsetButton = 20
    this.challengeButton.style.transform = `translateX(${
      x - xOffsetButton
    }px) translateY(${y - yOffsetButton}px)`
  }

  // @ts-ignore
  update(delta: number) {
    this.updateElementsPosition()
  }

  updateName(name: string) {
    this.nameElement.innerText = name
  }

  showChallengeButton() {
    this.challengeButton.style.display = 'block'
    setTimeout(() => {
      this.hideChallengeButton()
    }, 10000)
  }

  private hideChallengeButton() {
    this.challengeButton.style.display = 'none'
  }

  private get isInView() {
    let camera = this.engine.camera.instance
    const matrix = new THREE.Matrix4().multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    )
    frustum.setFromProjectionMatrix(matrix)

    return frustum.containsPoint(this.position)
  }

  cleanUp() {
    this.engine.ui.container.removeChild(this.nameElement)
    this.engine.ui.container.removeChild(this.challengeButton)
  }
}
