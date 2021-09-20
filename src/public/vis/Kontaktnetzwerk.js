import { Component } from "react"
import * as d3 from "d3"
import moment from "moment"

class Kontaktnetzwerk extends Component {
  constructor(props) {
    super(props)

    this.data
    this.width
    this.height

    this.state = {
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

    this.title = "Kontaktnetzwerk"

    this.transition_duration = 200

    this.node_radius = 10
    this.node_padding = 100

    this.link_width = 5

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

  componentDidMount() {
    let self = this

    console.log("Kontaktnetzwerk module did mount")

    this.socket.on("kontaktnetzwerk", this.handle_data)

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
    this.gLinks = svg.append("g").attr("class", "gLinks")
    this.gNodes = svg.append("g").attr("class", "gNodes")

    this.draw_vis()
  }

  componentWillUnmount() {
    this.socket.off("kontaktnetzwerk")

    clearInterval(this.checkSize)
  }

  handle_data = (data) => {
    console.log("Kontaktnetzwerk vis data recieved")
    console.log(data)

    this.data = data.data
    this.parameters = data.parameters
    this.timestamp = data.timestamp

    this.reset_view()

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
    let data = this.data

    // TODO: zooming implementieren
    let zoom = this.zoom

    console.log(`drawing Kontaktnetzwerk with zoom ${zoom}`)

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

    if (this.data === undefined) {
      return
    }

    data = this.data.graph_data[this.selected_location_index]

    // TODO: temporär
    let selected_pathogen = "869"

    // let timestamp = this.gLegend
    //   .selectAll(".timestamp")
    //   .data([
    //     `(Stand: ${moment(data.timestamp).format("DD.MM.YYYY HH:mm:ss")})`,
    //   ])

    // timestamp
    //   .enter()
    //   .append("text")
    //   .attr("class", "timestamp")
    //   .merge(timestamp)
    //   .transition()
    //   .duration(this.transition_duration)
    //   .text((d) => d)
    //   .attr("font-size", this.margin.top / 4)
    //   .attr("x", this.width / 2)
    //   .attr("y", this.margin.top)
    //   .attr("text-anchor", "middle")

    // timestamp.exit().remove()

    // TODO: Noch nicht auf Modul-größe skalliert (und kein zoom etc)
    /**
     * Calculate scaling factor and translation to middle
     */

    let vis_height = this.height - this.margin.top - this.margin.bottom
    let vis_width = this.width - this.margin.left - this.margin.right

    let graph_y_diff = data.max_y - data.min_y
    let graph_x_diff = data.max_x - data.min_x

    if (graph_x_diff === 0) {
      graph_x_diff = 0.1
    }

    if (graph_y_diff === 0) {
      graph_y_diff = 0.1
    }

    let scal_y = vis_height / graph_y_diff
    let scal_x = vis_width / graph_x_diff

    let scal_fact = Math.min(scal_y, scal_x) * zoom

    let offset_x = data.vis_offset_x * scal_fact + this.width / 2
    let offset_y = data.vis_offset_y * scal_fact + this.height / 2

    // console.log(scal_fact)
    // TODO: Nach dem Skallieren wird das Panning nicht skalliert...
    // this.lastTransformedX =
    //   ((this.old_scal_fact / scal_fact) * zoom * this.lastTransformedX +
    //     this.lastTransformedX) /
    //   2
    // this.lastTransformedY =
    //   ((this.old_scal_fact / scal_fact) * zoom * this.lastTransformedY +
    //     this.lastTransformedY) /
    //   2
    // this.gGraphics.attr(
    //   "transform",
    //   "translate(" + this.lastTransformedX + " " + this.lastTransformedY + ")"
    // )

    /**
     * Nodes
     */

    let nodes = self.gNodes.selectAll(".node").data(data.nodes)

    nodes
      .enter()
      .append("circle")
      .merge(nodes)
      .on("click", (d) => {
        console.log(d)
        // let pid = `${d.id}`
        // if (d.id == self.state.criticalPatient) {
        //   pid = ""
        // }
        // let obj = { target: { value: pid } }
        // self.criticalPatientChanged(obj)
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
      .transition()
      .duration(trans_duration)
      .attr("r", this.node_radius)
      .attr("class", "node")
      .attr("stroke-width", 1)
      .attr("cursor", "pointer")
      .attr("fill", (d) => {
        let c = "black"

        let path_status_obj = d.all_pathogen_status[selected_pathogen]

        // TODO: SMICS-0.8
        if (true) {
          let status1 = d.all_pathogen_status["94500-6"]
          let status2 = d.all_pathogen_status["94558-4"]
          let status3 = d.all_pathogen_status["94745-7"]
          let status4 = d.all_pathogen_status[selected_pathogen]

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
        let o = 0.8
        o = 1
        return o
      })
      .attr("stroke", (d) => {
        let s = "rgba(0, 0, 0, 0)"
        // if (self.state.criticalPatient == d.id) {
        //   s = "black"
        // }

        // s = "black"

        return s
      })
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
          (Math.cos(calc_angle_radians(d)) * this.node_radius) /
            zoom /
            scal_fact) *
          zoom *
          scal_fact +
        offset_x * zoom
      )
    }

    let calc_link_x2 = (d) => {
      return (
        (d.target.x +
          (Math.cos(calc_angle_radians(d)) * this.node_radius) /
            zoom /
            scal_fact) *
          zoom *
          scal_fact +
        offset_x * zoom
      )
    }

    let calc_link_y1 = (d) => {
      return (
        (d.source.y +
          (Math.sin(calc_angle_radians(d)) * this.node_radius) /
            zoom /
            scal_fact) *
          zoom *
          scal_fact +
        offset_y * zoom
      )
    }

    let calc_link_y2 = (d) => {
      return (
        (d.target.y +
          (Math.sin(calc_angle_radians(d)) * this.node_radius) /
            zoom /
            scal_fact) *
          zoom *
          scal_fact +
        offset_y * zoom
      )
    }

    let links = this.gLinks.selectAll(".link").data(data.links)

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
      .transition()
      .duration(trans_duration)
      .attr("stroke", (d) => {
        let c = "black"
        // TODO: backward/forward tracing
        return c
      })
      .attr("stroke-width", this.link_width)
      .attr("cursor", "pointer")
      .attr("opacity", (d) => {
        let o = 0.1
        // TODO: backward/forward tracing
        return o
      })
      .attr("x1", (d) => calc_link_x1(d))
      .attr("x2", (d) => calc_link_x2(d))
      .attr("y1", (d) => calc_link_y1(d))
      .attr("y2", (d) => calc_link_y2(d))

    links.exit().remove()
  }

  // TODO: copy pasted aus altem Dashboard...
  update_tooltip = (d, tooltipArt) => {
    // console.log(d)
    let tableObj = "KEINE DATEN ?"
    // tableObj = tooltipArt
    if (tooltipArt === "node") {
      let tmpObj = {
        title: `Bewegungen von ${d.patient_id}`,
        header: [
          // "StationID",
          // "Station",
          // this.locations[this.selected_location_index],
          "Station",
          "Raum",
          "Bewegungstyp",
          "Bewegungsart",
          "Beginn",
          "Ende",
          "Dauer",
        ],
        content: [],
      }

      d.all_movements.forEach((m) => {
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
          m.StationID,
          m.Raum,
          m.Bewegungstyp,
          m.Bewegungsart_l,
          moment(m.Beginn).format("dd DD.MM.YYYY HH:mm:ss"),
          moment(m.Ende).format("dd DD.MM.YYYY HH:mm:ss"),
          m.Ende === m.Beginn
            ? " - "
            : months +
              "M " +
              days +
              "d " +
              hrs +
              "h " +
              mins +
              "min " +
              secs +
              "s",
          ,
        ])
      })
      tableObj = tmpObj

      // TODO: TEMPORAER weil Liste viel zu lang ist ...
      // tableObj = d.name
    } else if (tooltipArt === "link") {
      let tmpObj = {
        title: `Kontakt von ${d.source.patient_id} und ${d.target.patient_id}`,
        // header: ["StationID", "Beginn", "Ende", "Dauer"],
        header: [
          this.locations[this.selected_location_index],
          "Beginn",
          "Ende",
          "Dauer",
        ],
        content: [],
      }

      d.contacts.forEach((c) => {
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
              "M " +
              days +
              "d " +
              hrs +
              "h " +
              mins +
              "min " +
              secs +
              "s",
          ,
        ])
      })
      tableObj = tmpObj
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

  switchLocation = (e) => {
    let self = this
    let newLocation_index = e.target.value
    this.selected_location_index = newLocation_index
    this.setState((prevState) => {
      prevState.selected_location_index = newLocation_index
      return prevState
    })

    this.reset_view()

    self.draw_vis()
  }

  render() {
    let self = this

    let selections = []
    this.state.locations.forEach((s_id, i) => {
      console.log("render", s_id)
      selections.push(
        <option key={s_id} value={i}>
          {s_id}
        </option>
      )
    })
    let selection = null
    if (selections.length > 0) {
      selection = (
        <select
          onChange={this.switchLocation}
          value={this.state.selected_location_index}
        >
          {selections}
        </select>
      )
    }
    return (
      <div style={{ width: "100%", height: "100%", background: "white" }}>
        <svg className="svgRoot" ref={(element) => (this.svgRoot = element)} />
        <div
          className="testdiv2"
          style={{ position: "absolute", top: "10px", left: "100px" }}
        >
          {selection}
        </div>
      </div>
    )
  }
}

export default Kontaktnetzwerk
