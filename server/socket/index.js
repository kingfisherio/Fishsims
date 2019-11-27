const {changeName, addPlayer, addBoat} = require('../store/players')
const {Player} = require('../Player')
const {setMap} = require('../store/board')
const {spawnDock, getLand, getWater} = require('../../utilityMethods.js')
const {makeMap} = require('../../fractal-noise.js')
const {TILE_SIZE} = require('../../client/script/drawMap.js')
const store = require('../store')
const Boat = require('../Boat')
const {setStatus} = require('../store/status')

const lobbies = require('../lobbyer')

// const allPlayers = store.getState().players
// const allDocks = allPlayers.reduce(
//   (docks, nextPlayer) => docks.push(nextPlayer.docks),
//   []
// )

// make new map and make sure that it's viable
// TODO: output image

let newMap = makeMap()
let landTiles = getLand(newMap)
let waterTiles = getWater(newMap)
while (
  landTiles.length > waterTiles.length ||
  landTiles.length < TILE_SIZE * 50
) {
  newMap = makeMap()
  landTiles = getLand(newMap)
  waterTiles = getWater(newMap)
}

module.exports = io => {
  io.on('connection', socket => {
    console.log(`A socket connection to the server has been made: ${socket.id}`)

    /**
     * Keep pinging all clients, so that they don't disconnect mid-game
     */
    setInterval(() => {
      io.emit('ping', 'ping')
    }, 5000)

    // io.emit('send-game-state', store.getState())

    /**
     * person has entered their name and is ready to join a lobby
     */
    socket.on('lobby-me', name => {
      // const newPlayer = makePlayer(socketId)
      // store.dispatch(addPlayer(newPlayer))
      // socket.emit('send-game-state', store.getState())
      lobbies.addPlayerToWaiting(name, socket.id)
      const result = lobbies.addToOldestWaiting()
      switch (result.status) {
        case 404:
        case 2:
          socket.emit('lobby-result', {
            status: 418 // im a teapot
          })
          return
        default:
          break
      }
      console.log('JOIN:\t', socket.id, 'is joining', result.lobby.id)

      socket.join(result.lobby.id)

      socket.emit('lobby-result', {
        status: 200,
        players: result.lobby.getPlayers(),
        lobbyId: result.lobby.id
      })

      socket.broadcast.to(result.lobby.id).emit('player-added-to-lobby', {
        name,
        socketId: socket.id
      })

      // io.sockets.in(result.lobby.id).emit('player-added-to-lobby', {
      //   name,
      //   socketId: socket.id,
      //   extra: 'io.sockets.in'
      // })

      // socket.broadcast('player-added-to-lobby', {
      //   name,
      //   socketId: socket.id,
      //   extra: 'OOF'
      // })

      if (result.status === 201) {
        socket.broadcast
          .to(result.id)
          .emit('final-player', {start: new Date().getTime()})
      }
    })

    /**
     * adds player to hidden lobby
     */
    socket.on('lobby-me-hidden', (name, lobbyId) => {
      const out = lobbies.addPlayerToLobby(lobbyId, name, socket.id)
      switch (out.status) {
        case 0: {
          // added to existing lobby
          socket.emit('lobby-result', {
            status: 200,
            players: out.lobby.getPlayers(),
            lobbyId
          })
          socket.join(lobbyId)
          socket.broadcast.to(lobbyId).emit('player-added-to-lobby', {
            name,
            socketId: socket.id,
            final: false
          })
          break
        }
        case 1: {
          // switched lobby to completed
          socket.emit('lobby-result', {
            status: 201, // close enough to what 201 means
            players: out.getPlayers(),
            lobbyId
          })
          socket.join(lobbyId)
          socket.broadcast.to(lobbyId).emit('player-added-to-lobby', {
            name,
            socketId: socket.id,
            final: true
          })
          break
        }
        case 2: {
          // lobby was full
          socket.emit('lobby-result', {
            status: 418
          })
          break
        }
        case 404: {
          // No lobby by that name
          socket.emit('lobby-result', {
            status: 423
          })
          break
        }
        default: {
          break
        }
      }
    })

    socket.on('disconnect', () => {
      const lobby = lobbies.findPlayerLobby(socket.id)
      console.log(lobby)
      if (lobby) {
        console.log(`LEAVE:\tPlayer ${socket.id} is leaving ${lobby.id}`)
        socket.broadcast.to(lobby.id).emit('player-left-lobby', socket.id)
        lobby.removePlayer(socket.id)
        return
      }
      console.log(`Player ${socket.id} has left the page`)
    })

    socket.on('force-game', lobbyId => {
      console.log('forcing lobby', lobbyId, 'into the game.')
      const lobby = lobbies.getLobby(lobbyId)
      if (lobby.containsPlayer(socket.id)) {
        // normally you'd have this but for teesting you can join back to current games
        // lobby.status = 'PLAYING'
        // lobby.dispatch(setStatus('PLAYING'))
      }
      socket.broadcast.to(lobbyId).emit('game-start')
    })

    //   /**
    //    * Person places a boat
    //    */
    //   socket.on('boat-add', boat => {
    //     const playerToUpdate = store
    //       .getState()
    //       .players.find(p => p.socketId === boat.socketId)

    //     store.dispatch(
    //       addBoat(boat.socketId, new Boat(playerToUpdate.color, boat.x, boat.y))
    //     )
    //     io.emit('send-game-state', store.getState())
    //   })

    //   /**
    //    * Change person's name after homescreen
    //    */
    //   socket.on('set-name', name => {
    //     store.dispatch(changeName(socket.id, name))
    //   })

    //   /**
    //    * Chat Stuff Below
    //    */
    //   socket.on('sending-message', msg => {
    //     //private msg ==> /msg john whatever: message here

    //     if (msg.text.startsWith('/msg')) {
    //       let name = msg.text.split(':')[0]
    //       const text = msg.text.replace(name + ':', '').replace('/msg ', '')
    //       name = name.replace('/msg ', '')

    //       const person = store
    //         .getState()
    //         .players.filter(player => player.name === name)
    //       if (person.length) {
    //         socket.broadcast
    //           .to(person[0].socketId)
    //           .emit('new-message', {...msg, text})
    //       }
    //     } else {
    //       socket.broadcast.emit('new-message', msg)
    //     }
    //   })
  })
}
