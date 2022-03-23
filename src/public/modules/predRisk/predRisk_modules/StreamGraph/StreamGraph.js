import React, { useState, useRef, useEffect, useMemo } from "react"
import {
  stack,
  area,
  curveBasis,
  stackOrderInsideOut,
  stackOffsetSilhouette,
  stackOffsetDiverging,
  stackOffsetExpand,
  stackOffsetWiggle,
  stackOffsetNone,
} from "d3-shape"
import { scaleLinear, scaleTime } from "d3-scale"
import { extent } from "d3-array"
import { brushX } from "d3-brush"
import { select } from "d3-selection"
import { AxisBottom } from "./AxisBottom"
import { AxisLeft } from "./AxisLeft"
import { event } from "d3"

const margin = {
  top: 30,
  right: 7,
  bottom: 30,
  left: 60,
}

export const StreamGraph = ({
  dataSize,
  dataPred,
  colorScale,
  width,
  height,
  setBrushExtent,
  zoomedStation,
  setZommedStation,
  buildingNames,
}) => {
  const innerHeight = height - margin.top - margin.bottom
  const innerWidth = width - margin.left - margin.right

  let filteredData = []
  let sizes = []
  for (const d of dataSize) {
    let newRow = new Object()
    let daySize = 0
    for (const [key, value] of Object.entries(d)) {
      if (buildingNames.includes(key)) {
        // Keep it
        newRow[key] = value
        daySize = daySize + value
      } else if (key === "date") {
        newRow[key] = value
      }
    }
    filteredData.push(newRow)
    sizes.push(daySize)
  }
  const keys = buildingNames

  const max = Math.max.apply(null, sizes)
  const max_half = (max + 20) / 2

  // Accessor function to get the year and then build scale from it
  const xValue = (d) => d.date
  const xScale = useMemo(
    () => scaleTime().domain(extent(filteredData, xValue)).range([0, width]),
    [filteredData, width]
  )

  const yScale = useMemo(
    () => scaleLinear().domain([-max_half, max_half]).range([innerHeight, 0]),
    [innerHeight, max_half]
  )

  // could do some filtering here

  const stackLayout = useMemo(
    () =>
      stack()
        .offset(stackOffsetSilhouette)
        .order(stackOrderInsideOut)
        .keys(keys),
    [keys]
  )

  // Using the stackLayout we get two additional components for y0 and y1.
  // For x we want to get the yeaer from the original data, so we have to access d.data
  const stackArea = useMemo(
    () =>
      area()
        .x((d) => xScale(d.data.date))
        .y0((d) => yScale(d[0]))
        .y1((d) => yScale(d[1]))
        .curve(curveBasis),
    [xScale, yScale]
  )

  const [opacity, setOpacity] = useState(0)
  const [text, setText] = useState("initialState")
  const Tooltip = ({ opacity, text }) => {
    return (
      <text
        x={50}
        y={50}
        style={{ opacity: opacity, fontSize: 17, fill: "white" }}
      >
        {text}
      </text>
    )
  }
  //Interactivity function #1: Hovering
  const handleMouseover = (d) => {
    setOpacity(1)
  }
  //interactivity function #2: Moving
  const handleMousemove = (d) => {
    setText(d.key)
  }
  //Interactivity function #3: Leaving
  const handleMouseleave = (d) => {
    setOpacity(0)
    setText("initialState")
  }

  // Generate path elements
  const stacks = useMemo(
    () =>
      stackLayout(filteredData).map((d, i) => (
        <g>
          <path
            key={"stack" + i}
            d={stackArea(d)}
            style={{
              fill: `url(#area-gradient${i})`,
              stroke: "black",
              strokeOpacity: 0.25,
              //opacity: text === "initialState" || d.key === text ? 1 : 0.2,
              opacity:
                zoomedStation === null || d.key === zoomedStation.data.name
                  ? 1
                  : 0.2,
            }}
            onMouseOver={() => {
              handleMouseover(d)
            }}
            onMouseMove={() => {
              handleMousemove(d)
            }}
            onMouseLeave={() => {
              handleMouseleave(d)
            }}
          />
          <linearGradient
            id={`area-gradient${i}`}
            gradientUnits={"userSpaceOnUse"}
            x1={0}
            x2={"100%"}
            y1={0}
            y2={0}
          >
            {dataPred.map((dd, ii) => {
              const offset = (100 / dataPred.length) * ii
              const currentBuilding = keys[i]
              const prediction = dd[currentBuilding]
              return (
                <stop
                  offset={offset + "%"}
                  stopColor={colorScale(prediction)}
                />
              )
            })}
            {/* Map only goes from 0 to length - 1, so last one needs to be hardcoded */}
            <stop
              offset={"100%"}
              stopColor={colorScale(dataPred.at(-1)[keys[i]])}
            />
          </linearGradient>
        </g>
      )),
    [filteredData, zoomedStation]
  )

  // Setup interactive Brush
  const brushRef = useRef()
  useEffect(() => {
    const brush = brushX().extent([
      [0, 0],
      [width, height],
    ])
    brush(select(brushRef.current))
    // EventListener and Callback Function
    brush.on("brush end", () => {
      // In order to change the state in other code, we use the state hook, which was passed as a functin to this component
      setBrushExtent(event.selection && event.selection.map(xScale.invert)) // invert takes input from the range (here pixel coordinates) of the scale and returns the date. We use map to cast the method on the array (left and right coordinate).
      setZommedStation(null)
    })
  }, [width, height])

  return (
    <svg width={width} height={height} className="streamgraph">
      <g transform={`translate(${margin.left},${margin.top})`}>
        <AxisLeft yScale={yScale} innerHeight={innerHeight} innerWidth />
        <AxisBottom
          xScale={xScale}
          innerHeight={innerHeight}
          innerWidth={innerWidth}
        />
        <Tooltip opacity={opacity} text={text} />
        <g>{stacks}</g>
        <g ref={brushRef} />
      </g>
      <text className={"chartTitle"} x={50} y={20}>
        Patient count and predicted infection risk on building level over time{" "}
      </text>
    </svg>
  )
}
