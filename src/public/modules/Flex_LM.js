import * as React from "react"
// import * as ReactDOM from "react-dom"
import * as FlexLayout from "flexlayout-react"

import * as vis_configs from "./vis_configs.json"

import SideMenu from "../components/SideMenu"

import LineList from "../vis/Linelist"
import Epikurve from "../vis/Epikurve"
import Kontaktnetzwerk from "../vis/Kontaktnetzwerk"
import PatientDetail from "../vis/PatientDetail"
import Storyline from "../vis/Storyline"

import ParametersWindow from "./ParametersWindow"
import FilterWindow from "./FilterWindow"

import "../assets/icons/detaillist.png"
import "../assets/icons/epicurve.png"
import "../assets/icons/filter.png"
import "../assets/icons/home.png"
import "../assets/icons/kontakt.png"
import "../assets/icons/linelist.png"
import "../assets/icons/lock_closed.png"
import "../assets/icons/lock_open.png"
import "../assets/icons/question.png"
import "../assets/icons/settings.png"
import "../assets/icons/storyline.png"
import "../assets/icons/treemap.png"
import "../assets/icons/ManageHistory.png"

import { withSocket } from "../hooks/socket"

const img_path = "imgs/"

// import "./scss/flex_lm.scss"
class Flex_LM extends React.Component {
  constructor(props) {
    super(props)

    this.layoutRef = React.createRef()

    this.translate = props.translate

    this.empty = {
      global: {},
      borders: [
        // {
        //   type: "border",
        //   location: "top",
        //   children: [
        //     {
        //       type: "tab",
        //       enableClose: false,
        //       name: "MENU/BUTTONS TODO",
        //       component: "menu",
        //       icon: img_path + "home.png",
        //     },
        //   ],
        // },
        // {
        //   type: "border",
        //   location: "bottom",
        //   children: [
        //     {
        //       type: "tab",
        //       enableClose: false,
        //       name: "HISTORY TODO",
        //       component: "website",
        //       icon: img_path + "home.png",
        //     },
        //   ],
        // },
        {
          type: "border",
          location: "left",
          size: 200,
          selected: 0,
          children: [
            {
              type: "tab",
              enableClose: false,
              name: "Parameter",
              component: "ParametersWindow",
              icon: img_path + "settings.png",
            },
            {
              type: "tab",
              enableClose: false,
              name: "Filter",
              component: "FilterWindow",
              icon: img_path + "filter.png",
            },
          ],
        },
        {
          type: "border",
          location: "right",
          size: 200,
          selected: 0,
          children: [
            // {
            //   type: "tab",
            //   enableClose: false,
            //   name: "Filter",
            //   component: "FilterWindow",
            //   icon: img_path + "filter.png",
            // },
            {
              type: "tab",
              enableClose: false,
              name: "Menu und Verlauf",
              component: "menu",
              icon: img_path + "ManageHistory.png",
            },
            // {
            //   type: "tab",
            //   enableClose: false,
            //   name: "HISTORY/STATES TODO",
            //   component: "website",
            //   icon: img_path + "filter.png",
            // },
          ],
        },
      ],
      layout: {},
    }

    this.json = {
      global: {},
      borders: [
        {
          type: "border",
          location: "top",
          children: [
            {
              type: "tab",
              enableClose: false,
              name: "Menu & Verlauf",
              component: "header",
              icon: img_path + "home.png",
            },
          ],
        },
        {
          type: "border",
          location: "bottom",
          children: [
            {
              type: "tab",
              enableClose: false,
              name: "Statistikmodul",
              component: "website",
              icon: img_path + "home.png",
            },
          ],
        },
        {
          type: "border",
          location: "left",
          size: 200,
          selected: 0,
          children: [
            {
              type: "tab",
              enableClose: false,
              name: "Parameter",
              component: "ParametersWindow",
              icon: img_path + "settings.png",
            },
            {
              type: "tab",
              enableClose: false,
              name: "Filter",
              component: "FilterWindow",
              icon: img_path + "filter.png",
            },
          ],
        },
        {
          type: "border",
          location: "right",
          size: 200,
          selected: 0,
          children: [
            {
              type: "tab",
              enableClose: false,
              name: "Filter",
              component: "FilterWindow",
              icon: img_path + "filter.png",
            },
          ],
        },
      ],
      layout: {
        type: "row",
        weight: 100,
        children: [
          {
            type: "column",
            weight: 40,
            children: [
              {
                type: "tabset",
                weight: 50,
                children: [
                  {
                    type: "tab",
                    name: this.translate("EpidemieKeim"),
                    component: "epicurve",
                    icon: img_path + "epicurve.png",
                    // enableClose: false,
                  },
                  // {
                  //   type: "tab",
                  //   // name: this.translate("EpidemieKeim2"),
                  //   name: "",
                  //   component: "epicurve2",
                  //   icon: img_path + "epicurve.png",
                  // },
                ],
              },
              {
                type: "tabset",
                weight: 50,
                children: [
                  {
                    type: "tab",
                    name: this.translate("Kontaktnetzwerk"),
                    component: "contact",
                    icon: img_path + "kontakt.png",
                  },
                ],
              },
            ],
          },
          {
            type: "column",
            weight: 60,
            children: [
              {
                type: "tabset",
                weight: 30,
                children: [
                  {
                    type: "tab",
                    name: this.translate("Linelist"),
                    component: "linelist",
                    icon: img_path + "linelist.png",
                  },
                  // {
                  //   type: "tab",
                  //   name: this.translate("Linelist"),
                  //   component: "linelist",
                  //   icon: img_path + "linelist.png",
                  // },
                ],
              },
              {
                type: "tabset",
                weight: 30,
                children: [
                  {
                    type: "tab",
                    name: this.translate("PatientDetail"),
                    // name: "",
                    component: "detail",
                    icon: img_path + "detaillist.png",
                  },
                ],
              },
              {
                type: "tabset",
                weight: 40,
                children: [
                  {
                    type: "tab",
                    name: this.translate("Storyline"),
                    // name: "",
                    component: "storyline",
                    icon: img_path + "storyline.png",
                  },
                ],
              },
            ],
          },
        ],
      },
    }
    this.state = { model: FlexLayout.Model.fromJson(this.empty) }
  }

