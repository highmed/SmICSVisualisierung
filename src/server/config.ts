import * as process from "process"
import { PoolConfig } from "mysql"

/**
 * This entirely static class contains the configuration of the webserver and data sources.
 */
export default class CONFIG {
  /**
   * The HTTP port that is either taken from the `HTTP_PORT` environment variable or else defaults to `3231`.
   */
  public static readonly http_port: number =
    process.env.HTTP_PORT !== undefined ? parseInt(process.env.HTTP_PORT) : 3231

  /**
   * The HTTPS port that is either taken from the `HTTPS_PORT` environment variable or else defaults to `3232`.
   */
  public static readonly https_port: number =
    process.env.HTTPS_PORT !== undefined
      ? parseInt(process.env.HTTPS_PORT)
      : 3232

  /**
   * This flag is used to suppress logging while unit testing. It is either set via the `IS_TESTING` environment
   * variable or else defaults to `false`.
   */
  public static is_testing: boolean =
    process.env.IS_TESTING !== undefined
      ? process.env.IS_TESTING.toLowerCase() === "true"
      : false

  /**
   * The configuration for connecting with the internal MySQL database. See #PoolConfig for available options.
   */
  public static readonly igd_database_config: PoolConfig = {
    host: "highmeddatstring.igd.fraunhofer.de",
    port: 1812,
    user: "root",
    password: "u7GE5n9k",
    database: "hmhdnov18",
    connectionLimit: 4,
    // the data base is not in UTC but instead in the local time of Darmstadt, Germany
    // this setting assumes that the server is in that very same time zone
    timezone: "local",
    dateStrings: false, // we want this conversion but also need to convert back to strings for the JSON schema validation
  }

  /**
   * The access information for the REST API of the MAH that is used internally to this class in order to create the
   * public #rest_api_path.
   *
   * @private
   */
  private static readonly rest_api_config = {
    protocol: "http",
    hostname: "localhost",
    // hostname: "192.168.0.108", // EntwicklungsVM IP (SmICS)
    // !DEV-REST-API (switch port)
    port: 9787,
    // port: 9000, // fuer lokale Entwicklung (VS Code Extension)
    // !DEV-REST-API (switch path)
    path: "/api/StoredProcedures/", // needs to end with a slash
    // path: "/", // for development on vs code extension and local files
  }

  /**
   * The complete URL of REST API of the MAH. Ends with a slash.
   */
  public static readonly rest_api_path = `${CONFIG.rest_api_config.protocol}://${CONFIG.rest_api_config.hostname}:${CONFIG.rest_api_config.port}${CONFIG.rest_api_config.path}`
}
