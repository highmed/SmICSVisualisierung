import { timeFormat } from "d3-time-format";

const tickFormat = timeFormat("%Y-%m-%d");

// Returns tick value (vertical lines)
export const AxisBottom = ({ xScale, innerHeight, innerWidth, tickOffset = 3 }) => (
  <>
    {xScale.ticks().map((tickValue) => (
      <g
        className="tick"
        key={tickValue}
        transform={`translate(${xScale(tickValue)},0)`}
      >
        <line y2={innerHeight} />
        <text
          y={innerHeight + tickOffset}
          style={{ textAnchor: "middle" }}
          dy=".71em"
        >
          {tickFormat(tickValue)}
        </text>
      </g>
    ))}
    <text className="axis-label" transform={`translate(${innerWidth/2},${innerHeight+30})`}>
      Date
    </text>
  </>
);
