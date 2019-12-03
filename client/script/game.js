/* eslint-disable guard-for-in */
/* eslint-disable no-case-declarations */
/* eslint-disable camelcase */
import * as PIXI from 'pixi.js'
import {Viewport} from 'pixi-viewport'
import {keyboard} from '../script/PIXIutils'
import makeFisherySprite from '../script/makeFisherySprite'
import makeFishSprite from '../script/makeFishSprite'
import makeMapSprite from '../script/makeMapSprite'
//import {spawnFish} from '../../utilityMethods.js'
import socket from '../socket'
import {TILE_SIZE, SCALE} from '../script/drawMap'
import {ifOnFishCollect} from './ifOnFishCollect'
import {boatInRangeOfDock} from './boatInRangeOfDock'
import {FISH_VALUES} from './CONSTANTS'

import store, {
  setFishes,
  addBoat,
  setServerActionsReel,
  setPixiGameState,
  adjustMoney
} from '../store'

// declare globals
let Sprite = PIXI.Sprite
export let Application = PIXI.Application
export let app = new Application({
  width: 65 * TILE_SIZE, // window.innerHeight,
  height: 65 * TILE_SIZE, // window.innerHeight,
  transparent: true
})

// --------------------- create pixi-viewport ---------------------

export const viewport = new Viewport({
  screenWidth: window.innerWidth,
  screenHeight: window.innerHeight,
  //pixiapp width & height = 65 * 32(tile size) = 2080px
  worldWidth: 2200,
  worldHeight: 2200,

  interaction: app.renderer.plugins.interaction // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
})
// add the viewport to the stage
app.stage.addChild(viewport)

// activate plugins
viewport
  .drag()
  .pinch()
  .wheel()
  .decelerate()

// --------------------- end Viewport setup ---------------------

export let stage = viewport
export let loader = app.loader
export let resources = loader.resources

// bind resource names here, so we don't keep having to use the spritePath variable
export const spritePath = 'assets'
export const boatImage = `${spritePath}/boat.png`
export const fishesImage = `${spritePath}/fishes.png`
export const justFish = PIXI.Texture.from(fishesImage)
export const justBoat = PIXI.Texture.from(boatImage)

export const fisheryImage = `${spritePath}/fishery.png`

let fishes = []
let fisheries = []

// Keyboard binding- for testing only, real game won't use keyboard like this
const left = keyboard('ArrowLeft'),
  up = keyboard('ArrowUp'),
  right = keyboard('ArrowRight'),
  down = keyboard('ArrowDown')

/**
 * mounts pixi app and returns the needed pixi stuff
 * @param {DOMElement} mounter   where the pixi app will mount
 */
export function mount(mounter) {
  let type = PIXI.utils.isWebGLSupported() ? 'WebGL' : 'canvas'
  mounter.appendChild(app.view)
  return {Application, app, loader, Sprite}
}

/**
 *  starts the game loop and adds in the sprites and stuff
 * @param {any} stuff    the collection of things returned from mount()
 */
export function start(mapData) {
  loader
    .add([boatImage, fishesImage, fisheryImage])
    .add('map', mapData)
    .on('progress', loadProgressHandler)
    .load(setup)

  function loadProgressHandler() {
    // this can be leveraged for a loading progress bar
  }
}

function setup() {
  viewport.addChild(makeMapSprite())

  //TODO : move to sockets, generate based on water tiles
  fishes = store.getState().fishes

  // Keep this here unless we find a better fix for the mount issue;
  // all pixi-related stuff is undefined before this file is run.
  fishes = store
    .getState()
    .fishes.map(
      fish => (!fish.sprite ? {...fish, sprite: makeFishSprite(fish)} : fish)
    )

  fisheries = store.getState().fisheries.map(fishery => {
    console.log(fishery)
    if (!fishery.sprite) {
      return {...fishery, sprite: makeFisherySprite(fishery)}
    }
    return fishery
  })
  // console.log('TCL: setup -> fisheries', fisheries)

  /**
   * functions for dragging and moving
   */

  // start a 60fps game cycle
  app.ticker.add(() => gameLoop())

  // animation loop- 60fps
  function gameLoop() {
    // 60 times per second, run the function for the current gamestate
    const pixiGameState = store.getState().pixiGameState

    switch (pixiGameState) {
      case 'playerTurn':
        return playerTurn()
      case 'computerTurn':
        return computerTurn()
      case 'waitForNextTurn':
        return waitForNextTurn()
      default:
        return playerTurn()
    }
  }
}

