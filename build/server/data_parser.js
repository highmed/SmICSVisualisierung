"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var carrier_status_1 = require("./utilities/carrier_status");
var data_parser = {
    /**
     * Akkumulates all Mibi-data from the same person, pathogen and timestamp
     *
     * Name der geparsten Daten
     * welche raw-data benoetigt werden
     * die parse-funktion selbst implementieren; default (z.B: on Error etc)
     * ein leeres Array ([]) zurueck geben
     */
    // TODO: ERROR-Message(s) mit zurueck geben...
    generate_mibi_investigations: {
        needed_raw_data: ["Patient_Labordaten_Ps"],
        call_function: function (input_data, parameters) {
            var Patient_Labordaten_Ps = input_data.Patient_Labordaten_Ps;
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
            var patientList = parameters.patientList;
            var first_timestamp = Number.MAX_VALUE;
            var last_timestamp = 0;
            var investigations = [];
            // Selber Patient, selbes Datum und selber Keim gehoeren zusammen
            if (Patient_Labordaten_Ps.error === undefined) {
                // TODO: SMICS-0.8
                // Patientenliste wegen Nth-Degree rauslesen
                var new_patient_list_1 = [];
                Patient_Labordaten_Ps.data.forEach(function (invest) {
                    invest.timestamp = new Date(invest.Eingangsdatum).getTime();
                    if (!new_patient_list_1.includes(invest.PatientID)) {
                        new_patient_list_1.push(invest.PatientID);
                    }
                });
                patientList = new_patient_list_1;
                Patient_Labordaten_Ps.data.sort(function (a, b) { return a.timestamp - b.timestamp; });
                // console.log(Patient_Labordaten_Ps)
                Patient_Labordaten_Ps.data.forEach(function (investigation_data) {
                    // let timestamp = new Date(investigation_data.Eingangsdatum).getTime()
                    var timestamp = investigation_data.timestamp;
                    if (timestamp < first_timestamp) {
                        first_timestamp = timestamp;
                    }
                    if (timestamp > last_timestamp) {
                        last_timestamp = timestamp;
                    }
                    var investigation_hash = investigation_data.Eingangsdatum +
                        investigation_data.PatientID +
                        investigation_data.KeimID;
                    var index = investigations.findIndex(function (d) { return d.investigation_hash === investigation_hash; });
                    var investigation_data_copy = JSON.parse(JSON.stringify(investigation_data));
                    console.log("PatientID: " + investigation_data.PatientID);
                    if (index < 0) {
                        investigations.push({
                            investigation_hash: investigation_hash,
                            data: [investigation_data_copy],
                            timestamp: timestamp,
                            patient_id: investigation_data.PatientID,
                            pathogen_id: investigation_data.KeimID,
                            // negative, unknown, infected, diseased
                            result: carrier_status_1.get_carrier_status(investigation_data.Befund, investigation_data.Screening, 
                            // "unknown"
                            // TODO: SMICS-0.8
                            "negative"),
                        });
                        console.log("index < 0");
                    }
                    else {
                        investigations[index].data.push(investigation_data_copy);
                        investigations[index].result = carrier_status_1.get_carrier_status(investigation_data.Befund, investigation_data.Screening, investigations[index].result);
                        console.log("index > 0");
                    }
                });
            }
            var status_changes = {};
            // just to track current patient status for pathogen
            var last_status = {};
            patientList.forEach(function (pID) {
                status_changes[pID] = {};
                last_status[pID] = {};
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
                var pat_investigations = investigations.filter(function (d) { return d.patient_id === pID; });
                pat_investigations.forEach(function (invest) {
                    // abchecken, ob neuer status "schlimmer" ist
                    // -> dann status-wechsel
                    // kann ich generisch implementieren!
                    var path_id = invest.pathogen_id;
                    var old_status = last_status[pID][path_id];
                    var new_status = invest.result;
                    if (old_status === undefined) {
                        status_changes[pID][path_id] = [];
                    }
                    if (old_status !== new_status) {
                        status_changes[pID][path_id].push({
                            new_status: new_status,
                            timestamp: invest.timestamp,
                        });
                        last_status[pID][path_id] = new_status;
                    }
                });
            });
            return {
                timestamp: new Date().getTime(),
                first_timestamp: first_timestamp,
                last_timestamp: last_timestamp,
                patientList: patientList,
                investigations: investigations,
                status_changes: status_changes,
            };
        },
    },
    // TODO: SMICS-0.8
    generate_mibi_investigations_TEMP: {
        needed_raw_data: ["Contact_NthDegree_TTKP_Degree"],
        call_function: function (input_data, parameters) {
            var Contact_NthDegree_TTKP_Degree = input_data.Contact_NthDegree_TTKP_Degree;
            var Labordaten = Contact_NthDegree_TTKP_Degree.data.Labordaten;
            var Patient_Labordaten_Ps = {
                error: undefined,
                data: Labordaten,
            };
            var patientList = parameters.patientList;
            var first_timestamp = Number.MAX_VALUE;
            var last_timestamp = 0;
            var investigations = [];
            // Selber Patient, selbes Datum und selber Keim gehoeren zusammen
            if (Patient_Labordaten_Ps.error === undefined) {
                // TODO: SMICS-0.8
                // Patientenliste wegen Nth-Degree rauslesen
                var new_patient_list_2 = [];
                Patient_Labordaten_Ps.data.forEach(function (invest) {
                    invest.timestamp = new Date(invest.Eingangsdatum).getTime();
                    if (!new_patient_list_2.includes(invest.PatientID)) {
                        new_patient_list_2.push(invest.PatientID);
                    }
                });
                patientList = new_patient_list_2;
                Patient_Labordaten_Ps.data.sort(function (a, b) { return a - b; });
                // console.log(Patient_Labordaten_Ps)
                Patient_Labordaten_Ps.data.forEach(function (investigation_data) {
                    // let timestamp = new Date(investigation_data.Eingangsdatum).getTime()
                    var timestamp = investigation_data.timestamp;
                    if (timestamp < first_timestamp) {
                        first_timestamp = timestamp;
                    }
                    if (timestamp > last_timestamp) {
                        last_timestamp = timestamp;
                    }
                    var investigation_hash = investigation_data.Eingangsdatum +
                        investigation_data.PatientID +
                        investigation_data.KeimID;
                    var index = investigations.findIndex(function (d) { return d.investigation_hash === investigation_hash; });
                    var investigation_data_copy = JSON.parse(JSON.stringify(investigation_data));
                    if (index < 0) {
                        investigations.push({
                            investigation_hash: investigation_hash,
                            data: [investigation_data_copy],
                            timestamp: timestamp,
                            patient_id: investigation_data.PatientID,
                            pathogen_id: investigation_data.KeimID,
                            // negative, unknown, infected, diseased
                            result: carrier_status_1.get_carrier_status(investigation_data.Befund, investigation_data.Screening, 
                            // "unknown"
                            // TODO: SMICS-0.8
                            "negative"),
                        });
                    }
                    else {
                        investigations[index].data.push(investigation_data_copy);
                        investigations[index].result = carrier_status_1.get_carrier_status(investigation_data.Befund, investigation_data.Screening, investigations[index].result);
                    }
                });
            }
            var status_changes = {};
            // just to track current patient status for pathogen
            var last_status = {};
            patientList.forEach(function (pID) {
                status_changes[pID] = {};
                last_status[pID] = {};
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
                var pat_investigations = investigations.filter(function (d) { return d.patient_id === pID; });
                pat_investigations.forEach(function (invest) {
                    // abchecken, ob neuer status "schlimmer" ist
                    // -> dann status-wechsel
                    // kann ich generisch implementieren!
                    var path_id = invest.pathogen_id;
                    var old_status = last_status[pID][path_id];
                    var new_status = invest.result;
                    if (old_status === undefined) {
                        status_changes[pID][path_id] = [];
                    }
                    if (old_status !== new_status) {
                        status_changes[pID][path_id].push({
                            new_status: new_status,
                            timestamp: invest.timestamp,
                        });
                        last_status[pID][path_id] = new_status;
                    }
                });
            });
            return {
                timestamp: new Date().getTime(),
                first_timestamp: first_timestamp,
                last_timestamp: last_timestamp,
                patientList: patientList,
                investigations: investigations,
                status_changes: status_changes,
            };
        },
    },
    generate_contact_graph: {
        needed_raw_data: ["Patient_Labordaten_Ps", "Patient_Bewegung_Ps"],
        call_function: function (input_data, parameters) {
            /**
             * get pointers to the needed data
             * and run the algorithm
             */
            // TODO: generate_mibi_investigations aufrufen... (falls noch nicht vorhanden...)
            return {
                data: "data",
            };
        },
    },
};
exports.default = data_parser;
//# sourceMappingURL=data_parser.js.map