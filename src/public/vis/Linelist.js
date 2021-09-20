import { Component } from "react"
import * as d3 from "d3"
import moment from "moment"
import "./linelist.css"

class Linelist extends Component {
  constructor(props) {
    super(props)

    /**
     * TODO: hier für das Module feste Parameter/"globale" variablen
     */
    this.state = {
      stations: [],
      selected_stations: [],
    }
    this.selected_stations = []

    this.data
    this.parameters
    this.timestamp

    this.width
    this.height

    this.socket = props.socket.client
    this.translate = props.translate
    this.get_color = props.get_color

    this.default_movement_color = "lightgray"

    this.margin = {
      top: 25,
      bottom: 25,
      left: 25,
      right: 25,
    }

    this.title = "Linelist"

    this.transition_duration = 200
    this.row_height = 50
    // this.movement_rectangle_height = this.row_height / 5
    this.movement_rectangle_height = this.row_height / 8
    this.investigation_rectangle_height = (this.row_height / 8) * 6
    this.investigation_rect_width = 10

    this.treatment_circle_r = this.movement_rectangle_height / 2

    this.title_height = 50
    this.timestamp_height = 25

    /**
     * Variables
     */
    this.zoom = 1
    this.lastZoomK = 1
    this.lastZoomX = 0
    this.lastTransformedX = 0

    this.currentPixelOffset = 0

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
     * = margin bars außenrum
     */
    this.vis_margin = {
      top: 50,
      // top: this.title_height + this.timestamp_height * 2,
      // top: 0,
      bottom: 50,
      left: 50,
      right: 0,
    }

    this.v_margin_bars_data = [
      {
        x: () => this.width - this.vis_margin.right,
        y: () => 0,
        width: () => this.vis_margin.right,
        height: () => this.height,
      },
      {
        x: () => 0,
        y: () => 0,
        width: () => this.vis_margin.left,
        height: () => this.height,
      },
    ]

    this.h_margin_bars_data = [
      {
        x: () => 0,
        y: () => 0,
        width: () => this.width,
        height: () => this.vis_margin.top,
      },

      {
        x: () => 0,
        y: () => this.height - this.vis_margin.bottom,
        width: () => this.width,
        height: () => this.vis_margin.bottom,
      },
    ]
  }

