const parseToStorylineData = (input, specificKeimID) => {
  let { rawData, parameters } = input
  console.log("parse to storyline data")
  // console.log("TCL: parameters", JSON.stringify(parameters, null, 4))
  /**
   * in
   * parameters.lop = []
   * müssen alle PatientenIDs drin stehen!
   */
  // let lop = rawData.lop
  let stationList = []
  let { microData, movementData, lop } = rawData

  let rawMicroData = JSON.parse(JSON.stringify(microData))
  let rawMovementData = JSON.parse(JSON.stringify(movementData))

  // microData = microData
  // movementData = movementData

  let getLinkSourceToTarget = (sourceNode, targetNode, movementLink) => {
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
    }
  }

  /**
   * Behandlungen rausfiltern
   */
  movementData = movementData.filter((md) => md.BewegungstypID !== 4)

  let keime = {
    lok: [],
  }

  microData.forEach((untersuchung) => {
    untersuchung.ts_Auftrag = new Date(untersuchung.Auftragsdatum).getTime()
    untersuchung.ts_Eingang = new Date(untersuchung.Eingangsdatum).getTime()

    untersuchung.timestamp = untersuchung.ts_Eingang
    // untersuchung.PatientID = Number(untersuchung.PatientID)

    // TODO: Nur Hotfix (invertieren des Screening-Flags)
    untersuchung.Screening = untersuchung.Screening == 1 ? 0 : 1

    if (!keime.lok.includes(untersuchung.KeimID)) {
      keime.lok.push(untersuchung.KeimID)
      keime["K" + untersuchung.KeimID] = {
        keimID: untersuchung.KeimID,
        keim_k: untersuchung.Keim_k,
        keim_l: untersuchung.Keim_l,
        erstePositiveBefunde: [],
        letzteNgativeBefunde: [],
      }
    }
  })
  movementData.forEach((bewegung) => {
    bewegung.ts_Beginn = new Date(bewegung.Beginn).getTime()
    bewegung.ts_Ende = new Date(bewegung.Ende).getTime()

    bewegung.eventType = "Bewegung"
    bewegung.timestamp = bewegung.ts_Beginn
    bewegung.patientID = bewegung.PatientID
    bewegung.stationID = bewegung.Station
    // bewegung.PatientID = Number(bewegung.PatientID)

    if (!stationList.includes(bewegung.Station)) {
      stationList.push(bewegung.Station)
    }
  })

  let patients = {
    lop: lop,
  }
  let allPatientMovements = []
  let allPatientInspections = []

  lop.forEach((patientID) => {
    let patientMicroData = microData.filter((md) => md.PatientID === patientID)
    let patientMovementData = movementData.filter(
      (md) => md.PatientID === patientID
    )

    let untersuchungen = []

    let keimeInfos = {}

    keime.lok.forEach((kid) => {
      keimeInfos["K" + kid] = {
        erstesPositiv: undefined,
        letztesNegativ: undefined,
        positive: [],
        negative: [],
      }
    })

    /**
     * Akkumulieren der MicroData:
     * - alle Untersuchungen mit selbem Zeitstempel zusamemnfassen
     * - keimeInfos mit Informationen zu allen Keimen für jeden Patienten
     */
    patientMicroData.forEach((pmd) => {
      let indexOfInspec = untersuchungen.findIndex(
        (u) => u.timestamp === pmd.timestamp
      )

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
        })
        indexOfInspec = untersuchungen.length - 1
      }

      let unt = untersuchungen[indexOfInspec]

      // nur wenn der Keim noch nicht im Array ist
      if (pmd.Screening === 1) {
        if (!unt.positiveKeime.includes(pmd.KeimID)) {
          unt.positiveKeime.push(pmd.KeimID)
        }
      } else {
        if (!unt.keimIDs.includes(pmd.KeimID)) {
          unt.keimIDs.push(pmd.KeimID)
        }
      }

      unt.inspections.push(pmd)

      // keimeInfos des Patienten aktualisieren
      let keimObject = keimeInfos["K" + pmd.KeimID]

      if (keimObject === undefined) {
        keimObject = keimeInfos["K" + pmd.KeimID] = {
          erstesPositiv: undefined,
          letztesNegativ: undefined,
          positive: [],
          negative: [],
        }
      }

      if (pmd.Screening === 1) {
        keimObject.positive.push(pmd.timestamp)
      } else {
        keimObject.negative.push(pmd.timestamp)
      }
    })

    /**
     * für jeden Keim bei jedem Patienten:
     * erstesPositiv und letztesNegativ finden
     */
    Object.getOwnPropertyNames(keimeInfos).forEach((keimID) => {
      let keimObject = keimeInfos[keimID]
      let negative = []
      if (keimObject.positive.length > 0) {
        keimObject.erstesPositiv = Math.min(...keimObject.positive)

        negative = keimObject.negative.filter(
          (ts) => ts < keimObject.erstesPositiv
        )
      } else {
        negative = keimObject.negative
      }

      if (negative.length > 0) {
        // keimObject.letztesNegativ = Math.max(...negative)
        keimObject.letztesNegativ = Math.min(...negative)
      }
    })

    Object.getOwnPropertyNames(keimeInfos).forEach((keimID) => {
      let keimObject = keimeInfos[keimID]

      if (keimObject.erstesPositiv) {
        keime[keimID].erstePositiveBefunde.push({
          patientID: patientID,
          timestamp: keimObject.erstesPositiv,
        })
      }
      if (keimObject.letztesNegativ) {
        keime[keimID].letzteNgativeBefunde.push({
          patientID: patientID,
          timestamp: keimObject.letztesNegativ,
        })
      }
    })

    /**
     * Die States aufgrund der Befunde generieren (Reihenfolge)
     */
    Object.getOwnPropertyNames(keimeInfos).forEach((keimID) => {
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
      let keimObject = keimeInfos[keimID]
      let patientStates = []
      if (
        keimObject.letztesNegativ === undefined &&
        keimObject.erstesPositiv === undefined
      ) {
        patientStates = ["statusUnbekannt"]
      } else if (
        keimObject.letztesNegativ === undefined &&
        keimObject.erstesPositiv !== undefined
      ) {
        // patientStates = ["statusAnsteckung", "statusInfiziert"]
        patientStates = ["statusHoltKeim", "statusKrank"]
      } else if (
        keimObject.letztesNegativ !== undefined &&
        keimObject.erstesPositiv === undefined
      ) {
        // patientStates = ["statusGesund", "statusUnbekannt"]
        patientStates = ["statusHoltKeim", "statusTraeger"]
      } else if (
        keimObject.letztesNegativ !== undefined &&
        keimObject.erstesPositiv !== undefined
      ) {
        // patientStates = ["statusGesund", "statusAnsteckung", "statusInfiziert"]
        patientStates = ["statusHoltKeim", "statusTraeger", "statusKrank"]
      }
      keimObject.patientStates = patientStates
    })

    /**
     * Wenn es nur eine Bewegung gibt: generiere zweite (Entlassung)
     * Erste und letzte Bewegung markieren
     * Wenn die erste Bewegung eine Aufnahme ist -> markieren
     * Wenn die letzte Bewegung eine Entlassung ist -> markieren
     */
    if (patientMovementData.length === 1) {
      console.error(
        `Patient mit ID ${patientID} hat nur eine Bewegung.
          Es wird eine zweite generiert.`
      )
      let copyMovement = JSON.parse(JSON.stringify(patientMovementData[0]))
      copyMovement.fakeMovement =
        "Kopierte Bewegung um zweites Event zu generieren"
      copyMovement.ts_Beginn = copyMovement.ts_Ende
      copyMovement.timestamp = new Date(copyMovement.ts_Beginn).getTime()
      copyMovement.BewegungstypID = 2
      copyMovement.Bewegungstyp = "(Entlassung)"
    }

    patientMovementData[0].ersteBewegung = true
    patientMovementData[patientMovementData.length - 1].letzteBewegung = true

    if (
      patientMovementData.length > 0 &&
      patientMovementData[0].BewegungstypID === 1
    ) {
      patientMovementData[0].ersteAufnahme = true
    } else {
      console.error(
        `Patient mit ID ${patientID} hat keine Aufnahme als erste Bewegung.`
      )
    }

    if (
      patientMovementData.length > 0 &&
      (patientMovementData[patientMovementData.length - 1].BewegungstypID ===
        2 ||
        patientMovementData[patientMovementData.length - 1].BewegungstypID ===
          4)
    ) {
      patientMovementData[
        patientMovementData.length - 1
      ].letzteEntlassung = true
    } else {
      console.error(
        `Patient mit ID ${patientID} hat keine Entlassung als letzte Bewegung.`
      )
    }

    allPatientMovements.push(patientMovementData)
    allPatientInspections.push(untersuchungen)

    /**
     * Patienten-Property mit allen Informationen zu diesem Patienten
     */
    patients["P" + patientID] = {
      // microData: patientMicroData,
      patientID: patientID,
      movementData: patientMovementData,
      keimeInfos: keimeInfos,
      untersuchungen: untersuchungen,
    }
  })

  /**
   * Erzeugen ALLER Events
   *
   */
  let allMovements = allPatientMovements.reduce((a, b) => [...a, ...b], [])
  let allInspections = allPatientInspections.reduce((a, b) => [...a, ...b], [])

  /**
   * Alle "relevanten" Untersuchungen
   * -> alle Untersuchungen nach den relevanten Zeitstempeln filtern
   */
  // let allRelevantInspections2 = allInspections.filter(i =>
  //   allRelevantInspectionTimestamps.includes(i.timestamp)
  // )
  let allRelevantInspections = []
  keime.lok.forEach((keimID) => {
    keime["K" + keimID].erstePositiveBefunde.forEach((befund) => {
      let index = allRelevantInspections.findIndex(
        (ri) =>
          ri.timestamp === befund.timestamp && ri.patientID === befund.patientID
      )

      if (index < 0) {
        let ri_index = allInspections.findIndex(
          (i) =>
            i.timestamp === befund.timestamp && i.patientID === befund.patientID
        )
        let ri = JSON.parse(JSON.stringify(allInspections[ri_index]))
        ri.erstePositiveKeime = []
        ri.letzteNegativeKeime = []
        allRelevantInspections.push(ri)
        index = allRelevantInspections.length - 1
      }

      let inspection = allRelevantInspections[index]
      inspection.erstePositiveKeime.push(keimID)
    })

    keime["K" + keimID].letzteNgativeBefunde.forEach((befund) => {
      let index = allRelevantInspections.findIndex(
        (ri) =>
          ri.timestamp === befund.timestamp && ri.patientID === befund.patientID
      )

      if (index < 0) {
        let ri_index = allInspections.findIndex(
          (i) =>
            i.timestamp === befund.timestamp && i.patientID === befund.patientID
        )
        let ri = JSON.parse(JSON.stringify(allInspections[ri_index]))
        ri.erstePositiveKeime = []
        ri.letzteNegativeKeime = []
        allRelevantInspections.push(ri)
        index = allRelevantInspections.length - 1
      }

      let inspection = allRelevantInspections[index]
      inspection.letzteNegativeKeime.push(keimID)
    })
  })
  allRelevantInspections.sort((a, b) => a.timestamp - b.timestamp)

  let allEvents = allMovements.concat(allRelevantInspections)
  allEvents.sort((a, b) => a.timestamp - b.timestamp)

  let parsedData = rawData
  let withDummyNodes = rawData
  // console.log(`input data: ${JSON.stringify(input, null, 4)}`)

  // console.log(rawMovementData[0].PatientID)
  let eventsCategorized = {}
  let graphsCategorized = {}
  let nodesByTimestamp = {}
  keime.lok.forEach((keimID, keimCounter) => {
    if (keimID !== specificKeimID) {
      // console.log(`KeimID ${keimID} wird übersprungen`)
    } else {
      console.error(`Für KeimID ${keimID} wird die SL berechnet`)

      let maxClusterCountPerTimestep = 2

      /**
       * Events für einen Keim zusammenfassen und soriteren
       */
      let inspections = allRelevantInspections.filter(
        (i) =>
          i.erstePositiveKeime.includes(keimID) ||
          i.letzteNegativeKeime.includes(keimID)
      )
      let events = allMovements.concat(inspections)

      events.sort((a, b) => a.timestamp - b.timestamp)

      let timestamps = []
      events.forEach((event) => {
        timestamps.push(event.timestamp)
      })

      let timespan = timestamps[timestamps.length - 1] - timestamps[0]
      timestamps.push(timestamps[timestamps.length - 1] + 0.05 * timespan)

      eventsCategorized["K" + keimID] = events

      /**
       * Graph-Struktur (nodes und links) für einen Keim erzeugen
       */

      let graph = {
        nodes: [],
        links: [],
        linksSkipDummys: [],
      }

      let firstTimestamp = events[0].timestamp
      let lastTimestamp = events[events.length - 1].timestamp
      let timestampDiff = lastTimestamp - firstTimestamp

      let timestampBefore = firstTimestamp - 0.05 * timestampDiff
      let lastLastTimestamp = lastTimestamp + 0.05 * timestampDiff

      let node = 0
      let stationClusterIDcounter = 0
      let timestepCounter = 0
      let clusters = [
        {
          // home, tmphome, klinik
          space: "home",
          stationID: "home",
          lop: lop,
          timestamp: timestampBefore,
          // stateNumber: 0,
          // undefined, pre, post
          // pufferNode: undefined,
          node: node++,
          // node: node - 1,
          relevantNode: false,
          relevantType: "source",
          timestep: 0,
          stationClusterID: stationClusterIDcounter++,
          // lastRelevantnode: node - 1
        },
        {
          // home, tmphome, klinik
          space: "tmphome",
          stationID: "tmphome",
          lop: [],
          timestamp: timestampBefore,
          // stateNumber: 0,
          // undefined, pre, post
          // pufferNode: undefined,
          node: node++,
          // node: node - 1,
          relevantNode: false,
          relevantType: "source",
          timestep: 0,
          stationClusterID: stationClusterIDcounter++,
          // lastRelevantnode: node - 1
        },
      ]
      graph.nodes.push(JSON.parse(JSON.stringify(clusters[0])))
      graph.nodes.push(JSON.parse(JSON.stringify(clusters[1])))
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
      let transitions = []
      let BewegungOhneStationswechsel = 0
      events.forEach((e, i) => {
        // if (BewegungWarDran < 20) {
        //   console.log(`---------- ANFANG ${i}----------`)
        //   console.log(clusters)
        //   console.log(`---------- ENDE ${i}----------`)
        // }
        // if (clusters.length > 100) {
        //   return
        // }
        // console.log(keimCounter, i, clusters.length)
        let { patientID, eventType, timestamp } = e
        // console.log(JSON.stringify(clusters, null, 4))

        let newClusters = []
        let timestampAfter = timestamps[i + 1]

        if (eventType === "Untersuchung") {
          let timestep1 = timestepCounter++
          clusters.forEach((c, index) => {
            let newCluster1 = {
              ...JSON.parse(JSON.stringify(c)),
              node: node++,
              timestamp: timestamp,
              relevantNode: c.lop.includes(patientID),
              // relevantType: undefined,
              relevantType: "source",
              timestampBefore: timestampBefore,
              timestampAfter: timestampAfter,
              nodeType: "inspection",
              // timestep: index + 1,
              timestep: timestep1,
              infectionChangeOfPatient: patientID,
            }

            graph.nodes.push(newCluster1)

            graph.links.push(getLinkSourceToTarget(c, newCluster1, false))

            newClusters.push(newCluster1)
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
          })
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
        } else if (eventType === "Bewegung") {
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
          let stationID = e.Station

          if (e.letzteBewegung) {
            stationID = "home"
          } else if (e.BewegungstypID === 2 || e.BewegungstypID === 6) {
            stationID = "tmphome"
          }

          let patientClusterIndex = clusters.findIndex((pc) =>
            pc.lop.includes(patientID)
          )
          // if (patientClusterIndex === -1) {
          //   console.log(patientID)
          //   console.log(JSON.stringify(clusters, null, 4))
          // }
          let patientAlleine = clusters[patientClusterIndex].lop.length === 1

          if (
            clusters[patientClusterIndex].stationID === "home" ||
            clusters[patientClusterIndex].stationID === "tmphome"
          ) {
            patientAlleine = false
          }
          let zielClusterIndex = clusters.findIndex(
            (zc) => zc.stationID === stationID
          )
          let zielExistiert = zielClusterIndex >= 0

          /**
           * Fall 0
           * Falls SourceCluster === TargetCluster
           * --> keine Bewegung/ kein Stationswechsel
           */
          if (zielExistiert && patientClusterIndex === zielClusterIndex) {
            return
            console.error(
              `Patient-Bewegung von ${patientID} hat keinen Stationswechsel`
            )

            BewegungOhneStationswechsel++
            // console.log("Fall 0")

            let timestep1 = timestepCounter++
            clusters.forEach((c, index) => {
              let newCluster1 = {
                ...JSON.parse(JSON.stringify(c)),
                node: node++,
                timestamp: timestamp,
                relevantNode: c.lop.includes(patientID),
                relevantType: undefined,
                timestampBefore: timestampBefore,
                timestampAfter: timestampAfter,
                nodeType: "movement",
                // timestep: index + 1,
                timestep: timestep1,
                infectionChangeOfPatient: undefined,
                // lop: cluster.lop.filter(pid => pid !== patientID)
              }

              graph.nodes.push(newCluster1)

              graph.links.push(getLinkSourceToTarget(c, newCluster1, false))

              newClusters.push(newCluster1)
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
            })
          } else if (!patientAlleine && !zielExistiert) {
            // console.log("Fall 1")
            /**
             * Fall 1
             * Falls der Patient nicht alleine ist und das Zielcluster nicht existiert
             * Aus EINS wird ZWEI
             */
            let timestep1 = timestepCounter++
            let timestep2 = timestepCounter++
            clusters.forEach((c, index) => {
              if (index === patientClusterIndex) {
                let newCluster1 = {
                  ...JSON.parse(JSON.stringify(c)),
                  node: node++,
                  timestamp: timestamp,
                  relevantNode: true,
                  relevantType: "source",
                  timestampBefore: timestampBefore,
                  timestampAfter: timestampAfter,
                  nodeType: "movement",
                  // timestep: index + 1,
                  timestep: timestep1,
                  infectionChangeOfPatient: undefined,
                }

                let newCluster2 = {
                  ...JSON.parse(JSON.stringify(c)),
                  node: node++,
                  timestamp: timestamp,
                  relevantNode: true,
                  relevantType: "target",
                  timestampBefore: timestampBefore,
                  timestampAfter: timestampAfter,
                  nodeType: "movement",
                  // timestep: index + 1,
                  timestep: timestep2,
                  infectionChangeOfPatient: undefined,
                  lop: c.lop.filter((pid) => pid !== patientID),
                }

                let newCluster3 = {
                  ...JSON.parse(JSON.stringify(c)),
                  node: node++,
                  timestamp: timestamp,
                  relevantNode: true,
                  relevantType: "target",
                  timestampBefore: timestampBefore,
                  timestampAfter: timestampAfter,
                  nodeType: "movement",
                  // timestep: index + 1,
                  timestep: timestep2,
                  infectionChangeOfPatient: undefined,
                  lop: [patientID],
                  space: "klinik",
                  stationID: stationID,
                  stationClusterID: stationClusterIDcounter++,
                }

                graph.nodes.push(newCluster1)
                graph.nodes.push(newCluster2)
                graph.nodes.push(newCluster3)

                graph.links.push(getLinkSourceToTarget(c, newCluster1, false))

                graph.links.push(
                  getLinkSourceToTarget(newCluster1, newCluster2, false)
                )

                graph.links.push(
                  getLinkSourceToTarget(newCluster1, newCluster3, true)
                )

                newClusters.push(newCluster2)
                newClusters.push(newCluster3)

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
              } else {
                let newCluster1 = {
                  ...JSON.parse(JSON.stringify(c)),
                  node: node++,
                  timestamp: timestamp,
                  relevantNode: false,
                  relevantType: "source",
                  timestampBefore: timestampBefore,
                  timestampAfter: timestampAfter,
                  nodeType: "movement",
                  // timestep: index + 1,
                  timestep: timestep1,
                  infectionChangeOfPatient: undefined,
                }

                let newCluster2 = {
                  ...JSON.parse(JSON.stringify(c)),
                  node: node++,
                  timestamp: timestamp,
                  relevantNode: false,
                  relevantType: "target",
                  timestampBefore: timestampBefore,
                  timestampAfter: timestampAfter,
                  nodeType: "movement",
                  // timestep: index + 1,
                  timestep: timestep2,
                  infectionChangeOfPatient: undefined,
                }

                graph.nodes.push(newCluster1)
                graph.nodes.push(newCluster2)

                graph.links.push(getLinkSourceToTarget(c, newCluster1, false))
                graph.links.push(
                  getLinkSourceToTarget(newCluster1, newCluster2, false)
                )

                newClusters.push(newCluster2)
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
            })
          } else if (!patientAlleine && zielExistiert) {
            // console.log("Fall 2")
            /**
             * Fall 2
             * Falls Patient nicht alleine ist und das Ziel existiert
             * Aus ZWEI wird ZWEI
             */
            let fallBearbeitet = false
            let timestep1 = timestepCounter++
            let timestep2 = timestepCounter++
            clusters.forEach((c, index) => {
              if (index === fallBearbeitet) {
                // Fall schon bearbeitet
              } else {
                if (c.lop.includes(patientID)) {
                  // Wenn Cluster den Patienten enthält,
                  // dann muss auch das Ziel bearbeitet werden
                  // dann wird der Index des Ziels in fallBearbeitet gespeichert
                  let indexZiel = clusters.findIndex(
                    (c) => c.stationID === stationID
                  )

                  let zielCluster = clusters[indexZiel]
                  fallBearbeitet = indexZiel

                  let newCluster1 = {
                    ...JSON.parse(JSON.stringify(c)),
                    node: node++,
                    timestamp: timestamp,
                    relevantNode: true,
                    relevantType: "source",
                    timestampBefore: timestampBefore,
                    timestampAfter: timestampAfter,
                    nodeType: "movement",
                    // timestep: index + 1,
                    timestep: timestep1,
                    infectionChangeOfPatient: undefined,
                  }

                  let newCluster2 = {
                    ...JSON.parse(JSON.stringify(zielCluster)),
                    node: node++,
                    timestamp: timestamp,
                    relevantNode: true,
                    relevantType: "source",
                    timestampBefore: timestampBefore,
                    timestampAfter: timestampAfter,
                    nodeType: "movement",
                    // timestep: index + 1,
                    timestep: timestep1,
                    infectionChangeOfPatient: undefined,
                  }

                  let newCluster3 = {
                    ...JSON.parse(JSON.stringify(c)),
                    node: node++,
                    timestamp: timestamp,
                    relevantNode: true,
                    relevantType: "target",
                    timestampBefore: timestampBefore,
                    timestampAfter: timestampAfter,
                    nodeType: "movement",
                    // timestep: index + 1,
                    timestep: timestep2,
                    infectionChangeOfPatient: undefined,
                  }
                  newCluster3.lop = newCluster3.lop.filter(
                    (pid) => pid !== patientID
                  )

                  let newCluster4 = {
                    ...JSON.parse(JSON.stringify(zielCluster)),
                    node: node++,
                    timestamp: timestamp,
                    relevantNode: true,
                    relevantType: "target",
                    timestampBefore: timestampBefore,
                    timestampAfter: timestampAfter,
                    nodeType: "movement",
                    // timestep: index + 1,
                    timestep: timestep2,
                    infectionChangeOfPatient: undefined,
                  }
                  newCluster4.lop.push(patientID)

                  graph.nodes.push(newCluster1)
                  graph.nodes.push(newCluster2)
                  graph.nodes.push(newCluster3)
                  graph.nodes.push(newCluster4)

                  graph.links.push(getLinkSourceToTarget(c, newCluster1, false))
                  graph.links.push(
                    getLinkSourceToTarget(zielCluster, newCluster2, false)
                  )
                  graph.links.push(
                    getLinkSourceToTarget(newCluster1, newCluster3, false)
                  )
                  graph.links.push(
                    getLinkSourceToTarget(newCluster2, newCluster4, false)
                  )
                  graph.links.push(
                    getLinkSourceToTarget(newCluster1, newCluster4, true)
                  )

                  newClusters.push(newCluster3)
                  newClusters.push(newCluster4)

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
                } else if (c.stationID === stationID) {
                  // Wenn Cluster das Ziel ist,
                  // dann muss auch die Quelle mit Patienten bearbeitet werden
                  // dann wird der Index der Quelle in fallBearbeitet gespeichert
                  let indexQuelle = clusters.findIndex((c) =>
                    c.lop.includes(patientID)
                  )

                  let quelleCluster = clusters[indexQuelle]
                  fallBearbeitet = indexQuelle

                  let newCluster1 = {
                    ...JSON.parse(JSON.stringify(quelleCluster)),
                    node: node++,
                    timestamp: timestamp,
                    relevantNode: true,
                    relevantType: "source",
                    timestampBefore: timestampBefore,
                    timestampAfter: timestampAfter,
                    nodeType: "movement",
                    // timestep: index + 1,
                    timestep: timestep1,
                    infectionChangeOfPatient: undefined,
                  }

                  let newCluster2 = {
                    ...JSON.parse(JSON.stringify(c)),
                    node: node++,
                    timestamp: timestamp,
                    relevantNode: true,
                    relevantType: "source",
                    timestampBefore: timestampBefore,
                    timestampAfter: timestampAfter,
                    nodeType: "movement",
                    // timestep: index + 1,
                    timestep: timestep1,
                    infectionChangeOfPatient: undefined,
                  }

                  let newCluster3 = {
                    ...JSON.parse(JSON.stringify(quelleCluster)),
                    node: node++,
                    timestamp: timestamp,
                    relevantNode: true,
                    relevantType: "target",
                    timestampBefore: timestampBefore,
                    timestampAfter: timestampAfter,
                    nodeType: "movement",
                    // timestep: index + 1,
                    timestep: timestep2,
                    infectionChangeOfPatient: undefined,
                  }
                  newCluster3.lop = newCluster3.lop.filter(
                    (pid) => pid !== patientID
                  )

                  let newCluster4 = {
                    ...JSON.parse(JSON.stringify(c)),
                    node: node++,
                    timestamp: timestamp,
                    relevantNode: true,
                    relevantType: "target",
                    timestampBefore: timestampBefore,
                    timestampAfter: timestampAfter,
                    nodeType: "movement",
                    // timestep: index + 1,
                    timestep: timestep2,
                    infectionChangeOfPatient: undefined,
                  }
                  newCluster4.lop.push(patientID)

                  graph.nodes.push(newCluster1)
                  graph.nodes.push(newCluster2)
                  graph.nodes.push(newCluster3)
                  graph.nodes.push(newCluster4)

                  graph.links.push(
                    getLinkSourceToTarget(quelleCluster, newCluster1, false)
                  )
                  graph.links.push(getLinkSourceToTarget(c, newCluster2, false))
                  graph.links.push(
                    getLinkSourceToTarget(newCluster1, newCluster3, false)
                  )
                  graph.links.push(
                    getLinkSourceToTarget(newCluster2, newCluster4, false)
                  )
                  graph.links.push(
                    getLinkSourceToTarget(newCluster1, newCluster4, true)
                  )

                  newClusters.push(newCluster3)
                  newClusters.push(newCluster4)

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
                } else {
                  // weder Ziel- noch Quell-Cluster
                  let newCluster1 = {
                    ...JSON.parse(JSON.stringify(c)),
                    node: node++,
                    timestamp: timestamp,
                    relevantNode: false,
                    relevantType: "source",
                    timestampBefore: timestampBefore,
                    timestampAfter: timestampAfter,
                    nodeType: "movement",
                    // timestep: index + 1,
                    timestep: timestep1,
                    infectionChangeOfPatient: undefined,
                  }

                  let newCluster2 = {
                    ...JSON.parse(JSON.stringify(c)),
                    node: node++,
                    timestamp: timestamp,
                    relevantNode: false,
                    relevantType: "target",
                    timestampBefore: timestampBefore,
                    timestampAfter: timestampAfter,
                    nodeType: "movement",
                    // timestep: index + 1,
                    timestep: timestep2,
                    infectionChangeOfPatient: undefined,
                  }

                  graph.nodes.push(newCluster1)
                  graph.nodes.push(newCluster2)

                  graph.links.push(getLinkSourceToTarget(c, newCluster1, false))
                  graph.links.push(
                    getLinkSourceToTarget(newCluster1, newCluster2, false)
                  )

                  newClusters.push(newCluster2)

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
            })
          } else if (patientAlleine && !zielExistiert) {
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
            let timestep1 = timestepCounter++
            let timestep2 = timestepCounter++
            clusters.forEach((c, index) => {
              if (index === patientClusterIndex) {
                let newCluster1 = {
                  ...JSON.parse(JSON.stringify(c)),
                  node: node++,
                  timestamp: timestamp,
                  relevantNode: true,
                  relevantType: "source",
                  timestampBefore: timestampBefore,
                  timestampAfter: timestampAfter,
                  nodeType: "movement",
                  // timestep: index + 1,
                  timestep: timestep1,
                  infectionChangeOfPatient: undefined,
                }

                let newCluster2 = {
                  ...JSON.parse(JSON.stringify(c)),
                  node: node++,
                  timestamp: timestamp,
                  relevantNode: true,
                  relevantType: "target",
                  timestampBefore: timestampBefore,
                  timestampAfter: timestampAfter,
                  nodeType: "movement",
                  // timestep: index + 1,
                  timestep: timestep2,
                  infectionChangeOfPatient: undefined,
                  space: "klinik",
                  stationID: stationID,
                  stationClusterID: stationClusterIDcounter++,
                }

                graph.nodes.push(newCluster1)
                graph.nodes.push(newCluster2)

                graph.links.push(getLinkSourceToTarget(c, newCluster1, false))
                graph.links.push(
                  // getLinkSourceToTarget(newCluster1, newCluster2, true)
                  getLinkSourceToTarget(newCluster1, newCluster2, false)
                )

                newClusters.push(newCluster2)

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
              } else {
                let newCluster1 = {
                  ...JSON.parse(JSON.stringify(c)),
                  node: node++,
                  timestamp: timestamp,
                  relevantNode: false,
                  relevantType: "source",
                  timestampBefore: timestampBefore,
                  timestampAfter: timestampAfter,
                  nodeType: "movement",
                  // timestep: index + 1,
                  timestep: timestep1,
                  infectionChangeOfPatient: undefined,
                }

                let newCluster2 = {
                  ...JSON.parse(JSON.stringify(c)),
                  node: node++,
                  timestamp: timestamp,
                  relevantNode: false,
                  relevantType: "target",
                  timestampBefore: timestampBefore,
                  timestampAfter: timestampAfter,
                  nodeType: "movement",
                  // timestep: index + 1,
                  timestep: timestep2,
                  infectionChangeOfPatient: undefined,
                }

                graph.nodes.push(newCluster1)
                graph.nodes.push(newCluster2)

                graph.links.push(getLinkSourceToTarget(c, newCluster1, false))
                graph.links.push(
                  getLinkSourceToTarget(newCluster1, newCluster2, false)
                )

                newClusters.push(newCluster2)

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
            })
          } else if (patientAlleine && zielExistiert) {
            // console.log("Fall 4")
            /**
             * Fall 4
             * Falls Patient alleine ist und das Ziel existiert
             * Aus ZWEI wird EINS
             */
            let fallBearbeitet = false
            let timestep1 = timestepCounter++
            let timestep2 = timestepCounter++
            clusters.forEach((c, index) => {
              if (index === fallBearbeitet) {
                // Fall wurde schon bearbeitet
              } else {
                if (c.lop.includes(patientID)) {
                  let indexZiel = clusters.findIndex(
                    (c) => c.stationID === stationID
                  )

                  let zielCluster = clusters[indexZiel]
                  fallBearbeitet = indexZiel

                  let newCluster1 = {
                    ...JSON.parse(JSON.stringify(c)),
                    node: node++,
                    timestamp: timestamp,
                    relevantNode: true,
                    relevantType: "source",
                    timestampBefore: timestampBefore,
                    timestampAfter: timestampAfter,
                    nodeType: "movement",
                    // timestep: index + 1,
                    timestep: timestep1,
                    infectionChangeOfPatient: undefined,
                  }

                  let newCluster2 = {
                    ...JSON.parse(JSON.stringify(zielCluster)),
                    node: node++,
                    timestamp: timestamp,
                    relevantNode: true,
                    relevantType: "source",
                    timestampBefore: timestampBefore,
                    timestampAfter: timestampAfter,
                    nodeType: "movement",
                    // timestep: index + 1,
                    timestep: timestep1,
                    infectionChangeOfPatient: undefined,
                  }

                  let newCluster3 = {
                    ...JSON.parse(JSON.stringify(zielCluster)),
                    node: node++,
                    timestamp: timestamp,
                    relevantNode: true,
                    relevantType: "target",
                    timestampBefore: timestampBefore,
                    timestampAfter: timestampAfter,
                    nodeType: "movement",
                    // timestep: index + 1,
                    timestep: timestep2,
                    infectionChangeOfPatient: undefined,
                  }
                  newCluster3.lop.push(patientID)

                  graph.nodes.push(newCluster1)
                  graph.nodes.push(newCluster2)
                  graph.nodes.push(newCluster3)

                  graph.links.push(getLinkSourceToTarget(c, newCluster1, false))
                  graph.links.push(
                    getLinkSourceToTarget(zielCluster, newCluster2, false)
                  )
                  graph.links.push(
                    getLinkSourceToTarget(newCluster1, newCluster3, true)
                  )
                  graph.links.push(
                    getLinkSourceToTarget(newCluster2, newCluster3, false)
                  )

                  newClusters.push(newCluster3)

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
                } else if (c.stationID === stationID) {
                  let indexQuelle = clusters.findIndex((c) =>
                    c.lop.includes(patientID)
                  )

                  let quelleCluster = clusters[indexQuelle]
                  fallBearbeitet = indexQuelle

                  let newCluster1 = {
                    ...JSON.parse(JSON.stringify(quelleCluster)),
                    node: node++,
                    timestamp: timestamp,
                    relevantNode: true,
                    relevantType: "source",
                    timestampBefore: timestampBefore,
                    timestampAfter: timestampAfter,
                    nodeType: "movement",
                    // timestep: index + 1,
                    timestep: timestep1,
                    infectionChangeOfPatient: undefined,
                  }

                  let newCluster2 = {
                    ...JSON.parse(JSON.stringify(c)),
                    node: node++,
                    timestamp: timestamp,
                    relevantNode: true,
                    relevantType: "source",
                    timestampBefore: timestampBefore,
                    timestampAfter: timestampAfter,
                    nodeType: "movement",
                    // timestep: index + 1,
                    timestep: timestep1,
                    infectionChangeOfPatient: undefined,
                  }

                  let newCluster3 = {
                    ...JSON.parse(JSON.stringify(c)),
                    node: node++,
                    timestamp: timestamp,
                    relevantNode: true,
                    relevantType: "target",
                    timestampBefore: timestampBefore,
                    timestampAfter: timestampAfter,
                    nodeType: "movement",
                    // timestep: index + 1,
                    timestep: timestep2,
                    infectionChangeOfPatient: undefined,
                  }
                  newCluster3.lop.push(patientID)

                  graph.nodes.push(newCluster1)
                  graph.nodes.push(newCluster2)
                  graph.nodes.push(newCluster3)

                  graph.links.push(
                    getLinkSourceToTarget(quelleCluster, newCluster1, false)
                  )
                  graph.links.push(getLinkSourceToTarget(c, newCluster2, false))
                  graph.links.push(
                    getLinkSourceToTarget(newCluster1, newCluster3, true)
                  )
                  graph.links.push(
                    getLinkSourceToTarget(newCluster2, newCluster3, false)
                  )

                  newClusters.push(newCluster3)

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
                } else {
                  // weder Ziel- noch Quell-Cluster
                  let newCluster1 = {
                    ...JSON.parse(JSON.stringify(c)),
                    node: node++,
                    timestamp: timestamp,
                    relevantNode: false,
                    relevantType: "source",
                    timestampBefore: timestampBefore,
                    timestampAfter: timestampAfter,
                    nodeType: "movement",
                    // timestep: index + 1,
                    timestep: timestep1,
                    infectionChangeOfPatient: undefined,
                  }

                  let newCluster2 = {
                    ...JSON.parse(JSON.stringify(c)),
                    node: node++,
                    timestamp: timestamp,
                    relevantNode: false,
                    relevantType: "target",
                    timestampBefore: timestampBefore,
                    timestampAfter: timestampAfter,
                    nodeType: "movement",
                    // timestep: index + 1,
                    timestep: timestep2,
                    infectionChangeOfPatient: undefined,
                  }

                  graph.nodes.push(newCluster1)
                  graph.nodes.push(newCluster2)

                  graph.links.push(getLinkSourceToTarget(c, newCluster1, false))
                  graph.links.push(
                    getLinkSourceToTarget(newCluster1, newCluster2, false)
                  )

                  newClusters.push(newCluster2)

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
            })
          }
        } else {
          console.error(`EventType ${eventType} can not be handled.`)
        }
        clusters = newClusters
        if (maxClusterCountPerTimestep < newClusters.length) {
          maxClusterCountPerTimestep = newClusters.length
        }
        timestampBefore = timestamp
      })
      // console.log(graph)

      console.error(
        `Bewegungen ohne Stationsweichsel: ${BewegungOhneStationswechsel}`
      )

      let timestep1 = timestepCounter++
      clusters.forEach((c) => {
        // let { patientID, eventType, timestamp } = e
        let newCluster1 = {
          ...JSON.parse(JSON.stringify(c)),
          node: node++,
          timestamp: timestamps[timestamps.length - 1],
          relevantNode: false,
          relevantType: "target",
          timestampBefore: timestampBefore,
          timestampAfter: timestamps[timestamps.length - 1],
          nodeType: "movement",
          // timestep: events.length + 1,
          timestep: timestep1,
          infectionChangeOfPatient: undefined,
        }

        graph.nodes.push(newCluster1)

        graph.links.push(getLinkSourceToTarget(c, newCluster1, false))
      })

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

      graph.nodes.forEach((n) => {
        n.id = n.node
      })

      let allTimestamps = [timestamps[0] - 0.05 * timespan].concat(timestamps)
      graph.allTimestamps = allTimestamps
      graph.maxClusterCountPerTimestep = maxClusterCountPerTimestep
      graph.stationClusterIDcounter = stationClusterIDcounter

      graphsCategorized["K" + keimID] = graph

      let e = (nodesByTimestamp["K" + keimID] = [])

      graph.nodes.forEach((n) => {
        let timestamp = n.timestamp
        let index = e.findIndex((e) => e.timestamp === timestamp)
        if (index === -1) {
          e.push({
            timestamp: timestamp,
            nodes: [],
          })
          index = e.length - 1
        }
        e[index].nodes.push(JSON.parse(JSON.stringify(n)))
      })

      graph.links.forEach((l) => {
        l.value = l.lop.length + 1
        // l.value = 1
      })
    }
  })

  console.log("Parsing fertig")

  return {
    parsedData,
    withDummyNodes,
    rawData: { rawMicroData, rawMovementData },
    allMovements,
    allInspections,
    patients,
    keime,
    allRelevantInspections,
    allEvents,
    eventsCategorized,
    graphsCategorized,
    nodesByTimestamp,
    stationList,
  }
}

export default parseToStorylineData
