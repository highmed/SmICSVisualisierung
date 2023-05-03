import React, { Component } from "react"
import TextField from "@material-ui/core/TextField"
import { Autocomplete } from "@mui/material"
import Button from "@material-ui/core/Button"
import FormControl from "@material-ui/core/FormControl"
import InputLabel from "@material-ui/core/InputLabel"
import MenuItem from "@material-ui/core/MenuItem"
import Select from "@material-ui/core/Select"

import DeleteIcon from "@material-ui/icons/Delete"
import HighlightAltIcon from "@mui/icons-material/HighlightAlt"
import ArrowDropUp from "@material-ui/icons/ArrowDropUp"
import ArrowDropDown from "@material-ui/icons/ArrowDropDown"
import CheckIcon from "@material-ui/icons/Check"

import "./scss/filter_window.scss"

export default class FilterWindow extends Component {
  constructor(props) {
    super(props)

    this.translate = props.translate

    this.state = {
      patient_list_open: false,
      add_to_patient_list: "",
    }
  }

  create_deleteable_list = (list_of_values, name, is_list_open) => {
    // 1. liste an Elementen erzueugen
    // für jedes Element dann das Deleteable item
    // callback für jedes item, um das item von dem String zu entfernen
    // let list_of_values = string_list.split(",").filter((d) => d !== "")
    let elements = []

    list_of_values.forEach((v) => {
      elements.push(
        <div id={v} title={v} key={v} className="deleteable_list_item">
          <DeleteIcon
            className="delete_clickable"
            key={v + "_delete_clickable"}
            onClick={() => {
              this.props.change_filter_patients_delete(v)
            }}

            // fontSize="small"
          />
          {v}
          <HighlightAltIcon
            className="set_as_critical_patient_clickable"
            key={v + "_set_as_critical_patient_clickable"}
            onClick={() => {
              this.props.change_filter_critical_patient(v)
            }}
          />
        </div>
      )
    })

    if (elements.length === 0) {
      elements.push("Empty")
    }

    return (
      <div key={"deletable_list_" + name} className="deleteable_list">
        {is_list_open ? elements : null}
      </div>
    )
  }

  wrap_input_element = (el) => {
    let key
    if (el.length > 0) {
      key = el[0].key
    } else {
      key = el.key
    }
    return (
      <div key={"para_input_container" + key} className="para_input_container">
        {el}
      </div>
    )
  }

  create_selectable_list = (
    list_of_values,
    change_function,
    name,
    is_list_open
  ) => {
    // 1. liste an Elementen erzueugen
    // für jedes Element dann das Deleteable item
    // callback für jedes item, um das item von dem String zu entfernen
    // let list_of_values = string_list.split(",").filter((d) => d !== "")
    let elements = []

    list_of_values.forEach((v) => {
      elements.push(
        <div id={v} title={v} key={v} className="deleteable_list_item">
          <DeleteIcon
            className="delete_clickable"
            key={v + "_delete_clickable"}
            onClick={() => {
              this.props.change_filter_patients(
                list_of_values.filter((d) => d != v)
              )
            }}
            // fontSize="small"
          />
          {/* <span className="deleteable_list_item_text">{v}</span> */}
          {v}
        </div>
      )
    })
    if (elements.length === 0) {
      elements.push("Empty")
    }

    return (
      <div key={"deletable_list_" + name} className="deleteable_list">
        {/* <div
          onClick={() => {
            this.setState((prevState) => {
              prevState.patient_list_open = !prevState.patient_list_open
              return prevState
            })
          }}
        >
          {this.state.patient_list_open ? "hide" : "show"}
        </div> */}
        {is_list_open ? elements : null}
      </div>
    )
  }

