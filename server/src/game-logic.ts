import { GRID_SIZE } from '../../constants/constants.js'

export function placeShip(grid: number[][], size: number) {
  const x = Math.floor(Math.random() * (GRID_SIZE - 1))
  const y = Math.floor(Math.random() * (GRID_SIZE - 1))
  const direction = Math.floor(Math.random() * 2)
  let valid = true
  for (let i = 0; i < size; i++) {
    if (direction === 0) {
      if (x + i >= GRID_SIZE || grid[x + i][y] !== 0) {
        valid = false
      }
    } else {
      if (y + i >= GRID_SIZE || grid[x][y + i] !== 0) {
        valid = false
      }
    }
  }
  if (valid) {
    for (let i = 0; i < size; i++) {
      if (direction === 0) {
        grid[x + i][y] = size
      } else {
        grid[x][y + i] = size
      }
    }
  } else {
    placeShip(grid, size)
  }
}
