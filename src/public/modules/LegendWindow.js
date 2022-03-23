import React, { Component } from "react"
import "./scss/legendWindow.scss"
import akkumulation from "../assets/legend_gifs/epikurve/akkumulation_7_vs_28_tage.gif"
import faelle from "../assets/legend_gifs/epikurve/gesamtzahl_faelle_vs_neuinfektionen.gif"
import zeitumstellung from "../assets/legend_gifs/epikurve/zeitraumeingraenzung.gif"

import legend_kn from "../assets/legend_gifs/kontaktnetzwerk/nodes_and_links.png"
import zooming_kn from "../assets/legend_gifs/kontaktnetzwerk/zoom_and_panning_kontakt.gif"

import behandlungen from "../assets/legend_gifs/linelist/behandlungen.png"
import bewegungen from "../assets/legend_gifs/linelist/bewegungen.png"
import invest_rects from "../assets/legend_gifs/linelist/invest_rects.png"
import scrolling from "../assets/legend_gifs/linelist/scrolling.gif"
import status_rects from "../assets/legend_gifs/linelist/status_rects.png"
import zooming_linelist from "../assets/legend_gifs/linelist/zoom_and_panning_linelist.gif"

import patient from "../assets/legend_gifs/patientdetail/patient.png"
import vaccination from "../assets/legend_gifs/patientdetail/vaccination.png"
import patientdetailzoom from "../assets/legend_gifs/patientdetail/patientdetail-zoom.gif"
import patientdetailscroll from "../assets/legend_gifs/patientdetail/patientdetail-scroll.gif"
import patientdetailcolor from "../assets/legend_gifs/patientdetail/patientdetail-color.gif"
import colorSummary from "../assets/legend_gifs/patientdetail/colorSummary.png"

import colorOverview from "../assets/legend_gifs/storyline/colorOverview.png"
import storylinezoompan from "../assets/legend_gifs/storyline/storyline-zoompan.gif"
import storylinemoments from "../assets/legend_gifs/storyline/storyline-criticalmoments.png"
import storylinecontact from "../assets/legend_gifs/storyline/storyline-contact.png"

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
          <h4>{this.translate("switchingCases")}</h4>
          <img src={faelle} />
          {get_spacer()}
          <h4>{this.translate("switchingDays")}</h4>
          <img src={akkumulation} />
          {get_spacer()}
          <h4>{this.translate("limitTimespan")}</h4>
          <img src={zeitumstellung} />
          {get_spacer()}
          {/* </div> */}
        </div>

        <div className="module_legend kontaktnetz_legend">
          <h3>{this.translate("Kontaktnetzwerk")}</h3>
          {get_spacer()}
          <h4>{this.translate("circleLine")}</h4>
          <img src={legend_kn} />
          {get_spacer()}
          <h4>{this.translate("zoom")}</h4>
          <img src={zooming_kn} />
          {get_spacer()}
          {/* Node = Patient <br /> Link = Hatten Kontakt <br /> Grau = Unknown;
          Orange = Träger; Red = diseased <br /> Mausrad = Zoom <br /> Drag =
          Panning */}
        </div>

        <div className="module_legend linelist_legend">
          <h3>{this.translate("Linelist")}</h3>
          {get_spacer()}
          <h4>{this.translate("statusPatient")}</h4>
          <img src={status_rects} />
          {get_spacer()}
          <h4>{this.translate("verticalBars")}</h4>
          <img src={invest_rects} />
          {get_spacer()}
          <h4>{this.translate("horizontalBars")}</h4>
          <img src={bewegungen} />
          {get_spacer()}
          <h4>{this.translate("dotCircle")}</h4>
          <img src={behandlungen} />
          {get_spacer()}
          <h4>{this.translate("zoomH")}</h4>
          <img src={zooming_linelist} />
          {get_spacer()}
          <h4>{this.translate("scrollBar")}</h4>
          <img src={scrolling} />
          {get_spacer()}
          {/* Bewegungen <br /> Hintergrundfarbe = Infektion (+ Farblegende) <br />{" "}
          Grau = Unknown; Orange = Träger; Red = diseased <br /> Die
          Investiagtion Rects mit Farben <br /> movement dots <br /> Mausrad =
          Zoom <br /> Drag = Panning */}
        </div>

        <div className="module_legend patientdetail_legend">
          {/* <div className="module_legend_container"> */}
          <h3>{this.translate("PatientDetail")}</h3>
          {get_spacer()}
          <h4>{this.translate("OnePatient")}</h4>
          <img src={patient} />
          {get_spacer()}
          <h4>{this.translate("BackgroundColoring")}</h4>
          <img src={colorSummary} />          
          {get_spacer()}
          <h4>{this.translate("horizontalBars")}</h4>
          <img src={bewegungen} />
          {get_spacer()}
          <h4>{this.translate("Vaccination")}</h4>
          <img src={vaccination} />
          {get_spacer()}
          <h4>{this.translate("zoomH")}</h4> 
          <img src={patientdetailzoom}/>
          {get_spacer()}
          <h4>{this.translate("scrollBar")}</h4>
          <img src={patientdetailscroll} />
          {get_spacer()}
          <h4>{this.translate("Coloring")}</h4>
          <img src={patientdetailcolor} />
          {get_spacer()}
        </div>
        
        <div className="module_legend storyline_legend">
          {/* <div className="module_legend_container"> */}
          <h3>{this.translate("Storyline")}</h3>
          {get_spacer()}
          <h4>{this.translate("ColoringPatient")}</h4>
          <img src={colorOverview} />
          {get_spacer()}
          <h4>{this.translate("zoom")}</h4>
          <img src={storylinezoompan} />
          {get_spacer()}
          <h4>{this.translate("ContactCircle")}</h4>
          <img src={storylinecontact} />
          {get_spacer()}
          <h4>{this.translate("Identify")}</h4>
          <img src={storylinemoments} />
          {get_spacer()}
          <h4>{this.translate("Forward")}</h4>
          {get_spacer()}
          <h4>{this.translate("Backward")}</h4>
          {get_spacer()}
        </div>
        
      </div>
    )
  }
}

export default LegendWindow
