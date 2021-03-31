import React, { Component } from "react"
import "./chartOverlay.css"
import globals from "./_globals.js"
import { hot } from "react-hot-loader"

class ChartOverlay extends Component {
  constructor(props) {
    super(props)

    this.id = globals.newComponentID()
    this.state = {
      data: [],
    }
  }

  componentWillMount() {}

  componentWillUnmount() {}

  render() {
    let classString = "overlayDiv"
    if (this.props.data.loading) {
      classString += " loading"
    }
    if (this.props.data.available) {
      classString += " available"
    }
    if (this.props.data.error) {
      classString += " error"
    }
    let missingParam = []
    let paramMissing = false // MISSINGTODO
    if (
      this.props.data.missingParam &&
      this.props.data.missingParam.length > 0
    ) {
      // paramMissing = true;
      classString += "missingParam"
      this.props.data.missingParam.forEach((element) => {
        missingParam.push(<div key={element}>{element}</div>)
      })
    }

    let errorString = undefined
    if (this.props.data.error) {
      console.error("ERROR", this.props.data.error)
      errorString = JSON.stringify(this.props.data.error)
    }

    const loadingCircle = <div className="loadingCircle" />

    // let filterTable = "Keine Daten bisher geladen."
    // let filterTable = "- - -"
    let filterTable = ""
    // let filterTable = self.props.translate("noDataLoaded")

    if (this.props.filterValues && this.props.filterValues.length > 0) {
      let filterValuesTRs = []
      this.props.filterValues.forEach((element) => {
        filterValuesTRs.push(
          <tr key={element.name}>
            <td>{element.name + ":"}</td>
            <td>{element.value}</td>
          </tr>
        )
      })
      filterTable = (
        <div>
          <span>Keine Daten für folgende Paramter:</span>
          <table>
            <tbody>{filterValuesTRs}</tbody>
          </table>
        </div>
      )
    }

    return (
      <div
        className={classString}
        ref={(element) => {
          this.overlayDiv = element
        }}
      >
        {/* {errorString ? errorString : (this.props.data.loading ? loadingCircle : "Keine Daten vorhanden.")} */}
        {paramMissing
          ? missingParam
          : errorString
          ? errorString
          : this.props.data.loading
          ? loadingCircle
          : filterTable}
      </div>
    )
  }
}

export default hot(module)(ChartOverlay)
