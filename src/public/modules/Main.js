
import * as d3 from "d3"
import React, { Component } from "react"
import { hot } from "react-hot-loader"
import PropTypes from "prop-types"

// import Grid_LM from "./Grid_LM"
// import Histogram from "../vis/Histogram"
// import Drawer from "@material-ui/core/Drawer"
// import DataRow from "../components/DataRow"
// import logo_svg from "../assets/highmed_logo.svg"
// import tud_svg from "../assets/TU_Darmstadt_Logo.svg"

import HeaderMenu from "../components/HeaderMenu"
import LegendWindow from "./LegendWindow"
import Mosaic_LM from "./Mosaic_LM"
import * as Translator from "./translator.json"
import { withSocket } from "../hooks/socket"

import "./scss/main.scss"

class Main extends Component {

  constructor(props) {
    super(props)
    this.socket = props.socket.client

    this.defaults = "production"

    // TODO: das ist irgendwie hingehackt...
    this.lm = (
      <Mosaic_LM
        key="MEIN_LM"
        {...this.state}
        update_tooltip={this.update_tooltip}
        move_tooltip={this.move_tooltip}
        hide_tooltip={this.hide_tooltip}
        show_tooltip={this.show_tooltip}
        translate={this.translate}
      />
    )

    this.columns = 1

    this.state = {
      selectedLang: "cov",
      global_legend: false,
      tooltip: {
        content: null,
        display: "none",
        // position: {
        //   top: "auto",
        //   bottom: "auto",
        //   left: "auto",
        //   right: "auto",
        // },
      },
      data: [],
      selected_page: "home",
      parameters: {
        // starttime: "2011-05-01",
        // endtime: "2012-04-30",
        // // patientList: ["62411", "63104", "63842"],
        // patientList_string: "62411,63104,63842",
        // // pathogenList: ["732", "869"],
        // pathogenList_string: "732,869",
        // // station: ["295", "434"],
        // station_string: "295,434",
        hospital: "1",
        degree: 1,
      },
    }

    this.defaultParameters = {
      production: {
        starttime: "2021-01-01",
        endtime: "2021-01-10",
        patientList_string: "c74f6215-4fc2-42a5-a3ad-f92536ca64dc",
        pathogenList_string: "sars-cov-2",
        station_string: "Coronastation",
        patientID: "c74f6215-4fc2-42a5-a3ad-f92536ca64dc",
      },
      usecase: {
        // starttime: "2011-05-01T20:20:00+00:00",
        // endtime: "2012-04-30T20:20:00+00:00",
        starttime: "2011-05-01",
        endtime: "2012-04-30",
        patientList_string:
          "62411,63104,63842,64716,67867,68475,70448,76101,113749,175082",
        pathogenList_string: "732,869",
        station_string: "295,434",
      },
      pascal: {
        starttime: "2021-01-01",
        endtime: "2021-01-10",
        patientList_string: "c74f6215-4fc2-42a5-a3ad-f92536ca64dc",
        pathogenList_string: "sars-cov-2",
        station_string: "Coronastation",
        patientID: "c74f6215-4fc2-42a5-a3ad-f92536ca64dc",
      },
      christoph: {
        starttime: "2020-01-16",
        endime: "2020-02-20",
        patientList_string:
          "0590f4b9-cb61-41ef-90b9-5589f0051c57,07fa50f5-33bb-4a68-81b1-bed2a205d961,121d517c-823c-4499-9be4-5583ebab2072,19a6c833-eb9d-4484-a243-deac6f503d74,25eacc6e-0b92-47ad-ad87-35f4df2a1f53,275ab5c5-1b9e-4e8b-8afd-0fa7aad03974,31a6e584-3b9a-4b46-a825-13f4fd61988a,359033ea-a23c-40f9-98db-28cd53b6981d,39189f3f-6965-48e8-9a81-a452801a3caf,40e72023-02ab-4561-97d6-f8bc533f9c44,424ab7af-b81b-4ecc-b678-abe4cc128fa6,489870a3-65bd-426f-a961-b0b435e1e7c8,5cedfae5-69d4-4d70-92a9-9c5aebff31d8,6ed70ea6-9a65-4c8b-8d08-488787c3e91e,710e4312-092e-47f5-9330-9527c70d46d6,7244c015-16ae-4c7a-a076-2fc737e482e2,72801f9a-c4eb-44f2-90ae-9505ff350fcf,a0fa9e58-8c40-4576-b293-6d84decd5db9,a41421bf-9917-4ac3-be75-2f821327579d,aabc9934-acec-490b-8860-72e05c755038,abeab0bb-b5b3-4668-a5d5-215b33cc86bb,b24b7417-60a6-49ae-a722-4c1853b55d7f,b58f9309-f23e-4c3a-9fa0-d9f3ed3e150f,d2d0d9cf-2070-46dd-9900-921948c2d669,d41490c2-10af-4b51-a0e6-d24da5bc27f2,d4e1bab1-4756-4e43-9fe5-0e7ff6d449d6,db14dbad-3f49-4c96-b7f3-ca867d403b52,dffb8e49-75d0-4d9f-8ff0-e755b8668822,e4a2ee11-358b-49fb-94dc-872fdd681420,e9af5f68-361c-4438-b176-e6e7c82b8800,f11f472a-03fc-42e8-8ac5-8c86a93bb095,fb45f344-d3b8-4e46-abda-727ae24407e4,fbb60bcf-f942-40c0-8eae-ce138850f46a,fc60eaf8-ce31-4dd0-a37b-9f39f7814ec0",
      },
      pathogenList_string: "COV",
      station_string: "Station 14",
    }
  }

