"use strict";
/**
 * All algorithms to generate the visualizations for the modules
 *
 * Name des Moduls
 * welche raw-data benoetigt werden
 * welche parsed-data benoetigt werden
 * die parse-funktion selbst implementieren; default (z.B: on Error etc)
 * ein leeres Array ([]) zurueck geben
 */
Object.defineProperty(exports, "__esModule", { value: true });
var d3 = require("d3");
var carrier_status_1 = require("./utilities/carrier_status");
var storylineParser_1 = require("./utilities/storylineParser");
// TODO: ERROR-Message(s) mit zurueck geben...
var module_parser = {
    annotationTimeline: {
        // AnnotatonTimeline
        needed_raw_data: [],
        needed_parsed_data: [],
        call_function: function (input_data, parameters, callback) {
            // hier custom data einfuegen
            /**
             * Beginn des Strukturvorschlags für Kristina
             *
             */
            var Metadaten = [
                {
                    firstDate: "2021-02-15T12:35:14.90Z",
                    lastDate: "2021-02-15T12:35:14.90Z",
                    patientID: "string",
                    infektionsSituation: "string",
                    aufnahmeArt: "string",
                    klinikStatus: "string",
                },
            ];
            var Tests = [
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
            ];
            var Stationen = [
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
            ];
            var Symptome = [
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
            ];
            var Impfstatus = [
                {
                    patientID: "string",
                    medikament: "string",
                    impfStatus: "string",
                    Dosierungsreihenfolge: "string",
                    Dosiermenge: "string",
                    "Impfung gegen": "string",
                    Abwesenheit: "string",
                },
            ];
            var check_min_max_dates = function (datum) {
                globalStartTS = datum < globalStartTS ? datum : globalStartTS;
                globalEndTS = datum > globalEndTS ? datum : globalEndTS;
            };
            var TAGZEIT = 1000 * 60 * 60 * 24;
            var covidDaten = [];
            var globalStartTS = Number.MAX_VALUE;
            var globalEndTS = Number.MIN_VALUE;
            var patientIDs = [0, 1, 2];
            // Metadaten
            var patientId = 1001; // numerisch vierstellig
            var patientAlter = 87; // in Jahren
            var patientGeschlecht = "w"; // m = männlich, w = weibich, d = divers, u = unbekannt
            var infektionsSituation = "nosokomial"; // nosokomial oder non-nosokomial
            var aufnahmeArt = "Notaufnahme"; // Notaufnahme, von anderer Klinik, Ankunft vor Infektion
            var klinikStatus = "entlassen"; // anwesend, entlassen, verstorben
            // Für die Textausgabe auf dem Bildschirm, die MEtadaten in eine Strktur schreiben
            var metaInfos = [
                "PatientID: 0",
                "Impfstatus: none",
                "Infektionssituation: nosokomial",
                "Aufnahmeart: Notaufnahme",
                "Aufnahmedatum: 01.12.2020",
                "f",
                "g",
            ];
            var metaTextInfos = [];
            for (var i = 0; i < 5; i++) {
                var metaInfoStruct = {
                    metaInfo: metaInfos[i],
                    index: i,
                };
                metaTextInfos.push(metaInfoStruct);
            }
            // Testdaten in einer Struktur mit allen Tests ablegen
            var covidTestData = [];
            var virusLastRects = [];
            var ereignisTriangles = [];
            var ereignisCircles = [];
            var testArten = ["pcr", "antiGen"]; // Art des Test -> pcr oder antiGen
            for (var i = 0; i < 10; i++) {
                // 10 Tests
                var testStruct = {
                    testID: "id" + i + "_" + patientIDs[0],
                    patientID: patientIDs[0],
                    testArt: testArten[Math.round(Math.random())],
                    testTimeStamp: new Date().getTime() -
                        TAGZEIT * (Math.random() * 10 + (9 - i) * 10),
                    resultTimeStamp: 0,
                    virusLast: Math.round(Math.random() * 40),
                    nextTestDate: 0,
                };
                testStruct.resultTimeStamp =
                    testStruct.testTimeStamp + TAGZEIT * Math.random() * 3; // Das Resultat des Tests ist innerhalb von 3 Tagen da
                covidTestData.push(testStruct);
                check_min_max_dates(testStruct.testTimeStamp);
                check_min_max_dates(testStruct.resultTimeStamp);
                virusLastRects.push(testStruct);
                ereignisTriangles.push({
                    patientID: patientIDs[0],
                    ereignisTimeStamp: testStruct.testTimeStamp,
                });
            }
            // Testdaten Standardpatient
            var standardTestArten = [
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
            ];
            var tage = [92, 80, 75, 55, 50, 40, 30, 25, 20, 15, 0];
            var standardTestergebnis = [35, 27, 20, 10, 10, 25, 27, 34, 38, 40, 40];
            for (var i = 0; i < 9; i++) {
                // 10 Tests
                var testStruct = {
                    testID: "id" + i + "_" + patientIDs[1],
                    patientID: patientIDs[1],
                    testArt: standardTestArten[i],
                    testTimeStamp: new Date().getTime() - TAGZEIT * tage[i],
                    resultTimeStamp: new Date().getTime() -
                        TAGZEIT * tage[i] +
                        Math.random() * 3 * TAGZEIT,
                    virusLast: standardTestergebnis[i],
                    nextTestDate: new Date().getTime() - TAGZEIT * tage[i + 1],
                };
                testStruct.resultTimeStamp =
                    testStruct.testTimeStamp + TAGZEIT * Math.random() * 3; // Das Resultat des Tests ist innerhalb von 3 Tagen da
                covidTestData.push(testStruct);
                check_min_max_dates(testStruct.testTimeStamp);
                check_min_max_dates(testStruct.resultTimeStamp);
                virusLastRects.push(testStruct);
                ereignisTriangles.push({
                    patientID: patientIDs[1],
                    ereignisTimeStamp: testStruct.testTimeStamp,
                });
            }
            // Stationen
            var stationenRects = [];
            var stationsArten = [
                "CovidStation",
                "NormalStation",
                "ICR",
                "Intensivstation",
            ];
            var stationsNr = Math.round(Math.random() * 99);
            for (var i = 0; i < 5; i++) {
                var stationsStruct = {
                    patientID: patientIDs[0],
                    stationsArt: stationsArten[Math.round(Math.random() * (stationsArten.length - 1))],
                    aufenthaltsBegin: new Date().getTime() -
                        TAGZEIT * (Math.random() * 20 + (8 - i * 2) * 10),
                    aufenthaltsEnde: 0,
                    stationsNr: stationsNr,
                };
                stationsStruct.aufenthaltsEnde =
                    stationsStruct.aufenthaltsBegin + TAGZEIT * Math.random() * 10;
                stationenRects.push(stationsStruct);
                check_min_max_dates(stationsStruct.aufenthaltsBegin);
                check_min_max_dates(stationsStruct.aufenthaltsEnde);
            }
            // Stationen Standardpatient
            var standardStationsArten = [
                "NormalStation",
                "CovidStation",
                "Intensivstation",
                "ICR",
                "NormalStation",
            ];
            tage = [100, 80, 75, 50, 30, 0];
            for (var i = 0; i < 5; i++) {
                var stationsStruct = {
                    patientID: patientIDs[1],
                    stationsArt: standardStationsArten[i],
                    aufenthaltsBegin: new Date().getTime() - TAGZEIT * tage[i],
                    aufenthaltsEnde: new Date().getTime() - TAGZEIT * tage[i + 1],
                    stationsNr: stationsNr,
                };
                stationenRects.push(stationsStruct);
                check_min_max_dates(stationsStruct.aufenthaltsBegin);
                check_min_max_dates(stationsStruct.aufenthaltsEnde);
            }
            // Isolierzeitraeume
            var isolierZeitraeume = [];
            for (var i = 0; i < 2; i++) {
                var isolierStruct = {
                    patientID: patientIDs[0],
                    isolierBeginn: new Date().getTime() -
                        TAGZEIT * (Math.random() * 50 + (5 - i * 5) * 10),
                    isolierEnde: 0,
                };
                isolierStruct.isolierEnde =
                    isolierStruct.isolierBeginn + TAGZEIT * Math.random() * 25;
                isolierZeitraeume.push(isolierStruct);
                check_min_max_dates(isolierStruct.isolierBeginn);
                check_min_max_dates(isolierStruct.isolierEnde);
            }
            // Isolierzeit Standardpatient
            for (var i = 0; i < 1; i++) {
                var isolierStruct = {
                    patientID: patientIDs[1],
                    isolierBeginn: new Date().getTime() - TAGZEIT * 80,
                    isolierEnde: new Date().getTime() - TAGZEIT * 20,
                };
                isolierZeitraeume.push(isolierStruct);
                check_min_max_dates(isolierStruct.isolierBeginn);
                check_min_max_dates(isolierStruct.isolierEnde);
            }
            // Impfdaten
            var impfDaten = [];
            var medikamente = ["none", "cureVac", "AstraZeneca", "BionTec"];
            var impfStatus = [
                "keine Immunitaet",
                "Teilimmunitaet",
                "volle Immunitaet",
                "unbekannt",
            ];
            var impfDatenStruct = {
                patientID: patientIDs[0],
                medikament: medikamente[Math.round(Math.random() * (medikamente.length - 1))],
                impfStatus: impfStatus[Math.round(Math.random() * (impfStatus.length - 1))],
            };
            impfDaten.push(impfDatenStruct);
            // Impfdaten Standardpatient
            impfDatenStruct = {
                patientID: patientIDs[1],
                medikament: medikamente[3],
                impfStatus: impfStatus[1],
            };
            impfDaten.push(impfDatenStruct);
            // Symptome
            var symptomDaten = [];
            var symptomArten = [
                "Respiratorisch",
                "Gastroenterologisch",
                "Systemisch",
                "Neurologisch",
            ];
            for (var i = 0; i < 5; i++) {
                var symptomStruct = {
                    patientID: patientIDs[0],
                    symptomBeginn: new Date().getTime() -
                        TAGZEIT * (Math.random() * 20 + (8 - i * 2) * 10),
                    symptomEnde: 0,
                    symptomArt: symptomArten[Math.round(Math.random() * (symptomArten.length - 1))],
                    negation: Math.round(Math.random()),
                };
                symptomStruct.symptomEnde =
                    symptomStruct.symptomBeginn + TAGZEIT * Math.random() * 10;
                symptomDaten.push(symptomStruct);
                if (Math.random() > 0.5) {
                    ereignisTriangles.push({
                        patientID: patientIDs[0],
                        ereignisTimeStamp: symptomStruct.symptomBeginn,
                    });
                }
                else {
                    ereignisCircles.push({
                        patientID: patientIDs[0],
                        ereignisTimeStamp: symptomStruct.symptomBeginn,
                    });
                }
                check_min_max_dates(symptomStruct.symptomBeginn);
                check_min_max_dates(symptomStruct.symptomEnde);
            }
            // Symptome Standardpatient
            var standardSymptombeginn = [95, 70, 55, 30];
            var standardSymptomArten = [
                ["Respiratorisch", "Systemisch"],
                ["Gastroenterologisch", "Systemisch"],
                ["Neurologisch"],
            ];
            for (var i = 0; i < 3; i++) {
                var symptomStruct = {
                    patientID: patientIDs[1],
                    symptomBeginn: new Date().getTime() - TAGZEIT * standardSymptombeginn[i],
                    symptomEnde: new Date().getTime() - TAGZEIT * standardSymptombeginn[i + 1],
                    symptomArt: standardSymptomArten[i],
                    negation: Math.round(Math.random()),
                };
                symptomDaten.push(symptomStruct);
                if (i !== 1) {
                    ereignisTriangles.push({
                        // Präzise ereignisse
                        patientID: patientIDs[1],
                        ereignisTimeStamp: symptomStruct.symptomBeginn,
                    });
                }
                else {
                    ereignisCircles.push({
                        // Unscharfe Ereignisse
                        patientID: patientIDs[1],
                        ereignisTimeStamp: symptomStruct.symptomBeginn,
                    });
                }
                check_min_max_dates(symptomStruct.symptomBeginn);
                check_min_max_dates(symptomStruct.symptomEnde);
            }
            // Annotationsdreiecke
            // Annotationsdaten in einer Annotationsstruktur ablegen
            var annotationsTriangles = [];
            var annotationsArten = [
                "Dateninformationen",
                "Nutzerinformationen",
                "Ergebnisinformationen",
            ]; // Art des Test -> pcr oder antiGen
            var annoCount = Math.round(Math.random() * 4);
            for (var i = 0; i < annoCount; i++) {
                // 4 Annotationen
                var annoStruct = {
                    patientID: patientIDs[0],
                    annotationsArt: annotationsArten[Math.round(Math.random() * annotationsArten.length - 1)],
                    timeLocation: new Date().getTime() -
                        TAGZEIT *
                            (i * (100 / annoCount) + Math.random() * (100 / annoCount)),
                    timeStamp: new Date().getTime(),
                };
                annotationsTriangles.push(annoStruct);
                check_min_max_dates(annoStruct.timeLocation);
            }
            // Annotationsdaten Standardpatient
            var standardAnnoArten = [
                "Dateninformationen",
                "Nutzerinformationen",
                "Ergebnisinformationen",
            ];
            tage = [47, 35, 20];
            for (var i = 0; i < 3; i++) {
                // 3 Annotationen
                var annoStruct = {
                    patientID: patientIDs[1],
                    annotationsArt: annotationsArten[standardAnnoArten[i]],
                    timeLocation: new Date().getTime() - TAGZEIT * tage[i],
                    timeStamp: new Date().getTime(),
                };
                annotationsTriangles.push(annoStruct);
                check_min_max_dates(annoStruct.timeLocation);
            }
            // Gesamtkonstrukt
            covidDaten.push({
                // Metadaten
                //metaTextInfos: metaTextInfos,
                patientId: patientIDs[0],
                patientAlter: patientAlter,
                patientGeschlecht: patientGeschlecht,
                infektionsSituation: infektionsSituation,
                aufnahmeArt: aufnahmeArt,
                klinikStatus: klinikStatus,
                // Testdaten
                covidTestDaten: covidTestData,
                // Aufenthaltsorte
                stationenRects: stationenRects,
                // Isolierung
                isolierZeitraeume: isolierZeitraeume,
                // Impfstatus
                //impfDaten: impfDaten, // Daten zur Impfung, Impfstatus, Impfdaten, Medikament
                // Symptome
                symptomDaten: symptomDaten,
            });
            console.log(covidDaten);
            // Ende der Covid Daten
            callback({
                covidDaten: covidDaten,
                covidTestData: covidTestData,
                virusLastRects: virusLastRects,
                stationenRects: stationenRects,
                ereignisTriangles: ereignisTriangles,
                ereignisCircles: ereignisCircles,
                annotationsTriangles: annotationsTriangles,
                globalStartTS: globalStartTS,
                globalEndTS: globalEndTS,
                metaTextInfos: metaTextInfos,
                impfDaten: impfDaten,
                symptomDaten: symptomDaten,
            });
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
        needed_parsed_data: [],
        // TODO: PRO ERREGER!!! aktuell alle Erreger in Reihe geschalten
        // TODO: die initial timestamps for timelense sind null...
        call_function: function (input_data, parameters, callback) {
            var Labor_ErregerProTag_TTEsKSs = input_data.Labor_ErregerProTag_TTEsKSs;
            var starttime = parameters.starttime, endtime = parameters.endtime, station = parameters.station, pathogenList = parameters.pathogenList;
            var initial_timelense_timestamps = [];
            var newData = [];
            var stationIDs = [];
            var pathogenIDs = [];
            var dayDataSets = {};
            var weekDataSets = {};
            var monthDataSets = {};
            if (Labor_ErregerProTag_TTEsKSs.error === undefined) {
                // Fuer jede Station und jeden Pathogen eine Kurve erzeugen
                // + Endemische Kurven jeweils
                // + für 7 Tage / 28 Tage akkumuliert
                var raw_data_1 = Labor_ErregerProTag_TTEsKSs.data;
                // console.log(Labor_ErregerProTag_TTEsKSs)
                // ! FUER ENDE-MAERZ DAZU GEMACHT
                raw_data_1.forEach(function (d) {
                    if (d.anzahl_gesamt !== undefined) {
                        d.Anzahl_cs = d.anzahl_gesamt;
                        d.MAVG7_cs = d.anzahl_gesamt_av7;
                        d.MAVG28_cs = d.anzahl_gesamt_av28;
                    }
                });
                raw_data_1.forEach(function (d, i) {
                    if (d.StationID === null)
                        [(d.StationID = "Klinik")];
                    d.timestamp = new Date(d.Datum.split(".")[0]).getTime();
                    // unsere Datenbank liefer da glaube ich einfach nichts zurueck
                    d.avg7 = d.MAVG7 ? d.MAVG7 : 0;
                    d.avg28 = d.MAVG28 ? d.MAVG28 : 0;
                    d.avg7_cs = d.MAVG7_cs ? d.MAVG7_cs : 0;
                    d.avg28_cs = d.MAVG28_cs ? d.MAVG28_cs : 0;
                    if (!stationIDs.includes(d.StationID)) {
                        stationIDs.push(d.StationID);
                    }
                    if (!pathogenIDs.includes(d.ErregerID)) {
                        pathogenIDs.push(d.ErregerID);
                    }
                });
                pathogenIDs.forEach(function (pathogen) {
                    // })
                    var data = JSON.parse(JSON.stringify(raw_data_1)).filter(function (p) { return pathogen === p.ErregerID; });
                    stationIDs.forEach(function (stationID) {
                        if (dayDataSets["K" + pathogen] === undefined) {
                            dayDataSets["K" + pathogen] = {};
                        }
                        dayDataSets["K" + pathogen]["S" + stationID] = data.filter(function (d) { return d.StationID === stationID; });
                        var weekData = [];
                        var monthData = [];
                        dayDataSets["K" + pathogen]["S" + stationID].forEach(function (d, i) {
                            if (i % 7 === 0) {
                                weekData.push({
                                    timestamps: [],
                                    Anzahl: 0,
                                    Anzahl_cs: 0,
                                    avg7: [],
                                    avg28: [],
                                    avg7_cs: [],
                                    avg28_cs: [],
                                });
                            }
                            var lastWeekData = weekData[weekData.length - 1];
                            lastWeekData.timestamps.push(d.timestamp);
                            lastWeekData.Anzahl += d.Anzahl;
                            lastWeekData.Anzahl_cs += d.Anzahl_cs;
                            lastWeekData.avg7.push(d.MAVG7 ? d.MAVG7 : 0);
                            lastWeekData.avg28.push(d.MAVG28 ? d.MAVG28 : 0);
                            lastWeekData.avg7_cs.push(d.MAVG7_cs ? d.MAVG7 : 0);
                            lastWeekData.avg28_cs.push(d.MAVG28_cs ? d.MAVG28_cs : 0);
                            if (i % 28 === 0) {
                                monthData.push({
                                    timestamps: [],
                                    Anzahl: 0,
                                    Anzahl_cs: 0,
                                    avg7: [],
                                    avg28: [],
                                    avg7_cs: [],
                                    avg28_cs: [],
                                });
                            }
                            var lastMonthData = monthData[monthData.length - 1];
                            lastMonthData.timestamps.push(d.timestamp);
                            lastMonthData.Anzahl += d.Anzahl;
                            lastMonthData.Anzahl_cs += d.Anzahl_cs;
                            lastMonthData.avg7.push(d.MAVG7 ? d.MAVG7 : 0);
                            lastMonthData.avg28.push(d.MAVG28 ? d.MAVG28 : 0);
                            lastMonthData.avg7_cs.push(d.MAVG7_cs ? d.MAVG7_cs : 0);
                            lastMonthData.avg28_cs.push(d.MAVG28_cs ? d.MAVG28_cs : 0);
                        });
                        // TODO: die letzten dataObjects vom Monat und der Woche sind eventuell weniger als 7 oder 28 Tage
                        var lastWeekDays = weekData[weekData.length - 1];
                        var ratioDaysLastWeek = 7 / lastWeekDays.timestamps.length;
                        lastWeekDays.Anzahl = lastWeekDays.Anzahl * ratioDaysLastWeek;
                        lastWeekDays.Anzahl_cs = lastWeekDays.Anzahl_cs * ratioDaysLastWeek;
                        var lastMonthDays = monthData[monthData.length - 1];
                        var ratioDaysLastMonth = 28 / lastMonthDays.timestamps.length;
                        lastMonthDays.Anzahl = lastMonthDays.Anzahl * ratioDaysLastMonth;
                        lastMonthDays.Anzahl_cs =
                            lastMonthDays.Anzahl_cs * ratioDaysLastMonth;
                        if (weekDataSets["K" + pathogen] === undefined) {
                            weekDataSets["K" + pathogen] = {};
                        }
                        if (monthDataSets["K" + pathogen] === undefined) {
                            monthDataSets["K" + pathogen] = {};
                        }
                        weekDataSets["K" + pathogen]["S" + stationID] = weekData;
                        monthDataSets["K" + pathogen]["S" + stationID] = monthData;
                    });
                });
                /**
                 * Initiale Anfangs- und Endzeit abspeichern
                 */
                initial_timelense_timestamps = [
                    raw_data_1[0].timestamp,
                    raw_data_1[raw_data_1.length - 1].timestamp + 1000 * 60 * 60 * 24,
                ];
                // let newData = [dayDataSets, weekDataSets, monthDataSets]
            }
            callback({
                timestamp: new Date().getTime(),
                // data: { dayDataSets, weekDataSets, monthDataSets },
                data: [dayDataSets, weekDataSets, monthDataSets],
                initial_timelense_timestamps: initial_timelense_timestamps,
                stationIDs: stationIDs,
                pathogenIDs: pathogenIDs,
            });
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
        call_function: function (input_data, parameters, callback) {
            var Patient_Bewegung_Ps = input_data.Patient_Bewegung_Ps, generate_mibi_investigations = input_data.generate_mibi_investigations;
            var patientList = parameters.patientList;
            var ts_start = Number.MAX_VALUE;
            var ts_end = 0;
            var movement_rects = [];
            var movement_dots = [];
            var investigation_rects = [];
            // generate visualization for movement data (horizontal rectangles)
            // only if there is no error in the data
            if (Patient_Bewegung_Ps.error === undefined) {
                var movement_rect_top_position_1 = {};
                Patient_Bewegung_Ps.data.forEach(function (movement) {
                    var begin = new Date(movement.Beginn).getTime();
                    var end = new Date(movement.Ende).getTime();
                    if (begin < ts_start) {
                        ts_start = begin;
                    }
                    if (end > ts_end) {
                        ts_end = end;
                    }
                    var vis_struct = {
                        begin: begin,
                        end: end,
                        patient_id: movement.PatientID,
                        station_id: movement.StationID,
                        station_name: movement.Station,
                        movement_type: movement.BewegungstypID,
                    };
                    if (movement.BewegungstypID === 4) {
                        movement_dots.push(vis_struct);
                    }
                    else {
                        if (movement_rect_top_position_1[movement.PatientID]) {
                            vis_struct.top = true;
                            movement_rect_top_position_1[movement.PatientID] = false;
                        }
                        else {
                            vis_struct.top = false;
                            movement_rect_top_position_1[movement.PatientID] = true;
                        }
                        movement_rects.push(vis_struct);
                    }
                });
            }
            // generate visualization for investigation data (vertical rectangles)
            // only if there is no error in the data
            if (generate_mibi_investigations.error === undefined) {
                var _a = generate_mibi_investigations.data, first_timestamp = _a.first_timestamp, last_timestamp = _a.last_timestamp, investigations = _a.investigations;
                if (ts_start > first_timestamp) {
                    ts_start = first_timestamp;
                }
                if (ts_end < last_timestamp) {
                    ts_end = last_timestamp;
                }
                investigation_rects = investigations;
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
                ts_start: ts_start,
                ts_end: ts_end,
                patientList: patientList,
                movement_rects: movement_rects,
                movement_dots: movement_dots,
                investigation_rects: investigation_rects,
            });
        },
    },
    kontaktnetzwerk: {
        // needed_raw_data: ["Patient_Bewegung_Ps", "Patient_Labordaten_Ps"],
        // needed_parsed_data: ["generate_mibi_investigations"],
        needed_raw_data: ["Contact_NthDegree_TTKP_Degree"],
        needed_parsed_data: ["generate_mibi_investigations_TEMP"],
        call_function: function (input_data, parameters, callback) {
            var patientList = parameters.patientList;
            // let {
            //   Patient_Bewegung_Ps,
            //   Patient_Labordaten_Ps,
            //   generate_mibi_investigations,
            // } = input_data
            // TODO: SMICS-0.8
            var Contact_NthDegree_TTKP_Degree = input_data.Contact_NthDegree_TTKP_Degree, generate_mibi_investigations_TEMP = input_data.generate_mibi_investigations_TEMP;
            var generate_mibi_investigations = generate_mibi_investigations_TEMP;
            var _a = Contact_NthDegree_TTKP_Degree.data, Patienten_Bewegungen = _a.Patienten_Bewegungen, Labordaten = _a.Labordaten;
            var Patient_Bewegung_Ps = {
                error: undefined,
                data: Patienten_Bewegungen,
            };
            var Patient_Labordaten_Ps = {
                error: undefined,
                data: Labordaten,
            };
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
            // Patient_Labordaten_Ps.data = [
            //   {
            //     LabordatenID: "01",
            //     PatientID: "c74f6215-4fc2-42a5-a3ad-f92536ca64dc",
            //     FallID: "00000001",
            //     ProbeID: "01",
            //     Eingangsdatum: "2021-01-01T11:00:00+01:00",
            //     ZeitpunktProbeneingang: "2021-01-01T10:30:00+01:00",
            //     Probenart: "119342007",
            //     Screening: false,
            //     Material_l: "Salvia specimen (specimen)",
            //     Befund: true,
            //     Befundkommentar: "Kommentar 1",
            //     KeimID: "94500-6",
            //     Befunddatum: "2021-01-01T10:30:00+01:00",
            //   },
            //   {
            //     LabordatenID: "02",
            //     PatientID: "c74f6215-4fc2-42a5-a3ad-f92536ca64dc",
            //     FallID: "00000001",
            //     ProbeID: "02",
            //     Eingangsdatum: "2021-01-03T11:00:00+01:00",
            //     ZeitpunktProbeneingang: "2021-01-03T10:30:00+01:00",
            //     Probenart: "119342007",
            //     Screening: false,
            //     Material_l: "Salvia specimen (specimen)",
            //     Befund: false,
            //     Befundkommentar: "Kommentar 1",
            //     KeimID: "94500-6",
            //     Befunddatum: "2021-01-03T10:30:00+01:00",
            //   },
            //   {
            //     LabordatenID: "03",
            //     PatientID: "c74f6215-4fc2-42a5-a3ad-f92536ca64dc",
            //     FallID: "00000001",
            //     ProbeID: "03",
            //     Eingangsdatum: "2021-01-05T11:00:00+01:00",
            //     ZeitpunktProbeneingang: "2021-01-05T10:30:00+01:00",
            //     Probenart: "119342007",
            //     Screening: false,
            //     Material_l: "Salvia specimen (specimen)",
            //     Befund: false,
            //     Befundkommentar: "Kommentar 1",
            //     KeimID: "94500-6",
            //     Befunddatum: "2021-01-05T10:30:00+01:00",
            //   },
            //   {
            //     LabordatenID: "01",
            //     PatientID: "96cdcae3-6c08-4eb7-8e41-45b012bf61d4",
            //     FallID: "00000002",
            //     ProbeID: "01",
            //     Eingangsdatum: "2021-01-02T11:00:00+01:00",
            //     ZeitpunktProbeneingang: "2021-01-02T10:30:00+01:00",
            //     Probenart: "119342007",
            //     Screening: false,
            //     Material_l: "Salvia specimen (specimen)",
            //     Befund: true,
            //     Befundkommentar: "Kommentar 1",
            //     KeimID: "94500-6",
            //     Befunddatum: "2021-01-02T10:30:00+01:00",
            //   },
            //   {
            //     LabordatenID: "02",
            //     PatientID: "96cdcae3-6c08-4eb7-8e41-45b012bf61d4",
            //     FallID: "00000002",
            //     ProbeID: "02",
            //     Eingangsdatum: "2021-01-04T11:00:00+01:00",
            //     ZeitpunktProbeneingang: "2021-01-04T10:30:00+01:00",
            //     Probenart: "119342007",
            //     Screening: false,
            //     Material_l: "Salvia specimen (specimen)",
            //     Befund: false,
            //     Befundkommentar: "Kommentar 1",
            //     KeimID: "94500-6",
            //     Befunddatum: "2021-01-04T10:30:00+01:00",
            //   },
            //   {
            //     LabordatenID: "03",
            //     PatientID: "96cdcae3-6c08-4eb7-8e41-45b012bf61d4",
            //     FallID: "00000002",
            //     ProbeID: "03",
            //     Eingangsdatum: "2021-01-07T11:00:00+01:00",
            //     ZeitpunktProbeneingang: "2021-01-07T10:30:00+01:00",
            //     Probenart: "119342007",
            //     Screening: false,
            //     Material_l: "Salvia specimen (specimen)",
            //     Befund: false,
            //     Befundkommentar: "Kommentar 1",
            //     KeimID: "94500-6",
            //     Befunddatum: "2021-01-07T10:30:00+01:00",
            //   },
            //   {
            //     LabordatenID: "01",
            //     PatientID: "7dab2503-06f1-4c42-b4a4-76ddaae08794",
            //     FallID: "00000004",
            //     ProbeID: "01",
            //     Eingangsdatum: "2021-01-03T11:00:00+01:00",
            //     ZeitpunktProbeneingang: "2021-01-03T10:30:00+01:00",
            //     Probenart: "119342007",
            //     Screening: false,
            //     Material_l: "Salvia specimen (specimen)",
            //     Befund: true,
            //     Befundkommentar: "Kommentar 1",
            //     KeimID: "94500-6",
            //     Befunddatum: "2021-01-03T10:30:00+01:00",
            //   },
            //   {
            //     LabordatenID: "02",
            //     PatientID: "7dab2503-06f1-4c42-b4a4-76ddaae08794",
            //     FallID: "00000004",
            //     ProbeID: "02",
            //     Eingangsdatum: "2021-01-06T11:00:00+01:00",
            //     ZeitpunktProbeneingang: "2021-01-06T10:30:00+01:00",
            //     Probenart: "119342007",
            //     Screening: false,
            //     Material_l: "Salvia specimen (specimen)",
            //     Befund: false,
            //     Befundkommentar: "Kommentar 1",
            //     KeimID: "94500-6",
            //     Befunddatum: "2021-01-06T10:30:00+01:00",
            //   },
            //   {
            //     LabordatenID: "03",
            //     PatientID: "7dab2503-06f1-4c42-b4a4-76ddaae08794",
            //     FallID: "00000004",
            //     ProbeID: "03",
            //     Eingangsdatum: "2021-01-09T11:00:00+01:00",
            //     ZeitpunktProbeneingang: "2021-01-09T10:30:00+01:00",
            //     Probenart: "119342007",
            //     Screening: false,
            //     Material_l: "Salvia specimen (specimen)",
            //     Befund: false,
            //     Befundkommentar: "Kommentar 1",
            //     KeimID: "94500-6",
            //     Befunddatum: "2021-01-09T10:30:00+01:00",
            //   },
            //   {
            //     LabordatenID: "01",
            //     PatientID: "059d9e68-c096-4ee7-8551-c088a5488813",
            //     FallID: "00000003",
            //     ProbeID: "01",
            //     Eingangsdatum: "2021-01-03T11:00:00+01:00",
            //     ZeitpunktProbeneingang: "2021-01-03T10:30:00+01:00",
            //     Probenart: "119342007",
            //     Screening: false,
            //     Material_l: "Salvia specimen (specimen)",
            //     Befund: true,
            //     Befundkommentar: "Kommentar 1",
            //     KeimID: "94500-6",
            //     Befunddatum: "2021-01-03T10:30:00+01:00",
            //   },
            //   {
            //     LabordatenID: "02",
            //     PatientID: "059d9e68-c096-4ee7-8551-c088a5488813",
            //     FallID: "00000003",
            //     ProbeID: "02",
            //     Eingangsdatum: "2021-01-07T11:00:00+01:00",
            //     ZeitpunktProbeneingang: "2021-01-07T10:30:00+01:00",
            //     Probenart: "119342007",
            //     Screening: false,
            //     Material_l: "Salvia specimen (specimen)",
            //     Befund: false,
            //     Befundkommentar: "Kommentar 1",
            //     KeimID: "94500-6",
            //     Befunddatum: "2021-01-07T10:30:00+01:00",
            //   },
            //   {
            //     LabordatenID: "03",
            //     PatientID: "059d9e68-c096-4ee7-8551-c088a5488813",
            //     FallID: "00000003",
            //     ProbeID: "03",
            //     Eingangsdatum: "2021-01-09T11:00:00+01:00",
            //     ZeitpunktProbeneingang: "2021-01-09T10:30:00+01:00",
            //     Probenart: "119342007",
            //     Screening: false,
            //     Material_l: "Salvia specimen (specimen)",
            //     Befund: false,
            //     Befundkommentar: "Kommentar 1",
            //     KeimID: "94500-6",
            //     Befunddatum: "2021-01-09T10:30:00+01:00",
            //   },
            //   {
            //     LabordatenID: "01",
            //     PatientID: "71d6b0a9-34b5-43be-a2e6-00517066ad0f",
            //     FallID: "00000006",
            //     ProbeID: "01",
            //     Eingangsdatum: "2021-01-04T11:00:00+01:00",
            //     ZeitpunktProbeneingang: "2021-01-04T10:30:00+01:00",
            //     Probenart: "119342007",
            //     Screening: false,
            //     Material_l: "Salvia specimen (specimen)",
            //     Befund: true,
            //     Befundkommentar: "Kommentar 1",
            //     KeimID: "94500-6",
            //     Befunddatum: "2021-01-04T10:30:00+01:00",
            //   },
            //   {
            //     LabordatenID: "02",
            //     PatientID: "71d6b0a9-34b5-43be-a2e6-00517066ad0f",
            //     FallID: "00000006",
            //     ProbeID: "02",
            //     Eingangsdatum: "2021-01-09T11:00:00+01:00",
            //     ZeitpunktProbeneingang: "2021-01-09T10:30:00+01:00",
            //     Probenart: "119342007",
            //     Screening: false,
            //     Material_l: "Salvia specimen (specimen)",
            //     Befund: false,
            //     Befundkommentar: "Kommentar 1",
            //     KeimID: "94500-6",
            //     Befunddatum: "2021-01-09T10:30:00+01:00",
            //   },
            //   {
            //     LabordatenID: "01",
            //     PatientID: "23cdde3c-0e07-497d-bed4-fe9be5c6d166",
            //     FallID: "00000005",
            //     ProbeID: "01",
            //     Eingangsdatum: "2021-01-04T11:00:00+01:00",
            //     ZeitpunktProbeneingang: "2021-01-04T10:30:00+01:00",
            //     Probenart: "119342007",
            //     Screening: false,
            //     Material_l: "Salvia specimen (specimen)",
            //     Befund: true,
            //     Befundkommentar: "Kommentar 1",
            //     KeimID: "94500-6",
            //     Befunddatum: "2021-01-04T10:30:00+01:00",
            //   },
            //   {
            //     LabordatenID: "02",
            //     PatientID: "23cdde3c-0e07-497d-bed4-fe9be5c6d166",
            //     FallID: "00000005",
            //     ProbeID: "02",
            //     Eingangsdatum: "2021-01-08T11:00:00+01:00",
            //     ZeitpunktProbeneingang: "2021-01-08T10:30:00+01:00",
            //     Probenart: "119342007",
            //     Screening: false,
            //     Material_l: "Salvia specimen (specimen)",
            //     Befund: false,
            //     Befundkommentar: "Kommentar 1",
            //     KeimID: "94500-6",
            //     Befunddatum: "2021-01-08T10:30:00+01:00",
            //   },
            //   {
            //     LabordatenID: "01",
            //     PatientID: "786e3c35-32d3-403e-b2f3-532ed5e78e0c",
            //     FallID: "00000007",
            //     ProbeID: "01",
            //     Eingangsdatum: "2021-01-05T11:00:00+01:00",
            //     ZeitpunktProbeneingang: "2021-01-05T10:30:00+01:00",
            //     Probenart: "119342007",
            //     Screening: false,
            //     Material_l: "Salvia specimen (specimen)",
            //     Befund: true,
            //     Befundkommentar: "Kommentar 1",
            //     KeimID: "94500-6",
            //     Befunddatum: "2021-01-05T10:30:00+01:00",
            //   },
            //   {
            //     LabordatenID: "02",
            //     PatientID: "786e3c35-32d3-403e-b2f3-532ed5e78e0c",
            //     FallID: "00000007",
            //     ProbeID: "02",
            //     Eingangsdatum: "2021-01-09T11:00:00+01:00",
            //     ZeitpunktProbeneingang: "2021-01-09T10:30:00+01:00",
            //     Probenart: "119342007",
            //     Screening: false,
            //     Material_l: "Salvia specimen (specimen)",
            //     Befund: false,
            //     Befundkommentar: "Kommentar 1",
            //     KeimID: "94500-6",
            //     Befunddatum: "2021-01-09T10:30:00+01:00",
            //   },
            // ]
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
            var nodes = [];
            var links = [];
            // nodes = [
            //   {
            //     id: 62411,
            //     name: "P62411",
            //     infectionStates: ["statusHoltKeim", "statusKrank"],
            //     krankSeit: 1329782400000,
            //     index: 0,
            //     x: 301.36140600497407,
            //     y: 295.4941782487901,
            //     vy: -0.000153690684488412,
            //     vx: -0.000468263295139551,
            //   },
            //   {
            //     id: 63104,
            //     name: "P63104",
            //     infectionStates: ["statusHoltKeim", "statusTraeger", "statusKrank"],
            //     traegerSeit: 1328572800000,
            //     krankSeit: 1329177600000,
            //     index: 1,
            //     x: 304.73986022307236,
            //     y: 317.67447059512057,
            //     vy: -0.00006474368434483453,
            //     vx: -0.00020680156954801425,
            //   },
            //   {
            //     id: 63842,
            //     name: "P63842",
            //     infectionStates: ["statusHoltKeim", "statusTraeger", "statusKrank"],
            //     traegerSeit: 1327881600000,
            //     krankSeit: 1329782400000,
            //     index: 2,
            //     x: 319.6702689581378,
            //     y: 290.75612193516184,
            //     vy: 0.0002232866999310125,
            //     vx: -0.0005555171070168726,
            //   },
            //   {
            //     id: 64716,
            //     name: "P64716",
            //     infectionStates: ["statusHoltKeim", "statusTraeger", "statusKrank"],
            //     traegerSeit: 1328572800000,
            //     krankSeit: 1329782400000,
            //     index: 3,
            //     x: 335.01506011744345,
            //     y: 320.2613424198333,
            //     vy: 0.0000501530813957485,
            //     vx: -0.000039083269311904807,
            //   },
            //   {
            //     id: 67867,
            //     name: "P67867",
            //     infectionStates: ["statusHoltKeim", "statusKrank"],
            //     krankSeit: 1326931200000,
            //     index: 4,
            //     x: 284.4931948822117,
            //     y: 288.57382394545607,
            //     vy: -0.00013478717960187792,
            //     vx: -0.00024641209863588857,
            //   },
            //   {
            //     id: 68475,
            //     name: "P68475",
            //     infectionStates: ["statusHoltKeim", "statusKrank"],
            //     krankSeit: 1322092800000,
            //     index: 5,
            //     x: 343.8027280021645,
            //     y: 288.5201716858705,
            //     vy: -0.00005114385439489201,
            //     vx: -0.0003686979847042175,
            //   },
            //   {
            //     id: 70448,
            //     name: "P70448",
            //     infectionStates: ["statusHoltKeim", "statusTraeger"],
            //     traegerSeit: 1329177600000,
            //     index: 6,
            //     x: 316.9542365462891,
            //     y: 334.5652546639921,
            //     vy: -0.00012853970969834797,
            //     vx: -0.00024213241304932827,
            //   },
            //   {
            //     id: 76101,
            //     name: "P76101",
            //     infectionStates: ["statusHoltKeim", "statusKrank"],
            //     krankSeit: 1328486400000,
            //     index: 7,
            //     x: 320.86949133101933,
            //     y: 269.8378272524703,
            //     vy: 0.00012014433771040666,
            //     vx: 0.00043706819436035543,
            //   },
            //   {
            //     id: 113749,
            //     name: "P113749",
            //     infectionStates: ["statusHoltKeim", "statusKrank"],
            //     krankSeit: 1289952000000,
            //     index: 8,
            //     x: 341.0406972335478,
            //     y: 309.0114982556013,
            //     vy: -0.000143245491356989,
            //     vx: -0.0003916512921204337,
            //   },
            //   {
            //     id: 175082,
            //     name: "P175082",
            //     infectionStates: ["statusHoltKeim", "statusTraeger"],
            //     traegerSeit: 1331596800000,
            //     index: 9,
            //     x: 282.050692525735,
            //     y: 325.30502981887923,
            //     vy: 0.0000013876599708414128,
            //     vx: -0.0002826845692433017,
            //   },
            // ]
            // links = [
            //   {
            //     source: {
            //       id: 62411,
            //       name: "P62411",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1329782400000,
            //       index: 0,
            //       x: 301.36140600497407,
            //       y: 295.4941782487901,
            //       vy: -0.000153690684488412,
            //       vx: -0.000468263295139551,
            //     },
            //     target: {
            //       id: 63104,
            //       name: "P63104",
            //       infectionStates: ["statusHoltKeim", "statusTraeger", "statusKrank"],
            //       traegerSeit: 1328572800000,
            //       krankSeit: 1329177600000,
            //       index: 1,
            //       x: 304.73986022307236,
            //       y: 317.67447059512057,
            //       vy: -0.00006474368434483453,
            //       vx: -0.00020680156954801425,
            //     },
            //     contacts: [
            //       {
            //         source: 62411,
            //         target: 63104,
            //         stationID: 279,
            //         start_ts: 1327675156000,
            //         end_ts: 1327917806000,
            //         delete: true,
            //       },
            //       {
            //         source: 62411,
            //         target: 63104,
            //         stationID: 279,
            //         start_ts: 1328216039000,
            //         end_ts: 1335031380000,
            //         delete: true,
            //       },
            //       {
            //         source: 62411,
            //         target: 63104,
            //         stationID: 279,
            //         start_ts: 1335204180000,
            //         end_ts: 1335605580000,
            //         delete: true,
            //       },
            //     ],
            //     index: 0,
            //   },
            //   {
            //     source: {
            //       id: 62411,
            //       name: "P62411",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1329782400000,
            //       index: 0,
            //       x: 301.36140600497407,
            //       y: 295.4941782487901,
            //       vy: -0.000153690684488412,
            //       vx: -0.000468263295139551,
            //     },
            //     target: {
            //       id: 63842,
            //       name: "P63842",
            //       infectionStates: ["statusHoltKeim", "statusTraeger", "statusKrank"],
            //       traegerSeit: 1327881600000,
            //       krankSeit: 1329782400000,
            //       index: 2,
            //       x: 319.6702689581378,
            //       y: 290.75612193516184,
            //       vy: 0.0002232866999310125,
            //       vx: -0.0005555171070168726,
            //     },
            //     contacts: [
            //       {
            //         source: 62411,
            //         target: 63842,
            //         stationID: 279,
            //         start_ts: 1327675156000,
            //         end_ts: 1333704780000,
            //         delete: true,
            //       },
            //     ],
            //     index: 1,
            //   },
            //   {
            //     source: {
            //       id: 62411,
            //       name: "P62411",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1329782400000,
            //       index: 0,
            //       x: 301.36140600497407,
            //       y: 295.4941782487901,
            //       vy: -0.000153690684488412,
            //       vx: -0.000468263295139551,
            //     },
            //     target: {
            //       id: 64716,
            //       name: "P64716",
            //       infectionStates: ["statusHoltKeim", "statusTraeger", "statusKrank"],
            //       traegerSeit: 1328572800000,
            //       krankSeit: 1329782400000,
            //       index: 3,
            //       x: 335.01506011744345,
            //       y: 320.2613424198333,
            //       vy: 0.0000501530813957485,
            //       vx: -0.000039083269311904807,
            //     },
            //     contacts: [
            //       {
            //         source: 62411,
            //         target: 64716,
            //         stationID: 279,
            //         start_ts: 1327675156000,
            //         end_ts: 1330161333000,
            //         delete: true,
            //       },
            //       {
            //         source: 62411,
            //         target: 64716,
            //         stationID: 279,
            //         start_ts: 1330174990000,
            //         end_ts: 1331380278000,
            //         delete: true,
            //       },
            //     ],
            //     index: 2,
            //   },
            //   {
            //     source: {
            //       id: 62411,
            //       name: "P62411",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1329782400000,
            //       index: 0,
            //       x: 301.36140600497407,
            //       y: 295.4941782487901,
            //       vy: -0.000153690684488412,
            //       vx: -0.000468263295139551,
            //     },
            //     target: {
            //       id: 67867,
            //       name: "P67867",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1326931200000,
            //       index: 4,
            //       x: 284.4931948822117,
            //       y: 288.57382394545607,
            //       vy: -0.00013478717960187792,
            //       vx: -0.00024641209863588857,
            //     },
            //     contacts: [
            //       {
            //         source: 62411,
            //         target: 67867,
            //         stationID: 279,
            //         start_ts: 1327675156000,
            //         end_ts: 1331900819000,
            //         delete: true,
            //       },
            //     ],
            //     index: 3,
            //   },
            //   {
            //     source: {
            //       id: 62411,
            //       name: "P62411",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1329782400000,
            //       index: 0,
            //       x: 301.36140600497407,
            //       y: 295.4941782487901,
            //       vy: -0.000153690684488412,
            //       vx: -0.000468263295139551,
            //     },
            //     target: {
            //       id: 68475,
            //       name: "P68475",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1322092800000,
            //       index: 5,
            //       x: 343.8027280021645,
            //       y: 288.5201716858705,
            //       vy: -0.00005114385439489201,
            //       vx: -0.0003686979847042175,
            //     },
            //     contacts: [
            //       {
            //         source: 62411,
            //         target: 68475,
            //         stationID: 279,
            //         start_ts: 1327675156000,
            //         end_ts: 1330088345000,
            //         delete: true,
            //       },
            //     ],
            //     index: 4,
            //   },
            //   {
            //     source: {
            //       id: 62411,
            //       name: "P62411",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1329782400000,
            //       index: 0,
            //       x: 301.36140600497407,
            //       y: 295.4941782487901,
            //       vy: -0.000153690684488412,
            //       vx: -0.000468263295139551,
            //     },
            //     target: {
            //       id: 70448,
            //       name: "P70448",
            //       infectionStates: ["statusHoltKeim", "statusTraeger"],
            //       traegerSeit: 1329177600000,
            //       index: 6,
            //       x: 316.9542365462891,
            //       y: 334.5652546639921,
            //       vy: -0.00012853970969834797,
            //       vx: -0.00024213241304932827,
            //     },
            //     contacts: [
            //       {
            //         source: 62411,
            //         target: 70448,
            //         stationID: 279,
            //         start_ts: 1327675156000,
            //         end_ts: 1335031380000,
            //         delete: true,
            //       },
            //       {
            //         source: 62411,
            //         target: 70448,
            //         stationID: 279,
            //         start_ts: 1335204180000,
            //         end_ts: 1335632600000,
            //         delete: true,
            //       },
            //       {
            //         source: 62411,
            //         target: 70448,
            //         stationID: 279,
            //         start_ts: 1335816180000,
            //         end_ts: 1336240829000,
            //         delete: true,
            //       },
            //       {
            //         source: 62411,
            //         target: 70448,
            //         stationID: 279,
            //         start_ts: 1336420980000,
            //         end_ts: 1336842216000,
            //         delete: true,
            //       },
            //       {
            //         source: 62411,
            //         target: 70448,
            //         stationID: 279,
            //         start_ts: 1337025780000,
            //         end_ts: 1337446980000,
            //         delete: true,
            //       },
            //       {
            //         source: 62411,
            //         target: 70448,
            //         stationID: 279,
            //         start_ts: 1337630580000,
            //         end_ts: 1338562980000,
            //         delete: true,
            //       },
            //       {
            //         source: 62411,
            //         target: 70448,
            //         stationID: 279,
            //         start_ts: 1338840180000,
            //         end_ts: 1339862580000,
            //         delete: true,
            //       },
            //       {
            //         source: 62411,
            //         target: 70448,
            //         stationID: 279,
            //         start_ts: 1340049780000,
            //         end_ts: 1340384580000,
            //         delete: true,
            //       },
            //       {
            //         source: 62411,
            //         target: 70448,
            //         stationID: 279,
            //         start_ts: 1340784180000,
            //         end_ts: 1341673429000,
            //         delete: true,
            //       },
            //       {
            //         source: 62411,
            //         target: 70448,
            //         stationID: 279,
            //         start_ts: 1341939780000,
            //         end_ts: 1342279016000,
            //         delete: true,
            //       },
            //     ],
            //     index: 5,
            //   },
            //   {
            //     source: {
            //       id: 62411,
            //       name: "P62411",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1329782400000,
            //       index: 0,
            //       x: 301.36140600497407,
            //       y: 295.4941782487901,
            //       vy: -0.000153690684488412,
            //       vx: -0.000468263295139551,
            //     },
            //     target: {
            //       id: 76101,
            //       name: "P76101",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1328486400000,
            //       index: 7,
            //       x: 320.86949133101933,
            //       y: 269.8378272524703,
            //       vy: 0.00012014433771040666,
            //       vx: 0.00043706819436035543,
            //     },
            //     contacts: [
            //       {
            //         source: 62411,
            //         target: 76101,
            //         stationID: 279,
            //         start_ts: 1327675156000,
            //         end_ts: 1330515180000,
            //         delete: true,
            //       },
            //     ],
            //     index: 6,
            //   },
            //   {
            //     source: {
            //       id: 62411,
            //       name: "P62411",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1329782400000,
            //       index: 0,
            //       x: 301.36140600497407,
            //       y: 295.4941782487901,
            //       vy: -0.000153690684488412,
            //       vx: -0.000468263295139551,
            //     },
            //     target: {
            //       id: 113749,
            //       name: "P113749",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1289952000000,
            //       index: 8,
            //       x: 341.0406972335478,
            //       y: 309.0114982556013,
            //       vy: -0.000143245491356989,
            //       vx: -0.0003916512921204337,
            //     },
            //     contacts: [
            //       {
            //         source: 62411,
            //         target: 113749,
            //         stationID: 279,
            //         start_ts: 1331922169000,
            //         end_ts: 1335031380000,
            //         delete: true,
            //       },
            //       {
            //         source: 62411,
            //         target: 113749,
            //         stationID: 279,
            //         start_ts: 1335204180000,
            //         end_ts: 1335632600000,
            //         delete: true,
            //       },
            //       {
            //         source: 62411,
            //         target: 113749,
            //         stationID: 279,
            //         start_ts: 1335816180000,
            //         end_ts: 1336240829000,
            //         delete: true,
            //       },
            //       {
            //         source: 62411,
            //         target: 113749,
            //         stationID: 279,
            //         start_ts: 1336420980000,
            //         end_ts: 1336842216000,
            //         delete: true,
            //       },
            //       {
            //         source: 62411,
            //         target: 113749,
            //         stationID: 279,
            //         start_ts: 1337025780000,
            //         end_ts: 1337446980000,
            //         delete: true,
            //       },
            //       {
            //         source: 62411,
            //         target: 113749,
            //         stationID: 279,
            //         start_ts: 1337630580000,
            //         end_ts: 1338562980000,
            //         delete: true,
            //       },
            //       {
            //         source: 62411,
            //         target: 113749,
            //         stationID: 279,
            //         start_ts: 1338840180000,
            //         end_ts: 1339064977000,
            //         delete: true,
            //       },
            //     ],
            //     index: 7,
            //   },
            //   {
            //     source: {
            //       id: 62411,
            //       name: "P62411",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1329782400000,
            //       index: 0,
            //       x: 301.36140600497407,
            //       y: 295.4941782487901,
            //       vy: -0.000153690684488412,
            //       vx: -0.000468263295139551,
            //     },
            //     target: {
            //       id: 175082,
            //       name: "P175082",
            //       infectionStates: ["statusHoltKeim", "statusTraeger"],
            //       traegerSeit: 1331596800000,
            //       index: 9,
            //       x: 282.050692525735,
            //       y: 325.30502981887923,
            //       vy: 0.0000013876599708414128,
            //       vx: -0.0002826845692433017,
            //     },
            //     contacts: [
            //       {
            //         source: 62411,
            //         target: 175082,
            //         stationID: 279,
            //         start_ts: 1331833782000,
            //         end_ts: 1334747629000,
            //         delete: true,
            //       },
            //     ],
            //     index: 8,
            //   },
            //   {
            //     source: {
            //       id: 63104,
            //       name: "P63104",
            //       infectionStates: ["statusHoltKeim", "statusTraeger", "statusKrank"],
            //       traegerSeit: 1328572800000,
            //       krankSeit: 1329177600000,
            //       index: 1,
            //       x: 304.73986022307236,
            //       y: 317.67447059512057,
            //       vy: -0.00006474368434483453,
            //       vx: -0.00020680156954801425,
            //     },
            //     target: {
            //       id: 63842,
            //       name: "P63842",
            //       infectionStates: ["statusHoltKeim", "statusTraeger", "statusKrank"],
            //       traegerSeit: 1327881600000,
            //       krankSeit: 1329782400000,
            //       index: 2,
            //       x: 319.6702689581378,
            //       y: 290.75612193516184,
            //       vy: 0.0002232866999310125,
            //       vx: -0.0005555171070168726,
            //     },
            //     contacts: [
            //       {
            //         source: 63104,
            //         target: 63842,
            //         stationID: 279,
            //         start_ts: 1326881713000,
            //         end_ts: 1327002834000,
            //         delete: true,
            //       },
            //       {
            //         source: 63104,
            //         target: 63842,
            //         stationID: 279,
            //         start_ts: 1327070214000,
            //         end_ts: 1327102106000,
            //         delete: true,
            //       },
            //       {
            //         source: 63104,
            //         target: 63842,
            //         stationID: 279,
            //         start_ts: 1327155499000,
            //         end_ts: 1327917806000,
            //         delete: true,
            //       },
            //       {
            //         source: 63104,
            //         target: 63842,
            //         stationID: 279,
            //         start_ts: 1328216039000,
            //         end_ts: 1333704780000,
            //         delete: true,
            //       },
            //     ],
            //     index: 9,
            //   },
            //   {
            //     source: {
            //       id: 63104,
            //       name: "P63104",
            //       infectionStates: ["statusHoltKeim", "statusTraeger", "statusKrank"],
            //       traegerSeit: 1328572800000,
            //       krankSeit: 1329177600000,
            //       index: 1,
            //       x: 304.73986022307236,
            //       y: 317.67447059512057,
            //       vy: -0.00006474368434483453,
            //       vx: -0.00020680156954801425,
            //     },
            //     target: {
            //       id: 64716,
            //       name: "P64716",
            //       infectionStates: ["statusHoltKeim", "statusTraeger", "statusKrank"],
            //       traegerSeit: 1328572800000,
            //       krankSeit: 1329782400000,
            //       index: 3,
            //       x: 335.01506011744345,
            //       y: 320.2613424198333,
            //       vy: 0.0000501530813957485,
            //       vx: -0.000039083269311904807,
            //     },
            //     contacts: [
            //       {
            //         source: 63104,
            //         target: 64716,
            //         stationID: 279,
            //         start_ts: 1326881713000,
            //         end_ts: 1327917806000,
            //         delete: true,
            //       },
            //       {
            //         source: 63104,
            //         target: 64716,
            //         stationID: 279,
            //         start_ts: 1328216039000,
            //         end_ts: 1330161333000,
            //         delete: true,
            //       },
            //       {
            //         source: 63104,
            //         target: 64716,
            //         stationID: 279,
            //         start_ts: 1330174990000,
            //         end_ts: 1331380278000,
            //         delete: true,
            //       },
            //     ],
            //     index: 10,
            //   },
            //   {
            //     source: {
            //       id: 63104,
            //       name: "P63104",
            //       infectionStates: ["statusHoltKeim", "statusTraeger", "statusKrank"],
            //       traegerSeit: 1328572800000,
            //       krankSeit: 1329177600000,
            //       index: 1,
            //       x: 304.73986022307236,
            //       y: 317.67447059512057,
            //       vy: -0.00006474368434483453,
            //       vx: -0.00020680156954801425,
            //     },
            //     target: {
            //       id: 67867,
            //       name: "P67867",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1326931200000,
            //       index: 4,
            //       x: 284.4931948822117,
            //       y: 288.57382394545607,
            //       vy: -0.00013478717960187792,
            //       vx: -0.00024641209863588857,
            //     },
            //     contacts: [
            //       {
            //         source: 63104,
            //         target: 67867,
            //         stationID: 279,
            //         start_ts: 1326881713000,
            //         end_ts: 1327917806000,
            //         delete: true,
            //       },
            //       {
            //         source: 63104,
            //         target: 67867,
            //         stationID: 279,
            //         start_ts: 1328216039000,
            //         end_ts: 1331900819000,
            //         delete: true,
            //       },
            //     ],
            //     index: 11,
            //   },
            //   {
            //     source: {
            //       id: 63104,
            //       name: "P63104",
            //       infectionStates: ["statusHoltKeim", "statusTraeger", "statusKrank"],
            //       traegerSeit: 1328572800000,
            //       krankSeit: 1329177600000,
            //       index: 1,
            //       x: 304.73986022307236,
            //       y: 317.67447059512057,
            //       vy: -0.00006474368434483453,
            //       vx: -0.00020680156954801425,
            //     },
            //     target: {
            //       id: 68475,
            //       name: "P68475",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1322092800000,
            //       index: 5,
            //       x: 343.8027280021645,
            //       y: 288.5201716858705,
            //       vy: -0.00005114385439489201,
            //       vx: -0.0003686979847042175,
            //     },
            //     contacts: [
            //       {
            //         source: 63104,
            //         target: 68475,
            //         stationID: 279,
            //         start_ts: 1326881713000,
            //         end_ts: 1327917806000,
            //         delete: true,
            //       },
            //       {
            //         source: 63104,
            //         target: 68475,
            //         stationID: 279,
            //         start_ts: 1328216039000,
            //         end_ts: 1330088345000,
            //         delete: true,
            //       },
            //     ],
            //     index: 12,
            //   },
            //   {
            //     source: {
            //       id: 63104,
            //       name: "P63104",
            //       infectionStates: ["statusHoltKeim", "statusTraeger", "statusKrank"],
            //       traegerSeit: 1328572800000,
            //       krankSeit: 1329177600000,
            //       index: 1,
            //       x: 304.73986022307236,
            //       y: 317.67447059512057,
            //       vy: -0.00006474368434483453,
            //       vx: -0.00020680156954801425,
            //     },
            //     target: {
            //       id: 70448,
            //       name: "P70448",
            //       infectionStates: ["statusHoltKeim", "statusTraeger"],
            //       traegerSeit: 1329177600000,
            //       index: 6,
            //       x: 316.9542365462891,
            //       y: 334.5652546639921,
            //       vy: -0.00012853970969834797,
            //       vx: -0.00024213241304932827,
            //     },
            //     contacts: [
            //       {
            //         source: 63104,
            //         target: 70448,
            //         stationID: 279,
            //         start_ts: 1326881713000,
            //         end_ts: 1327917806000,
            //         delete: true,
            //       },
            //       {
            //         source: 63104,
            //         target: 70448,
            //         stationID: 279,
            //         start_ts: 1328216039000,
            //         end_ts: 1335605580000,
            //         delete: true,
            //       },
            //     ],
            //     index: 13,
            //   },
            //   {
            //     source: {
            //       id: 63104,
            //       name: "P63104",
            //       infectionStates: ["statusHoltKeim", "statusTraeger", "statusKrank"],
            //       traegerSeit: 1328572800000,
            //       krankSeit: 1329177600000,
            //       index: 1,
            //       x: 304.73986022307236,
            //       y: 317.67447059512057,
            //       vy: -0.00006474368434483453,
            //       vx: -0.00020680156954801425,
            //     },
            //     target: {
            //       id: 76101,
            //       name: "P76101",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1328486400000,
            //       index: 7,
            //       x: 320.86949133101933,
            //       y: 269.8378272524703,
            //       vy: 0.00012014433771040666,
            //       vx: 0.00043706819436035543,
            //     },
            //     contacts: [
            //       {
            //         source: 63104,
            //         target: 76101,
            //         stationID: 279,
            //         start_ts: 1326881713000,
            //         end_ts: 1327917806000,
            //         delete: true,
            //       },
            //       {
            //         source: 63104,
            //         target: 76101,
            //         stationID: 279,
            //         start_ts: 1328216039000,
            //         end_ts: 1330515180000,
            //         delete: true,
            //       },
            //     ],
            //     index: 14,
            //   },
            //   {
            //     source: {
            //       id: 63104,
            //       name: "P63104",
            //       infectionStates: ["statusHoltKeim", "statusTraeger", "statusKrank"],
            //       traegerSeit: 1328572800000,
            //       krankSeit: 1329177600000,
            //       index: 1,
            //       x: 304.73986022307236,
            //       y: 317.67447059512057,
            //       vy: -0.00006474368434483453,
            //       vx: -0.00020680156954801425,
            //     },
            //     target: {
            //       id: 113749,
            //       name: "P113749",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1289952000000,
            //       index: 8,
            //       x: 341.0406972335478,
            //       y: 309.0114982556013,
            //       vy: -0.000143245491356989,
            //       vx: -0.0003916512921204337,
            //     },
            //     contacts: [
            //       {
            //         source: 63104,
            //         target: 113749,
            //         stationID: 279,
            //         start_ts: 1331922169000,
            //         end_ts: 1335605580000,
            //         delete: true,
            //       },
            //     ],
            //     index: 15,
            //   },
            //   {
            //     source: {
            //       id: 63104,
            //       name: "P63104",
            //       infectionStates: ["statusHoltKeim", "statusTraeger", "statusKrank"],
            //       traegerSeit: 1328572800000,
            //       krankSeit: 1329177600000,
            //       index: 1,
            //       x: 304.73986022307236,
            //       y: 317.67447059512057,
            //       vy: -0.00006474368434483453,
            //       vx: -0.00020680156954801425,
            //     },
            //     target: {
            //       id: 175082,
            //       name: "P175082",
            //       infectionStates: ["statusHoltKeim", "statusTraeger"],
            //       traegerSeit: 1331596800000,
            //       index: 9,
            //       x: 282.050692525735,
            //       y: 325.30502981887923,
            //       vy: 0.0000013876599708414128,
            //       vx: -0.0002826845692433017,
            //     },
            //     contacts: [
            //       {
            //         source: 63104,
            //         target: 175082,
            //         stationID: 279,
            //         start_ts: 1331833782000,
            //         end_ts: 1334747629000,
            //         delete: true,
            //       },
            //     ],
            //     index: 16,
            //   },
            //   {
            //     source: {
            //       id: 63842,
            //       name: "P63842",
            //       infectionStates: ["statusHoltKeim", "statusTraeger", "statusKrank"],
            //       traegerSeit: 1327881600000,
            //       krankSeit: 1329782400000,
            //       index: 2,
            //       x: 319.6702689581378,
            //       y: 290.75612193516184,
            //       vy: 0.0002232866999310125,
            //       vx: -0.0005555171070168726,
            //     },
            //     target: {
            //       id: 64716,
            //       name: "P64716",
            //       infectionStates: ["statusHoltKeim", "statusTraeger", "statusKrank"],
            //       traegerSeit: 1328572800000,
            //       krankSeit: 1329782400000,
            //       index: 3,
            //       x: 335.01506011744345,
            //       y: 320.2613424198333,
            //       vy: 0.0000501530813957485,
            //       vx: -0.000039083269311904807,
            //     },
            //     contacts: [
            //       {
            //         source: 63842,
            //         target: 64716,
            //         stationID: 279,
            //         start_ts: 1325848799000,
            //         end_ts: 1327002834000,
            //         delete: true,
            //       },
            //       {
            //         source: 63842,
            //         target: 64716,
            //         stationID: 279,
            //         start_ts: 1327070214000,
            //         end_ts: 1327102106000,
            //         delete: true,
            //       },
            //       {
            //         source: 63842,
            //         target: 64716,
            //         stationID: 279,
            //         start_ts: 1327155499000,
            //         end_ts: 1330161333000,
            //         delete: true,
            //       },
            //       {
            //         source: 63842,
            //         target: 64716,
            //         stationID: 279,
            //         start_ts: 1330174990000,
            //         end_ts: 1331380278000,
            //         delete: true,
            //       },
            //     ],
            //     index: 17,
            //   },
            //   {
            //     source: {
            //       id: 63842,
            //       name: "P63842",
            //       infectionStates: ["statusHoltKeim", "statusTraeger", "statusKrank"],
            //       traegerSeit: 1327881600000,
            //       krankSeit: 1329782400000,
            //       index: 2,
            //       x: 319.6702689581378,
            //       y: 290.75612193516184,
            //       vy: 0.0002232866999310125,
            //       vx: -0.0005555171070168726,
            //     },
            //     target: {
            //       id: 67867,
            //       name: "P67867",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1326931200000,
            //       index: 4,
            //       x: 284.4931948822117,
            //       y: 288.57382394545607,
            //       vy: -0.00013478717960187792,
            //       vx: -0.00024641209863588857,
            //     },
            //     contacts: [
            //       {
            //         source: 63842,
            //         target: 67867,
            //         stationID: 279,
            //         start_ts: 1325848799000,
            //         end_ts: 1327002834000,
            //         delete: true,
            //       },
            //       {
            //         source: 63842,
            //         target: 67867,
            //         stationID: 279,
            //         start_ts: 1327070214000,
            //         end_ts: 1327102106000,
            //         delete: true,
            //       },
            //       {
            //         source: 63842,
            //         target: 67867,
            //         stationID: 279,
            //         start_ts: 1327155499000,
            //         end_ts: 1331900819000,
            //         delete: true,
            //       },
            //     ],
            //     index: 18,
            //   },
            //   {
            //     source: {
            //       id: 63842,
            //       name: "P63842",
            //       infectionStates: ["statusHoltKeim", "statusTraeger", "statusKrank"],
            //       traegerSeit: 1327881600000,
            //       krankSeit: 1329782400000,
            //       index: 2,
            //       x: 319.6702689581378,
            //       y: 290.75612193516184,
            //       vy: 0.0002232866999310125,
            //       vx: -0.0005555171070168726,
            //     },
            //     target: {
            //       id: 68475,
            //       name: "P68475",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1322092800000,
            //       index: 5,
            //       x: 343.8027280021645,
            //       y: 288.5201716858705,
            //       vy: -0.00005114385439489201,
            //       vx: -0.0003686979847042175,
            //     },
            //     contacts: [
            //       {
            //         source: 63842,
            //         target: 68475,
            //         stationID: 279,
            //         start_ts: 1325848799000,
            //         end_ts: 1327002834000,
            //         delete: true,
            //       },
            //       {
            //         source: 63842,
            //         target: 68475,
            //         stationID: 279,
            //         start_ts: 1327070214000,
            //         end_ts: 1327102106000,
            //         delete: true,
            //       },
            //       {
            //         source: 63842,
            //         target: 68475,
            //         stationID: 279,
            //         start_ts: 1327155499000,
            //         end_ts: 1330088345000,
            //         delete: true,
            //       },
            //     ],
            //     index: 19,
            //   },
            //   {
            //     source: {
            //       id: 63842,
            //       name: "P63842",
            //       infectionStates: ["statusHoltKeim", "statusTraeger", "statusKrank"],
            //       traegerSeit: 1327881600000,
            //       krankSeit: 1329782400000,
            //       index: 2,
            //       x: 319.6702689581378,
            //       y: 290.75612193516184,
            //       vy: 0.0002232866999310125,
            //       vx: -0.0005555171070168726,
            //     },
            //     target: {
            //       id: 70448,
            //       name: "P70448",
            //       infectionStates: ["statusHoltKeim", "statusTraeger"],
            //       traegerSeit: 1329177600000,
            //       index: 6,
            //       x: 316.9542365462891,
            //       y: 334.5652546639921,
            //       vy: -0.00012853970969834797,
            //       vx: -0.00024213241304932827,
            //     },
            //     contacts: [
            //       {
            //         source: 63842,
            //         target: 70448,
            //         stationID: 279,
            //         start_ts: 1325848799000,
            //         end_ts: 1327002834000,
            //         delete: true,
            //       },
            //       {
            //         source: 63842,
            //         target: 70448,
            //         stationID: 279,
            //         start_ts: 1327070214000,
            //         end_ts: 1327102106000,
            //         delete: true,
            //       },
            //       {
            //         source: 63842,
            //         target: 70448,
            //         stationID: 279,
            //         start_ts: 1327155499000,
            //         end_ts: 1333704780000,
            //         delete: true,
            //       },
            //     ],
            //     index: 20,
            //   },
            //   {
            //     source: {
            //       id: 63842,
            //       name: "P63842",
            //       infectionStates: ["statusHoltKeim", "statusTraeger", "statusKrank"],
            //       traegerSeit: 1327881600000,
            //       krankSeit: 1329782400000,
            //       index: 2,
            //       x: 319.6702689581378,
            //       y: 290.75612193516184,
            //       vy: 0.0002232866999310125,
            //       vx: -0.0005555171070168726,
            //     },
            //     target: {
            //       id: 76101,
            //       name: "P76101",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1328486400000,
            //       index: 7,
            //       x: 320.86949133101933,
            //       y: 269.8378272524703,
            //       vy: 0.00012014433771040666,
            //       vx: 0.00043706819436035543,
            //     },
            //     contacts: [
            //       {
            //         source: 63842,
            //         target: 76101,
            //         stationID: 279,
            //         start_ts: 1325848799000,
            //         end_ts: 1327002834000,
            //         delete: true,
            //       },
            //       {
            //         source: 63842,
            //         target: 76101,
            //         stationID: 279,
            //         start_ts: 1327070214000,
            //         end_ts: 1327102106000,
            //         delete: true,
            //       },
            //       {
            //         source: 63842,
            //         target: 76101,
            //         stationID: 279,
            //         start_ts: 1327155499000,
            //         end_ts: 1330515180000,
            //         delete: true,
            //       },
            //     ],
            //     index: 21,
            //   },
            //   {
            //     source: {
            //       id: 63842,
            //       name: "P63842",
            //       infectionStates: ["statusHoltKeim", "statusTraeger", "statusKrank"],
            //       traegerSeit: 1327881600000,
            //       krankSeit: 1329782400000,
            //       index: 2,
            //       x: 319.6702689581378,
            //       y: 290.75612193516184,
            //       vy: 0.0002232866999310125,
            //       vx: -0.0005555171070168726,
            //     },
            //     target: {
            //       id: 113749,
            //       name: "P113749",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1289952000000,
            //       index: 8,
            //       x: 341.0406972335478,
            //       y: 309.0114982556013,
            //       vy: -0.000143245491356989,
            //       vx: -0.0003916512921204337,
            //     },
            //     contacts: [
            //       {
            //         source: 63842,
            //         target: 113749,
            //         stationID: 279,
            //         start_ts: 1331922169000,
            //         end_ts: 1333704780000,
            //         delete: true,
            //       },
            //     ],
            //     index: 22,
            //   },
            //   {
            //     source: {
            //       id: 63842,
            //       name: "P63842",
            //       infectionStates: ["statusHoltKeim", "statusTraeger", "statusKrank"],
            //       traegerSeit: 1327881600000,
            //       krankSeit: 1329782400000,
            //       index: 2,
            //       x: 319.6702689581378,
            //       y: 290.75612193516184,
            //       vy: 0.0002232866999310125,
            //       vx: -0.0005555171070168726,
            //     },
            //     target: {
            //       id: 175082,
            //       name: "P175082",
            //       infectionStates: ["statusHoltKeim", "statusTraeger"],
            //       traegerSeit: 1331596800000,
            //       index: 9,
            //       x: 282.050692525735,
            //       y: 325.30502981887923,
            //       vy: 0.0000013876599708414128,
            //       vx: -0.0002826845692433017,
            //     },
            //     contacts: [
            //       {
            //         source: 63842,
            //         target: 175082,
            //         stationID: 279,
            //         start_ts: 1331833782000,
            //         end_ts: 1333704780000,
            //         delete: true,
            //       },
            //     ],
            //     index: 23,
            //   },
            //   {
            //     source: {
            //       id: 64716,
            //       name: "P64716",
            //       infectionStates: ["statusHoltKeim", "statusTraeger", "statusKrank"],
            //       traegerSeit: 1328572800000,
            //       krankSeit: 1329782400000,
            //       index: 3,
            //       x: 335.01506011744345,
            //       y: 320.2613424198333,
            //       vy: 0.0000501530813957485,
            //       vx: -0.000039083269311904807,
            //     },
            //     target: {
            //       id: 67867,
            //       name: "P67867",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1326931200000,
            //       index: 4,
            //       x: 284.4931948822117,
            //       y: 288.57382394545607,
            //       vy: -0.00013478717960187792,
            //       vx: -0.00024641209863588857,
            //     },
            //     contacts: [
            //       {
            //         source: 64716,
            //         target: 67867,
            //         stationID: 279,
            //         start_ts: 1324641496000,
            //         end_ts: 1330161333000,
            //         delete: true,
            //       },
            //       {
            //         source: 64716,
            //         target: 67867,
            //         stationID: 279,
            //         start_ts: 1330174990000,
            //         end_ts: 1331380278000,
            //         delete: true,
            //       },
            //     ],
            //     index: 24,
            //   },
            //   {
            //     source: {
            //       id: 64716,
            //       name: "P64716",
            //       infectionStates: ["statusHoltKeim", "statusTraeger", "statusKrank"],
            //       traegerSeit: 1328572800000,
            //       krankSeit: 1329782400000,
            //       index: 3,
            //       x: 335.01506011744345,
            //       y: 320.2613424198333,
            //       vy: 0.0000501530813957485,
            //       vx: -0.000039083269311904807,
            //     },
            //     target: {
            //       id: 68475,
            //       name: "P68475",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1322092800000,
            //       index: 5,
            //       x: 343.8027280021645,
            //       y: 288.5201716858705,
            //       vy: -0.00005114385439489201,
            //       vx: -0.0003686979847042175,
            //     },
            //     contacts: [
            //       {
            //         source: 64716,
            //         target: 68475,
            //         stationID: 279,
            //         start_ts: 1324641496000,
            //         end_ts: 1330088345000,
            //         delete: true,
            //       },
            //     ],
            //     index: 25,
            //   },
            //   {
            //     source: {
            //       id: 64716,
            //       name: "P64716",
            //       infectionStates: ["statusHoltKeim", "statusTraeger", "statusKrank"],
            //       traegerSeit: 1328572800000,
            //       krankSeit: 1329782400000,
            //       index: 3,
            //       x: 335.01506011744345,
            //       y: 320.2613424198333,
            //       vy: 0.0000501530813957485,
            //       vx: -0.000039083269311904807,
            //     },
            //     target: {
            //       id: 70448,
            //       name: "P70448",
            //       infectionStates: ["statusHoltKeim", "statusTraeger"],
            //       traegerSeit: 1329177600000,
            //       index: 6,
            //       x: 316.9542365462891,
            //       y: 334.5652546639921,
            //       vy: -0.00012853970969834797,
            //       vx: -0.00024213241304932827,
            //     },
            //     contacts: [
            //       {
            //         source: 64716,
            //         target: 70448,
            //         stationID: 279,
            //         start_ts: 1324641496000,
            //         end_ts: 1330161333000,
            //         delete: true,
            //       },
            //       {
            //         source: 64716,
            //         target: 70448,
            //         stationID: 279,
            //         start_ts: 1330174990000,
            //         end_ts: 1331380278000,
            //         delete: true,
            //       },
            //     ],
            //     index: 26,
            //   },
            //   {
            //     source: {
            //       id: 64716,
            //       name: "P64716",
            //       infectionStates: ["statusHoltKeim", "statusTraeger", "statusKrank"],
            //       traegerSeit: 1328572800000,
            //       krankSeit: 1329782400000,
            //       index: 3,
            //       x: 335.01506011744345,
            //       y: 320.2613424198333,
            //       vy: 0.0000501530813957485,
            //       vx: -0.000039083269311904807,
            //     },
            //     target: {
            //       id: 76101,
            //       name: "P76101",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1328486400000,
            //       index: 7,
            //       x: 320.86949133101933,
            //       y: 269.8378272524703,
            //       vy: 0.00012014433771040666,
            //       vx: 0.00043706819436035543,
            //     },
            //     contacts: [
            //       {
            //         source: 64716,
            //         target: 76101,
            //         stationID: 279,
            //         start_ts: 1324641496000,
            //         end_ts: 1330161333000,
            //         delete: true,
            //       },
            //       {
            //         source: 64716,
            //         target: 76101,
            //         stationID: 279,
            //         start_ts: 1330174990000,
            //         end_ts: 1330515180000,
            //         delete: true,
            //       },
            //     ],
            //     index: 27,
            //   },
            //   {
            //     source: {
            //       id: 67867,
            //       name: "P67867",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1326931200000,
            //       index: 4,
            //       x: 284.4931948822117,
            //       y: 288.57382394545607,
            //       vy: -0.00013478717960187792,
            //       vx: -0.00024641209863588857,
            //     },
            //     target: {
            //       id: 68475,
            //       name: "P68475",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1322092800000,
            //       index: 5,
            //       x: 343.8027280021645,
            //       y: 288.5201716858705,
            //       vy: -0.00005114385439489201,
            //       vx: -0.0003686979847042175,
            //     },
            //     contacts: [
            //       {
            //         source: 67867,
            //         target: 68475,
            //         stationID: 279,
            //         start_ts: 1322576514000,
            //         end_ts: 1330088345000,
            //         delete: true,
            //       },
            //     ],
            //     index: 28,
            //   },
            //   {
            //     source: {
            //       id: 67867,
            //       name: "P67867",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1326931200000,
            //       index: 4,
            //       x: 284.4931948822117,
            //       y: 288.57382394545607,
            //       vy: -0.00013478717960187792,
            //       vx: -0.00024641209863588857,
            //     },
            //     target: {
            //       id: 70448,
            //       name: "P70448",
            //       infectionStates: ["statusHoltKeim", "statusTraeger"],
            //       traegerSeit: 1329177600000,
            //       index: 6,
            //       x: 316.9542365462891,
            //       y: 334.5652546639921,
            //       vy: -0.00012853970969834797,
            //       vx: -0.00024213241304932827,
            //     },
            //     contacts: [
            //       {
            //         source: 67867,
            //         target: 70448,
            //         stationID: 279,
            //         start_ts: 1322576514000,
            //         end_ts: 1331900819000,
            //         delete: true,
            //       },
            //     ],
            //     index: 29,
            //   },
            //   {
            //     source: {
            //       id: 67867,
            //       name: "P67867",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1326931200000,
            //       index: 4,
            //       x: 284.4931948822117,
            //       y: 288.57382394545607,
            //       vy: -0.00013478717960187792,
            //       vx: -0.00024641209863588857,
            //     },
            //     target: {
            //       id: 76101,
            //       name: "P76101",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1328486400000,
            //       index: 7,
            //       x: 320.86949133101933,
            //       y: 269.8378272524703,
            //       vy: 0.00012014433771040666,
            //       vx: 0.00043706819436035543,
            //     },
            //     contacts: [
            //       {
            //         source: 67867,
            //         target: 76101,
            //         stationID: 279,
            //         start_ts: 1322576514000,
            //         end_ts: 1322661781000,
            //         delete: true,
            //       },
            //       {
            //         source: 67867,
            //         target: 76101,
            //         stationID: 279,
            //         start_ts: 1322671974000,
            //         end_ts: 1330515180000,
            //         delete: true,
            //       },
            //     ],
            //     index: 30,
            //   },
            //   {
            //     source: {
            //       id: 67867,
            //       name: "P67867",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1326931200000,
            //       index: 4,
            //       x: 284.4931948822117,
            //       y: 288.57382394545607,
            //       vy: -0.00013478717960187792,
            //       vx: -0.00024641209863588857,
            //     },
            //     target: {
            //       id: 175082,
            //       name: "P175082",
            //       infectionStates: ["statusHoltKeim", "statusTraeger"],
            //       traegerSeit: 1331596800000,
            //       index: 9,
            //       x: 282.050692525735,
            //       y: 325.30502981887923,
            //       vy: 0.0000013876599708414128,
            //       vx: -0.0002826845692433017,
            //     },
            //     contacts: [
            //       {
            //         source: 67867,
            //         target: 175082,
            //         stationID: 279,
            //         start_ts: 1331833782000,
            //         end_ts: 1331900819000,
            //         delete: true,
            //       },
            //     ],
            //     index: 31,
            //   },
            //   {
            //     source: {
            //       id: 68475,
            //       name: "P68475",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1322092800000,
            //       index: 5,
            //       x: 343.8027280021645,
            //       y: 288.5201716858705,
            //       vy: -0.00005114385439489201,
            //       vx: -0.0003686979847042175,
            //     },
            //     target: {
            //       id: 70448,
            //       name: "P70448",
            //       infectionStates: ["statusHoltKeim", "statusTraeger"],
            //       traegerSeit: 1329177600000,
            //       index: 6,
            //       x: 316.9542365462891,
            //       y: 334.5652546639921,
            //       vy: -0.00012853970969834797,
            //       vx: -0.00024213241304932827,
            //     },
            //     contacts: [
            //       {
            //         source: 68475,
            //         target: 70448,
            //         stationID: 279,
            //         start_ts: 1319708940000,
            //         end_ts: 1330088345000,
            //         delete: true,
            //       },
            //     ],
            //     index: 32,
            //   },
            //   {
            //     source: {
            //       id: 68475,
            //       name: "P68475",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1322092800000,
            //       index: 5,
            //       x: 343.8027280021645,
            //       y: 288.5201716858705,
            //       vy: -0.00005114385439489201,
            //       vx: -0.0003686979847042175,
            //     },
            //     target: {
            //       id: 76101,
            //       name: "P76101",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1328486400000,
            //       index: 7,
            //       x: 320.86949133101933,
            //       y: 269.8378272524703,
            //       vy: 0.00012014433771040666,
            //       vx: 0.00043706819436035543,
            //     },
            //     contacts: [
            //       {
            //         source: 68475,
            //         target: 76101,
            //         stationID: 279,
            //         start_ts: 1319708940000,
            //         end_ts: 1320493718000,
            //         delete: true,
            //       },
            //       {
            //         source: 68475,
            //         target: 76101,
            //         stationID: 279,
            //         start_ts: 1320503414000,
            //         end_ts: 1322661781000,
            //         delete: true,
            //       },
            //       {
            //         source: 68475,
            //         target: 76101,
            //         stationID: 279,
            //         start_ts: 1322671974000,
            //         end_ts: 1330088345000,
            //         delete: true,
            //       },
            //     ],
            //     index: 33,
            //   },
            //   {
            //     source: {
            //       id: 70448,
            //       name: "P70448",
            //       infectionStates: ["statusHoltKeim", "statusTraeger"],
            //       traegerSeit: 1329177600000,
            //       index: 6,
            //       x: 316.9542365462891,
            //       y: 334.5652546639921,
            //       vy: -0.00012853970969834797,
            //       vx: -0.00024213241304932827,
            //     },
            //     target: {
            //       id: 76101,
            //       name: "P76101",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1328486400000,
            //       index: 7,
            //       x: 320.86949133101933,
            //       y: 269.8378272524703,
            //       vy: 0.00012014433771040666,
            //       vx: 0.00043706819436035543,
            //     },
            //     contacts: [
            //       {
            //         source: 70448,
            //         target: 76101,
            //         stationID: 279,
            //         start_ts: 1317387544000,
            //         end_ts: 1320493718000,
            //         delete: true,
            //       },
            //       {
            //         source: 70448,
            //         target: 76101,
            //         stationID: 279,
            //         start_ts: 1320503414000,
            //         end_ts: 1322661781000,
            //         delete: true,
            //       },
            //       {
            //         source: 70448,
            //         target: 76101,
            //         stationID: 279,
            //         start_ts: 1322671974000,
            //         end_ts: 1330515180000,
            //         delete: true,
            //       },
            //     ],
            //     index: 34,
            //   },
            //   {
            //     source: {
            //       id: 70448,
            //       name: "P70448",
            //       infectionStates: ["statusHoltKeim", "statusTraeger"],
            //       traegerSeit: 1329177600000,
            //       index: 6,
            //       x: 316.9542365462891,
            //       y: 334.5652546639921,
            //       vy: -0.00012853970969834797,
            //       vx: -0.00024213241304932827,
            //     },
            //     target: {
            //       id: 113749,
            //       name: "P113749",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1289952000000,
            //       index: 8,
            //       x: 341.0406972335478,
            //       y: 309.0114982556013,
            //       vy: -0.000143245491356989,
            //       vx: -0.0003916512921204337,
            //     },
            //     contacts: [
            //       {
            //         source: 70448,
            //         target: 113749,
            //         stationID: 279,
            //         start_ts: 1331922169000,
            //         end_ts: 1339064977000,
            //         delete: true,
            //       },
            //     ],
            //     index: 35,
            //   },
            //   {
            //     source: {
            //       id: 70448,
            //       name: "P70448",
            //       infectionStates: ["statusHoltKeim", "statusTraeger"],
            //       traegerSeit: 1329177600000,
            //       index: 6,
            //       x: 316.9542365462891,
            //       y: 334.5652546639921,
            //       vy: -0.00012853970969834797,
            //       vx: -0.00024213241304932827,
            //     },
            //     target: {
            //       id: 175082,
            //       name: "P175082",
            //       infectionStates: ["statusHoltKeim", "statusTraeger"],
            //       traegerSeit: 1331596800000,
            //       index: 9,
            //       x: 282.050692525735,
            //       y: 325.30502981887923,
            //       vy: 0.0000013876599708414128,
            //       vx: -0.0002826845692433017,
            //     },
            //     contacts: [
            //       {
            //         source: 70448,
            //         target: 175082,
            //         stationID: 279,
            //         start_ts: 1331833782000,
            //         end_ts: 1334747629000,
            //         delete: true,
            //       },
            //     ],
            //     index: 36,
            //   },
            //   {
            //     source: {
            //       id: 76101,
            //       name: "P76101",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1328486400000,
            //       index: 7,
            //       x: 320.86949133101933,
            //       y: 269.8378272524703,
            //       vy: 0.00012014433771040666,
            //       vx: 0.00043706819436035543,
            //     },
            //     target: {
            //       id: 113749,
            //       name: "P113749",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1289952000000,
            //       index: 8,
            //       x: 341.0406972335478,
            //       y: 309.0114982556013,
            //       vy: -0.000143245491356989,
            //       vx: -0.0003916512921204337,
            //     },
            //     contacts: [
            //       {
            //         source: 76101,
            //         target: 113749,
            //         stationID: 295,
            //         start_ts: 1320493718000,
            //         end_ts: 1320501233000,
            //         delete: true,
            //       },
            //     ],
            //     index: 37,
            //   },
            //   {
            //     source: {
            //       id: 113749,
            //       name: "P113749",
            //       infectionStates: ["statusHoltKeim", "statusKrank"],
            //       krankSeit: 1289952000000,
            //       index: 8,
            //       x: 341.0406972335478,
            //       y: 309.0114982556013,
            //       vy: -0.000143245491356989,
            //       vx: -0.0003916512921204337,
            //     },
            //     target: {
            //       id: 175082,
            //       name: "P175082",
            //       infectionStates: ["statusHoltKeim", "statusTraeger"],
            //       traegerSeit: 1331596800000,
            //       index: 9,
            //       x: 282.050692525735,
            //       y: 325.30502981887923,
            //       vy: 0.0000013876599708414128,
            //       vx: -0.0002826845692433017,
            //     },
            //     contacts: [
            //       {
            //         source: 113749,
            //         target: 175082,
            //         stationID: 279,
            //         start_ts: 1331922169000,
            //         end_ts: 1334747629000,
            //         delete: true,
            //       },
            //     ],
            //     index: 38,
            //   },
            // ]
            var pathogens_with_name = [];
            /**
             * Temporär, unabhängig von Keim etc.
             * Einfach nur die Struktur (abhängig von Bewegungen)
             * KEIN backward tracing etc.
             *
             * Nodes & Links
             *
             * TODO: als data_parser function auslagern
             */
            if (true &&
                Patient_Bewegung_Ps.error === undefined &&
                Patient_Labordaten_Ps.error === undefined &&
                generate_mibi_investigations.error === undefined) {
                nodes = [];
                links = [];
                var status_changes_1 = generate_mibi_investigations.data.status_changes;
                // TODO: SMICS-0.8
                // Patientenliste wegen Nth-Degree rauslesen
                var new_patient_list_1 = [];
                Patient_Bewegung_Ps.data.forEach(function (mov) {
                    if (!new_patient_list_1.includes(mov.PatientID)) {
                        new_patient_list_1.push(mov.PatientID);
                    }
                });
                patientList = new_patient_list_1;
                // nodes erzeugen; jeder node speichert zu jedem Keim den letzten/schlimmsten Infektionsstatus
                patientList.forEach(function (patient_id) {
                    var all_pathogen_status = {};
                    console.log("GET OWN PROPERTY NAMES");
                    console.log(status_changes_1, patient_id);
                    var all_tested_pathogens = Object.getOwnPropertyNames(status_changes_1[patient_id]);
                    var all_movements = [];
                    all_movements = Patient_Bewegung_Ps.data.filter(function (movement) { return movement.PatientID === patient_id; });
                    all_tested_pathogens.forEach(function (pathogen_id) {
                        var status = "unknown";
                        // TODO: SMICS-0.8
                        status = "negative";
                        var status_timestamp = undefined;
                        var pathogen_status_changes_of_patient = status_changes_1[patient_id][pathogen_id];
                        pathogen_status_changes_of_patient.forEach(function (status_change) {
                            var new_status = status_change.new_status, timestamp = status_change.timestamp;
                            var worse_status = carrier_status_1.get_worse_carrier_status(status, new_status);
                            // TODO: hier wird der letzte schlechteste Status gesucht
                            // TODO: nicht der letzte!
                            if (worse_status !== status) {
                                status = worse_status;
                                status_timestamp = timestamp;
                            }
                        });
                        all_pathogen_status[pathogen_id] = {
                            status: status,
                            status_timestamp: status_timestamp,
                        };
                    });
                    nodes.push({
                        id: patient_id,
                        patient_id: patient_id,
                        all_pathogen_status: all_pathogen_status,
                        all_movements: all_movements,
                    });
                });
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
                var movements = Patient_Bewegung_Ps.data.filter(function (movement) { return movement.BewegungstypID !== 4; });
                movements.forEach(function (movement) {
                    movement.timestamp = new Date(movement.Beginn).getTime();
                });
                movements.sort(function (a, b) { return a.timestamp - b.timestamp; });
                var buckets_1 = {
                    home: [],
                    tmp_home: [],
                };
                var current_contacts_1 = {};
                // just helper object
                var patient_is_on_station_1 = {};
                patientList.forEach(function (patient_id) {
                    buckets_1.home.push(patient_id);
                    patient_is_on_station_1[patient_id] = "home";
                    current_contacts_1[patient_id] = [];
                });
                /**
                 * find last movement for every patient (save index)
                 */
                var last_movement_index_1 = {};
                movements.forEach(function (movement, i) {
                    last_movement_index_1[movement.PatientID] = i;
                });
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
                movements.forEach(function (movement, i) {
                    var BewegungstypID = movement.BewegungstypID, PatientID = movement.PatientID, timestamp = movement.timestamp, StationID = movement.StationID;
                    var new_station = StationID;
                    if (last_movement_index_1[PatientID] === i) {
                        // falls es sich um letzte Bewegung des Patienten handelt
                        new_station = "home";
                    }
                    else if (BewegungstypID === 2 || BewegungstypID === 6) {
                        new_station = "tmp_home";
                    }
                    // falls new_station !== old_station (ansonsten laufen kontakte weiter/nichts passiert)
                    var old_station = patient_is_on_station_1[PatientID];
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
                        var patients_on_old_station = buckets_1[old_station].filter(function (pat_id) { return pat_id !== PatientID; });
                        if (patients_on_old_station.length <= 0 &&
                            old_station !== "home" &&
                            old_station !== "tmp_home") {
                            delete buckets_1[old_station];
                        }
                        else {
                            buckets_1[old_station] = patients_on_old_station;
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
                            var old_contact_patients = patients_on_old_station;
                            // terminate running contacts
                            // and save them in their link
                            // and create the link if there is none
                            current_contacts_1[PatientID].forEach(function (contact) {
                                var copy_contact = JSON.parse(JSON.stringify(contact));
                                copy_contact.end = timestamp;
                                var patient_a = copy_contact.patient_a, patient_b = copy_contact.patient_b;
                                // is there a link for pA and pB ?
                                // --> create if not
                                // save contact into that link
                                var index = links.findIndex(function (l) {
                                    return ((l.patient_a === patient_a && l.patient_b === patient_b) ||
                                        (l.patient_a === patient_b && l.patient_b === patient_a));
                                });
                                if (index === -1) {
                                    // es gibt noch keinen link
                                    // --> link erzeugen
                                    links.push({
                                        source: patient_a,
                                        target: patient_b,
                                        patient_a: patient_a,
                                        patient_b: patient_b,
                                        contacts: [],
                                    });
                                    index = links.length - 1;
                                }
                                links[index].contacts.push(copy_contact);
                            });
                            current_contacts_1[PatientID] = [];
                            // terminate/delete running contacts on other patients
                            old_contact_patients.forEach(function (old_contact_patient_id) {
                                current_contacts_1[old_contact_patient_id] = current_contacts_1[old_contact_patient_id].filter(function (cont) { return cont.patient_b !== PatientID; });
                            });
                        }
                        // 3 Patient in neuen Bucket schieben
                        if (buckets_1[new_station] === undefined) {
                            buckets_1[new_station] = [];
                        }
                        buckets_1[new_station].push(PatientID);
                        patient_is_on_station_1[PatientID] = new_station;
                        // 4 falls new_station !== home und !== tmp_home
                        // - neue Kontakte des Patienten anfangen
                        if (new_station !== "home" && new_station !== "tmp_home") {
                            var new_contact_patients = buckets_1[new_station].filter(function (pid) { return pid !== PatientID; });
                            new_contact_patients.forEach(function (pat_id) {
                                current_contacts_1[PatientID].push({
                                    patient_a: PatientID,
                                    patient_b: pat_id,
                                    station_id: new_station,
                                    begin: timestamp,
                                    end: undefined,
                                });
                                current_contacts_1[pat_id].push({
                                    patient_a: pat_id,
                                    patient_b: PatientID,
                                    station_id: new_station,
                                    begin: timestamp,
                                    end: undefined,
                                });
                            });
                            // console.log("nochmal current_contacts")
                            // console.log(current_contacts)
                        }
                    }
                });
            }
            // let tick_counter = 0
            var simulation = d3
                .forceSimulation(nodes)
                .force("link", d3.forceLink(links).id(function (d) { return d.id; }))
                .force("charge", d3.forceManyBody())
                .force("center", d3.forceCenter(500, 500));
            // .on("tick", () => {
            // console.log("tick counter:", ++tick_counter)
            // })
            // let sim_done = false
            setTimeout(function () {
                simulation.stop();
                // sim_done = true
                console.log("SIMULATION DONE");
                var min_x = Number.MAX_VALUE;
                var max_x = Number.MIN_VALUE;
                var min_y = Number.MAX_VALUE;
                var max_y = Number.MIN_VALUE;
                nodes.forEach(function (node) {
                    var new_x = node.x;
                    var new_y = node.y;
                    if (new_x < min_x) {
                        min_x = new_x;
                    }
                    if (new_y < min_y) {
                        min_y = new_y;
                    }
                    if (new_x > max_x) {
                        max_x = new_x;
                    }
                    if (new_y > max_y) {
                        max_y = new_y;
                    }
                });
                var vis_offset_y = -min_y - (max_y - min_y) / 2;
                var vis_offset_x = -min_x - (max_x - min_x) / 2;
                callback({
                    timestamp: new Date().getTime(),
                    patientList: patientList,
                    nodes: nodes,
                    links: links,
                    min_x: min_x,
                    max_x: max_x,
                    min_y: min_y,
                    max_y: max_y,
                    vis_offset_x: vis_offset_x,
                    vis_offset_y: vis_offset_y,
                    pathogens_with_name: pathogens_with_name,
                });
            }, 1000);
            // erstmal nicht ausfegührt da nicht vollständig/ soltle umgeschrieben werden...
            if (false &&
                Patient_Bewegung_Ps.error === undefined &&
                Patient_Labordaten_Ps.error === undefined) {
                /**
                 * "copy" of handle_data/switchkeim of old Module "SL_Kontaktnetzwerk"
                 */
                // Liste aller vorkommenden Keime erzeugen
                // und anschließend über diese iterieren
                var occuring_pathogens_1 = [];
                Patient_Labordaten_Ps.data.forEach(function (investigation_data) {
                    if (!occuring_pathogens_1.includes(investigation_data.KeimID)) {
                        occuring_pathogens_1.push(investigation_data.KeimID);
                        pathogens_with_name.push({
                            id: investigation_data.KeimID,
                            nameK: investigation_data.Keim_k,
                            nameL: investigation_data.Keim_l,
                        });
                    }
                });
                // ab hier alle Pathogens durchgehen
                var graphen = {};
                var nodes_by_timestamp = {};
                pathogens_with_name.forEach(function (pwn) {
                    var pathogen_id = pwn.id;
                    var simulation = d3
                        .forceSimulation()
                        .force("link", d3.forceLink().id(function (d) { return d.id; }))
                        .force("charge", d3.forceManyBody())
                        // width / 2 und heiight / 2 (beides 1000 festgesetzt -> 500)
                        .force("center", d3.forceCenter(500, 500));
                    console.log("ANFANG erzeugen des Graphen");
                    var parsed_data = storylineParser_1.default({
                        rawData: {
                            movementData: Patient_Bewegung_Ps.data,
                            microData: Patient_Labordaten_Ps.data,
                        },
                        parameters: {
                            lop: parameters.patientList,
                        },
                    }, pathogen_id);
                    // console.log("ENDE PARSED DATA")
                    // graphen = {
                    //   ...graphen,
                    //   ...parsed_data.graphsCategorized,
                    // }
                    // // nodes_by_timestamp = {
                    // //   ...nodes_by_timestamp,
                    // //   ...parsed_data.nodesByTimestamp
                    // // }
                    // let sankeyLeft = (node: any) => node.depth
                    // let n = parameters.patientList.length
                    // let link_data = graphen["K" + pathogen_id].links
                    // let node_data = graphen["K" + pathogen_id].nodes
                    // let storyline = (NL: any) => {
                    //   const san: any = d3_sankey
                    //     .sankey()
                    //     .nodeWidth(1)
                    //     .nodePadding(1)
                    //     .extent([
                    //       [0, 0],
                    //       [1000, 1000],
                    //     ])
                    //     .nodeAlign(sankeyLeft)
                    //     .iterations(100)
                    //   let ret: any = san(NL)
                    //   return ret
                    // }
                    // console.log("ANFANG vor storylinecreation")
                    // let nodes_and_links = storyline({
                    //   links: link_data,
                    //   nodes: node_data,
                    // })
                    // links = nodes_and_links.links
                    // nodes = nodes_and_links.nodes
                    // console.log("ENDE Storyline erzeugt (layout sankey), 100 Iterationen")
                    // nodes.forEach((n) => {
                    //   n.x_0 = n.x0
                    //   n.x_1 = n.x1
                    //   n.y_0 = n.y0
                    //   n.y_1 = n.y1
                    // })
                    // links.forEach((l) => {
                    //   l.y_0 = l.y0
                    //   l.y_1 = l.y1
                    // })
                    // links = links.filter((d: any) => !d.movementLink)
                    // ! das hier ist bis Zeile 1360
                    /**
                     * - Erzeugen der Nodes + Meta Data wie Krankheitsstatus für diesen Keim + Datum
                     * - Erzeugen der Links (alle Kontakte zweier Patienten zusammenfassen)
                     */
                    // ? Zeile 3176
                    var SL_nodes = [];
                });
                /**
                 * End of the data-parser copy
                 */
            }
            return;
            var min_x = Number.MAX_VALUE;
            var max_x = Number.MIN_VALUE;
            var min_y = Number.MAX_VALUE;
            var max_y = Number.MIN_VALUE;
            nodes.forEach(function (node) {
                var new_x = node.x;
                var new_y = node.y;
                if (new_x < min_x) {
                    min_x = new_x;
                }
                if (new_y < min_y) {
                    min_y = new_y;
                }
                if (new_x > max_x) {
                    max_x = new_x;
                }
                if (new_y > max_y) {
                    max_y = new_y;
                }
            });
            var vis_offset_y = -min_y - (max_y - min_y) / 2;
            var vis_offset_x = -min_x - (max_x - min_x) / 2;
            // verschieben in den positiven Breich
            callback({
                timestamp: new Date().getTime(),
                patientList: patientList,
                nodes: nodes,
                links: links,
                min_x: min_x,
                max_x: max_x,
                min_y: min_y,
                max_y: max_y,
                vis_offset_x: vis_offset_x,
                vis_offset_y: vis_offset_y,
                pathogens_with_name: pathogens_with_name,
            });
            // return {
            //   timestamp: new Date().getTime(),
            //   patientList,
            //   nodes,
            //   links,
            //   min_x,
            //   max_x,
            //   min_y,
            //   max_y,
            //   vis_offset_x,
            //   vis_offset_y,
            //   pathogens_with_name,
            // }
        },
    },
    linelist: {
        needed_raw_data: ["Patient_Bewegung_Ps"],
        needed_parsed_data: ["generate_mibi_investigations"],
        call_function: function (input_data, parameters, callback) {
            var Patient_Bewegung_Ps = input_data.Patient_Bewegung_Ps, generate_mibi_investigations = input_data.generate_mibi_investigations;
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
            var patientList = parameters.patientList;
            // TODO: SMICS-0.8
            // Patientenliste wegen Nth-Degree rauslesen
            var new_patient_list = [];
            Patient_Bewegung_Ps.data.forEach(function (mov) {
                if (!new_patient_list.includes(mov.PatientID)) {
                    new_patient_list.push(mov.PatientID);
                }
            });
            patientList = new_patient_list;
            var ts_start = Number.MAX_VALUE;
            var ts_end = 0;
            var first_movement = Number.MAX_VALUE;
            var last_movement = 0;
            var movement_rects = [];
            var movement_dots = [];
            var investigation_rects = [];
            var status_rects = [];
            var allStations = [];
            // generate visualization for movement data (horizontal rectangles)
            // only if there is no error in the data
            if (Patient_Bewegung_Ps.error === undefined) {
                var movement_rect_top_position_2 = {};
                Patient_Bewegung_Ps.data.forEach(function (movement) {
                    if (!allStations.includes(movement.StationID)) {
                        allStations.push(movement.StationID);
                    }
                    var begin = new Date(movement.Beginn).getTime();
                    var end = new Date(movement.Ende).getTime();
                    if (begin < ts_start) {
                        ts_start = begin;
                        first_movement = begin;
                    }
                    if (end > ts_end) {
                        ts_end = end;
                        last_movement = end;
                    }
                    var vis_struct = {
                        begin: begin,
                        end: end,
                        patient_id: movement.PatientID,
                        station_id: movement.StationID,
                        station_name: movement.Station,
                        movement_type: movement.BewegungstypID,
                    };
                    if (movement.BewegungstypID === 4) {
                        movement_dots.push(vis_struct);
                    }
                    else {
                        if (movement_rect_top_position_2[movement.PatientID]) {
                            vis_struct.top = true;
                            movement_rect_top_position_2[movement.PatientID] = false;
                        }
                        else {
                            vis_struct.top = false;
                            movement_rect_top_position_2[movement.PatientID] = true;
                        }
                        movement_rects.push(vis_struct);
                    }
                });
            }
            // generate visualization for investigation data (vertical rectangles)
            // only if there is no error in the data
            if (generate_mibi_investigations.error === undefined) {
                var _a = generate_mibi_investigations.data, first_timestamp = _a.first_timestamp, last_timestamp = _a.last_timestamp, investigations = _a.investigations, status_changes_2 = _a.status_changes;
                if (ts_start > first_timestamp) {
                    ts_start = first_timestamp;
                }
                if (ts_end < last_timestamp) {
                    ts_end = last_timestamp;
                }
                investigation_rects = investigations;
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
                    patientList.forEach(function (pID) {
                        // get first and last timestamp
                        var first_ts = undefined;
                        var last_ts = undefined;
                        var patient_movements = Patient_Bewegung_Ps.data.filter(function (d) { return d.PatientID === pID && d.BewegungstypID !== 4; });
                        patient_movements.forEach(function (movement) {
                            var begin = new Date(movement.Beginn).getTime();
                            var end = new Date(movement.Ende).getTime();
                            if (first_ts === undefined || begin < first_ts) {
                                first_ts = begin;
                            }
                            if (last_ts === undefined || end > last_ts) {
                                last_ts = end;
                            }
                        });
                        // generate blank/"unknown" rectangle
                        status_rects.push({
                            patient_id: pID,
                            pathogen_id: undefined,
                            begin: first_ts,
                            end: last_ts,
                            status: "unknown",
                        });
                        console.log(".........................Status Rects for " + pID);
                        var tested_pathogens = Object.getOwnPropertyNames(status_changes_2[pID]);
                        console.log("Tested Pathogens for this Patient... " + tested_pathogens);
                        console.table(status_changes_2[pID]);
                        tested_pathogens.forEach(function (pathID) {
                            var current_last_ts = first_ts;
                            var current_status = "unknown";
                            // Status von vor der Aufnahme ermitteln
                            status_changes_2[pID][pathID].forEach(function (stat_change, i) {
                                console.table(stat_change);
                                if (stat_change.timestamp <= first_movement) {
                                    console.log("before first_ts " + stat_change);
                                    current_status = carrier_status_1.get_worse_carrier_status(current_status, stat_change.new_status);
                                    // TODO: statt nur bei Verschlimmerung kann auch jedes mal neues Rectangle erzeugt werden
                                    // current_status = stat_change.new_status
                                }
                            });
                            status_rects.push({
                                patient_id: pID,
                                pathogen_id: pathID,
                                begin: first_ts,
                                end: last_ts,
                                status: current_status,
                            });
                            console.log("Status VOR der Aufnahme: " + current_status);
                            status_changes_2[pID][pathID].forEach(function (stat_change, i) {
                                var stat_change_ts = stat_change.timestamp;
                                console.table(stat_change);
                                // Nur wenn status_change innerhalb des Aufenthaltszeitraums liegt
                                if (stat_change_ts > first_movement &&
                                    stat_change_ts < last_movement) {
                                    var new_status = carrier_status_1.get_worse_carrier_status(current_status, stat_change.new_status);
                                    console.log("NEUER STATUS des Patienten: " + new_status);
                                    // TODO: statt nur bei Verschlimmerung kann auch jedes mal neues Rectangle erzeugt werden
                                    // new_status = stat_change.new_status
                                    if (new_status !== current_status) {
                                        status_rects[status_rects.length - 1].end = stat_change_ts;
                                        status_rects.push({
                                            patient_id: pID,
                                            pathogen_id: pathID,
                                            begin: stat_change_ts,
                                            end: last_ts,
                                            status: new_status,
                                        });
                                        current_status = new_status;
                                        console.log("GEPSCHTER Status Recht: " + new_status);
                                    }
                                }
                            });
                        });
                    });
                }
            }
            callback({
                // data: ["linelist vis data", input_data],
                timestamp: new Date().getTime(),
                ts_start: ts_start,
                ts_end: ts_end,
                patientList: patientList,
                movement_rects: movement_rects,
                movement_dots: movement_dots,
                investigation_rects: investigation_rects,
                status_rects: status_rects,
                allStations: allStations,
            });
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
        call_function: function (input_data, parameters, callback) {
            callback({
                data: ["fictive linelist data"],
            });
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
        call_function: function (input_data, parameters, callback) {
            callback({
                data: ["storyline vis data"],
            });
            // return {
            //   data: ["storyline vis data"],
            // }
        },
    },
    epicurve: {
        needed_raw_data: ["Labor_ErregerProTag_TTEsKSs"],
        needed_parsed_data: [],
        call_function: function (input_data, parameters, callback) {
            callback({
                data: ["epicurve data"],
            });
            // return {
            //   data: ["epicurve data"],
            // }
        },
    },
};
exports.default = module_parser;
//# sourceMappingURL=module_parser.js.map