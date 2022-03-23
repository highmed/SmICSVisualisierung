import * as d3 from "d3"
import React, { Component } from "react"
import { hot } from "react-hot-loader"
import PropTypes from "prop-types"

import { v4 as uuidv4 } from "uuid"

// import Histogram from "../vis/Histogram"
// import Drawer from "@material-ui/core/Drawer"
// import logo_svg from "../assets/highmed_logo.svg"
// import tud_svg from "../assets/TU_Darmstadt_Logo.svg"

import HeaderMenu from "../components/HeaderMenu"
import LegendWindow from "./LegendWindow"
import * as Translator from "./translator.json"
import { withSocket } from "../hooks/socket"

import Flex_LM from "./Flex_LM"

import "./scss/main.scss"

class Main extends Component {
  constructor(props) {
    super(props)
    this.socket = props.socket.client

    this.defaults = "production"

    // TODO: was macht das/kann das entfernt werden/ersertzt?
    this.columns = 1

    this.subscriptions = []

    this.open_modules = []

    this.all_module_names = [
      "patientdetail",
      "linelist",
      "epikurve",
      "kontaktnetzwerk",
      "storyline",
    ]

    this.original_data = {}
    this.filtered_data = {}

    this.possible_filter_values = {
      min_ts: Number.MAX_VALUE,
      max_ts: 0,
      min_time: "",
      max_time: "",
      stations: [],
      config: true,
      patients: [],
      locations: [],
    }
    this.filter_values = {
      min_ts: Number.MAX_VALUE,
      max_ts: 0,
      min_time: "",
      max_time: "",
      station: "",
      config: true,
      patients: [],
      location: "station",
    }

    this.state = {
      transition_duration: 200,
      configNames: [],
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
        configName: "",
        hospital: "1",
        degree: 1,
        pathogen: "",
        starttime: "2021-01-01",
        endtime: "2021-01-01",
        patientList_string: "",
        stationList_string: "",
        // pathogenList_string: "",
        patientID: "",
      },
      filter_values: {
        ...this.filter_values,
      },
    }