  translate = (key) => {
    let language = this.props.selectedLang

    // TODO: solange noch keine language-selection implementiert ist...
    // TODO: bzw. Covid-Projekt...
    if (language === undefined) {
      language = "cov"
      // language = this.props.selectedLang
    }

    let translation = Translator.default[key]

    if (translation === undefined) {
      console.error(`There is no translation for '${key}'.`)
      return key
    }

    translation = translation[language]
    if (translation === undefined) {
      console.error(
        `There is no translation for '${key}' in language '${language}'.`
      )
      return key
    }

    return translation
  }

  toggle_global_legend = () => {
    this.setState((prevState) => {
      prevState.global_legend = !prevState.global_legend
      return prevState
    })
  }

  change_starttime = (e) => {
    let new_value = e.target.value
    this.setState((prevState) => {
      prevState.parameters.starttime = new_value
      return prevState
    })
  }

  change_endtime = (e) => {
    let new_value = e.target.value
    this.setState((prevState) => {
      prevState.parameters.endtime = new_value
      return prevState
    })
  }

  // TODO: SMICS-0.8
  // TODO: nach comma separation gehen und daraus array machen
  // TODO: und keine Leerzeichen etc
  change_contactPatient = (e) => {
    let new_value = e.target.value
    this.setState((prevState) => {
      prevState.parameters.patientID = new_value
      // prevState.parameters.patientList = new_value.split(",")
      return prevState
    })
  }

  // TODO: nach comma separation gehen und daraus array machen
  // TODO: und keine Leerzeichen etc
  change_patientList = (e) => {
    let new_value = e.target.value
    this.setState((prevState) => {
      prevState.parameters.patientList_string = new_value
      // prevState.parameters.patientList = new_value.split(",")
      return prevState
    })
  }

  // TODO: nach comma separation gehen und daraus array machen
  // TODO: und keine Leerzeichen etc
  change_pathogenList = (e) => {
    let new_value = e.target.value
    this.setState((prevState) => {
      prevState.parameters.pathogenList_string = new_value
      // prevState.parameters.pathogenList = new_value.split(",")
      return prevState
    })
  }

