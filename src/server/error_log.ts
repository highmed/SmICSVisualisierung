import * as cli_color from "cli-color"
import hash = require("object-hash")
import { RestAPI } from "./data_io/concrete_data_providers/rest_api"
import module_parser from "./module_parser"
import {
  get_parameter_module_data,
  get_parameter_parsed_data,
} from "./websocket_api"

import fs = require("fs")

/**
 * Note: For parsed_data and module_data 'parameters' will hold request parameters which are neccessary for the needed raw data
 *       For raw_data only the parameters which are neccessary for the procedure call
 * @param resolved_ts Timestamp which is set when the error is fixed
 * @param occurence_ts Timestamp which is set when the error first occured
 */
export type errorDataType = {
  data_name: string
  data_type: string
  parameters: { [key: string]: string[] }
  error: string | object | any
  priority: number
  solved_ts: number | undefined
  occurence_ts: number
}

export const error_description: { readonly [key: number]: string[] } = {
  0.0: [
    "[ERROR 0.0]: ",
    "Some request_parameters are missing or wrong. Please check the payload in /public/modules/main.js",
    "Es fehlen Eingabeparameter für die Anfrage von Daten. Sind alle Felder ausgefüllt?",
  ],
  1.1: [
    "[ERROR 1.1]: ",
    "data request to the API failed. Please check the connection and the request parameters. We received no data, or we got data which is probably incorrect. The function that makes the call to the API is getDataFromREST() at websocket_api.ts.",
    "Die Datenbank ist zur Zeit nicht erreichbar. Bitte versuchen Sie es später erneut.",
  ],
  1.2: [
    "[ERROR 1.2]: ",
    "raw_data for data_parser.ts is not cached. This error occured in the function computeParsedData() at websocket_apt.ts",
    "Bei der Berechnung der Daten ist etwas schief gegangen. Möglicherweiße werden Ihnen Teile der Visualisierung nicht vollständig angezeigt.",
  ],
  1.3: [
    "[ERROR 1.3]: ",
    "raw_data for data_parser.ts is cached but has an error. The issue occured in the function computeParsedData() at websocket_api.ts",
    "Bei der Berechnung der Daten ist etwas schief gegangen. Möglicherweiße werden Ihnen Teile der Visualisierung nicht vollständig angezeigt.",
  ],
  1.4: [
    "[ERROR 1.4]: ",
    "raw_data.error !== undefined in data_parser.ts. ",
    "Bei der Berechnung der Daten ist etwas schief gegangen. Möglicherweiße werden Ihnen Teile der Visualisierung nicht vollständig angezeigt.",
  ],
  1.5: [
    "[ERROR 1.5]: ",
    "raw_data for module_parser is not cached. This error occured in the function computeModuleData() at websocket_api.ts",
    "Bei der Berechnung der Daten ist etwas schief gegangen. Möglicherweiße werden Ihnen Teile der Visualisierung nicht vollständig angezeigt.",
  ],
  1.6: [
    "[ERROR 1.6]: ",
    "raw_data for module_parser is cached but has an error. Error occured in the function computeModuleData() at websocket_api.ts",
    "Bei der Berechnung der Daten ist etwas schief gegangen. Möglicherweiße werden Ihnen Teile der Visualisierung nicht vollständig angezeigt.",
  ],
  1.7: [
    "[ERROR 1.7]: ",
    "raw_data.error !== undefined in module_parser.ts. ",
    "Die Berechnung der Daten ist fehlgeschlagen.",
  ],

  2.5: [
    "[ERROR 2.5]: ",
    "parsed_data for module_parser.ts is not cached. This error occured in the function computeModuleData() at websocket_api.ts",
    "Bei der Berechnung der Daten ist etwas schief gegangen. Möglicherweiße werden Ihnen Teile der Visualisierung nicht vollständig angezeigt.",
  ],
  2.6: [
    "[ERROR 2.6]: ",
    "parsed_data for module_parser.ts is cached but has an error. Error occured in the function computeModuleData() at websocket_api.ts ",
    "Bei der Berechnung der Daten ist etwas schief gegangen. Möglicherweiße werden Ihnen Teile der Visualisierung nicht vollständig angezeigt.",
  ],
  2.7: [
    "[ERROR 2.7]: ",
    "parsed_data.error !== undefined in module_parser.ts. ",
    "Bei der Berechnung der Daten ist etwas schief gegangen. Möglicherweiße werden Ihnen Teile der Visualisierung nicht vollständig angezeigt.",
  ],
  2.8: [
    "[ERROR 2.8]: ",
    "An error occured while computing ",
    "Bei der Berechnung der Daten ist etwas schief gegangen. Möglicherweiße werden Ihnen Teile der Visualisierung nicht vollständig angezeigt.",
  ],

  3: [
    "[ERROR 3.0]: ",
    "An error occured while computing visualization data with ",
    "Bei der Berechnung der Daten ist etwas schief gegangen. Möglicherweiße werden Ihnen Teile der Visualisierung nicht vollständig angezeigt.",
  ],
}

