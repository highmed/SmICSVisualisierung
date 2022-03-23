import React, { useState, useMemo, useEffect } from "react"
import { scaleSequential } from "d3-scale"
import { hierarchy } from "d3-hierarchy"
import { interpolateYlOrRd } from "d3-scale-chromatic"

import { BarChartXAI } from "./predRisk_modules/BarChart/BarChartXAI"
import { Menu } from "./predRisk_modules/Menu/Menu"
import { useDataStream } from "./predRisk_modules/StreamGraph/useDataStream"
import { StreamGraph } from "./predRisk_modules/StreamGraph/StreamGraph"
import { Treemap } from "./predRisk_modules/Treemap/Treemap"
import { BarChart } from "./predRisk_modules/BarChart/BarChart"
// TODO: fuer Abgabe ende Maerz raus, weil das die anderne Module "zerstoert"
// import "./predRiskMain.css"
import { MissingData } from "./MissingData"
import { useData } from "./useData"
import { useNetworkData } from "./useNetworkData"
// import streamDataSize from "../../streamDataSize.csv"
// import streamDataPred from "../../streamDataPred.csv"
// import datajson from "../../data.json"
// import linksjson from "../../links.json"

// Sum function
const uniqueReducer = (previousValue, currentValue) => [
  ...new Set(previousValue.concat(...currentValue)),
]
const avgReducer = (avg, value, _, { length }) => avg + value / length
const sumReducer = (pv, cv) => pv + cv

