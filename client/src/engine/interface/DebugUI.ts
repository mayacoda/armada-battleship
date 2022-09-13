import * as lilGui from 'lil-gui'
import Stats from 'three/examples/jsm/libs/stats.module'

let instance: DebugUI | null = null

export class DebugUI {
  gui!: lilGui.GUI
  stats!: Stats

  constructor() {
    if (instance) {
      return this
    }

    instance = this

    this.stats = Stats()
    document.body.appendChild(this.stats.dom)

    this.gui = new lilGui.GUI()

    if (!window.location.search.includes('debug')) {
      this.gui.hide()
      this.stats.dom.style.display = 'none'
    }
  }

  update() {
    this.stats.update()
  }
}
