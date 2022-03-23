export const Marks = ({data, xScale, yScale, xValue, yValue, colorValue, colorScale, zoomedStation, setZoomedStation, setTitle, format}) =>
    data.map((d, i) => (
        <rect 
            className="mark" 
            key={i}
            x={0}
            y={yScale(yValue(d))}
            width={xScale(xValue(d))}
            height={yScale.bandwidth()}
            fill={colorScale(colorValue(d))}
            style={{
                opacity: zoomedStation === null || d.data.name === zoomedStation.data.name ? 1 : 0.2
              }}
              onClick={() => {setZoomedStation(d); setTitle("Station"); }}
        >
            <title>{"prediction: " + format(colorValue(d).toFixed(2))}</title>

        </rect>))