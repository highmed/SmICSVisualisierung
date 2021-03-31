import React from "react"
import ReactDOM from "react-dom"
import App from "./modules/App.js"
import io from "socket.io-client"

const PORT = 3231

window.ReactDOM = ReactDOM
window.React = React

let hostname = window.location.hostname
let protocol = window.location.protocol
const socketUrl = protocol + "//" + hostname + ":" + PORT

export const socket = io(socketUrl)
socket.on("connect", () => {
  console.log("Connected to " + socketUrl + ".")
})
socket.on("disconnect", () => {
  console.log("Disconnected from " + socketUrl + ".")
})

const render = (Component) => {
  ReactDOM.render(
    <Component socket={socket} />,
    document.getElementById("root")
  )
}

render(App)

console.log("indexjs geladen!")
