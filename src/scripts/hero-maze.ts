/**
 * The home-page hero: one infinite, connected circular maze, drawn flat like
 * the reference maze — a few rings of thick walls.
 *
 * The maze (src/lib/maze/infinite.ts) is self-similar: every ring is a scaled
 * copy of the proportions of the ring outside it, so zooming in by one ring
 * looks exactly like where you started. The view zooms in forever: new,
 * randomly carved rings fade in at the centre as they come into view, and
 * rings that grow past the frame are disposed, so memory stays flat.
 *
 * A crawl floods the corridors from the entrances — the same BFS distances
 * the maze generator records — and its frontier is kept a few rings inside
 * the frame, so you follow the crawler down into the maze.
 *
 * Loaded lazily by HeroMaze.astro, only with WebGL2 and without reduced
 * motion. Until the first frame renders, the build-time SVG poster of the
 * same maze is shown instead.
 */
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  Mesh,
  Path,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  Shape,
  ShapeGeometry,
  Vector2,
  WebGLRenderer,
} from 'three'

import { InfiniteMaze, type InfiniteRing, type Sector } from '@/lib/maze'

export interface HeroMazeOptions {
  seed: number
  /** Crawl progress to start from, matching the poster. */
  crawl: number
}

/** Rings zoomed through per second. */
const RINGS_PER_SECOND = 0.3
const FOV = 35
/** Canvas size relative to the maze's resting size (see the CSS overscan). */
const OVERSCAN = 1.5
/** Rings shown at rest; the next one fades in at the centre. */
export const VISIBLE_RINGS = 5
/** On-screen scales (1 = resting size) at which rings fade out. */
const FADE_OUT = [1.7, 2.6]
/** How many rings inside the frame edge the crawl frontier sits. */
export const FRONTIER_RING = 2

interface LiveRing {
  index: number
  /** Median crawl distance of the ring's reached cells (for the frontier). */
  frontier: number
  mesh: Group
  dispose: () => void
}

type FadeUniforms = {
  uFadeIn: { value: number[] }
  uFadeOut: { value: number[] }
}

