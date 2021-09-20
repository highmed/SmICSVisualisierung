import * as express from "express"
import { Response } from "express"

import { address as ip_address } from "ip"
import * as socket from "socket.io"

import CONFIG from "./config"
import { app, session } from "./app"
import { printConnectionMessage } from "./utilities/cli_printing"
import { WebsocketApi } from "./websocket_api"

/*
 * This script starts the webserver and begins listening for requests.
 * 
 * Webserver in this context means two things: 
 * The website for the browser via HTTP(S) and the websocket API for accessing the data.
 */

// start socket webserver with initialized app
export const server = socket(app.listen(CONFIG.http_port))

// wrap session storage to be used by socket client
const wrapMiddleware = function(middleware: express.RequestHandler) {
  return (socket: socket.Socket, err: (err?: unknown) => void) => middleware(socket.request, {} as Response, err)
}
server.use(wrapMiddleware(session))

// open the websocket API
const api = new WebsocketApi(server)

// when done, signal to the user that connections are now possible; also show the address & port
if (!CONFIG.is_testing) printConnectionMessage(ip_address(), CONFIG.http_port)
