import * as cli_color from "cli-color"
import { printArrayInColor } from "./utilities/cli_printing"
import { Socket } from "socket.io"
import CONFIG from "./config"
import module_parser from "./module_parser"
import data_parser from "./data_parser"
import {
  DataCache,
  cacheDatatype,
  checkMemorySize,
  _module_data,
  _parsed_data,
  _raw_data,
} from "./cache"
import { errorDataType, error_description, Error_Log } from "./error_log"
import { AbstractDataSource } from "./data_io/abstract_data_provider"
import { ensureIsValid } from "./data_io/types"
import hash = require("object-hash")
import { resolveDataSource } from "./data_io/select_data_source"
const schedule = require("node-schedule")

/* Init of the cache */
let cache = new DataCache()
/* logging for external file */
let logger = new Error_Log()

// Init of the datasource, dependend on a .env variable
export const database: AbstractDataSource = resolveDataSource(CONFIG.datasource)

// the "target" data base, because other databases have other parameter requirements for the data request
// but data should get hashed according to the parameters of the production system
export const target_production_database: AbstractDataSource =
  resolveDataSource("rest")

/**
 * Works as array.includes but for our datastructure which holds objects
 * @param data_name name of raw_data, parsed_data or module_data
 * @param open_modules_list the list you want to check if it includes @param data_name
 * @returns true if open_modules_list includes data_name, false otherwise
 */
const includes_data = (
  data_name: string,
  open_modules_list: any[]
): boolean => {
  for (let i: number = 0; i < open_modules_list.length; i++) {
    if (open_modules_list[i].name === data_name) {
      return true
    }
  }
  return false
}

/* for parallelization */
type dataStructureCacheFlow = {
  open_modules_raw_data: _raw_data[]
  not_open_modules_raw_data: _raw_data[]
  open_modules_parsed_data: _parsed_data[]
  not_open_modules_parsed_data: _parsed_data[]
  open_modules_module_data: _module_data[]
  not_open_modules_module_data: _module_data[]
}

/**
 * This class receives a websocket "port" and then listens for connections. To these connections, it offers access to
 * the various data sources that there are.
 *
 * New connections will first trigger a call to #onConnected, which (among others) registers a handler for the channel
 * `"getData"`. See #onGetData for the functionality provided via that channel.
 *
 * The class also handles the data pipeline including:
 * - call the raw_data from various data sources
 * - trigger the data preprocessing procedures at data_parser.ts
 * - trigger the calculation of the vis data at module_parser.ts
 * - error logging
 * - save data to the cache & access it
 * - parallelization of the procedures
 */
export class WebsocketApi {
  private moduleData: dataStructureCacheFlow
  private req_not_open_modules: boolean

  /**
   * Creates a new listener for connections arriving on the given server.
   *
   * @param server the server to listen on
   */
  public constructor(server: SocketIO.Server) {
    server.on("connection", this.onConnected)
    this.moduleData = {
      open_modules_raw_data: [],
      not_open_modules_raw_data: [],
      open_modules_parsed_data: [],
      not_open_modules_parsed_data: [],
      open_modules_module_data: [],
      not_open_modules_module_data: [],
    }

    this.req_not_open_modules = true

    if (CONFIG.datasource === "rest") {
      // get the OutbreakDetectionConfigurations from the restAPI on server start
      this.getDataFromSource("OutbreakDetectionConfigurations", {})

      /* 
     # * * * * *  command to execute
     # │ │ │ │ │
     # │ │ │ │ │
     # │ │ │ │ └───── day of week (0 - 6) (0 to 6 are Sunday to Saturday, or use names; 7 is Sunday, the same as 0)
     # │ │ │ └────────── month (1 - 12)
     # │ │ └─────────────── day of month (1 - 31)
     # │ └──────────────────── hour (0 - 23)
     # └───────────────────────── min (0 - 59) 
     */
      let req_time = CONFIG.daily_req.split(":")
      schedule.scheduleJob(`${req_time[1]} ${req_time[0]} * * *`, () => {
        this.get_daily_OutbreakDetectionConfigurations(server)
      })
    }
  }

  /**
   * Called when a new connection was established. Registers all other listeners.
   *
   * @param client the new client
   */
  private onConnected = (client: Socket): void => {
    if (!CONFIG.is_testing) {
      const clientConnected = [
        "┌──────────────────────────────────────┐",
        "│ New client connected!                │",
        "└──────────────────────────────────────┘",
      ]
      printArrayInColor(clientConnected, cli_color.white)
    }
    client.on("getSmicsPort", () => {
      let smics_port = this.getSmicsPort()
      console.log("Sending Smics-Port from .env file", smics_port)
      client.emit("smics_port", smics_port)
    })

    client.on("disconnect", this.onDisconnected)
    client.on("error", this.onError)
    client.on("getVisData", (data) => this.onGetVisData(client, data))
    client.on("clearCache", cache.clearCache)
    client.on("getCacheData", () => {
      client.emit("cacheData", cache.getCache())
      // this is only temporary, the fronted has no button to export errors
      if (CONFIG.use_logging) {
        logger.exportErrorsToFile("errorLog")
      }
    })
    client.on("get_contact_patient_list", async (payload: any) => {
      let { frontend_parameters, all_parameters } = payload
      // TODO Call the ContactNetDegreeFunction
      // TODO make list of patients comming back
      // TODO       - this hast to be split depending on SQL/REST !!!
      // TODO       - SQL Version is already implemented somewhere
      // TODO       - REST Version: go through Bewegungen and Labordaten
      // TODO merge/add this lsit to old_parameters.patients
      // TODO send the new parameter-object to client; client has to do the usual data request with it

      console.log(`
      
      
      
      
      
          contact patient list print (patients received from contact nth degree)
      
      
      `)
      // TODO: erst abchecken obs ium cache lieggt; siehe getDataFromSource -> Inhalt davon
      let procedureName = "Contact_NthDegree_TTKP_Degree"

      if (CONFIG.datasource === "hmhdnov18_sql") {
        all_parameters.starttime = "2010-01-01"
        all_parameters.endtime = "2020-01-01"
      }

      let parameters: any = database.getProcedureParameters(
        procedureName,
        all_parameters
      )

      let hashParameters: {
        [key: string]: string[]
      } = target_production_database.getProcedureParameters(
        procedureName,
        all_parameters
      )

      let hashID: string = hash({
        name: procedureName,
        para: hashParameters,
      })

      /* Request the data if it isn't cached */
      if (!cache.isInCache(hashID)) {
        console.log("[2]: Not cached.")
        // TODO
        // this.getDataFromSource(
        //   procedureName,
        //   all_parameters,
        //   client,
        //   raw_data,
        //   not_open_modules
        // )

        let req_parameters: any = JSON.parse(JSON.stringify(all_parameters))

        let procedureParameters = database.getProcedureParameters(
          procedureName,
          req_parameters
          // all_parameters
        )

        let hashParameters = target_production_database.getProcedureParameters(
          procedureName,
          all_parameters
        )

        let tmpCacheObject: cacheDatatype = {
          data_name: procedureName,
          data_type: "raw_data",
          hashID: hash({
            name: procedureName,
            para: hashParameters,
          }),
          created_ts: new Date().getTime(),
          refresh_ts: new Date().getTime(),
          error: undefined,
          data: undefined,
          parameters: procedureParameters,
        }

        // this is the promise that (might) hold the data we want to return
        await database
          .callByName(procedureName, procedureParameters)
          // success
          .then(async (value) => {
            console.log(
              cli_color.green(
                `[getDataFromSource]: Succesfull data request for ${procedureName}.`
              )
            )

            // create the correct datatype for the cache
            tmpCacheObject.data = await database.mapping(
              procedureName,
              value,
              all_parameters
            )

            // check 'value' for error message
            if (value.success === false) {
              tmpCacheObject.error = value.errorMessage.toString()
              tmpCacheObject.data = {
                raw_data: value,
                error: value.errorMessage.toString(),
              }
              console.log(
                cli_color.red(
                  "[getDataFromSource]: The received data could be incorrect."
                )
              )
              // we have an issue in the received data --> save it to the log
              logger.addError(
                procedureName,
                all_parameters,
                1.1,
                value.errorMessage.toString()
              )
            }
          })
          // failure, save the error, we deal with it later
          .catch((api_error) => {
            console.log(
              cli_color.red(
                `[getDataFromSource]: Data request for ${procedureName} failed. ${api_error}`
              )
            )
            tmpCacheObject.error = api_error.toString()
            tmpCacheObject.data = { error: api_error.toString() }

            logger.addError(
              procedureName,
              all_parameters,
              1.1,
              api_error.toString()
            )
          })

        await cache
          .saveDataToCache(tmpCacheObject)
          .then((msg) => {
            console.log(msg)
            this.error_handler(procedureName, all_parameters)
          })
          .catch((msg) => {
            console.log(msg)
          })
      } else {
        console.log("[2]: Raw_data is cached.")
        /* validate the cache data */
        if (cache.validateCacheData(cache.getDataFromCache(hashID)) === true) {
          console.log("[2]: No error in the cached raw_data.")
          cache.setTimestamp(hashID)
          // we have valid data in the cache, update the datastructure
        } else {
          // TODO: Delete error data an send new request ?
          console.log("[2]: We got an error in the raw_data.")
          // add an error to the log
          logger.addError(
            procedureName,
            all_parameters,
            1.1,
            `Error: raw_data '${procedureName}' is not cached.`
          )
        }
      }
      let cached_data: any = cache.getDataFromCache(hashID)
      let contact_patients: any = cached_data.data.contact_patients

      let new_patients: any = []

      let old_patient_list: any =
        frontend_parameters.patientList_string.split(",")

      contact_patients.forEach((cp: any) => {
        if (!old_patient_list.includes(cp)) {
          frontend_parameters.patientList_string += "," + cp
          new_patients.push(cp)
        }
      })

      // TODO patienten aus daten rauslesen in rest
      client.emit("new_parameters", {
        frontend_parameters,
        contact_patients,
        new_patients,
      })
    })

    // get the 'OutbreakDetectionConfigurations' and emit it to the new client
    let data = cache.getDataFromCache(
      hash({ name: "OutbreakDetectionConfigurations", para: {} })
    )
    if (cache.validateCacheData(data)) {
      console.log(
        cli_color.white(
          "[onConnected]: Emitting `OutbreakDetectionConfigurations` to new client."
        )
      )
      client.emit("OutbreakDetectionConfigurations", data)
    } else {
      console.log(
        cli_color.white(
          "[onConnected]: Error in the config-data. Sending new request.."
        )
      )

      cache.deleteDataFromCache(
        hash({ name: "OutbreakDetectionConfigurations", para: {} })
      )

      this.getDataFromSource("OutbreakDetectionConfigurations", {}, client)
    }
  }