  // TODO: nach comma separation gehen und daraus array machen
  // TODO: und keine Leerzeichen etc
  change_stationList = (e) => {
    let new_value = e.target.value
    this.setState((prevState) => {
      prevState.parameters.station_string = new_value
      // prevState.parameters.station = new_value.split(",")
      return prevState
    })
  }

  componentDidMount = () => {
    let self = this
    console.log("did mount")

    self.socket.on("dataResult", self.handleData)
    self.socket.on("dataError", (data) => {
      console.error(data)
    })
    self.socket.on("cacheData", (data) => {
      console.log("cache data")
      console.log(data)
    })

    // setTimeout(() => {
    this.setState((prevState) => {
      prevState.parameters = {
        ...prevState.parameters,
        ...this.defaultParameters[this.defaults],
      }

      return prevState
    })
    // }, 500)

    // this.intervalFunction = setInterval(() => {
    //   self.old_requestData()
    // }, 2000)
  }

  componentWillUnmount = () => {
    let self = this

    // self.socket.off("dataResult")
    clearInterval(self.intervalFunction)
  }

  handleData = (data) => {
    let self = this
    console.log("Fresh data from Webserver:")
    console.log(data)

    self.setState((prevState) => {
      prevState.data.push(data)
      return prevState
    })
  }

  switch_page = (page) => {
    this.setState({ selected_page: page })
  }

  requestCacheData = () => {
    let self = this
    console.log("requesting all cached data")

    // TODO: implement get cache data
    self.socket.emit("getCacheData", {})
  }

  requestNewVisData = () => {
    let self = this
    console.log("requesting NEW is data")

    self.requestVisData(true)
  }

  clearCache = () => {
    let self = this
    console.log("clear cache!")

    self.socket.emit("clearCache", {})
  }

  requestVisData = (load_new) => {
    let self = this
    console.log("requesting vis data")

    let request_parameters = {
      // dataSourceIdentifier: "hmhdnov18_sql",
      dataSourceIdentifier: "rest",
      openModuleNames: [
        // "annotationTimeline",
        "linelist",
        "epikurve",
        "kontaktnetzwerk",
      ],
      allModuleNames: [
        // "annotationTimeline",
        "linelist",
        // "storyline",
        "epikurve",
        "kontaktnetzwerk",
      ],
      // parameters: this.defaultParameters,
      // parameters: this.state.parameters,
      parameters: {
        patientList: this.state.parameters.patientList_string.split(","),
        pathogenList: this.state.parameters.pathogenList_string.split(","),
        station: this.state.parameters.station_string.split(","),
        ...this.state.parameters,
      },
      load_new,
      // parameters: {
      //   ts_begin: "",
      //   ts_end: "",
      //   pathogenList: ["1", "2"],
      //   patientList: ["123", "456"],
      // },
    }

    console.log(request_parameters)

    // TODO: ermitteln welche Module offen sind...
    self.socket.emit("getVisData", request_parameters)
  }

  filter_inputs = () => {
    return <div>filter inputs</div>
  }
  move_tooltip = () => {
    // console.log("move tooltip")
    // abchecken, in welchem Quadranten des Fensters sich der Mauszeiger befindet, umd den Tooltip Punktsymetrisch dazu Positionieren
    let mousePosX = d3.event.pageX
    let mousePosY = d3.event.pageY
    let windowX = window.innerWidth
    let windowY = window.innerHeight

    let xPos1 = mousePosX + 10 + "px"
    let xPos2 = "auto"
    let yPos1 = mousePosY + 10 + "px"
    let yPos2 = "auto"

    if (mousePosX > windowX / 2) {
      xPos1 = "auto"
      xPos2 = windowX - mousePosX + 10 + "px"
    }
    if (mousePosY > windowY / 2) {
      yPos1 = "auto"
      yPos2 = windowY - mousePosY + 10 + "px"
    }

    // FÜR DEMO:
    // xPos1 = mousePosX + 10 + "px";
    // xPos2 = "auto";
    // yPos1 = "auto";
    // yPos2 = windowY - mousePosY + 10 + "px";

    // this.tooltip
    d3.select(this.tooltipDiv)
      // .style("right", windowX - mousePosX - 40 + "px")
      // .style("bottom", windowY - mousePosY + 20 + "px")
      .style("top", yPos1)
      .style("left", xPos1)
      .style("bottom", yPos2)
      .style("right", xPos2)
    // .style("left", d3.event.pageX - 40 + "px")
    // .style("top", d3.event.pageY + 20 + "px")
    // .style("display", "inline-block")
  }