/**
 * This function creates the correct error object for each cacheDatatype and returns it
 * @param name Name of the procedure
 * @param all_parameters All request parameters which are sent by client
 * @param prio The prio of the error. Depends on where the error occurs
 * @param errorMsg An description of the error or the original error-msg (e. g. send by the api)
 * @returns An error object of errorDataType
 */
export const createError = (
  name: string,
  all_parameters: any,
  prio: number = Infinity,
  errorMsg?: undefined | object | string
): errorDataType => {
  let errorObj: string | object

  let errLogObjTmp: errorDataType = {
    data_name: name,
    data_type: "unknown",
    parameters: all_parameters,
    error: undefined,
    priority: prio,
    solved_ts: undefined,
    occurence_ts: new Date().getTime(),
  }
  switch (prio) {
    case 0.0:
      errLogObjTmp.data_type = "wrong_parameter / missing_parameter"

      errorObj = {
        dev_desc: error_description[prio][0] + error_description[prio][1],
        error_msg: error_description[prio][0] + errorMsg,
        user_desc: error_description[prio][2],
      }
      errLogObjTmp.error = errorObj
      break
    case 1.1:
    case 1.2:
    case 1.3:
    case 1.4:
    case 1.5:
    case 1.6:
    case 1.7:
      errLogObjTmp.data_type = "raw_data"
      errLogObjTmp.parameters = RestAPI.getProcedureParameters(
        name,
        all_parameters
      )

      errorObj = {
        dev_desc: error_description[prio][0] + error_description[prio][1],
        error_msg: errorMsg,
      }
      errLogObjTmp.error = errorObj
      break

    case 2.5:
    case 2.6:
    case 2.7:
      errLogObjTmp.data_type = "parsed_data"
      errLogObjTmp.parameters = get_parameter_parsed_data(name, all_parameters)
      errorObj = {
        dev_desc:
          error_description[prio][0] +
          error_description[prio][1] +
          `Please take a look in the stack_trace below.`,
        stack_trace: errorMsg,
      }
      errLogObjTmp.error = errorObj
      break

    case 2.8:
      errLogObjTmp.data_type = "parsed_data"
      errLogObjTmp.parameters = get_parameter_parsed_data(name, all_parameters)
      errorObj = {
        dev_desc:
          error_description[prio][0] +
          error_description[prio][1] +
          `data_parser[${name}]. Please take a look in the stack_trace below.`,
        stack_trace: errorMsg,
      }
      errLogObjTmp.error = errorObj
      break

    case 3:
      errLogObjTmp.data_type = "module_data"
      errLogObjTmp.parameters = get_parameter_module_data(name, all_parameters)
      errorObj = {
        dev_desc:
          error_description[prio][0] +
          error_description[prio][1] +
          `module_parser[${name}]. Please take a look in the stack_trace below.`,
        stack_trace: errorMsg,
      }
      errLogObjTmp.error = errorObj
      break
  }
  return errLogObjTmp
}

export class Error_Log {
  private log: errorDataType[]
  private index: number

  public constructor() {
    this.log = []
    this.index = 0
  }

  /**
   * Returns an specific errorDataType object in the log or undefined
   * @param hashID Hash of an object with data_name, parameters, priority
   */
  private getErrorByID = (hashID: string): errorDataType | undefined => {
    for (let i: number = 0; i < this.log.length; i++) {
      let hashIDtmp: string = hash({
        name: this.log[i].data_name,
        para: this.log[i].parameters,
        prio: this.log[i].priority,
      })

      if (hashID === hashIDtmp) {
        return this.log[i]
      }
    }
    return undefined
  }

