import * as express from "express"
import { Response } from "express"
import { address as ip_address } from "ip"
import * as socket from "socket.io"

import CONFIG from "./config"
import { app, session } from "./app"
import {
  printArrayInColor,
  printConnectionMessage,
} from "./utilities/cli_printing"
import { WebsocketApi } from "./websocket_api"
import * as cli_color from "cli-color"

// Creating custom console.log prefixes
// https://y-designs.com/ideas/stories/javascript-console-log-prefixes

const originalConsoleLog: any = console.log
console.log = function () {
  let args = []
  let date_object = new Date()
  let date: any = date_object.getDate()
  let month: any = date_object.getMonth() + 1
  let year: any = date_object.getFullYear()

  let hr: any = date_object.getHours()
  let min: any = date_object.getMinutes()
  let sec: any = date_object.getSeconds()
  let ms: any = date_object.getMilliseconds()

  if (month < 10) {
    month = "0" + month
  }

  if (date < 10) {
    date = "0" + date
  }

  if (hr < 10) {
    hr = "0" + hr
  }

  if (min < 10) {
    min = "0" + min
  }

  if (sec < 10) {
    sec = "0" + sec
  }

  if (ms < 100) {
    if (ms < 10) {
      ms = "00" + ms
    } else {
      ms = "0" + ms
    }
  }

  args.push(`[ ${date}.${month}.${year} - ${hr}:${min}:${sec}.${ms} ]`)
  for (let i: number = 0; i < arguments.length; i++) {
    args.push(arguments[i])
  }
  originalConsoleLog.apply(console, args)
}

/*
 * This script starts the webserver and begins listening for requests.
 *
 * Webserver in this context means two things:
 * The website for the browser via HTTP(S) and the websocket API for accessing the data.
 */

// start socket webserver with initialized app
export const server = socket(app.listen(CONFIG.http_port))

// wrap session storage to be used by socket client
const wrapMiddleware = function (middleware: express.RequestHandler) {
  return (socket: socket.Socket, err: (err?: unknown) => void) =>
    middleware(socket.request, {} as Response, err)
}
server.use(wrapMiddleware(session))

// open the websocket API
const api = new WebsocketApi(server)

// when done, signal to the user that connections are now possible;
// also shows address, port & the connected database
if (!CONFIG.is_testing) {
  printConnectionMessage(ip_address(), CONFIG.http_port)
  const database = [
    "┌──────────────────────────────────────┐",
    `  Database is ${CONFIG.datasource}     `,
    "└──────────────────────────────────────┘",
  ]
  printArrayInColor(database, cli_color.white)
}
