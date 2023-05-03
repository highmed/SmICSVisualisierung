import { Component } from "react"
import * as d3 from "d3"
// import moment from "moment"
import "./epidemikeim.css"

/**
 * More or less copy pasted from old dashboard
 */
class Epikurve extends Component {
  constructor(props) {
    super(props)

    this.module_id = props.create_new_id()
    this.module_type = "epikurve"

    this.filtered_data
    this.width
    this.height

    this.socket = props.socket.client
    this.translate = props.translate
    this.get_color = props.get_color

    this.min_width = 150
    this.min_height = 150

    this.transition_duration = props.transition_duration

    /**
     * copy from old module
     */

    this.defaultStation = "Klinik"

    this.state = {
      too_small: false,
      getStationID: undefined, // TODO: = selected_station filter
      getConfigName: undefined, // TODO: = selected_config -> setzt station ?
      stationIDs: [],
      configNames: [],
    }

    this.selected_station = undefined

    this.margin = {
      top: 50,
      right: 25,
      bottom: 20,
      left: 50,
      text: 20,
    }

    this.niveau_curve_index = 0
    this.niveau_curve_names = ["Endemisches Niveau", "Epidemisches Niveau"]

    this.timeSpans = [7, 28]
  }

  switchStation = (e) => {
    let self = this
    let newStationID = e.target.value
    this.setState((prevState) => {
      prevState.getStationID = newStationID
      return prevState
    })
    self.draw_vis(newStationID)
  }

  switchPathogen = (e) => {
    let self = this
    let newStationID = e.target.value
    this.setState((prevState) => {
      prevState.getPathogenID = newPathogenID
      return prevState
    })
    self.draw_vis(undefined, newPathogenID)
  }

  switch_niveau_curve_index = () => {
    let self = this
    self.niveau_curve_index++
    if (self.niveau_curve_index >= self.niveau_curve_names.length) {
      self.niveau_curve_index = 0
    }
    self.filter_data()
    self.draw_vis()
  }

  filter_data = () => {
    let pfv = this.props.get_possible_filter_values()

    let { station, min_ts, max_ts } = this.props.get_filter_values()

    if (station === "") {
      station = "klinik"
    }

    let original_data = this.props.get_original_data(this.module_type)

    if (
      original_data &&
      original_data.data &&
      original_data.data.data &&
      Object.getOwnPropertyNames(original_data.data.data).length > 0 &&
      Object.getOwnPropertyNames(original_data.data).length > 0
    ) {
      let time_stamps_top = [pfv.min_ts, pfv.max_ts + 1000 * 60 * 60 * 24]
      let time_stamps_bottom = [min_ts, max_ts]
      let data_top = []
      let data_bottom = []

      let y_max_top = 1
      let y_max_bottom = 1

      let no_data_rects_top = []
      let no_data_rects_bottom = []

      if (original_data.data.stationIDs.includes(station)) {
        let data_begin = original_data.data.timespan[0]
        let data_end = original_data.data.timespan[1]

        let pathogenIDname = "K" + original_data.data.pathogenIDs[0]

        data_top = original_data.data.data[pathogenIDname][station]
        data_bottom = original_data.data.data[pathogenIDname][station].filter(
          (d) => min_ts <= d.timestamp && d.timestamp <= max_ts
        )

        y_max_top = d3.max(data_top, (d) => d["Anzahl_cs"])

        data_top.forEach((d) => {
          if (d.rki_data && d.rki_data[niveau_curve_names[0]] > y_max_top) {
            y_max_top = d.rki_data[niveau_curve_names[0]]
          }
          if (d.rki_data && d.rki_data[niveau_curve_names[1]] > y_max_top) {
            y_max_top = d.rki_data[niveau_curve_names[1]]
          }
        })
        y_max_top = Math.round(y_max_top + 1 + 0.1 * y_max_top)
        let y_max_bottom_value = d3.max(data_bottom, (d) => d[["Anzahl"]])
        let y_max_bottom_mean = d3.max(data_bottom, (d) => d["avg7_cs"])
        // TODO: zum testen, weil stimmt die skallierung dadurch nicht...
        // TODO: weil der Wert avg7_cs sonst nirgens benutzt wird! (exisiert für untere Kurve nicht), daher Fehler nur auf SQL Data Sichtbar?
        y_max_bottom_mean = 0
        y_max_bottom = Math.max(y_max_bottom_value, y_max_bottom_mean)
        y_max_bottom = Math.round(y_max_bottom + 1 + 0.1 * y_max_bottom)

        if (!y_max_bottom) {
          y_max_bottom = y_max_top
        }

        /**
         * Create rectangles to display, that data was not loaded for this timespan
         */

        if (pfv.min_ts < data_begin) {
          no_data_rects_top.push({
            begin: pfv.min_ts,
            end: data_begin,
          })
        }

        if (pfv.max_ts > data_end) {
          no_data_rects_top.push({
            begin: data_end,
            end: pfv.max_ts,
          })
        }

        if (min_ts < data_begin) {
          no_data_rects_bottom.push({
            begin: min_ts,
            end: Math.min(data_begin, max_ts),
          })
        }

        if (max_ts > data_end) {
          no_data_rects_bottom.push({
            begin: Math.max(data_end, min_ts),
            end: max_ts,
          })
        }
      } else {
        // selected station id is not in the loaded data -> generate "no data hatching rects" for top and bottom
        no_data_rects_top.push({
          begin: pfv.min_ts,
          end: pfv.max_ts,
        })

        no_data_rects_bottom.push({
          begin: min_ts,
          end: max_ts,
        })
      }

      this.filtered_data = {
        time_stamps_top,
        time_stamps_bottom,
        y_max_top,
        y_max_bottom,
        data_top,
        data_bottom,
        no_data_rects_top,
        no_data_rects_bottom,
      }
    } else {
      this.filtered_data = undefined
    }
  }

