import * as cli_color from "cli-color"
import * as hash from "object-hash"

import { Socket } from "socket.io"
import { printArrayInColor } from "./utilities/cli_printing"
import {
  ALL_DATA_SOURCES,
  resolveDataSource,
} from "./data_io/select_data_source"
import {
  Arguments_Empty,
  ensureIsValid,
  ValidationResult,
} from "./data_io/types"

import CONFIG from "./config"
import cache from "./cache"
import data_parser from "./data_parser"
import module_parser from "./module_parser"
import procedure_arguments from "./procedure_arguments"

/**
 * This class receives a websocket "port" and then listens for connections. To these connections, it offers access to
 * the various data sources that there are.
 *
 * New connections will first trigger a call to #onConnected, which (among others) registers a handler for the channel
 * `"getData"`. See #onGetData for the functionality provided via that channel.
 */
export class WebsocketApi {
  /**
   * Creates a new listener for connections arriving on the given server.
   *
   * @param server the server to listen on
   */
  public constructor(server: SocketIO.Server) {
    server.on("connection", this.onConnected)
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

    client.on("disconnect", this.onDisconnected)
    client.on("error", this.onError)
    
    // client.on("getParsedData", data => this.onGetParsedData(client, data))
    client.on("getData", (data) => this.onGetData(client, data))
    client.on("getVisData", (data) => this.onGetVisData(client, data))
    client.on("getCacheData", (data) => this.onGetCacheData(client, data))
    client.on("clearCache", (data) => this.onClearCache(data))
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

  private onGetCacheData = (client: Socket, data: Object) => {
    console.log("ON GET CACHE DATA -> BUTTON PRESSED")
    let cacheData = cache
    client.emit("cacheData", cacheData)
  }

  private onClearCache = (payload: { readonly [key: string]: any }) => {
    // cache = {
    //   raw_data: {},
    //   parsed_data: {},
    //   vis_data: {}
    // }
    console.log("CLEAR CACHE")

    let data_type_names = Object.getOwnPropertyNames(cache)
    data_type_names.forEach((dtn) => {
      cache[dtn] = {}
    })
  }

  private saveToCache = (
    data: any,
    payload: { readonly [key: string]: any },
    dataType: string,
    dataName: string,
    error: any
  ) => {
    console.log("SAVE TO CACHE " + dataName)
    let data_hash = hash(payload.parameters)

    if (cache[dataType][dataName] === undefined) {
      cache[dataType][dataName] = {}
    }

    cache[dataType][dataName][data_hash] = {
      error,
      timestamp: new Date().getTime(),
      parameters: payload.parameters,
      data,
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
   * This function is the core of the websocket interface: It receives data requests and fetches answers for them. It
   * then returns them or delivers error.
   *
   * All requests shall be called with a payload object (JSON) with the following fields:
   *   - `procedureName`: a string with the procedure name to call
   *   - `procedureParameters`: an object with the parameters for that procedure (possibly `{}` if none are required)
   *   - sometimes `dataSourceIdentifier`: a string with the identifier of the data source. The special procedure with
   *     the name `"GetDataSources"` allows to query available data sources and does not need this (it is ignored).
   *
   * @param client the client that requested the data and will receive the answer
   * @param payload the payload that was sent with the `getData` request
   */
  private onGetData = (
    client: Socket,
    payload: { readonly [key: string]: unknown } = {}
  ): void => {
    if (!CONFIG.is_testing)
      console.log(`Data request with parameters ${JSON.stringify(payload)}`)

    // parse the parameters
    if (typeof payload["procedureName"] !== "string") {
      client.emit(
        "dataError",
        `need to give procedureName as a parameter (type: string) but gotten: ${payload["procedureName"]}`
      )
      return
    }
    let procedureName: string = payload["procedureName"]

    if (
      typeof payload["procedureParameters"] !== "object" ||
      payload["procedureParameters"] === null
    ) {
      client.emit(
        "dataError",
        `need to give procedureParameters as a parameter (type: object) but gotten: ${payload["procedureParameters"]}`
      )
      return
    }
    let procedureParameters: object = payload["procedureParameters"]

    // this is the promise that (might) hold the data we want to return
    // this is declared separately since there is the special case of the `GetDataSources` procedure
    let response: Promise<ValidationResult<unknown>>

    if (procedureName === "GetDataSources") {
      // in this case, we ignore the possibly given data source identifier
      // however, we still want to make sure that now parameters are given that we would else ignore silently
      response = ensureIsValid<Arguments_Empty>(
        "args/Arguments_Empty",
        payload
      ).then((_) => {
        return { success: true, data: ALL_DATA_SOURCES }
      })
    } else {
      // in this case, we definitely need the data source name identifier
      if (typeof payload["dataSourceIdentifier"] !== "string") {
        client.emit(
          "dataError",
          `need to give dataSourceIdentifier as a parameter (type: string) but gotten: ${payload["dataSourceIdentifier"]}`
        )
        return
      }
      let dataSourceIdentifier: string = payload["dataSourceIdentifier"]
      const authToken = client.request.session.passport?.user.access_token

      // first, find the right data source for the given identifier
      response = resolveDataSource(dataSourceIdentifier)
        // then call the actual data-providing function
        .then((dataSource) =>
          dataSource.callByName(procedureName, procedureParameters, authToken)
        )
    }

    // serve the actual request
    response
      // success, return data on channel "dataResult"
      .then((value) => client.emit("dataResult", JSON.stringify(value)))

      // failure, return error message and original error object on channel "dataError"
      .catch((error) =>
        client.emit(
          "dataError",
          `There was en error executing the procedure [code: 1]: ${error}`
        )
      )
  }

  private onGetData_into_cache = (
    client: Socket,
    payload: { readonly [key: string]: unknown } = {},
    // callback: Function
    dataObject: any,
    open_modules: boolean
  ): void => {
    console.log("ON GET DATA into cache")

    let raw_data_counter = 0
    let load_new = payload.load_new

    let raw_data_name = "open_modules_raw_data"

    if (!open_modules) {
      raw_data_name = "not_open_modules_raw_data"
    }

    // Wenn keine raw data benoetigt werden
    if (raw_data_counter === dataObject[raw_data_name].length) {
      // client.emit("dataResult", JSON.stringify(value))
      console.log(
        `callback, keine raw data benoetigt; open_modules: ${open_modules}`
      )
      this.onGetParsedData_into_cache(client, payload, dataObject, open_modules)
    }

    dataObject[raw_data_name].forEach((procedureName: string) => {
      console.log("--> get raw data loop for: " + procedureName)
      console.log(
        `raw data counter (+1 dann): ${raw_data_counter} von ${dataObject[raw_data_name].length}`
      )

      if (!CONFIG.is_testing) {
        console.log(
          `Data request ${procedureName} with parameters ${JSON.stringify(
            payload
          )}`
        )
      }
      console.log("1")
      if (
        typeof payload.parameters !== "object" ||
        payload.parameters === null
      ) {
        console.error(
          `need to give parameters as a parameter (type: object) but gotten: ${payload.parameters}`
        )
        client.emit(
          "dataError",
          `need to give parameters as a parameter (type: object) but gotten: ${payload.parameters}`
        )
        return
      }
      console.log("2")
      let all_parameters: any = payload.parameters
      console.log(all_parameters)
      // Nur die benötigten Parameter nehmen
      let parameters: { [key: string]: string[] } = {}
      procedure_arguments[procedureName].forEach((para: string) => {
        console.log("get procedure arguments for " + procedureName + " " + para)
        parameters[para] = all_parameters[para]
      })
      console.log(`Parameters for Procedure ${procedureName}:`)
      console.log(parameters)

      let hash_ID = hash(all_parameters)
      console.log(`Sind bereits Daten für ${procedureName} ${hash_ID} cached?`)
      if (this.is_in_cache(hash_ID, procedureName) && load_new !== true) {
        console.log("   DATEN SIND SCHON CACHED; load_new:", load_new)
        // Wenn daten schon cached sind...
        raw_data_counter++
        console.log(
          `raw data counter: ${raw_data_counter} von ${dataObject[raw_data_name].length}`
        )
        if (raw_data_counter === dataObject[raw_data_name].length) {
          // client.emit("dataResult", JSON.stringify(value))
          console.log(
            `callback, alle raw data ist erreicht; open_modules: ${open_modules}`
          )
          this.onGetParsedData_into_cache(
            client,
            payload,
            dataObject,
            open_modules
          )
        }
      } else {
        console.log("   daten sind NOCH NICHT cached")
        // this is the promise that (might) hold the data we want to return
        // this is declared separately since there is the special case of the `GetDataSources` procedure
        let response: Promise<ValidationResult<unknown>>

        if (procedureName === "GetDataSources") {
          // in this case, we ignore the possibly given data source identifier
          // however, we still want to make sure that now parameters are given that we would else ignore silently
          response = ensureIsValid<Arguments_Empty>(
            "args/Arguments_Empty",
            payload
          ).then((_) => {
            return { success: true, data: ALL_DATA_SOURCES }
          })
        } else {
          // in this case, we definitely need the data source name identifier
          if (typeof payload.dataSourceIdentifier !== "string") {
            client.emit(
              "dataError",
              `need to give dataSourceIdentifier as a parameter (type: string) but gotten: ${payload.dataSourceIdentifier}`
            )
            return
          }
          let dataSourceIdentifier: string = payload.dataSourceIdentifier
          const authToken = client.request.session.passport?.user.access_token

          // first, find the right data source for the given identifier
          response = resolveDataSource(dataSourceIdentifier)
            // then call the actual data-providing function
            .then((dataSource) =>
              dataSource.callByName(procedureName, parameters, authToken)
            )
        }

        // serve the actual request
        response
          // success, return data on channel "dataResult"
          // .then((value) => client.emit("dataResult", JSON.stringify(value)))
          .then((value) => {
            console.log("@@@@@@@@@@")
            console.log(procedureName)
            // console.log(value)
            this.saveToCache(
              value,
              payload,
              "raw_data",
              procedureName,
              undefined
            )
            // console.log(value)
            raw_data_counter++
            console.log(
              `raw data counter: ${raw_data_counter} von ${dataObject[raw_data_name].length}`
            )
            if (raw_data_counter === dataObject[raw_data_name].length) {
              // client.emit("dataResult", JSON.stringify(value))
              console.log(
                `callback, alle raw data ist erreicht; open_modules: ${open_modules}`
              )
              this.onGetParsedData_into_cache(
                client,
                payload,
                dataObject,
                open_modules
              )
            }
          })

          // failure, return error message and original error object on channel "dataError"
          .catch((error) => {
            console.error(
              "dataError",
              `There was en error executing the procedure [code: 3]: (${procedureName}) ${error}`
            )
            this.saveToCache(
              undefined,
              payload,
              "raw_data",
              procedureName,
              error
            )
            client.emit(
              "dataError",
              `There was en error executing the procedure [code: 2]: ${error}`
            )

            raw_data_counter++
            console.log(
              `raw data counter: ${raw_data_counter} von ${dataObject[raw_data_name].length}`
            )
            if (raw_data_counter === dataObject[raw_data_name].length) {
              // client.emit("dataResult", JSON.stringify(value))
              console.log(
                `callback, alle raw data ist erreicht (error); open_modules: ${open_modules}`
              )
              this.onGetParsedData_into_cache(
                client,
                payload,
                dataObject,
                open_modules
              )
            }
          })
      }
    })
  }

  /**
   *
   * @param client the client that requested the data and will receive the answer
   * @param payload the payload that was sent with the 'getVisData' request
   */
  private onGetVisData = (
    client: Socket,
    payload: { readonly [key: string]: any } = {}
  ): void => {
    /**
     * TODO:
     * Erst alle openModuleNames durchgehen und abfragen holen
     * Danach allModuleNames durchgehen und abfragen holen
     *
     * Dann diese Abfragen tätigen und danach die Algos auf die Daten
     * Und danach für die restlichen...
     */
    console.log("onGetVisData called")
    console.log(`openModuleNames: ${payload.openModuleNames}`)
    console.log(`allModuleNames: ${payload.allModuleNames}`)
    console.log(`parameters: ${JSON.stringify(payload.parameters)}`)

    console.log(hash(payload.parameters))

    let open_modules_raw_data: any[] = []
    let open_modules_parsed_data: any[] = []
    let open_modules_module_data: string[] = []

    let not_open_modules_raw_data: any[] = []
    let not_open_modules_parsed_data: any[] = []
    let not_open_modules_module_data: string[] = []

    // let done_module_data: string[] = []

    console.log("open modules")

    payload.openModuleNames.forEach((module_name: string) => {
      console.log(module_name)
      if (open_modules_module_data.includes(module_name)) {
        return
      } else {
        open_modules_module_data.push(module_name)
      }

      module_parser[module_name].needed_raw_data.forEach(
        (raw_data_name: string) => {
          if (!open_modules_raw_data.includes(raw_data_name)) {
            open_modules_raw_data.push(raw_data_name)
          }
        }
      )

      module_parser[module_name].needed_parsed_data.forEach(
        (parsed_data_name: string) => {
          if (!open_modules_parsed_data.includes(parsed_data_name)) {
            open_modules_parsed_data.push(parsed_data_name)
          }
        }
      )

      open_modules_parsed_data.forEach((parsed_data_name: string) => {
        data_parser[parsed_data_name].needed_raw_data.forEach(
          (raw_data_name: string) => {
            if (!open_modules_raw_data.includes(raw_data_name)) {
              open_modules_raw_data.push(raw_data_name)
            }
          }
        )
      })
    })

    console.log("NOT open modules")

    payload.allModuleNames.forEach((module_name: string) => {
      console.log(module_name)
      if (
        open_modules_module_data.includes(module_name) ||
        not_open_modules_module_data.includes(module_name)
      ) {
        return
      } else {
        not_open_modules_module_data.push(module_name)
      }

      module_parser[module_name].needed_raw_data.forEach(
        (raw_data_name: string) => {
          if (!not_open_modules_raw_data.includes(raw_data_name)) {
            not_open_modules_raw_data.push(raw_data_name)
          }
        }
      )

      module_parser[module_name].needed_parsed_data.forEach(
        (parsed_data_name: string) => {
          if (!not_open_modules_parsed_data.includes(parsed_data_name)) {
            not_open_modules_parsed_data.push(parsed_data_name)
          }
        }
      )

      not_open_modules_parsed_data.forEach((parsed_data_name: string) => {
        data_parser[parsed_data_name].needed_raw_data.forEach(
          (raw_data_name: string) => {
            if (!not_open_modules_raw_data.includes(raw_data_name)) {
              not_open_modules_raw_data.push(raw_data_name)
            }
          }
        )
      })
    })

    console.log("Reihenfolge:")
    console.log("- - - - - - - - - -")
    console.log("- - - - - - - - - -")
    console.log("Raw data open modules")
    console.log(open_modules_raw_data)
    console.log("- - - - - - - - - -")
    console.log("Parsedparsed data open modules")
    console.log(open_modules_parsed_data)
    console.log("- - - - - - - - - -")
    console.log("Module data open modules")
    console.log(open_modules_module_data)
    console.log("- - - - - - - - - -")
    console.log("- - - - - - - - - -")

    console.log("Raw data not open modules")
    console.log(not_open_modules_raw_data)
    console.log("- - - - - - - - - -")
    console.log("Parsedparsed data not open modules")
    console.log(not_open_modules_parsed_data)
    console.log("- - - - - - - - - -")
    console.log("Module data not open modules")
    console.log(not_open_modules_module_data)
    console.log("- - - - - - - - - -")
    console.log("- - - - - - - - - -")

    this.onGetData_into_cache(
      client,
      payload,
      {
        open_modules_raw_data,
        open_modules_parsed_data,
        open_modules_module_data,
        not_open_modules_raw_data,
        not_open_modules_parsed_data,
        not_open_modules_module_data,
      },
      true
    )
  }

  private get_data_for_modules = (
    open_modules_raw_data: string[],
    open_modules_parsed_data: string[],
    open_modules_module_data: string[],
    not_open_modules_raw_data: string[],
    not_open_modules_parsed_data: string[],
    not_open_modules_module_data: string[]
  ) => {
    // TODO: all diese arrays durchgehen und jeweils die calls machen
    // TODO: zwischendurch immer abchecken, ob schon im cache ist...
    // (alles sequentiell)
    // TODO: ERRORS im Cache speichern und erkennen etc.

    // OPEN MODULES
    open_modules_raw_data.forEach((raw_data_name) => {})

    open_modules_parsed_data.forEach((parsed_data_name) => {})

    open_modules_module_data.forEach((module_data_name) => {})

    // NOT OPEN MODULES
    not_open_modules_raw_data.forEach((raw_data_name) => {})

    not_open_modules_parsed_data.forEach((parsed_data_name) => {})

    not_open_modules_module_data.forEach((module_data_name) => {})
  }

  /**
   * Callback, wenn die raw-data für die open-modules alle geladen sind
   * @param dataObject
   */
  private get_and_send_modules_data = (
    // raw_data_names: string[],
    client: Socket,
    payload: { readonly [key: string]: unknown } = {},
    dataObject: any,
    open_modules: boolean
  ) => {
    let count_done = 0

    let parsed_name = "open_modules_parsed_data"
    let module_name = "open_modules_module_data"

    if (!open_modules) {
      parsed_name = "not_open_modules_parsed_data"
      module_name = "not_open_modules_module_data"
    }

    console.log(`Open Modules? ${open_modules}`)

    console.log("parsed data name")
    dataObject[parsed_name].forEach((parsed_data_name: string) => {
      console.log(parsed_data_name)
      // TODO: daten parsen wenn nicht schon im cache
      // TODO: aber raw data auf errors prüfen
    })

    console.log("module data name")
    dataObject[module_name].forEach((module_data_name: string) => {
      console.log(module_data_name)
      // TODO: module data erzeugen
      // TODO: aber raw/parsed data auf errors prüfen
    })

    if (open_modules) {
      this.onGetData_into_cache(client, payload, dataObject, false)
    }
  }

  private is_in_cache = (hashID: string, dataname: string) => {
    console.log("OWN PROP NAMES 1")
    let data_type_names: string[] = Object.getOwnPropertyNames(cache)
    console.log("OWN PROP NAMES 2")
    let is_cached = false

    data_type_names.forEach((dtn: string) => {
      if (cache[dtn][dataname] !== undefined) {
        console.log("OWN PROP NAMES 3")
        let cached_hashes: string[] = Object.getOwnPropertyNames(
          cache[dtn][dataname]
        )
        console.log("OWN PROP NAMES 4")

        cached_hashes.forEach((propname) => {
          if (
            propname === hashID &&
            cache[dtn][dataname][hashID].error === undefined
          ) {
            is_cached = true
          }
        })
      }
    })

    console.log("IS IN CACHE: " + dataname, is_cached)
    return is_cached
  }

  private cache_data = (
    data: object,
    parameters: object,
    data_type: string,
    data_name: string,
    hashID: string
  ) => {
    let ts = new Date().getTime()
    let cached_data = cache[data_type][data_name][hashID]
    if (cached_data) {
      // data is already in cache
      // TODO: check timestamp ?
    } else {
      // data not in cache; fetch data and save it to cache
    }
  }

  /**
   *
   *
   * @param client the client that requested the data and will receive the answer
   * @param payload the payload that was sent with the `getData` request
   */
  private get_raw_data = (
    client: Socket,
    payload: { readonly [key: string]: unknown } = {},
    callback: Function
  ): void => {
    if (!CONFIG.is_testing)
      console.log(`Data request with parameters ${JSON.stringify(payload)}`)

    // parse the parameters
    if (typeof payload["procedureName"] !== "string") {
      client.emit(
        "dataError",
        `need to give procedureName as a parameter (type: string) but gotten: ${payload["procedureName"]}`
      )
      return
    }
    let procedureName: string = payload["procedureName"]

    if (
      typeof payload["procedureParameters"] !== "object" ||
      payload["procedureParameters"] === null
    ) {
      client.emit(
        "dataError",
        `need to give procedureParameters as a parameter (type: object) but gotten: ${payload["procedureParameters"]}`
      )
      return
    }
    let procedureParameters: object = payload["procedureParameters"]

    // this is the promise that (might) hold the data we want to return
    // this is declared separately since there is the special case of the `GetDataSources` procedure
    let response: Promise<ValidationResult<unknown>>

    if (procedureName === "GetDataSources") {
      // in this case, we ignore the possibly given data source identifier
      // however, we still want to make sure that now parameters are given that we would else ignore silently
      response = ensureIsValid<Arguments_Empty>(
        "args/Arguments_Empty",
        payload
      ).then((_) => {
        return { success: true, data: ALL_DATA_SOURCES }
      })
    } else {
      // in this case, we definitely need the data source name identifier
      if (typeof payload["dataSourceIdentifier"] !== "string") {
        client.emit(
          "dataError",
          `need to give dataSourceIdentifier as a parameter (type: string) but gotten: ${payload["dataSourceIdentifier"]}`
        )
        return
      }
      let dataSourceIdentifier: string = payload["dataSourceIdentifier"]
      const authToken = client.request.session.passport?.user.access_token

      // first, find the right data source for the given identifier
      response = resolveDataSource(dataSourceIdentifier)
        // then call the actual data-providing function
        .then((dataSource) =>
          dataSource.callByName(procedureName, procedureParameters, authToken)
        )
    }

    // serve the actual request
    response
      // success, return data on channel "dataResult"
      .then((value) => client.emit("dataResult", JSON.stringify(value)))

      // failure, return error message and original error object on channel "dataError"
      .catch((error) =>
        client.emit(
          "dataError",
          `There was en error executing the procedure [code: 4]: ${error}`
        )
      )
  }

  private onGetParsedData_into_cache = (
    client: Socket,
    payload: { readonly [key: string]: unknown } = {},
    dataObject: any,
    open_modules: boolean
  ): void => {
    // parsing funktionen aufrufen; Errors abfangen

    let load_new = payload.load_new

    let parsed_data_name = "open_modules_parsed_data"

    if (!open_modules) {
      parsed_data_name = "not_open_modules_parsed_data"
    }

    console.log("-->ON GET PARSED DATA into cache")

    let all_parameters: any = payload.parameters

    dataObject[parsed_data_name].forEach((parsing_name: string) => {
      console.log(parsing_name)
      let hash_ID = hash(all_parameters)
      if (this.is_in_cache(hash_ID, parsing_name) && load_new !== true) {
        // Parsed Data schon im cache...
        console.log("   Parsed Data schon im cache... (" + parsing_name + ")")
        // TODO: WENN FEHLER/ERROR IM CACHE IST, WIRD ABER NICHT NEU BERECHNET!!! -> einbauen, dass wenn bereits cached aber mit error, dass neu berechnet wird...
      } else {
        let errors: string[] = []
        let input_data: any = {}
        data_parser[parsing_name].needed_raw_data.forEach((rdt: string) => {
          let parameters: { [key: string]: string[] } = {}
          procedure_arguments[rdt].forEach((para: string) => {
            parameters[para] = all_parameters[para]
          })

          let tmp_data: any = {
            data: [],
          }

          if (
            cache.raw_data[rdt] === undefined ||
            cache.raw_data[rdt][hash_ID] === undefined
          ) {
            // Error ist in den raw data: nicht im cache
            errors.push("Daten nicht vorhanden: " + rdt + " " + hash_ID)
            tmp_data.error = "Daten nicht vorhanden: " + rdt + " " + hash_ID
          } else if (cache.raw_data[rdt][hash_ID].error !== undefined) {
            // Error ist in den raw data
            errors.push(rdt + ": " + cache.raw_data[rdt][hash_ID].error)
            tmp_data.error = rdt + ": " + cache.raw_data[rdt][hash_ID].error
          } else {
            // kein error
            // input_data[rdt] = cache.raw_data[rdt][hash_ID].data.data
            tmp_data.data = cache.raw_data[rdt][hash_ID].data.data
          }

          input_data[rdt] = tmp_data
        })

        // let parsed_data: any = {
        //   data: [],
        // }
        let parsed_data: any = []
        let error: any = undefined

        if (errors.length > 0) {
          // Errors abspeichern + []
          // parsed_data.error = errors
          error = errors
        } else {
          // callback aufrufen
          parsed_data = data_parser[parsing_name].call_function(
            input_data,
            all_parameters
          )
        }

        this.saveToCache(
          parsed_data,
          payload,
          "parsed_data",
          parsing_name,
          error
        )
      }
    })

    // TODO: Aufruf onGetModuleData_into_cache
    this.onGetModuleData_into_cache(client, payload, dataObject, open_modules)
  }

  private onGetModuleData_into_cache = (
    client: Socket,
    payload: { readonly [key: string]: unknown } = {},
    dataObject: any,
    open_modules: boolean
  ): void => {
    // vis gen funktionen aufrufen; Errors abfangen
    // wenn kein Error, Module Data über den socket an den client emitten

    let load_new = payload.load_new

    let module_data_name = "open_modules_module_data"

    if (!open_modules) {
      module_data_name = "not_open_modules_module_data"
    }

    console.log("-->ON GET MODULE DATA into cache")
    console.log(`Modules: ${dataObject[module_data_name]}`)

    let all_parameters: any = payload.parameters
    let hash_ID = hash(all_parameters)

    dataObject[module_data_name].forEach((module_name: string) => {
      console.log(module_name)

      let input_data: any = {}

      module_parser[module_name].needed_raw_data.forEach(
        (raw_data_name: string) => {
          let tmp_data: any = {
            data: [],
          }

          console.log("   Auslesen der daten/oder ob error..." + raw_data_name)

          if (
            cache.raw_data[raw_data_name] === undefined ||
            cache.raw_data[raw_data_name][hash_ID] === undefined
          ) {
            tmp_data.error =
              "daten fuer " + raw_data_name + " " + hash_ID + " nicht im cache"
          } else {
            tmp_data.data = cache.raw_data[raw_data_name][hash_ID].data.data
          }

          input_data[raw_data_name] = tmp_data
        }
      )

      module_parser[module_name].needed_parsed_data.forEach(
        (parsed_data_name: string) => {
          let tmp_data: any = {
            data: [],
          }

          if (
            cache.parsed_data[parsed_data_name] === undefined ||
            cache.parsed_data[parsed_data_name][hash_ID] === undefined
          ) {
            tmp_data.error =
              "daten fuer " +
              parsed_data_name +
              " " +
              hash_ID +
              " nicht im cache"
          } else {
            tmp_data = cache.parsed_data[parsed_data_name][hash_ID]
          }

          input_data[parsed_data_name] = tmp_data
        }
      )

      let callback = (module_data_result_tmp: any) => {
        if (module_data_result_tmp) {
          this.saveToCache(
            module_data_result_tmp,
            payload,
            "vis_data",
            module_name,
            module_data_result_tmp.error
          )
        }

        let module_data_result = cache.vis_data[module_name][hash_ID]

        console.log(`Emitting data to module ${module_name}`)
        client.emit(module_name, module_data_result)
      }

      // let hash_ID = hash(all_parameters)
      if (this.is_in_cache(hash_ID, module_name) && load_new !== true) {
        // Parsed Data schon im cache...
        console.log("Module Data schon im cache... (" + module_name + ")")
        // TODO: WENN FEHLER/ERROR IM CACHE IST, WIRD ABER NICHT NEU BERECHNET!!! -> einbauen, dass wenn bereits cached aber mit error, dass neu berechnet wird...

        callback(undefined)
      } else {
        console.log(`CALLBACK FOR MODULE_PARSER: ${module_name}`)
        // let module_data_result_tmp = module_parser[module_name].call_function(
        //   input_data,
        //   all_parameters,
        //   callback
        // )

        module_parser[module_name].call_function(
          input_data,
          all_parameters,
          callback
        )

        // this.saveToCache(
        //   module_data_result_tmp,
        //   payload,
        //   "vis_data",
        //   module_name,
        //   module_data_result_tmp.error
        // )
      }
      // let module_data_result = cache.vis_data[module_name][hash_ID]

      // console.log(`Emitting data to module ${module_name}`)
      // client.emit(module_name, module_data_result)
    })

    if (open_modules) {
      // TODO: geht irgendwie nicht... die raw_data haben error: {} irgendwie ?
      console.log("--- geschlossene Module jetzt ---")
      this.onGetData_into_cache(client, payload, dataObject, false)
    } else {
      console.log("")
      console.log(" - - - - - # # # # # DONE # # # # # - - - - -")
      console.log("")
    }
  }

  // TODO: setInterval 5min oder so -> delete all data from cache that is 1h or older

  // TODO: generische Algo-Aufruf Funktion schreiben, die bei Error der benötigten Daten nur { error: XXX, data: [] } zurückgibt!
}
