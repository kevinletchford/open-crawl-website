/**
 * Breadth-first "crawl" of a maze from its entrances. The BFS frontier is how
 * a crawler discovers a site — one link at a time, nearest first — and the
 * resulting distances drive every crawl animation on the site.
 */
import type { PolarMaze } from './polar'

export interface Channel {
  /** Which cross arm: 0 = top, 1 = right, 2 = bottom, 3 = left. */
  arm: number
  ring: number
}

export interface CrawlResult {
  /** Steps from the nearest entrance, per cell id. */
  cellDistance: Int32Array
  /**
   * Steps per cross-channel segment, indexed `arm * rings + ring`. Empty for
   * mazes without the cross.
   */
  channelDistance: Int32Array
  /** The largest distance reached: the crawl is complete at this step. */
  maxDistance: number
}

export function crawl(maze: PolarMaze): CrawlResult {
  const { cells, cellsByRing, rings, cross } = maze
  const cellDistance = new Int32Array(cells.length).fill(-1)
  const channelDistance = new Int32Array(cross ? rings * 4 : 0).fill(-1)

  // Graph nodes: cells are 0..cells.length-1, channel segments follow.
  const channelNode = (arm: number, ring: number) =>
    cells.length + arm * rings + ring
  const total = cells.length + channelDistance.length
  const adjacency: number[][] = Array.from({ length: total }, () => [])
  const connect = (a: number, b: number) => {
    adjacency[a].push(b)
    adjacency[b].push(a)
  }

  for (const cell of cells) {
    for (const other of cell.links) if (other > cell.id) connect(cell.id, other)
  }

  const queue: number[] = []
  if (cross) {
    for (let arm = 0; arm < 4; arm++) {
      for (let ring = 0; ring < rings; ring++) {
        const node = channelNode(arm, ring)
        if (ring > 0) connect(node, channelNode(arm, ring - 1))
        // The two cells either side of this arm in this ring.
        const row = cellsByRing[ring]
        const perArm = row.length / 4
        connect(node, row[arm * perArm])
        connect(node, row[(arm * perArm - 1 + row.length) % row.length])
      }
      queue.push(channelNode(arm, rings - 1))
    }
  } else {
    queue.push(cellsByRing[rings - 1][0])
  }

  const distance = new Int32Array(total).fill(-1)
  for (const start of queue) distance[start] = 0
  let maxDistance = 0
  for (let head = 0; head < queue.length; head++) {
    const node = queue[head]
    for (const next of adjacency[node]) {
      if (distance[next] !== -1) continue
      distance[next] = distance[node] + 1
      maxDistance = Math.max(maxDistance, distance[next])
      queue.push(next)
    }
  }

  cellDistance.set(distance.subarray(0, cells.length))
  channelDistance.set(distance.subarray(cells.length))
  return { cellDistance, channelDistance, maxDistance }
}
