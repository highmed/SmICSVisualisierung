import * as cli_color from "cli-color"
import hash = require("object-hash")
import module_parser from "./module_parser"
import {
  database,
  get_parameter_module_data,
  get_parameter_parsed_data,
} from "./websocket_api"

import * as fs from "fs"

/**
 * Note: For parsed_data and module_data 'parameters' will hold the necessary request parameters for the needed raw_data
 *       For raw_data only the parameters which are neccessary for the procedure call
 * @param solved_ts Timestamp which is set when the error is fixed
 * @param occurence_ts Timestamp which is set when the error first occured
 * @param parameters Necessary paras for the procedure call, NOT for the hash
 */
export type errorDataType = {
  data_name: string
  data_type: string
  parameters: { [key: string]: string[] }
  error_desc: string
  priority: number
  solved_ts: number
  occurence_ts: number
}

/**
 * The description for each error priority. Different messages for devs and users.
 */
export const error_description: { readonly [key: number]: string[] } = {
  1.0: [
    "Some request_parameters are missing or wrong. Please check the payload in /public/modules/main.js. The name of the function is 'requestVisData()",
    "Es fehlen Eingabeparameter für die Anfrage von Daten. Sind alle Felder ausgefüllt?",
  ],
  1.1: [
    "Data request to the API failed. Please check connection & request parameters. We received no data, or incorrect data. The function that makes the call to the API is getDataFromREST() at src/server/websocket_api.ts.",
    "Die Datenbank ist zur Zeit nicht erreichbar. Bitte versuchen Sie es später erneut.",
  ],
  1.2: [
    "Data request to the API failed. Please check connection & request parameters. We received no data, or incorrect data. The function that makes the call to the API is getDataFromREST() at src/server/websocket_api.ts.",
    "Die Datenbank ist zur Zeit nicht erreichbar. Bitte versuchen Sie es später erneut.",
    // "raw_data for data_parser.ts is not cached. This error occured in the function computeParsedData() at websocket_apt.ts",
    // "Bei der Berechnung der Daten ist ein Fehler aufgetreten. Möglicherweiße werden Ihnen Teile der Visualisierung nicht vollständig angezeigt.",
  ],
  1.3: [
    "Data request to the API failed. Please check connection & request parameters. We received no data, or incorrect data. The function that makes the call to the API is getDataFromREST() at src/server/websocket_api.ts.",
    "Die Datenbank ist zur Zeit nicht erreichbar. Bitte versuchen Sie es später erneut.",
    // "raw_data for data_parser.ts is cached but has an error. The issue occured in the function computeParsedData() at websocket_api.ts",
    // "Bei der Berechnung der Daten ist ein Fehler aufgetreten. Möglicherweiße werden Ihnen Teile der Visualisierung nicht vollständig angezeigt.",
  ],
  1.4: [
    "raw_data.error !== undefined in data_parser.ts. ",
    "Bei der Berechnung der Daten ist ein Fehler aufgetreten. Möglicherweiße werden Ihnen Teile der Visualisierung nicht vollständig angezeigt.",
  ],
  1.5: [
    "raw_data for module_parser is not cached. This error occured in the function computeModuleData() at websocket_api.ts",
    "Bei der Berechnung der Daten ist ein Fehler aufgetreten. Möglicherweiße werden Ihnen Teile der Visualisierung nicht vollständig angezeigt.",
  ],
  1.6: [
    "raw_data for module_parser is cached but has an error. Error occured in the function computeModuleData() at websocket_api.ts",
    "Bei der Berechnung der Daten ist ein Fehler aufgetreten. Möglicherweiße werden Ihnen Teile der Visualisierung nicht vollständig angezeigt.",
  ],
  1.7: [
    "raw_data.error !== undefined in module_parser.ts. ",
    "Bei der Berechnung der Daten ist ein Fehler aufgetreten. Möglicherweiße werden Ihnen Teile der Visualisierung nicht vollständig angezeigt.",
  ],

  2.5: [
    "parsed_data for module_parser.ts is not cached. This error occured in the function computeModuleData() at websocket_api.ts",
    "Bei der Berechnung der Daten ist ein Fehler aufgetreten. Möglicherweiße werden Ihnen Teile der Visualisierung nicht vollständig angezeigt.",
  ],
  2.6: [
    "parsed_data for module_parser.ts is cached but has an error. Error occured in the function computeModuleData() at websocket_api.ts ",
    "Bei der Berechnung der Daten ist ein Fehler aufgetreten. Möglicherweiße werden Ihnen Teile der Visualisierung nicht vollständig angezeigt.",
  ],
  2.7: [
    "parsed_data.error !== undefined in module_parser.ts. ",
    "Bei der Berechnung der Daten ist ein Fehler aufgetreten. Möglicherweiße werden Ihnen Teile der Visualisierung nicht vollständig angezeigt.",
  ],
  2.8: [
    "An error occured while computing ",
    "Bei der Berechnung der Daten ist ein Fehler aufgetreten. Möglicherweiße werden Ihnen Teile der Visualisierung nicht vollständig angezeigt.",
  ],

  3: [
    "An error occured while computing visualization data with ",
    "Bei der Berechnung der Daten ist ein Fehler aufgetreten. Möglicherweiße werden Ihnen Teile der Visualisierung nicht vollständig angezeigt.",
  ],
}

