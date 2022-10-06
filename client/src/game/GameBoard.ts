import * as THREE from 'three'
import { GridHelper, Intersection, Object3D } from 'three'
import { GRID_SIZE, SHIP_SIZE, SHIP_TYPE } from '../../../constants/constants'
import { Engine } from '../engine/Engine'
import { Ship } from '../../../types/socket-types'
import { tryCatch } from './html/helpers'
import { Resource } from '../engine/Resources'
import { WaterMaterial } from './WaterMaterial'
import { GameEntity } from '../engine/GameEntity'

export class GameBoard extends Object3D implements GameEntity {
  static resource: Resource = {
    name: 'ships',
    path: '/ships.glb',
    type: 'gltf',
  }

  name = 'gameBoard'
  playerGrid!: GridHelper
  enemyGrid!: GridHelper
  enemyGridBackdrop!: THREE.Mesh
  gridWidth = 3.5
  squareWidth = this.gridWidth / GRID_SIZE

  waterMaterial!: WaterMaterial

  constructor(private engine: Engine) {
    super()

    this.createWater()
    this.createGrids()

    this.engine.socket.on('initShips', (ships) => {
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

    this.engine.socket.on('yourTurn', () => {
      tryCatch(() => {
        this.enemyGridBackdrop.visible = true
      })
    })

    this.engine.socket.on('endTurn', () => {
      tryCatch(() => {
        this.enemyGridBackdrop.visible = false
      })
    })
  }

  update(delta: number): void {
    this.waterMaterial.update(delta)
  }

  private createWater() {
    const waterMaterial = new WaterMaterial(0.7)
    const water = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), waterMaterial)

    this.waterMaterial = waterMaterial
    water.name = 'water'
    water.receiveShadow = true
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

    this.enemyGridBackdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(this.gridWidth, this.gridWidth),
      new THREE.MeshBasicMaterial({
        color: '#b90000',
        transparent: true,
        opacity: 0.5,
      })
    )
    this.enemyGridBackdrop.position.copy(enemyGrid.position)
    this.enemyGridBackdrop.position.z = 0.005
    this.enemyGridBackdrop.visible = false

    this.add(this.enemyGridBackdrop)
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

    this.add(playerGrid)
  }

  private populateGrid(ships: Ship[]) {
    const shipModels = this.engine.resources
      .getItem(GameBoard.resource.name)
      .scene.children.reduce(
        (acc: Record<string, THREE.Mesh>, child: THREE.Mesh) => {
          child.castShadow = true
          acc[child.name] = child
          return acc
        },
        {}
      )
    console.log('shipModels', shipModels)

    ships.forEach((ship) => {
      let mesh: THREE.Mesh

      switch (ship.type) {
        case SHIP_TYPE.CARRIER:
          mesh = shipModels.carrier.clone()
          break
        case SHIP_TYPE.BATTLESHIP:
          mesh = shipModels.battleship.clone()
          break
        case SHIP_TYPE.CRUISER:
          mesh = shipModels.cruiser.clone()
          break
        case SHIP_TYPE.SUBMARINE:
          mesh = shipModels.submarine.clone()
      }

      if (!mesh) debugger

      mesh.name = 'ship'
      mesh.scale.setScalar(this.squareWidth)

      mesh.rotation.x = Math.PI / 2

      mesh.position.copy(this.playerGrid.position)
      mesh.position.x -= this.gridWidth / 2
      mesh.position.y -= this.gridWidth / 2

      mesh.position.x += ship.start.x * this.squareWidth
      mesh.position.y += ship.start.y * this.squareWidth

      if (ship.direction === 'horizontal') {
        // move the ship's center to the left
        mesh.position.x += (SHIP_SIZE[ship.type] * this.squareWidth) / 2
        mesh.rotation.y = -Math.PI / 2
        // move mesh up by half a square
        mesh.position.y += this.squareWidth / 2
      } else if (ship.direction === 'vertical') {
        // move the ship's center up
        mesh.position.y += (SHIP_SIZE[ship.type] * this.squareWidth) / 2
        // move mesh right by half a square
        mesh.position.x += this.squareWidth / 2
      }

      this.add(mesh!)
    })
  }

  cleanUp() {
    const toRemove: THREE.Object3D[] = []
    this.traverse((child) => {
      if (child.name === 'ship' || child.name === 'marker') {
        toRemove.push(child)
      }
    })

    this.enemyGridBackdrop.visible = false

    this.remove(...toRemove)
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
      const geometry = new THREE.SphereGeometry(0.2)
      const material = new THREE.MeshStandardMaterial({
        color: '#b01717',
        metalness: 0.7,
        roughness: 0.1,
      })
      const sphere = new THREE.Mesh(geometry, material)
      sphere.position.copy(this.coordinateToPoint(x, y, grid))
      sphere.position.z = 0.3
      sphere.name = 'marker'
      this.add(sphere)
    } else {
      const geometry = new THREE.SphereGeometry(0.2)
      const material = new THREE.MeshStandardMaterial({
        color: '#807d7d',
        metalness: 0.7,
        roughness: 0.1,
      })
      const box = new THREE.Mesh(geometry, material)
      box.position.copy(this.coordinateToPoint(x, y, grid))
      box.name = 'marker'
      this.add(box)
    }
  }
}