  render() {
    let short_textfield_css = { width: "140px" }
    let target_width_css = { width: "175px" }
    let small_button_css = {
      minWidth: "10px",
      width: "20px",
      height: "20px",
    }

    let start_time = (
      <TextField
        style={target_width_css}
        key="min_time"
        id="min_time"
        label={this.translate("begin3")}
        // type="datetime-local"
        // defaultValue="2017-05-24T10:30"
        type="date"
        // defaultValue="2017-05-24"
        format={"dd/MM/yyyy"}
        // className={classes.textField}
        InputLabelProps={{
          shrink: true,
        }}
        value={this.props.filter_values.min_time || ""}
        onChange={(e) => {
          this.props.change_filter_starttime(e.target.value)
        }}
      />
    )

    let end_time = (
      <TextField
        style={target_width_css}
        key="max_time"
        id="max_time"
        label={this.translate("end3")}
        // type="datetime-local"
        // defaultValue="2017-05-24T10:30"
        type="date"
        // defaultValue="2017-05-24"
        format={"dd/MM/yyyy"}
        // className={classes.textField}
        InputLabelProps={{
          shrink: true,
        }}
        value={this.props.filter_values.max_time || ""}
        onChange={(e) => {
          this.props.change_filter_endtime(e.target.value)
        }}
      />
    )

    let confirm_input_patient_list = () => {
      let val = this.state.add_to_patient_list
      this.props.change_filter_patients_add(val.split(","))
      this.setState((prevState) => {
        prevState.add_to_patient_list = ""
        return prevState
      })
    }

    let patient_list = [
      <div key="patient_list_and_button" className="textfield_and_buttons">
        <TextField
          style={short_textfield_css}
          id="add_to_patient_list"
          key="add_to_patient_list"
          label={this.translate("patientlist")}
          value={this.state.add_to_patient_list || ""}
          onChange={(e) => {
            this.setState((prevState) => {
              prevState.add_to_patient_list = e.target.value
              return prevState
            })
          }}
          onKeyDown={(e) => {
            if (e.keyCode == 13) {
              confirm_input_patient_list()
            }
          }}
        />
        {/* <div>{this.translate("patientlist")}</div> */}
        <div key="list_button_container" className="list_button_container">
          <Button
            style={small_button_css}
            key="patient_list_button_check"
            variant="contained"
            onClick={confirm_input_patient_list}
          >
            <CheckIcon />
          </Button>
          <Button
            style={small_button_css}
            key="patient_list_button_collapse"
            variant={this.state.patient_list_open ? "outlined" : "contained"}
            onClick={() => {
              this.setState((prevState) => {
                prevState.patient_list_open = !prevState.patient_list_open
                return prevState
              })
            }}
          >
            {this.state.patient_list_open ? <ArrowDropUp /> : <ArrowDropDown />}
          </Button>
        </div>
      </div>,
      this.create_deleteable_list(
        // this.props.parameters.patientList_string || "",
        this.props.filter_values.patients,
        "patient_list",
        this.state.patient_list_open
      ),
    ]
    let pfv = this.props.get_possible_filter_values()
    // let all_stations = pfv.stations.map((d) => {
    //   return { label: d }
    // })
    let all_stations = ["", ...pfv.stations]

    let station_select = (
      <Autocomplete
        disablePortal
        key="stationselect-autocomplete"
        id="stationselect-autocomplete"
        value={this.props.filter_values.station}
        options={all_stations}
        renderInput={(params) => (
          <TextField {...params} label={this.translate("ward")}></TextField>
        )}
        onChange={(e, station) => {
          let station_id = station ? station : ""
          // if (station) {
          //   station_id = station.label
          // }
          this.props.change_filter_station(station_id)
        }}
      />
    )

    let all_patients = ["", ...pfv.patients]

    let critical_patient_select = (
      <Autocomplete
        disablePortal
        key="criticalpatientselect-autocomplete"
        id="criticalpatientselect-autocomplete"
        value={this.props.filter_values.critical_patient}
        options={all_patients}
        renderInput={(params) => (
          <TextField
            {...params}
            label={this.translate("critical_patient")}
          ></TextField>
        )}
        onChange={(e, patient) => {
          let pat_id = patient ? patient : ""
          // if (station) {
          //   station_id = station.label
          // }
          this.props.change_filter_critical_patient(pat_id)
        }}
      />
    )

    let unwrapped_elements = [
      start_time,
      end_time,
      // <div key="12">timepoint</div>,
      // <div key="151">patient list</div>,
      // <div key="645641">station (dropdown?)</div>,
      station_select,
      // <div key="561">location (downdown/radios)</div>,
      // pathogen_list_orig,
      // config_selection,
      // // pathogen_list,
      // station_list,
      // patient_list,
      critical_patient_select,
      patient_list,
    ]

    let wrapped_elements = []
    unwrapped_elements.forEach((e) => {
      wrapped_elements.push(this.wrap_input_element(e))
    })

    return <div className="filter_window">{wrapped_elements}</div>
  }
}
