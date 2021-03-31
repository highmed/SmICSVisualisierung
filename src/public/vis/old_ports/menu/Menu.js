import React from "react"
import globals from "../_globals.js"
import moment from "moment"

import "./css/menu.css"
import "../_styles/container.css"
import { RefreshBUTTON, minimize_button } from "../_styles.js"

class Menu extends React.Component {
  constructor(props) {
    super(props)

    this.id = globals.newComponentID()

    this.updateTimeStamp = this.updateTimeStamp.bind(this)

    this.state = {
      timeStamp: undefined,
      maximize: true,
    }
  }

  updateTimeStamp() {
    // moment.locale("de");
    // let newTime = "???";
    // if(this.props.data.available) {
    //     newTime = moment().format("LL");
    // }
    // if(this.props.data.loading) {
    //     newTime = "Lädt...";
    // }
    // if(this.props.data.error) {
    //     newTime = "ERROR";
    // }
    // this.setState(prevState => {
    //     return {
    //         timeStamp: newTime
    //     };
    // });
  }

  minimize_maximize = () => {
    this.setState((prevState) => {
      prevState.maximize = !prevState.maximize
      return prevState
    })
  }

  download_svg = () => {
    let self = this

    console.log("Downloading SVG as .svg-file")
    let svgData = self.props.svg.outerHTML
    let svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
    let svgUrl = URL.createObjectURL(svgBlob)
    let downloadLink = document.createElement("a")
    downloadLink.href = svgUrl
    downloadLink.download = "svg_name.svg"
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }

  render() {
    let self = this
    moment.locale("de")
    let newTime = undefined
    if (this.props.data.available) {
      newTime = moment().format("LL")
    }
    if (this.props.data.loading) {
      newTime = "Lädt..."
    }
    if (this.props.data.error) {
      newTime = "ERROR"
    }

    let inputs = []
    if (this.props.inputs) {
      this.props.inputs.forEach((element) => {
        switch (element) {
          case "time":
            break

          default:
            inputs.push(<div>{element.toString()}</div>)
            break
        }
      })
    }

    let filter = []

    if (this.props.filter) {
      this.props.filter.forEach((element) => {
        filter.push(
          <span className="filterValueTEMP">
            {element.name}: {element.value}
          </span>
        )
      })
    }

    let menu_inhalt = null
    if (this.state.maximize) {
      menu_inhalt = this.props.children
    } else {
      let fitlered_children = this.props.children.filter(
        (d) => d.props.legende === true
      )
      if (fitlered_children.length > 0) {
        menu_inhalt = fitlered_children
      }
    }

    return (
      <div
        className="menuContainer"
        // style={this.state.maximize ? {} : { maxHeight: 0 }}
        onClick={this.clickFunction}
        // style={{ display: self.state.maximize ? "" : "none" }}
      >
        {/* {this.state.maximize ? ( */}
        <button className="minimizeButton" onClick={this.minimize_maximize}>
          {this.state.maximize ? (
            <i class="fa fa-arrow-up" aria-hidden="true"></i>
          ) : (
            <i class="fa fa-arrow-down" aria-hidden="true"></i>
          )}
        </button>
        <button className="downloadButton" onClick={this.download_svg}>
          <i class="fa fa-download" aria-hidden="true"></i>
        </button>
        {/* ) : null} */}
        {/* <div>
                    <div>Filter1</div>
                    <div>{this.props.standort}</div>
                    <div>{this.props.zeitraum}</div>
                </div>
                {this.props.children ? this.props.children : <div />} */}
        {menu_inhalt}
        <div />
        {/* {filter}
                <div style={{ width: "20px;" }} /> */}
        {/* {this.state.maximize ? ( */}
        <RefreshBUTTON onClick={this.props.callback}>
          <i aria-hidden="true" className="fa fa-refresh"></i>
        </RefreshBUTTON>
        {/* ) : null} */}
        {/* <button className="refreshButton" onClick={this.props.callback}><i aria-hidden="true" className="fa fa-refresh"></i></button> */}
      </div>
    )
  }
}
/* {this.props.text ? <div className="textContainerTEMP">
                    <span className="text">{"Daten vom " + this.props.text}</span>
                </div> : (newTime ?
                    (
                        <div>
                            <span className="text">letzte Aktualisierung am: </span>
                            <span className="timeStamp">{newTime}</span>
                        </div>
                    ) :
                    <div>
                        <span className="text">Keine Daten bisher geladen.</span>
                    </div>)} */

export default Menu
