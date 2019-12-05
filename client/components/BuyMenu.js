import React from 'react'
import {useSelector, useDispatch} from 'react-redux'
import {Tab, Button} from 'semantic-ui-react'
import store, {
  addBoat,
  adjustMoney,
  addActionToReel,
  outOfSpace
} from '../store'
import socket from '../socket'
import {TILE_SIZE} from '../script/CONSTANTS.js'
import {BuyBoat, BuyDock} from './'

const BuyMenu = () => {
  const player = useSelector(state => state.player)
  const allFisheries = useSelector(state => state.fisheries)
  player.fisheries = allFisheries.filter(dock => dock.pId === socket.id)
  const dispatch = useDispatch()
  const boats = useSelector(state => state.boats)
  // buy boat handler

  const handleBuyBoat = (type, price, capacity, range) => {
    const dock = player.fisheries[0]
    const {waterNeighbors} = dock
    const newBoatId = require('uuid/v4')()
    let currentNeighbor = waterNeighbors[0]
    let newBoat = {
      row: currentNeighbor.row * TILE_SIZE,
      col: currentNeighbor.col * TILE_SIZE
    }

    for (let k = 0; k < boats.length && waterNeighbors.length; k++) {
      const matchingBoat = boats.find(
        boat => boat.x === newBoat.col && boat.y === newBoat.row
      )
      if (matchingBoat) {
        if (waterNeighbors.length) {
          waterNeighbors.shift()
          currentNeighbor = waterNeighbors[0]
        } else {
          //TODO: add boats on 'all sides' of boats (gotta know waterNeighbors of boats)
          currentNeighbor = {row: -1, col: -1}
        }
      }
    }
    if (currentNeighbor && currentNeighbor.row >= 0) {
      newBoat = {
        row: currentNeighbor.row * TILE_SIZE,
        col: currentNeighbor.col * TILE_SIZE
      }
      dispatch(
        addBoat(
          newBoatId,
          socket.id,
          player.name,
          newBoat.col,
          newBoat.row,
          capacity,
          range,
          {row: newBoat.row, col: newBoat.col},
          0,
          type
        )
      )
      dispatch(adjustMoney(-1 * price))
      const updatedPlayer = store.getState().player
      socket.emit('buy', updatedPlayer)
      dispatch(
        addActionToReel(newBoatId, socket.id, player.name, 'boatBuy', {
          x: newBoat.col,
          y: newBoat.row
        })
      )
    } else {
      alert("Out of space at this dock! You'll need to save up for another.")
    }
  }
  // TODO: buy dock handler, including place where you want it ghost dock on mousemove

  // tab panes
  const panes = [
    {
      menuItem: {
        key: 'basic',
        content: 'Basic Boat'
      },
      render: () => {
        return (
          <Tab.Pane inverted={true}>
            <BuyBoat
              type="basic"
              price={200}
              range={10}
              capacity={50}
              handleBuyBoat={handleBuyBoat}
            />
          </Tab.Pane>
        )
      }
    },
    {
      menuItem: {
        key: 'bigger',
        content: `Bigger Boat`
      },
      render: () => {
        return (
          <Tab.Pane inverted={true}>
            <BuyBoat
              type="bigger"
              price={500}
              range={9}
              capacity={100}
              handleBuyBoat={handleBuyBoat}
            />
          </Tab.Pane>
        )
      }
    },
    {
      menuItem: {
        key: 'farther',
        content: 'Farther Boat'
      },
      render: () => {
        return (
          <Tab.Pane inverted={true}>
            <BuyBoat
              type="farther"
              price={600}
              range={15}
              capacity={40}
              handleBuyBoat={handleBuyBoat}
            />
          </Tab.Pane>
        )
      }
    },
    {
      menuItem: {
        key: 'dock',
        content: 'Dock'
      },
      render: () => {
        return (
          <Tab.Pane inverted={true}>
            <BuyDock
              handleBuyDock={() => {
                console.log('soon...')
              }}
            />
          </Tab.Pane>
        )
      }
    }
  ]

  return (
    <Tab
      menu={{
        inverted: true,
        attached: true,
        color: 'grey',
        fluid: false,
        vertical: true,
        tabular: 'right'
      }}
      panes={panes}
    />
  )
}

export default BuyMenu