export function startHeroMaze(
  canvas: HTMLCanvasElement,
  options: HeroMazeOptions,
  onFirstFrame: () => void,
) {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
  })
  renderer.setClearColor(0x000000, 0)

  const scene = new Scene()
  const camera = new PerspectiveCamera(FOV, 1, 0.01, 100)
  // At this distance a world radius of 1 fills the maze's resting size.
  camera.position.z = OVERSCAN / Math.tan(((FOV / 2) * Math.PI) / 180)

  const world = new Group()
  scene.add(world)

  // Colours come from CSS custom properties on the canvas, so the palette
  // lives with the rest of the design tokens.
  const css = getComputedStyle(canvas)
  const cssColor = (name: string, fallback: string) =>
    new Color(css.getPropertyValue(name).trim() || fallback)

  const maze = new InfiniteMaze({ seed: options.seed })
  // A ring fades in as it grows out of the centre, from where the next ring
  // would start to the size of the innermost ring at rest.
  const fadeIn = [
    maze.ratio ** VISIBLE_RINGS,
    maze.ratio ** (VISIBLE_RINGS - 1),
  ]

  // Two materials shared by every ring; each fades by its mesh's scale.
  const fade: FadeUniforms = {
    uFadeIn: { value: fadeIn },
    uFadeOut: { value: FADE_OUT },
  }
  const wallColor = wallMaterial(cssColor('--hero-wall', '#f2f2f2'), fade)
  const floorMaterial = new ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: AdditiveBlending,
    // Maze angles run clockwise, which flips the triangles' winding.
    side: DoubleSide,
    uniforms: {
      ...fade,
      uProgress: { value: options.crawl },
      uTime: { value: 0 },
      uTrail: { value: cssColor('--hero-trail', '#ffffff') },
    },
    vertexShader: FLOOR_VERTEX,
    fragmentShader: FLOOR_FRAGMENT,
  })

  const rings: LiveRing[] = []
  /** Zoom position, in rings: ring k is at scale ratio^(k - zoom). */
  let zoom = 0

  const scaleOf = (index: number) => maze.ratio ** (index - zoom)
  const addRing = () => {
    const ring = maze.next()
    const mesh = buildRing(ring, maze, wallColor, floorMaterial)
    world.add(mesh)
    rings.push({
      index: ring.index,
      frontier: ringFrontier(ring),
      mesh,
      dispose() {
        world.remove(mesh)
        mesh.traverse((child) => {
          if (child instanceof Mesh) child.geometry.dispose()
        })
      },
    })
  }
  /** Keep rings from just outside the frame down to the vanishing point. */
  const syncRings = () => {
    while (rings.length && scaleOf(rings[0].index) > FADE_OUT[1]) {
      rings.shift()!.dispose()
    }
    while (
      !rings.length ||
      scaleOf(rings[rings.length - 1].index) > fadeIn[0]
    ) {
      addRing()
    }
  }
  syncRings()

  /** Crawl distance at a fractional ring index, from the ring medians. */
  const frontierAt = (position: number) => {
    const i = Math.min(Math.max(position - rings[0].index, 0), rings.length - 1)
    const lo = Math.floor(i)
    const hi = Math.min(lo + 1, rings.length - 1)
    const a = rings[lo].frontier
    return a + (rings[hi].frontier - a) * (i - lo)
  }

  // --- sizing -------------------------------------------------------------

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas
    if (!w || !h) return
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)
  resize()

  // --- loop ---------------------------------------------------------------

  let running = false
  let frame = 0
  let last = 0
  let first = true
  let elapsed = 0

  const tick = (now: number) => {
    frame = requestAnimationFrame(tick)
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 0
    last = now
    elapsed += dt
    zoom += dt * RINGS_PER_SECOND
    syncRings()

    for (const ring of rings) ring.mesh.scale.setScalar(scaleOf(ring.index))

    // Ease the crawl toward its target; it never runs backwards.
    const progress = floorMaterial.uniforms.uProgress
    const goal = frontierAt(zoom + FRONTIER_RING)
    progress.value += Math.max(0, goal - progress.value) * Math.min(1, dt * 1.5)
    floorMaterial.uniforms.uTime.value = elapsed

    world.rotation.z = -elapsed * 0.02

    renderer.render(scene, camera)
    if (first) {
      first = false
      onFirstFrame()
    }
  }

  const play = () => {
    if (running) return
    running = true
    last = 0
    frame = requestAnimationFrame(tick)
  }
  const pause = () => {
    running = false
    cancelAnimationFrame(frame)
  }

  // Only animate while the hero is on screen and the tab is visible.
  let onScreen = true
  const sync = () => (onScreen && !document.hidden ? play() : pause())
  const intersection = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting
    sync()
  })
  intersection.observe(canvas)
  document.addEventListener('visibilitychange', sync)
  sync()

  return {
    renderer,
    destroy() {
      pause()
      intersection.disconnect()
      resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', sync)
      rings.forEach((ring) => ring.dispose())
      wallColor.dispose()
      floorMaterial.dispose()
      renderer.dispose()
    },
  }
}

/**
 * Median crawl distance of a ring's reached cells. The hero keeps the crawl
 * frontier at the median of the ring `FRONTIER_RING` rings in; the poster
 * uses the same value so the handover from SVG to WebGL is seamless.
 */
export function ringFrontier(ring: InfiniteRing) {
  const reached = ring.cells
    .map((cell) => cell.distance)
    .filter((d) => d >= 0)
    .sort((a, b) => a - b)
  return reached.length ? reached[Math.floor(reached.length / 2)] : 0
}

// --- geometry -------------------------------------------------------------
//
// Maze coordinates put angle 0 at 12 o'clock, increasing clockwise. In three
// (y up), that point is (r sin a, r cos a). Rings are built in ring-local
// units (outer edge at radius 1) and placed by scaling their mesh.

const point = (r: number, a: number) =>
  new Vector2(r * Math.sin(a), r * Math.cos(a))

