"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.call_Praktikum_CF_2020 = void 0;
var path = require("path");
var child_process_promise_1 = require("child-process-promise");
var common_1 = require("./common");
var tempy = require("tempy");
var fs = require("fs");
var types_1 = require("../../data_io/types");
/*
 * This file contains a slim shim above the algorithms for make usage simpler.
 *
 * Warning: This is not engineered for security!
 */
/**
 * Resolves the request by first retrieving the relevant data from the data source and the querying the algorithm with
 * that result. Correctly handles validation failures and returns the validated data.
 *
 * @param dataSource the data source to fetch the input to the algorithm from
 * @param parameters the parameters for querying the data source
 */
exports.call_Praktikum_CF_2020 = function (dataSource, parameters) { return __awaiter(void 0, void 0, void 0, function () {
    var accumulated_errors, movement_data_wrapped, movement_data, micro_data_wrapped, micro_data, result, validated;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                accumulated_errors = [];
                return [4 /*yield*/, dataSource.Patient_Bewegung_Ps(parameters)];
            case 1:
                movement_data_wrapped = _a.sent();
                if (movement_data_wrapped.success)
                    movement_data = movement_data_wrapped.data;
                else {
                    accumulated_errors.push("error while validating response from Patient_Bewegung_Ps: " + movement_data_wrapped.errorMessage);
                    movement_data = movement_data_wrapped.rawData;
                }
                return [4 /*yield*/, dataSource.Patient_Labordaten_Ps(parameters)];
            case 2:
                micro_data_wrapped = _a.sent();
                if (micro_data_wrapped.success)
                    micro_data = micro_data_wrapped.data;
                else {
                    accumulated_errors.push("error while validating response from Patient_Labordaten_Ps: " + micro_data_wrapped.errorMessage);
                    micro_data = micro_data_wrapped.rawData;
                }
                return [4 /*yield*/, _callSubprocess(movement_data, micro_data)];
            case 3:
                result = _a.sent();
                result.nodes = result.nodes.map(function (node) {
                    return __assign(__assign({}, node), { time: new Date(parseInt(node.time) * 1000).toISOString(), pathogens: node.pathogens.map(function (pathogen) {
                            return {
                                pathogenID: pathogen.pathogenID,
                                result: true,
                                screening: pathogen.result === "1",
                            };
                        }) });
                });
                return [4 /*yield*/, types_1.validate("data/Praktikum_CF_2020_Result", result)];
            case 4:
                validated = _a.sent();
                if (validated.success) {
                    if (accumulated_errors.length === 0)
                        return [2 /*return*/, {
                                success: true,
                                data: validated.data,
                            }];
                    else
                        return [2 /*return*/, {
                                success: false,
                                rawData: validated.data,
                                errorMessage: accumulated_errors.join("\n\n"),
                            }];
                }
                else {
                    accumulated_errors.push("error while validating response from Praktikum_CF_2020: " + validated.errorMessage);
                    return [2 /*return*/, {
                            success: false,
                            rawData: validated.rawData,
                            errorMessage: accumulated_errors.join("\n\n"),
                        }];
                }
                return [2 /*return*/];
        }
    });
}); };
/**
 * Points to the executable of the algorithms.
 */
var EXECUTABLE_PATH = path.join(common_1.FOREIGN_LIBRARY_ROOT, "praktikumcf2020", "code", "bin", "main");
/**
 * The config of the executable matching the database abstraction of this project.
 */
var CONFIG_PATH = path.join(common_1.FOREIGN_LIBRARY_ROOT, "praktikumcf2020", "code", "config", "config_felix.json");
/**
 * Calls the actual executable and retrieves the resulting CSV files as objects.
 *
 * Warning: This is not engineered for security!
 *
 * @param movement_data the movement data to be delivered to the procedure for processing
 * @param micro_data the lab testing data to be delivered to the procedure for processing
 */
