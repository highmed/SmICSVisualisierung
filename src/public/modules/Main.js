import * as d3 from "d3"
import * as d3v4 from "../vis/d3v4.js"
import React, { Component } from "react"
import { hot } from "react-hot-loader"
import PropTypes from "prop-types"

import hash from "object-hash"

import { v4 as uuidv4 } from "uuid"
import { sankey, sankeyLinkHorizontal } from "../vis/d3-sankey"

// import Histogram from "../vis/Histogram"
// import Drawer from "@material-ui/core/Drawer"
// import logo_svg from "../assets/highmed_logo.svg"
// import tud_svg from "../assets/TU_Darmstadt_Logo.svg"

import HeaderMenu from "../components/HeaderMenu"
import LegendWindow from "./LegendWindow"
import * as Translator from "./translator.json"
import { withSocket } from "../hooks/socket"

import { FileDrop } from "react-file-drop"

import Flex_LM from "./Flex_LM"

import "./scss/main.scss"
import { filter } from "d3"

// import "../cool-custom-context-menu/ContextMenu.css"
// import ContextMenu from "../cool-custom-context-menu/ContextMenu"

class Main extends Component {
  constructor(props) {
    super(props)
    this.socket = props.socket.client

    this.defaults = "sql_db"
    // this.defaults = "pascal2"

    // TODO: was macht das/kann das entfernt werden/ersertzt?
    this.columns = 1

    this.filter_values_to_overwrite = undefined
    this.current_parameters_hash = ""

    this.subscriptions = []

    this.open_modules = []

    this.current_language_index = 0
    this.all_languages = ["cov", "eng", "ger"]

    this.all_module_names = [
      "epikurve",
      "linelist",
      "patientdetail",
      "kontaktnetzwerk",
      "storyline",
    ]

    this.original_data = {}
    this.filtered_data = {}

    this.last_loaded_parameters = {}

    this.max_state_history_length = 100

    this.parameters = {
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
    }

    this.state = {
      waiting_for_data: false,
      /**
       * {
       *  parameter_values: {},
       *  filter_values: {},
       *  timestamp: STRING,
       *  description: STRING,
       *  parameters_hash: STRING,
       *  new_value: STRING
       * }
       */
      saved_states: [],
      open_modules: [],
      global_data_loading_status: {},
      module_specific_data_loading_status: {},
      transition_duration: 0,
      configNames: [],
      selectedLang: "cov",
      global_legend: false,
      hash_loaded_data: "",
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
      contextmenu: {
        display: "none",
        content: null,
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
        // ...this.filter_values,
      },
    }

    this.defaultParameters = {
      production: {
        // starttime: this.parse_date_to_needed_string_date(new Date().getTime()),
        // endtime: this.parse_date_to_needed_string_date(new Date().getTime()),
        starttime: "2021-10-01",
        endtime: "2021-10-10",
        patientList_string: "Patient17",
        // pathogen: "94500-6",
        pathogen: "sau",
        // "0590f4b9-cb61-41ef-90b9-5589f0051c57,07fa50f5-33bb-4a68-81b1-bed2a205d961,121d517c-823c-4499-9be4-5583ebab2072,19a6c833-eb9d-4484-a243-deac6f503d74,25eacc6e-0b92-47ad-ad87-35f4df2a1f53,275ab5c5-1b9e-4e8b-8afd-0fa7aad03974,31a6e584-3b9a-4b46-a825-13f4fd61988a,359033ea-a23c-40f9-98db-28cd53b6981d,39189f3f-6965-48e8-9a81-a452801a3caf,40e72023-02ab-4561-97d6-f8bc533f9c44,424ab7af-b81b-4ecc-b678-abe4cc128fa6,489870a3-65bd-426f-a961-b0b435e1e7c8,5cedfae5-69d4-4d70-92a9-9c5aebff31d8,6ed70ea6-9a65-4c8b-8d08-488787c3e91e,710e4312-092e-47f5-9330-9527c70d46d6,7244c015-16ae-4c7a-a076-2fc737e482e2,72801f9a-c4eb-44f2-90ae-9505ff350fcf,a0fa9e58-8c40-4576-b293-6d84decd5db9,a41421bf-9917-4ac3-be75-2f821327579d,aabc9934-acec-490b-8860-72e05c755038,abeab0bb-b5b3-4668-a5d5-215b33cc86bb,b24b7417-60a6-49ae-a722-4c1853b55d7f,b58f9309-f23e-4c3a-9fa0-d9f3ed3e150f,d2d0d9cf-2070-46dd-9900-921948c2d669,d41490c2-10af-4b51-a0e6-d24da5bc27f2,d4e1bab1-4756-4e43-9fe5-0e7ff6d449d6,db14dbad-3f49-4c96-b7f3-ca867d403b52,dffb8e49-75d0-4d9f-8ff0-e755b8668822,e4a2ee11-358b-49fb-94dc-872fdd681420,e9af5f68-361c-4438-b176-e6e7c82b8800,f11f472a-03fc-42e8-8ac5-8c86a93bb095,fb45f344-d3b8-4e46-abda-727ae24407e4,fbb60bcf-f942-40c0-8eae-ce138850f46a,fc60eaf8-ce31-4dd0-a37b-9f39f7814ec0",
        pathogenList_string: "sars-cov-2",
        stationList_string: "Coronastation",
        // patientID: "c74f6215-4fc2-42a5-a3ad-f92536ca64dc",
        patientID: "Patient17",
      },
      sql_db: {
        starttime: "2010-10-01",
        endtime: "2012-10-10",
        patientList_string:
          "62411,63104,63842,64716,67867,68475,70448,76101,113749,175082",
        // pathogen: "1718",
        pathogen: "869",
        pathogenList_string: "sars-cov-2",
        stationList_string: "49",
        patientID: "62411",
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
      pascal2: {
        starttime: "2021-05-20",
        endtime: "2021-06-20",
        patientList_string: "Patient102",
        pathogenList_string: "sau",
        stationList_string: "Coronastation",
        patientID: "Patient102",
      },
      pathogenList_string: "COV",
      stationList_string: "Station 14",
    }
  }

  get_station_color = (station_id) => {
    return "black"
  }

  save_current_state = (desc, new_value) => {
    // !if hash von element 0 = aktueller hash -> nicht speichern
    // !new_value === undefined ist ein Signal

    if (
      this.state.saved_states[0] === undefined ||
      new_value !== undefined ||
      this.state.saved_states[0].parameters_hash !==
        this.current_parameters_hash
    ) {
      if (this.state.saved_states[0]) {
        let para_filter_hash_before = hash({
          filter: this.state.saved_states[0].filter_values,
          parameters: this.state.saved_states[0].parameter_values,
        })
        let para_filter_hash_after = hash({
          filter: this.filter_values,
          parameters: this.parameters,
        })

        if (para_filter_hash_before === para_filter_hash_after) {
          return
        }
      }

      this.setState((prevState) => {
        let current_state = {
          parameter_values: JSON.parse(
            JSON.stringify(this.last_loaded_parameters)
          ),
          filter_values:
            new_value === undefined
              ? undefined
              : JSON.parse(JSON.stringify(this.filter_values)),
          description: desc,
          timestamp: new Date().getTime(),
          parameters_hash: this.current_parameters_hash,
          new_value,
        }

        prevState.saved_states.unshift(current_state)
        prevState.saved_states = prevState.saved_states.slice(
          0,
          this.max_state_history_length
        )

        return prevState
      })
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
    console.log("Daten empfangen für Modul:", data_name)
    console.log(payload)

    let intern_callback_function = (data_to_save) => {
      this.original_data[data_name] = data_to_save

      // console.log("receiving data for data name", data_name)

      let possible_filter_values_before = this.set_possible_filter_values(
        data_name,
        payload
      )
      this.adapt_filter_values(possible_filter_values_before)
      // this.reset_filter()
      // this.filter_all_modules()
      // this.draw_all_modules()
    }

    if (
      data_name === "storyline" &&
      // payload.error === undefined &&
      payload.data.generate_storyline_data.data.graph_data.nodes.length <= 0 &&
      payload.data.generate_storyline_data.data.graph_data.links.length <= 0
    ) {
      intern_callback_function({
        path_width: [],
        calc_width: [],
        calc_height: [],
        backtrackingByPatient: [],
        forwardtrackingByPatient: [],
        station_paths: [],
        pathsDataNoMovements: [],
        pathsData: [],
        patientList: [],
        allStations: [],
        no_data: true,
      })
      return
    } else if (data_name === "storyline" && payload.error === undefined) {
      //#region storyline
      let { patientList, allStations, generate_storyline_data } = payload.data
      let path_width = 8

      let simulation = d3v4
        .forceSimulation()
        .force(
          "link",
          d3v4.forceLink().id((d) => d.id)
        )
        .force(
          "link",
          d3v4
            .forceLink()
            .id((d) => d.id)
            .distance(0)
            // .strength(0.1)
            // .iterations(10)
            .strength(0)
            .iterations(1)
        )
        .force(
          "collide",
          d3v4
            .forceCollide()
            .strength(1)
            .radius((d) => path_width * d.lop.length + 2 * path_width)
            .iterations(10)
        )
        .force("charge", d3v4.forceManyBody().strength(1))

      let sankeyLeft = (node) => node.depth
      let layout_function = sankeyLeft // sankeyJustify
      let n = patientList.length
      let node_padding = 1000 - n * (n - 1)
      // TODO: rewritten, weil so besser?
      // let node_padding = n * 200

      let link_data = generate_storyline_data.data.graph_data.links
      let node_data = generate_storyline_data.data.graph_data.nodes
      let max_cluster_count_per_timestep =
        generate_storyline_data.data.graph_data.maxClusterCountPerTimestep

      let timesteps_count = node_data[node_data.length - 1].timestep + 1

      let calc_node_padding = 1000
      let calc_width = timesteps_count * calc_node_padding
      let calc_height =
        n * 4 * path_width + max_cluster_count_per_timestep * 2 * path_width

      let storyline = (NL) => {
        const san = sankey()
          .nodeWidth(1)
          .nodePadding(node_padding)
          .extent([
            [0, 0],
            [calc_width, calc_height],
          ])
          .nodeAlign(layout_function)
          .iterations(100)

        let ret = san(NL)
        return ret
      }

      let all_timestamps = generate_storyline_data.data.graph_data.allTimestamps

      console.log("[STORYLINE] - storyline sankey layout begin")
      let { nodes, links } = storyline(
        {
          links: link_data,
          nodes: node_data,
        },
        node_padding,
        calc_width,
        calc_height
      )
      console.log("[STORYLINE] - storyline sankey layout end")

      nodes.forEach((n) => {
        n.x_0 = n.x0
        n.x_1 = n.x1
        n.y_0 = n.y0
        n.y_1 = n.y1
      })
      links.forEach((l) => {
        l.y_0 = l.y0
        l.y_1 = l.y1
      })

      /**
       * Nach dem Layouting jedem Knoten die "Reihenfolgennummer" geben + Initial-Position
       */
      console.log("[STORYLINE] - give starting numbers begin")
      for (let step = 0; step < timesteps_count; step++) {
        let stepNodes = nodes.filter(
          (n) =>
            n.timestep === step &&
            n.space !== "home" &&
            n.name !== "home" &&
            n.space !== "tmphome" &&
            n.name !== "tmphome"
        )
        stepNodes.sort((a, b) => (a.y0 + a.y1) / 2 - (b.y0 + b.y1) / 2)
        stepNodes.forEach((sn, i) => {
          sn.initOrder = i + 1
          sn.initPos = (calc_height / (stepNodes.length + 1)) * sn.initOrder
        })
      }
      /**
       * Jeden Zeitstempel durchgehen, den obersten Node (kleinest y0)
       * finden und den Betrag von allen in diesem Zeitstempel abziehen
       */
      console.log("[STORYLINE] - give starting numbers end")

      links = links.filter((d) => !d.movementLink)
      let storyline_data = {
        nodes,
        links,
      }

      // Zeile 1042 Storyline.js
      let stationPathsData = []
      let stationIDs = []
      console.log(
        "[STORYLINE] - create station links for static station positioning"
      )
      for (
        let scID = 0;
        scID < generate_storyline_data.data.graph_data.stationClusterIDcounter;
        scID++
      ) {
        let stationPath = {
          stationID: undefined,
          stationClusterID: scID,
          maxPatients: 0,
          path: [],
        }
        nodes.forEach((n) => {
          if (n.stationClusterID === scID) {
            if (stationPath.stationID === undefined) {
              stationPath.stationID = n.stationID
              if (!stationIDs.includes(n.stationID)) {
                stationIDs.push(n.stationID)
              }
            }
            if (stationPath.maxPatients < n.lop.length) {
              stationPath.maxPatients = n.lop.length
            }
            stationPath.path.push(n)
          }
        })

        stationPathsData.push(stationPath)
      }

      /**
       * Links erzeugen zwischen den Stationen, sodass diese eine gleiche Höhe haben
       */
      stationIDs.forEach((stationID) => {
        let spData = stationPathsData.filter((d) => stationID === d.stationID)

        for (let i = 0; i < spData.length - 1; i++) {
          let aEnde = spData[i].path[spData[i].path.length - 1]
          let bAnfang = spData[i + 1].path[0]

          links.push({
            source: aEnde,
            target: bAnfang,
            connectionLink: true,
          })
        }
      })

      console.log("[STORYLINE] - finished station links]")

      // let all_stations = []
      // stationPathsData.forEach(spd => {
      //   if (
      //     spd.stationID !== "home" &&
      //     spd.stationID !== "tmphome" &&
      //     !all_stations.includes(spd.stationID)
      //   ) {
      //     all_stations.push(spd.stationID)
      //   }
      // })

      let tmphomeStationData = stationPathsData.find(
        (d) => d.stationID === "tmphome"
      )
      let tmphomeMargin = tmphomeStationData
        ? tmphomeStationData.maxPatients * path_width
        : 0

      let pathsData = []
      let pathsDataNoMovements = []

      console.log("[STORYLINE] - pathsData for every single patient begin")

      let patients_infection_data =
        generate_storyline_data.data.patients_infection_data

      patientList.forEach((id) => {
        let keimeInfos = patients_infection_data[id].keimeInfos
        if (keimeInfos !== undefined) {
          /**
           * Falls Patient keine Daten zu diesem Keim hat, kann
           */
          let statusIndex = 0
          let pathObj = {
            path: [],
            patientID: id,
            status: keimeInfos.patientStates[statusIndex],
          }
          let pathNoMovementsObj = {
            path: [],
            patientID: id,
            status: keimeInfos.patientStates[statusIndex],
            movementPath: false,
          }

          // let checkIfIsMovementPath = false
          let lastStationID = undefined
          nodes.forEach((n) => {
            if (n.lop.includes(id)) {
              let position = n.lop.indexOf(id)

              let timestampDiff = Math.min(
                n.timestamp - n.timestampBefore,
                n.timestampAfter - n.timestamp
              )

              timestampDiff = timestampDiff / 2

              if (n.relevantNode === true && n.relevantType === "source") {
                pathObj.path.push({
                  patientID: id,
                  node: n,
                  position: position,
                  patientCount: n.lop.length,
                  timestamp: n.timestamp - timestampDiff,
                })

                pathNoMovementsObj.path.push({
                  patientID: id,
                  node: n,
                  position: position,
                  patientCount: n.lop.length,
                  timestamp: n.timestamp - timestampDiff,
                })

                pathNoMovementsObj.path.sort(
                  (a, b) => a.node.timestep - b.node.timestep
                )
                pathsDataNoMovements.push(pathNoMovementsObj)
                // checkIfIsMovementPath = true
                pathNoMovementsObj = {
                  path: [],
                  patientID: id,
                  status: keimeInfos.patientStates[statusIndex],
                  // movementPath: true
                  movementPath: false,
                  // movementPath: n.stationID !== n.sourceLinks[0].target.stationID
                }

                lastStationID = n.stationID

                pathNoMovementsObj.path.push({
                  patientID: id,
                  node: n,
                  position: position,
                  patientCount: n.lop.length,
                  timestamp: n.timestamp - timestampDiff,
                })
              }

              pathObj.path.push({
                patientID: id,
                node: n,
                position: position,
                patientCount: n.lop.length,
                timestamp: n.timestamp,
              })

              pathNoMovementsObj.path.push({
                patientID: id,
                node: n,
                position: position,
                patientCount: n.lop.length,
                timestamp: n.timestamp,
              })

              if (n.relevantNode === true && n.relevantType === "target") {
                pathObj.path.push({
                  patientID: id,
                  node: n,
                  position: position,
                  patientCount: n.lop.length,
                  timestamp: n.timestamp + timestampDiff,
                })

                if (lastStationID !== n.stationID) {
                  pathNoMovementsObj.movementPath = true
                }
                lastStationID = n.stationID

                pathNoMovementsObj.path.push({
                  patientID: id,
                  node: n,
                  position: position,
                  patientCount: n.lop.length,
                  timestamp: n.timestamp + timestampDiff,
                })

                pathNoMovementsObj.path.sort(
                  (a, b) => a.node.timestep - b.node.timestep
                )
                pathsDataNoMovements.push(pathNoMovementsObj)

                pathNoMovementsObj = {
                  path: [],
                  patientID: id,
                  status: keimeInfos.patientStates[statusIndex],
                  movementPath: false,
                }

                pathNoMovementsObj.path.push({
                  patientID: id,
                  node: n,
                  position: position,
                  patientCount: n.lop.length,
                  timestamp: n.timestamp + timestampDiff,
                })
              }

              if (n.infectionChangeOfPatient === id) {
                pathObj.path.sort((a, b) => a.node.timestep - b.node.timestep)
                pathsData.push(pathObj)

                statusIndex++
                pathObj = {
                  path: [],
                  patientID: id,
                  status: keimeInfos.patientStates[statusIndex],
                }

                pathObj.path.push({
                  patientID: id,
                  node: n,
                  position: position,
                  patientCount: n.lop.length,
                  timestamp: n.timestamp,
                })

                pathObj.path.push({
                  patientID: id,
                  node: n,
                  position: position,
                  patientCount: n.lop.length,
                  timestamp: n.timestamp + timestampDiff,
                })
              }
            }
          })

          pathObj.path.sort((a, b) => a.node.timestep - b.node.timestep)
          pathsData.push(pathObj)
        }
      })

      console.log("[STORYLINE] - pathsData for every single patient end")

      console.log("[STORYLINE] - backtracking grade 1 begin")
      /**
       * "Backtracking" for den Flashback
       */
      let backtrackingByPatient = {}
      patientList.forEach((paID) => {
        let pathsDataByPatient = pathsData.filter((d) => d.patientID === paID)
        let path = []
        let kontaktPatientenIDs = []
        let letzteKontaktknotenNodeIDs = {}
        pathsDataByPatient.forEach((pd) => {
          path = path.concat(pd.path)
        })
        let keimeInfos = patients_infection_data[paID].keimeInfos
        let kontaktPatienten = []
        let criticalContactDuringUnknown = []
        let eigeneEvents = []
        path.forEach((n) => {
          let patients = n.node.lop
          let ts = n.timestamp
          let paStatus = "unbekannt"
          let stationID = n.node.stationID

          // if (paID == 113749)
          //   console.log(keimeInfos.erstesPositiv, n.timestamp, stationID)

          if (
            keimeInfos.erstesPositiv !== undefined &&
            keimeInfos.erstesPositiv <= n.timestamp
          ) {
            paStatus = "krank"
          } else if (
            keimeInfos.letztesNegativ !== undefined &&
            keimeInfos.letztesNegativ <= n.timestamp
          ) {
            paStatus = "traeger"
          }

          if (paStatus !== "unbekannt") {
            let indexStatus = eigeneEvents.findIndex(
              (ee) => ee.newStatus === paStatus
            )
            if (indexStatus < 0) {
              eigeneEvents.push({
                node: n,
                newStatus: paStatus,
                eigenesEvent: true,
              })
            }
          }

          if (
            paStatus !== "krank" &&
            stationID !== "home" &&
            stationID !== "tmphome"
          ) {
            // "nur solange der Patient noch nicht Krank ist kann er sich anstecken"
            // Liste dere Kontaktpatienten in diesem Knoten durchgehen, und schauen
            // ob ein neuer gefährlicher Kontakt dabei ist
            patients.forEach((pbID) => {
              if (paID !== pbID) {
                let keimeInfosB = patients_infection_data[pbID].keimeInfos
                let pbStatus = "unbekannt"
                if (
                  keimeInfosB.erstesPositiv !== undefined &&
                  keimeInfosB.erstesPositiv <= n.timestamp
                ) {
                  pbStatus = "krank"
                } else if (
                  keimeInfosB.letztesNegativ !== undefined &&
                  keimeInfosB.letztesNegativ <= n.timestamp
                ) {
                  pbStatus = "traeger"
                }
                let index = kontaktPatienten.findIndex(
                  (d) =>
                    d.paStatus === paStatus &&
                    d.pbStatus === pbStatus &&
                    d.stationID === stationID &&
                    d.pbID === pbID
                )
                // if (pbStatus !== "unbekannt") {
                if (true) {
                  letzteKontaktknotenNodeIDs[pbID] = n.node.node
                }
                if (index < 0 && pbStatus !== "unbekannt") {
                  kontaktPatienten.push({
                    paID,
                    pbID,
                    paStatus,
                    pbStatus,
                    stationID,
                    node: n,
                    kontaktGrad: 1,
                  })
                  kontaktPatientenIDs.push(pbID)
                  if (paStatus === "unbekannt") {
                    criticalContactDuringUnknown.push({
                      paID,
                      pbID,
                      paStatus,
                      pbStatus,
                      stationID,
                      node: n,
                      kontaktGrad: 2,
                    })
                  }
                }
              }
            })
          }
        })
        /**
         * Verbindung zwischen Events herstellen
         */
        let findTraeger = eigeneEvents.filter((d) => d.newStatus === "traeger")
        let findKrank = eigeneEvents.filter((d) => d.newStatus === "krank")
        let lines = []

        let restlichenEvents = kontaktPatienten
        if (findTraeger.length > 0) {
          // "suche alle Events, die eingetreten sind bevor er traeger wurde"
          let eventsToTraeger = restlichenEvents.filter(
            (d) => d.node.timestamp < findTraeger[0].node.timestamp
          )
          restlichenEvents = restlichenEvents.filter(
            (d) => d.node.timestamp >= findTraeger[0].node.timestamp
          )

          eventsToTraeger.forEach((ett) => {
            let nodeA = findTraeger[0].node.node
            let nodeB = ett.node.node
            let timestampA = nodeA.timestamp
            let timestampB = ett.node.node.timestamp

            if (nodeA.nodeType === "movement") {
              let timestampDiff = Math.min(
                nodeA.timestamp - nodeA.timestampBefore,
                nodeA.timestampAfter - nodeA.timestamp
              )
              timestampDiff = timestampDiff / 2
              if (nodeA.relevantType === "source") {
                timestampA = nodeA.timestamp - timestampDiff
              } else if (nodeA.relevantType === "target") {
                timestampA = nodeA.timestamp + timestampDiff
              }
            }

            if (nodeB.nodeType === "movement") {
              let timestampDiff = Math.min(
                nodeB.timestamp - nodeB.timestampBefore,
                nodeB.timestampAfter - nodeB.timestamp
              )
              timestampDiff = timestampDiff / 2
              if (nodeB.relevantType === "source") {
                timestampB = nodeB.timestamp - timestampDiff
              } else if (nodeB.relevantType === "target") {
                timestampB = nodeB.timestamp + timestampDiff
              }
            }

            // let timestampDiff =
            //   findTraeger[0].node.node.timestamp - ett.node.node.timestamp
            // let middleTimestamp = ett.node.node.timestamp + timestampDiff

            // let middleTimestamp =
            //   (findTraeger[0].node.node.timestamp + ett.node.node.timestamp) / 2
            let middleTimestamp = (timestampA + timestampB) / 2
            let yPos = 0
            lines.push({
              sourceEvent: ett.node.node,
              targetEvent: findTraeger[0].node.node,
              lineType: "toTraeger",
              pointNodes: [
                // ett.node.node,
                // { timestamp: middleTimestamp, y: yPos },
                // findTraeger[0].node.node
                {
                  timestamp: timestampA,
                  y: nodeA,
                  eigenesEvent: true,
                },
                {
                  timestamp: middleTimestamp,
                  y: { y: yPos },
                },
                { timestamp: timestampB, y: nodeB },
              ],
            })
          })
        }

        if (findKrank.length > 0) {
          // "suche alle Events, die eingetreten sind bevor er traeger wurde"
          let eventsToKrank = restlichenEvents.filter(
            (d) => d.node.timestamp < findKrank[0].node.timestamp
          )
          restlichenEvents = restlichenEvents.filter(
            (d) => d.node.timestamp >= findKrank[0].node.timestamp
          )

          eventsToKrank.forEach((etk) => {
            // let timestampDiff =
            //   findKrank[0].node.node.timestamp - etk.node.node.timestamp
            // let middleTimestamp = etk.node.node.timestamp + timestampDiff

            let nodeA = findKrank[0].node.node
            let nodeB = etk.node.node
            let timestampA = nodeA.timestamp
            let timestampB = etk.node.node.timestamp

            if (nodeA.nodeType === "movement") {
              let timestampDiff = Math.min(
                nodeA.timestamp - nodeA.timestampBefore,
                nodeA.timestampAfter - nodeA.timestamp
              )
              timestampDiff = timestampDiff / 2
              if (nodeA.relevantType === "source") {
                timestampA = nodeA.timestamp - timestampDiff
              } else if (nodeA.relevantType === "target") {
                timestampA = nodeA.timestamp + timestampDiff
              }
            }

            if (nodeB.nodeType === "movement") {
              let timestampDiff = Math.min(
                nodeB.timestamp - nodeB.timestampBefore,
                nodeB.timestampAfter - nodeB.timestamp
              )
              timestampDiff = timestampDiff / 2
              if (nodeB.relevantType === "source") {
                timestampB = nodeB.timestamp - timestampDiff
              } else if (nodeB.relevantType === "target") {
                timestampB = nodeB.timestamp + timestampDiff
              }
            }
            // let middleTimestamp =
            //   (findKrank[0].node.node.timestamp + etk.node.node.timestamp) / 2
            let middleTimestamp = (timestampA + timestampB) / 2
            let yPos = 0
            lines.push({
              sourceEvent: etk.node.node,
              targetEvent: findKrank[0].node.node,
              lineType: "toKrank",
              pointNodes: [
                // etk.node.node,
                {
                  timestamp: timestampA,
                  y: nodeA,
                  eigenesEvent: true,
                },
                {
                  timestamp: middleTimestamp,
                  y: { y: yPos },
                },
                { timestamp: timestampB, y: nodeB },
                // findKrank[0].node.node
              ],
            })
          })
        }

        backtrackingByPatient[paID] = {
          kontaktPatientenIDs,
          letzteKontaktknotenNodeIDs,
          kontaktPatienten,
          eigeneEvents,
          lines,
          criticalContactDuringUnknown,
          grad2Contacts: [],
          grad2Lines: [],
          backtrackingPaths: [],
        }
      })
      console.log("[STORYLINE] - backtracking grade 1 end")

      console.log("[STORYLINE] - backtracking grade 2 begin")
      /**
       * Grad 2 Backtracking Flashback
       */
      patientList.forEach((paID) => {
        let pathsDataByPatient = pathsData.filter((d) => d.patientID === paID)
        let path = []
        pathsDataByPatient.forEach((pd) => {
          path = path.concat(pd.path)
        })
        let keimeInfos = patients_infection_data[paID].keimeInfos

        path.forEach((n) => {
          let patients = n.node.lop
          let ts = n.timestamp
          let paStatus = "unbekannt"
          let stationID = n.node.stationID

          if (
            keimeInfos.erstesPositiv !== undefined &&
            keimeInfos.erstesPositiv <= n.timestamp
          ) {
            paStatus = "krank"
          } else if (
            keimeInfos.letztesNegativ !== undefined &&
            keimeInfos.letztesNegativ <= n.timestamp
          ) {
            paStatus = "traeger"
          }

          if (
            paStatus !== "krank" &&
            stationID !== "home" &&
            stationID !== "tmphome"
          ) {
            // "nur solange der Patient noch nicht Krank ist kann er sich anstecken"
            // Liste dere Kontaktpatienten in diesem Knoten durchgehen, und schauen
            // ob ein neuer gefährlicher Kontakt dabei ist
            patients.forEach((pbID) => {
              if (paID !== pbID) {
                let keimeInfosB = patients_infection_data[pbID].keimeInfos
                let pbStatus = "unbekannt"
                if (
                  keimeInfosB.erstesPositiv !== undefined &&
                  keimeInfosB.erstesPositiv <= n.timestamp
                ) {
                  pbStatus = "krank"
                } else if (
                  keimeInfosB.letztesNegativ !== undefined &&
                  keimeInfosB.letztesNegativ <= n.timestamp
                ) {
                  pbStatus = "traeger"
                }

                if (pbStatus === "unbekannt") {
                  // if (true) {
                  let paBacktracking = backtrackingByPatient[paID]
                  let pbBacktracking = backtrackingByPatient[pbID]

                  // let unknownGrad2Paths = pbBacktracking
                  let unknownGrad2Contacts =
                    pbBacktracking.criticalContactDuringUnknown.filter(
                      // let unknownGrad2Contacts = pbBacktracking.kontaktPatienten.filter(
                      (d) => d.pbID !== paID && d.node.timestamp < ts
                    )
                  let newGrad2Contacts = []
                  unknownGrad2Contacts.forEach((ug2c) => {
                    let index = paBacktracking.kontaktPatienten.findIndex(
                      (d) => {
                        // console.log(d, ug2c)
                        // debugger
                        return (
                          d.stationID === ug2c.stationID &&
                          d.node.timestamp < ts &&
                          d.pbStatus === ug2c.pbStatus &&
                          d.pbID === ug2c.pbID
                        )
                      }
                    )

                    if (index < 0) {
                      newGrad2Contacts.push(ug2c)
                      paBacktracking.kontaktPatienten.push(ug2c)
                    }
                  })

                  // if (paID === 63104) {
                  //   console.log(newGrad2Contacts)
                  // }

                  if (newGrad2Contacts.length > 0) {
                    let middleContactCircle = {
                      paID,
                      pbID,
                      paStatus,
                      pbStatus,
                      stationID,
                      node: n,
                      kontaktGrad: 1,
                      middleContactCircle: true,
                    }
                    paBacktracking.kontaktPatienten.push(middleContactCircle)

                    let findTraeger = paBacktracking.eigeneEvents.filter(
                      (d) => d.newStatus === "traeger"
                    )
                    let findKrank = paBacktracking.eigeneEvents.filter(
                      (d) => d.newStatus === "krank"
                    )

                    let firstNode = undefined
                    let lineType = undefined
                    if (
                      findTraeger.length > 0 &&
                      findTraeger[0].node.timestamp > ts
                    ) {
                      firstNode = findTraeger[0].node.node
                      lineType = "toTraeger"
                    } else if (
                      findKrank.length > 0 &&
                      findKrank[0].node.timestamp > ts
                    ) {
                      firstNode = findKrank[0].node.node
                      lineType = "toKrank"
                    }

                    let grad2Lines = []
                    if (firstNode !== undefined) {
                      // Grad 0 Linie erzeugen

                      let nodeA = firstNode
                      let nodeB = n.node
                      let timestampA = nodeA.timestamp
                      let timestampB = nodeB.timestamp

                      if (nodeA.nodeType === "movement") {
                        let timestampDiff = Math.min(
                          nodeA.timestamp - nodeA.timestampBefore,
                          nodeA.timestampAfter - nodeA.timestamp
                        )
                        timestampDiff = timestampDiff / 2
                        if (nodeA.relevantType === "source") {
                          timestampA = nodeA.timestamp - timestampDiff
                        } else if (nodeA.relevantType === "target") {
                          timestampA = nodeA.timestamp + timestampDiff
                        }
                      }

                      if (nodeB.nodeType === "movement") {
                        let timestampDiff = Math.min(
                          nodeB.timestamp - nodeB.timestampBefore,
                          nodeB.timestampAfter - nodeB.timestamp
                        )
                        timestampDiff = timestampDiff / 2
                        if (nodeB.relevantType === "source") {
                          timestampB = nodeB.timestamp - timestampDiff
                        } else if (nodeB.relevantType === "target") {
                          timestampB = nodeB.timestamp + timestampDiff
                        }
                      }

                      let middleTimestamp = (timestampA + timestampB) / 2
                      let yPos = 0

                      grad2Lines.push({
                        sourceEvent: n.node,
                        targetEvent: firstNode,
                        lineType: lineType,
                        pointNodes: [
                          {
                            timestamp: timestampA,
                            y: nodeA,
                            eigenesEvent: true,
                          },
                          {
                            timestamp: middleTimestamp,
                            y: { y: yPos },
                          },
                          {
                            timestamp: timestampB,
                            y: nodeB,
                          },
                        ],
                      })
                    }

                    newGrad2Contacts.forEach((ng2c) => {
                      let nodeA = n.node
                      let nodeB = ng2c.node.node
                      let timestampA = nodeA.timestamp
                      let timestampB = nodeB.timestamp

                      if (nodeA.nodeType === "movement") {
                        let timestampDiff = Math.min(
                          nodeA.timestamp - nodeA.timestampBefore,
                          nodeA.timestampAfter - nodeA.timestamp
                        )
                        timestampDiff = timestampDiff / 2
                        if (nodeA.relevantType === "source") {
                          timestampA = nodeA.timestamp - timestampDiff
                        } else if (nodeA.relevantType === "target") {
                          timestampA = nodeA.timestamp + timestampDiff
                        }
                      }

                      if (nodeB.nodeType === "movement") {
                        let timestampDiff = Math.min(
                          nodeB.timestamp - nodeB.timestampBefore,
                          nodeB.timestampAfter - nodeB.timestamp
                        )
                        timestampDiff = timestampDiff / 2
                        if (nodeB.relevantType === "source") {
                          timestampB = nodeB.timestamp - timestampDiff
                        } else if (nodeB.relevantType === "target") {
                          timestampB = nodeB.timestamp + timestampDiff
                        }
                      }

                      let middleTimestamp = (timestampA + timestampB) / 2
                      let yPos = 0

                      grad2Lines.push({
                        sourceEvent: n.node,
                        targetEvent: firstNode,
                        lineType: lineType,
                        pointNodes: [
                          {
                            timestamp: timestampA,
                            y: nodeA,
                          },
                          {
                            timestamp: middleTimestamp,
                            y: { y: yPos },
                          },
                          {
                            timestamp: timestampB,
                            y: nodeB,
                          },
                        ],
                      })
                    })

                    paBacktracking.grad2Lines =
                      paBacktracking.grad2Lines.concat(grad2Lines)
                    paBacktracking.grad2Contacts =
                      paBacktracking.grad2Contacts.concat(newGrad2Contacts)
                  }
                }
              }
            })
          }
        })
      })
      console.log("[STORYLINE] - backtracking grade 2 end")

      console.log("[STORYLINE] - forwardtracking grade 1 begin")
      /**
       * "Forward tracking" for den Flashback
       */
      let forwardtrackingByPatient = {}
      patientList.forEach((paID) => {
        let pathsDataByPatient = pathsData.filter((d) => d.patientID === paID)
        let path = []
        let kontaktPatientenIDs = []
        let ersteKontaktKnotenIDs = {}
        pathsDataByPatient.forEach((pd) => {
          path = path.concat(pd.path)
        })
        let keimeInfos = patients_infection_data[paID].keimeInfos
        let kontaktPatienten = []
        let eigeneEvents = []
        path.forEach((n) => {
          let patients = n.node.lop
          let ts = n.timestamp
          let paStatus = "unbekannt"
          let stationID = n.node.stationID

          if (
            keimeInfos.erstesPositiv !== undefined &&
            keimeInfos.erstesPositiv <= n.timestamp
          ) {
            paStatus = "krank"
          } else if (
            keimeInfos.letztesNegativ !== undefined &&
            keimeInfos.letztesNegativ <= n.timestamp
          ) {
            paStatus = "traeger"
          }

          if (paStatus !== "unbekannt") {
            let indexStatus = eigeneEvents.findIndex(
              (ee) => ee.newStatus === paStatus
            )
            if (indexStatus < 0) {
              eigeneEvents.push({
                node: n,
                newStatus: paStatus,
                eigenesEvent: true,
              })
            }
          }

          if (
            paStatus !== "unbekannt" &&
            stationID !== "home" &&
            stationID !== "tmphome"
          ) {
            // "nur solange der Patient nicht mehr Unbekannt ist kann er jmdn anstecken"
            // Liste dere Kontaktpatienten in diesem Knoten durchgehen, und schauen
            // ob ein neuer gefährlicher Kontakt dabei ist
            patients.forEach((pbID) => {
              if (paID !== pbID) {
                let keimeInfosB = patients_infection_data[pbID].keimeInfos
                let pbStatus = "unbekannt"
                if (
                  keimeInfosB.erstesPositiv !== undefined &&
                  keimeInfosB.erstesPositiv <= n.timestamp
                ) {
                  pbStatus = "krank"
                } else if (
                  keimeInfosB.letztesNegativ !== undefined &&
                  keimeInfosB.letztesNegativ <= n.timestamp
                ) {
                  pbStatus = "traeger"
                }
                let index = kontaktPatienten.findIndex(
                  (d) =>
                    d.paStatus === paStatus &&
                    d.pbStatus === pbStatus &&
                    d.stationID === stationID &&
                    d.pbID === pbID
                )
                if (
                  pbStatus !== "krank" &&
                  ersteKontaktKnotenIDs[pbID] === undefined
                ) {
                  ersteKontaktKnotenIDs[pbID] = n.node.node
                }
                if (index < 0 && pbStatus !== "krank") {
                  kontaktPatienten.push({
                    paID,
                    pbID,
                    paStatus,
                    pbStatus,
                    stationID,
                    node: n,
                    kontaktGrad: 1,
                  })
                  kontaktPatientenIDs.push(pbID)
                }
              }
            })
          }
        })
        /**
         * Verbindung zwischen Events herstellen
         */
        let findTraeger = eigeneEvents.filter((d) => d.newStatus === "traeger")
        let findKrank = eigeneEvents.filter((d) => d.newStatus === "krank")
        let lines = []

        let restlichenEvents = kontaktPatienten

        if (findKrank.length > 0) {
          let eventsToKrank = restlichenEvents.filter(
            (d) => d.node.timestamp > findKrank[0].node.timestamp
          )
          restlichenEvents = restlichenEvents.filter(
            (d) => d.node.timestamp <= findKrank[0].node.timestamp
          )

          eventsToKrank.forEach((etk) => {
            // let timestampDiff =
            //   findKrank[0].node.node.timestamp - etk.node.node.timestamp
            // let middleTimestamp = etk.node.node.timestamp + timestampDiff

            let nodeA = findKrank[0].node.node
            let nodeB = etk.node.node
            let timestampA = nodeA.timestamp
            let timestampB = etk.node.node.timestamp

            if (nodeA.nodeType === "movement") {
              let timestampDiff = Math.min(
                nodeA.timestamp - nodeA.timestampBefore,
                nodeA.timestampAfter - nodeA.timestamp
              )
              timestampDiff = timestampDiff / 2
              if (nodeA.relevantType === "source") {
                timestampA = nodeA.timestamp - timestampDiff
              } else if (nodeA.relevantType === "target") {
                timestampA = nodeA.timestamp + timestampDiff
              }
            }

            if (nodeB.nodeType === "movement") {
              let timestampDiff = Math.min(
                nodeB.timestamp - nodeB.timestampBefore,
                nodeB.timestampAfter - nodeB.timestamp
              )
              timestampDiff = timestampDiff / 2
              if (nodeB.relevantType === "source") {
                timestampB = nodeB.timestamp - timestampDiff
              } else if (nodeB.relevantType === "target") {
                timestampB = nodeB.timestamp + timestampDiff
              }
            }
            // let middleTimestamp =
            //   (findKrank[0].node.node.timestamp + etk.node.node.timestamp) / 2
            let middleTimestamp = (timestampA + timestampB) / 2
            let yPos = 0
            lines.push({
              sourceEvent: etk.node.node,
              targetEvent: findKrank[0].node.node,
              lineType: "toKrank",
              pointNodes: [
                // etk.node.node,
                {
                  timestamp: timestampA,
                  y: nodeA,
                  eigenesEvent: true,
                },
                {
                  timestamp: middleTimestamp,
                  y: { y: yPos },
                },
                { timestamp: timestampB, y: nodeB },
                // findKrank[0].node.node
              ],
            })
          })
        }

        if (findTraeger.length > 0) {
          // "suche alle Events, die eingetreten sind bevor er traeger wurde"
          let eventsToTraeger = restlichenEvents.filter(
            (d) => d.node.timestamp > findTraeger[0].node.timestamp
          )
          restlichenEvents = restlichenEvents.filter(
            // sollte leer sein
            (d) => d.node.timestamp <= findTraeger[0].node.timestamp
          )

          eventsToTraeger.forEach((ett) => {
            let nodeA = findTraeger[0].node.node
            let nodeB = ett.node.node
            let timestampA = nodeA.timestamp
            let timestampB = ett.node.node.timestamp

            if (nodeA.nodeType === "movement") {
              let timestampDiff = Math.min(
                nodeA.timestamp - nodeA.timestampBefore,
                nodeA.timestampAfter - nodeA.timestamp
              )
              timestampDiff = timestampDiff / 2
              if (nodeA.relevantType === "source") {
                timestampA = nodeA.timestamp - timestampDiff
              } else if (nodeA.relevantType === "target") {
                timestampA = nodeA.timestamp + timestampDiff
              }
            }

            if (nodeB.nodeType === "movement") {
              let timestampDiff = Math.min(
                nodeB.timestamp - nodeB.timestampBefore,
                nodeB.timestampAfter - nodeB.timestamp
              )
              timestampDiff = timestampDiff / 2
              if (nodeB.relevantType === "source") {
                timestampB = nodeB.timestamp - timestampDiff
              } else if (nodeB.relevantType === "target") {
                timestampB = nodeB.timestamp + timestampDiff
              }
            }

            // let timestampDiff =
            //   findTraeger[0].node.node.timestamp - ett.node.node.timestamp
            // let middleTimestamp = ett.node.node.timestamp + timestampDiff

            // let middleTimestamp =
            //   (findTraeger[0].node.node.timestamp + ett.node.node.timestamp) / 2
            let middleTimestamp = (timestampA + timestampB) / 2
            let yPos = 0
            lines.push({
              sourceEvent: ett.node.node,
              targetEvent: findTraeger[0].node.node,
              lineType: "toTraeger",
              pointNodes: [
                // ett.node.node,
                // { timestamp: middleTimestamp, y: yPos },
                // findTraeger[0].node.node
                {
                  timestamp: timestampA,
                  y: nodeA,
                  eigenesEvent: true,
                },
                {
                  timestamp: middleTimestamp,
                  y: { y: yPos },
                },
                { timestamp: timestampB, y: nodeB },
              ],
            })
          })
        }

        forwardtrackingByPatient[paID] = {
          kontaktPatientenIDs,
          ersteKontaktKnotenIDs,
          letzteKontaktknotenNodeIDs: ersteKontaktKnotenIDs,
          kontaktPatienten,
          eigeneEvents,
          lines,
          // criticalContactDuringUnknown,
          grad2Contacts: [],
          grad2Lines: [],
          backtrackingPaths: [],
        }
      })
      console.log("[STORYLINE] - forwardtracking grade 1 end")

      console.log(
        "[STORYLINE] - Pathsdata for infectionspread forward and backward begin"
      )

      /**
       * diese Schleife wird gebraucht um auch atienten 2ten Grades
       * bis zum relevanten Event dicker zu machen
       */
      patientList.forEach((paID) => {
        let backTrackingOfPatient = backtrackingByPatient[paID]

        backTrackingOfPatient.grad2Contacts.forEach((g2c) => {
          let pcID = g2c.pbID
          let nodeID = g2c.node.node.node

          if (backTrackingOfPatient.kontaktPatientenIDs.includes(pcID)) {
            backTrackingOfPatient.letzteKontaktknotenNodeIDs[pcID] = Math.max(
              backTrackingOfPatient.letzteKontaktknotenNodeIDs[pcID],
              nodeID
            )
          } else {
            backTrackingOfPatient.letzteKontaktknotenNodeIDs[pcID] = nodeID
            backTrackingOfPatient.kontaktPatientenIDs.push(pcID)
          }

          pcID = g2c.paID

          if (backTrackingOfPatient.kontaktPatientenIDs.includes(pcID)) {
            backTrackingOfPatient.letzteKontaktknotenNodeIDs[pcID] = Math.max(
              backTrackingOfPatient.letzteKontaktknotenNodeIDs[pcID],
              nodeID
            )
          } else {
            if (
              backTrackingOfPatient.letzteKontaktknotenNodeIDs[pcID] ===
              undefined
            ) {
              backTrackingOfPatient.letzteKontaktknotenNodeIDs[pcID] = nodeID
            } else {
              backTrackingOfPatient.letzteKontaktknotenNodeIDs[pcID] = Math.max(
                backTrackingOfPatient.letzteKontaktknotenNodeIDs[pcID],
                nodeID
              )
            }
            backTrackingOfPatient.kontaktPatientenIDs.push(pcID)
          }
        })
      })

      /**
       * Die Backtracking-paths erzeugen
       */
      patientList.forEach((paID) => {
        let backTrackingOfPatient = backtrackingByPatient[paID]
        let pathsData = []

        backTrackingOfPatient.grad2Contacts.forEach((g2c) => {
          let pcID = g2c.pbID
          let nodeID = g2c.node.node.node

          if (
            backTrackingOfPatient.letzteKontaktknotenNodeIDs[pcID] === undefined
          ) {
            backTrackingOfPatient.letzteKontaktknotenNodeIDs[pcID] = nodeID
            backTrackingOfPatient.kontaktPatientenIDs.push(pcID)
          } else {
            backTrackingOfPatient.letzteKontaktknotenNodeIDs[pcID] = Math.max(
              backTrackingOfPatient.letzteKontaktknotenNodeIDs[pcID],
              nodeID
            )
          }
        })

        patientList.forEach((pbID) => {
          let id = pbID
          // if (paID === pbID) {
          // ganze Linie offensichtlich anzeigen
          let infectionDataArray = patients_infection_data[id].keimeInfos
          if (infectionDataArray !== undefined) {
            if (paID === pbID) {
              /**
               * Falls Patient keine Daten zu diesem Keim hat, kann
               */
              let statusIndex = 0
              let pathObj = {
                path: [],
                patientID: id,
                status: infectionDataArray.patientStates[statusIndex],
              }

              let lastStationID = undefined
              nodes.forEach((n) => {
                if (n.lop.includes(id)) {
                  let position = n.lop.indexOf(id)

                  let timestampDiff = Math.min(
                    n.timestamp - n.timestampBefore,
                    n.timestampAfter - n.timestamp
                  )

                  // let cpTimestampDiff = timestampDiff

                  timestampDiff = timestampDiff / 2

                  if (n.relevantNode === true && n.relevantType === "source") {
                    pathObj.path.push({
                      patientID: id,
                      node: n,
                      position: position,
                      patientCount: n.lop.length,
                      timestamp: n.timestamp - timestampDiff,
                    })

                    lastStationID = n.stationID
                  }

                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp,
                  })

                  if (n.relevantNode === true && n.relevantType === "target") {
                    pathObj.path.push({
                      patientID: id,
                      node: n,
                      position: position,
                      patientCount: n.lop.length,
                      timestamp: n.timestamp + timestampDiff,
                    })

                    lastStationID = n.stationID
                  }

                  if (n.infectionChangeOfPatient === id) {
                    pathObj.path.sort(
                      (a, b) => a.node.timestep - b.node.timestep
                    )
                    pathsData.push(pathObj)

                    statusIndex++
                    pathObj = {
                      path: [],
                      patientID: id,
                      status: infectionDataArray.patientStates[statusIndex],
                    }

                    pathObj.path.push({
                      patientID: id,
                      node: n,
                      position: position,
                      patientCount: n.lop.length,
                      timestamp: n.timestamp,
                    })

                    pathObj.path.push({
                      patientID: id,
                      node: n,
                      position: position,
                      patientCount: n.lop.length,
                      timestamp: n.timestamp + timestampDiff,
                    })
                  }
                }
              })

              pathObj.path.sort((a, b) => a.node.timestep - b.node.timestep)
              pathsData.push(pathObj)
            } else if (
              backTrackingOfPatient.kontaktPatientenIDs.includes(pbID)
            ) {
              // Linien normal bis zum letzten Übertragungs-Kontakt (bevor krank)
              let letzterKontaktknoten =
                backTrackingOfPatient.letzteKontaktknotenNodeIDs[pbID]
              /**
               * Falls Patient keine Daten zu diesem Keim hat, kann
               */
              let restIsNotRelevant = false

              let statusIndex = 0
              let pathObj = {
                path: [],
                patientID: id,
                status: infectionDataArray.patientStates[statusIndex],
                notRelevant: restIsNotRelevant,
              }

              let lastStationID = undefined
              nodes.forEach((n) => {
                if (n.lop.includes(id)) {
                  let position = n.lop.indexOf(id)

                  let timestampDiff = Math.min(
                    n.timestamp - n.timestampBefore,
                    n.timestampAfter - n.timestamp
                  )

                  // let cpTimestampDiff = timestampDiff

                  timestampDiff = timestampDiff / 2

                  if (n.relevantNode === true && n.relevantType === "source") {
                    pathObj.path.push({
                      patientID: id,
                      node: n,
                      position: position,
                      patientCount: n.lop.length,
                      timestamp: n.timestamp - timestampDiff,
                    })

                    lastStationID = n.stationID
                  }

                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp,
                  })

                  if (n.relevantNode === true && n.relevantType === "target") {
                    pathObj.path.push({
                      patientID: id,
                      node: n,
                      position: position,
                      patientCount: n.lop.length,
                      timestamp: n.timestamp + timestampDiff,
                    })

                    lastStationID = n.stationID
                  }

                  if (n.infectionChangeOfPatient === id) {
                    pathObj.path.sort(
                      (a, b) => a.node.timestep - b.node.timestep
                    )
                    pathsData.push(pathObj)

                    statusIndex++
                    pathObj = {
                      path: [],
                      patientID: id,
                      status: infectionDataArray.patientStates[statusIndex],
                      notRelevant: restIsNotRelevant,
                    }

                    pathObj.path.push({
                      patientID: id,
                      node: n,
                      position: position,
                      patientCount: n.lop.length,
                      timestamp: n.timestamp,
                    })

                    pathObj.path.push({
                      patientID: id,
                      node: n,
                      position: position,
                      patientCount: n.lop.length,
                      timestamp: n.timestamp + timestampDiff,
                    })
                  }

                  if (n.node === letzterKontaktknoten) {
                    restIsNotRelevant = true
                    pathObj.path.sort(
                      (a, b) => a.node.timestep - b.node.timestep
                    )
                    pathsData.push(pathObj)

                    pathObj = {
                      path: [],
                      patientID: id,
                      status: infectionDataArray.patientStates[statusIndex],
                      notRelevant: restIsNotRelevant,
                    }

                    pathObj.path.push({
                      patientID: id,
                      node: n,
                      position: position,
                      patientCount: n.lop.length,
                      timestamp: n.timestamp,
                    })

                    pathObj.path.push({
                      patientID: id,
                      node: n,
                      position: position,
                      patientCount: n.lop.length,
                      timestamp: n.timestamp + timestampDiff,
                    })
                  }
                }
              })

              pathObj.path.sort((a, b) => a.node.timestep - b.node.timestep)
              pathsData.push(pathObj)
            } else {
              // Linie durchgehend dünn
              /**
               * Falls Patient keine Daten zu diesem Keim hat, kann
               */
              let restIsNotRelevant = true

              let statusIndex = 0
              let pathObj = {
                path: [],
                patientID: id,
                status: infectionDataArray.patientStates[statusIndex],
                notRelevant: restIsNotRelevant,
              }

              let lastStationID = undefined
              nodes.forEach((n) => {
                if (n.lop.includes(id)) {
                  let position = n.lop.indexOf(id)

                  let timestampDiff = Math.min(
                    n.timestamp - n.timestampBefore,
                    n.timestampAfter - n.timestamp
                  )

                  // let cpTimestampDiff = timestampDiff

                  timestampDiff = timestampDiff / 2

                  if (n.relevantNode === true && n.relevantType === "source") {
                    pathObj.path.push({
                      patientID: id,
                      node: n,
                      position: position,
                      patientCount: n.lop.length,
                      timestamp: n.timestamp - timestampDiff,
                    })

                    lastStationID = n.stationID
                  }

                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp,
                  })

                  if (n.relevantNode === true && n.relevantType === "target") {
                    pathObj.path.push({
                      patientID: id,
                      node: n,
                      position: position,
                      patientCount: n.lop.length,
                      timestamp: n.timestamp + timestampDiff,
                    })

                    lastStationID = n.stationID
                  }

                  if (n.infectionChangeOfPatient === id) {
                    pathObj.path.sort(
                      (a, b) => a.node.timestep - b.node.timestep
                    )
                    pathsData.push(pathObj)

                    statusIndex++
                    pathObj = {
                      path: [],
                      patientID: id,
                      status: infectionDataArray.patientStates[statusIndex],
                      notRelevant: restIsNotRelevant,
                    }

                    pathObj.path.push({
                      patientID: id,
                      node: n,
                      position: position,
                      patientCount: n.lop.length,
                      timestamp: n.timestamp,
                    })

                    pathObj.path.push({
                      patientID: id,
                      node: n,
                      position: position,
                      patientCount: n.lop.length,
                      timestamp: n.timestamp + timestampDiff,
                    })
                  }
                }
              })

              pathObj.path.sort((a, b) => a.node.timestep - b.node.timestep)
              pathsData.push(pathObj)
            }
          }
        })
        backTrackingOfPatient.backtrackingPaths =
          backTrackingOfPatient.backtrackingPaths.concat(pathsData)
      })

      /**
       * Die Forwardtracking-paths erzeugen
       */
      patientList.forEach((paID) => {
        let forwardTrackingOfPatient = forwardtrackingByPatient[paID]
        let pathsData = []

        patientList.forEach((pbID) => {
          let id = pbID
          // if (paID === pbID) {
          // ganze Linie offensichtlich anzeigen
          let infectionDataArray = patients_infection_data[id].keimeInfos
          if (infectionDataArray !== undefined) {
            if (paID === pbID) {
              /**
               * Falls Patient keine Daten zu diesem Keim hat, kann
               */
              let statusIndex = 0
              let pathObj = {
                path: [],
                patientID: id,
                status: infectionDataArray.patientStates[statusIndex],
              }

              let lastStationID = undefined
              nodes.forEach((n) => {
                if (n.lop.includes(id)) {
                  let position = n.lop.indexOf(id)

                  let timestampDiff = Math.min(
                    n.timestamp - n.timestampBefore,
                    n.timestampAfter - n.timestamp
                  )

                  // let cpTimestampDiff = timestampDiff

                  timestampDiff = timestampDiff / 2

                  if (n.relevantNode === true && n.relevantType === "source") {
                    pathObj.path.push({
                      patientID: id,
                      node: n,
                      position: position,
                      patientCount: n.lop.length,
                      timestamp: n.timestamp - timestampDiff,
                    })

                    lastStationID = n.stationID
                  }

                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp,
                  })

                  if (n.relevantNode === true && n.relevantType === "target") {
                    pathObj.path.push({
                      patientID: id,
                      node: n,
                      position: position,
                      patientCount: n.lop.length,
                      timestamp: n.timestamp + timestampDiff,
                    })

                    lastStationID = n.stationID
                  }

                  if (n.infectionChangeOfPatient === id) {
                    pathObj.path.sort(
                      (a, b) => a.node.timestep - b.node.timestep
                    )
                    pathsData.push(pathObj)

                    statusIndex++
                    pathObj = {
                      path: [],
                      patientID: id,
                      status: infectionDataArray.patientStates[statusIndex],
                    }

                    pathObj.path.push({
                      patientID: id,
                      node: n,
                      position: position,
                      patientCount: n.lop.length,
                      timestamp: n.timestamp,
                    })

                    pathObj.path.push({
                      patientID: id,
                      node: n,
                      position: position,
                      patientCount: n.lop.length,
                      timestamp: n.timestamp + timestampDiff,
                    })
                  }
                }
              })

              pathObj.path.sort((a, b) => a.node.timestep - b.node.timestep)
              pathsData.push(pathObj)
            } else if (
              forwardTrackingOfPatient.kontaktPatientenIDs.includes(pbID)
            ) {
              // Linien normal bis zum letzten Übertragungs-Kontakt (bevor krank)
              let letzterKontaktknoten =
                forwardTrackingOfPatient.ersteKontaktKnotenIDs[pbID]
              /**
               * Falls Patient keine Daten zu diesem Keim hat, kann
               */
              let restIsNotRelevant = true

              let statusIndex = 0
              let pathObj = {
                path: [],
                patientID: id,
                status: infectionDataArray.patientStates[statusIndex],
                notRelevant: restIsNotRelevant,
              }

              let lastStationID = undefined
              nodes.forEach((n) => {
                if (n.lop.includes(id)) {
                  let position = n.lop.indexOf(id)

                  let timestampDiff = Math.min(
                    n.timestamp - n.timestampBefore,
                    n.timestampAfter - n.timestamp
                  )

                  // let cpTimestampDiff = timestampDiff

                  timestampDiff = timestampDiff / 2

                  if (n.relevantNode === true && n.relevantType === "source") {
                    pathObj.path.push({
                      patientID: id,
                      node: n,
                      position: position,
                      patientCount: n.lop.length,
                      timestamp: n.timestamp - timestampDiff,
                    })

                    lastStationID = n.stationID
                  }

                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp,
                  })

                  if (n.relevantNode === true && n.relevantType === "target") {
                    pathObj.path.push({
                      patientID: id,
                      node: n,
                      position: position,
                      patientCount: n.lop.length,
                      timestamp: n.timestamp + timestampDiff,
                    })

                    lastStationID = n.stationID
                  }

                  if (n.infectionChangeOfPatient === id) {
                    pathObj.path.sort(
                      (a, b) => a.node.timestep - b.node.timestep
                    )
                    pathsData.push(pathObj)

                    statusIndex++
                    pathObj = {
                      path: [],
                      patientID: id,
                      status: infectionDataArray.patientStates[statusIndex],
                      notRelevant: restIsNotRelevant,
                    }

                    pathObj.path.push({
                      patientID: id,
                      node: n,
                      position: position,
                      patientCount: n.lop.length,
                      timestamp: n.timestamp,
                    })

                    pathObj.path.push({
                      patientID: id,
                      node: n,
                      position: position,
                      patientCount: n.lop.length,
                      timestamp: n.timestamp + timestampDiff,
                    })
                  }

                  if (n.node === letzterKontaktknoten) {
                    restIsNotRelevant = false
                    pathObj.path.sort(
                      (a, b) => a.node.timestep - b.node.timestep
                    )
                    pathsData.push(pathObj)

                    pathObj = {
                      path: [],
                      patientID: id,
                      status: infectionDataArray.patientStates[statusIndex],
                      notRelevant: restIsNotRelevant,
                    }

                    pathObj.path.push({
                      patientID: id,
                      node: n,
                      position: position,
                      patientCount: n.lop.length,
                      timestamp: n.timestamp,
                    })

                    pathObj.path.push({
                      patientID: id,
                      node: n,
                      position: position,
                      patientCount: n.lop.length,
                      timestamp: n.timestamp + timestampDiff,
                    })
                  }
                }
              })

              pathObj.path.sort((a, b) => a.node.timestep - b.node.timestep)
              pathsData.push(pathObj)
            } else {
              // Linie durchgehend dünn
              /**
               * Falls Patient keine Daten zu diesem Keim hat, kann
               */
              let restIsNotRelevant = true

              let statusIndex = 0
              let pathObj = {
                path: [],
                patientID: id,
                status: infectionDataArray.patientStates[statusIndex],
                notRelevant: restIsNotRelevant,
              }

              let lastStationID = undefined
              nodes.forEach((n) => {
                if (n.lop.includes(id)) {
                  let position = n.lop.indexOf(id)

                  let timestampDiff = Math.min(
                    n.timestamp - n.timestampBefore,
                    n.timestampAfter - n.timestamp
                  )

                  // let cpTimestampDiff = timestampDiff

                  timestampDiff = timestampDiff / 2

                  if (n.relevantNode === true && n.relevantType === "source") {
                    pathObj.path.push({
                      patientID: id,
                      node: n,
                      position: position,
                      patientCount: n.lop.length,
                      timestamp: n.timestamp - timestampDiff,
                    })

                    lastStationID = n.stationID
                  }

                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp,
                  })

                  if (n.relevantNode === true && n.relevantType === "target") {
                    pathObj.path.push({
                      patientID: id,
                      node: n,
                      position: position,
                      patientCount: n.lop.length,
                      timestamp: n.timestamp + timestampDiff,
                    })

                    lastStationID = n.stationID
                  }

                  if (n.infectionChangeOfPatient === id) {
                    pathObj.path.sort(
                      (a, b) => a.node.timestep - b.node.timestep
                    )
                    pathsData.push(pathObj)

                    statusIndex++
                    pathObj = {
                      path: [],
                      patientID: id,
                      status: infectionDataArray.patientStates[statusIndex],
                      notRelevant: restIsNotRelevant,
                    }

                    pathObj.path.push({
                      patientID: id,
                      node: n,
                      position: position,
                      patientCount: n.lop.length,
                      timestamp: n.timestamp,
                    })

                    pathObj.path.push({
                      patientID: id,
                      node: n,
                      position: position,
                      patientCount: n.lop.length,
                      timestamp: n.timestamp + timestampDiff,
                    })
                  }
                }
              })

              pathObj.path.sort((a, b) => a.node.timestep - b.node.timestep)
              pathsData.push(pathObj)
            }
          }
        })
        forwardTrackingOfPatient.backtrackingPaths =
          forwardTrackingOfPatient.backtrackingPaths.concat(pathsData)
      })

      console.log(
        "[STORYLINE] - Pathsdata for infectionspread forward and backward end"
      )
      //#endregion storyline

      // TODO: Storyline Zeile 2970+ missing; im prinzip nurnoch force directed
      // TODO und das speichern der Daten + Filtern der daten + Anzeigen dann... (copy von Storyline.js machen und so)
      let firstPositions = false
      let sim_counter = 0
      setTimeout(() => {
        firstPositions = true
      }, 10)

      console.log("Simulation START")
      let firstTick = false

      simulation.nodes(nodes).on("tick", () => {
        if (!firstTick) {
          firstTick = true
          console.log("first sim tick")
        }
        sim_counter++
        storyline_data.nodes.forEach((d) => {
          let x_factor = d.timestep

          d.x = x_factor * (calc_width / timesteps_count)
          if (d.name === "home" || d.space === "home") {
            // home oben fest kleben
            d.y
          } else if (d.name === "tmphome" || d.space === "tmphome") {
            // tmphome unten fest kleben
            d.y = calc_height
          } else {
            if (firstPositions) {
              // rest frei beweglich ... reset wenn außerhalb boudnaries
              if (d.y < 0) {
                d.y = d.initPos
              } else if (d.y > calc_height) {
                d.y = d.initPos
              }
            } else {
              d.y = d.initPos
            }
          }
          /**
           * Mittelwert der y-Pos aller Knoten eines StationClusterIDs
           * berechnen und auf dessen Knoten verteilen
           */
          stationPathsData.forEach((sp) => {
            let total_y = 0
            sp.path.forEach((node) => {
              total_y += node.y
            })
            let avg_y = total_y / sp.path.length
            sp.path.forEach((node) => {
              node.y = avg_y
            })
          })
        })
      })

      simulation.force("link").links(links)

      setTimeout(() => {
        if (simulation) {
          simulation.stop()
          console.log("Simulation STOPPED")
          console.log("Simulation step count:", sim_counter)
          let station_paths = {}
          allStations.forEach((s_id) => {
            station_paths[s_id] = stationPathsData.filter(
              (d) => d.stationID === s_id
            )
          })
          station_paths["home"] = stationPathsData.filter(
            (d) => d.stationID === "home"
          )
          station_paths["tmphome"] = stationPathsData.filter(
            (d) => d.stationID === "tmphome"
          )
          intern_callback_function({
            path_width,
            calc_width,
            calc_height,
            backtrackingByPatient,
            forwardtrackingByPatient,
            station_paths,
            pathsDataNoMovements,
            pathsData,
            patientList,
            allStations,
            todo: "todo",
          })
        }
      }, 2000)

      console.log("Simulation END")
      return
    }

    intern_callback_function(payload)
  }

  get_original_data = (module_name) => {
    let data = this.original_data[module_name]
    if (data) {
      // return JSON.parse(JSON.stringify(data))
      return data
    } else {
      return undefined
    }
  }

  get_data_to_freeze_module = (module_name) => {
    // TODO:
    // gets original data
    // gets possible filter values for that data set (or just current possible values?)
  }

  /**
   * Adapt current filter value selection if old
   * is undefined or right at the edge of possibility
   */
  adapt_filter_values = (old_possible_filter_values) => {
    if (this.filter_values_to_overwrite) {
      this.set_complete_filter_values(this.filter_values_to_overwrite)
      // this.set_filter_values_as_state("adapt_filter_values")
      return
    }

    if (
      this.filter_values.min_ts === undefined ||
      this.filter_values.min_ts === old_possible_filter_values.min_ts
    ) {
      // min_ts, max_ts
      this.filter_values.min_ts = this.possible_filter_values.min_ts
      this.filter_values.min_time = this.possible_filter_values.min_time
    }

    if (
      this.filter_values.max_ts === undefined ||
      this.filter_values.max_ts === old_possible_filter_values.max_ts
    ) {
      this.filter_values.max_ts = this.possible_filter_values.max_ts
      this.filter_values.max_time = this.possible_filter_values.max_time
    }

    // patients
    for (let pid of this.possible_filter_values.patients) {
      if (
        !old_possible_filter_values.patients.includes(pid) &&
        !this.filter_values.patients.includes(pid)
      ) {
        this.filter_values.patients.push(pid)
      }
    }

    // stations -> stays "unselected" or previous selected station stays...
    // because only one station can be selected at a time

    this.set_filter_values_as_state("adapt_filter_values")
  }

  reset_filter_to_possible_values = () => {
    this.filter_values.min_ts = this.possible_filter_values.min_ts
    this.filter_values.max_ts = this.possible_filter_values.max_ts

    this.filter_values.min_time = this.possible_filter_values.min_time
    this.filter_values.max_time = this.possible_filter_values.max_time

    this.filter_values.patients = this.possible_filter_values.patients

    this.filter_values.station = ""
    this.filter_values.critical_patient = ""
    this.filter_values.location = "station"
    this.filter_values.config = true

    this.set_filter_values_as_state()
  }

  /**
   * Sets all possible filter values:
   * - min_ts
   * - max_ts
   * - all_stations
   * - all_patients
   * @param {*} data_name
   * @param {*} payload
   * @returns
   */
  set_possible_filter_values = (data_name, payload) => {
    console.log(`Set possible filter values`)
    let old_possible_filter_values = JSON.parse(
      JSON.stringify(this.possible_filter_values)
    )
    // console.error(data_name, payload)
    if (payload.error === undefined && payload.data) {
      switch (data_name) {
        case "patientdetail":
          // min_ts, max_ts, stations, patients

          // min_ts
          // max_ts
          let timespan_patient_detail = [
            this.parse_date_to_needed_string_date(payload.data.min_ts),
            this.parse_date_to_needed_string_date(payload.data.max_ts),
          ]

          timespan_patient_detail.forEach((ts) => {
            ts = new Date(ts + "T00:00:00").getTime()
            if (this.possible_filter_values.min_ts > ts) {
              this.possible_filter_values.min_ts = ts
              this.possible_filter_values.min_time =
                this.parse_date_to_needed_string_date(ts)
            }
            if (this.possible_filter_values.max_ts < ts) {
              this.possible_filter_values.max_ts = ts
              this.possible_filter_values.max_time =
                this.parse_date_to_needed_string_date(ts)
            }
          })

          // stations
          payload.data.allStations.forEach((station_name) => {
            if (!this.possible_filter_values.stations.includes(station_name)) {
              this.possible_filter_values.stations.push(station_name)
            }
          })

          // patients
          payload.data.patientList.forEach((pid) => {
            if (!this.possible_filter_values.patients.includes(pid)) {
              this.possible_filter_values.patients.push(pid)
            }
          })

          break
        case "linelist":
          // min_ts, max_ts, stations, patients

          // [x] min_ts
          // [x] max_ts
          let timespan_linelist = [
            this.parse_date_to_needed_string_date(payload.data.min_ts),
            this.parse_date_to_needed_string_date(payload.data.max_ts),
          ]

          timespan_linelist.forEach((ts) => {
            ts = new Date(ts + "T00:00:00").getTime()
            if (this.possible_filter_values.min_ts > ts) {
              this.possible_filter_values.min_ts = ts
              this.possible_filter_values.min_time =
                this.parse_date_to_needed_string_date(ts)
            }
            if (this.possible_filter_values.max_ts < ts) {
              this.possible_filter_values.max_ts = ts
              this.possible_filter_values.max_time =
                this.parse_date_to_needed_string_date(ts)
            }
          })

          // stations
          payload.data.allStations.forEach((station_name) => {
            if (!this.possible_filter_values.stations.includes(station_name)) {
              this.possible_filter_values.stations.push(station_name)
            }
          })

          // patients
          payload.data.patientList.forEach((pid) => {
            if (!this.possible_filter_values.patients.includes(pid)) {
              this.possible_filter_values.patients.push(pid)
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
              this.possible_filter_values.min_time =
                this.parse_date_to_needed_string_date(ts)
            }
            if (this.possible_filter_values.max_ts < ts) {
              this.possible_filter_values.max_ts = ts
              this.possible_filter_values.max_time =
                this.parse_date_to_needed_string_date(ts)
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
            })
          })
          "hi"
          break
        case "kontaktnetzwerk":
          // min_ts, max_ts, stations, patients, location

          // min_ts, max_ts
          payload.data.timespan.forEach((ts) => {
            if (this.possible_filter_values.min_ts > ts) {
              this.possible_filter_values.min_ts = ts
              this.possible_filter_values.min_time =
                this.parse_date_to_needed_string_date(ts)
            }
            if (this.possible_filter_values.max_ts < ts) {
              this.possible_filter_values.max_ts = ts
              this.possible_filter_values.max_time =
                this.parse_date_to_needed_string_date(ts)
            }
          })

          // stations
          payload.data.station_list.forEach((sid) => {
            if (!this.possible_filter_values.stations.includes(sid)) {
              this.possible_filter_values.stations.push(sid)
            }
          })

          // patients
          payload.data.patient_list.forEach((pid) => {
            if (!this.possible_filter_values.patients.includes(pid)) {
              this.possible_filter_values.patients.push(pid)
            }
          })

          break
        case "storyline":
          // min_ts, max_ts, stations, patients, location

          let timespan_maybe_undefined = [
            payload.data.min_ts,
            payload.data.max_ts,
          ]
          let timespan = timespan_maybe_undefined.filter((d) => d)

          // min_ts, max_ts
          timespan.forEach((ts) => {
            if (this.possible_filter_values.min_ts > ts) {
              this.possible_filter_values.min_ts = ts
              this.possible_filter_values.min_time =
                this.parse_date_to_needed_string_date(ts)
            }
            if (this.possible_filter_values.max_ts < ts) {
              this.possible_filter_values.max_ts = ts
              this.possible_filter_values.max_time =
                this.parse_date_to_needed_string_date(ts)
            }
          })

          // stations
          payload.data.allStations.forEach((sid) => {
            if (!this.possible_filter_values.stations.includes(sid)) {
              this.possible_filter_values.stations.push(sid)
            }
          })

          // patients
          payload.data.patientList.forEach((pid) => {
            if (!this.possible_filter_values.patients.includes(pid)) {
              this.possible_filter_values.patients.push(pid)
            }
          })
          break
      }
    }
    // Create new Color Scheme for available stations/wards
    this.get_station_color = d3
      .scaleOrdinal()
      .range([
        "#bae4b3",
        "#cbc9e2",
        "#9e9ac8",
        "#66c2a5",
        "#ffffb3",
        "#fdcdac",
        "#74c476",
      ])

    this.get_station_color.domain(this.possible_filter_values.stations)

    return old_possible_filter_values
  }

  /**
   * Deletes the original data.
   */
  reset_data = () => {
    // console.log("Deleting original data.")

    this.original_data = {}
  }

  reset_filter = () => {
    // console.log("Resetting filter.")

    // let {
    //   min_ts,
    //   max_ts,
    //   min_time,
    //   max_time,
    //   stations,
    //   config,
    //   patients,
    //   locations,
    // } = this.possible_filter_values

    // this.filter_values = {
    //   min_ts,
    //   max_ts,
    //   min_time,
    //   max_time,
    //   station: "",
    //   config,
    //   patients: patients.toString(),
    //   location: "station",
    // }

    this.possible_filter_values = {
      min_ts: Number.MAX_VALUE,
      max_ts: 0,
      min_time: "",
      max_time: "",
      stations: [],
      config: true,
      patients: [],
      locations: ["station", "room"],
    }

    this.filter_values = {
      min_ts: Number.MAX_VALUE,
      max_ts: 0,
      min_time: "",
      max_time: "",
      station: "",
      critical_patient: "",
      config: true,
      patients: [],
      location: "station",
    }

    this.set_filter_values_as_state()
  }

  reload_state = (old_state) => {
    let old_parameters = old_state.parameter_values
    let old_filter_values = old_state.filter_values
    let old_parameters_hash = old_state.parameters_hash
    let old_new_value = old_state.new_value

    // TODO falls neue parameter, diese auch laden
    // TODO danach sowieso filter values setzen
    let old_hash = old_parameters_hash
    // let new_hash = hash(this.state.parameters)
    let new_hash = this.current_parameters_hash

    this.set_complete_parameters(old_parameters)

    if (old_hash !== new_hash) {
      // this.set_complete_parameters(old_parameters)
      setTimeout(() => {
        this.requestVisData(old_filter_values)
      }, 100)
    } else {
      // das hier wird aufgerufen, wenn sich im
      // Prinzip Filter - Values nur aendern
      this.set_complete_filter_values(old_filter_values, old_new_value)
    }
  }

  set_complete_parameters = (new_parameters) => {
    // TODO
    this.parameters = new_parameters
    this.setState((prevState) => {
      prevState.parameters = new_parameters

      return prevState
    })
  }

  set_complete_filter_values = (filter_values, new_value) => {
    let changed_filter_attributes = []

    if (filter_values === undefined) {
      this.reset_filter_to_possible_values()
      return
    }

    // jeweils 2 test:
    // - in pfv boundaries?
    // - unterschiedlich zu vorherigem Wert?

    // min_ts
    // !copy of this.change_filter_starttime()
    let clipped_min_ts = this.clip_new_filter_time(filter_values.min_time)
    if (clipped_min_ts !== this.filter_values.min_ts) {
      changed_filter_attributes.push("min_ts")
      let date_min_ts = new Date(clipped_min_ts).getTime()
      let date_min_string =
        this.parse_date_to_needed_string_date(clipped_min_ts)

      this.filter_values.min_ts = date_min_ts
      this.filter_values.min_time = date_min_string

      if (clipped_min_ts > this.filter_values.max_ts) {
        this.filter_values.max_ts = date_min_ts
        this.filter_values.max_time = date_min_string
      }
    }
    // max_ts
    // !copy of this.change_filter_endtime()
    let clipped_max_ts = this.clip_new_filter_time(filter_values.max_time)
    if (clipped_max_ts !== this.filter_values.max_ts) {
      changed_filter_attributes.push("max_ts")
      let date_max_ts = new Date(clipped_max_ts).getTime()
      let date_max_string =
        this.parse_date_to_needed_string_date(clipped_max_ts)

      this.filter_values.max_ts = date_max_ts
      this.filter_values.max_time = date_max_string

      if (clipped_max_ts < this.filter_values.min_ts) {
        this.filter_values.min_ts = date_max_ts
        this.filter_values.min_time = date_max_string
      }
    }
    let pfv = this.get_possible_filter_values()
    // patients
    let patients_to_be_selected = []
    filter_values.patients.forEach((p) => {
      if (pfv.patients.includes(p)) {
        patients_to_be_selected.push(p)
      }
    })
    if (
      JSON.stringify(patients_to_be_selected) !==
      JSON.stringify(this.filter_values.patients)
    ) {
      changed_filter_attributes.push("patients")
      this.filter_values.patients = patients_to_be_selected
    }
    // station
    if (
      pfv.stations.includes(filter_values.station) &&
      filter_values.station !== this.filter_values.station
    ) {
      changed_filter_attributes.push("station")
      this.filter_values.station = filter_values.station
    } // critical patient
    if (
      pfv.patients.includes(filter_values.critical_patient) &&
      filter_values.critical_patient !== this.filter_values.critical_patient
    ) {
      changed_filter_attributes.push("critical_patient")
      this.filter_values.critical_patient = filter_values.critical_patient
    }
    // location
    if (filter_values.location !== this.filter_values.location) {
      changed_filter_attributes.push("location")
      this.filter_values.location = filter_values.location
    }

    this.set_filter_values_as_state(
      "load_filter_set",
      changed_filter_attributes.toString().replaceAll(",", ", ")
    )

    // !das hier war vor dem rewrite mit pfv-check
    // this.filter_values = { ...this.filter_values, ...filter_values }
    // this.set_filter_values_as_state("load_filter_set", new_value)
  }

  set_filter_values_as_state = (description, new_value_description) => {
    // console.log(`Changing filter values as state`)
    // console.log(this.filter_values)

    // this.save_current_state("Neue Filter Values gesetzt")

    this.filter_all_modules()
    this.draw_all_modules()

    this.setState((prevState) => {
      prevState.filter_values = this.filter_values
      return prevState
    })

    if (description) {
      this.save_current_state(description, new_value_description)
    }
  }

  get_possible_filter_values = () => {
    return this.possible_filter_values
  }

  get_filter_values = () => {
    return this.filter_values
  }

  switch_config_name = (e) => {
    let newConfigName = e.target.value

    this.parameters.configName = newConfigName

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
  register_module = (module_id, module_type, callbacks) => {
    // console.warn("registered", module_type)
    let module_obj = {
      module_id,
      module_type,
      callbacks,
    }
    this.open_modules.push(module_obj)

    this.setState((prevState) => {
      prevState.open_modules.push(module_obj)
      return prevState
    })
  }

  unregister_module = (module_id) => {
    this.open_modules = this.open_modules.filter(
      (d) => d.module_id !== module_id
    )

    this.setState((prevState) => {
      prevState.open_modules = prevState.open_modules.filter(
        (d) => d.module_id !== module_id
      )

      return prevState
    })
  }

  draw_modules_with_type = (module_type) => {
    let modules_to_draw = this.open_modules.filter(
      (d) => d.module_type === module_type
    )
    modules_to_draw.forEach((m) => {
      m.callbacks.draw_vis()
    })
  }

  draw_all_modules = () => {
    this.open_modules.forEach((m) => {
      m.callbacks.draw_vis()
    })
  }
  filter_modules_with_type = (module_type) => {
    let modules_to_draw = this.open_modules.filter(
      (d) => d.module_type === module_type
    )
    modules_to_draw.forEach((m) => {
      m.callbacks.filter_data()
    })
  }

  filter_all_modules = () => {
    this.open_modules.forEach((m) => {
      m.callbacks.filter_data()
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

  change_language = (lang) => {
    this.setState((prevState) => {
      return (prevState.selectedLang = lang)
    })
  }

  change_to_next_language = () => {
    if (this.current_language_index < this.all_languages.length - 1) {
      this.current_language_index++
    } else {
      this.current_language_index = 0
    }

    this.change_language(this.all_languages[this.current_language_index])
    setTimeout(() => {
      this.draw_all_modules()
    }, 100)
  }

  translate = (key) => {
    let language = this.state.selectedLang

    // // TODO: solange noch keine language-selection implementiert ist...
    // // TODO: bzw. Covid-Projekt...
    // if (language === undefined) {
    //   language = "cov"
    //   // language = this.props.selectedLang
    // }

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

    this.parameters.starttime = new_value

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

  /**
   * If input-date is out of bounds (input_ts < min_ts or input_ts > max_ts)
   * return the closest in-bound timestamp
   * @param {String} new_time
   * @returns closest in-bounds timestamp
   */
  clip_new_filter_time = (new_time) => {
    let new_ts = new Date(new_time).getTime()
    let return_ts = new_ts
    if (new_ts <= this.possible_filter_values.min_ts) {
      return_ts = this.possible_filter_values.min_ts
    } else if (new_ts > this.possible_filter_values.max_ts) {
      return_ts = this.possible_filter_values.max_ts
    }
    // console.log(`possible filter values`)
    // console.log(this.possible_filter_values)
    return return_ts
  }

  /**
   * Sets the new selected station of the filter
   * @param {String} new_station
   */
  change_filter_station = (new_station) => {
    console.log("changing filter station to:", new_station)
    this.filter_values.station = new_station
    // this.set_filter_values_as_state("change_filter_station", new_station)
    this.set_filter_values_as_state("ward", new_station)
  }

  change_filter_critical_patient = (new_critical_patient) => {
    if (this.filter_values.critical_patient === new_critical_patient) {
      new_critical_patient = ""
    }
    console.log("changing filter critical patient to:", new_critical_patient)
    this.filter_values.critical_patient = new_critical_patient
    this.change_filter_patients_add([new_critical_patient])
    this.set_filter_values_as_state("critical_patient", new_critical_patient)
  }

  change_filter_location = (new_location) => {
    this.filter_values.location = new_location
    this.set_filter_values_as_state("change_filter_location", new_location)
  }

  /**
   * Sets the new starttime of the filter
   * @param {String} new_time
   */
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

    // this.set_filter_values_as_state("change_filter_starttime", date_string)
    this.set_filter_values_as_state("begin3", date_string)
  }

  /**
   * Stes the new endtime of the filter
   * @param {String} new_time
   */
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
    // this.set_filter_values_as_state("change_filter_endtime", date_string)
    this.set_filter_values_as_state("end3", date_string)
  }

  change_filter_patients_delete = (patient_to_delete) => {
    if (this.filter_values.patients.includes(patient_to_delete)) {
      this.filter_values.patients = this.filter_values.patients.filter(
        (d) => d !== patient_to_delete
      )
      if (this.filter_values.critical_patient === patient_to_delete) {
        this.filter_values.critical_patient = ""
      }
      this.set_filter_values_as_state("delete_patientlist", patient_to_delete)
    }
  }

  change_filter_patients_add = (patients_to_add) => {
    if (typeof patients_to_add === "string") {
      patients_to_add = [patients_to_add]
    }
    patients_to_add.forEach((patient_to_add) => {
      if (
        !this.filter_values.patients.includes(patient_to_add) &&
        this.possible_filter_values.patients.includes(patient_to_add)
      ) {
        let selected_pats = this.filter_values.patients
        selected_pats.push(patient_to_add)
        let selected_pats_sorted = []
        this.possible_filter_values.patients.forEach((possible_pat) => {
          if (selected_pats.includes(possible_pat)) {
            selected_pats_sorted.push(possible_pat)
          }
        })
        this.filter_values.patients = selected_pats_sorted

        this.set_filter_values_as_state("add_patientlist", patient_to_add)
      }
    })
  }

  change_filter_patients = (patients, changed_patient) => {
    // TODO
    console.log("new patient lsit filter:", patients)
    this.filter_values.patients = patients
    this.set_filter_values_as_state("patientlist", changed_patient)
  }

  change_filter_timespan = (new_starttime, new_endtime) => {
    if (new_starttime > new_endtime) {
      console.error(
        `change filter timespan can't proceed, starttime is after endtime: ${new_starttime} ${new_endtime}`
      )
      return
    }

    let clipped_min_ts = this.clip_new_filter_time(new_starttime)
    let date_min_ts = new Date(clipped_min_ts).getTime()
    let date_min_string = this.parse_date_to_needed_string_date(clipped_min_ts)

    this.filter_values.min_ts = date_min_ts
    this.filter_values.min_time = date_min_string

    let clipped_max_ts = this.clip_new_filter_time(new_endtime)
    let date_max_ts = new Date(clipped_max_ts).getTime()
    let date_max_string = this.parse_date_to_needed_string_date(clipped_max_ts)

    this.filter_values.max_ts = date_max_ts
    this.filter_values.max_time = date_max_string

    // this.set_filter_values_as_state(
    //   "change_filter_timespan",
    //   date_min_string + " - " + date_max_string
    // )
    this.set_filter_values_as_state(
      "Timespan",
      date_min_string + " - " + date_max_string
    )
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
    this.parameters.endtime = new_value

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
    this.parameters.patientID = new_value
    this.setState((prevState) => {
      prevState.parameters.patientID = new_value
      // prevState.parameters.patientList = new_value.split(",")
      return prevState
    })
  }

  change_pathogen = (e) => {
    let new_value = e.target.value
    console.log("new value pathogen:", new_value)
    this.parameters.pathogen = new_value
    this.setState((prevState) => {
      prevState.parameters.pathogen = new_value
      return prevState
    })
  }

  /**
   * Deletes a value from a comma separated list.
   * @param {String} value
   * @param {Array} string_list
   * @param {Function} change_function
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
    this.parameters.patientList_string = new_value
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
    // console.log(new_value)
    this.parameters.pathogenList_string = new_value
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
    this.parameters.stationList_string = new_value
    this.setState((prevState) => {
      prevState.parameters.stationList_string = new_value
      // prevState.parameters.station = new_value.split(",")
      return prevState
    })
  }

  reset_data_loading_status = () => {
    this.all_module_names.forEach((module_name) => {
      this.setState((prevState) => {
        prevState.module_specific_data_loading_status[module_name] = {
          // no_data_loaded, success, error
          loading_status: "no_data_loaded",
          loading_progress: 0,
          start_time: new Date().getTime(),
          seconds: 0,
          module_errors: [],
          user_description: "no_data_loaded",
          dev_description: "no_data_loaded",
          // tooltip: this.translate("no_data_loaded"),
        }

        return prevState
      })
    })
  }

  request_data_with_contact_patient = (contact_patient) => {
    let self = this
    this.parameters.patientID = contact_patient
    this.setState((prevState) => {
      prevState.parameters.patientID = contact_patient
      return prevState
    })
    // this means there was no data loaded yet!
    if (
      contact_patient &&
      this.last_loaded_parameters.patientList_string === undefined
    ) {
      return
    }
    let request_parameters = {
      all_parameters: {
        configName: this.parameters.configName,
        hospital: this.parameters.hospital,
        degree: this.parameters.degree,
        pathogen: this.parameters.pathogen,
        starttime: this.parameters.starttime,
        endtime: this.parameters.endtime,
        patientList: this.parameters.patientList_string.split(","),
        stationList: this.parameters.stationList_string.split(","),
        pathogenList: this.parameters.pathogen.split(","),
        patientID: this.parameters.patientID,
        // patientID: contact_patient,
      },
      frontend_parameters: this.last_loaded_parameters,
    }
    self.socket.emit("get_contact_patient_list", request_parameters)
  }

  componentDidMount = () => {
    let self = this
    console.log("mainjs did mount")

    this.reset_filter()
    this.reset_data_loading_status()

    // setInterval(() => {
    //   this.publish_to("MEIN TOPIC", "meine message lol")
    // }, 1000)

    self.socket.on("new_parameters", (payload) => {
      this.set_complete_parameters(payload.frontend_parameters)
      // this.save_current_state(
      //   "loaded_additional_patients",
      //   payload.frontend_parameters.patientID
      // )

      // die neuen Patienten als "selected" setzen
      // this.change_filter_patients_add(payload.new_patients)
      this.filter_values.patients = this.filter_values.patients.concat(
        payload.new_patients
      )

      this.requestVisData(this.filter_values)
    })

    // self.socket.on("dataResult", self.handleData)
    self.socket.on("dataError", (data) => {
      console.error(data)
    })
    self.socket.on("cacheData", (data) => {
      console.log("cache data")
      console.log(data)
    })

    self.socket.on("global_data_loading_status", (data) => {
      // console.warn("Global data loading status: ", data)
    })

    let set_new_loading_status = (data) => {
      self.setState((prevState) => {
        let status = "no_data_loaded"
        if (data.states.length > 0) {
          // wenn es mindestens einen weiteren state gibt... dann wird geladen
          if (data.module_errors && data.module_errors.length > 0) {
            status = "error"
          } else if (data.progress >= 1) {
            status = "success"
          }
        }

        prevState.module_specific_data_loading_status[
          data.module_name
        ].loading_status = status
        prevState.module_specific_data_loading_status[
          data.module_name
        ].loading_progress = data.progress
        prevState.module_specific_data_loading_status[
          data.module_name
        ].module_errors = data.module_errors

        prevState.module_specific_data_loading_status[
          data.module_name
        ].user_description = data.user_description
        prevState.module_specific_data_loading_status[
          data.module_name
        ].dev_description = data.dev_description

        return prevState
      })
    }

    self.socket.on("module_data_loading_status", (data) => {
      // !Workaround, because auf 2sec force directed calculation...
      if (data.module_name === "storyline" && data.progress >= 1) {
        setTimeout(() => {
          set_new_loading_status(data)
        }, 2100)
      } else {
        set_new_loading_status(data)
      }
      // console.warn("Module specific data loading status: ", data)
    })

    self.socket.on("OutbreakDetectionConfigurations", (payload) => {
      if (payload?.data?.data !== undefined) {
        self.setState((prevState) => {
          prevState.configNames = payload.data.data
          return prevState
        })
      }
    })

    // self.all_module_names.forEach((module_name) => {
    //   self.socket.on(module_name, self.handle_data)
    // })
    self.socket.on("new_vis_data", self.handle_data)

    // setTimeout(() => {

    this.parameters = {
      ...this.parameters,
      ...this.defaultParameters[this.defaults],
    }

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
    // self.socket.off("dataError")
    // self.socket.off("cacheData")
    // self.socket.off("global_data_loading_status")
    // self.socket.off("module_data_loading_status")

    // self.all_module_names.forEach((module_name) => {
    //   self.socket.off(module_name)
    // })

    // self.socket.off("dataResult")
    // clearInterval(self.intervalFunction)
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

  clearCache = () => {
    let self = this
    console.log("clear cache!")

    self.socket.emit("clearCache", {})
  }

  start_data_request_timer = () => {
    console.error("start request timer")
    if (this.request_timer === undefined) {
      this.request_timer = setInterval(() => {
        let counter = 0

        this.setState((prevState) => {
          this.all_module_names.forEach((module_name) => {
            let progress =
              prevState.module_specific_data_loading_status[module_name]
                .loading_progress

            if (progress < 1) {
              let ms_begin =
                prevState.module_specific_data_loading_status[module_name]
                  .start_time
              let ms_now = new Date().getTime()
              let ms_duration = ms_now - ms_begin
              prevState.module_specific_data_loading_status[
                module_name
              ].seconds = Math.floor(ms_duration / 100) / 10

              counter++
            }
          })

          return prevState
        })

        if (counter === 0) {
          this.setState((prevState) => (prevState.waiting_for_data = false))
          this.set_complete_filter_values(this.filter_values_to_overwrite)
          this.filter_values_to_overwrite = undefined
          clearInterval(this.request_timer)
          this.request_timer = undefined
        }
      }, 100)
    } else {
      // TODO sollte nicht auftreten und sollte ich entfernen können; abchecken
      console.error("???")
      console.log(this.request_timer)
    }
  }

  /**
   * Requests new vis data with current parameters.
   * If load_new is set to true, possibly cached data
   * on the webserver gets deleted and all the data
   * will be calculated from scratch.
   *
   * load_new flag is implemented but not in use.
   * @param {boolean} load_new
   */
  requestVisData = (old_filter_values_to_set) => {
    let self = this
    console.log("requesting vis data")

    let load_new = undefined

    this.last_loaded_parameters = this.parameters
    this.current_parameters_hash = hash(this.parameters)

    this.setState((prevState) => {
      prevState.waiting_for_data = true
      return prevState
    })

    let openModuleNames = []
    this.reset_data()

    if (old_filter_values_to_set) {
      this.reset_filter()
      this.filter_values_to_overwrite = old_filter_values_to_set
      // this.set_complete_filter_values(old_filter_values_to_set)
    } else {
      this.reset_filter()
    }

    // TODO tell modules new loading state to show it
    this.reset_data_loading_status() // TODO kan nich das nutzen?

    this.start_data_request_timer()

    this.open_modules.forEach((m) => {
      if (!openModuleNames.includes(m.module_type)) {
        openModuleNames.push(m.module_type)
      }
    })

    let request_parameters = {
      openModuleNames,
      allModuleNames: this.all_module_names,
      parameters: {
        configName: this.parameters.configName,
        hospital: this.parameters.hospital,
        degree: this.parameters.degree,
        pathogen: this.parameters.pathogen,
        starttime: this.parameters.starttime,
        endtime: this.parameters.endtime,
        patientList: this.parameters.patientList_string.split(","),
        stationList: this.parameters.stationList_string.split(","),
        // pathogenList: this.state.parameters.pathogenList_string.split(","),
        pathogenList: this.parameters.pathogen.split(","),
        // ...this.state.parameters,
        // patientID: this.state.parameters.patientList_string.split(",")[0],
        patientID: this.parameters.patientID,
      },
      load_new,
    }

    // console.log("Requesting data with parameters:", request_parameters)

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

  /**
   * Updates the content of the contextmenu
   * @param {*} new_content
   */
  update_contextmenu = (patient_id, is_selected, is_critical_patient) => {
    let tableDiv = (
      <table className="contextmenu-table">
        <tbody>
          <tr
            onClick={() => {
              if (is_selected) {
                this.change_filter_patients_delete(patient_id)
              } else {
                this.change_filter_patients_add(patient_id)
              }
            }}
          >
            <td>
              {(is_selected
                ? this.translate("remove_patient_from_selection")
                : this.translate("add_patient_to_selection")) +
                " " +
                patient_id}
            </td>
          </tr>
          <tr
            onClick={() => {
              this.change_filter_critical_patient(patient_id)
            }}
          >
            <td>
              {(is_critical_patient
                ? this.translate("deselect_as_critical_patient")
                : this.translate("select_as_critical_patient")) +
                " " +
                patient_id}
            </td>
          </tr>
          <tr
            onClick={() => {
              this.request_data_with_contact_patient(patient_id)
            }}
          >
            <td>{this.translate("load_contacts") + " " + patient_id}</td>
          </tr>
          <tr>
            <td>{this.translate("cancel")}</td>
          </tr>
        </tbody>
      </table>
    )

    this.setState((prevState) => {
      prevState.contextmenu.content = tableDiv
      return prevState
    })
  }

  /**
   * Moves the contextmenu to the current pointer position
   */
  move_contextmenu = (cur_x, cur_y) => {
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
    d3.select(this.contextmenu_div)
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
   * Shows the contextmenu
   */
  show_contextmenu = () => {
    this.setState(
      (prevState) => (prevState.contextmenu.display = "inline-block")
    )
  }

  /**
   * Hides the contextmenu
   */
  hide_contextmenu = () => {
    this.setState((prevState) => (prevState.contextmenu.display = "none"))
  }

  // !sl -> wurde von storylien aufgerufen, da ist eine ältere d3 Version...
  init_contextmenu = (patient_id, sl, xpos, ypos) => {
    let fv = this.get_filter_values()
    if (sl === undefined) {
      d3.event.preventDefault()
    }
    this.update_contextmenu(
      patient_id,
      fv.patients.includes(patient_id),
      fv.critical_patient === patient_id
    )
    if (xpos === undefined) {
      xpos = d3.event.pageX
    }
    if (ypos === undefined) {
      ypos = d3.event.pageY
    }
    this.move_contextmenu(xpos, ypos)
    this.show_contextmenu()
  }

  render() {
    let self = this

    return (
      <div id="main">
        {/* <img
            className="HiGhmed_Logo"
            alt="HiGhmed_Logo"
            id="HiGhmed_Logo"
            onClick={() =>
              window.open("http://highmed.org/about/use-cases/", "_blank")
            }
            src={logo_svg}
          /> */}
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
        <div className="top-footer" />
        <div className="content">
          <Flex_LM
            key="MEIN_LM"
            {...this.state}
            change_to_next_language={this.change_to_next_language}
            requestVisData={this.requestVisData}
            reload_state={this.reload_state}
            requestCacheData={this.requestCacheData}
            clearCache={this.clearCache}
            change_starttime={this.change_starttime}
            change_endtime={this.change_endtime}
            change_patient_list={this.change_patient_list}
            change_pathogen={this.change_pathogen}
            change_pathogen_list={this.change_pathogen_list}
            change_station_list={this.change_station_list}
            toggle_global_legend={this.toggle_global_legend}
            // TODO: SMICS-0.8
            change_contactPatient={this.change_contactPatient}
            translate={this.translate}
            // hier oben drueber für header menu
            request_data_with_contact_patient={
              this.request_data_with_contact_patient
            }
            all_module_names={this.all_module_names}
            update_tooltip={this.update_tooltip}
            move_tooltip={this.move_tooltip}
            hide_tooltip={this.hide_tooltip}
            show_tooltip={this.show_tooltip}
            // update_contextmenu={this.update_contextmenu}
            // move_contextmenu={this.move_contextmenu}
            // hide_contextmenu={this.hide_contextmenu}
            // show_contextmenu={this.show_contextmenu}
            init_contextmenu={this.init_contextmenu}
            change_rki_config_name={this.change_rki_config_name}
            // ab hier das für Parameter
            // TODO: SMICS-0.8
            // translate={this.translate}
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
            change_filter_timespan={this.change_filter_timespan}
            change_filter_station={this.change_filter_station}
            change_filter_critical_patient={this.change_filter_critical_patient}
            change_filter_location={this.change_filter_location}
            change_filter_patients={this.change_filter_patients}
            change_filter_patients_delete={this.change_filter_patients_delete}
            change_filter_patients_add={this.change_filter_patients_add}
            get_possible_filter_values={this.get_possible_filter_values}
            get_filter_values={this.get_filter_values}
            get_locale={this.get_locale}
            get_original_data={this.get_original_data}
            get_station_color={this.get_station_color}
          />
        </div>
        <div
          className="tooltip"
          style={{ display: this.state.tooltip.display }}
          ref={(element) => (this.tooltipDiv = element)}
        >
          {this.state.tooltip.content}
        </div>
        <div
          className="contextmenu-background"
          style={{ display: this.state.contextmenu.display }}
          onClick={this.hide_contextmenu}
        >
          <div
            className="contextmenu"
            style={{ display: this.state.contextmenu.display }}
            ref={(element) => (this.contextmenu_div = element)}
          >
            {this.state.contextmenu.content}
          </div>
        </div>
        <LegendWindow {...this.state} translate={this.translate} />
        <div className="footer" />
        <FileDrop
          style={{ display: "none" }}
          // onFrameDragEnter={(event) => console.log("onFrameDragEnter", event)}
          // onFrameDragLeave={(event) => console.log("onFrameDragLeave", event)}
          // onFrameDrop={(event) => console.log("onFrameDrop", event)}
          // onDragOver={(event) => console.log("onDragOver", event)}
          // onDragLeave={(event) => console.log("onDragLeave", event)}
          // onDrop={(files, event) => console.log("onDrop!", files, event)}
          // onDrop={(files, event) => {
          //   console.log(files, event)
          // }}
          onFrameDrop={(event) => {
            let file = event.dataTransfer.files[0]
            let reader = new FileReader()
            reader.onload = (e) => {
              // console.log(e.target.result)
              let conf = JSON.parse(e.target.result)
              this.reload_state(conf)
            }
            // console.log(file)
            reader.readAsText(file)
          }}
        ></FileDrop>
      </div>
    )
  }
}

Main.propTypes = {
  socket: PropTypes.object.isRequired,
}

export default hot(module)(withSocket(Main))
