import React, { Component } from "react"
import { ModuleContainerDIV, ChartContainerDIV } from "./_styles"
import Menu from "./menu/Menu.js"
import Tooltip from "./tooltip/Tooltip.js"
import ChartOverlay from "./chartOverlay/ChartOverlay.js"
import "./moduleContainer.css"

class ModuleContainer extends Component {
  render() {
    return (
      <ModuleContainerDIV>
        {/* <Menu
          callback={this.props.getData}
          filter={this.props.filterValues}
          data={this.props.data}
          svg={this.svgRoot}
        >
          {this.props.children}
        </Menu> */}
        <ChartContainerDIV
          className="chartContainerDiv"
          ref={(element) => (this.chartContainerDiv = element)}
        >
          {/* <ChartOverlay
            data={this.props.data}
            filterValues={this.props.filterValues}
          /> */}
          {/* <div
            className={
              this.props.scrollableSVG
                ? "svgContainer scrollableSVGcontainer"
                : "svgContainer"
            }
          > */}
          <svg
            className="svgRoot"
            ref={(element) => (this.refSVG = element)}
            style={{ display: "none" }}
          />
          <svg
            className="svgRoot"
            ref={(element) => (this.svgRoot = element)}
          />
          {/* <Tooltip
            info={this.props.info}
            ref={(element) => (this.tooltip = element)}
          /> */}
          {/* </div> */}
        </ChartContainerDIV>
      </ModuleContainerDIV>
    )
  }
}

export default ModuleContainer
