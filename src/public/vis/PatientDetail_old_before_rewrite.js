import { Component } from "react"
import * as d3 from "d3"
import moment from "moment"
import "./linelist.css"

class Linelist extends Component {
  constructor(props) {
    super(props)

    this.module_id = props.create_new_id()
    this.module_type = "patientdetail"

    this.min_width = 150
    this.min_height = 150

    /**
     * TODO: hier für das Module feste Parameter/"globale" variablen
     */
    this.state = {
      too_small: false,
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

    // TODO gleiche margin wie in anderen Modulen
    this.margin = {
      top: 25,
      bottom: 25,
      left: 25,
      right: 25,
    }

    /**
     * = margin bars außenrum
     */
    this.vis_margin = {
      top: 50,
      // top: this.title_height + this.timestamp_height * 2,
      // top: 0,
      bottom: 50,
      left: 100,
      right: 0,
    }

    this.title = this.translate("AnnotationTimeline")

    this.transition_duration = 200
    this.row_height = 100
    // this.movement_rectangle_height = this.row_height / 5
    this.movement_rectangle_height = this.row_height / 8 / 2
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

    //TODO: Translate Datumsformat
    this.locale = {
      dateTime: "%A, der %e. %B %Y, %X",
      date: "%d.%m.%Y",
      time: "%H:%M:%S",
      periods: ["AM", "PM"],
      days: [
        this.translate("sunday"),
        this.translate("monday"),
        this.translate("tuesday"),
        this.translate("wednesday"),
        this.translate("thursday"),
        this.translate("friday"),
        this.translate("saturday"),
      ],
      shortDays: [
        this.translate("sundayS"),
        this.translate("mondayS"),
        this.translate("tuesdayS"),
        this.translate("wednesdayS"),
        this.translate("thursdayS"),
        this.translate("fridayS"),
        this.translate("saturdayS"),
      ],
      months: [
        this.translate("january"),
        this.translate("february"),
        this.translate("march"),
        this.translate("april"),
        this.translate("may"),
        this.translate("june"),
        this.translate("july"),
        this.translate("august"),
        this.translate("september"),
        this.translate("october"),
        this.translate("november"),
        this.translate("december"),
      ],
      shortMonths: [
        this.translate("januaryS"),
        this.translate("februaryS"),
        this.translate("marchS"),
        this.translate("aprilS"),
        this.translate("mayS"),
        this.translate("juneS"),
        this.translate("julyS"),
        this.translate("augustS"),
        this.translate("septemberS"),
        this.translate("octoberS"),
        this.translate("novemberS"),
        this.translate("decemberS"),
      ],
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
        // width: () => this.vis_margin.left / 2,
        width: () => 35,
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
        // height: () => this.vis_margin.bottom,
        height: () => 2000,
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
    if (i === "symptomRect") {
      tableObj = {
        title: this.translate("symptomPatient") + d.patientID,
        //header: ["DataName", "Value"],
        content: [
          [this.translate("symptomType"), d.symptomArt],
          [
            this.translate("symptomStart"),
            moment(d.symptomBeginn).format(this.translate("dateFormat")) +
              " " +
              this.translate("clock"),
          ],
          [
            this.translate("symptomEnd"),
            moment(d.symptomEnde).format(this.translate("dateFormat")) +
              " " +
              this.translate("clock"),
          ],
        ],
      }
    } else if (i === "virusLastRect") {
      tableObj = {
        title: this.translate("viralLoad") + " " + d.PatientID,
        //header: ["DataName", "Value"],
        content: [
          [
            this.translate("findingsDate"),
            moment(d.Befunddatum).format(this.translate("dateFormat")) +
              " " +
              this.translate("clock"),
          ],
          [
            this.translate("zeitProbe"),
            moment(d.ZeitpunktProbeneingang).format(
              this.translate("dateFormat")
            ) +
              " " +
              this.translate("clock"),
          ],
          [this.translate("ResultComment"), d.Befundkommentar],
          [this.translate("material"), d.Material_l],
          // [this.translate("ctValue"), d.Viruslast],
          [
            this.translate("ctValue"),
            d.Quantity + (d.Einheit ? " " + d.Einheit : ""),
          ],
        ],
      }
    } else if (i === "spritze") {
      tableObj = {
        title: this.translate("vaccinationP") + d.PatientenID,
        //header: ["DataName", "Value"],
        content: [
          [
            this.translate("docuTime"),
            moment(d.DokumentationsID).format(this.translate("dateFormat")) +
              " " +
              this.translate("clock"),
          ],
          [this.translate("dosing"), d.Dosiermenge],
          [this.translate("vaccine"), d.Impfstoff],
          [this.translate("vaccinationA"), d.ImpfungGegen],
        ],
      }
    } else if (i === "link") {
      let momentB = moment(d.begin)
      let momentE = moment(d.end)
      let duration = moment.duration(momentE.diff(momentB))
      let months = duration.months()
      let days = duration.days()
      let hrs = duration.hours()
      let mins = duration.minutes()
      let secs = duration.seconds()

      tableObj = {
        title:
          this.translate("patient") +
          d.patient_id +
          " " +
          this.translate("ward") +
          " " +
          d.station_id,
        //header: ["DataName", "Value"],
        content: [
          // ["Bewegungsart", d.Bewegungsart_l],
          // ["Bewegungstyp", d.Bewegungstyp],
          // ["CaseType", d.CaseType_l],
          // ["Patient", d.patient_id],
          // ["Station", d.station_id]
          [
            this.translate("duration"),
            months +
              this.translate("M") +
              " " +
              days +
              this.translate("d") +
              " " +
              hrs +
              this.translate("h") +
              " " +
              mins +
              this.translate("min") +
              " " +
              secs +
              this.translate("s"),
          ],
          [
            this.translate("begin"),
            momentB.format(this.translate("dateFormat")) +
              " " +
              this.translate("clock"),
          ],
          [
            this.translate("end"),
            momentE.format(this.translate("dateFormat")) +
              " " +
              this.translate("clock"),
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
          " " +
          this.translate("clock") +
          " | " +
          this.translate("result") +
          ": " +
          d.result,
        header: [
          //   this.translate("result"),
          //   this.translate("pathogen"),
          //   this.translate("antibiotika"),
          //   this.translate("material"),
          //   this.translate("id"),
          this.translate("KeimID"),
          // this.translate("MREclass"),
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
          // o.MREKlasseID,
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

  virusLastColorDefiner = (d) => {
    // console.log(d.Viruslast < 30)
    let farbe = ""

    let col0 = "rgb(255,42,23)"
    let col1 = "rgb(252,141,89)"
    let col2 = "rgb(255,255,191)"
    let col3 = "rgb(145,207,96)"

    let belastung = Number(d.Quantity)

    if (d.Quantity === null || d.Quantity === undefined) {
      farbe = col3
    } else if (isNaN(belastung)) {
      belastung = d.Quantity.length

      if (belastung === 1) {
        farbe = col3
      } else if (belastung === 2) {
        farbe = col2
      } else if (belastung === 3) {
        farbe = col1
      } else if (belastung === 4) {
        farbe = col0
      }
    } else {
      if (belastung < 15) {
        farbe = "rgb(252,141,89)"
      } else if (belastung < 30) {
        farbe = "rgb(255,255,191)"
      } else {
        farbe = "rgb(145,207,96)"
      }
    }

    return farbe
    //console.log("Viruslast: " + d.virusLast)
    if (d.Viruslast < 15) return col1
    if (d.Viruslast < 30) return col2
    return col3
  }

  virusLastOpacityDefiner = (d) => {
    let o = 1

    let last = Number(d.Quantity)

    if (isNaN(last)) {
      return o
    }

    if (last < 15) {
      last = -last
      last += 15

      return (last / 15) * 0.5 + 0.5
    } else if (last < 30) {
      last = -last
      last += 30

      return (last / 30) * 0.5 + 0.5
    }
    return o
  }

  filter_data = () => {
    let pfv = this.props.get_possible_filter_values()

    let { station, min_ts, max_ts, patients } = this.props.get_filter_values()

    let original_data = this.props.get_original_data(this.module_type)
    // TODO
  }

  componentDidMount() {
    let self = this

    console.log("new annotation timeline module did mount")

    this.socket.on("patientdetail", this.handle_data)

    this.props.register_module(this.module_id, this.module_type, {
      draw_vis: this.draw_vis,
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
        self.draw_vis()
        // }
      }
    }, 100)

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
            this.translate("dateFormat")
          ) +
          " " +
          this.translate("clock")
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
        console.error(
          "d3.event.sourceEvent gibt fehler ? --> weil doppelklick?"
        )
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
        self.gYmovingInformation.attr(
          "transform",
          "translate(" + 0 + " " + self.currentPixelOffset + ")"
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
        self.gYmovingInformation.attr(
          "transform",
          "translate(" + 0 + " " + self.currentPixelOffset + ")"
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
    this.gAnnotationGraphics = svg
      .append("g")
      .attr("class", "gAnnotationGraphics")
    this.gVirusLastRects = this.gAnnotationGraphics
      .append("g")
      .attr("class", "gVirusLastRects")
    this.gSymptomRects = this.gAnnotationGraphics
      .append("g")
      .attr("class", "gSymptomRects")
    this.gSpritzen = this.gAnnotationGraphics
      .append("g")
      .attr("class", "gSpritzen")
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

    this.gStaticInformation = uicontainer
      // d3
      // .select(self.svgRoot)
      .append("g")
      .attr("class", "gStaticInformation")

    this.gStaticInfoBackground = this.gStaticInformation
      .append("g")
      .attr("class", "gStaticInfoBackground")

    this.gYmovingInformation = this.gStaticInformation
      .append("g")
      .attr("class", "gYmovingInformation")

    this.gStaticInfoBackground_overlay = this.gStaticInformation
      .append("g")
      .attr("class", "gStaticInfoBackground_overlay")

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

  componentWillUnmount() {
    console.log("UNMOUNTING NEW ANNOTATION")
    this.socket.off("patientdetail")

    this.props.unregister_module(this.module_id)

    clearInterval(this.checkSize)
  }

  handle_data = (data) => {
    console.log(`
    
    
    
    
    new annotation timeline vis data received`)
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

  y_movement_offset = (d, movement_rect_height, row_height, patientList) => {
    let yPos = 0
    if (!d.top) {
      yPos += movement_rect_height
    }
    return (
      this.y_row_offset(row_height, d.patient_id, patientList) -
      row_height / 2 +
      yPos
    )
  }

  /**
   * TODO: die "Zeichnen"-Funktion; wird aufgerufen on-resize und bei neuen Daten
   */
  draw_vis = (zooming) => {
    let self = this

    let data = this.filtered_data

    if (data === undefined || this.width <= 150 || this.height <= 150) {
      return
    }

    let fv = this.props.get_filter_values()

    let timespan = [fv.min_ts, fv.max_ts + 1000 * 60 * 60 * 24]

    let x_pixels = [this.margin.left, this.width - this.margin.right]

    let y_pixel_diff = this.height - this.margin.bottom - this.margin.top

    // !ab hier alt

    moment.locale("de")

    /** Scroll Bar */

    let row_height = this.row_height

    // TODO: this is to scale to height
    if (false) {
      row_height = y_pixel_diff / data.patientList.length
    }

    let movement_rectangle_height = row_height / 8
    // let investigation_rectangle_height = (row_height / 8) * 6
    // let investigation_rect_width = movement_rectangle_height

    let treatment_circle_r = movement_rectangle_height / 2

    let x_scale = d3.scaleLinear().domain(timespan).range(x_pixels)

    let parse_time = d3.timeParse("%Q")
    let x_axis_scale = d3
      .scaleTime()
      .domain(d3.extent(timespan, (d) => parse_time(d)))
      .range(x_pixels)

    let x_axis = d3
      .axisBottom(x_axis_scale)
      .ticks(5)
      .tickSizeInner([-(this.height - this.margin.bottom - this.margin.top)])

    this.gGridlines
      .attr(
        "transform",
        "translate(" + 0 + "," + (this.height - this.margin.bottom) + ")"
      )
      .call(x_axis)

    this.gGridlines
      .selectAll(".tick")
      .selectAll("line")
      .attr("opacity", 0.5)
      .attr("stroke-dasharray", "4, 6")
      .attr("stroke-width", 1)

    /**
     * Movement Rectangles
     */

    let movement_rect = this.gMovement_rects
      .selectAll(".movement_rect")
      .data(data.movement_rects)

    movement_rect
      .enter()
      .append("rect")
      .attr("class", "movement_rect")
      .merge(movement_rect)
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
        // TODO
        let stat_id = d.station_id
        if (fv.station === stat_id) {
          stat_id = ""
        }
        self.props.change_filter_station(stat_id)
      })
      .attr("x", (d) => this.boundary_x_scale(x_scale, d.begin))
      .attr("width", (d) =>
        this.calculate_rect_width(d, movement_rectangle_height, x_scale)
      )
      .attr("y", (d) =>
        this.y_movement_offset(
          d,
          movement_rectangle_height,
          row_height,
          data.patientList
        )
      )
      .attr("height", movement_rectangle_height)
      .attr("fill", (d) => {
        let col = self.default_movement_color
        // TODO station color global fuer alle module in daten bei mfiltern reinschreiben
        // if (self.selected_stations.includes(d.station_id)) {
        //   col = self.ward_color(d.station_id)
        // }
        if (fv.station === d.station_id) {
          col = "#1b9e77"
        }
        return col
      })
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("cursor", "pointer")

    movement_rect.exit().remove()

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
      .attr("cx", (d) => x_scale(d.begin))
      .attr("cy", (d) =>
        this.y_treatment_offset(
          d.patient_id,
          data.patientList,
          row_height,
          movement_rectangle_height
        )
      )
      .attr("r", treatment_circle_r)
      .attr("fill", "cyan")
      .attr("stroke", "black")
      .attr("stroke-width", 1)

    movement_dots.exit().remove()

    return

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
      if (d.end === undefined) {
        return this.width * zoom - this.vis_margin.right - 10 - x_scale(d.begin)
      }

      let rec_w = x_scale(d.end) - x_scale(d.begin)
      if (rec_w < this.movement_rectangle_height) {
        rec_w = this.movement_rectangle_height
      }

      return rec_w
    }

    /**
     * PORTS AUS DEM ORIGINALEN ANNOTATION TIMELINE MODULE
     * alles auf gAnnotationGraphics.xxx gemalt
     */

    // Spritzenform
    let injectionShape = {
      draw: (context, size) => {
        context.moveTo(size * 10, size * 1)
        context.lineTo(size * 8, size * 1)
        context.lineTo(size * 8, size * 0)
        context.lineTo(size * 13, size * 0)
        context.lineTo(size * 13, size * 1)
        context.lineTo(size * 11, size * 1)
        context.lineTo(size * 11, size * 3)
        context.lineTo(size * 15, size * 3)
        context.lineTo(size * 15, size * 4)
        context.lineTo(size * 13, size * 4)
        context.lineTo(size * 13, size * 10)
        context.lineTo(size * 11, size * 12)
        context.lineTo(size * 11, size * 18)
        context.lineTo(size * 10, size * 18)
        context.lineTo(size * 10, size * 12)
        context.lineTo(size * 8, size * 10)
        context.lineTo(size * 8, size * 4)
        context.lineTo(size * 6, size * 4)
        context.lineTo(size * 6, size * 3)
        context.lineTo(size * 10, size * 3)
        context.closePath()
      },
    }

    let injectionSize = 1.5

    let injectionPath = d3.symbol().type(injectionShape).size(injectionSize)
    let injectionPath_small = d3.symbol().type(injectionShape).size(1)

    let spritzen_background = this.gStaticInfoBackground
      .selectAll(".spritzen_background")
      .data([
        {
          x: 0,
          y: 0,
          height: this.height,
          width: this.vis_margin.left,
        },
      ])

    spritzen_background
      .enter()
      .append("rect")
      .attr("class", "spritzen_background")
      .merge(spritzen_background)
      .transition()
      .duration(trans_duration)
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .attr("height", (d) => d.height)
      .attr("width", (d) => d.width)
      // .attr("fill", "lightgray")
      .attr("fill", "white")
      // .attr("opacity", 0.8)
      .attr("stroke", "black")

    spritzen_background.exit().remove()

    let spritzen = this.gYmovingInformation
      .selectAll(".spritze")
      .data(data.vacc_injection_data)

    spritzen
      .enter()
      .append("path")
      .on("click", (d) => console.log(d))
      .on("mouseenter", (d) => {
        this.update_tooltip(d, "spritze")
      })
      .on("mousemove", () => {
        this.props.move_tooltip()
        this.props.show_tooltip()
      })
      .on("mouseout", () => {
        this.props.hide_tooltip()
      })
      .attr("class", "spritze")
      .merge(spritzen)
      .transition()
      .duration(trans_duration)
      .attr("d", injectionPath)
      .attr("fill", (d) => {
        let c = "blue"
        switch (d.anzahl_impfungen) {
          case 0:
            c = "white"
            break
          case 1:
            c = "#37b2b8"
            break
          case 2:
            c = "#377eb8"
            break

          case 3:
            c = "#4437b8"
            break
          case 4:
            c = "black"
            break
        }
        // return c
        return "#377eb8"
      })
      // .attr("stroke", "black")
      .attr(
        "transform",
        (d, i) =>
          "translate(" +
          // (this.vis_margin.left / 2 - 10) +
          (10 +
            this.vis_margin.left / 2 -
            15 +
            (d.Dosierungsreihenfolge - 1) * 18) +
          ", " +
          (y_row_offset({ patient_id: d.PatientenID }) - 46 - 30) +
          ")" +
          "rotate(" +
          45 +
          ")"
      )
    // .attr("transform", "rotate(" + 50 + ")")

    spritzen.exit().remove()

    let spritzen_background_overlay = this.gStaticInfoBackground_overlay
      .selectAll(".spritzen_background_overlay")
      .data([
        {
          x: 0,
          y: 0,
          height: this.vis_margin.top,
          width: this.vis_margin.left,
        },
        {
          x: 0,
          y: this.height - this.vis_margin.bottom,
          height: this.vis_margin.bottom,
          width: this.vis_margin.left,
        },
      ])

    spritzen_background_overlay
      .enter()
      .append("rect")
      .attr("class", "spritzen_background_overlay")
      .merge(spritzen_background_overlay)
      .transition()
      .duration(trans_duration)
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .attr("height", (d) => d.height)
      .attr("width", (d) => d.width)
      // .attr("fill", "lightgray")
      .attr("fill", "white")
      // .attr("opacity", 0.8)
      .attr("stroke", "white")
      .attr("stroke-width", 5)

    spritzen_background_overlay.exit().remove()

    let virusLastRects = this.gVirusLastRects
      .selectAll(".virusLastRect")
      .data(data.virusLastRects)

    virusLastRects
      .enter()
      .append("rect")
      .attr("class", "virusLastRect")
      .on("mouseenter", (d) => {
        this.update_tooltip(d, "virusLastRect")
      })
      .on("mousemove", () => {
        this.props.move_tooltip()
        this.props.show_tooltip()
      })
      .on("mouseout", () => {
        this.props.hide_tooltip()
      })
      .on("click", (d) => console.log(d))
      .merge(virusLastRects)
      .transition()
      .duration(trans_duration)
      .attr("x", (d) => x_scale(d.begin))
      .attr("width", (d) => rect_width(d))
      .attr(
        "y",
        (d) => y_row_offset({ patient_id: d.PatientID }) - this.row_height
      )
      .attr("height", this.row_height)
      .attr("fill", (d) => this.virusLastColorDefiner(d))
      .attr("stroke", "black")
      .attr("opacity", this.virusLastOpacityDefiner)

    virusLastRects.exit().remove()

    let symptomRect = this.gSymptomRects
      .selectAll(".symptomRect")
      .data(data.symptomDaten)

    symptomRect
      .enter()
      .append("rect")
      .attr("class", "symptomRect")
      .on("mouseenter", (d) => {
        this.update_tooltip(d, "symptomRect")
      })
      .on("mousemove", () => {
        this.props.move_tooltip()
        this.props.show_tooltip()
      })
      .on("mouseout", () => {
        this.props.hide_tooltip()
      })
      .on("click", (d) => console.log(d))
      .merge(symptomRect)
      .transition()
      .duration(trans_duration)
      .attr("x", (d) => x_scale(d.symptomBeginn))
      .attr("width", (d) =>
        rect_width({ begin: d.symptomBeginn, end: d.symptomEnde })
      )
      .attr(
        "y",
        (d) => y_row_offset({ patient_id: d.patientID }) - this.row_height + 30
      )
      .attr("height", this.row_height - 30)
      .attr("fill", "white")
      .attr("stroke", "black")
      .attr("opacity", 0.5)
    // .attr("stroke-dasharray", "5,10,5")

    symptomRect.exit().remove()

    let spritzen_on_timeline = this.gSpritzen
      .selectAll(".spritze_timeline")
      .data(data.vacc_injection_data)

    spritzen_on_timeline
      .enter()
      .append("path")
      .on("mouseenter", (d) => {
        this.update_tooltip(d, "spritze")
      })
      .on("mousemove", () => {
        this.props.move_tooltip()
        this.props.show_tooltip()
      })
      .on("mouseout", () => {
        this.props.hide_tooltip()
      })
      .on("click", (d) => console.log(d))
      .attr("class", "spritze_timeline")
      .merge(spritzen_on_timeline)
      .transition()
      .duration(trans_duration)
      .attr("d", injectionPath_small)
      .attr("fill", (d) => {
        let c = "blue"
        switch (d.anzahl_impfungen) {
          case 0:
            c = "white"
            break
          case 1:
            c = "#37b2b8"
            break
          case 2:
            c = "#377eb8"
            break

          case 3:
            c = "#4437b8"
            break
          case 4:
            c = "black"
            break
        }
        // return c
        // return "#377eb8"
        return "black"
      })
      // .attr("stroke", "black")
      .attr(
        "transform",
        (d, i) =>
          "translate(" +
          (x_scale(d.doc_ts) - 11) +
          ", " +
          (y_row_offset({ patient_id: d.PatientenID }) - 46 * 2) +
          ")"
      )
    // .attr("transform", "rotate(" + 50 + ")")

    spritzen_on_timeline.exit().remove()

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
      .range(x_pixels)

    /** Scroll Handle */

    let max_patient_rows =
      Math.floor(
        (this.height - this.margin.top - this.margin.bottom) / row_height
      ) + 1
    let max_pixel_offset =
      (data.patientList.length - max_patient_rows) * row_height

    if (max_pixel_offset < 0) {
      max_pixel_offset = 0
    }

    if (self.currentPixelOffset > max_pixel_offset) {
      self.currentPixelOffset = max_pixel_offset
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
          // self.lastTransformedX +
          0 +
          " " +
          self.currentPixelOffset +
          ")"
      )
      self.gGraphics.attr(
        "transform",
        "translate(" +
          // self.lastTransformedX +
          0 +
          " " +
          self.currentPixelOffset +
          ")"
      )

      if (false && start_drag === true) {
        let inspecHeight = 0
        self.gUIContainer
          .selectAll(".patientLabel")
          .text((d, i) => {
            let y_offset =
              self.height -
              self.margin.bottom -
              i * self.row_height -
              // + self.rowHeight
              inspecHeight -
              // self.labelMargin +
              2 +
              self.currentPixelOffset
            if (
              y_offset < self.margin.top ||
              y_offset > self.height - self.margin.bottom
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
                self.margin.bottom -
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
      .domain([0, max_pixel_offset])
      .range([this.height - this.margin.bottom, this.margin.top])
      .clamp(true)

    let slider = self.gScrollbar
      .append("g")
      .attr("class", "slider")
      .attr("transform", "translate(" + self.margin.left / 4 + "," + 0 + ")")

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

    handle = slider
      .insert("circle", ".track-overlay")
      .attr("class", "handle")
      .attr("stroke-linecap", "round")
      .attr("r", 9)

    if (data.patientList.length <= max_patient_rows) {
      self.currentPixelOffset = 0
    }

    hue(self.currentPixelOffset)

    if (data.patientList.length <= max_patient_rows) {
      self.gScrollbar.selectAll("*").remove()
    }

    let h_margin_bars = this.gHorizontalMarginBars
      .selectAll(".h_margin_bar")
      .data([
        {
          // x: this.margin.left,
          x: 0,
          y: this.height - this.margin.bottom,
          width: this.width,
          height: this.margin.bottom,
        },
      ])

    h_margin_bars
      .enter()
      .append("rect")
      .attr("class", "h_margin_bar")
      .merge(h_margin_bars)
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .attr("height", (d) => d.height)
      .attr("width", (d) => d.width)
      // .attr("fill", "lightgray")
      .attr("fill", "white")
    // .attr("opacity", 0.8)

    h_margin_bars.exit().remove()
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
          key={s.name}
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

    let element_to_draw = null
    if (this.props.get_original_data("patientdetail") === undefined) {
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
        {element_to_draw}
        <svg
          // style={{ width: "100%", height: "100%" }}
          className="svgRoot"
          style={{
            pointerEvents: "all",
            display: element_to_draw === null ? "block" : "none",
          }}
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
