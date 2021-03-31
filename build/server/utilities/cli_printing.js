"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printErrorJson = exports.printConnectionMessage = exports.printArrayInColor = void 0;
var cli_color = require("cli-color");
/**
 * Prints an array as lines in the given color.
 *
 * @param array the array with the lines to be printed
 * @param color the one color for all lines
 */
exports.printArrayInColor = function (array, color) {
    for (var _i = 0, array_1 = array; _i < array_1.length; _i++) {
        var line = array_1[_i];
        console.log(color(line));
    }
};
/**
 * Prints a box with some nicely colored connection information that can be issued right after startup of the server.
 *
 * @param ip_address the IP address of the server that can be used to access the website (space might be insufficient
 *                   for IPv6 addresses; but would work)
 * @param port the port on which the website accessible
 */
exports.printConnectionMessage = function (ip_address, port) {
    var string_ip = "http://" + ip_address + ":" + port;
    var string_localhost = "http://localhost:" + port;
    var colored_ip = cli_color.yellow.underline(string_ip);
    var colored_localhost = cli_color.yellow.underline(string_localhost);
    var space = "\xa0"; // non-breaking space in Latin-1 (and thus also in Unicode)
    var line_length = 39;
    var space_after_ip = space.repeat(Math.max(line_length - string_ip.length, 0));
    var space_after_localhost = space.repeat(Math.max(line_length - string_localhost.length, 0));
    var lines = [
        "┌──────────────────────────────────────────────────────────────────────────────┐",
        "│                                                                              │",
        "\u2502 VS-Code: " + cli_color.green("'ctrl + click'") + " on the IP below to open the website in your browser. \u2502",
        "│                                                                              │",
        "\u2502 Otherwise you can " + cli_color.green("copy") + " the IP to open the website in your browser.           \u2502",
        "│                                                                              │",
        "│ My socket server is running on:       " +
            colored_ip +
            space_after_ip +
            "│",
        "│                                                                              │",
        "│ If you can't access with IP, try:     " +
            colored_localhost +
            space_after_localhost +
            "│",
        "│                                                                              │",
        "└──────────────────────────────────────────────────────────────────────────────┘",
    ];
    exports.printArrayInColor(lines, cli_color.cyanBright);
};
/**
 * Prints the object in error-red colors.
 *
 * @param json a JSON object to print
 */
exports.printErrorJson = function (json) {
    var lines = Object.entries(json).map(function (_a) {
        var key = _a[0], value = _a[1];
        return key + ": " + value;
    });
    exports.printArrayInColor(lines, cli_color.red);
};
//# sourceMappingURL=cli_printing.js.map