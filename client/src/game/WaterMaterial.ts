import * as THREE from 'three'
import waterVertexShader from '../../shaders/water.vert'
import waterFragmentShader from '../../shaders/water.frag'
import { ShaderMaterial } from 'three'
import { GameEntity } from '../engine/GameEntity'

export class WaterMaterial extends ShaderMaterial implements GameEntity {
  constructor(amount: number = 10) {
    super({
      vertexShader: waterVertexShader,
      fragmentShader: waterFragmentShader,
      uniforms: {
        uAmount: { value: amount },
        uColor: { value: new THREE.Color('#0b9fb4') },
        uTime: { value: 0 },
      },
    })
  }

  update(delta: number): void {
    this.uniforms.uTime.value += delta
  }
}

export const waterMaterial = new WaterMaterial()
