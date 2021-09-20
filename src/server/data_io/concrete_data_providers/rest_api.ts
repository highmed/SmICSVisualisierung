import {
  Arguments_Empty,
  Arguments_Ps,
  Arguments_TTEsKSs,
  Arguments_TTKP_Degree,
  Arguments_RKIalgo,
  Bewegungen,
  DiagnosticResults,
  ErregerProTag,
  Hospitals,
  Kontakte,
  Labordaten,
  PathogenFlag,
  validate,
  ValidationResult,
} from "../types"
import { AbstractDataSource } from "../abstract_data_provider"
import { default as fetch } from "node-fetch"

import CONFIG from "../../config"

/**
 * The data source accessing the HTTP(S) REST API of the MAH.
 *
 * An instance does not have any state beyond the URL to the API entry.
 */
export class RestAPI extends AbstractDataSource {
  /**
   * The url to the API entry. Ends with a slash.
   *
   * @private
   */
  private readonly url: string

  /**
   * Create a new data source instance.
   *
   * @param url the entry to the REST API; a missing slash at the end is automatically appended
   */
  constructor(url: string) {
    super()
    if (!url.endsWith("/")) url = url.concat("/")
    this.url = url
  }

  public GetHospitals = async (
    _: Arguments_Empty
  ): Promise<ValidationResult<Hospitals>> => {
    // the REST API does not have this endpoint, so we return some static content here
    const staticData = [
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
    ]
    return validate<Hospitals>("data/Hospitals", staticData)
  }

  public Patient_Bewegung_Ps = async (
    parameters: Arguments_Ps
  ): Promise<ValidationResult<Bewegungen>> => {
    // query the data but disable type checks in here
    const result = await this._low_level_call<any[]>(
      "Patient_Bewegung_Ps",
      parameters,
      null
    )
    if (!result.success)
      throw new Error(
        "impossible state: validation could not fail as it was not requested"
      )
    const data = result.data

    for (const bewegung of data) {
      if (!("CaseID" in bewegung)) {
        // this is missing in the REST API
        // we set this to an arbitrary valid constant value
        bewegung.CaseID = 2
      }

      if (!("Bewegungstyp" in bewegung) && "BewegungstypID" in bewegung) {
        const mapping: { [k: number]: string } = {
          1: "Aufnahme",
          2: "Entlassung",
          3: "Wechsel",
          4: "Behandlung",
          6: "Abwesenheit-Beginn",
          7: "Abwesenheit-Ende",
        }
        const as_string = mapping[bewegung.BewegungstypID]
        if (as_string !== undefined) bewegung.Bewegungstyp = as_string
        // else leave that field missing
      }
    }

    const sorted: unknown = data.sort((a, b) =>
      compareOptTimestamps(a.Beginn, b.Beginn)
    )

    return validate<Bewegungen>("data/Bewegungen", sorted)
  }

  public Patient_Labordaten_Ps = async (
    parameters: Arguments_Ps
  ): Promise<ValidationResult<Labordaten>> => {
    // query the data but disable type checks in here
    const result = await this._low_level_call<any[]>(
      "Patient_Labordaten_Ps",
      parameters,
      null
    )
    if (!result.success)
      throw new Error(
        "impossible state: validation could not fail as it was not requested"
      )
    const data = result.data

    for (const labor of data) {
      if (!("MREKlasseID" in labor)) {
        // this might be missing if the pathogen is a virus (like SARS-COV-2/COVID-19)
        labor.MREKlasseID = "4" // make this a constant 4
      }
    }

    const sorted: unknown = data.sort((a, b) =>
      compareOptTimestamps(a.ZeitpunktProbenentnahme, b.ZeitpunktProbenentnahme)
    )

    return validate<Labordaten>("data/Labordaten", sorted)
  }

  public Contact_NthDegree_TTKP_Degree = async (
    parameters: Arguments_TTKP_Degree
  ): Promise<ValidationResult<Kontakte>> => {
    return this._low_level_call(
      "Contact_NthDegree_TTKP_Degree",
      parameters,
      "data/Kontakte"
    )
  }

  public Labor_ErregerProTag_TTEsKSs = async (
    parameters: Arguments_TTEsKSs
  ): Promise<ValidationResult<ErregerProTag>> => {
    return this._low_level_call(
      "Labor_ErregerProTag_TTEsKSs",
      parameters,
      "data/ErregerProTag"
    )
  }

  public RKIalgo = async (
    parameters: Arguments_RKIalgo
  ): Promise<ValidationResult<Arguments_RKIalgo>> => {
    return this._low_level_call("RKIalgo", parameters, "data/RKIalgo")
  }

  public Patient_DiagnosticResults_Ps = async (
    parameters: Arguments_Ps
  ): Promise<ValidationResult<DiagnosticResults>> => {
    return this._low_level_call(
      "Patient_DiagnosticResults_Ps",
      parameters,
      "data/DiagnosticResults"
    )
  }

  public Patient_PathogenFlag_Ps = async (
    parameters: Arguments_Ps
  ): Promise<ValidationResult<PathogenFlag>> => {
    return this._low_level_call(
      "Patient_PathogenFlag_Ps",
      parameters,
      "data/PathogenFlag"
    )
  }

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
  private readonly _low_level_call = async <T>(
    procedureName: string,
    parameters: object,
    resultDataSchema: string | null
  ): Promise<ValidationResult<T>> => {
    const body = JSON.stringify(parameters)
    const authorization = `bearer ${this.authToken}`

    const request = {
      method: CONFIG.use_auth ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...(CONFIG.use_auth && { "Authorization": authorization })
      },
      ...(CONFIG.use_auth && { body })
    }
    console.log(
      `end point ${procedureName} has been called with request data: ${JSON.stringify(request)}`
    )
    const response = await fetch(this.url.concat(procedureName), request)
      
    // check for HTTP status codes outside of OK/2XX (that is the interval [200, 300[ ) and transform them into an error
    if (!response.ok)
      throw Error(
        `HTTP(S) response code was not status OK/2XX: ${response.status} - ${response.statusText}`
      )

    const data: unknown = await response.json()

    if (resultDataSchema === null)
      return {
        success: true,
        data: data as T,
      }
    else return validate<T>(resultDataSchema, data)
  }
}

type MaybeString = string | null | undefined

/**
 * Compares two time stamps that are encoded as strings. These semantics are used:
 * `Date(0) <= some valid date < null < undefined`.
 *
 * @param a the date on the left-hand side
 * @param b the date on the right-hand side
 * @return a strictly negative number if a < b, exactly zero if a = b and a strictly positive number if a > b;
 *         this is the same semantic as used by the `compareFunction` given to `Array.prototype.sort()`
 */
const compareOptTimestamps = (a: MaybeString, b: MaybeString): number => {
  // local function that translates from dates to numbers to make the comparison a simple subtraction
  function toNum(date: string | null | undefined) {
    switch (date) {
    case undefined:
      return Number.MAX_SAFE_INTEGER - 1
    case null:
      return Number.MAX_SAFE_INTEGER - 2
    default:
      // way less than `Number.MAX_SAFE_INTEGER`,
      // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#Description
      return new Date(date).getTime()
    }
  }

  return toNum(a) - toNum(b)
}
