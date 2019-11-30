import React from 'react'
import {connect} from 'react-redux'
import store, {addBoat, setPixiGameState, addActionToReel} from '../store'
import socket from '../socket'

class ControlPanel extends React.Component {
  constructor() {
    super()
    this.handleBuyBoat = this.handleBuyBoat.bind(this)
    this.handleChangeTurn = this.handleChangeTurn.bind(this)
    this.handleCommitMovesToReel = this.handleCommitMovesToReel.bind(this)
  }

  handleBuyBoat() {
    // This needs to be upgraded to place the boat near the current player's fishery.
    store.dispatch(addBoat(this.props.player.name))
  }

  handleCommitMovesToReel() {
    // This is just here to demonstrate what needs to happen after a user selects a boat destination, in order for its moves to be committed to the overall actionsReel that is sent to the server. To use it: 1) make sure you're on playerTurn; 2) select a boat; 3) click arrow keys to plan moves; 4) click 'Commit Moves to Reel'. You can plan moves for several boats before ending playerTurn, just make sure you commit each one's moves before selecting another boat.

    const {selectedObject, addAction} = this.props

    if (selectedObject.moveReel) {
      addAction(selectedObject, 'boatMove', selectedObject.moveReel)
    }
  }

  handleChangeTurn() {
    // Turn data will be sent to the server to aggregate for computer turn

    if (this.props.pixiGameState === 'playerTurn') {
      const turnData = {
        actionsReel: this.props.actionsReel
      }

      socket.emit('end-turn', turnData)
    }

    // this.props.setPixiGameState(
    //   this.props.pixiGameState === 'playerTurn' ? 'computerTurn' : 'playerTurn'
    // )
  }

  render() {
    const {name, dubloons} = this.props.player
    const pixiGameState = this.props.pixiGameState

    return (
      <div id="controlPanel">
        <div>
          <div>You are: {name}</div>
          <div>Dubloons: {dubloons}d</div>
        </div>
        <button type="button" name="buyBoat" onClick={this.handleBuyBoat}>
          Buy Boat (500d)
        </button>
        <button
          type="button"
          name="commitMoves"
          onClick={this.handleCommitMovesToReel}
        >
          Commit selectd object's moves to reel
        </button>
        <button type="button" name="changeTurn" onClick={this.handleChangeTurn}>
          End {pixiGameState}
        </button>
      </div>
    )
  }
}

const mapState = state => {
  return {
    player: state.player,
    pixiGameState: state.pixiGameState,
    selectedObject: state.selectedObject,
    actionsReel: state.actionsReel
  }
}

const mapDispatch = dispatch => {
  return {
    setPixiGameState: state => dispatch(setPixiGameState(state)),
    addAction: (object, reelActionType, reelActionDetail) =>
      dispatch(addActionToReel(object, reelActionType, reelActionDetail))
  }
}

export default connect(mapState, mapDispatch)(ControlPanel)
