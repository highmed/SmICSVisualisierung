import { color } from "d3-color"
import { tickFormat } from "d3-scale"

export const AxisBottom = ({
  xScale,
  innerHeight,
  tickFormat,
  tickCount = 5,
}) =>
  xScale.ticks(tickCount).map((tickValue) => (
    <g
      className="tick"
      key={tickValue}
      transform={`translate(${xScale(tickValue)},0)`}
    >
      <line y2={innerHeight} />
      <text
        y={innerHeight + 3}
        //fontSize="xx-large"
        style={{ textAnchor: "middle" }}
        dy=".71em"
      >
        {tickFormat(tickValue)}
      </text>
    </g>
  ))
