export const AxisLeft = ({ yScale, innerHeight, tickCount = 5 }) => (
  <>
    {yScale.ticks(tickCount).map((tickValue) => (
      <g className="tick" key={tickValue}>
        <line x1={0} x2={0} y1={0} y2={innerHeight} />
        <text
          x={-20}
          y={yScale(tickValue)}
          style={{ textAnchor: "middle" }}
          dy=".71em"
        >
          {Math.abs(tickValue)}
        </text>
      </g>
    ))}
    <text
      className="axis-label"
      textAnchor="middle"
      transform={`translate(${-40},${innerHeight / 2}) rotate(-90)`}
    >
      {"Patient count"}
    </text>
  </>
);
