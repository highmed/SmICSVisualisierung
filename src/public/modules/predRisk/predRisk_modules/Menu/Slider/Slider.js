import React from "react"
import "./Slider.css"

export const Slider = ({
  name,
  min,
  max,
  step = 1,
  value,
  onChange,
  setZoomedStation,
  setTitle,
  horizontalLabels = { 0: 0, 0.5: 0.5, 1: 1 },
}) => (
  <label className="slide-container">
    <input
      id={name}
      type="range"
      min={min}
      max={max}
      labels={horizontalLabels}
      value={value}
      onChange={(e) => {
        onChange(e.target.value)
        setZoomedStation(null)
        setTitle("Hospital")
      }}
      step={step}
    />
    <span className="slider" />
  </label>
)