  /**
   * Called when a client disconnected.
   */
  private onDisconnected = (): void => {
    if (!CONFIG.is_testing) {
      const clientDisconnected = [
        "┌──────────────────────────────────────┐",
        "│ Client disconnected!                 │",
        "└──────────────────────────────────────┘",
      ]
      printArrayInColor(clientDisconnected, cli_color.yellow)
    }
  }

  private getSmicsPort = (): number => {
    return CONFIG.smics_port
  }

  /**
   * Called when an error occurred with a specific client.
   */
  private onError = (errorCode: number, errorMessage: string): void => {
    if (!CONFIG.is_testing) {
      const message = [
        "┌──────────────────────────────────────┐",
        `│ An error occurred: code = ${errorCode} / message = "${errorMessage}"`,
        "└──────────────────────────────────────┘",
      ]
      printArrayInColor(message, cli_color.red)
    }
  }

  /**
   * This functions is called when the server is started (connected to the restapi). Asks for
   * 'OutbreakDetectionConfigurations' at a specific time each day.
   * It also sends the new data to all connected clients.
   * NOTE: The time is declared in the .env file. By default its 6:00 (24h system)
   */
  private get_daily_OutbreakDetectionConfigurations = (
    server: SocketIO.Server
  ) => {
    console.log(
      cli_color.white(
        `[get_daily_OutbreakDetectionConfigurations]: Requesting new config-data..`
      )
    )
    let hashID: string = hash({
      name: "OutbreakDetectionConfigurations",
      para: {},
    })
    if (cache.isInCache(hashID)) {
      cache.deleteDataFromCache(hashID)
    }
    // What to do if we delete valid config-data from the cache and fetch invalid data from the api?
    // -> we changed valid data with invalid data: lose lose situation.
    this.getDataFromSource("OutbreakDetectionConfigurations", {})

    console.log(
      cli_color.white(
        `[get_daily_OutbreakDetectionConfigurations]: Emiting new config-data to all connected clients..`
      )
    )
    // TODO: place the server.emit to the getDataFromSource() fct.
    server.emit(
      "OutbreakDetectionConfigurations",
      cache.getDataFromCache(
        hash({
          name: "OutbreakDetectionConfigurations",
          para: {},
        })
      )
    )

    return
  }

