import * as THREE from 'three'
import { GridHelper, Intersection, Object3D } from 'three'
import { GRID_SIZE, SHIP_TYPE } from '../../../constants/constants'
import { Engine } from '../engine/Engine'
import { Ship } from '../../../types/socket-types'

export class GameBoard extends Object3D {
  name = 'gameBoard'
  playerGrid!: GridHelper
  enemyGrid!: GridHelper
  gridWidth = 3.5
  squareWidth = this.gridWidth / GRID_SIZE

  constructor(private engine: Engine) {
    super()

    this.createWater()
    this.createGrids()
    console.log('created game scene mesh')

    this.engine.socket.on('initShips', (ships) => {
      console.log(ships)
      this.populateGrid(ships)
    })

    this.engine.raycaster.on('click', (event: THREE.Intersection[]) => {
      if (event.length > 0) {
        const waterHit = event.find((intersection) => {
          return intersection.object.name === 'water'
        })
        const onEnemyGrid = this.isPointOnEnemyGrid(waterHit)
        if (waterHit && onEnemyGrid) {
          let { x, y } = this.pointToCoordinate(waterHit.point)
          this.engine.socket.emit('fire', x, y)
        }
      }
    })

    this.engine.socket.on('result', ({ x, y, hit, firedBy }) => {
      if (firedBy === this.engine.socket.id) {
        this.markResult(this.enemyGrid, x, y, hit)
      } else {
        this.markResult(this.playerGrid, x, y, hit)
      }
    })
  }

  private createWater() {
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshBasicMaterial({
        color: '#48c8de',
      })
    )
    water.name = 'water'
    this.add(water)
  }

  private createGrids() {
    const enemyGrid = new THREE.GridHelper(
      this.gridWidth,
      GRID_SIZE,
      '#000',
      '#000'
    )
    enemyGrid.position.set(0, this.gridWidth / 2, 0.01)
    enemyGrid.rotation.x = Math.PI / 2
    this.enemyGrid = enemyGrid

    this.add(enemyGrid)

    const playerGrid = new THREE.GridHelper(
      this.gridWidth,
      GRID_SIZE,
      '#000',
      '#000'
    )
    playerGrid.position.set(0, -this.gridWidth / 2 - 0.5, 0.01)

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

  private isPointOnEnemyGrid(waterHit: Intersection | undefined) {
    if (!waterHit) return false
    const point = waterHit.point.clone().sub(this.enemyGrid.position)
    return (
      point.x > -this.gridWidth / 2 &&
      point.x < this.gridWidth / 2 &&
      point.y > -this.gridWidth / 2 &&
      point.y < this.gridWidth / 2
    )
  }

  private pointToCoordinate(point: THREE.Vector3) {
    point = point.clone().addScalar(this.squareWidth / 2)

    point.x = Math.round(point.x / this.squareWidth - 1) * this.squareWidth
    point.y = Math.round(point.y / this.squareWidth - 1) * this.squareWidth

    const x = Math.round((point.x + this.gridWidth / 2) / this.squareWidth)
    const y = Math.round(point.y / this.squareWidth)
    return { x, y }
  }

  private coordinateToPoint(x: number, y: number, grid: GridHelper) {
    const point = new THREE.Vector3()
    point.x = x * this.squareWidth - this.gridWidth / 2 + this.squareWidth * 0.5
    point.y = y * this.squareWidth - this.gridWidth / 2 + this.squareWidth * 0.5
    point.add(grid.position)
    return point
  }

  private markResult(grid: GridHelper, x: number, y: number, hit: boolean) {
    if (hit) {
      const geometry = new THREE.SphereGeometry(0.1)
      const material = new THREE.MeshBasicMaterial({ color: '#b01717' })
      const sphere = new THREE.Mesh(geometry, material)
      sphere.position.copy(this.coordinateToPoint(x, y, grid))
      sphere.position.z = 0.3
      this.add(sphere)
    } else {
      const geometry = new THREE.SphereGeometry(0.1)
      const material = new THREE.MeshBasicMaterial({ color: '#807d7d' })
      const box = new THREE.Mesh(geometry, material)
      box.position.copy(this.coordinateToPoint(x, y, grid))
      this.add(box)
    }
  }
}
