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
import {
  createError,
  errorDataType,
  error_description,
  Error_Log,
} from "./error_log"
import { RestAPI } from "./data_io/concrete_data_providers/rest_api"
import { AbstractDataSource } from "./data_io/abstract_data_provider"

// import hash from "object-hash"
var hash = require("object-hash")

/* Init of the cache */
let cache = new DataCache()
/* logging for external file */
let ext_log = new Error_Log()

/* Init of all stats for restAPI */
const restDataSource: AbstractDataSource = new RestAPI(CONFIG.rest_api_path)

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
 */
export class WebsocketApi {
  private moduleData: dataStructureCacheFlow
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

    // TODO: @Felix das als REST API Anfrage zuvor machen...
    // - Diese Daten sollen im Cache/Server liegen (Parameterunabhängig, immer)
    // - Anfrage der Daten bei (neu)start des Servers
    // - Neu-Anfrage der Daten einmal am Tag (mit Pascal absprechen, wie das in .env parametrisiert wird)
    // !Client bekommt den .emit mit den Daten, wenn
    // - onConnect (wenn er disconnected und neu connected, bekommt er direkt das update)
    // - Wenn die Daten neu angefragt wurden und das update reinkam --> direkt an ALLE CLIENTS weiter schicken
    client.emit("OutbreakDetectionConfigurations", [
      {
        name: "Config-Name",
        StationID: "Coronastation",
      },
    ])

    client.on("disconnect", this.onDisconnected)
    client.on("error", this.onError)

    client.on("getVisData", (data) => this.onGetVisData(client, data))
    client.on("clearCache", () => {
      cache.clearCache()
    })
    client.on("getCacheData", () => {
      client.emit("cacheData", cache.getCache())
      // this is only temporary, the fronted has no button to export errors
      if (!CONFIG.use_logging) {
        ext_log.exportErrorsToFile("errorLog")
      }
      // commented out to not trigger the req each time the cache btn is clicked
      // this.onGetPredictionData(client)
    })

    // dummy integration for the prediction dashboard
    client.on("dashboard_prediction", () => {
      this.onGetPredictionData(client)
    })
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
   * This function requests data from the rest-api and save it to the cache
   * @param procedureName procedure to call at the rest-api
   * @param all_parameters the request parameters which are sent by client
   */
  private getDataFromREST = async (
    client: Socket,
    procedureName: string,
    all_parameters: { [key: string]: string[] }
  ) => {
    if (!CONFIG.is_testing) {
      console.log(`[getDataFromREST]: Data request for ${procedureName}`)
    }

    let procedureParameters = AbstractDataSource.getProcedureParameters(
      procedureName,
      all_parameters
    )

    // set the computing boolean for 'procedureName' to true
    const set_computing_to_true = (module_list_raw_data: _raw_data[]) => {
      module_list_raw_data.forEach((raw_data: _raw_data) => {
        if (raw_data.name === procedureName) {
          raw_data.computing = true
        }
        return
      })
    }
    // set done boolean for 'procedureName' to true
    const set_done_to_true = (module_list_raw_data: _raw_data[]) => {
      module_list_raw_data.forEach((raw_data: _raw_data) => {
        if (raw_data.name === procedureName) {
          raw_data.done = true
        }
        return
      })
    }

    let is_in_open_modules: boolean = true
    if (includes_data(procedureName, this.moduleData.open_modules_raw_data)) {
      set_computing_to_true(this.moduleData.open_modules_raw_data)
    } else {
      set_computing_to_true(this.moduleData.not_open_modules_raw_data)
      is_in_open_modules = false
    }

    // this is the promise that (might) hold the data we want to return
    await restDataSource
      .callByName(procedureName, procedureParameters)
      // success
      .then(async (value) => {
        console.log(
          cli_color.green(
            `[getDataFromRest]: Succesfull data request for ${procedureName}.`
          )
        )
        console.log("@@@@@@@@@@")
        console.log(procedureName)
        // create the correct datatype for the cache
        let tmpCacheObject: cacheDatatype = {
          data_name: procedureName,
          data_type: "raw_data",
          hashID: hash({
            name: procedureName,
            para: procedureParameters,
          }),
          created_ts: new Date().getTime(),
          refresh_ts: new Date().getTime(),
          error: undefined,
          data: value,
          parameters: procedureParameters,
        }
        // check 'value' for error message
        if (value.success === false) {
          tmpCacheObject.error = value.errorMessage.toString()
          tmpCacheObject.data = { value, error: value.errorMessage.toString() }
          console.log(
            cli_color.red(
              "[getDataFromREST]: The received data could be incorrect."
            )
          )
          // we have an issue in the received data --> save it to the log
          cache.addError(
            createError(
              procedureName,
              procedureParameters,
              1.1,
              value.errorMessage
            )
          )
        }

        // set the done boolean for 'procedureName' to true (we have valid data)
        if (is_in_open_modules) {
          set_done_to_true(this.moduleData.open_modules_raw_data)
        } else {
          set_done_to_true(this.moduleData.not_open_modules_raw_data)
        }

        if (procedureName !== "PredictionDummy") {
          // save the object in the cache
          await cache
            .saveDataToCache(tmpCacheObject)
            .then((msg) => {
              console.log(msg)
            })
            .catch((msg) => {
              console.log(msg)
            })
          //TODO: Felix besprechen ob wir await cache brauchen (weil wir gemerged haben)
          setTimeout(() => {
            this.fire_data_parser(client, all_parameters)
            this.fire_module_parser(client, all_parameters)
          }, 5)
        }
      })
      // failure, save the error, we deal with it later
      .catch(async (api_error) => {
        console.log(
          cli_color.red(
            `[getDataFromRest]: Data request for ${procedureName} failed.`
          )
        )
        let tmpCacheObject: cacheDatatype = {
          data_name: procedureName,
          data_type: "raw_data",
          hashID: hash({
            name: procedureName,
            para: procedureParameters,
          }),
          created_ts: new Date().getTime(),
          refresh_ts: new Date().getTime(),
          error: api_error.toString(),
          data: { error: api_error.toString() },
          parameters: procedureParameters,
        }

        // we set the 'done' boolean to true even if we got error data
        if (is_in_open_modules) {
          set_done_to_true(this.moduleData.open_modules_raw_data)
        } else {
          set_done_to_true(this.moduleData.not_open_modules_raw_data)
        }

        await cache
          .saveDataToCache(tmpCacheObject)
          .then((msg) => {
            console.log(msg)
          })
          .catch((msg) => {
            console.log(msg)
          })
        cache.addError(
          createError(
            procedureName,
            procedureParameters,
            1.1,
            api_error.toString()
          )
        )
        // try to compute as much data as possible even with error data
        this.fire_data_parser(client, all_parameters)
        this.fire_module_parser(client, all_parameters)
      })
  }

