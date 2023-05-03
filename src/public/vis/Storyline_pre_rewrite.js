import { Component } from "react"
import * as d3 from "./d3v4.js"
import moment from "moment"
import "./storyline.css"
import { sankey, sankeyLinkHorizontal } from "./d3-sankey.js"
import parseSLdata from "./storylineParser.js"

class Storyline extends Component {
  constructor(props) {
    super(props)

    this.module_id = props.create_new_id()
    this.module_type = "storyline"

    this.min_width = 150
    this.min_height = 150

    this.data
    this.width
    this.height

    this.state = {
      too_small: false,
      stations: [],
      optionsOpen: true,
      locations: [],
      selected_location_index: undefined,
      // states für Storyline UI
      getClickMode: 1,
      getAnzeigeArt: 0,
      getVerbreitungsrichtung: 0,
      getBewegungslinien: 0,
      getCircles: 1,
      selectedPatients: [],
      selectedStations: [],
      criticalPatient: [],
      // maximize: true,
      // contact_depth: 0
      criticalPatientString: "",
      criticalPatient: "",
    }

    this.socket = props.socket.client
    this.translate = props.translate
    this.get_color = props.get_color

    this.default_movement_color = "white"

    // this.margin = {
    //   top: 25,
    //   bottom: 25,
    //   left: 25,
    //   right: 25,
    // }
    /**
     * Konstanten, die für die Visualisierung benutzt werden.
     */
    this.margin = {
      top: 50,
      right: 50,
      bottom: 50,
      left: 50,
      text: 20,
    }

    this.sim_counter = 0

    this.title = this.translate("Storyline")

    this.transition_duration = 200

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

    /**
     * Größe der gesamten Storyline bei der Berechnung.
     * Die Ergebniss-Positionen werden anschließend auf die
     * tatsächliche Dimensionen der SVGs gemappt.
     */
    this.calculateHeight = 1000
    this.calculcateWidth = 1

    /**
     * Weitere Konstanten
     */
    this.svgMarginX = 0
    this.svgMarginY = 50
    this.pathWidth = 8

    /**
     * Variablen
     */
    this.zoom = 1
    this.lastZoomK = 1
    this.lastZoomX = 0
    this.lastTransformedX = 0

    /**
     * Daten
     */
    this.data
    this.clusterCounter = 0
    this.patients = []
    this.timeStamps = []

    this.graphen = {}

    this.patientInfected = {}

    this.selectedPatients = []

    this.selectedStations = []

    this.allPatients = []
    this.allStations = []

    this.criticalPatient = undefined
    this.parameters = {}
  }

  criticalPatientChanged = (e) => {
    let self = this
    const val = e.target.value
    let newlop = val.split(",")
    newlop.forEach((p, i) => {
      newlop[i] = p
    })
    // newlop = newlop.filter((v) => !isNaN(v) && v > 0)
    // let uniqueNumbersOnlyLOP = [...new Set(newlop)]
    let newPat = newlop[0]
    self.setState((prevState) => {
      prevState.criticalPatientString = newPat === undefined ? "" : newPat
      prevState.criticalPatient = newPat
      return prevState
    })
    self.criticalPatient = newPat
    self.redrawLines()
  }

  /**
   * Callback zum resizen der Visualisierung,
   * falls sich die Fenstergröße geändert hat.
   */
  resize = (options) => {
    let self = this

    let keimID = self.parameters.pathogen

    if (keimID === undefined || self.graphen["K" + keimID] === undefined) {
      return
    }

    moment.locale("de")
    // moment.locale("en")

    // if (keimID > 0) {
    if (keimID) {
      let nodes = self.graphen["K" + keimID].nodes
      self.timeStamps = [nodes[0].timestamp, nodes[nodes.length - 1].timestamp]
    } else {
      self.timeStamps = [new Date().getTime()]
    }

    let newWidth = parseInt(d3.select(self.svgRoot).style("width"))
    let newHeight = parseInt(d3.select(self.svgRoot).style("height"))
    let zoomedWidth = newWidth * self.zoom

    let yMin = (self.yMin = 50)
    let yMax = (self.yMax = newHeight - 20 - self.tmphomeMargin)
    yMax -= 25 // um die X-Achse frei zu halten
    let pathSpace = self.pathWidth

    let scaleTimestampToX = (self.scaleTimestampToX = d3
      .scaleLinear()
      .domain([0, self.calcWidth])
      // .range([0, newWidth])
      .range([self.margin.left, zoomedWidth - self.margin.right]))

    let reverseScaleTimestampToX = d3
      .scaleLinear()
      .range([0, self.calcWidth])
      // .domain([0, newWidth])
      .domain([self.margin.left, zoomedWidth - self.margin.right])

    let scaleCalcHeightToY = (self.scaleCalcHeightToY = d3
      .scaleLinear()
      .range([yMin, yMax])
      .domain([0, self.calcHeight]))

    let reverseScaleCalcHeightToY = (self.reverseScaleCalcHeightToY = d3
      .scaleLinear()
      .domain([yMin, yMax])
      .range([0, self.calcHeight]))

    self.reverseFactor = self.calcHeight / (yMax - yMin)

    // let allTimestamps =
    //   self.lastParsedData.graphsCategorized["K" + keimID].allTimestamps
    let allTimestamps = self.allTimestamps

    scaleTimestampToX.domain([
      allTimestamps[0],
      allTimestamps[allTimestamps.length - 1],
    ])
    reverseScaleTimestampToX.range([
      allTimestamps[0],
      allTimestamps[allTimestamps.length - 1],
    ])

    self.interpolation = d3
      .line()
      // .x(d => scaleCalcxToX(d.node.x))
      .x((d) => {
        // console.log(d)
        return scaleTimestampToX(d.timestamp)
      })
      .y((d) => {
        // let yPos = d.node.y - ((d.patientCount - 1) / 2) * pathSpace
        let yPos =
          scaleCalcHeightToY(d.node.y) - ((d.patientCount - 1) / 2) * pathSpace
        yPos += d.position * pathSpace
        if (d.node.space === "home") {
          yPos = scaleCalcHeightToY(d.node.y) - 50
        } else if (d.node.space === "tmphome") {
          // yPos += 20 + self.tmphomeMargin / 2
          yPos = scaleCalcHeightToY(d.node.y) + 20 + d.position * pathSpace
        }
        return yPos
      })
      // .curve(d3.curveLinear)
      .curve(d3.curveBasis)
    // .curve(d3.curveBundle)
    // .curve(d3.curveCardinal)
    // .curve(d3.curveNatural)

    self.stationInterpolation = d3
      .line()
      .x((d) => {
        return scaleTimestampToX(d.timestamp)
      })
      .y((d) => {
        let yPos = scaleCalcHeightToY(d.y)
        return yPos
      })
      .curve(d3.curveBasis)

    self.flashLineInterpolation = d3
      .line()
      .x((d) => {
        // console.log(d)
        return scaleTimestampToX(d.timestamp)
      })
      .y((d) => {
        // let yPos = d.y
        // return yPos
        let offsetY = 0
        if (d.y.lop !== undefined) {
          offsetY = (d.y.lop.length * self.pathWidth) / 2 + 4
        }

        if (d.eigenesEvent === true) {
          offsetY = offsetY * 2
        }

        let yPos = scaleCalcHeightToY(d.y.y)
        return yPos - offsetY
      })
      // .curve(d3.curveLinear)
      .curve(d3.curveBasis)

    self.redrawLines()

    /**
     * bis hierher neu
     */

    let scaleX = d3.scaleLinear()
    let scaleY = d3.scaleLinear()
    self.scaleReverseX = d3
      .scaleLinear()
      // .range(d3.extent(self.timeStamps, d => d))
      .range(d3.extent(allTimestamps, (d) => d))
      .domain([self.margin.left, zoomedWidth - self.margin.right])

    scaleX
      // .domain(d3.extent(self.timeStamps, d => d))
      .domain(d3.extent(allTimestamps, (d) => d))
      .range([self.margin.left, zoomedWidth - self.margin.right])

    scaleY
      .domain(
        d3.extent(
          [self.margin.top, self.newHeight - self.margin.bottom],
          function (d) {
            return d
          }
        )
      )
      .range([self.margin.top, newHeight - self.margin.bottom])

    d3.timeFormatDefaultLocale(this.locale)
    let parseTime = d3.timeParse("%Q")
    let xAxisScale = d3
      .scaleTime()
      // .domain(d3.extent(self.timeStamps, function (d) { return new Date(d); }))
      .domain(
        d3.extent(self.timeStamps, function (d) {
          return parseTime(d)
        })
      )
      .range([self.margin.left, zoomedWidth - self.margin.right])
    let xAxis = d3
      .axisBottom(xAxisScale)
      .ticks(self.zoom * 5)
      .tickSizeInner([-(newHeight - self.svgMarginY)])
    self.gGridlines
      .attr(
        "transform",
        "translate(0," + (newHeight - self.svgMarginY / 2) + ")"
      )
      .call(xAxis)

    // self.gGraphics
    self.gMouseOverlay
      .selectAll(".mouseLine")
      .attr("y1", newHeight - self.svgMarginY / 2)
      .attr("y2", self.svgMarginY / 2)
      // .attr("y1", newHeight)
      // .attr("y2", 0)
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("transform", "translate(0,0)")

    // self.gGraphics
    self.gMouseOverlay
      .selectAll(".mouseLabel")
      .attr("x", 0)
      .attr("y", self.svgMarginY / 2)
      .attr("text-anchor", "middle")
      .text("")
      .attr("transform", "translate(0,0)")

    let homeRect = self.ghome.selectAll("rect").data([1])

    homeRect
      .enter()
      .append("rect")
      .attr("class", "home-rect")
      .merge(homeRect)
      .attr("x", self.margin.left)
      .attr("y", -10)
      .attr("width", -self.margin.left + zoomedWidth - self.margin.right)
      .attr("height", yMin - 10)
      .attr("fill", "rgb(200, 200, 200)")

    homeRect.exit().remove()

    let tmphomeRect = self.gtmphome.selectAll("rect").data([1])

    tmphomeRect
      .enter()
      .append("rect")
      .attr("class", "tmphome-rect")
      .merge(tmphomeRect)
      .attr("x", self.margin.left)
      .attr("y", yMax + 10)
      .attr("width", -self.margin.left + zoomedWidth - self.margin.right)
      .attr("height", self.tmphomeMargin + 10)
      .attr("fill", "rgb(200, 200, 200)")
      .attr("opacity", 0.5)

    tmphomeRect.exit().remove()

    /**
     * neie Storyline (force directed etc)
     */

    /**
     * AB HIER WIRD DIE STORYLINE GEZEICHNET (ALT)
     */
    // if (self.storylineData === undefined) return

    self.gGridlines
      .selectAll(".tick")
      .selectAll("line")
      .attr("opacity", 0.5)
      .attr("stroke-dasharray", "4, 6")
      .attr("stroke--width", 1)
  }

  componentDidMount() {
    let self = this

    console.log("Storyline module did mount")

    this.socket.on("new_vis_data", (payload) => {
      if (payload.data_name === "storyline") {
        this.handle_data(payload)
      }
    })

    this.props.register_module(this.module_id, this.module_type, {
      draw_vis: this.resize,
      filter_data: this.filter_data,
    })

    /**
     * Modul auf Größenänderung alle 100ms überprüfen.
     * Falls eine Größenänderung vorliegt, die Visualisierung resizen.
     */
    this.checkSize = setInterval(() => {
      let newWidth = parseInt(d3.select(self.module_container).style("width"))
      let newHeight = parseInt(d3.select(self.module_container).style("height"))
      if (newWidth !== self.width || newHeight !== self.height) {
        self.width = newWidth
        self.height = newHeight

        self.setState((prevState) => {
          if (newWidth < this.min_width || newHeight < this.min_height) {
            prevState.too_small = true
          } else {
            prevState.too_small = false
          }
          return prevState
        })

        // console.log(`newWidth: ${newWidth}, newHeight: ${newHeight}`)
        // if (self.data) {
        self.resize()
        // }
      }
    }, 100)

    /**
     * Callback, der beim Bewegen des Cursors die Linie am Cursor
     * auf die neue Cursorposition zeichnet.
     */
    let mouseLine = () => {
      let containerWidth = parseInt(d3.select(self.svgRoot).style("width"))
      let offsetX = d3.event.offsetX - self.lastTransformedX
      // self.gGraphics
      self.gMouseOverlay
        .selectAll(".mouseLine")
        .attr("transform", "translate(" + offsetX + ",0)")

      moment.locale("de")
      let newText = offsetX
      if (self.scaleReverseX) {
        newText =
          moment(self.scaleReverseX(offsetX)).format("dd DD.MM.YYYY HH:mm:ss") +
          " Uhr"
      }

      let anchor = "middle"
      if (offsetX > containerWidth / 2) {
        anchor = "end"
      } else if (offsetX < containerWidth / 2) {
        anchor = "start"
      }

      // self.gGraphics
      self.gMouseOverlay
        .selectAll(".mouseLabel")
        .text(newText)
        .attr("transform", "translate(" + offsetX + ",0)")
        .attr("text-anchor", anchor)
    }

    /**
     * Callback, der beim Zoomen im Modul (Scrollen) aufgerufen wird.
     */
    let zoom = d3.zoom().on("zoom", () => {
      let containerWidth = parseInt(d3.select(self.svgRoot).style("width"))
      // let mitteModul = containerWidth / 2
      // statt Mitte Modul die Mausposition:
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
        self.lastZoomK = newK
        self.lastZoomX = JSON.parse(JSON.stringify([d3.event.transform.x]))[0]
        // self.setState((prevState) => {
        //   prevState.filterValues[0].value = Math.round(self.zoom * 100) + "%"
        //   return prevState
        // })
        let calculatedX =
          prozentVerschiebung * self.zoom * containerWidth + mitteModul

        if (self.zoom === 1) {
          calculatedX = 0
        }
        self.resize()

        let deltaSVGx = containerWidth * self.zoom - containerWidth
        if (deltaSVGx + calculatedX < 0) {
          calculatedX = -deltaSVGx
        } else if (calculatedX > 0) {
          calculatedX = 0
        }
        self.lastTransformedX = calculatedX
        self.gGraphics.attr(
          "transform",
          "translate(" + calculatedX + " " + 0 + ")"
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
        self.gGraphics.attr(
          "transform",
          "translate(" + calculatedX + " " + 0 + ")"
        )
        self.lastZoomX = self.lastZoomX + deltaX
      }
    })
    /**
     * G-Container initialisieren
     * gGraphics
     *
     *  - linie (MouseLine)
     *  - Text (MouseLabel)
     *
     *  - gLinks
     *  - gCircles
     *  - gText
     *  - gGridlines
     */
    self.gGraphics = d3
      .select(self.svgRoot)
      .call(zoom)
      .on("mousemove", mouseLine)
      .append("g")
      .attr("class", "gContainer storylineContainer")

    // self.gGraphics.append("line").attr("class", "mouseLine")

    // self.gGraphics.append("text").attr("class", "mouseLabel")

    let svg = self.gGraphics

    // this.gLinks = svg
    //   .append("g")
    //   .attr("class", "gLinks")
    //   .attr("fill", "none")
    this.gText = svg
      .append("g")
      .attr("class", "gText")
      .style("font", "10px sans-serif")
    this.gGridlines = svg.append("g").attr("class", "gGridlines")

    this.gStationPaths = svg.append("g").attr("class", "gStationPaths")
    this.gPaths = svg.append("g").attr("class", "gPaths")
    this.gLinks = svg.append("g").attr("class", "gLinks").attr("fill", "none")
    this.gCircles = svg.append("g").attr("class", "gCircles")

    this.ghome = svg.append("g").attr("class", "ghome")
    this.gtmphome = svg.append("g").attr("class", "gtmphome")

    this.gFlashCircles = svg.append("g").attr("class", "gFlashCircles")
    this.gFlashLines = svg.append("g").attr("class", "gFlashLines")

    this.gMouseOverlay = svg.append("g").attr("class", "gMouseOverlay")

    self.gMouseOverlay
      .append("line")
      .attr("class", "mouseLine")
      .attr("opacity", 0.5)
      .attr("stroke-width", 1)
      .attr("stroke", "black")
      .attr("pointer-events", "none")

    self.gMouseOverlay.append("text").attr("class", "mouseLabel")

    // this.draw_vis()
  }

