import { Component } from "react"
import * as d3 from "d3"
import moment from "moment"
import "./linelist.css"

class Linelist extends Component {
  constructor(props) {
    super(props)

    this.module_id = props.create_new_id()
    this.module_type = "linelist"
    /**
     * TODOS:
     * - mouse line/timestamp selection/ drag slider
     * - show patient labels at side
     * - show timestamp current time at mouseline
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

    this.dragging_active = false
    this.drag_x_start = 0

    this.state = {
      too_small: false,
    }

    this.width
    this.height

    this.socket = props.socket.client
    this.translate = props.translate
    this.get_color = props.get_color

    this.default_movement_color = "lightgray"

    this.title = this.translate("Linelist")

    this.row_height = 50

    // TODO de-selektierte Patienten niedriger machen?
    /**
     * Würde rewrite der y-psoitions-berechnung benötigen:
     * - sortierte Liste der Patienten mit den entsprechenden höhen abhängig vom Selektiert-Status
     * - Aktuell/davor: eifnach index des Patienten mit der generischen Reihenhöhe multiplizieren
     */
    this.row_height_small = 20

    // TODO needs to be reset to 0 if new data is incoming...
    // currently new data arrives at main.js and it just calls draw_vis on every module
    this.currentPixelOffset = 0

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
      top: 20,
      // top: this.title_height + this.timestamp_height * 2,
      // top: 0,
      bottom: 20,
      left: 50,
      right: 25,
    }
  }

  move_linelist_container_x = (x_offset) => {
    this.gGraphics
      // .select(".linelist")
      .attr(
        "transform",
        (d) => "translate(" + x_offset + " " + this.currentPixelOffset + ")"
      )
    this.gUIContainer
      // .select(".linelist")
      .attr("transform", (d) => "translate(" + x_offset + " " + "0" + ")")
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
        title:
          this.translate("patient") +
          " " +
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
          // ["Station", d.station_id],
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
          this.translate("Result") +
          ": " +
          d.result,
        header: [
          //   this.translate("result"),
          //   this.translate("pathogen"),
          //   this.translate("antibiotika"),
          //   this.translate("material"),
          //   this.translate("id"),
          this.translate("number"),
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
          o.count,
          o.KeimID,
          // o.MREKlasseID,
          o.Material_l,
          o.Befundkommentar,
        ])
      })
    } else if (i === "infection_status") {
      tableObj = {
        header: ["Patient"],
        content: [d.patient_id],
      }
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

  filter_data = () => {
    let pfv = this.props.get_possible_filter_values()

    let { station, min_ts, max_ts, patients } = this.props.get_filter_values()

    let original_data = this.props.get_original_data(this.module_type)

    let movement_rects = []
    let movement_dots = []

    let investigation_rects = []
    let status_rects = []

    let data_length = 0

    if (original_data && original_data.data) {
      data_length =
        original_data.data.status_rects.length +
        original_data.data.investigation_rects.length +
        original_data.data.movement_dots.length +
        original_data.data.movement_rects.length
    }
    if (original_data && original_data.data && data_length > 0) {
      // ! Panning preload
      let timespan_to_add = max_ts - min_ts
      if (timespan_to_add < 3 * 1000 * 60 * 60 * 24) {
        timespan_to_add = 3 * 1000 * 60 * 60 * 24
      }
      min_ts = min_ts - timespan_to_add
      max_ts = max_ts + timespan_to_add

      movement_rects = original_data.data.movement_rects.filter(
        (d) =>
          patients.includes(d.patient_id) &&
          !(d.begin > max_ts + 1000 * 60 * 60 * 24 || d.end < min_ts)
      )

      movement_dots = original_data.data.movement_dots.filter(
        (d) =>
          patients.includes(d.patient_id) &&
          !(d.begin > max_ts + 1000 * 60 * 60 * 24 || d.end < min_ts)
      )

      investigation_rects = original_data.data.investigation_rects.filter(
        (d) =>
          patients.includes(d.patient_id) &&
          !(d.timestamp > max_ts + 1000 * 60 * 60 * 24 || d.timestamp < min_ts)
      )

      status_rects = original_data.data.status_rects.filter(
        (d) => !(d.begin > max_ts + 1000 * 60 * 60 * 24 || d.end < min_ts)
      )

      // adjust the filtered data to the selected filters (colorizatin, resizing, ...)
      let fv = this.props.get_filter_values()

      let timespan = [fv.min_ts, fv.max_ts + 1000 * 60 * 60 * 24]

      this.filtered_data = {
        movement_rects,
        movement_dots,
        investigation_rects,
        status_rects,
        patientList: original_data.data.patientList, // TODO
      }
    } else {
      this.filtered_data = undefined
    }
  }

  componentDidMount() {
    let self = this

    console.log("linelist module did mount")

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

    /**
     * TODO: hier werden die "g" objecte initialisiert (und andere Sachen)
     */

    let svg = (this.gGraphics = d3
      .select(self.svgRoot)
      .on("mouseup", (e, d) => {
        // console.log("mouseup")

        if (this.dragging_active) {
          this.dragging_active = false
          this.move_linelist_container_x(0)

          let x_pixels_diff = this.drag_x_start - d3.event.layerX

          let pfv = this.props.get_possible_filter_values()
          let fv = this.props.get_filter_values()

          // Zeit ausrechnen
          let timespan = [fv.min_ts, fv.max_ts + 1000 * 60 * 60 * 24]
          let x_pixels = [this.margin.left, this.width - this.margin.right]
          let ms_pro_pixel =
            (timespan[1] - timespan[0]) / (x_pixels[1] - x_pixels[0])
          let ms_diff = ms_pro_pixel * x_pixels_diff

          if (fv.min_ts + ms_diff <= pfv.min_ts) {
            ms_diff = pfv.min_ts - fv.min_ts
          } else if (fv.max_ts + ms_diff >= pfv.max_ts) {
            ms_diff = pfv.max_ts - fv.max_ts
          } else {
            // hier auf einen ganzen Tag runden!
            let days_diff = Math.floor(ms_diff / (1000 * 60 * 60 * 24))
            if (ms_diff < 0) {
              days_diff = Math.ceil(ms_diff / (1000 * 60 * 60 * 24))
            }
            ms_diff = days_diff * (1000 * 60 * 60 * 24)
          }

          this.props.change_filter_timespan(
            fv.min_ts + ms_diff,
            fv.max_ts + ms_diff
          )
        }
      })
      .on("mousedown", (e, d) => {
        // console.log("mousedown")

        this.dragging_active = true
        this.drag_x_start = d3.event.layerX
      })
      .on("dblclick", (e, d) => {
        // console.log("dblclick")
      })
      .on("mouseout", (e, d) => {
        // console.log("mouseout")
        // this.dragging_active = false
      })
      .on("mousemove", (e, d) => {
        if (this.dragging_active) {
          // let x_diff = d3.event.layerX - this.drag_x_start
          // console.log(x_diff)

          let x_pixels_diff = this.drag_x_start - d3.event.layerX

          let pfv = this.props.get_possible_filter_values()
          let fv = this.props.get_filter_values()

          // Zeit ausrechnen
          let timespan = [fv.min_ts, fv.max_ts + 1000 * 60 * 60 * 24]
          let x_pixels = [this.margin.left, this.width - this.margin.right]
          let ms_pro_pixel =
            (timespan[1] - timespan[0]) / (x_pixels[1] - x_pixels[0])
          let ms_diff = ms_pro_pixel * x_pixels_diff

          if (fv.min_ts + ms_diff < pfv.min_ts) {
            ms_diff = pfv.min_ts - fv.min_ts
          } else if (fv.max_ts + ms_diff > pfv.max_ts) {
            ms_diff = pfv.max_ts - fv.max_ts
          }

          let x_diff = ms_diff / ms_pro_pixel

          this.move_linelist_container_x(-x_diff)
        }
        // console.log("mousemove")
      })
      .on("mouseenter", (e, d) => {
        // console.log("mouseenter")
      })
      .on("mouseleave", (e, d) => {
        // console.log("mouseleave")

        if (this.dragging_active) {
          this.dragging_active = false
          this.move_linelist_container_x(0)

          let x_pixels_diff = this.drag_x_start - d3.event.layerX

          let pfv = this.props.get_possible_filter_values()
          let fv = this.props.get_filter_values()

          // Zeit ausrechnen
          let timespan = [fv.min_ts, fv.max_ts + 1000 * 60 * 60 * 24]
          let x_pixels = [this.margin.left, this.width - this.margin.right]
          let ms_pro_pixel =
            (timespan[1] - timespan[0]) / (x_pixels[1] - x_pixels[0])
          let ms_diff = ms_pro_pixel * x_pixels_diff

          if (fv.min_ts + ms_diff <= pfv.min_ts) {
            ms_diff = pfv.min_ts - fv.min_ts
          } else if (fv.max_ts + ms_diff >= pfv.max_ts) {
            ms_diff = pfv.max_ts - fv.max_ts
          } else {
            // hier auf einen ganzen Tag runden!
            let days_diff = Math.floor(ms_diff / (1000 * 60 * 60 * 24))
            if (ms_diff < 0) {
              days_diff = Math.ceil(ms_diff / (1000 * 60 * 60 * 24))
            }
            ms_diff = days_diff * (1000 * 60 * 60 * 24)
          }

          this.props.change_filter_timespan(
            fv.min_ts + ms_diff,
            fv.max_ts + ms_diff
          )
        }
      })
      .on("wheel", (e, d) => {
        let fv = this.props.get_filter_values()
        let pfv = this.props.get_possible_filter_values()

        // Negativ = Rad nach oben schieben = Zoom In
        // Positiv = Rad nach unten schieben = Zoom out
        let scroll = d3.event.deltaY

        let percentage_days = 0.1
        let current_ammount_of_days =
          (fv.max_ts - fv.min_ts) / (1000 * 60 * 60 * 24)

        let max_days = (pfv.max_ts - pfv.min_ts) / (1000 * 60 * 60 * 24)

        let days_to_modify = Math.ceil(
          percentage_days * current_ammount_of_days
        )

        if (days_to_modify === 0) {
          days_to_modify = 1
        }

        // most-left: 0
        // most-right: 1
        // middle: 0.5
        let pointer_x_position = d3.event.layerX / this.width
        let invert_pointer_x_position = 1 - pointer_x_position

        let days_left = Math.round(pointer_x_position * days_to_modify)
        let days_right = Math.round(invert_pointer_x_position * days_to_modify)

        let new_min_ts = fv.min_ts
        let new_max_ts = fv.max_ts

        if (scroll < 0) {
          if (current_ammount_of_days <= 1) {
            return
          }
          new_min_ts = fv.min_ts + days_left * 1000 * 60 * 60 * 24
          new_max_ts = fv.max_ts - days_right * 1000 * 60 * 60 * 24
        } else if (scroll > 0) {
          if (current_ammount_of_days === max_days) {
            return
          }
          new_min_ts = Math.max(
            pfv.min_ts,
            fv.min_ts - days_left * 1000 * 60 * 60 * 24
          )
          new_max_ts = Math.min(
            pfv.max_ts,
            fv.max_ts + days_right * 1000 * 60 * 60 * 24
          )
        }
        this.props.change_filter_timespan(new_min_ts, new_max_ts)
      })
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
    this.gHorizontalMarginBars = uicontainer
      .append("g")
      .attr("class", "gHorizontalMarginBars")

    this.gGridlines = uicontainer.append("g").attr("class", "gGridlines")

    // this.gVerticalMarginBars = svg
    this.gVerticalMarginBars = uicontainer
      .append("g")
      .attr("class", "gVerticalMarginBars")

    this.gLegend = svg.append("g").attr("class", "gLegend")

    this.gCritical_patient_border = svg
      .append("g")
      .attr("class", "gCritical_patient_border")

    this.gMarginBars = d3
      .select(self.svgRoot)
      .append("g")
      .attr("class", "gMarginBars")

    this.gScrollbar = d3
      .select(self.svgRoot)
      .append("g")
      .attr("class", "gScrollbar")

    self.filter_data()
    this.draw_vis()
  }

  componentWillUnmount() {
    this.socket.off("linelist")

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

    /**
     * Drawing Margin bars for
     * ! Panning preload
     */
    let marginbars = this.gMarginBars.selectAll(".marginbar").data([
      { x: 0, width: this.margin.left, height: this.height },
      {
        x: this.width - this.margin.right,
        width: this.margin.right,
        height: this.height,
      },
      // Top Margin bar lasse ich weg
      // { x: 0, width: this.width, height: this.margin.top },
    ])

    marginbars
      .enter()
      .append("rect")
      .attr("class", "marginbar")
      .merge(marginbars)
      .attr("fill", "white")
      .attr("x", (d) => d.x)
      .attr("y", 0)
      .attr("width", (d) => d.width)
      .attr("height", (d) => d.height)

    marginbars.exit().remove()

    // TODO: this is to scale to height
    if (false) {
      row_height = y_pixel_diff / data.patientList.length
    }

    let movement_rectangle_height = row_height / 8
    let investigation_rectangle_height = (row_height / 8) * 6
    let investigation_rect_width = movement_rectangle_height

    let treatment_circle_r = movement_rectangle_height / 2

    let x_scale = d3.scaleLinear().domain(timespan).range(x_pixels)
    // let y_scale = d3.scaleLinear().domain([0, maxPixelOffset])

    let parse_time = d3.timeParse("%Q")
    // ! Panning preload
    let timespan_diff = timespan[1] - timespan[0]
    // ! Panning preload
    let x_pixels_diff = x_pixels[1] - x_pixels[0]

    let x_axis_scale = d3
      .scaleTime()
      // .domain(d3.extent(timespan, (d) => parse_time(d)))
      // .range(x_pixels)
      // ! Panning preload
      .domain(
        d3.extent(
          [timespan[0] - timespan_diff, timespan[1] + timespan_diff],
          (d) => parse_time(d)
        )
      )
      // ! Panning preload
      .range([x_pixels[0] - x_pixels_diff, x_pixels[1] + x_pixels_diff])

    let x_axis = d3
      .axisBottom(x_axis_scale)
      // .ticks(5)
      // ! Panning preload
      .ticks(15)
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
      .attr("x", (d) =>
        // this.boundary_x_scale(x_scale, d.begin)
        // ! Panning preload
        x_scale(d.begin)
      )
      .attr("width", (d) => {
        // this.calculate_rect_width(d, movement_rectangle_height, x_scale)
        // ! Panning preload
        let rec_w = x_scale(d.end) - x_scale(d.begin)
        if (rec_w < movement_rectangle_height / 2) {
          rec_w = movement_rectangle_height / 2
        }

        return rec_w
      })
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
        // let col = self.default_movement_color
        let col = "white"

        if (fv.station === d.station_id) {
          // col = "#1b9e77"
          col = this.props.get_station_color(d.station_id)
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
      // .attr("fill", "cyan")
      .attr("fill", "white")
      .attr("stroke", "black")
      .attr("stroke-width", 1)

    movement_dots.exit().remove()

    /**
     * Investigation Rects
     */

    let investigation_rects = this.gInvestigation_rects
      .selectAll(".investigation_rect")
      .data(data.investigation_rects)

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
      // Beginn des Investigation Rects sollte eigentlich auch linke Kante sein
      // und nicht die Mitte des Reccts (?!)
      .attr("x", (d) =>
        // this.boundary_x_scale(x_scale, d.timestamp)
        // ! Panning preload
        x_scale(d.timestamp)
      )
      .attr("width", (d) => investigation_rect_width)
      .attr("y", (d) =>
        this.y_investigation_offset(
          d,
          investigation_rectangle_height,
          data.patientList,
          row_height
        )
      )
      .attr("height", investigation_rectangle_height)
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
     * critical patient highlight
     */

    let crit_pat = []
    if (fv.critical_patient !== "") {
      crit_pat = [fv.critical_patient]
    }

    let critical_patient_border = this.gCritical_patient_border
      .selectAll(".critical_patient_border")
      .data(crit_pat)

    critical_patient_border
      .enter()
      .append("rect")
      .attr("class", "critical_patient_border")
      .merge(critical_patient_border)
      .attr("width", self.width - self.margin.left - self.margin.right)
      .attr("height", row_height)
      .attr("x", self.margin.left)
      .attr(
        "y",
        (d) => this.y_row_offset(row_height, d, data.patientList) - row_height
      )

    critical_patient_border.exit().remove()

    /**
     * Status Rects
     */

    let status_rects = this.gStatus_rects
      .selectAll(".status_rect")
      // .data(filtered_status_rects)
      .data(data.status_rects)

    status_rects
      .enter()
      .append("rect")
      .attr("class", "status_rect")
      .merge(status_rects)
      .attr("cursor", "pointer")
      .on("contextmenu", (d) => {
        this.props.init_contextmenu(d.patient_id)
      })
      .on("click", (d) => {
        console.log(d)
        // this.props.change_filter_critical_patient(d.patient_id)

        if (fv.patients.includes(d.patient_id)) {
          this.props.change_filter_patients_delete(d.patient_id)
        } else {
          this.props.change_filter_patients_add(d.patient_id)
        }
      })
      .on("mouseenter", (d) => {
        this.update_tooltip(d, "infection_status")
      })
      .on("mousemove", () => {
        this.props.move_tooltip(d3.event.pageX, d3.event.pageY)
        this.props.show_tooltip()
      })
      .on("mouseout", () => {
        this.props.hide_tooltip()
      })
      .attr("x", (d) =>
        // this.boundary_x_scale(x_scale, d.begin)
        // ! Panning preload
        x_scale(d.begin)
      )
      .attr("width", (d) => {
        // this.calculate_rect_width(d, movement_rectangle_height, x_scale)
        // ! Panning preload
        let rec_w = x_scale(d.end) - x_scale(d.begin)
        if (rec_w < movement_rectangle_height / 2) {
          rec_w = movement_rectangle_height / 2
        }

        return rec_w
      })
      .attr(
        "y",
        (d) =>
          this.y_row_offset(row_height, d.patient_id, data.patientList) -
          row_height
      )
      .attr("height", row_height)
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
      .attr("opacity", (d) => {
        let o = 0.5
        if (!fv.patients.includes(d.patient_id)) {
          o = 0.1
        }
        return o
      })

    status_rects.exit().remove()

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
      // ! Panning preload
      .attr("x1", (d) => this.margin.left - x_pixels_diff)
      .attr("x2", (d) => this.width - this.margin.right + x_pixels_diff)
      .attr(
        "y1",
        (d, i) =>
          // ! Panning preload
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

    let max_patient_rows = Math.floor(
      (this.height - this.margin.top - this.margin.bottom) / row_height
    )
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
      handle.attr("cy", y(h))
      self.currentPixelOffset = h

      self.gGraphics.attr(
        "transform",
        "translate(" + 0 + " " + self.currentPixelOffset + ")"
      )
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

export default Linelist