function arcPoints(r: number, a0: number, a1: number) {
  const steps = Math.max(2, Math.ceil(Math.abs(a1 - a0) * 24))
  return Array.from({ length: steps + 1 }, (_, i) =>
    point(r, a0 + ((a1 - a0) * i) / steps),
  )
}

function sectorShape({ r0, r1, a0, a1 }: Sector): Shape {
  const outer = arcPoints(r1, a0, a1)
  const inner = arcPoints(r0, a0, a1).reverse()
  if (a1 - a0 >= Math.PI * 2 - 1e-6) {
    const shape = new Shape(outer)
    shape.holes.push(new Path(inner))
    return shape
  }
  return new Shape([...outer, ...inner])
}

function buildRing(
  ring: InfiniteRing,
  maze: InfiniteMaze,
  wallColor: ShaderMaterial,
  floorMaterial: ShaderMaterial,
) {
  const group = new Group()

  // Flat walls, drawn over the floors.
  const walls = new Mesh(
    new ShapeGeometry(ring.walls.map(sectorShape), 1),
    wallColor,
  )
  walls.renderOrder = 1
  group.add(walls)

  // Corridor floors, each vertex tagged with its cell's crawl distance.
  const positions: number[] = []
  const distances: number[] = []
  for (const cell of ring.cells) {
    const outer = arcPoints(1, cell.a0, cell.a1)
    const inner = arcPoints(maze.ratio, cell.a0, cell.a1)
    for (let i = 0; i < outer.length - 1; i++) {
      for (const p of [
        inner[i],
        outer[i],
        outer[i + 1],
        inner[i],
        outer[i + 1],
        inner[i + 1],
      ]) {
        positions.push(p.x, p.y, 0)
        distances.push(cell.distance)
      }
    }
  }
  const floor = new BufferGeometry()
  floor.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(positions), 3),
  )
  floor.setAttribute(
    'aDist',
    new BufferAttribute(new Float32Array(distances), 1),
  )
  group.add(new Mesh(floor, floorMaterial))
  return group
}

// --- shaders --------------------------------------------------------------

/** Shared by walls and floors: 0–1 visibility from the mesh's scale. */
const FADE = /* glsl */ `
  uniform vec2 uFadeIn;
  uniform vec2 uFadeOut;
  float scaleFade() {
    float s = length(modelMatrix[0].xyz);
    return smoothstep(uFadeIn.x, uFadeIn.y, s) *
      (1.0 - smoothstep(uFadeOut.x, uFadeOut.y, s));
  }
`

function wallMaterial(color: Color, fade: FadeUniforms) {
  return new ShaderMaterial({
    transparent: true,
    depthTest: false,
    side: DoubleSide,
    uniforms: { ...fade, uColor: { value: color } },
    vertexShader: /* glsl */ `
      ${FADE}
      varying float vFade;
      void main() {
        vFade = scaleFade();
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vFade;
      void main() {
        if (vFade < 0.01) discard;
        gl_FragColor = vec4(uColor, vFade);
      }
    `,
  })
}

const FLOOR_VERTEX = /* glsl */ `
  ${FADE}
  attribute float aDist;
  varying float vDist;
  varying float vFade;
  varying vec2 vPos;
  void main() {
    vDist = aDist;
    vFade = scaleFade();
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FLOOR_FRAGMENT = /* glsl */ `
  uniform float uProgress;
  uniform float uTime;
  uniform vec3 uTrail;
  varying float vDist;
  varying float vFade;
  varying vec2 vPos;
  void main() {
    // Unreached cells, and cells beyond the frontier, stay dark.
    float behind = uProgress - vDist;
    if (vDist < 0.0 || behind < 0.0) discard;
    float frontier = exp(-pow(behind * 0.35, 2.0));
    float angle = atan(vPos.x, vPos.y) / 6.2831853;
    float shimmer = 0.5 + 0.5 * sin((vDist * 0.08 + angle * 2.0 - uTime * 0.15) * 6.2831853);
    float glow = (0.03 + 0.02 * shimmer) + 0.14 * frontier;
    gl_FragColor = vec4(uTrail * glow * vFade, 1.0);
  }
`
