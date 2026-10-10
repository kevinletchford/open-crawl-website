/**
 * Slow, drifting light for the dark bands, drawn by a tiny WebGL2
 * fragment shader (no three.js). The canvas is masked to a maze's corridors in
 * CSS, so the light appears to flow through the maze.
 *
 * Each backdrop creates its GL context the first time it nears the viewport,
 * and only animates while visible. With reduced motion it draws one still
 * frame. Without WebGL2 the canvas stays hidden and the faint SVG walls remain.
 */

const VERTEX = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`

const FRAGMENT = `#version 300 es
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uA;
uniform vec3 uB;
out vec4 outColor;

float blob(vec2 p, vec2 c, float r) {
  return exp(-dot(p - c, p - c) / (r * r));
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
  float t = uTime * 0.08;
  float a = blob(p, vec2(sin(t * 1.3) * 0.45, cos(t * 0.9) * 0.35), 0.42);
  float b = blob(p, vec2(cos(t * 0.7 + 2.0) * 0.5, sin(t * 1.1 + 1.0) * 0.4), 0.38);
  float c = blob(p, vec2(sin(t * 0.5 + 4.0) * 0.4, cos(t * 1.7 + 3.0) * 0.45), 0.3);
  vec3 color = uA * a + uB * b + mix(uA, uB, 0.5) * c * 0.8;
  float alpha = clamp(a + b + c * 0.8, 0.0, 1.0);
  outColor = vec4(color, alpha);
}`

function hexToRgb(hex: string): [number, number, number] {
  let digits = hex.replace('#', '')
  // CSS minifiers shorten #ffffff to #fff.
  if (digits.length === 3) digits = [...digits].map((d) => d + d).join('')
  const value = parseInt(digits, 16)
  return [(value >> 16) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255]
}

function start(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl2', { premultipliedAlpha: false })
  if (!gl) return
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    return shader
  }
  const program = gl.createProgram()
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX))
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return
  gl.useProgram(program)

  // One triangle that covers the whole viewport.
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  )
  const aPos = gl.getAttribLocation(program, 'aPos')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  const css = getComputedStyle(canvas)
  const color = (name: string, fallback: string) =>
    hexToRgb(css.getPropertyValue(name).trim() || fallback)
  gl.uniform3fv(
    gl.getUniformLocation(program, 'uA'),
    color('--backdrop-a', '#ffffff'),
  )
  gl.uniform3fv(
    gl.getUniformLocation(program, 'uB'),
    color('--backdrop-b', '#8a8a8a'),
  )
  const uRes = gl.getUniformLocation(program, 'uRes')
  const uTime = gl.getUniformLocation(program, 'uTime')

  // Each backdrop starts at a different point in the loop.
  const offset = Math.random() * 1000
  const draw = (now: number) => {
    gl.uniform1f(uTime, offset + now / 1000)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  const resize = () => {
    // The light is soft, so half resolution is plenty.
    canvas.width = Math.max(1, Math.round(canvas.clientWidth / 2))
    canvas.height = Math.max(1, Math.round(canvas.clientHeight / 2))
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.uniform2f(uRes, canvas.width, canvas.height)
    draw(performance.now())
  }
  new ResizeObserver(resize).observe(canvas)
  resize()
  canvas.classList.add('is-live')

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  let frame = 0
  let visible = false
  const loop = (now: number) => {
    draw(now)
    frame = requestAnimationFrame(loop)
  }
  const sync = () => {
    cancelAnimationFrame(frame)
    if (visible && !document.hidden) frame = requestAnimationFrame(loop)
  }
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    sync()
  }).observe(canvas)
  document.addEventListener('visibilitychange', sync)
}

export function initShaderBackdrops() {
  const lazy = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        lazy.unobserve(entry.target)
        start(entry.target as HTMLCanvasElement)
      }
    },
    { rootMargin: '200px' },
  )
  for (const canvas of document.querySelectorAll<HTMLCanvasElement>(
    'canvas[data-shader-backdrop]',
  )) {
    lazy.observe(canvas)
  }
}
