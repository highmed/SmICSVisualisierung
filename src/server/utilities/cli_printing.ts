import * as cli_color from "cli-color"

/**
 * Prints an array as lines in the given color.
 *
 * @param array the array with the lines to be printed
 * @param color the one color for all lines
 */
export const printArrayInColor = (
  array: string[],
  color: CallableFunction
): void => {
  for (const line of array) console.log(color(line))
}

/**
 * Prints a box with some nicely colored connection information that can be issued right after startup of the server.
 *
 * @param ip_address the IP address of the server that can be used to access the website (space might be insufficient
 *                   for IPv6 addresses; but would work)
 * @param port the port on which the website accessible
 */
export const printConnectionMessage = (
  ip_address: string,
  port: number
): void => {
  const string_ip = `http://${ip_address}:${port}`
  const string_localhost = `http://localhost:${port}`
  const colored_ip = cli_color.yellow.underline(string_ip)
  const colored_localhost = cli_color.yellow.underline(string_localhost)

  const space = "\xa0" // non-breaking space in Latin-1 (and thus also in Unicode)
  const line_length = 39
  const space_after_ip = space.repeat(
    Math.max(line_length - string_ip.length, 0)
  )
  const space_after_localhost = space.repeat(
    Math.max(line_length - string_localhost.length, 0)
  )

  const lines = [
    "┌──────────────────────────────────────────────────────────────────────────────┐",
    "│                                                                              │",
    `│ VS-Code: ${cli_color.green(
      "'ctrl + click'"
    )} on the IP below to open the website in your browser. │`,
    "│                                                                              │",
    `│ Otherwise you can ${cli_color.green(
      "copy"
    )} the IP to open the website in your browser.           │`,
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
  ]

  printArrayInColor(lines, cli_color.cyanBright)
}

/**
 * Prints the object in error-red colors.
 *
 * @param json a JSON object to print
 */
export const printErrorJson = (json: object): void => {
  const lines: string[] = Object.entries(json).map(
    ([key, value]) => `${key}: ${value}`
  )
  printArrayInColor(lines, cli_color.red)
}
