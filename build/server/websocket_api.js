"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketApi = void 0;
var cli_color = require("cli-color");
var cli_printing_1 = require("./utilities/cli_printing");
var select_data_source_1 = require("./data_io/select_data_source");
var config_1 = require("./config");
var types_1 = require("./data_io/types");
var module_parser_1 = require("./module_parser");
var data_parser_1 = require("./data_parser");
var cache_1 = require("./cache");
var procedure_arguments_1 = require("./procedure_arguments");
// import hash from "object-hash"
var hash = require("object-hash");
/**
 * This class receives a websocket "port" and then listens for connections. To these connections, it offers access to
 * the various data sources that there are.
 *
 * New connections will first trigger a call to #onConnected, which (among others) registers a handler for the channel
 * `"getData"`. See #onGetData for the functionality provided via that channel.
 */
var WebsocketApi = /** @class */ (function () {
    /**
     * Creates a new listener for connections arriving on the given server.
     *
     * @param server the server to listen on
     */
    function WebsocketApi(server) {
        var _this = this;
        /**
         * Called when a new connection was established. Registers all other listeners.
         *
         * @param client the new client
         */
        this.onConnected = function (client) {
            if (!config_1.default.is_testing) {
                var clientConnected = [
                    "┌──────────────────────────────────────┐",
                    "│ New client connected!                │",
                    "└──────────────────────────────────────┘",
                ];
                cli_printing_1.printArrayInColor(clientConnected, cli_color.white);
            }
            client.on("disconnect", _this.onDisconnected);
            client.on("getData", function (data) { return _this.onGetData(client, data); });
            client.on("error", _this.onError);
            // client.on("getParsedData", data => this.onGetParsedData(client, data))
            client.on("getVisData", function (data) { return _this.onGetVisData(client, data); });
            client.on("getCacheData", function (data) { return _this.onGetCacheData(client, data); });
            client.on("clearCache", function (data) { return _this.clearCache(data); });
        };
        this.onGetCacheData = function (client, data) {
            console.log("ON GET CACHE DATA -> BUTTON PRESSED");
            var cacheData = cache_1.default;
            client.emit("cacheData", cacheData);
        };
        /**
         * Called when a client disconnected.
         */
        this.onDisconnected = function () {
            if (!config_1.default.is_testing) {
                var clientDisconnected = [
                    "┌──────────────────────────────────────┐",
                    "│ Client disconnected!                 │",
                    "└──────────────────────────────────────┘",
                ];
                cli_printing_1.printArrayInColor(clientDisconnected, cli_color.yellow);
            }
        };
        this.clearCache = function (payload) {
            // cache = {
            //   raw_data: {},
            //   parsed_data: {},
            //   vis_data: {}
            // }
            console.log("CLEAR CACHE");
            var data_type_names = Object.getOwnPropertyNames(cache_1.default);
            data_type_names.forEach(function (dtn) {
                cache_1.default[dtn] = {};
            });
        };
        this.saveToCache = function (data, payload, dataType, dataName, error) {
            console.log("SAVE TO CACHE " + dataName);
            var data_hash = hash(payload.parameters);
            if (cache_1.default[dataType][dataName] === undefined) {
                cache_1.default[dataType][dataName] = {};
            }
            cache_1.default[dataType][dataName][data_hash] = {
                error: error,
                timestamp: new Date().getTime(),
                parameters: payload.parameters,
                data: data,
            };
        };
        /**
         * Called when an error occurred with a specific client.
         */
        this.onError = function (errorCode, errorMessage) {
            if (!config_1.default.is_testing) {
                var message = [
                    "┌──────────────────────────────────────┐",
                    "\u2502 An error occurred: code = " + errorCode + " / message = \"" + errorMessage + "\"",
                    "└──────────────────────────────────────┘",
                ];
                cli_printing_1.printArrayInColor(message, cli_color.red);
            }
        };
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
        this.onGetData = function (client, payload) {
            if (payload === void 0) { payload = {}; }
            if (!config_1.default.is_testing)
                console.log("Data request with parameters " + JSON.stringify(payload));
            // parse the parameters
            if (typeof payload["procedureName"] !== "string") {
                client.emit("dataError", "need to give procedureName as a parameter (type: string) but gotten: " + payload["procedureName"]);
                return;
            }
            var procedureName = payload["procedureName"];
            if (typeof payload["procedureParameters"] !== "object" ||
                payload["procedureParameters"] === null) {
                client.emit("dataError", "need to give procedureParameters as a parameter (type: object) but gotten: " + payload["procedureParameters"]);
                return;
            }
            var procedureParameters = payload["procedureParameters"];
            // this is the promise that (might) hold the data we want to return
            // this is declared separately since there is the special case of the `GetDataSources` procedure
            var response;
            if (procedureName === "GetDataSources") {
                // in this case, we ignore the possibly given data source identifier
                // however, we still want to make sure that now parameters are given that we would else ignore silently
                response = types_1.ensureIsValid("args/Arguments_Empty", payload).then(function (_) {
                    return { success: true, data: select_data_source_1.ALL_DATA_SOURCES };
                });
            }
            else {
                // in this case, we definitely need the data source name identifier
                if (typeof payload["dataSourceIdentifier"] !== "string") {
                    client.emit("dataError", "need to give dataSourceIdentifier as a parameter (type: string) but gotten: " + payload["dataSourceIdentifier"]);
                    return;
                }
                var dataSourceIdentifier = payload["dataSourceIdentifier"];
                // first, find the right data source for the given identifier
                response = select_data_source_1.resolveDataSource(dataSourceIdentifier)
                    // then call the actual data-providing function
                    .then(function (dataSource) {
                    return dataSource.callByName(procedureName, procedureParameters);
                });
            }
            // serve the actual request
            response
                // success, return data on channel "dataResult"
                .then(function (value) { return client.emit("dataResult", JSON.stringify(value)); })
                // failure, return error message and original error object on channel "dataError"
                .catch(function (error) {
                return client.emit("dataError", "There was en error executing the procedure [code: 1]: " + error);
            });
        };
        this.onGetData_into_cache = function (client, payload, 
        // callback: Function
        dataObject, open_modules) {
            if (payload === void 0) { payload = {}; }
            console.log("ON GET DATA into cache");
            var raw_data_counter = 0;
            var load_new = payload.load_new;
            var raw_data_name = "open_modules_raw_data";
            if (!open_modules) {
                raw_data_name = "not_open_modules_raw_data";
            }
            // Wenn keine raw data benoetigt werden
            if (raw_data_counter === dataObject[raw_data_name].length) {
                // client.emit("dataResult", JSON.stringify(value))
                console.log("callback, keine raw data benoetigt; open_modules: " + open_modules);
                _this.onGetParsedData_into_cache(client, payload, dataObject, open_modules);
            }
            dataObject[raw_data_name].forEach(function (procedureName) {
                console.log("--> get raw data loop for: " + procedureName);
                console.log("raw data counter (+1 dann): " + raw_data_counter + " von " + dataObject[raw_data_name].length);
                if (!config_1.default.is_testing) {
                    console.log("Data request " + procedureName + " with parameters " + JSON.stringify(payload));
                }
                console.log("1");
                if (typeof payload.parameters !== "object" ||
                    payload.parameters === null) {
                    console.error("need to give parameters as a parameter (type: object) but gotten: " + payload.parameters);
                    client.emit("dataError", "need to give parameters as a parameter (type: object) but gotten: " + payload.parameters);
                    return;
                }
                console.log("2");
                var all_parameters = payload.parameters;
                console.log(all_parameters);
                // Nur die benötigten Parameter nehmen
                var parameters = {};
                procedure_arguments_1.default[procedureName].forEach(function (para) {
                    console.log("get procedure arguments for " + procedureName + " " + para);
                    parameters[para] = all_parameters[para];
                });
                console.log("Parameters for Procedure " + procedureName + ":");
                console.log(parameters);
                var hash_ID = hash(all_parameters);
                console.log("Sind bereits Daten f\u00FCr " + procedureName + " " + hash_ID + " cached?");
                if (_this.is_in_cache(hash_ID, procedureName) && load_new !== true) {
                    console.log("   DATEN SIND SCHON CACHED; load_new:", load_new);
                    // Wenn daten schon cached sind...
                    raw_data_counter++;
                    console.log("raw data counter: " + raw_data_counter + " von " + dataObject[raw_data_name].length);
                    if (raw_data_counter === dataObject[raw_data_name].length) {
                        // client.emit("dataResult", JSON.stringify(value))
                        console.log("callback, alle raw data ist erreicht; open_modules: " + open_modules);
                        _this.onGetParsedData_into_cache(client, payload, dataObject, open_modules);
                    }
                }
                else {
                    console.log("   daten sind NOCH NICHT cached");
                    // this is the promise that (might) hold the data we want to return
                    // this is declared separately since there is the special case of the `GetDataSources` procedure
                    var response = void 0;
                    if (procedureName === "GetDataSources") {
                        // in this case, we ignore the possibly given data source identifier
                        // however, we still want to make sure that now parameters are given that we would else ignore silently
                        response = types_1.ensureIsValid("args/Arguments_Empty", payload).then(function (_) {
                            return { success: true, data: select_data_source_1.ALL_DATA_SOURCES };
                        });
                    }
                    else {
                        // in this case, we definitely need the data source name identifier
                        if (typeof payload.dataSourceIdentifier !== "string") {
                            client.emit("dataError", "need to give dataSourceIdentifier as a parameter (type: string) but gotten: " + payload.dataSourceIdentifier);
                            return;
                        }
                        var dataSourceIdentifier = payload.dataSourceIdentifier;
                        // first, find the right data source for the given identifier
                        response = select_data_source_1.resolveDataSource(dataSourceIdentifier)
                            // then call the actual data-providing function
                            .then(function (dataSource) {
                            return dataSource.callByName(procedureName, parameters);
                        });
                    }
                    // serve the actual request
                    response
                        // success, return data on channel "dataResult"
                        // .then((value) => client.emit("dataResult", JSON.stringify(value)))
                        .then(function (value) {
                        console.log("@@@@@@@@@@");
                        console.log(procedureName);
                        // console.log(value)
                        _this.saveToCache(value, payload, "raw_data", procedureName, undefined);
                        // console.log(value)
                        raw_data_counter++;
                        console.log("raw data counter: " + raw_data_counter + " von " + dataObject[raw_data_name].length);
                        if (raw_data_counter === dataObject[raw_data_name].length) {
                            // client.emit("dataResult", JSON.stringify(value))
                            console.log("callback, alle raw data ist erreicht; open_modules: " + open_modules);
                            _this.onGetParsedData_into_cache(client, payload, dataObject, open_modules);
                        }
                    })
                        // failure, return error message and original error object on channel "dataError"
                        .catch(function (error) {
                        console.error("dataError", "There was en error executing the procedure [code: 3]: (" + procedureName + ") " + error);
                        _this.saveToCache(undefined, payload, "raw_data", procedureName, error);
                        client.emit("dataError", "There was en error executing the procedure [code: 2]: " + error);
                        raw_data_counter++;
                        console.log("raw data counter: " + raw_data_counter + " von " + dataObject[raw_data_name].length);
                        if (raw_data_counter === dataObject[raw_data_name].length) {
                            // client.emit("dataResult", JSON.stringify(value))
                            console.log("callback, alle raw data ist erreicht (error); open_modules: " + open_modules);
                            _this.onGetParsedData_into_cache(client, payload, dataObject, open_modules);
                        }
                    });
                }
            });
        };
        /**
         *
         * @param client the client that requested the data and will receive the answer
         * @param payload the payload that was sent with the 'getVisData' request
         */
        this.onGetVisData = function (client, payload) {
            if (payload === void 0) { payload = {}; }
            /**
             * TODO:
             * Erst alle openModuleNames durchgehen und abfragen holen
             * Danach allModuleNames durchgehen und abfragen holen
             *
             * Dann diese Abfragen tätigen und danach die Algos auf die Daten
             * Und danach für die restlichen...
             */
            console.log("onGetVisData called");
            console.log("openModuleNames: " + payload.openModuleNames);
            console.log("allModuleNames: " + payload.allModuleNames);
            console.log("parameters: " + JSON.stringify(payload.parameters));
            console.log(hash(payload.parameters));
            var open_modules_raw_data = [];
            var open_modules_parsed_data = [];
            var open_modules_module_data = [];
            var not_open_modules_raw_data = [];
            var not_open_modules_parsed_data = [];
            var not_open_modules_module_data = [];
            // let done_module_data: string[] = []
            console.log("open modules");
            payload.openModuleNames.forEach(function (module_name) {
                console.log(module_name);
                if (open_modules_module_data.includes(module_name)) {
                    return;
                }
                else {
                    open_modules_module_data.push(module_name);
                }
                module_parser_1.default[module_name].needed_raw_data.forEach(function (raw_data_name) {
                    if (!open_modules_raw_data.includes(raw_data_name)) {
                        open_modules_raw_data.push(raw_data_name);
                    }
                });
                module_parser_1.default[module_name].needed_parsed_data.forEach(function (parsed_data_name) {
                    if (!open_modules_parsed_data.includes(parsed_data_name)) {
                        open_modules_parsed_data.push(parsed_data_name);
                    }
                });
                open_modules_parsed_data.forEach(function (parsed_data_name) {
                    data_parser_1.default[parsed_data_name].needed_raw_data.forEach(function (raw_data_name) {
                        if (!open_modules_raw_data.includes(raw_data_name)) {
                            open_modules_raw_data.push(raw_data_name);
                        }
                    });
                });
            });
            console.log("NOT open modules");
            payload.allModuleNames.forEach(function (module_name) {
                console.log(module_name);
                if (open_modules_module_data.includes(module_name) ||
                    not_open_modules_module_data.includes(module_name)) {
                    return;
                }
                else {
                    not_open_modules_module_data.push(module_name);
                }
                module_parser_1.default[module_name].needed_raw_data.forEach(function (raw_data_name) {
                    if (!not_open_modules_raw_data.includes(raw_data_name)) {
                        not_open_modules_raw_data.push(raw_data_name);
                    }
                });
                module_parser_1.default[module_name].needed_parsed_data.forEach(function (parsed_data_name) {
                    if (!not_open_modules_parsed_data.includes(parsed_data_name)) {
                        not_open_modules_parsed_data.push(parsed_data_name);
                    }
                });
                not_open_modules_parsed_data.forEach(function (parsed_data_name) {
                    data_parser_1.default[parsed_data_name].needed_raw_data.forEach(function (raw_data_name) {
                        if (!not_open_modules_raw_data.includes(raw_data_name)) {
                            not_open_modules_raw_data.push(raw_data_name);
                        }
                    });
                });
            });
            console.log("Reihenfolge:");
            console.log("- - - - - - - - - -");
            console.log("- - - - - - - - - -");
            console.log("Raw data open modules");
            console.log(open_modules_raw_data);
            console.log("- - - - - - - - - -");
            console.log("Parsedparsed data open modules");
            console.log(open_modules_parsed_data);
            console.log("- - - - - - - - - -");
            console.log("Module data open modules");
            console.log(open_modules_module_data);
            console.log("- - - - - - - - - -");
            console.log("- - - - - - - - - -");
            console.log("Raw data not open modules");
            console.log(not_open_modules_raw_data);
            console.log("- - - - - - - - - -");
            console.log("Parsedparsed data not open modules");
            console.log(not_open_modules_parsed_data);
            console.log("- - - - - - - - - -");
            console.log("Module data not open modules");
            console.log(not_open_modules_module_data);
            console.log("- - - - - - - - - -");
            console.log("- - - - - - - - - -");
            _this.onGetData_into_cache(client, payload, {
                open_modules_raw_data: open_modules_raw_data,
                open_modules_parsed_data: open_modules_parsed_data,
                open_modules_module_data: open_modules_module_data,
                not_open_modules_raw_data: not_open_modules_raw_data,
                not_open_modules_parsed_data: not_open_modules_parsed_data,
                not_open_modules_module_data: not_open_modules_module_data,
            }, true);
        };
        this.get_data_for_modules = function (open_modules_raw_data, open_modules_parsed_data, open_modules_module_data, not_open_modules_raw_data, not_open_modules_parsed_data, not_open_modules_module_data) {
            // TODO: all diese arrays durchgehen und jeweils die calls machen
            // TODO: zwischendurch immer abchecken, ob schon im cache ist...
            // (alles sequentiell)
            // TODO: ERRORS im Cache speichern und erkennen etc.
            // OPEN MODULES
            open_modules_raw_data.forEach(function (raw_data_name) { });
            open_modules_parsed_data.forEach(function (parsed_data_name) { });
            open_modules_module_data.forEach(function (module_data_name) { });
            // NOT OPEN MODULES
            not_open_modules_raw_data.forEach(function (raw_data_name) { });
            not_open_modules_parsed_data.forEach(function (parsed_data_name) { });
            not_open_modules_module_data.forEach(function (module_data_name) { });
        };
        /**
         * Callback, wenn die raw-data für die open-modules alle geladen sind
         * @param dataObject
         */
        this.get_and_send_modules_data = function (
        // raw_data_names: string[],
        client, payload, dataObject, open_modules) {
            if (payload === void 0) { payload = {}; }
            var count_done = 0;
            var parsed_name = "open_modules_parsed_data";
            var module_name = "open_modules_module_data";
            if (!open_modules) {
                parsed_name = "not_open_modules_parsed_data";
                module_name = "not_open_modules_module_data";
            }
            console.log("Open Modules? " + open_modules);
            console.log("parsed data name");
            dataObject[parsed_name].forEach(function (parsed_data_name) {
                console.log(parsed_data_name);
                // TODO: daten parsen wenn nicht schon im cache
                // TODO: aber raw data auf errors prüfen
            });
            console.log("module data name");
            dataObject[module_name].forEach(function (module_data_name) {
                console.log(module_data_name);
                // TODO: module data erzeugen
                // TODO: aber raw/parsed data auf errors prüfen
            });
            if (open_modules) {
                _this.onGetData_into_cache(client, payload, dataObject, false);
            }
        };
        this.is_in_cache = function (hashID, dataname) {
            console.log("OWN PROP NAMES 1");
            var data_type_names = Object.getOwnPropertyNames(cache_1.default);
            console.log("OWN PROP NAMES 2");
            var is_cached = false;
            data_type_names.forEach(function (dtn) {
                if (cache_1.default[dtn][dataname] !== undefined) {
                    console.log("OWN PROP NAMES 3");
                    var cached_hashes = Object.getOwnPropertyNames(cache_1.default[dtn][dataname]);
                    console.log("OWN PROP NAMES 4");
                    cached_hashes.forEach(function (propname) {
                        if (propname === hashID) {
                            is_cached = true;
                        }
                    });
                }
            });
            console.log("IS IN CACHE: " + dataname, is_cached);
            return is_cached;
        };
        this.cache_data = function (data, parameters, data_type, data_name, hashID) {
            var ts = new Date().getTime();
            var cached_data = cache_1.default[data_type][data_name][hashID];
            if (cached_data) {
                // data is already in cache
                // TODO: check timestamp ?
            }
            else {
                // data not in cache; fetch data and save it to cache
            }
        };
        /**
         *
         *
         * @param client the client that requested the data and will receive the answer
         * @param payload the payload that was sent with the `getData` request
         */
        this.get_raw_data = function (client, payload, callback) {
            if (payload === void 0) { payload = {}; }
            if (!config_1.default.is_testing)
                console.log("Data request with parameters " + JSON.stringify(payload));
            // parse the parameters
            if (typeof payload["procedureName"] !== "string") {
                client.emit("dataError", "need to give procedureName as a parameter (type: string) but gotten: " + payload["procedureName"]);
                return;
            }
            var procedureName = payload["procedureName"];
            if (typeof payload["procedureParameters"] !== "object" ||
                payload["procedureParameters"] === null) {
                client.emit("dataError", "need to give procedureParameters as a parameter (type: object) but gotten: " + payload["procedureParameters"]);
                return;
            }
            var procedureParameters = payload["procedureParameters"];
            // this is the promise that (might) hold the data we want to return
            // this is declared separately since there is the special case of the `GetDataSources` procedure
            var response;
            if (procedureName === "GetDataSources") {
                // in this case, we ignore the possibly given data source identifier
                // however, we still want to make sure that now parameters are given that we would else ignore silently
                response = types_1.ensureIsValid("args/Arguments_Empty", payload).then(function (_) {
                    return { success: true, data: select_data_source_1.ALL_DATA_SOURCES };
                });
            }
            else {
                // in this case, we definitely need the data source name identifier
                if (typeof payload["dataSourceIdentifier"] !== "string") {
                    client.emit("dataError", "need to give dataSourceIdentifier as a parameter (type: string) but gotten: " + payload["dataSourceIdentifier"]);
                    return;
                }
                var dataSourceIdentifier = payload["dataSourceIdentifier"];
                // first, find the right data source for the given identifier
                response = select_data_source_1.resolveDataSource(dataSourceIdentifier)
                    // then call the actual data-providing function
                    .then(function (dataSource) {
                    return dataSource.callByName(procedureName, procedureParameters);
                });
            }
            // serve the actual request
            response
                // success, return data on channel "dataResult"
                .then(function (value) { return client.emit("dataResult", JSON.stringify(value)); })
                // failure, return error message and original error object on channel "dataError"
                .catch(function (error) {
                return client.emit("dataError", "There was en error executing the procedure [code: 4]: " + error);
            });
        };
        this.onGetParsedData_into_cache = function (client, payload, dataObject, open_modules) {
            // parsing funktionen aufrufen; Errors abfangen
            if (payload === void 0) { payload = {}; }
            var load_new = payload.load_new;
            var parsed_data_name = "open_modules_parsed_data";
            if (!open_modules) {
                parsed_data_name = "not_open_modules_parsed_data";
            }
            console.log("-->ON GET PARSED DATA into cache");
            var all_parameters = payload.parameters;
            dataObject[parsed_data_name].forEach(function (parsing_name) {
                console.log(parsing_name);
                var hash_ID = hash(all_parameters);
                if (_this.is_in_cache(hash_ID, parsing_name) && load_new !== true) {
                    // Parsed Data schon im cache...
                    console.log("   Parsed Data schon im cache... (" + parsing_name + ")");
                    // TODO: WENN FEHLER/ERROR IM CACHE IST, WIRD ABER NICHT NEU BERECHNET!!! -> einbauen, dass wenn bereits cached aber mit error, dass neu berechnet wird...
                }
                else {
                    var errors_1 = [];
                    var input_data_1 = {};
                    data_parser_1.default[parsing_name].needed_raw_data.forEach(function (rdt) {
                        var parameters = {};
                        procedure_arguments_1.default[rdt].forEach(function (para) {
                            parameters[para] = all_parameters[para];
                        });
                        var tmp_data = {
                            data: [],
                        };
                        if (cache_1.default.raw_data[rdt] === undefined ||
                            cache_1.default.raw_data[rdt][hash_ID] === undefined) {
                            // Error ist in den raw data: nicht im cache
                            errors_1.push("Daten nicht vorhanden: " + rdt + " " + hash_ID);
                            tmp_data.error = "Daten nicht vorhanden: " + rdt + " " + hash_ID;
                        }
                        else if (cache_1.default.raw_data[rdt][hash_ID].error !== undefined) {
                            // Error ist in den raw data
                            errors_1.push(rdt + ": " + cache_1.default.raw_data[rdt][hash_ID].error);
                            tmp_data.error = rdt + ": " + cache_1.default.raw_data[rdt][hash_ID].error;
                        }
                        else {
                            // kein error
                            // input_data[rdt] = cache.raw_data[rdt][hash_ID].data.data
                            tmp_data.data = cache_1.default.raw_data[rdt][hash_ID].data.data;
                        }
                        input_data_1[rdt] = tmp_data;
                    });
                    // let parsed_data: any = {
                    //   data: [],
                    // }
                    var parsed_data = [];
                    var error = undefined;
                    if (errors_1.length > 0) {
                        // Errors abspeichern + []
                        // parsed_data.error = errors
                        error = errors_1;
                    }
                    else {
                        // callback aufrufen
                        parsed_data = data_parser_1.default[parsing_name].call_function(input_data_1, all_parameters);
                    }
                    _this.saveToCache(parsed_data, payload, "parsed_data", parsing_name, error);
                }
            });
            // TODO: AUfruf onGetModuleData_into_cache
            _this.onGetModuleData_into_cache(client, payload, dataObject, open_modules);
        };
        this.onGetModuleData_into_cache = function (client, payload, dataObject, open_modules) {
            // vis gen funktionen aufrufen; Errors abfangen
            // wenn kein Error, Module Data über den socket an den client emitten
            if (payload === void 0) { payload = {}; }
            var load_new = payload.load_new;
            var module_data_name = "open_modules_module_data";
            if (!open_modules) {
                module_data_name = "not_open_modules_module_data";
            }
            console.log("-->ON GET MODULE DATA into cache");
            console.log("Modules: " + dataObject[module_data_name]);
            var all_parameters = payload.parameters;
            var hash_ID = hash(all_parameters);
            dataObject[module_data_name].forEach(function (module_name) {
                console.log(module_name);
                var input_data = {};
                module_parser_1.default[module_name].needed_raw_data.forEach(function (raw_data_name) {
                    var tmp_data = {
                        data: [],
                    };
                    console.log("   Auslesen der daten/oder ob error..." + raw_data_name);
                    if (cache_1.default.raw_data[raw_data_name] === undefined ||
                        cache_1.default.raw_data[raw_data_name][hash_ID] === undefined) {
                        tmp_data.error =
                            "daten fuer " + raw_data_name + " " + hash_ID + " nicht im cache";
                    }
                    else {
                        tmp_data.data = cache_1.default.raw_data[raw_data_name][hash_ID].data.data;
                    }
                    input_data[raw_data_name] = tmp_data;
                });
                module_parser_1.default[module_name].needed_parsed_data.forEach(function (parsed_data_name) {
                    var tmp_data = {
                        data: [],
                    };
                    if (cache_1.default.parsed_data[parsed_data_name] === undefined ||
                        cache_1.default.parsed_data[parsed_data_name][hash_ID] === undefined) {
                        tmp_data.error =
                            "daten fuer " +
                                parsed_data_name +
                                " " +
                                hash_ID +
                                " nicht im cache";
                    }
                    else {
                        tmp_data = cache_1.default.parsed_data[parsed_data_name][hash_ID];
                    }
                    input_data[parsed_data_name] = tmp_data;
                });
                var callback = function (module_data_result_tmp) {
                    if (module_data_result_tmp) {
                        _this.saveToCache(module_data_result_tmp, payload, "vis_data", module_name, module_data_result_tmp.error);
                    }
                    var module_data_result = cache_1.default.vis_data[module_name][hash_ID];
                    console.log("Emitting data to module " + module_name);
                    client.emit(module_name, module_data_result);
                };
                // let hash_ID = hash(all_parameters)
                if (_this.is_in_cache(hash_ID, module_name) && load_new !== true) {
                    // Parsed Data schon im cache...
                    console.log("Module Data schon im cache... (" + module_name + ")");
                    // TODO: WENN FEHLER/ERROR IM CACHE IST, WIRD ABER NICHT NEU BERECHNET!!! -> einbauen, dass wenn bereits cached aber mit error, dass neu berechnet wird...
                    callback(undefined);
                }
                else {
                    console.log("CALLBACK FOR MODULE_PARSER: " + module_name);
                    // let module_data_result_tmp = module_parser[module_name].call_function(
                    //   input_data,
                    //   all_parameters,
                    //   callback
                    // )
                    module_parser_1.default[module_name].call_function(input_data, all_parameters, callback);
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
            });
            if (open_modules) {
                // TODO: geht irgendwie nicht... die raw_data haben error: {} irgendwie ?
                console.log("--- geschlossene Module jetzt ---");
                _this.onGetData_into_cache(client, payload, dataObject, false);
            }
            else {
                console.log("");
                console.log(" - - - - - # # # # # DONE # # # # # - - - - -");
                console.log("");
            }
        };
        server.on("connection", this.onConnected);
    }
    return WebsocketApi;
}());
exports.WebsocketApi = WebsocketApi;
//# sourceMappingURL=websocket_api.js.map