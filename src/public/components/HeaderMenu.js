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

import { withAuth } from "../hooks/auth"
import { withRouter } from "react-router-dom"
import "./scss/headerMenu.scss"


class HeaderMenu extends Component {
  static propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props)

    this.state = {}
    this.hostname = window.location.hostname
    this.protocol = window.location.protocol
    this.port = 9787

    this.translate = props.translate
  }

  create_button = (name, symbol, callback, toggled) => {
    let variant = toggled ? "outlined" : "contained"
    return (
      <Button
        className="data-button"
        key={name}
        title={name}
        variant={variant}
        onClick={() => {
          callback()
        }}
      >
        {symbol}
      </Button>
    )
  }

  render = () => {
    let self = this
    let buttons = []

    // this.props.buttons.forEach((d) => {
    //   buttons.push(
    //     <Button
    //       className="data-button"
    //       key={d.name}
    //       // color="primary"
    //       variant="contained"
    //       onClick={() => {
    //         d.callback(d.page)
    //       }}
    //     >
    //       {d.name}
    //     </Button>
    //   )
    // })

    // let load_data_button = (
    //   <Button
    //     className="data-button"
    //     key="data-button"
    //     variant="contained"
    //     onClick={() => {
    //       this.props.requestVisData()
    //     }}
    //   >
    //     Load Data
    //   </Button>
    // )

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
      this.props.global_legend
    )

    let logout = this.create_button(
      "Logout user session",
      <ExitToApp />,
      () => {
        window.location.href = window.location.origin + "/logout"
      }
    )

    let statistic_module = this.create_button(
      this.translate("statistic_module"),
      // <BarChartIcon />,
      <HomeIcon />,
      () => {
        // console.log("STATISTIC MODULE BUTTON PRESSED")
        window.open(
          this.protocol + "//" + this.hostname + ":" + this.port,
          "_blank"
        )
      }
    )

    let min_time = (
      <TextField
        key="min_time"
        id="min_time"
        label="Beginn"
        // type="datetime-local"
        // defaultValue="2017-05-24T10:30"
        type="date"
        // defaultValue="2017-05-24"
        format={"dd/MM/yyyy"}
        // className={classes.textField}
        InputLabelProps={{
          shrink: true,
        }}
        value={this.props.parameters.starttime || ""}
        onChange={this.props.change_starttime}
      />
    )

    let max_time = (
      <TextField
        key="max_time"
        id="max_time"
        label="Ende"
        // type="datetime-local"
        // defaultValue="2017-05-24T10:30"
        type="date"
        // defaultValue="2017-05-24"
        format={"dd/MM/yyyy"}
        // className={classes.textField}
        InputLabelProps={{
          shrink: true,
        }}
        value={this.props.parameters.endtime || ""}
        onChange={this.props.change_endtime}
      />
    )

    let patient_selection = (
      <TextField
        id="patient_selection"
        key="patient_selection"
        label="Patienten (Historie)"
        // helperText="Patienten-IDs"
        // variant="outlined"
        value={this.props.parameters.patientList_string || ""}
        onChange={this.props.change_patientList}
        // InputLabelProps={{
        //   shrink: true,
        // }}
      />
    )

    let contact_patient_selection = (
      <TextField
        id="contact_patient_selection"
        key="contact_patient_selection"
        label="Patient (Kontaktnetzwerk)"
        // helperText="Patienten-IDs"
        // variant="outlined"
        value={this.props.parameters.patientID || ""}
        onChange={this.props.change_contactPatient}
        // InputLabelProps={{
        //   shrink: true,
        // }}
      />
    )

    let pathogen_selection = (
      <TextField
        id="pathogen_selection"
        key="pathogen_selection"
        // label="Pathogens"
        // TODO: SMICS-0.8
        label="Virus"
        // helperText="Pathogen-IDs"
        // variant="outlined"
        value={this.props.parameters.pathogenList_string || ""}
        onChange={this.props.change_pathogenList}
      />
    )

    let station_selection = (
      <TextField
        id="station_selection"
        key="station_selection"
        // label="Stationen"
        // TODO: SMICS-0.8
        label="Station"
        // helperText="Station-IDs"
        // variant="outlined"
        value={this.props.parameters.station_string || ""}
        onChange={this.props.change_stationList}
      />
    )

    let ui_elements = [
      min_time,
      max_time,
      contact_patient_selection,
      patient_selection,
      // pathogen_selection,
      // station_selection,
      requestData,
      statistic_module,
      help_legend,
      showCache,
      // deleteCache,
      logout
    ]

    let ui_elements_spaced = []

    // ui_elements.forEach((uie, i) => {
    //   ui_elements_spaced.push(uie)
    //   if (i < ui_elements.length - 1) {
    //     ui_elements_spaced.push(<div className="space-div" />)
    //   }
    // })

    return (
      <div id={this.props.id} className="header-menu-container">
        <div className="input-container">{ui_elements}</div>
      </div>
    )
  }
}

export default HeaderMenu
