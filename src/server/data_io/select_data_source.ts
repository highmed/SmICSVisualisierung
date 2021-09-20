import { IgdSqlDatabaseSource } from "./concrete_data_providers/igd_sql_database"
import { AbstractDataSource } from "./abstract_data_provider"
import { RestAPI } from "./concrete_data_providers/rest_api"
import CONFIG from "../config"

/**
 * Used only by #resolveDataSource to not always create a new one.
 */
const restDataSource: AbstractDataSource = new RestAPI(CONFIG.rest_api_path)

/**
 * A list of all available data source identifiers that are known to #resolveDataSource. They are case sensitive.
 */
export const ALL_DATA_SOURCES: ReadonlyArray<string> = ["hmhdnov18_sql", "rest"]

/**
 * Finds the data source for a given identifier. See #ALL_DATA_SOURCES for a list of available ones.
 *
 * @param identifier the case-sensitive identifier to find the concrete data source for
 * @return the right data source
 * @throws and error message and a list of all available data sources if an data provider is requested
 */
export const resolveDataSource = async (
  identifier: string
): Promise<AbstractDataSource> => {
  switch (identifier) {
  case "hmhdnov18_sql":
    return IgdSqlDatabaseSource.getInstance() // retrieve the singleton instance
  case "rest":
    return restDataSource
  default:
    throw new Error(
      `Unknown data source selected: "${identifier}". Available are: [${ALL_DATA_SOURCES}]`
    )
  }
}
