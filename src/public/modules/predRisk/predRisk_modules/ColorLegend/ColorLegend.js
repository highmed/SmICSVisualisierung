import { scaleLinear, scaleBand } from "d3-scale"
import { range } from "d3-array"
import { AxisRight } from "./AxisRight"
import { format } from "d3-format"
import { AxisBottom } from "../BarChart/AxisBottom"

const tickFormat = format(".0%")
const margin = { top: 0, right: 20, bottom: 30, left: 20 }

export const ColorLegend = ({ width, height, colorScale, paddingTop }) => {
  // Top and bot margin so we can see 0.0 and 1.0
  // Left margin so all numbers are not occluded

  const innerHeight = height - margin.top - margin.bottom
  const innerWidth = width - margin.right - margin.left

  const xScale = scaleLinear()
    .domain(colorScale.domain())
    .range([0, innerWidth])

  return (
    <svg width={width} height={height}>
      <g transform={`translate(${margin.left},${margin.top})`}>
        <linearGradient
          id={"linear-gradient"}
          gradientUnits={"userSpaceOnUse"}
          x1={0}
          x2={"100%"}
          y1={0}
          y2={0}
        >
          {colorScale.ticks().map((t, i, n) => (
            <stop
              offset={`${(100 * i) / n.length}%`}
              stopColor={colorScale(t)}
            />
          ))}
        </linearGradient>
        <rect
          key={"colorLegend"}
          x={0}
          y={0}
          width={innerWidth}
          height={innerHeight}
          fill={"url(#linear-gradient)"}
        />

        <AxisBottom
          xScale={xScale}
          innerHeight={innerHeight}
          innerWidth={innerWidth}
          tickFormat={tickFormat}
        />
      </g>
    </svg>
  )
}
