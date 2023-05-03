import { Component } from "react"
import * as d3 from "d3"
import moment from "moment"

class Kontaktnetzwerk extends Component {
  constructor(props) {
    super(props)

    this.module_id = props.create_new_id()
    this.module_type = "kontaktnetzwerk"

    this.min_width = 150
    this.min_height = 150

    this.data
    this.width
    this.height

    this.state = {
      too_small: false,
      locations: [],
      selected_location_index: undefined,
    }

    this.socket = props.socket.client
    this.translate = props.translate
    this.get_color = props.get_color

    this.margin = {
      top: 25,
      bottom: 25,
      left: 25,
      right: 25,
    }

    this.title = this.translate("Kontaktnetzwerk")

    this.transition_duration = 200

    this.node_radius = 10
    this.node_padding = 100

    this.link_width = 5

    this.station_bubble_thickness = 10

    /**
     * Variablen
     */
    this.zoom = 1
    this.lastZoomK = 1
    this.lastZoomX = 0
    this.lastTransformedX = 0

    this.lastZoomY = 0
    this.lastTransformedY = 0

    this.old_scal_fact = 1
  }

  filter_data = () => {
    let { station, min_ts, max_ts, patients, location } =
      this.props.get_filter_values()

    console.log(">>>>>>>>>> asking for data")
    let original_data = this.props.get_original_data(this.module_type)
    console.log("<<<<<<<<<< copied the data")

    let graph_data = {
      nodes: [],
      links: [],
      min_y: 0,
      max_y: 1,
      min_x: 0,
      max_x: 1,
      vis_offset_x: 0,
      vis_offset_y: 0,
      station_nodes: [],
      station_links: [],
    }

    if (
      original_data &&
      original_data.data &&
      original_data.parameters &&
      original_data.data.graph_data &&
      original_data.data.graph_data[location]
    ) {
      // !"permanently" selected_pathogen, since this function should not be supported anymore
      let selected_pathogen = original_data.parameters.pathogen

      // TODO
      // TODO für jede possible location ein object anlegen...
      // TODO "last_status" bei den ndoes aus "all_status_changes" rausholen
      // TODO aber nur der, der < max_ts ist!!!
      // graph_data = original_data.data.graph_data[location]

      // min_ts, max_ts
      // graph_data.nodes.forEach((node) => {
      //   node.all_movements = node.all_movements.filter(
      //     (mv) => !(mv.end < min_ts || mv.begin > max_ts)
      //   )
      // })

      graph_data.nodes = original_data.data.graph_data[location].nodes.filter(
        (node) => {
          let movements = node.all_movements.filter(
            (mv) => !(mv.end < min_ts || mv.begin > max_ts)
          )

          node.status = "negative"
          node.all_status_changes.forEach((status) => {
            if (status.status_timestamp < max_ts) {
              node.status = status.status
            }
          })
          return movements.length > 0
        }
      )

      graph_data.links = original_data.data.graph_data[location].links.filter(
        (link) => {
          let contacts = link.contacts.filter(
            (con) =>
              patients.includes(con.patient_a) &&
              patients.includes(con.patient_b) &&
              !(con.end < min_ts || con.begin > max_ts)
          )

          return contacts.length > 0
        }
      )
      graph_data.min_y = original_data.data.graph_data[location].min_y
      graph_data.max_y = original_data.data.graph_data[location].max_y
      graph_data.min_x = original_data.data.graph_data[location].min_x
      graph_data.max_x = original_data.data.graph_data[location].max_x
      graph_data.vis_offset_y =
        original_data.data.graph_data[location].vis_offset_y
      graph_data.vis_offset_x =
        original_data.data.graph_data[location].vis_offset_x

      graph_data.station_nodes = original_data.data.graph_data[
        location
      ].nodes.filter((node) => {
        let is_patient_on_station_in_timespan = false

        for (let station_visit of node.all_visited_stations) {
          if (
            station_visit.station_id === station &&
            station_visit.ts_Beginn <= max_ts &&
            station_visit.ts_Ende >= min_ts &&
            patients.includes(node.id)
          ) {
            is_patient_on_station_in_timespan = true
          }
        }
        return is_patient_on_station_in_timespan
      })

      graph_data.station_links = original_data.data.graph_data[
        location
      ].links.filter((link) => {
        let do_patients_have_contact_on_station_in_timespano = false

        for (let contact of link.contacts) {
          if (
            contact.station_id === station &&
            contact.begin <= max_ts &&
            contact.end >= min_ts &&
            patients.includes(contact.patient_a) &&
            patients.includes(contact.patient_b)
          ) {
            do_patients_have_contact_on_station_in_timespano = true
          }
        }

        return do_patients_have_contact_on_station_in_timespano
      })

      this.filtered_data = { graph_data, selected_pathogen }
    } else {
      this.filtered_data = undefined
    }
  }

