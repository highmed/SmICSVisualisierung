"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.RestAPI = void 0;
var types_1 = require("../types");
var abstract_data_provider_1 = require("../abstract_data_provider");
var node_fetch_1 = require("node-fetch");
/**
 * The data source accessing the HTTP(S) REST API of the MAH.
 *
 * An instance does not have any state beyond the URL to the API entry.
 */
var RestAPI = /** @class */ (function (_super) {
    __extends(RestAPI, _super);
    /**
     * Create a new data source instance.
     *
     * @param url the entry to the REST API; a missing slash at the end is automatically appended
     */
    function RestAPI(url) {
        var _this = _super.call(this) || this;
        _this.GetHospitals = function (_) { return __awaiter(_this, void 0, void 0, function () {
            var staticData;
            return __generator(this, function (_a) {
                staticData = [
                    {
                        id: 0,
                        BEZL: "Hannover Medical School",
                        BEZK: "MHH",
                        Lat: 52.3815,
                        Lon: 9.80181,
                    },
                    {
                        id: 1,
                        BEZL: "Charité – Universitätsmedizin Berlin",
                        BEZK: "Charité",
                        Lat: 52.5236194,
                        Lon: 13.3781747,
                    },
                ];
                return [2 /*return*/, types_1.validate("data/Hospitals", staticData)];
            });
        }); };
        _this.Patient_Bewegung_Ps = function (parameters) { return __awaiter(_this, void 0, void 0, function () {
            var result, data, _i, data_1, bewegung, mapping, as_string, sorted;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._low_level_call("Patient_Bewegung_Ps", parameters, null)];
                    case 1:
                        result = _a.sent();
                        if (!result.success)
                            throw new Error("impossible state: validation could not fail as it was not requested");
                        data = result.data;
                        for (_i = 0, data_1 = data; _i < data_1.length; _i++) {
                            bewegung = data_1[_i];
                            if (!("CaseID" in bewegung)) {
                                // this is missing in the REST API
                                // we set this to an arbitrary valid constant value
                                bewegung.CaseID = 2;
                            }
                            if (!("Bewegungstyp" in bewegung) && "BewegungstypID" in bewegung) {
                                mapping = {
                                    1: "Aufnahme",
                                    2: "Entlassung",
                                    3: "Wechsel",
                                    4: "Behandlung",
                                    6: "Abwesenheit-Beginn",
                                    7: "Abwesenheit-Ende",
                                };
                                as_string = mapping[bewegung.BewegungstypID];
                                if (as_string !== undefined)
                                    bewegung.Bewegungstyp = as_string;
                                // else leave that field missing
                            }
                        }
                        sorted = data.sort(function (a, b) {
                            return compareOptTimestamps(a.Beginn, b.Beginn);
                        });
                        return [2 /*return*/, types_1.validate("data/Bewegungen", sorted)];
                }
            });
        }); };
        _this.Patient_Labordaten_Ps = function (parameters) { return __awaiter(_this, void 0, void 0, function () {
            var result, data, _i, data_2, labor, sorted;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._low_level_call("Patient_Labordaten_Ps", parameters, null)];
                    case 1:
                        result = _a.sent();
                        if (!result.success)
                            throw new Error("impossible state: validation could not fail as it was not requested");
                        data = result.data;
                        for (_i = 0, data_2 = data; _i < data_2.length; _i++) {
                            labor = data_2[_i];
                            if (!("MREKlasseID" in labor)) {
                                // this might be missing if the pathogen is a virus (like SARS-COV-2/COVID-19)
                                labor.MREKlasseID = "4"; // make this a constant 4
                            }
                        }
                        sorted = data.sort(function (a, b) {
                            return compareOptTimestamps(a.ZeitpunktProbenentnahme, b.ZeitpunktProbenentnahme);
                        });
                        return [2 /*return*/, types_1.validate("data/Labordaten", sorted)];
                }
            });
        }); };
        _this.Contact_NthDegree_TTKP_Degree = function (parameters) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this._low_level_call("Contact_NthDegree_TTKP_Degree", parameters, "data/Kontakte")];
            });
        }); };
        _this.Labor_ErregerProTag_TTEsKSs = function (parameters) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this._low_level_call("Labor_ErregerProTag_TTEsKSs", parameters, "data/ErregerProTag")];
            });
        }); };
        _this.Patient_DiagnosticResults_Ps = function (parameters) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this._low_level_call("Patient_DiagnosticResults_Ps", parameters, "data/DiagnosticResults")];
            });
        }); };
        _this.Patient_PathogenFlag_Ps = function (parameters) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this._low_level_call("Patient_PathogenFlag_Ps", parameters, "data/PathogenFlag")];
            });
        }); };
        /**
         * Performs the actual query to the REST API.
         *
         * @param procedureName the name of the procedure to be called; may not have a leading or preceding slash as might
         *                      be usual for REST API endpoints
         * @param parameters the parameters to be given to the procedure
         * @param resultDataSchema the name of the schema to be validated against or null if the result shall simply be cast
         *                         to the desired type without any checks (dangerous, no validation is performed!)
         *
         * @return the resulting data or an error with a descriptive message
         * @private
         */
        _this._low_level_call = function (procedureName, parameters, resultDataSchema) { return __awaiter(_this, void 0, void 0, function () {
            var body, response, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        body = JSON.stringify(parameters);
                        console.log("end point " + procedureName + " has been called with: data: " + body);
                        return [4 /*yield*/, node_fetch_1.default(this.url.concat(procedureName), {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    Accept: "application/json",
                                },
                                body: body,
                            })
                            // check for HTTP status codes outside of OK/2XX (that is the interval [200, 300[ ) and transform them into an error
                        ];
                    case 1:
                        response = _a.sent();
                        // check for HTTP status codes outside of OK/2XX (that is the interval [200, 300[ ) and transform them into an error
                        if (!response.ok)
                            throw Error("HTTP(S) response code was not status OK/2XX: " + response.status + " - " + response.statusText);
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        if (resultDataSchema === null)
                            return [2 /*return*/, {
                                    success: true,
                                    data: data,
                                }];
                        else
                            return [2 /*return*/, types_1.validate(resultDataSchema, data)];
                        return [2 /*return*/];
                }
            });
        }); };
        if (!url.endsWith("/"))
            url = url.concat("/");
        _this.url = url;
        return _this;
    }
    return RestAPI;
}(abstract_data_provider_1.AbstractDataSource));
exports.RestAPI = RestAPI;
/**
 * Compares two time stamps that are encoded as strings. These semantics are used:
 * `Date(0) <= some valid date < null < undefined`.
 *
 * @param a the date on the left-hand side
 * @param b the date on the right-hand side
 * @return a strictly negative number if a < b, exactly zero if a = b and a strictly positive number if a > b;
 *         this is the same semantic as used by the `compareFunction` given to `Array.prototype.sort()`
 */
var compareOptTimestamps = function (a, b) {
    // local function that translates from dates to numbers to make the comparison a simple subtraction
    function toNum(date) {
        switch (date) {
            case undefined:
                return Number.MAX_SAFE_INTEGER - 1;
            case null:
                return Number.MAX_SAFE_INTEGER - 2;
            default:
                // way less than `Number.MAX_SAFE_INTEGER`,
                // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#Description
                return new Date(date).getTime();
        }
    }
    return toNum(a) - toNum(b);
};
//# sourceMappingURL=rest_api.js.map