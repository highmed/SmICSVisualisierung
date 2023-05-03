import { Component } from "react"
import PropTypes from "prop-types"

import Button from "@material-ui/core/Button"
import BarChartIcon from "@material-ui/icons/BarChart"
import HomeIcon from "@material-ui/icons/Home"
import IconButton from "@material-ui/core/IconButton"
import TextField from "@material-ui/core/TextField"
import AutorenewIcon from "@material-ui/icons/Autorenew"
import CloudDownloadIcon from "@material-ui/icons/CloudDownload"
import DeleteForeverIcon from "@material-ui/icons/DeleteForever"
import ExitToApp from "@material-ui/icons/ExitToApp"
import HelpOutlineIcon from "@material-ui/icons/HelpOutline"
import LooksTwo from "@material-ui/icons/LooksTwo"

// import ManageHistoryIcon from "@mui/icons-material/ManageHistory"
import RestoreIcon from "@mui/icons-material/Restore"
import DownloadIcon from "@mui/icons-material/Download"

import { withAuth } from "../hooks/auth"
import { withRouter } from "react-router-dom"
import "./scss/sideMenu.scss"

import "./../hooks/socket"

class SideMenu extends Component {
  // static propTypes = {
  //   match: PropTypes.object.isRequired,
  //   location: PropTypes.object.isRequired,
  //   history: PropTypes.object.isRequired
  // };

  constructor(props) {
    super(props)

    this.state = {}
    this.hostname = window.location.hostname
    this.protocol = window.location.protocol
    // this.port = window.smics_port ? window.smics_port : 9999
    // this.port = props.get_smics_port()

    this.translate = props.translate
  }

  create_button = (name, symbol, callback, className, toggled) => {
    let variant = toggled ? "outlined" : "contained"

    let classn = "sidemenu-button"
    if (className) {
      classn += " " + className
    }

    return (
      <Button
        className={classn}
        key={name}
        title={name}
        style={{ minWidth: "10px", width: "40px" }}
        variant={variant}
        onClick={() => {
          callback()
        }}
      >
        {symbol}
      </Button>
    )
  }

