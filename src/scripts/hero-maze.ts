/**
 * The home-page hero: an infinite circular maze.
 *
 * Every maze has another maze inside its eye. The camera zooms steadily into
 * the centre, and while each level is in view a crawl spreads through its
 * corridors from the four entrances to the eye — the BFS frontier from
 * `crawl()`, revealed by a shader as a moving gradient. By the time the crawl
 * reaches the eye, the next maze has filled the frame and its own crawl
 * begins. Levels that grow out of view are disposed and a fresh one is
 * generated in the middle, so the loop never ends and memory stays flat.
 *
 * Loaded lazily by the hero component, only when WebGL is available and the
 * visitor hasn't asked for reduced motion. Until the first frame renders, the
 * build-time SVG poster (same seed, same maze) is shown instead.
 */
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  Path,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  Shape,
  Vector2,
  WebGLRenderer,
  AdditiveBlending,
} from 'three'

import { crawl, generateMaze, type PolarMaze, type Wall } from '@/lib/maze'

export interface HeroMazeOptions {
  seed: number
  rings: number
  eye: number
}

/** Seconds to zoom through one level. */
const LEVEL_SECONDS = 11
/**
 * Levels alive at once. Slot 1 is the level filling the frame; slot 0 is its
 * parent, fading out as it grows past the edges; slots 2+ wait inside.
 */
const LEVELS = 4
/** On-screen scale (1 = resting size) at which a level starts to fade out. */
const FADE_FROM = 2.4
const FOV = 35
/** Canvas size relative to the maze's resting size (see the CSS overscan). */
const OVERSCAN = 1.5
const WALL_DEPTH = 0.32
const TILT = -0.38

interface Level {
  group: Group
  floor: ShaderMaterial
  /** 0–1: fades walls into the background and dims the trail. */
  setFade: (fade: number) => void
  dispose: () => void
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
  world.rotation.x = TILT
  scene.add(world)

  // Colours come from CSS custom properties on the canvas, so the palette
  // lives with the rest of the design tokens.
  const css = getComputedStyle(canvas)
  const cssColor = (name: string, fallback: string) =>
    new Color(css.getPropertyValue(name).trim() || fallback)
  const background = cssColor('--hero-bg', '#0b0b10')
  const wallColor = cssColor('--hero-wall', '#f4f4f6')
  const sideColor = cssColor('--hero-wall-side', '#5d5d78')
  const trailA = cssColor('--hero-trail-a', '#3ee0d8')
  const trailB = cssColor('--hero-trail-b', '#7b5cff')

  // Every level has the same proportions, so each child fits inside its
  // parent's eye at a fixed ratio.
  const primary = generateMaze(options)
  const ratio = (primary.eye - primary.wall / 2) / primary.outerRadius / 1.04

  // Slot 1 is the poster's maze (same seed), so the crossfade is seamless.
  const levels: Level[] = []
  let nextSeed = options.seed - 1
  for (let i = 0; i < LEVELS; i++) {
    const seed = nextSeed++
    levels.push(
      buildLevel(i === 1 ? primary : generateMaze({ ...options, seed })),
    )
  }
  /** Progress through the current level, 0–1. */
  let zoom = 0

  function buildLevel(maze: PolarMaze): Level {
    const group = new Group()
    const wallTop = new MeshBasicMaterial({ color: wallColor.clone() })
    const wallSide = new MeshBasicMaterial({ color: sideColor.clone() })

    const walls = new ExtrudeGeometry(
      maze.walls.map((w) => wallShape(w, maze)),
      {
        depth: WALL_DEPTH,
        bevelEnabled: false,
        curveSegments: 1,
      },
    )
    const wallMesh = new Mesh(walls, [wallTop, wallSide])
    wallMesh.position.z = 0.002
    group.add(wallMesh)

    const floorGeometry = floor(maze)
    const floorMaterial = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      // Maze angles run clockwise, which flips the triangles' winding.
      side: DoubleSide,
      blending: AdditiveBlending,
      uniforms: {
        uProgress: { value: 0 },
        uTime: { value: 0 },
        uFade: { value: 1 },
        uA: { value: trailA },
        uB: { value: trailB },
      },
      vertexShader: FLOOR_VERTEX,
      fragmentShader: FLOOR_FRAGMENT,
    })
    group.add(new Mesh(floorGeometry, floorMaterial))

    // Scale so the maze's outer radius is 1 world unit at its resting size.
    group.userData.unit = 1 / maze.outerRadius
    world.add(group)

    return {
      group,
      floor: floorMaterial,
      setFade(fade) {
        wallTop.color.lerpColors(background, wallColor, fade)
        wallSide.color.lerpColors(background, sideColor, fade)
        floorMaterial.uniforms.uFade.value = fade
      },
      dispose() {
        world.remove(group)
        walls.dispose()
        wallTop.dispose()
        wallSide.dispose()
        floorGeometry.dispose()
        floorMaterial.dispose()
      },
    }
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

  // --- pointer parallax ---------------------------------------------------

  const target = { x: 0, y: 0 }
  const onPointer = (event: PointerEvent) => {
    target.x = (event.clientX / window.innerWidth - 0.5) * 2
    target.y = (event.clientY / window.innerHeight - 0.5) * 2
  }
  window.addEventListener('pointermove', onPointer, { passive: true })

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
    zoom += dt / LEVEL_SECONDS

    // The outermost level has grown well past the frame: recycle it.
    if (zoom >= 1) {
      zoom -= 1
      levels.shift()!.dispose()
      levels.push(buildLevel(generateMaze({ ...options, seed: nextSeed++ })))
    }

    world.rotation.x += (TILT + target.y * 0.08 - world.rotation.x) * 0.04
    world.rotation.y += (target.x * 0.1 - world.rotation.y) * 0.04
    world.rotation.z = -elapsed * 0.015

    levels.forEach((level, i) => {
      // How many levels this one is from filling the frame: 0 = resting size,
      // -1 = one level further in, +1 = one level past.
      const step = zoom + 1 - i
      const scale = ratio ** -step
      level.group.scale.setScalar(scale * level.group.userData.unit)
      const fade = clamp01(
        1 - Math.log(scale / FADE_FROM) / Math.log(1 / ratio / FADE_FROM),
      )
      level.group.visible = fade > 0 && scale > 0.004
      level.setFade(fade)
      // Each level's crawl starts as it emerges from its parent's eye and
      // reaches its own eye as it grows past the frame.
      level.floor.uniforms.uProgress.value = clamp01((step + 0.45) / 1.35)
      level.floor.uniforms.uTime.value = elapsed
    })

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
      window.removeEventListener('pointermove', onPointer)
      levels.forEach((level) => level.dispose())
      renderer.dispose()
    },
  }
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

