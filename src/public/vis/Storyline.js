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

    this.dragging_active = false
    this.drag_x_start = 0

    this.data
    this.width
    this.height

    this.state = {
      // TODO
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
      top: 20,
      right: 25,
      bottom: 20,
      left: 50,
      // text: 20,
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
  }

  move_storyline_container_x = (x_offset) => {
    this.gGraphics
      // .select(".linelist")
      .attr("transform", (d) => "translate(" + x_offset + " " + 0 + ")")
    // this.gUIContainer
    // .select(".linelist")
    // .attr("transform", (d) => "translate(" + x_offset + " " + "0" + ")")
  }

  componentDidMount() {
    let self = this

    console.log("Storyline module did mount")

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
      .on("mouseup", (e, d) => {
        // console.log("mouseup")

        if (this.dragging_active) {
          this.dragging_active = false
          this.move_storyline_container_x(0)

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

          this.move_storyline_container_x(-x_diff)
        }
        // console.log("mousemove")
      })
      .on("mouseleave", (e, d) => {
        // console.log("mouseleave")

        if (this.dragging_active) {
          this.dragging_active = false
          this.move_storyline_container_x(0)

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
      .attr("class", "gContainer storylineContainer")

    let svg = self.gGraphics

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

    this.gMarginBars = d3
      .select(self.svgRoot)
      .append("g")
      .attr("class", "gMarginBars")

    this.filter_data()
    this.draw_vis()
  }

  filter_data = () => {
    // TODO
    let pfv = this.props.get_possible_filter_values()

    let { station, min_ts, max_ts, patients } = this.props.get_filter_values()

    let original_data = this.props.get_original_data(this.module_type)
    console.log("DATA FILTERING LOGS")
    console.log(original_data)

    /**
     * TODO:
     * - Knoten im Pfade-Objekt filtern -> ka ob done
     * - skallierung nach Filter anpassen wie Linelist etc. -> ist doch schon done?
     */

    if (original_data && original_data.no_data !== true) {
      let filtered_paths_data = []
      let path_width = original_data.path_width
      let calc_width = original_data.calc_width
      let calc_height = original_data.calc_height
      // Station Path wird heir nicht gefiltert, da home/tmphome immer gebraucht werden
      let station_paths = original_data.station_paths

      // ! Panning preload
      let timespan_to_add = max_ts - min_ts
      if (timespan_to_add < 3 * 1000 * 60 * 60 * 24) {
        timespan_to_add = 3 * 1000 * 60 * 60 * 24
      }
      min_ts = min_ts - timespan_to_add
      max_ts = max_ts + timespan_to_add

      original_data.pathsData.forEach((pd) => {
        /**
         * was ich machen will:
         * - jeden Path durchgehen, und nur die Knoten drin lassen
         *    die in die gefilterte Zeitspanne fallen
         * - Falls Knoten davor/danach weggeschnitten wurde, einen hinzufügenb auf der Höhe des letzten...
         *
         * Sonderfall: delete_before und delete_after beides true
         * --> Damit Linie nicht rausgefiltert wird sondern angezeigt wird
         *  den letzten Knoten davor und den ersten danach speichern und beibehalten
         */
        let deleted_before = false
        let deleted_after = false
        let remaining_path_nodes = []

        let last_deleted_before = undefined
        let first_deleted_after = undefined
        pd.path.forEach((node) => {
          if (node.timestamp <= min_ts) {
            deleted_before = true
            // ! Panning preload
            last_deleted_before = {
              patientCount: node.patientCount,
              patientID: node.patientID,
              position: node.position,
              timestamp: min_ts,
              node: {
                y: node.node.y,
                space: node.node.space,
              },
            }
          } else if (node.timestamp >= max_ts) {
            // ! Panning preload
            if (!deleted_after) {
              first_deleted_after = {
                patientCount: node.patientCount,
                patientID: node.patientID,
                position: node.position,
                timestamp: max_ts,
                node: {
                  y: node.node.y,
                  space: node.node.space,
                },
              }
            }
            deleted_after = true
          } else {
            // not deleted
            remaining_path_nodes.push({
              patientCount: node.patientCount,
              patientID: node.patientID,
              position: node.position,
              timestamp: node.timestamp,
              node: {
                y: node.node.y,
                space: node.node.space,
              },
            })
          }
        })

        if (remaining_path_nodes.length > 0) {
          if (deleted_before) {
            let node = remaining_path_nodes[0]
            let copy = {
              patientCount: node.patientCount,
              patientID: node.patientID,
              position: node.position,
              timestamp: min_ts,
              node: {
                y: node.node.y,
                space: node.node.space,
              },
            }
            remaining_path_nodes.unshift(copy)
          }

          if (deleted_after) {
            let node = remaining_path_nodes[remaining_path_nodes.length - 1]
            let copy = {
              patientCount: node.patientCount,
              patientID: node.patientID,
              position: node.position,
              timestamp: max_ts,
              node: {
                y: node.node.y,
                space: node.node.space,
              },
            }
            remaining_path_nodes.push(copy)
          }

          filtered_paths_data.push({
            path: remaining_path_nodes,
            patientID: pd.patientID,
            status: pd.status,
          })
        } else if (deleted_before && deleted_after) {
          // ! Panning preload
          remaining_path_nodes.push(last_deleted_before)
          remaining_path_nodes.push(first_deleted_after)

          filtered_paths_data.push({
            path: remaining_path_nodes,
            patientID: pd.patientID,
            status: pd.status,
          })
        }
      })

      this.filtered_data = {
        // TODO
        paths_to_draw: filtered_paths_data,
        station_paths: station_paths,
        path_width: path_width,
        calc_width: calc_width,
        calc_height: calc_height,
      }
      // this.filtered_data = original_data
    } else {
      this.filtered_data = undefined
    }
  }

  componentWillUnmount() {
    this.socket.off("storyline")

    this.props.unregister_module(this.module_id)

    clearInterval(this.checkSize)
  }

  draw_vis = (zooming) => {
    let self = this

    console.log("new storyline draw_vis started")

    // TODO necessary?
    moment.locale("de")

    let data = this.filtered_data
    console.log(data)

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

    let homeRect = self.ghome.selectAll("rect").data([1])

    homeRect
      .enter()
      .append("rect")
      .attr("class", "home-rect")
      .merge(homeRect)
      .attr("x", -this.width)
      .attr("y", 0)
      .attr("width", self.width * 3)
      // .attr("height", 50 - 10)
      .attr("height", this.margin.top)
      .attr("fill", "rgb(200, 200, 200)")

    homeRect.exit().remove()

    let tmphome_max_patients = data.station_paths["tmphome"][0].maxPatients
    let tmphomeMargin = tmphome_max_patients * data.path_width + data.path_width
    /**
     * old code:
     let tmphomeStationData = self.stationPathsData.find(
      (d) => d.stationID === "tmphome"
    )
    self.tmphomeMargin = tmphomeStationData
      ? tmphomeStationData.maxPatients * pathWidth
      : 0
     */

    let tmphomeRect = self.gtmphome.selectAll("rect").data([1])

    tmphomeRect
      .enter()
      .append("rect")
      .attr("class", "tmphome-rect")
      .merge(tmphomeRect)
      .attr("x", -this.width)
      // .attr("y", self.height - 20 - self.tmphomeMargin + 10)
      .attr("y", self.height - self.margin.bottom - tmphomeMargin)
      .attr("width", self.width * 3)
      .attr("height", tmphomeMargin) // TODO
      .attr("fill", "rgb(200, 200, 200)")
      .attr("opacity", 0.5)

    tmphomeRect.exit().remove()

    /**
     * Drawing the paths/lines of patients
     */

    let scaleTimestampToX = d3
      .scaleLinear()
      // .domain([fv.min_ts, fv.max_ts])
      // .range([self.margin.left, this.width - self.margin.right])
      // ! Panning preload
      .domain(
        d3.extent(
          [timespan[0] - timespan_diff, timespan[1] + timespan_diff],
          (d) => parse_time(d)
        )
      )
      // ! Panning preload
      .range([x_pixels[0] - x_pixels_diff, x_pixels[1] + x_pixels_diff])

    let scaleCalcHeightToY = d3
      .scaleLinear()
      .range([
        self.margin.top,
        this.height - self.margin.bottom - tmphomeMargin,
      ])
      .domain([0, data.calc_height])

    let interpolation = d3
      .line()
      .x((d) => {
        return scaleTimestampToX(d.timestamp)
      })
      .y((d) => {
        let yPos =
          scaleCalcHeightToY(d.node.y) -
          ((d.patientCount - 1) / 2) * data.path_width
        yPos += d.position * data.path_width
        if (d.node.space === "home") {
          // yPos = scaleCalcHeightToY(d.node.y) - self.margin.top / 2
          yPos = self.margin.top / 2
        } else if (d.node.space === "tmphome") {
          // yPos =
          //   scaleCalcHeightToY(d.node.y) +
          //   d.position * data.path_width +
          //   data.path_width
          yPos =
            self.height -
            self.margin.bottom -
            tmphomeMargin +
            data.path_width +
            d.position * data.path_width
        }
        return yPos
      })
      // .curve(d3.curveLinear)
      .curve(d3.curveBasis)
    // .curve(d3.curveBundle)
    // .curve(d3.curveCardinal)
    // .curve(d3.curveNatural)

    let paths = self.gPaths.selectAll("path").data(data.paths_to_draw)

    paths
      .enter()
      .append("path")
      .merge(paths)
      .attr("cursor", "pointer")
      .attr("d", (d) => interpolation(d.path))
      .on("contextmenu", (d) => {
        let e = d3.event
        let xpos = e.pageX
        let ypos = e.pageY
        e.preventDefault()

        this.props.init_contextmenu(d.patientID, true, xpos, ypos)
      })
      .on("mouseenter", (d) => {
        this.update_tooltip(d, "patient")
      })
      .on("mousemove", () => {
        this.props.move_tooltip(d3.event.pageX, d3.event.pageY)
        this.props.show_tooltip()
      })
      .on("mouseout", () => {
        this.props.hide_tooltip()
      })
      .on("click", (d) => {
        // TODO select as critical patient
        // TODO rightclick load_all_contacts
        console.log(d)
        // this.props.change_filter_critical_patient(d.patientID)

        if (fv.patients.includes(d.patientID)) {
          this.props.change_filter_patients_delete(d.patientID)
        } else {
          this.props.change_filter_patients_add(d.patientID)
        }
      })
      .attr("fill", (d) => {
        let r = "none"

        return r
      })
      .attr("stroke-width", (d) => {
        let r = 4

        if (d.movementPath === true) {
          r = 1
        }
        if (fv.critical_patient == d.patientID) {
          r = 7
        }
        if (d.notRelevant === true) {
          r = 1
        }
        return r
      })
      .attr("opacity", (d) => {
        let r = 1
        // if (self.state.getAnzeigeart == 0) {
        //   r = 0.8
        // } else if (self.state.getAnzeigeart == 1) {
        //   r = ` ${self.selectedPatients.includes(d.patientID) ? 0.8 : 0.2}`
        // } else if (self.state.getAnzeigeart == 2) {
        //   // hier muss eine Verbreitungsrichtung ausgewählt sein
        //   // ansonsten einfach alle anzeigen
        //   if (self.state.getVerbreitungsrichtung == 0) {
        //     r = 0.8
        //   }
        // }

        if (self.criticalPatient == d.patientID) {
          r = 1
        }
        if (d.notRelevant === true) {
          r = 0.5
        }

        if (!fv.patients.includes(d.patientID)) {
          r = 0.1
        }

        return r
      })
      // .attr("pointer-events", "none")
      .attr("pointer-events", "visiblePainted")
      .attr("stroke", (d) => {
        let c = "black"

        // TODO
        // weil patient 66512 manchmal, wenn sehr viele
        // Patienten geladen sind) undefined ist ...
        // !das hier ist der Workaround dazu
        if (d.status === undefined) {
          d.status = "statusKrank"
        }

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

    /**
     * Drawing the Station Bubbles in Storyline
     */

    let stationInterpolation = d3
      .line()
      .x((d) => {
        return scaleTimestampToX(d.timestamp)
      })
      .y((d) => {
        let yPos = scaleCalcHeightToY(d.y)
        return yPos
      })
      .curve(d3.curveBasis)

    // let filtered_station_paths = data.station_paths[fv.station]
    //   ? data.station_paths[fv.station]
    //   : []

    // !Storyline Layout Change: Station same y-position
    let all_station_paths = []
    for (let d in data.station_paths) {
      let e = data.station_paths[d]

      if (d !== "home" && d !== "tmphome") {
        all_station_paths.push(...e)
      }
    }

    let station_paths = self.gStationPaths
      .selectAll("path")
      .data(all_station_paths)

    station_paths
      .enter()
      .append("path")
      .on("click", (d) => {
        let new_station = d.stationID
        if (new_station === fv.station) {
          new_station = ""
        }
        this.props.change_filter_station(new_station)
      })
      .merge(station_paths)
      .on("mouseenter", (d) => {
        this.update_tooltip(d, "station")
      })
      .on("mousemove", () => {
        this.props.move_tooltip(d3.event.pageX, d3.event.pageY)
        this.props.show_tooltip()
      })
      .on("mouseout", () => {
        this.props.hide_tooltip()
      })
      .attr("cursor", "pointer")
      .attr("fill", "none")
      .attr("stroke-linecap", "round")
      .attr("opacity", (d) => {
        let o = 0.2

        if (fv.station === d.stationID) {
          o = 1
        }

        return o
      })
      .attr("d", (d) => stationInterpolation(d.path))
      // pathWIdth = 8 !
      .attr("stroke-width", (d) => d.maxPatients * data.path_width + 6)
      // .attr("stroke", d => color(d.stationID))
      .attr("stroke", (d) => {
        let c = "lightgray"

        if (fv.station === d.stationID) {
          c = this.props.get_station_color(d.stationID)
        }

        return c
      })

    station_paths.exit().remove()

    console.log("new storyline draw_vis finished")

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
        // title: "Station",,
        header: ["Station"],
        content: [d.stationID],
      }
    } else if (i === "patient") {
      tableObj = {
        // title: "Patient " + d.patientID + " | " + this.translate(d.status),
        header: ["Patient " + d.patientID],
        content: [this.translate(d.status)],
      }
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

  render() {
    let self = this

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
          className="svgRoot storylineSVG"
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

export default Storyline