  /**
   * Calls 'getDataFromREST' for each NOT CACHED raw_data.
   * @param client The clients who is asking for vis-data
   * @param all_parameters The request parameters which are sent by client
   */
  private get_raw_data = (
    client: Socket,
    all_parameters: { readonly [key: string]: any } = {}
  ) => {
    console.log(cli_color.yellow(" --- [getRawData] --- "))

    const req_raw_data = (module_name_raw_data: _raw_data[]) => {
      module_name_raw_data.forEach((raw_data: _raw_data) => {
        let procedureName: string = raw_data.name
        console.log(`[1]: Select parameters for procedure: ${procedureName}`)
        /* Nur die benötigten Parameter nehmen */
        let parameters: {
          [key: string]: string[]
        } = RestAPI.getProcedureParameters(procedureName, all_parameters)

        console.log("[2]: Raw_data already cached?")
        let hashID: string = hash({
          name: procedureName,
          para: parameters,
        })

        /* Request the data if it isn't cached */
        if (!cache.isInCache(hashID)) {
          console.log("[2]: Not cached.")
          // TODO: Anfragen parallelisieren, berechnen wenn Daten da.
          this.getDataFromREST(client, procedureName, all_parameters)
          // TODO: ErrorLogging in getDataFromRest
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
            cache.addError(
              createError(
                procedureName,
                parameters,
                1.1,
                "raw_data is not cached."
              )
            )
          }
        }
      })
    }

    req_raw_data(this.moduleData.open_modules_raw_data)

    req_raw_data(this.moduleData.not_open_modules_raw_data)