  /**
   * @param hashID Hash of an object with data_name, parameters, priority
   */
  private deleteErrorByID = (hashID: string) => {
    for (let i: number = 0; i < this.log.length; i++) {
      let hashIDtmp: string = hash({
        name: this.log[i].data_name,
        para: this.log[i].parameters,
        prio: this.log[i].priority,
      })

      if (hashID === hashIDtmp) {
        this.log.splice(i, 1)
        break
      }
    }
  }

  /**
   * Sort the log by occurence of the errors
   */
  private sortLogByOccurence = (): void => {
    this.log.sort((errObj1: errorDataType, errObj2: errorDataType): number => {
      if (errObj1.occurence_ts < errObj2.occurence_ts) {
        return -1
      }
      if (errObj1.occurence_ts > errObj2.occurence_ts) {
        return 1
      }
      return 0
    })
  }

  /**
   * @returns true if the log is empty, false otherwise
   */
  public empty = (): boolean => {
    if (this.log.length === 0) {
      return true
    } else {
      return false
    }
  }

  /**
   *
   * @param errorID Hash of an object with data_name, parameters, priority of the error
   * @returns true if an error with errorID is in the log, false otherwise
   */
  public logIncludes = (errorID: string): boolean => {
    for (let i: number = 0; i < this.log.length; i++) {
      let hashIDtmp: string = hash({
        name: this.log[i].data_name,
        para: this.log[i].parameters,
        prio: this.log[i].priority,
      })
      if (hashIDtmp === errorID) {
        return true
        break
      }
    }
    return false
  }

  /**
   * @returns The error log of the class
   */
  public getErrorLog = (): errorDataType[] => {
    return this.log
  }

  /**
   * This function deletes the first error in the log and returns it
   * @returns The error to be deleted or undefined if the errorLog is empty
   */
  public getError = (): errorDataType | undefined => {
    return this.log.shift()
  }

  /**
   * This function pushes an error to the log if it isn't already logged
   * @param error The error to be logged
   */
  public addError = (error: errorDataType | undefined): void => {
    let saveToLog: boolean = true

    if (error === undefined) {
      return
    }

    let hashID: string = hash({
      name: error.data_name,
      para: error.parameters,
      prio: error.priority,
    })

    this.log.forEach((logErr: errorDataType) => {
      let hashIDtmp: string = hash({
        name: logErr.data_name,
        para: logErr.parameters,
        prio: logErr.priority,
      })

      if (hashID === hashIDtmp) {
        saveToLog = false
      }
    })

    if (saveToLog) {
      this.log.push(error)

      /* sort the error_log by priority -> prio 1: first - prio 3: last */
      this.log = this.log.sort(
        (errObj1: errorDataType, errObj2: errorDataType): number => {
          if (errObj1.priority < errObj2.priority) {
            return -1
          }
          if (errObj1.priority > errObj2.priority) {
            return 1
          }
          return 0
        }
      )
    }
  }

  /**
   * Updates the @solved_ts timestamp for an error with @errorID in the log
   * @param errorID The specific hash of the error
   * @returns true if there was an error that can be marked, false otherwise
   */
  public markErrorSolved = (errorID: string): boolean => {
    let tmpErr = this.getErrorByID(errorID)
    if (tmpErr !== undefined) {
      tmpErr.solved_ts = new Date().getTime()
      return true
    } else {
      return false
    }
  }

  /**
   * @returns Number of all priority = 1.1 errors in the error_log
   */
  public getAllPrio1Errors = (): number => {
    let prio1_counter = 0

    this.log.forEach((err: errorDataType) => {
      if (err.priority === 1.1) {
        prio1_counter++
      }
    })

    return prio1_counter
  }