const error_prio: {
  raw_data: number[]
  parsed_data: number[]
  module_data: number[]
} = {
  raw_data: [1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7],
  parsed_data: [2.5, 2.6, 2.7, 2.8],
  module_data: [3],
}

/**
 * This class implements all methods to log the specific errors which can occure
 * during the data pipeline on the webserver.
 */
export class Error_Log {
  private log: errorDataType[]
  private index: number

  public constructor() {
    this.log = []
    this.index = 0
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
   * Looks for unsolved errors in the log. Unsolved means that there is no
   * valid data cached according to the error.
   * @returns true if log includes unsolved errors, false otherwise
   */
  public unsolvedErrors = (): boolean => {
    for (let error of this.log) if (error.solved_ts === -1) return true

    return false
  }

  /**
   * Access to an specific error in the log based on it's hash
   * @param hashID Hash of an object with data_name, parameters, priority
   * @returns An specific errorDataType object in the log or undefined
   */
  private getErrorByID = (hashID: string): errorDataType | undefined => {
    for (let i: number = 0; i < this.log.length; i++) {
      let hashID_tmp = hash({
        name: this.log[i].data_name,
        para: this.log[i].parameters,
        prio: this.log[i].priority,
      })

      if (hashID === hashID_tmp) {
        return this.log[i]
      }
    }
    return undefined
  }

  /**
   * Function to make the logging of an error as easy as possible
   * @param procedure_name Name of the procedure with the occured error
   * @param all_parameters All input parameters given by the client
   * @param priority Depends on data_type and occurence in the pipeline
   * @param error_msg the string-msg you want to log for the error
   */
  public addError = (
    procedure_name: string,
    all_parameters: { [key: string]: string[] },
    priority: number,
    error_msg: string
  ): void => {
    let save_to_log: boolean = true

    let error: errorDataType = {
      data_name: procedure_name,
      data_type: "unknown",
      parameters: all_parameters,
      error_desc: error_msg,
      priority: priority,
      solved_ts: -1,
      occurence_ts: new Date().getTime(),
    }

    switch (priority) {
      case 1.0:
        error.data_type = "payload"
        break
      case 1.1:
      case 1.2:
      case 1.3:
      case 1.4:
      case 1.5:
      case 1.6:
      case 1.7:
        error.data_type = "raw_data"
        error.parameters = database.getProcedureParameters(
          error.data_name,
          all_parameters
        )
        break
      case 2.5:
      case 2.6:
      case 2.7:
      case 2.8:
        error.data_type = "parsed_data"
        error.parameters = get_parameter_parsed_data(
          procedure_name,
          all_parameters,
          database
        )
        break
      case 3:
        error.data_type = "module_data"
        error.parameters = get_parameter_module_data(
          procedure_name,
          all_parameters,
          database
        )
        break
      default:
        error.data_type = "unknown priority - now datatype for error"
        break
    }

    let hashID: string = hash({
      name: procedure_name,
      para: error.parameters,
      prio: priority,
    })

    this.log.forEach((logErr: errorDataType) => {
      let hashIDtmp: string = hash({
        name: logErr.data_name,
        para: logErr.parameters,
        prio: logErr.priority,
      })

      if (hashID === hashIDtmp) {
        /* this error already occured. However, we update the occurence of the error */
        logErr.occurence_ts = new Date().getTime()
        save_to_log = false
        return
      }
    })

    if (save_to_log) {
      this.log.push(error)
    }
    return
  }

  /**
   * Updates the @solved_ts timestamp for an error with @errorID in the log
   * @param errorID The specific hash of the error
   * @returns true if an error was successfully marked, false otherwise
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
   * Collects all errors according to a module (= datastructure holding all data for a vis)
   * @param module_name The name of the module we want to look for occured errors
   * @returns List of all errors which affect @module_name
   */
  public getErrorsByModule = (
    module_name: string,
    all_parameters: { [key: string]: string[] }
  ): errorDataType[] => {
    let all_error_hashes: string[] = []

    module_parser[module_name].needed_raw_data.forEach((raw_data: string) => {
      for (let i: number = 0; i < error_prio.raw_data.length; i++) {
        all_error_hashes.push(
          hash({
            name: raw_data,
            para: database.getProcedureParameters(raw_data, all_parameters),
            prio: error_prio.raw_data[i],
          })
        )
      }
    })
    module_parser[module_name].needed_parsed_data.forEach(
      (parsed_data: string) => {
        for (let i: number = 0; i < error_prio.parsed_data.length; i++) {
          all_error_hashes.push(
            hash({
              name: parsed_data,
              para: get_parameter_parsed_data(
                parsed_data,
                all_parameters,
                database
              ),
              prio: error_prio.parsed_data[i],
            })
          )
        }
      }
    )

    all_error_hashes.push(
      hash({
        name: module_name,
        // para: parameters,
        para: get_parameter_module_data(module_name, all_parameters, database),
        prio: 3,
      })
    )

    let module_log: errorDataType[] = []
    for (let i: number = 0; i < all_error_hashes.length; i++) {
      let error = this.getErrorByID(all_error_hashes[i])
      if (error && error.solved_ts === -1) {
        module_log.push(error)
      }
    }
    module_log = module_log.sort(
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
    return module_log
  }

  /**
   * This function deletes all elements in the log and returns them in a separate array
   * Implemented for the logging in data_parser.ts and module_parser.ts
   * @returns An array with the deleted elements of the log
   */
  public clearAndReturnLog = () => {
    return this.log.splice(0, this.log.length)
  }

  /**
   * Sorts the log by occurence of the errors
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
   * Sorts the log by the priority of the errors
   */
  private sortLogByPriority = (): void => {
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

  /**
   * @returns The error log of the class
   */
  public getErrorLog = (): errorDataType[] => {
    return this.log
  }

  /**
   * This function exports all errors (from the start of the server) handled by an Error_Log class in a .log file
   * at ./src/server/logs
   * Note: The function creates one file for each day. The errors are sorted by occurence.
   * Note: The 'solved_ts' property is 'undefined' if the error is unsolved.
   * @param log_name name for the error_log file
   */
  public exportErrorsToFile = (log_name: string): void => {
    const path: string = "./src/server/logs/"

    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true })
    }

    if (this.empty()) {
      // || this.log.length === this.index
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
      for (let i = 0; i < this.log.length; i++) {
        let err_date = new Date(this.log[i].occurence_ts)
          .toISOString()
          .slice(0, 10)
        if (file_date.localeCompare(err_date) !== 0) {
          this.index = i
          break
        }
        stream.write(`data_name: ${this.log[i].data_name}\n`)
        stream.write(`data_type: ${this.log[i].data_type}\n`)
        stream.write(`error: ${JSON.stringify(this.log[i].error_desc)}\n`)
        stream.write(`priority: ${JSON.stringify(this.log[i].priority)}\n`)
        stream.write(`occurence_ts: ${this.log[i].occurence_ts}\n`)
        stream.write(`occurence_date: ${new Date(this.log[i].occurence_ts)}\n`)
        stream.write(`solved_ts: ${this.log[i].solved_ts}\n`)
        stream.write(`solved_date: ${new Date(this.log[i].solved_ts)}\n`)
        stream.write(`parameters: ${JSON.stringify(this.log[i].parameters)}\n`)
        stream.write(
          `--------------------------------------------------------------------\n`
        )
        this.index++
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
   * Prints the log to the console
   * (for debugging)
   */
  public printErrorLog = (): void => {
    this.sortLogByPriority()
    console.log(cli_color.red(" ---------- ErrorLog ---------- "))
    for (let i = 0; i < this.log.length; i++) {
      if (i !== 0) {
        console.log("data_name: ", this.log[i].data_name)
      } else {
        console.log("data_name: ", this.log[i].data_name)
      }
      console.log("data_type: ", this.log[i].data_type)
      console.log("error:     ", this.log[i].error_desc)
      console.log("priority:  ", this.log[i].priority)
      console.log("occurence: ", this.log[i].occurence_ts)
      console.log("solved_ts: ", this.log[i].solved_ts)
      console.log(" ------------------------------ ")
    }
    console.log(cli_color.red(" ------- End of ErrorLog ------ "))
  }
}
