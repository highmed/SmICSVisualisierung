"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.app = void 0;
var express = require("express");
var ip_1 = require("ip");
var socket = require("socket.io");
var config_1 = require("./config");
var cli_printing_1 = require("./utilities/cli_printing");
var websocket_api_1 = require("./websocket_api");
/*
 * This script starts the webserver and begins listing for request. Webserver in this context means two things: Both the
 * website for the browser via HTTP(S) and the websocket API for accessing the data.
 */
// setup the webserver
exports.app = express();
exports.app.use(express.static("build/public"));
console.log(config_1.default);
// open the webserver
exports.server = exports.app.listen(config_1.default.http_port);
// open the websocket API
var api = new websocket_api_1.WebsocketApi(socket(exports.server));
// when done, signal to the user that connections are now possible; also show the address & port
if (!config_1.default.is_testing)
    cli_printing_1.printConnectionMessage(ip_1.address(), config_1.default.http_port);
//# sourceMappingURL=start_server.js.map