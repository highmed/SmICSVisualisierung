import {
  get_status_ranking,
  get_carrier_status,
  get_worse_carrier_status,
} from "./utilities/carrier_status"
import { createError, errorDataType, Error_Log } from "./error_log"
import * as cli_color from "cli-color"

const error_prio: number = 1.4

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

      let first_timestamp = Number.MAX_VALUE
      let last_timestamp = 0

      let investigations: any[] = []

      let status_changes: any = {}

      let error_log = new Error_Log()

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
          if (timestamp < first_timestamp) {
            first_timestamp = timestamp
          }
          if (timestamp > last_timestamp) {
            last_timestamp = timestamp
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
            investigations[index].data.push(investigation_data_copy)
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
          createError(
            "Patient_Labordaten_Ps",
            parameters,
            error_prio,
            Patient_Labordaten_Ps.error
          )
        )
      }

      let return_log: errorDataType[] = error_log.getErrorLog()

      return {
        timestamp: new Date().getTime(),
        first_timestamp,
        last_timestamp,
        patientList,
        investigations,
        status_changes,
        return_log,
      }
    },
  },
  // TODO: SMICS-0.8
  generate_mibi_investigations_TEMP: {
    needed_raw_data: ["Contact_NthDegree_TTKP_Degree"],
    call_function: (input_data: any, parameters: any) => {
      let error_log = new Error_Log()

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
          createError(
            "Contact_NthDegree_TTKP_Degree",
            parameters,
            error_prio,
            Contact_NthDegree_TTKP_Degree.error
          )
        )
      }

      let { patientList } = parameters
      if (patientList === undefined) {
        patientList = []
      }

      let first_timestamp = Number.MAX_VALUE
      let last_timestamp = 0

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
          if (timestamp < first_timestamp) {
            first_timestamp = timestamp
          }
          if (timestamp > last_timestamp) {
            last_timestamp = timestamp
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
          createError(
            "Patient_Labordaten_Ps",
            parameters,
            error_prio,
            Patient_Labordaten_Ps.error
          )
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
      let return_log: errorDataType[] = error_log.getErrorLog()
      return {
        timestamp: new Date().getTime(),
        first_timestamp,
        last_timestamp,
        patientList,
        investigations,
        status_changes,
        return_log,
      }
    },
  },
  generate_movement_rects: {
    needed_raw_data: ["Patient_Bewegung_Ps"],
    call_function: (input_data: any, parameters: any) => {
      let { Patient_Bewegung_Ps } = input_data

      let error_log = new Error_Log()

      let { patientList } = parameters

      let first_movement = Number.MAX_VALUE
      let last_movement = 0

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
          if (movement.StationID === undefined) {
            if (movement.Station === undefined) {
              movement.StationID = movement.Fachabteilung
            } else {
              movement.StationID = movement.Station
            }
          }

          if (!allStations.includes(movement.StationID)) {
            if (movement.BewegungstypID !== 4) {
              allStations.push(movement.StationID)
            }
          }

          let begin = new Date(movement.Beginn).getTime()
          let end = new Date(movement.Ende).getTime()
          if (begin < first_movement) {
            first_movement = begin
          }
          if (end > last_movement) {
            last_movement = end
          }
          let vis_struct: any = {
            begin: begin,
            end: end,
            patient_id: movement.PatientID,
            station_id: movement.StationID,
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
          createError(
            "Patient_Bewegung_Ps",
            parameters,
            error_prio,
            Patient_Bewegung_Ps.error
          )
        )
      }

      let return_log: errorDataType[] = error_log.getErrorLog()

      return {
        timestamp: new Date().getTime(),
        first_movement,
        last_movement,
        patientList: new_patient_list,
        movement_rects,
        movement_dots,
        allStations,
        unknown_rects,
        return_log,
      }
    },
  },
  generate_contact_graph: {
    needed_raw_data: ["Patient_Labordaten_Ps", "Patient_Bewegung_Ps"],
    call_function: (input_data: any, parameters: any) => {
      /**
       * get pointers to the needed data
       * and run the algorithm
       */

      // TODO: generate_mibi_investigations aufrufen... (falls noch nicht vorhanden...)

      let error_log = new Error_Log()

      console.log(`
      
      
      
      
      
      
      
      generate contact graph
      
      
      
      
      
      `)

      if (true) {
        // Wenn KEIN ERROR in vorherigen daten...
      } else {
        error_log.addError(
          createError(
            "dataname that produces error",
            parameters,
            error_prio,
            { error: "dataname that produceed error" }.error
          )
        )
      }

      let return_log: errorDataType[] = error_log.getErrorLog()
      return {
        data: "data",
        return_log,
      }
    },
  },
  rki_data_by_day: {
    needed_raw_data: ["RKIalgo"],
    call_function: (input_data: any, parameters: any) => {
      let { RKIalgo } = input_data

      let parsed_rki: any[] = []

      let error_log = new Error_Log()

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
        error_log.addError(
          createError("RKIalgo", parameters, error_prio, RKIalgo.error)
        )
      }
      let return_log: errorDataType[] = error_log.getErrorLog()
      return { parsed_rki, return_log }
    },
  },
  prediction_data_parser: {
    needed_raw_data: ["PredictionDummy"],
    call_function: (input_data: any, parameters: any) => {
      let { PredictionDummy } = input_data
      console.log(PredictionDummy)

      let return_log: errorDataType[] = []
      return { PredictionDummy, return_log }
    },
  },
}

export default data_parser