  /**
   * This function requests data from a source and saves it to the cache
   * Note: The fct has different behaviours, dependend on the optional parameters
   * ! client && parallelization_obj -> pipeline is triggerd !
   * ! client && !parallelization_obj -> pipeline is NOT triggered & fct emit the received raw_data to the client
   * @param procedureName procedure to call at the database
   * @param all_parameters the request parameters which are sent by client
   * @param client The client who asked for the vis-data
   * @param parallelization_obj the object to update the status of the procedure in the pipeline
   * @param not_open_modules Should be true to request data for not_open_modules
   */
  private getDataFromSource = async (
    procedureName: string,
    all_parameters: { [key: string]: string[] },
    client?: Socket,
    parallelization_obj?: _raw_data,
    not_open_modules?: boolean
  ) => {
    if (!CONFIG.is_testing) {
      console.log(`[getDataFromSource]: Data request for ${procedureName}`)
    }

    let req_parameters: any = JSON.parse(JSON.stringify(all_parameters))
    if (
      procedureName === "Contact_NthDegree_TTKP_Degree" &&
      CONFIG.datasource === "hmhdnov18_sql"
    ) {
      req_parameters.starttime = "2010-01-01"
      req_parameters.endtime = "2020-01-01"
    }

    let procedureParameters = database.getProcedureParameters(
      procedureName,
      req_parameters
      // all_parameters
    )

    let hashParameters = target_production_database.getProcedureParameters(
      procedureName,
      all_parameters
    )

    // update the datastructure for the parallelization
    if (parallelization_obj !== undefined) parallelization_obj.computing = true

    let tmpCacheObject: cacheDatatype = {
      data_name: procedureName,
      data_type: "raw_data",
      hashID: hash({
        name: procedureName,
        para: hashParameters,
      }),
      created_ts: new Date().getTime(),
      refresh_ts: new Date().getTime(),
      error: undefined,
      data: undefined,
      parameters: procedureParameters,
    }

    // this is the promise that (might) hold the data we want to return
    await database
      .callByName(procedureName, procedureParameters)
      // success
      .then(async (value) => {
        console.log(
          cli_color.green(
            `[getDataFromSource]: Succesfull data request for ${procedureName}.`
          )
        )
        console.log("@@@@@@@@@@")
        console.log(procedureName)

        // create the correct datatype for the cache
        tmpCacheObject.data = await database.mapping(
          procedureName,
          value,
          all_parameters
        )

        // check 'value' for error message
        if (value.success === false) {
          tmpCacheObject.error = value.errorMessage.toString()
          tmpCacheObject.data = {
            raw_data: value,
            error: value.errorMessage.toString(),
          }
          console.log(
            cli_color.red(
              "[getDataFromSource]: The received data could be incorrect."
            )
          )
          // we have an issue in the received data --> save it to the log
          logger.addError(
            procedureName,
            all_parameters,
            1.1,
            value.errorMessage.toString()
          )
        }
      })
      // failure, save the error, we deal with it later
      .catch((api_error) => {
        console.log(
          cli_color.red(
            `[getDataFromSource]: Data request for ${procedureName} failed. ${api_error}`
          )
        )
        tmpCacheObject.error = api_error.toString()
        tmpCacheObject.data = { error: api_error.toString() }

        logger.addError(
          procedureName,
          all_parameters,
          1.1,
          api_error.toString()
        )
      })

    await cache
      .saveDataToCache(tmpCacheObject)
      .then((msg) => {
        console.log(msg)
        this.error_handler(procedureName, all_parameters)
      })
      .catch((msg) => {
        console.log(msg)
      })

    if (parallelization_obj !== undefined) parallelization_obj.done = true

    // continue with the data pipeline if we have a parallelization object
    // emit data to client if we ONLY have a client (OutbreakDetectionConfigurations)
    if (
      client !== undefined &&
      parallelization_obj !== undefined &&
      not_open_modules !== undefined
    ) {
      this.fire_data_parser(client, all_parameters, not_open_modules)
      this.fire_module_parser(client, all_parameters, not_open_modules)
    } else if (client !== undefined && parallelization_obj === undefined) {
      console.log(
        cli_color.magenta(
          `[getDataFromSource]: Emiting '${procedureName}' to client.`
        )
      )
      client.emit(procedureName, tmpCacheObject)
    }
  }

  /**
   * Calls 'getDataFromSource' for each NOT CACHED raw_data.
   * @param client The client who ask for vis-data
   * @param all_parameters The request parameters, sent by client
   * @param not_open_modules Should be true to request data for not_open_modules
   */
  private get_raw_data = (
    client: Socket,
    all_parameters: { readonly [key: string]: any } = {},
    not_open_modules: boolean
  ) => {
    console.log(cli_color.yellow(" --- [getRawData] --- "))

    const req_raw_data = (
      module_name_raw_data: _raw_data[],
      not_open_modules: boolean
    ) => {
      module_name_raw_data.forEach((raw_data: _raw_data) => {
        let procedureName: string = raw_data.name
        console.log(`[1]: Select parameters for procedure: ${procedureName}`)

        /* Nur die benötigten Parameter nehmen */
        // let parameters: {
        //   [key: string]: string[]
        // }
        let parameters: any = database.getProcedureParameters(
          procedureName,
          all_parameters
        )

        let hashParameters: {
          [key: string]: string[]
        } = target_production_database.getProcedureParameters(
          procedureName,
          all_parameters
        )

        console.log("[2]: Raw_data already cached?")
        let hashID: string = hash({
          name: procedureName,
          para: hashParameters,
        })

        /* Request the data if it isn't cached */
        if (!cache.isInCache(hashID)) {
          console.log("[2]: Not cached.")
          this.getDataFromSource(
            procedureName,
            all_parameters,
            client,
            raw_data,
            not_open_modules
          )
        } else {
          console.log("[2]: Raw_data is cached.")
          /* validate the cache data */
          if (
            cache.validateCacheData(cache.getDataFromCache(hashID)) === true
          ) {
            console.log("[2]: No error in the cached raw_data.")
            cache.setTimestamp(hashID)
            // we have valid data in the cache, update the datastructure
            raw_data.computing = true
            raw_data.done = true
          } else {
            // TODO: Delete error data an send new request ?
            console.log("[2]: We got an error in the raw_data.")
            // add an error to the log
            logger.addError(
              procedureName,
              all_parameters,
              1.1,
              `Error: raw_data '${procedureName}' is not cached.`
            )
          }
        }
      })
    }

    // call the data for not_open_modules after we have all data for open_modules
    if (not_open_modules) {
      req_raw_data(this.moduleData.not_open_modules_raw_data, true)
      this.fire_data_parser(client, all_parameters, true)
      this.fire_module_parser(client, all_parameters, true)
    } else {
      // we need to execute both fct to update the datastructure even if we have all raw_data already in the cache
      req_raw_data(this.moduleData.open_modules_raw_data, false)
      this.fire_data_parser(client, all_parameters, false)
      this.fire_module_parser(client, all_parameters, false)
    }
  }

  /**
   * This function computes the parsed_data with a procedure at data_parser.ts
   * and saves the result to the cache
   * @param parsing_name The procedure name called at data_parser.ts
   * @param all_parameters All request parameters, sent by client
   * @param not_open_modules Should be true to request data for not_open_modules
   * @param client The client who ask for vis-data
   * @param parallelization_obj the object to update the status of the procedure in the pipeline
   */
  private computeParsedData = async (
    parsing_name: string,
    all_parameters: any,
    not_open_modules: boolean,
    client?: Socket,
    parallelization_obj?: _parsed_data
  ) => {
    console.log(` --- [computeParsedData] --- `)
    console.log(
      `[computeParsedData]: Name of the called procedure: ${parsing_name}`
    )

    let input_data: any = {}

    /* get all raw_data for the data_parser procedure */
    console.log("[computeParsedData]: Get all needed raw_data.")
    for (let i = 0; i < data_parser[parsing_name].needed_raw_data.length; i++) {
      let raw_data_name: string = data_parser[parsing_name].needed_raw_data[i]

      let hashParameters: {
        [key: string]: string[]
      } = target_production_database.getProcedureParameters(
        raw_data_name,
        all_parameters
      )

      let tmp_data: any = {
        data: [],
      }

      let raw_data_hashID: string = hash({
        name: raw_data_name,
        para: hashParameters,
      })

      console.log("[1]: raw_data already cached?")

      if (cache.isInCache(raw_data_hashID)) {
        /* raw_data is in cache */
        console.log(`[1]: raw_data ${raw_data_name} is cached`)
        tmp_data.data = cache.getDataFromCache(raw_data_hashID)?.data
        input_data[raw_data_name] = tmp_data.data
        cache.setTimestamp(raw_data_hashID)
        if (!cache.validateCacheData(cache.getDataFromCache(raw_data_hashID))) {
          /* error in the raw_data */
          console.log(`[1]: raw_data ${raw_data_name} has an error.`)
          logger.addError(
            raw_data_name,
            all_parameters,
            1.3,
            `Error: raw_data '${raw_data_name}' is cached but with an error.`
          )
        }
      } else {
        /* raw_data not cached -> save it to log */
        console.log(`[1]: raw_data ${raw_data_name} is not cached.`)
        // TODO: hier nochmal API call ausführen, sonst existiert kein Objekt für data_parser und der crasht?
        // TODO: Oder einen dummy erstellen und diesen dann übergeben. (Ist vllt. besser als neuer call)
        logger.addError(
          raw_data_name,
          all_parameters,
          1.2,
          `Error: raw_data '${raw_data_name}' is not cached.`
        )
      }
    }

    console.log(`[2]: Callback for data_parser[${parsing_name}] ...`)

    const parsed_data = await data_parser[parsing_name].call_function(
      input_data,
      all_parameters
    )

    let tmpCacheObject: cacheDatatype = {
      data_name: parsing_name,
      data_type: "parsed_data",
      hashID: hash({
        name: parsing_name,
        para: get_parameter_parsed_data(
          parsing_name,
          all_parameters,
          target_production_database
        ),
      }),
      created_ts: new Date().getTime(),
      refresh_ts: new Date().getTime(),
      error: undefined,
      data: parsed_data,
      parameters: get_parameter_parsed_data(
        parsing_name,
        all_parameters,
        database
      ),
    }

    /* If there is an error: Set the error-tag and log it */
    if (parsed_data === undefined || parsed_data.return_log.length > 0) {
      tmpCacheObject.error = `Error: an error occured during data_parser[${parsing_name}] procedure. Data could be invalid or incomplete.`

      // tmpCacheObject.data = {
      //   parsed_data,
      //   error: `Error: an error occured during data_parser[${parsing_name}] procedure. Data could be invalid or incomplete.`,
      // }

      tmpCacheObject.data = {
        error: `Error: an error occured during data_parser[${parsing_name}] procedure. Data could be invalid or incomplete.`,
        ...parsed_data,
      }

      /* log the error */
      logger.addError(
        parsing_name,
        all_parameters,
        2.8,
        `Error: an error occured during data_parser[${parsing_name}] procedure. Data could be invalid or incomplete.`
      )

      if (parsed_data !== undefined && parsed_data.return_log > 0) {
        parsed_data.return_log.forEach((err: errorDataType) => {
          logger.addError(
            err.data_name,
            err.parameters,
            err.priority,
            err.error_desc
          )
        })
      }
    }

    await cache
      .saveDataToCache(tmpCacheObject)
      .then((msg) => {
        console.log(msg)
        this.error_handler(parsing_name, all_parameters)
      })
      .catch((msg) => {
        console.log(msg)
      })
    if (parallelization_obj !== undefined && client !== undefined) {
      console.log(
        `[computeParsedData]: Updating parallelization object for ${parallelization_obj.name}`
      )
      parallelization_obj.done = true
      this.fire_module_parser(client, all_parameters, not_open_modules)
    }
  }