  filter_data = () => {
    // TODO
    let pfv = this.props.get_possible_filter_values()

    let { station, min_ts, max_ts, patients, location } =
      this.props.get_filter_values()

    let original_data = this.props.get_original_data(this.mdoule_type)

    /**
     * TODO:
     * - Knoten im Pfade-Objekt filtern
     * - skallierung nach Filter anpassen wie Linelist etc.
     */
  }

  componentWillUnmount() {
    this.socket.off("storyline")

    this.props.unregister_module(this.module_id)

    clearInterval(this.checkSize)
  }

  handle_data = (data) => {
    let self = this
    console.log("Storyline vis data recieved")
    console.log(data)

    if (data === undefined || data.data === undefined) {
      return
    }

    self.originalData = {
      microData: data.data.microData,
      movementData: data.data.movementData,
      lop: data.data.patientList,
    }
    // self.parameters = data.parameters
    self.parameters = self.props.parameters
    // console.log("original data", data[0])

    this.setState((prevState) => {
      prevState.criticalPatient = []
      prevState.criticalPatientString = ""
      prevState.criticalPatient = ""
      prevState.selectedPatients = []
      prevState.selectedStations = []
      prevState.getClickNode = 1
      prevState.getAnzeigeArt = 0
      prevState.getVerbreitungsrichtung = 0
      prevState.getBewegungslinien = 0
      prevState.getCircles = 1
      return prevState
    })

    if (data.data.allStations) {
      self.ward_color = d3
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
        .domain(data.data.allStations)

      let stations = []
      this.selected_stations = []
      data.data.allStations.forEach((s) => {
        stations.push({
          name: s,
          color: self.ward_color(s),
        })
      })
      this.setState((prevState) => {
        prevState.stations = stations
        prevState.selected_stations = []
        return prevState
      })
    }

    self.graphen = {}
    // self.nodesByTimestamp = {}

    this.zoom = 1
    this.lastZoomK = 1
    this.lastZoomX = 0
    this.lastTransformedX = 0
    self.gGraphics.attr("transform", "translate(" + 0 + " " + 0 + ")")

    let keimID = self.parameters.pathogen

    if (keimID !== undefined && self.graphen["K" + keimID] !== undefined) {
      self.gMouseOverlay
        .append("line")
        .attr("class", "mouseLine")
        .attr("opacity", 0.5)
        .attr("stroke-width", 1)
        .attr("stroke", "black")
        .attr("pointer-events", "none")

      self.gMouseOverlay.append("text").attr("class", "mouseLabel")
    }

    this.resize()

    this.switch_keim_parsing()

    // this.draw_vis()
  }

  reset_view = () => {
    this.zoom = 1
    this.lastZoomK = 1
    this.lastZoomX = 0
    this.lastTransformedX = 0

    this.lastZoomY = 0
    this.lastTransformedY = 0

    this.old_scal_fact = 1

    this.gGraphics.attr("transform", "translate(" + 0 + " " + 0 + ")")
  }

  draw_vis = (zooming) => {
    let self = this
    let data = this.data

    // TODO: zooming implementieren
    let zoom = this.zoom

    console.log(`drawing Storyline with zoom ${zoom}`)

    /**
     * Titel + Timestamp
     */

    let trans_duration = this.transition_duration
    if (zooming) {
      trans_duration = 0
    }

    // let title = this.gLegend.selectAll(".title").data([this.title])

    // title
    //   .enter()
    //   .append("text")
    //   .attr("class", "title")
    //   .merge(title)
    //   .transition()
    //   .duration(this.transition_duration)
    //   .text((d) => d)
    //   .attr("font-size", this.margin.top / 2)
    //   .attr("x", this.width / 2)
    //   .attr("y", (this.margin.top * 2) / 3)
    //   .attr("text-anchor", "middle")

    // title.exit().remove()

    if (this.data === undefined || this.data.graph_data === undefined) {
      return
    }

    data = this.data.graph_data[this.selected_location_index]

    /**
     * bis hierher aus Kontaktnetzwerk Modul kopiert
     *
     * ab hier Storyline aus StorylineBA/Port
     */
  }

