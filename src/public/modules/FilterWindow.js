import React, { Component } from "react"
import TextField from "@material-ui/core/TextField"
import Button from "@material-ui/core/Button"
import FormControl from "@material-ui/core/FormControl"
import InputLabel from "@material-ui/core/InputLabel"
import MenuItem from "@material-ui/core/MenuItem"
import Select from "@material-ui/core/Select"

import DeleteIcon from "@material-ui/icons/Delete"
import ArrowDropUp from "@material-ui/icons/ArrowDropUp"
import ArrowDropDown from "@material-ui/icons/ArrowDropDown"
import CheckIcon from "@material-ui/icons/Check"

import "./scss/filter_window.scss"

export default class FilterWindow extends Component {
  constructor(props) {
    super(props)
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
    string_list,
    change_function,
    name,
    is_list_open
  ) => {
    // 1. liste an Elementen erzueugen
    // für jedes Element dann das Deleteable item
    // callback für jedes item, um das item von dem String zu entfernen
    let list_of_values = string_list.split(",").filter((d) => d !== "")
    let elements = []

    list_of_values.forEach((v) => {
      elements.push(
        <div id={v} title={v} key={v} className="deleteable_list_item">
          <DeleteIcon
            className="delete_clickable"
            key={v + "_delete_clickable"}
            onClick={() => {
              this.props.delete_from_string_list(
                v,
                string_list,
                change_function
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
        label={this.translate("begin2")}
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
        label={this.translate("end2")}
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

    let unwrapped_elements = [
      start_time,
      end_time,
      // pathogen_list_orig,
      // config_selection,
      // // pathogen_list,
      // station_list,
      // patient_list,
    ]

    let wrapped_elements = []
    unwrapped_elements.forEach((e) => {
      wrapped_elements.push(this.wrap_input_element(e))
    })

    return <div className="filter_window">{wrapped_elements}</div>
  }
}