  /**
   * This function is called after the webserver receives new raw_data. Calls 'computeParsedData'
   * if all needed raw_data for a procedure is available
   * @param client The client who ask for vis-data
   * @param all_parameters The request parameters, sent by client
   * @param not_open_modules Should be true to request data for not_open_modules
   */
  private fire_data_parser = (
    client: Socket,
    all_parameters: { readonly [key: string]: any } = {},
    not_open_modules: boolean
  ) => {
    console.log(cli_color.yellow(" --- [fire_data_parser] --- "))

    // search for the raw_data, check if done === true
    const search_raw_data = (
      module_list_raw_data: _raw_data[],
      parsed_data_required_raw_data: string[]
    ): boolean => {
      for (let j: number = 0; j < module_list_raw_data.length; j++) {
        for (let i: number = 0; i < parsed_data_required_raw_data.length; i++) {
          if (
            module_list_raw_data[j].name === parsed_data_required_raw_data[i]
          ) {
            if (module_list_raw_data[j].done === false) {
              // some raw_data is missing, set all_raw_data to false
              return false
            }
          }
        }
      }
      // all raw_data is .done -> return true
      return true
    }

    const activate_data_parser = (module_list_parsed_data: _parsed_data[]) => {
      /* take each parsed_data structure in open / not_open_modules */
      module_list_parsed_data.forEach((parsed_data: _parsed_data) => {
        console.log(
          `[fire_data_parser]: Trying to activate data_parser for '${parsed_data.name}..'`
        )

        if (parsed_data.computing === true || parsed_data.done === true) {
          console.log(
            `[fire_data_parser]: No need to activate procedure for '${parsed_data.name}'. It's already in progress or done.`
          )
          return
        } else {
          // 'true' if we have all raw_data for the procedure
          let all_raw_data: boolean = search_raw_data(
            this.moduleData.open_modules_raw_data.concat(
              this.moduleData.not_open_modules_raw_data
            ),
            parsed_data.required_raw_data
          )

          /* we have all raw_data. Let's start a data_parser[] procedure */
          if (all_raw_data) {
            console.log(
              `[fire_data_parser]: We have all raw_data for '${parsed_data.name}' !`
            )
            parsed_data.computing = true
            let parsing_name: string = parsed_data.name

            /* we hash parsed_data with all parameters in the payload */
            let hashID: string = hash({
              name: parsing_name,
              para: get_parameter_parsed_data(
                parsing_name,
                all_parameters,
                target_production_database
              ),
            })

            console.log("[1]: parsed_data already cached?")
            if (!cache.isInCache(hashID)) {
              console.log("[1]: Not cached.")
              this.computeParsedData(
                parsing_name,
                all_parameters,
                not_open_modules,
                client,
                parsed_data
              )
            } else {
              /* parsed_data is cached but with an error */
              if (!cache.validateCacheData(cache.getDataFromCache(hashID))) {
                // TODO: Delete error data and compute new
                console.log("[1]: Data is cached but with an error")
                // save the error to the log
                logger.addError(
                  parsing_name,
                  all_parameters,
                  2.8,
                  `Error: parsed_data '${parsing_name}' is cached but with an error.`
                )
              } else {
                /* parsed data is cached, no error */
                console.log("[1]: Data is cached, no error.")
                parsed_data.done = true
              }
              cache.setTimestamp(hashID)
            }
          } else {
            console.log(
              `[fire_data_parser]: Still waiting for some raw_data for '${parsed_data.name}'.. `
            )
            return
          }
        }
      })
    }

    if (not_open_modules) {
      activate_data_parser(this.moduleData.not_open_modules_parsed_data)
    } else {
      activate_data_parser(this.moduleData.open_modules_parsed_data)
    }
  }

