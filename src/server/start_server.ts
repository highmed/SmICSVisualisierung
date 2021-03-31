import * as express from "express"
import { address as ip_address } from "ip"
import * as socket from "socket.io"

import CONFIG from "./config"
import { printConnectionMessage } from "./utilities/cli_printing"
import { WebsocketApi } from "./websocket_api"

/*
 * This script starts the webserver and begins listing for request. Webserver in this context means two things: Both the
 * website for the browser via HTTP(S) and the websocket API for accessing the data.
 */

// setup the webserver
export const app = express()
app.use(express.static("build/public"))

console.log(CONFIG)

// open the webserver
export const server = app.listen(CONFIG.http_port)

// open the websocket API
const api = new WebsocketApi(socket(server))

// when done, signal to the user that connections are now possible; also show the address & port
if (!CONFIG.is_testing) printConnectionMessage(ip_address(), CONFIG.http_port)
