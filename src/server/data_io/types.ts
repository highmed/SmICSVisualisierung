import * as Ajv from "ajv"
// @ts-ignore TODO remove ignore comment once https://github.com/cludden/ajv-moment/pull/21 is published
import { plugin } from "ajv-moment"
import * as moment from "moment"
import * as Arguments_Empty_JSON from "./type_declarations/Arguments_Empty.json"
import * as Arguments_Ps_JSON from "./type_declarations/Arguments_Ps.json"
import * as Arguments_TTEsKSs_JSON from "./type_declarations/Arguments_TTEsKSs.json"
import * as Arguments_TTKP_Degree_JSON from "./type_declarations/Arguments_TTKP_Degree.json"
import * as Arguments_TTPK_JSON from "./type_declarations/Arguments_TTPK.json"
import * as Arguments_RKIalgo_JSON from "./type_declarations/Arguments_RKIalgo.json"
import * as Bewegungen_JSON from "./type_declarations/Bewegungen.json"
import * as ErregerProTag_JSON from "./type_declarations/ErregerProTag.json"
import * as Hospitals_JSON from "./type_declarations/Hospitals.json"
import * as Kontakte_JSON from "./type_declarations/Kontakte.json"
import * as Labordaten_JSON from "./type_declarations/Labordaten.json"
import * as DiagnosticResults_JSON from "./type_declarations/DiagnosticResults.json"
import * as PathogenFlag_JSON from "./type_declarations/PathogenFlag.json"
import * as Praktikum_CF_2020_Result_JSON from "./type_declarations/Praktikum_CF_2020_Result.json"
import * as RKIalgo_JSON from "./type_declarations/RKIalgo.json"
import { Arguments_Empty } from "./type_declarations/generated/Arguments_Empty"
import { Arguments_Ps } from "./type_declarations/generated/Arguments_Ps"
import { Arguments_TTEsKSs } from "./type_declarations/generated/Arguments_TTEsKSs"
import { Arguments_TTKP_Degree } from "./type_declarations/generated/Arguments_TTKP_Degree"
import { Arguments_TTPK } from "./type_declarations/generated/Arguments_TTPK"
import { Arguments_RKIalgo } from "./type_declarations/generated/Arguments_RKIalgo"
import { Bewegungen } from "./type_declarations/generated/Bewegungen"
import { ErregerProTag } from "./type_declarations/generated/ErregerProTag"
import { Hospitals } from "./type_declarations/generated/Hospitals"
import { Kontakte } from "./type_declarations/generated/Kontakte"
import { Labordaten } from "./type_declarations/generated/Labordaten"
import { DiagnosticResults } from "./type_declarations/generated/DiagnosticResults"
import { PathogenFlag } from "./type_declarations/generated/PathogenFlag"
import { RKIalgo } from "./type_declarations/generated/RKIalgo"
import { Praktikum_CF_2020_Result } from "./type_declarations/generated/Praktikum_CF_2020_Result"

/*
 * This file imports lots of type and corresponding schema definitions for the procedures. That simplifies the use of
 * them since this file becomes the single entry point for using them.
 *
 * It also provides the important function #ensureIsValid.
 */

export {
  Arguments_Empty,
  Arguments_Ps,
  Arguments_TTEsKSs,
  Arguments_TTKP_Degree,
  Arguments_TTPK,
  Arguments_RKIalgo,
}
const ARGUMENT_SCHEMAS: ReadonlyArray<object> = [
  Arguments_Empty_JSON,
  Arguments_Ps_JSON,
  Arguments_TTEsKSs_JSON,
  Arguments_TTKP_Degree_JSON,
  Arguments_TTPK_JSON,
  Arguments_RKIalgo_JSON,
]

export {
  Bewegungen,
  ErregerProTag,
  Hospitals,
  Kontakte,
  Labordaten,
  DiagnosticResults,
  PathogenFlag,
  Praktikum_CF_2020_Result,
  RKIalgo,
}
const DATA_SCHEMAS: ReadonlyArray<object> = [
  Bewegungen_JSON,
  ErregerProTag_JSON,
  Hospitals_JSON,
  Kontakte_JSON,
  Labordaten_JSON,
  DiagnosticResults_JSON,
  PathogenFlag_JSON,
  Praktikum_CF_2020_Result_JSON,
  RKIalgo_JSON,
]

// see: https://github.com/ajv-validator/ajv#options for available options
const options: Ajv.Options = {
  // schemas
  schemas: ARGUMENT_SCHEMAS.concat(DATA_SCHEMAS),

  // how to parse
  format: "full", // this is a bit slower but more strict
  strictKeywords: true, // schemas may not contain unknown keywords
  strictNumbers: true, // no NaNs and infinities

  // how to report errors
  allErrors: true, // return all errors, and not stop at the first one
  verbose: true, // return the schema name it was validated against and the data that violated it

  // data cleaning
  removeAdditional: true,
  useDefaults: true,

  // misc
  async: true, // not sure whether this actually works
}
/**
 * The Ajv instance that already has all relevant schemas imported.
 */
const ajv = new Ajv(options)

// install the ajv-moment plugin
plugin({ ajv, moment })

export type ValidationSuccess<T> = {
  success: true
  data: T
}
export type ValidationFailure<T> = {
  success: false
  rawData: unknown // this is intentionally named different than ValidationSuccess.data to make the semantic difference explicit in code
  errorMessage: string
}
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure<T>

/**
 * Validates the given thing against the schema with the specified name, which possibly also changes it or can fail.
 *
 * @param schema_name the name of the schema to validate against
 * @param something that data structure to validate
 */
export const validate = async <T>(
  schema_name: string,
  something: Promise<unknown> | unknown
): Promise<ValidationResult<T>> => {
  const data = await something // "convert" to a promise
  // isValidMaybePromise might be a promise or not, depending on whether the schema was defined as such or not
  const isValid = await ajv.validate(schema_name, data)
  if (isValid)
    return {
      success: true,
      data: data as T,
    }
  else
    return {
      success: false,
      rawData: data,
      errorMessage: `could not validate data against schema "${schema_name}": ${ajv.errorsText()}; data was ${JSON.stringify(
        data
      )}`,
    }
}

/**
 * Validates the given thing against the schema with the specified name, which possibly also changes it or can fail.
 *
 * @param schema_name the name of the schema to validate against
 * @param something that data structure to validate
 */
export const ensureIsValid = async <T>(
  schema_name: string,
  something: Promise<unknown> | unknown
): Promise<T> => {
  const validated = await validate<T>(schema_name, something)
  if (validated.success) return validated.data
  else throw Error(validated.errorMessage)
}
