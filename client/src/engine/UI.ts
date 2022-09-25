export class UI {
  container: HTMLDivElement

  constructor() {
    this.container = document.querySelector('#ui') as HTMLDivElement
    this.container.style.height = window.innerHeight + 'px'

    window.addEventListener('resize', () => {
      this.container.style.height = window.innerHeight + 'px'
    })
  }
}
