import React from "react"
import ReactDOM from "react-dom"

import App from "./App"

window.ReactDOM = ReactDOM
window.React = React
ReactDOM.render(<App />, document.getElementById("root"))

// console.log("indexjs geladen!")