  /**
   * This function computes the module_data for a visualization with a procedure at module_parser.ts.
   * It saves the result to the cache and sends it to the client.
   * @param module_name the procedure name called at module_parser.ts
   * @param all_parameters All request parameters. Send by client
   * @param client The client who requested the data
   * @param parallelization_obj the object to update the status of the procedure in the pipeline
   */
  private computeModuleData = (
    module_name: string,
    all_parameters: { readonly [key: string]: any } = {},
    client?: Socket,
    parallelization_obj?: _module_data
  ) => {
    console.log(" --- [computeModuleData] --- ")

    let input_data: any = {}

    /* get all raw_data for the module */
    console.log("[1]: Get all raw_data..")
    for (
      let i = 0;
      i < module_parser[module_name].needed_raw_data.length;
      i++
    ) {
      let raw_data_name: string = module_parser[module_name].needed_raw_data[i]

      let tmp_data: cacheDatatype | undefined

      /* get the procedureArguments for raw_data_name */
      let hashParameters: {
        [key: string]: string[]
      } = target_production_database.getProcedureParameters(
        raw_data_name,
        all_parameters
      )

      /* hash the parameters and check if the data is cached */
      let hashID: string = hash({
        name: raw_data_name,
        para: hashParameters,
      })

      if (cache.isInCache(hashID)) {
        console.log(`[1]: raw_data ${raw_data_name} is cached.`)
        tmp_data = cache.getDataFromCache(hashID)
        input_data[raw_data_name] = tmp_data?.data
        cache.setTimestamp(hashID)

        if (!cache.validateCacheData(cache.getDataFromCache(hashID))) {
          console.log(`[1]: raw_data ${raw_data_name} has an error.`)
          logger.addError(
            raw_data_name,
            all_parameters,
            1.6,
            `Error: raw_data '${raw_data_name}' is cached with an error.`
          )
        }
      } else {
        console.log(`[1]: raw_data ${raw_data_name} is not cached.`)
        logger.addError(
          raw_data_name,
          all_parameters,
          1.5,
          `Error: raw_data '${raw_data_name}' for module_parser[${module_name}] is not cached.`
        )
      }
    }

    /* get all parsed_data for the module */
    console.log("[2]: Get all parsed_data..")
    module_parser[module_name].needed_parsed_data.forEach(
      (parsed_data_name: string) => {
        let tmp_data: cacheDatatype | undefined

        /* get the hash for the data */
        let hashID: string = hash({
          name: parsed_data_name,
          para: get_parameter_parsed_data(
            parsed_data_name,
            all_parameters,
            target_production_database
          ),
        })

        /* check if it is chached */
        if (cache.isInCache(hashID)) {
          console.log(`[2]: parsed_data ${parsed_data_name} is cached.`)
          tmp_data = cache.getDataFromCache(hashID)
          input_data[parsed_data_name] = tmp_data
          cache.setTimestamp(hashID)

          if (!cache.validateCacheData(cache.getDataFromCache(hashID))) {
            console.log(`[2]: parsed_data ${parsed_data_name} has an error.`)
            logger.addError(
              parsed_data_name,
              all_parameters,
              2.6,
              `Error: parsed_data '${parsed_data_name}' is cached with an error.`
            )
          }
        } else {
          console.log(`[2]: parsed_data ${parsed_data_name} is not cached.`)
          logger.addError(
            parsed_data_name,
            all_parameters,
            2.5,
            `Error: parsed_data ${parsed_data_name} for module_parser[${module_name}] is not cached.`
          )
        }
      }
    )
    // get all necesary parameters for the module
    let callback = async (module_data: any) => {
      let tmpCacheObject: cacheDatatype = {
        data_name: module_name,
        data_type: "module_data",
        hashID: hash({
          name: module_name,
          para: get_parameter_module_data(
            module_name,
            all_parameters,
            target_production_database
          ),
        }),
        created_ts: new Date().getTime(),
        refresh_ts: new Date().getTime(),
        error: undefined,
        data: module_data,
        parameters: get_parameter_module_data(
          module_name,
          all_parameters,
          database
        ),
      }

      /* if the module_data is undefined, set an error-tag */
      if (module_data === undefined) {
        logger.addError(
          module_name,
          all_parameters,
          3,
          `Error: module_parser[${module_name}] returned data as 'undefined'.`
        )
      } else {
        if (module_data.return_log !== undefined) {
          /* 1. Make sure that we have a return_log from the procedure
           * 2. Push all occured errors to the stacktrace of the module data
           * 3. Push an prio 3.0 error to the cache log (mark the procedure so the errorHandler computes it new)
           */
          if (module_data.return_log.length > 0) {
            logger.addError(
              module_name,
              all_parameters,
              3,
              `Error: an error occured during module_parser[${module_name}] procedure. Data could be invalid or incomplete.`
            )
            module_data.return_log.forEach((err: errorDataType) => {
              logger.addError(
                err.data_name,
                err.parameters,
                err.priority,
                err.error_desc
              )
            })

            /* get all errors which affect the module */
            let stack_trace: errorDataType[] = logger.getErrorsByModule(
              module_name,
              all_parameters
            )

            let frontendErrorObj = {
              /* the first error in the stack_trace defines the id of the error object */
              user_desc: error_description[stack_trace[0].priority][1],
              dev_desc: error_description[stack_trace[0].priority][0],
              stack_trace,
            }

            tmpCacheObject.error = frontendErrorObj
          }
        }
      }

      await cache
        .saveDataToCache(tmpCacheObject)
        .then((msg) => {
          console.log(msg)
          this.error_handler(module_name, all_parameters)
        })
        .catch((msg) => {
          console.log(msg)
        })

      if (parallelization_obj !== undefined) {
        if (client !== undefined) {
          let loading_status = this.calculate_loading_status(
            parallelization_obj,
            all_parameters
          )
          client.emit(`module_data_loading_status`, loading_status)
        }
        console.log(
          `[computeModuleData]: Updating parallelization object for ${parallelization_obj.name}`
        )
        parallelization_obj.done = true
      }

      if (client !== undefined) {
        let client_data: cacheDatatype | undefined = cache.getDataFromCache(
          tmpCacheObject.hashID
        )
        console.log(
          cli_color.magenta(
            `[computeModuleData]: Emiting data for '${module_name}' to client.`
          )
        )
        // client.emit(module_name, client_data)
        client.emit("new_vis_data", client_data)
      }
    }

    console.log(`[3]: Callback for module_parser[${module_name}]`)
    module_parser[module_name].call_function(
      input_data,
      all_parameters,
      callback
    )
  }

