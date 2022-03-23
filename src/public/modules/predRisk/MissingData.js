export const MissingData = ({ width, height }) => (
  <svg width={width} height={height} className="treemap">
    <rect width="100%" height="100%" fill="white" />
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">
      No data available
    </text>
  </svg>
)