// --- geometry -------------------------------------------------------------
//
// Maze coordinates put angle 0 at 12 o'clock, increasing clockwise. In three
// (y up), that point is (r sin a, r cos a).

const point = (r: number, a: number): [number, number] => [
  r * Math.sin(a),
  r * Math.cos(a),
]

/** Points along an arc, with segment count scaled to its on-screen length. */
function arcPoints(r: number, a0: number, a1: number) {
  const steps = Math.max(2, Math.ceil(Math.abs(a1 - a0) * Math.max(6, r * 5)))
  return Array.from({ length: steps + 1 }, (_, i) =>
    point(r, a0 + ((a1 - a0) * i) / steps),
  )
}

function wallShape(wall: Wall, maze: PolarMaze): Shape {
  const shape = new Shape()
  const half = maze.wall / 2
  if (wall.kind === 'radial') {
    const [ux, uy] = point(1, wall.a)
    const [nx, ny] = [uy * half, -ux * half]
    shape.moveTo(wall.r0 * ux - nx, wall.r0 * uy - ny)
    shape.lineTo(wall.r1 * ux - nx, wall.r1 * uy - ny)
    shape.lineTo(wall.r1 * ux + nx, wall.r1 * uy + ny)
    shape.lineTo(wall.r0 * ux + nx, wall.r0 * uy + ny)
    return shape
  }
  const outer = arcPoints(wall.r + half, wall.a0, wall.a1)
  const inner = arcPoints(wall.r - half, wall.a0, wall.a1)
  if (wall.a1 - wall.a0 >= Math.PI * 2 - 1e-6) {
    // A closed ring: the outer circle with the inner one as a hole.
    shape.setFromPoints(outer.map(([x, y]) => new Vector2(x, y)))
    const hole = new Path()
    hole.setFromPoints(inner.reverse().map(([x, y]) => new Vector2(x, y)))
    shape.holes.push(hole)
    return shape
  }
  const [first, ...rest] = outer
  shape.moveTo(...first)
  for (const p of rest) shape.lineTo(...p)
  for (const p of inner.reverse()) shape.lineTo(...p)
  return shape
}

/** Corridor floors as triangles, each vertex tagged with crawl distance. */
function floor(maze: PolarMaze): BufferGeometry {
  const { cellDistance, maxDistance } = crawl(maze)
  const positions: number[] = []
  const distances: number[] = []
  for (const cell of maze.cells) {
    const r0 = maze.radius(cell.ring)
    const r1 = maze.radius(cell.ring + 1)
    const d = cellDistance[cell.id] / Math.max(1, maxDistance)
    const outer = arcPoints(r1, cell.a0, cell.a1)
    const inner = arcPoints(r0, cell.a0, cell.a1)
    // arcPoints picks its step count from the radius, so resample the inner
    // edge to match the outer one.
    const n = outer.length - 1
    for (let i = 0; i < n; i++) {
      const ia = inner[Math.round((i / n) * (inner.length - 1))]
      const ib = inner[Math.round(((i + 1) / n) * (inner.length - 1))]
      const quad = [ia, outer[i], outer[i + 1], ia, outer[i + 1], ib]
      for (const [x, y] of quad) {
        positions.push(x, y, 0)
        distances.push(d)
      }
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(positions), 3),
  )
  geometry.setAttribute(
    'aDist',
    new BufferAttribute(new Float32Array(distances), 1),
  )
  return geometry
}

// --- shaders --------------------------------------------------------------

const FLOOR_VERTEX = /* glsl */ `
  attribute float aDist;
  varying float vDist;
  varying vec2 vPos;
  void main() {
    vDist = aDist;
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FLOOR_FRAGMENT = /* glsl */ `
  uniform float uProgress;
  uniform float uTime;
  uniform vec3 uA;
  uniform vec3 uB;
  uniform float uFade;
  varying float vDist;
  varying vec2 vPos;
  void main() {
    // Visited corridors stay lit; the frontier glows brightest.
    float behind = uProgress - vDist;
    if (behind < 0.0) discard;
    float frontier = exp(-pow(behind * 9.0, 2.0));
    float angle = atan(vPos.x, vPos.y) / 6.2831853;
    float wave = 0.5 + 0.5 * sin((vDist * 3.0 + angle - uTime * 0.12) * 6.2831853);
    vec3 color = mix(uA, uB, wave);
    float glow = 0.42 + 1.1 * frontier;
    gl_FragColor = vec4(color * glow * uFade, 1.0);
  }
`