  /**
   * This function is called after the webserver receives raw_data or computed parsed_data. Calls 'computeModuleData'
   * if all needed raw_data & parsed_data for a visualization is available
   * @param client The client who asked for the module_data
   * @param all_parameters The request parameters sent by client
   * @param not_open_modules Should be true to request data for not_open_modules
   */
  private fire_module_parser = (
    client: Socket,
    all_parameters: { readonly [key: string]: any } = {},
    not_open_modules: boolean
  ) => {
    console.log(cli_color.yellow(" --- [fire_module_parser] --- "))
    let finished: boolean = true

    // function to look for the required raw_data, check if done === true
    const search_raw_data = (
      module_list_raw_data: _raw_data[],
      module_data_required_raw_data: string[]
    ): boolean => {
      for (let j: number = 0; j < module_list_raw_data.length; j++) {
        for (let i: number = 0; i < module_data_required_raw_data.length; i++) {
          if (
            module_list_raw_data[j].name === module_data_required_raw_data[i]
          ) {
            if (module_list_raw_data[j].done === false) {
              // some raw_data is missing, set all_raw_data to false
              finished = false
              return false
            }
          }
        }
      }
      return true
    }

    // function to look for the required parsed_data, check if done === true
    const search_parsed_data = (
      module_list_parsed_data: _parsed_data[],
      module_data_required_parsed_data: string[]
    ): boolean => {
      for (let j: number = 0; j < module_list_parsed_data.length; j++) {
        for (
          let i: number = 0;
          i < module_data_required_parsed_data.length;
          i++
        ) {
          if (
            module_list_parsed_data[j].name ===
            module_data_required_parsed_data[i]
          ) {
            if (module_list_parsed_data[j].done === false) {
              // some parsed_data is missing, set all_parsed_data to false
              finished = false
              return false
            }
          }
        }
      }
      return true
    }

    /**
     * @param module_list_module_data open or not_open_modules
     * @param send_data should be true for open_modules, false for not_open_modules
     */
    const activate_module_parser = (
      module_list_module_data: _module_data[],
      send_data: boolean
    ) => {
      module_list_module_data.forEach((module_data: _module_data) => {
        console.log(
          `[fire_module_parser]: Trying to activate module_parser for '${module_data.name}..'`
        )
        if (module_data.computing === true || module_data.done === true) {
          console.log(
            `[fire_module_parser]: No need to activate procedure for '${module_data.name}'. It's already in progress or done.`
          )
          return
        } else {
          let all_raw_data: boolean = search_raw_data(
            this.moduleData.open_modules_raw_data.concat(
              this.moduleData.not_open_modules_raw_data
            ),
            module_data.required_raw_data
          )

          let all_parsed_data: boolean = search_parsed_data(
            this.moduleData.open_modules_parsed_data.concat(
              this.moduleData.not_open_modules_parsed_data
            ),
            module_data.required_parsed_data
          )

          let loading_status = this.calculate_loading_status(
            module_data,
            all_parameters
          )
          client.emit(`module_data_loading_status`, loading_status)

          // fire the module_parser[] procedure if we have all raw & parsed_data
          if (all_raw_data && all_parsed_data) {
            console.log(
              `[fire_module_parser]: We have all raw & parsed_data for '${module_data.name}' !`
            )
            // update the datastructure
            module_data.computing = true

            let module_name: string = module_data.name

            /* Check if the module_data is already cached */
            let hashID: string = hash({
              name: module_name,
              para: get_parameter_module_data(
                module_name,
                all_parameters,
                target_production_database
              ),
            })
            console.log(`[1]: module_data ${module_name} cached?`)

            if (!cache.isInCache(hashID)) {
              console.log("[1]: Not cached.")

              this.computeModuleData(
                module_name,
                all_parameters,
                client,
                module_data
              )
            } else {
              if (!cache.validateCacheData(cache.getDataFromCache(hashID))) {
                console.log("[1]: Data is cached but with an error")
                // TODO: keinen Error setzen, aber Errordaten löschen und module_parser neu anschmeissen?
                // TODO: Dummy erstellen und damit weiterrechnen?
                // add an error to the log
                logger.addError(
                  module_name,
                  all_parameters,
                  3,
                  `Error: module_data '${module_name}' is cached with an error.`
                )
              } else {
                /* no error, get data from cache and emit it to client if the module is in open_modules */
                console.log(cli_color.cyan("[1]: Data is cached, no error."))
                if (send_data) {
                  console.log(
                    cli_color.magenta(
                      `[2]: Emiting data for '${module_name}' to client`
                    )
                  )
                  let module_data: cacheDatatype | undefined =
                    cache.getDataFromCache(hashID)
                  // client.emit(module_name, module_data)
                  client.emit("new_vis_data", module_data)
                }
                // update the datastructure. There was no need to call the module_parser
                module_data.done = true
                cache.setTimestamp(hashID)
              }
            }
          } else {
            console.log(
              `[fire_module_parser]: Still waiting for some raw or parsed_data for '${module_data.name}'.. `
            )
            return
          }
        }
      })
    }

    if (not_open_modules) {
      activate_module_parser(
        this.moduleData.not_open_modules_module_data,
        // false
        true
      )
    } else {
      activate_module_parser(this.moduleData.open_modules_module_data, true)
    }

    if (finished) {
      console.log(
        cli_color.yellow(
          `[fire_module_parser]: Computed all module_data given by the datastructure.`
        )
      )

      if (this.req_not_open_modules) {
        this.req_not_open_modules = false
        console.log(
          cli_color.yellow(
            `[fire_module_parser]: Start to request & compute data for not_open_modules..`
          )
        )
        this.get_raw_data(client, all_parameters, true)
      }
    }
  }

