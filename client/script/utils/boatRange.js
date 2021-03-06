const {TILE_SIZE, SEA_LEVEL} = require('../../../server/CONSTANTS')
import store from '../../store'

const getRange = boat => {
  return bfs(
    store.getState().map,
    boat.x / TILE_SIZE,
    boat.y / TILE_SIZE,
    boat.maxDistance
  )
}

function bfs(map, startX, startY, range) {
  const realTiles = []
  const visitedTiles = new Set()
  function getNear(col, row) {
    const near = []
    const add = (x, y) => {
      if (
        x >= 0 &&
        x <= 64 &&
        y >= 0 &&
        y <= 64 &&
        map[y][x] < SEA_LEVEL &&
        !visitedTiles.has(x + ',' + y)
      ) {
        near.push({col: x, row: y})
        visitedTiles.add(x + ',' + y)
      }
    }
    add(col - 1, row)
    add(col + 1, row)
    add(col, row + 1)
    add(col, row - 1)
    return near
  }

  let depth = 0
  let tiles = [{col: startX, row: startY}]
  let nextTiles = []
  while (tiles.length) {
    const current = tiles.shift()
    realTiles.push(current)
    nextTiles.push(...getNear(current.col, current.row))
    if (tiles.length === 0) {
      if (depth === range) {
        break
      }
      depth++
      tiles = [...nextTiles]
      nextTiles = []
    }
  }
  return realTiles
}

// module.exports.bfs = bfs
export default getRange
