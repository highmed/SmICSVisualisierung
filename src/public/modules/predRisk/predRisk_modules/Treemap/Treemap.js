import React, { useMemo, useState } from "react"
import { treemap } from "d3-hierarchy"
import { format } from "d3-format"
import { ColorLegend } from "../ColorLegend/ColorLegend"

const margin = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
}
const padding = {
  top: 28,
  right: 7,
  inner: 3,
  left: 7,
  bottom: 5,
}

const predFormat = format(".0%")

export const Treemap = ({
  root,
  links,
  colorScale,
  width,
  height,
  showLinks,
  zommedStation,
  setZommedStation,
  title,
  setTitle,
}) => {
  const innerHeight = height - margin.top - margin.bottom
  const innerWidth = width - margin.left - margin.right

  console.log(root)
  //console.log(zommedStation);

  const handleZoom = (d) => {
    if (d === null) {
      setTitle("Hospital")
      setZommedStation(d)
    } else if (d.data.layer === "room") {
      // Lowest level, so we cant zoom futher
    } else {
      const layer = d.data.layer
      setTitle(layer)
      setZommedStation(d)
    }
  }

  const [hoveredValue, setHoveredValue] = useState(null)

  // Build tremap from root node
  useMemo(
    () =>
      treemap()
        .size([innerWidth, innerHeight])
        .paddingTop(padding.top)
        .paddingRight(padding.right)
        .paddingLeft(padding.left)
        .paddingBottom(padding.bottom)
        .paddingInner(padding.inner)(root),
    [root, padding]
  )

  // Completly written in React!
  // Instead of ".selectAll" ".data" ".join"
  // We use .map to append the rects
  return (
    <svg width={width} height={height} className="treemap">
      <g transform={`translate(${margin.left + padding.right},${margin.top})`}>
        {/*Title for the Treemap*/}
        <text
          key={"hospital"}
          x={0}
          y={14}
          fontSize={height * 0.03}
          fill="grey"
          style={{ textTransform: "capitalize" }}
        >
          {title}
        </text>
        {/* BUILDING LEVEL */}
        {/*Text for each sub category. One could additionally draw background rectangle here*/}
        {useMemo(
          () =>
            root
              .descendants()
              .filter((d) => d.depth === 1)
              .map((d, i) => (
                <g>
                  <rect
                    key={"buildingRect" + i}
                    id={"rectB-" + i}
                    x={d.x0}
                    y={d.y0}
                    width={d.x1 - d.x0}
                    height={d.y1 - d.y0}
                    style={{
                      stroke: "black",
                      fill: colorScale(d.data.prediction), // TODO: Buildings need prediction
                    }}
                    onClick={() => handleZoom(d)}
                  >
                    <title>
                      {d.data.name +
                        ": " +
                        predFormat(d.data.prediction) +
                        " / " +
                        d.value}
                    </title>
                  </rect>
                  <clipPath id={"clipB-" + i}>
                    <use xlinkHref={"#rectB-" + i + ""} />
                  </clipPath>
                  <text
                    key={"buildingSubName" + i}
                    clipPath={"url(#clipB-" + i + ")"}
                    x={d.x0 + 5}
                    y={d.y0 + 21}
                    fontSize={height * 0.03}
                    fill="white"
                    onClick={() => handleZoom(d)}
                  >
                    {d.data.name}
                    <title>
                      {d.data.name +
                        ": " +
                        predFormat(d.data.prediction) +
                        " / " +
                        d.value}
                    </title>
                  </text>
                </g>
              )),
          [root]
        )}
        {/* STATION LEVEL */}
        {useMemo(
          () =>
            root
              .descendants()
              .filter((d) => d.depth === 2)
              .map((d, i) => (
                <g>
                  <rect
                    key={"stationRect" + i}
                    id={"rect-" + i}
                    x={d.x0}
                    y={d.y0}
                    width={d.x1 - d.x0}
                    height={d.y1 - d.y0}
                    style={{
                      stroke: "black",
                      fill: colorScale(d.data.prediction),
                    }}
                    onClick={() => handleZoom(d)}
                  >
                    <title>
                      {d.data.name +
                        ": " +
                        predFormat(d.data.prediction) +
                        " / " +
                        d.value}
                    </title>
                  </rect>
                  <clipPath id={"clip-" + i}>
                    <use xlinkHref={"#rect-" + i + ""} />
                  </clipPath>
                  <text
                    key={"stationSubName" + i}
                    clipPath={"url(#clip-" + i + ")"}
                    x={d.x0 + 5}
                    y={d.y0 + 20}
                    fontSize={height * 0.025}
                    fill="white"
                    onClick={() => handleZoom(d)}
                  >
                    {d.data.name}
                    <title>
                      {d.data.name +
                        ": " +
                        predFormat(d.data.prediction) +
                        " / " +
                        d.value}
                    </title>
                  </text>
                </g>
              )),
          [root, colorScale]
        )}

        {/* ROOM LEVEL */}
        {useMemo(
          () =>
            root.leaves().map((d, i) => (
              <g>
                {/*Background shapes for the treemap*/}
                <rect
                  key={"roomRect" + i}
                  x={d.x0}
                  y={d.y0}
                  width={d.x1 - d.x0}
                  height={d.y1 - d.y0}
                  style={{
                    stroke: "black",
                    fill: colorScale(d.data.prediction),
                  }} // Same color as stations
                  onClick={() => handleZoom(d.parent)}
                >
                  <title>
                    {d.data.name +
                      ": " +
                      predFormat(d.data.prediction) +
                      " / " +
                      d.value}
                  </title>
                </rect>
              </g>
            )),
          [root, colorScale]
        )}

        {/*Draw data links*/}
        {useMemo(
          () =>
            links.map((d, i) => {
              // Filter small links
              if (showLinks && d.weight > 15) {
                // Get required rects
                const sourceNode = root
                  .descendants()
                  .filter(
                    (node) => node.depth === 2 && node.data.name === d.source
                  )
                const targetNode = root
                  .descendants()
                  .filter(
                    (node) => node.depth === 2 && node.data.name === d.target
                  )

                if (
                  Array.isArray(sourceNode) &&
                  sourceNode.length &&
                  Array.isArray(targetNode) &&
                  targetNode.length
                ) {
                  const l =
                    Math.sqrt(
                      Math.pow(targetNode[0].y0 - sourceNode[0].y0, 2) +
                        Math.pow(targetNode[0].x0 - sourceNode[0].x0, 2)
                    ) / 2
                  // Control points spans a 60° degree angle between source and mid
                  const controlPointX =
                    sourceNode[0].x0 + l * Math.sin(Math.PI / 3)
                  const controlPointY =
                    sourceNode[0].y0 + l * Math.cos(Math.PI / 3)

                  const offset = 5

                  return (
                    <path
                      key={"link" + i}
                      d={`M${sourceNode[0].x0 + offset} ${
                        sourceNode[0].y0 + offset
                      } Q ${controlPointX} ${controlPointY} ${
                        targetNode[0].x0 + offset
                      } ${targetNode[0].y0 + offset}`}
                      stroke="purple"
                      strokeWidth={d.weight / 10}
                      strokeLinecap="round"
                      fill="transparent"
                      opacity={
                        hoveredValue &&
                        (d.source !== hoveredValue[0] ||
                          d.target !== hoveredValue[1])
                          ? 0.2
                          : 0.95
                      }
                      onMouseEnter={() => {
                        setHoveredValue([d.source, d.target])
                      }}
                      // Reset filtering
                      onMouseOut={() => {
                        setHoveredValue(null)
                      }}
                    >
                      <title>{"patients moved: " + d.weight}</title>
                    </path>
                  )
                }
              } else {
                return <div>{null}</div>
              }
            }),
          [root, links, showLinks, hoveredValue]
        )}

        {zommedStation !== null ? (
          <g>
            <rect
              x={root.x0}
              y={root.y0 + padding.top}
              width={root.x1 - root.x0}
              height={root.y1 - root.y0}
              style={{
                stroke: "black",
                fill: colorScale(zommedStation.data.prediction),
              }}
              onClick={() => {
                // If we're on building level. Go back to hospital (null), if not go to parent (from station to building)
                if (zommedStation.depth == 1) {
                  handleZoom(null)
                } else {
                  handleZoom(zommedStation.parent)
                }
              }}
            />
            <text
              x={root.x0 + 5}
              y={root.y0 + 20 + padding.top}
              fontSize={height * 0.03}
              fill="white"
            >
              {zommedStation.data.name +
                ": prediction=" +
                predFormat(zommedStation.data.prediction) +
                " / patients=" +
                zommedStation.value}
            </text>
            {zommedStation.children.map((d, i) => {
              const zoomX =
                (root.x1 - root.x0) / (zommedStation.x1 - zommedStation.x0)
              const zoomY =
                (root.y1 - root.y0) / (zommedStation.y1 - zommedStation.y0)
              if (d.value > 0) {
                return (
                  <g>
                    <rect
                      x={d.x0 * zoomX - d.parent.x0 * zoomX + root.x0}
                      y={d.y0 * zoomY - d.parent.y0 * zoomY + root.y0}
                      width={(d.x1 - d.x0) * zoomX}
                      height={(d.y1 - d.y0) * zoomY}
                      onClick={() => handleZoom(null)}
                      style={{
                        stroke: "black",
                        fill: colorScale(d.data.prediction),
                      }}
                      onClick={() => handleZoom(d)}
                    >
                      <title>
                        {d.data.name +
                          ": " +
                          predFormat(d.data.prediction) +
                          " / " +
                          d.value}
                      </title>
                    </rect>
                    <text
                      x={d.x0 * zoomX - d.parent.x0 * zoomX + root.x0 + 5}
                      y={d.y0 * zoomY - d.parent.y0 * zoomY + root.y0 + 15}
                      fontSize={height * 0.025}
                      fill="black"
                    >
                      {d.data.name}
                    </text>
                    <text
                      key={"value" + i}
                      x={d.x0 * zoomX - d.parent.x0 * zoomX + root.x0 + 5}
                      y={d.y0 * zoomY - d.parent.y0 * zoomY + root.y0 + 35}
                      fontSize={height * 0.025}
                      fill="black"
                    >
                      {predFormat(d.data.prediction) + " / " + d.value}
                    </text>
                  </g>
                )
              } else {
              }
            })}
          </g>
        ) : (
          <div>{null}</div>
        )}
      </g>
    </svg>
  )
}
