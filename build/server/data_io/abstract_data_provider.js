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
exports.AbstractDataSource = void 0;
var types_1 = require("./types");
var praktikumcf2020_1 = require("../foreign_libraries/interfaces/praktikumcf2020");
/**
 * This is the base interface that needs to be supported by *all* data sources.
 *
 * The actual procedures are not documented here as they are used in more projects than this one.
 *
 * Please note that calls to individual procedures might return errors in their promises. However, validation errors
 * arising from checking the returned data are not raised but instead delivered in a separate object. This allows to
 * recover from or ignore such errors.
 *
 * Notes for subclasses:
 * ---------------------
 * Some data sources might return rejected promises (i.e. errors) for non-implemented procedures. However, they need to
 * need to do so explicitly to avoid missing any procedures by accident. It should usually not be required to override
 * `callByName` with a custom implementation.
 *
 * One of the main tasks of a subclass is to make sure that the data source and its specifics are somewhat hidden and
 * to convert to and from the common data structures to achieve that.
 */
var AbstractDataSource = /** @class */ (function () {
    function AbstractDataSource() {
        var _this = this;
        /**
         * Call a procedure by its name with some given parameters. This is the dynamic alternative to calling the
         * respective procedure directly.
         *
         * @param name the name of the procedure
         * @param parameter the parameters to deliver to the procedure; may be empty `{}` of none shall be given
         *
         * @return the resulting data or an error with a descriptive message
         */
        this.callByName = function (name, parameter) { return __awaiter(_this, void 0, void 0, function () {
            var specification, method, validatedParameter;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        specification = AbstractDataSource.MAPPING.get(name);
                        if (specification === undefined)
                            throw new Error("There was en error trying to call the procedure: no procedure with the name \"" + name + "\" was found");
                        method = this[name] // this translation is not type checked!
                        ;
                        return [4 /*yield*/, types_1.ensureIsValid(specification.arguments, parameter)];
                    case 1:
                        validatedParameter = _a.sent();
                        return [2 /*return*/, method(validatedParameter)];
                }
            });
        }); };
        this.Praktikum_CF_2020 = function (parameters) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, praktikumcf2020_1.call_Praktikum_CF_2020(this, parameters)];
            });
        }); };
    }
    /**
     * Contains mappings from all supported procedures to their argument and result schema names.
     *
     * @private
     */
    AbstractDataSource.MAPPING = new Map(Object.entries({
        GetHospitals: {
            arguments: "args/Arguments_Empty",
            results: "data/Hospitals",
        },
        Patient_Bewegung_Ps: {
            arguments: "args/Arguments_Ps",
            results: "data/Bewegungen",
        },
        Patient_Labordaten_Ps: {
            arguments: "args/Arguments_Ps",
            results: "data/Labordaten",
        },
        Contact_NthDegree_TTKP_Degree: {
            arguments: "args/Arguments_TTKP_Degree",
            results: "data/Kontakte",
        },
        Labor_ErregerProTag_TTEsKSs: {
            arguments: "args/Arguments_TTEsKSs",
            results: "data/ErregerProTag",
        },
        Patient_DiagnosticResults_Ps: {
            arguments: "args/Arguments_Ps",
            results: "data/DiagnosticResults",
        },
        Patient_PathogenFlag_Ps: {
            arguments: "args/Arguments_Ps",
            results: "data/PathogenFlag",
        },
        Praktikum_CF_2020: {
            arguments: "args/Arguments_Ps",
            results: "data/Praktikum_CF_2020_Result",
        },
    }));
    return AbstractDataSource;
}());
exports.AbstractDataSource = AbstractDataSource;
//# sourceMappingURL=abstract_data_provider.js.map