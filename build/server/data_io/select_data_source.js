"use strict";
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
exports.resolveDataSource = exports.ALL_DATA_SOURCES = void 0;
var igd_sql_database_1 = require("./concrete_data_providers/igd_sql_database");
var rest_api_1 = require("./concrete_data_providers/rest_api");
var config_1 = require("../config");
/**
 * Used only by #resolveDataSource to not always create a new one.
 */
var restDataSource = new rest_api_1.RestAPI(config_1.default.rest_api_path);
/**
 * A list of all available data source identifiers that are known to #resolveDataSource. They are case sensitive.
 */
exports.ALL_DATA_SOURCES = ["hmhdnov18_sql", "rest"];
/**
 * Finds the data source for a given identifier. See #ALL_DATA_SOURCES for a list of available ones.
 *
 * @param identifier the case-sensitive identifier to find the concrete data source for
 * @return the right data source
 * @throws and error message and a list of all available data sources if an data provider is requested
 */
exports.resolveDataSource = function (identifier) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (identifier) {
            case "hmhdnov18_sql":
                return [2 /*return*/, igd_sql_database_1.IgdSqlDatabaseSource.getInstance()]; // retrieve the singleton instance
            case "rest":
                return [2 /*return*/, restDataSource];
            default:
                throw new Error("Unknown data source selected: \"" + identifier + "\". Available are: [" + exports.ALL_DATA_SOURCES + "]");
        }
        return [2 /*return*/];
    });
}); };
//# sourceMappingURL=select_data_source.js.map