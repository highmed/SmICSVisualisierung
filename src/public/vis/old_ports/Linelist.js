import React, { Component } from "react"

import ModuleContainer from "./ModuleContainer.js"
import globals from "./_globals.js"

import * as d3 from "d3"
import moment from "moment"
import "./linelist.css"

class LineList extends Component {
  constructor(props) {
    super(props)

    this.socket = props.socket.client

    this.id = globals.newComponentID()

    this.color = d3.scaleOrdinal(d3.schemeCategory10)
    this.color2 = d3.scaleOrdinal(d3.schemeCategory10)
    this.color3 = d3.scaleOrdinal(d3.schemeCategory10)
    this.color4 = d3.scaleOrdinal(d3.schemeCategory10)

    this.data
    this.width
    this.height

    this.title = "Linelist"

    this.state = {
      data: {
        available: false,
        loading: false,
        error: undefined,
      },
      info: [],
      filterValues: [],
      // getWithCopyStrain: true,
      // dataWithCopyStrain: false,
      // getONEp: true
      getFuncNr: 0,
      getMinimaleAnzeige: 0,
      getSorting: 1,
      getColor: 0,
      getBehandlungConfig: 1,
      getUntersuchungConfig: 1,
      stationen: [],
      keimIDs: [],
      getKeimID: 0,
      selectedStations: [],
      contact_depth: 0,
    }

    this.needScrollInit = true

    this.margin = {
      top: 50,
      right: 50,
      bottom: 50,
      left: 50,
      text: 20,
    }

    this.locale = {
      dateTime: "%A, der %e. %B %Y, %X",
      date: "%d.%m.%Y",
      time: "%H:%M:%S",
      periods: ["AM", "PM"],
      days: [
        "Sonntag",
        "Montag",
        "Dienstag",
        "Mittwoch",
        "Donnerstag",
        "Freitag",
        "Samstag",
      ],
      shortDays: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
      months: [
        "Januar",
        "Februar",
        "März",
        "April",
        "Mai",
        "Juni",
        "Juli",
        "August",
        "September",
        "Oktober",
        "November",
        "Dezember",
      ],
      shortMonths: [
        "Jan",
        "Feb",
        "Mrz",
        "Apr",
        "Mai",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Okt",
        "Nov",
        "Dez",
      ],
    }

    this.calculateHeight = 1000
    this.calculcateWidth = 1
    this.currentPixelOffset = 0
    this.svgMarginX = 0
    this.svgMarginY = 50
    this.pathWidth = 5

    this.zoom = 1
    this.lastZoomK = 1
    this.lastZoomX = 0
    this.lastTransformedX = 0

    this.inspections = []
    this.clusterCounter = 0
    this.patients = []
    this.timeStamps = []
    this.patientIDs = []
    this.rowHeight = 0
    this.lineHeight = 8
    this.circleRadius = 3
    // sollte 3*lineHeight +2*circleRadius sein
    this.inspecHeight = 40
    this.labelHeight = 12
    // sollte mind inspecHeight + labelHeight sein
    this.minRowHeight = 56
    // sollte (minRowHeight - inspecHeight - labelHeight / 2) sein etwa
    this.labelMargin = 2
    // Datenstruktur: { label: "2021-09-03T...", x: 9}

    this.patientInfected = {}

    this.selectedStations = []
  }

  updateData = (msg) => {
    if (msg === "Filter1") {
      this.getData()
    }
  }

  setLang = (lang) => {
    let self = this
    this.setState((prevState) => {
      prevState.selectedLang = lang
      return prevState
    })
    // this.props.glContainer.setTitle(
    //   self.props.translate(self.props.title, lang)
    // )
    self.setLocale(lang)
    setTimeout(self.resize, 200)
  }

  setLocale = (lang) => {
    let self = this

    if (lang === undefined) {
      // lang = self.props.getLang()
      lang = "de"
    }

    if (lang === "eng") {
      self.locale = {
        // dateTime: "%A, der %e. %B %Y, %X",
        dateTime: "%d %B, %Y, %X",
        date: "%Y-%m-%d",
        time: "%H:%M:%S",
        periods: ["AM", "PM"],
        days: [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        months: [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ],
        shortMonths: [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ],
      }
    } else if (lang === "ger") {
      self.locale = {
        dateTime: "%A, der %e. %B %Y, %X",
        date: "%d.%m.%Y",
        time: "%H:%M:%S",
        periods: ["AM", "PM"],
        days: [
          "Sonntag",
          "Montag",
          "Dienstag",
          "Mittwoch",
          "Donnerstag",
          "Freitag",
          "Samstag",
        ],
        shortDays: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
        months: [
          "Januar",
          "Februar",
          "März",
          "April",
          "Mai",
          "Juni",
          "Juli",
          "August",
          "September",
          "Oktober",
          "November",
          "Dezember",
        ],
        shortMonths: [
          "Jan",
          "Feb",
          "Mrz",
          "Apr",
          "Mai",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Okt",
          "Nov",
          "Dez",
        ],
      }
    }
  }

  componentWillMount() {
    this.socket.on(this.id, this.handleData)
    this.socket.on(this.id + "ERROR", this.handleError)
    // this.props.glEventHub.on("languageChange", this.setLang)

    // this.props.glEventHub.on("updateData", this.updateData)
  }

  componentWillUnmount() {
    this.socket.removeListener(this.id, this.handleData)
    this.socket.removeListener(this.id + "ERROR", this.handleError)
    // this.props.glEventHub.off("languageChange", this.setLang)

    // this.props.glEventHub.off("updateData", this.updateData)
    clearInterval(this.checkSize)
  }

  updateTooltip = (d, i) => {
    let self = this
    let tableObj = "KEINE DATEN ?"

    // tableObj = {
    //     title: i,
    //     header: ["Patient", "Status", "Infizierungs-Datum", "letzter Test"],
    //     content: []
    // }

    let datumformat = self.props.translate("dateFormat", self.state.lang)
    if (i === "link") {
      let momentB = moment(d.b)
      let momentE = moment(d.e)
      let duration = moment.duration(momentE.diff(momentB))
      let months = duration.months()
      let days = duration.days()
      let hrs = duration.hours()
      let mins = duration.minutes()
      let secs = duration.seconds()

      tableObj = {
        title: "P" + d.PatientID + " Station " + d.StationID,
        header: ["DataName", "Value"],
        content: [
          ["Bewegungsart", d.Bewegungsart_l],
          ["Bewegungstyp", d.Bewegungstyp],
          ["CaseType", d.CaseType_l],
          [
            self.props.translate("duration", self.state.lang),
            months +
              "M " +
              days +
              "d " +
              hrs +
              "h " +
              mins +
              "min " +
              secs +
              "s",
          ],
          [
            self.props.translate("begin", self.state.lang),
            momentB.format(datumformat) + " Uhr",
          ],
          [
            self.props.translate("end", self.state.lang),
            momentE.format(datumformat) + " Uhr",
          ],
          ["FallID", d.FallID],
          ["id", d.id],
        ],
      }
      // tableObj.content.push(["link", "link", "link", "link"])
    } else if (i === "inspec") {
      let insDate = moment(d.timestamp)
      tableObj = {
        title:
          "P" +
          d.inspections[0].PatientID +
          " " +
          insDate.format(datumformat) +
          " Uhr",
        header: [
          self.props.translate("result", self.state.lang),
          self.props.translate("pathogen", self.state.lang),
          self.props.translate("antibiotika", self.state.lang),
          self.props.translate("material", self.state.lang),
          self.props.translate("id", self.state.lang),
        ],
        content: [],
      }
      d.inspections.forEach((o) => {
        tableObj.content.push([
          o.Ergebnis_k,
          o.Keim_k,
          o.Antibiotikum_l,
          o.Material_l,
          o.id,
        ])
      })
    } else {
      tableObj = i + " not defined"
    }

    // d.patients.forEach(pat => {
    //   tableObj.content.push([
    //     pat,
    //     state,
    //     info.infectDate
    //       ? moment(info.infectDate).format("dd DD.MM.YYYY")
    //       : " - ",
    //     moment(info.lastTestDate).format("dd DD.MM.YYYY")
    //   ])
    // })

    self.setState({
      info: [tableObj],
    })
  }

  componentDidMount() {
    let self = this

    // this.props.glContainer.setTitle(self.props.translate(self.props.title))
    self.setLocale()

    /**
     * Modul auf Größenänderung alle 100ms überprüfen.
     * Falls eine Größenänderung vorliegt, die Visualisierung resizen.
     */
    this.checkSize = setInterval(() => {
      let newWidth = parseInt(
        d3.select(self.containerRefs.svgRoot).style("width")
      )
      let newHeight = parseInt(
        d3.select(self.containerRefs.svgRoot).style("height")
      )
      if (newWidth !== self.width || newHeight !== self.height) {
        self.width = newWidth
        self.height = newHeight
        // console.log(`newWidth: ${newWidth}, newHeight: ${newHeight}`)
        // if (self.data) {
        self.resize()
        // }
      }
    }, 100)

    // self.props.glContainer.on("resize", () => {
    //   self.needScrollInit = true
    //   self.resize()
    // })
    // this.checkSize = setInterval(() => {
    //   let newWidth = parseInt(
    //     d3.select(self.containerRefs.svgRoot).style("width")
    //   )
    //   let newHeight = parseInt(
    //     d3.select(self.containerRefs.svgRoot).style("height")
    //   )
    //   if (newWidth !== self.width || newHeight !== self.height) {
    //     // if (newHeight !== self.height) {
    //     self.width = newWidth
    //     self.height = newHeight
    //     // if (this.links && this.nodes)
    //     self.resize()
    //   }
    // }, 100)

    let mouseLine = () => {
      let containerWidth = parseInt(
        d3.select(self.containerRefs.svgRoot).style("width")
      )
      let containerHeight = parseInt(
        d3.select(self.containerRefs.svgRoot).style("height")
      )
      let offsetX = d3.event.offsetX - self.lastTransformedX
      self.gGraphics
        .selectAll(".mouseLine")
        .attr("transform", "translate(" + offsetX + ",0)")

      let newText = offsetX
      if (self.scaleReverseX) {
        newText =
          moment(self.scaleReverseX(offsetX)).format(
            self.props.translate("dateFormat", self.state.lang)
          ) + " h"
      }

      let anchor = "middle"
      if (offsetX > containerWidth / 2) {
        anchor = "end"
      } else if (offsetX < containerWidth / 2) {
        anchor = "start"
      }

      // self.gGraphics
      self.gMouseLabel
        .selectAll(".mouseLabel")
        .text(newText)
        // .transition()
        // .duration(self.props.transTime)
        // .attr("transform", "translate(" + offsetX + ",0)")
        .attr(
          "transform",
          "translate(" +
            (offsetX + self.lastTransformedX) +
            "," +
            (containerHeight - 60) +
            ")"
        )
        .attr("text-anchor", anchor)

      let patientLabel = self.gGraphics
        .selectAll(".patientLabel")
        .data(self.patientIDs)

      let inspecHeight =
        self.state.getMinimaleAnzeige === 0 ? self.inspecHeight : 0

      patientLabel
        .enter()
        .append("text")
        .merge(patientLabel)
        .attr("class", "patientLabel")
        .text((d) => "P" + d)
        .attr("font-size", self.labelHeight)
        // .attr(
        //   "transform",
        //   (d, i) =>
        //     "translate(" +
        //     offsetX +
        //     "," +
        //     (self.svgMarginY +
        //       i * self.rowHeight +
        //       self.rowHeight -
        //       self.inspecHeight -
        //       10) +
        //     ")"
        // )
        .attr(
          "transform",
          (d, i) =>
            "translate(" +
            (self.state.getMinimaleAnzeige
              ? containerWidth - self.lastTransformedX
              : offsetX) +
            "," +
            (self.height -
              self.svgMarginY -
              i * self.rowHeight -
              // + self.rowHeight
              inspecHeight -
              self.labelMargin +
              self.currentPixelOffset) +
            ")"
        )
        .attr("text-anchor", self.state.getMinimaleAnzeige ? "end" : anchor)

      patientLabel.exit().remove()
    }

    let zoom = d3.zoom().on("zoom", () => {
      let containerWidth = parseInt(
        d3.select(self.containerRefs.svgRoot).style("width")
      )
      // let mitteModul = containerWidth / 2
      // statt Mitte Modul die Mausposition:
      if (!d3.event.sourceEvent) {
        // Wenn es null oder undefined oder so ist...
        console.log("d3.event.sourceEvent gibt fehler ?")
        return
      }
      let mitteModul = d3.event.sourceEvent.offsetX
      if (d3.event.sourceEvent.type === "wheel") {
        let prozentVerschiebung =
          (self.lastTransformedX - mitteModul) / (containerWidth * self.zoom)

        let newK = d3.event.transform.k
        if (newK > self.lastZoomK) {
          // rangezoomt
          self.zoom = self.zoom * 1.25
        } else {
          self.zoom = self.zoom / 1.25
          if (self.zoom < 1) {
            self.zoom = 1
          }
        }
        // MAX ZOOM
        if (self.zoom > 200) {
          self.zoom = 200
        }
        self.lastZoomK = newK
        self.lastZoomX = JSON.parse(JSON.stringify([d3.event.transform.x]))[0]
        self.setState((prevState) => {
          prevState.filterValues[0].value = Math.round(self.zoom * 100) + "%"
          return prevState
        })
        let calculatedX =
          prozentVerschiebung * self.zoom * containerWidth + mitteModul

        if (self.zoom === 1) {
          calculatedX = 0
        }
        self.resize(true)

        let deltaSVGx = containerWidth * self.zoom - containerWidth
        if (deltaSVGx + calculatedX < 0) {
          calculatedX = -deltaSVGx
        } else if (calculatedX > 0) {
          calculatedX = 0
        }
        self.lastTransformedX = calculatedX
        // self.gGraphics.attr(
        //   "transform",
        //   "translate(" + calculatedX + " " + self.currentPixelOffset + ")"
        // )
        self.gGraphics.attr(
          "transform",
          "translate(" + calculatedX + " " + 0 + ")"
        )

        self.gGridlines.attr(
          "transform",
          "translate(" +
            calculatedX +
            " " +
            (self.height - self.svgMarginY / 2) +
            ")"
        )
      } else if (d3.event.sourceEvent.type === "mousemove") {
        let deltaX = d3.event.transform.x - self.lastZoomX
        let calculatedX = self.lastTransformedX
        let svgWidth = containerWidth * self.zoom
        let deltaSVGx = svgWidth - containerWidth

        // Diagramm verschiebt sich nach links
        // deltaSVGx - calculated x muss immer >= 0 sein
        calculatedX = calculatedX + deltaX
        if (deltaSVGx + calculatedX < 0) {
          calculatedX = -deltaSVGx
        } else if (calculatedX > 0) {
          calculatedX = 0
        }
        self.lastTransformedX = calculatedX
        // self.gGraphics.attr(
        //   "transform",
        //   "translate(" + calculatedX + " " + self.currentPixelOffset + ")"
        // )
        self.gGraphics.attr(
          "transform",
          "translate(" + calculatedX + " " + 0 + ")"
        )
        self.gGridlines.attr(
          "transform",
          "translate(" +
            calculatedX +
            " " +
            (self.height - self.svgMarginY / 2) +
            ")"
        )
        self.lastZoomX = self.lastZoomX + deltaX
      }
    })

    // self.gGridlines = d3
    //   .select(self.containerRefs.svgRoot)
    //   .append("g")
    //   .class("class", "gGridlines")

    // let svg = (this.gGraphics = d3
    //   .select(self.svgRoot)
    //   .append("g")
    //   .attr("class", "linelist"))

    self.gGraphics = d3
      .select(self.containerRefs.svgRoot)
      .call(zoom)
      .on("mousemove", mouseLine)
      .append("g")
      .attr("class", "gContainer timelineContainer")

    this.gScrollbar = d3
      .select(self.containerRefs.svgRoot)
      .append("g")
      .attr("class", "gScrollbar")

    this.gGridlines = d3
      .select(self.containerRefs.svgRoot)
      .append("g")
      .attr("class", "gGridlinesLinelist")

    self.gMouseLabel = d3
      .select(self.containerRefs.svgRoot)
      .append("g")
      .attr("class", "gMouseLabel")

    self.gGraphics
      .append("line")
      .attr("class", "mouseLine")
      .attr("opacity", 0.5)
      .attr("stroke-width", 1)
      .attr("stroke", "black")

    // self.gGraphics.
    self.gMouseLabel.append("text").attr("class", "mouseLabel")

    let svg = self.gGraphics

    this.gDefs = svg.append("g").attr("class", "gDefs")
    let defs = self.gDefs.append("defs")
    let gradient = defs
      .append("linearGradient")
      .attr("id", "unknownMovement")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%")

    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "black")
      .attr("stop-opacity", 0.5)

    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "black")
      .attr("stop-opacity", 0)

