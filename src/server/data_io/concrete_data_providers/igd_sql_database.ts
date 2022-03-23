import {
  Arguments_Empty,
  Arguments_Ps,
  Arguments_TTEsKSs,
  Arguments_TTKP_Degree,
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
import * as mysql from "mysql"
import CONFIG from "../../config"
import { AbstractDataSource } from "../abstract_data_provider"

/**
 * ! This file is not in use, our only datasource is the restAPI !
 */

/**
 * The interface to the MySQL database.
 *
 * This class does not handle time zones explicitly as the data base always runs in local time. This needs to be
 * validated in production.
 */
export class IgdSqlDatabaseSource extends AbstractDataSource {
  /**
   * Disallow creation outside of this class.
   *
   * @private
   */
  protected constructor() {
    super()
  }

  /**
   * A singleton managed by `acquireIgdSqlDatabaseSource()`. Do not modify or use it elsewhere.
   */
  private static INSTANCE: IgdSqlDatabaseSource | null = null

  /**
   * Return an `IgdSqlDatabaseSource` (and create it if required).
   *
   * Multiple concurrent initial requests to this might create multiple distinct instances. Later requests are
   * thread-safe.
   */
  public static getInstance = (): IgdSqlDatabaseSource => {
    // thread-safe
    let local = IgdSqlDatabaseSource.INSTANCE
    if (local === null) {
      local = new IgdSqlDatabaseSource()
      IgdSqlDatabaseSource.INSTANCE = local
    }
    return local
  }

  /**
   * The pool of database connections that is used internally and is completely managed by the library.
   *
   * @private
   */
  private readonly CONNECTION_POOL = mysql.createPool(
    CONFIG.igd_database_config
  )

  public GetHospitals = async (
    parameters: Arguments_Empty
  ): Promise<ValidationResult<Hospitals>> => {
    return this._low_level_call("GetHospitals", parameters, "data/Hospitals")
  }

  public Patient_Bewegung_Ps = async (
    parameters: Arguments_Ps
  ): Promise<ValidationResult<Bewegungen>> => {
    return this._low_level_call(
      "Patient_Bewegung_Ps",
      parameters,
      "data/Bewegungen",
      ["Beginn", "Ende"]
    )
  }

  public Patient_Labordaten_Ps = async (
    parameters: Arguments_Ps
  ): Promise<ValidationResult<Labordaten>> => {
    // query the data but disable type checks in here
    const result = await this._low_level_call<any[]>(
      "Patient_Labordaten_Ps",
      parameters,
      null,
      ["Auftragsdatum", "Eingangsdatum", "ZeitpunktProbenentnahme"]
    )
    if (!result.success)
      throw new Error(
        "impossible state: validation could not fail as it was not requested"
      )
    const data = result.data

    for (const labor of data) {
      if (!("Probenart" in labor)) {
        labor.Probenart = labor.MaterialID
        delete labor.MaterialID
      }
      // convert screening and befund to booleans
      labor.Screening = labor.Screening === 1
      labor.Befund = labor.Befund === 1
    }

    return validate<Labordaten>("data/Labordaten", data)
  }

  public Contact_NthDegree_TTKP_Degree = async (
    parameters: Arguments_TTKP_Degree
  ): Promise<ValidationResult<Kontakte>> => {
    return this._low_level_call(
      "Contact_NthDegree_TTKP_Degree",
      {
        ...parameters,
        starttime: IgdSqlDatabaseSource._make_dates_compatible(
          parameters.starttime
        ),
        endtime: IgdSqlDatabaseSource._make_dates_compatible(
          parameters.endtime
        ),
      },
      "data/Kontakte",
      ["Beginn", "Ende"]
    )
  }

  public Labor_ErregerProTag_TTEsKSs = async (
    parameters: Arguments_TTEsKSs
  ): Promise<ValidationResult<ErregerProTag>> => {
    return this._low_level_call(
      "Labor_ErregerProTag_TTEsKSs",
      {
        ...parameters,
        starttime: IgdSqlDatabaseSource._make_dates_compatible(
          parameters.starttime
        ),
        endtime: IgdSqlDatabaseSource._make_dates_compatible(
          parameters.endtime
        ),
      },
      "data/ErregerProTag",
      ["Datum"]
    )
  }

  public Patient_DiagnosticResults_Ps = async (
    parameters: Arguments_Ps
  ): Promise<ValidationResult<DiagnosticResults>> => {
    return validate<DiagnosticResults>(
      "data/DiagnosticResults",
      parameters.patientList.map((patientID) => {
        return {
          PatientID: patientID,
          ICD_Code: "B34.2",
          Diagnose:
            "Infektion durch Koronaviren nicht näher bezeichneter Lokalisation",
          Freitextbeschreibung: "COVID-19, Virus nachgewiesen",
          DokumentationsDatum: "2011-08-30T00:00:00+02:00",
        }
      })
    )
  }

  public Patient_PathogenFlag_Ps = async (
    parameters: Arguments_Ps
  ): Promise<ValidationResult<PathogenFlag>> => {
    return validate<PathogenFlag>(
      "data/PathogenFlag",
      parameters.patientList.map((patientID) => {
        return {
          PatientID: patientID,
          Flag: true,
          KeimID: "88274000",
          Keim_l: "Trypanosoma escomelis",
          DokumentationsDatum: "2011-08-28T00:00:00+02:00",
        }
      })
    )
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
  private static _make_dates_compatible(date: unknown): string {
    // we check this dynamically in here to simplify calling code and because the type system cannot check it
    // anyways
    if (!(typeof date === "string")) throw new Error("date must be a string")

    // example case: 2015-11-13T20:20:39.000+00:00
    let dateWithPlusNotation = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{3})?[+-](\d{2}):(\d{2})/
    if (dateWithPlusNotation.test(date)) return date.slice(0, -6)

    // example case: 2015-11-13T20:20:39.000Z
    let dateWithZ = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{3})?Z/
    if (dateWithZ.test(date)) return date.slice(0, -1)

    // there are possibly some other cases too but if works well for now

    // in any other case, assume there is no time zone information at the end
    return date
  }

  /**
   * Serializes an Array of parameter values into an parameter array that can be given to an SQL procedure.
   *
   * @param values the values to be serialized
   * @return the transformed parameter array
   * @private
   */
  private _serialize_parameter_values = (values: unknown[]): unknown[] => {
    return values.map((x) => {
      //  only arrays should need special treatment
      if (Array.isArray(x)) return String(x)
      else return x
    })
  }

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
  private _low_level_call = async <T>(
    procedureName: string,
    parameters: object,
    resultDataSchema: string | null,
    translateDatesToStrings: string[] = []
  ): Promise<ValidationResult<T>> => {
    let legacyProcedureName = SqlLegacyProcedureNameTranslation.get(
      procedureName
    )
    if (legacyProcedureName === undefined) legacyProcedureName = procedureName // assume it is already a legacy name

    let query = `CALL ${this.CONNECTION_POOL.escapeId(legacyProcedureName)}`

    const parameterValues = Object.values(parameters)
    if (parameterValues.length > 0) {
      // use placeholders to automate escaping of parameters and for a bit of security/safety (although the first
      // is not our concern in this project)
      // Caution: while this might look like a prepared statement, it really is more primitive and replaces
      // placeholders in comments in string literals too, see https://github.com/mysqljs/mysql#escaping-query-values
      const parameterList = new Array(parameterValues.length)
        .fill("?")
        .join(",")
      query = query.concat(`(${parameterList})`)
    }

    // perform the query and transform the result from callbacks into a promise
    const queryResult = await new Promise<unknown[]>((resolve, reject) =>
      this.CONNECTION_POOL.query(
        {
          sql: query,
          timeout: 60000, // in milliseconds
          values: this._serialize_parameter_values(parameterValues),
        },
        (error, result, _) => {
          if (error !== null) reject(error)
          else {
            if (result.length === 2) resolve(result[0])
            // this should never occur. if it still does, one shall inspect the `result` variable
            else
              reject(
                Error(
                  "unexpected return value: received data but there were not exactly two elements in the result array"
                )
              )
          }
        }
      )
    )

    // perform special date handling
    for (const typedRow of queryResult) {
      // deliberately disable the type checks on `row`
      const row: any = typedRow
      // check for each filed in `translateDatesToStrings` whether translation is required
      for (const field of translateDatesToStrings) {
        // we only transform if there is an actual Date object in that field (kind of hacky approach but works)
        const value = row[field]
        if (value instanceof Date) row[field] = value.toISOString()
      }
    }

    if (resultDataSchema === null)
      return {
        success: true,
        data: (queryResult as unknown) as T,
      }
    else return validate<T>(resultDataSchema, queryResult)
  }
}

