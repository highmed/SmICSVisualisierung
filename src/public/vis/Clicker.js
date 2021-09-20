import React, { Component } from "react"

export default class Clicker extends Component {
  constructor(props) {
    super(props)

    this.state = {
      clicks: 0,
    }
  }

  render() {
    return (
      <div
        onClick={() => {
          this.setState(
            (prevState) => (prevState.clicks = prevState.clicks + 1)
          )
        }}
      >
        {this.state.clicks}
      </div>
    )
  }
}
