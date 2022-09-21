import * as THREE from 'three'

export class Water extends THREE.Mesh {
  name = 'water'

  constructor() {
    super()
    this.geometry = new THREE.PlaneGeometry(4, 4, 32)
    this.material = new THREE.MeshBasicMaterial({
      color: '#48c8de',
    })

    this.rotation.x = -Math.PI / 2
  }
}
