export type Player = {
  id: string
  name: string
  isPlaying: boolean
  position: Vec3
  rotation: { x: number; y: number; z: number; w: number } | null
  linkToTwitter: boolean
}

export type Vec3 = {
  x: number
  y: number
  z: number
}
