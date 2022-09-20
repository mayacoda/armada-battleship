import * as THREE from 'three'

let torusGeometry = new THREE.TorusGeometry(0.3, 0.1, 16, 100)

export class Boat extends THREE.Mesh {
  name = 'boat'
  material: THREE.MeshBasicMaterial

  constructor(color = '#4f322b') {
    super()
    this.geometry = torusGeometry
    this.material = new THREE.MeshBasicMaterial({
      color,
    })
  }
}
