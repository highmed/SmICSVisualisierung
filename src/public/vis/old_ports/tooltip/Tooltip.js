import React from "react";
import globals from "../_globals.js";
import * as d3 from "d3";
// import moment from "moment";

import "./css/tooltip.css";

class Tooltip extends React.Component {
    constructor(props) {
        super(props);
        this.key = 0;
        this.id = globals.newComponentID();

        this.moveTooltip = this.moveTooltip.bind(this);
        this.showTooltip = this.showTooltip.bind(this);
        this.hideTooltip = this.hideTooltip.bind(this);

        this.state = {
            timeStamp: undefined
        }

        this.columns = 1;
    }

    componentDidMount() {
        // this.tooltip = d3.selectAll("#" + this.id)
    }

    hideTooltip() {
        // console.log("hide tooltip")
        // this.tooltip
        d3.select(this.tooltipDiv)
            .style("display", "none")
    }

    showTooltip() {
        // console.log("show tooltip")
        // console.log(this.id)
        // this.tooltip
        d3.select(this.tooltipDiv)
            .style("display", "inline-block")
    }

    moveTooltip() {
        // console.log("move tooltip")
        // abchecken, in welchem Quadranten des Fensters sich der Mauszeiger befindet, umd den Tooltip Punktsymetrisch dazu Positionieren
        let mousePosX = d3.event.pageX;
        let mousePosY = d3.event.pageY;
        let windowX = window.innerWidth;
        let windowY = window.innerHeight;

        let xPos1 = mousePosX + 10 + "px";
        let xPos2 = "auto";
        let yPos1 = mousePosY + 10 + "px";
        let yPos2 = "auto";

        if (mousePosX > windowX / 2) {
            xPos1 = "auto";
            xPos2 = windowX - mousePosX + 10 + "px";
        }
        if (mousePosY > windowY / 2) {
            yPos1 = "auto";
            yPos2 = windowY - mousePosY + 10 + "px";
        }

        // FÜR DEMO:
        // xPos1 = mousePosX + 10 + "px";
        // xPos2 = "auto";
        // yPos1 = "auto";
        // yPos2 = windowY - mousePosY + 10 + "px";


        // this.tooltip
        d3.select(this.tooltipDiv)
            // .style("right", windowX - mousePosX - 40 + "px")
            // .style("bottom", windowY - mousePosY + 20 + "px")
            .style("top", yPos1)
            .style("left", xPos1)
            .style("bottom", yPos2)
            .style("right", xPos2)
            // .style("left", d3.event.pageX - 40 + "px")
            // .style("top", d3.event.pageY + 20 + "px")
            .style("display", "inline-block")
    }

    componentDidUpdate() {
        d3.select("#" + this.id).selectAll(".titleTD").attr("colspan", this.columns)
    }

    render() {
        let self = this;
        // console.log(this.props.info)
        let tableDiv = [];
        this.columns = 1;
        this.props.info.forEach(element => {
            // Wenn das Element ueberhaupt definiert ist
            if (element !== undefined && element !== null) {
                // Wenn das Element keinen Content hat, wird es als String angezeigt
                if (element.content) {
                    // Wenn der Content ein leeres array ist, ueberspringen
                    if (!Array.isArray(element.content) || (Array.isArray(element.content) && element.content.length >= 1)) {
                        // Falls Titel, diesen hinzufuegen
                        if (element.title) {
                            tableDiv.push(<tr key={self.id + self.key}><td className="titleTD"><div>{String(element.title)}</div></td></tr>);
                            self.key = self.key + 1;
                        }
                        let trArray = [];
                        // Falls Tabelle header haben soll
                        if (element.header) {
                            // wenn header ein array ist, muss es groesser 0 sein sonst ueberspringen
                            if (Array.isArray(element.header) && element.header.length >= 1) {
                                if (self.columns < element.header.length) {
                                    self.columns = element.header.length;
                                }
                                let thArray = [];
                                element.header.forEach(e => {
                                    thArray.push(<th key={self.id + self.key}>{String(e)}</th>);
                                    self.key = self.key + 1;
                                });
                                trArray.push(<tr key={self.id + self.key}>{thArray}</tr>)
                                self.key = self.key + 1;
                                // Ansonsten wenn header kein array ist
                            } else if (!Array.isArray(element.header)) {
                                if (self.columns < 1) {
                                    self.columns = 1;
                                }
                                trArray.push(<tr key={self.id + self.key}><th>{String(element.header)}</th></tr>);
                                self.key = self.key + 1;
                            } else {
                                console.error(element.header + " is no valid parameter for header.");
                            }
                        }

                        if (Array.isArray(element.content)) {

                            // Jede Iteration ist eine Zeile
                            // Jede zeile kann entweder ein element sein (= ein element in der zeile) oder auch ein array aus mehreren spalten
                            element.content.forEach(e => {
                                let tdArray = [];

                                if (e && Array.isArray(e)) {
                                    if (self.columns < Math.min(1, e.length)) {
                                        self.columns = Math.min(1, e.length);
                                    }
                                    if (e.length === 0) {
                                        tdArray.push(<td key={self.id + self.key}>noData</td>)
                                        self.key = self.key + 1;
                                    } else {
                                        e.forEach(e2 => {
                                            tdArray.push(<td key={self.id + self.key}>{String(e2)}</td>)
                                            self.key = self.key + 1;
                                        })
                                    }
                                } else {
                                    tdArray.push(<td key={self.id + self.key}>{String(e)}</td>)
                                    self.key = self.key + 1;
                                }
                                trArray.push(<tr key={self.id + self.key}>{tdArray}</tr>)
                                self.key = self.key + 1;
                            })
                            // Wenn content nicht aus einem array besteht = 1 element
                        } else {
                            trArray.push(<tr key={self.id + self.key}><td>{String(element.content)}</td></tr>);
                            self.key = self.key + 1;
                        }
                        tableDiv.push(trArray);
                    } else {
                        console.error(element.content + " is no valid parameter for content.");
                    }
                } else {
                    tableDiv.push(<tr key={self.id + self.key}><td>{element}</td></tr>);
                    self.key = self.key + 1;
                    console.error("No content for tooltip-table to display.");
                }
            } else {
                console.error(element + " not defined.");
            }
        });
        if (tableDiv.length === 0) {
            tableDiv = <tr><td>keine Daten vorhanden</td></tr>
        }
        tableDiv = (<table className="tooltipTable"><tbody>{tableDiv}</tbody></table>);
        let tmpDiv = <div className="tableDiv">{tableDiv}</div>
        return (
            <div id={this.id} className="tooltip" ref={element => this.tooltipDiv = element}>
                {tmpDiv}
            </div>
        );
    }
}

export default Tooltip