  /**
   *
   * @param module_name The name of the module we want the errors for
   * @returns List of all neccessary errors for @module_name
   */
  public getErrorsByModule = (module_name: string): errorDataType[] => {
    let all_data: string[] = []
    module_parser[module_name].needed_raw_data.forEach((raw_data: string) => {
      all_data.push(raw_data)
    })
    module_parser[module_name].needed_parsed_data.forEach(
      (parsed_data: string) => {
        all_data.push(parsed_data)
      }
    )
    let module_log: errorDataType[] = []
    this.log.forEach((err: errorDataType) => {
      if (all_data.includes(err.data_name)) {
        module_log.push(err)
      }
    })
    return module_log
  }

  /**
   * This function exports all errors handled by an Error_Log class in a .log file
   * at ./src/server/logs
   * Note: The function creates one file for each day. The errors are sorted by occurence.
   * Note: The 'solved_ts' property is 'undefined' if the error is unsolved.
   * @param log_type name for the error_log file
   */
  public exportErrorsToFile = (log_name: string): void => {
    const path: string = "./src/server/logs/"
    const daysPerWeek = [
      "null",
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun",
    ]

    if (this.empty() || this.log.length === this.index) {
      console.log(`[exportErrorsToFile]: Nothing to log. :-)`)
      return
    }

    this.sortLogByOccurence()

    const fileNamesPerDay: string[] = []

    /* check how many files you will need, save date for each file */
    for (let i: number = 0; i < this.log.length; i++) {
      let file_date: string = new Date(this.log[i].occurence_ts)
        .toISOString()
        .slice(0, 10)

      if (!fileNamesPerDay.includes(file_date)) {
        fileNamesPerDay.push(file_date)
      }
    }

    /* create one file per day and write all errors to it */
    fileNamesPerDay.forEach((file_date) => {
      const stream = fs.createWriteStream(
        path + log_name + "_" + file_date + ".log",
        {
          flags: "w",
        }
      )
      stream.write(
        `Error Log for: ${new Date(
          file_date
        )}\nCreated file on: ${new Date()}\n`
      )
      stream.write(
        `Created file ${Math.floor(
          process.uptime() / 60
        )} minutes after the webserver started`
      )
      stream.write(
        `\n--------------------------------------------------------------------\n`
      )
      for (let i = this.index; i < this.log.length; i++) {
        let err_date = new Date(this.log[i].occurence_ts)
          .toISOString()
          .slice(0, 10)
        if (file_date.localeCompare(err_date) !== 0) {
          this.index = i
          break
        }
        stream.write(`data_name: ${this.log[i].data_name}\n`)
        stream.write(`data_type: ${this.log[i].data_type}\n`)
        stream.write(`occurence_ts: ${this.log[i].occurence_ts}\n`)
        stream.write(`solved_ts: ${this.log[i].solved_ts}\n`)
        stream.write(
          `dev_desc: ${JSON.stringify(this.log[i].error.dev_desc)}\n`
        )
        if (this.log[i].data_type === "raw_data") {
          stream.write(
            `error: ${JSON.stringify(this.log[i].error.error_msg)}\n`
          )
        } else {
          // TODO: hier wirklich der gesamte stack_trace oder nur der erste Error im Stack?
          stream.write(
            `stack_trace[0]: ${JSON.stringify(
              this.log[i].error.stack_trace[0]
            )}\n`
          )
        }
        stream.write(`parameters: ${JSON.stringify(this.log[i].parameters)}\n`)
        stream.write(
          `--------------------------------------------------------------------\n`
        )
      }
      stream.end()
      console.log(
        `[exportErrorsToFile]: Logged errors persistent at: ${
          path + log_name + "_" + file_date
        }`
      )
    })
  }

  /**
   * Prints the errorLog to the console
   */
  public printErrorLog = (): void => {
    console.log(cli_color.red(" ---------- ErrorLog ---------- "))
    for (let i = 0; i < this.log.length; i++) {
      if (i !== 0) {
        console.log("data_name: ", this.log[i].data_name)
      } else {
        console.log("data_name: ", this.log[i].data_name)
      }
      console.log("data_type: ", this.log[i].data_type)
      console.log("error:     ", this.log[i].error)
      console.log("priority:  ", this.log[i].priority)
      console.log("occurence: ", this.log[i].occurence_ts)
      console.log("solved_ts: ", this.log[i].solved_ts)
      console.log(" ------------------------------ ")
    }
    console.log(cli_color.red(" ------- End of ErrorLog ------ "))
  }
}
