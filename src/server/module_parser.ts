/**
 * All algorithms to generate the visualizations for the modules
 *
 * Name des Moduls
 * welche raw-data benoetigt werden
 * welche parsed-data benoetigt werden
 * die parse-funktion selbst implementieren; default (z.B: on Error etc)
 * ein leeres Array ([]) zurueck geben
 */
import { errorDataType } from "./error_log"
import { raw } from "mysql"
import * as d3 from "d3"
import * as d3_sankey from "d3-sankey"
import { get_worse_carrier_status } from "./utilities/carrier_status"
import parse_sl_data from "./utilities/storylineParser"
import { Error_Log } from "./error_log"
import { sankey } from "./utilities/d3-sankey"
import * as cli_color from "cli-color"
import {
  get_max_value,
  get_min_value,
  set_min_max_value,
} from "./utilities/min_max"
import storyline from "./utilities/storyline-vis"

const raw_error_prio: number = 1.7
const parsed_error_prio: number = 2.7
let error_log = new Error_Log()

const module_parser: { [key: string]: any } = {
  patientdetail: {
    needed_raw_data: [
      "Patient_Bewegung_Ps",
      "Patient_Labordaten_Ps",
      "Patient_Vaccination",
      "Patient_Symptom",
    ],

    needed_parsed_data: [
      "generate_mibi_investigations",
      "generate_movement_rects",
    ],
    call_function: (input_data: any, parameters: any, callback: Function) => {
      let {
        Patient_Symptom,
        Patient_Vaccination,
        Patient_Bewegung_Ps,
        Patient_Labordaten_Ps,
        generate_mibi_investigations,
        generate_movement_rects,
      } = input_data

      let patientList: any[] = []
      let min_ts: any = undefined
      let max_ts: any = undefined

      if (generate_movement_rects.error === undefined) {
        set_min_max_value(
          min_ts,
          max_ts,
          generate_mibi_investigations.data.min_ts,
          generate_mibi_investigations.data.max_ts
        )
      }

      // TODO: Wie muss ereignisTriangles und ereignisCircles generiert werden ?
      let ereignisTriangles: object[] = []
      let ereignisCircles: object[] = []

      // #region globalTimeStamps , patientList & nosokomiale Patienten
      if (generate_mibi_investigations.error === undefined) {
        if (generate_mibi_investigations.data.investigations > 0) {
          set_min_max_value(
            min_ts,
            max_ts,
            generate_mibi_investigations.data.min_ts,
            generate_mibi_investigations.data.max_ts
          )
        }
      } else {
        error_log.addError(
          "generate_mibi_investigations",
          parameters,
          parsed_error_prio,
          generate_mibi_investigations.error
        )
      }

      if (Patient_Bewegung_Ps.error === undefined) {
        Patient_Bewegung_Ps.data.forEach((element: any) => {
          let pID = element.PatientID
          let beginn = new Date(element.Beginn).getTime()
          let ende = new Date(element.Ende).getTime()

          if (!patientList.includes(pID)) {
            patientList.push(pID)
          }
          set_min_max_value(min_ts, max_ts, beginn, ende)
        })
      } else {
        error_log.addError(
          "Patient_Bewegung_Ps",
          parameters,
          raw_error_prio,
          Patient_Bewegung_Ps.error
        )
      }

      if (Patient_Labordaten_Ps.error === undefined) {
        Patient_Labordaten_Ps.data.forEach((element: any) => {
          let pID = element.PatientID
          if (!patientList.includes(pID)) {
            patientList.push(pID)
          }
        })
      } else {
        error_log.addError(
          "Patient_Labordaten_Ps",
          parameters,
          raw_error_prio,
          Patient_Labordaten_Ps.error
        )
      }

      let counter = 0
      if (Patient_Vaccination.error === undefined) {
        Patient_Vaccination.data.forEach((element: any) => {
          let pID = element.PatientenID
          let impfDatum = new Date(element.DokumentationsID).getTime()

          //console.log(cli_color.blueBright(pID))
          if (!patientList.includes(pID)) {
            counter++
            //console.log(cli_color.blueBright(counter))
            patientList.push(pID)
          }

          if (impfDatum < min_ts) {
            min_ts = impfDatum
          }

          if (impfDatum > max_ts) {
            max_ts = impfDatum
          }
        })
      } else {
        error_log.addError(
          "Patient_Vaccination",
          parameters,
          raw_error_prio,
          Patient_Vaccination.error
        )
      }

      if (Patient_Symptom.error === undefined) {
        Patient_Symptom.data.forEach((element: any) => {
          let pID = element.PatientenID
          let first_date = new Date(element.Beginn).getTime()
          let last_date = new Date(element.Rueckgang).getTime()

          if (!patientList.includes(pID)) {
            patientList.push(pID)
          }
          set_min_max_value(min_ts, max_ts, first_date, last_date)
        })
      } else {
        error_log.addError(
          "Patient_Symptom",
          parameters,
          raw_error_prio,
          Patient_Symptom.error
        )
      }

      // #region virusLastRects
      let virusLastRects: object[] = []

      if (Patient_Labordaten_Ps.error === undefined) {
        let patient_and_test: object[] = []

        // Patient_Labordaten_Ps.data.forEach((labor_data: any) => {
        //   let patID_test = {
        //     patID: labor_data.PatientID,
        //     testDate: new Date(labor_data.Befunddatum).getTime(),
        //   }
        //   patient_and_test.push(patID_test)
        // })

        // Patient_Labordaten_Ps.data.forEach((d: any) => {

        // })

        patientList.forEach((pid: any) => {
          // let virusLastRect: any = {
          //   patientID: pid,

          // }
          let virus_data = Patient_Labordaten_Ps.data.filter(
            (d: any) => d.PatientID === pid
          )
          virus_data.sort(
            (a: any, b: any) =>
              new Date(a.Befunddatum).getTime() -
              new Date(b.Befunddatum).getTime()
          )

          virus_data.forEach((vd: any, i: any) => {
            set_min_max_value(
              min_ts,
              max_ts,
              new Date(vd.Befunddatum).getTime()
            )

            let begin = vd.Befunddatum
            let end =
              i < virus_data.length - 1
                ? virus_data[i + 1].Befunddatum
                : undefined

            let testArt = undefined

            if (vd.KeimID === "94558-4") {
              testArt = "antiGen"
            }

            virusLastRects.push({
              begin: new Date(begin).getTime(),
              end: end ? new Date(end).getTime() : undefined,
              testArt,
              ...vd,
              Quantity: Number(vd.Quantity),
            })
          })
        })
      } else {
        error_log.addError(
          "Patient_Labordaten_Ps",
          parameters,
          raw_error_prio,
          Patient_Labordaten_Ps.error
        )
      }
      // #endregion

      // #region stationenRects
      let stationenRects: object[] = []
      let stationsArten: any = [
        "CovidStation",
        "NormalStation",
        "ICR",
        "Intensivstation",
      ]

      if (Patient_Bewegung_Ps.error === undefined) {
        Patient_Bewegung_Ps.data.forEach((mov: any) => {
          let stationsStruct: any = {
            aufenthaltsBegin: new Date(mov.Beginn).getTime(),
            aufenthaltsEnde: new Date(mov.Ende).getTime(),
            patient_id: mov.PatientID,
            station_id: mov.Station,
            /* wann soll "ICR" gesetzt werden?
             * ist es sinnvoll alles was nicht Covid / Intensiv / ICR ist als NormalStation zu deklarieren?
             * default für stationsArt: NormalStation
             */
            stationsArt: stationsArten[1],
          }

          // ! Bei Verlegung auf Covid- od. Intensivstation wird erreignisTriangle gesetzt
          if (mov.Station === "Coronastation") {
            stationsStruct.stationsArt = stationsArten[0]

            let triangleStruct: any = {
              patientID: mov.PatientID,
              ereignisTimeStamp: new Date(mov.Beginn).getTime(),
            }
            ereignisTriangles.push(triangleStruct)
          }

          if (mov.Fachabteilung === "Intensivstation") {
            stationsStruct.stationsArt = stationsArten[3]

            let triangleStruct: any = {
              patientID: mov.PatientID,
              ereignisTimeStamp: new Date(mov.Beginn).getTime(),
            }

            ereignisTriangles.push(triangleStruct)
          }
          set_min_max_value(
            min_ts,
            max_ts,
            stationsStruct.aufenthaltsBegin,
            stationsStruct.aufenthaltsEnde
          )

          stationenRects.push(stationsStruct)
        })
      } else {
        error_log.addError(
          "Patient_Bewegung_Ps",
          parameters,
          raw_error_prio,
          Patient_Bewegung_Ps.error
        )
      }
      // #endregion

      // #region Impfdaten
      let impfDaten: object[] = []
      let vacc_injection_data: any[] = []
      let vacc_list: string[] = []
      if (Patient_Vaccination.error === undefined) {
        Patient_Vaccination.data.forEach((vacc_data: any) => {
          let vacc_inj_data = vacc_data
          vacc_inj_data.doc_ts = new Date(
            vacc_inj_data.DokumentationsID
          ).getTime()
          vacc_injection_data.push(vacc_data)
          if (!vacc_list.includes(vacc_data.PatientenID)) {
            vacc_list.push(vacc_data.PatientenID)

            let impfdatenStruct = {
              patientID: vacc_data.PatientenID,
              medikament: new String(),
              anzahl_impfungen: vacc_data.Dosierungsreihenfolge,
            }

            if (
              vacc_data.Impfstoff ===
              "Vaccine product containing only Severe acute respiratory syndrome coronavirus 2 messenger ribonucleic acid (medicinal product)"
            ) {
              impfdatenStruct.medikament =
                "Comirnaty / COVID-19 Vaccine Moderna"
            }
            if (
              vacc_data.Impfstoff ===
              "Vaccine product containing only Severe acute respiratory syndrome coronavirus 2 antigen (medicinal product)"
            ) {
              impfdatenStruct.medikament = "Vaxzevria / Janssen"
            }
            impfDaten.push(impfdatenStruct)
          } else {
            impfDaten.forEach((data: any) => {
              if (data.patientID === vacc_data.PatientenID) {
                if (data.anzahl_impfungen < vacc_data.Dosierungsreihenfolge) {
                  data.anzahl_impfungen = vacc_data.Dosierungsreihenfolge
                }
              }
            })
          }
          /**
           * @Tom aktuell wird nur ein Objekt pro Patient übergeben. Vllt. ist es sinnvoller pro stattgefundener
           *      Impfung ein Objekt zu übergeben. (z. Bsp.: Um Kreuzimpfungen darzustellen? )
           *
           * TODO: ja sollte in überarbeiteter Version definitiv gemacht werden; für v0.9 erstmal so
           */
        })
        patientList.forEach((pid) => {
          if (!vacc_list.includes(pid)) {
            vacc_list.push(pid)

            let impfdatenStruct = {
              patientID: pid,
              medikament: "No vaccine",
              anzahl_impfungen: 0,
            }

            impfDaten.push(impfdatenStruct)
          }
        })
        vacc_injection_data.sort(
          (a, b) => a.Dosierungsreihenfolge - b.Dosierungsreihenfolge
        )
      } else {
        error_log.addError(
          "Patient_Vaccination",
          parameters,
          raw_error_prio,
          Patient_Vaccination.error
        )
      }
      // #endregion

      // #region Symptomdaten
      let symptomDaten: object[] = []

      if (Patient_Symptom.error === undefined) {
        Patient_Symptom.data.forEach((symptom_data: any) => {
          let symptomStruct = {
            patientID: symptom_data.PatientenID,
            // ! symptomArt soll gastroenterol. / respirat. / system. sein --> keine Daten vorhanden
            symptomArt: symptom_data.NameDesSymptoms,
            symptomBeginn: new Date(symptom_data.Beginn).getTime(),
            symptomEnde: new Date(symptom_data.Rueckgang).getTime(),
            negation: symptom_data.AusschlussAussage,
          }

          set_min_max_value(
            min_ts,
            max_ts,
            symptomStruct.symptomBeginn,
            symptomStruct.symptomEnde
          )

          symptomDaten.push(symptomStruct)

          // ! bei Symptombeginn wird aktuell ereignisTriangle gesetzt ( bei Rueckgang ereignisCircle ) !
          let triangleStruct: any = {
            patientID: symptom_data.PatientenID,
            ereignisTimeStamp: new Date(symptom_data.Beginn).getTime(),
          }
          ereignisTriangles.push(triangleStruct)

          /*
          let circleStruct: any = {
            patientID: symptom_data.PatientenID,
            ereignisTimeStamp: new Date(symptom_data.Rueckgang).getTime()
          }
          ereignisCircles.push(circleStruct)
          */
        })
      } else {
        error_log.addError(
          "Patient_Symptom",
          parameters,
          raw_error_prio,
          Patient_Symptom.error
        )
      }
      //#endregion Symptomdaten

      // console.log(cli_color.green(patientList.length))
      callback({
        virusLastRects,
        stationenRects,
        ereignisTriangles,
        ereignisCircles,
        //annotationsTriangles,
        min_ts,
        max_ts,
        impfDaten,
        vacc_injection_data,
        symptomDaten,
        ...generate_movement_rects.data,
        patientList,
        return_log: error_log.clearAndReturnLog(),
      })
    },
  },
  epikurve: {
    needed_raw_data: [
      "Labor_ErregerProTag_TTEsKSs",
      "OutbreakDetectionResultSet",
      "OutbreakDetectionConfigurations",
    ],
    // needed_raw_data: ["Labor_ErregerProTag_TTEsKSs"],
    // needed_parsed_data: ["rki_data_by_day"],
    needed_parsed_data: [],
    // TODO: PRO ERREGER!!! aktuell alle Erreger in Reihe geschalten
    // TODO: die initial timestamps for timelense sind null...
    call_function: (input_data: any, parameters: any, callback: Function) => {
      let {
        Labor_ErregerProTag_TTEsKSs,
        OutbreakDetectionResultSet,
        OutbreakDetectionConfigurations,
      } = input_data

      let { starttime, endtime, station, pathogenList, configName } = parameters

      let initial_timelense_timestamps: number[] = []
      let timespan: number[] = []
      let newData: any[] = []
      let stationIDs: string[] = []
      let pathogenIDs: string[] = []
      let dayDataSets: any = {}

      let config_stationid: any = undefined
      // das bleibt drin, weil "frische" Daten sind ja nie schlecht...
      if (
        configName !== "" &&
        OutbreakDetectionConfigurations.error === undefined
      ) {
        // get the stationid for the selected config
        OutbreakDetectionConfigurations.data.forEach((conf: any) => {
          if (conf.name === configName) {
            config_stationid = conf.StationID
          }
        })
      }

      // TODO: Pascal fragen, ob das benötigt wird, oder ob RKI Daten das schon haben...
      if (OutbreakDetectionResultSet.error === undefined) {
        OutbreakDetectionResultSet.data.forEach((d: any) => {
          d.StationID = config_stationid
        })
      }

      if (
        Labor_ErregerProTag_TTEsKSs.error === undefined &&
        Labor_ErregerProTag_TTEsKSs.data.length > 0
      ) {
        // Fuer jede Station und jeden Pathogen eine Kurve erzeugen
        // + Endemische Kurven jeweils
        // + für 7 Tage / 28 Tage akkumuliert

        let raw_data = Labor_ErregerProTag_TTEsKSs.data
        // ! FUER ENDE-MAERZ DAZU GEMACHT
        raw_data.forEach((d: any) => {
          if (d.anzahl_gesamt !== undefined) {
            d.Anzahl_cs = d.anzahl_gesamt
            d.MAVG7_cs = d.anzahl_gesamt_av7
            d.MAVG28_cs = d.anzahl_gesamt_av28
          }

          // // fuer jeden Tag die Ausbruchswahrscheinlichkeit
          // // und die anderen Daten asu RKIalgo rauslesen
          // if (rki_data_by_day.error === undefined) {
          //   let index = rki_data_by_day.data.findIndex(
          //     (rki_d: any) =>
          //       rki_d.timestamp === new Date(d.Datum.split("T")[0]).getTime()
          //   )
          //   console.log(index)
          //   if (index >= 0) {
          //     console.log("geht rein")
          //     d = {
          //       ...d,
          //       ...rki_data_by_day.data[index],
          //     }
          //     console.log(d)
          //   }
          // }
        })

        raw_data.forEach((d: any, i: any) => {
          if (d.StationID === null) [(d.StationID = "klinik")]

          d.timestamp = new Date(d.Datum.split(".")[0]).getTime()
          // unsere Datenbank liefer da glaube ich einfach nichts zurueck
          d.avg7 = d.MAVG7 ? d.MAVG7 : 0
          d.avg28 = d.MAVG28 ? d.MAVG28 : 0
          d.avg7_cs = d.MAVG7_cs ? d.MAVG7_cs : 0
          d.avg28_cs = d.MAVG28_cs ? d.MAVG28_cs : 0

          if (!stationIDs.includes(d.StationID)) {
            stationIDs.push(d.StationID)
          }

          if (!pathogenIDs.includes(d.ErregerID)) {
            pathogenIDs.push(d.ErregerID)
          }
        })

        pathogenIDs.forEach((pathogen: string) => {
          // })

          let data = JSON.parse(JSON.stringify(raw_data)).filter(
            (p: any) => pathogen === p.ErregerID
          )

          data.forEach((d: any) => {
            // fuer jeden Tag die Ausbruchswahrscheinlichkeit
            // und die anderen Daten asu RKIalgo rauslesen
            if (OutbreakDetectionResultSet.error === undefined) {
              // !TODO nur temporaer zum testen lokal...
              if (configName === "") {
                OutbreakDetectionResultSet.data = []
              }

              let index = OutbreakDetectionResultSet.data.findIndex(
                (rki_d: any) =>
                  new Date(rki_d.Zeitstempel.split("T")[0]).getTime() ===
                    new Date(d.Datum.split("T")[0]).getTime() &&
                  rki_d.StationID === d.StationID
                // && rki_d.pathogen === d.ErregerID
              )
              //console.log(index);
              if (index >= 0) {
                //console.log("geht rein");
                // d = {
                //   ...d,
                //   ...rki_data_by_day.data[index],
                // }
                d.rki_data = OutbreakDetectionResultSet.data[index]
                // console.log(d)
              }
            } else {
              error_log.addError(
                "OutbreakDetectionResultSet",
                parameters,
                raw_error_prio,
                OutbreakDetectionResultSet.error
              )
            }
          })

          stationIDs.forEach((stationID: any) => {
            if (dayDataSets["K" + pathogen] === undefined) {
              dayDataSets["K" + pathogen] = {}
            }

            dayDataSets["K" + pathogen][stationID] = data.filter(
              (d: any) => d.StationID === stationID
            )

            let accumulated_count = 0
            let copy_day
            dayDataSets["K" + pathogen][stationID].forEach(
              (d: any, i: number) => {}
            )
          })
        })
        /**
         * Initiale Anfangs- und Endzeit abspeichern
         */
        timespan = [
          raw_data[0].timestamp,
          raw_data[raw_data.length - 1].timestamp,
        ]
        initial_timelense_timestamps = [
          raw_data[0].timestamp,
          raw_data[raw_data.length - 1].timestamp + 1000 * 60 * 60 * 24,
          // data[0][0].timestamp + 1000 * 60 * 60 * 24 * 60,
          // data[0][data[0].length - 1].timestamp + 1000 * 60 * 60 * 24 - 1000 * 60 * 60 * 24 * 60
        ]

        // let newData = [dayDataSets, weekDataSets, monthDataSets]
      } else {
        error_log.addError(
          "Labor_ErregerProTag_TTEsKSs",
          parameters,
          raw_error_prio,
          Labor_ErregerProTag_TTEsKSs.error
        )
      }

      callback({
        timestamp: new Date().getTime(),
        // data: { dayDataSets, weekDataSets, monthDataSets },
        data: dayDataSets,
        timespan,
        initial_timelense_timestamps,
        stationIDs,
        pathogenIDs,
        // rki_data_by_day,
        return_log: error_log.clearAndReturnLog(),
        rki_data_by_day: OutbreakDetectionResultSet,
        rki_configs: OutbreakDetectionConfigurations.data,
        config_stationid,
        configName,
      })
      // return {
      //   timestamp: new Date().getTime(),
      //   // data: { dayDataSets, weekDataSets, monthDataSets },
      //   data: [dayDataSets, weekDataSets, monthDataSets],
      //   initial_timelense_timestamps,
      //   stationIDs,
      //   pathogenIDs,
      // }
    },
  },
  demo_linelist: {
    needed_raw_data: ["Patient_Bewegung_Ps"],
    needed_parsed_data: ["generate_mibi_investigations"],
    call_function: (input_data: any, parameters: any, callback: Function) => {
      let { Patient_Bewegung_Ps, generate_mibi_investigations } = input_data

      let { patientList } = parameters

      let ts_start = Number.MAX_VALUE
      let ts_end = 0

      let movement_rects: object[] = []
      let movement_dots: object[] = []
      let investigation_rects: object[] = []

      // generate visualization for movement data (horizontal rectangles)
      // only if there is no error in the data
      if (Patient_Bewegung_Ps.error === undefined) {
        let movement_rect_top_position: any = {}

        Patient_Bewegung_Ps.data.forEach((movement: any) => {
          let begin = new Date(movement.Beginn).getTime()
          let end = new Date(movement.Ende).getTime()
          if (begin < ts_start) {
            ts_start = begin
          }
          if (end > ts_end) {
            ts_end = end
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
          "Patient_Bewegung_Ps",
          parameters,
          raw_error_prio,
          Patient_Bewegung_Ps.error
        )
      }

      // generate visualization for investigation data (vertical rectangles)
      // only if there is no error in the data
      if (generate_mibi_investigations.error === undefined) {
        let { first_timestamp, last_timestamp, investigations } =
          generate_mibi_investigations.data

        if (ts_start > first_timestamp) {
          ts_start = first_timestamp
        }
        if (ts_end < last_timestamp) {
          ts_end = last_timestamp
        }

        investigation_rects = investigations
      } else {
        error_log.addError(
          "generate_mibi_investigations",
          parameters,
          parsed_error_prio,
          generate_mibi_investigations.error
        )
      }

      // return {
      //   // data: ["linelist vis data", input_data],
      //   timestamp: new Date().getTime(),
      //   ts_start,
      //   ts_end,
      //   patientList,
      //   movement_rects,
      //   movement_dots,
      //   investigation_rects,
      // }

      callback({
        // data: ["linelist vis data", input_data],
        timestamp: new Date().getTime(),
        ts_start,
        ts_end,
        patientList,
        movement_rects,
        movement_dots,
        investigation_rects,
        return_log: error_log.clearAndReturnLog(),
      })
    },
  },
  kontaktnetzwerk: {
    needed_raw_data: [],
    needed_parsed_data: ["generate_contact_graph"],
    call_function: (input_data: any, parameters: any, callback: Function) => {
      let { generate_contact_graph } = input_data

      if (generate_contact_graph.error !== undefined) {
        error_log.addError(
          "generate_contact_graph",
          parameters,
          parsed_error_prio,
          generate_contact_graph.error
        )
      }
      callback({
        ...generate_contact_graph.data,
        return_log: error_log.clearAndReturnLog(),
      })
    },
  },
  linelist: {
    needed_raw_data: ["Patient_Bewegung_Ps"],
    needed_parsed_data: [
      "generate_mibi_investigations",
      "generate_movement_rects",
    ],
    call_function: (input_data: any, parameters: any, callback: Function) => {
      let {
        Patient_Bewegung_Ps,
        generate_mibi_investigations,
        generate_movement_rects,
      } = input_data

      // // TODO: SMICS-0.8
      // // Patientenliste wegen Nth-Degree rauslesen
      // let new_patient_list: any[] = []
      // if (Patient_Bewegung_Ps.error === undefined) {
      //   Patient_Bewegung_Ps.data.forEach((mov: any) => {
      //     if (!new_patient_list.includes(mov.PatientID)) {
      //       new_patient_list.push(mov.PatientID)
      //     }
      //   })
      // } else {
      //   error_log.addError(
      //
      //       "Patient_Bewegung_Ps",
      //       parameters,
      //       raw_error_prio,
      //       Patient_Bewegung_Ps.error
      //
      //   )
      // }

      let {
        min_ts,
        max_ts,
        patientList,
        movement_rects,
        movement_dots,
        allStations,
        unknown_rects,
      } = generate_movement_rects.data

      let investigation_rects: object[] = []
      let status_rects: any[] = []

      if (generate_mibi_investigations.error === undefined) {
        // generate visualization for investigation data (vertical rectangles)
        // only if there is no error in the data
        let { investigations, status_changes } =
          generate_mibi_investigations.data

        // min_ts = get_min_value(min_ts, generate_mibi_investigations.data.min_ts)
        // max_ts = get_max_value(max_ts, generate_mibi_investigations.data.max_ts)
        set_min_max_value(
          min_ts,
          max_ts,
          generate_mibi_investigations.data.min_ts,
          generate_mibi_investigations.data.max_ts
        )

        investigation_rects = investigations

        if (Patient_Bewegung_Ps.error === undefined) {
          /**
           * generate status rects
           *
           * for every patient_id AND pathogen_id
           * - begin_min_ts_ts
           * - end_max_ts_ts
           *
           * - "every pathogen":
           *    - "not_tested" -> einfach grauer balken für "unknown"
           *    - dann für alle getesteten pathogens -> aus status changes
           */
          patientList.forEach((pID: any) => {
            // get first and last timestamp
            let first_ts: any = undefined
            let last_ts: any = undefined

            let patient_movements = Patient_Bewegung_Ps.data.filter(
              (d: any) => d.PatientID === pID && d.BewegungstypID !== 4
            )

            patient_movements.forEach((movement: any) => {
              let begin = new Date(movement.Beginn).getTime()
              let end = new Date(movement.Ende).getTime()

              if (first_ts === undefined || begin < first_ts) {
                first_ts = begin
              }
              if (last_ts === undefined || end > last_ts) {
                last_ts = end
              }
            })

            // generate blank/"unknown" rectangle
            let unknown_rect = {
              patient_id: pID,
              pathogen_id: undefined,
              begin: first_ts,
              end: last_ts,
              status: "unknown",
            }
            // status_rects.push(unknown_rect)
            // unknown_rects.push(unknown_rect)
            unknown_rects[pID] = unknown_rect

            // console.log(`.........................Status Rects for ${pID}`)

            // console.log("pID", pID)
            // console.table(status_changes[pID])
            // !wenn jemand NIE getestet wurde, gibt es keine
            // !Labordaten fuer ihn, also kann er nicht in der
            // !mibiInvestigations-PatientListe auftauchen...

            let tested_pathogens: any[] = []
            if (status_changes[pID]) {
              tested_pathogens = Object.getOwnPropertyNames(status_changes[pID])
            }
            // let tested_pathogens: any[] = Object.getOwnPropertyNames(
            //   status_changes[pID]
            // )

            // console.log(
            //   `Tested Pathogens for this Patient... ${tested_pathogens}`
            // )
            // console.table(status_changes[pID])

            tested_pathogens.forEach((pathID: any) => {
              let current_last_ts = first_ts
              let current_status = "unknown"

              // Status von vor der Aufnahme ermitteln
              status_changes[pID][pathID].forEach(
                (stat_change: any, i: number) => {
                  // console.table(stat_change)
                  if (stat_change.timestamp <= min_ts) {
                    // console.log(`before first_ts ${stat_change}`)
                    current_status = get_worse_carrier_status(
                      current_status,
                      stat_change.new_status
                    )
                    // TODO: statt nur bei Verschlimmerung kann auch jedes mal neues Rectangle erzeugt werden
                    // current_status = stat_change.new_status
                  }
                }
              )
              status_rects.push({
                patient_id: pID,
                pathogen_id: pathID,
                begin: first_ts,
                end: last_ts,
                status: current_status,
              })
              // console.log(`Status VOR der Aufnahme: ${current_status}`)

              status_changes[pID][pathID].forEach(
                (stat_change: any, i: number) => {
                  let stat_change_ts = stat_change.timestamp
                  // console.table(stat_change)

                  // Nur wenn status_change innerhalb des Aufenthaltszeitraums liegt
                  if (stat_change_ts > min_ts && stat_change_ts < max_ts) {
                    let new_status = get_worse_carrier_status(
                      current_status,
                      stat_change.new_status
                    )
                    // console.log(`NEUER STATUS des Patienten: ${new_status}`)
                    // TODO: statt nur bei Verschlimmerung kann auch jedes mal neues Rectangle erzeugt werden
                    // new_status = stat_change.new_status

                    if (new_status !== current_status) {
                      status_rects[status_rects.length - 1].end = stat_change_ts
                      status_rects.push({
                        patient_id: pID,
                        pathogen_id: pathID,
                        begin: stat_change_ts,
                        end: last_ts,
                        status: new_status,
                      })
                      current_status = new_status
                      // console.log(`GEPSCHTER Status Recht: ${new_status}`)
                    }
                  }
                }
              )
            })
          })
        }
      } else {
        error_log.addError(
          "generate_mibi_investigations",
          parameters,
          parsed_error_prio,
          generate_mibi_investigations.error
        )
      }

      let patients_width_status_rects: any = []
      status_rects.forEach((sr: any) => {
        if (!patients_width_status_rects.includes(sr.patient_id)) {
          patients_width_status_rects.push(sr.patient_id)
        }
      })
      if (patients_width_status_rects.length < patientList.length) {
        patientList.forEach((pID: any) => {
          if (!patients_width_status_rects.includes(pID)) {
            status_rects.push(unknown_rects[pID])
          }
        })
      }

      callback({
        // data: ["linelist vis data", input_data],
        timestamp: new Date().getTime(),
        min_ts,
        max_ts,
        patientList,
        movement_rects,
        movement_dots,
        investigation_rects,
        status_rects,
        // unknown_rects,
        allStations,
        return_log: error_log.clearAndReturnLog(),
      })

      // return {
      //   // data: ["linelist vis data", input_data],
      //   timestamp: new Date().getTime(),
      //   min_ts,
      //   max_ts,
      //   P,
      //   movement_rects,
      //   movement_dots,
      //   investigation_rects,
      //   status_rects,
      // }
    },
  },
  linelist_neu: {
    needed_raw_data: ["Patient_Bewegung_Ps"],
    needed_parsed_data: ["generate_mibi_investigations"],
    call_function: (input_data: any, parameters: any, callback: Function) => {
      callback({
        data: ["fictive linelist data"],
      })
      // return {
      //   data: ["fictive linelist data"],
      // }
    },
  },
  storyline: {
    needed_raw_data: ["Patient_Bewegung_Ps", "Patient_Labordaten_Ps"],
    needed_parsed_data: [
      // "generate_mibi_investigations",
      // "generate_contact_graph",
      "generate_storyline_data",
    ],
    call_function: (input_data: any, parameters: any, callback: Function) => {
      let error_log = new Error_Log()

      let {
        Patient_Bewegung_Ps,
        Patient_Labordaten_Ps,
        generate_storyline_data,
      } = input_data

      // TODO: nur portierung; keine Auslagerung in eigene helper-data-parser bisher

      // console.log(`

      // Storyline parser

      // `)

      let microData: any = []
      let movementData: any = []

      let min_ts: any = undefined
      let max_ts: any = undefined
      let patientList: any = []
      let allStations: any = []

      if (Patient_Bewegung_Ps.error === undefined) {
        if (Patient_Labordaten_Ps.error === undefined) {
          if (generate_storyline_data.error === undefined) {
            min_ts = generate_storyline_data.data.min_ts
            max_ts = generate_storyline_data.data.max_ts
            patientList = generate_storyline_data.data.patient_list
            allStations = generate_storyline_data.data.station_list

            microData = Patient_Labordaten_Ps.data
            movementData = Patient_Bewegung_Ps.data

            // let simulation = d3
            //   .forceSimulation()
            //   .force(
            //     "link",
            //     d3.forceLink().id((d: any) => d.id)
            //   )
            //   .force(
            //     "link",
            //     d3
            //       .forceLink()
            //       .id((d: any) => d.id)
            //       .distance(0)
            //       .strength(0.1)
            //       .iterations(10)
            //   )
            //   .force(
            //     "collide",
            //     d3
            //       .forceCollide()
            //       .strength(1)
            //       .radius(
            //         (d: any) => path_width * d.lop.length + 2 * path_width
            //       )
            //       .iterations(1)
            //   )
            //   .force("charge", d3.forceManyBody().strength(-1))

            // let sankeyLeft = (node: any) => node.depth

            // let layout_function = sankeyLeft // sankeyJustify
            // let n = patientList.length
            // let node_padding = 1000 - n * (n - 1)
            // TODO: rewritten, weil so besser?
            // let node_padding = n * 200

            // let link_data = generate_storyline_data.data.graph_data.links
            // let node_data = generate_storyline_data.data.graph_data.nodes
            // let max_cluster_count_per_timestep =
            //   generate_storyline_data.data.graph_data
            //     .max_cluster_count_per_timestep

            // let timesteps_count = node_data[node_data.length - 1].timestep + 1

            // let calc_node_padding = 1000
            // let calc_width = timesteps_count * calc_node_padding
            // let calc_height =
            //   n * 4 * path_width +
            //   max_cluster_count_per_timestep * 2 * path_width

            // let storyline: any = (NL: any) => {
            //   // TODO abchecken obs geht
            //   const san: any = sankey()
            //   san.nodeWidth(1)
            //   san.nodePadding(node_padding)
            //   san.extent([
            //     [0, 0],
            //     [calc_width, calc_height],
            //   ])
            //   san.nodeAlign(layout_function)
            //   san.iterations(100)
            //   console.log(`

            //   sankey

            //   `)
            //   console.log(san)
            //   let ret = san(NL)
            //   return ret
            // }

            // console.log("STORYLINE 5")

            // let all_timestamps =
            //   generate_storyline_data.data.graph_data.allTimestamps

            // console.log("[STORYLINE] - storyline sankey layout begin")
            // let { nodes, links } = storyline.create_storyline(
            //   {
            //     links: link_data,
            //     nodes: node_data,
            //   },
            //   node_padding,
            //   calc_width,
            //   calc_height
            // )
            // console.log("[STORYLINE] - storyline sankey layout end")

            // nodes.forEach((n: any) => {
            //   n.x_0 = n.x0
            //   n.x_1 = n.x1
            //   n.y_0 = n.y0
            //   n.y_1 = n.y1
            // })
            // links.forEach((l: any) => {
            //   l.y_0 = l.y0
            //   l.y_1 = l.y1
            // })

            // /**
            //  * Nach dem Layouting jedem Knoten die "Reihenfolgennummer" geben + Initial-Position
            //  */
            // console.log("[STORYLINE] - give starting numbers begin")
            // for (let step = 0; step < timesteps_count; step++) {
            //   let stepNodes = nodes.filter(
            //     (n: any) =>
            //       n.timestep === step &&
            //       n.space !== "home" &&
            //       n.name !== "home" &&
            //       n.space !== "tmphome" &&
            //       n.name !== "tmphome"
            //   )
            //   stepNodes.sort(
            //     (a: any, b: any) => (a.y0 + a.y1) / 2 - (b.y0 + b.y1) / 2
            //   )
            //   stepNodes.forEach((sn: any, i: any) => {
            //     sn.initOrder = i + 1
            //     sn.initPos =
            //       (calc_height / (stepNodes.length + 1)) * sn.initOrder
            //   })
            // }
            // /**
            //  * Jeden Zeitstempel durchgehen, den obersten Node (kleinest y0)
            //  * finden und den Betrag von allen in diesem Zeitstempel abziehen
            //  */
            // console.log("[STORYLINE] - give starting numbers end")

            // links = links.filter((d: any) => !d.movementLink)
            // let storyline_data: any = {
            //   nodes,
            //   links,
            // }

            // Zeile 1022 Storyline.js

            // - - - - -

            // Wenn KEIN ERROR in vorherigen daten...
            // Hierher kommt dada pre processing dann

            // microData = Patient_Labordaten_Ps.data
            // movementData = Patient_Bewegung_Ps.data
            /*
            microData.forEach((md: any) => {
              // md.PatientID = md.PatientID
              // md.KeimID = md.KeimID
              // md.Eingangsdatum = md.Eingangsdatum
              md.Screening = 0
              md.Befund = md.Befund ? 1 : 0

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

            movementData.forEach((md: any) => {
              //   md.PatientID = md.PatientID
              //   md.Beginn = md.Beginn
              //   md.Ende = md.Ende
              //   md.StationID = md.StationID
              //   md.BewegungstypID = md.BewegungstypID

              if (!patientList.includes(md.PatientID)) {
                patientList.push(md.PatientID)
              }
              if (!allStations.includes(md.Station)) {
                allStations.push(md.Station)
              }

              if (!patientList.includes(md.PatientID)) {
                patientList.push(md.PatientID)
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
            */
          } else {
            error_log.addError(
              "generate_storyline_data",
              parameters,
              parsed_error_prio,
              generate_storyline_data.error
            )
          }
        } else {
          error_log.addError(
            "Patient_Labordaten_Ps",
            parameters,
            raw_error_prio,
            Patient_Labordaten_Ps.error
          )
        }
      } else {
        error_log.addError(
          "Patient_Bewegung_Ps",
          parameters,
          raw_error_prio,
          Patient_Bewegung_Ps.error
        )
      }

      // let return_log: errorDataType[] = error_log.getErrorLog()

      callback({
        timestamp: new Date().getTime(),
        generate_storyline_data,
        min_ts,
        max_ts,
        patientList,
        allStations,
        // data: ["storyline vis data"],
        return_log: error_log.clearAndReturnLog(),
        microData,
        movementData,
        // lop,
        // allStations: stations,
      })
      // return {
      //   data: ["storyline vis data"],
      // }
    },
  },
  epicurve: {
    needed_raw_data: ["Labor_ErregerProTag_TTEsKSs"],
    needed_parsed_data: [],
    call_function: (input_data: any, parameters: any, callback: Function) => {
      callback({
        data: ["epicurve data"],
      })
      // return {
      //   data: ["epicurve data"],
      // }
    },
  },
}

export default module_parser
