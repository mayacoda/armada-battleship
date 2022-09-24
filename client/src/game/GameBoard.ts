import * as THREE from 'three'
import { GridHelper, Object3D } from 'three'
import { GRID_SIZE, SHIP_TYPE } from '../../../constants/constants'
import { Engine } from '../engine/Engine'
import { Ship } from '../../../types/socket-types'

export class GameBoard extends Object3D {
  name = 'gameBoard'
  playerGrid!: GridHelper
  enemyGrid!: GridHelper
  gridWidth = 3.5
  squareWidth = this.gridWidth / GRID_SIZE

  helperCube: THREE.Mesh

  constructor(private engine: Engine) {
    super()

    this.createGrids()

    this.engine.socket.on('initShips', (ships) => {
      console.log(ships)
      this.populateGrid(ships)
    })

    // this.populateGrid(ships)

    this.helperCube = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.2, 0.2),
      new THREE.MeshBasicMaterial({ color: '#18ffc0' })
    )
    this.add(this.helperCube)

    this.engine.raycaster.on('click', (event: THREE.Intersection[]) => {
      let firstHit = event[0]
      if (firstHit) {
        console.log({
          x: firstHit.point.x,
          y: firstHit.point.y,
        })
      }
    })
  }

  private createGrids() {
    const enemyGrid = new THREE.GridHelper(
      this.gridWidth,
      GRID_SIZE,
      '#000',
      '#000'
    )
    enemyGrid.position.set(0, this.gridWidth / 2, 0)
    enemyGrid.rotation.x = Math.PI / 2
    this.enemyGrid = enemyGrid

    this.add(enemyGrid)

    const playerGrid = new THREE.GridHelper(
      this.gridWidth,
      GRID_SIZE,
      '#000',
      '#000'
    )
    playerGrid.position.set(0, -this.gridWidth / 2 - 0.5, 0)
    playerGrid.rotation.x = Math.PI / 2

    this.playerGrid = playerGrid
    console.log(this.playerGrid.position)

    this.add(playerGrid)
  }

  private populateGrid(ships: Ship[]) {
    ships.forEach((ship) => {
      // add the ship to the grid
      const radius = 0.2
      const geometry = new THREE.CylinderGeometry(
        radius,
        radius,
        ship.type * this.squareWidth
      )
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.name = 'ship'

      switch (ship.type) {
        case SHIP_TYPE.CARRIER:
          material.color = new THREE.Color('#c73c3c')
          break
        case SHIP_TYPE.BATTLESHIP:
          material.color = new THREE.Color('#f3bf12')
          break
        case SHIP_TYPE.CRUISER:
          material.color = new THREE.Color('#88d341')
          break
        case SHIP_TYPE.SUBMARINE:
          material.color = new THREE.Color('#13a1b4')
      }

      mesh.position.copy(this.playerGrid.position)
      mesh.position.x -= this.gridWidth / 2
      mesh.position.y -= this.gridWidth / 2

      mesh.position.x += ship.start.x * this.squareWidth
      mesh.position.y += ship.start.y * this.squareWidth

      if (ship.direction === 'horizontal') {
        // move the ship's center to the left
        mesh.position.x += (ship.type * this.squareWidth) / 2
        mesh.rotation.z = Math.PI / 2
        // move mesh up by half a square
        mesh.position.y += this.squareWidth / 2
      } else if (ship.direction === 'vertical') {
        // move the ship's center up
        mesh.position.y += (ship.type * this.squareWidth) / 2
        // move mesh right by half a square
        mesh.position.x += this.squareWidth / 2
      }

      this.add(mesh!)
    })
  }

  cleanUp() {
    const ships: THREE.Object3D[] = []
    this.traverse((child) => {
      if (child.name === 'ship') {
        ships.push(child)
      }
    })

    this.remove(...ships)
  }
}
