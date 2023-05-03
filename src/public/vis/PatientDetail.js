import { Component } from "react"
import * as d3 from "d3"
import moment from "moment"
import "./linelist.css"

class PatientDetail extends Component {
  constructor(props) {
    super(props)

    this.module_id = props.create_new_id()
    this.module_type = "patientdetail"
    /**
     * TODOS:
     * - scroll/zoom interaction/update to filter
     * - mouse line/timestamp selection/ drag slider
     * - show patient labels at side
     * - show timestamp current time at mouseline
     * - drag interaction
     * - Ziehbare Balken aus Epikurve hier implementieren um Zeitraum einzuschränken
     * - bei draw_vis das "nicht" zeichne nwenn window zu klein: ALLES ENTFERNEN
     */

    /**
     * TODO: hier für das Module feste Parameter/"globale" variablen
     */
    // this.state = {
    //   stations: [],
    //   selected_stations: [],
    // }

    this.min_width = 150
    this.min_height = 150

    this.state = {
      too_small: false,
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

    this.title = this.translate("Linelist")

    this.scale_factor = 1

    this.row_height = 50

    // TODO needs to be reset to 0 if new data is incoming...
    // currently new data arrives at main.js and it just calls draw_vis on every module
    this.currentPixelOffset = 0

    // this.movement_rectangle_height = this.row_height / 8
    // this.investigation_rectangle_height = (this.row_height / 8) * 6
    // this.investigation_rect_width = 10

    // this.treatment_circle_r = this.movement_rectangle_height / 2

    // this.title_height = 50
    // this.timestamp_height = 25

    // TODO: global auslagern
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

    /**
     * = margin bars außenrum
     */
    this.margin = {
      top: 10,
      // top: this.title_height + this.timestamp_height * 2,
      // top: 0,
      bottom: 50,
      left: 50,
      right: 25,
    }
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

    let movement_rects = []
    let movement_dots = []

    let virusLastRects = []

    let vacc_injection_data = []

    let symptomDaten = []

    let data_length = 0

    if (original_data && original_data.data) {
      data_length =
        original_data.data.ereignisCircles.length +
        original_data.data.ereignisTriangles.length +
        original_data.data.impfDaten.length +
        original_data.data.movement_dots.length +
        original_data.data.movement_rects.length +
        original_data.data.stationenRects.length +
        original_data.data.symptomDaten.length +
        original_data.data.vacc_injection_data.length +
        original_data.data.virusLastRects.length
    }

    if (original_data && original_data.data && data_length > 0) {
      // TODO patienten und stationen
      movement_rects = original_data.data.movement_rects.filter(
        (d) => !(d.begin > max_ts + 1000 * 60 * 60 * 24 || d.end < min_ts)
      )

      movement_dots = original_data.data.movement_dots.filter(
        (d) => !(d.begin > max_ts + 1000 * 60 * 60 * 24 || d.end < min_ts)
      )

      virusLastRects = original_data.data.virusLastRects.filter(
        (d) => !(d.begin > max_ts + 1000 * 60 * 60 * 24 || d.end < min_ts)
      )

      vacc_injection_data = original_data.data.vacc_injection_data.filter(
        (d) => !(d.doc_ts > max_ts + 1000 * 60 * 60 * 24 || d.doc_ts < min_ts)
      )

      symptomDaten = original_data.data.symptomDaten.filter(
        (d) =>
          !(
            d.symptomBeginn > max_ts + 1000 * 60 * 60 * 24 ||
            d.symptomEnde < min_ts
          )
      )

      // TODO filter spritzen und symptomdaten

      // adjust the filtered data to the selected filters (colorizatin, resizing, ...)
      let fv = this.props.get_filter_values()

      let timespan = [fv.min_ts, fv.max_ts + 1000 * 60 * 60 * 24]

      this.filtered_data = {
        movement_rects,
        movement_dots,
        virusLastRects,
        symptomDaten,
        vacc_injection_data,
        patientList: original_data.data.patientList, // TODO
      }
    } else {
      this.filtered_data = undefined
    }
  }

  componentDidMount() {
    let self = this

    console.log("linelist module did mount")

    // this.socket.on("linelist", this.handle_data)

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

    // TODO: rewrite
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
        .attr("y1", self.margin.top)
        .attr("y2", self.height - self.margin.bottom / 2)

      let newText = offsetX
      if (self.scaleReverseX) {
        newText =
          moment(self.scaleReverseX(offsetX)).format(
            self.translate("dateFormat")
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
            (containerHeight - self.margin.bottom / 2) +
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
        .attr("text-anchor", false ? "end" : anchor)

      patientLabel.exit().remove()
    })

    // TODO: rewrite
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
        //       self.margin.bottom -
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
      // .on("mousemove", mouseLine)
      .on("mouseup", (e, d) => {
        console.log("mouseup")
      })
      .on("mousedown", (e, d) => {
        console.log("mousedown")
      })
      .on("dblclick", (e, d) => {
        console.log("dblclick")
      })
      .on("mouseout", (e, d) => {
        console.log("mouseout")
      })
      .on("mousemove", (e, d) => {
        console.log("mousemove")
      })
      .on("mouseenter", (e, d) => {
        console.log("mouseenter")
      })
      .on("mouseleave", (e, d) => {
        console.log("mouseleave")
      })
      .on("wheel", (e, d) => {
        let data = this.props.get_original_data(this.module_type)
        if (
          !data ||
          !data.data ||
          this.width <= this.min_width ||
          this.height <= this.min_height
        ) {
          return
        }

        let scroll = d3.event.deltaY

        let day_in_ms = 1000 * 60 * 60 * 24

        let pfv = this.props.get_possible_filter_values()
        let fv = this.props.get_filter_values()
        let new_min = fv.min_ts
        let new_max = fv.max_ts

        let current_timespan_days = (new_max - new_min) / day_in_ms

        if (scroll > 0) {
          // ran zoomen
          if (new_min === new_max) {
            console.warn(`Can't scroll further in.`)
            return
          }
        } else if (scroll < 0) {
          // raus zoomen
          if (new_min === pfv.min_ts && new_max === pfv.max_ts) {
            console.warn(`Can't scroll further out.`)
            return
          }
        } else {
          console.warn(`Scroll value is not valid ${scroll}.`)
          return
        }
        this.props.change_filter_timespan(new_min, new_max)
      })
      // .call(zoom)
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

    self.filter_data()
    this.draw_vis()
  }

  componentWillUnmount() {
    this.socket.off("patientdetail")

    this.props.unregister_module(this.module_id)

    clearInterval(this.checkSize)
  }

  calculate_rect_width = (d, movement_rect_height, scale_x) => {
    let begin_px = scale_x(d.begin)
    if (begin_px < this.margin.left) {
      begin_px = this.margin.left
    }

    let end_px = scale_x(d.end)
    if (end_px > this.width - this.margin.right) {
      end_px = this.width - this.margin.right
    }

    let rec_w = end_px - begin_px
    if (rec_w < movement_rect_height / 2) {
      rec_w = movement_rect_height / 2
    }

    return rec_w
  }

  y_row_offset = (row_height, patient_id, patientList) => {
    let index = patientList.findIndex((pid) => pid === patient_id)
    let yPos = index * row_height
    return this.height - yPos - this.margin.bottom
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

  y_treatment_offset = (
    patient_id,
    patientList,
    row_height,
    movement_rect_height
  ) => {
    return (
      this.y_row_offset(row_height, patient_id, patientList) -
      row_height +
      1.5 * movement_rect_height
    )
  }

  y_investigation_offset = (
    d,
    investigation_rectangle_height,
    patientList,
    row_height
  ) => {
    return (
      this.y_row_offset(row_height, d.patient_id, patientList) -
      investigation_rectangle_height
    )
  }

  boundary_x_scale = (scale_x, val) => {
    let px = scale_x(val)
    if (px < this.margin.left) {
      px = this.margin.left
    } else if (px > this.widh - this.margin.right) {
      px = this.width - this.margin.right
    }
    return px
  }

  draw_vis = () => {
    let self = this

    let data = this.filtered_data

    if (
      data === undefined ||
      this.width <= this.min_width ||
      this.height <= this.min_height ||
      this.height === undefined ||
      this.width === undefined
    ) {
      return
    }

    let fv = this.props.get_filter_values()

    let timespan = [fv.min_ts, fv.max_ts + 1000 * 60 * 60 * 24]

    let x_pixels = [this.margin.left, this.width - this.margin.right]

    let y_pixel_diff = this.height - this.margin.bottom - this.margin.top

    let row_height = this.row_height

    // TODO: this is to scale to height
    if (false) {
      row_height = y_pixel_diff / data.patientList.length
    }

    let movement_rectangle_height = row_height / 8

    let treatment_circle_r = movement_rectangle_height / 2

    let x_scale = d3.scaleLinear().domain(timespan).range(x_pixels)
    // let y_scale = d3.scaleLinear().domain([0, maxPixelOffset])

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

    /**
     * Virus Last Rects
     */

    let virusLastRects = this.gStatus_rects
      .selectAll(".virusLastRect")
      // .data(filtered_status_rects)
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
      // .transition()
      // .duration(trans_duration)
      .attr("x", (d) => this.boundary_x_scale(x_scale, d.begin))
      .attr("width", (d) =>
        this.calculate_rect_width(d, movement_rectangle_height, x_scale)
      )
      .attr(
        "y",
        (d) =>
          this.y_row_offset(row_height, d.PatientID, data.patientList) -
          this.row_height
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
      // .transition()
      // .duration(trans_duration)
      .attr("x", (d) => x_scale(d.symptomBeginn))
      .attr("width", (d) =>
        // rect_width({ begin: d.symptomBeginn, end: d.symptomEnde })
        this.calculate_rect_width(
          { begin: d.symptomBeginn, end: d.symptomEnde },
          movement_rectangle_height,
          x_scale
        )
      )
      .attr(
        "y",
        (d) =>
          this.y_row_offset({ patient_id: d.patientID }) - this.row_height + 30
      )
      .attr("height", this.row_height - 30)
      .attr("fill", "white")
      .attr("stroke", "black")
      .attr("opacity", 0.5)
    // .attr("stroke-dasharray", "5,10,5")

    symptomRect.exit().remove()

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

    let injectionPath_small = d3.symbol().type(injectionShape).size(1)

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
      // .transition()
      // .duration(trans_duration)
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
          (this.y_row_offset(row_height, d.PatientenID, data.patientList) -
            46 * 2) +
          ")"
      )
    // .attr("transform", "rotate(" + 50 + ")")

    spritzen_on_timeline.exit().remove()

    /**
     * Horizontal Lines
     */

    let patient_lines = this.gHorizontal_Lines
      .selectAll(".h_line")
      .data(data.patientList)

    patient_lines
      .enter()
      .append("line")
      .attr("class", "h_line")
      .merge(patient_lines)
      .attr("x1", (d) => this.margin.left)
      .attr("x2", (d) => this.width - this.margin.right)
      .attr(
        "y1",
        (d, i) =>
          this.y_row_offset(row_height, d, data.patientList) - row_height
      )
      .attr(
        "y2",
        (d, i) =>
          this.y_row_offset(row_height, d, data.patientList) - row_height
      )
      .attr("stroke", "black")
      .attr("stroke-width", 1)
    // .attr("opacity", 0.5)

    patient_lines.exit().remove()

    /** Scroll Bar */

    self.gScrollbar.selectAll("*").remove()

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

    self.filter_data()
    self.draw_vis()
  }

  render() {
    let self = this

    let element_to_draw = null
    if (this.props.get_original_data(this.module_type) === undefined) {
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

    if (element_to_draw === null && this.filtered_data === undefined) {
      element_to_draw = (
        <div className="too_small">{this.translate("empty_data")}</div>
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
          ref={(element) => (this.svgRoot = element)}
          style={{
            pointerEvents: "all",
            display: element_to_draw === null ? "block" : "none",
          }}
        />
      </div>
    )
  }
}

export default PatientDetail
