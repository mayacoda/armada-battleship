import * as THREE from 'three'

export class Globe extends THREE.Mesh {
  name = 'globe'

  constructor() {
    super()
    this.geometry = new THREE.SphereGeometry(1, 32, 32)
    this.material = new THREE.MeshBasicMaterial({
      color: '#48c8de',
    })
  }
}
