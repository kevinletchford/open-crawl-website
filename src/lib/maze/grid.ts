/**
 * A square maze: the polar maze's rectangular sibling, for backdrops that
 * need to tile a section. Cells are numbered row by row (`y * cols + x`) and
 * the maze is perfect (a spanning tree), carved by a randomised depth-first
 * search so its corridors run long, like the polar maze's arcs.
 */
import { shuffle, type Rng } from './rng'

export interface GridMaze {
  cols: number
  rows: number
  /** Linked neighbours of each cell. */
  links: number[][]
}

export function generateGridMaze(
  cols: number,
  rows: number,
  rng: Rng,
): GridMaze {
  const links = Array.from({ length: cols * rows }, () => [] as number[])
  const seen = new Uint8Array(cols * rows)
  const neighbours = (id: number) => {
    const x = id % cols
    const y = Math.floor(id / cols)
    const out: number[] = []
    if (x > 0) out.push(id - 1)
    if (x < cols - 1) out.push(id + 1)
    if (y > 0) out.push(id - cols)
    if (y < rows - 1) out.push(id + cols)
    return out
  }
  const start = Math.floor(rng() * cols * rows)
  const stack = [start]
  seen[start] = 1
  while (stack.length) {
    const id = stack[stack.length - 1]
    const next = shuffle(neighbours(id), rng).find((n) => !seen[n])
    if (next === undefined) {
      stack.pop()
      continue
    }
    seen[next] = 1
    links[id].push(next)
    links[next].push(id)
    stack.push(next)
  }
  return { cols, rows, links }
}

/**
 * Wall segments as one path, `size` units per cell: each cell draws its
 * right and bottom walls where it has no link, and the top and left rows
 * close the outside.
 */
export function gridWallsPath(maze: GridMaze, size: number) {
  const { cols, rows, links } = maze
  let d = `M0 0H${cols * size}M0 0V${rows * size}`
  for (let id = 0; id < cols * rows; id++) {
    const x = (id % cols) * size
    const y = Math.floor(id / cols) * size
    if (!links[id].includes(id + 1)) d += `M${x + size} ${y}V${y + size}`
    if (!links[id].includes(id + cols)) d += `M${x} ${y + size}H${x + size}`
  }
  return d
}

/**
 * Breadth-first steps from `sources` along the maze's links. Cells for which
 * `stop` returns true are reached but not passed through; -1 means never
 * reached.
 */
export function gridFlood(
  maze: GridMaze,
  sources: number[],
  stop: (id: number) => boolean = () => false,
) {
  const step = new Array<number>(maze.links.length).fill(-1)
  const parent = new Array<number>(maze.links.length).fill(-1)
  const queue = [...sources]
  for (const id of sources) step[id] = 0
  for (let head = 0; head < queue.length; head++) {
    const id = queue[head]
    if (stop(id)) continue
    for (const next of maze.links[id]) {
      if (step[next] !== -1) continue
      step[next] = step[id] + 1
      parent[next] = id
      queue.push(next)
    }
  }
  return { step, parent }
}