  componentDidMount() {
    let self = this

    console.log("Kontaktnetzwerk module did mount")

    // this.socket.on("kontaktnetzwerk", this.handle_data)

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

    let zoom = d3.zoom().on("zoom", () => {
      let containerWidth = parseInt(d3.select(self.svgRoot).style("width"))
      let containerHeight = parseInt(d3.select(self.svgRoot).style("height"))
      // let mitteModul = containerWidth / 2
      // statt Mitte Modul die Mausposition:
      if (d3.event.sourceEvent === null) {
        return
      }
      let mitteModulX = d3.event.sourceEvent.offsetX
      let mitteModulY = d3.event.sourceEvent.offsetY
      if (d3.event.sourceEvent.type === "wheel") {
        let prozentVerschiebungX =
          (self.lastTransformedX - mitteModulX) / (containerWidth * self.zoom)
        let prozentVerschiebungY =
          (self.lastTransformedY - mitteModulY) / (containerHeight * self.zoom)

        let newK = d3.event.transform.k
        if (newK > self.lastZoomK) {
          // rangezoomt
          self.zoom = self.zoom * 1.1
        } else {
          self.zoom = self.zoom / 1.1
          // if (self.zoom < 1) {
          //   self.zoom = 1
          // }
        }
        self.lastZoomK = newK
        self.lastZoomX = JSON.parse(JSON.stringify([d3.event.transform.x]))[0]
        self.lastZoomY = JSON.parse(JSON.stringify([d3.event.transform.y]))[0]

        let calculatedX =
          prozentVerschiebungX * self.zoom * containerWidth + mitteModulX
        let calculatedY =
          prozentVerschiebungY * self.zoom * containerHeight + mitteModulY

        // if (self.zoom === 1) {
        //   calculatedX = 0
        //   calculatedY = 0
        // }
        self.draw_vis(true)

        let deltaSVGx = containerWidth * self.zoom - containerWidth
        // if (deltaSVGx + calculatedX < 0) {
        //   calculatedX = -deltaSVGx
        // } else if (calculatedX > 0) {
        //   calculatedX = 0
        // }
        let deltaSVGy = containerHeight * self.zoom - containerWidth
        // if (deltaSVGy + calculatedY < 0) {
        //   calculatedY = -deltaSVGy
        // } else if (calculatedX > 0) {
        //   calculatedY = 0
        // }

        self.lastTransformedX = calculatedX
        self.lastTransformedY = calculatedY
        self.gGraphics.attr(
          "transform",
          "translate(" + calculatedX + " " + calculatedY + ")"
        )
      } else if (d3.event.sourceEvent.type === "mousemove") {
        let deltaX = d3.event.transform.x - self.lastZoomX
        let deltaY = d3.event.transform.y - self.lastZoomY
        let calculatedX = self.lastTransformedX
        let calculatedY = self.lastTransformedY
        let svgWidth = containerWidth * self.zoom
        let svgHeight = containerHeight * self.zoom
        let deltaSVGx = svgWidth - containerWidth
        let deltaSVGy = svgHeight - containerHeight

        // Diagramm verschiebt sich nach links
        // deltaSVGx - calculated x muss immer >= 0 sein
        calculatedX = calculatedX + deltaX
        // if (deltaSVGx + calculatedX < 0) {
        //   calculatedX = -deltaSVGx
        // } else if (calculatedX > 0) {
        //   calculatedX = 0
        // }
        calculatedY = calculatedY + deltaY
        // if (deltaSVGy + calculatedY < 0) {
        //   calculatedY = -deltaSVGy
        // } else if (calculatedY > 0) {
        //   calculatedY = 0
        // }

        self.lastTransformedX = calculatedX
        self.lastTransformedY = calculatedY
        self.gGraphics.attr(
          "transform",
          "translate(" + calculatedX + " " + calculatedY + ")"
        )
        self.lastZoomX = self.lastZoomX + deltaX
        self.lastZoomY = self.lastZoomY + deltaY
      }
    })

    this.width = parseInt(d3.select(self.svgRoot).style("width"))
    this.height = parseInt(d3.select(self.svgRoot).style("height"))

    /**
     * TODO: hier werden die "g" objecte initialisiert (und andere Sachen)
     */

    let svg = (this.gGraphics = d3
      .select(self.svgRoot)
      .call(zoom)
      .append("g")
      .attr("class", "kontaktnetzwerk"))

    this.gLegend = svg.append("g").attr("class", "gLegend")
    this.gLinkStation = svg.append("g").attr("class", "gLinkStation")
    this.gNodeStation = svg.append("g").attr("class", "gNodeStation")
    this.gLinks = svg.append("g").attr("class", "gLinks")
    this.gNodes = svg.append("g").attr("class", "gNodes")

    self.filter_data()
    this.draw_vis()
  }