export function playerTurn() {
  // console.log('<>< PLAYER TURN <><')
  const {selectedObject} = store.getState()
  // console.log('Whose boat is selected? ', selectedObject.ownerName)
  const {moveReel} = selectedObject

  // *** MOVEMENT REEL ************************************************
  // if boat is stationary, its next move is relative to its current position.
  // else, adding moves to the reel must set target coords based on the last move in the reel.
  left.press = () => {
    moveReel.push(
      moveReel.length
        ? {
            targetX: moveReel[moveReel.length - 1].targetX - TILE_SIZE,
            targetY: moveReel[moveReel.length - 1].targetY
          }
        : {
            targetX: selectedObject.x - TILE_SIZE,
            targetY: selectedObject.y
          }
    )
  }

  right.press = () => {
    moveReel.push(
      moveReel.length
        ? {
            targetX: moveReel[moveReel.length - 1].targetX + TILE_SIZE,
            targetY: moveReel[moveReel.length - 1].targetY
          }
        : {
            targetX: selectedObject.x + TILE_SIZE,
            targetY: selectedObject.y
          }
    )
  }

  up.press = () => {
    moveReel.push(
      moveReel.length
        ? {
            targetX: moveReel[moveReel.length - 1].targetX,
            targetY: moveReel[moveReel.length - 1].targetY - TILE_SIZE
          }
        : {
            targetX: selectedObject.x,
            targetY: selectedObject.y - TILE_SIZE
          }
    )
  }

  down.press = () => {
    moveReel.push(
      moveReel.length
        ? {
            targetX: moveReel[moveReel.length - 1].targetX,
            targetY: moveReel[moveReel.length - 1].targetY + TILE_SIZE
          }
        : {
            targetX: selectedObject.x,
            targetY: selectedObject.y + TILE_SIZE
          }
    )
  }
}

export function computerTurn() {
  const serverActionsReel = store.getState().serverActionsReel
  if (serverActionsReel.length > 0) {
    const currentReelFrame = serverActionsReel[0]
    switch (currentReelFrame.reelActionType) {
      case 'boatMove':
        const boatToMove = store
          .getState()
          .boats.filter(b => b.id === currentReelFrame.objectId)[0]
        actionsReelBoatMove(boatToMove, currentReelFrame.reelActionDetail)
        viewport.moveCenter(boatToMove.x, boatToMove.y)
        break
      case 'boatBuy':
        // 1: check if this boat exists yet in local boats store.
        // (it only will for boats this player created)
        // if not- dispatch to store to create it with the details in the action
        // (this is necessary in order to render new boats from other players)

        if (
          !store
            .getState()
            .boats.filter(b => b.id === currentReelFrame.objectId)[0]
        ) {
          const {
            objectId,
            playerName,
            reelActionDetail,
            socketId
          } = currentReelFrame
          const boatX = reelActionDetail.x
          const boatY = reelActionDetail.y

          store.dispatch(addBoat(objectId, socketId, playerName, boatX, boatY))
        }

        // 3: dispense of this actionsReel frame and move on
        const updatedServerActionsReel = store
          .getState()
          .serverActionsReel.slice(1)
        store.dispatch(setServerActionsReel(updatedServerActionsReel))
        break
      default:
        // no action
        break
    }
  } else {
    const allBoats = store.getState().boats

    // At the end of actionReel, check for all boats on fishes and have them collect
    allBoats.forEach(boat => ifOnFishCollect(boat, fishes))

    // At the end of actionReel, check for boats near fisheries to have them cash in
    fisheries.filter(f => f.pId === socket.id).forEach(fishery => {
      allBoats.filter(b => b.ownerSocket === socket.id).forEach(boat => {
        if (boatInRangeOfDock(boat, fishery)) {
          for (let key in boat.fishes) {
            if (boat.fishes[key] > 0) {
              store.dispatch(adjustMoney(FISH_VALUES[key] * boat.fishes[key]))
              boat.fishes[key] = 0
            }
          }
        }
      })
    })

    // tell server you're done watching the reel & wait for others to finish
    socket.emit('reel-finished')
    store.dispatch(setPixiGameState('waitForNextTurn'))
  }

  function actionsReelBoatMove(boat, reel) {
    const moveReel = reel

    if (moveReel.length > 0) {
      // set boat's target to the first frame in the moveReel
      const targetX = moveReel[0].targetX
      const targetY = moveReel[0].targetY

      // speed is set to 0.5 for nice slow movement; higher for faster testing
      boat.vx = Math.sign(targetX - boat.x) * 1
      boat.vy = Math.sign(targetY - boat.y) * 1

      if (boat.x !== targetX || boat.y !== targetY) {
        // Move the boat until it reaches the destination for this moveReel frame.
        // VERY IMPORTANT and we may want to handle this with having the gameState
        // script run individual entities' own state scripts each frame - not only
        // do you need the boat pbject to move, you need to make sure its sprite
        // moves with it
        boat.x += boat.vx
        boat.sprite.x = boat.x
        boat.y += boat.vy
        boat.sprite.y = boat.y
      } else {
        // stop the boat & dispose of this moveReel frame
        boat.vx = 0
        boat.vy = 0
        moveReel.shift()
      }
    } else {
      // dispense of this actionsReel frame and move on
      const updatedServerActionsReel = store
        .getState()
        .serverActionsReel.slice(1)
      store.dispatch(setServerActionsReel(updatedServerActionsReel))
    }
  }
}

export function waitForNextTurn() {}
