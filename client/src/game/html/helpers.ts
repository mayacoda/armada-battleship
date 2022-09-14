import { GRID_SIZE } from '../../../../constants/constants'

export function createTable() {
  const table = document.createElement('table')
  table.style.border = '1px solid black'
  table.style.margin = '15px'
  table.style.borderCollapse = 'collapse'
  for (let i = 0; i < GRID_SIZE; i++) {
    const tr = document.createElement('tr')
    for (let j = 0; j < GRID_SIZE; j++) {
      const td = document.createElement('td')
      td.style.border = '1px solid black'
      td.style.width = '48px'
      td.style.height = '48px'
      td.style.textAlign = 'center'
      td.style.verticalAlign = 'middle'
      tr.appendChild(td)
    }
    table.appendChild(tr)
  }
  return table
}

export function markResult(
  table: HTMLTableElement,
  x: number,
  y: number,
  hit: boolean
) {
  const cell = table.rows[x].cells[y]
  if (hit) {
    cell.style.backgroundColor = '#f00'
  } else {
    cell.style.backgroundColor = '#bbb'
  }
}