  componentWillUnmount() {
    this.socket.off("kontaktnetzwerk")

    this.props.unregister_module(this.module_id)

    clearInterval(this.checkSize)
  }

  handle_data = (data) => {
    console.log("Kontaktnetzwerk vis data recieved")
    console.log(data)

    this.data = data.data
    this.parameters = data.parameters
    this.timestamp = data.timestamp

    this.reset_view()

    // if (this.data.data.graph_data === undefined) {
    //   return
    // }

    this.locations = []
    this.location_prop_names = []
    this.selected_location_index = undefined

    data.data.graph_data.forEach((gd, i) => {
      this.locations.push(gd.name)
      this.location_prop_names.push(gd.propname)
      if (i === 0) {
        this.selected_location_index = i
      }
    })

    this.setState((prevState) => {
      prevState.locations = this.locations
      prevState.selected_location_index = this.selected_location_index

      return prevState
    })

    this.draw_vis()
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
    let data = this.filtered_data

    let fv = this.props.get_filter_values()

    if (
      data === undefined ||
      this.width <= this.min_width ||
      this.height <= this.min_height ||
      this.height === undefined ||
      this.width === undefined
    ) {
      return
    }
    let graph_data = data.graph_data
    let selected_pathogen = data.selected_pathogen

    // TODO: zooming implementieren
    let zoom = this.zoom

    console.log(`drawing Kontaktnetzwerk with zoom ${zoom}`)

    /**
     * Titel + Timestamp
     */

    // TODO: Noch nicht auf Modul-größe skalliert (und kein zoom etc)
    /**
     * Calculate scaling factor and translation to middle
     */

    let vis_height = this.height - this.margin.top - this.margin.bottom
    let vis_width = this.width - this.margin.left - this.margin.right

    let graph_y_diff = graph_data.max_y - graph_data.min_y
    let graph_x_diff = graph_data.max_x - graph_data.min_x

    if (graph_x_diff === 0) {
      graph_x_diff = 0.1
    }

    if (graph_y_diff === 0) {
      graph_y_diff = 0.1
    }

    let scal_y = vis_height / graph_y_diff
    let scal_x = vis_width / graph_x_diff

    let scal_fact = Math.min(scal_y, scal_x) * zoom

    let offset_x = graph_data.vis_offset_x * scal_fact + this.width / 2
    let offset_y = graph_data.vis_offset_y * scal_fact + this.height / 2

    /**
     * Nodes
     */

    let nodes = self.gNodes.selectAll(".node").data(graph_data.nodes)

    nodes
      .enter()
      .append("circle")
      .merge(nodes)
      .on("contextmenu", (d) => {
        this.props.init_contextmenu(d.id)
      })
      .on("click", (d) => {
        console.log(d)
        // let pid = `${d.id}`
        // if (d.id == self.state.criticalPatient) {
        //   pid = ""
        // }
        // let obj = { target: { value: pid } }
        // self.criticalPatientChanged(obj)

        // TODO für Testzwecke Interaktion auf Linksclick
        // TODO "Hinzuladen" von Kontakt-Patienten
        // this.props.request_data_with_contact_patient(d.id)

        if (fv.patients.includes(d.id)) {
          this.props.change_filter_patients_delete(d.id)
        } else {
          this.props.change_filter_patients_add(d.id)
        }
      })
      // .on("mouseenter", function (d) {
      //   self.updateTooltip(d, "node")
      //   self.hovering_pID = d.id
      //   self.resize()
      //   // console.log(d)
      // })
      // .on("mousemove", function (d) {
      //   self.containerRefs.tooltip.moveTooltip()
      //   self.containerRefs.tooltip.showTooltip()
      //   // self.hovering_pID = d.id
      // })
      // .on("mouseout", function () {
      //   self.containerRefs.tooltip.hideTooltip()
      //   self.hovering_pID = undefined
      //   self.resize()
      // })
      .on("mouseenter", (d) => {
        this.update_tooltip(d, "node")
      })
      .on("mousemove", () => {
        this.props.move_tooltip()
        this.props.show_tooltip()
      })
      .on("mouseout", () => {
        this.props.hide_tooltip()
      })
      .attr("r", this.node_radius)
      .attr("class", "node")
      .attr("stroke-width", 1)
      .attr("cursor", "pointer")
      .attr("fill", (d) => {
        let c = "black"

        let path_status_obj = d.all_pathogen_status[selected_pathogen]

        // TODO: SMICS-0.8
        // TODO UMSCHREIBEN MIT LAST_STATUS AUS FILTER_DATA
        if (true) {
          let status1 = d.all_pathogen_status["94500-6"]
          let status2 = d.all_pathogen_status["94558-4"]
          let status3 = d.all_pathogen_status["94745-7"]
          // let status4 = d.all_pathogen_status[selected_pathogen]
          let status4 = { status: d.status }

          let stati = [status1, status2, status3, status4]

          let infection_ranking = {
            negative: 0,
            unkown: 1,
            infected: 2,
            diseased: 3,
          }

          let status_number = 1
          let final_status = "unknown"
          stati.forEach((s) => {
            if (
              s !== undefined &&
              infection_ranking[s.status] > status_number
            ) {
              final_status = s.status
              status_number = infection_ranking[s.status]
            }
          })

          if (path_status_obj === undefined) {
            path_status_obj = {}
          }
          path_status_obj.status = final_status
        }

        if (path_status_obj === undefined) {
          c = "lightgray"
        } else {
          switch (path_status_obj.status) {
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
        }

        // switch (d.infectionStates[d.infectionStates.length - 1]) {
        //   case "statusHoltKeim":
        //     c = "rgb(100, 100, 100)"
        //     break
        //   case "statusUnbekannt":
        //     c = "rgb(55, 126, 184)"
        //     break
        //   case "statusTraeger":
        //     c = "rgb(255, 127, 0)"
        //     break
        //   case "statusKrank":
        //     c = "rgb(215, 25, 28)"
        //     break
        // }

        return c
      })
      .attr("opacity", (d) => {
        let o = 1

        if (!fv.patients.includes(d.id)) {
          o = 0.1
        }

        return o
      })
      .attr("stroke", (d) => {
        let s = "rgba(0, 0, 0, 0)"
        if (fv.critical_patient == d.id) {
          s = "black"
        }

        // s = "black"

        return s
      })
      .attr("stroke-width", 5)
      .attr("cx", (d) => zoom * d.x * scal_fact + offset_x * zoom)
      .attr("cy", (d) => zoom * d.y * scal_fact + offset_y * zoom)

    nodes.exit().remove()

    /**
     * Links
     */

    let calc_angle_radians = (d) => {
      return Math.atan2(d.target.y - d.source.y, d.target.x - d.source.x)
    }

    let calc_link_x1 = (d) => {
      return (
        (d.source.x +
          // (Math.cos(calc_angle_radians(d)) * this.node_radius) /
          (Math.cos(calc_angle_radians(d)) * 0) / zoom / scal_fact) *
          zoom *
          scal_fact +
        offset_x * zoom
      )
    }

    let calc_link_x2 = (d) => {
      return (
        (d.target.x +
          // (Math.cos(calc_angle_radians(d)) * this.node_radius) /
          (Math.cos(calc_angle_radians(d)) * 0) / zoom / scal_fact) *
          zoom *
          scal_fact +
        offset_x * zoom
      )
    }

    let calc_link_y1 = (d) => {
      return (
        (d.source.y +
          // (Math.sin(calc_angle_radians(d)) * this.node_radius) /
          (Math.sin(calc_angle_radians(d)) * 0) / zoom / scal_fact) *
          zoom *
          scal_fact +
        offset_y * zoom
      )
    }

    let calc_link_y2 = (d) => {
      return (
        (d.target.y +
          // (Math.sin(calc_angle_radians(d)) * this.node_radius) /
          (Math.sin(calc_angle_radians(d)) * 0) / zoom / scal_fact) *
          zoom *
          scal_fact +
        offset_y * zoom
      )
    }

    let links = this.gLinks.selectAll(".link").data(graph_data.links)

    links
      .enter()
      .append("line")
      .attr("class", "link")
      .merge(links)
      .on("click", (d) => {
        console.log(d)
      })
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
      .attr("stroke", (d) => {
        let c = "black"
        // TODO: backward/forward tracing
        return c
      })
      .attr("stroke-width", this.link_width)
      .attr("cursor", "pointer")
      .attr("opacity", (d) => {
        let o = 0.2
        // TODO: backward/forward tracing

        // if (
        //   !fv.patients.includes(d.source.id) ||
        //   !fv.patients.includes(d.target.id)
        // ) {
        //   o = 0.02
        // }

        return o
      })
      .attr("x1", (d) => calc_link_x1(d))
      .attr("x2", (d) => calc_link_x2(d))
      .attr("y1", (d) => calc_link_y1(d))
      .attr("y2", (d) => calc_link_y2(d))

    links.exit().remove()

    /**
     * Station Nodes and Station Links
     */

    let station_nodes = self.gNodeStation
      .selectAll(".station_node")
      .data(graph_data.station_nodes)

    station_nodes
      .enter()
      .append("circle")
      .merge(station_nodes)
      .on("click", (d) => {
        this.props.change_filter_station("")
      })
      .on("mouseenter", (d) => {
        this.update_tooltip(d, "station_node")
      })
      .on("mousemove", () => {
        this.props.move_tooltip(d3.event.pageX, d3.event.pageY)
        this.props.show_tooltip()
      })
      .on("mouseout", () => {
        this.props.hide_tooltip()
      })
      .attr("cursor", "pointer")
      .attr("r", this.node_radius + 2 * this.station_bubble_thickness)
      .attr("fill", (d) => {
        let col = this.props.get_station_color(fv.station)

        return col
      })
      .attr("class", "station_node")
      .attr("stroke", "none")
      .attr("cx", (d) => zoom * d.x * scal_fact + offset_x * zoom)
      .attr("cy", (d) => zoom * d.y * scal_fact + offset_y * zoom)

    station_nodes.exit().remove()

    let station_links = self.gLinkStation
      .selectAll(".station_link")
      .data(graph_data.station_links)

    station_links
      .enter()
      .append("line")
      .attr("class", "station_link")
      .merge(station_links)
      .on("click", (d) => {
        this.props.change_filter_station("")
      })
      .on("mouseenter", (d) => {
        this.update_tooltip(d, "station_link")
      })
      .on("mousemove", () => {
        this.props.move_tooltip(d3.event.pageX, d3.event.pageY)
        this.props.show_tooltip()
      })
      .on("mouseout", () => {
        this.props.hide_tooltip()
      })
      .attr("stroke", (d) => {
        let c = this.props.get_station_color(fv.station)
        // TODO: backward/forward tracing
        return c
      })
      // this.link_width
      // .attr("stroke-width", this.node_radius * 2)
      .attr("stroke-width", this.link_width + 2 * this.station_bubble_thickness)
      .attr("cursor", "pointer")
      .attr("opacity", (d) => {
        let o = 1
        // TODO: backward/forward tracing
        return o
      })
      .attr("x1", (d) => calc_link_x1(d))
      .attr("x2", (d) => calc_link_x2(d))
      .attr("y1", (d) => calc_link_y1(d))
      .attr("y2", (d) => calc_link_y2(d))

    station_links.exit().remove()
  }

  // TODO: copy pasted aus altem Dashboard...
  update_tooltip = (d, tooltipArt) => {
    let fv = this.props.get_filter_values()
    // console.log(d)
    let tableObj = "KEINE DATEN ?"
    // tableObj = tooltipArt
    if (tooltipArt === "node") {
      tableObj = { header: ["Patient"], content: [d.id] }
    } else if (tooltipArt === "node OLD") {
      let tmpObj = {
        title: `${this.translate("movementOf")} ${d.patient_id}`,
        header: [
          // "StationID",
          // "Station",
          // this.locations[this.selected_location_index],
          this.translate("ward"),
          this.translate("room"),
          //this.translate("kom"),
          this.translate("begin2"),
          this.translate("end2"),
          this.translate("duration"),
          this.translate("tom"),
        ],
        content: [],
      }

      d.all_movements.forEach((m) => {
        if (m.end < fv.min_ts || m.begin > fv.max_ts) {
          // filter movements out of selected timespan
          return
        }
        let duration = moment.duration(moment(m.Ende).diff(moment(m.Beginn)))
        let months = duration.months()
        let days = duration.days()
        let hrs = duration.hours()
        let mins = duration.minutes()
        let secs = duration.seconds()
        tmpObj.content.push([
          // m.StationID,
          // m.Station,
          // m[this.location_prop_names[this.selected_location_index]],
          m.Station, // TODO: before "StationID", but new data it should be just "Station"
          m.Raum === null ? "nicht definiert" : m.Raum,
          //m.Bewegungsart_l,
          moment(m.Beginn).format("dd DD.MM.YYYY HH:mm:ss"),
          moment(m.Ende).format("dd DD.MM.YYYY HH:mm:ss"),
          m.Ende === m.Beginn
            ? " - "
            : months +
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
          ,
          m.Bewegungstyp,
        ])
      })
      tableObj = tmpObj

      // TODO: TEMPORAER weil Liste viel zu lang ist ...
      // tableObj = d.name
    } else if (tooltipArt === "link") {
      let fv = this.props.get_filter_values()

      let tmpObj = {
        title: `${this.translate("contactOf")} ${
          d.source.patient_id
        } ${this.translate("and")} ${d.target.patient_id}`,
        // header: ["StationID", "Beginn", "Ende", "Dauer"],
        header: [
          this.translate(fv.location),
          this.translate("begin2"),
          this.translate("end2"),
          this.translate("duration"),
        ],
        content: [],
      }

      d.contacts.forEach((c) => {
        if (c.end < fv.min_ts || c.begin > fv.max_ts) {
          // filter contacts out of selected timespan
          return
        }
        let duration = moment.duration(moment(c.end).diff(moment(c.begin)))
        let months = duration.months()
        let days = duration.days()
        let hrs = duration.hours()
        let mins = duration.minutes()
        let secs = duration.seconds()
        tmpObj.content.push([
          c.station_id,
          moment(c.begin).format("dd DD.MM.YYYY HH:mm:ss"),
          moment(c.end).format("dd DD.MM.YYYY HH:mm:ss"),
          c.end === c.begin
            ? " - "
            : months +
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
          ,
        ])
      })
      tableObj = tmpObj
    } else if (tooltipArt === "station_node") {
      tableObj = {
        header: ["Station"],
        content: [fv.station],
      }
    } else if (tooltipArt === "station_link") {
      tableObj = {
        header: ["Station"],
        content: [fv.station],
      }
    }
    // console.log(tableObj)
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

    let pfv = this.props.get_possible_filter_values()
    let fv = this.props.get_filter_values()

    let selections = []
    pfv.locations.forEach((s_id, i) => {
      // console.log("render", s_id)
      selections.push(
        <option key={s_id} value={s_id}>
          {this.translate(s_id)}
        </option>
      )
    })
    let selection = null
    if (selections.length > 0) {
      selection = (
        <select
          onChange={this.props.change_filter_location}
          value={fv.location}
        >
          {selections}
        </select>
      )
    }
    let element_to_draw = null
    if (this.props.get_original_data("kontaktnetzwerk") === undefined) {
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
          className="svgRoot"
          ref={(element) => (this.svgRoot = element)}
          style={{
            pointerEvents: "all",
            display: element_to_draw === null ? "block" : "none",
          }}
        />
        {/* <div
          className="testdiv2"
          style={{ position: "absolute", top: "10px", left: "100px" }}
        >
          {selection}
        </div> */}
      </div>
    )
  }
}

export default Kontaktnetzwerk
