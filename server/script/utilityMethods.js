/* eslint-disable complexity */
const {TILE_SIZE, SEA_LEVEL} = require('../CONSTANTS')
const {checkWaterConnections} = require('./getWaterConnections')

let waterTiles = []
let landTiles = []
let coastTiles = []

/**
 * returns array of land tiles
 * @param {Array} map   2d array of 'heights' between 0 & 65
 */
const getWater = map => {
  waterTiles = []
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      if (map[row][col] < SEA_LEVEL) {
        waterTiles.push({row, col})
      }
    }
  }
  return waterTiles
}

/**
 * returns array of land tiles
 * @param {Array} map   2d array of 'heights' between 0 & 65
 */
const getLand = map => {
  landTiles = []
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      if (map[row][col] >= SEA_LEVEL) landTiles.push({row, col})
    }
  }
  return landTiles
}

/**
 * returns array of neighboring water tiles
 * @param {Object}    coordinates (row, col)
 * @param {Array}     2d map array of 'heights' between 0 & 65
 */
const getWaterNeighbors = ({row, col}, map) => {
  const waterNeighbors = []
  if (row < 64 && map[row + 1][col] < SEA_LEVEL) {
    // down, stay
    waterNeighbors.push({row: row + 1, col})
  }
  if (row > 0 && map[row - 1][col] < SEA_LEVEL) {
    // up, stay
    waterNeighbors.push({row: row - 1, col})
  }
  if (col < 64 && map[row][col + 1] < SEA_LEVEL) {
    // stay, right
    waterNeighbors.push({row, col: col + 1})
  }
  if (col > 0 && map[row][col - 1] < SEA_LEVEL) {
    // stay, left
    waterNeighbors.push({row, col: col - 1})
  }
  if (col < 64 && row < 64 && map[row + 1][col + 1] < SEA_LEVEL) {
    // down, right
    waterNeighbors.push({row: row + 1, col: col + 1})
  }
  if (col > 0 && row > 0 && map[row - 1][col - 1] < SEA_LEVEL) {
    // up, left
    waterNeighbors.push({row: row - 1, col: col - 1})
  }
  if (col > 0 && row < 64 && map[row + 1][col - 1] < SEA_LEVEL) {
    // down, left
    waterNeighbors.push({row: row + 1, col: col - 1})
  }
  if (col < 64 && row > 0 && map[row - 1][col + 1] < SEA_LEVEL) {
    // up, left
    waterNeighbors.push({row: row - 1, col: col + 1})
  }
  return waterNeighbors
}

/**
 * returns an array of coastal tiles
 * @param {Array} map   2d array of 'heights' between 0 & 65
 */
const getCoast = map => {
  coastTiles = []
  for (let row = 0; row < map.length; row++)
    for (let col = 0; col < map[row].length; col++)
      if (
        map[row][col] < 50 &&
        map[row][col] >= 47 &&
        getWaterNeighbors({row, col}, map).length
      )
        coastTiles.push({row, col})
}

/**
 * generates a new dock when a player joins the game
 * @param {Array} docks   array of players' docks
 */
const spawnDock = (docks, map) => {
  let index = Math.floor(Math.random() * coastTiles.length)
  let randomLand = coastTiles[index]
  // console.log('Length 0 ', bfs(map, randomLand.col, randomLand.row, 5).length)

  if (
    !docks.length &&
    checkWaterConnections(map, randomLand.col, randomLand.row, 5) >= 69 / 2
  ) {
    return randomLand
  }
  if (docks.length === coastTiles.length) return {} // no spots left!
  let k = 0
  while (
    // loop to check for empty space for new dock
    docks.find(
      dock => dock.row === randomLand.row && dock.col === randomLand.col
    ) ||
    checkWaterConnections(map, randomLand.col, randomLand.row, 5) < 69 / 2
  ) {
    if (k > 50) return false
    index = Math.floor(Math.random() * coastTiles.length)
    randomLand = coastTiles[index]
    k++
  }
  return randomLand
}

/**
 *
 * @param {Array} docks  the arry of player docks
 * @param {Arrya} map    the height map of the world
 */
function spawnDockImage(docks, map) {
  if (coastTiles.length - docks.length <= 0) {
    // no sand left
    const randomWater = waterTiles[Math.ceil(Math.random() * waterTiles.length)]
    coastTiles.push(randomWater)
    map[randomWater.row][randomWater.col] = 48
  }
  return spawnDock(docks, map)
}

/**
 * spaws schools of fish!
 * @param {Array} map   2d map array of 'heights' between 0 and 65
 */
const spawnFish = map => {
  const theShallows = []
  const theOpenOcean = []
  const theDeep = []
  // increase school size as water gets deeper
  // 1. assign a likelihood to each square
  const fishes = []
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      const x = map[row][col]
      if (x < 47 && x >= 34) {
        theShallows.push({row, col})
      } else if (x < 34 && x >= 15) {
        theOpenOcean.push({row, col})
      } else if (x < 15 && x >= 0) {
        theDeep.push({row, col})
      }
    }
  }
  theShallows.forEach(tile => {
    if (Math.random() < 0.03) {
      tile.population = 50 // shallow water fishes are few
      tile.fishType = 'shallows'
      fishes.push(tile)
    }
  })
  theOpenOcean.forEach(tile => {
    if (Math.random() < 0.02) {
      tile.population = 75 // open ocean fishes are more
      tile.fishType = 'openOcean'
      fishes.push(tile)
    }
  })
  theDeep.forEach(tile => {
    if (Math.random() < 0.015) {
      tile.population = 100 // deep water fishes are many (and terrifying)
      tile.fishType = 'deep'
      fishes.push(tile)
    }
  })
  // 2. if spawned, include a range of tiles based on depth of water

  // Uniquely ID each fishes tile for fish collecting/actionsReel
  fishes.forEach(f => {
    f.id = require('uuid/v4')()
  })

  return fishes
}

// -------- //

// returns which board tile a set of coordinates resolves to
const coordsToTile = coords => ({
  x: Math.floor(coords.x / TILE_SIZE),
  y: Math.floor(coords.y / TILE_SIZE)
})

// returns the top-left coordinates of a given board tile
const getTileOrigin = tile => ({x: tile.x * TILE_SIZE, y: tile.y * TILE_SIZE})

// checks traversible as mouse moves
const validatePath = coords => {
  let toReturn = false
  const tile = coordsToTile(coords)
  if ([tile.y][tile.x] === 2) {
    // disallow movement on land
    return toReturn
  } else {
    return true
  }
}

// --- //

// Test validatePath:
// Main diagonal test passes
/*let x = 0
   let y = 0
   while (x < TILE_SIZE * 8 && y < TILE_SIZE * 8) {
   console.log(validatePath({x, y}))
   x++
   y++
   }*/

module.exports = {
  validatePath,
  coordsToTile,
  getTileOrigin,
  spawnDock,
  getLand,
  getWater,
  getCoast,
  getWaterNeighbors,
  spawnFish,
  waterTiles,
  spawnDockImage
}
