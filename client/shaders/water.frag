varying vec2 vUv;
uniform vec3 uColor;
uniform float uTime;
uniform float uAmount;

vec2 random2(vec2 p) {
  return fract(
    sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) *
      43758.5453
  );
}

float cellular(vec2 p) {
  vec2 i_st = floor(p);
  vec2 f_st = fract(p);
  float m_dist = 10.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 neighbor = vec2(float(i), float(j));
      vec2 point = random2(i_st + neighbor);
      point = 0.5 + 0.5 * sin(6.2831 * point + uTime);
      vec2 diff = neighbor + point - f_st;
      float dist = length(diff);
      if (dist < m_dist) {
        m_dist = dist;
      }
    }
  }
  return m_dist;
}

void main() {
  float c = cellular(8.0 * (vUv * vec2(uAmount * 10.0)));
  vec3 col = mix(uColor, vec3(1.0), smoothstep(0.4, 1.3, c));
  gl_FragColor = vec4(col, 1.0);
}

