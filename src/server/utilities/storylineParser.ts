/**
 * REWRITE fuer Studienarbeit/Masterarbeit
 * @param microData
 * @param movementData
 * @param lop
 * @param stationList
 * @returns
 */
const parseToStorylineData = (
  microData: any,
  movementData: any,
  lop: any,
  stationList: any
) => {
  console.log("parse to storyline data")
  // console.log("TCL: parameters", JSON.stringify(parameters, null, 4))
  /**
   * in
   * parameters.lop = []
   * müssen alle PatientenIDs drin stehen!
   */

  // TODO was hat das gemacht???
  // microData = microData[0]
  // movementData = movementData[0]

  let getLinkSourceToTarget = (
    sourceNode: any,
    targetNode: any,
    movementLink: any
  ) => {
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
  movementData = movementData.filter((md: any) => md.BewegungstypID !== 4)

  /**
   * Fuer jede Station herausfinden, wann sie das erste mal auftaucht und bis wann sie existiert
   */
  // !Storyline Layout Change: Station same y-position
  let stations_first_last_timestamp: any = {}

  for (let md of movementData) {
    if (stations_first_last_timestamp[md.Station] === undefined) {
      stations_first_last_timestamp[md.Station] = {
        first_timestamp: md.ts_Beginn,
        last_timestamp: md.ts_Ende,
      }
    } else {
      if (
        stations_first_last_timestamp[md.Station].first_timestamp > md.ts_Beginn
      ) {
        stations_first_last_timestamp[md.Station].first_timestamp = md.ts_Beginn
      }
      if (
        stations_first_last_timestamp[md.Station].last_timestamp < md.ts_Ende
      ) {
        stations_first_last_timestamp[md.Station].last_timestamp = md.ts_Ende
      }
    }
  }

  let pathogen_data: any = {
    keimID: "",
    keim_k: "",
    keim_l: "",
    erstePositiveBefunde: [],
    letzteNegativeBefunde: [],
  }

  if (microData.length > 0) {
    pathogen_data.keimID = microData[0].KeimID
    pathogen_data.keim_k = microData[0].Keim_k
    pathogen_data.keim_l = microData[0].Keim_l
  }

  let patients: any = {
    lop: lop,
  }
  let allPatientMovements: any[] = []
  let allPatientInspections: any[] = []

  /**
   * Alle Infos von jedem Patienten sammeln
   */
  lop.forEach((patientID: any) => {
    let patientMicroData = microData.filter(
      (md: any) => md.PatientID === patientID
    )
    let patientMovementData = movementData.filter(
      (md: any) => md.PatientID === patientID
    )

    let untersuchungen: any[] = []

    let infection_data: any = {}

    infection_data = {
      erstesPositiv: undefined,
      letztesNegativ: undefined,
      positive: [],
      negative: [],
    }

    /**
     * Akkumulieren der MicroData:
     * - alle Untersuchungen mit selbem Zeitstempel zusamemnfassen
     * - keimeInfos mit Informationen zu allen Keimen für jeden Patienten
     */
    patientMicroData.forEach((pmd: any) => {
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
      if (
        pmd.Screening === false ||
        pmd.Screening === 0 ||
        pmd.Screening === undefined
      ) {
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
      if (
        pmd.Screening === false ||
        pmd.Screening === 0 ||
        pmd.Screening === undefined
      ) {
        infection_data.positive.push(pmd.timestamp)
      } else {
        infection_data.negative.push(pmd.timestamp)
      }
    })

    /**
     * für jeden Keim bei jedem Patienten:
     * erstesPositiv und letztesNegativ finden
     */
    let negative: any[] = []
    if (infection_data.positive.length > 0) {
      infection_data.erstesPositiv = Math.min(...infection_data.positive)

      negative = infection_data.negative.filter(
        (ts: any) => ts < infection_data.erstesPositiv
      )
    } else {
      negative = infection_data.negative
    }

    if (negative.length > 0) {
      // keimObject.letztesNegativ = Math.max(...negative)
      // !min statt max, weil gibt kein negativ -> carrier vs deseased
      infection_data.letztesNegativ = Math.min(...negative)
    }

    if (infection_data.erstesPositiv) {
      pathogen_data.erstePositiveBefunde.push({
        patientID: patientID,
        timestamp: infection_data.erstesPositiv,
      })
    }
    if (infection_data.letztesNegativ) {
      pathogen_data.letzteNegativeBefunde.push({
        patientID: patientID,
        timestamp: infection_data.letztesNegativ,
      })
    }

    /**
     * Die States aufgrund der Befunde generieren (Reihenfolge)
     */

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
    let patientStates: any[] = []
    if (
      infection_data.letztesNegativ === undefined &&
      infection_data.erstesPositiv === undefined
    ) {
      patientStates = ["statusUnbekannt"]
    } else if (
      infection_data.letztesNegativ === undefined &&
      infection_data.erstesPositiv !== undefined
    ) {
      // patientStates = ["statusAnsteckung", "statusInfiziert"]
      patientStates = ["statusHoltKeim", "statusKrank"]
    } else if (
      infection_data.letztesNegativ !== undefined &&
      infection_data.erstesPositiv === undefined
    ) {
      // patientStates = ["statusGesund", "statusUnbekannt"]
      patientStates = ["statusHoltKeim", "statusTraeger"]
    } else if (
      infection_data.letztesNegativ !== undefined &&
      infection_data.erstesPositiv !== undefined
    ) {
      // patientStates = ["statusGesund", "statusAnsteckung", "statusInfiziert"]
      patientStates = ["statusHoltKeim", "statusTraeger", "statusKrank"]
    }
    infection_data.patientStates = patientStates

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
      patientMovementData[patientMovementData.length - 1].letzteEntlassung =
        true
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
    patients[patientID] = {
      // microData: patientMicroData,
      patientID: patientID,
      movementData: patientMovementData,
      keimeInfos: infection_data,
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
  let allRelevantInspections: any[] = []

  pathogen_data.erstePositiveBefunde.forEach((befund: any) => {
    let index = allRelevantInspections.findIndex(
      (ri) =>
        ri.timestamp === befund.timestamp && ri.PatientID === befund.PatientID
    )

    if (index < 0) {
      let ri_index = allInspections.findIndex(
        (i: any) =>
          i.timestamp === befund.timestamp && i.PatientID === befund.PatientID
      )
      let ri = JSON.parse(JSON.stringify(allInspections[ri_index]))
      allRelevantInspections.push(ri)
      index = allRelevantInspections.length - 1
    }
  })

  pathogen_data.letzteNegativeBefunde.forEach((befund: any) => {
    let index = allRelevantInspections.findIndex(
      (ri) =>
        ri.timestamp === befund.timestamp && ri.PatientID === befund.PatientID
    )

    if (index < 0) {
      let ri_index = allInspections.findIndex(
        (i: any) =>
          i.timestamp === befund.timestamp && i.PatientID === befund.PatientID
      )
      let ri = JSON.parse(JSON.stringify(allInspections[ri_index]))
      allRelevantInspections.push(ri)
      index = allRelevantInspections.length - 1
    }
  })

  allRelevantInspections.sort((a, b) => a.timestamp - b.timestamp)

  let allEvents = allMovements.concat(allRelevantInspections)
  allEvents.sort((a: any, b: any) => a.timestamp - b.timestamp)

  // let nodesByTimestamp: any = {}

  console.error(`[Storyline] calculation started`)

  let maxClusterCountPerTimestep = 2

  /**
   * Events für einen Keim zusammenfassen und soriteren
   */
  let inspections = allRelevantInspections

  let events = allEvents

  let timestamps: any[] = []
  events.forEach((event: any) => {
    timestamps.push(event.timestamp)
  })

  let timespan = timestamps[timestamps.length - 1] - timestamps[0]
  timestamps.push(timestamps[timestamps.length - 1] + 0.05 * timespan)

  /**
   * Graph-Struktur (nodes und links) für einen Keim erzeugen
   */

  let graph: any = {
    nodes: [],
    links: [],
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
  events.forEach((e: any, i: any) => {
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

    let newClusters: any[] = []
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
      /**
       * TODO: Anpassen, sodass Fall 3 und Fall 4 nur auftreten, wenn die andere Station NIE WIEDER auftaucht
       * TODO: für jede Station "first_date" und "last_date" berechnen
       * TODO: wenn "timestamp === last_date", dann kann erst Fall 3 oder 4 auftreten, ansonsten Fall 3->1 und Fall 4->2
       * ! wie in Implementierung umsetzen?
       * ! patientAlleine auf FALSE setzen, falls last_date der Station noch nicht erreicht
       *
       * stations_first_last_timestamp
       */
      let stationID = e.Station
      // console.log(e.Station)

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

      // !Storyline Layout Change: Station same y-position
      if (
        patientAlleine &&
        clusters[patientClusterIndex].stationID !== "home" &&
        clusters[patientClusterIndex].stationID !== "tmphome"
      ) {
        // hier jetzt überprüfen, ob die Station am Ende ihrer Zeit ist
        let stat_id = clusters[patientClusterIndex].stationID
        if (stations_first_last_timestamp[stat_id].last_timestamp > timestamp) {
          patientAlleine = false
        }
      }

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
              lop: c.lop.filter((pid: any) => pid !== patientID),
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
        let fallBearbeitet: any = false
        let timestep1 = timestepCounter++
        let timestep2 = timestepCounter++
        clusters.forEach((c: any, index: any) => {
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
                (pid: any) => pid !== patientID
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
                (pid: any) => pid !== patientID
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
        let fallBearbeitet: any = false
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

  graph.nodes.forEach((n: any) => {
    n.id = n.node
  })

  let allTimestamps = [timestamps[0] - 0.05 * timespan].concat(timestamps)
  graph.allTimestamps = allTimestamps
  graph.maxClusterCountPerTimestep = maxClusterCountPerTimestep
  graph.stationClusterIDcounter = stationClusterIDcounter

  // let e: any = (nodesByTimestamp = [])

  // graph.nodes.forEach((n: any) => {
  //   let timestamp = n.timestamp
  //   let index = e.findIndex((e: any) => e.timestamp === timestamp)
  //   if (index === -1) {
  //     e.push({
  //       timestamp: timestamp,
  //       nodes: [],
  //     })
  //     index = e.length - 1
  //   }
  //   e[index].nodes.push(JSON.parse(JSON.stringify(n)))
  // })

  graph.links.forEach((l: any) => {
    l.value = l.lop.length + 1
    // l.value = 1
  })

  console.log("Parsing fertig")

  return {
    allMovements,
    allInspections,
    patients,
    pathogen_data,
    allRelevantInspections,
    allEvents,
    graph,
    // nodesByTimestamp,
    // stationList,
  }
}

export default parseToStorylineData
