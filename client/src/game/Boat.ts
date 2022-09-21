import * as THREE from 'three'
import { Engine } from '../engine/Engine'

let torusGeometry = new THREE.TorusGeometry(0.3, 0.1, 16, 100)

export class Boat extends THREE.Mesh {
  name = 'boat'
  material: THREE.MeshBasicMaterial

  nameElement: HTMLDivElement

  constructor(protected engine: Engine, color = '#4f322b') {
    super()
    this.geometry = torusGeometry
    this.material = new THREE.MeshBasicMaterial({
      color,
    })

    this.nameElement = document.createElement('div')
    this.nameElement.classList.add('boat-name')
    this.engine.ui.container.appendChild(this.nameElement)
  }

  setNamePosition() {
    const screenPosition = this.position.clone()
    screenPosition.project(this.engine.camera.instance)
    const xOffset = this.nameElement.clientWidth / 2
    const yOffset = 80

    const translateX =
      screenPosition.x * this.engine.sizes.width * 0.5 - xOffset
    const translateY =
      -screenPosition.y * this.engine.sizes.height * 0.5 - yOffset

    this.nameElement.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`
  }

  update() {
    this.setNamePosition()
  }

  updateName(name: string) {
    this.nameElement.innerText = name
  }
}