  show_tooltip = () => {
    this.setState((prevState) => (prevState.tooltip.display = "inline-block"))
  }

  hide_tooltip = () => {
    this.setState((prevState) => (prevState.tooltip.display = "none"))
  }

  componentDidUpdate() {
    d3.select(this.tooltipDiv)
      .selectAll(".titleTD")
      .attr("colspan", this.columns)
  }

  // TODO: das ist copy pasted vom alten Dashboard...
  update_tooltip = (new_content) => {
    let tableDiv = []
    let self = this
    self.key = 0
    new_content.forEach((element, i) => {
      // Wenn das Element ueberhaupt definiert ist
      if (element !== undefined && element !== null) {
        // Wenn das Element keinen Content hat, wird es als String angezeigt
        if (element.content) {
          // Wenn der Content ein leeres array ist, ueberspringen
          if (
            !Array.isArray(element.content) ||
            (Array.isArray(element.content) && element.content.length >= 1)
          ) {
            // Falls Titel, diesen hinzufuegen
            if (element.title) {
              let col = element.header_color ? element.header_color : "#aaaaaa"

              tableDiv.push(
                <tr key={"titletr" + i}>
                  <td
                    className="titleTD"
                    style={{ background: col, color: "white" }}
                  >
                    <div>{String(element.title)}</div>
                  </td>
                </tr>
              )
              self.key = self.key + 1
            }
            let trArray = []
            // Falls Tabelle header haben soll
            if (element.header) {
              // wenn header ein array ist, muss es groesser 0 sein sonst ueberspringen
              if (Array.isArray(element.header) && element.header.length >= 1) {
                if (self.columns < element.header.length) {
                  self.columns = element.header.length
                }
                let thArray = []
                element.header.forEach((e, g) => {
                  thArray.push(
                    <th key={"headerth" + i + "and" + g}>{String(e)}</th>
                  )
                  self.key = self.key + 1
                })
                trArray.push(<tr key={"headertr" + i}>{thArray}</tr>)
                self.key = self.key + 1
                // Ansonsten wenn header kein array ist
              } else if (!Array.isArray(element.header)) {
                if (self.columns < 1) {
                  self.columns = 1
                }
                trArray.push(
                  <tr key={"headernotarray" + i}>
                    <th>{String(element.header)}</th>
                  </tr>
                )
                self.key = self.key + 1
              } else {
                console.error(
                  element.header + " is no valid parameter for header."
                )
              }
            }

            if (Array.isArray(element.content)) {
              // Jede Iteration ist eine Zeile
              // Jede zeile kann entweder ein element sein (= ein element in der zeile) oder auch ein array aus mehreren spalten
              element.content.forEach((e, k) => {
                let tdArray = []

                if (e && Array.isArray(e)) {
                  if (self.columns < Math.min(1, e.length)) {
                    self.columns = Math.min(1, e.length)
                  }
                  if (e.length === 0) {
                    tdArray.push(
                      <td key={"contenttd" + i + "and" + k}>noData</td>
                    )
                    self.key = self.key + 1
                  } else {
                    e.forEach((e2, m) => {
                      tdArray.push(
                        <td key={"contenttd" + i + "and" + k + "and" + m}>
                          {String(e2)}
                        </td>
                      )
                      self.key = self.key + 1
                    })
                  }
                } else {
                  tdArray.push(
                    <td key={"contenttd" + i + "and" + k}>{String(e)}</td>
                  )
                  self.key = self.key + 1
                }
                trArray.push(
                  <tr key={"contenttr" + i + "and" + k}>{tdArray}</tr>
                )
                self.key = self.key + 1
              })
              // Wenn content nicht aus einem array besteht = 1 element
            } else {
              trArray.push(
                <tr key={"contenttr" + i}>
                  <td>{String(element.content)}</td>
                </tr>
              )
              self.key = self.key + 1
            }
            tableDiv.push(trArray)
          } else {
            console.error(
              element.content + " is no valid parameter for content."
            )
          }
        } else {
          tableDiv.push(
            <tr key={"contenttr" + i}>
              <td>{element}</td>
            </tr>
          )
          self.key = self.key + 1
          console.error("No content for tooltip-table to display.")
        }
      } else {
        console.error(element + " not defined.")
      }
    })

    tableDiv = (
      <table className="tooltipTable">
        <tbody>{tableDiv}</tbody>
      </table>
    )

    tableDiv = <div className="tableDiv">{tableDiv}</div>
    this.setState((prevState) => (prevState.tooltip.content = tableDiv))
  }