function App() {
  const dataSize = useDataStream("streamDataSize.csv")
  const dataPred = useDataStream("streamDataPred.csv")
  const data = useData()
  const networkData = useNetworkData()

  let window_width = window.innerWidth * 0.9
  let window_height = window.innerHeight * 0.9

  window.onresize = function (event) {
    window_width = window.innerWidth * 0.9
    window_height = window.innerHeight * 0.9

    console.log("-----------------------")
    console.log("Window-Breite: " + window_width)
    console.log("Window-Höhe: " + window_height)
    console.log("-----------------------")
  }

  /*
  const dataSize = streamDataSize
  const dataPred = streamDataPred
  const data = datajson
  const networkData = linksjson
  
  console.log("Geparste links.json: ")
  console.log("Importierte links.json :", linksjson)
  */

  const dataXAI = [
    { name: "BuildingID", value: 0.12296726 },
    { name: "StationID", value: 0.03394815 },
    { name: "RoomID", value: 0.02125802 },
  ]

  const [brushExtent, setBrushExtent] = useState()
  const [checked, setChecked] = useState(true)
  const [minPrediction, setMinPrediction] = useState(0.0)
  const [filteredData, setFilteredData] = useState()
  const [zommedStation, setZommedStation] = useState(null)
  const [title, setTitle] = useState("Hospital")
  const [sortOrder, setSortOrder] = useState("size")

  const [windowX, setWindowX] = useState(window.innerWidth)
  const [windowY, setWindowY] = useState(window.innerHeight)

  let buildingNames = []

  useEffect(() => {
    if (data) {
      const newFilteredData = JSON.parse(JSON.stringify(data))
      for (const building of newFilteredData.children) {
        for (const station of building.children) {
          for (const room of station.children) {
            // Apply time filter
            const filteredDates = room.dates.filter((d) => {
              if (brushExtent) {
                const date = new Date(d.date)
                const timeConstraint =
                  date > brushExtent[0] && date < brushExtent[1]
                return timeConstraint
              } else {
                return true
              }
            })
            // Update Patient Count and average prediction
            const newPrediction = filteredDates
              .map((d) => d.prediction)
              .reduce(avgReducer, 0)

            const allPatients = filteredDates
              .map((d) => d.patients)
              .reduce(uniqueReducer, [])
            room.prediction = newPrediction
            room.value = allPatients.length
          }
        }
      }
      // Filter Buildings by min prediction
      const filteredBuildings = newFilteredData.children.filter((d) => {
        const isAboveMinPrediction = d.predictionBuilding > minPrediction
        return isAboveMinPrediction
      })
      newFilteredData.children = filteredBuildings
      setFilteredData(newFilteredData)
    }
  }, [data, brushExtent, minPrediction])
  console.log(brushExtent)
  if (!dataSize || !data || !networkData || !filteredData) {
    return <pre> Loading...</pre>
  }

  for (const filBuilding of filteredData.children) {
    buildingNames.push(filBuilding.name)
  }

  // Filter network data
  for (const link of networkData) {
    const filteredDates = link.dates.filter((d) => {
      if (brushExtent) {
        const date = new Date(d.date)
        const timeConstraint = date > brushExtent[0] && date < brushExtent[1]
        return timeConstraint
      } else {
        return true
      }
    })
    // Aggregate weights
    const weight = filteredDates.map((d) => d.weight).reduce(sumReducer, 0)
    link.weight = weight
  }

  // Construct new hierarchy from filteredData
  // Here the size of each leave is given in the 'value' field in input data
  // hierarchy constructs the hiearchiy and sum calculates the values along each layer
  const root = hierarchy(filteredData)
  root.eachAfter((d) => {
    if (!d.hasOwnProperty("children")) {
      d.value = d.data.value
      d.data.prediction = d.data.prediction
    } else {
      let avgPrediction = 0
      let count = 0
      d.value = 0
      for (var i in d.children) {
        const value = d.children[i].value
        d.value += value
        // Predictions needs to be weighted by the number of people
        // We also need to skip enteties which have zero patients, because of filtering
        if (value > 0) {
          avgPrediction += d.children[i].data.prediction * value
          count += value
        }
      }
      d.data.prediction = avgPrediction / count
    }
  })

  if (sortOrder === "prediction") {
    root.sort(
      (a, b) => b.height - a.height || b.data.prediction - a.data.prediction
    )
  } else {
    root.sort((a, b) => b.height - a.height || b.value - a.value)
  }

  // Need to define colorscale here, since multiple components need it
  const colorScale = scaleSequential(interpolateYlOrRd).domain([0, 1])

  window.onresize = function (event) {
    setWindowX(window.innerWidth * 0.9)
    setWindowY(window.innerHeight * 0.9)
  }

  //window.onresize = {() => setWindowX(window.innerWidth * 0.9)}

  return (
    <div className="App">
      <header className="App-header">
        <Menu
          width={0.125 * window_width}
          height={0.2 * window_height}
          checked={checked}
          setChecked={setChecked}
          minPrediction={minPrediction}
          setMinPrediction={setMinPrediction}
          setZommedStation={setZommedStation}
          setTitle={setTitle}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          colorScale={colorScale}
        />

        <StreamGraph
          dataSize={dataSize}
          dataPred={dataPred}
          colorScale={colorScale}
          width={0.5 * window_width}
          height={0.375 * window_height}
          setBrushExtent={setBrushExtent}
          zoomedStation={zommedStation}
          setZommedStation={setZommedStation}
          buildingNames={buildingNames}
        />

        <div className="charts">
          <text className="chartTitle">Station Overview</text>
          <BarChart
            dataBar={root}
            colorScale={colorScale}
            width={0.25 * window_width}
            height={0.625 * window_height}
            zoomedStation={zommedStation}
            setZoomedStation={setZommedStation}
            setTitle={setTitle}
            sortOrder={sortOrder}
          />
          <text className="chartTitle" transform={`translate(${100},${100})`}>
            Feature Importance
          </text>
          <BarChartXAI
            data={dataXAI}
            width={0.25 * window_width}
            height={0.25 * window_height}
          />
        </div>

        {root.value > 0 ? (
          <Treemap
            root={root}
            links={networkData}
            colorScale={colorScale}
            showLinks={checked}
            zommedStation={zommedStation}
            setZommedStation={setZommedStation}
            title={title}
            setTitle={setTitle}
            width={0.75 * window_width}
            height={0.625 * window_height}
          />
        ) : (
          <MissingData
            width={0.75 * window_width}
            height={0.625 * window_height}
          />
        )}
      </header>
    </div>
  )
}

export default App
