import { scaleBand, scaleLinear } from "d3-scale"
import { max } from "d3-array"
import { format } from "d3-format"
// TODO: fuer Abgabe ende Maerz raus, weil das die anderne Module "zerstoert"
// import "./predRiskMain.css"
import { AxisLeft } from "./AxisLeft"
import { AxisBottom } from "./AxisBottom"
import { MarksXAI } from "./MarksXAI"

const margin = {
  top: 20,
  right: 30,
  bottom: 65,
  left: 100,
}
const xAxisLabelOffset = 50
const xAxisTickFormat = format("")

export const BarChartXAI = ({ data, width, height }) => {
  const innerHeight = height - margin.top - margin.bottom
  const innerWidth = width - margin.left - margin.right

  //data = {names: ["BuildingID", "StationID", "RoomID"], values: [, 0.03394815, 0.02125802]}

  const xValue = (d) => d.value
  const yValue = (d) => d.name

  const xScale = scaleLinear()
    .domain([0, max(data.map((d) => d.value))])
    .range([0, innerWidth])

  const yScale = scaleBand()
    .domain(data.map(yValue))
    .range([0, innerHeight])
    .paddingInner(0.1)

  return (
    <svg width={width} height={height} className="barChartXAI">
      <g transform={`translate(${margin.left},${margin.top})`}>
        <AxisBottom
          xScale={xScale}
          innerHeight={innerHeight}
          tickFormat={xAxisTickFormat}
        />
        <AxisLeft
          yScale={yScale}
          innerHeight={innerHeight}
          axisText={"Features"}
        />
        <text
          className="axis-label"
          x={innerWidth / 2}
          y={innerHeight + xAxisLabelOffset}
          textAnchor="middle"
          fontSize="large"
        >
          average impact on infection prediction
        </text>
        <MarksXAI
          data={data}
          xScale={xScale}
          yScale={yScale}
          xValue={xValue}
          yValue={yValue}
          tooltipFormat={xAxisTickFormat}
        />
      </g>
    </svg>
  )
}
