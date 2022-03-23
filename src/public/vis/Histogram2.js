import { Component } from "react"
import * as d3 from "d3"
import moment from "moment"

class Histogram2 extends Component {
  constructor(props) {
    super(props)

    this.data
    this.width
    this.height

    this.translate = props.translate

    this.margin = {
      top: 100,
      bottom: 100,
      left: 100,
      right: 100,
    }
    // gap between bars in px
    this.barchart_gap = 5
  }

  componentDidMount() {
    let self = this

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
        if (self.data) {
          self.draw_vis()
        }
      }
    }, 100)

    this.width = parseInt(d3.select(self.svgRoot).style("width"))
    this.height = parseInt(d3.select(self.svgRoot).style("height"))

    let svg = (this.gGraphics = d3
      .select(self.svgRoot)
      .append("g")
      .attr("class", "graphics_histogram"))

    this.gBars = svg.append("g").attr("class", "gBars")
    this.gxAxis = svg.append("g").attr("class", "gxAxis")
    this.gyAxis = svg.append("g").attr("class", "gyAxis")
    this.gLegend = svg.append("g").attr("class", "gLegend")

    // ZUM TESTEN
    this.new_data({
      timestamp: "2020-06-23T11:33:04+02:00",
      title: "Test Study2",
      data: [
        {
          name: "0+",
          value: 56,
        },
        {
          name: "0-",
          value: 12,
        },
        {
          name: "A+",
          value: 89,
        },
        {
          name: "A-",
          value: 10,
        },
        {
          name: "B+",
          value: 99,
        },
        {
          name: "B-",
          value: 40,
        },
        {
          name: "AB+",
          value: 36,
        },
        {
          name: "AB-",
          value: 104,
        },
      ],
    })
  }

  componentWillUnmount() {
    clearInterval(this.checkSize)
  }

  new_data = (data) => {
    this.data = data
    this.draw_vis()
  }

  draw_vis = () => {
    let self = this
    let data = this.data

    let bandScale = d3
      .scaleBand()
      .padding(0.1)
      .align(0.1)
      .domain(data.data.map((d) => d.name))
      .range([0 + this.margin.left, self.width - self.margin.right])

    let pufer_factor = 1.1

    let linearScale = d3
      .scaleLinear()
      .domain([0, d3.max(data.data.map((d) => d.value * pufer_factor))])
      .range([0, this.height - this.margin.top - this.margin.bottom])

    let linearScale_reverse = d3
      .scaleLinear()
      .domain([0, d3.max(data.data.map((d) => d.value * pufer_factor))])
      .range([this.height - this.margin.top - this.margin.bottom, 0])

    /**
     * Histogram/ Data Visualization
     */
    let bars = this.gBars.selectAll(".histogram_bar").data(data.data)

    bars
      .enter()
      .append("rect")
      .attr("class", "histogram_bar")
      .merge(bars)
      .transition()
      .duration(200)
      // .attr("stroke", "white")
      // .attr("stroke-width", 5)
      .attr("fill", "#ff007f")
      // .attr("width", (d) => bandScale.bandwidth() - this.barchart_gap)
      .attr("width", (d) => bandScale.bandwidth())
      .attr("height", (d) => linearScale(d.value))
      .attr("x", (d) => bandScale(d.name))
      .attr("y", (d) => this.height - this.margin.bottom - linearScale(d.value))

    bars.exit().remove()

    /**
     * Titel + Timestamp
     */
    let title = this.gLegend.selectAll(".title").data([data.title])

    title
      .enter()
      .append("text")
      .attr("class", "title")
      .merge(title)
      .transition()
      .duration(200)
      .text((d) => d)
      .attr("font-size", this.margin.top / 2)
      .attr("x", this.width / 2)
      .attr("y", (this.margin.top * 2) / 3)
      .attr("text-anchor", "middle")

    title.exit().remove()

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
      .duration(200)
      .text((d) => d)
      .attr("font-size", this.margin.top / 4)
      .attr("x", this.width / 2)
      .attr("y", this.margin.top)
      .attr("text-anchor", "middle")

    timestamp.exit().remove()

    /**
     * Achsenbeschriftung
     */
    let y_label = this.gLegend.selectAll(".y_label").data([data.title])

    y_label
      .enter()
      .append("text")
      .attr("class", "y_label")
      .merge(y_label)
      .transition()
      .duration(200)
      .text(this.translate("number"))
      .attr("font-size", this.margin.left / 3)
      .attr("y", this.margin.left / 2)
      .attr("x", -this.height / 2)
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(" + -90 + ")")

    y_label.exit().remove()

    let x_label = this.gLegend.selectAll(".x_label").data([data.title])

    x_label
      .enter()
      .append("text")
      .attr("class", "x_label")
      .merge(x_label)
      .transition()
      .duration(200)
      .text(this.translate("bType"))
      .attr("font-size", this.margin.bottom / 3)
      .attr("y", this.height - this.margin.bottom / 4)
      .attr("x", this.width / 2)
      .attr("text-anchor", "middle")

    x_label.exit().remove()

    let x_axis = d3.axisBottom(bandScale)
    this.gxAxis
      .transition()
      .duration(200)
      .call(x_axis)
      .attr(
        "transform",
        "translate(" + 0 + ", " + (this.height - this.margin.bottom) + ")"
      )
      .attr("font-size", this.margin.bottom / 6)

    let y_axis = d3.axisLeft(linearScale_reverse)
    this.gyAxis
      .transition()
      .duration(200)
      .call(y_axis)
      .attr(
        "transform",
        "translate(" + (this.margin.left - 10) + "," + this.margin.top + ")"
      )
      .attr("font-size", this.margin.left / 6)

    /**
     * Value on each bar
     */
    let value_label = this.gBars.selectAll(".value_label").data(data.data)

    value_label
      .enter()
      .append("text")
      .attr("class", "value_label")
      .merge(value_label)
      .transition()
      .duration(200)
      .text((d) => d.value)
      .attr("x", (d) => bandScale(d.name) + bandScale.bandwidth() / 2)
      .attr(
        "y",
        (d) => this.height - this.margin.bottom - linearScale(d.value) - 5
      )
      .attr("text-anchor", "middle")
      .attr("font-size", this.margin.bottom / 4)

    value_label.exit().remove()
  }

  render() {
    return (
      <div style={{ width: "100%", height: "100%" }}>
        <svg
          // style={{ width: "100%", height: "100%" }}
          className="svgRoot"
          ref={(element) => (this.svgRoot = element)}
        />
      </div>
    )
  }
}

export default Histogram2
