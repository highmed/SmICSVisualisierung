"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var parseToStorylineData = function (input, specificKeimID) {
    var rawData = input.rawData, parameters = input.parameters;
    console.log("parse to storyline data");
    // console.log("TCL: parameters", JSON.stringify(parameters, null, 4))
    /**
     * in
     * parameters.lop = []
     * müssen alle PatientenIDs drin stehen!
     */
    var lop = parameters.lop[0];
    var stationList = [];
    var microData = rawData.microData, movementData = rawData.movementData;
    var rawMicroData = JSON.parse(JSON.stringify(microData));
    var rawMovementData = JSON.parse(JSON.stringify(movementData));
    microData = microData[0];
    movementData = movementData[0];
    var getLinkSourceToTarget = function (sourceNode, targetNode, movementLink) {
        return {
            lop: movementLink
                ? [targetNode.lop[targetNode.lop.length - 1]]
                : targetNode.lop,
            source: sourceNode.node,
            target: targetNode.node,
            ts_Beginn: sourceNode.timestamp,
            ts_Ende: targetNode.timestamp,
            timestampBefore: sourceNode.timestampBefore,
            timestampAfter: targetNode.timestampAfter,
            movementLink: movementLink,
        };
    };
    /**
     * Behandlungen rausfiltern
     */
    movementData = movementData.filter(function (md) { return md.BewegungstypID !== 4; });
    var keime = {
        lok: [],
    };
    microData.forEach(function (untersuchung) {
        untersuchung.ts_Auftrag = new Date(untersuchung.Auftragsdatum).getTime();
        untersuchung.ts_Eingang = new Date(untersuchung.Eingangsdatum).getTime();
        untersuchung.timestamp = untersuchung.ts_Eingang;
        // untersuchung.PatientID = Number(untersuchung.PatientID)
        // TODO: Nur Hotfix (invertieren des Screening-Flags)
        untersuchung.Screening = untersuchung.Screening == 1 ? 0 : 1;
        if (!keime.lok.includes(untersuchung.KeimID)) {
            keime.lok.push(untersuchung.KeimID);
            keime["K" + untersuchung.KeimID] = {
                keimID: untersuchung.KeimID,
                keim_k: untersuchung.Keim_k,
                keim_l: untersuchung.Keim_l,
                erstePositiveBefunde: [],
                letzteNgativeBefunde: [],
            };
        }
    });
    movementData.forEach(function (bewegung) {
        bewegung.ts_Beginn = new Date(bewegung.Beginn).getTime();
        bewegung.ts_Ende = new Date(bewegung.Ende).getTime();
        bewegung.eventType = "Bewegung";
        bewegung.timestamp = bewegung.ts_Beginn;
        bewegung.patientID = bewegung.PatientID;
        bewegung.stationID = bewegung.StationID;
        // bewegung.PatientID = Number(bewegung.PatientID)
        if (!stationList.includes(bewegung.StationID)) {
            stationList.push(bewegung.StationID);
        }
    });
    var patients = {
        lop: lop,
    };
    var allPatientMovements = [];
    var allPatientInspections = [];
    lop.forEach(function (patientID) {
        var patientMicroData = microData.filter(function (md) { return md.PatientID === patientID; });
        var patientMovementData = movementData.filter(function (md) { return md.PatientID === patientID; });
        var untersuchungen = [];
        var keimeInfos = {};
        keime.lok.forEach(function (kid) {
            keimeInfos["K" + kid] = {
                erstesPositiv: undefined,
                letztesNegativ: undefined,
                positive: [],
                negative: [],
            };
        });
        /**
         * Akkumulieren der MicroData:
         * - alle Untersuchungen mit selbem Zeitstempel zusamemnfassen
         * - keimeInfos mit Informationen zu allen Keimen für jeden Patienten
         */
        patientMicroData.forEach(function (pmd) {
            var indexOfInspec = untersuchungen.findIndex(function (u) { return u.timestamp === pmd.timestamp; });
            if (indexOfInspec === -1) {
                untersuchungen.push({
                    timestamp: pmd.timestamp,
                    ts_Auftrag: pmd.ts_Auftrag,
                    ts_Eingang: pmd.ts_Eingang,
                    inspections: [],
                    keimIDs: [],
                    positiveKeime: [],
                    patientID: patientID,
                    eventType: "Untersuchung",
                });
                indexOfInspec = untersuchungen.length - 1;
            }
            var unt = untersuchungen[indexOfInspec];
            // nur wenn der Keim noch nicht im Array ist
            if (pmd.Screening === 1) {
                if (!unt.positiveKeime.includes(pmd.KeimID)) {
                    unt.positiveKeime.push(pmd.KeimID);
                }
            }
            else {
                if (!unt.keimIDs.includes(pmd.KeimID)) {
                    unt.keimIDs.push(pmd.KeimID);
                }
            }
            unt.inspections.push(pmd);
            // keimeInfos des Patienten aktualisieren
            var keimObject = keimeInfos["K" + pmd.KeimID];
            if (keimObject === undefined) {
                keimObject = keimeInfos["K" + pmd.KeimID] = {
                    erstesPositiv: undefined,
                    letztesNegativ: undefined,
                    positive: [],
                    negative: [],
                };
            }
            if (pmd.Screening === 1) {
                keimObject.positive.push(pmd.timestamp);
            }
            else {
                keimObject.negative.push(pmd.timestamp);
            }
        });
        /**
         * für jeden Keim bei jedem Patienten:
         * erstesPositiv und letztesNegativ finden
         */
        Object.getOwnPropertyNames(keimeInfos).forEach(function (keimID) {
            var keimObject = keimeInfos[keimID];
            var negative = [];
            if (keimObject.positive.length > 0) {
                keimObject.erstesPositiv = Math.min.apply(Math, keimObject.positive);
                negative = keimObject.negative.filter(function (ts) { return ts < keimObject.erstesPositiv; });
            }
            else {
                negative = keimObject.negative;
            }
            if (negative.length > 0) {
                // keimObject.letztesNegativ = Math.max(...negative)
                keimObject.letztesNegativ = Math.min.apply(Math, negative);
            }
        });
        Object.getOwnPropertyNames(keimeInfos).forEach(function (keimID) {
            var keimObject = keimeInfos[keimID];
            if (keimObject.erstesPositiv) {
                keime[keimID].erstePositiveBefunde.push({
                    patientID: patientID,
                    timestamp: keimObject.erstesPositiv,
                });
            }
            if (keimObject.letztesNegativ) {
                keime[keimID].letzteNgativeBefunde.push({
                    patientID: patientID,
                    timestamp: keimObject.letztesNegativ,
                });
            }
        });
        /**
         * Die States aufgrund der Befunde generieren (Reihenfolge)
         */
        Object.getOwnPropertyNames(keimeInfos).forEach(function (keimID) {
            /**
             * Es gibt folgende Fälle:
             * | lastNegative | firstPositive |
             * |      0       |       0       |
             * |      0       |       1       |
             * |      1       |       0       |
             * |      1       |       1       |
             *
             * Fall 1: Unknown
             * Fall 2: Ansteckung + Infiziert
             * Fall 3: Gesund + Unknown
             * Fall 4: Gesund +  Ansteckung + Infiziert
             */
            var keimObject = keimeInfos[keimID];
            var patientStates = [];
            if (keimObject.letztesNegativ === undefined &&
                keimObject.erstesPositiv === undefined) {
                patientStates = ["statusUnbekannt"];
            }
            else if (keimObject.letztesNegativ === undefined &&
                keimObject.erstesPositiv !== undefined) {
                // patientStates = ["statusAnsteckung", "statusInfiziert"]
                patientStates = ["statusHoltKeim", "statusKrank"];
            }
            else if (keimObject.letztesNegativ !== undefined &&
                keimObject.erstesPositiv === undefined) {
                // patientStates = ["statusGesund", "statusUnbekannt"]
                patientStates = ["statusHoltKeim", "statusTraeger"];
            }
            else if (keimObject.letztesNegativ !== undefined &&
                keimObject.erstesPositiv !== undefined) {
                // patientStates = ["statusGesund", "statusAnsteckung", "statusInfiziert"]
                patientStates = ["statusHoltKeim", "statusTraeger", "statusKrank"];
            }
            keimObject.patientStates = patientStates;
        });
        /**
         * Wenn es nur eine Bewegung gibt: generiere zweite (Entlassung)
         * Erste und letzte Bewegung markieren
         * Wenn die erste Bewegung eine Aufnahme ist -> markieren
         * Wenn die letzte Bewegung eine Entlassung ist -> markieren
         */
        if (patientMovementData.length === 1) {
            console.error("Patient mit ID " + patientID + " hat nur eine Bewegung.\n          Es wird eine zweite generiert.");
            var copyMovement = JSON.parse(JSON.stringify(patientMovementData[0]));
            copyMovement.fakeMovement =
                "Kopierte Bewegung um zweites Event zu generieren";
            copyMovement.ts_Beginn = copyMovement.ts_Ende;
            copyMovement.timestamp = new Date(copyMovement.ts_Beginn).getTime();
            copyMovement.BewegungstypID = 2;
            copyMovement.Bewegungstyp = "(Entlassung)";
        }
        patientMovementData[0].ersteBewegung = true;
        patientMovementData[patientMovementData.length - 1].letzteBewegung = true;
        if (patientMovementData.length > 0 &&
            patientMovementData[0].BewegungstypID === 1) {
            patientMovementData[0].ersteAufnahme = true;
        }
        else {
            console.error("Patient mit ID " + patientID + " hat keine Aufnahme als erste Bewegung.");
        }
        if (patientMovementData.length > 0 &&
            (patientMovementData[patientMovementData.length - 1].BewegungstypID ===
                2 ||
                patientMovementData[patientMovementData.length - 1].BewegungstypID ===
                    4)) {
            patientMovementData[patientMovementData.length - 1].letzteEntlassung = true;
        }
        else {
            console.error("Patient mit ID " + patientID + " hat keine Entlassung als letzte Bewegung.");
        }
        allPatientMovements.push(patientMovementData);
        allPatientInspections.push(untersuchungen);
        /**
         * Patienten-Property mit allen Informationen zu diesem Patienten
         */
        patients["P" + patientID] = {
            // microData: patientMicroData,
            patientID: patientID,
            movementData: patientMovementData,
            keimeInfos: keimeInfos,
            untersuchungen: untersuchungen,
        };
    });
    /**
     * Erzeugen ALLER Events
     *
     */
    var allMovements = allPatientMovements.reduce(function (a, b) { return __spreadArrays(a, b); }, []);
    var allInspections = allPatientInspections.reduce(function (a, b) { return __spreadArrays(a, b); }, []);
    /**
     * Alle "relevanten" Untersuchungen
     * -> alle Untersuchungen nach den relevanten Zeitstempeln filtern
     */
    // let allRelevantInspections2 = allInspections.filter(i =>
    //   allRelevantInspectionTimestamps.includes(i.timestamp)
    // )
    var allRelevantInspections = [];
    keime.lok.forEach(function (keimID) {
        keime["K" + keimID].erstePositiveBefunde.forEach(function (befund) {
            var index = allRelevantInspections.findIndex(function (ri) {
                return ri.timestamp === befund.timestamp && ri.patientID === befund.patientID;
            });
            if (index < 0) {
                var ri_index = allInspections.findIndex(function (i) {
                    return i.timestamp === befund.timestamp && i.patientID === befund.patientID;
                });
                var ri = JSON.parse(JSON.stringify(allInspections[ri_index]));
                ri.erstePositiveKeime = [];
                ri.letzteNegativeKeime = [];
                allRelevantInspections.push(ri);
                index = allRelevantInspections.length - 1;
            }
            var inspection = allRelevantInspections[index];
            inspection.erstePositiveKeime.push(keimID);
        });
        keime["K" + keimID].letzteNgativeBefunde.forEach(function (befund) {
            var index = allRelevantInspections.findIndex(function (ri) {
                return ri.timestamp === befund.timestamp && ri.patientID === befund.patientID;
            });
            if (index < 0) {
                var ri_index = allInspections.findIndex(function (i) {
                    return i.timestamp === befund.timestamp && i.patientID === befund.patientID;
                });
                var ri = JSON.parse(JSON.stringify(allInspections[ri_index]));
                ri.erstePositiveKeime = [];
                ri.letzteNegativeKeime = [];
                allRelevantInspections.push(ri);
                index = allRelevantInspections.length - 1;
            }
            var inspection = allRelevantInspections[index];
            inspection.letzteNegativeKeime.push(keimID);
        });
    });
    allRelevantInspections.sort(function (a, b) { return a.timestamp - b.timestamp; });
    var allEvents = allMovements.concat(allRelevantInspections);
    allEvents.sort(function (a, b) { return a.timestamp - b.timestamp; });
    var parsedData = rawData;
    var withDummyNodes = rawData;
    // console.log(`input data: ${JSON.stringify(input, null, 4)}`)
    // console.log(rawMovementData[0].PatientID)
    var eventsCategorized = {};
    var graphsCategorized = {};
    var nodesByTimestamp = {};
    keime.lok.forEach(function (keimID, keimCounter) {
        if (keimID !== Number(specificKeimID)) {
            // console.log(`KeimID ${keimID} wird übersprungen`)
        }
        else {
            console.error("F\u00FCr KeimID " + keimID + " wird die SL berechnet");
            var maxClusterCountPerTimestep_1 = 2;
            /**
             * Events für einen Keim zusammenfassen und soriteren
             */
            var inspections = allRelevantInspections.filter(function (i) {
                return i.erstePositiveKeime.includes(keimID) ||
                    i.letzteNegativeKeime.includes(keimID);
            });
            var events = allMovements.concat(inspections);
            events.sort(function (a, b) { return a.timestamp - b.timestamp; });
            var timestamps_1 = [];
            events.forEach(function (event) {
                timestamps_1.push(event.timestamp);
            });
            var timespan = timestamps_1[timestamps_1.length - 1] - timestamps_1[0];
            timestamps_1.push(timestamps_1[timestamps_1.length - 1] + 0.05 * timespan);
            eventsCategorized["K" + keimID] = events;
            /**
             * Graph-Struktur (nodes und links) für einen Keim erzeugen
             */
            var graph_1 = {
                nodes: [],
                links: [],
                linksSkipDummys: [],
            };
            var firstTimestamp = events[0].timestamp;
            var lastTimestamp = events[events.length - 1].timestamp;
            var timestampDiff = lastTimestamp - firstTimestamp;
            var timestampBefore_1 = firstTimestamp - 0.05 * timestampDiff;
            var lastLastTimestamp = lastTimestamp + 0.05 * timestampDiff;
            var node_1 = 0;
            var stationClusterIDcounter_1 = 0;
            var timestepCounter_1 = 0;
            var clusters_1 = [
                {
                    // home, tmphome, klinik
                    space: "home",
                    stationID: "home",
                    lop: lop,
                    timestamp: timestampBefore_1,
                    // stateNumber: 0,
                    // undefined, pre, post
                    // pufferNode: undefined,
                    node: node_1++,
                    // node: node - 1,
                    relevantNode: false,
                    relevantType: "source",
                    timestep: 0,
                    stationClusterID: stationClusterIDcounter_1++,
                },
                {
                    // home, tmphome, klinik
                    space: "tmphome",
                    stationID: "tmphome",
                    lop: [],
                    timestamp: timestampBefore_1,
                    // stateNumber: 0,
                    // undefined, pre, post
                    // pufferNode: undefined,
                    node: node_1++,
                    // node: node - 1,
                    relevantNode: false,
                    relevantType: "source",
                    timestep: 0,
                    stationClusterID: stationClusterIDcounter_1++,
                },
            ];
            graph_1.nodes.push(JSON.parse(JSON.stringify(clusters_1[0])));
            graph_1.nodes.push(JSON.parse(JSON.stringify(clusters_1[1])));
            // let states = [
            //   {
            //     stateNumber: 0,
            //     patients: {}
            //   }
            // ]
            // lop.forEach(patientID => {
            //   states[0].patients["P" + patientID] = {
            //     patientID: patientID,
            //     letztesNegativ: 0,
            //     erstesPositiv: 0,
            //     // unknown, negative, positive, infecting
            //     status: undefined
            //   }
            // })
            var transitions = [];
            var BewegungOhneStationswechsel_1 = 0;
            events.forEach(function (e, i) {
                // if (BewegungWarDran < 20) {
                //   console.log(`---------- ANFANG ${i}----------`)
                //   console.log(clusters)
                //   console.log(`---------- ENDE ${i}----------`)
                // }
                // if (clusters.length > 100) {
                //   return
                // }
                // console.log(keimCounter, i, clusters.length)
                var patientID = e.patientID, eventType = e.eventType, timestamp = e.timestamp;
                // console.log(JSON.stringify(clusters, null, 4))
                var newClusters = [];
                var timestampAfter = timestamps_1[i + 1];
                if (eventType === "Untersuchung") {
                    var timestep1_1 = timestepCounter_1++;
                    clusters_1.forEach(function (c, index) {
                        var newCluster1 = __assign(__assign({}, JSON.parse(JSON.stringify(c))), { node: node_1++, timestamp: timestamp, relevantNode: c.lop.includes(patientID), 
                            // relevantType: undefined,
                            relevantType: "source", timestampBefore: timestampBefore_1, timestampAfter: timestampAfter, nodeType: "inspection", 
                            // timestep: index + 1,
                            timestep: timestep1_1, infectionChangeOfPatient: patientID });
                        graph_1.nodes.push(newCluster1);
                        graph_1.links.push(getLinkSourceToTarget(c, newCluster1, false));
                        newClusters.push(newCluster1);
                        // let copyC1 = JSON.parse(JSON.stringify(c))
                        // copyC1.node = node++
                        // copyC1.timestamp = timestamp
                        // copyC1.timestampBefore = timestampBefore
                        // copyC1.dummyNode = true
                        // copyC1.nodeType = "inspection"
                        // if (c.lop.includes(patientID)) {
                        //   copyC1.dummyNode = false
                        // }
                        // graph.nodes.push(copyC1)
                        // graph.links.push({
                        //   lop: copyC1.lop,
                        //   source: c.node,
                        //   target: copyC1.node,
                        //   ts_Beginn: c.timestamp,
                        //   ts_Ende: copyC1.timestamp,
                        //   timestampBefore: timestampBefore
                        // })
                        // newClusters.push(copyC1)
                    });
                    /**
                     * die 4-5 Fälle vom alten Übernehmen
                     * ABER
                     * mit pre-movement, movement und post-movement, also DREI Knoten Pro Ebene Pro Event
                     * die links, die einen einzelnen Patienten Bewegen lassen, müssten gekennzeichnet werden#
                     * in jedem KNOTEN den vorherigen Timestamp speichern
                     *
                     * im force directed müssen die linien Kräfte extrem Stark sein
                     * ein Button "Krankheitsverbreitung zentrieren"; Knoten mit Kranken speziell markieren
                     * sodass diese dann durch y-kräfte zentriert werden im force directed
                     */
                }
                else if (eventType === "Bewegung") {
                    /**
                     * Plus den Sonderfall am Anfang
                     *
                     *      ___.___
                     *
                     * Es gibt 4 Fälle:
                     * PatientAlleine ZielExistiert
                     *      0               0
                     *        ____
                     *          \
                     *
                     *      0               1
                     *        ____
                     *        __/_
                     *
                     *      1               0
                     *        ___
                     *           \
                     *
                     *      1               1
                     *        ____
                     *        ___/
                     */
                    var stationID_1 = e.StationID;
                    if (e.letzteBewegung) {
                        stationID_1 = "home";
                    }
                    else if (e.BewegungstypID === 2 || e.BewegungstypID === 6) {
                        stationID_1 = "tmphome";
                    }
                    var patientClusterIndex_1 = clusters_1.findIndex(function (pc) {
                        return pc.lop.includes(patientID);
                    });
                    // if (patientClusterIndex === -1) {
                    //   console.log(patientID)
                    //   console.log(JSON.stringify(clusters, null, 4))
                    // }
                    var patientAlleine = clusters_1[patientClusterIndex_1].lop.length === 1;
                    if (clusters_1[patientClusterIndex_1].stationID === "home" ||
                        clusters_1[patientClusterIndex_1].stationID === "tmphome") {
                        patientAlleine = false;
                    }
                    var zielClusterIndex = clusters_1.findIndex(function (zc) { return zc.stationID === stationID_1; });
                    var zielExistiert = zielClusterIndex >= 0;
                    /**
                     * Fall 0
                     * Falls SourceCluster === TargetCluster
                     * --> keine Bewegung/ kein Stationswechsel
                     */
                    if (zielExistiert && patientClusterIndex_1 === zielClusterIndex) {
                        return;
                        console.error("Patient-Bewegung von " + patientID + " hat keinen Stationswechsel");
                        BewegungOhneStationswechsel_1++;
                        // console.log("Fall 0")
                        var timestep1_2 = timestepCounter_1++;
                        clusters_1.forEach(function (c, index) {
                            var newCluster1 = __assign(__assign({}, JSON.parse(JSON.stringify(c))), { node: node_1++, timestamp: timestamp, relevantNode: c.lop.includes(patientID), relevantType: undefined, timestampBefore: timestampBefore_1, timestampAfter: timestampAfter, nodeType: "movement", 
                                // timestep: index + 1,
                                timestep: timestep1_2, infectionChangeOfPatient: undefined });
                            graph_1.nodes.push(newCluster1);
                            graph_1.links.push(getLinkSourceToTarget(c, newCluster1, false));
                            newClusters.push(newCluster1);
                            // let copyC1 = JSON.parse(JSON.stringify(c))
                            // copyC1.node = node++
                            // copyC1.timestamp = timestamp
                            // copyC1.timestampBefore = timestampBefore
                            // copyC1.dummyNode = true
                            // copyC1.nodeType = "singleMovement"
                            // graph.nodes.push(copyC1)
                            // graph.links.push({
                            //   lop: copyC1.lop,
                            //   source: c.node,
                            //   target: copyC1.node,
                            //   ts_Beginn: c.timestamp,
                            //   ts_Ende: copyC1.timestamp,
                            //   timestampBefore: timestampBefore
                            // })
                            // newClusters.push(copyC1)
                        });
                    }
                    else if (!patientAlleine && !zielExistiert) {
                        // console.log("Fall 1")
                        /**
                         * Fall 1
                         * Falls der Patient nicht alleine ist und das Zielcluster nicht existiert
                         * Aus EINS wird ZWEI
                         */
                        var timestep1_3 = timestepCounter_1++;
                        var timestep2_1 = timestepCounter_1++;
                        clusters_1.forEach(function (c, index) {
                            if (index === patientClusterIndex_1) {
                                var newCluster1 = __assign(__assign({}, JSON.parse(JSON.stringify(c))), { node: node_1++, timestamp: timestamp, relevantNode: true, relevantType: "source", timestampBefore: timestampBefore_1, timestampAfter: timestampAfter, nodeType: "movement", 
                                    // timestep: index + 1,
                                    timestep: timestep1_3, infectionChangeOfPatient: undefined });
                                var newCluster2 = __assign(__assign({}, JSON.parse(JSON.stringify(c))), { node: node_1++, timestamp: timestamp, relevantNode: true, relevantType: "target", timestampBefore: timestampBefore_1, timestampAfter: timestampAfter, nodeType: "movement", 
                                    // timestep: index + 1,
                                    timestep: timestep2_1, infectionChangeOfPatient: undefined, lop: c.lop.filter(function (pid) { return pid !== patientID; }) });
                                var newCluster3 = __assign(__assign({}, JSON.parse(JSON.stringify(c))), { node: node_1++, timestamp: timestamp, relevantNode: true, relevantType: "target", timestampBefore: timestampBefore_1, timestampAfter: timestampAfter, nodeType: "movement", 
                                    // timestep: index + 1,
                                    timestep: timestep2_1, infectionChangeOfPatient: undefined, lop: [patientID], space: "klinik", stationID: stationID_1, stationClusterID: stationClusterIDcounter_1++ });
                                graph_1.nodes.push(newCluster1);
                                graph_1.nodes.push(newCluster2);
                                graph_1.nodes.push(newCluster3);
                                graph_1.links.push(getLinkSourceToTarget(c, newCluster1, false));
                                graph_1.links.push(getLinkSourceToTarget(newCluster1, newCluster2, false));
                                graph_1.links.push(getLinkSourceToTarget(newCluster1, newCluster3, true));
                                newClusters.push(newCluster2);
                                newClusters.push(newCluster3);
                                // let copyC1 = JSON.parse(JSON.stringify(c))
                                // copyC1.node = node++
                                // copyC1.timestamp = timestamp
                                // copyC1.timestampBefore = timestampBefore
                                // copyC1.dummyNode = false
                                // copyC1.nodeType = "preMovement"
                                // let copyC2 = JSON.parse(JSON.stringify(c))
                                // copyC2.lop = c.lop.filter(pid => pid !== patientID)
                                // copyC2.node = node++
                                // copyC2.timestamp = timestamp
                                // copyC2.timestampBefore = timestampBefore
                                // copyC2.dummyNode = false
                                // copyC2.nodeType = "postMovement"
                                // let copyC3 = JSON.parse(JSON.stringify(c))
                                // copyC3.lop = [patientID]
                                // copyC3.node = node++
                                // copyC3.timestamp = timestamp
                                // copyC3.timestampBefore = timestampBefore
                                // copyC3.dummyNode = false
                                // copyC3.nodeType = "postMovement"
                                // copyC3.space = "klinik"
                                // copyC3.stationID = stationID
                                // graph.nodes.push(copyC1)
                                // graph.nodes.push(copyC2)
                                // graph.nodes.push(copyC3)
                                // graph.links.push({
                                //   lop: copyC1.lop,
                                //   source: c.node,
                                //   target: copyC1.node,
                                //   ts_Beginn: c.timestamp,
                                //   ts_Ende: copyC1.timestamp,
                                //   timestampBefore: timestampBefore
                                // })
                                // graph.links.push({
                                //   lop: copyC2.lop,
                                //   source: copyC1.node,
                                //   target: copyC2.node,
                                //   ts_Beginn: copyC1.timestamp,
                                //   ts_Ende: copyC2.timestamp,
                                //   timestampBefore: timestampBefore
                                // })
                                // graph.links.push({
                                //   lop: [patientID],
                                //   source: copyC1.node,
                                //   target: copyC3.node,
                                //   ts_Beginn: copyC1.timestamp,
                                //   ts_Ende: copyC3.timestamp,
                                //   timestampBefore: timestampBefore,
                                //   BewegungstypID: e.BewegungstypID,
                                //   Bewegungstyp: e.Bewegungstyp
                                // })
                                // // newClusters.push(copyC1)
                                // newClusters.push(copyC2)
                                // newClusters.push(copyC3)
                            }
                            else {
                                var newCluster1 = __assign(__assign({}, JSON.parse(JSON.stringify(c))), { node: node_1++, timestamp: timestamp, relevantNode: false, relevantType: "source", timestampBefore: timestampBefore_1, timestampAfter: timestampAfter, nodeType: "movement", 
                                    // timestep: index + 1,
                                    timestep: timestep1_3, infectionChangeOfPatient: undefined });
                                var newCluster2 = __assign(__assign({}, JSON.parse(JSON.stringify(c))), { node: node_1++, timestamp: timestamp, relevantNode: false, relevantType: "target", timestampBefore: timestampBefore_1, timestampAfter: timestampAfter, nodeType: "movement", 
                                    // timestep: index + 1,
                                    timestep: timestep2_1, infectionChangeOfPatient: undefined });
                                graph_1.nodes.push(newCluster1);
                                graph_1.nodes.push(newCluster2);
                                graph_1.links.push(getLinkSourceToTarget(c, newCluster1, false));
                                graph_1.links.push(getLinkSourceToTarget(newCluster1, newCluster2, false));
                                newClusters.push(newCluster2);
                                // let copyC1 = JSON.parse(JSON.stringify(c))
                                // copyC1.node = node++
                                // copyC1.timestamp = timestamp
                                // copyC1.timestampBefore = timestampBefore
                                // copyC1.dummyNode = true
                                // copyC1.nodeType = "preMovement"
                                // let copyC2 = JSON.parse(JSON.stringify(c))
                                // copyC2.node = node++
                                // copyC2.timestamp = timestamp
                                // copyC2.timestampBefore = timestampBefore
                                // copyC2.dummyNode = true
                                // copyC2.nodeType = "postMovement"
                                // graph.nodes.push(copyC1)
                                // graph.nodes.push(copyC2)
                                // graph.links.push({
                                //   lop: copyC1.lop,
                                //   source: c.node,
                                //   target: copyC1.node,
                                //   ts_Beginn: c.timestamp,
                                //   ts_Ende: copyC1.timestamp,
                                //   timestampBefore: timestampBefore
                                // })
                                // graph.links.push({
                                //   lop: copyC2.lop,
                                //   source: copyC1.node,
                                //   target: copyC2.node,
                                //   ts_Beginn: copyC1.timestamp,
                                //   ts_Ende: copyC2.timestamp,
                                //   timestampBefore: timestampBefore
                                // })
                                // // newClusters.push(copyC1)
                                // newClusters.push(copyC2)
                            }
                        });
                    }
                    else if (!patientAlleine && zielExistiert) {
                        // console.log("Fall 2")
                        /**
                         * Fall 2
                         * Falls Patient nicht alleine ist und das Ziel existiert
                         * Aus ZWEI wird ZWEI
                         */
                        var fallBearbeitet_1 = false;
                        var timestep1_4 = timestepCounter_1++;
                        var timestep2_2 = timestepCounter_1++;
                        clusters_1.forEach(function (c, index) {
                            if (index === fallBearbeitet_1) {
                                // Fall schon bearbeitet
                            }
                            else {
                                if (c.lop.includes(patientID)) {
                                    // Wenn Cluster den Patienten enthält,
                                    // dann muss auch das Ziel bearbeitet werden
                                    // dann wird der Index des Ziels in fallBearbeitet gespeichert
                                    var indexZiel = clusters_1.findIndex(function (c) { return c.stationID === stationID_1; });
                                    var zielCluster = clusters_1[indexZiel];
                                    fallBearbeitet_1 = indexZiel;
                                    var newCluster1 = __assign(__assign({}, JSON.parse(JSON.stringify(c))), { node: node_1++, timestamp: timestamp, relevantNode: true, relevantType: "source", timestampBefore: timestampBefore_1, timestampAfter: timestampAfter, nodeType: "movement", 
                                        // timestep: index + 1,
                                        timestep: timestep1_4, infectionChangeOfPatient: undefined });
                                    var newCluster2 = __assign(__assign({}, JSON.parse(JSON.stringify(zielCluster))), { node: node_1++, timestamp: timestamp, relevantNode: true, relevantType: "source", timestampBefore: timestampBefore_1, timestampAfter: timestampAfter, nodeType: "movement", 
                                        // timestep: index + 1,
                                        timestep: timestep1_4, infectionChangeOfPatient: undefined });
                                    var newCluster3 = __assign(__assign({}, JSON.parse(JSON.stringify(c))), { node: node_1++, timestamp: timestamp, relevantNode: true, relevantType: "target", timestampBefore: timestampBefore_1, timestampAfter: timestampAfter, nodeType: "movement", 
                                        // timestep: index + 1,
                                        timestep: timestep2_2, infectionChangeOfPatient: undefined });
                                    newCluster3.lop = newCluster3.lop.filter(function (pid) { return pid !== patientID; });
                                    var newCluster4 = __assign(__assign({}, JSON.parse(JSON.stringify(zielCluster))), { node: node_1++, timestamp: timestamp, relevantNode: true, relevantType: "target", timestampBefore: timestampBefore_1, timestampAfter: timestampAfter, nodeType: "movement", 
                                        // timestep: index + 1,
                                        timestep: timestep2_2, infectionChangeOfPatient: undefined });
                                    newCluster4.lop.push(patientID);
                                    graph_1.nodes.push(newCluster1);
                                    graph_1.nodes.push(newCluster2);
                                    graph_1.nodes.push(newCluster3);
                                    graph_1.nodes.push(newCluster4);
                                    graph_1.links.push(getLinkSourceToTarget(c, newCluster1, false));
                                    graph_1.links.push(getLinkSourceToTarget(zielCluster, newCluster2, false));
                                    graph_1.links.push(getLinkSourceToTarget(newCluster1, newCluster3, false));
                                    graph_1.links.push(getLinkSourceToTarget(newCluster2, newCluster4, false));
                                    graph_1.links.push(getLinkSourceToTarget(newCluster1, newCluster4, true));
                                    newClusters.push(newCluster3);
                                    newClusters.push(newCluster4);
                                    // // console.log("Fall 2 - origin gefunden")
                                    // let indexZiel = clusters.findIndex(
                                    //   c => c.stationID === stationID
                                    // )
                                    // // console.log("aktueller index " + index)
                                    // // console.log("index ziel " + indexZiel)
                                    // let zielCluster = clusters[indexZiel]
                                    // fallBearbeitet = indexZiel
                                    // let copyC1 = JSON.parse(JSON.stringify(zielCluster))
                                    // let copyC2 = JSON.parse(JSON.stringify(c))
                                    // copyC1.node = node++
                                    // copyC1.timestamp = timestamp
                                    // copyC1.timestampBefore = timestampBefore
                                    // copyC1.dummyNode = false
                                    // copyC1.nodeType = "preMovement"
                                    // copyC2.node = node++
                                    // copyC2.timestamp = timestamp
                                    // copyC2.timestampBefore = timestampBefore
                                    // copyC2.dummyNode = false
                                    // copyC2.nodeType = "preMovement"
                                    // let copyC3 = JSON.parse(JSON.stringify(zielCluster))
                                    // copyC3.lop.push(patientID)
                                    // copyC3.node = node++
                                    // copyC3.timestamp = timestamp
                                    // copyC3.timestampBefore = timestampBefore
                                    // copyC3.dummyNode = false
                                    // copyC3.nodeType = "postMovement"
                                    // let copyC4 = JSON.parse(JSON.stringify(c))
                                    // copyC4.lop = copyC4.lop.filter(pid => pid !== patientID)
                                    // copyC4.node = node++
                                    // copyC4.timestamp = timestamp
                                    // copyC4.timestampBefore = timestampBefore
                                    // copyC4.dummyNode = false
                                    // copyC4.nodeType = "postMovement"
                                    // graph.nodes.push(copyC1)
                                    // graph.nodes.push(copyC2)
                                    // graph.nodes.push(copyC3)
                                    // graph.nodes.push(copyC4)
                                    // graph.links.push({
                                    //   lop: copyC1.lop,
                                    //   source: zielCluster.node,
                                    //   target: copyC1.node,
                                    //   ts_Beginn: zielCluster.timestamp,
                                    //   ts_Ende: copyC1.timestamp,
                                    //   timestampBefore: timestampBefore
                                    // })
                                    // graph.links.push({
                                    //   lop: copyC2.lop,
                                    //   source: c.node,
                                    //   target: copyC2.node,
                                    //   ts_Beginn: c.timestamp,
                                    //   ts_Ende: copyC2.timestamp,
                                    //   timestampBefore: timestampBefore
                                    // })
                                    // graph.links.push({
                                    //   lop: copyC1.lop,
                                    //   source: copyC1.node,
                                    //   target: copyC3.node,
                                    //   ts_Beginn: copyC1.timestamp,
                                    //   ts_Ende: copyC3.timestamp,
                                    //   timestampBefore: timestampBefore
                                    // })
                                    // graph.links.push({
                                    //   lop: [patientID],
                                    //   source: copyC2.node,
                                    //   target: copyC3.node,
                                    //   ts_Beginn: copyC2.timestamp,
                                    //   ts_Ende: copyC3.timestamp,
                                    //   timestampBefore: timestampBefore,
                                    //   BewegungstypID: e.BewegungstypID,
                                    //   Bewegungstyp: e.Bewegungstyp
                                    // })
                                    // graph.links.push({
                                    //   lop: copyC4.lop,
                                    //   source: copyC2.node,
                                    //   target: copyC4.node,
                                    //   ts_Beginn: copyC2.timestamp,
                                    //   ts_Ende: copyC4.timestamp,
                                    //   timestampBefore: timestampBefore
                                    // })
                                    // // newClusters.push(copyC1)
                                    // // newClusters.push(copyC2)
                                    // newClusters.push(copyC3)
                                    // newClusters.push(copyC4)
                                }
                                else if (c.stationID === stationID_1) {
                                    // Wenn Cluster das Ziel ist,
                                    // dann muss auch die Quelle mit Patienten bearbeitet werden
                                    // dann wird der Index der Quelle in fallBearbeitet gespeichert
                                    var indexQuelle = clusters_1.findIndex(function (c) {
                                        return c.lop.includes(patientID);
                                    });
                                    var quelleCluster = clusters_1[indexQuelle];
                                    fallBearbeitet_1 = indexQuelle;
                                    var newCluster1 = __assign(__assign({}, JSON.parse(JSON.stringify(quelleCluster))), { node: node_1++, timestamp: timestamp, relevantNode: true, relevantType: "source", timestampBefore: timestampBefore_1, timestampAfter: timestampAfter, nodeType: "movement", 
                                        // timestep: index + 1,
                                        timestep: timestep1_4, infectionChangeOfPatient: undefined });
                                    var newCluster2 = __assign(__assign({}, JSON.parse(JSON.stringify(c))), { node: node_1++, timestamp: timestamp, relevantNode: true, relevantType: "source", timestampBefore: timestampBefore_1, timestampAfter: timestampAfter, nodeType: "movement", 
                                        // timestep: index + 1,
                                        timestep: timestep1_4, infectionChangeOfPatient: undefined });
                                    var newCluster3 = __assign(__assign({}, JSON.parse(JSON.stringify(quelleCluster))), { node: node_1++, timestamp: timestamp, relevantNode: true, relevantType: "target", timestampBefore: timestampBefore_1, timestampAfter: timestampAfter, nodeType: "movement", 
                                        // timestep: index + 1,
                                        timestep: timestep2_2, infectionChangeOfPatient: undefined });
                                    newCluster3.lop = newCluster3.lop.filter(function (pid) { return pid !== patientID; });
                                    var newCluster4 = __assign(__assign({}, JSON.parse(JSON.stringify(c))), { node: node_1++, timestamp: timestamp, relevantNode: true, relevantType: "target", timestampBefore: timestampBefore_1, timestampAfter: timestampAfter, nodeType: "movement", 
                                        // timestep: index + 1,
                                        timestep: timestep2_2, infectionChangeOfPatient: undefined });
                                    newCluster4.lop.push(patientID);
                                    graph_1.nodes.push(newCluster1);
                                    graph_1.nodes.push(newCluster2);
                                    graph_1.nodes.push(newCluster3);
                                    graph_1.nodes.push(newCluster4);
                                    graph_1.links.push(getLinkSourceToTarget(quelleCluster, newCluster1, false));
                                    graph_1.links.push(getLinkSourceToTarget(c, newCluster2, false));
                                    graph_1.links.push(getLinkSourceToTarget(newCluster1, newCluster3, false));
                                    graph_1.links.push(getLinkSourceToTarget(newCluster2, newCluster4, false));
                                    graph_1.links.push(getLinkSourceToTarget(newCluster1, newCluster4, true));
                                    newClusters.push(newCluster3);
                                    newClusters.push(newCluster4);
                                    // // console.log("Fall 2 - ziel gefunden")
                                    // let indexOrigin = clusters.findIndex(c =>
                                    //   c.lop.includes(patientID)
                                    // )
                                    // let originCluster = clusters[indexOrigin]
                                    // fallBearbeitet = indexOrigin
                                    // let copyC1 = JSON.parse(JSON.stringify(c))
                                    // let copyC2 = JSON.parse(JSON.stringify(originCluster))
                                    // copyC1.node = node++
                                    // copyC1.timestamp = timestamp
                                    // copyC1.timestampBefore = timestampBefore
                                    // copyC1.dummyNode = false
                                    // copyC1.nodeType = "preMovement"
                                    // copyC2.node = node++
                                    // copyC2.timestamp = timestamp
                                    // copyC2.timestampBefore = timestampBefore
                                    // copyC2.dummyNode = false
                                    // copyC2.nodeType = "preMovement"
                                    // let copyC3 = JSON.parse(JSON.stringify(c))
                                    // copyC3.lop.push(patientID)
                                    // copyC3.node = node++
                                    // copyC3.timestamp = timestamp
                                    // copyC3.timestampBefore = timestampBefore
                                    // copyC3.dummyNode = false
                                    // copyC3.nodeType = "postMovement"
                                    // let copyC4 = JSON.parse(JSON.stringify(originCluster))
                                    // copyC4.lop = copyC4.lop.filter(pid => pid !== patientID)
                                    // copyC4.node = node++
                                    // copyC4.timestamp = timestamp
                                    // copyC4.timestampBefore = timestampBefore
                                    // copyC4.dummyNode = false
                                    // copyC4.nodeType = "postMovement"
                                    // graph.nodes.push(copyC1)
                                    // graph.nodes.push(copyC2)
                                    // graph.nodes.push(copyC3)
                                    // graph.nodes.push(copyC4)
                                    // graph.links.push({
                                    //   lop: copyC1.lop,
                                    //   source: c.node,
                                    //   target: copyC1.node,
                                    //   ts_Beginn: c.timestamp,
                                    //   ts_Ende: copyC1.timestamp,
                                    //   timestampBefore: timestampBefore
                                    // })
                                    // graph.links.push({
                                    //   lop: copyC2.lop,
                                    //   source: originCluster.node,
                                    //   target: copyC2.node,
                                    //   ts_Beginn: originCluster.timestamp,
                                    //   ts_Ende: copyC2.timestamp,
                                    //   timestampBefore: timestampBefore
                                    // })
                                    // graph.links.push({
                                    //   lop: copyC1.lop,
                                    //   source: copyC1.node,
                                    //   target: copyC3.node,
                                    //   ts_Beginn: copyC1.timestamp,
                                    //   ts_Ende: copyC3.timestamp,
                                    //   timestampBefore: timestampBefore
                                    // })
                                    // graph.links.push({
                                    //   lop: [patientID],
                                    //   source: copyC2.node,
                                    //   target: copyC3.node,
                                    //   ts_Beginn: copyC2.timestamp,
                                    //   ts_Ende: copyC3.timestamp,
                                    //   timestampBefore: timestampBefore,
                                    //   BewegungstypID: e.BewegungstypID,
                                    //   Bewegungstyp: e.Bewegungstyp
                                    // })
                                    // graph.links.push({
                                    //   lop: copyC4.lop,
                                    //   source: copyC2.node,
                                    //   target: copyC4.node,
                                    //   ts_Beginn: copyC2.timestamp,
                                    //   ts_Ende: copyC4.timestamp,
                                    //   timestampBefore: timestampBefore
                                    // })
                                    // // newClusters.push(copyC1)
                                    // // newClusters.push(copyC2)
                                    // newClusters.push(copyC3)
                                    // newClusters.push(copyC4)
                                }
                                else {
                                    // weder Ziel- noch Quell-Cluster
                                    var newCluster1 = __assign(__assign({}, JSON.parse(JSON.stringify(c))), { node: node_1++, timestamp: timestamp, relevantNode: false, relevantType: "source", timestampBefore: timestampBefore_1, timestampAfter: timestampAfter, nodeType: "movement", 
                                        // timestep: index + 1,
                                        timestep: timestep1_4, infectionChangeOfPatient: undefined });
                                    var newCluster2 = __assign(__assign({}, JSON.parse(JSON.stringify(c))), { node: node_1++, timestamp: timestamp, relevantNode: false, relevantType: "target", timestampBefore: timestampBefore_1, timestampAfter: timestampAfter, nodeType: "movement", 
                                        // timestep: index + 1,
                                        timestep: timestep2_2, infectionChangeOfPatient: undefined });
                                    graph_1.nodes.push(newCluster1);
                                    graph_1.nodes.push(newCluster2);
                                    graph_1.links.push(getLinkSourceToTarget(c, newCluster1, false));
                                    graph_1.links.push(getLinkSourceToTarget(newCluster1, newCluster2, false));
                                    newClusters.push(newCluster2);
                                    // let copyC1 = JSON.parse(JSON.stringify(c))
                                    // copyC1.node = node++
                                    // copyC1.timestamp = timestamp
                                    // copyC1.timestampBefore = timestampBefore
                                    // copyC1.dummyNode = true
                                    // copyC1.nodeType = "preMovement"
                                    // let copyC2 = JSON.parse(JSON.stringify(c))
                                    // copyC2.node = node++
                                    // copyC2.timestamp = timestamp
                                    // copyC2.timestampBefore = timestampBefore
                                    // copyC2.dummyNode = true
                                    // copyC2.nodeType = "postMovement"
                                    // graph.nodes.push(copyC1)
                                    // graph.nodes.push(copyC2)
                                    // graph.links.push({
                                    //   lop: copyC1.lop,
                                    //   source: c.node,
                                    //   target: copyC1.node,
                                    //   ts_Beginn: c.timestamp,
                                    //   ts_Ende: copyC1.timestamp,
                                    //   timestampBefore: timestampBefore
                                    // })
                                    // graph.links.push({
                                    //   lop: copyC2.lop,
                                    //   source: copyC1.node,
                                    //   target: copyC2.node,
                                    //   ts_Beginn: copyC1.timestamp,
                                    //   ts_Ende: copyC2.timestamp,
                                    //   timestampBefore: timestampBefore
                                    // })
                                    // // newClusters.push(copyC1)
                                    // newClusters.push(copyC2)
                                }
                            }
                        });
                    }
                    else if (patientAlleine && !zielExistiert) {
                        // clusters.forEach((c, index) => {
                        //   if (index == patientClusterIndex) {
                        //     c.stationID = stationID
                        //   }
                        // })
                        // return
                        // console.log("Fall 3")
                        /**
                         * Fall 3
                         * Falls Patient alleine ist und das Ziel nicht existiert
                         * Aus EINS wird EINS
                         */
                        var timestep1_5 = timestepCounter_1++;
                        var timestep2_3 = timestepCounter_1++;
                        clusters_1.forEach(function (c, index) {
                            if (index === patientClusterIndex_1) {
                                var newCluster1 = __assign(__assign({}, JSON.parse(JSON.stringify(c))), { node: node_1++, timestamp: timestamp, relevantNode: true, relevantType: "source", timestampBefore: timestampBefore_1, timestampAfter: timestampAfter, nodeType: "movement", 
                                    // timestep: index + 1,
                                    timestep: timestep1_5, infectionChangeOfPatient: undefined });
                                var newCluster2 = __assign(__assign({}, JSON.parse(JSON.stringify(c))), { node: node_1++, timestamp: timestamp, relevantNode: true, relevantType: "target", timestampBefore: timestampBefore_1, timestampAfter: timestampAfter, nodeType: "movement", 
                                    // timestep: index + 1,
                                    timestep: timestep2_3, infectionChangeOfPatient: undefined, space: "klinik", stationID: stationID_1, stationClusterID: stationClusterIDcounter_1++ });
                                graph_1.nodes.push(newCluster1);
                                graph_1.nodes.push(newCluster2);
                                graph_1.links.push(getLinkSourceToTarget(c, newCluster1, false));
                                graph_1.links.push(
                                // getLinkSourceToTarget(newCluster1, newCluster2, true)
                                getLinkSourceToTarget(newCluster1, newCluster2, false));
                                newClusters.push(newCluster2);
                                // let copyC1 = JSON.parse(JSON.stringify(c))
                                // copyC1.node = node++
                                // copyC1.timestamp = timestamp
                                // copyC1.timestampBefore = timestampBefore
                                // copyC1.dummyNode = false
                                // copyC1.nodeType = "preMovement"
                                // let copyC2 = JSON.parse(JSON.stringify(c))
                                // copyC2.node = node++
                                // copyC2.timestamp = timestamp
                                // copyC2.timestampBefore = timestampBefore
                                // copyC2.dummyNode = false
                                // copyC2.nodeType = "postMovement"
                                // copyC2.space = "klinik"
                                // copyC2.stationID = stationID
                                // graph.nodes.push(copyC1)
                                // graph.nodes.push(copyC2)
                                // graph.links.push({
                                //   lop: copyC1.lop,
                                //   source: c.node,
                                //   target: copyC1.node,
                                //   ts_Beginn: c.timestamp,
                                //   ts_Ende: copyC1.timestamp,
                                //   timestampBefore: timestampBefore
                                // })
                                // graph.links.push({
                                //   lop: [patientID],
                                //   source: copyC1.node,
                                //   target: copyC2.node,
                                //   ts_Beginn: copyC1.timestamp,
                                //   ts_Ende: copyC2.timestamp,
                                //   timestampBefore: timestampBefore,
                                //   BewegungstypID: e.BewegungstypID,
                                //   Bewegungstyp: e.Bewegungstyp
                                // })
                                // // newClusters.push(copyC1)
                                // newClusters.push(copyC2)
                            }
                            else {
                                var newCluster1 = __assign(__assign({}, JSON.parse(JSON.stringify(c))), { node: node_1++, timestamp: timestamp, relevantNode: false, relevantType: "source", timestampBefore: timestampBefore_1, timestampAfter: timestampAfter, nodeType: "movement", 
                                    // timestep: index + 1,
                                    timestep: timestep1_5, infectionChangeOfPatient: undefined });
                                var newCluster2 = __assign(__assign({}, JSON.parse(JSON.stringify(c))), { node: node_1++, timestamp: timestamp, relevantNode: false, relevantType: "target", timestampBefore: timestampBefore_1, timestampAfter: timestampAfter, nodeType: "movement", 
                                    // timestep: index + 1,
                                    timestep: timestep2_3, infectionChangeOfPatient: undefined });
                                graph_1.nodes.push(newCluster1);
                                graph_1.nodes.push(newCluster2);
                                graph_1.links.push(getLinkSourceToTarget(c, newCluster1, false));
                                graph_1.links.push(getLinkSourceToTarget(newCluster1, newCluster2, false));
                                newClusters.push(newCluster2);
                                // let copyC1 = JSON.parse(JSON.stringify(c))
                                // copyC1.node = node++
                                // copyC1.timestamp = timestamp
                                // copyC1.timestampBefore = timestampBefore
                                // copyC1.dummyNode = true
                                // copyC1.nodeType = "preMovement"
                                // let copyC2 = JSON.parse(JSON.stringify(c))
                                // copyC2.node = node++
                                // copyC2.timestamp = timestamp
                                // copyC2.timestampBefore = timestampBefore
                                // copyC2.dummyNode = true
                                // copyC2.nodeType = "postMovement"
                                // graph.nodes.push(copyC1)
                                // graph.nodes.push(copyC2)
                                // graph.links.push({
                                //   lop: copyC1.lop,
                                //   source: c.node,
                                //   target: copyC1.node,
                                //   ts_Beginn: c.timestamp,
                                //   ts_Ende: copyC1.timestamp,
                                //   timestampBefore: timestampBefore
                                // })
                                // graph.links.push({
                                //   lop: copyC2.lop,
                                //   source: copyC1.node,
                                //   target: copyC2.node,
                                //   ts_Beginn: copyC1.timestamp,
                                //   ts_Ende: copyC2.timestamp,
                                //   timestampBefore: timestampBefore
                                // })
                                // // newClusters.push(copyC1)
                                // newClusters.push(copyC2)
                            }
                        });
                    }
                    else if (patientAlleine && zielExistiert) {
                        // console.log("Fall 4")
                        /**
                         * Fall 4
                         * Falls Patient alleine ist und das Ziel existiert
                         * Aus ZWEI wird EINS
                         */
                        var fallBearbeitet_2 = false;
                        var timestep1_6 = timestepCounter_1++;
                        var timestep2_4 = timestepCounter_1++;
                        clusters_1.forEach(function (c, index) {
                            if (index === fallBearbeitet_2) {
                                // Fall wurde schon bearbeitet
                            }
                            else {
                                if (c.lop.includes(patientID)) {
                                    var indexZiel = clusters_1.findIndex(function (c) { return c.stationID === stationID_1; });
                                    var zielCluster = clusters_1[indexZiel];
                                    fallBearbeitet_2 = indexZiel;
                                    var newCluster1 = __assign(__assign({}, JSON.parse(JSON.stringify(c))), { node: node_1++, timestamp: timestamp, relevantNode: true, relevantType: "source", timestampBefore: timestampBefore_1, timestampAfter: timestampAfter, nodeType: "movement", 
                                        // timestep: index + 1,
                                        timestep: timestep1_6, infectionChangeOfPatient: undefined });
                                    var newCluster2 = __assign(__assign({}, JSON.parse(JSON.stringify(zielCluster))), { node: node_1++, timestamp: timestamp, relevantNode: true, relevantType: "source", timestampBefore: timestampBefore_1, timestampAfter: timestampAfter, nodeType: "movement", 
                                        // timestep: index + 1,
                                        timestep: timestep1_6, infectionChangeOfPatient: undefined });
                                    var newCluster3 = __assign(__assign({}, JSON.parse(JSON.stringify(zielCluster))), { node: node_1++, timestamp: timestamp, relevantNode: true, relevantType: "target", timestampBefore: timestampBefore_1, timestampAfter: timestampAfter, nodeType: "movement", 
                                        // timestep: index + 1,
                                        timestep: timestep2_4, infectionChangeOfPatient: undefined });
                                    newCluster3.lop.push(patientID);
                                    graph_1.nodes.push(newCluster1);
                                    graph_1.nodes.push(newCluster2);
                                    graph_1.nodes.push(newCluster3);
                                    graph_1.links.push(getLinkSourceToTarget(c, newCluster1, false));
                                    graph_1.links.push(getLinkSourceToTarget(zielCluster, newCluster2, false));
                                    graph_1.links.push(getLinkSourceToTarget(newCluster1, newCluster3, true));
                                    graph_1.links.push(getLinkSourceToTarget(newCluster2, newCluster3, false));
                                    newClusters.push(newCluster3);
                                    // let indexZiel = clusters.findIndex(
                                    //   c => c.stationID === stationID
                                    // )
                                    // let zielCluster = clusters[indexZiel]
                                    // fallBearbeitet = indexZiel
                                    // let copyC1 = JSON.parse(JSON.stringify(zielCluster))
                                    // let copyC2 = JSON.parse(JSON.stringify(c))
                                    // copyC1.node = node++
                                    // copyC1.timestamp = timestamp
                                    // copyC1.timestampBefore = timestampBefore
                                    // copyC1.dummyNode = false
                                    // copyC1.nodeType = "preMovement"
                                    // copyC2.node = node++
                                    // copyC2.timestamp = timestamp
                                    // copyC2.timestampBefore = timestampBefore
                                    // copyC2.dummyNode = false
                                    // copyC2.nodeType = "preMovement"
                                    // let copyC3 = JSON.parse(JSON.stringify(zielCluster))
                                    // copyC3.lop.push(patientID)
                                    // copyC3.node = node++
                                    // copyC3.timestamp = timestamp
                                    // copyC3.timestampBefore = timestampBefore
                                    // copyC3.dummyNode = false
                                    // copyC3.nodeType = "postMovement"
                                    // graph.nodes.push(copyC1)
                                    // graph.nodes.push(copyC2)
                                    // graph.nodes.push(copyC3)
                                    // graph.links.push({
                                    //   lop: copyC1.lop,
                                    //   source: zielCluster.node,
                                    //   target: copyC1.node,
                                    //   ts_Beginn: zielCluster.timestamp,
                                    //   ts_Ende: copyC1.timestamp,
                                    //   timestampBefore: timestampBefore
                                    // })
                                    // graph.links.push({
                                    //   lop: copyC2.lop,
                                    //   source: c.node,
                                    //   target: copyC2.node,
                                    //   ts_Beginn: c.timestamp,
                                    //   ts_Ende: copyC2.timestamp,
                                    //   timestampBefore: timestampBefore
                                    // })
                                    // graph.links.push({
                                    //   lop: copyC1.lop,
                                    //   source: copyC1.node,
                                    //   target: copyC3.node,
                                    //   ts_Beginn: copyC1.timestamp,
                                    //   ts_Ende: copyC3.timestamp,
                                    //   timestampBefore: timestampBefore
                                    // })
                                    // graph.links.push({
                                    //   lop: [patientID],
                                    //   source: copyC2.node,
                                    //   target: copyC3.node,
                                    //   ts_Beginn: copyC2.timestamp,
                                    //   ts_Ende: copyC3.timestamp,
                                    //   timestampBefore: timestampBefore,
                                    //   BewegungstypID: e.BewegungstypID,
                                    //   Bewegungstyp: e.Bewegungstyp
                                    // })
                                    // // newClusters.push(copyC1)
                                    // // newClusters.push(copyC2)
                                    // newClusters.push(copyC3)
                                }
                                else if (c.stationID === stationID_1) {
                                    var indexQuelle = clusters_1.findIndex(function (c) {
                                        return c.lop.includes(patientID);
                                    });
                                    var quelleCluster = clusters_1[indexQuelle];
                                    fallBearbeitet_2 = indexQuelle;
                                    var newCluster1 = __assign(__assign({}, JSON.parse(JSON.stringify(quelleCluster))), { node: node_1++, timestamp: timestamp, relevantNode: true, relevantType: "source", timestampBefore: timestampBefore_1, timestampAfter: timestampAfter, nodeType: "movement", 
                                        // timestep: index + 1,
                                        timestep: timestep1_6, infectionChangeOfPatient: undefined });
                                    var newCluster2 = __assign(__assign({}, JSON.parse(JSON.stringify(c))), { node: node_1++, timestamp: timestamp, relevantNode: true, relevantType: "source", timestampBefore: timestampBefore_1, timestampAfter: timestampAfter, nodeType: "movement", 
                                        // timestep: index + 1,
                                        timestep: timestep1_6, infectionChangeOfPatient: undefined });
                                    var newCluster3 = __assign(__assign({}, JSON.parse(JSON.stringify(c))), { node: node_1++, timestamp: timestamp, relevantNode: true, relevantType: "target", timestampBefore: timestampBefore_1, timestampAfter: timestampAfter, nodeType: "movement", 
                                        // timestep: index + 1,
                                        timestep: timestep2_4, infectionChangeOfPatient: undefined });
                                    newCluster3.lop.push(patientID);
                                    graph_1.nodes.push(newCluster1);
                                    graph_1.nodes.push(newCluster2);
                                    graph_1.nodes.push(newCluster3);
                                    graph_1.links.push(getLinkSourceToTarget(quelleCluster, newCluster1, false));
                                    graph_1.links.push(getLinkSourceToTarget(c, newCluster2, false));
                                    graph_1.links.push(getLinkSourceToTarget(newCluster1, newCluster3, true));
                                    graph_1.links.push(getLinkSourceToTarget(newCluster2, newCluster3, false));
                                    newClusters.push(newCluster3);
                                    // let indexOrigin = clusters.findIndex(c =>
                                    //   c.lop.includes(patientID)
                                    // )
                                    // let originCluster = clusters[indexOrigin]
                                    // fallBearbeitet = indexOrigin
                                    // let copyC1 = JSON.parse(JSON.stringify(c))
                                    // let copyC2 = JSON.parse(JSON.stringify(originCluster))
                                    // copyC1.node = node++
                                    // copyC1.timestamp = timestamp
                                    // copyC1.timestampBefore = timestampBefore
                                    // copyC1.dummyNode = false
                                    // copyC1.nodeType = "preMovement"
                                    // copyC2.node = node++
                                    // copyC2.timestamp = timestamp
                                    // copyC2.timestampBefore = timestampBefore
                                    // copyC2.dummyNode = false
                                    // copyC2.nodeType = "preMovement"
                                    // let copyC3 = JSON.parse(JSON.stringify(c))
                                    // copyC3.lop.push(patientID)
                                    // copyC3.node = node++
                                    // copyC3.timestamp = timestamp
                                    // copyC3.timestampBefore = timestampBefore
                                    // copyC3.dummyNode = false
                                    // copyC3.nodeType = "postMovement"
                                    // graph.nodes.push(copyC1)
                                    // graph.nodes.push(copyC2)
                                    // graph.nodes.push(copyC3)
                                    // graph.links.push({
                                    //   lop: copyC1.lop,
                                    //   source: c.node,
                                    //   target: copyC1.node,
                                    //   ts_Beginn: c.timestamp,
                                    //   ts_Ende: copyC1.timestamp,
                                    //   timestampBefore: timestampBefore
                                    // })
                                    // graph.links.push({
                                    //   lop: copyC2.lop,
                                    //   source: originCluster.node,
                                    //   target: copyC2.node,
                                    //   ts_Beginn: originCluster.timestamp,
                                    //   ts_Ende: copyC2.timestamp,
                                    //   timestampBefore: timestampBefore
                                    // })
                                    // graph.links.push({
                                    //   lop: copyC1.lop,
                                    //   source: copyC1.node,
                                    //   target: copyC3.node,
                                    //   ts_Beginn: copyC1.timestamp,
                                    //   ts_Ende: copyC3.timestamp,
                                    //   timestampBefore: timestampBefore
                                    // })
                                    // graph.links.push({
                                    //   lop: [patientID],
                                    //   source: copyC2.node,
                                    //   target: copyC3.node,
                                    //   ts_Beginn: copyC2.timestamp,
                                    //   ts_Ende: copyC3.timestamp,
                                    //   timestampBefore: timestampBefore,
                                    //   BewegungstypID: e.BewegungstypID,
                                    //   Bewegungstyp: e.Bewegungstyp
                                    // })
                                    // // newClusters.push(copyC1)
                                    // // newClusters.push(copyC2)
                                    // newClusters.push(copyC3)
                                }
                                else {
                                    // weder Ziel- noch Quell-Cluster
                                    var newCluster1 = __assign(__assign({}, JSON.parse(JSON.stringify(c))), { node: node_1++, timestamp: timestamp, relevantNode: false, relevantType: "source", timestampBefore: timestampBefore_1, timestampAfter: timestampAfter, nodeType: "movement", 
                                        // timestep: index + 1,
                                        timestep: timestep1_6, infectionChangeOfPatient: undefined });
                                    var newCluster2 = __assign(__assign({}, JSON.parse(JSON.stringify(c))), { node: node_1++, timestamp: timestamp, relevantNode: false, relevantType: "target", timestampBefore: timestampBefore_1, timestampAfter: timestampAfter, nodeType: "movement", 
                                        // timestep: index + 1,
                                        timestep: timestep2_4, infectionChangeOfPatient: undefined });
                                    graph_1.nodes.push(newCluster1);
                                    graph_1.nodes.push(newCluster2);
                                    graph_1.links.push(getLinkSourceToTarget(c, newCluster1, false));
                                    graph_1.links.push(getLinkSourceToTarget(newCluster1, newCluster2, false));
                                    newClusters.push(newCluster2);
                                    // let copyC1 = JSON.parse(JSON.stringify(c))
                                    // copyC1.node = node++
                                    // copyC1.timestamp = timestamp
                                    // copyC1.timestampBefore = timestampBefore
                                    // copyC1.dummyNode = true
                                    // copyC1.nodeType = "preMovement"
                                    // let copyC2 = JSON.parse(JSON.stringify(c))
                                    // copyC2.node = node++
                                    // copyC2.timestamp = timestamp
                                    // copyC2.timestampBefore = timestampBefore
                                    // copyC2.dummyNode = true
                                    // copyC2.nodeType = "postMovement"
                                    // graph.nodes.push(copyC1)
                                    // graph.nodes.push(copyC2)
                                    // graph.links.push({
                                    //   lop: copyC1.lop,
                                    //   source: c.node,
                                    //   target: copyC1.node,
                                    //   ts_Beginn: c.timestamp,
                                    //   ts_Ende: copyC1.timestamp,
                                    //   timestampBefore: timestampBefore
                                    // })
                                    // graph.links.push({
                                    //   lop: copyC2.lop,
                                    //   source: copyC1.node,
                                    //   target: copyC2.node,
                                    //   ts_Beginn: copyC1.timestamp,
                                    //   ts_Ende: copyC2.timestamp,
                                    //   timestampBefore: timestampBefore
                                    // })
                                    // // newClusters.push(copyC1)
                                    // newClusters.push(copyC2)
                                }
                            }
                        });
                    }
                }
                else {
                    console.error("EventType " + eventType + " can not be handled.");
                }
                clusters_1 = newClusters;
                if (maxClusterCountPerTimestep_1 < newClusters.length) {
                    maxClusterCountPerTimestep_1 = newClusters.length;
                }
                timestampBefore_1 = timestamp;
            });
            // console.log(graph)
            console.error("Bewegungen ohne Stationsweichsel: " + BewegungOhneStationswechsel_1);
            var timestep1_7 = timestepCounter_1++;
            clusters_1.forEach(function (c) {
                // let { patientID, eventType, timestamp } = e
                var newCluster1 = __assign(__assign({}, JSON.parse(JSON.stringify(c))), { node: node_1++, timestamp: timestamps_1[timestamps_1.length - 1], relevantNode: false, relevantType: "target", timestampBefore: timestampBefore_1, timestampAfter: timestamps_1[timestamps_1.length - 1], nodeType: "movement", 
                    // timestep: events.length + 1,
                    timestep: timestep1_7, infectionChangeOfPatient: undefined });
                graph_1.nodes.push(newCluster1);
                graph_1.links.push(getLinkSourceToTarget(c, newCluster1, false));
            });
            // clusters.forEach((c, index) => {
            //   let copyC1 = JSON.parse(JSON.stringify(c))
            //   copyC1.node = node++
            //   // copyC1.timestamp = timestampAfter
            //   copyC1.timestamp = lastLastTimestamp
            //   copyC1.timestampBefore = timestampBefore
            //   copyC1.dummyNode = false
            //   copyC1.nodeType = "singleMovement"
            //   graph.nodes.push(copyC1)
            //   graph.links.push({
            //     lop: copyC1.lop,
            //     source: c.node,
            //     target: copyC1.node,
            //     ts_Beginn: c.timestamp,
            //     ts_Ende: copyC1.timestamp,
            //     timestampBefore: timestampBefore
            //   })
            // newClusters.push(copyC1)
            // })
            graph_1.nodes.forEach(function (n) {
                n.id = n.node;
            });
            var allTimestamps = [timestamps_1[0] - 0.05 * timespan].concat(timestamps_1);
            graph_1.allTimestamps = allTimestamps;
            graph_1.maxClusterCountPerTimestep = maxClusterCountPerTimestep_1;
            graph_1.stationClusterIDcounter = stationClusterIDcounter_1;
            graphsCategorized["K" + keimID] = graph_1;
            var e_1 = (nodesByTimestamp["K" + keimID] = []);
            graph_1.nodes.forEach(function (n) {
                var timestamp = n.timestamp;
                var index = e_1.findIndex(function (e) { return e.timestamp === timestamp; });
                if (index === -1) {
                    e_1.push({
                        timestamp: timestamp,
                        nodes: [],
                    });
                    index = e_1.length - 1;
                }
                e_1[index].nodes.push(JSON.parse(JSON.stringify(n)));
            });
            graph_1.links.forEach(function (l) {
                l.value = l.lop.length + 1;
                // l.value = 1
            });
        }
    });
    console.log("Parsing fertig");
    return {
        parsedData: parsedData,
        withDummyNodes: withDummyNodes,
        rawData: { rawMicroData: rawMicroData, rawMovementData: rawMovementData },
        allMovements: allMovements,
        allInspections: allInspections,
        patients: patients,
        keime: keime,
        allRelevantInspections: allRelevantInspections,
        allEvents: allEvents,
        eventsCategorized: eventsCategorized,
        graphsCategorized: graphsCategorized,
        nodesByTimestamp: nodesByTimestamp,
        stationList: stationList,
    };
};
exports.default = parseToStorylineData;
//# sourceMappingURL=storylineParser.js.map