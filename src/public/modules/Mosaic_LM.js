import React from "react"
import { Component } from "react"
import { Mosaic, MosaicWindow } from "react-mosaic-component"
import Histogram from "../vis/Histogram"
import Histogram2 from "../vis/Histogram2"
// import Histogram3 from "../vis/Histogram3"
import Clicker from "../vis/Clicker"
import * as vis_configs from "./vis_configs.json"

import LineList from "../vis/Linelist"
// import LineList from "../vis/old_ports/Linelist"
import Epikurve from "../vis/old_ports/Epikurve"
import Kontaktnetzwerk from "../vis/Kontaktnetzwerk"
import AnnotationTimeline from "../vis/AnnotationTimeline"

import "react-mosaic-component/react-mosaic-component.css"
import "@blueprintjs/core/lib/css/blueprint.css"
import "@blueprintjs/icons/lib/css/blueprint-icons.css"

import { withSocket } from "../hooks/socket"
import "./scss/mosaic_lm.scss"

/**
 * https://github.com/nomcopter/react-mosaic
 *
 * Demo:
 * https://nomcopter.github.io/react-mosaic/
 *
 * Demo Code:
 * https://github.com/nomcopter/react-mosaic/blob/master/demo/ExampleApp.tsx
 */

const ELEMENT_MAP = {
  // a: <div>Left Window</div>,
  // b: <div>Top Right Window</div>,
  // c: <div>Bottom Right Window</div>,
  a: <Histogram />,
  b: <Histogram2 />,
  // c: <Histogram3 />,
  c: <LineList />,
  d: <Clicker />,
}

class Mosaic_LM extends Component {
  constructor(props) {
    super(props)

    // this.translate = (key) => key
    this.translate = props.translate

    this.windowCount = 0

    this.ELEMENT_MAP = {
      // a: <div>Left Window</div>,
      // b: <div>Top Right Window</div>,
      // c: <div>Bottom Right Window</div>,
      a: (
        <Epikurve
          {...props}
          get_color={this.get_color}
          // socket={props.socket}
        />
      ),
      b: (
        <AnnotationTimeline
          {...props}
          get_color={this.get_color}
          // socket={props.socket}
        />
      ),
      // c: <Histogram3 />,
      c: (
        <Kontaktnetzwerk
          {...props}
          get_color={this.get_color}
          // socket={props.socket}
        />
      ),
      d: (
        <LineList
          {...props}
          get_color={this.get_color}
          // socket={props.socket}
        />
      ),
    }

    this.viewId = "a" | "b" | "c" | "new"

    this.TITLE_MAP = {
      // a: "Epikurve",
      // b: "Annotation Timeline",
      // c: "Kontaktnetzwerk",
      // d: "Linelist",
      a: this.translate("EpidemieKeim"),
      b: this.translate("AnnotationTimeline"),
      c: this.translate("Kontaktnetzwerk"),
      d: this.translate("Linelist"),
      new: "New Window",
    }
  }

  get_color = (key) => {
    let colors = vis_configs.default.colors

    let col = colors[key]

    return col ? col : "limegreen"
  }

  render() {
    // return <div style={{ width: "100%", height: "100%" }}>Mosaic LM</div>
    return (
      <div style={{ width: "100%", height: "100%" }}>
        <Mosaic
          // renderTile={(id) => this.ELEMENT_MAP[id]}
          renderTile={(id, path) => (
            <MosaicWindow
              path={path}
              // createNode={() => "d"}
              createNode={() => this.windowCount++}
              title={this.TITLE_MAP[id]}
            >
              {/* <h1>{this.TITLE_MAP[id]}</h1> */}
              {this.ELEMENT_MAP[id]}
              {/* <Epikurve translate={this.translate} socket={this.props.socket} /> */}
              {/* <LineList translate={this.translate} socket={this.props.socket} /> */}
              {/* <Kontaktnetzwerk
                translate={this.translate}
                socket={this.props.socket}
              /> */}
            </MosaicWindow>
          )}
          // initialValue={{
          //   direction: "row",
          //   // first: "a",
          //   first: {
          //     direction: "column",
          //     first: "a",
          //     second: "b",
          //   },
          //   second: {
          //     direction: "column",
          //     first: "c",
          //     second: "d",
          //   },
          //   splitPercentage: 40,
          // }}
          initialValue={{
            direction: "row",
            // first: "a",
            second: "c",
            first: {
              direction: "column",
              first: "a",
              second: "d",
              splitPercentage: 50,
            },
            splitPercentage: 60,
          }}
          // initialValue={<Epikurve translate={this.translate} socket={this.props.socket} />}
          // initialValue={
          //   <LineList translate={this.translate} socket={this.props.socket} />
          // }
          // initialValue={
          //   <Kontaktnetzwerk
          //     translate={this.translate}
          //     socket={this.props.socket}
          //   />
          // }
        />
      </div>
    )
  }
}

export default withSocket(Mosaic_LM)