    // we need to execute both fct to update the datastructure even if we have all req data already in the cache
    this.fire_data_parser(client, all_parameters)
    this.fire_module_parser(client, all_parameters)
  }

  /**
   * This function computes the parsed_data with a parsing procedure at data_parser.ts
   * and save the result to the cache
   * @param parsing_name The name of the procedure which will be called from data_parser.ts
   * @param all_parameters All request parameters sent by client
   * @return A Promise with an array including all errors that occured during the procedure
   */
  private computeParsedData = async (
    parsing_name: string,
    all_parameters: any
  ): Promise<errorDataType[]> => {
    console.log(` --- [computeParsedData] --- `)
    console.log(
      `[computeParsedData]: Name of the called procedure: ${parsing_name}`
    )

    let input_data: any = {}
    let error_log: errorDataType[] = []
    let needed_parameters = get_parameter_parsed_data(
      parsing_name,
      all_parameters
    )

    /* get all raw_data for the data_parser procedure */
    console.log("[computeParsedData]: Get all needed raw_data.")
    for (let i = 0; i < data_parser[parsing_name].needed_raw_data.length; i++) {
      let raw_data_name: string = data_parser[parsing_name].needed_raw_data[i]
      let parameters: {
        [key: string]: string[]
      } = RestAPI.getProcedureParameters(raw_data_name, all_parameters)

      let tmp_data: any = {
        data: [],
      }

      let raw_data_hashID: string = hash({
        name: raw_data_name,
        para: parameters,
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
          error_log.push(
            createError(
              raw_data_name,
              parameters,
              1.3,
              cache.getDataFromCache(raw_data_hashID)?.error
            )
          )
        }
      } else {
        /* raw_data not cached -> save it to log */
        console.log(`[1]: raw_data ${raw_data_name} is not cached.`)
        // TODO: hier nochmal API call ausführen, sonst existiert kein Objekt für data_parser und der crasht?
        // TODO: Oder einen dummy erstellen und diesen dann übergeben. (Ist vllt. besser als neuer call)
        error_log.push(
          createError(raw_data_name, parameters, 1.2, "raw_data is not cached.")
        )
      }
    }

    let parsed_data: any = []

    console.log(`[2]: Callback for data_parser[${parsing_name}] ...`)

    parsed_data = data_parser[parsing_name].call_function(
      input_data,
      all_parameters
    )

    let tmpCacheObject: cacheDatatype = {
      data_name: parsing_name,
      data_type: "parsed_data",
      hashID: hash({
        name: parsing_name,
        para: needed_parameters,
      }),
      created_ts: new Date().getTime(),
      refresh_ts: new Date().getTime(),
      error: undefined,
      data: parsed_data,
      parameters: needed_parameters,
    }

    /* If there is an error: Set the error-tag and log it */
    if (parsed_data === undefined || parsed_data.return_log.length > 0) {
      tmpCacheObject.error = createError(
        parsing_name,
        needed_parameters,
        2.8,
        parsed_data.return_log
      )

      /* log the error */
      error_log.push(
        createError(
          parsing_name,
          needed_parameters,
          2.8,
          parsed_data.return_log
        )
      )

      if (parsed_data !== undefined) {
        parsed_data.return_log.forEach((err: errorDataType) => {
          error_log.push(err)
        })
      }
    }

    await cache
      .saveDataToCache(tmpCacheObject)
      .then((msg) => {
        console.log(msg)
      })
      .catch((msg) => {
        console.log(msg)
      })

    return new Promise<errorDataType[]>((resolve) => {
      resolve(error_log)
    })
  }

  /**
   * This function is called after the webserver receives raw_data. Calls 'computeParsedData'
   * if all needed raw_data is available
   * @param all_parameters The request parameters which are sent by the client
   */
  private fire_data_parser = (
    client: Socket,
    all_parameters: { readonly [key: string]: any } = {}
  ) => {
    console.log(cli_color.yellow(" --- [fire_data_parser] --- "))

    const activate_data_parser = (module_list_parsed_data: _parsed_data[]) => {
      // 'true' if we have all raw_data for the procedure
      let all_raw_data: boolean = true

      // search for the raw_data, check if done === true
      const search_raw_data = (
        module_list_raw_data: _raw_data[],
        parsed_data_required_raw_data: string
      ) => {
        for (let j: number = 0; j < module_list_raw_data.length; j++) {
          if (module_list_raw_data[j].name === parsed_data_required_raw_data) {
            if (module_list_raw_data[j].done === false) {
              // some raw_data is missing, set all_raw_data to false
              all_raw_data = false
            }
          }
        }
      }

      /* take each parsed_data structure in open / not_open_modules */
      module_list_parsed_data.forEach(async (parsed_data: _parsed_data) => {
        console.log(
          `[fire_data_parser]: Trying to activate data_parser for '${parsed_data.name}..'`
        )
        if (parsed_data.computing === true || parsed_data.done === true) {
          console.log(
            `[fire_data_parser]: No need to activate procedure for '${parsed_data.name}'. It's already in progress or done.`
          )
          return
        } else {
          for (
            let i: number = 0;
            i < parsed_data.required_raw_data.length;
            i++
          ) {
            /* true if the checked raw_data is in open_modules, false otherwise */
            let raw_data_open: boolean = true

            // check if the raw_data structure you need to look at is in open or not_open modules..
            if (
              !includes_data(
                parsed_data.required_raw_data[i],
                this.moduleData.open_modules_raw_data
              )
            ) {
              raw_data_open = false
            }

            if (raw_data_open) {
              search_raw_data(
                this.moduleData.open_modules_raw_data,
                parsed_data.required_raw_data[i]
              )
            } else {
              search_raw_data(
                this.moduleData.not_open_modules_raw_data,
                parsed_data.required_raw_data[i]
              )
            }
          }

          /* we have all raw_data. Let's start a data_parser[] procedure */
          if (all_raw_data) {
            console.log(
              `[fire_data_parser]: We have all raw_data for '${parsed_data.name}' !`
            )
            parsed_data.computing = true
            let parsing_name: string = parsed_data.name

            let needed_parameters = get_parameter_parsed_data(
              parsing_name,
              all_parameters
            )

            /* we hash parsed_data with all parameters in the payload */
            let hashID: string = hash({
              name: parsing_name,
              para: needed_parameters,
            })

            console.log("[1]: parsed_data already cached?")
            if (!cache.isInCache(hashID)) {
              console.log("[1]: Not cached.")
              this.computeParsedData(parsing_name, all_parameters).then(
                (log) => {
                  // we need a promise to make sure that we have the computed
                  // data in the cache before we can set done = true !
                  parsed_data.done = true
                  log.forEach((err: errorDataType) => {
                    cache.addError(err)
                  })
                  this.fire_module_parser(client, all_parameters)
                }
              )
            } else {
              /* parsed_data is cached but with an error */
              if (!cache.validateCacheData(cache.getDataFromCache(hashID))) {
                // TODO: Delete error data and compute new
                console.log("[1]: Data is cached but with an error")
                // save the error to the log
                cache.addError(
                  createError(
                    parsing_name,
                    needed_parameters,
                    2.8,
                    cache.getDataFromCache(hashID)?.error
                  )
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
        // make sure that the boolean is set back to false after the loop finished one parsed_data structure
        all_raw_data = true
      })
    }

    activate_data_parser(this.moduleData.open_modules_parsed_data)
    activate_data_parser(this.moduleData.not_open_modules_parsed_data)
  }

  /**
   * This function computes the needed data for one vis-module
   * and send it to the client
   * @param client The client who is asking for the data
   * @param module_name Name of the vis-module
   * @param all_parameters All request parameters. Send by client
   * @param stack_trace Array of all errors which are neccessary for the module and already occured
   * @param send_data If this is set to 'true' we emit the vis data to the client
   * @return A Promise with an array including all errors that occured during the procedure
   */
  private computeModuleData = (
    client: Socket,
    module_name: string,
    all_parameters: { readonly [key: string]: any } = {},
    stack_trace: errorDataType[],
    send_data: Boolean
  ): Promise<errorDataType[]> => {
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
      let parameters: {
        [key: string]: string[]
      } = RestAPI.getProcedureParameters(raw_data_name, all_parameters)

      /* hash the parameters and check if the data is cached */
      let hashID: string = hash({
        name: raw_data_name,
        para: parameters,
      })

      if (cache.isInCache(hashID)) {
        console.log(`[1]: raw_data ${raw_data_name} is cached.`)
        tmp_data = cache.getDataFromCache(hashID)
        input_data[raw_data_name] = tmp_data?.data
        cache.setTimestamp(hashID)

        if (!cache.validateCacheData(cache.getDataFromCache(hashID))) {
          let raw_data: cacheDatatype | undefined =
            cache.getDataFromCache(hashID)
          console.log(`[1]: raw_data ${raw_data_name} has an error.`)
          stack_trace.push(
            createError(raw_data_name, parameters, 1.6, raw_data?.error)
          )
        }
      } else {
        console.log(`[1]: raw_data ${raw_data_name} is not cached.`)
        stack_trace.push(
          createError(
            raw_data_name,
            parameters,
            1.5,
            `raw_data for module_parser[${module_name}] is not cached.`
          )
        )
      }
    }

    /* get all parsed_data for the module */
    console.log("[2]: Get all parsed_data..")
    module_parser[module_name].needed_parsed_data.forEach(
      (parsed_data_name: string) => {
        let tmp_data: cacheDatatype | undefined
        let needed_parameters_parsed_data = get_parameter_parsed_data(
          parsed_data_name,
          all_parameters
        )

        /* get the hash for the data */
        let hashID: string = hash({
          name: parsed_data_name,
          para: needed_parameters_parsed_data,
        })

        /* check if it is chached */
        if (cache.isInCache(hashID)) {
          console.log(`[2]: parsed_data ${parsed_data_name} is cached.`)
          tmp_data = cache.getDataFromCache(hashID)
          input_data[parsed_data_name] = tmp_data
          cache.setTimestamp(hashID)

          if (!cache.validateCacheData(cache.getDataFromCache(hashID))) {
            let parsed_data: cacheDatatype | undefined =
              cache.getDataFromCache(hashID)
            console.log(`[2]: parsed_data ${parsed_data_name} has an error.`)
            stack_trace.push(
              createError(
                parsed_data_name,
                needed_parameters_parsed_data,
                2.6,
                parsed_data?.error
              )
            )
          }
        } else {
          console.log(`[2]: parsed_data ${parsed_data_name} is not cached.`)
          stack_trace.push(
            createError(
              parsed_data_name,
              needed_parameters_parsed_data,
              2.5,
              `parsed_data for module_parser[${module_name}] is not cached.`
            )
          )
        }
      }
    )
    // get all parameters which are neccessary for the module
    let needed_parameters = get_parameter_module_data(
      module_name,
      all_parameters
    )

    let callback = (module_data: any) => {
      let tmpCacheObject: cacheDatatype = {
        data_name: module_name,
        data_type: "module_data",
        hashID: hash({
          name: module_name,
          para: needed_parameters,
        }),
        created_ts: new Date().getTime(),
        refresh_ts: new Date().getTime(),
        error: undefined,
        data: module_data,
        parameters: needed_parameters,
      }

      /* if the module_data is undefined, set an error-tag */
      if (module_data === undefined || module_data.return_log.length > 0) {
        if (module_data !== undefined) {
          module_data.return_log.forEach((err: errorDataType) => {
            stack_trace.push(err)
          })
        }

        stack_trace.push(
          createError(module_name, needed_parameters, 3, module_data.return_log)
        )

        let frontendErrorObj = {
          /* the first error in the stack_trace defines the id of the error object */
          errorID: stack_trace[0].priority,
          user_desc: error_description[stack_trace[0].priority][2],
          dev_desc:
            error_description[stack_trace[0].priority][0] +
            error_description[stack_trace[0].priority][1],
          stack_trace,
        }

        tmpCacheObject.error = frontendErrorObj
      }

      cache
        .saveDataToCache(tmpCacheObject)
        .then((msg) => {
          console.log(msg)
        })
        .catch((msg) => {
          console.log(msg)
        })

      if (send_data) {
        let client_data: cacheDatatype | undefined = cache.getDataFromCache(
          tmpCacheObject.hashID
        )
        console.log(
          cli_color.magenta("[computeModuleData]: Emiting data to client.")
        )
        client.emit(module_name, client_data)
      }
    }

    console.log(`[3]: Callback for module_parser[${module_name}]`)
    module_parser[module_name].call_function(
      input_data,
      all_parameters,
      callback
    )

    return new Promise<errorDataType[]>((resolve) => {
      resolve(stack_trace)
    })
  }

  /**
   * This function is called after the webserver receives raw_data. Calls 'computeModuleData'
   * if all needed raw_data & parsed_data is available
   * @param client The client who receives the module_data
   * @param all_parameters The request parameters which are sent by client
   */
  private fire_module_parser = (
    client: Socket,
    all_parameters: { readonly [key: string]: any } = {}
  ) => {
    console.log(cli_color.yellow(" --- [fire_module_parser] --- "))

    /**
     * @param module_list_module_data open or not_open_modules
     * @param send_data should be true for open_modules, false for not_open_modules
     */
    const activate_module_parser = (
      module_list_module_data: _module_data[],
      send_data: boolean
    ) => {
      let all_raw_data: boolean = true
      let all_parsed_data: boolean = true

      // function to look for the required raw_data, check if done === true
      const search_raw_data = (
        module_list_raw_data: _raw_data[],
        module_data_required_raw_data: string
      ) => {
        for (let j: number = 0; j < module_list_raw_data.length; j++) {
          if (module_list_raw_data[j].name === module_data_required_raw_data) {
            if (module_list_raw_data[j].done === false) {
              // some raw_data is missing, set all_raw_data to false
              all_raw_data = false
            }
          }
        }
      }

      // function to look for the required parsed_data, check if done === true
      const search_parsed_data = (
        module_list_parsed_data: _parsed_data[],
        module_data_required_parsed_data: string
      ) => {
        for (let j: number = 0; j < module_list_parsed_data.length; j++) {
          if (
            module_list_parsed_data[j].name === module_data_required_parsed_data
          ) {
            if (module_list_parsed_data[j].done === false) {
              // some parsed_data is missing, set all_parsed_data to false
              all_parsed_data = false
            }
          }
        }
      }

      module_list_module_data.forEach(async (module_data: _module_data) => {
        console.log(
          `[fire_module_parser]: Trying to activate module_parser for '${module_data.name}..'`
        )
        if (module_data.computing === true || module_data.done === true) {
          console.log(
            `[fire_module_parser]: No need to activate procedure for '${module_data.name}'. It's already in progress or done.`
          )
          return
        } else {
          // check for all required raw_data
          for (
            let i: number = 0;
            i < module_data.required_raw_data.length;
            i++
          ) {
            /* true if the checked raw_data is in open_modules, false otherwise */
            let raw_data_open: boolean = true
            if (
              !includes_data(
                module_data.required_raw_data[i],
                this.moduleData.open_modules_raw_data
              )
            ) {
              raw_data_open = false
            }

            if (raw_data_open) {
              search_raw_data(
                this.moduleData.open_modules_raw_data,
                module_data.required_raw_data[i]
              )
            } else {
              search_raw_data(
                this.moduleData.not_open_modules_raw_data,
                module_data.required_raw_data[i]
              )
            }
          }

          // check for all required parsed_data
          for (
            let i: number = 0;
            i < module_data.required_parsed_data.length;
            i++
          ) {
            /* true if the checked parsed_data is in open_modules, false otherwise */
            let parsed_data_open: boolean = true

            if (
              !includes_data(
                module_data.required_parsed_data[i],
                this.moduleData.open_modules_parsed_data
              )
            ) {
              parsed_data_open = false
            }

            if (parsed_data_open) {
              search_parsed_data(
                this.moduleData.open_modules_parsed_data,
                module_data.required_parsed_data[i]
              )
            } else {
              search_parsed_data(
                this.moduleData.not_open_modules_parsed_data,
                module_data.required_parsed_data[i]
              )
            }
          }

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
              para: get_parameter_module_data(module_name, all_parameters),
            })
            console.log(`[1]: module_data ${module_name} cached?`)

            if (!cache.isInCache(hashID)) {
              console.log("[1]: Not cached.")
              this.computeModuleData(
                client,
                module_name,
                all_parameters,
                cache.getErrorsByModule(module_name),
                send_data
              ).then((errors) => {
                // we need a promise to make sure that we have the computed
                // data in the cache before we can set done = true !
                module_data.done = true
                // ! we update the datastructure even if we got error data !

                errors.forEach((err: errorDataType) => {
                  cache.addError(err)
                })
              })
            } else {
              if (!cache.validateCacheData(cache.getDataFromCache(hashID))) {
                console.log("[1]: Data is cached but with an error")
                // TODO: keinen Error setzen, aber Errordaten löschen und module_parser neu anschmeissen?
                // add an error to the log
                cache.addError(
                  createError(
                    module_name,
                    get_parameter_module_data(module_name, all_parameters),
                    3,
                    cache.getDataFromCache(hashID)?.error
                  )
                )
              } else {
                /* no error, get data from cache and emit it to client if the module is in open_modules */
                console.log(cli_color.cyan("[1]: Data is cached, no error."))
                if (send_data) {
                  console.log(cli_color.magenta("[2]: Emiting data to client"))
                  let module_data: cacheDatatype | undefined =
                    cache.getDataFromCache(hashID)
                  client.emit(module_name, module_data)
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
        all_raw_data = true
        all_parsed_data = true
      })
    }

    activate_module_parser(this.moduleData.open_modules_module_data, true)
    activate_module_parser(this.moduleData.not_open_modules_module_data, false)
  }

  /**
   * This function receives data requests from the browser app and is looking
   * for all raw_data & parsed_data that is needed to compute the module_data
   * for the vis
   * @param client the client that requested the data will receive the answer
   * @param payload the payload that was sent with the 'getVisData' request
   */
  private onGetVisData = (
    client: Socket,
    payload: { readonly [key: string]: any } = {}
  ): void => {
    checkMemorySize(cache)

    console.log("\n --- [onGetVisData] --- ")
    console.log(`openModuleNames: ${payload.openModuleNames}`)
    console.log(`allModuleNames: ${payload.allModuleNames}`)
    console.log(`load_new: ${payload.load_new}`)
    console.log(`parameters: ${JSON.stringify(payload.parameters)}`)

    this.moduleData.open_modules_raw_data = []
    this.moduleData.open_modules_parsed_data = []
    this.moduleData.open_modules_module_data = []

    this.moduleData.not_open_modules_raw_data = []
    this.moduleData.not_open_modules_parsed_data = []
    this.moduleData.not_open_modules_module_data = []

    /* check the parameters for the data requests */
    //#region payload
    // TODO: Wenn die Parameter immer die gleichen sind --> prüfe jeden Parameter ob vorhanden und korrekter Datentyp. Error wird spezifischer.
    console.log("[1]: Payload correct? ")
    if (
      typeof payload.parameters !== "object" ||
      payload.parameters === null ||
      payload.parameters === undefined
    ) {
      // check if the parameters have the right datatype
      console.error(
        `[1]: Need to give parameters as a parameter (type: object) but gotten: ${typeof payload.parameters}`
      )
      cache.addError(
        createError(
          "request_parameter",
          payload,
          0.0,
          `Need to give parameters as a parameter (type: object) but gotten: ${typeof payload.parameters}`
        )
      )
    }
    if (Object.keys(payload.parameters).length === 0) {
      // check if we have parameters in the object
      console.error(
        `[1]: The parameter object is empty. Please send a new request with valid parameters.`
      )
      cache.addError(
        createError(
          "request_parameter",
          payload,
          0.0,
          `The parameter object is empty. Please send a new request with valid parameters.`
        )
      )
    }
    if (
      payload.openModuleNames === undefined ||
      payload.allModuleNames === undefined
    ) {
      console.error(
        `[1]: The openModuleNames / allModuleNames are undefined. Please send a new request with valid parameters.`
      )
      cache.addError(
        createError(
          "request_parameter",
          payload,
          0.0,
          `The openModuleNames / allModuleNames objects (type: string[]) are undefined. Please send a new request with valid parameters.`
        )
      )
    }
    if (payload.openModuleNames.length === 0) {
      console.error(`[1]: openModuleNames is empty. No data to emit.`)
      cache.addError(
        createError(
          "request_parameters",
          payload,
          0.0,
          `Need to give at least one module name in payload.openModuleNames.`
        )
      )
    }
    if (payload.allModuleNames.length === 0) {
      console.error(
        `[1]: allModuleNames is empty. There is no data to prepare.`
      )
      cache.addError(
        createError(
          "request_parameters",
          payload,
          0.0,
          `Need to give at least one module name in payload.allModuleNames.`
        )
      )
    }
    if (cache.empty()) {
      console.log("[1]: Payload is valid.")
    }
    //#endregion

    console.log("[2]: --- open modules --- ")

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
      console.log(`[3]: ${module_name}`)
      if (
        includes_data(module_name, this.moduleData.open_modules_module_data)
      ) {
        return
      }

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

    console.log("- - - - - - - - - -")
    console.log("- - - - - - - - - -")
    console.log(cli_color.red("open_modules_raw_data"))
    console.log(this.moduleData.open_modules_raw_data)
    console.log("- - - - - - - - - -")
    console.log(cli_color.red("open_modules_parsed_data"))
    console.log(this.moduleData.open_modules_parsed_data)
    console.log("- - - - - - - - - -")
    console.log(cli_color.red("open_modules_module_data"))
    console.log(this.moduleData.open_modules_module_data)
    console.log("- - - - - - - - - -")
    console.log("- - - - - - - - - -")

    console.log(cli_color.red("not_open_modules_raw_data"))
    console.log(this.moduleData.not_open_modules_raw_data)
    console.log("- - - - - - - - - -")
    console.log(cli_color.red("not_open_modules_parsed_data"))
    console.log(this.moduleData.not_open_modules_parsed_data)
    console.log("- - - - - - - - - -")
    console.log(cli_color.red("not_open_modules_module_data"))
    console.log(this.moduleData.not_open_modules_module_data)
    console.log("- - - - - - - - - -")
    console.log("- - - - - - - - - -")

    this.delete_cached_data_by_parameters(payload.parameters, payload.load_new)

    this.get_raw_data(client, payload.parameters)

    // setTimeout(() => {
    //   this.errorHandler(client, payload.parameters, ext_log)
    // }, 5000)
  }

  /**
   * dummy for the integration of the dashboard. It requests the raw_data for the prediction
   * and triggers data_parser[] and module_parser with the needed_raw & parsed_data
   * @param client The client who requested the data
   */
  private onGetPredictionData = (client: Socket) => {
    if (
      !cache.isInCache(
        hash({
          name: "PredictionDummy",
          para: {},
        })
      )
    ) {
      // req the raw_data "PredictionDummy" from the API, atm. only from example_restapi.json
      this.getDataFromREST(client, "PredictionDummy", {})
    }

    setTimeout(() => {
      // compute data_parser[prediction_data_parser]
      this.computeParsedData("prediction_data_parser", {})
    }, 1000)

    setTimeout(() => {
      let log: errorDataType[] = []
      // compute module_parser[prediction_module_parser]
      // if you want to emit the data to the client --> set the 5th parameter to true!
      this.computeModuleData(client, "prediction_module_parser", {}, log, false)
    }, 2000)

    // TODO: Sollte das hier ernsthaft iwann benötigt werden müssen die timeouts raus!
  }

  /**
   * This function is called after a data request to check and handle all errors
   * that occured during data computation.
   * Note: The function tries to solve each error only once per request to avoid an infinity loop
   * @param client the client that requested the data
   * @param all_parameters The request parameters which are sent by the client
   * @param ext_log error log holding all occured and solved/unsolved errors for persistent logging
   */
  private errorHandler = async (
    client: Socket,
    all_parameters: { [key: string]: string[] },
    ext_log: Error_Log
  ) => {
    console.log(cli_color.cyan(" --- [errorHandler] --- "))
    if (cache.empty()) {
      console.log(
        "[errorHandler]: There are no errors. I'm going back to sleep. :-)"
      )
      console.log(cli_color.cyan(" --- [errorHandler] --- "))
      return
    }

    let error_tmp_log = new Error_Log()

    let error_counter_prio1: number = 0
    let ignore_prio1_err: boolean = false
    const prio1_border: number = cache.getAllPrio1Errors()

    let send_to_client: boolean = false

    while (!cache.empty()) {
      let error = cache.getError()
      let solved: boolean = false

      //let error_copy: errorDataType = JSON.parse(JSON.stringify(error))

      if (error === undefined) {
        continue
      }

      let errorID: string = hash({
        name: error.data_name,
        para: error.parameters,
        prio: error.priority,
      })

      if (!ext_log.logIncludes(errorID)) {
        ext_log.addError(error)
      }

      let procedureName: string = error.data_name
      let procedureParameters: { [key: string]: string[] }
      let case_number: number = Math.floor(error.priority)
      let hashID: string = hash({
        name: procedureName,
        para: error.parameters,
      })

      if (
        includes_data(procedureName, this.moduleData.open_modules_module_data)
      ) {
        send_to_client = true
      }

      if (case_number === 1) {
        if (ignore_prio1_err) {
          continue
        }
        procedureParameters = RestAPI.getProcedureParameters(
          procedureName,
          all_parameters
        )
      } else if (case_number === 2) {
        procedureParameters = get_parameter_parsed_data(
          procedureName,
          all_parameters
        )
      } else if (case_number === 3) {
        procedureParameters = get_parameter_module_data(
          procedureName,
          all_parameters
        )
      } else if (case_number === 0) {
        procedureParameters = all_parameters
      } else {
        procedureParameters = error.parameters
      }

      let hashID_newPara = hash({
        name: procedureName,
        para: procedureParameters,
      })
      console.log(
        cli_color.cyan(
          `[errorHandler]: Trying to fix error for '${procedureName}'..`
        )
      )
      switch (case_number) {
        case 0:
          /* something is wrong with the payload which is send by client. We skip this error marked as solved..*/
          solved = ext_log.markErrorSolved(errorID)

          break
        case 1:
          /* data_request_failed & not_cached error */
          if (
            cache.isInCache(hashID) &&
            !cache.validateCacheData(cache.getDataFromCache(hashID))
          ) {
            cache.deleteDataFromCache(hashID)
          }

          if (!cache.isInCache(hashID_newPara)) {
            // this is the promise that (might) hold the data we want to return
            await restDataSource
              .callByName(procedureName, procedureParameters)
              // success
              .then(async (value) => {
                console.log(
                  cli_color.green(
                    `[errorHandler]: Succesfull data request for ${procedureName}.`
                  )
                )
                console.log("@@@@@@@@@@")
                console.log(procedureName)
                // create the correct datatype for the cache
                let tmpCacheObject: cacheDatatype = {
                  data_name: procedureName,
                  data_type: "raw_data",
                  hashID: hash({
                    name: procedureName,
                    para: procedureParameters,
                  }),
                  created_ts: new Date().getTime(),
                  refresh_ts: new Date().getTime(),
                  error: undefined,
                  data: value,
                  parameters: procedureParameters,
                }
                // check 'value' for error message
                if (value.success === false) {
                  tmpCacheObject.error = value.errorMessage.toString()
                  tmpCacheObject.data = {
                    value,
                    error: value.errorMessage.toString(),
                  }
                  console.log(
                    cli_color.red(
                      "[errorHandler]: The received data could be incorrect."
                    )
                  )
                  // we have an issue in the received data --> save it to the log
                  error_tmp_log.addError(error)
                } else {
                  // mark the error as solved
                  solved = ext_log.markErrorSolved(errorID)
                }
                // save the object in the cache
                await cache
                  .saveDataToCache(tmpCacheObject)
                  .then((msg) => {
                    console.log(msg)
                  })
                  .catch((msg) => {
                    console.log(msg)
                  })
              })
              .catch(async (api_error) => {
                console.log(
                  cli_color.red(
                    `[errorHandler]: Data request for ${procedureName} failed.`
                  )
                )
                let tmpCacheObject: cacheDatatype = {
                  data_name: procedureName,
                  data_type: "raw_data",
                  hashID: hash({
                    name: procedureName,
                    para: procedureParameters,
                  }),
                  created_ts: new Date().getTime(),
                  refresh_ts: new Date().getTime(),
                  error: api_error.toString(),
                  data: { error: api_error.toString() },
                  parameters: procedureParameters,
                }
                await cache
                  .saveDataToCache(tmpCacheObject)
                  .then((msg) => {
                    console.log(msg)
                  })
                  .catch((msg) => {
                    console.log(msg)
                  })
                error_tmp_log.addError(error)
                error_counter_prio1++
              })
          } else {
            // We set the solved_ts because we have valid data in cache
            solved = ext_log.markErrorSolved(errorID)
          }
          break
        case 2:
          /* not_cached & invalid_data error --> parsed_data */
          if (
            cache.isInCache(hashID) &&
            !cache.validateCacheData(cache.getDataFromCache(hashID))
          ) {
            cache.deleteDataFromCache(hashID)
          }

          if (!cache.isInCache(hashID_newPara)) {
            this.computeParsedData(procedureName, all_parameters).then(
              (log) => {
                log.forEach((err) => {
                  error_tmp_log.addError(err)
                })
                if (log.length === 0 && error !== undefined) {
                  solved = ext_log.markErrorSolved(errorID)
                }
              }
            )
          } else {
            // We set the solved_ts because we have valid data in cache
            solved = ext_log.markErrorSolved(errorID)
          }
          break
        case 3:
          /* not_cached & invalid_data error --> module_data */
          if (
            cache.isInCache(hashID) &&
            !cache.validateCacheData(cache.getDataFromCache(hashID))
          ) {
            cache.deleteDataFromCache(hashID)
          }

          if (!cache.isInCache(hashID_newPara)) {
            await this.computeModuleData(
              client,
              procedureName,
              all_parameters,
              error_tmp_log.getErrorsByModule(procedureName),
              send_to_client
            ).then((log) => {
              log.forEach((err) => {
                error_tmp_log.addError(err)
              })
              if (log.length === 0 && error !== undefined) {
                solved = ext_log.markErrorSolved(errorID)
              }
            })
          } else {
            // We set the solved_ts because we have valid data in cache
            solved = ext_log.markErrorSolved(errorID)
          }
          break
        default:
          console.log(
            cli_color.red(
              `[errorHandler]: Got a wrong priority ( = ${error?.priority} ). Can't handle an unknown error.`
            )
          )
          break
      }

      if (prio1_border === error_counter_prio1) {
        console.log(
          cli_color.red(
            "[errorHandler]: It seems that we have an error at the API or some missing request parameters. Can't Fetch/Get any raw_data."
          )
        )
        client.emit(
          "dataError",
          "[ERROR 1.1]: It seems that we have an error at the API or some request parameters are missing. Can't Fetch/Get any raw_data"
        )
        error_counter_prio1++
        ignore_prio1_err = true
      }
      send_to_client = false
      if (solved) {
        console.log(
          cli_color.cyan(`[errorHandler]: Fixed error for '${procedureName}'`)
        )
        solved = false
      } else {
        console.log(
          cli_color.cyan(
            `[errorHandler]: Can't fix error for '${procedureName}'`
          )
        )
      }
    }

    /* add all new (or old) errors to the cache log */
    while (!error_tmp_log.empty()) {
      cache.addError(error_tmp_log.getError())
    }

    if (!cache.empty()) {
      console.log(
        cli_color.red("[errorHandler]: Couldn't handle all errors :-(")
      )
      client.emit("dataError", { error_log: cache.getErrorLog() })
      return
    } else {
      console.log(
        "[errorHandler]: There are no more errors. I'm going back to sleep. :-)"
      )
      console.log(cli_color.cyan(" --- [errorHandler] --- "))
      return
    }
  }

  /**
   * This function deletes cached data for @param all_parameters (and ONLY for all_para..) depending on the load_new boolean
   * @param all_parameters all request parameters which are sent by client
   * @param load_new if: true --> delete all cached data | if: false/undefined --> delete all cached data with errors
   */
  private delete_cached_data_by_parameters = (
    all_parameters: any,
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
        let parameters: {
          [key: string]: string[]
        } = RestAPI.getProcedureParameters(raw_data.name, all_parameters)

        /* get the hash for the data */
        let hashID: string = hash({
          name: raw_data.name,
          para: parameters,
        })
        /* delete the data from the cache if load_new is set to true */
        if (cache.isInCache(hashID) && load_new) {
          cache.deleteDataFromCache(hashID)
          /* delete error data from cache */
        } else if (!cache.validateCacheData(cache.getDataFromCache(hashID))) {
          cache.deleteDataFromCache(hashID)
        }
      })

      module_list_parsed_data.forEach((parsed_data: _parsed_data) => {
        /* get the hash for the data */
        let hashID: string = hash({
          name: parsed_data.name,
          para: get_parameter_parsed_data(parsed_data.name, all_parameters),
        })
        /* delete the data from the cache */
        if (cache.isInCache(hashID) && load_new) {
          cache.deleteDataFromCache(hashID)
          /* delete error data from cache */
        } else if (!cache.validateCacheData(cache.getDataFromCache(hashID))) {
          cache.deleteDataFromCache(hashID)
        }
      })

      module_list_module_data.forEach((module_data: _module_data) => {
        /* get the hash for the data */
        let hashID: string = hash({
          name: module_data.name,
          para: get_parameter_module_data(module_data.name, all_parameters),
        })
        /* delete the data from the cache */
        if (cache.isInCache(hashID) && load_new) {
          cache.deleteDataFromCache(hashID)
          /* delete error data from the cache */
        } else if (!cache.validateCacheData(cache.getDataFromCache(hashID))) {
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
}

/**
 * This function computes all parameters which are neccessary to compute data_parser[@param parsing_name]
 * @param parsing_name The name of the procedure in data_parser.ts
 * @param all_parameters All parameters that come with the payload
 * @returns An object with all neccessary parameters for the procedure
 */
export const get_parameter_parsed_data = (
  parsing_name: string,
  all_parameters: { [key: string]: string[] }
): { [key: string]: string[] } => {
  let raw_data_list: string[] = []
  let parameters: { [key: string]: string[] } = {}

  data_parser[parsing_name].needed_raw_data.forEach((raw_data: string) => {
    if (!raw_data_list.includes(raw_data)) {
      raw_data_list.push(raw_data)
    }
  })

  raw_data_list.forEach((raw_data: string) => {
    let tmp_list = RestAPI.getProcedureParameters(raw_data, all_parameters)
    parameters = Object.assign(parameters, tmp_list)
  })

  return parameters
}

/**
 * This function computes all parameters which are neccessary to compute module_parser[@param module_name]
 * @param module_name The name of the procedure in module_parser.ts
 * @param all_parameters All parameters that come with the payload
 * @returns An object with all neccessary parameters for the module
 */
export const get_parameter_module_data = (
  module_name: string,
  all_parameters: { [key: string]: string[] }
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
    let tmp = get_parameter_parsed_data(parsing_name, all_parameters)
    parameters = Object.assign(parameters, tmp)
  })

  module_parser[module_name].needed_raw_data.forEach((raw_data: string) => {
    if (!raw_data_list.includes(raw_data)) {
      raw_data_list.push(raw_data)
    }
  })

  raw_data_list.forEach((raw_data: string) => {
    let tmp: { [key: string]: string[] } = {}
    tmp = RestAPI.getProcedureParameters(raw_data, all_parameters)
    parameters = Object.assign(parameters, tmp)
  })

  return parameters
}

// TODO: Errors löschen wenn Errordaten in delete_cached_data_by_parameters() gelöscht werden