  componentDidMount() {
    let self = this

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

        self.draw_vis()
      }
    }, 100)

    let svg = (this.gGraphics = d3
      .select(self.svgRoot)
      .append("g")
      .attr("class", "epikurve"))

    this.gLegend = svg.append("g").attr("class", "gLegend")

    let svgTop = (self.gGraphicsTop = d3
      .select(self.svgRoot)
      .append("g")
      .attr("class", "gContainer topContainer epidemiKeimContainer"))

    let svgBottom = (self.gGraphicsBottom = d3
      .select(self.svgRoot)
      .append("g")
      .attr("class", "gContainer bottomContainer epidemiKeimContainer"))

    let svgBoth = (self.gGraphicsBoth = d3
      .select(self.svgRoot)
      .append("g")
      .attr("class", "gContainer bothContainer epidemiKeimContainer"))

    let gContainers = [
      "epidemiKeimContainer",
      "gEpidemikurve",
      "gMean",
      "gxAxis",
      "gyAxis",
      "gMouseListener",
    ]

    gContainers.forEach((d) => {
      self[d + "Top"] = svgTop.append("g").attr("class", (a) => d + "Top")
      self[d + "Bottom"] = svgBottom
        .append("g")
        .attr("class", (a) => d + "Bottom")
    })

    self.gMouseListenerTop
      .append("line")
      .attr("class", "mouseLine")
      .attr("opacity", 0.5)
      .attr("stroke-width", 1)
      .attr("stroke", "black")
    self.gMouseListenerTop.append("text").attr("class", "mouseTimeLabel")
    self.gMouseListenerTop.append("text").attr("class", "mouseValueLabel")

    self.gMouseListenerBottom.append("line").attr("class", "mouseLine")
    self.gMouseListenerBottom.append("text").attr("class", "mouseTimeLabel")
    self.gMouseListenerBottom.append("text").attr("class", "mouseValueLabel")

    self.gxAxisTop.attr("class", "gxAxis")
    self.gxAxisBottom.attr("class", "gxAxis")
    self.gyAxisTop.attr("class", "gyAxis")
    self.gyAxisBottom.attr("class", "gyAxis")

    /**
     * Zieh-Balken zum Einstellen des Zeitraums -> TimeLense
     */
    self.gTimeLenseLines = svgBoth.append("g").attr("class", "gTimeLenseLines")
    self.gTimeLenseLines
      .append("line")
      .attr("class", "dragTimeLenseLine")
      .classed("dragNotActive", true)
      .attr("y1", 0)
      .attr("y2", 0)
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("stroke", "#000000")
      .attr("stroke-width", 10)
      .attr("opacity", 0.5)
      .attr("fill", "none")
      .attr("cursor", "col-resize")

    //TODO: tickSizeInner wie in Timeline.js von der größe abhängig machen

    this.filter_data()
    this.draw_vis()
  }

  componentWillUnmount() {
    this.socket.off("epikurve")

    this.props.unregister_module(this.module_id)

    clearInterval(this.checkSize)
  }

  draw_vis = (stationID, pathogenID) => {
    let self = this

    let data = this.filtered_data

    if (
      data === undefined ||
      this.width <= this.min_width ||
      this.height <= this.min_height ||
      this.height === undefined ||
      this.width === undefined
    ) {
      // no data or viewport is too small
      return
    }

    let locale = this.props.get_locale()

    let {
      y_max_top,
      y_max_bottom,
      data_top,
      data_bottom,
      time_stamps_top,
      time_stamps_bottom,
      no_data_rects_top,
      no_data_rects_bottom,
    } = data

    let svg = d3.select(self.svgRoot)
    let width =
      parseInt(svg.style("width")) - self.margin.left - self.margin.right
    let height =
      parseInt(svg.style("height")) -
      2 * self.margin.top -
      2 * self.margin.bottom

    let offsetBottomLinesY = height / 2 + self.margin.top + self.margin.bottom

    self.gGraphicsTop.attr(
      "transform",
      "translate(" + self.margin.left + "," + self.margin.top + ")"
    )
    self.gGraphicsBottom.attr(
      "transform",
      "translate(" +
        self.margin.left +
        "," +
        (self.margin.bottom + 2 * self.margin.top + height / 2) +
        ")"
    )
    self.gGraphicsBoth.attr(
      "transform",
      "translate(" + self.margin.left + "," + self.margin.top + ")"
    )

    /**
     * "Legende" für die Mean-Kurve
     */
    let legendLine = self.gGraphicsTop.selectAll(".legendLine2").data([0])

    legendLine
      .enter()
      .append("line")
      .attr("class", "legendLine2")
      .merge(legendLine)
      .attr("x1", (width * 3) / 4)
      .attr("x2", (width * 3) / 4 + 20)
      .attr("y1", -35)
      .attr("y2", -35)
      .attr("stroke", "black")
      .attr("stroke-width", 3)
      .attr("fill", "none")
      .attr("opacity", 1)

    legendLine.exit().remove()
    let legendText = self.gGraphicsTop.selectAll(".legendText").data([0])

    legendText
      .enter()
      .append("text")
      .attr("class", "legendText clickable")
      .on("click", () => {
        self.switch_niveau_curve_index()
      })
      .merge(legendText)
      .attr("x", (width * 3) / 4 + 25)
      // .attr("y", -10)
      .attr("y", -30)
      .attr("font-size", "80%")
      .attr("cursor", "pointer")
      .text(() => this.niveau_curve_names[this.niveau_curve_index])

    legendText.exit().remove()

    /**
     * TOP Y-AXIS
     */

    let scaleYTop = d3
      .scaleLinear()
      .range([height / 2, 0])
      .domain([0, y_max_top])
    let yAxisTop = d3
      .axisLeft(scaleYTop)
      .ticks(height / 100)
      .tickSizeInner([-width])

    self.gyAxisTop
      .call(yAxisTop)
      .selectAll(".tick")
      .selectAll("text")
      .attr("x", -8)

    let yAxisLabelTop = self.gyAxisTop.selectAll(".label").data([1])

    yAxisLabelTop
      .enter()
      .append("text")
      .attr("class", "label clickable")
      .merge(yAxisLabelTop)
      .text(() => this.translate("firstInfections_CS"))
      .attr("x", -height / 4)
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("dy", "0.71em")
      .attr("font", "sans-serif")
      .attr("font-size", 10)
      .attr("fill", "black")
      .attr("cursor", "pointer")
      .style("text-anchor", "middle")

    yAxisLabelTop.exit().remove()

    /**
     * BOTTOM Y-AXIS
     */

    let scaleYBottom = d3
      .scaleLinear()
      .range([height / 2, 0])
      .domain([0, y_max_bottom])
    let yAxisBottom = d3
      .axisLeft(scaleYBottom)
      .ticks(height / 100)
      .tickSizeInner([-width])

    self.gyAxisBottom
      .call(yAxisBottom)
      .selectAll(".tick")
      .selectAll("text")
      .attr("x", -8)

    let yAxisLabelBottom = self.gyAxisBottom.selectAll(".label").data([1])

    yAxisLabelBottom
      .enter()
      .append("text")
      .attr("class", "label clickable")
      .merge(yAxisLabelBottom)
      .text(() => this.translate("firstInfections"))
      .attr("x", -height / 4)
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("dy", "0.71em")
      .attr("font", "sans-serif")
      .attr("font-size", 10)
      .attr("fill", "black")
      .attr("cursor", "pointer")
      .style("text-anchor", "middle")

    yAxisLabelBottom.exit().remove()

    /**
     * TOP X-AXIS
     */
    d3.timeFormatDefaultLocale(locale)
    let xParseTime = d3.timeParse("%Q")

    let scaleXTop = d3
      .scaleTime()
      .domain(d3.extent(time_stamps_top, (d) => xParseTime(d)))
      .range([0, width - 0])
    let xAxisTop = d3.axisBottom(scaleXTop).ticks(width / 150)

    self.gxAxisTop
      .attr("transform", "translate(" + 0 + "," + height / 2 + ")")
      .call(xAxisTop)

    let xAxisLabelTop = self.gxAxisTop.selectAll(".label").data([1])

    xAxisLabelTop
      .enter()
      .append("text")
      .attr("class", "label clickable")
      .merge(xAxisLabelTop)
      .text(self.translate("EpiTopTitle"))
      .attr("x", width / 2)
      .attr("y", -height / 2 - self.margin.top / 2 + 10)
      .attr("dy", "0.71em")
      .attr("font", "sans-serif")
      .attr("font-size", 10)
      .attr("fill", "black")
      .attr("cursor", "pointer")
      .style("text-anchor", "middle")

    xAxisLabelTop.exit().remove()

    /**
     * BOTTOM X-AXIS
     */
    d3.timeFormatDefaultLocale(locale)
    let xParseTime2 = d3.timeParse("%Q")

    let scaleXBottom = d3
      .scaleTime()
      .domain(
        d3.extent(
          [time_stamps_bottom[0], time_stamps_bottom[1] + 1000 * 60 * 60 * 24],
          (d) => xParseTime2(d)
        )
      )
      .range([0, width - 0])
    let xAxisBottom = d3.axisBottom(scaleXBottom).ticks(width / 150)

    self.gxAxisBottom
      .attr("transform", "translate(" + 0 + "," + height / 2 + ")")
      .call(xAxisBottom)

    let xAxisLabelBottom = self.gxAxisBottom.selectAll(".label").data([1])

    xAxisLabelBottom
      .enter()
      .append("text")
      .attr("class", "label clickable title")
      .merge(xAxisLabelBottom)
      .attr("x", width / 2)
      .attr("y", -height / 2 - self.margin.top / 2 + 10)
      .text(self.translate("EpiBottomTitle"))
      .attr("dy", "0.71em")
      .attr("font", "sans-serif")
      .attr("font-size", 10)
      .attr("fill", "black")
      .attr("cursor", "pointer")
      .style("text-anchor", "middle")

    xAxisLabelBottom.exit().remove()

    /**
     * Zieh-Balken zum Einstellen des Zeitraums -> TimeLense
     */
    let timeLenseLineLeft = self.gTimeLenseLines
      .selectAll(".timeLenseLineLeft")
      .data([time_stamps_bottom[0]])

    timeLenseLineLeft
      .enter()
      .append("line")
      .attr("class", "timeLenseLineLeft timeLenseLine")
      .merge(timeLenseLineLeft)
      .attr("x1", (d) => scaleXTop(d))
      .attr("x2", (d) => scaleXTop(d))
      .attr("y1", (d) => scaleYTop(y_max_top))
      .attr("y2", (d) => scaleYTop(0))
      .attr("fill", "none")
      .attr("stroke-width", 5)
      .attr("opacity", 0.5)
      .attr("stroke", "#000000")

    timeLenseLineLeft.exit().remove()

    let timeLenseLineRight = self.gTimeLenseLines
      .selectAll(".timeLenseLineRight")
      .data([time_stamps_bottom[1] + 1000 * 60 * 60 * 24])

    timeLenseLineRight
      .enter()
      .append("line")
      .attr("class", "timeLenseLineRight timeLenseLine")
      .merge(timeLenseLineRight)
      .attr("x1", (d) => scaleXTop(d))
      .attr("x2", (d) => scaleXTop(d))
      .attr("y1", (d) => scaleYTop(y_max_top))
      .attr("y2", (d) => scaleYTop(0))
      .attr("fill", "none")
      .attr("stroke-width", 5)
      .attr("opacity", 0.5)
      .attr("stroke", "#000000")

    timeLenseLineRight.exit().remove()

    /**
     * Zieh-Balken BOTTOM, nicht veränderbar
     */
    let staticTimeLenseLineLeft = self.gTimeLenseLines
      .selectAll(".staticTimeLenseLineLeft")
      .data([time_stamps_bottom[0]])

    staticTimeLenseLineLeft
      .enter()
      .append("line")
      .attr("class", "staticTimeLenseLineLeft timeLenseLine")
      .merge(staticTimeLenseLineLeft)
      .attr("x1", (d) => 0)
      .attr("x2", (d) => 0)
      .attr("y1", (d) => offsetBottomLinesY + scaleYBottom(y_max_bottom))
      .attr("y2", (d) => offsetBottomLinesY + scaleYBottom(0))
      .attr("fill", "none")
      .attr("stroke-width", 5)
      .attr("opacity", 0.5)
      .attr("stroke", "#000000")

    staticTimeLenseLineLeft.exit().remove()

    let staticTimeLenseLineRight = self.gTimeLenseLines
      .selectAll(".staticTimeLenseLineRight")
      .data([time_stamps_bottom[1]])

    staticTimeLenseLineRight
      .enter()
      .append("line")
      .attr("class", "staticTimeLenseLineRight timeLenseLine")
      .merge(staticTimeLenseLineRight)
      .attr("x1", (d) => width - 0)
      .attr("x2", (d) => width - 0)
      .attr("y1", (d) => offsetBottomLinesY + scaleYBottom(y_max_bottom))
      .attr("y2", (d) => offsetBottomLinesY + scaleYBottom(0))
      .attr("fill", "none")
      .attr("stroke-width", 5)
      .attr("opacity", 0.5)
      .attr("stroke", "#000000")

    staticTimeLenseLineRight.exit().remove()

    /**
     * Zieh-Balken-OVERLAY TOP
     */

    let timeLenseLineTopLeftOverlay = self.gTimeLenseLines
      .selectAll(".timeLenseLineTopLeftOverlay")
      .data([time_stamps_bottom[0]])

    timeLenseLineTopLeftOverlay
      .enter()
      .append("line")
      .attr("class", "timeLenseLineTopLeftOverlay timeLenseLineOverlay")
      .merge(timeLenseLineTopLeftOverlay)
      .call(
        d3
          .drag()
          .on("drag", (d) => {
            let newTime = new Date(scaleXTop.invert(d3.event.x))
            let timeOffset = newTime.getTimezoneOffset() * 60 * 1000
            let newTimeMS = newTime.getTime()

            let roundUp = newTimeMS % (24 * 60 * 60 * 1000)
            if (roundUp >= (24 * 60 * 60 * 1000) / 2) {
              newTimeMS = newTimeMS + 24 * 60 * 60 * 1000 - roundUp
            } else {
              newTimeMS = newTimeMS - roundUp
            }

            newTimeMS += timeOffset
            if (newTimeMS <= time_stamps_top[0]) {
              newTimeMS = time_stamps_top[0]
            }
            if (newTimeMS >= time_stamps_bottom[1]) {
              newTimeMS = time_stamps_bottom[1]
            }

            self.gTimeLenseLines
              .selectAll(".dragTimeLenseLine")
              .attr("x1", scaleXTop(newTimeMS))
              .attr("x2", scaleXTop(newTimeMS))
              .attr("y1", scaleYTop(y_max_top))
              .attr("y2", scaleYTop(0))
              .classed("dragNotActive", false)
              .classed("dragActive", true)
              .attr("display", "block")

            // self.gTimeLenseLines
            //   .selectAll(".dragTimeLenseLine")
            //   .classed("dragNotActive", true)
            //   .classed("dragActive", false)
            //   .attr("display", "none")

            // time_stamps_bottom[0] = newTimeMS
            // self.props.change_filter_starttime(newTimeMS)
            // self.filter_data()
            // self.draw_vis()
          })
          .on("end", (d) => {
            let newTime = new Date(scaleXTop.invert(d3.event.x))
            let timeOffset = newTime.getTimezoneOffset() * 60 * 1000
            let newTimeMS = newTime.getTime()

            let roundUp = newTimeMS % (24 * 60 * 60 * 1000)
            if (roundUp >= (24 * 60 * 60 * 1000) / 2) {
              newTimeMS = newTimeMS + 24 * 60 * 60 * 1000 - roundUp
            } else {
              newTimeMS = newTimeMS - roundUp
            }

            newTimeMS += timeOffset
            if (newTimeMS <= time_stamps_top[0]) {
              newTimeMS = time_stamps_top[0]
            }
            if (newTimeMS >= time_stamps_bottom[1]) {
              newTimeMS = time_stamps_bottom[1]
            }

            self.gTimeLenseLines
              .selectAll(".dragTimeLenseLine")
              .classed("dragNotActive", true)
              .classed("dragActive", false)
              .attr("display", "none")

            self.props.change_filter_starttime(newTimeMS)
          })
      )
      .attr("x1", (d) => scaleXTop(d))
      .attr("x2", (d) => scaleXTop(d))
      .attr("y1", (d) => scaleYTop(y_max_top))
      .attr("y2", (d) => scaleYTop(0))
      .attr("stroke-width", 20)
      .attr("stroke-opacity", 0)
      .attr("cursor", "col-resize")

    timeLenseLineTopLeftOverlay.exit().remove()

    let timeLenseLineTopRightOverlay = self.gTimeLenseLines
      .selectAll(".timeLenseLineTopRightOverlay")
      .data([time_stamps_bottom[1] + 1000 * 60 * 60 * 24])

    timeLenseLineTopRightOverlay
      .enter()
      .append("line")
      .attr("class", "timeLenseLineTopRightOverlay timeLenseLineOverlay")
      .merge(timeLenseLineTopRightOverlay)
      .call(
        d3
          .drag()
          .on("drag", (d) => {
            let newTime = new Date(scaleXTop.invert(d3.event.x))
            let timeOffset = newTime.getTimezoneOffset() * 60 * 1000
            let newTimeMS = newTime.getTime()

            let roundUp = newTimeMS % (24 * 60 * 60 * 1000)
            if (roundUp >= (24 * 60 * 60 * 1000) / 2) {
              newTimeMS = newTimeMS + 24 * 60 * 60 * 1000 - roundUp
            } else {
              newTimeMS = newTimeMS - roundUp
            }
            newTimeMS += timeOffset
            if (newTimeMS <= time_stamps_bottom[0]) {
              newTimeMS = time_stamps_bottom[0] + 1000 * 60 * 60 * 24
            }
            if (newTimeMS >= time_stamps_top[1]) {
              newTimeMS = time_stamps_top[1]
            }

            self.gTimeLenseLines
              .selectAll(".dragTimeLenseLine")
              .attr("x1", scaleXTop(newTimeMS))
              .attr("x2", scaleXTop(newTimeMS))
              .attr("y1", scaleYTop(y_max_top))
              .attr("y2", scaleYTop(0))
              .classed("dragNotActive", false)
              .classed("dragActive", true)
              .attr("display", "block")

            newTimeMS = newTimeMS - 1000 * 60 * 60 * 24

            // time_stamps_bottom[1] = newTimeMS
            // self.props.change_filter_endtime(newTimeMS)
            // self.filter_data()
            // self.draw_vis()
          })
          .on("end", (d) => {
            let newTime = new Date(scaleXTop.invert(d3.event.x))
            let timeOffset = newTime.getTimezoneOffset() * 60 * 1000
            let newTimeMS = newTime.getTime()

            let roundUp = newTimeMS % (24 * 60 * 60 * 1000)
            if (roundUp >= (24 * 60 * 60 * 1000) / 2) {
              newTimeMS = newTimeMS + 24 * 60 * 60 * 1000 - roundUp
            } else {
              newTimeMS = newTimeMS - roundUp
            }
            newTimeMS += timeOffset
            if (newTimeMS <= time_stamps_bottom[0]) {
              newTimeMS = time_stamps_bottom[0] + 1000 * 60 * 60 * 24
            }
            if (newTimeMS >= time_stamps_top[1]) {
              newTimeMS = time_stamps_top[1]
            }

            newTimeMS = newTimeMS - 1000 * 60 * 60 * 24

            self.gTimeLenseLines
              .selectAll(".dragTimeLenseLine")
              .classed("dragNotActive", true)
              .classed("dragActive", false)
              .attr("display", "none")

            self.props.change_filter_endtime(newTimeMS)
          })
      )
      .attr("x1", (d) => scaleXTop(d))
      .attr("x2", (d) => scaleXTop(d))
      .attr("y1", (d) => scaleYTop(y_max_top))
      .attr("y2", (d) => scaleYTop(0))
      .attr("stroke-width", 20)
      .attr("stroke-opacity", 0)
      .attr("cursor", "col-resize")

    timeLenseLineTopRightOverlay.exit().remove()

    /**
     * Zieh-Balken-OVERLAY BOTTOM
     */

    let timeLenseLineBottomLeftOverlay = self.gTimeLenseLines
      .selectAll(".timeLenseLineBottomLeftOverlay")
      .data([time_stamps_bottom[0]])

    timeLenseLineBottomLeftOverlay
      .enter()
      .append("line")
      .attr("class", "timeLenseLineBottomLeftOverlay timeLenseLineOverlay")
      .merge(timeLenseLineBottomLeftOverlay)
      .call(
        d3
          .drag()
          .on("drag", (d) => {
            let newTime = new Date(scaleXBottom.invert(d3.event.x))
            let timeOffset = newTime.getTimezoneOffset() * 60 * 1000
            let newTimeMS = newTime.getTime()

            let roundUp = newTimeMS % (24 * 60 * 60 * 1000)
            if (roundUp >= (24 * 60 * 60 * 1000) / 2) {
              newTimeMS = newTimeMS + 24 * 60 * 60 * 1000 - roundUp
            } else {
              newTimeMS = newTimeMS - roundUp
            }
            newTimeMS += timeOffset
            if (newTimeMS <= time_stamps_bottom[0]) {
              newTimeMS = time_stamps_bottom[0]
            }
            if (newTimeMS >= time_stamps_bottom[1]) {
              newTimeMS = time_stamps_bottom[1]
            }

            self.gTimeLenseLines
              .selectAll(".dragTimeLenseLine")
              .attr("x1", scaleXBottom(newTimeMS))
              .attr("x2", scaleXBottom(newTimeMS))
              // .attr("x2", d3.event.x)
              .attr("y1", offsetBottomLinesY + scaleYBottom(y_max_bottom))
              .attr("y2", offsetBottomLinesY + scaleYBottom(0))
              .classed("dragNotActive", false)
              .classed("dragActive", true)
              .attr("display", "block")
          })
          .on("end", (d) => {
            let newTime = new Date(scaleXBottom.invert(d3.event.x))
            let timeOffset = newTime.getTimezoneOffset() * 60 * 1000
            let newTimeMS = newTime.getTime()

            let roundUp = newTimeMS % (24 * 60 * 60 * 1000)
            if (roundUp >= (24 * 60 * 60 * 1000) / 2) {
              newTimeMS = newTimeMS + 24 * 60 * 60 * 1000 - roundUp
            } else {
              newTimeMS = newTimeMS - roundUp
            }
            newTimeMS += timeOffset
            if (newTimeMS <= time_stamps_bottom[0]) {
              newTimeMS = time_stamps_bottom[0]
            }
            if (newTimeMS >= time_stamps_bottom[1]) {
              newTimeMS = time_stamps_bottom[1]
            }

            self.gTimeLenseLines
              .selectAll(".dragTimeLenseLine")
              .classed("dragNotActive", true)
              .classed("dragActive", false)
              .attr("display", "none")

            // time_stamps_bottom[0] = newTimeMS
            self.props.change_filter_starttime(newTimeMS)
            // self.filter_data()
            // self.draw_vis()
          })
      )
      .attr("x1", (d) => scaleXBottom(d))
      .attr("x2", (d) => scaleXBottom(d))
      .attr("y1", (d) => offsetBottomLinesY + scaleYBottom(y_max_bottom))
      .attr("y2", (d) => offsetBottomLinesY + scaleYBottom(0))
      .attr("stroke-width", 20)
      .attr("stroke-opacity", 0)
      .attr("cursor", "col-resize")

    timeLenseLineBottomLeftOverlay.exit().remove()

    let timeLenseLineBottomRightOverlay = self.gTimeLenseLines
      .selectAll(".timeLenseLineBottomRightOverlay")
      .data([time_stamps_bottom[1] + 1000 * 60 * 60 * 24])

    timeLenseLineBottomRightOverlay
      .enter()
      .append("line")
      .attr("class", "timeLenseLineBottomRightOverlay timeLenseLineOverlay")
      .merge(timeLenseLineBottomRightOverlay)
      .call(
        d3
          .drag()
          .on("drag", (d) => {
            let newTime = new Date(scaleXBottom.invert(d3.event.x))
            let timeOffset = newTime.getTimezoneOffset() * 60 * 1000
            let newTimeMS = newTime.getTime()

            let roundUp = newTimeMS % (24 * 60 * 60 * 1000)
            if (roundUp >= (24 * 60 * 60 * 1000) / 2) {
              newTimeMS = newTimeMS + 24 * 60 * 60 * 1000 - roundUp
            } else {
              newTimeMS = newTimeMS - roundUp
            }
            newTimeMS += timeOffset
            if (newTimeMS <= time_stamps_bottom[0]) {
              newTimeMS = time_stamps_bottom[0] + 1000 * 60 * 60 * 24
            }
            if (newTimeMS > time_stamps_bottom[1]) {
              newTimeMS = time_stamps_bottom[1] + 1000 * 60 * 60 * 24
            }

            self.gTimeLenseLines
              .selectAll(".dragTimeLenseLine")
              .attr("x1", scaleXBottom(newTimeMS))
              .attr("x2", scaleXBottom(newTimeMS))
              .attr("y1", offsetBottomLinesY + scaleYBottom(y_max_bottom))
              .attr("y2", offsetBottomLinesY + scaleYBottom(0))
              .classed("dragNotActive", false)
              .classed("dragActive", true)
              .attr("display", "block")
          })
          .on("end", (d) => {
            let newTime = new Date(scaleXBottom.invert(d3.event.x))
            let timeOffset = newTime.getTimezoneOffset() * 60 * 1000
            let newTimeMS = newTime.getTime()

            let roundUp = newTimeMS % (24 * 60 * 60 * 1000)
            if (roundUp >= (24 * 60 * 60 * 1000) / 2) {
              newTimeMS = newTimeMS + 24 * 60 * 60 * 1000 - roundUp
            } else {
              newTimeMS = newTimeMS - roundUp
            }
            newTimeMS += timeOffset
            if (newTimeMS <= time_stamps_bottom[0]) {
              newTimeMS = time_stamps_bottom[0]
            }
            if (newTimeMS > time_stamps_bottom[1]) {
              newTimeMS = time_stamps_bottom[1] + 1000 * 60 * 60 * 24
            }

            newTimeMS = newTimeMS - 1000 * 60 * 60 * 24

            self.gTimeLenseLines
              .selectAll(".dragTimeLenseLine")
              .classed("dragNotActive", true)
              .classed("dragActive", false)
              .attr("display", "none")

            // time_stamps_bottom[1] = newTimeMS
            self.props.change_filter_endtime(newTimeMS)
            // self.filter_data()
            // self.draw_vis()
          })
      )
      .attr("x1", (d) => scaleXBottom(d))
      .attr("x2", (d) => scaleXBottom(d))
      .attr("y1", (d) => offsetBottomLinesY + scaleYBottom(y_max_bottom))
      .attr("y2", (d) => offsetBottomLinesY + scaleYBottom(0))
      .attr("stroke-width", 20)
      .attr("stroke-opacity", 0)
      .attr("cursor", "col-resize")

    timeLenseLineBottomRightOverlay.exit().remove()

    /**
     * BOTTOM: Interpolierte Kurve um TimeLense anzudeuten
     */
    let timeLenseInterpolateFunction = d3
      .line()
      .x((d) => d.x)
      .y((d) => d.y)
      .curve(d3.curveCardinalOpen)
    let timeLenseInterpolateLeft = self.gTimeLenseLines
      .selectAll(".timeLenseInterpolateLeft")
      .data([
        [
          {
            x: scaleXTop(time_stamps_bottom[0]),
            y: scaleYTop(y_max_top),
          },
          {
            x: scaleXTop(time_stamps_bottom[0]),
            y: scaleYTop(0),
          },
          {
            x: 0,
            y: offsetBottomLinesY + scaleYBottom(y_max_bottom),
          },
          {
            x: 0,
            y: offsetBottomLinesY + scaleYBottom(0),
          },
        ],
      ])

    timeLenseInterpolateLeft
      .enter()
      .append("path")
      .attr("class", "timeLenseInterpolateLeft timeLenseInterpolate")
      .merge(timeLenseInterpolateLeft)
      .attr("d", timeLenseInterpolateFunction)
      .attr("fill", "none")
      .attr("stroke-width", 5)
      .attr("stroke", "#000000")
      .attr("opacity", 0.5)

    timeLenseInterpolateLeft.exit().remove()

    let timeLenseInterpolateRight = self.gTimeLenseLines
      .selectAll(".timeLenseInterpolateRight")
      .data([
        [
          {
            x: scaleXTop(time_stamps_bottom[1] + 1000 * 60 * 60 * 24),
            y: scaleYTop(y_max_top),
          },
          {
            x: scaleXTop(time_stamps_bottom[1] + 1000 * 60 * 60 * 24),
            y: scaleYTop(0),
          },
          {
            x: width - 0,
            y: offsetBottomLinesY + scaleYBottom(y_max_bottom),
          },
          {
            x: width - 0,
            y: offsetBottomLinesY + scaleYBottom(0),
          },
        ],
      ])

    timeLenseInterpolateRight
      .enter()
      .append("path")
      .attr("class", "timeLenseInterpolateRight timeLenseInterpolate")
      .merge(timeLenseInterpolateRight)
      .attr("d", timeLenseInterpolateFunction)
      .attr("fill", "none")
      .attr("stroke-width", 5)
      .attr("stroke", "#000000")
      .attr("opacity", 0.5)

    timeLenseInterpolateRight.exit().remove()

    /**
     * TOP Epidemikurve
     */
    let topEpidemikurve = self.gEpidemikurveTop
      .selectAll(".keimkurve_rects")
      .data(data_top)

    topEpidemikurve
      .enter()
      .append("rect")
      .merge(topEpidemikurve)
      .on("click", (d) => {
        console.log(d)
      })
      .attr("class", (d) => "keimkurve_rects")
      .attr("fill", (d) => {
        let col = "#bbbbbb"

        if (d.rki_data) {
          let val = d.rki_data.Ausbruchswahrscheinlichkeit
          val = val / 0.5 + 0.5
          col = d3.interpolateOranges(val)
        }

        return col
      })
      .attr("x", (d, i) => {
        return scaleXTop(new Date(d.Datum).getTime())
      })
      .attr("y", (d) => {
        return scaleYTop(d["Anzahl_cs"])
      })
      .attr("width", (d) => {
        return (
          scaleXTop(new Date(d.Datum).getTime() + 1000 * 60 * 60 * 24) -
          scaleXTop(new Date(d.Datum).getTime())
        )
      })
      .attr("height", (d) => {
        return scaleYTop(y_max_top - d["Anzahl_cs"])
      })

    topEpidemikurve.exit().remove()

    /**
     * BOTTOM Epidemikurve
     */
    let bottomEpidemikurve = self.gEpidemikurveBottom
      .selectAll(".keimkurve_rects")
      .data(data_bottom)

    bottomEpidemikurve
      .enter()
      .append("rect")
      .merge(bottomEpidemikurve)
      .on("click", (d) => {
        console.log(d)
      })
      .attr("class", (d) => "keimkurve_rects")
      .attr("fill", (d) => {
        let col = "#bbbbbb"

        if (d.rki_data) {
          let val = d.rki_data.Ausbruchswahrscheinlichkeit
          val = val / 0.5 + 0.5
          col = d3.interpolateOranges(val)
        }

        return col
      })
      .attr("x", (d, i) => {
        return scaleXBottom(new Date(d.Datum).getTime())
      })
      .attr("y", (d) => {
        return scaleYBottom(d["Anzahl"])
      })
      .attr("width", (d) => {
        return (
          scaleXBottom(new Date(d.Datum).getTime() + 1000 * 60 * 60 * 24) -
          scaleXBottom(new Date(d.Datum).getTime())
        )
      })
      .attr("height", (d) => {
        return scaleYBottom(y_max_bottom - d["Anzahl"])
      })

    bottomEpidemikurve.exit().remove()

    /**
     * BOTTOM MEAN7 bzw MEAN28
     */
    let bottomMean = self.gMeanTop.selectAll("polygon").data([data_top])

    bottomMean
      .enter()
      .append("polygon")
      .merge(bottomMean)
      .attr("stroke", "black")
      .attr("stroke-width", 3)
      .attr("opacity", 1)
      .attr("fill", "none")
      .attr("points", (d) => {
        scaleYTop.domain([y_max_top, 0])
        let bottomPoints = width + ",0, 0,0"
        let points = ""
        for (let i = 0; i < d.length; i++) {
          let num = 0

          if (d[i].rki_data !== undefined) {
            num =
              d[i].rki_data[this.niveau_curve_names[this.niveau_curve_index]]
          }

          points =
            points +
            ((i * width) / d.length).toString() +
            ",-" +
            scaleYTop(num).toString() +
            ", "
          points =
            points +
            (((i + 1) * width) / d.length).toString() +
            ",-" +
            scaleYTop(num).toString() +
            ", "
        }
        return points + bottomPoints
      })
      .attr(
        "transform",
        (d) => "translate(" + 0 + "," + scaleYTop(y_max_top) + ")"
      )

    bottomMean.exit().remove()

    /**
     * no loaded data hatching (schraffur)
     */

    let top_no_loaded_data_rects = self.gEpidemikurveTop
      .selectAll(".no_loaded_data_rects")
      .data(no_data_rects_top)

    top_no_loaded_data_rects
      .enter()
      .append("rect")
      .merge(top_no_loaded_data_rects)
      .attr("class", (d) => "no_loaded_data_rects")
      // .attr("fill", (d) => {
      //   let col = "yellow"

      //   return col
      // })
      .attr("x", (d, i) => {
        return scaleXTop(d.begin)
      })
      .attr("y", (d) => {
        return scaleYTop(0)
      })
      .attr("width", (d) => {
        return scaleXTop(d.end) - scaleXTop(d.begin)
      })
      .attr("height", (d) => {
        return scaleYTop(y_max_top)
      })

    top_no_loaded_data_rects.exit().remove()

    let bottom_no_loaded_data_rects = self.gEpidemikurveBottom
      .selectAll(".no_loaded_data_rects")
      .data(no_data_rects_bottom)

    bottom_no_loaded_data_rects
      .enter()
      .append("rect")
      .merge(bottom_no_loaded_data_rects)
      .attr("class", (d) => "no_loaded_data_rects")
      // .attr("fill", (d) => {
      //   let col = "yellow"

      //   return col
      // })
      .attr("x", (d, i) => {
        return scaleXBottom(d.begin)
      })
      .attr("y", (d) => {
        return scaleYBottom(y_max_bottom)
      })
      .attr("width", (d) => {
        return scaleXBottom(d.end + 24 * 60 * 60 * 1000) - scaleXBottom(d.begin)
      })
      .attr("height", (d) => {
        return scaleYBottom(0)
      })

    bottom_no_loaded_data_rects.exit().remove()

    d3.select(self.svgRoot)
      .selectAll(".tick")
      .selectAll("line")
      .attr("opacity", 0.5)
      .attr("stroke-dasharray", "4, 6")
      .attr("stroke--width", 1)

    d3.select(self.svgRoot)
      //.selectAll(".gxAxis")
      .selectAll(".tick")
      .selectAll("text")
      .attr("font-size", "1.2em")

    d3.select(self.svgRoot)
      .selectAll(".gyAxis")
      .selectAll("path")
      .attr("stroke-width", 3)

    d3.select(self.svgRoot)
      .selectAll(".gxAxis")
      .selectAll("path")
      .attr("stroke-width", 3)
  }

  render() {
    let self = this

    let selections = []
    this.state.stationIDs.forEach((s_id, i) => {
      selections.push(
        <option key={s_id} value={s_id}>
          {s_id}
        </option>
      )
    })
    let selection = null
    if (selections.length > 0) {
      selection = (
        <select
          key="selection1"
          onChange={this.switchStation}
          value={this.state.getStationID}
        >
          {selections}
        </select>
      )
    }

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
          className="svgRoot"
          ref={(element) => (this.svgRoot = element)}
          style={{
            pointerEvents: "all",
            display: element_to_draw === null ? "block" : "none",
          }}
        >
          {/* https://bl.ocks.org/jfsiii/7772281 */}
          <defs>
            <pattern
              id="pattern-stripe"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect
                width="10"
                height="20"
                transform="translate(0,0)"
                fill="white"
              ></rect>
            </pattern>
            <mask id="mask-stripe">
              <rect
                x="0"
                y="0"
                // width="100%"
                // height="100%"
                width="5000px"
                height="5000px"
                fill="url(#pattern-stripe)"
              />
            </mask>
          </defs>
        </svg>
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

export default Epikurve
