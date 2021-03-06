const {createStore, combineReducers} = require('redux')

const {players} = require('./players')
const {fish} = require('./fish')
const {board} = require('./board')
const {status} = require('./status')
const {docks} = require('./docks')
const {endTurns} = require('./endTurns')
const {serverActionsReel} = require('./serverActionsReel')
const {turnsRemaining} = require('./turnsRemaining')
const {gameStats} = require('./gameStats')
const {decorations} = require('./decorations')
const {boatNames} = require('./boatNames')

const reducer = combineReducers({
  fish,
  players,
  board,
  status,
  docks,
  endTurns,
  serverActionsReel,
  turnsRemaining,
  gameStats,
  decorations,
  boatNames
})

const makeStore = () => {
  return createStore(reducer)
}

module.exports = makeStore
