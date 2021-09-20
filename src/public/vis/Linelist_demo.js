import { Component } from "react"
import * as d3 from "d3"
import moment from "moment"

class Linelist extends Component {
  constructor(props) {
    super(props)

    /**
     * TODO: hier für das Module feste Parameter/"globale" variablen
     */

    this.data
    this.width
    this.height

    this.socket = props.socket.client

    this.margin = {
      top: 100,
      bottom: 100,
      left: 100,
      right: 100,
    }

    this.title = "Linelist"

    this.transition_duration = 200
    this.row_height = 50
    this.movement_rectangle_height = this.row_height / 5
    this.investigation_rect_width = 10
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

    /**
     * TODO: hier werden die "g" objecte initialisiert (und andere Sachen)
     */

    let svg = (this.gGraphics = d3
      .select(self.svgRoot)
      .append("g")
      .attr("class", "linelist"))

    this.gxAxis = svg.append("g").attr("class", "gxAxis")
    this.gyAxis = svg.append("g").attr("class", "gyAxis")
    this.gGridlines = svg.append("g").attr("class", "gGridlines")
    this.gInvestigation_rects = svg
      .append("g")
      .attr("class", "gInvestigation_rects")
    this.gMovement_rects = svg.append("g").attr("class", "gMovement_rects")
    this.gMovement_dots = svg.append("g").attr("class", "gMovement_dots")
    this.gLegend = svg.append("g").attr("class", "gLegend")

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

    this.data = data
    this.draw_vis()
  }

  /**
   * TODO: die "Zeichnen"-Funktion; wird aufgerufen on-resize und bei neuen Daten
   */
  draw_vis = () => {
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

    let timestamp = this.gLegend
      .selectAll(".timestamp")
      .data([
        `(Stand: ${moment(data.timestamp).format("DD.MM.YYYY HH:mm:ss")})`,
      ])

    timestamp
      .enter()
      .append("text")
      .attr("class", "timestamp")
      .merge(timestamp)
      .transition()
      .duration(this.transition_duration)
      .text((d) => d)
      .attr("font-size", this.margin.top / 4)
      .attr("x", this.width / 2)
      .attr("y", this.margin.top)
      .attr("text-anchor", "middle")

    timestamp.exit().remove()

    /**
     * Movement Rectangles
     */

    let scale_x = d3
      .scaleLinear()
      .domain([data.ts_start, data.ts_end])
      .range([0 + this.margin.left, this.width - this.margin.right])

    let y_position = (d) => {
      let { patient_id, top } = d
      let index = data.patientList.findIndex((pid) => pid === patient_id)
      let yPos = index * this.row_height + this.movement_rectangle_height
      if (!top) {
        yPos += this.movement_rectangle_height
      }
      return this.height - this.margin.bottom - yPos
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
      .transition()
      .duration(this.transition_duration)
      .attr("x", (d) => scale_x(d.begin))
      .attr("width", (d) => rect_width(d))
      .attr("y", (d) => y_position(d))
      .attr("height", this.movement_rectangle_height)
      .attr("fill", "lightgray")
      .attr("stroke", "black")
      .attr("stroke-width", 1)

    movement_rects.exit().remove()

    let movement_dots = this.gMovement_dots
      .selectAll(".movement_dot")
      .data(data.movement_dots)

    movement_dots
      .enter()
      .append("circle")
      .attr("class", "movement_dot")
      .merge(movement_dots)
      .transition()
      .duration(this.transition_duration)
      .attr("cx", (d) => scale_x(d.begin))
      .attr("cy", (d) => y_position(d) - this.movement_rectangle_height / 2)
      .attr("r", this.movement_rectangle_height / 3)
      .attr("fill", "cyan")
      .attr("stroke", "black")
      .attr("stroke-width", 1)

    movement_dots.exit().remove()

    /**
     * Investigation Rectangles
     */

    let investigation_rects = this.gInvestigation_rects
      .selectAll(".investigation_rect")
      .data(data.investigation_rects)

    investigation_rects
      .enter()
      .append("rect")
      .attr("class", "investigation_rect")
      .merge(investigation_rects)
      .transition()
      .duration(this.transition_duration)
      // Beginn des Investigation Rects sollte eigentlich auch linke Kante sein
      // und nicht die Mitte des Reccts (?!)
      .attr(
        "x",
        (d) => scale_x(d.timestamp) - this.investigation_rect_width / 2
      )
      .attr("width", (d) => this.investigation_rect_width)
      .attr("y", (d) => y_position(d) - this.movement_rectangle_height)
      .attr("height", this.row_height - this.movement_rectangle_height)
      .attr("fill", (d) => {
        let c = "white"
        switch (d.result) {
        case "infected":
          c = "orange"
          break
        case "diseased":
          c = "red"
          break
        }

        return c
      })
      .attr("stroke", "black")
      .attr("stroke-width", 1)

    investigation_rects.exit().remove()

    /**
     * Axis
     */

    // d3.timeFormatDefaultLocale("de")
    let parseTime = d3.timeParse("%Q")
    let xAxisScale = d3
      .scaleTime()
      .domain(d3.extent([data.ts_start, data.ts_end], (d) => parseTime(d)))
      .range([this.margin.left, this.width - this.margin.right])

    let xAxis = d3
      .axisBottom(xAxisScale)
      .ticks(5)
      .tickSizeInner([-(this.height - this.margin.bottom)])

    this.gGridlines
      .attr(
        "transform",
        "translate(" + 0 + "," + (this.height - this.margin.bottom / 2) + ")"
      )
      .transition()
      .duration(this.transition_duration)
      .call(xAxis)

    this.gGridlines
      .selectAll(".tick")
      .selectAll("line")
      .attr("opacity", 0.5)
      .attr("stroke-dasharray", "4, 6")
      .attr("stroke-width", 1)
  }

  render() {
    return (
      <div style={{ width: "100%", height: "100%", background: "white" }}>
        <svg
          // style={{ width: "100%", height: "100%" }}
          className="svgRoot"
          ref={(element) => (this.svgRoot = element)}
        />
      </div>
    )
  }
}

export default Linelist
