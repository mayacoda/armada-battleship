import { Player } from '../../../types/player-types'
import { TypedClient } from '../../../types/socket-types'
import { GRID_SIZE } from '../../../constants/constants'

function createTable() {
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

export class UIManager {
  uiLayer: HTMLDivElement
  socket: TypedClient
  players: Record<string, Player> = {}
  isGameActive: boolean = false

  constructor(socket: TypedClient) {
    this.socket = socket
    this.uiLayer = document.querySelector('#ui') as HTMLDivElement
    this.init()
  }

  async init() {
    const userName = await this.showLogin()
    this.socket.emit('login', userName)

    this.socket.on('updatePlayers', (players) => {
      this.updatePlayerList(players, this.socket.id)
    })

    this.socket.on('challenge', (attackerId: string) => {
      this.showChallenge(attackerId)
    })

    this.socket.on('startGame', (opponentId: string) => {
      console.log('starting the game?')
      this.startGame(opponentId)
    })

    this.socket.on('initGrid', (grid: number[][]) => {
      this.initGrid(grid)
    })
  }

  // Login
  async showLogin(): Promise<string> {
    const loginForm = document.createElement('form')
    loginForm.id = 'login-form'
    loginForm.innerHTML = `
      <input type="text" name="username" placeholder="Username" />
      <input type="submit" value="Login" />
    `
    // add padding and style to log in form
    loginForm.style.padding = '1rem'
    this.uiLayer.appendChild(loginForm)

    return new Promise((resolve) => {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault()
        const username = loginForm.querySelector(
          'input[name="username"]'
        ) as HTMLInputElement
        resolve(username.value)
        loginForm.remove()
      })
    })
  }

  // Players List
  updatePlayerList(players: Record<string, Player>, currentPlayerId: string) {
    this.players = players

    if (this.isGameActive) return
    const playersListElement = this.getPlayerListElement()

    playersListElement.innerHTML = ''
    Object.values(players).forEach((player) => {
      const li = document.createElement('li')
      li.innerText = `${player.name} - ${player.id}`
      li.style.padding = '0.5rem'
      const challengeButton = document.createElement('button')
      challengeButton.style.marginLeft = '1rem'
      if (player.id === currentPlayerId) {
        challengeButton.disabled = true
        challengeButton.innerText = 'You'
      } else {
        challengeButton.innerText = 'Challenge'
        challengeButton.addEventListener('click', () => {
          this.socket.emit('challenge', player.id)
        })
      }
      li.appendChild(challengeButton)
      playersListElement.appendChild(li)
    })
  }

  getPlayerListElement() {
    let playersList = document.querySelector('#players') as HTMLUListElement
    if (!playersList) {
      playersList = document.createElement('ul')
      playersList.id = 'players'
      this.uiLayer.appendChild(playersList)
    }
    return playersList
  }

  showChallenge(attacker: string) {
    const challengeElement = document.createElement('div')
    challengeElement.id = 'challenge'
    challengeElement.innerHTML = `
      <p>${this.players[attacker]?.name ?? attacker} is challenging you!</p>
      <button id="accept">Accept</button>
      <button id="reject">Reject</button>
    `
    challengeElement.style.padding = '1rem'
    challengeElement.style.position = 'fixed'
    challengeElement.style.top = '0'
    challengeElement.style.left = '0'
    challengeElement.style.width = '100%'
    challengeElement.style.backgroundColor = '#fff'

    this.uiLayer.appendChild(challengeElement)

    const acceptButton = challengeElement.querySelector(
      '#accept'
    ) as HTMLButtonElement
    acceptButton.addEventListener('click', () => {
      this.socket.emit('accept', attacker)
      challengeElement.remove()
    })

    const rejectButton = challengeElement.querySelector(
      '#reject'
    ) as HTMLButtonElement
    rejectButton.addEventListener('click', () => {
      challengeElement.remove()
    })
  }

  startGame(opponentId: string) {
    console.log('Starting game with', opponentId)
    // start the game
    this.isGameActive = true
    // hide the players list
    const playersList = document.querySelector('#players') as HTMLUListElement
    playersList?.remove()

    const gameContainer = document.createElement('div')
    gameContainer.style.padding = '1rem'

    // show opponent name
    const opponentName = this.players[opponentId]?.name ?? opponentId
    const opponentNameElement = document.createElement('h2')
    opponentNameElement.style.marginTop = '0'
    opponentNameElement.innerText = `Playing against ${opponentName}`

    gameContainer.appendChild(opponentNameElement)

    // show forfeit game button
    const cancelButton = document.createElement('button')
    cancelButton.innerText = 'Forfeit Game'
    cancelButton.addEventListener('click', () => {
      // forfeit the game
      this.socket.emit('forfeit')
    })

    gameContainer.appendChild(cancelButton)

    // show screen for battleship game
    const battleshipGame = document.createElement('div')
    battleshipGame.id = 'battleship-game'

    // add title "Enemy Ships"
    const enemyTitle = document.createElement('h3')
    enemyTitle.innerText = 'Enemy Ships'
    battleshipGame.appendChild(enemyTitle)

    // create a 6 x 6 table for battleship for enemy ships
    const enemyTable = createTable()
    enemyTable.id = 'enemy-table'
    battleshipGame.appendChild(enemyTable)

    // add title "Your Ships"
    const yourTitle = document.createElement('h3')
    yourTitle.innerText = 'Your Ships'
    battleshipGame.appendChild(yourTitle)

    // create a 6 x 6 table for battleship for player ships
    const playerTable = createTable()
    playerTable.id = 'player-table'
    battleshipGame.appendChild(playerTable)

    gameContainer.appendChild(battleshipGame)
    this.uiLayer.appendChild(gameContainer)
  }

  initGrid(grid: number[][]) {
    if (!this.isGameActive) return

    const playerTable = document.querySelector(
      '#player-table'
    ) as HTMLTableElement
    // mark player table with ships
    grid.forEach((row, rowIndex) => {
      row.forEach((cell, cellIndex) => {
        if (cell !== 0) {
          const cellElement = playerTable.rows[rowIndex].cells[cellIndex]
          cellElement.classList.add('ship')
          cellElement.innerText = cell.toString()
        }
      })
    })
  }
}
