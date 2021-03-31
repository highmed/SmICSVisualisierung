import React, { Component } from "react"
import "./scss/legendWindow.scss"
import akkumulation from "../assets/legend_gifs/epikurve/akkumulation_7_vs_28_tage.gif"
import faelle from "../assets/legend_gifs/epikurve/gesamtzahl_faelle_vs_neuinfektionen.gif"
import zeitumstellung from "../assets/legend_gifs/epikurve/zeitraumeingraenzung.gif"

import legend_kn from "../assets/legend_gifs/kontaktnetzwerk/nodes_and_links.png"
import zooming_kn from "../assets/legend_gifs/kontaktnetzwerk/zoom_and_panning.gif"

import behandlungen from "../assets/legend_gifs/linelist/behandlungen.png"
import bewegungen from "../assets/legend_gifs/linelist/bewegungen.png"
import invest_rects from "../assets/legend_gifs/linelist/invest_rects.png"
import scrolling from "../assets/legend_gifs/linelist/scrolling.gif"
import status_rects from "../assets/legend_gifs/linelist/status_rects.png"
import zooming_linelist from "../assets/legend_gifs/linelist/zoom_and_panning.gif"

class LegendWindow extends Component {
  constructor(props) {
    super(props)

    this.translate = props.translate
  }
  render() {
    let get_spacer = () => {
      return <div className="spacer_div" />
    }

    return (
      <div
        className="legend_overlay"
        style={{
          display: this.props.global_legend ? "grid" : "none",
        }}
      >
        <div className="module_legend epikurve_legend">
          {/* <div className="module_legend_container"> */}
          <h3>{this.translate("EpidemieKeim")}</h3>
          {get_spacer()}
          <h4>Wechsel zwischen Neuen und Gesamtzahl Fällen</h4>
          <img src={faelle} />
          {get_spacer()}
          <h4>Wechsel zwischen Akkumulation auf 7 und 28 Tage</h4>
          <img src={akkumulation} />
          {get_spacer()}
          <h4>Eingrenzen des unteren Zeitraums</h4>
          <img src={zeitumstellung} />
          {get_spacer()}
          {/* </div> */}
        </div>
        <div className="module_legend kontaktnetz_legend">
          <h3>{this.translate("Kontaktnetzwerk")}</h3>
          {get_spacer()}
          <h4>Kreis = Patient; Linie = Kontakt zweier Patienten</h4>
          <img src={legend_kn} />
          {get_spacer()}
          <h4>Zoom per Mausrad; Bewegen mit gedrückter Maustaste</h4>
          <img src={zooming_kn} />
          {get_spacer()}
          {/* Node = Patient <br /> Link = Hatten Kontakt <br /> Grau = Unknown;
          Orange = Träger; Red = diseased <br /> Mausrad = Zoom <br /> Drag =
          Panning */}
        </div>
        <div className="module_legend linelist_legend">
          <h3>{this.translate("Linelist")}</h3>
          {get_spacer()}
          <h4>Hintergrundfarbe = Status des Patienten</h4>
          <img src={status_rects} />
          {get_spacer()}
          <h4>Senkrechte Balken = Untersuchungen</h4>
          <img src={invest_rects} />
          {get_spacer()}
          <h4>Waagrechte Balken = Stationsaufenthalte</h4>
          <img src={bewegungen} />
          {get_spacer()}
          <h4>Punkte/kleine Kreise = Behandlungen auf einer Station</h4>
          <img src={behandlungen} />
          {get_spacer()}
          <h4>
            Zoom per Mausrad; horizontales Bewegen mit gedrückter Maustaste
          </h4>
          <img src={zooming_linelist} />
          {get_spacer()}
          <h4>vertikales Bewegen mit Scroll-Leiste</h4>
          <img src={scrolling} />
          {get_spacer()}
          {/* Bewegungen <br /> Hintergrundfarbe = Infektion (+ Farblegende) <br />{" "}
          Grau = Unknown; Orange = Träger; Red = diseased <br /> Die
          Investiagtion Rects mit Farben <br /> movement dots <br /> Mausrad =
          Zoom <br /> Drag = Panning */}
        </div>
      </div>
    )
  }
}

export default LegendWindow
