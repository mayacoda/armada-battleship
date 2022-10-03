import * as THREE from 'three'
import { WebGLRenderer } from 'three'
import { Engine } from './Engine'
import { GameEntity } from './GameEntity'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'

export class RenderEngine implements GameEntity {
  private readonly renderer: WebGLRenderer
  private readonly composer: EffectComposer

  constructor(private engine: Engine) {
    this.renderer = new WebGLRenderer({
      canvas: this.engine.canvas,
      antialias: true,
    })

    this.renderer.physicallyCorrectLights = true
    this.renderer.outputEncoding = THREE.sRGBEncoding
    this.renderer.toneMapping = THREE.CineonToneMapping
    this.renderer.toneMappingExposure = 1.75
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.setClearColor('#737373')
    this.renderer.setSize(this.engine.sizes.width, this.engine.sizes.height)
    this.renderer.setPixelRatio(Math.min(this.engine.sizes.pixelRatio, 2))

    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(
      new RenderPass(this.engine.scene, this.engine.camera.instance)
    )
  }

  update() {
    this.composer.render()
  }

  resize() {
    this.renderer.setSize(this.engine.sizes.width, this.engine.sizes.height)
  }
}
