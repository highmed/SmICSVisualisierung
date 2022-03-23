import { RadioButton } from "./RadioButton/RadioButton"
import { Slider } from "./Slider/Slider"
import { ToggleSwitch } from "./ToggleSwitch/ToggleSwitch"
import { ColorLegend } from "../ColorLegend/ColorLegend"

export const Menu = ({
  width,
  height,
  checked,
  setChecked,
  minPrediction,
  setMinPrediction,
  setZommedStation,
  setTitle,
  sortOrder,
  setSortOrder,
  colorScale,
}) => (
  <label className="menu">
    <p>
      <font size={height * 0.035} face="normal" color="#635f5d">
        Interactive Visualization of infection prediction
      </font>
      <font size={height * 0.028} face="times new roman" color="#635f5d">
        <br />
        Toggle Station movements:
      </font>
      <ToggleSwitch name={"test"} checked={checked} onChange={setChecked} />
      <font size={height * 0.028} face="times new roman" color="#635f5d">
        <br />
        Sort by:
      </font>
      <RadioButton
        label="Size"
        value="size"
        checked={sortOrder}
        setter={setSortOrder}
      />
      <RadioButton
        label="Prediction"
        value="prediction"
        checked={sortOrder}
        setter={setSortOrder}
      />
      <font size={height * 0.028} face="times new roman" color="#635f5d">
        <br />
        Set min prediction:
      </font>
      <Slider
        name={"minPredSlider"}
        min={0.0}
        max={1.0}
        step={0.01}
        value={minPrediction}
        onChange={setMinPrediction}
        setZoomedStation={setZommedStation}
        setTitle={setTitle}
      />
      <ColorLegend
        width={width * 1.75}
        height={height * 0.25 < 31 ? 31 : height * 0.25}
        colorScale={colorScale}
        paddingTop={0}
      />
    </p>
  </label>
)
