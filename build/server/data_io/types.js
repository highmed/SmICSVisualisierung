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
exports.ensureIsValid = exports.validate = void 0;
var Ajv = require("ajv");
// @ts-ignore TODO remove ignore comment once https://github.com/cludden/ajv-moment/pull/21 is published
var ajv_moment_1 = require("ajv-moment");
var moment = require("moment");
var Arguments_Empty_JSON = require("./type_declarations/Arguments_Empty.json");
var Arguments_Ps_JSON = require("./type_declarations/Arguments_Ps.json");
var Arguments_TTEsKSs_JSON = require("./type_declarations/Arguments_TTEsKSs.json");
var Arguments_TTKP_Degree_JSON = require("./type_declarations/Arguments_TTKP_Degree.json");
var Arguments_TTPK_JSON = require("./type_declarations/Arguments_TTPK.json");
var Bewegungen_JSON = require("./type_declarations/Bewegungen.json");
var ErregerProTag_JSON = require("./type_declarations/ErregerProTag.json");
var Hospitals_JSON = require("./type_declarations/Hospitals.json");
var Kontakte_JSON = require("./type_declarations/Kontakte.json");
var Labordaten_JSON = require("./type_declarations/Labordaten.json");
var DiagnosticResults_JSON = require("./type_declarations/DiagnosticResults.json");
var PathogenFlag_JSON = require("./type_declarations/PathogenFlag.json");
var Praktikum_CF_2020_Result_JSON = require("./type_declarations/Praktikum_CF_2020_Result.json");
var ARGUMENT_SCHEMAS = [
    Arguments_Empty_JSON,
    Arguments_Ps_JSON,
    Arguments_TTEsKSs_JSON,
    Arguments_TTKP_Degree_JSON,
    Arguments_TTPK_JSON,
];
var DATA_SCHEMAS = [
    Bewegungen_JSON,
    ErregerProTag_JSON,
    Hospitals_JSON,
    Kontakte_JSON,
    Labordaten_JSON,
    DiagnosticResults_JSON,
    PathogenFlag_JSON,
    Praktikum_CF_2020_Result_JSON,
];
// see: https://github.com/ajv-validator/ajv#options for available options
var options = {
    // schemas
    schemas: ARGUMENT_SCHEMAS.concat(DATA_SCHEMAS),
    // how to parse
    format: "full",
    strictKeywords: true,
    strictNumbers: true,
    // how to report errors
    allErrors: true,
    verbose: true,
    // data cleaning
    removeAdditional: true,
    useDefaults: true,
    // misc
    async: true,
};
/**
 * The Ajv instance that already has all relevant schemas imported.
 */
var ajv = new Ajv(options);
// install the ajv-moment plugin
ajv_moment_1.plugin({ ajv: ajv, moment: moment });
/**
 * Validates the given thing against the schema with the specified name, which possibly also changes it or can fail.
 *
 * @param schema_name the name of the schema to validate against
 * @param something that data structure to validate
 */
exports.validate = function (schema_name, something) { return __awaiter(void 0, void 0, void 0, function () {
    var data, isValid;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, something
                // isValidMaybePromise might be a promise or not, depending on whether the schema was defined as such or not
            ]; // "convert" to a promise
            case 1:
                data = _a.sent() // "convert" to a promise
                ;
                return [4 /*yield*/, ajv.validate(schema_name, data)];
            case 2:
                isValid = _a.sent();
                if (isValid)
                    return [2 /*return*/, {
                            success: true,
                            data: data,
                        }];
                else
                    return [2 /*return*/, {
                            success: false,
                            rawData: data,
                            errorMessage: "could not validate data against schema \"" + schema_name + "\": " + ajv.errorsText() + "; data was " + JSON.stringify(data),
                        }];
                return [2 /*return*/];
        }
    });
}); };
/**
 * Validates the given thing against the schema with the specified name, which possibly also changes it or can fail.
 *
 * @param schema_name the name of the schema to validate against
 * @param something that data structure to validate
 */
exports.ensureIsValid = function (schema_name, something) { return __awaiter(void 0, void 0, void 0, function () {
    var validated;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, exports.validate(schema_name, something)];
            case 1:
                validated = _a.sent();
                if (validated.success)
                    return [2 /*return*/, validated.data];
                else
                    throw Error(validated.errorMessage);
                return [2 /*return*/];
        }
    });
}); };
//# sourceMappingURL=types.js.map