/**
 * This mapping translates the new procedure names to the legacy names used in the SQL data base.
 * The names in the SQL data base are kept in order to maintain backwards compatibility.
 *
 * Most of these are not actually used.
 */
const SqlLegacyProcedureNameTranslation: ReadonlyMap<string, string> = new Map(
  Object.entries({
    Base_Krankenhaeuser: "GetHospitals",
    Base_Erreger_Es: "GetKeimBezByKeimList",
    Base_Station_KSs: "GetStationBezByStationList",
    Patient_Informationen_TTEKS: "GetPatientsInfoByTimeKeimStation",
    Base_Material_Ms: "GetMaterialBezByMaterialList",
    Contact_1stDegree_TTPK: "GetContactNetworkByTimePatient",
    Patient_Ersterkrankung_EPK: "IsPatientKrankByKeimPatientList",
    Labor_Untersuchungen_TTEPsK:
      "GetAllMikroDataInformationByTimeKeimListofPatientHospital", // [sic]
    Contact_NthDegree_TTKP_Degree: "GetContactsNthDegreeByTimePatientDegree",
    Patient_Labordaten_Ps: "Patient_MikroDaten_Ps",
    Labor_AnzahlUntersuchungen_TTEsK: "GetMikroDataByTimeKeim",
    Patienten_Information_TTEKS: "GetPatientsInfoByTimeKeimStation",
  })
)
