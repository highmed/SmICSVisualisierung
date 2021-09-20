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

// TODO: ERROR-Message(s) mit zurueck geben...
const module_parser: { [key: string]: any } = {
  annotationTimeline: {
    // AnnotatonTimeline
    needed_raw_data: [],
    needed_parsed_data: [],
    call_function: (input_data: any, parameters: any, callback: Function) => {
      // hier custom data einfuegen

      /**
       * Beginn des Strukturvorschlags für Kristina
       *
       */
      let Metadaten = [
        {
          firstDate: "2021-02-15T12:35:14.90Z",
          lastDate: "2021-02-15T12:35:14.90Z",
          patientID: "string",
          infektionsSituation: "string",
          aufnahmeArt: "string",
          klinikStatus: "string",
        },
      ]
      let Tests = [
        {
          patientID: "string",
          testArt: "string",
          testTimeStamp: "2021-02-15T12:35:14.90Z",
          resultTimeStamp: "2021-02-15T12:35:14.90Z",
          virusLast: "string",
          gueltigkeit: "string",
          labordatenID: "string",
          fallID: "string",
          probeID: "string",
          zeitpunktProbeneingang: "2021-02-15T12:35:14.90Z",
          materialID: "string",
          material_1: "string",
          befund: true,
          befundkommentar: "string",
          keimID: "string",
        },
      ]

      let Stationen = [
        {
          patientID: "string",
          stationsNr: "string",
          stationsArt: "string",
          aufenthaltsBegin: "2021-02-15T12:35:14.90Z",
          aufenthaltsEnde: "2021-02-15T12:35:14.90Z",
          raum: "string",
          bewegungstyp: "string",
          bewegungstypID: 0,
          fallID: "string",
          bewegungsart_1: "string",
          isoliert: "string",
        },
      ]

      let Symptome = [
        {
          patientID: "string",
          symptomBeginn: "2021-02-15T12:35:14.90Z",
          symptomKategorie: "string",
          negation: "string",
          befundID: "string",
          symptomName: "string",
          lokalisation: "string",
          schweregrad: "string",
          symptomEnde: "2021-02-15T12:35:14.90Z",
          diagnose: "string",
          unbekanntesSymptom: "string",
          aussageFehlendeInfo: "string",
        },
      ]

      let Impfstatus = [
        {
          patientID: "string",
          medikament: "string",
          impfStatus: "string",
          Dosierungsreihenfolge: "string",
          Dosiermenge: "string",
          "Impfung gegen": "string",
          Abwesenheit: "string",
        },
      ]

      let check_min_max_dates = (datum: any) => {
        globalStartTS = datum < globalStartTS ? datum : globalStartTS
        globalEndTS = datum > globalEndTS ? datum : globalEndTS
      }

      const TAGZEIT = 1000 * 60 * 60 * 24
      let covidDaten: object[] = []
      let globalStartTS = Number.MAX_VALUE
      let globalEndTS = Number.MIN_VALUE
      let patientIDs = [0, 1, 2]

      // Metadaten
      let patientId = 1001 // numerisch vierstellig
      let patientAlter = 87 // in Jahren
      let patientGeschlecht = "w" // m = männlich, w = weibich, d = divers, u = unbekannt
      let infektionsSituation = "nosokomial" // nosokomial oder non-nosokomial
      let aufnahmeArt = "Notaufnahme" // Notaufnahme, von anderer Klinik, Ankunft vor Infektion
      let klinikStatus = "entlassen" // anwesend, entlassen, verstorben

      // Für die Textausgabe auf dem Bildschirm, die MEtadaten in eine Strktur schreiben
      let metaInfos = [
        "PatientID: 0",
        "Impfstatus: none",
        "Infektionssituation: nosokomial",
        "Aufnahmeart: Notaufnahme",
        "Aufnahmedatum: 01.12.2020",
        "f",
        "g",
      ]
      let metaTextInfos: object[] = []
      for (let i = 0; i < 5; i++) {
        let metaInfoStruct: any = {
          metaInfo: metaInfos[i], // numerisch vierstellig
          index: i,
          //   patientAlter: patientAlter, // in Jahren
          //   patientGeschlecht: patientGeschlecht, // m = männlich, w = weibich, d = divers, u = unbekannt
          //   infektionsSituation: infektionsSituation, // nosokomial oder non-nosokomial
          //   aufnahmeArt: aufnahmeArt, // Notaufnahme, von anderer Klinik, Ankunft vor Infektion
          //   klinikStatus: klinikStatus // anwesend, entlassen, verstorben
        }
        metaTextInfos.push(metaInfoStruct)
      }

      // Testdaten in einer Struktur mit allen Tests ablegen
      let covidTestData: object[] = []
      let virusLastRects: object[] = []
      let ereignisTriangles: object[] = []
      let ereignisCircles: object[] = []

      let testArten: any = ["pcr", "antiGen"] // Art des Test -> pcr oder antiGen
      for (let i = 0; i < 10; i++) {
        // 10 Tests
        let testStruct: any = {
          testID: "id" + i + "_" + patientIDs[0],
          patientID: patientIDs[0],
          testArt: testArten[Math.round(Math.random())], // Die Testart random zuordnen
          testTimeStamp:
            new Date().getTime() -
            TAGZEIT * (Math.random() * 10 + (9 - i) * 10), // Die ersten Tests sind früher als die letzten
          resultTimeStamp: 0,
          virusLast: Math.round(Math.random() * 40), // Der CT Wert. Falls er über 30 ist, ist der Test negativ er sagt indirekt etwas über die Viruslast aus
          nextTestDate: 0,
        }
        testStruct.resultTimeStamp =
          testStruct.testTimeStamp + TAGZEIT * Math.random() * 3 // Das Resultat des Tests ist innerhalb von 3 Tagen da
        covidTestData.push(testStruct)
        check_min_max_dates(testStruct.testTimeStamp)
        check_min_max_dates(testStruct.resultTimeStamp)
        virusLastRects.push(testStruct)
        ereignisTriangles.push({
          patientID: patientIDs[0],
          ereignisTimeStamp: testStruct.testTimeStamp,
        })
      }

      // Testdaten Standardpatient
      let standardTestArten: any = [
        "antiGen",
        "pcr",
        "pcr",
        "pcr",
        "pcr",
        "pcr",
        "pcr",
        "pcr",
        "pcr",
        "pcr",
      ]
      let tage = [92, 80, 75, 55, 50, 40, 30, 25, 20, 15, 0]
      let standardTestergebnis = [35, 27, 20, 10, 10, 25, 27, 34, 38, 40, 40]
      for (let i = 0; i < 9; i++) {
        // 10 Tests
        let testStruct: any = {
          testID: "id" + i + "_" + patientIDs[1],
          patientID: patientIDs[1],
          testArt: standardTestArten[i],
          testTimeStamp: new Date().getTime() - TAGZEIT * tage[i],
          resultTimeStamp:
            new Date().getTime() -
            TAGZEIT * tage[i] +
            Math.random() * 3 * TAGZEIT,
          virusLast: standardTestergebnis[i], // Der CT Wert. Falls er über 30 ist, ist der Test negativ er sagt indirekt etwas über die Viruslast aus
          nextTestDate: new Date().getTime() - TAGZEIT * tage[i + 1],
        }
        testStruct.resultTimeStamp =
          testStruct.testTimeStamp + TAGZEIT * Math.random() * 3 // Das Resultat des Tests ist innerhalb von 3 Tagen da
        covidTestData.push(testStruct)
        check_min_max_dates(testStruct.testTimeStamp)
        check_min_max_dates(testStruct.resultTimeStamp)

        virusLastRects.push(testStruct)
        ereignisTriangles.push({
          patientID: patientIDs[1],
          ereignisTimeStamp: testStruct.testTimeStamp,
        })
      }

      // Stationen
      let stationenRects: object[] = []
      let stationsArten: any = [
        "CovidStation",
        "NormalStation",
        "ICR",
        "Intensivstation",
      ]
      let stationsNr: any = Math.round(Math.random() * 99)
      for (let i = 0; i < 5; i++) {
        let stationsStruct: any = {
          patientID: patientIDs[0],
          stationsArt:
            stationsArten[
              Math.round(Math.random() * (stationsArten.length - 1))
            ],
          aufenthaltsBegin:
            new Date().getTime() -
            TAGZEIT * (Math.random() * 20 + (8 - i * 2) * 10),
          aufenthaltsEnde: 0,
          stationsNr: stationsNr,
        }
        stationsStruct.aufenthaltsEnde =
          stationsStruct.aufenthaltsBegin + TAGZEIT * Math.random() * 10
        stationenRects.push(stationsStruct)
        check_min_max_dates(stationsStruct.aufenthaltsBegin)
        check_min_max_dates(stationsStruct.aufenthaltsEnde)
      }

      // Stationen Standardpatient
      let standardStationsArten: any = [
        "NormalStation",
        "CovidStation",
        "Intensivstation",
        "ICR",
        "NormalStation",
      ]
      tage = [100, 80, 75, 50, 30, 0]
      for (let i = 0; i < 5; i++) {
        let stationsStruct: any = {
          patientID: patientIDs[1],
          stationsArt: standardStationsArten[i],
          aufenthaltsBegin: new Date().getTime() - TAGZEIT * tage[i],
          aufenthaltsEnde: new Date().getTime() - TAGZEIT * tage[i + 1],
          stationsNr: stationsNr,
        }
        stationenRects.push(stationsStruct)
        check_min_max_dates(stationsStruct.aufenthaltsBegin)
        check_min_max_dates(stationsStruct.aufenthaltsEnde)
      }

      // Isolierzeitraeume
      let isolierZeitraeume: object[] = []
      for (let i = 0; i < 2; i++) {
        let isolierStruct: any = {
          patientID: patientIDs[0],
          isolierBeginn:
            new Date().getTime() -
            TAGZEIT * (Math.random() * 50 + (5 - i * 5) * 10),
          isolierEnde: 0,
        }
        isolierStruct.isolierEnde =
          isolierStruct.isolierBeginn + TAGZEIT * Math.random() * 25
        isolierZeitraeume.push(isolierStruct)
        check_min_max_dates(isolierStruct.isolierBeginn)
        check_min_max_dates(isolierStruct.isolierEnde)
      }
      // Isolierzeit Standardpatient
      for (let i = 0; i < 1; i++) {
        let isolierStruct: any = {
          patientID: patientIDs[1],
          isolierBeginn: new Date().getTime() - TAGZEIT * 80,
          isolierEnde: new Date().getTime() - TAGZEIT * 20,
        }
        isolierZeitraeume.push(isolierStruct)
        check_min_max_dates(isolierStruct.isolierBeginn)
        check_min_max_dates(isolierStruct.isolierEnde)
      }

      // Impfdaten
      let impfDaten: object[] = []
      let medikamente: any = ["none", "cureVac", "AstraZeneca", "BionTec"]
      let impfStatus: any = [
        "keine Immunitaet",
        "Teilimmunitaet",
        "volle Immunitaet",
        "unbekannt",
      ]
      let impfDatenStruct = {
        patientID: patientIDs[0],
        medikament:
          medikamente[Math.round(Math.random() * (medikamente.length - 1))],
        impfStatus:
          impfStatus[Math.round(Math.random() * (impfStatus.length - 1))],
      }
      impfDaten.push(impfDatenStruct)

      // Impfdaten Standardpatient
      impfDatenStruct = {
        patientID: patientIDs[1],
        medikament: medikamente[3],
        impfStatus: impfStatus[1],
      }
      impfDaten.push(impfDatenStruct)

      // Symptome
      let symptomDaten: object[] = []
      let symptomArten: any = [
        "Respiratorisch",
        "Gastroenterologisch",
        "Systemisch",
        "Neurologisch",
      ]
      for (let i = 0; i < 5; i++) {
        let symptomStruct = {
          patientID: patientIDs[0],
          symptomBeginn:
            new Date().getTime() -
            TAGZEIT * (Math.random() * 20 + (8 - i * 2) * 10),
          symptomEnde: 0,
          symptomArt:
            symptomArten[Math.round(Math.random() * (symptomArten.length - 1))],
          negation: Math.round(Math.random()),
        }
        symptomStruct.symptomEnde =
          symptomStruct.symptomBeginn + TAGZEIT * Math.random() * 10
        symptomDaten.push(symptomStruct)
        if (Math.random() > 0.5) {
          ereignisTriangles.push({
            patientID: patientIDs[0],
            ereignisTimeStamp: symptomStruct.symptomBeginn,
          })
        } else {
          ereignisCircles.push({
            patientID: patientIDs[0],
            ereignisTimeStamp: symptomStruct.symptomBeginn,
          })
        }
        check_min_max_dates(symptomStruct.symptomBeginn)
        check_min_max_dates(symptomStruct.symptomEnde)
      }

      // Symptome Standardpatient
      let standardSymptombeginn: any = [95, 70, 55, 30]
      let standardSymptomArten: any = [
        ["Respiratorisch", "Systemisch"],
        ["Gastroenterologisch", "Systemisch"],
        ["Neurologisch"],
      ]
      for (let i = 0; i < 3; i++) {
        let symptomStruct = {
          patientID: patientIDs[1],
          symptomBeginn:
            new Date().getTime() - TAGZEIT * standardSymptombeginn[i],
          symptomEnde:
            new Date().getTime() - TAGZEIT * standardSymptombeginn[i + 1],
          symptomArt: standardSymptomArten[i],
          negation: Math.round(Math.random()),
        }
        symptomDaten.push(symptomStruct)

        if (i !== 1) {
          ereignisTriangles.push({
            // Präzise ereignisse
            patientID: patientIDs[1],
            ereignisTimeStamp: symptomStruct.symptomBeginn,
          })
        } else {
          ereignisCircles.push({
            // Unscharfe Ereignisse
            patientID: patientIDs[1],
            ereignisTimeStamp: symptomStruct.symptomBeginn,
          })
        }

        check_min_max_dates(symptomStruct.symptomBeginn)
        check_min_max_dates(symptomStruct.symptomEnde)
      }

      // Annotationsdreiecke

      // Annotationsdaten in einer Annotationsstruktur ablegen
      let annotationsTriangles: object[] = []

      let annotationsArten: any = [
        "Dateninformationen",
        "Nutzerinformationen",
        "Ergebnisinformationen",
      ] // Art des Test -> pcr oder antiGen
      let annoCount = Math.round(Math.random() * 4)
      for (let i = 0; i < annoCount; i++) {
        // 4 Annotationen
        let annoStruct: any = {
          patientID: patientIDs[0],
          annotationsArt:
            annotationsArten[
              Math.round(Math.random() * annotationsArten.length - 1)
            ], // Die Testart random zuordnen
          timeLocation:
            new Date().getTime() -
            TAGZEIT *
              (i * (100 / annoCount) + Math.random() * (100 / annoCount)), // Die ersten Tests sind früher als die letzten
          timeStamp: new Date().getTime(),
        }
        annotationsTriangles.push(annoStruct)
        check_min_max_dates(annoStruct.timeLocation)
      }

      // Annotationsdaten Standardpatient
      let standardAnnoArten: any = [
        "Dateninformationen",
        "Nutzerinformationen",
        "Ergebnisinformationen",
      ]
      tage = [47, 35, 20]
      for (let i = 0; i < 3; i++) {
        // 3 Annotationen
        let annoStruct: any = {
          patientID: patientIDs[1],
          annotationsArt: annotationsArten[standardAnnoArten[i]], // Die Testart random zuordnen
          timeLocation: new Date().getTime() - TAGZEIT * tage[i],
          timeStamp: new Date().getTime(),
        }
        annotationsTriangles.push(annoStruct)
        check_min_max_dates(annoStruct.timeLocation)
      }

      // Gesamtkonstrukt
      covidDaten.push({
        // Metadaten
        //metaTextInfos: metaTextInfos,
        patientId: patientIDs[0], // numerischer Wert
        patientAlter: patientAlter, // in Jahren
        patientGeschlecht: patientGeschlecht, // m, w, d, u
        infektionsSituation: infektionsSituation, // nosokomial oder non nosokomial
        aufnahmeArt: aufnahmeArt, // Notaufnahme, von anderer Klinik, Einweisung vor Infektion
        klinikStatus: klinikStatus, // anwesend, entlassen, verstorben

        // Testdaten
        covidTestDaten: covidTestData, // Testdatenstruktur
        // Aufenthaltsorte
        stationenRects: stationenRects, // Stationsstruktur (Beginn und Ende des Aufenthalts Nr & Kategorie --> normalstation, covidstation, intensiv, icr oder mischstation)
        // Isolierung
        isolierZeitraeume: isolierZeitraeume, // Alle Zeiten, in den die Person isoliert war
        // Impfstatus
        //impfDaten: impfDaten, // Daten zur Impfung, Impfstatus, Impfdaten, Medikament
        // Symptome
        symptomDaten: symptomDaten, // Listen zu festgestellten Symptomen, Obergruppe, untergruppe, Datum
      })
      console.log(covidDaten)
      // Ende der Covid Daten

      callback({
        covidDaten,
        covidTestData,
        virusLastRects,
        stationenRects,
        ereignisTriangles,
        ereignisCircles,
        annotationsTriangles,
        globalStartTS,
        globalEndTS,
        metaTextInfos,
        impfDaten,
        symptomDaten,
      })
      // return {
      //   covidDaten,
      //   covidTestData,
      //   virusLastRects,
      //   stationenRects,
      //   ereignisTriangles,
      //   ereignisCircles,
      //   annotationsTriangles,
      //   globalStartTS,
      //   globalEndTS,
      //   metaTextInfos,
      // }
    },
  },
  epikurve: {
    needed_raw_data: ["Labor_ErregerProTag_TTEsKSs"],
    // needed_raw_data: ["Labor_ErregerProTag_TTEsKSs"],
    needed_parsed_data: ["rki_data_by_day"],
    // TODO: PRO ERREGER!!! aktuell alle Erreger in Reihe geschalten
    // TODO: die initial timestamps for timelense sind null...
    call_function: (input_data: any, parameters: any, callback: Function) => {
      let { Labor_ErregerProTag_TTEsKSs, rki_data_by_day } = input_data

      let { starttime, endtime, station, pathogenList } = parameters

      let initial_timelense_timestamps: number[] = []
      let newData: any[] = []
      let stationIDs: string[] = []
      let pathogenIDs: string[] = []
      let dayDataSets: any = {}

      if (Labor_ErregerProTag_TTEsKSs.error === undefined) {
        // Fuer jede Station und jeden Pathogen eine Kurve erzeugen
        // + Endemische Kurven jeweils
        // + für 7 Tage / 28 Tage akkumuliert

        let raw_data = Labor_ErregerProTag_TTEsKSs.data
        // console.log(Labor_ErregerProTag_TTEsKSs)
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
            if (rki_data_by_day.error === undefined) {
              let index = rki_data_by_day.data.findIndex(
                (rki_d: any) =>
                  rki_d.timestamp ===
                    new Date(d.Datum.split("T")[0]).getTime() &&
                  rki_d.StationID === d.StationID
                // && rki_d.pathogen === d.ErregerID
              )
              console.log(index)
              if (index >= 0) {
                console.log("geht rein")
                // d = {
                //   ...d,
                //   ...rki_data_by_day.data[index],
                // }
                d.rki_data = rki_data_by_day.data[index]
                console.log(d)
              }
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
            dayDataSets["K" + pathogen][
              stationID
            ].forEach((d: any, i: number) => {})
          })
        })
        /**
         * Initiale Anfangs- und Endzeit abspeichern
         */
        initial_timelense_timestamps = [
          raw_data[0].timestamp,
          raw_data[raw_data.length - 1].timestamp + 1000 * 60 * 60 * 24,
          // data[0][0].timestamp + 1000 * 60 * 60 * 24 * 60,
          // data[0][data[0].length - 1].timestamp + 1000 * 60 * 60 * 24 - 1000 * 60 * 60 * 24 * 60
        ]

        // let newData = [dayDataSets, weekDataSets, monthDataSets]
      }

      callback({
        timestamp: new Date().getTime(),
        // data: { dayDataSets, weekDataSets, monthDataSets },
        data: dayDataSets,
        initial_timelense_timestamps,
        stationIDs,
        pathogenIDs,
        rki_data_by_day,
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
      }

      // generate visualization for investigation data (vertical rectangles)
      // only if there is no error in the data
      if (generate_mibi_investigations.error === undefined) {
        let {
          first_timestamp,
          last_timestamp,
          investigations,
        } = generate_mibi_investigations.data

        if (ts_start > first_timestamp) {
          ts_start = first_timestamp
        }
        if (ts_end < last_timestamp) {
          ts_end = last_timestamp
        }

        investigation_rects = investigations
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
      })
    },
  },
  kontaktnetzwerk: {
    // needed_raw_data: ["Patient_Bewegung_Ps", "Patient_Labordaten_Ps"],
    // needed_parsed_data: ["generate_mibi_investigations"],
    needed_raw_data: ["Contact_NthDegree_TTKP_Degree"],
    needed_parsed_data: ["generate_mibi_investigations_TEMP"],
    call_function: (input_data: any, parameters: any, callback: Function) => {
      let { patientList } = parameters

      // let {
      //   Patient_Bewegung_Ps,
      //   Patient_Labordaten_Ps,
      //   generate_mibi_investigations,
      // } = input_data
      // TODO: SMICS-0.8
      let {
        Contact_NthDegree_TTKP_Degree,
        generate_mibi_investigations_TEMP,
      } = input_data
      let generate_mibi_investigations = generate_mibi_investigations_TEMP
      let {
        Patienten_Bewegungen,
        Labordaten,
      } = Contact_NthDegree_TTKP_Degree.data
      let Patient_Bewegung_Ps = {
        error: undefined,
        data: Patienten_Bewegungen,
      }
      let Patient_Labordaten_Ps = {
        error: undefined,
        data: Labordaten,
      }

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
        { name: "Station", propname: "StationID" },
        { name: "Raum", propname: "Raum" },
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
            console.log("GET OWN PROPERTY NAMES")
            console.log(status_changes, patient_id)
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
            console.log("SIMULATION DONE")

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
              callback({
                timestamp: new Date().getTime(),
                patientList,
                graph_data,
                pathogens_with_name,
              })
            }
          }, 1000)
        })
      }
    },
  },
  linelist: {
    needed_raw_data: ["Patient_Bewegung_Ps"],
    needed_parsed_data: ["generate_mibi_investigations"],
    call_function: (input_data: any, parameters: any, callback: Function) => {
      let { Patient_Bewegung_Ps, generate_mibi_investigations } = input_data

      // Patient_Bewegung_Ps.data = [
      //   {
      //     PatientID: "c74f6215-4fc2-42a5-a3ad-f92536ca64dc",
      //     Beginn: "2021-01-01T09:00:00+01:00",
      //     Ende: "2021-01-01T09:00:00+01:00",
      //     Bewegungstyp: "Aufnahme",
      //     BewegungstypID: 1,
      //     FallID: "00000001",
      //     Raum: "Zimmerkennung 101",
      //     Bewegungsart_l: "Diagn./Therap.",
      //     StationID: "Coronastation",
      //   },
      //   {
      //     PatientID: "c74f6215-4fc2-42a5-a3ad-f92536ca64dc",
      //     Beginn: "2021-01-01T09:00:00+01:00",
      //     Ende: "2021-01-05T15:00:00+01:00",
      //     Bewegungstyp: "Wechsel",
      //     BewegungstypID: 3,
      //     FallID: "00000001",
      //     Raum: "Zimmerkennung 101",
      //     Bewegungsart_l: "Diagn./Therap.",
      //     StationID: "Coronastation",
      //   },
      //   {
      //     PatientID: "c74f6215-4fc2-42a5-a3ad-f92536ca64dc",
      //     Beginn: "2021-01-05T15:00:00+01:00",
      //     Ende: "2021-01-05T15:00:00+01:00",
      //     Bewegungstyp: "Entlassung",
      //     BewegungstypID: 2,
      //     FallID: "00000001",
      //     Raum: "Zimmerkennung 101",
      //     Bewegungsart_l: "Diagn./Therap.",
      //     StationID: "Coronastation",
      //   },
      //   {
      //     PatientID: "96cdcae3-6c08-4eb7-8e41-45b012bf61d4",
      //     Beginn: "2021-01-02T09:00:00+01:00",
      //     Ende: "2021-01-02T09:00:00+01:00",
      //     Bewegungstyp: "Aufnahme",
      //     BewegungstypID: 1,
      //     FallID: "00000002",
      //     Raum: "Zimmerkennung 101",
      //     Bewegungsart_l: "Diagn./Therap.",
      //     StationID: "Coronastation",
      //   },
      //   {
      //     PatientID: "96cdcae3-6c08-4eb7-8e41-45b012bf61d4",
      //     Beginn: "2021-01-02T09:00:00+01:00",
      //     Ende: "2021-01-07T15:00:00+01:00",
      //     Bewegungstyp: "Wechsel",
      //     BewegungstypID: 3,
      //     FallID: "00000002",
      //     Raum: "Zimmerkennung 101",
      //     Bewegungsart_l: "Diagn./Therap.",
      //     StationID: "Coronastation",
      //   },
      //   {
      //     PatientID: "96cdcae3-6c08-4eb7-8e41-45b012bf61d4",
      //     Beginn: "2021-01-07T15:00:00+01:00",
      //     Ende: "2021-01-07T15:00:00+01:00",
      //     Bewegungstyp: "Entlassung",
      //     BewegungstypID: 2,
      //     FallID: "00000002",
      //     Raum: "Zimmerkennung 101",
      //     Bewegungsart_l: "Diagn./Therap.",
      //     StationID: "Coronastation",
      //   },
      //   {
      //     PatientID: "7dab2503-06f1-4c42-b4a4-76ddaae08794",
      //     Beginn: "2021-01-03T09:00:00+01:00",
      //     Ende: "2021-01-03T09:00:00+01:00",
      //     Bewegungstyp: "Aufnahme",
      //     BewegungstypID: 1,
      //     FallID: "00000004",
      //     Raum: "Zimmerkennung 101",
      //     Bewegungsart_l: "Diagn./Therap.",
      //     StationID: "Coronastation",
      //   },
      //   {
      //     PatientID: "7dab2503-06f1-4c42-b4a4-76ddaae08794",
      //     Beginn: "2021-01-03T09:00:00+01:00",
      //     Ende: "2021-01-09T15:00:00+01:00",
      //     Bewegungstyp: "Wechsel",
      //     BewegungstypID: 3,
      //     FallID: "00000004",
      //     Raum: "Zimmerkennung 101",
      //     Bewegungsart_l: "Diagn./Therap.",
      //     StationID: "Coronastation",
      //   },
      //   {
      //     PatientID: "7dab2503-06f1-4c42-b4a4-76ddaae08794",
      //     Beginn: "2021-01-09T15:00:00+01:00",
      //     Ende: "2021-01-09T15:00:00+01:00",
      //     Bewegungstyp: "Entlassung",
      //     BewegungstypID: 2,
      //     FallID: "00000004",
      //     Raum: "Zimmerkennung 101",
      //     Bewegungsart_l: "Diagn./Therap.",
      //     StationID: "Coronastation",
      //   },
      //   {
      //     PatientID: "059d9e68-c096-4ee7-8551-c088a5488813",
      //     Beginn: "2021-01-02T09:00:00+01:00",
      //     Ende: "2021-01-02T09:00:00+01:00",
      //     Bewegungstyp: "Aufnahme",
      //     BewegungstypID: 1,
      //     FallID: "00000003",
      //     Raum: "Zimmerkennung 101",
      //     Bewegungsart_l: "Diagn./Therap.",
      //     StationID: "Stationskennung X",
      //   },
      //   {
      //     PatientID: "059d9e68-c096-4ee7-8551-c088a5488813",
      //     Beginn: "2021-01-02T09:00:00+01:00",
      //     Ende: "2021-01-03T11:00:00+01:00",
      //     Bewegungstyp: "Wechsel",
      //     BewegungstypID: 3,
      //     FallID: "00000003",
      //     Raum: "Zimmerkennung 101",
      //     Bewegungsart_l: "Diagn./Therap.",
      //     StationID: "Stationskennung X",
      //   },
      //   {
      //     PatientID: "059d9e68-c096-4ee7-8551-c088a5488813",
      //     Beginn: "2021-01-03T11:00:00+01:00",
      //     Ende: "2021-01-09T15:00:00+01:00",
      //     Bewegungstyp: "Wechsel",
      //     BewegungstypID: 3,
      //     FallID: "00000003",
      //     Raum: "Zimmerkennung 101",
      //     Bewegungsart_l: "Diagn./Therap.",
      //     StationID: "Coronastation",
      //   },
      //   {
      //     PatientID: "059d9e68-c096-4ee7-8551-c088a5488813",
      //     Beginn: "2021-01-09T15:00:00+01:00",
      //     Ende: "2021-01-09T15:00:00+01:00",
      //     Bewegungstyp: "Entlassung",
      //     BewegungstypID: 2,
      //     FallID: "00000003",
      //     Raum: "Zimmerkennung 101",
      //     Bewegungsart_l: "Diagn./Therap.",
      //     StationID: "Coronastation",
      //   },
      //   {
      //     PatientID: "71d6b0a9-34b5-43be-a2e6-00517066ad0f",
      //     Beginn: "2021-01-04T09:00:00+01:00",
      //     Ende: "2021-01-04T09:00:00+01:00",
      //     Bewegungstyp: "Aufnahme",
      //     BewegungstypID: 1,
      //     FallID: "00000006",
      //     Raum: "Zimmerkennung 101",
      //     Bewegungsart_l: "Diagn./Therap.",
      //     StationID: "Coronastation",
      //   },
      //   {
      //     PatientID: "71d6b0a9-34b5-43be-a2e6-00517066ad0f",
      //     Beginn: "2021-01-04T09:00:00+01:00",
      //     Ende: "2021-03-26T16:54:34.5259828+01:00",
      //     Bewegungstyp: "Wechsel",
      //     BewegungstypID: 3,
      //     FallID: "00000006",
      //     Raum: "Zimmerkennung 101",
      //     Bewegungsart_l: "Diagn./Therap.",
      //     StationID: "Coronastation",
      //   },
      //   {
      //     PatientID: "23cdde3c-0e07-497d-bed4-fe9be5c6d166",
      //     Beginn: "2021-01-02T09:00:00+01:00",
      //     Ende: "2021-01-02T09:00:00+01:00",
      //     Bewegungstyp: "Aufnahme",
      //     BewegungstypID: 1,
      //     FallID: "00000005",
      //     Raum: "Zimmerkennung 101",
      //     Bewegungsart_l: "Diagn./Therap.",
      //     StationID: "Stationskennung X",
      //   },
      //   {
      //     PatientID: "23cdde3c-0e07-497d-bed4-fe9be5c6d166",
      //     Beginn: "2021-01-02T09:00:00+01:00",
      //     Ende: "2021-01-04T15:30:00+01:00",
      //     Bewegungstyp: "Wechsel",
      //     BewegungstypID: 3,
      //     FallID: "00000005",
      //     Raum: "Zimmerkennung 101",
      //     Bewegungsart_l: "Diagn./Therap.",
      //     StationID: "Stationskennung X",
      //   },
      //   {
      //     PatientID: "23cdde3c-0e07-497d-bed4-fe9be5c6d166",
      //     Beginn: "2021-01-06T16:00:00+01:00",
      //     Ende: "2021-01-08T14:00:00+01:00",
      //     Bewegungstyp: "Wechsel",
      //     BewegungstypID: 3,
      //     FallID: "00000005",
      //     Raum: "Zimmerkennung 101",
      //     Bewegungsart_l: "Diagn./Therap.",
      //     StationID: "Stationskennung Y",
      //   },
      //   {
      //     PatientID: "23cdde3c-0e07-497d-bed4-fe9be5c6d166",
      //     Beginn: "2021-01-08T14:00:00+01:00",
      //     Ende: "2021-03-26T16:54:34.5726622+01:00",
      //     Bewegungstyp: "Wechsel",
      //     BewegungstypID: 3,
      //     FallID: "00000005",
      //     Raum: "Zimmerkennung 101",
      //     Bewegungsart_l: "Diagn./Therap.",
      //     StationID: "Coronastation",
      //   },
      //   {
      //     PatientID: "23cdde3c-0e07-497d-bed4-fe9be5c6d166",
      //     Beginn: "2021-01-04T15:30:00+01:00",
      //     Ende: "2021-01-06T16:00:00+01:00",
      //     Bewegungstyp: "Wechsel",
      //     BewegungstypID: 3,
      //     FallID: "00000005",
      //     Raum: "Zimmerkennung 101",
      //     Bewegungsart_l: "Diagn./Therap.",
      //     StationID: "Coronastation",
      //   },
      //   {
      //     PatientID: "786e3c35-32d3-403e-b2f3-532ed5e78e0c",
      //     Beginn: "2021-01-05T09:00:00+01:00",
      //     Ende: "2021-01-05T09:00:00+01:00",
      //     Bewegungstyp: "Aufnahme",
      //     BewegungstypID: 1,
      //     FallID: "00000007",
      //     Raum: "Zimmerkennung 101",
      //     Bewegungsart_l: "Diagn./Therap.",
      //     StationID: "Coronastation",
      //   },
      //   {
      //     PatientID: "786e3c35-32d3-403e-b2f3-532ed5e78e0c",
      //     Beginn: "2021-01-05T09:00:00+01:00",
      //     Ende: "2021-03-26T16:54:34.6222734+01:00",
      //     Bewegungstyp: "Wechsel",
      //     BewegungstypID: 3,
      //     FallID: "00000007",
      //     Raum: "Zimmerkennung 101",
      //     Bewegungsart_l: "Diagn./Therap.",
      //     StationID: "Coronastation",
      //   },
      // ]

      let { patientList } = parameters

      // TODO: SMICS-0.8
      // Patientenliste wegen Nth-Degree rauslesen
      let new_patient_list: any[] = []
      Patient_Bewegung_Ps.data.forEach((mov: any) => {
        if (!new_patient_list.includes(mov.PatientID)) {
          new_patient_list.push(mov.PatientID)
        }
      })
      patientList = new_patient_list

      let ts_start = Number.MAX_VALUE
      let ts_end = 0

      let first_movement = Number.MAX_VALUE
      let last_movement = 0

      let movement_rects: object[] = []
      let movement_dots: object[] = []
      let investigation_rects: object[] = []
      let status_rects: any[] = []
      let unknown_rects: any = {}
      let allStations: any[] = []

      // generate visualization for movement data (horizontal rectangles)
      // only if there is no error in the data
      if (Patient_Bewegung_Ps.error === undefined) {
        let movement_rect_top_position: any = {}

        Patient_Bewegung_Ps.data.forEach((movement: any) => {
          if (!allStations.includes(movement.StationID)) {
            allStations.push(movement.StationID)
          }

          let begin = new Date(movement.Beginn).getTime()
          let end = new Date(movement.Ende).getTime()
          if (begin < ts_start) {
            ts_start = begin
            first_movement = begin
          }
          if (end > ts_end) {
            ts_end = end
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
      }

      // generate visualization for investigation data (vertical rectangles)
      // only if there is no error in the data
      if (generate_mibi_investigations.error === undefined) {
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
            status_rects.push(unknown_rect)
            // unknown_rects.push(unknown_rect)
            unknown_rects[pID] = unknown_rect

            console.log(`.........................Status Rects for ${pID}`)

            console.log("pID", pID)
            console.table(status_changes[pID])
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

            console.log(
              `Tested Pathogens for this Patient... ${tested_pathogens}`
            )
            console.table(status_changes[pID])

            tested_pathogens.forEach((pathID: any) => {
              let current_last_ts = first_ts
              let current_status = "unknown"

              // Status von vor der Aufnahme ermitteln
              status_changes[pID][pathID].forEach(
                (stat_change: any, i: number) => {
                  console.table(stat_change)
                  if (stat_change.timestamp <= first_movement) {
                    console.log(`before first_ts ${stat_change}`)
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
              console.log(`Status VOR der Aufnahme: ${current_status}`)

              status_changes[pID][pathID].forEach(
                (stat_change: any, i: number) => {
                  let stat_change_ts = stat_change.timestamp
                  console.table(stat_change)

                  // Nur wenn status_change innerhalb des Aufenthaltszeitraums liegt
                  if (
                    stat_change_ts > first_movement &&
                    stat_change_ts < last_movement
                  ) {
                    let new_status = get_worse_carrier_status(
                      current_status,
                      stat_change.new_status
                    )
                    console.log(`NEUER STATUS des Patienten: ${new_status}`)
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
                      console.log(`GEPSCHTER Status Recht: ${new_status}`)
                    }
                  }
                }
              )
            })
          })
        }
      }

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
      })

      // return {
      //   // data: ["linelist vis data", input_data],
      //   timestamp: new Date().getTime(),
      //   ts_start,
      //   ts_end,
      //   patientList,
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
    needed_raw_data: [],
    needed_parsed_data: [
      "generate_mibi_investigations",
      "generate_contact_graph",
    ],
    call_function: (input_data: any, parameters: any, callback: Function) => {
      callback({
        data: ["storyline vis data"],
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
