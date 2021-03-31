"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var process = require("process");
/**
 * This entirely static class contains the configuration of the webserver and data sources.
 */
var CONFIG = /** @class */ (function () {
    function CONFIG() {
    }
    /**
     * The HTTP port that is either taken from the `HTTP_PORT` environment variable or else defaults to `3231`.
     */
    CONFIG.http_port = process.env.HTTP_PORT !== undefined ? parseInt(process.env.HTTP_PORT) : 3231;
    /**
     * The HTTPS port that is either taken from the `HTTPS_PORT` environment variable or else defaults to `3232`.
     */
    CONFIG.https_port = process.env.HTTPS_PORT !== undefined
        ? parseInt(process.env.HTTPS_PORT)
        : 3232;
    /**
     * This flag is used to suppress logging while unit testing. It is either set via the `IS_TESTING` environment
     * variable or else defaults to `false`.
     */
    CONFIG.is_testing = process.env.IS_TESTING !== undefined
        ? process.env.IS_TESTING.toLowerCase() === "true"
        : false;
    /**
     * The configuration for connecting with the internal MySQL database. See #PoolConfig for available options.
     */
    CONFIG.igd_database_config = {
        host: "highmeddatstring.igd.fraunhofer.de",
        port: 1812,
        user: "root",
        password: "u7GE5n9k",
        database: "hmhdnov18",
        connectionLimit: 4,
        // the data base is not in UTC but instead in the local time of Darmstadt, Germany
        // this setting assumes that the server is in that very same time zone
        timezone: "local",
        dateStrings: false,
    };
    /**
     * The access information for the REST API of the MAH that is used internally to this class in order to create the
     * public #rest_api_path.
     *
     * @private
     */
    CONFIG.rest_api_config = {
        protocol: "http",
        hostname: "localhost",
        port: 9787,
        path: "/api/StoredProcedures/",
    };
    /**
     * The complete URL of REST API of the MAH. Ends with a slash.
     */
    CONFIG.rest_api_path = CONFIG.rest_api_config.protocol + "://" + CONFIG.rest_api_config.hostname + ":" + CONFIG.rest_api_config.port + CONFIG.rest_api_config.path;
    return CONFIG;
}());
exports.default = CONFIG;
//# sourceMappingURL=config.js.map