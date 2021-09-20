import { Component } from "react"
import * as d3 from "d3"
import moment from "moment"

class Epikurve extends Component {
  constructor(props) {
    super(props)

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

    this.title = "Epikurve"

    this.transition_duration = 200
  }

  componentDidMount() {
    let self = this

    console.log("epikurve module did mount")

    this.socket.on("epikurve", this.handle_data)

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
      .attr("class", "epikurve"))

    this.gLegend = svg.append("g").attr("class", "gLegend")

    this.draw_vis()
  }

  componentWillUnmount() {
    this.socket.off("epikurve")

    clearInterval(this.checkSize)
  }

  handle_data = (data) => {
    console.log("epikurve vis data recieved")
    console.log(data)

    this.data = data.data
    this.parameters = data.parameters
    this.timestamp = data.timestamp

    this.draw_vis()
  }

  draw_vis = () => {
    let self = this
    let data = this.data

    console.log("drawing epikurve")

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
  }

  render() {
    return (
      <div style={{ width: "100%", height: "100%", background: "white" }}>
        <svg className="svgRoot" ref={(element) => (this.svgRoot = element)} />
      </div>
    )
  }
}

export default Epikurve
