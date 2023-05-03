import {
  get_status_ranking,
  get_carrier_status,
  get_worse_carrier_status,
} from "./utilities/carrier_status"
import { Error_Log } from "./error_log"
import * as d3 from "d3"
import CONFIG from "./config"
import parseToStorylineData from "./utilities/storylineParser"

const error_prio: number = 1.4
let error_log = new Error_Log()

/**
 * @Tom in call_function: (...., parameters: any) werden nur noch die notwendigen Parameter mitgegeben
 * Notwendig heißt: Alle Paras die für den api-call benötigt werden
 */

const data_parser: { [key: string]: any } = {
  /**
   * Akkumulates all Mibi-data from the same person, pathogen and timestamp
   *
   * Name der geparsten Daten
   * welche raw-data benoetigt werden
   * die parse-funktion selbst implementieren; default (z.B: on Error etc)
   * ein leeres Array ([]) zurueck geben
   */

  generate_mibi_investigations: {
    needed_raw_data: ["Patient_Labordaten_Ps"],
    call_function: (input_data: any, parameters: any) => {
      let { Patient_Labordaten_Ps } = input_data

      let { patientList, parameter_pathogen, pathogen } = parameters
      if (patientList === undefined) {
        patientList = []
      }

      let min_ts: any = undefined
      let max_ts: any = undefined

      let investigations: any[] = []

      let status_changes: any = {}

      // Selber Patient, selbes Datum und selber Keim gehoeren zusammen
      if (Patient_Labordaten_Ps.error === undefined) {
        // TODO: SMICS-0.8
        // Patientenliste wegen Nth-Degree rauslesen
        let new_patient_list: any[] = []
        let filtered_by_parameter_pathogen = Patient_Labordaten_Ps.data.filter(
          (d: any) => d.KeimID === pathogen
        )

        Patient_Labordaten_Ps.data = filtered_by_parameter_pathogen
        Patient_Labordaten_Ps.data.forEach((invest: any) => {
          invest.timestamp = new Date(invest.Eingangsdatum).getTime()
          if (!new_patient_list.includes(invest.PatientID)) {
            new_patient_list.push(invest.PatientID)
          }
        })
        patientList = new_patient_list

        Patient_Labordaten_Ps.data.sort(
          (a: any, b: any) => a.timestamp - b.timestamp
        )

        // console.log(Patient_Labordaten_Ps)
        Patient_Labordaten_Ps.data.forEach((investigation_data: any) => {
          // let timestamp = new Date(investigation_data.Eingangsdatum).getTime()
          let timestamp = investigation_data.timestamp
          if ((min_ts === max_ts) === undefined) {
            min_ts = max_ts = timestamp
          } else {
            if (timestamp < min_ts) {
              min_ts = timestamp
            }
            if (timestamp > max_ts) {
              max_ts = timestamp
            }
          }

          let investigation_hash =
            investigation_data.Eingangsdatum +
            investigation_data.PatientID +
            investigation_data.KeimID

          let index = investigations.findIndex(
            (d) => d.investigation_hash === investigation_hash
          )

          let investigation_data_copy = JSON.parse(
            JSON.stringify(investigation_data)
          )

          // console.log(`PatientID: ${investigation_data.PatientID}`)
          if (index < 0) {
            investigation_data_copy.count = 1
            investigations.push({
              investigation_hash,
              data: [investigation_data_copy],
              timestamp: timestamp,
              patient_id: investigation_data.PatientID,
              pathogen_id: investigation_data.KeimID,
              // negative, unknown, infected, diseased
              result: get_carrier_status(
                investigation_data.Befund,
                investigation_data.Screening,
                // "unknown"
                // TODO: SMICS-0.8
                "negative"
              ),
            })
            // console.log("index < 0")
          } else {
            let index_unique = investigations[index].data.findIndex(
              (d: any) => {
                let all_similar = true
                for (let propname in investigation_data_copy) {
                  if (d[propname] != investigation_data_copy[propname]) {
                    all_similar = false
                  }
                }
                return all_similar
              }
            )
            if (index_unique < 0) {
              investigation_data_copy.count = 1
              investigations[index].data.push(investigation_data_copy)
            } else {
              investigations[index].data[index_unique].count++
            }

            investigations[index].result = get_carrier_status(
              investigation_data.Befund,
              investigation_data.Screening,
              investigations[index].result
            )
            // console.log("index > 0")
          }
        })

        // just to track current patient status for pathogen
        let last_status: any = {}

        patientList.forEach((pID: any) => {
          status_changes[pID] = {}
          last_status[pID] = {}

          /**
           * Für jeden Patienten pro Keim eine Liste an Status-Veränderungen erzeugen:
           *
           * - Alle Investigations durchiterieren
           * - Falls noch kein Eintrag für diesen Keim, dann einen anlegen
           *      (empty Array + unknown falls im Krankenhaus bis dahin)
           * - Schauen, ob Status-Veränderung
           * - Falls Status-Veränderung -> diese Statusveränderung auf das Array pushen
           *
           * ! JEDE ÄNDERUNG, nicht nur Verschlimmerung !
           */

          let pat_investigations: any = investigations.filter(
            (d) => d.patient_id === pID
          )

          pat_investigations.forEach((invest: any) => {
            // abchecken, ob neuer status "schlimmer" ist
            // -> dann status-wechsel
            // kann ich generisch implementieren!

            let path_id: any = invest.pathogen_id
            let old_status: any = last_status[pID][path_id]
            let new_status: any = invest.result

            if (old_status === undefined) {
              status_changes[pID][path_id] = []
            }

            if (old_status !== new_status) {
              status_changes[pID][path_id].push({
                new_status,
                timestamp: invest.timestamp,
              })
              last_status[pID][path_id] = new_status
            }
          })
        })
      } else {
        error_log.addError(
          "Patient_Labordaten_Ps",
          parameters,
          error_prio,
          Patient_Labordaten_Ps.error
        )
      }

      return {
        timestamp: new Date().getTime(),
        min_ts,
        max_ts,
        patientList,
        investigations,
        status_changes,
        return_log: error_log.clearAndReturnLog(),
      }
    },
  },
  // TODO: SMICS-0.8
  generate_mibi_investigations_TEMP: {
    needed_raw_data: ["Contact_NthDegree_TTKP_Degree"],
    call_function: (input_data: any, parameters: any) => {
      let { Contact_NthDegree_TTKP_Degree } = input_data
      let Patient_Labordaten_Ps: any
      if (Contact_NthDegree_TTKP_Degree.error === undefined) {
        let { Labordaten } = Contact_NthDegree_TTKP_Degree.data

        Labordaten = Labordaten.filter(
          (d: any) => d.KeimID === parameters.pathogen
        )

        Patient_Labordaten_Ps = {
          error: undefined,
          data: Labordaten,
        }
      } else {
        Patient_Labordaten_Ps = {
          error: true,
          data: [],
        }
        error_log.addError(
          "Contact_NthDegree_TTKP_Degree",
          parameters,
          error_prio,
          Contact_NthDegree_TTKP_Degree.error
        )
      }

      let { patientList } = parameters
      if (patientList === undefined) {
        patientList = []
      }

      let min_ts: any = undefined
      let max_ts: any = undefined

      let investigations: any[] = []

      // Selber Patient, selbes Datum und selber Keim gehoeren zusammen
      if (Patient_Labordaten_Ps.error === undefined) {
        // TODO: SMICS-0.8
        // Patientenliste wegen Nth-Degree rauslesen
        let new_patient_list: any[] = []
        Patient_Labordaten_Ps.data.forEach((invest: any) => {
          invest.timestamp = new Date(invest.Eingangsdatum).getTime()
          if (!new_patient_list.includes(invest.PatientID)) {
            new_patient_list.push(invest.PatientID)
          }
        })
        patientList = new_patient_list

        Patient_Labordaten_Ps.data.sort((a: any, b: any) => a - b)

        // console.log(Patient_Labordaten_Ps)
        Patient_Labordaten_Ps.data.forEach((investigation_data: any) => {
          // let timestamp = new Date(investigation_data.Eingangsdatum).getTime()
          let timestamp = investigation_data.timestamp
          if ((min_ts === max_ts) === undefined) {
            min_ts = max_ts = timestamp
          } else {
            if (timestamp < min_ts) {
              min_ts = timestamp
            }
            if (timestamp > max_ts) {
              max_ts = timestamp
            }
          }

          let investigation_hash =
            investigation_data.Eingangsdatum +
            investigation_data.PatientID +
            investigation_data.KeimID

          let index = investigations.findIndex(
            (d) => d.investigation_hash === investigation_hash
          )

          let investigation_data_copy = JSON.parse(
            JSON.stringify(investigation_data)
          )

          if (index < 0) {
            investigations.push({
              investigation_hash,
              data: [investigation_data_copy],
              timestamp: timestamp,
              patient_id: investigation_data.PatientID,
              pathogen_id: investigation_data.KeimID,
              // negative, unknown, infected, diseased
              result: get_carrier_status(
                investigation_data.Befund,
                investigation_data.Screening,
                // "unknown"
                // TODO: SMICS-0.8
                "negative"
              ),
            })
          } else {
            investigations[index].data.push(investigation_data_copy)
            investigations[index].result = get_carrier_status(
              investigation_data.Befund,
              investigation_data.Screening,
              investigations[index].result
            )
          }
        })
      } else {
        error_log.addError(
          "Patient_Labordaten_Ps",
          parameters,
          error_prio,
          Patient_Labordaten_Ps.error
        )
      }

      let status_changes: any = {}
      // just to track current patient status for pathogen
      let last_status: any = {}

      patientList.forEach((pID: any) => {
        status_changes[pID] = {}
        last_status[pID] = {}

        /**
         * Für jeden Patienten pro Keim eine Liste an Status-Veränderungen erzeugen:
         *
         * - Alle Investigations durchiterieren
         * - Falls noch kein Eintrag für diesen Keim, dann einen anlegen
         *      (empty Array + unknown falls im Krankenhaus bis dahin)
         * - Schauen, ob Status-Veränderung
         * - Falls Status-Veränderung -> diese Statusveränderung auf das Array pushen
         *
         * ! JEDE ÄNDERUNG, nicht nur Verschlimmerung !
         */

        let pat_investigations: any = investigations.filter(
          (d) => d.patient_id === pID
        )

        pat_investigations.forEach((invest: any) => {
          // abchecken, ob neuer status "schlimmer" ist
          // -> dann status-wechsel
          // kann ich generisch implementieren!

          let path_id: any = invest.pathogen_id
          let old_status: any = last_status[pID][path_id]
          let new_status: any = invest.result

          if (old_status === undefined) {
            status_changes[pID][path_id] = []
          }

          if (old_status !== new_status) {
            status_changes[pID][path_id].push({
              new_status,
              timestamp: invest.timestamp,
            })
            last_status[pID][path_id] = new_status
          }
        })
      })

      return {
        timestamp: new Date().getTime(),
        min_ts,
        max_ts,
        patientList,
        investigations,
        status_changes,
        return_log: error_log.clearAndReturnLog(),
      }
    },
  },
  generate_storyline_data: {
    needed_raw_data: ["Patient_Bewegung_Ps", "Patient_Labordaten_Ps"],
    call_function: (input_data: any, parameters: any) => {
      let { Patient_Bewegung_Ps, Patient_Labordaten_Ps } = input_data

      let { pathogen } = parameters

      console.log(`
      
      
      
      
      
      generate storyline data
      
      
      
      
      `)
      console.log(JSON.stringify(parameters))

      let min_ts: any = undefined
      let max_ts: any = undefined

      let patient_list: any = []
      let station_list: any = []

      let graph_data: any = {}

      // let patient_paths_data: any = []
      let station_paths_data: any = []

      // let backtracking: any = {}
      // let forwardtracking: any = {}

      let parsed_storyline_data: any = {
        graph: {
          nodes: [],
          links: [],
        },
        pathogen_data: {
          keimID: "",
          keim_k: "",
          keim_l: "",
          erstePositiveBefunde: [],
          letzteNegativeBefunde: [],
        },
      }

      if (Patient_Bewegung_Ps.error === undefined) {
        if (Patient_Labordaten_Ps.error === undefined) {
          Patient_Labordaten_Ps.data = Patient_Labordaten_Ps.data.filter(
            (labor: any) => labor.KeimID === pathogen
          )
          Patient_Labordaten_Ps.data.forEach((md: any) => {
            // md.PatientID = md.PatientID
            // md.KeimID = md.KeimID
            // md.Eingangsdatum = md.Eingangsdatum
            // !warum wurde das auf 0 gesetzt?
            // md.Screening = 0
            md.Befund = md.Befund ? 1 : 0

            md.timestamp = new Date(md.Eingangsdatum).getTime()

            // TODO: Nur Hotfix (invertieren des Screening-Flags)
            // md.Screening = md.Screening == 1 ? 0 : 1

            if (!patient_list.includes(md.PatientID)) {
              patient_list.push(md.PatientID)
            }

            let timestamp = md.timestamp
            if ((min_ts === max_ts) === undefined) {
              min_ts = max_ts = timestamp
            } else {
              if (timestamp < min_ts) {
                min_ts = timestamp
              }
              if (timestamp > max_ts) {
                max_ts = timestamp
              }
            }
          })

          Patient_Bewegung_Ps.data.forEach((md: any) => {
            //   md.PatientID = md.PatientID
            //   md.Beginn = md.Beginn
            //   md.Ende = md.Ende
            //   md.StationID = md.StationID
            //   md.BewegungstypID = md.BewegungstypID
            md.ts_Beginn = new Date(md.Beginn).getTime()
            md.ts_Ende = new Date(md.Ende).getTime()

            md.eventType = "Bewegung"
            md.timestamp = md.ts_Beginn
            md.patientID = md.PatientID
            // md.stationID = md.Station

            if (!patient_list.includes(md.PatientID)) {
              patient_list.push(md.PatientID)
            }
            if (!station_list.includes(md.Station)) {
              if (md.BewegungstypID !== 4) {
                station_list.push(md.Station)
              }
            }

            let begin = new Date(md.Beginn).getTime()
            let end = new Date(md.Ende).getTime()
            if (min_ts === undefined || begin < min_ts) {
              min_ts = begin
            }
            if (max_ts === undefined || end > max_ts) {
              max_ts = end
            }
          })

          // TODO: graph erzeugen

          console.log(`[STORYLINE]: Start generating the graph`)

          parsed_storyline_data = parseToStorylineData(
            // JSON.parse(JSON.stringify(Patient_Labordaten_Ps.data)),
            // JSON.parse(JSON.stringify(Patient_Bewegung_Ps.data)),
            Patient_Labordaten_Ps.data,
            Patient_Bewegung_Ps.data,
            patient_list,
            station_list
          )

          // TODO: patient_paths und station_paths erzeugen -> module data
          // TODO: backward und forward tracking -> bleibt hier
        } else {
          error_log.addError(
            "Patient_Labordaten_Ps",
            parameters,
            error_prio,
            Patient_Labordaten_Ps.error
          )
        }
      } else {
        error_log.addError(
          "Patient_Bewegung_Ps",
          parameters,
          error_prio,
          Patient_Bewegung_Ps.error
        )
      }

      console.log(`
      
      finished storyline data
      
      `)

      return {
        timestamp: new Date().getTime(),
        patient_list,
        station_list,
        // backtracking,
        // forwardtracking,
        // patient_paths_data,
        // station_paths_data,
        graph_data: parsed_storyline_data.graph,
        pathogen_data: parsed_storyline_data.pathogen_data,
        patients_infection_data: parsed_storyline_data.patients,
        // TODO add from parsed_storyline_data what is necessary
        min_ts,
        max_ts,
        // parsed_storyline_data,
        return_log: error_log.clearAndReturnLog(),
      }
    },
  },
  generate_movement_rects: {
    needed_raw_data: ["Patient_Bewegung_Ps"],
    call_function: (input_data: any, parameters: any) => {
      let { Patient_Bewegung_Ps } = input_data

      let { patientList } = parameters

      let min_ts: any = undefined
      let max_ts: any = undefined

      let new_patient_list: any[] = []

      let movement_rects: object[] = []
      let movement_dots: object[] = []

      let allStations: any[] = []

      let unknown_rects: any = {}

      if (Patient_Bewegung_Ps.error === undefined) {
        Patient_Bewegung_Ps.data.forEach((mov: any) => {
          if (!new_patient_list.includes(mov.PatientID)) {
            new_patient_list.push(mov.PatientID)
          }
        })

        let movement_rect_top_position: any = {}

        // generate visualization for movement data (horizontal rectangles)
        // only if there is no error in the data
        Patient_Bewegung_Ps.data.forEach((movement: any) => {
          if (!allStations.includes(movement.Station)) {
            if (movement.BewegungstypID !== 4) {
              allStations.push(movement.Station)
            }
          }

          let begin = new Date(movement.Beginn).getTime()
          let end = new Date(movement.Ende).getTime()
          if (min_ts === undefined || begin < min_ts) {
            min_ts = begin
          }
          if (max_ts === undefined || end > max_ts) {
            max_ts = end
          }
          let vis_struct: any = {
            begin: begin,
            end: end,
            patient_id: movement.PatientID,
            station_id: movement.Station,
            station_name: movement.Station,
            movement_type: movement.BewegungstypID,
          }

          if (movement.BewegungstypID === 4) {
            movement_dots.push(vis_struct)
          } else {
            if (movement_rect_top_position[movement.PatientID]) {
              vis_struct.top = true
              movement_rect_top_position[movement.PatientID] = false
            } else {
              vis_struct.top = false
              movement_rect_top_position[movement.PatientID] = true
            }
            movement_rects.push(vis_struct)
          }
        })
      } else {
        error_log.addError(
          "Patient_Bewegung_Ps",
          parameters,
          error_prio,
          Patient_Bewegung_Ps.error
        )
      }

      return {
        timestamp: new Date().getTime(),
        min_ts,
        max_ts,
        patientList: new_patient_list,
        movement_rects,
        movement_dots,
        allStations,
        unknown_rects,
        return_log: error_log.clearAndReturnLog(),
      }
    },
  },
  generate_contact_graph: {
    // needed_raw_data: ["Contact_NthDegree_TTKP_Degree"],
    needed_raw_data: ["Patient_Bewegung_Ps", "Patient_Labordaten_Ps"],
    call_function: async (input_data: any, parameters: any) => {
      // let { Contact_NthDegree_TTKP_Degree } = input_data
      let { Patient_Bewegung_Ps, Patient_Labordaten_Ps } = input_data

      let timespan: any[] = []
      let min_ts: any = undefined
      let max_ts: any = undefined
      let graph_data: any = {}
      let patient_list: string[] = []
      let station_list: string[] = []

      // if (Contact_NthDegree_TTKP_Degree.error === undefined) {
      //   let { Labordaten, Patienten_Bewegungen } =
      //     Contact_NthDegree_TTKP_Degree.data
      if (Patient_Bewegung_Ps.error === undefined) {
        if (Patient_Labordaten_Ps.error === undefined) {
          // let Patient_Labordaten_Ps: any = {}
          // Patient_Labordaten_Ps.data = Labordaten

          // let Patient_Bewegung_Ps: any = {}
          // Patient_Bewegung_Ps.data = Patienten_Bewegungen

          //#region generate_mibi_investigations
          let input_data_generate_mibi_investigation: any = {}
          input_data_generate_mibi_investigation.Patient_Labordaten_Ps =
            Patient_Labordaten_Ps

          /* compute the mibi-data */
          let generate_mibi_investigations =
            data_parser.generate_mibi_investigations.call_function(
              input_data_generate_mibi_investigation,
              parameters
            )

          /* log errors from mibi procedure. However we are still trying to work on the data, even if it has errors */
          if (generate_mibi_investigations.return_log > 0) {
            error_log.addError(
              "generate_mibi_investigations",
              parameters,
              2.8,
              `Error: an error occured during data_parser[generate_mibi_investigations] procedure. Data could be invalid or incomplete.`
            )
          }
          //#endregion generate_mibi_investigations

          //#region generate contact graph
          // ! graph_data
          /* create contact graph for each property in the array */
          let location_properties = [
            // { name: "station", prop_name: "StationID" },
            { name: "station", prop_name: "Station" },
            { name: "room", prop_name: "Raum" },
          ]

          let { status_changes } = generate_mibi_investigations
          // ! patient_list, station_list, min_ts, max_ts
          Patient_Bewegung_Ps.data.forEach((mov: any) => {
            mov.ts_Beginn = new Date(mov.Beginn).getTime()
            mov.ts_Ende = new Date(mov.Ende).getTime()

            if (!patient_list.includes(mov.PatientID)) {
              patient_list.push(mov.PatientID)
            }
            if (!station_list.includes(mov.Station)) {
              if (mov.BewegungstypID !== 4) {
                station_list.push(mov.Station)
              }
            }
            if (status_changes[mov.PatientID] === undefined) {
              status_changes[mov.PatientID] = {}
            }

            let beginn_ts = new Date(mov.Beginn).getTime()
            let ende_ts = new Date(mov.Ende).getTime()
            mov.begin = beginn_ts
            mov.end = ende_ts
            if (min_ts === undefined || beginn_ts < min_ts) {
              min_ts = beginn_ts
            }
            if (max_ts === undefined || ende_ts > max_ts) {
              // !folgende if Abfrage, da auf der SQL Datenbank das Jahr 9996 bei manchen Zeitangaben ist...
              if (
                !(
                  CONFIG.datasource === "hmhdnov18_sql" &&
                  ende_ts >= 3283839320000
                )
              ) {
                max_ts = ende_ts
              }
            }
          })

          Patient_Labordaten_Ps.data.forEach((labor: any) => {
            if (!patient_list.includes(labor.PatientID)) {
              patient_list.push(labor.PatientID)
            }

            let timestamp = labor.timestamp
            if (min_ts === undefined || timestamp < min_ts) {
              min_ts = timestamp
            }
            if (max_ts === undefined || timestamp > max_ts) {
              max_ts = timestamp
            }
          })

          if (min_ts && max_ts) {
            timespan = [min_ts, max_ts]
          }

          const generate_contact_graph = async (location_property: {
            name: string
            prop_name: string
          }) => {
            // const generate_contact_graph = async (location_property: any) => {
            let nodes: object[] = []
            let links: {
              source: string
              target: string
              patient_a: string
              patient_b: string
              contacts: any[]
            }[] = []

            //#region generate nodes
            /**
             * Each patient is a node and includes the last/worst infection status for each pathogenID
             * the patient was tested for in the past
             */
            patient_list.forEach((patID: string) => {
              let all_pathogen_status: any = {}
              let all_status_changes: any = [
                {
                  status: "negative",
                  status_timestmap: 0,
                },
              ]

              /* get all pathogens the patient was tested for */
              let all_tested_pathogens = Object.getOwnPropertyNames(
                status_changes[patID]
              )
              /* get all movements in the hospital from the patient */
              let all_movements: any = Patient_Bewegung_Ps.data.filter(
                (movement: any) => movement.PatientID === patID
              )

              let all_visited_stations: any = []

              for (let mov of all_movements) {
                if (mov.BewegungstypID !== 4) {
                  all_visited_stations.push({
                    station_id: mov.Station,
                    patient_id: mov.PatientID,
                    ts_Beginn: mov.ts_Beginn,
                    ts_Ende: mov.ts_Ende,
                  })
                }
              }

              all_tested_pathogens.forEach((pathogen_ID: string) => {
                // let status: string = "unknown" --> status = "negative" since SmICS 0.8 ?
                let status: string = "negative"
                let status_timestamp = undefined
                let pathogen_status_changes_of_patient: object[] =
                  status_changes[patID][pathogen_ID]

                pathogen_status_changes_of_patient.forEach(
                  (status_change: any) => {
                    let { new_status, timestamp } = status_change
                    let worse_status: string = get_worse_carrier_status(
                      status,
                      new_status
                    )
                    if (worse_status !== status) {
                      // hier: status change
                      status = worse_status
                      status_timestamp = timestamp
                      all_status_changes.push({
                        status,
                        status_timestamp,
                      })
                    }
                  }
                )
                all_pathogen_status[pathogen_ID] = { status, status_timestamp }
              })
              nodes.push({
                id: patID,
                patient_id: patID,
                all_pathogen_status,
                all_status_changes,
                all_movements,
                all_visited_stations,
              })
            })
            //#endregion generate nodes

            //#region generate links
            /**
             * - copy all movements
             * - sort all movements
             * - initialize buckets
             * - iterate all movements:
             *    - for every movement, save index i to the current patient
             *    - --> = last_movement
             * - iterate all movements:
             *    - delete patient from old bucket
             *    - "end" current contacts
             *    - push ended contact on contacts_of_patient
             *    - push patient into new bucket
             *    - "start" new contact
             */
            let movements = Patient_Bewegung_Ps.data.filter(
              (mov: any) => mov.BewegungstypID !== 4
            )
            movements.forEach(
              (mov: any) => (mov.timestamp = new Date(mov.Beginn).getTime())
            )
            movements.sort((a: any, b: any) => a.timestamp - b.timestamp)

            let buckets: any = {
              home: [],
              tmp_home: [],
            }
            let current_contacts: { [key: string]: object[] } = {}
            let patient_is_on_station: { [key: string]: string } = {}
            let last_movement_index: { [key: string]: number } = {}

            /* Initialize the datastructures for each patient */
            patient_list.forEach((patID: string) => {
              buckets.home.push(patID)
              patient_is_on_station[patID] = "home"
              current_contacts[patID] = []
            })

            movements.forEach((mov: any, i: number) => {
              last_movement_index[mov.PatientID] = i
            })

            movements.forEach((mov: any, i: number) => {
              let { BewegungstypID, PatientID, timestamp } = mov

              /* generate the contact graph depending on the location
               * --> look at 'location_properties' to see all locations this function generates a contact graph for
               */
              let location: string = mov[location_property.prop_name]

              let new_location: string = location

              // we reached the last movement of the patient
              if (last_movement_index[PatientID] === i) {
                new_location = "home"
              } else if (BewegungstypID === 2 || BewegungstypID === 6) {
                new_location = "tmp_home"
              }

              let old_location: string = patient_is_on_station[PatientID]
              // nothing need to be done if old_location === new_location
              if (old_location !== new_location) {
                /**
                 * 1. remove patient from old bucket -> patient leaves the location
                 * 2. if old_location !== home or !== tmp_home
                 *    --> end current_contacts for the patient
                 *    --> push all contacts of this patient to 'links'
                 * 3. put patient in the new bucket -> the new current location of the patient
                 * 4. if new_location !== home or !== tmp_home
                 *    --> start the new current_contacts for the patient
                 */

                // 1.
                let patients_on_old_location: string[] = buckets[
                  old_location
                ].filter((patID: string) => patID !== PatientID)

                // delete the bucket if it is empty
                if (
                  patients_on_old_location.length <= 0 &&
                  old_location !== "home" &&
                  old_location !== "tmp_home"
                ) {
                  delete buckets[old_location]
                } else {
                  buckets[old_location] = patients_on_old_location
                }

                // 2.
                if (old_location !== "home" && old_location !== "tmp_home") {
                  current_contacts[PatientID].forEach((contact: any) => {
                    let copy_contact: any = JSON.parse(JSON.stringify(contact))
                    copy_contact.end = timestamp // the starttime of the movement is the endtime for all old movements

                    let { patient_a, patient_b } = copy_contact
                    let index = links.findIndex((l: any) => {
                      return (
                        (l.patient_a === patient_a &&
                          l.patient_b === patient_b) ||
                        (l.patient_a === patient_b && l.patient_b === patient_a)
                      )
                    })

                    if (index === -1) {
                      /* no link between those patients --> create one */
                      links.push({
                        source: patient_a,
                        target: patient_b,
                        patient_a,
                        patient_b,
                        contacts: [],
                      })
                      index = links.length - 1
                    }
                    links[index].contacts.push(copy_contact)
                  })
                  current_contacts[PatientID] = []

                  patients_on_old_location.forEach(
                    (old_contact_patID: string) => {
                      current_contacts[old_contact_patID] = current_contacts[
                        old_contact_patID
                      ].filter((cont: any) => cont.patient_b !== PatientID)
                    }
                  )
                }
                // 3. put patient in the bucket for the new location
                if (buckets[new_location] === undefined) {
                  buckets[new_location] = []
                }
                buckets[new_location].push(PatientID)
                patient_is_on_station[PatientID] = new_location

                // 4. start new current_contacts for the patient
                if (new_location !== "home" && new_location !== "tmp_home") {
                  let new_contact_patients: string[] = buckets[
                    new_location
                  ].filter((patID: string) => patID !== PatientID)
                  new_contact_patients.forEach((new_contact_patID: string) => {
                    current_contacts[PatientID].push({
                      patient_a: PatientID,
                      patient_b: new_contact_patID,
                      station_id: new_location,
                      begin: timestamp,
                      end: undefined,
                    })

                    current_contacts[new_contact_patID].push({
                      patient_a: new_contact_patID,
                      patient_b: PatientID,
                      station_id: new_location,
                      begin: timestamp,
                      end: undefined,
                    })
                  })
                }
              }
            })

            let simulation = d3
              .forceSimulation(nodes)
              .force(
                "link",
                d3.forceLink(links).id((d: any) => d.id)
              )
              .force("charge", d3.forceManyBody())
              .force("center", d3.forceCenter(500, 500))

            return new Promise((resolve) => {
              setTimeout(() => {
                simulation.stop()

                let min_x = Number.MAX_VALUE
                let max_x = Number.MIN_VALUE

                let min_y = Number.MAX_VALUE
                let max_y = Number.MIN_VALUE

                nodes.forEach((node: any) => {
                  let new_x = node.x
                  let new_y = node.y

                  if (new_x < min_x) {
                    min_x = new_x
                  }

                  if (new_y < min_y) {
                    min_y = new_y
                  }

                  if (new_x > max_x) {
                    max_x = new_x
                  }

                  if (new_y > max_y) {
                    max_y = new_y
                  }
                })

                let vis_offset_y = -min_y - (max_y - min_y) / 2
                let vis_offset_x = -min_x - (max_x - min_x) / 2

                // graph_data.push({
                //   name: location_property.name,
                //   propname: location_property.prop_name,
                //   nodes,
                //   links,
                //   min_x,
                //   max_x,
                //   min_y,
                //   max_y,
                //   vis_offset_x,
                //   vis_offset_y,
                // })
                graph_data[location_property.name] = {
                  name: location_property.name,
                  propname: location_property.prop_name,
                  nodes,
                  links,
                  min_x,
                  max_x,
                  min_y,
                  max_y,
                  vis_offset_x,
                  vis_offset_y,
                }
                resolve("Waited 1000ms for the simulation to compute")
              }, 1000)
            })
          }
          //#endregion generate contact graph

          await generate_contact_graph(location_properties[0]).then(
            (result) => {
              console.log(result)
            }
          )
          await generate_contact_graph(location_properties[1]).then(
            (result) => {
              console.log(result)
            }
          )
        } else {
          // // TODO: How to deal with an error in the raw_data? We don't have further information WHERE that error occured -> so we abort
          // error_log.addError(
          //   "Contact_NthDegree_TTKP_Degree",
          //   parameters,
          //   error_prio,
          //   Contact_NthDegree_TTKP_Degree.error
          // )
          // TODO: How to deal with an error in the raw_data? We don't have further information WHERE that error occured -> so we abort
          error_log.addError(
            "Patient_Labordaten_Ps",
            parameters,
            error_prio,
            Patient_Labordaten_Ps.error
          )
        }
      } else {
        // TODO: How to deal with an error in the raw_data? We don't have further information WHERE that error occured -> so we abort
        error_log.addError(
          "Patient_Bewegung_Ps",
          parameters,
          error_prio,
          Patient_Bewegung_Ps.error
        )
      }
      return {
        timestamp: new Date().getTime(),
        patient_list,
        station_list,
        graph_data,
        timespan,
        return_log: error_log.clearAndReturnLog(),
      }
    },
  },
  rki_data_by_day: {
    needed_raw_data: ["RKIalgo"],
    call_function: (input_data: any, parameters: any) => {
      let { RKIalgo } = input_data

      let parsed_rki: any[] = []

      if (RKIalgo.error === undefined) {
        let data = RKIalgo.data

        data.Zeitstempel.forEach((ts_string: string, index: number) => {
          parsed_rki.push({
            timestamp: new Date(ts_string).getTime(),
            Zeitstempel: ts_string,
            outbreak_prob: data.Ausbruchswahrscheinlichkeit[index],
            pValue: data["p-Value"][index],
            pathogen_count: data.Erregeranzahl[index],
            endemisches_niveau: data["Endemisches Niveau"][index],
            epidemisches_niveau: data["Epidemisches Niveau"][index],
            "Endemisches Niveau": data["Endemisches Niveau"][index],
            "Epidemisches Niveau": data["Epidemisches Niveau"][index],
            upper_limit: data.Obergrenze[index],
            cases_below_upper_limit: data["Faelle unter der Obergrenze"][index],
            cases_above_upper_limit: data["Faelle ueber der Obergrenze"][index],
            classification: data["Klassifikation der Alarmfaelle"][index],
          })
        })

        parsed_rki.forEach((d: any) => {
          if (d.StationID === null || d.StationID === undefined) {
            d.StationID = "klinik"
          }
        })
      } else {
        error_log.addError("RKIalgo", parameters, error_prio, RKIalgo.error)
      }
      return { parsed_rki, return_log: error_log.clearAndReturnLog() }
    },
  },
}

export default data_parser
