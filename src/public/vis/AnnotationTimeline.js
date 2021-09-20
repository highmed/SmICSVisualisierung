import { Component } from "react"
import * as d3 from "d3"
import moment from "moment"
import { rgb } from "d3"
import { bottom } from "cli-color/move"
import { indexOf } from "cli-color/beep"
import textures from "textures" // Für Rechtecke mit Texturen

class AnnotationTimeline extends Component {
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
      global_top: 50,
      global_bottom: 50,
      global_left: 50,
      global_right: 50,
      meta_top: 50,
      meta_bottom: 150,
      meta_left: 50,
      meta_right: 250,
      anno_top: 300,
      anno_bottom: 50,
      anno_left: 50,
      anno_right: 300,
      lineVis_top: 50,
      lineVis_bottom: 600,
      lineVis_left: 400,
      lineVis_right: 50,
    }

    this.rastersize_x = 10 // genormte Rastergröße für Standardbildschirm
    this.screenNormWidth = 1900 // Anteil des Metafensters am Modulfenster
    this.metaSizeQuotient = 0.1 // Anteil des Metafensters am Modulfenster
    this.minRasterWidth = 5 // Mindestbreite eines Rasters
    this.maxRasterWidth = 10 // Maximalbreite eines Rasters

    this.rastersize_y = 20 // genormte Rastergröße für Standardbildschirm
    this.screenNormHeight = 1080 // Anteil des Metafensters am Modulfenster
    this.metaTextMarginQuotient = 0.015 // Marginquotient des Metafensters
    this.minRasterHeight = 5 // Mindestbreite eines Rasters
    this.maxRasterHeight = 10 // Mindestbreite eines Rasters

    this.fontFactor = 2 // Faktor zur korrekten Größe derfonts im Metaview

    this.rahmen = "r"

    /**
     * Global Desgin parameters
     */
    this.defaultStrokeWidth = 0.75
    this.defaultStrokeColor = "rgb(0,0,0)" // Black
    this.title = "AnnotationTimeline"
    this.exampleText =
      "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet."
    this.transition_duration = 50

    //***************************************** */

    /**
     * Meta Design Parameters
     */
    this.color_injection = "rgb(180,180,255)" // light blue

    //***************************************** */
    /**
     * Anno Design Parameters
     */
    //***************************************** */
    /**
     * LineVis Design Parameters
     */

    this.color_testNegativ = "rgb(145,207,96)" // green
    this.color_testLightPositiv = "rgb(255,255,191)" // lightyellow
    this.color_testPositiv = "rgb(252,141,89)" // red

    this.color_normalstation = "rgb(240,240,240)" // grey
    this.color_iCR = "rgb(120, 120, 120)" // grey
    this.color_intensivstation = "rgb(60,60,60)" // grey
    this.color_covidstation = "rgb(180,180,180)" // grey

    this.color_ereignisTriangle = "rgb(255,255,255)" // white

    this.color_annotationsTriangle = "rgb(255,100,100)" // red

    this.color_symptoms = "rgb(220,220,220)" // lightgrey
    this.symptomCircleSize = 0.5 // Größe der Ereigniskreise in Rastern

    this.lineVisOffset_y = 4 // Oberer Freiraum in Rastern
    this.ereignisTriangleOffset_y = 0.4 // Y- Versatz der Ereignisdreiecke in Rastern
    this.annoTriangleOffset_y = 6 // Y- Versatz der Ereignisdreiecke in Rastern
    this.ereignisCircleOffset_y = 1.2 // Y- Versatz der Ereignisdreiecke in Rastern
    this.lineVis_row_height = 11 // Höhe einer Patientenbalkenzeile in Rastern
    this.virusLastRect_height = 3 // Höhe Viruslastbalken in Rastern
    this.stationenRect_height = 1 // Höhe Stationenbalken in Rastern

    this.ereignisTriangleSize = 1 // Höhe des Dreiecks in Rastern
    this.ereignisCircleSize = 0.8 // Größe der Ereigniskreise in Rastern

    this.symptomTexture = textures
      .lines()
      .heavier()
      .stroke(this.color_symptoms)
      .strokeWidth(5)
      .background("transparent")

    //***************************************** */
  }

  // wird aufgerufen, sobald die Komponente zum Visualisierungsdashboard hinzugefügt wird
  componentDidMount() {
    let self = this

    console.log("AnnotationTimeline module did mount")

    this.socket.on("annotationTimeline", this.handle_data)

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
     * für jeden Visualisierungselemententyp gibt es ein g-Objekt (z.B. für alle Testereignisse)
     */

    let svg = (this.gGraphics = d3
      .select(self.svgRoot)
      .append("g")
      .attr("class", "annotationTimeline")
      .attr("id", "annotationTimelineID"))

    // Dies ist ein Initialbeispiel
    //  this.gExampleCircles = svg.append("g").attr("class", "gExampleCircles")
    svg.call(this.symptomTexture)

    /**
     * Legende
     */
    this.gLegend = svg.append("g").attr("class", "gLegend")

    /**
     * Container für Metadaten
     */
    // Rechteck für die Darstellung der Metainformationen
    this.gMetaInfoRects = svg.append("g").attr("class", "gMetaInfoRects")
    // Label für Patient ID setzen
    // Beginn/Ende Aufenthalt setzen
    // höchste Viruslast setzen
    // besuchte Stationen auflisten
    this.gMetaTextInfos = svg.append("g").attr("class", "gMetaTextInfos")
    // Impfstatus setzen
    this.gMetaInfoImpfstatus = svg
      .append("g")
      .attr("class", "gMetaInfoImpfstatus")
    // Übersicht Symptome setzen
    //this.gMetaInfoRects = svg.append("g").attr("class", "gMetaInfoRects")

    /**
     * Container für Patientenvisualisierung
     */
    // Viruslastrechteck
    this.gVirusLastRects = svg.append("g").attr("class", "gVirusLastRects")
    // Stationenrechteck
    this.gStationenRects = svg.append("g").attr("class", "gStationenRects")
    // Ereignisdreiecke
    this.gEreignisTriangles = svg
      .append("g")
      .attr("class", "gEreignisTriangles")
    // Ereigniskreise
    this.gEreignisCircles = svg.append("g").attr("class", "gEreignisCircles")
    // Annotationsdreiecke in der Patientenvisualisierung
    this.gAnnotationsTriangles = svg
      .append("g")
      .attr("class", "gAnnotationsTriangles")

    // gestreifte Symptomzeitenrechtecke
    this.gSymptomObjects = svg.append("g").attr("class", "gSymptomObjects")

    // Detail-Symptomobjekte
    this.gSymptomDetailRahmen = svg
      .append("g")
      .attr("class", "gSymptomDetailRahmen")

    this.gSymptomDetailObjects = svg
      .append("g")
      .attr("class", "gSymptomDetailObjects")

    /**
     *  Container für Annotationen
     */

    // Textboxannotation
    this.gTextBoxAnnos = svg.append("g").attr("class", "gTextBoxAnnos")

    /**
     * Hilfsobjekte
     */

    //Tooltip
    this.gToolTips = svg.append("g").attr("class", "gToolTips")

    this.draw_vis() // Initiales zeichnen?
  }

  requestVisData = () => {
    // TODO: example getVisData -> parsing the data and caching it
  }

  componentWillUnmount() {
    this.socket.off("annotationTimeline")

    clearInterval(this.checkSize)
  }

  // wird von der Funktion "didmount" aufgerufen
  handle_data = (data) => {
    console.log("annotationTimeline vis data received")
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

    console.log("drawing annotationTimeline")

    /**
     * Titel + Timestamp
     * Hier wird auf die Eigenschaften der HTML Seite gewirkt
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
    //   .attr("font-size", this.margin.global_top / 2)
    //   .attr("x", self.width / 2)
    //   .attr("y", (this.margin.global_top * 2) / 3)
    //   .attr("text-anchor", "middle")

    // title.exit().remove()

    // Falls es keine Daten gibt --> return
    if (this.data === undefined) {
      return
    }

    /**
     *
     * Ab hier werden die Eigenschaten der einzelnen Visualisierungselemente im Browserfenster bearbeitet
     * Die Elemente werden mit Hilfe von D3 visualisiert
     */

    /**
     *  Erster Block : Metadaten
     */

    /**
     * Darzustellen:
     * 1. Patient ID
     * 2. Beginn Aufenthalt, Ende Aufenthalt
     * 3. höchste Viruslast
     * 4. Anzahl Begegnungen
     * 5. Impfstatus
     * 6. Übersicht Symptome
     *
     */

    let setRasterPosition_x = (rasterIndex, setMin, setMax) => {
      if (rasterIndex === NaN) rasterIndex = 1
      if (setMin === undefined) setMin = true
      if (setMax === undefined) setMax = true
      let dynamicRasterSize =
        (self.width / this.screenNormWidth) * this.rastersize_x
      if (setMax)
        dynamicRasterSize = Math.min(this.maxRasterWidth, dynamicRasterSize)
      if (setMin)
        dynamicRasterSize = Math.max(this.minRasterWidth, dynamicRasterSize)
      return dynamicRasterSize * rasterIndex
    }

    let setRasterPosition_y = (rasterIndex, setMin, setMax, symptomOffset) => {
      if (rasterIndex === NaN) rasterposition = 1
      if (setMin === undefined) setMin = true
      if (setMax === undefined) setMax = true
      let dynamicRasterSize =
        (self.height / this.screenNormHeight) * this.rastersize_y
      if (setMax)
        dynamicRasterSize = Math.min(this.maxRasterHeight, dynamicRasterSize)
      if (setMin)
        dynamicRasterSize = Math.max(this.minRasterHeight, dynamicRasterSize)
      return dynamicRasterSize * rasterIndex
    }

    let symptomOffset_x = (rasterIndex, negation) => {
      let offset = negation > 0 ? 1 : -1
      return setRasterPosition_x(rasterIndex + offset)
    }

    /**
     *         "Respiratorisch",
        "Gastroenterologisch",
        "Systemisch",
        "Neurologisch",

     * 
     */
    let symptomOffset_y = (rasterIndex, symptom, symptomarten) => {
      let offset = 0
      switch (symptom) {
      case "Systemisch":
        offset = 2
        break
      case "Gastroenterologisch":
        offset = 1
        break
      case "Respiratorisch":
        offset = 0
        break
      default:
        offset = -1
        break
      }
      if (symptomarten !== undefined) {
        offset = symptomarten.indexOf(symptom)
      }
      if (offset === undefined || offset === NaN) offset = 0
      return setRasterPosition_y(rasterIndex + offset)
    }
    // Rahmen setzen
    let metaInfoRects = this.gMetaInfoRects
      .selectAll(".metaInfoRect")
      .data(this.rahmen)

    metaInfoRects
      .enter()
      .append("rect")
      .attr("class", "metaInfoRect")
      .merge(metaInfoRects)
      .transition()
      .duration(this.transition_duration)
      .attr("x", setRasterPosition_x(1))
      .attr("width", setRasterPosition_x(40))
      .attr("y", setRasterPosition_y(1))
      .attr("height", setRasterPosition_y(20)) //this.margin.meta_bottom), 150)
      .attr("fill", "white")
      .attr("stroke", this.defaultStrokeColor)
      .attr("stroke-width", this.defaultStrokeWidth)

    metaInfoRects.exit().remove()

    // Label für Patient ID setzen
    // Beginn/Ende Aufenthalt setzen
    // höchste Viruslast setzen
    // besuchte Stationen auflisten
    // let metaTextInfos = this.gMetaTextInfos.selectAll(".metaTextInfo").data(["peter","paul","and Mary"])

    // Y-Position der Metainformationen
    // let metaInfo_y_position = (d) => {
    //   let offset = self.height * (this.metaTextMarginQuotient)
    //   let ind = d.index === NaN ? 1 : d.index
    //   let infoOffset = ((ind + 1) * (this.lineVis_row_height / 30)) * self.height * this.metaTextMarginQuotient
    //   return offset + infoOffset
    // }

    let fontSizeCalculator = () => {
      let dynamicFontSize = Math.min(
        (self.height / this.screenNormHeight) * this.rastersize_y,
        (self.width / this.screenNormWidth) * this.rastersize_x
      )
      dynamicFontSize = Math.min(this.maxRasterHeight, dynamicFontSize)
      dynamicFontSize = Math.max(this.minRasterHeight, dynamicFontSize)

      return dynamicFontSize * this.fontFactor
    }

    let metaTextInfos = this.gMetaTextInfos
      .selectAll(".metaTextInfo")
      .data(data.data.metaTextInfos)

    metaTextInfos
      .enter()
      .append("text")
      .attr("class", "metaTextInfo")
      .merge(metaTextInfos)
      .transition()
      .duration(self.transition_duration)
      .text((d) => d.metaInfo) //(d) => d.patientID)
      .attr("font-size", fontSizeCalculator())
      .attr("x", setRasterPosition_x(8)) // x - auf rasterwert 1 setzen (im ersten Rasterfeld)
      .attr("y", (d, i) => setRasterPosition_y(i * 3 + 5))
      .attr("text-anchor", "left")

    metaTextInfos.exit().remove()

    /**
     * Impfstatus setzen
     */

    let injectionSize = this.rastersize_y / 18

    // Spritzenform
    let injectionShape = {
      draw: function (context, size) {
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

    let injectionPath = d3.symbol().type(injectionShape).size(injectionSize)

    let imfpStatus_ = this.gMetaInfoImpfstatus // Initialisieren
      .selectAll(".imfpStatus") // für alle Rechtecke durchführen
      .data(data.data.impfDaten) // Die Datengrundlage festlegen

    imfpStatus_
      .enter()
      .append("path")
      .attr("d", injectionPath)
      .attr("class", "imfpStatus")
      .merge(imfpStatus_)
      .transition()
      .duration(this.transition_duration)
      .attr("fill", this.color_injection)
      //.attr("stroke", this.defaultStrokeColor)
      //.attr("stroke-width", this.defaultStrokeWidth * .5)
      .attr(
        "transform",
        (d) =>
          "translate(" +
          setRasterPosition_x(2) +
          "," +
          setRasterPosition_y(6.5) +
          ")"
      )

    imfpStatus_.exit().remove()

    // Übersicht Symptome setzen

    /**
     *
     *  Zweiter Block: Visualisierung der Patientenaufenthalte
     */

    /**
     * Als erstes werden die Eigenschaften der Rechtecke mit der Viruslast gesetzt
     */
    let scale_lineVis_x = d3
      .scaleLinear()
      .domain([data.data.globalStartTS, data.data.globalEndTS])
      .range([setRasterPosition_x(42), setRasterPosition_x(180, false, false)])

    // Y-Position des VirusLastRects
    let lineVis_y_position = (d, offset) => {
      offset = offset === undefined ? this.lineVisOffset_y : offset
      let patientIDOffset = d.patientID * this.lineVis_row_height + 2 // TODO: Umschreiben auf Index des Patienten in der Liste
      return setRasterPosition_y(offset + patientIDOffset)
    }

    // Die Breite des Viruslaststreifens festlegen (ohne Mindestbreite)
    let rect_width = (begin, end) => {
      if (end === 0) end = data.data.globalEndTS
      let rect_w = scale_lineVis_x(end) - scale_lineVis_x(begin)
      return rect_w
    }

    let virusLastColorDefiner = (d) => {
      let farbe = ""
      //console.log("Viruslast: " + d.virusLast)
      if (d.virusLast < 15) return this.color_testPositiv
      if (d.virusLast < 30) return this.color_testLightPositiv
      return this.color_testNegativ
    }

    // ID des Elementes ermitteln
    let setCustomID = (d) => {
      //alert(d.testID)
      return d.testID
    }

    let virusLastRects = this.gVirusLastRects // Initialisieren
      .selectAll(".virusLastRect") // für alle Rechtecke durchführen
      .data(data.data.virusLastRects) // Die Datengrundlage festlegen
    //.attr("onmouseover", "mouseOver()")
    virusLastRects
      .enter()
      .append("rect")
      .attr("class", "virusLastRect")
      .merge(virusLastRects)
      .transition()
      .duration(this.transition_duration)
      .attr("x", (d) => scale_lineVis_x(d.testTimeStamp))
      .attr("width", (d) => rect_width(d.testTimeStamp, d.nextTestDate))
      .attr("y", (d) => lineVis_y_position(d))
      .attr("height", setRasterPosition_y(this.virusLastRect_height))
      .attr("fill", (d) => virusLastColorDefiner(d))
      .attr("stroke", this.defaultStrokeColor)
      .attr("stroke-width", this.defaultStrokeWidth)
      .attr("id", (d) => d.testID)

    virusLastRects.exit().remove()

    /**
     * Symptome
     */

    let symptomObjects = this.gSymptomObjects // Initialisieren
      .selectAll(".symptomObject") // für alle symptomObjekte durchführen
      .data(data.data.symptomDaten) // Die Datengrundlage festlegen

    symptomObjects
      .enter()
      .append("rect")
      .attr("class", "symptomObject")
      .merge(symptomObjects)
      .transition()
      .duration(this.transition_duration)
      .attr("x", (d) => scale_lineVis_x(d.symptomBeginn))
      .attr("width", (d) => rect_width(d.symptomBeginn, d.symptomEnde))
      .attr("y", (d) =>
        lineVis_y_position(
          d,
          this.lineVisOffset_y + this.virusLastRect_height / 2
        )
      )
      .attr("height", setRasterPosition_y(this.virusLastRect_height / 2))
      .attr("fill", this.symptomTexture.url())
    //.attr("stroke", this.defaultStrokeColor)
    //.attr("stroke-width", this.defaultStrokeWidth)
    symptomObjects.exit().remove()

    let symptomArten = [
      "Neurologisch",
      "Respiratorisch",
      "Gastroenterologisch",
      "Systemisch",
    ]

    // Rahmen setzen
    let symptomDetailRahmen = this.gSymptomDetailRahmen
      .selectAll(".symptomDetailRahmen_")
      .data(data.data.symptomDaten)

    symptomDetailRahmen
      .enter()
      .append("rect")
      .attr("class", "symptomDetailRahmen_")
      .merge(symptomDetailRahmen)
      .transition()
      .duration(this.transition_duration)
      .attr(
        "x",
        (d) => scale_lineVis_x(d.symptomBeginn) - setRasterPosition_x(1)
      )
      .attr("width", setRasterPosition_x(3))
      .attr(
        "y",
        (d) =>
          lineVis_y_position(
            d,
            this.lineVisOffset_y - this.virusLastRect_height
          ) - setRasterPosition_y(2)
      )
      .attr("height", setRasterPosition_y(4)) //this.margin.meta_bottom), 150)
      .attr("fill", "white")
      .attr("stroke", this.defaultStrokeColor)
      .attr("stroke-width", this.defaultStrokeWidth)

    symptomDetailRahmen.exit().remove()

    let symptomDetailObjects = this.gSymptomDetailObjects // Initialisieren
      .selectAll(".symptomDetailObject") // für alle symptomObjekte durchführen
      .data(data.data.symptomDaten) // Die Datengrundlage festlegen

    symptomDetailObjects
      .enter()
      .append("circle")
      .attr("class", "symptomDetailObject")
      .merge(symptomDetailObjects)
      .transition()
      .duration(this.transition_duration)
      .attr(
        "cx",
        (d) =>
          scale_lineVis_x(d.symptomBeginn) +
          symptomOffset_x(this.symptomCircleSize, d.negation)
      )
      .attr(
        "cy",
        (d) =>
          lineVis_y_position(
            d,
            this.lineVisOffset_y - this.virusLastRect_height
          ) + symptomOffset_y(this.symptomCircleSize, d.symptomArt)
      )
      .attr(
        "r",
        (setRasterPosition_x(this.symptomCircleSize) +
          setRasterPosition_y(this.symptomCircleSize)) /
          2
      )
      .attr("fill", "black")
    //.attr("stroke", this.defaultStrokeColor)
    //.attr("stroke-width", this.defaultStrokeWidth)
    symptomObjects.exit().remove()

    /**
     *
     * Stationen
     */

    // Den Grauton je nach Station zurückgeben
    let stationenColorDefiner = (d) => {
      switch (d.stationsArt) {
      case "CovidStation":
        return this.color_covidstation
      case "ICR":
        return this.color_iCR
      case "Intensivstation":
        return this.color_intensivstation
      case "NormalStation":
      default:
        return this.color_normalstation
      }
    }

    let stationenRects = this.gStationenRects // Initialisieren
      .selectAll(".stationenRect") // für alle Rechtecke durchführen
      .data(data.data.stationenRects) // Die Datengrundlage festlegen

    stationenRects
      .enter()
      .append("rect")
      .attr("class", "stationenRect")
      .merge(stationenRects)
      .transition()
      .duration(this.transition_duration)
      .attr("x", (d) => scale_lineVis_x(d.aufenthaltsBegin))
      .attr("width", (d) =>
        rect_width(d.aufenthaltsBegin, data.data.globalEndTS)
      )
      .attr("y", (d) =>
        lineVis_y_position(d, this.virusLastRect_height + this.lineVisOffset_y)
      )
      .attr("height", setRasterPosition_y(this.stationenRect_height))
      .attr("fill", (d) => stationenColorDefiner(d))
      .attr("stroke", this.defaultStrokeColor)
      .attr("stroke-width", this.defaultStrokeWidth)

    stationenRects.exit().remove()

    /**
     * Patientenereignisse (Dreiecke) = präzise
     */

    // let triangle = d3.symbol()
    //   .type(d3.symbolTriangle)
    //   .size(triangleSize)

    let customSymbolTriangle = {
      draw: function (context, size) {
        context.moveTo(-setRasterPosition_x(size) / 2, 0)
        context.lineTo(0, setRasterPosition_y(size) * 1.5)
        context.lineTo(setRasterPosition_x(size) / 2, 0)
        context.closePath()
      },
    }

    let customTriangle = d3
      .symbol()
      .type(customSymbolTriangle)
      .size(this.ereignisTriangleSize)
    // d3.select("#svgID")
    //     .append("path")
    //     .attr("d", customTriangle)
    //     .attr("transform", "translate(x,y)");

    let ereignisTriangles = this.gEreignisTriangles // Initialisieren
      .selectAll(".ereignisTriangle") // für alle Rechtecke durchführen
      .data(data.data.ereignisTriangles) // Die Datengrundlage festlegen

    ereignisTriangles
      .enter()
      .append("path")
      .merge(ereignisTriangles)
      .attr("d", customTriangle)
      .attr("class", "ereignisTriangle")
      .transition()
      .duration(this.transition_duration)
      .attr("fill", this.color_ereignisTriangle)
      .attr("stroke", this.defaultStrokeColor)
      .attr("stroke-width", this.defaultStrokeWidth)
      .attr(
        "transform",
        (d) =>
          "translate(" +
          scale_lineVis_x(d.ereignisTimeStamp) +
          "," +
          lineVis_y_position(
            d,
            this.lineVisOffset_y + this.ereignisTriangleOffset_y
          ) +
          ")"
      )

    ereignisTriangles.exit().remove()

    /**
     * Patientenereignisse (Kreise) = unscharf
     */

    let ereignisCircles = this.gEreignisCircles // Initialisieren
      .selectAll(".ereignisCircle") // für alle Rechtecke durchführen
      .data(data.data.ereignisCircles) // Die Datengrundlage festlegen

    ereignisCircles
      .enter()
      .append("circle")
      .attr("class", "ereignisCircle")
      .merge(ereignisCircles)
      .transition()
      .duration(this.transition_duration)
      .attr("cx", (d) => scale_lineVis_x(d.ereignisTimeStamp))
      .attr("cy", (d) =>
        lineVis_y_position(
          d,
          this.lineVisOffset_y + this.ereignisCircleOffset_y
        )
      )
      .attr(
        "r",
        (setRasterPosition_x(this.ereignisCircleSize) +
          setRasterPosition_y(this.ereignisCircleSize)) /
          2
      )
      .attr("fill", this.color_ereignisTriangle)
      .attr("stroke", this.defaultStrokeColor)
      .attr("stroke-width", this.defaultStrokeWidth)
    ereignisCircles.exit().remove()

    /**
     * Annotationsdreiecke
     */

    let customAnnoSymbolTriangle = {
      draw: function (context, size) {
        context.moveTo(0, 0)
        context.lineTo(
          -setRasterPosition_x(size) / 2,
          setRasterPosition_y(size) * 1.5
        )
        context.lineTo(
          setRasterPosition_x(size) / 2,
          setRasterPosition_y(size) * 1.5
        )
        context.closePath()
      },
    }

    let customAnnoTriangle = d3
      .symbol()
      .type(customAnnoSymbolTriangle)
      .size(this.ereignisTriangleSize)

    let annotationsTriangles = this.gAnnotationsTriangles // Initialisieren
      .selectAll(".annotationsTriangle") // für alle Dreicke durchführen
      .data(data.data.annotationsTriangles) // Die Datengrundlage festlegen

    annotationsTriangles
      .enter()
      .append("path")
      .merge(annotationsTriangles)
      .attr("d", customAnnoTriangle)
      .attr("class", "annotationsTriangle")
      .transition()
      .duration(this.transition_duration)
      .attr("fill", this.color_annotationsTriangle)
      .attr("stroke", this.defaultStrokeColor)
      .attr("stroke-width", this.defaultStrokeWidth)
      .attr(
        "transform",
        (d) =>
          "translate(" +
          scale_lineVis_x(d.timeLocation) +
          "," +
          lineVis_y_position(
            d,
            this.lineVisOffset_y + this.annoTriangleOffset_y
          ) +
          ")"
      )

    annotationsTriangles.exit().remove()

    /**
     *  Dritter Bock Annotationen
     *
     */

    /**
     *  Eventhandling
     *
     *
     */

    /**
     *  Open Textarea on rightclick
     */
    function onCircleRightClick(d) {
      //let textBoxAnnos = self.gTextBoxAnnos.selectAll(".textBoxAnnos").data([self.exampleText])

      d3.event.preventDefault()
      alert("rightclick")
      // d3.select("#annotateBox")
      //   .style("position", "absolute")
      //   .style("left", (d3.event.pageX - 50) + "px")
      //   .style("top", (d3.event.pageY + 20) + "px")
      //   .style("display", "inline-block");
      // d3.select("textarea").node().value = d.textArea || "";
      // d3.select("button").on("click", function () {
      //   d.textArea = d3.select("textarea").node().value;
      // })
    }

    /**
     * Show Details on Mouseover
     */
    function rectMouseOver() {
      d3.select(this).attr("stroke", "red")
      d3.select(this).attr("stroke-width", self.defaultStrokeWidth * 2)
      //alert(this)
    }

    function rectMouseOut() {
      d3.select(this).attr("stroke", self.defaultStrokeColor)
      d3.select(this).attr("stroke-width", self.defaultStrokeWidth)
    }

    function circleMouseOver(d, i) {
      // Add interactivity
      //d3.select(this).attr("r", self.virusLastRect_height / 2);
      d3.select(this).attr("fill", "orange")
    }
    function circleMouseOut(d, i) {
      d3.select(this).attr("fill", self.color_ereignisTriangle)
      //d3.select(this).attr("r", self.virusLastRect_height / 4)
    }

    function pathMouseOver(d, i) {
      // Add interactivity

      d3.select(this).attr("fill", "orange")
      let textBoxAnnos = self.gTextBoxAnnos.selectAll(".textBoxAnno").data(d)

      textBoxAnnos
        .enter()
        .append("text")
        .attr("class", "textBoxAnno")
        .merge(textBoxAnnos)
        .transition()
        .duration(self.transition_duration)
        .text((d) => d)
        .attr("font-size", self.margin.global_top / 4)
        .attr("x", self.margin.anno_left)
        .attr("y", self.margin.anno_top)
        .attr("text-anchor", "left")
        .attr("width", 200)
      textBoxAnnos.exit().remove()
    }

    function pathMouseOut(d, i) {
      // Use D3 to select element, change color back to normal
      if (d3.select(this).attr("class") === "ereignisTriangle") {
        d3.select(this).attr("fill", self.color_ereignisTriangle)
      } else {
        d3.select(this).attr("fill", self.color_annotationsTriangle)
      }

      // Select text by id and then remove
      //d3.select("#t" + d.x + "-" + d.y + "-" + i).remove();  // Remove text location
    }

    // Tooltip für Viruslastrechtecke
    function virusLastMouseOver(d) {
      d3.select(this).datum(d)
      d3.select(this).attr("stroke", "red")
      d3.select(this).attr("stroke-width", self.defaultStrokeWidth * 2)
      d3.select("#virusLastToolTip").style("visibility", "visible")
    }

    function virusLastMouseOut() {
      d3.select(this).attr("stroke", self.defaultStrokeColor)
      d3.select(this).attr("stroke-width", self.defaultStrokeWidth)
    }

    /**
     *  Tooltip:
     * 1. Event für das Element definieren
     *  1.1. Alle Elemente selektieren (via class), für welche das gleiche Event mit der gleichen Funktion aufgerufen werden soll
     *  1.2. für diese Elemente die Events definieren und die Funktion aufrufen, die beim Event ausgeführt werden soll.
     * 2. Die Funktion, die beim Event ausgeführt werden soll, schreiben und beim Event aufrufen
     *  2.1. wie greife ich auf die Daten des Elementes zu?
     */

    var tooltip = d3
      .select(this.svgRoot)
      .append("div")
      //.attr("class","virusLastToolTip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      //.attr("top","400px")
      //.attr("left","400px")
      .text("I'm a circle!")

    // d3.select(".metaInfoRect")
    // .on("mouseover", function(){return tooltip.style("visibility", "visible");})
    // .on("mousemove", function(){return tooltip.style("top", (event.pageY)+"px").style("left",(event.pageX)+"px");})
    // .on("mouseout", function(){return tooltip.style("visibility", "hidden");});

    d3.select(this.svgRoot)
      .selectAll(".virusLastRect")
      .on("mouseover", function () {
        return tooltip.style("visibility", "visible")
      })
      //      .on("mousemove", function () { return metaTextInfos.style("x", (event.pageX) + "px").style("y", (event.pageY) + "px"); })
      .on("mouseout", function () {
        return tooltip.style("visibility", "hidden")
      })

    // d3.select(this.svgRoot)
    //   .selectAll(".metaInfoRect")
    //   .on("mouseover", rectMouseOver)
    //   .on("mouseout", rectMouseOut)

    // d3.select(this.svgRoot)
    //   .selectAll(".virusLastRect")
    //   .on("mouseover", virusLastMouseOver)
    //   .on("mouseout", rectMouseOut)

    d3.select(this.svgRoot)
      .selectAll(".ereignisCircle")
      .on("mouseover", circleMouseOver)
      .on("mouseout", circleMouseOut)
    d3.select(this.svgRoot)
      .selectAll("path")
      .on("mouseover", pathMouseOver)
      .on("mouseout", pathMouseOut)
  }

  // class myTestAnno extends reat.Component {

  // }
  render() {
    return (
      <div style={{ width: "100%", height: "100%", background: "white" }}>
        <div
          style={{ width: "100%", height: "calc(100% - 280px)" }}
          className="svgContainer"
        >
          <svg
            className="svgRoot"
            ref={(element) => (this.svgRoot = element)}
          />
        </div>
        <div
          style={{
            height: "30px",
            width: "100%",
            background: "rgb(230,230,230)",
          }}
        >
          <span style={{ background: "rgb(230,230,230)" }}>
            Kommentarbereich
          </span>
        </div>
        <div
          style={{
            height: "250px",
            width: "250px",
            background: "rgb(240,240,240)",
          }}
        >
          <span style={{ background: "rgb(240,240,240)" }}>Kommentartext</span>
        </div>
      </div>
    )
  }
}

export default AnnotationTimeline