var _callSubprocess = function (movement_data, micro_data) { return __awaiter(void 0, void 0, void 0, function () {
    var result_dir, csv_result_nodes, csv_result_edges, to_argument, data_arguments, call, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, , 5, 6]);
                // prepare a temporary directory
                result_dir = tempy.directory();
                to_argument = function (data) { return "\"" + JSON.stringify(data).replace(/"/g, '\\"') + "\""; };
                data_arguments = "--move-json " + to_argument(movement_data) + " --micro-json " + to_argument(micro_data);
                call = "\"" + EXECUTABLE_PATH + "\" " + data_arguments + " --config-file \"" + CONFIG_PATH + "\" --out \"" + result_dir + "\"";
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                // ignore the output on success
                return [4 /*yield*/, child_process_promise_1.exec(call)];
            case 2:
                // ignore the output on success
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                throw new Error("could not execute procedure: " + error_1);
            case 4:
                // read the contents of the result file
                csv_result_nodes = fs.readFileSync(path.join(result_dir, "nodes.csv"), { encoding: 'utf8' });
                csv_result_edges = fs.readFileSync(path.join(result_dir, "edges.csv"), { encoding: 'utf8' });
                return [3 /*break*/, 6];
            case 5:
                if (result_dir)
                    try {
                        // try to delete the temporary directory but ignore when it fails
                        fs.rmdirSync(result_dir, { recursive: true });
                    }
                    catch (_b) {
                    }
                return [7 /*endfinally*/];
            case 6: 
            // if we arrive here csv_result contains the relevant result
            return [2 /*return*/, {
                    nodes: parseSpecialNodeCsv(csv_result_nodes, ",", ["nodeID", "time", "personID", "LocationID"], ["pathogenID", "result"]),
                    edges: parseCsv(csv_result_edges, ",", ["nodeID_start", "nodeID_end"]),
                }];
        }
    });
}); };
/**
 * Parses a string representing CSV data into an array of objects, one for each row.
 *
 * @param raw the raw string to process; assumed to contain a header row
 * @param separator the string to separate the elements of a row
 * @param header the names of the columns
 */
var parseCsv = function (raw, separator, header) {
    if (separator === void 0) { separator = ","; }
    // get rid of a trailing newline and split lines
    var lines = raw.trimEnd().split(/\r?\n/g);
    // get rid of the header row
    lines.shift();
    return lines.map(function (line) {
        var parts = line.split(separator);
        if (parts.length !== header.length)
            throw new Error("each row must have exactly as many elements as the header row");
        var entries = parts.map(function (part, index) { return [header[index], part]; });
        return Object.fromEntries(entries);
    });
};
/**
 * Parses a string representing some special CSV data from the node data. (Where the last two entries may get repeated.)
 *
 * @param raw the raw string to process; assumed to contain a header row
 * @param separator the string to separate the elements of a row
 * @param header_fixed the names of the columns that are always present
 * @param header_var the names of the columns that are present zero to many times in each row
 */
var parseSpecialNodeCsv = function (raw, separator, header_fixed, header_var) {
    if (separator === void 0) { separator = ","; }
    // get rid of a trailing newline and split lines
    var lines = raw.trimEnd().split(/\r?\n/g);
    // get rid of the header row
    lines.shift();
    return lines.flatMap(function (line) {
        var parts = line.split(separator);
        // parse fixed part
        if (parts.length < header_fixed.length)
            throw new Error("each row must have at least as many elements as the fixed header row");
        var part_fixed = parts.slice(0, header_fixed.length);
        var result_from_row = part_fixed.map(function (part, index) { return [header_fixed[index], part]; });
        // process chunks at the end
        var pathogens = [];
        var remaining = parts.slice(header_fixed.length);
        while (remaining.length > 0) {
            if (remaining.length < header_var.length)
                throw new Error("each row must have contain `header_fixed.length + n * header_var.length` values");
            // extract chunk
            var chunk = remaining.slice(0, header_var.length);
            remaining = remaining.slice(header_var.length);
            // append to results
            pathogens.push(Object.fromEntries(chunk.map(function (part, index) { return [header_var[index], part]; })));
        }
        result_from_row.push(["pathogens", pathogens]);
        return Object.fromEntries(result_from_row);
    });
};
//# sourceMappingURL=praktikumcf2020.js.map