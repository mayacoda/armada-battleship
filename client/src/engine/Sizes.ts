import { Engine } from './Engine'
import { EventEmitter } from './utilities/EventEmitter'

type Sizing = 'cover' | 'contain'

export class Sizes extends EventEmitter {
  public width!: number
  public height!: number
  public pixelRatio: number = Math.min(window.devicePixelRatio, 2)
  public aspectRatio!: number

  public sizing: Sizing = 'contain'

  constructor(private engine: Engine) {
    super()
    this.setContainsSizing()

    window.addEventListener('resize', () => {
      this.resize()
      this.engine.resize()
      this.emit('resize')
    })
  }

  public setContainsSizing() {
    const { width, height } = getWidthAndHeight()
    this.width = width
    this.height = height

    this.aspectRatio = this.width / this.height
  }

  public setCoverSizing() {
    const { width, height } = getWidthAndHeight()
    const maxWidth = width
    const maxHeight = height

    if (maxWidth / maxHeight < this.aspectRatio) {
      this.width = maxWidth
      this.height = maxWidth / this.aspectRatio
    } else {
      this.width = maxHeight * this.aspectRatio
      this.height = maxHeight
    }
  }

  setAspectRatio(aspectRatio: number) {
    this.aspectRatio = aspectRatio
  }

  setSizing(sizing: Sizing) {
    this.sizing = sizing

    this.resize()
  }

  resize() {
    if (this.sizing === 'contain') {
      this.setContainsSizing()
    } else {
      this.setCoverSizing()
    }
  }
}

function getWidthAndHeight() {
  const ui = document.querySelector('#ui')
  if (ui instanceof HTMLElement) {
    const width = ui.clientWidth
    const height = ui.clientHeight
    return { width, height }
  } else {
    const width = window.innerWidth
    const height = window.innerHeight
    return { width, height }
  }
}