  create_module_obj_for_lm = (component) => {
    let obj = {
      component,
    }

    switch (component) {
      case "epicurve":
        obj.name = this.translate("EpidemieKeim")
        obj.icon = img_path + "epicurve.png"
        break
      case "contact":
        obj.name = this.translate("Kontaktnetzwerk")
        obj.icon = img_path + "kontakt.png"
        break
      case "linelist":
        obj.name = this.translate("Linelist")
        obj.icon = img_path + "linelist.png"
        break
      case "detail":
        obj.name = this.translate("PatientDetail")
        obj.icon = img_path + "detaillist.png"
        break
      case "storyline":
        obj.name = this.translate("Storyline")
        obj.icon = img_path + "storyline.png"
        break
    }

    return obj
  }

  onAddDragMouseDown = (event, component) => {
    console.warn("DRAGGIN ELEMTN ???")

    let comp_obj = this.create_module_obj_for_lm(component)

    event.stopPropagation()
    event.preventDefault()
    if (this.layoutRef && this.layoutRef.current) {
      // console.log("YES BIN DRIN")
      this.layoutRef.current.addTabWithDragAndDrop(
        undefined,
        comp_obj,
        // {
        //   component: "grid",
        //   icon: "images/article.svg",
        //   name: "Grid " + this.nextGridIndex++,
        // },
        this.onAdded
      )
      // this.setState({ adding: true });
    }
  }

  componentDidMount = () => {
    let self = this
    // setTimeout(() => {
    //   console.log("test change layout of flex lm")

    //   self.setState((prevState) => {
    //     prevState = {
    //       model: FlexLayout.Model.fromJson(self.json),
    //     }
    //     return prevState
    //   })
    // }, 2000)
  }

  get_color = (key) => {
    let colors = vis_configs.default.colors

    let col = colors[key]

    return col ? col : "limegreen"
  }

  factory = (node) => {
    var component = node.getComponent()
    if (component === "button") {
      return <button>{node.getName()}</button>
    } else if (component === "menu") {
      return <SideMenu {...this.props} />
    } else if (component === "website") {
      let id = "id"
      let source = "http://127.0.0.1:8080/predRisk"
      return (
        <iframe
          title={id}
          src={source}
          style={{ display: "block", border: "none", boxSizing: "border-box" }}
          width="100%"
          height="100%"
        />
      )
    } else if (component === "FilterWindow") {
      return <FilterWindow {...this.props} />
    } else if (component === "ParametersWindow") {
      return (
        <ParametersWindow
          {...this.props}
          onAddDragMouseDown={this.onAddDragMouseDown}
        />
      )
    } else if (component === "contact") {
      return (
        <Kontaktnetzwerk
          {...this.props}
          get_color={this.get_color}
          // socket={props.socket}
        />
      )
    } else if (component === "epicurve") {
      return (
        <Epikurve
          {...this.props}
          get_color={this.get_color}
          // socket={props.socket}
        />
      )
    } else if (component === "epicurve2") {
      return (
        <Epikurve
          {...this.props}
          get_color={this.get_color}
          // socket={props.socket}
        />
      )
    } else if (component === "linelist") {
      return (
        <LineList
          {...this.props}
          get_color={this.get_color}
          // socket={props.socket}
        />
      )
    } else if (component === "detail") {
      return (
        <PatientDetail
          {...this.props}
          get_color={this.get_color}
          // socket={props.socket}
        />
      )
    } else if (component === "storyline") {
      return <Storyline {...this.props} get_color={this.get_color} />
    }
  }

  render() {
    return (
      <FlexLayout.Layout
        ref={this.layoutRef}
        // style={{ position: "relative" }}
        model={this.state.model}
        factory={this.factory}
      />
    )
  }
}

export default withSocket(Flex_LM)
