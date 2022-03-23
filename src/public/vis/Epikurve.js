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

    this.data
    this.width
    this.height

    this.socket = props.socket.client
    this.translate = props.translate
    this.get_color = props.get_color

    // this.margin = {
    //   top: 25,
    //   bottom: 25,
    //   left: 25,
    //   right: 25,
    // }

    // this.title = this.translate("EpidemieKeim")

    // this.transition_duration = 200
    this.transition_duration = props.transition_duration

    /**
     * copy from old module
     */

    this.defaultStation = "Klinik"

    this.state = {
      getStationID: undefined, // TODO: = selected_station filter
      getConfigName: undefined, // TODO: = selected_config -> setzt station ?
      stationIDs: [],
      configNames: [],
    }

    this.selected_station = undefined

    this.margin = {
      top: 50,
      right: 20,
      // right: 0,
      bottom: 20,
      left: 50,
      // left: 0,
      text: 20,
    }

    this.niveau_curve_index = 0
    this.niveau_curve_names = ["Endemisches Niveau", "Epidemisches Niveau"]

    this.timeSpans = [7, 28]
    this.dataType = 1

    this.dataTypeTop = {
      type: "Anzahl_cs",
      name: () => this.translate("firstInfections_CS"),
    }
    this.dataTypeBottom = {
      type: "Anzahl",
      name: () => this.translate("firstInfections"),
    }
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
    self.draw_vis()
  }

  componentDidMount() {
    let self = this

    console.log("epikurve module did mount")

    this.socket.on("epikurve", this.handle_data)

    this.props.register_module(this.module_id, this.module_type, this.draw_vis)

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

    let svg = (this.gGraphics = d3
      .select(self.svgRoot)
      .append("g")
      .attr("class", "epikurve"))

    this.gLegend = svg.append("g").attr("class", "gLegend")

    let svgTop = (self.gGraphicsTop = d3
      .select(self.svgRoot)
      // .on()
      .append("g")
      .attr("class", "gContainer topContainer epidemiKeimContainer"))

    let svgBottom = (self.gGraphicsBottom = d3
      .select(self.svgRoot)
      // .on()
      .append("g")
      .attr("class", "gContainer bottomContainer epidemiKeimContainer"))

    let svgBoth = (self.gGraphicsBoth = d3
      .select(self.svgRoot)
      // .on()
      .append("g")
      .attr("class", "gContainer bothContainer epidemiKeimContainer"))

    let gContainers = [
      "epidemiKeimContainer",
      "gEpidemikurve",
      "gMean",
      "gxAxis",
      "gyAxis",
      // "gMean7",
      // "gMean28",
      // "gMean",
      "gMouseListener",
    ]

    gContainers.forEach((d) => {
      self[d + "Top"] = svgTop.append("g").attr("class", (a) => d + "Top")
      self[d + "Bottom"] = svgBottom
        .append("g")
        .attr("class", (a) => d + "Bottom")
    })
    // gContainersBottom.forEach(d => {
    //     self[d] = svgBottom.append("g").attr("class", d => d + "Bottom")
    // })

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

    // self.gTimeLenseLines.append("line")
    //     .attr("class", "dragTimeLenseLineRight")
    //     .classed("dragNotActive", true)
    //     .attr("y1", 0)
    //     .attr("y2", 0)
    //     .attr("x1", 0)
    //     .attr("x2", 0)

    /**
     * TOP Y-AXIS
     */
    // let yTop = d3.scaleLinear().range([0, 0])
    // let yAxisTop = d3.axisLeft(yTop)
    // // .ticks(5)
    // self.gyAxisTop
    //   // .attr("transform", "translate(0," + 0 + ")")
    //   .call(yAxisTop)
    //   .append("text")
    //   .attr("transform", "rotate(-90)")
    //   .attr("class", "label clickable")
    //   .attr("y", -40)
    //   .attr("x", 0)
    //   .attr("dy", "0.71em")
    //   .attr("font", "sans-serif")
    //   .attr("font-size", 10)
    //   .attr("fill", "black")
    //   .attr("cursor", "pointer")
    //   .style("text-anchor", "middle")
    //   // .text("initialized")
    //   .on("click", () => {
    //     self.switchDataType()
    //   })

    /**
     * BOTTOM Y-AXIS
     */
    // let yBottom = d3.scaleLinear().range([0, 0])
    // let yAxisBottom = d3.axisLeft(yBottom)
    // // .ticks(5)
    // self.gyAxisBottom
    //   // .attr("transform", "translate(0," + 0 + ")")
    //   .call(yAxisBottom)
    //   .append("text")
    //   .attr("transform", "rotate(-90)")
    //   .attr("class", "label clickable")
    //   .attr("y", -40)
    //   .attr("x", 0)
    //   .attr("dy", "0.71em")
    //   .attr("font", "sans-serif")
    //   .attr("font-size", 10)
    //   .attr("fill", "black")
    //   .attr("cursor", "pointer")
    //   .style("text-anchor", "middle")
    // .text("initialized")
    // .on("click", () => {
    //   self.switchDataType()
    // })

    /**
     * TOP X-AXIS
     */
    // let xTop = d3.scaleTime().range([0, 0])
    // let xAxisTop = d3.axisBottom(xTop)
    // // .ticks(5)
    // self.gxAxisTop
    //   // .attr("transform", "translate(0," + 0 + ")")
    //   .call(xAxisTop)
    //   .append("text")
    //   .attr("class", "label clickable title")
    // .attr("y", -40)
    // .attr("x", 0)
    // .attr("dy", "0.71em")
    // .attr("font", "sans-serif")
    // .attr("font-size", 10)
    // .attr("fill", "black")
    // .attr("cursor", "pointer")
    // .style("text-anchor", "middle")
    // .text("initialized")
    // .on("click", () => {
    //   self.switchTimeSpan()
    // })

    /**
     * BOTTOM X-AXIS
     */
    // let xBottom = d3.scaleTime().range([0, 0])
    // let xAxisBottom = d3.axisBottom(xBottom)
    // // .ticks(5)
    // self.gxAxisBottom
    //   // .attr("transform", "translate(0," + 0 + ")")
    //   .call(xAxisBottom)
    //   .append("text")
    // .attr("class", "label clickable title")
    // .attr("dy", "0.71em")
    // .attr("font", "sans-serif")
    // .attr("font-size", 10)
    // .attr("fill", "black")
    // .attr("cursor", "pointer")
    // .style("text-anchor", "middle")
    // .text("initialized")
    // .on("click", () => {
    //   self.swtichMeanCurve()
    // })
    //TODO: tickSizeInner wie in Timeline.js von der größe abhängig machen

    this.draw_vis()
  }

  componentWillUnmount() {
    this.socket.off("epikurve")

    this.props.unregister_module(this.module_id)

    clearInterval(this.checkSize)
  }

  handle_data = (data) => {
    console.log("epikurve vis data recieved")
    console.log(data)

    this.data = data
    // this.initial_timelense_timestamps = JSON.parse(
    //   JSON.stringify(data.data.initial_timelense_timestamps)
    // )

    let pfv = this.props.get_possible_filter_values()
    this.initial_timelense_timestamps = [pfv.min_ts, pfv.max_ts]

    // prepare the selection for the new data
    let stations = []
    this.selected_station = undefined
    data.data.stationIDs.forEach((s_id, i) => {
      stations.push(s_id)
      if (i === 0) {
        this.selected_station = s_id
      }
    })

    let confs = []
    this.selected_config = undefined
    data.data?.rki_configs?.forEach((conf, i) => {
      confs.push(conf.name)
    })

    // !select the station and config based on config_name of parameters
    if (data.data.config_stationid !== undefined)
      this.selected_station = data.data.config_stationid
    this.selected_config = data.data.configName

    this.setState((prevState) => {
      prevState.stationIDs = stations
      prevState.configNames = confs
      prevState.getStationID = this.selected_station
      prevState.getConfigName = this.selected_config
      return prevState
    })

    this.draw_vis()
  }

  draw_vis = (stationID, pathogenID) => {
    let self = this
    let data = this.data

    console.log("drawing epikurve")

    /**
     * Titel + Timestamp
     */

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

    if (
      this.data === undefined ||
      this.data.data === undefined ||
      Object.getOwnPropertyNames(this.data.data).length <= 0
      // !Array.isArray(this.data.data) ||
      // this.data.data.length === 0
    ) {
      return
    }

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

    let locale = this.props.get_locale()

    /**
     * from old module
     */
    if (!stationID) {
      stationID = self.state.getStationID
      // stationID = data.data.stationIDs[0]
    }
    if (!pathogenID) {
      // pathogenID = self.state.getPathogenID
      pathogenID = data.data.pathogenIDs[0]
    }
    let stationIDname = stationID
    let pathogenIDname = "K" + pathogenID

    let svg = d3.select(self.svgRoot)
    let width =
      parseInt(svg.style("width")) - self.margin.left - self.margin.right
    let height =
      parseInt(svg.style("height")) -
      2 * self.margin.top -
      2 * self.margin.bottom
    // let data = self.data

    let dataTypeTop = this.dataTypeTop
    let dataTypeBottom = this.dataTypeBottom

    let offsetBottomLinesY = height / 2 + self.margin.top + self.margin.bottom

    // let timeStampsTop = [
    //   dataTop[0].timestamps[0],
    //   dataTop[dataTop.length - 1].timestamps[
    //     dataTop[dataTop.length - 1].timestamps.length - 1
    //   ] +
    //     1000 * 60 * 60 * 24,
    // // ]
    // let timeStampsTop = self.initial_timelense_timestamps

    // let timeStampsBottom = [dataBottom[0].timeStamp, dataBottom[dataBottom.length - 1].timeStamp + 1000 * 60 * 60 * 24]
    /**
     * Hier die Bottom Daten filtern
     */
    let dataBottomOrg = data.data.data[pathogenIDname][stationIDname]

    // let timeStampsTop = [
    //   dataBottomOrg[0].timestamp,
    //   dataBottomOrg[dataBottomOrg.length - 1].timestamp + 1000 * 60 * 60 * 24,
    // ]
    let pfv = this.props.get_possible_filter_values()
    let timeStampsTop = [pfv.min_ts, pfv.max_ts + 1000 * 60 * 60 * 24]
    console.log(dataBottomOrg)

    // TODO: temporär, müsste so erstmal klappen...
    console.warn("before and after")
    console.log(self.initial_timelense_timestamps)
    self.initial_timelense_timestamps = [
      self.props.filter_values.min_ts,
      self.props.filter_values.max_ts,
    ]
    console.log(self.initial_timelense_timestamps)

    let timeStampsBottom = self.initial_timelense_timestamps
    let dataBottom = data.data.data[pathogenIDname][stationIDname].filter(
      (d) =>
        timeStampsBottom[0] <= d.timestamp && d.timestamp <= timeStampsBottom[1]
    )

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
    // let legendLine = self.gGraphicsBottom.selectAll(".legendLine").data([0])
    let legendLine = self.gGraphicsTop.selectAll(".legendLine2").data([0])

    legendLine
      .enter()
      .append("line")
      .attr("class", "legendLine2")
      .merge(legendLine)
      .transition()
      .duration(self.transition_duration)
      .attr("x1", (width * 3) / 4)
      .attr("x2", (width * 3) / 4 + 20)
      // .attr("y1", -15)
      // .attr("y2", -15)
      .attr("y1", -35)
      .attr("y2", -35)
      // .attr("stroke", "#ff7f00")
      .attr("stroke", "black")
      .attr("stroke-width", 3)
      .attr("fill", "none")
      .attr("opacity", 1)

    legendLine.exit().remove()

    // let legendText = self.gGraphicsBottom.selectAll(".legendText").data([0])
    let legendText = self.gGraphicsTop.selectAll(".legendText").data([0])

    legendText
      .enter()
      .append("text")
      .attr("class", "legendText clickable")
      .on("click", () => {
        // self.swtichMeanCurve()
        self.switch_niveau_curve_index()
      })
      .merge(legendText)
      .transition()
      .duration(self.transition_duration)
      .attr("x", (width * 3) / 4 + 25)
      // .attr("y", -10)
      .attr("y", -30)
      .attr("font-size", "80%")
      .attr("cursor", "pointer")
      // .text(() => "Mean " + meanCurve + " " + self.translate("days"))
      .text(() => this.niveau_curve_names[this.niveau_curve_index])

    legendText.exit().remove()

    /**
     * TOP Y-AXIS
     */
    // let yMaxTop = d3.max(dataTop, (d) => d[dataType.type])
    let yMaxTop = d3.max(dataBottomOrg, (d) => d[dataTypeTop.type])

    dataBottomOrg.forEach((d) => {
      if (d.rki_data && d.rki_data[this.niveau_curve_names[0]] > yMaxTop) {
        yMaxTop = d.rki_data[this.niveau_curve_names[0]]
      }
      if (d.rki_data && d.rki_data[this.niveau_curve_names[1]] > yMaxTop) {
        yMaxTop = d.rki_data[this.niveau_curve_names[1]]
      }
    })

    yMaxTop = Math.round(yMaxTop + 1 + 0.1 * yMaxTop)

    let scaleYTop = d3
      .scaleLinear()
      .range([height / 2, 0])
      .domain([0, yMaxTop])
    let yAxisTop = d3
      .axisLeft(scaleYTop)
      .ticks(height / 100)
      .tickSizeInner([-width])

    self.gyAxisTop
      .transition()
      .duration(self.transition_duration)
      .call(yAxisTop)
      .selectAll(".tick")
      .selectAll("text")
      .attr("x", -8)

    let yAxisLabelTop = self.gyAxisTop.selectAll(".label").data([1])

    yAxisLabelTop
      .enter()
      .append("text")
      .attr("class", "label clickable")
      // .on("click", self.switchDataType)
      .merge(yAxisLabelTop)
      .transition()
      .duration(self.transition_duration)
      .text(() => dataTypeTop.name())
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
    let yMaxBottomValue = d3.max(dataBottom, (d) => d[dataTypeBottom.type])
    let avgName = "avg7_cs"

    let yMaxBottomMean = d3.max(dataBottom, (d) => d[avgName])
    let yMaxBottom = Math.max(yMaxBottomValue, yMaxBottomMean)
    yMaxBottom = Math.round(yMaxBottom + 1 + 0.1 * yMaxBottom)

    let scaleYBottom = d3
      .scaleLinear()
      .range([height / 2, 0])
      .domain([0, yMaxBottom])
    let yAxisBottom = d3
      .axisLeft(scaleYBottom)
      .ticks(height / 100)
      .tickSizeInner([-width])

    self.gyAxisBottom
      .transition()
      .duration(self.transition_duration)
      .call(yAxisBottom)
      .selectAll(".tick")
      .selectAll("text")
      .attr("x", -8)

    let yAxisLabelBottom = self.gyAxisBottom.selectAll(".label").data([1])

    yAxisLabelBottom
      .enter()
      .append("text")
      .attr("class", "label clickable")
      // .on("click", self.switchDataType)
      .merge(yAxisLabelBottom)
      .transition()
      .duration(self.transition_duration)
      .text(() => dataTypeBottom.name())
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

    // let yMaxTop = d3.max(data[1], d => d[dataType.type])
    // yMaxTop = Math.round(yMaxTop + 1 + 0.1 * yMaxTop)

    let scaleXTop = d3
      .scaleTime()
      .domain(d3.extent(timeStampsTop, (d) => xParseTime(d)))
      .range([0, width - 0])
    // .range([height / 2, 0])
    // .domain([0, yMaxTop])
    let xAxisTop = d3.axisBottom(scaleXTop).ticks(width / 150)
    // .tickSizeInner([-width])

    self.gxAxisTop
      .attr("transform", "translate(" + 0 + "," + height / 2 + ")")
      .transition()
      .duration(self.transition_duration)
      .call(xAxisTop)
    // .selectAll(".tick")
    // .selectAll("text")
    // .attr("x", -8)

    let xAxisLabelTop = self.gxAxisTop.selectAll(".label").data([1])

    xAxisLabelTop
      .enter()
      .append("text")
      .attr("class", "label clickable")
      // .text(() => "akkumulierte Anzahl Ersterkrankungen pro " + timeSpan + " Tage")
      .merge(xAxisLabelTop)
      .transition()
      .duration(self.transition_duration)
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
      // .domain(d3.extent(timeStampsBottom, (d) => xParseTime2(d)))
      .domain(
        d3.extent(
          [timeStampsBottom[0], timeStampsBottom[1] + 1000 * 60 * 60 * 24],
          (d) => xParseTime2(d)
        )
      )
      .range([0, width - 0])
    let xAxisBottom = d3.axisBottom(scaleXBottom).ticks(width / 150)
    // .tickSizeInner([-width])

    self.gxAxisBottom
      .attr("transform", "translate(" + 0 + "," + height / 2 + ")")
      .transition()
      .duration(self.transition_duration)
      .call(xAxisBottom)
    // .selectAll(".tick")
    // .selectAll("text")
    // .attr("x", -8)

    let xAxisLabelBottom = self.gxAxisBottom.selectAll(".label").data([1])

    xAxisLabelBottom
      .enter()
      .append("text")
      // .on("click", self.swtichMeanCurve)
      // .text(() => timeSpan + " Tage")
      .merge(xAxisLabelBottom)
      .transition()
      .duration(self.transition_duration)
      .attr("x", width / 2)
      .attr("y", -height / 2 - self.margin.top / 2 + 10)
      // .text("Anzahl täglicher Ersterkrankungen und " + meanCurve + "-Tage-Mean")
      // .text("Epidemiekurve Ersterkrankungen (pro Tag)")
      .text(self.translate("EpiBottomTitle"))
      .attr("class", "label clickable title")
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
      .data([self.initial_timelense_timestamps[0]])

    timeLenseLineLeft
      .enter()
      .append("line")
      .attr("class", "timeLenseLineLeft timeLenseLine")
      .merge(timeLenseLineLeft)
      .transition()
      .duration(self.transition_duration)
      .attr("x1", (d) => scaleXTop(d))
      .attr("x2", (d) => scaleXTop(d))
      .attr("y1", (d) => scaleYTop(yMaxTop))
      .attr("y2", (d) => scaleYTop(0))
      .attr("fill", "none")
      .attr("stroke-width", 5)
      .attr("opacity", 0.5)
      .attr("stroke", "#000000")

    timeLenseLineLeft.exit().remove()

    let timeLenseLineRight = self.gTimeLenseLines
      .selectAll(".timeLenseLineRight")
      .data([self.initial_timelense_timestamps[1] + 1000 * 60 * 60 * 24])

    timeLenseLineRight
      .enter()
      .append("line")
      .attr("class", "timeLenseLineRight timeLenseLine")
      .merge(timeLenseLineRight)
      .transition()
      .duration(self.transition_duration)
      .attr("x1", (d) => scaleXTop(d))
      .attr("x2", (d) => scaleXTop(d))
      .attr("y1", (d) => scaleYTop(yMaxTop))
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
      .data([self.initial_timelense_timestamps[0]])

    staticTimeLenseLineLeft
      .enter()
      .append("line")
      .attr("class", "staticTimeLenseLineLeft timeLenseLine")
      .merge(staticTimeLenseLineLeft)
      .transition()
      .duration(self.transition_duration)
      // .attr("x1", (d) => scaleXBottom(d))
      // .attr("x2", (d) => scaleXBottom(d))
      .attr("x1", (d) => 0)
      .attr("x2", (d) => 0)
      .attr("y1", (d) => offsetBottomLinesY + scaleYBottom(yMaxBottom))
      .attr("y2", (d) => offsetBottomLinesY + scaleYBottom(0))
      .attr("fill", "none")
      .attr("stroke-width", 5)
      .attr("opacity", 0.5)
      .attr("stroke", "#000000")

    staticTimeLenseLineLeft.exit().remove()

    let staticTimeLenseLineRight = self.gTimeLenseLines
      .selectAll(".staticTimeLenseLineRight")
      .data([self.initial_timelense_timestamps[1]])

    staticTimeLenseLineRight
      .enter()
      .append("line")
      .attr("class", "staticTimeLenseLineRight timeLenseLine")
      .merge(staticTimeLenseLineRight)
      .transition()
      .duration(self.transition_duration)
      // .attr("x1", (d) => scaleXBottom(d))
      // .attr("x2", (d) => scaleXBottom(d))
      .attr("x1", (d) => width - 0)
      .attr("x2", (d) => width - 0)
      .attr("y1", (d) => offsetBottomLinesY + scaleYBottom(yMaxBottom))
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
      .data([self.initial_timelense_timestamps[0]])

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
            if (newTimeMS <= timeStampsTop[0]) {
              newTimeMS = timeStampsTop[0]
            }
            if (newTimeMS >= self.initial_timelense_timestamps[1]) {
              newTimeMS = self.initial_timelense_timestamps[1]
            }

            self.gTimeLenseLines
              .selectAll(".dragTimeLenseLine")
              .attr("x1", scaleXTop(newTimeMS))
              .attr("x2", scaleXTop(newTimeMS))
              // .attr("x2", d3.event.x)
              .attr("y1", scaleYTop(yMaxTop))
              .attr("y2", scaleYTop(0))
              .classed("dragNotActive", false)
              .classed("dragActive", true)
              .attr("display", "block")
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
            if (newTimeMS <= timeStampsTop[0]) {
              newTimeMS = timeStampsTop[0]
            }
            if (newTimeMS >= self.initial_timelense_timestamps[1]) {
              newTimeMS = self.initial_timelense_timestamps[1]
            }

            self.gTimeLenseLines
              .selectAll(".dragTimeLenseLine")
              .classed("dragNotActive", true)
              .classed("dragActive", false)
              .attr("display", "none")

            self.initial_timelense_timestamps[0] = newTimeMS
            self.props.change_filter_starttime(newTimeMS)
            self.draw_vis()
          })
      )
      .transition()
      .duration(self.transition_duration)
      .attr("x1", (d) => scaleXTop(d))
      .attr("x2", (d) => scaleXTop(d))
      .attr("y1", (d) => scaleYTop(yMaxTop))
      .attr("y2", (d) => scaleYTop(0))
      .attr("stroke-width", 20)
      .attr("stroke-opacity", 0)
      .attr("cursor", "col-resize")

    timeLenseLineTopLeftOverlay.exit().remove()

    let timeLenseLineTopRightOverlay = self.gTimeLenseLines
      .selectAll(".timeLenseLineTopRightOverlay")
      .data([self.initial_timelense_timestamps[1] + 1000 * 60 * 60 * 24])

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
            if (newTimeMS <= self.initial_timelense_timestamps[0]) {
              newTimeMS =
                self.initial_timelense_timestamps[0] + 1000 * 60 * 60 * 24
            }
            if (newTimeMS >= timeStampsTop[1]) {
              newTimeMS = timeStampsTop[1]
            }

            self.gTimeLenseLines
              .selectAll(".dragTimeLenseLine")
              .attr("x1", scaleXTop(newTimeMS))
              .attr("x2", scaleXTop(newTimeMS))
              // .attr("x2", d3.event.x)
              .attr("y1", scaleYTop(yMaxTop))
              .attr("y2", scaleYTop(0))
              .classed("dragNotActive", false)
              .classed("dragActive", true)
              .attr("display", "block")
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
            if (newTimeMS <= self.initial_timelense_timestamps[0]) {
              newTimeMS =
                self.initial_timelense_timestamps[0] + 1000 * 60 * 60 * 24
            }
            if (newTimeMS >= timeStampsTop[1]) {
              newTimeMS = timeStampsTop[1]
            }

            newTimeMS = newTimeMS - 1000 * 60 * 60 * 24

            self.gTimeLenseLines
              .selectAll(".dragTimeLenseLine")
              .classed("dragNotActive", true)
              .classed("dragActive", false)
              .attr("display", "none")

            self.initial_timelense_timestamps[1] = newTimeMS
            self.props.change_filter_endtime(newTimeMS)
            self.draw_vis()
          })
      )
      .transition()
      .duration(self.transition_duration)
      .attr("x1", (d) => scaleXTop(d))
      .attr("x2", (d) => scaleXTop(d))
      .attr("y1", (d) => scaleYTop(yMaxTop))
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
      .data([self.initial_timelense_timestamps[0]])

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
            if (newTimeMS <= self.initial_timelense_timestamps[0]) {
              newTimeMS = self.initial_timelense_timestamps[0]
            }
            if (newTimeMS >= self.initial_timelense_timestamps[1]) {
              newTimeMS = self.initial_timelense_timestamps[1] // - 1000 * 60 * 60 * 24
            }

            self.gTimeLenseLines
              .selectAll(".dragTimeLenseLine")
              .attr("x1", scaleXBottom(newTimeMS))
              .attr("x2", scaleXBottom(newTimeMS))
              // .attr("x2", d3.event.x)
              .attr("y1", offsetBottomLinesY + scaleYBottom(yMaxBottom))
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
            if (newTimeMS <= self.initial_timelense_timestamps[0]) {
              newTimeMS = self.initial_timelense_timestamps[0]
            }
            if (newTimeMS >= self.initial_timelense_timestamps[1]) {
              newTimeMS = self.initial_timelense_timestamps[1]
            }

            self.gTimeLenseLines
              .selectAll(".dragTimeLenseLine")
              .classed("dragNotActive", true)
              .classed("dragActive", false)
              .attr("display", "none")

            self.initial_timelense_timestamps[0] = newTimeMS
            self.props.change_filter_starttime(newTimeMS)
            self.draw_vis()
          })
      )
      .transition()
      .duration(self.transition_duration)
      .attr("x1", (d) => scaleXBottom(d))
      .attr("x2", (d) => scaleXBottom(d))
      .attr("y1", (d) => offsetBottomLinesY + scaleYBottom(yMaxBottom))
      .attr("y2", (d) => offsetBottomLinesY + scaleYBottom(0))
      .attr("stroke-width", 20)
      .attr("stroke-opacity", 0)
      .attr("cursor", "col-resize")

    timeLenseLineBottomLeftOverlay.exit().remove()

    let timeLenseLineBottomRightOverlay = self.gTimeLenseLines
      .selectAll(".timeLenseLineBottomRightOverlay")
      .data([self.initial_timelense_timestamps[1] + 1000 * 60 * 60 * 24])

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
            if (newTimeMS <= self.initial_timelense_timestamps[0]) {
              newTimeMS =
                self.initial_timelense_timestamps[0] + 1000 * 60 * 60 * 24
            }
            if (newTimeMS > self.initial_timelense_timestamps[1]) {
              newTimeMS =
                self.initial_timelense_timestamps[1] + 1000 * 60 * 60 * 24
            }

            self.gTimeLenseLines
              .selectAll(".dragTimeLenseLine")
              .attr("x1", scaleXBottom(newTimeMS))
              .attr("x2", scaleXBottom(newTimeMS))
              // .attr("x2", d3.event.x)
              .attr("y1", offsetBottomLinesY + scaleYBottom(yMaxBottom))
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
            if (newTimeMS <= self.initial_timelense_timestamps[0]) {
              newTimeMS = self.initial_timelense_timestamps[0]
            }
            if (newTimeMS > self.initial_timelense_timestamps[1]) {
              newTimeMS =
                self.initial_timelense_timestamps[1] + 1000 * 60 * 60 * 24
            }

            newTimeMS = newTimeMS - 1000 * 60 * 60 * 24

            self.gTimeLenseLines
              .selectAll(".dragTimeLenseLine")
              .classed("dragNotActive", true)
              .classed("dragActive", false)
              .attr("display", "none")

            self.initial_timelense_timestamps[1] = newTimeMS
            self.props.change_filter_endtime(newTimeMS)
            self.draw_vis()
          })
      )
      .transition()
      .duration(self.transition_duration)
      .attr("x1", (d) => scaleXBottom(d))
      .attr("x2", (d) => scaleXBottom(d))
      .attr("y1", (d) => offsetBottomLinesY + scaleYBottom(yMaxBottom))
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
            x: scaleXTop(self.initial_timelense_timestamps[0]),
            y: scaleYTop(yMaxTop),
          },
          {
            x: scaleXTop(self.initial_timelense_timestamps[0]),
            y: scaleYTop(0),
          },
          {
            // x: scaleXBottom(self.initial_timelense_timestamps[0]),
            x: 0,
            y: offsetBottomLinesY + scaleYBottom(yMaxBottom),
          },
          {
            // x: scaleXBottom(self.initial_timelense_timestamps[0]),
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
      .transition()
      .duration(self.transition_duration)
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
            x: scaleXTop(
              self.initial_timelense_timestamps[1] + 1000 * 60 * 60 * 24
            ),
            y: scaleYTop(yMaxTop),
          },
          {
            x: scaleXTop(
              self.initial_timelense_timestamps[1] + 1000 * 60 * 60 * 24
            ),
            y: scaleYTop(0),
          },
          {
            // x: scaleXBottom(self.initial_timelense_timestamps[1]),
            x: width - 0,
            y: offsetBottomLinesY + scaleYBottom(yMaxBottom),
          },
          {
            // x: scaleXBottom(self.initial_timelense_timestamps[1]),
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
      .transition()
      .duration(self.transition_duration)
      .attr("d", timeLenseInterpolateFunction)
      .attr("fill", "none")
      .attr("stroke-width", 5)
      .attr("stroke", "#000000")
      .attr("opacity", 0.5)

    timeLenseInterpolateRight.exit().remove()

    let rects_instead_of_polygons = true

    if (rects_instead_of_polygons) {
      /**
       * TOP Epidemikurve
       */
      let topEpidemikurve = self.gEpidemikurveTop
        .selectAll(".keimkurve_rects")
        // .data([dataTop])
        .data(dataBottomOrg)

      topEpidemikurve
        .enter()
        .append("rect")
        .merge(topEpidemikurve)
        .on("click", (d) => {
          console.log(d)
        })
        .transition()
        .duration(self.transition_duration)
        .attr("class", (d) => "keimkurve_rects")
        // .attr("fill", this.get_color("infectedCarrier"))
        .attr("fill", (d) => {
          let col = "#bbbbbb"

          if (d.rki_data) {
            let val = d.rki_data.Ausbruchswahrscheinlichkeit
            val = val / 0.5 + 0.5
            col = d3.interpolateOranges(val)
          }

          return col
        })
        // .attr("opacity", 0.5)
        .attr("x", (d, i) => {
          // return (i * width) / dataBottomOrg.length - 1
          return scaleXTop(new Date(d.Datum).getTime())
        })
        .attr("y", (d) => {
          return scaleYTop(d[dataTypeTop.type])
        })
        .attr("width", (d) => {
          // return width / dataBottomOrg.length + 1
          return (
            scaleXTop(new Date(d.Datum).getTime() + 1000 * 60 * 60 * 24) -
            scaleXTop(new Date(d.Datum).getTime())
          )
        })
        .attr("height", (d) => {
          return scaleYTop(yMaxTop - d[dataTypeTop.type])
        })
      // .attr(
      //   "transform",
      //   (d) => "translate(" + 0 + "," + scaleYTop(yMaxTop) + ")"
      // )

      topEpidemikurve.exit().remove()

      /**
       * BOTTOM Epidemikurve
       */
      let bottomEpidemikurve = self.gEpidemikurveBottom
        .selectAll(".keimkurve_rects")
        .data(dataBottom)

      bottomEpidemikurve
        .enter()
        .append("rect")
        .merge(bottomEpidemikurve)
        .on("click", (d) => {
          console.log(d)
        })
        .transition()
        .duration(self.transition_duration)
        .attr("class", (d) => "keimkurve_rects")
        // .attr("opacity", 0.2)
        // .attr("fill", "#ff7f00")
        // .attr("fill", this.get_color("infectedCarrier"))
        .attr("fill", (d) => {
          let col = "#bbbbbb"

          if (d.rki_data) {
            let val = d.rki_data.Ausbruchswahrscheinlichkeit
            val = val / 0.5 + 0.5
            col = d3.interpolateOranges(val)
            console.log(val)
          }

          return col
        })
        .attr("x", (d, i) => {
          // return (i * width) / dataBottom.length - 1
          return scaleXBottom(new Date(d.Datum).getTime())
        })
        .attr("y", (d) => {
          return scaleYBottom(d[dataTypeBottom.type])
        })
        .attr("width", (d) => {
          // return width / dataBottom.length + 1
          return (
            scaleXBottom(new Date(d.Datum).getTime() + 1000 * 60 * 60 * 24) -
            scaleXBottom(new Date(d.Datum).getTime())
          )
        })
        .attr("height", (d) => {
          return scaleYBottom(yMaxBottom - d[dataTypeBottom.type])
        })
      // .attr(
      //   "transform",
      //   (d) => "translate(" + 0 + "," + scaleYBottom(yMaxBottom) + ")"
      // )

      bottomEpidemikurve.exit().remove()
    } else {
      /**
       * TOP Epidemikurve
       */
      let topEpidemikurve = self.gEpidemikurveTop
        .selectAll("polygon")
        // .data([dataTop])
        .data([dataBottomOrg])

      topEpidemikurve
        .enter()
        .append("polygon")
        .merge(topEpidemikurve)
        .on("click", (d) => {
          console.log(d)
        })
        .transition()
        .duration(self.transition_duration)
        .attr("class", (d) => "keimKurve")
        // .attr("opacity", 0.2)
        // .attr("fill", "#ff7f00")
        .attr("fill", this.get_color("infectedCarrier"))
        .attr("opacity", 0.5)
        // Adaption, dass oben eine andere Kurve angezeigt wird...
        .attr("points", (d) => {
          scaleYTop.domain([yMaxTop, 0])
          let bottomPoints = width + ",0, 0,0"
          let points = ""
          for (let i = 0; i < d.length; i++) {
            points =
              points +
              ((i * width) / d.length).toString() +
              ",-" +
              scaleYTop(d[i][dataTypeTop.type]).toString() +
              ", "
            points =
              points +
              (((i + 1) * width) / d.length).toString() +
              ",-" +
              scaleYTop(d[i][dataTypeTop.type]).toString() +
              ", "
          }
          return points + bottomPoints
        })
        // .attr("points", (d) => {
        //   scaleYTop.domain([yMaxTop, 0])
        //   let bottomPoints = width + ",0, 0,0"
        //   let points = ""
        //   /**
        //    * wird nur einmal aufgerufen; die For-Schleife ist noch von der alten Epidemikurve
        //    */
        //   for (let i = 0; i < d.length; i++) {
        //     /**
        //      * Der Versuch bei 7 und 28 EpiKurve gleich viele Punkte zu verwenden
        //      * aber leider kleiner Offset wegen dem Punkt auserhalb der Schleife
        //      */
        //     // points = points + (i * width / (dataBottomOrg.length / timeSpan)).toString() + ",-"
        //     //     + (scaleYTop(d[i][dataType.type]).toString()) + ", "
        //     // d[i].timeStamps.forEach(t => {
        //     //     points = points +
        //     //         ((i) * width / (dataBottomOrg.length / timeSpan) + width / (dataBottomOrg.length / timeSpan) * (d[i].timeStamps.length / timeSpan)).toString() + ",-"
        //     //         + (scaleYTop(d[i][dataType.type])).toString() + ", "
        //     // })

        //     points =
        //       points +
        //       ((i * width) / (dataBottomOrg.length / timeSpan)).toString() +
        //       ",-" +
        //       scaleYTop(d[i][dataType.type]).toString() +
        //       ", "

        //     if (i === d.length - 1) {
        //       /**
        //        * sodass der letzte Balken nicht übersteht
        //        * statt i + 1 mal die Balkenbreite, nur i mal PLUS den letzten kleineren Balken
        //        */
        //       points =
        //         points +
        //         (
        //           (i * width) / (dataBottomOrg.length / timeSpan) +
        //           (width / (dataBottomOrg.length / timeSpan)) *
        //             (d[i].timestamps.length / timeSpan)
        //         ).toString() +
        //         ",-" +
        //         scaleYTop(d[i][dataType.type]).toString() +
        //         ", "
        //     } else {
        //       points =
        //         points +
        //         (
        //           ((i + 1) * width) /
        //           (dataBottomOrg.length / timeSpan)
        //         ).toString() +
        //         ",-" +
        //         scaleYTop(d[i][dataType.type]).toString() +
        //         ", "
        //     }
        //   }
        //   return points + bottomPoints
        // })
        .attr(
          "transform",
          (d) => "translate(" + 0 + "," + scaleYTop(yMaxTop) + ")"
        )

      topEpidemikurve.exit().remove()

      /**
       * BOTTOM Epidemikurve
       */
      let bottomEpidemikurve = self.gEpidemikurveBottom
        .selectAll("polygon")
        .data([dataBottom])

      bottomEpidemikurve
        .enter()
        .append("polygon")
        .merge(bottomEpidemikurve)
        .on("click", (d) => {
          console.log(d)
        })
        .transition()
        .duration(self.transition_duration)
        .attr("class", (d) => "keimKurve")
        // .attr("opacity", 0.2)
        // .attr("fill", "#ff7f00")
        .attr("fill", this.get_color("infectedCarrier"))
        .attr("opacity", 0.5)
        .attr("points", (d) => {
          scaleYBottom.domain([yMaxBottom, 0])
          let bottomPoints = width + ",0, 0,0"
          let points = ""
          for (let i = 0; i < d.length; i++) {
            points =
              points +
              ((i * width) / d.length).toString() +
              ",-" +
              scaleYBottom(d[i][dataTypeBottom.type]).toString() +
              ", "
            points =
              points +
              (((i + 1) * width) / d.length).toString() +
              ",-" +
              scaleYBottom(d[i][dataTypeBottom.type]).toString() +
              ", "
          }
          return points + bottomPoints
        })
        .attr(
          "transform",
          (d) => "translate(" + 0 + "," + scaleYBottom(yMaxBottom) + ")"
        )

      bottomEpidemikurve.exit().remove()
    }

    /**
     * BOTTOM MEAN7 bzw MEAN28
     */
    // let avgName = "avg" + meanCurve
    // if (self.dataType === 1) {
    //   avgName += "_cs"
    // }

    // let bottomMean = self.gMeanBottom.selectAll("polygon").data([dataBottom])
    let bottomMean = self.gMeanTop.selectAll("polygon").data([dataBottomOrg])

    bottomMean
      .enter()
      .append("polygon")
      .merge(bottomMean)
      .transition()
      .duration(self.transition_duration)
      // .attr("class", (d) => "meanKurve7 meanKurve")
      // .attr("opacity", 0.2)
      // .attr("stroke", "#ff7f00")
      .attr("stroke", "black")
      .attr("stroke-width", 3)
      .attr("opacity", 1)
      .attr("fill", "none")
      .attr("points", (d) => {
        // scaleYBottom.domain([yMaxBottom, 0])
        scaleYTop.domain([yMaxTop, 0])
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
            // scaleYBottom(d[i][avgName]).toString() +
            scaleYTop(num).toString() +
            ", "
          points =
            points +
            (((i + 1) * width) / d.length).toString() +
            ",-" +
            // scaleYBottom(d[i][avgName]).toString() +
            scaleYTop(num).toString() +
            ", "
        }
        return points + bottomPoints
      })
      .attr(
        "transform",
        // (d) => "translate(" + 0 + "," + scaleYBottom(yMaxBottom) + ")"
        (d) => "translate(" + 0 + "," + scaleYTop(yMaxTop) + ")"
      )

    bottomMean.exit().remove()

    d3.select(self.svgRoot)
      .selectAll(".tick")
      .selectAll("line")
      .attr("opacity", 0.5)
      .attr("stroke-dasharray", "4, 6")
      .attr("stroke--width", 1)
    //.attr("display", (d,i) =>  {
    //  let r = ""
    //  if(i === 0) {
    //    r = "none"
    //  }
    //  return ""
    //})

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

    return (
      <div style={{ width: "100%", height: "100%", background: "white" }}>
        <svg
          className="svgRoot"
          ref={(element) => (this.svgRoot = element)}
          // TODO: SEHR WICHTIG --> MUSS IN JEDEM MODUL SEIN
          style={{ pointerEvents: "all" }}
        />
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