  /**
   * This function receives data requests from the browser app and is looking
   * for all raw_data & parsed_data that is needed to compute the module_data
   * for the vis.
   * Starting point of the data pipeline
   * @param client the client that requested the data will receive the answer
   * @param payload the payload that was sent with the 'getVisData' request
   */
  private onGetVisData = async (
    client: Socket,
    payload: { readonly [key: string]: any } = {}
  ) => {
    checkMemorySize(cache)
    this.req_not_open_modules = true

    console.log("--- [onGetVisData] --- ")
    console.log(`openModuleNames: ${payload.openModuleNames}`)
    console.log(`allModuleNames: ${payload.allModuleNames}`)
    console.log(`load_new: ${payload.load_new}`)

    this.moduleData.open_modules_raw_data = []
    this.moduleData.open_modules_parsed_data = []
    this.moduleData.open_modules_module_data = []

    this.moduleData.not_open_modules_raw_data = []
    this.moduleData.not_open_modules_parsed_data = []
    this.moduleData.not_open_modules_module_data = []

    /* check the parameters for the data requests */
    //#region payload
    console.log("[1]: Payload correct? ")
    /**
     * The server will crash if one of these payload attributes is undefined
     * In this case we return from the function and emit an errorObject to the client
     */
    if (
      payload.openModuleNames === undefined ||
      payload.allModuleNames === undefined ||
      payload.parameters === undefined ||
      payload.openModuleNames === null ||
      payload.allModuleNames === null ||
      payload.parameters === null
    ) {
      console.error(
        `[1]: Fatal Error: 'payload.openModuleNames', 'payload.allModuleNames' or 'payload.parameters' is undefined/null. Can't start the data pipeline..`
      )
      console.log("[1]: Payload is NOT valid.")

      logger.addError(
        "missing_payload_attribute",
        payload.parameters,
        1.0,
        `Error: At least one of 'payload.openModuleNames', 'payload.allModuleNames' or 'payload.parameters' is undefined. Please send a new request with valid payload. `
      )
      client.emit(
        "dataError",
        "Invalid payload, can not request data based on it. Please send a new request with a valid payload."
      )
      return
    }

    /**
     * Default value for the stationlist for the sql db as long
     * as there is no input field in the GUI
     */
    if (
      payload.parameters.stationList &&
      payload.parameters.stationList.length === 0 &&
      CONFIG.datasource === "hmhdnov18_sql"
    )
      payload.parameters.stationList.push("49")

    /**
     * we validate the request parameters against a given schema. There is no need to abort
     * the procedure. We try to get as much data as we can with the parameters we have, which perhaps
     * result in some api errors
     */
    await ensureIsValid("args/Arguments_Payload", payload.parameters)
      .then((data) => {
        console.log(`[1]: Parameters: ${data}`)
        console.log("[1]: Payload is valid.")
      })
      .catch((err) => {
        console.log(`[1]: Parameters: ${JSON.stringify(payload.parameters)}`)
        console.log("[1]: Payload is NOT valid.")
        logger.addError(
          "wrong or missing parameters",
          payload.parameters,
          1.0,
          err.toString()
        )
        client.emit(
          "dataError",
          "Missing or wrong parameter in the payload. Please send a new request with a valid payload."
        )
      })

    //#endregion

    console.log("[2]: --- open modules --- ")

    //#region datastructure
    payload.openModuleNames.forEach((module_name: string) => {
      console.log(`[2]: ${module_name}`)
      let module_data_obj: _module_data = {
        name: module_name,
        required_raw_data: [],
        required_parsed_data: [],
        computing: false,
        done: false,
      }

      module_parser[module_name].needed_raw_data.forEach(
        (raw_data_name: string) => {
          let raw_data_obj: _raw_data = {
            name: raw_data_name,
            computing: false,
            done: false,
          }

          if (
            !includes_data(
              raw_data_obj.name,
              this.moduleData.open_modules_raw_data
            )
          ) {
            this.moduleData.open_modules_raw_data.push(raw_data_obj)
          }

          if (!module_data_obj.required_raw_data.includes(raw_data_name)) {
            module_data_obj.required_raw_data.push(raw_data_name)
          }
        }
      )

      module_parser[module_name].needed_parsed_data.forEach(
        (parsed_data_name: string) => {
          let parsed_data_obj: _parsed_data = {
            name: parsed_data_name,
            computing: false,
            done: false,
            required_raw_data: [],
          }
          data_parser[parsed_data_name].needed_raw_data.forEach(
            (raw_data_name: string) => {
              let raw_data_obj: _raw_data = {
                name: raw_data_name,
                computing: false,
                done: false,
              }

              if (
                !includes_data(
                  raw_data_obj.name,
                  this.moduleData.open_modules_raw_data
                )
              ) {
                this.moduleData.open_modules_raw_data.push(raw_data_obj)
              }
              if (!parsed_data_obj.required_raw_data.includes(raw_data_name)) {
                parsed_data_obj.required_raw_data.push(raw_data_name)
              }
            }
          )
          if (
            !module_data_obj.required_parsed_data.includes(parsed_data_name)
          ) {
            module_data_obj.required_parsed_data.push(parsed_data_name)
          }
          if (
            !includes_data(
              parsed_data_obj.name,
              this.moduleData.open_modules_parsed_data
            )
          ) {
            this.moduleData.open_modules_parsed_data.push(parsed_data_obj)
          }
        }
      )

      if (
        !includes_data(
          module_data_obj.name,
          this.moduleData.open_modules_module_data
        )
      ) {
        this.moduleData.open_modules_module_data.push(module_data_obj)
      }
    })

    console.log("[3]: --- NOT open modules --- ")

    payload.allModuleNames.forEach((module_name: string) => {
      if (
        includes_data(module_name, this.moduleData.open_modules_module_data)
      ) {
        return
      }

      console.log(`[3]: ${module_name}`)

      let module_data_obj: _module_data = {
        name: module_name,
        required_raw_data: [],
        required_parsed_data: [],
        computing: false,
        done: false,
      }

      module_parser[module_name].needed_raw_data.forEach(
        (raw_data_name: string) => {
          let raw_data_obj: _raw_data = {
            name: raw_data_name,
            computing: false,
            done: false,
          }

          if (
            !includes_data(
              raw_data_obj.name,
              this.moduleData.not_open_modules_raw_data
            ) &&
            !includes_data(
              raw_data_obj.name,
              this.moduleData.open_modules_raw_data
            )
          ) {
            this.moduleData.not_open_modules_raw_data.push(raw_data_obj)
          }

          if (!module_data_obj.required_raw_data.includes(raw_data_name)) {
            module_data_obj.required_raw_data.push(raw_data_name)
          }
        }
      )

      module_parser[module_name].needed_parsed_data.forEach(
        (parsed_data_name: string) => {
          let parsed_data_obj: _parsed_data = {
            name: parsed_data_name,
            computing: false,
            done: false,
            required_raw_data: [],
          }
          data_parser[parsed_data_name].needed_raw_data.forEach(
            (raw_data_name: string) => {
              let raw_data_obj: _raw_data = {
                name: raw_data_name,
                computing: false,
                done: false,
              }

              if (
                !includes_data(
                  raw_data_obj.name,
                  this.moduleData.not_open_modules_raw_data
                ) &&
                !includes_data(
                  raw_data_obj.name,
                  this.moduleData.open_modules_raw_data
                )
              ) {
                this.moduleData.not_open_modules_raw_data.push(raw_data_obj)
              }
              if (!parsed_data_obj.required_raw_data.includes(raw_data_name)) {
                parsed_data_obj.required_raw_data.push(raw_data_name)
              }
            }
          )
          if (
            !module_data_obj.required_parsed_data.includes(parsed_data_name)
          ) {
            module_data_obj.required_parsed_data.push(parsed_data_name)
          }
          if (
            !includes_data(
              parsed_data_obj.name,
              this.moduleData.not_open_modules_parsed_data
            ) &&
            !includes_data(
              parsed_data_obj.name,
              this.moduleData.open_modules_parsed_data
            )
          ) {
            this.moduleData.not_open_modules_parsed_data.push(parsed_data_obj)
          }
        }
      )

      if (
        !includes_data(
          module_data_obj.name,
          this.moduleData.not_open_modules_module_data
        ) &&
        !includes_data(
          module_data_obj.name,
          this.moduleData.open_modules_module_data
        )
      ) {
        this.moduleData.not_open_modules_module_data.push(module_data_obj)
      }
    })
    //#endregion

    // console.log("- - - - - - - - - -")
    // console.log("- - - - - - - - - -")
    // console.log(cli_color.red("open_modules_raw_data"))
    // console.log(this.moduleData.open_modules_raw_data)
    // console.log("- - - - - - - - - -")
    // console.log(cli_color.red("open_modules_parsed_data"))
    // console.log(this.moduleData.open_modules_parsed_data)
    // console.log("- - - - - - - - - -")
    // console.log(cli_color.red("open_modules_module_data"))
    // console.log(this.moduleData.open_modules_module_data)
    // console.log("- - - - - - - - - -")
    // console.log("- - - - - - - - - -")

    // console.log(cli_color.red("not_open_modules_raw_data"))
    // console.log(this.moduleData.not_open_modules_raw_data)
    // console.log("- - - - - - - - - -")
    // console.log(cli_color.red("not_open_modules_parsed_data"))
    // console.log(this.moduleData.not_open_modules_parsed_data)
    // console.log("- - - - - - - - - -")
    // console.log(cli_color.red("not_open_modules_module_data"))
    // console.log(this.moduleData.not_open_modules_module_data)
    // console.log("- - - - - - - - - -")
    // console.log("- - - - - - - - - -")

    this.delete_cached_data_by_parameters(payload.parameters, payload.load_new)

    this.get_raw_data(client, payload.parameters, false)
  }

  /**
   * The function marks all errors with corresponding & valid cached data as solved
   */
  private error_handler = async (
    data_name: String,
    all_parameters: { [key: string]: string[] }
  ) => {
    if (!logger.unsolvedErrors()) {
      console.log(
        cli_color.cyan(
          "[errorHandler]: There are no unsolved errors. I'm going back to sleep. :-)"
        )
      )
      return
    }

    let unsolved_errors: errorDataType[] = logger
      .getErrorLog()
      .filter((err) => err.solved_ts === -1 && err.data_name === data_name)

    let solved: number = 0

    for (let error of unsolved_errors) {
      let parameters: { [key: string]: string[] } = all_parameters

      switch (error.priority) {
        case 1.0:
          break
        case 1.1:
        case 1.2:
        case 1.3:
        case 1.4:
        case 1.5:
        case 1.6:
        case 1.7:
          parameters = target_production_database.getProcedureParameters(
            error.data_name,
            all_parameters
          )
          break
        case 2.5:
        case 2.6:
        case 2.7:
        case 2.8:
          parameters = get_parameter_parsed_data(
            error.data_name,
            all_parameters,
            target_production_database
          )
          break
        case 3:
          parameters = get_parameter_module_data(
            error.data_name,
            all_parameters,
            target_production_database
          )
          break
        default:
          error.data_type = "unknown priority - now datatype for error"
          break
      }

      let data_hashID: string = hash({
        name: error.data_name,
        para: parameters,
      })

      // valid data for the corresponding error is cached
      if (cache.validateCacheData(cache.getDataFromCache(data_hashID))) {
        // create hash for error
        let error_hashID: string = hash({
          name: error.data_name,
          para: error.parameters,
          prio: error.priority,
        })
        // mark error as solved
        logger.markErrorSolved(error_hashID)
        solved++
      }
    }

    if (solved === unsolved_errors.length) {
      if (solved > 0) {
        console.log(
          cli_color.cyan(
            `[errorHandler]: Marked all errors according to '${data_name}' as solved! :-)`
          )
        )
      } else {
        console.log(
          cli_color.cyan(
            `[errorHandler]: No errors according to '${data_name}'.`
          )
        )
      }
    } else {
      console.log(
        cli_color.cyan(
          `[errorHandler]:  Couldn't mark all errors according to '${data_name}' as solved! :-(`
        )
      )
    }
    return
  }

