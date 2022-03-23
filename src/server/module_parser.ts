/**
 * All algorithms to generate the visualizations for the modules
 *
 * Name des Moduls
 * welche raw-data benoetigt werden
 * welche parsed-data benoetigt werden
 * die parse-funktion selbst implementieren; default (z.B: on Error etc)
 * ein leeres Array ([]) zurueck geben
 */

import { raw } from "mysql"
import * as d3 from "d3"
import * as d3_sankey from "d3-sankey"
import { get_worse_carrier_status } from "./utilities/carrier_status"
import parse_sl_data from "./utilities/storylineParser"
import { createError, errorDataType, Error_Log } from "./error_log"
import * as cli_color from "cli-color"

const raw_error_prio: number = 1.7
const parsed_error_prio: number = 2.7

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

      let error_log = new Error_Log()
      let Metadaten: any = {
        error: true,
      }

      let patientList: any[] = []
      let globalStartTS = new Date().getTime()
      let globalEndTS = new Date().getTime() - Number.MAX_VALUE

      let check_min_max_dates = (datum: any) => {
        globalStartTS = datum < globalStartTS ? datum : globalStartTS
        globalEndTS = datum > globalEndTS ? datum : globalEndTS
      }

      // TODO: Wie muss ereignisTriangles und ereignisCircles generiert werden ?
      let ereignisTriangles: object[] = []
      let ereignisCircles: object[] = []

      // #region globalTimeStamps , patientList & nosokomiale Patienten
      if (generate_mibi_investigations.error === undefined) {
        if (generate_mibi_investigations.data.first_timestamp < globalStartTS) {
          globalStartTS = new Date(
            generate_mibi_investigations.data.first_timestamp
          ).getTime()
        }

        if (generate_mibi_investigations.data.last_timestamp > globalEndTS) {
          globalEndTS = new Date(
            generate_mibi_investigations.data.last_timestamp
          ).getTime()
        }
      } else {
        error_log.addError(
          createError(
            "generate_mibi_investigations",
            parameters,
            parsed_error_prio,
            generate_mibi_investigations.error
          )
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

          if (beginn < globalStartTS) {
            globalStartTS = beginn
          }

          if (ende > globalEndTS) {
            globalEndTS = ende
          }
        })
      } else {
        error_log.addError(
          createError(
            "Patient_Bewegung_Ps",
            parameters,
            raw_error_prio,
            Patient_Bewegung_Ps.error
          )
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
          createError(
            "Patient_Labordaten_Ps",
            parameters,
            raw_error_prio,
            Patient_Labordaten_Ps.error
          )
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

          if (impfDatum < globalStartTS) {
            globalStartTS = impfDatum
          }

          if (impfDatum > globalEndTS) {
            globalEndTS = impfDatum
          }
        })
      } else {
        error_log.addError(
          createError(
            "Patient_Vaccination",
            parameters,
            raw_error_prio,
            Patient_Vaccination.error
          )
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

          if (first_date < globalStartTS) {
            globalStartTS = first_date
          }

          if (last_date > globalEndTS) {
            globalEndTS = last_date
          }
        })
      } else {
        error_log.addError(
          createError(
            "Patient_Symptom",
            parameters,
            raw_error_prio,
            Patient_Symptom.error
          )
        )
      }

      // if (Metadaten.error === undefined) {
      //   Metadaten.data.forEach((element: any) => {
      //     let pID = element.PatientID
      //     let proben_date = new Date(
      //       element.Zeitpunkt_der_Probenentnahme
      //     ).getTime()
      //     let aufnahme_date = new Date(element.Aufnahme_Datum).getTime()
      //     let entlastung_date = new Date(element.Entlastung_Datum).getTime()

      //     if (!patientList.includes(pID)) {
      //       patientList.push(pID)
      //     }

      //     if (proben_date < globalStartTS) {
      //       globalStartTS = proben_date
      //     }

      //     if (proben_date > globalEndTS) {
      //       globalEndTS = proben_date
      //     }

      //     if (aufnahme_date < globalStartTS) {
      //       globalStartTS = aufnahme_date
      //     }

      //     if (aufnahme_date > globalEndTS) {
      //       globalEndTS = aufnahme_date
      //     }

      //     if (entlastung_date < globalStartTS) {
      //       globalStartTS = entlastung_date
      //     }

      //     if (entlastung_date > globalEndTS) {
      //       globalEndTS = entlastung_date
      //     }
      //   })
      // } else {
      //   error_log.addError(
      //     createError("Metadaten", parameters, raw_error_prio, Metadaten.error)
      //   )
      // }
      //#endregion

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
            check_min_max_dates(new Date(vd.Befunddatum).getTime())

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
          createError(
            "Patient_Labordaten_Ps",
            parameters,
            raw_error_prio,
            Patient_Labordaten_Ps.error
          )
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
            station_id: mov.StationID,
            /* wann soll "ICR" gesetzt werden?
             * ist es sinnvoll alles was nicht Covid / Intensiv / ICR ist als NormalStation zu deklarieren?
             * default für stationsArt: NormalStation
             */
            stationsArt: stationsArten[1],
          }

          // ! Bei Verlegung auf Covid- od. Intensivstation wird erreignisTriangle gesetzt
          if (mov.StationID === "Coronastation") {
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
          check_min_max_dates(stationsStruct.aufenthaltsBegin)
          check_min_max_dates(stationsStruct.aufenthaltsEnde)

          stationenRects.push(stationsStruct)
        })
      } else {
        error_log.addError(
          createError(
            "Patient_Bewegung_Ps",
            parameters,
            raw_error_prio,
            Patient_Bewegung_Ps.error
          )
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
          createError(
            "Patient_Vaccination",
            parameters,
            raw_error_prio,
            Patient_Vaccination.error
          )
        )
      }
      // #endregion

      // #region Metadaten
      let metaTextInfos: object[] = []

      // if (Metadaten.error === undefined) {
      //   Metadaten.data.forEach((meta_data: any) => {
      //     let metaInfoStruct = {
      //       patientID: meta_data.PatientID,
      //       infektionsSituation: meta_data.Infektion,
      //       aufnahme_datum: new Date(meta_data.Aufnahme_Datum).getTime(),
      //       entlass_datum: new Date(meta_data.Entlastung_Datum).getTime(),
      //       impfstoff: new String(),
      //       anzahl_impfungen: Number,
      //     }

      //     impfDaten.forEach((data: any) => {
      //       if (meta_data.PatientID === data.patientID) {
      //         metaInfoStruct.impfstoff = data.medikament
      //         metaInfoStruct.anzahl_impfungen = data.anzahl_impfungen
      //       }
      //     })

      //     metaTextInfos.push(metaInfoStruct)
      //   })
      // } else {
      //   error_log.addError(
      //     createError("Metadaten", parameters, raw_error_prio, Metadaten.error)
      //   )
      // }
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

          check_min_max_dates(symptomStruct.symptomBeginn)
          check_min_max_dates(symptomStruct.symptomEnde)

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
          createError(
            "Patient_Symptom",
            parameters,
            raw_error_prio,
            Patient_Symptom.error
          )
        )
      }
      //#endregion Symptomdaten

      // console.log("--- End of module_parser[annotation_timeline] ---\n")

      let return_log: errorDataType[] = error_log.getErrorLog()

      // console.log(cli_color.green(patientList.length))
      callback({
        virusLastRects,
        stationenRects,
        ereignisTriangles,
        ereignisCircles,
        //annotationsTriangles,
        globalStartTS,
        globalEndTS,
        metaTextInfos,
        impfDaten,
        vacc_injection_data,
        symptomDaten,
        ...generate_movement_rects.data,
        patientList,
        return_log,
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

      let error_log = new Error_Log()

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
                createError(
                  "rki_data_by_day",
                  parameters,
                  parsed_error_prio,
                  OutbreakDetectionResultSet.error
                )
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
          createError(
            "Labor_ErregerProTag_TTEsKSs",
            parameters,
            raw_error_prio,
            Labor_ErregerProTag_TTEsKSs.error
          )
        )
      }
      let return_log: errorDataType[] = error_log.getErrorLog()
      callback({
        timestamp: new Date().getTime(),
        // data: { dayDataSets, weekDataSets, monthDataSets },
        data: dayDataSets,
        timespan,
        initial_timelense_timestamps,
        stationIDs,
        pathogenIDs,
        // rki_data_by_day,
        return_log,
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

      let error_log = new Error_Log()

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
          createError(
            "Patient_Bewegung_Ps",
            parameters,
            raw_error_prio,
            Patient_Bewegung_Ps.error
          )
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
          createError(
            "generate_mibi_investigations",
            parameters,
            parsed_error_prio,
            generate_mibi_investigations.error
          )
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

      let return_log: errorDataType[] = error_log.getErrorLog()
      callback({
        // data: ["linelist vis data", input_data],
        timestamp: new Date().getTime(),
        ts_start,
        ts_end,
        patientList,
        movement_rects,
        movement_dots,
        investigation_rects,
        return_log,
      })
    },
  },
  kontaktnetzwerk: {
    // needed_raw_data: ["Patient_Bewegung_Ps", "Patient_Labordaten_Ps"],
    // needed_parsed_data: ["generate_mibi_investigations"],
    needed_raw_data: ["Contact_NthDegree_TTKP_Degree"],
    needed_parsed_data: ["generate_mibi_investigations_TEMP"],
    call_function: (input_data: any, parameters: any, callback: Function) => {
      let error_log = new Error_Log()

      let { patientList } = parameters

      // let {
      //   Patient_Bewegung_Ps,
      //   Patient_Labordaten_Ps,
      //   generate_mibi_investigations,
      // } = input_data
      // TODO: SMICS-0.8
      let { Contact_NthDegree_TTKP_Degree, generate_mibi_investigations_TEMP } =
        input_data

      let generate_mibi_investigations = generate_mibi_investigations_TEMP

      let Patient_Bewegung_Ps = {
        error: undefined,
        data: [],
      }

      let Patient_Labordaten_Ps = {
        error: undefined,
        data: [],
      }

      if (Contact_NthDegree_TTKP_Degree.error === undefined) {
        let { Patienten_Bewegungen, Labordaten } =
          Contact_NthDegree_TTKP_Degree.data

        Patient_Bewegung_Ps.data = Patienten_Bewegungen
        Patient_Labordaten_Ps.data = Labordaten
      } else {
        error_log.addError(
          createError(
            "Contact_NthDegree_TTKP_Degree",
            parameters,
            raw_error_prio,
            Contact_NthDegree_TTKP_Degree.error
          )
        )
      }
      // TODO: Wenn error in Contact_NthDegree_TTKP_Degree wird hier abgebrochen --> Error abfangen und berechnen was geht

      // console.log("####################")
      // console.log(Patient_Bewegung_Ps)
      // let {
      //   Patient_Bewegung_Ps,
      //   Patient_Labordaten_Ps,
      //   generate_mibi_investigations,
      // } = input_data
      /**
       * Vis-Structures for contact network:
       * - edges + attributes and tooltip data
       * - nodes + attributes and tooltip data
       * - POSITIONS of nodes (force directed layouting + saving the positoions)
       * !- BACKWARD and FORWARD TRACING somehow
       *
       * ? calculate max x and y dimensions for front end to scale properly
       */

      // example data to implement visualization
      // data parsing etc. afterwards

      // let nodes: any[] = []
      // let links: any[] = []

      let graph_data: any[] = []

      let location_properties: any[] = [
        { name: "station", propname: "StationID" },
        { name: "room", propname: "Raum" },
      ]

      let pathogens_with_name: any[] = []

      /**
       * Temporär, unabhängig von Keim etc.
       * Einfach nur die Struktur (abhängig von Bewegungen)
       * KEIN backward tracing etc.
       *
       * Nodes & Links
       *
       * TODO: als data_parser function auslagern
       */
      if (
        true &&
        Patient_Bewegung_Ps.error === undefined &&
        Patient_Labordaten_Ps.error === undefined &&
        generate_mibi_investigations.error === undefined
      ) {
        // for (let location_id = 0; location_id < 2; location_id++) {
        location_properties.forEach((loc_prop: any, loc_prop_index: number) => {
          // })

          let nodes: any[] = []
          let links: any[] = []

          let { status_changes } = generate_mibi_investigations.data

          // TODO: SMICS-0.8
          // Patientenliste wegen Nth-Degree rauslesen
          let new_patient_list: any[] = []
          Patient_Bewegung_Ps.data.forEach((mov: any) => {
            if (mov.StationID === undefined) {
              if (mov.Station === undefined) {
                mov.StationID = mov.Fachabteilung
              } else {
                mov.StationID = mov.Station
              }
            }

            if (!new_patient_list.includes(mov.PatientID)) {
              new_patient_list.push(mov.PatientID)
            }
            if (status_changes[mov.PatientID] === undefined) {
              status_changes[mov.PatientID] = {}
            }
          })
          patientList = new_patient_list

          // nodes erzeugen; jeder node speichert zu jedem Keim den letzten/schlimmsten Infektionsstatus
          patientList.forEach((patient_id: any) => {
            let all_pathogen_status: any = {}
            // console.log("GET OWN PROPERTY NAMES")
            // console.log(status_changes, patient_id)
            let all_tested_pathogens = Object.getOwnPropertyNames(
              status_changes[patient_id]
            )

            let all_movements: any[] = []

            all_movements = Patient_Bewegung_Ps.data.filter(
              (movement: any) => movement.PatientID === patient_id
            )

            all_tested_pathogens.forEach((pathogen_id: any) => {
              let status: any = "unknown"
              // TODO: SMICS-0.8
              status = "negative"

              let status_timestamp = undefined
              let pathogen_status_changes_of_patient: any[] =
                status_changes[patient_id][pathogen_id]

              pathogen_status_changes_of_patient.forEach(
                (status_change: any) => {
                  let { new_status, timestamp } = status_change
                  let worse_status: any = get_worse_carrier_status(
                    status,
                    new_status
                  )

                  // TODO: hier wird der letzte schlechteste Status gesucht
                  // TODO: nicht der letzte!
                  if (worse_status !== status) {
                    status = worse_status
                    status_timestamp = timestamp
                  }
                }
              )

              all_pathogen_status[pathogen_id] = {
                status,
                status_timestamp,
              }
            })
            nodes.push({
              id: patient_id,
              patient_id,
              all_pathogen_status,
              all_movements,
            })
          })

          // links erzeugen (= Kontaktzeiten etc.)

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
            (movement: any) => movement.BewegungstypID !== 4
          )

          movements.forEach((movement: any) => {
            movement.timestamp = new Date(movement.Beginn).getTime()
          })

          movements.sort((a: any, b: any) => a.timestamp - b.timestamp)

          let buckets: any = {
            home: [],
            tmp_home: [],
          }
          let current_contacts: any = {}

          // just helper object
          let patient_is_on_station: any = {}

          patientList.forEach((patient_id: any) => {
            buckets.home.push(patient_id)
            patient_is_on_station[patient_id] = "home"

            current_contacts[patient_id] = []
          })

          /**
           * find last movement for every patient (save index)
           */
          let last_movement_index: any = {}
          movements.forEach((movement: any, i: number) => {
            last_movement_index[movement.PatientID] = i
          })

          /**
           * Wenn
           * BewegungsID === 4 -> skip
           * BewegungsID === 6 oder 2-> leave klinik
           * BewegungsID === 3 oder 7 -> Zimmerwechsel/ Abw-Ende
           *
           * 1: "Aufnahme"
           * 2: "Entlassung"
           * 3: "Wechsel"
           * 4: "ambulanter Besuch"
           * 6: "Abwesenheit-Beginn"
           * 7: "Abwesenheit-Ende"
           *
           * else ist das StationsWechsel? oder bleibt StationsID gleich?
           * Wenn ja, dann ausführen, ansonsten skip
           *
           */
          movements.forEach((movement: any, i: number) => {
            let { BewegungstypID, PatientID, timestamp, StationID } = movement

            StationID = movement[loc_prop.propname]

            let new_station = StationID

            if (last_movement_index[PatientID] === i) {
              // falls es sich um letzte Bewegung des Patienten handelt
              new_station = "home"
            } else if (BewegungstypID === 2 || BewegungstypID === 6) {
              new_station = "tmp_home"
            }

            // falls new_station !== old_station (ansonsten laufen kontakte weiter/nichts passiert)
            let old_station: any = patient_is_on_station[PatientID]
            if (old_station !== new_station) {
              /**
               * 1 Patient aus altem Bucket entfernen
               * 2 falls old_station !== home und !== tmp_home
               *    - aktuell laufende Kontakte des Patienten beenden
               *    - und diese (nicht redundant) aufs Array für links pushen
               * 3 Patient in neuen Bucket schieben
               * 4 falls new_station !== home und !== tmp_home
               *    - neue Kontakte des Patienten anfangen
               */

              // 1 Patient aus altem Bucket entfernen
              let patients_on_old_station: any[] = buckets[old_station].filter(
                (pat_id: any) => pat_id !== PatientID
              )
              if (
                patients_on_old_station.length <= 0 &&
                old_station !== "home" &&
                old_station !== "tmp_home"
              ) {
                delete buckets[old_station]
              } else {
                buckets[old_station] = patients_on_old_station
              }

              // 2 falls old_station !== home und !== tmp_home
              // - aktuell laufende Kontakte des Patienten beenden
              // - und diese (nicht redundant) aufs Array für links pushen
              /**
               * contact-data-structure
               * {
               *    patient_a,
               *    patient_b,
               *    station_id,
               *    begin (ts),
               *    end (undefined)
               * }
               */
              // if (PatientID == 175082) {
              //   console.log(PatientID)
              //   console.log(old_station, new_station)
              //   console.log(current_contacts[PatientID])
              //   console.log(" ")
              // }
              if (old_station !== "home" && old_station !== "tmp_home") {
                let old_contact_patients: any[] = patients_on_old_station
                // terminate running contacts
                // and save them in their link
                // and create the link if there is none
                current_contacts[PatientID].forEach((contact: any) => {
                  let copy_contact: any = JSON.parse(JSON.stringify(contact))
                  copy_contact.end = timestamp

                  let { patient_a, patient_b } = copy_contact

                  // is there a link for pA and pB ?
                  // --> create if not
                  // save contact into that link
                  let index = links.findIndex((l: any) => {
                    return (
                      (l.patient_a === patient_a &&
                        l.patient_b === patient_b) ||
                      (l.patient_a === patient_b && l.patient_b === patient_a)
                    )
                  })

                  if (index === -1) {
                    // es gibt noch keinen link
                    // --> link erzeugen
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

                // terminate/delete running contacts on other patients
                old_contact_patients.forEach((old_contact_patient_id: any) => {
                  current_contacts[old_contact_patient_id] = current_contacts[
                    old_contact_patient_id
                  ].filter((cont: any) => cont.patient_b !== PatientID)
                })
              }

              // 3 Patient in neuen Bucket schieben
              if (buckets[new_station] === undefined) {
                buckets[new_station] = []
              }
              buckets[new_station].push(PatientID)
              patient_is_on_station[PatientID] = new_station

              // 4 falls new_station !== home und !== tmp_home
              // - neue Kontakte des Patienten anfangen
              if (new_station !== "home" && new_station !== "tmp_home") {
                let new_contact_patients: any[] = buckets[new_station].filter(
                  (pid: any) => pid !== PatientID
                )
                new_contact_patients.forEach((pat_id: any) => {
                  current_contacts[PatientID].push({
                    patient_a: PatientID,
                    patient_b: pat_id,
                    station_id: new_station,
                    begin: timestamp,
                    end: undefined,
                  })

                  current_contacts[pat_id].push({
                    patient_a: pat_id,
                    patient_b: PatientID,
                    station_id: new_station,
                    begin: timestamp,
                    end: undefined,
                  })
                })
                // console.log("nochmal current_contacts")
                // console.log(current_contacts)
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
          // .on("tick", () => {
          // console.log("tick counter:", ++tick_counter)
          // })

          // let sim_done = false
          setTimeout(() => {
            simulation.stop()
            // sim_done = true
            // console.log("SIMULATION DONE")

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

            graph_data.push({
              name: loc_prop.name,
              propname: loc_prop.propname,
              nodes,
              links,
              min_x,
              max_x,
              min_y,
              max_y,
              vis_offset_x,
              vis_offset_y,
            })

            if (loc_prop_index === location_properties.length - 1) {
              let return_log: errorDataType[] = error_log.getErrorLog()
              callback({
                timestamp: new Date().getTime(),
                patientList,
                graph_data,
                pathogens_with_name,
                return_log,
              })
            }
          }, 1000)
        })
      } else {
        error_log.addError(
          createError(
            "Patient_Bewegung_Ps",
            parameters,
            raw_error_prio,
            Patient_Bewegung_Ps.error
          )
        )
        error_log.addError(
          createError(
            "Patient_Labordaten_Ps",
            parameters,
            raw_error_prio,
            Patient_Labordaten_Ps.error
          )
        )
        error_log.addError(
          createError(
            "generate_mibi_investigations",
            parameters,
            parsed_error_prio,
            generate_mibi_investigations.error
          )
        )
      }
      if (!error_log.empty()) {
        let return_log: errorDataType[] = error_log.getErrorLog()
        callback({
          timestamp: new Date().getTime(),
          patientList,
          graph_data,
          pathogens_with_name,
          return_log,
        })
      }
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

      let error_log = new Error_Log()

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
      //     createError(
      //       "Patient_Bewegung_Ps",
      //       parameters,
      //       raw_error_prio,
      //       Patient_Bewegung_Ps.error
      //     )
      //   )
      // }

      let {
        first_movement,
        last_movement,
        patientList,
        movement_rects,
        movement_dots,
        allStations,
        unknown_rects,
      } = generate_movement_rects.data

      let ts_start = Number.MAX_VALUE
      let ts_end = 0

      let investigation_rects: object[] = []
      let status_rects: any[] = []

      if (ts_start > first_movement) {
        ts_start = first_movement
      }
      if (ts_end < last_movement) {
        ts_end = last_movement
      }

      if (generate_mibi_investigations.error === undefined) {
        // generate visualization for investigation data (vertical rectangles)
        // only if there is no error in the data
        let {
          first_timestamp,
          last_timestamp,
          investigations,
          status_changes,
        } = generate_mibi_investigations.data

        if (ts_start > first_timestamp) {
          ts_start = first_timestamp
        }
        if (ts_end < last_timestamp) {
          ts_end = last_timestamp
        }

        investigation_rects = investigations

        if (Patient_Bewegung_Ps.error === undefined) {
          /**
           * generate status rects
           *
           * for every patient_id AND pathogen_id
           * - begin_first_movement_ts
           * - end_last_movement_ts
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
                  if (stat_change.timestamp <= first_movement) {
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
                  if (
                    stat_change_ts > first_movement &&
                    stat_change_ts < last_movement
                  ) {
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
          createError(
            "generate_mibi_investigations",
            parameters,
            parsed_error_prio,
            generate_mibi_investigations.error
          )
        )
      }
      let return_log: errorDataType[] = error_log.getErrorLog()

      callback({
        // data: ["linelist vis data", input_data],
        timestamp: new Date().getTime(),
        ts_start,
        ts_end,
        patientList,
        movement_rects,
        movement_dots,
        investigation_rects,
        status_rects,
        unknown_rects,
        allStations,
        return_log,
      })

      // return {
      //   // data: ["linelist vis data", input_data],
      //   timestamp: new Date().getTime(),
      //   ts_start,
      //   ts_end,
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
    ],
    call_function: (input_data: any, parameters: any, callback: Function) => {
      let error_log = new Error_Log()

      let { Patient_Bewegung_Ps, Patient_Labordaten_Ps } = input_data

      // TODO: nur portierung; keine Auslagerung in eigene helper-data-parser bisher

      console.log(`
      
      
      
      
      
      
      
      Storyline parser
      
      
      
      
      
      `)

      let microData = []
      let movementData = [
        {
          PatientID: "Anita",
          Beginn: "2022.01.01",
          Ende: "2022.01.10",
          StationID: "Notfallstation",
          BewegungstypID: 1,
        },
        {
          PatientID: "Anita",
          Beginn: "2022.01.10",
          Ende: "2022.01.20",
          StationID: "Coronastation",
          BewegungstypID: 3,
        },
        {
          PatientID: "Anita",
          Beginn: "2022.01.20",
          Ende: "2022.02.10",
          StationID: "Chirurgie",
          BewegungstypID: 3,
        },
        {
          PatientID: "Anita",
          Beginn: "2022.01.01",
          Ende: "2022.01.10",
          StationID: "Chirurgie",
          BewegungstypID: 2,
        },
        {
          PatientID: "Bernd",
          Beginn: "2022.01.05",
          Ende: "2022.01.08",
          StationID: "Notfallstation",
          BewegungstypID: 1,
        },
        {
          PatientID: "Bernd",
          Beginn: "2022.01.08",
          Ende: "2022.01.15",
          StationID: "Chirurgie",
          BewegungstypID: 3,
        },
        {
          PatientID: "Bernd",
          Beginn: "2022.01.15",
          Ende: "2022.02.22",
          StationID: "Coronastation",
          BewegungstypID: 3,
        },
        {
          PatientID: "Bernd",
          Beginn: "2022.01.22",
          Ende: "2022.01.25",
          StationID: "Coronastation",
          BewegungstypID: 2,
        },

        {
          PatientID: "Caro",
          Beginn: "2022.01.13",
          Ende: "2022.01.16",
          StationID: "Coronastation",
          BewegungstypID: 1,
        },
        {
          PatientID: "Caro",
          Beginn: "2022.01.16",
          Ende: "2022.01.19",
          StationID: "Chirurgie",
          BewegungstypID: 3,
        },
        {
          PatientID: "Caro",
          Beginn: "2022.01.19",
          Ende: "2022.02.24",
          StationID: "Coronastation",
          BewegungstypID: 3,
        },
        {
          PatientID: "Caro",
          Beginn: "2022.01.24",
          Ende: "2022.01.29",
          StationID: "Coronastation",
          BewegungstypID: 2,
        },
      ]
      let lop: any = []
      let stations: any = []

      if (
        Patient_Bewegung_Ps.error === undefined &&
        Patient_Labordaten_Ps.error === undefined
      ) {
        // Wenn KEIN ERROR in vorherigen daten...
        // Hierher kommt dada pre processing dann

        microData = Patient_Labordaten_Ps.data
        movementData = Patient_Bewegung_Ps.data

        microData.forEach((md: any) => {
          // md.PatientID = md.PatientID
          // md.KeimID = md.KeimID
          // md.Eingangsdatum = md.Eingangsdatum
          md.Screening = 0
          md.Befund = md.Befund ? 1 : 0
          if (!lop.includes(md.PatientID)) {
            lop.push(md.PatientID)
          }
        })

        movementData.forEach((md: any) => {
          //   md.PatientID = md.PatientID
          //   md.Beginn = md.Beginn
          //   md.Ende = md.Ende
          //   md.StationID = md.StationID
          //   md.BewegungstypID = md.BewegungstypID

          if (md.StationID === undefined) {
            if (md.Station === undefined) {
              md.StationID = md.Fachabteilung
            } else {
              md.StationID = md.Station
            }
          }

          if (!lop.includes(md.PatientID)) {
            lop.push(md.PatientID)
          }
          if (!stations.includes(md.StationID)) {
            stations.push(md.StationID)
          }
        })
      } else {
        error_log.addError(
          createError(
            "Patient_Bewegung_PS und/oder Patient_Labordatenb_PS haben einen error",
            parameters,
            parsed_error_prio,
            {
              error:
                "Patient_Bewegung_PS und/oder Patient_Labordatenb_PS haben einen error",
            }.error
          )
        )
      }

      let return_log: errorDataType[] = error_log.getErrorLog()

      callback({
        data: ["storyline vis data"],
        return_log,
        microData,
        movementData,
        lop,
        allStations: stations,
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
  prediction_module_parser: {
    needed_raw_data: ["PredictionDummy"],
    needed_parsed_data: ["prediction_data_parser"],
    call_function: (input_data: any, parameters: any, callback: Function) => {
      let { PredictionDummy, prediction_data_parser } = input_data
      let return_log: errorDataType[] = []
      let data = {
        data1: PredictionDummy.data[0],
        data2: prediction_data_parser.data,
      }

      callback({
        data,
        return_log,
      })
    },
  },
}

export default module_parser
