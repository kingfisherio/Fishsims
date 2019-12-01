const lobbies = require('../lobbyer')
const makeMap = require('../script/newMap')
const {setMap} = require('../store/board')
const {addDock} = require('../store/docks')
const {addEndTurn, resetEndTurns} = require('../store/endTurns')
const {addActionToReel, resetReel} = require('../store/serverActionsReel')
const {setPFGrid} = require('../store/pfGrid')
const {getLand, spawnDock} = require('../../utilityMethods.js')

// to be called once by the server to setup the map etc
const initGame = lobby => {
  // make and dispatch map to lobby
  console.log('INIT_GAME') // TODO remove
  const map = makeMap()
  lobby.dispatch(setMap(map))
  lobby.dispatch(setPFGrid(map))
  getLand(lobby.store.getState().board)
  const players = lobby.getPlayers()
  let docks = []
  players.forEach(player => {
    const newDock = spawnDock(docks)
    if (newDock.row)
      lobby.dispatch(addDock(player.socketId, player.name, newDock))
    else console.log('no space left!')
    docks = lobby.store.getState().docks
  })
}

// actual game stuff
const gameSockets = (socket, io) => {
  const lobby = lobbies.findPlayerLobby(socket.id)
  const lobStore = lobby.store

  socket.emit('starting-map', lobStore.getState().board)
  socket.emit('update-map') // send to client who requested start
  //  socket.broadcast.to(lobby.id).emit('update-map')
  socket.emit('spawn-players', lobStore.getState().docks)

  socket.on('end-turn', turnData => {
    lobStore.dispatch(addEndTurn(socket.id))
    lobStore.dispatch(addActionToReel(turnData.actionsReel))

    if (
      allPlayersEndedTurn(
        lobStore.getState().players,
        lobStore.getState().endTurns
      )
    ) {
      io
        .in(lobby.id)
        .emit('start-server-turn', lobStore.getState().serverActionsReel)
      lobStore.dispatch(resetEndTurns())
      lobStore.dispatch(resetReel())
    }
  })

  socket.on('reel-finished', () => {
    console.log(`Socket ${socket.id} finished watching reel`)

    lobStore.dispatch(addEndTurn(socket.id))

    if (
      allPlayersEndedTurn(
        lobStore.getState().players,
        lobStore.getState().endTurns
      )
    ) {
      io.in(lobby.id).emit('start-player-turn')
      lobStore.dispatch(resetEndTurns())
    }
  })
}

/**
 * Returns true if all players in the lobby have emitted an endTurn.
 * @param {Object} players  Player objects from lobby store
 * @param {Array} endTurns  Array of socketIds who have emitted endTurn
 */
function allPlayersEndedTurn(players, endTurns) {
  return players.every(player => endTurns.includes(player.socketId))
}

module.exports = {gameSockets, initGame}