    this.gScrollableGraphics = svg
      .append("g")
      .attr("class", "gScrollableGraphics")
      .attr("fill", "none")

    this.gTrennLines = this.gScrollableGraphics
      .append("g")
      .attr("class", "gTrennLines")
      .attr("fill", "none")
    this.gStatusBars = this.gScrollableGraphics
      .append("g")
      .attr("class", "gStatusBars")
      .attr("fill", "none")
    this.gInspections = this.gScrollableGraphics
      .append("g")
      .attr("class", "gInspections")
    this.gLines = this.gScrollableGraphics
      .append("g")
      .attr("class", "gLines")
      .attr("fill", "none")
    this.gCircles = this.gScrollableGraphics
      .append("g")
      .attr("class", "gCircles")
    // this.gInspections = svg.append("g").attr("class", "gInspections")
    this.gText = svg
      .append("g")
      .attr("class", "gText")
      .style("font", "10px sans-serif")

    this.gLegend = svg.append("g").attr("class", "gLegend")
    // this.gGridlines = svg.append("g").attr("class", "gGridlines")

    // self.gGraphics
    //     .append("line").attr("class", "mouseLine")

    // self.gGraphics
    //     .append("text").attr("class", "mouseLabel")
  }

  getData = () => {
    let self = this
    const filterValues = this.props.getFilterValues()
    const tmpFilterValues = [
      // { name: "ZOOM", value: self.zoom * 100 + "%" },
      // { name: "Patient", value: "P[" + String(filterValues.lop) + "]" }
      { name: "Patient", value: String(filterValues.lop) },
    ]

    let missingParam = []
    // falls ungültige Auswahl
    if (filterValues.hospitalID <= -1) {
      missingParam.push("Standort-Auswahl ungültig.")
    }
    if (filterValues.keimID <= -1) {
      missingParam.push("Keim-Auswahl ungültig.")
    }
    if (filterValues.patientID <= -1) {
      missingParam.push("Patient-Auswahl ungültig.")
    }

    // MISSINGTODO
    // if (missingParam.length > 0) {
    if (false) {
      this.setState({
        data: {
          loading: true,
          available: false,
          error: undefined,
          missingParam: missingParam,
        },
        filterValues: tmpFilterValues,
      })
    } else {
      this.setState({
        data: {
          loading: true,
          available: false,
          error: undefined,
          missingParam: missingParam,
        },
        filterValues: tmpFilterValues,
      })
      this.setState({
        data: {
          loading: true,
          available: false,
          error: undefined,
          missingParam: missingParam,
        },
      })

      // let title = "Linelist Patient(en) "
      // // tmpFilterValues.forEach(d => {
      // //     title += ` ${d.value}`
      // // })
      // title += String(filterValues.lop)
      // let title = "Linelist"
      let title = "Patient Timeline View"
      self.props.glContainer.setTitle(title)
    }
  }

  handleError = (error) => {
    this.setState({
      data: {
        available: false,
        loading: false,
        error: error,
      },
    })
  }

  handleData = (data) => {
    console.log("HANDLE DATA LINELIST")
    console.log(data)
  }

  ORIGINAL_handleData = (data) => {
    console.log("Rohdaten", data)
    this.parameters = data[2]
    let self = this
    this.info = ["test"]
    let stationen = []
    let bewegungstypen = []
    let bewTypen = []
    let casetypes = []
    let casTypen = []
    self.needScrollInit = true
    self.currentPixelOffset = -1
    // self.color = d3.scaleOrdinal(d3.schemeCategory10)

    // data[1].forEach((d) => {
    //   d.Screening = 1
    // })

    self.color = d3.scaleOrdinal().range([
      // "#1f78b4",
      "#33a02c",
      "#e31a1c",
      "#ff7f00",
      "#6a3d9a",
      "#b15928",
      // "#a6cee3",
      "#b2df8a",
      "#fb9a99",
      // "#fdbf6f",
      "#cab2d6",
      "#ffff99",
      "#000000",
    ])
    // self.color2 = d3.scaleOrdinal(d3.schemeCategory10)
    // self.color2 = d3
    //   .scaleOrdinal()
    //   .domain(1, 2, 3, 4, 6, 7)
    //   .range([
    //     "#4daf4a",
    //     "#e41a1c",
    //     "#ff7f00",
    //     "#377eb8",
    //     "#a65628",
    //     "#ffff33"
    //   ])
    self.color2 = (d) => {
      switch (d) {
      // Aufnahme
      case 1:
        return "#4daf4a"
        // Entlassung
        // case 2: return "#e41a1c"
        // case 2: return "#ff84d3"
      case 2:
        return "#000000"

        // Wechseln
        // case 3: return "#ff7f00"
        // case 3: return "#7c6f44"
        // case 3: return "#d95f02"
      case 3:
        return "#d95f02"
        // Behandlung
        // case 4: return "#377eb8"
      case 4:
        return "#6a3d9a"

        // andere
      case 6:
        return "#a65628"
      case 7:
        return "#ffff33"
        // case 7: return "#ff84d3"
        // case 7: return "#6a3d9a"
      default:
        return "black"
      }
    }
    // self.color3 = d3.scaleOrdinal(d3.schemeCategory10)
    self.color3 = (d) => {
      switch (d) {
      case 1:
        return "#1b9e77"
      case 2:
        return "#d95f02"
      case 3:
        return "#7570b3"
      default:
        return "black"
      }
    }

    /**
     * Stationsfarben
     */
    self.all_stations = []

    /**
     * COVID DEMO HEIDELBERG
     * Filtern der daten -> Wenn Ende nach dem Jahr 3000, raus (markus gibt null zurueck)
     */
    data[0] = data[0].filter((d) => {
      return d.Ende !== null
    })
    data[1].forEach((d) => {
      d.Eingangsdatum = d.Auftragsdatum
    })

    data[0].forEach((mov) => {
      if (
        mov.BewegungstypID !== 4 &&
        !self.all_stations.includes(mov.StationID)
      ) {
        self.all_stations.push(mov.StationID)
      }
    })
    self.all_stations.sort((a, b) => a - b)
    self.color = self.color4 = d3
      .scaleOrdinal()
      .range([
        // "#b831d4",
        // "#bdd7e7",
        "#bae4b3",
        // "#f2f0f7",
        "#cbc9e2",
        "#9e9ac8",
        // "#cc4c02",

        // "#6a51a3",
        // "#8da0cb",
        "#66c2a5",
        // "#a6cee3",
        // "#1f78b4",
        // "#33a02c",
        "#ffffb3",
        // "#fbb4ae",
        "#fdcdac",
        "#74c476",
      ])
      .domain(self.all_stations)
    // self.color4 = d3.scaleOrdinal().range([
    //   // "#1f78b4",
    //   "#33a02c",
    //   "#e31a1c",
    //   "#ff7f00",
    //   "#6a3d9a",
    //   "#b15928",
    //   // "#a6cee3",
    //   "#b2df8a",
    //   "#fb9a99",
    //   // "#fdbf6f",
    //   "#cab2d6",
    //   "#ffff99",
    //   "#000000",
    // ])

    if (data[0].length <= 0) {
      this.setState({
        data: {
          availale: false,
          loading: false,
          error: undefined,
          missingParam: [],
        },
        keimIDs: [],
        getKeimID: 0,
      })
    } else {
      let keimIDs = []
      if (this.getDataFuncName === "getTimeline") {
        console.log(this.getDataFuncName)
        // return

        let filterValues = self.props.getFilterValues()

        let patients = []
        // filterValues.lop.forEach((d, i) => {
        this.parameters.lop.forEach((d, i) => {
          patients.push({
            PatientID: d,
            Bewegungen: [], // BewegungstypID != 4
            Behandlungen: [], // BewegungstypID == 4
            Untersuchungen: [],
            // ErsterkrankungAnKeim: undefined,
            ErsterBefundKeim: undefined,
            ErstesScreeningKeim: undefined,
            GesundBis: undefined,
            manuellePosition: i,
            beginFirstMovement: undefined,
            endLastMovement: undefined,
            untersuchteKeime: [],
            befundKeime: [],
            screeningKeime: [],
            // infizierteKeime: [],
          })
        })

        /**
         * Alle Zeitstempel der Bewegungen und Untersuchungen sammeln
         * (mit Duplikaten)
         * Und Informationen zu jedem Patienten in patients[] speichern
         * (bringt mir noch nichts, soll aber später beim Anzeigen von
         * Zusatzinfos helfen)
         */
        let ebenen = []
        let times = []

        /**
         * Es wird davon ausgegangen, dass die Bewegungen Chronologisch sind.
         * Falls nicht, würde nur das "Iterieren der Ebenen" ggf. nicht korrekt sein
         */
        data[0].forEach((d, index) => {
          let beginn = new Date(d.Beginn).getTime()
          let ende = new Date(d.Ende).getTime()
          times.push(beginn)
          times.push(ende)
          d.b = beginn
          d.e = ende
          let pID = d.PatientID
          let pat = patients.find((p) => p.PatientID === pID)
          if (pat === undefined) {
            console.error(
              `Patient mit ID ${pID} kommt in den Bewegungs-Daten vor,
              wurde aber nicht angefragt!`
            )
          } else {
            let bewTypID = Number(d.BewegungstypID)

            // Nur Bewegungen, die nicht TypID 4 sind als Aufenthalt nehmen
            if (bewTypID !== 4) {
              if (pat.beginFirstMovement === undefined) {
                pat.beginFirstMovement = beginn
              }
              pat.endLastMovement = ende
            }

            // Bewegung im Patienten speichern, sortiert nach === 4 und !== 4
            if (bewTypID === 4) {
              pat.Behandlungen.push(d)
            } else {
              pat.Bewegungen.push(d)
            }
          }

          /**
           * "NEUE" Ebenenmechanik
           * brauche ich nicht, ich nehme einfach index der Bewegung
           * beim Zeichnen mit d3
           */

          /**
           * KEINE AHNUNG WAS DSA NOCHMAL MACHT
           */
          d.index = index

          /**
           * StationIDs, BewegungstypIDs und CaseTypeIDs zusammen sammeln
           * fuer die Einfaerbung
           */
          if (!stationen.includes(d.StationID)) {
            if (d.BewegungstypID !== 4) {
              stationen.push(d.StationID)
            }
          }
          if (!bewTypen.includes(d.BewegungstypID)) {
            bewegungstypen.push({
              id: d.BewegungstypID,
              typ: d.Bewegungstyp,
            })
            bewTypen.push(d.BewegungstypID)
          }
          if (!casTypen.includes(d.CaseID)) {
            casetypes.push({
              id: d.CaseID,
              typ: d.CaseType_l,
            })
            casTypen.push(d.CaseID)
          }

          /**
           * Alte Ebenenberechnung (?)
           */

          let nextEbene = 1
          let ebenenSave = ebenen.filter(
            (e) =>
              (!e.noDuration && e.timestamp >= beginn) ||
              (e.noDuration && e.timestamp + 86400000 >= beginn)
          )
          if (ebenen.length > 0) {
            // alle rausschmeissen, deren timestamp VOR beginn ist
            // dann niedrigste Ebene suchen (wenn eine Frei ist die nehmen,
            // ansonsten hoch zählen in forschleife bis length erreicht ist)

            ebenen = ebenenSave
            if (ende - beginn > 86400000) {
              ebenen = ebenenSave.filter((e) => e.timestamp >= beginn)
            }

            nextEbene = ebenen.length + 1
            for (let i = 0; i <= ebenen.length; i++) {
              let usedEbene = ebenen.filter((e) => e.ebene === i + 1)
              // let noDurationEbenen = ebenen.filter(e => e.noDuration)
              // if (usedEbene.length === 0 && !noDurationEbenen.includes()) {
              if (usedEbene.length === 0) {
                nextEbene = i + 1
                break
              }
            }
          }
          let noDuration = false
          if (beginn === ende) {
            noDuration = true // ende + 86400000
          }
          ebenen = ebenenSave
          ebenen.push({
            ebene: nextEbene,
            timestamp: ende,
            noDuration: noDuration,
          })
          d.ebene = nextEbene
        })

        // let lastInspectDate = 0
        // let inspections = []
        let inspecTimes = []
        // ErgebnisID 5 = POSITIV
        data[1].forEach((d) => {
          let ts = new Date(d.Eingangsdatum.split(".")[0]).getTime()

          d.timestamp = ts
          d.tsEnde = ts + 86400000

          inspecTimes.push(ts)
          inspecTimes.push(ts + 86400000)
        })

        times.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
        inspecTimes.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))

        /**
         * Untersuchungen zusammen sammeln
         * Und alle Keime, auf die Untersucht wurde
         */
        patients.forEach((p) => {
          let Untersuchungen = p.Untersuchungen
          let untersuchungenDesPatienten = data[1].filter(
            (d) => d.PatientID === p.PatientID
          )

          /**
           * Zusammenfassen der Untersuchungen
           */
          untersuchungenDesPatienten.forEach((u) => {
            // Keim auf die Liste aller Keime für Dropdown hinzufügen
            let indexKeimIDs = keimIDs.findIndex((ki) => ki.KeimID === u.KeimID)
            if (indexKeimIDs === -1) {
              keimIDs.push({
                KeimID: u.KeimID,
                Keim_k: u.Keim_k,
                Keim_l: u.Keim_l,
              })
            }
            // Wenn die Untersuchung exakt Mitternacht ist,
            // dann wurde keine Zeit mit aufgezeichnet
            // -> die Untersuchung war während der nächsten 24 Stunden
            // Ansonsten war sie exakt um diese Uhrzeit
            // Notiz: Das ist der genaueste Zeitstempel
            let date = new Date(u.Eingangsdatum.split(".")[0])
            let ts = date.getTime()
            let offsetMidnight =
              date.getHours() + date.getMinutes() + date.getSeconds()
            let tsEnde = offsetMidnight === 0 ? ts + 86400000 : ts

            // Untersuchungsobjekt (falls vorhanden) suchen, das alle
            // Untersuchungen zusammenfasst
            let indexOfInspec = Untersuchungen.findIndex(
              (d) => d.timestamp === ts
            )

            if (indexOfInspec === -1) {
              Untersuchungen.push({
                timestamp: ts,
                tsEnde: tsEnde,
                inspections: [],
                KeimIDs: [],
                // positiveKeime: [],
                befundKeime: [],
                screeningKeime: [],
                PatientID: p.PatientID,
                MREKlasseID: null,
              })
              indexOfInspec = Untersuchungen.length - 1
            }
            let unt = Untersuchungen[indexOfInspec]
            // if (u.ErgebnisID === 5) {

            let mreClass = u.MREKlasseID
            if (mreClass !== null) {
              if (unt.MREKlasseID === null) {
                unt.MREKlasseID = mreClass
              } else {
                if (mreClass > unt.MREKlasseID) {
                  unt.MREKlasseID = mreClass
                }
              }
            }

            if (u.Befund == 1 && u.Screening == 0) {
              unt.befundKeime.push(u.KeimID)
            }
            if (u.Screening == 1 && u.Befund == 1) {
              unt.screeningKeime.push(u.KeimID)
            }

            // if (u.id === 213459) {
            //   console.log(u.Screening, u.Befund, u, unt)
            // }

            // if (u.Befund === 1) {
            //   unt.befundKeime.push(u.KeimID)
            // } else if (u.Screening === 1) {
            //   unt.screeningKeime.push(u.KeimID)
            // } else {
            //   // unt.KeimIDs.push(u.KeimID)
            // }
            unt.KeimIDs.push(u.KeimID)

            // if (u.Screening === 1) {
            //   unt.positiveKeime.push(u.KeimID)
            // } else {
            //   unt.KeimIDs.push(u.KeimID)
            // }
            unt.inspections.push(u)
            // Index von .untersuchteKeime
            let keimIndex = p.untersuchteKeime.findIndex(
              (k) => k.KeimID === u.KeimID
            )
            if (keimIndex === -1) {
              p.untersuchteKeime.push({
                KeimID: u.KeimID,
                timestamps: [ts],
              })
            } else if (!p.untersuchteKeime[keimIndex].timestamps.includes(ts)) {
              p.untersuchteKeime[keimIndex].timestamps.push(ts)
            }
            // if (u.ErgebnisID === 5) {
            // console.log(u.Befund, u.Screening)
            if (u.Befund == 1 && u.Screening == 0) {
              // console.log("in 1 0")
              let indexK = p.befundKeime.findIndex((k) => k.KeimID === u.KeimID)
              if (indexK === -1) {
                p.befundKeime.push({
                  KeimID: u.KeimID,
                  ErsterBefundKeim: u.timestamp,
                })
              } else if (p.befundKeime[indexK].ErsterBefundKeim > u.timestamp) {
                p.befundKeime[indexK].ErsterBefundKeim = u.timestmap
              }
            } else if (u.Befund == 1 && u.Screening == 1) {
              // console.log("in 1 1")
              let indexK = p.screeningKeime.findIndex(
                (k) => k.KeimID === u.KeimID
              )
              if (indexK === -1) {
                p.screeningKeime.push({
                  KeimID: u.KeimID,
                  ErstesScreeningKeim: u.timestamp,
                })
              } else if (
                p.screeningKeime[indexK].ErstesScreeningKeim > u.timestamp
              ) {
                p.screeningKeime[indexK].ErstesScreeningKeim = u.timestmap
              }
            }
          })
        })

        console.log("patients", patients)

        /**
         * Anfang und Ende des gesamten Zeitraums herausfinden
         * (minT und maxT aller Bewegungen/Untersuchungen)
         */
        let start = 0
        let ende = 0

        if (times.length > 0) {
          // start = times[0] - 86400000
          // ende = times[times.length - 1] + 86400000

          // Wenn start und ende gleichzeitig sind,
          // dann vorne und hinten dran einen tag
          let insp1 = times[0]
          let insp2 = times[0]
          if (inspecTimes.length > 0) {
            insp1 = inspecTimes[0]
            insp2 = inspecTimes[inspecTimes.length - 1]
          }
          let startEndeDiff =
            Math.max(times[times.length - 1], insp2) - Math.min(times[0], insp1)
          let minDiff = Math.max(startEndeDiff / 20, 86400000)
          start = Math.min(times[0], insp1) - minDiff
          ende = Math.max(times[times.length - 1], insp2) + minDiff
        }

        this.timeStamps = [start, ende]

        self.originalData = JSON.parse(JSON.stringify(data))
        // console.log("inspections", inspections)
        this.data = patients
        console.log("data", this.data)
        this.OLD_data = data
      } else {
        console.error(
          "Get-Data-Function " + this.getDataFuncName + " is not supported."
        )
      }
      this.selectedStations = []
      this.zoom = 1
      this.lastZoomK = 1
      this.lastZoomX = 0
      this.lastTransformedX = 0
      self.gGraphics.attr("transform", "translate(" + 0 + " " + 0 + ")")

      stationen.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
      bewegungstypen.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
      casetypes.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
      this.setState((prevState) => {
        prevState.data = {
          available: true,
          loading: false,
          error: undefined,
          missingParam: [],
        }
        prevState.filterValues[0].value = Math.round(self.zoom * 100) + "%"
        prevState.stationen = stationen
        prevState.bewegungstypen = bewegungstypen
        prevState.casetypes = casetypes
        prevState.keimIDs = keimIDs
        prevState.getKeimID = 0
        prevState.selectedStations = []
        return prevState
      })
      this.resize()
    }
  }

  resize = (
    onZoom,
    colorNr,
    behandlungsConfig,
    untersuchungsConfig,
    minimaleAnzeige
  ) => {
    let self = this

    let data = this.data

    console.log("drawing linelist")

    /**
     * Titel + Timestamp
     */

    let title = this.gLegend.selectAll(".title").data([this.title])

    title
      .enter()
      .append("text")
      .attr("class", "title")
      .merge(title)
      .transition()
      .duration(this.transition_duration)
      .text((d) => d)
      .attr("font-size", this.margin.top / 2)
      .attr("x", this.width / 2)
      .attr("y", (this.margin.top * 2) / 3)
      .attr("text-anchor", "middle")

    title.exit().remove()

    if (this.data === undefined) {
      return
    }

    if (self.data === undefined) {
      console.error("Self.data ist undefined.")
      return
    }
    if (colorNr === undefined) colorNr = self.state.getColor

    if (minimaleAnzeige === undefined)
      minimaleAnzeige = self.state.getMinimaleAnzeige

    if (behandlungsConfig === undefined)
      behandlungsConfig = self.state.getBehandlungConfig

    if (untersuchungsConfig === undefined)
      untersuchungsConfig = self.state.getUntersuchungConfig

    // if (self.props.getLang() === "eng") {
    //   moment.locale("en")
    // } else if (self.props.getLang() === "ger") {
    //   moment.locale("de")
    // }
    moment.locale("de")

    let newWidth = parseInt(
      d3.select(self.containerRefs.svgRoot).style("width")
    )
    let newHeight = parseInt(
      d3.select(self.containerRefs.svgRoot).style("height")
    )

    let svgMarginLeft = self.margin.left
    let svgMarginRight = self.margin.right
    // let svgMarginX = self.svgMarginX
    let svgMarginY = self.svgMarginY
    let width = newWidth * self.zoom
    let height = newHeight
    self.height = height

    // let data = self.data

    let scaleX = d3.scaleLinear()
    // let scaleY = d3.scaleLinear()

    self.scaleReverseX = d3
      .scaleLinear()
      .range(d3.extent(self.timeStamps, (d) => d))
      .domain([svgMarginLeft, width - svgMarginRight])
    scaleX
      .domain(d3.extent(self.timeStamps, (d) => d))
      .range([svgMarginLeft, width - svgMarginRight])
    // scaleY
    //   .domain(
    //     d3.extent(
    //       [self.svgMarginY, self.calculateHeight - self.svgMarginY],
    //       d => d
    //     )
    //   )
    //   .range([svgMarginY, height - svgMarginY])

    let minRowHeight = self.minRowHeight
    let lineHeight = self.lineHeight
    let circleRadius = self.circleRadius
    let inspecHeight = self.inspecHeight
    // let minRowMargin = (minRowHeight - 2 * lineHeight - 2 * circleRadius) / 2
    let svgHeight = height - 2 * svgMarginY
    let maxPatientRows = Math.floor(svgHeight / minRowHeight)
    // console.log("height", height, svgHeight)

    if (minimaleAnzeige) {
      minRowHeight = 20
      lineHeight = 4
      circleRadius = 1
      inspecHeight = 15
      maxPatientRows = Math.floor(svgHeight / minRowHeight)

      colorNr = 0
      behandlungsConfig = 1
      untersuchungsConfig = 2
    }

    let onePercent = (self.timeStamps[1] - self.timeStamps[0]) / 100

    // console.log("resize data", data)
    let patients = JSON.parse(JSON.stringify(data))

    let rowCount = patients.length > 0 ? patients.length : 1
    let rowHeight = svgHeight / rowCount
    rowHeight = minRowHeight
    // let rowMargin = (rowHeight - minRowHeight) / 2

    let lineData = []
    let circleData = []
    let inspectionData = []
    let infectionStatus = []

    self.patientIDs = []
    self.rowHeight = rowHeight

    /**
     * die nächste Zeile ist dafür da, "zu viele" Patienten wegzuschneiden
     */
    // patients = patients.slice(0, maxPatientRows)
    /**
     * Falls es mehr Patienten-Zeilen gibt als angezeigt werden kann
     */
    // if (self.needScrollInit) {
    if (true) {
      // if (patients.length > maxPatientRows) {
      self.gScrollbar.selectAll("*").remove()

      // if (patients.length > maxPatientRows) {
      if (true) {
        let maxPixelOffset = (patients.length - maxPatientRows - 1) * rowHeight
        if (maxPixelOffset < 0) {
          maxPixelOffset = 0
        }

        if (self.currentPixelOffset > maxPixelOffset) {
          self.currentPixelOffset = maxPixelOffset
        }
        if (self.currentPixelOffset < 0) {
          self.currentPixelOffset = 0
        }

        let overlayRectangles = [
          {
            x: 0,
            y: 0,
            width: self.margin.left,
            height: height,
          },
          {
            x: width - self.margin.right,
            y: 0,
            width: self.margin.right,
            height: height,
          },
          {
            x: 0,
            y: height - self.margin.bottom,
            width: width,
            height: self.margin.bottom,
          },
        ]

        let rects = self.gScrollbar.selectAll("rect").data(overlayRectangles)

        rects
          .enter()
          .append("rect")
          .attr("x", (d) => d.x)
          .attr("y", (d) => d.y)
          .attr("width", (d) => d.width)
          .attr("height", (d) => d.height)
          .attr("class", "scrollRectangle")
          // .attr("fill", "#dddddd")
          .attr("fill", "white")
          .merge(rects)

        rects.exit().remove()

        let handle

        let hue = (h) => {
          handle.attr("cy", y(h))
          self.currentPixelOffset = h
          self.gScrollableGraphics.attr(
            "transform",
            "translate(" +
              // self.lastTransformedX +
              0 +
              " " +
              self.currentPixelOffset +
              ")"
          )
        }

        let y = d3
          .scaleLinear()
          .domain([0, maxPixelOffset])
          .range([height - self.margin.bottom, self.margin.top])
          .clamp(true)

        let slider = self.gScrollbar
          .append("g")
          .attr("class", "slider")
          .attr("transform", "translate(" + self.margin.left / 2 + ",0)")

        slider
          .append("line")
          .attr("class", "track")
          .attr("stroke-linecap", "round")
          .attr("y1", y.range()[0])
          .attr("y2", y.range()[1])
          .select(function () {
            return this.parentNode.appendChild(this.cloneNode(true))
          })
          .attr("class", "track-inset")
          .select(function () {
            return this.parentNode.appendChild(this.cloneNode(true))
          })
          .attr("class", "track-overlay")
          .attr("stroke-linecap", "round")
          .attr("cursor", "pointer")
          .call(
            d3
              .drag()
              .on("start.interrupt", function () {
                slider.interrupt()
              })
              .on("start drag", function () {
                hue(y.invert(d3.event.y))
              })
          )

        // slider
        //   .insert("g", ".track-overlay")
        //   .attr("class", "ticks")
        //   .attr("transform", "translate(25,0)")
        //   .selectAll("text")
        //   .data(y.ticks(10))
        //   .enter()
        //   .append("text")
        //   .attr("y", y)
        //   .attr("text-anchor", "middle")
        //   .text(function(d) {
        //     return d + "°"
        //   })

        handle = slider
          .insert("circle", ".track-overlay")
          .attr("class", "handle")
          .attr("stroke-linecap", "round")
          .attr("r", 9)

        if (patients.length <= maxPatientRows) {
          self.currentPixelOffset = 0
        }

        hue(self.currentPixelOffset)

        // slider
        //   .transition() // Gratuitous intro!
        //   .duration(2000)
        //   .tween("hue", function() {
        //     let offset = self.currentPixelOffset
        //     let i = d3.interpolate(y.invert(0), y.invert(self.savedOffset))
        //     return function(t) {
        //       hue(i(t))
        //     }
        //   })
      }

      if (patients.length <= maxPatientRows) {
        self.gScrollbar.selectAll("*").remove()
      }
      self.needScrollInit = false
    }

    patients.forEach((p, i) => {
      self.patientIDs.push(p.PatientID)
      // Hier werden alle Daten in die obigen Arrays gepusht,
      // mit i als.rowNumber = i
      let Bewegungen = p.Bewegungen
      Bewegungen.forEach((b, j) => {
        b.rowNumber = i
        b.Ebene = j % 2
      })
      lineData.push(...Bewegungen)

      let Behandlungen = p.Behandlungen
      Behandlungen.forEach((b, j) => {
        b.rowNumber = i
        b.Ebene = j % 2
      })
      circleData.push(...Behandlungen)

      let Untersuchungen = p.Untersuchungen
      Untersuchungen.forEach((u) => {
        u.rowNumber = i
      })
      inspectionData.push(...Untersuchungen)

      let {
        ErsterBefundKeim,
        ErstesScreeningKeim,
        GesundBis,
        beginFirstMovement,
        endLastMovement,
      } = p
      /**
       * Es gibt vier möglichkeiten:
       * u - k        -> Unbekannt bis zur Erstinfektion; Nur Erstinfektion bekannt
       * g - u        -> Gesund bis zum letzten Test; Nur GesundBis bekannt
       * u            -> Unbekannt von Anfang bis Ende; nichts bekannt
       * g - u - k    -> Gesund bis GesundBis, dann Unbekannt bis zur
       *                  Erstinfektion; beides bekannt
       */
      /**
       * Es gibt acht Möglichkeiten:
       * 1. Befund: 0   Screen: 0     Neg: 0
       * UBK
       * 2. Befund: 0   Screen: 0     Neg: 1
       * GES - UBK
       * 3. Befund: 0   Screen: 1     Neg: 0
       * INF - TRAE
       * 4. Befund: 0   Screen: 1     Neg: 1
       * GES - INF - TRAE
       * 5. Befund: 1   Screen: 0     Neg: 0
       * INF - KRA
       * 6. Befund: 1   Screen: 0     Neg: 1
       * GES - INF - KRA
       * 7. Befund: 1   Screen: 1     Neg: 0
       * INF - TRA - KRA
       * 8. Befund: 1   Screen: 1     Neg: 1
       * GES - INF - TRA - KRA
       */
      if (false) {
        if (GesundBis) {
          GesundBis =
            GesundBis >= beginFirstMovement ? GesundBis : beginFirstMovement
          GesundBis = GesundBis <= endLastMovement ? GesundBis : endLastMovement
        }
        if (ErstesScreeningKeim) {
          ErstesScreeningKeim =
            ErstesScreeningKeim >= beginFirstMovement
              ? ErstesScreeningKeim
              : beginFirstMovement
          ErstesScreeningKeim =
            ErstesScreeningKeim <= endLastMovement
              ? ErstesScreeningKeim
              : endLastMovement
        }
        if (ErsterBefundKeim) {
          ErsterBefundKeim =
            ErsterBefundKeim >= beginFirstMovement
              ? ErsterBefundKeim
              : beginFirstMovement
          ErsterBefundKeim =
            ErsterBefundKeim <= endLastMovement
              ? ErsterBefundKeim
              : endLastMovement
        }

        if (
          GesundBis === ErstesScreeningKeim &&
          GesundBis === beginFirstMovement
        ) {
          GesundBis = undefined
        }
        if (
          ErstesScreeningKeim === ErsterBefundKeim &&
          ErstesScreeningKeim === beginFirstMovement
        ) {
          ErstesScreeningKeim = undefined
        }

        if (
          ErsterBefundKeim === ErstesScreeningKeim &&
          ErsterBefundKeim === endLastMovement
        ) {
          ErsterBefundKeim = undefined
        }
        if (
          ErstesScreeningKeim === GesundBis &&
          ErstesScreeningKeim === endLastMovement
        ) {
          ErstesScreeningKeim = undefined
        }

        if (!ErsterBefundKeim && !ErstesScreeningKeim && !GesundBis) {
          /**
           * Möglichkeit 1
           */
          infectionStatus.push({
            rowNumber: i,
            Beginn: beginFirstMovement,
            Ende: endLastMovement,
            status: "UNBEKANNT",
          })
        } else if (!ErsterBefundKeim && !ErstesScreeningKeim && GesundBis) {
          /**
           * Möglichkeit 2
           */
          infectionStatus.push({
            rowNumber: i,
            Beginn: beginFirstMovement,
            Ende: GesundBis,
            status: "GESUND",
          })
          infectionStatus.push({
            rowNumber: i,
            Beginn: GesundBis,
            Ende: endLastMovement,
            status: "UNBEKANNT",
          })
        } else if (!ErsterBefundKeim && ErstesScreeningKeim && !GesundBis) {
          /**
           * Möglichkeit 3
           */
          infectionStatus.push({
            rowNumber: i,
            Beginn: beginFirstMovement,
            Ende: ErstesScreeningKeim,
            status: "INFEKTIONSZEIT",
          })
          infectionStatus.push({
            rowNumber: i,
            Beginn: ErstesScreeningKeim,
            Ende: endLastMovement,
            status: "TRAEGER",
          })
        } else if (!ErsterBefundKeim && ErstesScreeningKeim && GesundBis) {
          /**
           * Möglichkeit 4
           */
          infectionStatus.push({
            rowNumber: i,
            Beginn: beginFirstMovement,
            Ende: GesundBis,
            status: "GESUND",
          })
          infectionStatus.push({
            rowNumber: i,
            Beginn: GesundBis,
            Ende: ErstesScreeningKeim,
            status: "INFEKTIONSZEIT",
          })
          infectionStatus.push({
            rowNumber: i,
            Beginn: ErstesScreeningKeim,
            Ende: endLastMovement,
            status: "TRAEGER",
          })
        } else if (ErsterBefundKeim && !ErstesScreeningKeim && !GesundBis) {
          /**
           * Möglichkeit 5
           */
          infectionStatus.push({
            rowNumber: i,
            Beginn: beginFirstMovement,
            Ende: ErsterBefundKeim,
            status: "INFEKTIONSZEIT",
          })
          infectionStatus.push({
            rowNumber: i,
            Beginn: ErsterBefundKeim,
            Ende: endLastMovement,
            status: "KRANK",
          })
        } else if (ErsterBefundKeim && !ErstesScreeningKeim && GesundBis) {
          /**
           * Möglichkeit 6
           */
          infectionStatus.push({
            rowNumber: i,
            Beginn: beginFirstMovement,
            Ende: GesundBis,
            status: "GESUND",
          })
          infectionStatus.push({
            rowNumber: i,
            Beginn: GesundBis,
            Ende: ErsterBefundKeim,
            status: "INFEKTIONSZEIT",
          })
          infectionStatus.push({
            rowNumber: i,
            Beginn: ErsterBefundKeim,
            Ende: endLastMovement,
            status: "KRANK",
          })
        } else if (ErsterBefundKeim && ErstesScreeningKeim && !GesundBis) {
          /**
           * Möglichkeit 7
           */
          infectionStatus.push({
            rowNumber: i,
            Beginn: beginFirstMovement,
            Ende: ErstesScreeningKeim,
            status: "INFEKTIONSZEIT",
          })
          infectionStatus.push({
            rowNumber: i,
            Beginn: ErstesScreeningKeim,
            Ende: ErsterBefundKeim,
            status: "TRAEGER",
          })
          infectionStatus.push({
            rowNumber: i,
            Beginn: ErsterBefundKeim,
            Ende: endLastMovement,
            status: "KRANK",
          })
        } else if (ErsterBefundKeim && ErstesScreeningKeim && GesundBis) {
          /**
           * Möglichkeit 8
           */
          infectionStatus.push({
            rowNumber: i,
            Beginn: beginFirstMovement,
            Ende: GesundBis,
            status: "GESUND",
          })
          infectionStatus.push({
            rowNumber: i,
            Beginn: GesundBis,
            Ende: ErstesScreeningKeim,
            status: "INFEKTIONSZEIT",
          })
          infectionStatus.push({
            rowNumber: i,
            Beginn: ErstesScreeningKeim,
            Ende: ErsterBefundKeim,
            status: "TRAEGER",
          })
          infectionStatus.push({
            rowNumber: i,
            Beginn: ErsterBefundKeim,
            Ende: endLastMovement,
            status: "KRANK",
          })
        }
      }

      /**
       * Es gibt
       * Unbekannt (hier: Gesund)
       * Unbekannt (wirdKrank) - Traeger
       * Unbekannt (wirdKrank) - Krank
       * Unbekannt (wirdKrank) - Traeger - Krank
       *
       * Traeger
       * Traeger - Krank
       * Krank
       *
       * Unbekannt (wirdKrank)
       */

      // if (GesundBis) {
      //   GesundBis =
      //     GesundBis >= beginFirstMovement ? GesundBis : beginFirstMovement
      //   GesundBis = GesundBis <= endLastMovement ? GesundBis : endLastMovement
      // }
      // if (ErstesScreeningKeim) {
      //   ErstesScreeningKeim =
      //     ErstesScreeningKeim >= beginFirstMovement
      //       ? ErstesScreeningKeim
      //       : beginFirstMovement
      //   ErstesScreeningKeim =
      //     ErstesScreeningKeim <= endLastMovement
      //       ? ErstesScreeningKeim
      //       : endLastMovement
      // }
      // if (ErsterBefundKeim) {
      //   ErsterBefundKeim =
      //     ErsterBefundKeim >= beginFirstMovement
      //       ? ErsterBefundKeim
      //       : beginFirstMovement
      //   ErsterBefundKeim =
      //     ErsterBefundKeim <= endLastMovement
      //       ? ErsterBefundKeim
      //       : endLastMovement
      // }

      // if (
      //   GesundBis === ErstesScreeningKeim &&
      //   GesundBis === beginFirstMovement
      // ) {
      //   GesundBis = undefined
      // }
      // if (
      //   ErstesScreeningKeim === ErsterBefundKeim &&
      //   ErstesScreeningKeim === beginFirstMovement
      // ) {
      //   ErstesScreeningKeim = undefined
      // }

      // if (
      //   ErsterBefundKeim === ErstesScreeningKeim &&
      //   ErsterBefundKeim === endLastMovement
      // ) {
      //   ErsterBefundKeim = undefined
      // }
      // if (
      //   ErstesScreeningKeim === GesundBis &&
      //   ErstesScreeningKeim === endLastMovement
      // ) {
      //   ErstesScreeningKeim = undefined
      // }

      if (ErsterBefundKeim && ErstesScreeningKeim) {
        if (ErsterBefundKeim < ErstesScreeningKeim) {
          ErstesScreeningKeim = undefined
        }
      }

      if (!ErsterBefundKeim && !ErstesScreeningKeim) {
        // Gesund
        infectionStatus.push({
          rowNumber: i,
          Beginn: beginFirstMovement,
          Ende: endLastMovement,
          status: "_unbekannt",
        })
      } else if (!ErsterBefundKeim && ErstesScreeningKeim) {
        // U
        // U - T
        // T

        if (ErstesScreeningKeim >= endLastMovement) {
          infectionStatus.push({
            rowNumber: i,
            Beginn: beginFirstMovement,
            Ende: endLastMovement,
            status: "_wird_krank",
          })
        } else if (ErstesScreeningKeim <= beginFirstMovement) {
          infectionStatus.push({
            rowNumber: i,
            Beginn: beginFirstMovement,
            Ende: endLastMovement,
            status: "_traeger",
          })
        } else {
          infectionStatus.push({
            rowNumber: i,
            Beginn: beginFirstMovement,
            Ende: ErstesScreeningKeim,
            status: "_wird_krank",
          })
          infectionStatus.push({
            rowNumber: i,
            Beginn: ErstesScreeningKeim,
            Ende: endLastMovement,
            status: "_traeger",
          })
        }
      } else if (ErsterBefundKeim && !ErstesScreeningKeim) {
        // U
        // U - K
        // K

        if (ErsterBefundKeim >= endLastMovement) {
          infectionStatus.push({
            rowNumber: i,
            Beginn: beginFirstMovement,
            Ende: endLastMovement,
            status: "_wird_krank",
          })
        } else if (ErsterBefundKeim <= beginFirstMovement) {
          infectionStatus.push({
            rowNumber: i,
            Beginn: beginFirstMovement,
            Ende: endLastMovement,
            status: "_krank",
          })
        } else {
          infectionStatus.push({
            rowNumber: i,
            Beginn: beginFirstMovement,
            Ende: ErsterBefundKeim,
            status: "_wird_krank",
          })
          infectionStatus.push({
            rowNumber: i,
            Beginn: ErsterBefundKeim,
            Ende: endLastMovement,
            status: "_krank",
          })
        }
      } else if (ErsterBefundKeim && ErstesScreeningKeim) {
        // U
        // U - T
        // U - T - K
        // U - K
        // K

        if (
          ErstesScreeningKeim >= endLastMovement &&
          ErsterBefundKeim >= endLastMovement
        ) {
          // U
          infectionStatus.push({
            rowNumber: i,
            Beginn: beginFirstMovement,
            Ende: endLastMovement,
            status: "_wird_krank",
          })
        } else if (
          ErstesScreeningKeim < endLastMovement &&
          ErstesScreeningKeim > beginFirstMovement &&
          ErsterBefundKeim >= endLastMovement
        ) {
          // U - T
          infectionStatus.push({
            rowNumber: i,
            Beginn: beginFirstMovement,
            Ende: ErstesScreeningKeim,
            status: "_wird_krank",
          })
          infectionStatus.push({
            rowNumber: i,
            Beginn: ErstesScreeningKeim,
            Ende: endLastMovement,
            status: "_traeger",
          })
        } else if (
          ErstesScreeningKeim < endLastMovement &&
          ErstesScreeningKeim > beginFirstMovement &&
          ErsterBefundKeim < endLastMovement &&
          ErsterBefundKeim > beginFirstMovement
        ) {
          // U - T - K
          infectionStatus.push({
            rowNumber: i,
            Beginn: beginFirstMovement,
            Ende: ErstesScreeningKeim,
            status: "_wird_krank",
          })
          infectionStatus.push({
            rowNumber: i,
            Beginn: ErstesScreeningKeim,
            Ende: ErsterBefundKeim,
            status: "_traeger",
          })
          infectionStatus.push({
            rowNumber: i,
            Beginn: ErsterBefundKeim,
            Ende: endLastMovement,
            status: "_krank",
          })
        } else if (
          ErstesScreeningKeim <= beginFirstMovement &&
          ErsterBefundKeim < endLastMovement &&
          ErsterBefundKeim > beginFirstMovement
        ) {
          // T - K
          infectionStatus.push({
            rowNumber: i,
            Beginn: beginFirstMovement,
            Ende: ErsterBefundKeim,
            status: "_traeger",
          })
          infectionStatus.push({
            rowNumber: i,
            Beginn: ErsterBefundKeim,
            Ende: endLastMovement,
            status: "_krank",
          })
        } else if (ErsterBefundKeim < beginFirstMovement) {
          // K
          infectionStatus.push({
            rowNumber: i,
            Beginn: beginFirstMovement,
            Ende: endLastMovement,
            status: "_krank",
          })
        } else {
          // sollte nicht moeglich sein...
          comsole.error("No Infection combination for patient...")
        }
      }

      /**
       * Es gibt
       * Unbekannt (hier: Gesund)
       * Unbekannt (wirdKrank) - Traeger
       * Unbekannt (wirdKrank) - Krank
       * Unbekannt (wirdKrank) - Traeger - Krank
       *
       * Traeger
       * Traeger - Krank
       * Krank
       *
       * Unbekannt (wirdKrank)
       */

      // console.log(infectionStatus)

      //   let erkrankt = ErsterkrankungAnKeim !== undefined
      //   let ges = GesundBis !== undefined
      //   if (erkrankt) {
      //     if (ErsterkrankungAnKeim <= endLastMovement) {
      //       infectionStatus.push({
      //         rowNumber: i,
      //         Beginn: ErsterkrankungAnKeim,
      //         Ende: endLastMovement,
      //         status: "k"
      //       })
      //     } else {
      //       console.error(
      //         `ErerkrankungAnKeim ist erst nach dem Ende der letzten Bewegung!`
      //       )
      //     }
      //   }
      //   if (ges) {
      //     if (GesundBis >= beginFirstMovement) {
      //       infectionStatus.push({
      //         rowNumber: i,
      //         Beginn: beginFirstMovement,
      //         Ende: GesundBis,
      //         status: "g"
      //       })
      //     }
      //   }
      //   let ubkStatus = "u"
      //   if (erkrankt) {
      //     ubkStatus = "wk" // wird krank
      //   }
      //   let beginn = GesundBis === undefined ? beginFirstMovement : GesundBis
      //   if (beginn < beginFirstMovement) {
      //     beginn = beginFirstMovement
      //   }
      //   let ende =
      //     ErsterkrankungAnKeim === undefined
      //       ? endLastMovement
      //       : ErsterkrankungAnKeim
      //   if (ende > endLastMovement) {
      //     ende = endLastMovement
      //   }
      //   infectionStatus.push({
      //     rowNumber: i,
      //     Beginn: beginn,
      //     Ende: ende,
      //     status: ubkStatus
      //   })
      // })
    })

    console.log(patients)

    // console.log("lineData", lineData)
    // console.log("circleData", circleData)
    // console.log("inspectionData", inspectionData)
    // console.log("infectionStatus", infectionStatus)

    if (untersuchungsConfig === 1) {
      inspectionData = inspectionData.filter((i) => i.positive || i.tested)
    } else if (untersuchungsConfig === 2) {
      inspectionData = []
    }

    if (behandlungsConfig === 1) {
      circleData = []
    }

    let trennLinesData = []
    for (let i = 1; i < rowCount; i++) {
      // damit gibts ganz oben und gnaz unten auch eine Linie:
      // for (let i = 0; i <= rowCount; i++) {
      trennLinesData.push(i)
    }
    /**
     * Trennlinien
     */
    let trennLinienYpos = (d) => height - svgMarginY - d * rowHeight
    let trennLines = self.gTrennLines.selectAll("line").data(trennLinesData)

    trennLines
      .enter()
      .append("line")
      .merge(trennLines)
      .transition()
      .duration(onZoom ? 0 : self.props.transTime)
      .attr("x1", scaleX(self.timeStamps[0]))
      .attr("y1", trennLinienYpos)
      .attr("x2", scaleX(self.timeStamps[1]))
      .attr("y2", trennLinienYpos)
      .attr("opacity", 0.2)
      .attr("stroke-width", 2)
      .attr("stroke", "black")

    trennLines.exit().remove()

    /**
     * Bewegungen/ Aufenthaltslinien
     */
    let lineYpos = (l) => {
      let { rowNumber, Ebene } = l
      let h =
        height -
        svgMarginY -
        rowNumber * rowHeight -
        // + rowHeight
        Ebene * lineHeight -
        lineHeight
      return h
    }

    let lines = self.gLines.selectAll("line").data(lineData)

    lines
      .enter()
      .append("line")
      .merge(lines)
      .attr("class", "lineData")
      .attr("cursor", "pointer")
      .on("click", (d) => {
        let newList = []
        if (self.selectedStations.includes(d.StationID)) {
          self.selectedStations.forEach((s) => {
            if (s !== d.StationID) {
              newList.push(s)
            }
          })
        } else {
          newList = [...self.selectedStations]
          newList.push(d.StationID)
        }
        self.selectedStations = newList
        self.setState((prevState) => {
          prevState.selectedStations = newList
          return prevState
        })
        self.resize()
      })
      .on("mouseenter", (d) => {
        self.updateTooltip(d, "link")
        d.is_hovered = true
      })
      .on("mousemove", () => {
        self.containerRefs.tooltip.moveTooltip()
        self.containerRefs.tooltip.showTooltip()
        d.is_hovered = true
      })
      .on("mouseout", () => {
        self.containerRefs.tooltip.hideTooltip()
        d.is_hovered = false
      })
      .transition()
      .duration(onZoom ? 0 : self.props.transTime)
      .attr("x1", (d) => scaleX(d.b))
      .attr("y1", (d) => lineYpos(d))
      .attr("x2", (d) => {
        let b = scaleX(d.b)
        let e = scaleX(d.e)
        if (e - b < lineHeight) e = b + lineHeight
        return e
      })
      .attr("y2", (d) => lineYpos(d))
      .attr("stroke-width", lineHeight)
      .attr("opacity", (d) => (d.is_hovered ? 1 : 0.8))
      .attr("stroke", (d) => {
        if (colorNr === 0) {
          // return "#000000"
          if (self.selectedStations.includes(d.StationID)) {
            return self.color4(d.StationID)
          } else {
            return "#585858"
          }
        } else if (colorNr === 1) {
          return self.color(d.StationID)
        } else if (colorNr === 2) {
          return self.color3(d.CaseID)
        } else if (colorNr === 3) {
          return self.color2(d.BewegungstypID)
        }
      })
    // .attr("opacity", 0.5)

    lines.exit().remove()

    /**
     * Behandlungen/ Kreise
     */
    let circleYpos = (c) => {
      let { rowNumber } = c
      let h =
        height -
        svgMarginY -
        rowNumber * rowHeight -
        // + rowHeight // von unten nach oben
        2 * lineHeight -
        2 * circleRadius -
        lineHeight
      return h
    }
    let circles = self.gCircles
      // .selectAll("ellipse")
      .selectAll("circle")
      .data(circleData)

    circles
      // .enter().append("ellipse")
      .enter()
      .append("circle")
      .merge(circles)
      .attr("class", "circleData")
      .attr("cursor", "pointer")
      .on("click", (d) => {
        let newList = []
        if (self.selectedStations.includes(d.StationID)) {
          self.selectedStations.forEach((s) => {
            if (s !== d.StationID) {
              newList.push(s)
            }
          })
        } else {
          newList = [...self.selectedStations]
          newList.push(d.StationID)
        }

        self.selectedStations = newList
        self.setState((prevState) => {
          prevState.selectedStations = newList
          return prevState
        })
        self.resize()
      })
      .on("mouseenter", (d) => {
        self.updateTooltip(d, "link")
        d.is_hovered = true
      })
      .on("mousemove", () => {
        self.containerRefs.tooltip.moveTooltip()
        self.containerRefs.tooltip.showTooltip()
        d.is_hovered = true
      })
      .on("mouseout", () => {
        self.containerRefs.tooltip.hideTooltip()
        d.is_hovered = false
      })
      .transition()
      .duration(onZoom ? 0 : self.props.transTime)
      .attr("cx", (d) => scaleX(d.b))
      .attr("cy", circleYpos)
      .attr("r", circleRadius)
      // .attr("ry", circleRadius)
      // .attr("rx", circleRadius * 2 / 3)
      .attr("fill", (d) => {
        if (colorNr === 0) {
          // return "#000000"
          if (self.selectedStations.includes(d.StationID)) {
            return self.color4(d.StationID)
          } else {
            return "#585858"
          }
        } else if (colorNr === 1) {
          return self.color(d.StationID)
        } else if (colorNr === 2) {
          return self.color3(d.CaseID)
        } else if (colorNr === 3) {
          return self.color2(d.BewegungstypID)
        }
      })
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("opacity", (d) => (d.is_hovered ? 1 : 0.8))

    circles.exit().remove()

    /**
     * Untersuchungen/ Rectangles
     */
    let inspecYpos = (i) => {
      let { rowNumber } = i
      let h =
        height -
        svgMarginY -
        rowNumber * rowHeight -
        // + rowHeight
        inspecHeight
      return h
    }
    let inspecRec = self.gInspections.selectAll("rect").data(inspectionData)

    inspecRec
      .enter()
      .append("rect")
      .merge(inspecRec)
      .attr("class", (d) => {
        let c = "inspectionData inspectrect"
        // if (d.posBefund) c += "BEFUND"
        // else if (d.posScreening) c += "SCREENING"
        // else if (d.tested) c += "TESTED"
        // else c += "NOTTESTED"

        if (d.posBefund) c += "INFIZIERT"
        else if (d.posScreening) c += "TRAEGER"
        else if (d.tested) c += "TESTED"
        else c += "NOTTESTED"

        if (d.MREKlasseID === null) c += " noMREclass"

        return c
      })
      .attr("fill", (d) => {
        let c = "black"
        if (d.posBefund) c = "rgb(255, 0, 0)"
        else if (d.posScreening) c = "rgb(255, 127, 0)"
        else if (d.tested) c = "rgb(14, 170, 241)"
        else c = "white"

        return c
      })
      .attr("opacity", (d) => {
        let op = !d.posScreening && !d.posBefund ? 0.25 : 0.75
        if (d.MREKlasseID === null) op = 0.2
        return op
      })
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .on("mouseenter", (d) => {
        self.updateTooltip(d, "inspec")
        console.log(d)
      })
      .on("mousemove", () => {
        self.containerRefs.tooltip.moveTooltip()
        self.containerRefs.tooltip.showTooltip()
      })
      .on("mouseout", () => {
        self.containerRefs.tooltip.hideTooltip()
      })
      .transition()
      .duration(onZoom ? 0 : self.props.transTime)
      .attr("x", (d) => scaleX(d.timestamp))
      .attr("y", inspecYpos)
      // .attr("y", d => {
      //   return d.MREKlasseID === null
      //     ? inspecYpos(d)
      //     : inspecYpos(d) + inspecHeight / 2
      // })
      .attr("width", (d) => {
        let r = scaleX(d.tsEnde) - scaleX(d.timestamp)
        return r < lineHeight ? lineHeight : r
      })
      // .attr("height", inspecHeight)
      .attr("height", (d) => {
        let height =
          d.MREKlasseID === undefined || d.MREKlasseID === null
            ? inspecHeight
            : // : inspecHeight / 2 + (inspecHeight / 10) * d.MREKlasseID
            (inspecHeight / 5) * d.MREKlasseID
        return height
      })

    inspecRec.exit().remove()

    /**
     * Status des Patienten/ Rectangles-Background
     */
    let statusYpos = (s) => {
      let { rowNumber } = s
      let h = height - svgMarginY - rowHeight - rowNumber * rowHeight
      return h
    }
    let statusRec = self.gStatusBars.selectAll("rect").data(infectionStatus)

    statusRec
      .enter()
      .append("rect")
      .merge(statusRec)
      .attr("class", (d) => {
        let c = "infectionStatus status" + d.status
        // if (d.status === "k") c += "statusK"
        // else if (d.status === "g") c += "statusG"
        // else if (d.status === "u") c += "statusU"
        // else if (d.status === "wk") c += "statusWK"
        // else {
        //   c += "statusNOTEST"
        // }
        return c
      })
      .transition()
      .duration(onZoom ? 0 : self.props.transTime)
      .attr("x", (d) => scaleX(d.Beginn))
      .attr("y", statusYpos)
      .attr("width", (d) => {
        let r = scaleX(d.Ende) - scaleX(d.Beginn)
        // return r < lineHeight ? lineHeight : r
        return r
      })
      .attr("height", rowHeight)
      .attr("opacity", 0.4)
      .attr("fill", (d) => {
        let c = "black"

        switch (d.status) {
        case "_wird_krank":
          c = "rgb(100, 100, 100)"
          break
        case "_unbekannt":
          c = "rgb(55, 126, 184)"
          break
        case "_traeger":
          c = "rgb(255, 127, 0)"
          break
        case "_krank":
          c = "rgb(215, 25, 28)"
          break
        }

        return c
      })

    statusRec.exit().remove()

    /**
     * Axen
     */
    d3.timeFormatDefaultLocale(this.locale)
    let parseTime = d3.timeParse("%Q")
    let xAxisScale = d3
      .scaleTime()
      .domain(
        d3.extent(self.timeStamps, function (d) {
          return parseTime(d)
        })
      )
      .range([svgMarginLeft, width - svgMarginRight])
    let xAxis = d3
      .axisBottom(xAxisScale)
      .ticks(self.zoom * 5)
      .tickSizeInner([-(newHeight - self.svgMarginY)])
    self.gGridlines
      .attr(
        "transform",
        "translate(" +
          self.lastTransformedX +
          "," +
          (newHeight - self.svgMarginY / 2) +
          ")"
      )
      .transition()
      .duration(onZoom ? 0 : self.props.transTime)
      .call(xAxis)

    self.gGraphics
      .selectAll(".mouseLine")
      .attr("y1", newHeight - self.svgMarginY / 2)
      .attr("y2", self.svgMarginY / 2)
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("transform", "translate(0,0)")

    // self.gGraphics
    self.gMouseLabel
      .selectAll(".mouseLabel")
      .attr("x", 0)
      .attr("y", self.svgMarginY / 2)
      .attr("text-anchor", "middle")
      .text("")
      .attr("transform", "translate(0,0)")

    self.gGraphics
      .selectAll(".patientLabel")
      // .attr("x", 0)
      // .attr("y", 0)
      .attr("text-anchor", "middle")
      .text("")
      .attr("transform", "translate(0,0)")

    self.gGridlines
      .selectAll(".tick")
      .selectAll("line")
      .attr("opacity", 0.5)
      .attr("stroke-dasharray", "4, 6")
      .attr("stroke--width", 1)
  }

  switch_contact_depth = (e) => {
    console.log("contact depth switched", e)
    // return
    let self = this
    let nr = e.target.value
    this.setState((prevState) => {
      prevState.contact_depth = nr
      return prevState
    })
  }

  /**
   * Setzt bei allen Patienten:
   *      - ErsterPositiverBefund
   *      - ErstesPositivesScreening
   *      - LetztesNegativesScreening
   * abhaengig vom ausgewählten Keim
   */
  calculateKeimInfections = (keimID) => {
    let self = this
    if (self.data === undefined) {
      console.error("Self.data ist undefined.")
      return
    }
    let data = self.data
    data.forEach((p) => {
      // In Untersuchungen auch speichern
      p.Untersuchungen.forEach((inspec) => {
        let befund = inspec.befundKeime.includes(keimID)
        let screening = inspec.screeningKeime.includes(keimID)

        // let pos = inspec.positiveKeime.includes(keimID)

        inspec.posBefund = befund
        inspec.posScreening = screening

        let tested = inspec.KeimIDs.includes(keimID)
        if (tested) {
          inspec.tested = true
        } else {
          inspec.tested = false
        }
      })

      let keimUntersuchtIndex = p.untersuchteKeime.findIndex(
        (k) => k.KeimID === keimID
      )
      if (keimUntersuchtIndex > -1) {
        // Patient wurde auf Keim Untersucht

        let posBefundInspections = p.Untersuchungen.filter((u) =>
          u.befundKeime.includes(keimID)
        )
        let posScreeningNegBefundInspections = p.Untersuchungen.filter((u) =>
          u.screeningKeime.includes(keimID)
        )
        let allNegInspections = p.Untersuchungen.filter(
          (u) =>
            !u.befundKeime.includes(keimID) &&
            !u.screeningKeime.includes(keimID)
        )

        let ersterBefundTS =
          posBefundInspections.length > 0
            ? posBefundInspections[0].timestamp
            : undefined

        if (ersterBefundTS) {
          // posScreeningNegBefundInspections = posScreeningNegBefundInspections.filter(
          //   (u) => u.timestamp < ersterBefundTS.timestamp
          // )
        }

        let erstePosScreeningTS =
          posScreeningNegBefundInspections.length > 0
            ? posScreeningNegBefundInspections[0].timestamp
            : undefined

        if (ersterBefundTS) {
          allNegInspections = allNegInspections.filter(
            (u) => u.timestamp < ersterBefundTS.timestamp
          )
        }

        if (erstePosScreeningTS) {
          allNegInspections = allNegInspections.filter(
            (u) => u.timestamp < erstePosScreeningTS.timestamp
          )
        }

        let letzteNegScreeningTS =
          allNegInspections.length > 0
            ? allNegInspections[0].timestamp
            : undefined

        p.ErsterBefundKeim = ersterBefundTS
        p.ErstesScreeningKeim = erstePosScreeningTS
        p.GesundBis = letzteNegScreeningTS

        console.log(p)

        // // Positiv oder negativ?
        // let keimInfiziertInfex = p.infizierteKeime.findIndex(
        //   k => k.KeimID === keimID
        // )

        // let keimBefundIndex = p.befundKeime.findIndex(k => k.KeimID === keimID)
        // let keimScreeningIndex = p.screeningKeime.findIndex(
        //   k => k.KeimID === keimID
        // )

        // let untersuchungenTimestamps =
        //   p.untersuchteKeime[keimUntersuchtIndex].timestamps

        // if (keimBefundIndex > -1) {
        //   // Patient hat Pos Befund
        //   let ersterBefundTimestamp =
        //     p.befundKeime[keimBefundIndex].ErsterBefundKeim
        //   let preBefundUntersuchungen = untersuchungenTimestamps.filter(
        //     u => u < ersterBefundTimestamp
        //   )
        // }

        // if (keimInfiziertInfex > -1) {
        //   // Wurde Untersucht UND Positiv
        //   let erstinfektionTimestamp =
        //     p.infizierteKeime[keimInfiziertInfex].Erstinfektion
        //   let posUntersuchungen = untersuchungenTimestamps.filter(
        //     u => u < erstinfektionTimestamp
        //   )
        //   let gesundBis = Math.max(...posUntersuchungen)
        //   if (gesundBis < 0) {
        //     gesundBis = undefined
        //   }

        //   p.ErsterkrankungAnKeim = erstinfektionTimestamp
        //   p.GesundBis = gesundBis
        // } else {
        //   // Wurde Untersucht aber nur NEGATIV
        //   let gesundBis = Math.max(...untersuchungenTimestamps)
        //   if (gesundBis < 0) {
        //     gesundBis = undefined
        //     console.error(`Sollte hier eigentlich nie rein!`)
        //   }

        //   p.ErsterkrankungAnKeim = undefined
        //   p.GesundBis = gesundBis
        // }
      } else {
        // Patient wurde nicht auf Keim Untersucht
        p.ErsterBefundKeim = undefined
        p.ErstesScreeningKeim = undefined
        p.GesundBis = undefined
      }
    })
    // Wenn untersuchung negativ für den keim, dann gesund bis dahin
    // und nächste Untersuchung abchecken

    // Wenn letzte Untersuchung und immernoch NEGATIV, dann
    // erstinfektion undefined --> ab da ist es "Unbekannt"

    // Wenn Untersuchung Positiv, dann Ersterkrankt ab dann
    // Wenn erste Untersuchung Positiv, dann GesundBis = undefined
    // Wenn GesundBis = undefined, dann bis dahin unbekannt
    self.data = data
    // console.log(data)
  }

  /**
   * Ordnet die Patienten der gegebenen Reihenfolge nach
   */
  sortPatients = (sortNr) => {
    let self = this
    if (self.data === undefined) {
      console.error("Self.data ist undefined.")
      return
    }
    if (sortNr === 0) {
      self.data.sort((a, b) => {
        if (a.manuellePosition > b.manuellePosition) {
          return 1
        } else {
          return -1
        }
      })
    } else if (sortNr === 1) {
      self.data.sort((a, b) => {
        let t1 = a.ErsterBefundKeim
        let t2 = b.ErsterBefundKeim
        if (t1 === t2) {
          // wenn beide nicht erkranken oder am selben Tag erkranken,
          // dann alternative Sortierung

          let k1 = a.ErstesScreeningKeim
          let k2 = b.ErstesScreeningKeim
          if (k1 === k2) {
            let g1 = a.GesundBis
            let g2 = b.GesundBis
            if (g1 === g2) {
              // beide Sortierungen gleich
              return 0
            }
            // "else"
            if (g1 === undefined) {
              g1 = Infinity
            }
            if (g2 === undefined) {
              g2 = Infinity
            }
            let r = g1 >= g2
            return r ? 1 : -1
          }
          // "else"
          if (k1 === undefined) {
            k1 = Infinity
          }
          if (k2 === undefined) {
            k2 = Infinity
          }
          let r = k1 >= k2
          return r ? 1 : -1
        }
        // "else"
        if (t1 === undefined) {
          t1 = Infinity
        }
        if (t2 === undefined) {
          t2 = Infinity
        }
        let r = t1 >= t2
        return r ? 1 : -1
      })
    } else {
      console.log(`Sortiernummer ${sortNr} ist nicht implementiert!`)
    }
  }

  switchMinimaleAnzeige = (e) => {
    let self = this
    let nr = parseInt(e.target.value)
    this.setState((prevState) => {
      prevState.getMinimaleAnzeige = nr
      return prevState
    })
    self.needScrollInit = true
    self.resize(undefined, undefined, undefined, undefined, nr)
  }

  switchSorting = (e) => {
    let self = this
    let nr = parseInt(e.target.value)
    this.setState((prevState) => {
      prevState.getSorting = nr
      return prevState
    })
    self.sortPatients(nr)
    self.resize()
  }

  switchColor = (e) => {
    let self = this
    let nr = parseInt(e.target.value)
    this.setState((prevState) => {
      prevState.getColor = nr
      return prevState
    })
    self.resize(false, nr)
  }

  switchKeimID = (e) => {
    let self = this
    let nr = parseInt(e.target.value)
    self.setState((prevState) => {
      prevState.getKeimID = nr
      return prevState
    })
    self.calculateKeimInfections(nr)
    self.sortPatients(self.state.getSorting)
    self.resize()
  }

  switchBehandlungConfigs = (e) => {
    let self = this
    let nr = parseInt(e.target.value)
    self.setState((prevState) => {
      prevState.getBehandlungConfig = nr
      return prevState
    })
    self.resize(false, self.state.getColor, nr)
  }

  switchUntersuchungConfigs = (e) => {
    let self = this
    let nr = parseInt(e.target.value)
    self.setState((prevState) => {
      prevState.getUntersuchungConfig = nr
      return prevState
    })
    self.resize(true, self.state.getColor, self.state.getBehandlungConfig, nr)
  }

  render() {
    let self = this
    const funcOptions = []
    // this.props.getDataFuncNames.forEach((element, i) => {
    //   funcOptions.push(
    //     <option key={element.func} value={i}>
    //       {i + " " + element.name}
    //     </option>
    //   )
    // })
    let t = [
      {
        func: "hi",
        name: "lol",
      },
    ]
    t.forEach((element, i) => {
      funcOptions.push(
        <option key={element.func} value={i}>
          {i + " " + element.name}
        </option>
      )
    })
    const minimaleAnzeigeOptions = [
      <option key={"ma0"} value={0}>
        {self.props.translate("normalView", self.state.lang)}
      </option>,
      <option key={"ma1"} value={1}>
        {self.props.translate("minimalView", self.state.lang)}
      </option>,
    ]
    const sortingOptions = [
      <option key={"cat0"} value={0}>
        {self.props.translate("sortManually", self.state.lang)}
      </option>,
      <option key={"cat1"} value={1}>
        {self.props.translate("sortInital", self.state.lang)}
      </option>,
      // <option key={"cat2"} value={2}>{"Stacked/ Treppe"}</option>,
      // <option key={"cat3"} value={3}>{"auf dem Boden"}</option>
    ]
    const colorOptions = [
      <option key={"col0"} value={0}>
        {self.props.translate("colorSelect", self.state.lang)}
      </option>,
      <option key={"col1"} value={1}>
        {self.props.translate("colorWard", self.state.lang)}
      </option>,
      <option key={"col3"} value={3}>
        {self.props.translate("colorMovement", self.state.lang)}
      </option>,
      // <option key={"col2"} value={2}>{"CaseType Farben"}</option>
    ]
    const behandlungConfigOptions = [
      <option key={"col0"} value={0}>
        {self.props.translate("treatmentOn", self.state.lang)}
      </option>,
      <option key={"col1"} value={1}>
        {self.props.translate("treatmentOff", self.state.lang)}
      </option>,
    ]
    const untersuchungConfigOptions = [
      <option key={"col0"} value={0}>
        {self.props.translate("examAll", self.state.lang)}
      </option>,
      <option key={"col1"} value={1}>
        {self.props.translate("examRel", self.state.lang)}
      </option>,
      <option key={"col2"} value={2}>
        {self.props.translate("examOff", self.state.lang)}
      </option>,
    ]
    const keimOptions = [
      <option key={"-"} value={0}>
        {"- - - - -"}
      </option>,
    ]
    let kIDs = JSON.parse(JSON.stringify(self.state.keimIDs))
    kIDs.sort((a, b) => {
      if (a.KeimID > b.KeimID) {
        return 1
      } else if (a.KeimID < b.KeimID) {
        return -1
      } else {
        return 0
      }
    })
    kIDs.forEach((k) => {
      keimOptions.push(
        <option
          key={k.Keim_k}
          value={k.KeimID}
        >{`${k.Keim_k} (id: ${k.KeimID})`}</option>
      )
    })

    const header = []
    const farben = []
    let sorted_stations = this.state.selectedStations
    sorted_stations.sort((a, b) => a - b)
    if (self.state.getColor === 0) {
      // this.state.selectedStations.forEach((d) => {
      sorted_stations.forEach((d) => {
        header.push(<th>{"S" + d}</th>)
        let col = {
          backgroundColor: self.color4(d),
        }
        farben.push(
          <td>
            <div style={col} />
          </td>
        )
      })
      // this.state.stationen.forEach(d => {
      //   header.push(<th>{"Station " + d}</th>)
      //   let col = {
      //     backgroundColor: self.color(d)
      //   }
      //   farben.push(
      //     <td>
      //       <div style={col} />
      //     </td>
      //   )
      // })
    } else if (self.state.getColor === 1) {
      this.state.stationen.forEach((d) => {
        header.push(<th>{"S" + d}</th>)
        let col = {
          backgroundColor: self.color(d),
        }
        farben.push(
          <td>
            <div style={col} />
          </td>
        )
      })
    } else if (self.state.getColor === 2) {
      this.state.casetypes.forEach((d) => {
        header.push(<th>{d.typ}</th>)
        let col = {
          backgroundColor: self.color3(d.id),
        }
        farben.push(
          <td>
            <div style={col} />
          </td>
        )
      })
    } else if (self.state.getColor === 3) {
      this.state.bewegungstypen.forEach((d) => {
        header.push(<th>{d.typ}</th>)
        let col = {
          backgroundColor: self.color2(d.id),
        }
        farben.push(
          <td>
            <div style={col} />
          </td>
        )
      })
    }
    let tabelle = (
      <table>
        <tr>{header}</tr>
        <tr>{farben}</tr>
      </table>
    )
    // if (self.state.getMinimaleAnzeige === 1) {
    //   tabelle = null
    // }
    const contact_depth_options = [
      <option key={"depth0"} value={0}>
        {self.props.translate("nodepth", self.state.lang)}
      </option>,
      <option key={"depth1"} value={1}>
        {self.props.translate("depthone", self.state.lang)}
      </option>,
      <option key={"depth2"} value={2}>
        {self.props.translate("depthn", self.state.lang)}
      </option>,
    ]

    return (
      <ModuleContainer
        // scrollable={true}
        getData={this.getData}
        {...this.state}
        ref={(element) => (this.containerRefs = element)}
        scrollableSVG={
          this.state.patientsLength > this.state.maxPatientRows ? true : false
        }
      >
        <table>
          <tr>
            <select
              onChange={this.switch_contact_depth}
              value={this.state.contact_depth}
            >
              {contact_depth_options}
            </select>
          </tr>
          <tr>
            <select
              onChange={this.switchMinimaleAnzeige}
              value={this.state.getMinimaleAnzeige}
            >
              {minimaleAnzeigeOptions}
            </select>
          </tr>
          <tr>
            <select onChange={this.switchSorting} value={this.state.getSorting}>
              {sortingOptions}
            </select>
          </tr>
          <tr>
            <select onChange={this.switchKeimID} value={this.state.getKeimID}>
              {keimOptions}
            </select>
          </tr>
        </table>
        <table>
          <tr>
            <select
              disabled={this.state.getMinimaleAnzeige === 1}
              onChange={this.switchColor}
              value={this.state.getColor}
            >
              {colorOptions}
            </select>
          </tr>
          <tr>
            <select
              disabled={this.state.getMinimaleAnzeige === 1}
              onChange={this.switchBehandlungConfigs}
              value={this.state.getBehandlungConfig}
            >
              {behandlungConfigOptions}
            </select>
          </tr>
          <tr>
            <select
              disabled={this.state.getMinimaleAnzeige === 1}
              onChange={this.switchUntersuchungConfigs}
              value={this.state.getUntersuchungConfig}
            >
              {untersuchungConfigOptions}
            </select>
          </tr>
        </table>
        <div legende={true} className="storylineLegende">
          <table>
            <tr>
              {/* <th>Unbekannt</th>
              <th>wird Krank/Träger</th>
              <th>Träger</th>
              <th>Krank</th> */}
              <th>{self.props.translate("UnknownContact", self.state.lang)}</th>
              <th>{self.props.translate("willBeInfected", self.state.lang)}</th>
              <th>
                {self.props.translate("infectedCarrier", self.state.lang)}
              </th>
              <th>
                {self.props.translate("infectedDiseased", self.state.lang)}
              </th>

              {/* <th>sicherer Kontakt</th>
                <th>keine Abschätzung</th>
                <th>evtl. Ansteckung</th> */}
            </tr>
            <tr>
              <td>
                <div className="legendenFarbe legendeUNBEKANNT" />
              </td>
              <td>
                <div className="legendenFarbe legendeGESUND" />
              </td>
              <td>
                <div className="legendenFarbe legendeANSTECKUNG" />
              </td>
              <td>
                <div className="legendenFarbe legendeINFIZIERT" />
              </td>

              {/* <td>
                  <div className="slPotential1" />
                </td>
                <td>
                  <div className="slPotential2" />
                </td>
                <td>
                  <div className="slPotential3" />
                </td> */}
            </tr>
          </table>
        </div>

        <div legende={true} className="timelineLegende">
          {tabelle}
        </div>
      </ModuleContainer>
    )
  }
}

export default LineList