  downloadFile = (myData) => {
    // create file in browser
    const fileName = "paras-and-filter"
    const json = JSON.stringify(myData, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const href = URL.createObjectURL(blob)

    // create "a" HTLM element with href to file
    const link = document.createElement("a")
    link.href = href
    link.download = fileName + ".json"
    document.body.appendChild(link)
    link.click()

    // clean up "a" element & remove ObjectURL
    document.body.removeChild(link)
    URL.revokeObjectURL(href)
  }

  render = () => {
    let self = this

    let requestData = this.create_button(
      this.translate("loadData"),
      <AutorenewIcon />,
      this.props.requestVisData
    )

    // !DEV: nur zum debuggen benötigt
    let showCache = this.create_button(
      this.translate("showCache"),
      <CloudDownloadIcon />,
      this.props.requestCacheData
    )

    let deleteCache = this.create_button(
      this.translate("deleteCache"),
      <DeleteForeverIcon />,
      this.props.clearCache
    )

    let help_legend = this.create_button(
      this.translate("help_legend"),
      <HelpOutlineIcon />,
      this.props.toggle_global_legend,
      "help_legend_button",
      this.props.global_legend
    )

    let predRisk = this.create_button(
      this.translate("predRisk"),
      <LooksTwo />,
      () => {
        window.open(window.location.origin + "/predRisk", "_blank")
      }
    )

    let logout = this.create_button(
      this.translate("Logout"),
      <ExitToApp />,
      () => {
        window.location.href = window.location.origin + "/logout"
      },
      "logout_button"
    )

    let statistic_module = this.create_button(
      this.translate("statistic_module"),
      // <BarChartIcon />,
      <HomeIcon />,
      () => {
        // console.log("STATISTIC MODULE BUTTON PRESSED")
        window.open(
          this.protocol +
            "//" +
            this.hostname +
            ":" +
            this.props.get_smics_port(),
          "_blank"
        )
      },
      "static_module_button"
    )

    let change_language = this.create_button(
      this.translate("change_language"),
      <div>{this.props.selectedLang}</div>,
      this.props.change_to_next_language,
      "change_language_button"
    )

    let buttons = [
      // requestData,
      statistic_module,
      change_language,
      help_legend,
      // showCache,
      // predRisk,
      // deleteCache,
      logout,
    ]

    let sidemenu_buttons = (
      <div key="sidemenu_buttons" className="sidemenu-item_container">
        {buttons}
      </div>
    )

    let all_states = []

    // for (let i = 0; i < 99; i++) {
    //   all_states.push(
    //     <div className="state_item" key={"state" + i}>
    //       {"State number " + i}
    //     </div>
    //   )
    // }

    let current_ts = new Date().getTime()
    let seen_data_hashes = []
    this.props.saved_states.forEach((state, i) => {
      let ts_diff = (current_ts - state.timestamp) / 1000

      let seconds = Math.floor(ts_diff) % 60
      let minutes = Math.floor(ts_diff / 60) % 60
      let hours = Math.floor(ts_diff / 60 / 60)
      let days = Math.floor(ts_diff / 60 / 60 / 24)

      let time_display = ""

      if (days > 0) {
        time_display += days + "d"
      } else if (hours > 0) {
        time_display += hours + "h"
      } else if (minutes > 0) {
        time_display += minutes + "m"
      } else {
        time_display += seconds + "s"
      }

      let border_col = "black"
      let back_col = "white"

      if (!seen_data_hashes.includes(state.parameters_hash)) {
        seen_data_hashes.push(state.parameters_hash)
      }

      let parameters_hash_index = seen_data_hashes.findIndex(
        (d) => d === state.parameters_hash
      )
      let col_val = Math.max(255 - parameters_hash_index * 25, 150)
      back_col = `rgb(${col_val},${col_val},${col_val})`

      if (parameters_hash_index > 0) {
        border_col = "white"
      }

      let style = {
        borderColor: border_col,
        backgroundColor: back_col,
      }

      all_states.push(
        <div
          style={style}
          className="state_item"
          key={
            "saved_state_" +
            state.timestamp +
            state.description +
            state.new_value
          }
        >
          <div className="state_description">
            {this.translate(state.description) + ":"}
          </div>
          <div className="state_value">{state.new_value}</div>
          <div className="timegone">{time_display}</div>
          <Button
            className={"restore"}
            key={"restorebutton"}
            title={"Restore"}
            style={{
              minWidth: "10px",
              width: "25px",
              minHeight: "10px",
              height: "25px",
            }}
            variant={"contained"}
            onClick={() => {
              // console.log(state)
              this.props.reload_state(
                // state.parameter_values,
                // state.filter_values,
                // state.parameters_hash,
                // state.new_value
                state
              )
            }}
          >
            <RestoreIcon />
          </Button>
          <Button
            className={"download"}
            key={"downloadbutton"}
            title={"Download"}
            style={{
              minWidth: "10px",
              width: "25px",
              minHeight: "10px",
              height: "25px",
            }}
            variant={"contained"}
            onClick={() => {
              // console.log(state)
              this.downloadFile(state)
            }}
          >
            <DownloadIcon />
          </Button>
        </div>
      )
    })

    let list_of_states = (
      <div key="list_of_states" className="sidemenu-item_container">
        {all_states}
      </div>
    )

    let ui_elements = [sidemenu_buttons, list_of_states]

    let ui_elements_spaced = []

    // ui_elements.forEach((uie, i) => {
    //   ui_elements_spaced.push(uie)
    //   if (i < ui_elements.length - 1) {
    //     ui_elements_spaced.push(<div className="space-div" />)
    //   }
    // })

    return (
      <div id={this.props.id} className="sidemenu-container">
        {ui_elements}
      </div>
    )
  }
}

export default SideMenu
