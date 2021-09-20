import {
  Arguments_Empty,
  Arguments_Ps,
  Arguments_TTEsKSs,
  Arguments_TTKP_Degree,
  Bewegungen,
  DiagnosticResults,
  ensureIsValid,
  ErregerProTag,
  Hospitals,
  Kontakte,
  Labordaten,
  PathogenFlag,
  Praktikum_CF_2020_Result,
  ValidationResult,
} from "./types"
import { call_Praktikum_CF_2020 } from "../foreign_libraries/interfaces/praktikumcf2020"

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
export abstract class AbstractDataSource {
  /**
   * Contains mappings from all supported procedures to their argument and result schema names.
   *
   * @private
   */
  private static readonly MAPPING: ReadonlyMap<
    string,
    { arguments: string; results: string }
  > = new Map(
    Object.entries({
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
      RKIalgo: {
        arguments: "args/Arguments_RKIalgo",
        results: "data/RKIalgo",
      },
    })
  )

  /**
   * The token string used to authenticate requests of data provider.
   *
   * @protected
   */
   protected authToken: string

   /**
   * Constructor used to initialize default values of abstract data provider.
   */
   constructor() {
     this.authToken = ""
   }

  /**
   * Call a procedure by its name with some given parameters. This is the dynamic alternative to calling the
   * respective procedure directly.
   *
   * @param name the name of the procedure
   * @param parameter the parameters to deliver to the procedure; may be empty `{}` of none shall be given
   * @param authToken the optional token used to authenticate requests of data provider
   *
   * @return the resulting data or an error with a descriptive message
   */
  public readonly callByName = async (
    name: string,
    parameter: object,
    authToken?: string
  ): Promise<ValidationResult<unknown>> => {
    this.authToken = authToken || ""
    const specification = AbstractDataSource.MAPPING.get(name)
    if (specification === undefined)
      throw new Error(
        `There was en error trying to call the procedure: no procedure with the name "${name}" was found`
      )

    const method: (
      param: object
    ) => Promise<ValidationResult<unknown>> = (this as any)[name] // this translation is not type checked!
    const validatedParameter = await ensureIsValid<object>(
      specification.arguments,
      parameter
    )
    return method(validatedParameter)
  }

  public abstract GetHospitals: (
    parameters: Arguments_Empty
  ) => Promise<ValidationResult<Hospitals>>

  public abstract Patient_Bewegung_Ps: (
    parameters: Arguments_Ps
  ) => Promise<ValidationResult<Bewegungen>>

  public abstract Patient_Labordaten_Ps: (
    parameters: Arguments_Ps
  ) => Promise<ValidationResult<Labordaten>>

  public abstract Contact_NthDegree_TTKP_Degree: (
    parameters: Arguments_TTKP_Degree
  ) => Promise<ValidationResult<Kontakte>>

  public abstract Labor_ErregerProTag_TTEsKSs: (
    parameters: Arguments_TTEsKSs
  ) => Promise<ValidationResult<ErregerProTag>>

  public abstract Patient_DiagnosticResults_Ps: (
    parameters: Arguments_Ps
  ) => Promise<ValidationResult<DiagnosticResults>>

  public abstract Patient_PathogenFlag_Ps: (
    parameters: Arguments_Ps
  ) => Promise<ValidationResult<PathogenFlag>>

  public Praktikum_CF_2020 = async (
    parameters: Arguments_Ps
  ): Promise<ValidationResult<Praktikum_CF_2020_Result>> => {
    return call_Praktikum_CF_2020(this, parameters)
  }
}
