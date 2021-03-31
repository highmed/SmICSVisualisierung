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
exports.IgdSqlDatabaseSource = void 0;
var types_1 = require("../types");
var mysql = require("mysql");
var config_1 = require("../../config");
var abstract_data_provider_1 = require("../abstract_data_provider");
/**
 * The interface to the MySQL database.
 *
 * This class does not handle time zones explicitly as the data base always runs in local time. This needs to be
 * validated in production.
 */
var IgdSqlDatabaseSource = /** @class */ (function (_super) {
    __extends(IgdSqlDatabaseSource, _super);
    /**
     * Disallow creation outside of this class.
     *
     * @private
     */
    function IgdSqlDatabaseSource() {
        var _this = _super.call(this) || this;
        /**
         * The pool of database connections that is used internally and is completely managed by the library.
         *
         * @private
         */
        _this.CONNECTION_POOL = mysql.createPool(config_1.default.igd_database_config);
        _this.GetHospitals = function (parameters) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this._low_level_call("GetHospitals", parameters, "data/Hospitals")];
            });
        }); };
        _this.Patient_Bewegung_Ps = function (parameters) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this._low_level_call("Patient_Bewegung_Ps", parameters, "data/Bewegungen", ["Beginn", "Ende"])];
            });
        }); };
        _this.Patient_Labordaten_Ps = function (parameters) { return __awaiter(_this, void 0, void 0, function () {
            var result, data, _i, data_1, labor;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._low_level_call("Patient_Labordaten_Ps", parameters, null, ["Auftragsdatum", "Eingangsdatum", "ZeitpunktProbenentnahme"])];
                    case 1:
                        result = _a.sent();
                        if (!result.success)
                            throw new Error("impossible state: validation could not fail as it was not requested");
                        data = result.data;
                        for (_i = 0, data_1 = data; _i < data_1.length; _i++) {
                            labor = data_1[_i];
                            if (!("Probenart" in labor)) {
                                labor.Probenart = labor.MaterialID;
                                delete labor.MaterialID;
                            }
                            // convert screening and befund to booleans
                            labor.Screening = labor.Screening === 1;
                            labor.Befund = labor.Befund === 1;
                        }
                        return [2 /*return*/, types_1.validate("data/Labordaten", data)];
                }
            });
        }); };
        _this.Contact_NthDegree_TTKP_Degree = function (parameters) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this._low_level_call("Contact_NthDegree_TTKP_Degree", __assign(__assign({}, parameters), { starttime: IgdSqlDatabaseSource._make_dates_compatible(parameters.starttime), endtime: IgdSqlDatabaseSource._make_dates_compatible(parameters.endtime) }), "data/Kontakte", ["Beginn", "Ende"])];
            });
        }); };
        _this.Labor_ErregerProTag_TTEsKSs = function (parameters) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this._low_level_call("Labor_ErregerProTag_TTEsKSs", __assign(__assign({}, parameters), { starttime: IgdSqlDatabaseSource._make_dates_compatible(parameters.starttime), endtime: IgdSqlDatabaseSource._make_dates_compatible(parameters.endtime) }), "data/ErregerProTag", ["Datum"])];
            });
        }); };
        _this.Patient_DiagnosticResults_Ps = function (parameters) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, types_1.validate("data/DiagnosticResults", parameters.patientList.map(function (patientID) {
                        return {
                            PatientID: patientID,
                            ICD_Code: "B34.2",
                            Diagnose: "Infektion durch Koronaviren nicht näher bezeichneter Lokalisation",
                            Freitextbeschreibung: "COVID-19, Virus nachgewiesen",
                            DokumentationsDatum: "2011-08-30T00:00:00+02:00",
                        };
                    }))];
            });
        }); };
        _this.Patient_PathogenFlag_Ps = function (parameters) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, types_1.validate("data/PathogenFlag", parameters.patientList.map(function (patientID) {
                        return {
                            PatientID: patientID,
                            Flag: true,
                            KeimID: "88274000",
                            Keim_l: "Trypanosoma escomelis",
                            DokumentationsDatum: "2011-08-28T00:00:00+02:00",
                        };
                    }))];
            });
        }); };
        /**
         * Serializes an Array of parameter values into an parameter array that can be given to an SQL procedure.
         *
         * @param values the values to be serialized
         * @return the transformed parameter array
         * @private
         */
        _this._serialize_parameter_values = function (values) {
            return values.map(function (x) {
                //  only arrays should need special treatment
                if (Array.isArray(x))
                    return String(x);
                else
                    return x;
            });
        };
        /**
         * Performs the actual query to the database and converts parameters and results as required.
         *
         * This method relies on the insertion/declaration order being equal to the order
         * returned by Object.values(). This is guaranteed by sufficiently recent JS
         * specifications. See also: https://stackoverflow.com/a/30919039/3753684.
         *
         * @param procedureName the name of the procedure to be called
         * @param parameters the parameters to be given to the procedure, with date fields already translated by
         *                   #_make_dates_compatible
         * @param resultDataSchema the name of the schema to be validated against or null if the result shall simply be cast
         *                         to the desired type without any checks (dangerous, no validation is performed!)
         * @param translateDatesToStrings field names of the result rows (objects) that shall be checked for being a date
         *                                and then be translated to match the validation requirements
         *
         * @return the resulting data or an error with a descriptive message
         * @private
         */
        _this._low_level_call = function (procedureName, parameters, resultDataSchema, translateDatesToStrings) {
            if (translateDatesToStrings === void 0) { translateDatesToStrings = []; }
            return __awaiter(_this, void 0, void 0, function () {
                var legacyProcedureName, query, parameterValues, parameterList, queryResult, _i, queryResult_1, typedRow, row, _a, translateDatesToStrings_1, field, value;
                var _this = this;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            legacyProcedureName = SqlLegacyProcedureNameTranslation.get(procedureName);
                            if (legacyProcedureName === undefined)
                                legacyProcedureName = procedureName; // assume it is already a legacy name
                            query = "CALL " + this.CONNECTION_POOL.escapeId(legacyProcedureName);
                            parameterValues = Object.values(parameters);
                            if (parameterValues.length > 0) {
                                parameterList = new Array(parameterValues.length)
                                    .fill("?")
                                    .join(",");
                                query = query.concat("(" + parameterList + ")");
                            }
                            return [4 /*yield*/, new Promise(function (resolve, reject) {
                                    return _this.CONNECTION_POOL.query({
                                        sql: query,
                                        timeout: 60000,
                                        values: _this._serialize_parameter_values(parameterValues),
                                    }, function (error, result, _) {
                                        if (error !== null)
                                            reject(error);
                                        else {
                                            if (result.length === 2)
                                                resolve(result[0]);
                                            // this should never occur. if it still does, one shall inspect the `result` variable
                                            else
                                                reject(Error("unexpected return value: received data but there were not exactly two elements in the result array"));
                                        }
                                    });
                                })
                                // perform special date handling
                            ];
                        case 1:
                            queryResult = _b.sent();
                            // perform special date handling
                            for (_i = 0, queryResult_1 = queryResult; _i < queryResult_1.length; _i++) {
                                typedRow = queryResult_1[_i];
                                row = typedRow;
                                // check for each filed in `translateDatesToStrings` whether translation is required
                                for (_a = 0, translateDatesToStrings_1 = translateDatesToStrings; _a < translateDatesToStrings_1.length; _a++) {
                                    field = translateDatesToStrings_1[_a];
                                    value = row[field];
                                    if (value instanceof Date)
                                        row[field] = value.toISOString();
                                }
                            }
                            if (resultDataSchema === null)
                                return [2 /*return*/, {
                                        success: true,
                                        data: queryResult,
                                    }];
                            else
                                return [2 /*return*/, types_1.validate(resultDataSchema, queryResult)];
                            return [2 /*return*/];
                    }
                });
            });
        };
        return _this;
    }
    /**
     * Converts date strings that are passed to MySQL. This mainly cuts away time zone information.
     *
     * @param date the date to convert; and error is raised if it is not a string; no error is raised if it is a rubbish
     *             string (!)
     * @return a string that will be accepted by the MySQL driver/interface
     * @throws if the given date is not a string
     * @private
     */
    IgdSqlDatabaseSource._make_dates_compatible = function (date) {
        // we check this dynamically in here to simplify calling code and because the type system cannot check it
        // anyways
        if (!(typeof date === "string"))
            throw new Error("date must be a string");
        // example case: 2015-11-13T20:20:39.000+00:00
        var dateWithPlusNotation = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{3})?[+-](\d{2}):(\d{2})/;
        if (dateWithPlusNotation.test(date))
            return date.slice(0, -6);
        // example case: 2015-11-13T20:20:39.000Z
        var dateWithZ = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{3})?Z/;
        if (dateWithZ.test(date))
            return date.slice(0, -1);
        // there are possibly some other cases too but if works well for now
        // in any other case, assume there is no time zone information at the end
        return date;
    };
    /**
     * A singleton managed by `acquireIgdSqlDatabaseSource()`. Do not modify or use it elsewhere.
     */
    IgdSqlDatabaseSource.INSTANCE = null;
    /**
     * Return an `IgdSqlDatabaseSource` (and create it if required).
     *
     * Multiple concurrent initial requests to this might create multiple distinct instances. Later requests are
     * thread-safe.
     */
    IgdSqlDatabaseSource.getInstance = function () {
        // thread-safe
        var local = IgdSqlDatabaseSource.INSTANCE;
        if (local === null) {
            local = new IgdSqlDatabaseSource();
            IgdSqlDatabaseSource.INSTANCE = local;
        }
        return local;
    };
    return IgdSqlDatabaseSource;
}(abstract_data_provider_1.AbstractDataSource));
exports.IgdSqlDatabaseSource = IgdSqlDatabaseSource;
/**
 * This mapping translates the new procedure names to the legacy names used in the SQL data base.
 * The names in the SQL data base are kept in order to maintain backwards compatibility.
 *
 * Most of these are not actually used.
 */
var SqlLegacyProcedureNameTranslation = new Map(Object.entries({
    Base_Krankenhaeuser: "GetHospitals",
    Base_Erreger_Es: "GetKeimBezByKeimList",
    Base_Station_KSs: "GetStationBezByStationList",
    Patient_Informationen_TTEKS: "GetPatientsInfoByTimeKeimStation",
    Base_Material_Ms: "GetMaterialBezByMaterialList",
    Contact_1stDegree_TTPK: "GetContactNetworkByTimePatient",
    Patient_Ersterkrankung_EPK: "IsPatientKrankByKeimPatientList",
    Labor_Untersuchungen_TTEPsK: "GetAllMikroDataInformationByTimeKeimListofPatientHospital",
    Contact_NthDegree_TTKP_Degree: "GetContactsNthDegreeByTimePatientDegree",
    Patient_Labordaten_Ps: "Patient_MikroDaten_Ps",
    Labor_AnzahlUntersuchungen_TTEsK: "GetMikroDataByTimeKeim",
    Patienten_Information_TTEKS: "GetPatientsInfoByTimeKeimStation",
}));
//# sourceMappingURL=igd_sql_database.js.map