    this.defaultParameters = {
      production: {
        // starttime: this.parse_date_to_needed_string_date(new Date().getTime()),
        // endtime: this.parse_date_to_needed_string_date(new Date().getTime()),
        starttime: "2021-10-01",
        endtime: "2021-10-10",
        patientList_string: "Patient17",
        pathogen: "94500-6",
        // "0590f4b9-cb61-41ef-90b9-5589f0051c57,07fa50f5-33bb-4a68-81b1-bed2a205d961,121d517c-823c-4499-9be4-5583ebab2072,19a6c833-eb9d-4484-a243-deac6f503d74,25eacc6e-0b92-47ad-ad87-35f4df2a1f53,275ab5c5-1b9e-4e8b-8afd-0fa7aad03974,31a6e584-3b9a-4b46-a825-13f4fd61988a,359033ea-a23c-40f9-98db-28cd53b6981d,39189f3f-6965-48e8-9a81-a452801a3caf,40e72023-02ab-4561-97d6-f8bc533f9c44,424ab7af-b81b-4ecc-b678-abe4cc128fa6,489870a3-65bd-426f-a961-b0b435e1e7c8,5cedfae5-69d4-4d70-92a9-9c5aebff31d8,6ed70ea6-9a65-4c8b-8d08-488787c3e91e,710e4312-092e-47f5-9330-9527c70d46d6,7244c015-16ae-4c7a-a076-2fc737e482e2,72801f9a-c4eb-44f2-90ae-9505ff350fcf,a0fa9e58-8c40-4576-b293-6d84decd5db9,a41421bf-9917-4ac3-be75-2f821327579d,aabc9934-acec-490b-8860-72e05c755038,abeab0bb-b5b3-4668-a5d5-215b33cc86bb,b24b7417-60a6-49ae-a722-4c1853b55d7f,b58f9309-f23e-4c3a-9fa0-d9f3ed3e150f,d2d0d9cf-2070-46dd-9900-921948c2d669,d41490c2-10af-4b51-a0e6-d24da5bc27f2,d4e1bab1-4756-4e43-9fe5-0e7ff6d449d6,db14dbad-3f49-4c96-b7f3-ca867d403b52,dffb8e49-75d0-4d9f-8ff0-e755b8668822,e4a2ee11-358b-49fb-94dc-872fdd681420,e9af5f68-361c-4438-b176-e6e7c82b8800,f11f472a-03fc-42e8-8ac5-8c86a93bb095,fb45f344-d3b8-4e46-abda-727ae24407e4,fbb60bcf-f942-40c0-8eae-ce138850f46a,fc60eaf8-ce31-4dd0-a37b-9f39f7814ec0",
        pathogenList_string: "sars-cov-2",
        stationList_string: "Coronastation",
        // patientID: "c74f6215-4fc2-42a5-a3ad-f92536ca64dc",
        patientID: "Patient17",
      },
      usecase: {
        // starttime: "2011-05-01T20:20:00+00:00",
        // endtime: "2012-04-30T20:20:00+00:00",
        starttime: "2011-05-01",
        endtime: "2012-04-30",
        patientList_string:
          "62411,63104,63842,64716,67867,68475,70448,76101,113749,175082",
        pathogenList_string: "732,869",
        stationList_string: "295,434",
      },
      pascal: {
        starttime: "2021-01-01",
        endtime: "2021-01-10",
        patientList_string: "c74f6215-4fc2-42a5-a3ad-f92536ca64dc",
        pathogenList_string: "sars-cov-2",
        stationList_string: "Coronastation",
        patientID: "c74f6215-4fc2-42a5-a3ad-f92536ca64dc",
      },
      christoph: {
        starttime: "2020-01-16",
        endime: "2020-02-20",
        patientList_string:
          "0590f4b9-cb61-41ef-90b9-5589f0051c57,07fa50f5-33bb-4a68-81b1-bed2a205d961,121d517c-823c-4499-9be4-5583ebab2072,19a6c833-eb9d-4484-a243-deac6f503d74,25eacc6e-0b92-47ad-ad87-35f4df2a1f53,275ab5c5-1b9e-4e8b-8afd-0fa7aad03974,31a6e584-3b9a-4b46-a825-13f4fd61988a,359033ea-a23c-40f9-98db-28cd53b6981d,39189f3f-6965-48e8-9a81-a452801a3caf,40e72023-02ab-4561-97d6-f8bc533f9c44,424ab7af-b81b-4ecc-b678-abe4cc128fa6,489870a3-65bd-426f-a961-b0b435e1e7c8,5cedfae5-69d4-4d70-92a9-9c5aebff31d8,6ed70ea6-9a65-4c8b-8d08-488787c3e91e,710e4312-092e-47f5-9330-9527c70d46d6,7244c015-16ae-4c7a-a076-2fc737e482e2,72801f9a-c4eb-44f2-90ae-9505ff350fcf,a0fa9e58-8c40-4576-b293-6d84decd5db9,a41421bf-9917-4ac3-be75-2f821327579d,aabc9934-acec-490b-8860-72e05c755038,abeab0bb-b5b3-4668-a5d5-215b33cc86bb,b24b7417-60a6-49ae-a722-4c1853b55d7f,b58f9309-f23e-4c3a-9fa0-d9f3ed3e150f,d2d0d9cf-2070-46dd-9900-921948c2d669,d41490c2-10af-4b51-a0e6-d24da5bc27f2,d4e1bab1-4756-4e43-9fe5-0e7ff6d449d6,db14dbad-3f49-4c96-b7f3-ca867d403b52,dffb8e49-75d0-4d9f-8ff0-e755b8668822,e4a2ee11-358b-49fb-94dc-872fdd681420,e9af5f68-361c-4438-b176-e6e7c82b8800,f11f472a-03fc-42e8-8ac5-8c86a93bb095,fb45f344-d3b8-4e46-abda-727ae24407e4,fbb60bcf-f942-40c0-8eae-ce138850f46a,fc60eaf8-ce31-4dd0-a37b-9f39f7814ec0",
      },
      pathogenList_string: "COV",
      stationList_string: "Station 14",
    }
  }

  get_locale = () => {
    return {
      dateTime: "%A, der %e. %B %Y, %X",
      date: "%d.%m.%Y",
      time: "%H:%M:%S",
      periods: ["AM", "PM"],
      days: [
        this.translate("sunday"),
        this.translate("monday"),
        this.translate("tuesday"),
        this.translate("wednesday"),
        this.translate("thursday"),
        this.translate("friday"),
        this.translate("saturday"),
      ],
      shortDays: [
        this.translate("sundayS"),
        this.translate("mondayS"),
        this.translate("tuesdayS"),
        this.translate("wednesdayS"),
        this.translate("thursdayS"),
        this.translate("fridayS"),
        this.translate("saturdayS"),
      ],
      months: [
        this.translate("january"),
        this.translate("february"),
        this.translate("march"),
        this.translate("april"),
        this.translate("may"),
        this.translate("june"),
        this.translate("july"),
        this.translate("august"),
        this.translate("september"),
        this.translate("october"),
        this.translate("november"),
        this.translate("december"),
      ],
      shortMonths: [
        this.translate("januaryS"),
        this.translate("februaryS"),
        this.translate("marchS"),
        this.translate("aprilS"),
        this.translate("mayS"),
        this.translate("juneS"),
        this.translate("julyS"),
        this.translate("augustS"),
        this.translate("septemberS"),
        this.translate("octoberS"),
        this.translate("novemberS"),
        this.translate("decemberS"),
      ],
    }
  }

  parse_date_to_needed_string_date = (input_date) => {
    let date = new Date(input_date)
    let year = date.getFullYear()
    let month = date.getMonth() + 1
    if (month < 10) {
      month = "0" + month
    }
    let day = date.getDate()
    if (day < 10) {
      day = "0" + day
    }
    return year + "-" + month + "-" + day
  }

  handle_data = (payload) => {
    let { data, data_name, error } = payload
    console.log("HANDLE DATA MAINJS", data_name)
    console.log(payload)

    this.original_data[data_name] = payload
    this.set_possible_filter_values(data_name, payload)
    this.reset_filter()
    this.filter_data()
  }

  get_original_data = (module_name) => {
    // TODO:
    return this.original_data(module_name)
  }

  get_filtered_data = (module_name) => {
    // TODO:
    return this.get_original_data(module_name)
  }

  get_data_to_freeze_module = (module_name) => {
    // TODO:
    // gets original data
    // gets possible filter values for that data set (or just current possible values?)
  }

  set_possible_filter_values = (data_name, payload) => {
    if (payload.error === undefined && payload.data) {
      switch (data_name) {
        case "patientdetail":
          // min_ts, max_ts, stations, patients
          "hi"
          break
        case "linelist":
          // TODO: temporär, nach Klausuren weiter...
          break
          // min_ts, max_ts, stations, patients

          // [x] min_ts
          // [x] max_ts
          let timespan = [payload.data.ts_start, payload.data.ts_end]
          console.warn(timespan)
          timespan.forEach((ts) => {
            if (this.possible_filter_values.min_ts > ts) {
              this.possible_filter_values.min_ts = ts
              this.possible_filter_values.min_time = this.parse_date_to_needed_string_date(
                ts
              )
            }
            if (this.possible_filter_values.max_ts < ts) {
              this.possible_filter_values.max_ts = ts
              this.possible_filter_values.max_time = this.parse_date_to_needed_string_date(
                ts
              )
            }
          })
          break
        case "epikurve":
          // min_ts, max_ts, stations, config_name

          // [x] min_ts
          // [x] max_ts
          payload.data.timespan.forEach((ts) => {
            if (this.possible_filter_values.min_ts > ts) {
              this.possible_filter_values.min_ts = ts
              this.possible_filter_values.min_time = this.parse_date_to_needed_string_date(
                ts
              )
            }
            if (this.possible_filter_values.max_ts < ts) {
              this.possible_filter_values.max_ts = ts
              this.possible_filter_values.max_time = this.parse_date_to_needed_string_date(
                ts
              )
            }
          })

          let keime = Object.getOwnPropertyNames(payload.data.data)
          keime.forEach((keimName) => {
            let raw_data = payload.data.data[keimName]
            let station_names = Object.getOwnPropertyNames(raw_data)

            // [x] stations
            station_names.forEach((station_name) => {
              if (
                station_name !== "klinik" &&
                !this.possible_filter_values.stations.includes(station_name)
              ) {
                this.possible_filter_values.stations.push(station_name)
              }

              // [x] min_ts
              // [x] max_ts
              // raw_data[station_name].forEach((data_row) => {
              //   let ts = new Date(data_row.Datum).getTime()
              //   console.warn(new Date(data_row.Datum))
              //   console.warn(new Date(data_row.Datum).getTime())
              //   if (this.possible_filter_values.min_ts > ts) {
              //     this.possible_filter_values.min_ts = ts
              //     this.possible_filter_values.min_time = this.parse_date_to_needed_string_date(
              //       ts
              //     )
              //   }
              //   if (this.possible_filter_values.max_ts < ts) {
              //     this.possible_filter_values.max_ts = ts
              //     this.possible_filter_values.max_time = this.parse_date_to_needed_string_date(
              //       ts
              //     )
              //   }
              // })
            })
          })
          "hi"
          break
        case "kontaktnetzwerk":
          // min_ts, max_ts, stations, patients, location
          "hi"
          break
        case "storyline":
          // min_ts, max_ts, stations, patients, location
          "hi"
          break
      }

      this.reset_filter()
    }
  }

  reset_filter = () => {
    let {
      min_ts,
      max_ts,
      min_time,
      max_time,
      stations,
      config,
      patients,
      locations,
    } = this.possible_filter_values

    this.filter_values = {
      min_ts,
      max_ts,
      min_time,
      max_time,
      station: "",
      config,
      patients: patients.toString(),
      location: "station",
    }

    this.set_filter_values_as_state()
  }

  filter_data = () => {
    // TODO: Epikurve:
    // zb bei keiner Station = klinik, bei mehreren Stationen die Daten akkumulieren
  }

  set_filter_values_as_state = () => {
    this.setState((prevState) => {
      prevState.filter_values = this.filter_values
      return prevState
    })

    this.draw_all_modules()
  }

  get_possible_filter_values = () => {
    return this.possible_filter_values
  }

  switch_config_name = (e) => {
    let newConfigName = e.target.value

    this.setState((prevState) => {
      prevState.parameters.configName = newConfigName
      return prevState
    })
  }

  /**
   * Registers an new opened module and calls its callback (typically draw_vis) on new data or new filter parameters.
   * @param {*} module_id
   * @param {*} module_type
   * @param {*} callback
   */
  register_module = (module_id, module_type, callback) => {
    console.warn("registered", module_type)
    this.open_modules.push({
      module_id,
      module_type,
      callback,
    })
  }

  unregister_module = (module_id) => {
    this.open_modules = this.open_modules.filter(
      (d) => d.module_id !== module_id
    )
  }

  draw_modules_with_type = (module_type) => {
    let modules_to_draw = this.open_modules.filter(
      (d) => d.module_type === module_type
    )
    modules_to_draw.forEach((m) => {
      m.callback()
    })
  }

  draw_all_modules = () => {
    this.open_modules.forEach((m) => {
      m.callback()
    })
  }

  create_new_id = () => {
    return uuidv4()
  }

  /**
   * Lets a module
   * @param {*} module_id
   * @param {*} topic
   * @param {*} callback
   */
  subscribe_to = (module_id, topic, callback) => {
    let sub_id = this.create_new_id()
    this.subscriptions.push({
      id: sub_id,
      module_id,
      topic,
      callback,
    })
    return sub_id
  }

  unsubscribe_module = (module_id) => {
    this.subscriptions = this.subscriptions.filter(
      (d) => d.module_id !== module_id
    )
  }

  unsubscribe_from = (sub_id) => {
    this.subscriptions = this.subscriptions.filter((d) => d.id !== sub_id)
  }

  publish_to = (topic, payload) => {
    let sub_callbacks = this.subscriptions.filter((d) => d.topic === topic)
    sub_callbacks.forEach((sub) => {
      sub.callback(payload)
    })
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

  // TODO: kann NICHT JEDES MALL ausgeführt werden bei onChange, da man sonst kein "," eintippen kann...
  // ? nur zum Parsen für die einzelnen on-clock items benutzen?
  /**
   * Removes empty values "" and all duplicates of a stringyfied array.
   * - Turn to array (split: ",")
   * - Filter all not-empty values
   * - Filter all values, that are their first appearance
   * - Turn back into String
   * @param {*} string_input
   * @returns
   */
  cleanup_array_input = (string_input) => {
    let cleaned_string = string_input
      .split(",")
      .filter((d) => d !== "")
      .filter((value, index, self) => self.indexOf(value) === index)
      .toString()
    return cleaned_string
  }

  toggle_global_legend = () => {
    this.setState((prevState) => {
      prevState.global_legend = !prevState.global_legend
      return prevState
    })
  }

  /**
   * Selecting a time in the future is not possible anymore
   */
  change_starttime = (e) => {
    let new_value = e.target.value

    // Check for time restrictions
    // let now = new Date()
    // if (new Date(new_value).getTime() > now.getTime()) {
    //   let day = now.getDate()
    //   if (day < 10) {
    //     day = "0" + day
    //   }
    //   let month = now.getMonth() + 1
    //   if (month < 10) {
    //     month = "0" + month
    //   }
    //   let year = now.getFullYear()
    //   new_value = year + "-" + month + "-" + day
    // }

    this.setState((prevState) => {
      prevState.parameters.starttime = new_value
      // let beginn_ts = new Date(new_value).getTime()
      // let end_ts = new Date(prevState.parameters.endtime).getTime()
      // if (beginn_ts > end_ts) {
      //   prevState.parameters.endtime = new_value
      // }
      return prevState
    })
  }

  clip_new_filter_time = (new_time) => {
    let new_ts = new Date(new_time).getTime()
    let return_ts = new_ts
    if (new_ts <= this.possible_filter_values.min_ts) {
      return_ts = this.possible_filter_values.min_ts
    } else if (new_ts >= this.possible_filter_values.max_ts) {
      return_ts = this.possible_filter_values.max_ts
    }
    return return_ts
  }

  change_filter_starttime = (new_time) => {
    let clipped_ts = this.clip_new_filter_time(new_time)
    let date_ts = new Date(clipped_ts).getTime()
    let date_string = this.parse_date_to_needed_string_date(clipped_ts)

    this.filter_values.min_ts = date_ts
    this.filter_values.min_time = date_string

    if (clipped_ts > this.filter_values.max_ts) {
      this.filter_values.max_ts = date_ts
      this.filter_values.max_time = date_string
    }

    this.set_filter_values_as_state()
  }

  change_filter_endtime = (new_time) => {
    let clipped_ts = this.clip_new_filter_time(new_time)
    let date_ts = new Date(clipped_ts).getTime()
    let date_string = this.parse_date_to_needed_string_date(clipped_ts)

    this.filter_values.max_ts = date_ts
    this.filter_values.max_time = date_string

    if (clipped_ts < this.filter_values.min_ts) {
      this.filter_values.min_ts = date_ts
      this.filter_values.min_time = date_string
    }
    this.set_filter_values_as_state()
  }

  /**
   * Selecting a time in the future is not possible anymore
   */
  change_endtime = (e) => {
    let new_value = e.target.value

    // Check for time restrictions
    // let now = new Date()
    // if (new Date(new_value).getTime() > now.getTime()) {
    //   let day = now.getDate()
    //   if (day < 10) {
    //     day = "0" + day
    //   }
    //   let month = now.getMonth() + 1
    //   if (month < 10) {
    //     month = "0" + month
    //   }
    //   let year = now.getFullYear()
    //   new_value = year + "-" + month + "-" + day
    // }

    this.setState((prevState) => {
      prevState.parameters.endtime = new_value
      // let beginn_ts = new Date(prevState.parameters.starttime).getTime()
      // let end_ts = new Date(new_value).getTime()
      // if (beginn_ts > end_ts) {
      //   prevState.parameters.starttime = new_value
      // }
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

  change_pathogen = (e) => {
    let new_value = e.target.value
    this.setState((prevState) => {
      prevState.parameters.pathogen = new_value
      return prevState
    })
  }

  /**
   * Deletes a value from a comma separated list.
   * @param {*} value
   * @param {*} string_list
   * @param {*} change_function
   */
  delete_from_string_list = (value, string_list, change_function) => {
    let new_value = string_list
      .split(",")
      .filter((d) => d !== value)
      .toString()
    change_function(new_value)
  }

  /**
   * Adds a value to a comma separated list (at the beginning).
   * @param {*} value
   * @param {*} string_list
   */
  add_to_string_list = (value, string_list, change_function) => {
    let new_value = value
    if (string_list && string_list !== "") {
      new_value += "," + string_list
    }
    change_function(new_value)
  }

  // TODO: nach comma separation gehen und daraus array machen
  // TODO: und keine Leerzeichen etc
  change_patient_list = (e) => {
    // let new_value = e.target.value
    let new_value = this.cleanup_array_input(e)
    this.setState((prevState) => {
      prevState.parameters.patientList_string = new_value
      return prevState
    })
  }

  // TODO: nach comma separation gehen und daraus array machen
  // TODO: und keine Leerzeichen etc
  change_pathogen_list = (e) => {
    // let new_value = e.target.value
    let new_value = this.cleanup_array_input(e.target.value)
    console.log(new_value)
    this.setState((prevState) => {
      prevState.parameters.pathogenList_string = new_value
      // prevState.parameters.pathogenList = new_value.split(",")
      return prevState
    })
  }

  // TODO: nach comma separation gehen und daraus array machen
  // TODO: und keine Leerzeichen etc
  change_station_list = (e) => {
    // let new_value = e.target.value
    let new_value = this.cleanup_array_input(e)
    this.setState((prevState) => {
      prevState.parameters.stationList_string = new_value
      // prevState.parameters.station = new_value.split(",")
      return prevState
    })
  }

  componentDidMount = () => {
    let self = this
    console.log("mainjs did mount")

    // setInterval(() => {
    //   this.publish_to("MEIN TOPIC", "meine message lol")
    // }, 1000)

    // self.socket.on("dataResult", self.handleData)
    self.socket.on("dataError", (data) => {
      console.error(data)
    })
    self.socket.on("cacheData", (data) => {
      console.log("cache data")
      console.log(data)
    })

    self.socket.on("OutbreakDetectionConfigurations", (payload) => {
      self.setState((prevState) => {
        prevState.configNames = payload
        return prevState
      })
    })

    self.all_module_names.forEach((module_name) => {
      self.socket.on(module_name, self.handle_data)
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

    self.socket.off("dataResult")
    self.socket.off("dataError")
    self.socket.off("cacheData")

    self.all_module_names.forEach((module_name) => {
      self.socket.off(module_name)
    })

    // self.socket.off("dataResult")
    clearInterval(self.intervalFunction)
  }

  // handleData = (data) => {
  //   let self = this
  //   console.log("Fresh data from Webserver:")
  //   console.log(data)

  //   self.setState((prevState) => {
  //     prevState.data.push(data)
  //     return prevState
  //   })
  // }

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

    let openModuleNames = []

    this.open_modules.forEach((m) => {
      if (!openModuleNames.includes(m.module_type)) {
        openModuleNames.push(m.module_type)
      }
    })

    let request_parameters = {
      // dataSourceIdentifier: "hmhdnov18_sql",
      // dataSourceIdentifier: "rest",
      openModuleNames,
      allModuleNames: this.all_module_names,
      // parameters: this.defaultParameters,
      // parameters: this.state.parameters,
      parameters: {
        configName: this.state.parameters.configName,
        hospital: this.state.parameters.hospital,
        degree: this.state.parameters.degree,
        pathogen: this.state.parameters.pathogen,
        starttime: this.state.parameters.starttime,
        endtime: this.state.parameters.endtime,
        patientList: this.state.parameters.patientList_string.split(","),
        stationList: this.state.parameters.stationList_string.split(","),
        // pathogenList: this.state.parameters.pathogenList_string.split(","),
        pathogenList: this.state.parameters.pathogen.split(","),
        // ...this.state.parameters,
        // patientID: this.state.parameters.patientList_string.split(",")[0],
        patientID: this.state.parameters.patientID,
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

  /**
   * Moves the tooltip to the current pointer position
   */
  move_tooltip = (cur_x, cur_y) => {
    // console.log("move tooltip")
    // abchecken, in welchem Quadranten des Fensters sich der Mauszeiger befindet, umd den Tooltip Punktsymetrisch dazu Positionieren
    let mousePosX
    let mousePosY

    if (cur_x && cur_y) {
      mousePosX = cur_x
      mousePosY = cur_y
    } else {
      mousePosX = d3.event.pageX
      mousePosY = d3.event.pageY
    }
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

  /**
   * Shows the tooltip
   */
  show_tooltip = () => {
    this.setState((prevState) => (prevState.tooltip.display = "inline-block"))
  }

  /**
   * Hides the tooltip
   */
  hide_tooltip = () => {
    this.setState((prevState) => (prevState.tooltip.display = "none"))
  }

  componentDidUpdate() {
    d3.select(this.tooltipDiv)
      .selectAll(".titleTD")
      .attr("colspan", this.columns)
  }

  // TODO: das ist copy pasted vom alten Dashboard...
  /**
   * Updates the content of the tooltip
   * @param {*} new_content
   */
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
    this.setState((prevState) => {
      prevState.tooltip.content = tableDiv
      return prevState
    })
  }

  render() {
    let self = this

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
            change_patient_list={this.change_patient_list}
            change_pathogen_list={this.change_pathogen_list}
            change_station_list={this.change_station_list}
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
          <Flex_LM
            key="MEIN_LM"
            {...this.state}
            update_tooltip={this.update_tooltip}
            move_tooltip={this.move_tooltip}
            hide_tooltip={this.hide_tooltip}
            show_tooltip={this.show_tooltip}
            translate={this.translate}
            requestVisData={this.requestVisData}
            change_rki_config_name={this.change_rki_config_name}
            // ab hier das für Parameter
            requestVisData={this.requestVisData}
            requestNewVisData={this.requestNewVisData}
            requestCacheData={this.requestCacheData}
            clearCache={this.clearCache}
            change_starttime={this.change_starttime}
            change_endtime={this.change_endtime}
            change_patient_list={this.change_patient_list}
            change_pathogen_list={this.change_pathogen_list}
            change_pathogen={this.change_pathogen}
            change_station_list={this.change_station_list}
            toggle_global_legend={this.toggle_global_legend}
            // TODO: SMICS-0.8
            change_contactPatient={this.change_contactPatient}
            translate={this.translate}
            delete_from_string_list={this.delete_from_string_list}
            add_to_string_list={this.add_to_string_list}
            cleanup_array_input={this.cleanup_array_input}
            // ab hier Subscribe/Publish zeug
            subscribe_to={this.subscribe_to}
            unsubscribe_module={this.unsubscribe_module}
            unsubscribe_from={this.unsubscribe_from}
            publish_to={this.publish_to}
            create_new_id={this.create_new_id}
            // register/unregister module
            register_module={this.register_module}
            unregister_module={this.unregister_module}
            switch_config_name={this.switch_config_name}
            // Filter Functions
            change_filter_starttime={this.change_filter_starttime}
            change_filter_endtime={this.change_filter_endtime}
            get_possible_filter_values={this.get_possible_filter_values}
            get_locale={this.get_locale}
          />
        </div>
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
  socket: PropTypes.object.isRequired,
}

export default hot(module)(withSocket(Main))
