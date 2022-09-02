import './style.scss'
import { Engine } from './engine/Engine'
import { BattleShip } from './game/BattleShip'

new Engine({
  canvas: document.querySelector('#canvas') as HTMLCanvasElement,
  experience: BattleShip,
})