  switch_keim_parsing = () => {
    let self = this

    let keimID = self.parameters.pathogen
    self.simulation = d3
      .forceSimulation()
      .force(
        "link",
        d3.forceLink().id(function (d) {
          return d.id
        })
      )
      .force(
        "link",
        d3
          .forceLink()
          .id((d) => d.id)
          // .distance(d => {
          //   // return d.movementLink ? 100 : 1
          // })
          .distance(0)
          .strength(0.1)
          .iterations(10)
      )
      .force(
        "collide",
        d3
          // .forceCollide(d => 10)
          .forceCollide()
          .strength(1)
          .radius((d) => {
            return self.pathWidth * d.lop.length + 2 * self.pathWidth
          })
          .iterations(1)
      )
      .force("charge", d3.forceManyBody().strength(-1))
    // .force("center", d3.forceCenter(width / 2, height / 2))
    // .force("center", d3.forceCenter(width / 2, 100))

    console.log("ANFANG erzeugen des Graphen")
    // if (self.graphen["K" + keimID] === undefined) {

    let parsed_paras = {} // TODO

    let parsedData = (self.parsedData = parseSLdata(
      { rawData: self.originalData, parameters: parsed_paras },
      self.parameters.pathogen
    ))
    console.log("ENDE PARSED DATA:", parsedData)

    self.allPatients = parsedData.patients.lop

    // self.setState({
    //   selectedPatients: parsedData.patients.lop,
    //   selectedPatientsString: String(parsedData.patients.lop),
    //   selectedStations: [],
    //   selectedStationsString: ""
    // })
    // self.selectedPatients = parsedData.patients.lop

    self.graphen = {
      ...self.graphen,
      ...parsedData.graphsCategorized,
    }
    // self.nodesByTimestamp = {
    //   ...self.nodesByTimestamp,
    //   ...parsedData.nodesByTimestamp,
    // }
    // self.lastParsedData = parsedData
    console.log("der Graph des Keims")
    console.log(self.graphen["K" + keimID])
    // }

    if (self.graphen["K" + keimID] === undefined) {
      console.error(
        `Kein Storyline Graph fuer Pathogen ${keimID}, da KEINE Untersuchuns-Daten zu den Patienten.`
      )

      self.gText.selectAll("*").remove()
      self.gGridlines.selectAll("*").remove()
      self.gStationPaths.selectAll("*").remove()
      self.gPaths.selectAll("*").remove()
      self.gLinks.selectAll("*").remove()
      self.gCircles.selectAll("*").remove()
      self.ghome.selectAll("*").remove()
      self.gtmphome.selectAll("*").remove()
      self.gFlashCircles.selectAll("*").remove()
      self.gFlashLines.selectAll("*").remove()
      self.gMouseOverlay.selectAll("*").remove()

      return
    }

    let sankeyLeft = function (node) {
      return node.depth
    }

    let layoutFunction = sankeyLeft // sankeyJustify
    // let n = 25 // this.patients.length
    let n = parsedData.patients.lop.length
    let pathWidth = self.pathWidth
    let nodePadding =
      (self.height - self.margin.top - self.margin.bottom - n * pathWidth) /
      (n - 1)

    let linkData = self.graphen["K" + keimID].links
    let nodeData = self.graphen["K" + keimID].nodes

    let timestepsCount = (self.timestepsCount =
      nodeData[nodeData.length - 1].timestep + 1)
    let maxClusterCountPerTimestep =
      self.graphen["K" + keimID].maxClusterCountPerTimestep

    let calcNodePadding = 1000
    let calcWidth = (self.calcWidth = timestepsCount * calcNodePadding)
    // let calcHeight = (self.calcHeight =
    //   (maxClusterCountPerTimestep * calcNodePadding) / 50)
    let calcHeight = (self.calcHeight =
      n * 4 * pathWidth + maxClusterCountPerTimestep * 2 * pathWidth)

    let storyline = function (NL) {
      const san = sankey()
        .nodeWidth(1)
        .nodePadding(nodePadding)
        .extent([
          // [svgMarginX, svgMarginY],
          // [svgMarginX + width, height - svgMarginY]
          [0, 0],
          [calcWidth, calcHeight],
          // [self.margin.left, self.margin.top],
          // [self.width - self.margin.right, self.height - self.margin.bottom]
        ])
        // .size([
        //   5000, // width
        //   2000 // height
        // ])
        .nodeAlign(layoutFunction)
        .iterations(100)
      let ret = san(NL)
      return ret
    }

    // let linkData = self.graphen["K" + keimID].links
    // let nodeData = self.graphen["K" + keimID].nodes
    self.allTimestamps = self.graphen["K" + keimID].allTimestamps
    console.log("ANFANG vor storylinecreation")
    let { nodes, links } = storyline({
      links: linkData,
      nodes: nodeData,
    })

    console.log("ENDE Storyline erzeugt (layout sankey), 100 Iterationen")

    nodes.forEach((n) => {
      n.x_0 = n.x0
      n.x_1 = n.x1
      n.y_0 = n.y0
      n.y_1 = n.y1
    })
    links.forEach((l) => {
      l.y_0 = l.y0
      l.y_1 = l.y1
    })
    // let nodes = nodeData
    // let links = linkData

    console.log("ANFANG Reihenfolgenummern vergeben")
    /**
     * Nach dem Layouting jedem Knoten die "Reihenfolgennummer" geben + Initial-Position
     */
    for (let step = 0; step < timestepsCount; step++) {
      let stepNodes = nodes.filter(
        (n) =>
          n.timestep === step &&
          n.space !== "home" &&
          n.name !== "home" &&
          n.space !== "tmphome" &&
          n.name !== "tmphome"
      )
      stepNodes.sort((a, b) => (a.y0 + a.y1) / 2 - (b.y0 + b.y1) / 2)
      stepNodes.forEach((sn, i) => {
        sn.initOrder = i + 1
        sn.initPos = (self.calcHeight / (stepNodes.length + 1)) * sn.initOrder
      })
    }

    /**
     * Jeden Zeitstempel durchgehen, den obersten Node (kleinest y0)
     * finden und den Betrag von allen in diesem Zeitstempel abziehen
     */

    console.log("ENDE Reihenfolgenummern vergeben")

    self.storylineData = {
      nodes: nodes,
      links: links,
    }
    console.log("Storyline data:")
    console.log(self.storylineData)

    // let timestepsCount = nodes[nodes.length - 1].timestep + 1
    // let maxClusterCountPerTimestep =
    //   self.graphen["K" + keimID].maxClusterCountPerTimestep

    // let calcNodePadding = 1000
    // let calcWidth = (self.calcWidth = timestepsCount * calcNodePadding)
    // let calcHeight = (self.calcHeight =
    //   (maxClusterCountPerTimestep * calcNodePadding) / 25)
    // console.log("calcHeight", calcHeight)

    links = links.filter((d) => !d.movementLink)
    self.storylineData.links = links

    self.stationPathsData = []
    let stationIDs = []

    console.log(
      "ANFANG Erzeugen der Links, dass Stationen möglichst auf einer Ebene bleiben"
    )
    for (
      let scID = 0;
      scID < parsedData.graphsCategorized["K" + keimID].stationClusterIDcounter;
      scID++
    ) {
      let stationPath = {
        stationID: undefined,
        stationClusterID: scID,
        maxPatients: 0,
        path: [],
      }

      nodes.forEach((n) => {
        if (n.stationClusterID === scID) {
          if (stationPath.stationID === undefined) {
            stationPath.stationID = n.stationID
            if (!stationIDs.includes(n.stationID)) {
              stationIDs.push(n.stationID)
            }
          }
          if (stationPath.maxPatients < n.lop.length) {
            stationPath.maxPatients = n.lop.length
          }
          stationPath.path.push(n)
        }
      })

      self.stationPathsData.push(stationPath)
    }
    console.log("links", links)

    self.allStations = parsedData.stationList
    /**
     * Links erzeugen zwischen den Stationen, sodass diese eine gleiche Höhe haben
     */
    stationIDs.forEach((stationID) => {
      let spData = self.stationPathsData.filter(
        (d) => stationID === d.stationID
      )

      for (let i = 0; i < spData.length - 1; i++) {
        let aEnde = spData[i].path[spData[i].path.length - 1]
        let bAnfang = spData[i + 1].path[0]

        links.push({
          source: aEnde,
          target: bAnfang,
          connectionLink: true,
        })
      }
    })

    console.log("ENDE Nach Link-Erzeugung")
    console.log("stationPathsData", self.stationPathsData)

    self.all_stations = []
    self.stationPathsData.forEach((spd) => {
      if (
        spd.stationID !== "home" &&
        spd.stationID !== "tmphome" &&
        !self.all_stations.includes(spd.stationID)
      ) {
        self.all_stations.push(spd.stationID)
      }
    })
    // self.all_stations.sort((a, b) => a - b)

    let tmphomeStationData = self.stationPathsData.find(
      (d) => d.stationID === "tmphome"
    )
    self.tmphomeMargin = tmphomeStationData
      ? tmphomeStationData.maxPatients * pathWidth
      : 0

    let pathsData = []
    let pathsDataNoMovements = []

    console.log("ANFANG pathsData für jeden Patienten erzeugen...")

    parsedData.patients.lop.forEach((id) => {
      let infectionDataArray =
        parsedData.patients["P" + id].keimeInfos["K" + keimID]
      if (infectionDataArray !== undefined) {
        /**
         * Falls Patient keine Daten zu diesem Keim hat, kann
         */
        let statusIndex = 0
        let pathObj = {
          path: [],
          patientID: id,
          status: infectionDataArray.patientStates[statusIndex],
        }
        let pathNoMovementsObj = {
          path: [],
          patientID: id,
          status: infectionDataArray.patientStates[statusIndex],
          movementPath: false,
        }

        // let checkIfIsMovementPath = false
        let lastStationID = undefined
        nodes.forEach((n) => {
          if (n.lop.includes(id)) {
            let position = n.lop.indexOf(id)

            let timestampDiff = Math.min(
              n.timestamp - n.timestampBefore,
              n.timestampAfter - n.timestamp
            )

            // let cpTimestampDiff = timestampDiff

            timestampDiff = timestampDiff / 2
            // timestampDiff = 0

            // if (Math.random() > 0.5) {
            //   timestampDiff = 0
            // } else {
            //   timestampDiff = cpTimestampDiff / 2
            // }

            if (n.relevantNode === true && n.relevantType === "source") {
              pathObj.path.push({
                patientID: id,
                node: n,
                position: position,
                patientCount: n.lop.length,
                timestamp: n.timestamp - timestampDiff,
              })

              pathNoMovementsObj.path.push({
                patientID: id,
                node: n,
                position: position,
                patientCount: n.lop.length,
                timestamp: n.timestamp - timestampDiff,
              })

              // pathNoMovementsObj.path.push({
              //   patientID: id,
              //   node: n,
              //   position: position,
              //   patientCount: n.lop.length,
              //   timestamp: n.timestamp
              // })

              pathNoMovementsObj.path.sort(
                (a, b) => a.node.timestep - b.node.timestep
              )
              pathsDataNoMovements.push(pathNoMovementsObj)
              // checkIfIsMovementPath = true
              pathNoMovementsObj = {
                path: [],
                patientID: id,
                status: infectionDataArray.patientStates[statusIndex],
                // movementPath: true
                movementPath: false,
                // movementPath: n.stationID !== n.sourceLinks[0].target.stationID
              }

              lastStationID = n.stationID

              // pathNoMovementsObj.path.push({
              //   patientID: id,
              //   node: n,
              //   position: position,
              //   patientCount: n.lop.length,
              //   timestamp: n.timestamp
              // })

              pathNoMovementsObj.path.push({
                patientID: id,
                node: n,
                position: position,
                patientCount: n.lop.length,
                timestamp: n.timestamp - timestampDiff,
              })

              // pathNoMovementsObj.path.push({
              //   patientID: id,
              //   node: n,
              //   position: position,
              //   patientCount: n.lop.length,
              //   timestamp: n.timestamp
              // })
            }

            // if (Math.random() > 0.5) {
            //   timestampDiff = 0
            // } else {
            //   timestampDiff = cpTimestampDiff / 2
            // }

            pathObj.path.push({
              patientID: id,
              node: n,
              position: position,
              patientCount: n.lop.length,
              timestamp: n.timestamp,
            })

            // if (n.relevantNode === true && n.relevantType === "target") {
            //   pathNoMovementsObj.path.push({
            //     patientID: id,
            //     node: n,
            //     position: position,
            //     patientCount: n.lop.length,
            //     timestamp: n.timestamp - timestampDiff
            //   })
            // }

            pathNoMovementsObj.path.push({
              patientID: id,
              node: n,
              position: position,
              patientCount: n.lop.length,
              timestamp: n.timestamp,
            })
            // if (n.relevantNode === true) {
            //   pathObj.path.push({
            //     patientID: id,
            //     node: n,
            //     position: position,
            //     patientCount: n.lop.length,
            //     timestamp: n.timestamp
            //   })
            // }

            // if (Math.random() > 0.5) {
            //   timestampDiff = 0
            // } else {
            //   timestampDiff = cpTimestampDiff / 2
            // }

            if (n.relevantNode === true && n.relevantType === "target") {
              pathObj.path.push({
                patientID: id,
                node: n,
                position: position,
                patientCount: n.lop.length,
                timestamp: n.timestamp + timestampDiff,
              })

              if (lastStationID !== n.stationID) {
                pathNoMovementsObj.movementPath = true
              }
              lastStationID = n.stationID

              // pathNoMovementsObj.path.push({
              //   patientID: id,
              //   node: n,
              //   position: position,
              //   patientCount: n.lop.length,
              //   timestamp: n.timestamp - timestampDiff
              // })

              // pathNoMovementsObj.path.push({
              //   patientID: id,
              //   node: n,
              //   position: position,
              //   patientCount: n.lop.length,
              //   timestamp: n.timestamp
              // })

              pathNoMovementsObj.path.push({
                patientID: id,
                node: n,
                position: position,
                patientCount: n.lop.length,
                timestamp: n.timestamp + timestampDiff,
              })

              pathNoMovementsObj.path.sort(
                (a, b) => a.node.timestep - b.node.timestep
              )
              pathsDataNoMovements.push(pathNoMovementsObj)

              pathNoMovementsObj = {
                path: [],
                patientID: id,
                status: infectionDataArray.patientStates[statusIndex],
                movementPath: false,
              }

              // pathNoMovementsObj.path.push({
              //   patientID: id,
              //   node: n,
              //   position: position,
              //   patientCount: n.lop.length,
              //   timestamp: n.timestamp
              // })

              pathNoMovementsObj.path.push({
                patientID: id,
                node: n,
                position: position,
                patientCount: n.lop.length,
                timestamp: n.timestamp + timestampDiff,
              })
            }

            if (n.infectionChangeOfPatient === id) {
              pathObj.path.sort((a, b) => a.node.timestep - b.node.timestep)
              pathsData.push(pathObj)

              statusIndex++
              pathObj = {
                path: [],
                patientID: id,
                status: infectionDataArray.patientStates[statusIndex],
              }

              pathObj.path.push({
                patientID: id,
                node: n,
                position: position,
                patientCount: n.lop.length,
                timestamp: n.timestamp,
              })

              pathObj.path.push({
                patientID: id,
                node: n,
                position: position,
                patientCount: n.lop.length,
                timestamp: n.timestamp + timestampDiff,
              })
            }
          }
        })

        pathObj.path.sort((a, b) => a.node.timestep - b.node.timestep)
        pathsData.push(pathObj)
      }
    })

    console.log("ENDE pathsData fertig erzeugt:")

    self.pathsData = pathsData
    self.pathsDataNoMovements = pathsDataNoMovements
    console.log("pathsData", self.pathsData)

    console.log("ANFANG Backtracking Grad 1")

    /**
     * "Backtracking" for den Flashback
     */
    let backtrackingByPatient = {}
    parsedData.patients.lop.forEach((paID) => {
      let pathsDataByPatient = pathsData.filter((d) => d.patientID === paID)
      let path = []
      let kontaktPatientenIDs = []
      let letzteKontaktknotenNodeIDs = {}
      pathsDataByPatient.forEach((pd) => {
        path = path.concat(pd.path)
      })
      let keimeInfos = parsedData.patients["P" + paID].keimeInfos["K" + keimID]
      let kontaktPatienten = []
      let criticalContactDuringUnknown = []
      let eigeneEvents = []
      path.forEach((n) => {
        let patients = n.node.lop
        let ts = n.timestamp
        let paStatus = "unbekannt"
        let stationID = n.node.stationID

        // if (paID == 113749)
        //   console.log(keimeInfos.erstesPositiv, n.timestamp, stationID)

        if (
          keimeInfos.erstesPositiv !== undefined &&
          keimeInfos.erstesPositiv <= n.timestamp
        ) {
          paStatus = "krank"
        } else if (
          keimeInfos.letztesNegativ !== undefined &&
          keimeInfos.letztesNegativ <= n.timestamp
        ) {
          paStatus = "traeger"
        }

        if (paStatus !== "unbekannt") {
          let indexStatus = eigeneEvents.findIndex(
            (ee) => ee.newStatus === paStatus
          )
          if (indexStatus < 0) {
            eigeneEvents.push({
              node: n,
              newStatus: paStatus,
              eigenesEvent: true,
            })
          }
        }

        if (
          paStatus !== "krank" &&
          stationID !== "home" &&
          stationID !== "tmphome"
        ) {
          // "nur solange der Patient noch nicht Krank ist kann er sich anstecken"
          // Liste dere Kontaktpatienten in diesem Knoten durchgehen, und schauen
          // ob ein neuer gefährlicher Kontakt dabei ist
          patients.forEach((pbID) => {
            if (paID !== pbID) {
              let keimeInfosB =
                parsedData.patients["P" + pbID].keimeInfos["K" + keimID]
              let pbStatus = "unbekannt"
              if (
                keimeInfosB.erstesPositiv !== undefined &&
                keimeInfosB.erstesPositiv <= n.timestamp
              ) {
                pbStatus = "krank"
              } else if (
                keimeInfosB.letztesNegativ !== undefined &&
                keimeInfosB.letztesNegativ <= n.timestamp
              ) {
                pbStatus = "traeger"
              }
              let index = kontaktPatienten.findIndex(
                (d) =>
                  d.paStatus === paStatus &&
                  d.pbStatus === pbStatus &&
                  d.stationID === stationID &&
                  d.pbID === pbID
              )
              // if (pbStatus !== "unbekannt") {
              if (true) {
                letzteKontaktknotenNodeIDs["P" + pbID] = n.node.node
              }
              if (index < 0 && pbStatus !== "unbekannt") {
                kontaktPatienten.push({
                  paID,
                  pbID,
                  paStatus,
                  pbStatus,
                  stationID,
                  node: n,
                  kontaktGrad: 1,
                })
                kontaktPatientenIDs.push(pbID)
                if (paStatus === "unbekannt") {
                  criticalContactDuringUnknown.push({
                    paID,
                    pbID,
                    paStatus,
                    pbStatus,
                    stationID,
                    node: n,
                    kontaktGrad: 2,
                  })
                }
              }
            }
          })
        }
      })
      /**
       * Verbindung zwischen Events herstellen
       */
      let findTraeger = eigeneEvents.filter((d) => d.newStatus === "traeger")
      let findKrank = eigeneEvents.filter((d) => d.newStatus === "krank")
      let lines = []

      let restlichenEvents = kontaktPatienten
      if (findTraeger.length > 0) {
        // "suche alle Events, die eingetreten sind bevor er traeger wurde"
        let eventsToTraeger = restlichenEvents.filter(
          (d) => d.node.timestamp < findTraeger[0].node.timestamp
        )
        restlichenEvents = restlichenEvents.filter(
          (d) => d.node.timestamp >= findTraeger[0].node.timestamp
        )

        eventsToTraeger.forEach((ett) => {
          let nodeA = findTraeger[0].node.node
          let nodeB = ett.node.node
          let timestampA = nodeA.timestamp
          let timestampB = ett.node.node.timestamp

          if (nodeA.nodeType === "movement") {
            let timestampDiff = Math.min(
              nodeA.timestamp - nodeA.timestampBefore,
              nodeA.timestampAfter - nodeA.timestamp
            )
            timestampDiff = timestampDiff / 2
            if (nodeA.relevantType === "source") {
              timestampA = nodeA.timestamp - timestampDiff
            } else if (nodeA.relevantType === "target") {
              timestampA = nodeA.timestamp + timestampDiff
            }
          }

          if (nodeB.nodeType === "movement") {
            let timestampDiff = Math.min(
              nodeB.timestamp - nodeB.timestampBefore,
              nodeB.timestampAfter - nodeB.timestamp
            )
            timestampDiff = timestampDiff / 2
            if (nodeB.relevantType === "source") {
              timestampB = nodeB.timestamp - timestampDiff
            } else if (nodeB.relevantType === "target") {
              timestampB = nodeB.timestamp + timestampDiff
            }
          }

          // let timestampDiff =
          //   findTraeger[0].node.node.timestamp - ett.node.node.timestamp
          // let middleTimestamp = ett.node.node.timestamp + timestampDiff

          // let middleTimestamp =
          //   (findTraeger[0].node.node.timestamp + ett.node.node.timestamp) / 2
          let middleTimestamp = (timestampA + timestampB) / 2
          let yPos = 0
          lines.push({
            sourceEvent: ett.node.node,
            targetEvent: findTraeger[0].node.node,
            lineType: "toTraeger",
            pointNodes: [
              // ett.node.node,
              // { timestamp: middleTimestamp, y: yPos },
              // findTraeger[0].node.node
              {
                timestamp: timestampA,
                y: nodeA,
                eigenesEvent: true,
              },
              {
                timestamp: middleTimestamp,
                y: { y: yPos },
              },
              { timestamp: timestampB, y: nodeB },
            ],
          })
        })
      }

      if (findKrank.length > 0) {
        // "suche alle Events, die eingetreten sind bevor er traeger wurde"
        let eventsToKrank = restlichenEvents.filter(
          (d) => d.node.timestamp < findKrank[0].node.timestamp
        )
        restlichenEvents = restlichenEvents.filter(
          (d) => d.node.timestamp >= findKrank[0].node.timestamp
        )

        eventsToKrank.forEach((etk) => {
          // let timestampDiff =
          //   findKrank[0].node.node.timestamp - etk.node.node.timestamp
          // let middleTimestamp = etk.node.node.timestamp + timestampDiff

          let nodeA = findKrank[0].node.node
          let nodeB = etk.node.node
          let timestampA = nodeA.timestamp
          let timestampB = etk.node.node.timestamp

          if (nodeA.nodeType === "movement") {
            let timestampDiff = Math.min(
              nodeA.timestamp - nodeA.timestampBefore,
              nodeA.timestampAfter - nodeA.timestamp
            )
            timestampDiff = timestampDiff / 2
            if (nodeA.relevantType === "source") {
              timestampA = nodeA.timestamp - timestampDiff
            } else if (nodeA.relevantType === "target") {
              timestampA = nodeA.timestamp + timestampDiff
            }
          }

          if (nodeB.nodeType === "movement") {
            let timestampDiff = Math.min(
              nodeB.timestamp - nodeB.timestampBefore,
              nodeB.timestampAfter - nodeB.timestamp
            )
            timestampDiff = timestampDiff / 2
            if (nodeB.relevantType === "source") {
              timestampB = nodeB.timestamp - timestampDiff
            } else if (nodeB.relevantType === "target") {
              timestampB = nodeB.timestamp + timestampDiff
            }
          }
          // let middleTimestamp =
          //   (findKrank[0].node.node.timestamp + etk.node.node.timestamp) / 2
          let middleTimestamp = (timestampA + timestampB) / 2
          let yPos = 0
          lines.push({
            sourceEvent: etk.node.node,
            targetEvent: findKrank[0].node.node,
            lineType: "toKrank",
            pointNodes: [
              // etk.node.node,
              {
                timestamp: timestampA,
                y: nodeA,
                eigenesEvent: true,
              },
              {
                timestamp: middleTimestamp,
                y: { y: yPos },
              },
              { timestamp: timestampB, y: nodeB },
              // findKrank[0].node.node
            ],
          })
        })
      }

      backtrackingByPatient["P" + paID] = {
        kontaktPatientenIDs,
        letzteKontaktknotenNodeIDs,
        kontaktPatienten,
        eigeneEvents,
        lines,
        criticalContactDuringUnknown,
        grad2Contacts: [],
        grad2Lines: [],
        backtrackingPaths: [],
      }
    })

    console.log("ENDE Backtracking Grad 1")

    console.log("ANFANG Backtracking Grad 2")
    /**
     * Grad 2 Backtracking Flashback
     */
    parsedData.patients.lop.forEach((paID) => {
      let pathsDataByPatient = pathsData.filter((d) => d.patientID === paID)
      let path = []
      pathsDataByPatient.forEach((pd) => {
        path = path.concat(pd.path)
      })
      let keimeInfos = parsedData.patients["P" + paID].keimeInfos["K" + keimID]

      path.forEach((n) => {
        let patients = n.node.lop
        let ts = n.timestamp
        let paStatus = "unbekannt"
        let stationID = n.node.stationID

        if (
          keimeInfos.erstesPositiv !== undefined &&
          keimeInfos.erstesPositiv <= n.timestamp
        ) {
          paStatus = "krank"
        } else if (
          keimeInfos.letztesNegativ !== undefined &&
          keimeInfos.letztesNegativ <= n.timestamp
        ) {
          paStatus = "traeger"
        }

        if (
          paStatus !== "krank" &&
          stationID !== "home" &&
          stationID !== "tmphome"
        ) {
          // "nur solange der Patient noch nicht Krank ist kann er sich anstecken"
          // Liste dere Kontaktpatienten in diesem Knoten durchgehen, und schauen
          // ob ein neuer gefährlicher Kontakt dabei ist
          patients.forEach((pbID) => {
            if (paID !== pbID) {
              let keimeInfosB =
                parsedData.patients["P" + pbID].keimeInfos["K" + keimID]
              let pbStatus = "unbekannt"
              if (
                keimeInfosB.erstesPositiv !== undefined &&
                keimeInfosB.erstesPositiv <= n.timestamp
              ) {
                pbStatus = "krank"
              } else if (
                keimeInfosB.letztesNegativ !== undefined &&
                keimeInfosB.letztesNegativ <= n.timestamp
              ) {
                pbStatus = "traeger"
              }

              if (pbStatus === "unbekannt") {
                // if (true) {
                let paBacktracking = backtrackingByPatient["P" + paID]
                let pbBacktracking = backtrackingByPatient["P" + pbID]

                // let unknownGrad2Paths = pbBacktracking
                let unknownGrad2Contacts =
                  pbBacktracking.criticalContactDuringUnknown.filter(
                    // let unknownGrad2Contacts = pbBacktracking.kontaktPatienten.filter(
                    (d) => d.pbID !== paID && d.node.timestamp < ts
                  )
                let newGrad2Contacts = []
                unknownGrad2Contacts.forEach((ug2c) => {
                  let index = paBacktracking.kontaktPatienten.findIndex((d) => {
                    // console.log(d, ug2c)
                    // debugger
                    return (
                      d.stationID === ug2c.stationID &&
                      d.node.timestamp < ts &&
                      d.pbStatus === ug2c.pbStatus &&
                      d.pbID === ug2c.pbID
                    )
                  })

                  if (index < 0) {
                    newGrad2Contacts.push(ug2c)
                    paBacktracking.kontaktPatienten.push(ug2c)
                  }
                })

                // if (paID === 63104) {
                //   console.log(newGrad2Contacts)
                // }

                if (newGrad2Contacts.length > 0) {
                  let middleContactCircle = {
                    paID,
                    pbID,
                    paStatus,
                    pbStatus,
                    stationID,
                    node: n,
                    kontaktGrad: 1,
                    middleContactCircle: true,
                  }
                  paBacktracking.kontaktPatienten.push(middleContactCircle)

                  let findTraeger = paBacktracking.eigeneEvents.filter(
                    (d) => d.newStatus === "traeger"
                  )
                  let findKrank = paBacktracking.eigeneEvents.filter(
                    (d) => d.newStatus === "krank"
                  )

                  let firstNode = undefined
                  let lineType = undefined
                  if (
                    findTraeger.length > 0 &&
                    findTraeger[0].node.timestamp > ts
                  ) {
                    firstNode = findTraeger[0].node.node
                    lineType = "toTraeger"
                  } else if (
                    findKrank.length > 0 &&
                    findKrank[0].node.timestamp > ts
                  ) {
                    firstNode = findKrank[0].node.node
                    lineType = "toKrank"
                  }

                  let grad2Lines = []
                  if (firstNode !== undefined) {
                    // Grad 0 Linie erzeugen

                    let nodeA = firstNode
                    let nodeB = n.node
                    let timestampA = nodeA.timestamp
                    let timestampB = nodeB.timestamp

                    if (nodeA.nodeType === "movement") {
                      let timestampDiff = Math.min(
                        nodeA.timestamp - nodeA.timestampBefore,
                        nodeA.timestampAfter - nodeA.timestamp
                      )
                      timestampDiff = timestampDiff / 2
                      if (nodeA.relevantType === "source") {
                        timestampA = nodeA.timestamp - timestampDiff
                      } else if (nodeA.relevantType === "target") {
                        timestampA = nodeA.timestamp + timestampDiff
                      }
                    }

                    if (nodeB.nodeType === "movement") {
                      let timestampDiff = Math.min(
                        nodeB.timestamp - nodeB.timestampBefore,
                        nodeB.timestampAfter - nodeB.timestamp
                      )
                      timestampDiff = timestampDiff / 2
                      if (nodeB.relevantType === "source") {
                        timestampB = nodeB.timestamp - timestampDiff
                      } else if (nodeB.relevantType === "target") {
                        timestampB = nodeB.timestamp + timestampDiff
                      }
                    }

                    let middleTimestamp = (timestampA + timestampB) / 2
                    let yPos = 0

                    grad2Lines.push({
                      sourceEvent: n.node,
                      targetEvent: firstNode,
                      lineType: lineType,
                      pointNodes: [
                        {
                          timestamp: timestampA,
                          y: nodeA,
                          eigenesEvent: true,
                        },
                        {
                          timestamp: middleTimestamp,
                          y: { y: yPos },
                        },
                        {
                          timestamp: timestampB,
                          y: nodeB,
                        },
                      ],
                    })
                  }

                  newGrad2Contacts.forEach((ng2c) => {
                    let nodeA = n.node
                    let nodeB = ng2c.node.node
                    let timestampA = nodeA.timestamp
                    let timestampB = nodeB.timestamp

                    if (nodeA.nodeType === "movement") {
                      let timestampDiff = Math.min(
                        nodeA.timestamp - nodeA.timestampBefore,
                        nodeA.timestampAfter - nodeA.timestamp
                      )
                      timestampDiff = timestampDiff / 2
                      if (nodeA.relevantType === "source") {
                        timestampA = nodeA.timestamp - timestampDiff
                      } else if (nodeA.relevantType === "target") {
                        timestampA = nodeA.timestamp + timestampDiff
                      }
                    }

                    if (nodeB.nodeType === "movement") {
                      let timestampDiff = Math.min(
                        nodeB.timestamp - nodeB.timestampBefore,
                        nodeB.timestampAfter - nodeB.timestamp
                      )
                      timestampDiff = timestampDiff / 2
                      if (nodeB.relevantType === "source") {
                        timestampB = nodeB.timestamp - timestampDiff
                      } else if (nodeB.relevantType === "target") {
                        timestampB = nodeB.timestamp + timestampDiff
                      }
                    }

                    let middleTimestamp = (timestampA + timestampB) / 2
                    let yPos = 0

                    grad2Lines.push({
                      sourceEvent: n.node,
                      targetEvent: firstNode,
                      lineType: lineType,
                      pointNodes: [
                        {
                          timestamp: timestampA,
                          y: nodeA,
                        },
                        {
                          timestamp: middleTimestamp,
                          y: { y: yPos },
                        },
                        {
                          timestamp: timestampB,
                          y: nodeB,
                        },
                      ],
                    })
                  })

                  paBacktracking.grad2Lines =
                    paBacktracking.grad2Lines.concat(grad2Lines)
                  paBacktracking.grad2Contacts =
                    paBacktracking.grad2Contacts.concat(newGrad2Contacts)
                }

                // if (index < 0) {
                //   paBacktracking.kontaktPatienten.push({
                //     paID,
                //     pbID,
                //     paStatus,
                //     pbStatus,
                //     stationID,
                //     node: n,
                //     kontaktGrad: 1
                //   })
                // }
              }
            }
          })
        }
      })
    })

    console.log("ENDE Backtracking Grad 2")

    console.log("ANFANG Forwardtracking Grad 1")

    /**
     * "Forward tracking" for den Flashback
     */
    let forwardtrackingByPatient = {}
    parsedData.patients.lop.forEach((paID) => {
      let pathsDataByPatient = pathsData.filter((d) => d.patientID === paID)
      let path = []
      let kontaktPatientenIDs = []
      let ersteKontaktKnotenIDs = {}
      pathsDataByPatient.forEach((pd) => {
        path = path.concat(pd.path)
      })
      let keimeInfos = parsedData.patients["P" + paID].keimeInfos["K" + keimID]
      let kontaktPatienten = []
      let eigeneEvents = []
      path.forEach((n) => {
        let patients = n.node.lop
        let ts = n.timestamp
        let paStatus = "unbekannt"
        let stationID = n.node.stationID

        if (
          keimeInfos.erstesPositiv !== undefined &&
          keimeInfos.erstesPositiv <= n.timestamp
        ) {
          paStatus = "krank"
        } else if (
          keimeInfos.letztesNegativ !== undefined &&
          keimeInfos.letztesNegativ <= n.timestamp
        ) {
          paStatus = "traeger"
        }

        if (paStatus !== "unbekannt") {
          let indexStatus = eigeneEvents.findIndex(
            (ee) => ee.newStatus === paStatus
          )
          if (indexStatus < 0) {
            eigeneEvents.push({
              node: n,
              newStatus: paStatus,
              eigenesEvent: true,
            })
          }
        }

        if (
          paStatus !== "unbekannt" &&
          stationID !== "home" &&
          stationID !== "tmphome"
        ) {
          // "nur solange der Patient nicht mehr Unbekannt ist kann er jmdn anstecken"
          // Liste dere Kontaktpatienten in diesem Knoten durchgehen, und schauen
          // ob ein neuer gefährlicher Kontakt dabei ist
          patients.forEach((pbID) => {
            if (paID !== pbID) {
              let keimeInfosB =
                parsedData.patients["P" + pbID].keimeInfos["K" + keimID]
              let pbStatus = "unbekannt"
              if (
                keimeInfosB.erstesPositiv !== undefined &&
                keimeInfosB.erstesPositiv <= n.timestamp
              ) {
                pbStatus = "krank"
              } else if (
                keimeInfosB.letztesNegativ !== undefined &&
                keimeInfosB.letztesNegativ <= n.timestamp
              ) {
                pbStatus = "traeger"
              }
              let index = kontaktPatienten.findIndex(
                (d) =>
                  d.paStatus === paStatus &&
                  d.pbStatus === pbStatus &&
                  d.stationID === stationID &&
                  d.pbID === pbID
              )
              if (
                pbStatus !== "krank" &&
                ersteKontaktKnotenIDs["P" + pbID] === undefined
              ) {
                ersteKontaktKnotenIDs["P" + pbID] = n.node.node
              }
              if (index < 0 && pbStatus !== "krank") {
                kontaktPatienten.push({
                  paID,
                  pbID,
                  paStatus,
                  pbStatus,
                  stationID,
                  node: n,
                  kontaktGrad: 1,
                })
                kontaktPatientenIDs.push(pbID)
                // if (paStatus === "unbekannt") {
                //   criticalContactDuringUnknown.push({
                //     paID,
                //     pbID,
                //     paStatus,
                //     pbStatus,
                //     stationID,
                //     node: n,
                //     kontaktGrad: 2
                //   })
                // }
              }
            }
          })
        }
      })
      /**
       * Verbindung zwischen Events herstellen
       */
      let findTraeger = eigeneEvents.filter((d) => d.newStatus === "traeger")
      let findKrank = eigeneEvents.filter((d) => d.newStatus === "krank")
      let lines = []

      let restlichenEvents = kontaktPatienten

      if (findKrank.length > 0) {
        let eventsToKrank = restlichenEvents.filter(
          (d) => d.node.timestamp > findKrank[0].node.timestamp
        )
        restlichenEvents = restlichenEvents.filter(
          (d) => d.node.timestamp <= findKrank[0].node.timestamp
        )

        eventsToKrank.forEach((etk) => {
          // let timestampDiff =
          //   findKrank[0].node.node.timestamp - etk.node.node.timestamp
          // let middleTimestamp = etk.node.node.timestamp + timestampDiff

          let nodeA = findKrank[0].node.node
          let nodeB = etk.node.node
          let timestampA = nodeA.timestamp
          let timestampB = etk.node.node.timestamp

          if (nodeA.nodeType === "movement") {
            let timestampDiff = Math.min(
              nodeA.timestamp - nodeA.timestampBefore,
              nodeA.timestampAfter - nodeA.timestamp
            )
            timestampDiff = timestampDiff / 2
            if (nodeA.relevantType === "source") {
              timestampA = nodeA.timestamp - timestampDiff
            } else if (nodeA.relevantType === "target") {
              timestampA = nodeA.timestamp + timestampDiff
            }
          }

          if (nodeB.nodeType === "movement") {
            let timestampDiff = Math.min(
              nodeB.timestamp - nodeB.timestampBefore,
              nodeB.timestampAfter - nodeB.timestamp
            )
            timestampDiff = timestampDiff / 2
            if (nodeB.relevantType === "source") {
              timestampB = nodeB.timestamp - timestampDiff
            } else if (nodeB.relevantType === "target") {
              timestampB = nodeB.timestamp + timestampDiff
            }
          }
          // let middleTimestamp =
          //   (findKrank[0].node.node.timestamp + etk.node.node.timestamp) / 2
          let middleTimestamp = (timestampA + timestampB) / 2
          let yPos = 0
          lines.push({
            sourceEvent: etk.node.node,
            targetEvent: findKrank[0].node.node,
            lineType: "toKrank",
            pointNodes: [
              // etk.node.node,
              {
                timestamp: timestampA,
                y: nodeA,
                eigenesEvent: true,
              },
              {
                timestamp: middleTimestamp,
                y: { y: yPos },
              },
              { timestamp: timestampB, y: nodeB },
              // findKrank[0].node.node
            ],
          })
        })
      }

      if (findTraeger.length > 0) {
        // "suche alle Events, die eingetreten sind bevor er traeger wurde"
        let eventsToTraeger = restlichenEvents.filter(
          (d) => d.node.timestamp > findTraeger[0].node.timestamp
        )
        restlichenEvents = restlichenEvents.filter(
          // sollte leer sein
          (d) => d.node.timestamp <= findTraeger[0].node.timestamp
        )

        eventsToTraeger.forEach((ett) => {
          let nodeA = findTraeger[0].node.node
          let nodeB = ett.node.node
          let timestampA = nodeA.timestamp
          let timestampB = ett.node.node.timestamp

          if (nodeA.nodeType === "movement") {
            let timestampDiff = Math.min(
              nodeA.timestamp - nodeA.timestampBefore,
              nodeA.timestampAfter - nodeA.timestamp
            )
            timestampDiff = timestampDiff / 2
            if (nodeA.relevantType === "source") {
              timestampA = nodeA.timestamp - timestampDiff
            } else if (nodeA.relevantType === "target") {
              timestampA = nodeA.timestamp + timestampDiff
            }
          }

          if (nodeB.nodeType === "movement") {
            let timestampDiff = Math.min(
              nodeB.timestamp - nodeB.timestampBefore,
              nodeB.timestampAfter - nodeB.timestamp
            )
            timestampDiff = timestampDiff / 2
            if (nodeB.relevantType === "source") {
              timestampB = nodeB.timestamp - timestampDiff
            } else if (nodeB.relevantType === "target") {
              timestampB = nodeB.timestamp + timestampDiff
            }
          }

          // let timestampDiff =
          //   findTraeger[0].node.node.timestamp - ett.node.node.timestamp
          // let middleTimestamp = ett.node.node.timestamp + timestampDiff

          // let middleTimestamp =
          //   (findTraeger[0].node.node.timestamp + ett.node.node.timestamp) / 2
          let middleTimestamp = (timestampA + timestampB) / 2
          let yPos = 0
          lines.push({
            sourceEvent: ett.node.node,
            targetEvent: findTraeger[0].node.node,
            lineType: "toTraeger",
            pointNodes: [
              // ett.node.node,
              // { timestamp: middleTimestamp, y: yPos },
              // findTraeger[0].node.node
              {
                timestamp: timestampA,
                y: nodeA,
                eigenesEvent: true,
              },
              {
                timestamp: middleTimestamp,
                y: { y: yPos },
              },
              { timestamp: timestampB, y: nodeB },
            ],
          })
        })
      }

      forwardtrackingByPatient["P" + paID] = {
        kontaktPatientenIDs,
        ersteKontaktKnotenIDs,
        letzteKontaktknotenNodeIDs: ersteKontaktKnotenIDs,
        kontaktPatienten,
        eigeneEvents,
        lines,
        // criticalContactDuringUnknown,
        grad2Contacts: [],
        grad2Lines: [],
        backtrackingPaths: [],
      }
    })

    console.log("ENDE Forwardtracking Grad 1")

    console.log(
      "ANFANG pathsdata für Krankheitsverbreitung forward und backward"
    )

    /**
     * diese Schleife wird gebraucht um auch atienten 2ten Grades
     * bis zum relevanten Event dicker zu machen
     */
    parsedData.patients.lop.forEach((paID) => {
      let backTrackingOfPatient = backtrackingByPatient["P" + paID]

      backTrackingOfPatient.grad2Contacts.forEach((g2c) => {
        let pcID = g2c.pbID
        let nodeID = g2c.node.node.node

        if (backTrackingOfPatient.kontaktPatientenIDs.includes(pcID)) {
          backTrackingOfPatient.letzteKontaktknotenNodeIDs["P" + pcID] =
            Math.max(
              backTrackingOfPatient.letzteKontaktknotenNodeIDs["P" + pcID],
              nodeID
            )
        } else {
          backTrackingOfPatient.letzteKontaktknotenNodeIDs["P" + pcID] = nodeID
          backTrackingOfPatient.kontaktPatientenIDs.push(pcID)
        }

        pcID = g2c.paID

        // backTrackingOfPatient.letzteKontaktknotenNodeIDs[
        //     "P" + pcID
        // ] = nodeID

        if (backTrackingOfPatient.kontaktPatientenIDs.includes(pcID)) {
          backTrackingOfPatient.letzteKontaktknotenNodeIDs["P" + pcID] =
            Math.max(
              backTrackingOfPatient.letzteKontaktknotenNodeIDs["P" + pcID],
              nodeID
            )
        } else {
          if (
            backTrackingOfPatient.letzteKontaktknotenNodeIDs["P" + pcID] ===
            undefined
          ) {
            backTrackingOfPatient.letzteKontaktknotenNodeIDs["P" + pcID] =
              nodeID
          } else {
            backTrackingOfPatient.letzteKontaktknotenNodeIDs["P" + pcID] =
              Math.max(
                backTrackingOfPatient.letzteKontaktknotenNodeIDs["P" + pcID],
                nodeID
              )
          }
          backTrackingOfPatient.kontaktPatientenIDs.push(pcID)
        }

        // if (
        //   backTrackingOfPatient.letzteKontaktknotenNodeIDs["P" + pcID] ===
        //   "undefined"
        // ) {
        //   backTrackingOfPatient.letzteKontaktknotenNodeIDs[
        //     "P" + pcID
        //   ] = nodeID
        //   backTrackingOfPatient.kontaktPatientenIDs.push(pcID)
        // } else {
        //   backTrackingOfPatient.letzteKontaktknotenNodeIDs[
        //     "P" + pcID
        //   ] = Math.max(
        //     backTrackingOfPatient.letzteKontaktknotenNodeIDs["P" + pcID],
        //     nodeID
        //   )
        // }
      })
    })

    /**
     * Die Backtracking-paths erzeugen
     */
    parsedData.patients.lop.forEach((paID) => {
      let backTrackingOfPatient = backtrackingByPatient["P" + paID]
      let pathsData = []

      backTrackingOfPatient.grad2Contacts.forEach((g2c) => {
        let pcID = g2c.pbID
        let nodeID = g2c.node.node.node

        if (
          backTrackingOfPatient.letzteKontaktknotenNodeIDs["P" + pcID] ===
          undefined
        ) {
          backTrackingOfPatient.letzteKontaktknotenNodeIDs["P" + pcID] = nodeID
          backTrackingOfPatient.kontaktPatientenIDs.push(pcID)
        } else {
          backTrackingOfPatient.letzteKontaktknotenNodeIDs["P" + pcID] =
            Math.max(
              backTrackingOfPatient.letzteKontaktknotenNodeIDs["P" + pcID],
              nodeID
            )
        }
      })

      parsedData.patients.lop.forEach((pbID) => {
        let id = pbID
        // if (paID === pbID) {
        // ganze Linie offensichtlich anzeigen
        let infectionDataArray =
          parsedData.patients["P" + id].keimeInfos["K" + keimID]
        if (infectionDataArray !== undefined) {
          if (paID === pbID) {
            /**
             * Falls Patient keine Daten zu diesem Keim hat, kann
             */
            let statusIndex = 0
            let pathObj = {
              path: [],
              patientID: id,
              status: infectionDataArray.patientStates[statusIndex],
            }

            let lastStationID = undefined
            nodes.forEach((n) => {
              if (n.lop.includes(id)) {
                let position = n.lop.indexOf(id)

                let timestampDiff = Math.min(
                  n.timestamp - n.timestampBefore,
                  n.timestampAfter - n.timestamp
                )

                // let cpTimestampDiff = timestampDiff

                timestampDiff = timestampDiff / 2

                if (n.relevantNode === true && n.relevantType === "source") {
                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp - timestampDiff,
                  })

                  lastStationID = n.stationID
                }

                pathObj.path.push({
                  patientID: id,
                  node: n,
                  position: position,
                  patientCount: n.lop.length,
                  timestamp: n.timestamp,
                })

                if (n.relevantNode === true && n.relevantType === "target") {
                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp + timestampDiff,
                  })

                  lastStationID = n.stationID
                }

                if (n.infectionChangeOfPatient === id) {
                  pathObj.path.sort((a, b) => a.node.timestep - b.node.timestep)
                  pathsData.push(pathObj)

                  statusIndex++
                  pathObj = {
                    path: [],
                    patientID: id,
                    status: infectionDataArray.patientStates[statusIndex],
                  }

                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp,
                  })

                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp + timestampDiff,
                  })
                }
              }
            })

            pathObj.path.sort((a, b) => a.node.timestep - b.node.timestep)
            pathsData.push(pathObj)
          } else if (backTrackingOfPatient.kontaktPatientenIDs.includes(pbID)) {
            // Linien normal bis zum letzten Übertragungs-Kontakt (bevor krank)
            let letzterKontaktknoten =
              backTrackingOfPatient.letzteKontaktknotenNodeIDs["P" + pbID]
            /**
             * Falls Patient keine Daten zu diesem Keim hat, kann
             */
            let restIsNotRelevant = false

            let statusIndex = 0
            let pathObj = {
              path: [],
              patientID: id,
              status: infectionDataArray.patientStates[statusIndex],
              notRelevant: restIsNotRelevant,
            }

            let lastStationID = undefined
            nodes.forEach((n) => {
              if (n.lop.includes(id)) {
                let position = n.lop.indexOf(id)

                let timestampDiff = Math.min(
                  n.timestamp - n.timestampBefore,
                  n.timestampAfter - n.timestamp
                )

                // let cpTimestampDiff = timestampDiff

                timestampDiff = timestampDiff / 2

                if (n.relevantNode === true && n.relevantType === "source") {
                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp - timestampDiff,
                  })

                  lastStationID = n.stationID
                }

                pathObj.path.push({
                  patientID: id,
                  node: n,
                  position: position,
                  patientCount: n.lop.length,
                  timestamp: n.timestamp,
                })

                if (n.relevantNode === true && n.relevantType === "target") {
                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp + timestampDiff,
                  })

                  lastStationID = n.stationID
                }

                if (n.infectionChangeOfPatient === id) {
                  pathObj.path.sort((a, b) => a.node.timestep - b.node.timestep)
                  pathsData.push(pathObj)

                  statusIndex++
                  pathObj = {
                    path: [],
                    patientID: id,
                    status: infectionDataArray.patientStates[statusIndex],
                    notRelevant: restIsNotRelevant,
                  }

                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp,
                  })

                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp + timestampDiff,
                  })
                }

                if (n.node === letzterKontaktknoten) {
                  restIsNotRelevant = true
                  pathObj.path.sort((a, b) => a.node.timestep - b.node.timestep)
                  pathsData.push(pathObj)

                  pathObj = {
                    path: [],
                    patientID: id,
                    status: infectionDataArray.patientStates[statusIndex],
                    notRelevant: restIsNotRelevant,
                  }

                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp,
                  })

                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp + timestampDiff,
                  })
                }
              }
            })

            pathObj.path.sort((a, b) => a.node.timestep - b.node.timestep)
            pathsData.push(pathObj)
          } else {
            // Linie durchgehend dünn
            /**
             * Falls Patient keine Daten zu diesem Keim hat, kann
             */
            let restIsNotRelevant = true

            let statusIndex = 0
            let pathObj = {
              path: [],
              patientID: id,
              status: infectionDataArray.patientStates[statusIndex],
              notRelevant: restIsNotRelevant,
            }

            let lastStationID = undefined
            nodes.forEach((n) => {
              if (n.lop.includes(id)) {
                let position = n.lop.indexOf(id)

                let timestampDiff = Math.min(
                  n.timestamp - n.timestampBefore,
                  n.timestampAfter - n.timestamp
                )

                // let cpTimestampDiff = timestampDiff

                timestampDiff = timestampDiff / 2

                if (n.relevantNode === true && n.relevantType === "source") {
                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp - timestampDiff,
                  })

                  lastStationID = n.stationID
                }

                pathObj.path.push({
                  patientID: id,
                  node: n,
                  position: position,
                  patientCount: n.lop.length,
                  timestamp: n.timestamp,
                })

                if (n.relevantNode === true && n.relevantType === "target") {
                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp + timestampDiff,
                  })

                  lastStationID = n.stationID
                }

                if (n.infectionChangeOfPatient === id) {
                  pathObj.path.sort((a, b) => a.node.timestep - b.node.timestep)
                  pathsData.push(pathObj)

                  statusIndex++
                  pathObj = {
                    path: [],
                    patientID: id,
                    status: infectionDataArray.patientStates[statusIndex],
                    notRelevant: restIsNotRelevant,
                  }

                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp,
                  })

                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp + timestampDiff,
                  })
                }
              }
            })

            pathObj.path.sort((a, b) => a.node.timestep - b.node.timestep)
            pathsData.push(pathObj)
          }
        }
      })
      backTrackingOfPatient.backtrackingPaths =
        backTrackingOfPatient.backtrackingPaths.concat(pathsData)
    })

    /**
     * Die Forwardtracking-paths erzeugen
     */
    parsedData.patients.lop.forEach((paID) => {
      let forwardTrackingOfPatient = forwardtrackingByPatient["P" + paID]
      let pathsData = []

      parsedData.patients.lop.forEach((pbID) => {
        let id = pbID
        // if (paID === pbID) {
        // ganze Linie offensichtlich anzeigen
        let infectionDataArray =
          parsedData.patients["P" + id].keimeInfos["K" + keimID]
        if (infectionDataArray !== undefined) {
          if (paID === pbID) {
            /**
             * Falls Patient keine Daten zu diesem Keim hat, kann
             */
            let statusIndex = 0
            let pathObj = {
              path: [],
              patientID: id,
              status: infectionDataArray.patientStates[statusIndex],
            }

            let lastStationID = undefined
            nodes.forEach((n) => {
              if (n.lop.includes(id)) {
                let position = n.lop.indexOf(id)

                let timestampDiff = Math.min(
                  n.timestamp - n.timestampBefore,
                  n.timestampAfter - n.timestamp
                )

                // let cpTimestampDiff = timestampDiff

                timestampDiff = timestampDiff / 2

                if (n.relevantNode === true && n.relevantType === "source") {
                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp - timestampDiff,
                  })

                  lastStationID = n.stationID
                }

                pathObj.path.push({
                  patientID: id,
                  node: n,
                  position: position,
                  patientCount: n.lop.length,
                  timestamp: n.timestamp,
                })

                if (n.relevantNode === true && n.relevantType === "target") {
                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp + timestampDiff,
                  })

                  lastStationID = n.stationID
                }

                if (n.infectionChangeOfPatient === id) {
                  pathObj.path.sort((a, b) => a.node.timestep - b.node.timestep)
                  pathsData.push(pathObj)

                  statusIndex++
                  pathObj = {
                    path: [],
                    patientID: id,
                    status: infectionDataArray.patientStates[statusIndex],
                  }

                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp,
                  })

                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp + timestampDiff,
                  })
                }
              }
            })

            pathObj.path.sort((a, b) => a.node.timestep - b.node.timestep)
            pathsData.push(pathObj)
          } else if (
            forwardTrackingOfPatient.kontaktPatientenIDs.includes(pbID)
          ) {
            // Linien normal bis zum letzten Übertragungs-Kontakt (bevor krank)
            let letzterKontaktknoten =
              forwardTrackingOfPatient.ersteKontaktKnotenIDs["P" + pbID]
            /**
             * Falls Patient keine Daten zu diesem Keim hat, kann
             */
            let restIsNotRelevant = true

            let statusIndex = 0
            let pathObj = {
              path: [],
              patientID: id,
              status: infectionDataArray.patientStates[statusIndex],
              notRelevant: restIsNotRelevant,
            }

            let lastStationID = undefined
            nodes.forEach((n) => {
              if (n.lop.includes(id)) {
                let position = n.lop.indexOf(id)

                let timestampDiff = Math.min(
                  n.timestamp - n.timestampBefore,
                  n.timestampAfter - n.timestamp
                )

                // let cpTimestampDiff = timestampDiff

                timestampDiff = timestampDiff / 2

                if (n.relevantNode === true && n.relevantType === "source") {
                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp - timestampDiff,
                  })

                  lastStationID = n.stationID
                }

                pathObj.path.push({
                  patientID: id,
                  node: n,
                  position: position,
                  patientCount: n.lop.length,
                  timestamp: n.timestamp,
                })

                if (n.relevantNode === true && n.relevantType === "target") {
                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp + timestampDiff,
                  })

                  lastStationID = n.stationID
                }

                if (n.infectionChangeOfPatient === id) {
                  pathObj.path.sort((a, b) => a.node.timestep - b.node.timestep)
                  pathsData.push(pathObj)

                  statusIndex++
                  pathObj = {
                    path: [],
                    patientID: id,
                    status: infectionDataArray.patientStates[statusIndex],
                    notRelevant: restIsNotRelevant,
                  }

                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp,
                  })

                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp + timestampDiff,
                  })
                }

                if (n.node === letzterKontaktknoten) {
                  restIsNotRelevant = false
                  pathObj.path.sort((a, b) => a.node.timestep - b.node.timestep)
                  pathsData.push(pathObj)

                  pathObj = {
                    path: [],
                    patientID: id,
                    status: infectionDataArray.patientStates[statusIndex],
                    notRelevant: restIsNotRelevant,
                  }

                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp,
                  })

                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp + timestampDiff,
                  })
                }
              }
            })

            pathObj.path.sort((a, b) => a.node.timestep - b.node.timestep)
            pathsData.push(pathObj)
          } else {
            // Linie durchgehend dünn
            /**
             * Falls Patient keine Daten zu diesem Keim hat, kann
             */
            let restIsNotRelevant = true

            let statusIndex = 0
            let pathObj = {
              path: [],
              patientID: id,
              status: infectionDataArray.patientStates[statusIndex],
              notRelevant: restIsNotRelevant,
            }

            let lastStationID = undefined
            nodes.forEach((n) => {
              if (n.lop.includes(id)) {
                let position = n.lop.indexOf(id)

                let timestampDiff = Math.min(
                  n.timestamp - n.timestampBefore,
                  n.timestampAfter - n.timestamp
                )

                // let cpTimestampDiff = timestampDiff

                timestampDiff = timestampDiff / 2

                if (n.relevantNode === true && n.relevantType === "source") {
                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp - timestampDiff,
                  })

                  lastStationID = n.stationID
                }

                pathObj.path.push({
                  patientID: id,
                  node: n,
                  position: position,
                  patientCount: n.lop.length,
                  timestamp: n.timestamp,
                })

                if (n.relevantNode === true && n.relevantType === "target") {
                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp + timestampDiff,
                  })

                  lastStationID = n.stationID
                }

                if (n.infectionChangeOfPatient === id) {
                  pathObj.path.sort((a, b) => a.node.timestep - b.node.timestep)
                  pathsData.push(pathObj)

                  statusIndex++
                  pathObj = {
                    path: [],
                    patientID: id,
                    status: infectionDataArray.patientStates[statusIndex],
                    notRelevant: restIsNotRelevant,
                  }

                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp,
                  })

                  pathObj.path.push({
                    patientID: id,
                    node: n,
                    position: position,
                    patientCount: n.lop.length,
                    timestamp: n.timestamp + timestampDiff,
                  })
                }
              }
            })

            pathObj.path.sort((a, b) => a.node.timestep - b.node.timestep)
            pathsData.push(pathObj)
          }
        }
      })
      forwardTrackingOfPatient.backtrackingPaths =
        forwardTrackingOfPatient.backtrackingPaths.concat(pathsData)
    })

    console.log("ENDE pathsdata für Krankheitsverbreitung forward und backward")

    self.backtrackingByPatient = backtrackingByPatient
    console.log("backtracking", backtrackingByPatient)
    self.forwardtrackingByPatient = forwardtrackingByPatient
    console.log("forwardtrackingByPatient", forwardtrackingByPatient)
    // self.backtrackingByPatient = forwardtrackingByPatient

    self.firstPositions = false
    setTimeout(() => {
      self.firstPositions = true
    }, 10)

    console.log("Simulation STARTED (?)")
    let firstTick = false

    self.simulation.nodes(nodes).on("tick", () => {
      if (!firstTick) {
        firstTick = true
        console.log("first sim tick")
      }
      // if (self.sim_counter >= 100) {
      //   console.log("Simulation STOPPED", self.sim_counter)
      //   self.simulation.stop()
      //   self.stationPathsData.forEach((sp) => {
      //     let totalY = 0
      //     sp.path.forEach((node) => {
      //       totalY += node.y
      //     })
      //     let avgY = totalY / sp.path.length
      //     sp.path.forEach((node) => {
      //       node.y = avgY
      //     })
      //   })
      //   self.resize({
      //     keimID: nr,
      //   })
      //   self.redrawLines()
      //   return
      // }
      self.sim_counter += 1
      self.storylineData.nodes.forEach((d) => {
        let xFactor = d.timestep

        // // 3 Zonen für Screenshots
        // if (self.firstPositions === false) {
        //   if (d.name === "home" || d.space === "home") {
        //     // d.y = self.calcHeight + 50 + pathWidth
        //     d.y = d.y = self.calcHeight + 70 + pathWidth
        //   } else if (d.name === "tmphome" || d.space === "tmphome") {
        //     d.y = d.y = self.calcHeight - 34 + 40
        //   } else {
        //     d.y = d.initPos
        //   }
        // } else {
        //   d.x = xFactor * (calcWidth / timestepsCount)
        //   if (d.name === "home" || d.space === "home") {
        //     d.y = d.y = self.calcHeight + 70 + pathWidth
        //     // d.y = self.calcHeight + 50 + pathWidth
        //   } else if (d.name === "tmphome" || d.space === "tmphome") {
        //     d.y = d.y = self.calcHeight - 34 + 40
        //   } else {
        //     if (d.y < 0) {
        //       d.y = d.initPos
        //     } else if (d.y > self.calcHeight) {
        //       d.y = d.initPos
        //     }
        //   }

        if (self.firstPositions === false) {
          // if (true) {
          // self.firstPositions = true
          if (d.name === "home" || d.space === "home") {
            d.y = 0
          } else if (d.name === "tmphome" || d.space === "tmphome") {
            // d.y = self.yMax
            d.y = self.calcHeight
          } else {
            // d.y = (d.y_0 + d.y_1) / 2
            d.y = d.initPos
          }
        } else {
          d.x = xFactor * (calcWidth / timestepsCount)
          if (d.name === "home" || d.space === "home") {
            // d.y = self.yMin
            d.y = 0
          } else if (d.name === "tmphome" || d.space === "tmphome") {
            // d.y = self.yMax
            d.y = self.calcHeight
          } else {
            // d.y = Math.min(yMin + 1, Math.max(d.y, yMax - 1))
            if (d.y < 0) {
              // d.y = (d.y_0 + d.y_1) / 2
              d.y = d.initPos
            } else if (d.y > self.calcHeight) {
              // d.y = (d.y_0 + d.y_1) / 2
              d.y = d.initPos
            }
            // if (d.y < self.yMin) {
            //   d.y = (self.yMin + self.yMax) / 2
            // } else if (d.y > self.yMax) {
            //   d.y = (self.yMin + self.yMax) / 2
            // }
          }

          /**
           * Falls Knoten noch zu nah beieinander sind, diese auseinander stoßen
           * (für jeden Timestep separat)
           */
          // for (let step = 0; step < self.timestepsCount; step++) {
          //   let abstand =
          //     (self.pathWidth * d.lop.length + 2 * self.pathWidth) / 2
          //   let nodes = self.storylineData.nodes.filter(
          //     n =>
          //       n.space !== "home" &&
          //       n.space !== "tmphome" &&
          //       n.timestep === step
          //   )
          //   for (let i = 0; i < nodes.length; i++) {
          //     for (let k = i + 1; k < nodes.length; k++) {
          //       let diff = nodes[i].y - nodes[k].y
          //       let delta = Math.abs(diff)
          //       if (delta < abstand) {
          //         if (diff > 0) {
          //           nodes[i].y += abstand / 2
          //           nodes[k].y -= abstand / 2
          //         } else {
          //           nodes[i].y -= abstand / 2
          //           nodes[k].y += abstand / 2
          //         }
          //       }
          //     }
          //   }
          // }

          /**
           * Mittelwert der y-Pos aller Knoten eines StationClusterIDs berechnen
           * und auf dessen Knoten verteilen
           */
          self.stationPathsData.forEach((sp) => {
            let totalY = 0
            sp.path.forEach((node) => {
              totalY += node.y
            })
            let avgY = totalY / sp.path.length
            sp.path.forEach((node) => {
              node.y = avgY
            })
          })
        }
      })

      self.resize()
      self.redrawLines()
    })

    self.simulation.force("link").links(links)

    setTimeout(() => {
      if (self.simulation) {
        self.simulation.stop()
        self.redrawLines()
        console.log("Simulation STOPPED")
        console.log("simulation count:", self.sim_counter)
      }
      // }, 30000)
    }, 10000)
  }

  // TODO: copy pasted aus altem Dashboard...
  update_tooltip = (d, i) => {
    let self = this
    let tableObj = "KEINE DATEN ?"

    // tableObj = {
    //     title: i,
    //     header: ["Patient", "Status", "Infizierungs-Datum", "letzter Test"],
    //     content: []
    // }

    if (i === "station") {
      tableObj = {
        title: "Station S" + d.source.stationID,
        header: ["Patient", "Status"],
        content: [],
      }
      d.lop.forEach((pid, index) => {
        let keimInfos =
          self.parsedData.patients["P" + pid].keimeInfos[
            "K" + self.parameters.pathogen
          ]

        if (keimInfos === undefined) {
          keimInfos = {
            erstesPositiv: undefined,
            letztesNegativ: undefined,
            positive: [],
            negative: [],
          }
        }

        let status = "Unbekannt"

        if (
          keimInfos.erstesPositiv !== undefined &&
          d.source.timestamp >= keimInfos.erstesPositiv
        ) {
          status = "Krank"
        } else if (
          keimInfos.letztesNegativ !== undefined &&
          d.source.timestamp >= keimInfos.letztesNegativ
        ) {
          status = "Träger"
        } else if (
          keimInfos.letztesNegativ !== undefined ||
          keimInfos.erstesPositiv !== undefined
        ) {
          status = "wird Krank/ Träger"
        }
        tableObj.content.push([pid, status])
      })
    } else {
      tableObj = i + " not defined"
    }

    // self.setState({
    //   info: [tableObj],
    // })
    if (Array.isArray(tableObj)) {
      this.props.update_tooltip(tableObj)
      // self.setState((prevState) => {
      //   prevState.info = tableObj
      //   return prevState
      // })
    } else {
      this.props.update_tooltip([tableObj])
      // self.setState((prevState) => {
      //   prevState.info = [tableObj]
      //   return prevState
      // })
    }
  }

  selectPatient = (e) => {
    let self = this
    console.log(e)
    let pid = e.patientID
    let newLOP = []
    if (self.selectedPatients.includes(pid)) {
      newLOP = self.selectedPatients.filter((d) => d !== pid)
    } else {
      newLOP = self.selectedPatients
      newLOP.push(pid)
    }
    self.setState((prevState) => {
      prevState.selectedPatients = newLOP
      prevState.selectedPatientsString = String(newLOP)
      return prevState
    })
    self.selectedPatients = newLOP

    self.redrawLines()
  }

  selectPatients = (e) => {
    let self = this
    console.log(e)
    let pid = e.patientID
    let lop = e.lop
    let newLOP = []

    let allSelected = true
    lop.forEach((p) => {
      if (!self.selectedPatients.includes(p)) {
        allSelected = false
      }
    })

    if (allSelected) {
      newLOP = self.selectedPatients
      lop.forEach((p) => {
        if (self.selectedPatients.includes(p)) {
          newLOP = newLOP.filter((d) => d !== p)
        }
      })
    } else {
      newLOP = self.selectedPatients
      newLOP = newLOP.concat(lop)
    }
    self.setState((prevState) => {
      prevState.selectedPatients = newLOP
      prevState.selectedPatientsString = String(newLOP)
      return prevState
    })
    self.selectedPatients = newLOP

    self.redrawLines()
  }

  selectStation = (e) => {
    let self = this

    let stationID = e.source.stationID
    console.log(e)
    if (stationID === "home" || stationID === "tmphome") {
      console.log("HOME ODER MTPHOME")
    } else {
      console.log(e)
    }
    // return
    let newLOS = []

    let stationSelected = true
    // lop.forEach(p => {
    if (!self.selectedStations.includes(stationID)) {
      stationSelected = false
    }
    // })

    if (stationSelected) {
      newLOS = self.selectedStations.filter((d) => d !== stationID)
    } else {
      newLOS = self.selectedStations
      newLOS.push(stationID)
    }
    self.setState((prevState) => {
      prevState.selectedStations = newLOS
      prevState.selectedStationsString = String(newLOS)
      return prevState
    })
    self.selectedStations = newLOS

    self.redrawLines()
  }

  redrawLines = () => {
    let self = this

    let keimID = self.parameters.pathogen

    if (keimID === undefined || self.graphen["K" + keimID] === undefined) {
      return
    }
    /**
     * liinks zum debuggen
     */

    let linksToShow = self.storylineData.links.filter(
      (d) =>
        d.source.space !== "home" &&
        d.target.space !== "home" &&
        d.source.space !== "tmphome" &&
        d.target.space !== "tmphome" &&
        d.connectionLink !== true
    )

    // let color2 = d3.scaleOrdinal(d3.schemeCategory20) //TODO

    // let links = self.gLinks.selectAll("line").data(self.storylineData.links)
    // TODO:
    // let links = self.gLinks.selectAll("line").data([linksToShow])
    let links = self.gLinks.selectAll("line").data([])

    links
      .enter()
      .append("line")
      .attr("class", "debuggingLine")
      .merge(links)
      .attr("opacity", 0)
      .attr("cursor", "pointer")
      // .attr("stroke-width", 5)
      .attr("stroke-width", (d) => {
        if (d.connectionLink) {
          return 10
        }
        return d.lop.length * self.pathWidth + 6
      })
      .on("click", (d) => {
        if (d.connectionLink) {
          return
        }

        if (self.state.getClickMode == 0) {
          self.selectStation(d)
        } else if (self.state.getClickMode == 1) {
          self.selectPatients(d)
        }
      })
      .on("mouseenter", (d) => {
        self.update_tooltip(d, "station")
      })
      .on("mousemove", () => {
        let mousePosX = d3.event.pageX
        let mousePosY = d3.event.pageY
        self.props.move_tooltip(mousePosX, mousePosY)
        self.props.show_tooltip()
      })
      .on("mouseout", () => {
        self.props.hide_tooltip()
      })
      // .attr("stroke", "black")
      .attr("stroke", (d) => {
        // return color2(d.source.stationID)
        return self.ward_color(d.source.stationID)
      })
      .attr("x1", (d) => {
        // console.log(d.source.x)
        return self.scaleTimestampToX(d.source.timestamp)
      })
      .attr("x2", (d) => {
        // console.log(d.target.x)
        return self.scaleTimestampToX(d.target.timestamp)
      })
      .attr("y1", (d) => {
        // console.log(d.source.y)
        return self.scaleCalcHeightToY(d.source.y)
      })
      .attr("y2", (d) => {
        // console.log(d.target.y)
        return self.scaleCalcHeightToY(d.target.y)
      })

    links.exit().remove()

    let backtrackingData = []
    let trackingLines = []
    if (self.state.getCircles == 1) {
      if (
        self.criticalPatient &&
        self.state.getVerbreitungsrichtung == 1 &&
        self.backtrackingByPatient["P" + self.criticalPatient]
      ) {
        let d = self.backtrackingByPatient["P" + self.criticalPatient]
        // trackingLines = d.lines
        if (d !== undefined) {
          d.kontaktPatienten.forEach((kp) => {
            backtrackingData.push(kp)
          })
          d.lines.forEach((l) => {
            trackingLines.push(l.pointNodes)
          })
          // Grad 2
          d.grad2Contacts.forEach((g2c) => {
            backtrackingData.push(g2c)
          })
          d.grad2Lines.forEach((g2l) => {
            trackingLines.push(g2l.pointNodes)
          })
        }
        backtrackingData = backtrackingData.concat(d.eigeneEvents)
      } else if (
        self.criticalPatient &&
        self.state.getVerbreitungsrichtung == 2 &&
        self.forwardtrackingByPatient["P" + self.criticalPatient]
      ) {
        let d = self.forwardtrackingByPatient["P" + self.criticalPatient]
        // trackingLines = d.lines
        if (d !== undefined) {
          d.kontaktPatienten.forEach((kp) => {
            backtrackingData.push(kp)
          })
          d.lines.forEach((l) => {
            trackingLines.push(l.pointNodes)
          })
        }
        backtrackingData = backtrackingData.concat(d.eigeneEvents)
      }
    }

    // if (self.state.getVerbreitungsrichtung == 1) {
    //   console.log(backtrackingData, trackingLines)
    // } else if (self.state.getVerbreitungsrichtung == 2) {
    // }

    // if (self.criticalPatient)
    //   console.log(self.criticalPatient, backtrackingData)

    let flashCircles = self.gFlashCircles
      // .selectAll("circle")
      .selectAll("ellipse")
      .data(backtrackingData)

    flashCircles
      .enter()
      // .append("circle")
      .append("ellipse")
      .merge(flashCircles)
      // .attr("class", (d) => {
      //   let classString = "flashCircle"

      //   if (d.eigenesEvent === true) {
      //     classString += " eigenesEvent eigenesEvent-" + d.newStatus
      //   } else {
      //     classString +=
      //       " flash-grad" + d.kontaktGrad + " flashpotential-" + d.pbStatus
      //   }
      //   // if (d.node.node.node == 164) {
      //   //   classString = "YELLOWCIRCLE"
      //   // }
      //   return classString
      // })
      .attr("stroke-width", (d) => {
        let r = 2
        if (d.eigenesEvent === true) {
          r = 5
        }
        return r
      })
      .attr("stroke", (d) => {
        let r = "black"
        if (d.eigenesEvent === true) {
          r = "black"
          if (d.newStatus === "traeger") {
            r = "rgb(255, 127, 0)"
          } else if (d.newStatus === "krank") {
            r = "rgb(215, 25, 28)"
          }
        }
        return r
      })
      .attr("fill", (d) => {
        let r = "none"
        // if (d.eigenesEvent === true) {
        //   if (d.newStatus === "traeger") {
        //     r = "rgba(255, 127, 0, 0.15)"
        //   } else if (d.newStatus === "krank") {
        //     r = "rgba(215, 25, 28, 0.15)"
        //   }
        // }
        return r
      })
      .attr("stroke-dasharray", (d) => {
        return d.eigenesEvent === true ? "5" : ""
      })
      .attr("pointer-events", "none")
      .attr("cx", (d) => {
        let ts = d.node.timestamp
        let node = d.node.node
        if (node.nodeType === "movement") {
          let timestampDiff = Math.min(
            node.timestamp - node.timestampBefore,
            node.timestampAfter - node.timestamp
          )
          timestampDiff = timestampDiff / 2
          if (node.relevantType === "source") {
            ts = node.timestamp - timestampDiff
          } else if (node.relevantType === "target") {
            ts = node.timestamp + timestampDiff
          }
        }
        return self.scaleTimestampToX(ts)
      })
      .attr("cy", (d) => self.scaleCalcHeightToY(d.node.node.y))
      // .attr("r", d => {
      //   return (self.pathWidth * d.node.patientCount) / 2 + 4
      // })
      .attr("ry", (d) => {
        let r = (self.pathWidth * d.node.patientCount) / 2 + 4
        if (d.eigenesEvent === true) r = r * 2
        return r
      })
      .attr("rx", (d) => {
        let r = (self.pathWidth * d.node.patientCount) / 2 + 4
        if (d.eigenesEvent === true) r = r / 2
        return r
      })
    // .attr("fill", "black")

    flashCircles.exit().remove()

    let flashLines = self.gFlashLines.selectAll("path").data(trackingLines)

    flashLines
      .enter()
      .append("path")
      .merge(flashLines)
      // .attr("class", (d) => {
      //   let classString = "flashLine"
      //   return classString
      // })
      .attr("fill", "none")
      .attr("stroke-width", 2)
      .attr("stroke", "black")
      .attr("stroke-dasharray", 5)
      .attr("pointer-events", "none")
      .attr("d", (d) => self.flashLineInterpolation(d))

    flashLines.exit().remove()

    let circles = self.gCircles
      .selectAll("circle")
      .data(self.storylineData.nodes)
    // .data(backtrackingData)

    // console.log(self.storylineData.nodes)

    circles
      .enter()
      .append("circle")
      .attr("class", "debuggingCircle")
      .merge(circles)
      .attr("cx", (d) => self.scaleTimestampToX(d.timestamp))
      .attr("cy", (d) => self.scaleCalcHeightToY(d.y))
      .attr("r", 5)
      .attr("fill", "black")
      .attr("opacity", 0)
      .attr("pointer-events", "none")
    // .call(
    //   d3
    //     .drag()
    //     .on("start", d => {
    //       if (!d3.event.active) self.simulation.alphaTarget(0.3).restart()
    //       d.fx = null
    //       // d.fy = self.scaleCalcHeightToY(d.y)
    //       d.fy = d.x + self.yMin
    //       // console.log(d.y)
    //     })
    //     .on("drag", d => {
    //       d.fx = null
    //       d.fy = d3.event.y * self.reverseFactor
    //       // d.fy = self.reverseScaleCalcHeightToY(d.y)
    //     })
    //     .on("end", d => {
    //       if (!d3.event.active) self.simulation.alphaTarget(0)
    //       d.fx = null
    //       d.fy = null
    //     })
    // )

    circles.exit().remove()

    let filteredPaths = self.stationPathsData.filter(
      (d) => d.stationID !== "home" && d.stationID !== "tmphome"
    )

    /**
     * liinks zum debuggen ende
     */
    let stationPaths = self.gStationPaths
      .selectAll("path")
      // .data(self.stationPathsData)
      .data(filteredPaths)

    /**
     * Stationsfarben
     */
    // let color = (self.color = d3.scaleOrdinal(d3.schemeCategory20))
    let color = (self.color = d3.scaleOrdinal().range([
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
    ])).domain(self.all_stations)

    stationPaths
      .enter()
      .append("path")
      .merge(stationPaths)
      // .attr("class", (d) => {
      //   let classString = "stationBubblePath"
      //   if (!self.selectedStations.includes(d.stationID)) {
      //     classString += " hiddenStation"
      //   }
      //   return classString
      // })
      .attr("fill", "none")
      .attr("stroke-linecap", "round")
      .attr("opacity", (d) => {
        let o = 0.8
        if (!self.selectedStations.includes(d.stationID)) {
          o = 0
        }
        return o
      })
      .attr("d", (d) => self.stationInterpolation(d.path))
      .attr("stroke-width", (d) => d.maxPatients * self.pathWidth + 6)
      // .attr("stroke", d => color(d.stationID))
      .attr("stroke", (d) => {
        if (self.selectedStations.includes(d.stationID))
          return color(d.stationID)
        else return "#ffffff"
      })
    // .attr("filter", d => `url(#stationClusterBlur${d.stationClusterID})`)

    stationPaths.exit().remove()

    // self.pathsData = self.pathsData.filter(d => d.status !== "statusUnbekannt")

    let dataForPath = self.pathsData
    if (self.state.getBewegungslinien == 1) {
      // if (
      //   self.state.getBewegungslinien == 1 ||
      //   self.state.getBewegungslinien == 0
      // ) {
      dataForPath = self.pathsDataNoMovements
    } else if (
      self.state.getAnzeigeart == 2 &&
      self.criticalPatient &&
      self.state.getVerbreitungsrichtung == 1 &&
      self.backtrackingByPatient["P" + self.criticalPatient]
    ) {
      dataForPath =
        self.backtrackingByPatient["P" + self.criticalPatient].backtrackingPaths
    } else if (
      self.state.getAnzeigeart == 2 &&
      self.criticalPatient &&
      self.state.getVerbreitungsrichtung == 2 &&
      self.backtrackingByPatient["P" + self.criticalPatient]
    ) {
      dataForPath =
        self.forwardtrackingByPatient["P" + self.criticalPatient]
          .backtrackingPaths
    }

    let paths = self.gPaths
      .selectAll("path")
      // .data(self.pathsData)
      // .data(self.pathsDataNoMovements)
      .data(dataForPath)

    // console.log(self.pathsData)

    paths
      .enter()
      .append("path")
      .merge(paths)
      // .attr("class", (d) => {
      //   let classString = `patientPath path_patient_${d.patientID}`
      //   classString += ` ${d.status}`
      //   if (self.state.getAnzeigeart == 0) {
      //     classString += ` ${"selectedPatient"}`
      //   } else if (self.state.getAnzeigeart == 1) {
      //     classString += ` ${
      //       self.selectedPatients.includes(d.patientID)
      //         ? "selectedPatient"
      //         : "not-selectedPatient"
      //     }`
      //   } else if (self.state.getAnzeigeart == 2) {
      //     // hier muss eine Verbreitungsrichtung ausgewählt sein
      //     // ansonsten einfach alle anzeigen
      //     if (self.state.getVerbreitungsrichtung == 0) {
      //       classString += ` ${"selectedPatient"}`
      //     } else {
      //     }
      //   }

      //   if (self.criticalPatient == d.patientID) {
      //     classString += " criticalPatient"
      //   }

      //   /**
      //    * Um alle Movementlinien IMMER 1px zu machen, WENN SIE NACH HAUSE GEHEN:
      //    * if movementPath === true
      //    * AND
      //    * d.path[3].space === "home"
      //    */
      //   // if (d.movementPath) console.log(d)
      //   // if (
      //   //   (self.state.getBewegungslinien == 1 && d.movementPath === true) ||
      //   //   (self.state.getBewegungslinien == 0 &&
      //   //     d.movementPath === true &&
      //   //     d.path[3].node.space == "home")
      //   // ) {
      //   //   classString += " movementPath"
      //   // }
      //   if (d.movementPath === true) {
      //     classString += " movementPath"
      //   }
      //   // ---------------------
      //   // classString += ` ${
      //   //   self.selectedPatients.includes(d.patientID)
      //   //     ? "selectedPatient"
      //   //     : "not-selectedPatient"
      //   // }`
      //   if (d.notRelevant === true) {
      //     classString += " pathNotRelevant"
      //   }
      //   return classString
      // })
      .attr("d", (d) => self.interpolation(d.path))
      .attr("fill", (d) => {
        let r = "none"

        return r
      })
      .attr("stroke-width", (d) => {
        let r = 5

        if (d.movementPath === true) {
          r = 1
        }
        if (self.criticalPatient == d.patientID) {
          r = 7
        }
        if (d.notRelevant === true) {
          r = 1
        }
        return r
      })
      .attr("opacity", (d) => {
        let r = 1
        if (self.state.getAnzeigeart == 0) {
          r = 0.8
        } else if (self.state.getAnzeigeart == 1) {
          r = ` ${self.selectedPatients.includes(d.patientID) ? 0.8 : 0.2}`
        } else if (self.state.getAnzeigeart == 2) {
          // hier muss eine Verbreitungsrichtung ausgewählt sein
          // ansonsten einfach alle anzeigen
          if (self.state.getVerbreitungsrichtung == 0) {
            r = 0.8
          }
        }

        if (self.criticalPatient == d.patientID) {
          r = 1
        }
        if (d.notRelevant === true) {
          r = 0.5
        }
        return r
      })
      // .attr("pointer-events", "none")
      .attr("pointer-events", "visiblePainted")
      .attr("stroke", (d) => {
        let c = "black"
        switch (d.status) {
          case "statusUnbekannt":
            c = "rgb(55, 126, 184)"
            // c = "rgb(100, 100, 100)"
            break
          case "statusGesund":
            c = "rgb(55, 126, 184)"
            // c = "rgb(100, 100, 100)"
            break
          case "statusHoltKeim":
            // c = "rgb(55, 126, 184)"
            c = "rgb(100, 100, 100)"
            break
          case "statusAnsteckung":
            c = "rgb(255, 127, 0)"
            break
          case "statusTraeger":
            c = "rgb(255, 127, 0)"
            break
          case "statusInfiziert":
            c = "rgb(215, 25, 28)"
            break
          case "statusKrank":
            c = "rgb(215, 25, 28)"
            break
        }
        return c
      })

    paths.exit().remove()
  }

  switchClickMode = (e) => {
    let self = this
    let nr = e.target.value
    this.setState((prevState) => {
      prevState.getClickMode = nr
      return prevState
    })
  }

  switchAnzeigeart = (e) => {
    console.log("anzeigeart switched", e)
    // return
    let self = this
    let nr = e.target.value
    this.setState((prevState) => {
      prevState.getAnzeigeart = nr
      return prevState
    })
    setTimeout(() => {
      self.redrawLines()
    }, 100)
  }

  switchVerbreitungsrichtung = (e) => {
    console.log("verbreitungsrichtung switched", e)
    // return
    let self = this
    let nr = e.target.value
    this.setState((prevState) => {
      prevState.getVerbreitungsrichtung = nr
      return prevState
    })
    setTimeout(() => {
      self.redrawLines()
    }, 100)
  }

  selectedPatientsChanged = (e) => {
    let self = this
    const val = e.target.value
    let newlop = val.split(",")
    // newlop.forEach((p, i) => {
    //   newlop[i] = Number(p)
    // })
    // newlop = newlop.filter((v) => !isNaN(v) && v > 0)
    let uniqueNumbersOnlyLOP = [...new Set(newlop)]
    self.setState((prevState) => {
      prevState.selectedPatientsString = val
      prevState.selectedPatients = uniqueNumbersOnlyLOP
      return prevState
    })
    self.selectedPatients = uniqueNumbersOnlyLOP
    self.redrawLines()
  }

  switchBewegungslinien = (e) => {
    console.log("bewegungslinien switched", e)
    // return
    let self = this
    let nr = e.target.value
    this.setState((prevState) => {
      prevState.getBewegungslinien = nr
      return prevState
    })
    setTimeout(() => {
      self.redrawLines()
    }, 100)
  }

  switchCircles = (e) => {
    console.log("circles switched", e)
    // return
    let self = this
    let nr = e.target.value
    this.setState((prevState) => {
      prevState.getCircles = nr
      return prevState
    })
    setTimeout(() => {
      self.redrawLines()
    }, 100)
  }

  select_station = (d) => {
    let self = this

    if (self.selectedStations.includes(d)) {
      self.selectedStations = self.selectedStations.filter((s) => s !== d)
    } else {
      self.selectedStations.push(d)
    }
    self.setState(
      (prevState) => (prevState.selectedStations = self.selectedStations)
    )

    // self.draw_vis()
    self.redrawLines()
  }

  render() {
    let self = this

    let station_color_legend_names = []
    // let station_color_legend_colors = []
    self.state.stations.forEach((s, i) => {
      let col = self.default_movement_color
      if (self.state.selectedStations.includes(s.name)) {
        col = s.color
      }
      station_color_legend_names.push(
        <th
          style={{
            background: col,
            border: "1px solid black",
            cursor: "pointer",
            padding: "0px 5px 0px 5px",
          }}
          onClick={() => {
            self.select_station(s.name)
          }}
          key={s.name}
        >
          {s.name}
        </th>
      )
      // station_color_legend_colors.push(
      //   <td style={{ background: s.color, height: "20px" }}></td>
      // )
    })

    const clickOptions = [
      <option key={"click0"} value={0}>
        Stations-Auswahl
      </option>,
      <option key={"click1"} value={1}>
        Patienten-Auswahl
      </option>,
    ]

    const anzeigeartOptions = [
      <option key={"anzeige0"} value={0}>
        alle Patienten
      </option>,
      <option key={"anzeige1"} value={1}>
        ausgewählte Patienten
      </option>,
      <option key={"anzeige2"} value={2}>
        Übertragungsweg
      </option>,
    ]

    const verbreitungsrichtungOptions = [
      <option key={"richtung0"} value={0}>
        keine Hypothesen
      </option>,
      <option key={"richtung1"} value={1}>
        Rückverfolgung
      </option>,
      <option key={"richtung2"} value={2}>
        Übertragungsgefahr
      </option>,
    ]

    const movementPathOptions = [
      <option key={"movementpath0"} value={0}>
        Linienstärke: normal
      </option>,
      <option key={"movementpath1"} value={1}>
        Linienstärke: dünn
      </option>,
    ]

    const header = []
    const farben = []

    // let selected_stations = JSON.parse(
    //   JSON.stringify(self.state.selectedStations)
    // )
    // selected_stations.sort((a, b) => a - b)

    // selected_stations.forEach((stationID) => {
    //   header.push(<th>{"S" + stationID}</th>)
    //   let col = {
    //     backgroundColor: self.color(stationID),
    //   }
    //   farben.push(
    //     <td>
    //       <div className="legendenFarbe" style={col} />
    //     </td>
    //   )
    // })

    let tabelle = (
      <table>
        <tr>{header}</tr>
        <tr>{farben}</tr>
      </table>
    )

    const eventCirclesOptions = [
      <option key={"eventcircle0"} value={0}>
        Hypothesen nicht hervorheben
      </option>,
      <option key={"eventcircle01"} value={1}>
        Hypothesen hervorheben
      </option>,
    ]

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

    let element_to_draw = null
    if (this.props.get_original_data("storyline") === undefined) {
      element_to_draw = (
        <div className="error_message">{this.translate("no_data_loaded")}</div>
      )
      if (this.props.waiting_for_data) {
        element_to_draw = (
          <div className="error_message" style={{ cursor: "wait" }}>
            <div className="loader"></div>
            {this.translate("loading_data")}
          </div>
        )
      }
    }

    if (element_to_draw === null && this.state.too_small) {
      element_to_draw = (
        <div className="too_small">{this.translate("viewport_too_small")}</div>
      )
    }

    return (
      <div
        ref={(element) => (this.module_container = element)}
        className="module_container"
      >
        <div
          className="svgStorylineContainer"
          style={
            element_to_draw !== null
              ? {
                  top: "0px",
                  height: "100%",
                  width: "100%",
                  position: "absolute",
                }
              : this.state.optionsOpen
              ? {
                  top: "140px",
                  height: "calc(100% - 140px)",
                  width: "100%",
                  position: "absolute",
                }
              : {
                  top: "30px",
                  height: "calc(100% - 30px)",
                  width: "100%",
                  position: "absolute",
                }
          }
        >
          {element_to_draw}
          <svg
            className="svgRoot storylineSVG"
            ref={(element) => (this.svgRoot = element)}
            style={{
              pointerEvents: "all",
              display: element_to_draw === null ? "block" : "none",
            }}
          />
        </div>
        <div
          className="storylineOptions"
          style={{
            position: "absolute",
            // top: "10px",
            // left: "25px",
            display:
              this.state.optionsOpen && element_to_draw === null
                ? "block"
                : "none",
          }}
        >
          <select
            className="clickmodeInput"
            onChange={this.switchClickMode}
            value={this.state.getClickMode}
          >
            {clickOptions}
          </select>
          <select
            className="anzeigeInput"
            onChange={this.switchAnzeigeart}
            value={this.state.getAnzeigeart}
          >
            {anzeigeartOptions}
          </select>
          <select
            className="richtungInput"
            onChange={this.switchVerbreitungsrichtung}
            value={this.state.getVerbreitungsrichtung}
          >
            {verbreitungsrichtungOptions}
          </select>
          <select
            className="movlinesInput"
            onChange={this.switchBewegungslinien}
            value={this.state.getBewegungslinien}
          >
            {movementPathOptions}
          </select>
          <select
            className="circlesInput"
            onChange={this.switchCircles}
            value={this.state.getCircles}
          >
            {eventCirclesOptions}
          </select>
          <div
            className="filter-input selPatientsInput"
            style={{ paddingBottom: 0 }}
          >
            <span
              className="clickable-span"
              onClick={(e) => {
                let allSelected = true
                self.allPatients.forEach((p) => {
                  if (!self.selectedPatients.includes(p)) {
                    allSelected = false
                  }
                })
                let newList = []

                if (!allSelected) {
                  newList = self.allPatients
                }

                self.setState((prevState) => {
                  prevState.selectedPatients = newList
                  prevState.selectedPatientsString = String(newList)
                  return prevState
                })
                self.selectedPatients = newList

                self.redrawLines()
              }}
            >
              {self.props.translate("selpatients", self.state.lang)}
            </span>
            <input
              className="langerInput"
              onChange={this.selectedPatientsChanged}
              value={this.state.selectedPatientsString}
            />
          </div>
          {/* und selected station legende */}
          <div
            className="filter-input critPatientInput"
            style={{ paddingBottom: 0 }}
          >
            <span>kritischer Patient</span>
            <input
              className="langerInput"
              onChange={this.criticalPatientChanged}
              value={this.state.criticalPatientString}
            />
          </div>
        </div>
        <div
          className="testdiv2"
          style={{
            position: "absolute",
            top: "2px",
            left: "25px",
          }}
        >
          {
            // <table style={{ border: "1px solid black" }}>
            <table>
              <tbody>
                <tr>{station_color_legend_names}</tr>
                {/* <tr>{station_color_legend_colors}</tr> */}
              </tbody>
            </table>
          }
        </div>
        <div
          className="closeButton"
          style={{
            display: element_to_draw === null ? "block" : "none",
          }}
          onClick={() => {
            this.setState((prevState) => {
              prevState.optionsOpen = !prevState.optionsOpen
              return prevState
            })
          }}
        >
          {this.state.optionsOpen ? "X" : "O"}
        </div>
      </div>
    )
  }
}

export default Storyline
