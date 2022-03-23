import { scaleBand, scaleLinear } from "d3-scale"
import { max } from "d3-array"
import { format } from "d3-format"
// TODO: fuer Abgabe ende Maerz raus, weil das die anderne Module "zerstoert"
// import "./predRiskMain.css"
import { AxisLeft } from "./AxisLeft"
import { AxisBottom } from "./AxisBottom"
import { Marks } from "./Marks"
import { MissingData } from "../../MissingData"

const margin = {
  top: 20,
  right: 30,
  bottom: 65,
  left: 100,
}
const xAxisLabelOffset = 40
const xAxisTickFormat = format("")
const hoverFormat = format(".0%")

export const BarChart = ({
  dataBar,
  colorScale,
  width,
  height,
  zoomedStation,
  setZoomedStation,
  setTitle,
  sortOrder,
}) => {
  const innerHeight = height - margin.top - margin.bottom
  const innerWidth = width - margin.left - margin.right

  let data = []
  // Check if we have enough data. If databar has a children attribute, than it also as a valid value
  if (dataBar.value !== undefined) {
    for (const building of dataBar.children) {
      if (building.children !== undefined) {
        for (const station of building.children) {
          data.push(station)
          //data.push({ name: station.data.name, prediction: station.data.pred, size: station.value });
        }
      }
    }
  } else {
    return <MissingData width={width} height={height} />
  }

  // Sort data descending
  if (sortOrder === "prediction") {
    data = data.sort((a, b) => b.data.prediction - a.data.prediction)
  } else {
    data = data.sort((a, b) => b.value - a.value)
  }

  // Filter Top 10
  data = data.slice(0, 10)

  const predValue = (d) => d.data.prediction
  const sizeValue = (d) => d.value
  const xScale = scaleLinear()
    .domain([0, max(data, sizeValue)])
    .range([0, innerWidth])

  const yValue = (d) => d.data.name
  const yScale = scaleBand()
    .domain(data.map(yValue))
    .range([0, innerHeight])
    .paddingInner(0.1)

  return (
    <svg width={width} height={height} className="barChart">
      <g transform={`translate(${margin.left},${margin.top})`}>
        <AxisBottom
          xScale={xScale}
          innerHeight={innerHeight}
          tickFormat={xAxisTickFormat}
        />
        <AxisLeft
          yScale={yScale}
          innerHeight={innerHeight}
          axisText={"StationIDs"}
        />
        <text
          className="axis-label"
          x={innerWidth / 2}
          y={innerHeight + xAxisLabelOffset}
          textAnchor="middle"
          fontSize="x-large"
        >
          Unique Patients
        </text>
        <Marks
          data={data}
          xScale={xScale}
          yScale={yScale}
          xValue={sizeValue}
          yValue={yValue}
          colorValue={predValue}
          colorScale={colorScale}
          zoomedStation={zoomedStation}
          setZoomedStation={setZoomedStation}
          setTitle={setTitle}
          format={hoverFormat}
        />
      </g>
    </svg>
  )
}