  /**
   * This function deletes cached data for @param all_parameters (and ONLY for all_para..) depending on the load_new boolean
   * @param all_parameters all request parameters which are sent by client
   * @param load_new if: true --> delete all cached data | if: false/undefined --> delete all cached data with errors
   */
  private delete_cached_data_by_parameters = (
    all_parameters: { [key: string]: string[] },
    load_new: boolean
  ) => {
    console.log(" --- [delete_cached_data_by_parameters] --- ")

    const delete_for_each_module = (
      module_list_raw_data: _raw_data[],
      module_list_parsed_data: _parsed_data[],
      module_list_module_data: _module_data[]
    ) => {
      module_list_raw_data.forEach((raw_data: _raw_data) => {
        /* get the procedureParameters for the raw_data */
        let hashParameters: {
          [key: string]: string[]
        } = target_production_database.getProcedureParameters(
          raw_data.name,
          all_parameters
        )

        /* get the hash for the data */
        let hashID: string = hash({
          name: raw_data.name,
          para: hashParameters,
        })
        /* delete the data from the cache if load_new is set to true */
        if (cache.isInCache(hashID) && load_new) {
          cache.deleteDataFromCache(hashID)
        } else if (!cache.validateCacheData(cache.getDataFromCache(hashID))) {
          /* delete error data from cache */
          cache.deleteDataFromCache(hashID)
        }
      })

      module_list_parsed_data.forEach((parsed_data: _parsed_data) => {
        /* get the hash for the data */
        let hashID: string = hash({
          name: parsed_data.name,
          para: get_parameter_parsed_data(
            parsed_data.name,
            all_parameters,
            target_production_database
          ),
        })
        /* delete the data from the cache if load_new is set to true*/
        if (cache.isInCache(hashID) && load_new) {
          cache.deleteDataFromCache(hashID)
        } else if (!cache.validateCacheData(cache.getDataFromCache(hashID))) {
          /* delete error data from cache */
          cache.deleteDataFromCache(hashID)
        }
      })

      module_list_module_data.forEach((module_data: _module_data) => {
        /* get the hash for the data */
        let hashID: string = hash({
          name: module_data.name,
          para: get_parameter_module_data(
            module_data.name,
            all_parameters,
            target_production_database
          ),
        })
        /* delete the data from the cache */
        if (cache.isInCache(hashID) && load_new) {
          cache.deleteDataFromCache(hashID)
        } else if (!cache.validateCacheData(cache.getDataFromCache(hashID))) {
          /* delete error data from the cache */
          cache.deleteDataFromCache(hashID)
        }
      })

      return
    }

    delete_for_each_module(
      this.moduleData.open_modules_raw_data,
      this.moduleData.open_modules_parsed_data,
      this.moduleData.open_modules_module_data
    )

    delete_for_each_module(
      this.moduleData.not_open_modules_raw_data,
      this.moduleData.not_open_modules_parsed_data,
      this.moduleData.not_open_modules_module_data
    )
  }

  /**
   * Calculates the loading progress of a visualization module
   * @param module_obj Name of the module to calculate the status for
   * @returns An object containing the progress of the module and detailed information about missing/arrived data
   */
  private calculate_loading_status = (
    module_obj: _module_data,
    parameters: { [key: string]: string[] }
  ): object => {
    const ALL_NEEDED_DATA: number =
      module_obj.required_raw_data.length +
      module_obj.required_parsed_data.length
    let ARRIVED_DATA: number = 0
    let states: object[] = []

    for (let i: number = 0; i < module_obj.required_raw_data.length; i++) {
      this.moduleData.open_modules_raw_data
        .concat(this.moduleData.not_open_modules_raw_data)
        .forEach((raw_data_obj: _raw_data) => {
          if (raw_data_obj.name === module_obj.required_raw_data[i]) {
            let state_obj = {
              name: raw_data_obj.name,
              computing: raw_data_obj.computing,
              done: raw_data_obj.done,
            }
            states.push(state_obj)

            if (raw_data_obj.done === true) ARRIVED_DATA++
          }
        })
    }

    for (let i: number = 0; i < module_obj.required_parsed_data.length; i++) {
      this.moduleData.open_modules_parsed_data
        .concat(this.moduleData.not_open_modules_parsed_data)
        .forEach((parsed_data_obj: _parsed_data) => {
          if (parsed_data_obj.name === module_obj.required_parsed_data[i]) {
            let state_obj = {
              name: parsed_data_obj.name,
              computing: parsed_data_obj.computing,
              done: parsed_data_obj.done,
            }
            states.push(state_obj)

            if (parsed_data_obj.done === true) ARRIVED_DATA++
          }
        })
    }

    const progress: number = ARRIVED_DATA / ALL_NEEDED_DATA

    let module_errors = logger.getErrorsByModule(module_obj.name, parameters)

    let user_description = ""
    let dev_description = ""

    if (module_errors.length > 0) {
      user_description = error_description[module_errors[0].priority][1]
      dev_description = error_description[module_errors[0].priority][0]
    }

    const loading_status_UI = {
      module_name: module_obj.name,
      module_errors,
      // module_errors: [],
      user_description,
      dev_description,
      progress,
      states,
    }

    return loading_status_UI
  }
}

/**
 * This function computes all parameters neccessary to compute the valid hashID for @param parsing_name
 * @param parsing_name The name of the procedure in data_parser.ts
 * @param all_parameters All parameters that come with the payload
 * @param datasource defines for which database the parameter are collected
 * @returns An object with all neccessary parameters for the procedure
 */
export const get_parameter_parsed_data = (
  parsing_name: string,
  all_parameters: { [key: string]: string[] },
  datasource: AbstractDataSource
): { [key: string]: string[] } => {
  let raw_data_list: string[] = []
  let parameters: { [key: string]: string[] } = {}

  data_parser[parsing_name].needed_raw_data.forEach((raw_data: string) => {
    if (!raw_data_list.includes(raw_data)) {
      raw_data_list.push(raw_data)
    }
  })

  raw_data_list.forEach((raw_data: string) => {
    let tmp_list = datasource.getProcedureParameters(raw_data, all_parameters)
    parameters = Object.assign(parameters, tmp_list)
  })

  return parameters
}

/**
 * This function computes all parameters neccessary to compute the valid hashID for @param module_name
 * @param module_name The name of the procedure in module_parser.ts
 * @param all_parameters All parameters that come with the payload
 * @param datasource defines for which database the parameter are collected
 * @returns An object with all neccessary parameters for the procedure
 */
export const get_parameter_module_data = (
  module_name: string,
  all_parameters: { [key: string]: string[] },
  datasource: AbstractDataSource
): { [key: string]: string[] } => {
  let parsed_data_list: string[] = []
  let raw_data_list: string[] = []
  let parameters: { [key: string]: string[] } = {}

  module_parser[module_name].needed_parsed_data.forEach(
    (parsed_data: string) => {
      if (!parsed_data_list.includes(parsed_data)) {
        parsed_data_list.push(parsed_data)
      }
    }
  )

  parsed_data_list.forEach((parsing_name: string) => {
    let tmp = get_parameter_parsed_data(
      parsing_name,
      all_parameters,
      datasource
    )
    parameters = Object.assign(parameters, tmp)
  })

  module_parser[module_name].needed_raw_data.forEach((raw_data: string) => {
    if (!raw_data_list.includes(raw_data)) {
      raw_data_list.push(raw_data)
    }
  })

  raw_data_list.forEach((raw_data: string) => {
    let tmp: { [key: string]: string[] } = {}
    tmp = datasource.getProcedureParameters(raw_data, all_parameters)
    parameters = Object.assign(parameters, tmp)
  })

  return parameters
}
