import { Engine } from './Engine'
import * as THREE from 'three'
import { GameEntity } from './GameEntity'

export class Camera implements GameEntity {
  public instance!: THREE.PerspectiveCamera

  constructor(private engine: Engine) {
    this.initCamera()
  }

  private initCamera() {
    this.instance = new THREE.PerspectiveCamera(
      50,
      this.engine.sizes.width / this.engine.sizes.height,
      0.1,
      100
    )
  }

  resize() {
    this.instance.aspect = this.engine.sizes.aspectRatio
    this.instance.updateProjectionMatrix()
  }

  update() {}
}
