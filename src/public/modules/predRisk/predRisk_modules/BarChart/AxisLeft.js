export const AxisLeft = ({ yScale, innerHeight, axisText }) => (
  <>
    {yScale.domain().map((tickValue, i) => (
      // Group element for css class
      <g className="tick">
        <text
          key={tickValue + i}
          x={-3}
          dy=".32em"
          style={{ textAnchor: "end" }}
          y={yScale(tickValue) + yScale.bandwidth() / 2}
        >
          {tickValue}
        </text>
      </g>
    ))}
    <text
      className="axis-label"
      textAnchor="middle"
      transform={`translate(${-60},${innerHeight / 2}) rotate(-90)`}
    >
      {axisText}
    </text>
  </>
);
