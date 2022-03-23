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

import "./scss/parameters_window.scss"

export default class ParametersWindow extends Component {
  constructor(props) {
    super(props)

    this.state = {
      add_to_patient_list: "",
      add_to_pathogen_list: "",
      add_to_station_list: "",
      patient_list_open: false,
      pathogen_list_open: false,
    }

    this.translate = props.translate
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

  create_deleteable_list = (
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
    // let test_text_input =

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
        value={this.props.parameters.starttime || ""}
        onChange={this.props.change_starttime}
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
        value={this.props.parameters.endtime || ""}
        onChange={this.props.change_endtime}
      />
    )

    let config_selection_items = [
      <MenuItem key=" - " value={""}>
        {" - "}
      </MenuItem>,
    ]

    this.props.configNames.forEach((conf) => {
      config_selection_items.push(
        <MenuItem key={conf.name} value={conf.name}>
          {conf.name}
        </MenuItem>
      )
    })

    let config_selection = (
      <FormControl
        style={target_width_css}
        key={"config_selection"}
        // style={{ minWidth: "120px" }}
      >
        <InputLabel id="config_selection">RKI Config</InputLabel>
        <Select
          key={"config_select"}
          value={this.props.parameters.configName}
          onChange={this.props.switch_config_name}
        >
          {config_selection_items}
        </Select>
      </FormControl>
    )

    let pathogen_list_orig = (
      <TextField
        style={target_width_css}
        id="pathogen_list"
        key="pathogen_list"
        label={this.translate("pathogen/virus")}
        // value={this.props.parameters.pathogenList_string || ""}
        value={this.props.parameters.pathogen || ""}
        // onChange={this.props.change_pathogen_list}
        onChange={this.props.change_pathogen}
      />
    )

    let contact_patient_selection = (
      <TextField
        styler={target_width_css}
        id="contact_patient_selection"
        key="contact_patient_selection"
        label={this.props.translate("Kontaktnetzwerk")}
        // helperText="Patienten-IDs"
        // variant="outlined"
        value={this.props.parameters.patientID || ""}
        onChange={this.props.change_contactPatient}
        // InputLabelProps={{
        //   shrink: true,
        // }}
      />
    )

    // let patient_list_orig = (
    //   <TextField
    //     id="patient_selection"
    //     key="patient_selection"
    //     label="Patienten (Historie)"
    //     value={this.props.parameters.patientList_string || ""}
    //     onChange={this.props.change_patient_list}
    //   />
    // )

    // let station_list_orig = (
    //   <TextField
    //     id="station_selection"
    //     key="station_selection"
    //     label="Stationen"
    //     value={this.props.parameters.stationList_string || ""}
    //     onChange={this.props.change_station_list}
    //   />
    // )

    let confirm_input_patient_list = () => {
      let val = this.state.add_to_patient_list
      this.props.add_to_string_list(
        val,
        this.props.parameters.patientList_string,
        this.props.change_patient_list
      )
      this.setState((prevState) => {
        prevState.add_to_patient_list = ""
        return prevState
      })
    }

    let confirm_input_pathogen_list = () => {
      let val = this.state.add_to_pathogen_list
      this.props.add_to_string_list(
        val,
        this.props.parameters.pathogenList_string,
        this.props.change_pathogen_list
      )
      this.setState((prevState) => {
        prevState.add_to_pathogen_list = ""
        return prevState
      })
    }

    let confirm_input_station_list = () => {
      let val = this.state.add_to_station_list
      this.props.add_to_string_list(
        val,
        this.props.parameters.stationList_string,
        this.props.change_station_list
      )
      this.setState((prevState) => {
        prevState.add_to_station_list = ""
        return prevState
      })
    }

    let patient_list = [
      <div
        key="patient_list_textfield_and_buttons"
        className="textfield_and_buttons"
      >
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
        this.props.parameters.patientList_string || "",
        this.props.change_patient_list,
        "patient_list",
        this.state.patient_list_open
      ),
    ]

    let pathogen_list = [
      <div
        key="pathogen_list_textfield_and_buttons"
        className="textfield_and_buttons"
      >
        <TextField
          style={short_textfield_css}
          id="add_to_pathogen_list"
          key="add_to_pathogen_list"
          label={this.translate("viruslist")}
          value={this.state.add_to_pathogen_list || ""}
          onChange={(e) => {
            this.setState((prevState) => {
              prevState.add_to_pathogen_list = e.target.value
              return prevState
            })
          }}
          onKeyDown={(e) => {
            if (e.keyCode == 13) {
              confirm_input_pathogen_list()
            }
          }}
        />
        <div key="list_button_container" className="list_button_container">
          <Button
            style={small_button_css}
            key="pathogen_list_button_check"
            variant="contained"
            onClick={confirm_input_pathogen_list}
          >
            <CheckIcon />
          </Button>
          <Button
            style={small_button_css}
            key="pathogen_list_button_collapse"
            variant={this.state.pathogen_list_open ? "outlined" : "contained"}
            onClick={() => {
              this.setState((prevState) => {
                prevState.pathogen_list_open = !prevState.pathogen_list_open
                return prevState
              })
            }}
          >
            {this.state.pathogen_list_open ? (
              <ArrowDropUp />
            ) : (
              <ArrowDropDown />
            )}
          </Button>
        </div>
      </div>,
      this.create_deleteable_list(
        this.props.parameters.pathogenList_string || "",
        this.props.change_pathogen_list,
        "pathogen_list",
        this.state.pathogen_list_open
      ),
    ]

    let station_list = [
      <div
        key="station_list_textfield_and_buttons"
        className="textfield_and_buttons"
      >
        <TextField
          style={short_textfield_css}
          id="add_to_station_list"
          key="add_to_station_list"
          label={this.translate("wardlist")}
          value={this.state.add_to_station_list || ""}
          onChange={(e) => {
            this.setState((prevState) => {
              prevState.add_to_station_list = e.target.value
              return prevState
            })
          }}
          onKeyDown={(e) => {
            if (e.keyCode == 13) {
              confirm_input_station_list()
            }
          }}
        />
        <div key="list_button_container" className="list_button_container">
          <Button
            style={small_button_css}
            key="station_list_button_check"
            variant="contained"
            onClick={confirm_input_station_list}
          >
            <CheckIcon />
          </Button>
          <Button
            style={small_button_css}
            key="station_list_button_collapse"
            variant={this.state.station_list_open ? "outlined" : "contained"}
            onClick={() => {
              this.setState((prevState) => {
                prevState.station_list_open = !prevState.station_list_open
                return prevState
              })
            }}
          >
            {this.state.station_list_open ? <ArrowDropUp /> : <ArrowDropDown />}
          </Button>
        </div>
      </div>,
      this.create_deleteable_list(
        this.props.parameters.stationList_string || "",
        this.props.change_station_list,
        "station_list",
        this.state.station_list_open
      ),
    ]

    let unwrapped_elements = [
      start_time,
      end_time,
      pathogen_list_orig,
      config_selection,
      // station_list,
      // TODO: nur fuer Version Ende März so
      contact_patient_selection,
      patient_list,
    ]
    let wrapped_elements = []
    unwrapped_elements.forEach((e) => {
      wrapped_elements.push(this.wrap_input_element(e))
    })

    return <div className="parameters_window">{wrapped_elements}</div>
  }
}
