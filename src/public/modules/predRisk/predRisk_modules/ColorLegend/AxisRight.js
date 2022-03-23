export const AxisRight = ({
  yScale,
  innerHeight,
  innerWidth,
  paddingTop,
  tickFormat,
  tickCount = 5,
}) =>
  yScale.ticks(tickCount).map((tickValue) => (
    <g
      className="tick"
      key={tickValue}
      transform={`translate(0,${innerHeight - yScale(tickValue)})`}
    >
      <line x1={0} x2={innerWidth} y1={paddingTop - 10} y2={paddingTop - 10} />
      <text
        x={-20}
        y={paddingTop - 15}
        style={{ textAnchor: "middle" }}
        dy=".71em"
      >
        {tickFormat(tickValue)}
      </text>
    </g>
  ))
