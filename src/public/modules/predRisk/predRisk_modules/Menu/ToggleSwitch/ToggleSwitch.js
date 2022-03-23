import React from "react"
import "./ToggleSwitch.css"

export const ToggleSwitch = ({ name, checked, onChange }) => (
  <label className="toggle-switch">
    <input
      type="checkbox"
      name={name}
      id={name}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
    <span className="switch" />
  </label>
)