  // TODO: das ist copy pasted vom alten Dashboard...
  update_tooltip = (d, i) => {
    let self = this
    let tableObj = "KEINE DATEN ?"

    // tableObj = {
    //     title: i,
    //     header: ["Patient", "Status", "Infizierungs-Datum", "letzter Test"],
    //     content: []
    // }

    // let datumformat = this.translate("dateFormat", lang)
    // let lang = this.props.selectedLang
    // let datumformat = this.translate("dateFormat", lang)
    if (i === "link") {
      let momentB = moment(d.begin)
      let momentE = moment(d.end)
      let duration = moment.duration(momentE.diff(momentB))
      let months = duration.months()
      let days = duration.days()
      let hrs = duration.hours()
      let mins = duration.minutes()
      let secs = duration.seconds()

      tableObj = {
        title: "Patient " + d.patient_id + " Station " + d.station_id,
        header: ["DataName", "Value"],
        content: [
          // ["Bewegungsart", d.Bewegungsart_l],
          // ["Bewegungstyp", d.Bewegungstyp],
          // ["CaseType", d.CaseType_l],
          // ["Patient", d.patient_id],
          // ["Station", d.station_id],
          [
            this.translate("duration"),
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
            this.translate("begin"),
            momentB.format(this.translate("dateFormat")) + " Uhr",
          ],
          [
            this.translate("end"),
            momentE.format(this.translate("dateFormat")) + " Uhr",
          ],
          // ["FallID", d.FallID],
          // ["id", d.id],
        ],
      }
      // tableObj.content.push(["link", "link", "link", "link"])
    } else if (i === "inspec") {
      let insDate = moment(d.timestamp)
      let c = "white"
      switch (d.result) {
        case "negative":
          c = this.get_color("negative")
          break
        case "infected":
          c = this.get_color("infectedCarrier")
          break
        case "diseased":
          c = this.get_color("infectedDiseased")
          break
      }

      tableObj = {
        header_color: c,
        title:
          // "P" +
          d.patient_id +
          " | " +
          insDate.format(this.translate("dateFormat")) +
          " Uhr | Result: " +
          d.result,
        header: [
          //   this.translate("result"),
          //   this.translate("pathogen"),
          //   this.translate("antibiotika"),
          //   this.translate("material"),
          //   this.translate("id"),
          this.translate("KeimID"),
          this.translate("MREclass"),
          this.translate("material"),
          this.translate("ResultComment"),
        ],
        content: [],
      }

      d.data.forEach((o) => {
        tableObj.content.push([
          // o.Ergebnis_k,
          // o.Keim_k,
          // o.Antibiotikum_l,
          // o.Material_l,
          // o.id,
          o.KeimID,
          o.MREKlasseID,
          o.Material_l,
          o.Befundkommentar,
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

    this.props.update_tooltip([tableObj])
  }

  componentDidMount() {
    let self = this

    console.log("linelist module did mount")

    this.socket.on("linelist", this.handle_data)

    /**
     * Modul auf Größenänderung alle 100ms überprüfen.
     * Falls eine Größenänderung vorliegt, die Visualisierung resizen.
     */
    this.checkSize = setInterval(() => {
      let newWidth = parseInt(d3.select(self.svgRoot).style("width"))
      let newHeight = parseInt(d3.select(self.svgRoot).style("height"))
      if (newWidth !== self.width || newHeight !== self.height) {
        self.width = newWidth
        self.height = newHeight
        // console.log(`newWidth: ${newWidth}, newHeight: ${newHeight}`)
        // if (self.data) {
        self.draw_vis()
        // }
      }
    }, 100)

    this.width = parseInt(d3.select(self.svgRoot).style("width"))
    this.height = parseInt(d3.select(self.svgRoot).style("height"))

    let mouseLine = (this.mouseLine = () => {
      if (!self.data) {
        return
      }

      let containerWidth = parseInt(d3.select(self.svgRoot).style("width"))
      let containerHeight = parseInt(d3.select(self.svgRoot).style("height"))
      let offsetX = d3.event.offsetX - self.lastTransformedX
      self.offsetX = offsetX
      self.gUIContainer
        .selectAll(".mouseLine")
        .attr(
          "transform",
          "translate(" + (offsetX + self.lastTransformedX) + ",0)"
        )
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("y1", self.vis_margin.top)
        .attr("y2", self.height - self.vis_margin.bottom / 2)

      let newText = offsetX
      if (self.scaleReverseX) {
        newText =
          moment(self.scaleReverseX(offsetX)).format(
            self.translate("dateFormat")
          ) + " Uhr"
      }

      let anchor = "middle"
      if (offsetX > containerWidth / 2) {
        anchor = "end"
      } else if (offsetX < containerWidth / 2) {
        anchor = "start"
      }

      // self.gGraphics
      self.gUIContainer
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
            (containerHeight - self.vis_margin.bottom / 2) +
            ")"
        )
        .attr("text-anchor", anchor)

      let patientLabel = self.gUIContainer
        .selectAll(".patientLabel")
        .data(self.data.patientList)

      // let inspecHeight =
      //   self.state.getMinimaleAnzeige === 0 ? self.inspecHeight : 0

      let inspecHeight = 0

      patientLabel
        .enter()
        .append("text")
        .merge(patientLabel)
        .attr("class", "patientLabel")
        // .text((d) => "P" + d)
        // .text((d) => d)
        .text((d, i) => {
          let y_offset =
            self.height -
            self.vis_margin.bottom -
            i * self.row_height -
            // + self.rowHeight
            inspecHeight -
            // self.labelMargin +
            2 +
            self.currentPixelOffset
          if (
            y_offset < self.vis_margin.top ||
            y_offset > self.height - self.vis_margin.bottom
          ) {
            return ""
          } else {
            return d
          }
        })
        // .attr("font-size", self.labelHeight)
        .attr("font-size", 12)
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
            (false
              ? containerWidth - self.lastTransformedX
              : offsetX + self.lastTransformedX) +
            "," +
            (self.height -
              self.vis_margin.bottom -
              i * self.row_height -
              // + self.rowHeight
              inspecHeight -
              // self.labelMargin +
              2 +
              self.currentPixelOffset +
              // 0 +
              ")")
        )
        .attr("text-anchor", false ? "end" : anchor)

      patientLabel.exit().remove()
    })

    let zoom = d3.zoom().on("zoom", () => {
      let containerWidth = parseInt(d3.select(self.svgRoot).style("width"))
      // let mitteModul = containerWidth / 2
      // statt Mitte Modul die Mausposition:
      if (!d3.event.sourceEvent) {
        // Wenn es null oder undefined oder so ist...
        console.error("d3.event.sourceEvent gibt fehler ?")
        return
      }
      let mitteModul = d3.event.sourceEvent.offsetX
      if (d3.event.sourceEvent.type === "wheel") {
        let prozentVerschiebung =
          (self.lastTransformedX - mitteModul) / (containerWidth * self.zoom)

        let newK = d3.event.transform.k
        if (newK > self.lastZoomK) {
          // rangezoomt
          self.zoom = self.zoom * 1.1
        } else {
          self.zoom = self.zoom / 1.1
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

        let calculatedX =
          prozentVerschiebung * self.zoom * containerWidth + mitteModul

        if (self.zoom === 1) {
          calculatedX = 0
        }
        self.draw_vis(true)

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
          "translate(" + calculatedX + " " + self.currentPixelOffset + ")"
        )

        self.gGridlines.attr(
          "transform",
          "translate(" +
            calculatedX +
            " " +
            // (self.height - self.svgMarginY / 2) +
            (this.height - this.margin.bottom / 2) +
            ")"
        )
        // let inspecHeight = 0
        // self.gUIContainer.selectAll(".patientLabel").attr(
        //   "transform",
        //   (d, i) =>
        //     "translate(" +
        //     ((self.offsetX || 0) + self.lastTransformedX) +
        //     "," +
        //     (self.height -
        //       self.vis_margin.bottom -
        //       i * self.row_height -
        //       // + self.rowHeight
        //       inspecHeight -
        //       // self.labelMargin +
        //       2 +
        //       self.currentPixelOffset +
        //       // 0 +
        //       ")")
        // )
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
          "translate(" + calculatedX + " " + self.currentPixelOffset + ")"
        )
        self.gGridlines.attr(
          "transform",
          "translate(" +
            calculatedX +
            " " +
            // (self.height - self.svgMarginY / 2) +
            (this.height - this.margin.bottom / 2) +
            ")"
        )
        self.lastZoomX = self.lastZoomX + deltaX
      }
    })

    /**
     * TODO: hier werden die "g" objecte initialisiert (und andere Sachen)
     */

    let svg = (this.gGraphics = d3
      .select(self.svgRoot)
      .call(zoom)
      .on("mousemove", mouseLine)
      .append("g")
      .attr("class", "linelist"))

    let uicontainer = (this.gUIContainer = d3
      .select(self.svgRoot)
      .append("g")
      .attr("class", "uicontainer"))

    /**
     * Graphics for Vis-Structures
     */
    this.gStatus_rects = svg.append("g").attr("class", "gStatus_rects")
    this.gHorizontal_Lines = svg.append("g").attr("class", "gHorizontalLines")
    this.gInvestigation_rects = svg
      .append("g")
      .attr("class", "gInvestigation_rects")
    this.gMovement_rects = svg.append("g").attr("class", "gMovement_rects")
    this.gMovement_dots = svg.append("g").attr("class", "gMovement_dots")

    /**
     * Helping Graphics
     */
    // this.gHorizontalMarginBars = svg
    this.gHorizontalMarginBars = uicontainer
      .append("g")
      .attr("class", "gHorizontalMarginBars")

    // this.gGridlines = svg.append("g").attr("class", "gGridlines")
    this.gGridlines = uicontainer.append("g").attr("class", "gGridlines")
    // this.gxAxis = svg.append("g").attr("class", "gxAxis")
    // this.gyAxis = svg.append("g").attr("class", "gyAxis")

    // this.gVerticalMarginBars = svg
    this.gVerticalMarginBars = uicontainer
      .append("g")
      .attr("class", "gVerticalMarginBars")

    this.gMouselineText = svg.append("g").attr("class", "gMouselineText")
    this.gLegend = svg.append("g").attr("class", "gLegend")

    uicontainer
      .append("line")
      .attr("class", "mouseLine")
      .attr("pointer-events", "none")
      .attr("opacity", 0.5)
      .attr("stroke-width", 1)
      .attr("stroke", "black")

    uicontainer
      .append("text")
      .attr("class", "mouseLabel")
      .attr("pointer-events", "none")

    this.gScrollableGraphics = svg
      .append("g")
      .attr("class", "gScrollableGraphics")
      .attr("fill", "none")

    this.gScrollbar = d3
      .select(self.svgRoot)
      .append("g")
      .attr("class", "gScrollbar")

    this.draw_vis()
  }

  requestVisData = () => {
    // TODO: example getVisData -> parsing the data and caching it
  }

  componentWillUnmount() {
    this.socket.off("linelist")

    clearInterval(this.checkSize)
  }

  handle_data = (data) => {
    console.log("linelist vis data received")
    console.log(data)
    let self = this

    this.data = data.data
    this.parameters = data.parameters
    this.timestamp = data.timestamp

    this.zoom = 1
    this.lastZoomK = 1
    this.lastZoomX = 0
    this.lastTransformedX = 0

    this.currentPixelOffset = 0

    this.gGraphics.attr(
      "transform",
      "translate(" +
        this.lastTransformedX +
        " " +
        // (this.height - this.svgMarginY / 2) +
        0 +
        ")"
    )

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

    this.draw_vis()
  }

  /**
   * TODO: die "Zeichnen"-Funktion; wird aufgerufen on-resize und bei neuen Daten
   */
  draw_vis = (zooming) => {
    let self = this
    let data = this.data

    let trans_duration = this.transition_duration
    if (zooming) {
      trans_duration = 0
    }

    // console.log("drawing linelist")
    // console.log(`currentPixelOffset ${this.currentPixelOffset}`)

    /**
     * Titel + Timestamp
     */
    // let title = this.gLegend.selectAll(".title").data([this.title])

    // title
    //   .enter()
    //   .append("text")
    //   .attr("class", "title")
    //   .merge(title)
    //   .transition()
    //   .duration(trans_duration)
    //   .text((d) => d)
    //   .attr("font-size", this.title_height)
    //   .attr("x", this.width / 2)
    //   .attr("y", this.title_height)
    //   .attr("text-anchor", "middle")

    // title.exit().remove()

    if (this.data === undefined) {
      return
    }

    /**
     * Showing the timestamp, when the data/vis was generated
     */
    // let timestamp = this.gLegend
    //   .selectAll(".timestamp")
    //   .data([
    //     `(Stand: ${moment(this.timestamp).format("DD.MM.YYYY HH:mm:ss")})`,
    //   ])

    // timestamp
    //   .enter()
    //   .append("text")
    //   .attr("class", "timestamp")
    //   .merge(timestamp)
    //   .transition()
    //   .duration(trans_duration)
    //   .text((d) => d)
    //   .attr("font-size", this.timestamp_height)
    //   .attr("x", this.width / 2)
    //   .attr("y", this.title_height + this.timestamp_height)
    //   .attr("text-anchor", "middle")

    // timestamp.exit().remove()

    let zoom = this.zoom

    moment.locale("de")

    let xPixels = [
      this.vis_margin.left + 10,
      this.width * zoom - this.vis_margin.right - 10,
    ]

    let time_range = [data.ts_start, data.ts_end]

    let maxPatientRows = Math.floor(
      (this.height - this.vis_margin.top - this.vis_margin.bottom) /
        this.row_height
    )

    let rowHeight = this.row_height

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
        let maxPixelOffset =
          // (self.data.patientList.length - maxPatientRows - 1) * rowHeight
          (self.data.patientList.length - maxPatientRows) * rowHeight
        if (maxPixelOffset < 0) {
          maxPixelOffset = 0
        }

        if (self.currentPixelOffset > maxPixelOffset) {
          self.currentPixelOffset = maxPixelOffset
        }
        if (self.currentPixelOffset < 0) {
          self.currentPixelOffset = 0
        }

        let handle

        let hue = (h, start_drag) => {
          // console.log(`HUE CurrentPielfOffset ${self.currentPixelOffset}`)
          handle.attr("cy", y(h))
          self.currentPixelOffset = h
          self.gScrollableGraphics.attr(
            "transform",
            "translate(" +
              self.lastTransformedX +
              // 0 +
              " " +
              self.currentPixelOffset +
              ")"
          )
          self.gGraphics.attr(
            "transform",
            "translate(" +
              self.lastTransformedX +
              " " +
              self.currentPixelOffset +
              ")"
          )

          if (start_drag === true) {
            let inspecHeight = 0
            self.gUIContainer
              .selectAll(".patientLabel")
              .text((d, i) => {
                let y_offset =
                  self.height -
                  self.vis_margin.bottom -
                  i * self.row_height -
                  // + self.rowHeight
                  inspecHeight -
                  // self.labelMargin +
                  2 +
                  self.currentPixelOffset
                if (
                  y_offset < self.vis_margin.top ||
                  y_offset > self.height - self.vis_margin.bottom
                ) {
                  return ""
                } else {
                  return d
                }
              })
              .attr(
                "transform",
                (d, i) =>
                  "translate(" +
                  ((self.offsetX || 0) + self.lastTransformedX) +
                  "," +
                  (self.height -
                    self.vis_margin.bottom -
                    i * self.row_height -
                    // + self.rowHeight
                    inspecHeight -
                    // self.labelMargin +
                    2 +
                    self.currentPixelOffset +
                    // 0 +
                    ")")
              )
          }

          // self.draw_vis(true)
        }

        let y = d3
          .scaleLinear()
          .domain([0, maxPixelOffset])
          // .range([height - self.margin.bottom, self.margin.top])
          .range([
            this.height - this.vis_margin.bottom,
            // this.vis_margin.top,
            this.vis_margin.bottom,
          ])
          .clamp(true)

        let slider = self.gScrollbar
          .append("g")
          .attr("class", "slider")
          .attr(
            "transform",
            "translate(" + self.margin.left / 2 + "," + 0 + ")"
          )

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
                hue(y.invert(d3.event.y), true)
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

        if (this.data.patientList.length <= maxPatientRows) {
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

      if (this.data.patientList.length <= maxPatientRows) {
        self.gScrollbar.selectAll("*").remove()
      }
      self.needScrollInit = false
    }

    /**
     * Drawing the margin bars, to hide the visualization at the edges for the scroll- and drag- interaction
     */
    let v_margin_bars = this.gVerticalMarginBars
      .selectAll(".v_margin_bar")
      .data(this.v_margin_bars_data)

    v_margin_bars
      .enter()
      .append("rect")
      .attr("class", "v_margin_bar")
      .merge(v_margin_bars)
      .transition()
      .duration(trans_duration)
      .attr("x", (d) => d.x())
      .attr("y", (d) => d.y())
      .attr("height", (d) => d.height())
      .attr("width", (d) => d.width())
      // .attr("fill", "lightblue")
      .attr("fill", "white")
      .attr("stroke", "none")
    // .attr("opacity", 0.8)

    v_margin_bars.exit().remove()

    let h_margin_bars = this.gHorizontalMarginBars
      .selectAll(".h_margin_bar")
      .data(this.h_margin_bars_data)

    h_margin_bars
      .enter()
      .append("rect")
      .attr("class", "h_margin_bar")
      .merge(h_margin_bars)
      .transition()
      .duration(trans_duration)
      .attr("x", (d) => d.x())
      .attr("y", (d) => d.y())
      .attr("height", (d) => d.height())
      .attr("width", (d) => d.width())
      // .attr("fill", "lightgray")
      .attr("fill", "white")
    // .attr("opacity", 0.8)

    h_margin_bars.exit().remove()

    /**
     * Movement Rectangles
     */

    let scale_x = d3
      .scaleLinear()
      .domain(time_range)
      // .range([0 + this.margin.left, this.width - this.margin.right])
      // TODO: SMICS-0.8
      .range(xPixels)

    this.scaleReverseX = d3.scaleLinear().range(time_range).domain(xPixels)

    let y_row_offset = (d) => {
      let { patient_id } = d
      let index = data.patientList.findIndex((pid) => pid === patient_id)
      let yPos = index * this.row_height
      // return this.height - yPos - this.margin.bottom
      return this.height - yPos - this.vis_margin.bottom
    }

    let y_movement_offset = (d) => {
      let { top } = d

      let yPos = 0
      if (!top) {
        yPos += this.movement_rectangle_height
      }
      return y_row_offset(d) - this.row_height / 2 + yPos
    }

    let y_treatment_offset = (d) => {
      return y_row_offset(d) - this.row_height + this.treatment_circle_r * 5
    }

    let y_investigation_offset = (d) => {
      return y_row_offset(d) - this.investigation_rectangle_height
    }

    let rect_width = (d) => {
      let rec_w = scale_x(d.end) - scale_x(d.begin)
      if (rec_w < this.movement_rectangle_height) {
        rec_w = this.movement_rectangle_height
      }

      return rec_w
    }

    let movement_rects = this.gMovement_rects
      .selectAll(".movement_rect")
      .data(data.movement_rects)

    movement_rects
      .enter()
      .append("rect")
      .attr("class", "movement_rect")
      .merge(movement_rects)
      .on("mouseenter", (d) => {
        this.update_tooltip(d, "link")
      })
      .on("mousemove", () => {
        this.props.move_tooltip()
        this.props.show_tooltip()
      })
      .on("mouseout", () => {
        this.props.hide_tooltip()
      })
      .on("click", (d) => {
        console.log(d)
        self.select_station(d.station_id)
      })
      .transition()
      .duration(trans_duration)
      .attr("x", (d) => scale_x(d.begin))
      .attr("width", (d) => rect_width(d))
      .attr("y", (d) => y_movement_offset(d))
      .attr("height", this.movement_rectangle_height)
      .attr("fill", (d) => {
        let col = self.default_movement_color
        if (self.selected_stations.includes(d.station_id)) {
          col = self.ward_color(d.station_id)
        }
        return col
      })
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("cursor", "pointer")

    movement_rects.exit().remove()

    let movement_dots = this.gMovement_dots
      .selectAll(".movement_dot")
      .data(data.movement_dots)

    movement_dots
      .enter()
      .append("circle")
      .attr("class", "movement_dot")
      .merge(movement_dots)
      .on("mouseenter", (d) => {
        this.update_tooltip(d, "link")
      })
      .on("mousemove", () => {
        this.props.move_tooltip()
        this.props.show_tooltip()
      })
      .on("mouseout", () => {
        this.props.hide_tooltip()
      })
      .on("click", (d) => {
        console.log(d)
      })
      .transition()
      .duration(trans_duration)
      .attr("cx", (d) => scale_x(d.begin))
      .attr("cy", (d) => y_treatment_offset(d))
      .attr("r", this.treatment_circle_r)
      .attr("fill", "cyan")
      .attr("stroke", "black")
      .attr("stroke-width", 1)

    movement_dots.exit().remove()

    /**
     * Investigation Rectangles
     */
    let filtered_investigation_rects = data.investigation_rects.filter(
      // (d) => d.pathogen_id === "869"
      // TODO: SMICS-0.8
      (d) =>
        d.pathogen_id === "869" ||
        d.pathogen_id === "94500-6" ||
        d.pathogen_id === "94558-4" ||
        d.pathogen_id === "94745-7"
    )

    let investigation_rects = this.gInvestigation_rects
      .selectAll(".investigation_rect")
      .data(filtered_investigation_rects)

    investigation_rects
      .enter()
      .append("rect")
      .attr("class", "investigation_rect")
      .merge(investigation_rects)
      .on("mouseenter", (d) => {
        this.update_tooltip(d, "inspec")
      })
      .on("mousemove", () => {
        this.props.move_tooltip()
        this.props.show_tooltip()
      })
      .on("mouseout", () => {
        this.props.hide_tooltip()
      })
      .on("click", (d) => {
        console.log(d)
      })
      .transition()
      .duration(trans_duration)
      // Beginn des Investigation Rects sollte eigentlich auch linke Kante sein
      // und nicht die Mitte des Reccts (?!)
      .attr(
        "x",
        (d) => scale_x(d.timestamp) - this.investigation_rect_width / 2
      )
      .attr("width", (d) => this.investigation_rect_width)
      .attr("y", (d) => y_investigation_offset(d))
      .attr("height", this.investigation_rectangle_height)
      .attr("fill", (d) => {
        let c = "white"
        switch (d.result) {
        case "negative":
          c = this.get_color("negative")
          break
        case "infected":
          c = this.get_color("infectedCarrier")
          break
        case "diseased":
          c = this.get_color("infectedDiseased")
          break
        }

        return c
      })
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("opacity", 0.5)

    investigation_rects.exit().remove()

    /**
     * Status Rectangles
     */

    let filtered_status_rects = data.status_rects.filter(
      // (d) => d.pathogen_id === undefined
      // (d) => d.pathogen_id === "869"
      // TODO: SMICS-0.8
      (d) =>
        d.pathogen_id === "869" ||
        d.pathogen_id === "94500-6" ||
        d.pathogen_id === "94558-4" ||
        d.pathogen_id === "94745-7"
    )

    let patients_with_status_rects = []
    filtered_investigation_rects.forEach((sr) => {
      if (!patients_with_status_rects.includes(sr.patient_id)) {
        patients_with_status_rects.push(sr.patient_id)
      }
    })
    if (patients_with_status_rects.length < data.patientList.length) {
      data.patientList.forEach((pID) => {
        if (!patients_with_status_rects.includes(pID)) {
          filtered_status_rects.push(data.unknown_rects[pID])
        }
      })
    }

    let status_rects = this.gStatus_rects
      .selectAll(".status_rect")
      .data(filtered_status_rects)

    status_rects
      .enter()
      .append("rect")
      .attr("class", "status_rect")
      .merge(status_rects)
      .on("click", (d) => {
        console.log(d)
      })
      .transition()
      .duration(trans_duration)
      .attr("x", (d) => scale_x(d.begin))
      .attr("width", (d) => rect_width(d))
      .attr("y", (d) => y_row_offset(d) - this.row_height)
      .attr("height", this.row_height)
      .attr("fill", (d) => {
        let c = "yellow"
        switch (d.status) {
        case "negative":
          c = this.get_color("negative")
          // TODO: SMICS-0.8
          c = this.get_color("unknown")
          break
        case "unknown":
          c = this.get_color("unknown")
          break
        case "infected":
          c = this.get_color("infectedCarrier")
          break
        case "diseased":
          c = this.get_color("infectedDiseased")
          break
        }
        return c
      })
      .attr("stroke", "black")
      .attr("stroke-width", 0)
      .attr("opacity", 0.5)

    status_rects.exit().remove()

    /**
     * Horizontal Lines
     */

    // TODO: horizontal lines hier implementieren
    let patient_lines_data = []
    for (let i = 1; i < data.patientList.length; i++) {
      patient_lines_data.push(i)
    }
    let patient_lines = this.gHorizontal_Lines
      .selectAll(".h_line")
      .data(patient_lines_data)

    patient_lines
      .enter()
      .append("line")
      .attr("class", "h_line")
      .merge(patient_lines)
      .transition()
      .duration(trans_duration)
      .attr("x1", (d) => 0)
      .attr("x2", (d) => this.width * zoom)
      .attr(
        "y1",
        (d, i) =>
          this.height - this.vis_margin.bottom - (i + 1) * this.row_height
      )
      .attr(
        "y2",
        (d, i) =>
          this.height - this.vis_margin.bottom - (i + 1) * this.row_height
      )
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("opacity", 0.5)

    patient_lines.exit().remove()

    /**
     * Axis
     */

    // d3.timeFormatDefaultLocale("de")
    let parseTime = d3.timeParse("%Q")
    let xAxisScale = d3
      .scaleTime()
      .domain(d3.extent(time_range, (d) => parseTime(d)))
      // .range([this.margin.left, this.width - this.margin.right])
      // TODO: SMICS-0.8
      .range(xPixels)

    let xAxis = d3
      .axisBottom(xAxisScale)
      .ticks(self.zoom * 5)
      .tickSizeInner([
        -(
          this.height -
          this.margin.bottom -
          this.vis_margin.top +
          3 * this.movement_rectangle_height
        ),
      ])

    this.gGridlines
      .attr(
        "transform",
        "translate(" + 0 + "," + (this.height - this.margin.bottom / 2) + ")"
      )
      .transition()
      .duration(trans_duration)
      .call(xAxis)

    this.gGridlines
      .selectAll(".tick")
      .selectAll("line")
      .attr("opacity", 0.5)
      .attr("stroke-dasharray", "4, 6")
      .attr("stroke-width", 1)
  }

  select_station = (d) => {
    let self = this

    if (self.selected_stations.includes(d)) {
      self.selected_stations = self.selected_stations.filter((s) => s !== d)
    } else {
      self.selected_stations.push(d)
    }
    self.setState(
      (prevState) => (prevState.selected_stations = self.selected_stations)
    )

    self.draw_vis()
  }

  render() {
    let self = this

    let station_color_legend_names = []
    // let station_color_legend_colors = []
    self.state.stations.forEach((s, i) => {
      let col = self.default_movement_color
      if (self.state.selected_stations.includes(s.name)) {
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
        >
          {s.name}
        </th>
      )
      // station_color_legend_colors.push(
      //   <td style={{ background: s.color, height: "20px" }}></td>
      // )
    })

    return (
      <div style={{ width: "100%", height: "100%", background: "white" }}>
        <svg
          // style={{ width: "100%", height: "100%" }}
          className="svgRoot"
          ref={(element) => (this.svgRoot = element)}
        />
        <div
          className="testdiv2"
          style={{ position: "absolute", top: "10px", left: "100px" }}
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
      </div>
    )
  }
}

export default Linelist
