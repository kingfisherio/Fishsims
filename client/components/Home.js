import React from 'react'
import socket from '../socket/index.js'
import {connect} from 'react-redux'
import {withRouter} from 'react-router-dom'

import {setRoute, setName, getTitle} from '../store'

class Home extends React.Component {
  constructor() {
    super()

    this.state = {
      name: ''
    }

    this.newTitle = this.newTitle.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.handlePrivate = this.handlePrivate.bind(this)
  }

  componentDidMount() {
    this.newTitle()
  }

  newTitle() {
    this.props.getTitle()
  }

  handleSubmit(event) {
    event.preventDefault()
    this.props.setName(this.state.name)

    // tells the server we want to join a lobby
    const id = this.props.location.pathname.replace('/', '')
    socket.emit('lobby-me', {name: this.state.name, lobbyId: id})
    this.props.gotoLobby()
  }

  handleChange(event) {
    event.preventDefault()
    this.setState({
      name: event.target.value
    })
  }

  handlePrivate(event) {
    event.preventDefault()
    this.props.setName(this.state.name)
    this.props.history.push('/')
    socket.emit('make-private-lobby', {name: this.state.name})
    this.props.gotoLobby()
  }

  render() {
    const inviteId = this.props.location.pathname.replace('/', '')
    return (
      <div className="content">
        <small>*not actual gameplay footage</small>
        <div className="center-content">
          <div className="title-box">
            <h1>Actual Title Here</h1>
            <h5 onClick={this.newTitle}>"{this.props.title}"</h5>
          </div>
          <form id="start-form" onSubmit={this.handleSubmit}>
            <input
              maxLength="20"
              autoComplete="off"
              onChange={this.handleChange}
              name="fishioname"
              value={this.state.name}
            />
            <button className="btn btn-dark" id="play" type="submit">
              Join {inviteId ? null : 'Random'} Game
            </button>
            <button
              onClick={this.handlePrivate}
              className="btn btn-dark"
              id="play"
              type="button"
            >
              Make Private Game
            </button>
          </form>
        </div>
        <div className="top-left-btns">
          <button
            onClick={() => {
              this.props.gotoLeader()
            }}
            type="button"
            className="btn btn-dark"
          >
            Leaderboards
          </button>
        </div>
      </div>
    )
  }
}

const mapState = state => {
  return {
    title: state.title,
    id: state.lobby.id
  }
}

const mapDispatch = dispatch => {
  return {
    gotoLobby: () => dispatch(setRoute('LOBBY')),
    gotoLeader: () => dispatch(setRoute('LEADERBOARDS')),
    setName: name => dispatch(setName(name)),
    getTitle: () => dispatch(getTitle())
  }
}

export default withRouter(connect(mapState, mapDispatch)(Home))