  render() {
    let self = this
    // let rows = []
    // self.state.data.forEach((e) => {
    //   rows.push(<DataRow value={e} />)
    // })

    // return <div className="testdiv">{rows}</div>
    return (
      <div id="main">
        <div className="header">
          {/* <img
            className="HiGhmed_Logo"
            alt="HiGhmed_Logo"
            id="HiGhmed_Logo"
            onClick={() =>
              window.open("http://highmed.org/about/use-cases/", "_blank")
            }
            src={logo_svg}
          /> */}
          <HeaderMenu
            id="header_menu"
            // switch_page={this.switch_page}
            {...this.state}
            requestVisData={this.requestVisData}
            requestNewVisData={this.requestNewVisData}
            requestCacheData={this.requestCacheData}
            clearCache={this.clearCache}
            change_starttime={this.change_starttime}
            change_endtime={this.change_endtime}
            change_patientList={this.change_patientList}
            change_pathogenList={this.change_pathogenList}
            change_stationList={this.change_stationList}
            toggle_global_legend={this.toggle_global_legend}
            // TODO: SMICS-0.8
            change_contactPatient={this.change_contactPatient}
            translate={this.translate}
          />
          {/* <img
            className="TU_Darmstadt_Logo"
            alt="TU_Darmstadt_Logo"
            id="TU_Darmstadt_Logo"
            onClick={() =>
              window.open(
                "http://www.gris.tu-darmstadt.de/research/vissearch/index.en.htm",
                "_blank"
              )
            }
            src={tud_svg}
          /> */}
        </div>
        <div className="content">
          {/* <Drawer
            variant="persistent"
            anchor={"left"}
            open={true}
            // onClose={toggleDrawer("left", false)}
          >
            {this.filter_inputs()}
          </Drawer> */}
          {this.lm}
          {/* <Mosaic_LM
            key="MEIN_LM"
            {...this.state}
            socket={this.socket}
            update_tooltip={this.update_tooltip}
            move_tooltip={this.move_tooltip}
            hide_tooltip={this.hide_tooltip}
            show_tooltip={this.show_tooltip}
          /> */}
        </div>
        {/* <div className="content">
          {this.state.selected_page === "mosaic" ? (
            <Mosaic_LM socket={this.socket} />
          ) : this.state.selected_page === "grid" ? (
            <Grid_LM />
          ) : this.state.selected_page === "histogram" ? (
            <Histogram />
          ) : (
            rows
          )}
        </div> */}
        <div
          className="tooltip"
          style={{ display: this.state.tooltip.display }}
          ref={(element) => (this.tooltipDiv = element)}
        >
          {this.state.tooltip.content}
        </div>
        <LegendWindow {...this.state} translate={this.translate} />
        <div className="footer" />
      </div>
    )
  }
}

Main.propTypes = {
  socket: PropTypes.object.isRequired
}

export default hot(module)(withSocket(Main))
