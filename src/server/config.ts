import * as process from "process"
import { PoolConfig } from "mysql"
import * as dotenv from "dotenv"

dotenv.config()

/**
 * This entirely static class contains the configuration of the webserver and data sources.
 */
export default class CONFIG {
  public static readonly smics_hostname: string =
    process.env.SMICS_HOSTNAME !== undefined
      ? process.env.SMICS_HOSTNAME
      : "localhost"

  public static readonly smics_port: number =
    process.env.SMICS_PORT !== undefined
      ? parseInt(process.env.SMICS_PORT)
      : 9000

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
   * This flag is used to suppress logging while unit testing the webserver.
   * It is either set via the `IS_TESTING` environment variable or else defaults to `false`.
   */
  public static readonly is_testing: boolean =
    process.env.IS_TESTING !== undefined
      ? process.env.IS_TESTING.toLowerCase() === "true"
      : false

  /**
   * This flag is used to differentiate between production and development settings for the webserver.
   * It is either set via the `DEV_MODE` environment variable or else defaults to `true`.
   */
  public static readonly dev_mode: boolean =
    process.env.DEV_MODE !== undefined
      ? process.env.DEV_MODE.toLowerCase() !== "false"
      : true

  /**
   * This flag is used to decide whether to enable or diable authentication for the webserver.
   * It is either set via the `USE_AUTH` environment variable or else defaults to `false`.
   */
  public static readonly use_auth: boolean =
    process.env.USE_AUTH !== undefined
      ? process.env.USE_AUTH.toLowerCase() === "true"
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
    hostname: CONFIG.dev_mode ? CONFIG.smics_hostname : CONFIG.smics_hostname,
    // hostname: "192.168.0.108", // EntwicklungsVM IP (SmICS)
    port: CONFIG.dev_mode ? CONFIG.smics_port : CONFIG.smics_port,
    path: CONFIG.dev_mode ? "/api/StoredProcedures/" : "/api/StoredProcedures/",
  }

  /**
   * The complete URL of REST API of the MAH. Ends with a slash.
   */
  public static readonly rest_api_path = `${CONFIG.rest_api_config.protocol}://${CONFIG.rest_api_config.hostname}:${CONFIG.rest_api_config.port}${CONFIG.rest_api_config.path}`

  /**
   * The access information for the openid-connect auth provider in order to authenticate users and start/close sessions.
   */
  public static readonly auth_provider_config = {
    provider_url: process.env.AUTH_PROVIDER_URL || "http://localhost:8080", // Base URL of auth provider to handle login/logout
    redirect_url: "http://" + CONFIG.smics_hostname + ":" + CONFIG.http_port || "http://localhost:3231", // Base URL of app to return to after login/logout
    realm: process.env.AUTH_REALM || "sample-realm", // Auth provider realm name
    client_id: process.env.AUTH_CLIENT_ID || "sample-client", // Auth provider client name
    client_secret: process.env.AUTH_CLIENT_SECRET || "no-secret", // Auth provider client secret (No empty string!)
  }
}
