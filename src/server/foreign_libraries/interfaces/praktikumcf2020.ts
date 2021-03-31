import * as path from "path"
import {exec} from 'child-process-promise'
import {FOREIGN_LIBRARY_ROOT} from "./common"
import * as tempy from "tempy";
import * as fs from "fs";
import {Labordaten} from "../../data_io/type_declarations/generated/Labordaten";
import {Bewegungen} from "../../data_io/type_declarations/generated/Bewegungen";
import {AbstractDataSource} from "../../data_io/abstract_data_provider";
import {Arguments_Ps} from "../../data_io/type_declarations/generated/Arguments_Ps";
import {Praktikum_CF_2020_Result, validate, ValidationResult} from "../../data_io/types";
import * as moment from "moment";


/*
 * This file contains a slim shim above the algorithms for make usage simpler.
 *
 * Warning: This is not engineered for security!
 */


/**
 * Resolves the request by first retrieving the relevant data from the data source and the querying the algorithm with
 * that result. Correctly handles validation failures and returns the validated data.
 *
 * @param dataSource the data source to fetch the input to the algorithm from
 * @param parameters the parameters for querying the data source
 */
export const call_Praktikum_CF_2020 = async (dataSource: AbstractDataSource, parameters: Arguments_Ps):
    Promise<ValidationResult<Praktikum_CF_2020_Result>> => {

    let accumulated_errors: string[] = []

    // assume that the parameters are validated
    const movement_data_wrapped = await dataSource.Patient_Bewegung_Ps(parameters)
    let movement_data
    if (movement_data_wrapped.success)
        movement_data = movement_data_wrapped.data
    else {
        accumulated_errors.push("error while validating response from Patient_Bewegung_Ps: " + movement_data_wrapped.errorMessage)
        movement_data = movement_data_wrapped.rawData as Bewegungen
    }

    const micro_data_wrapped = await dataSource.Patient_Labordaten_Ps(parameters)
    let micro_data
    if (micro_data_wrapped.success)
        micro_data = micro_data_wrapped.data
    else {
        accumulated_errors.push("error while validating response from Patient_Labordaten_Ps: " + micro_data_wrapped.errorMessage)
        micro_data = micro_data_wrapped.rawData as Labordaten
    }

    // convert the format to something easier to handle
    let result: { nodes: object[]; edges: object[] } = await _callSubprocess(movement_data, micro_data)
    result.nodes = result.nodes.map((node: any) => {
        return {
            ...node,
            time: new Date(parseInt(node.time) * 1000).toISOString(), // multiplication by 1000 converts from seconds to milliseconds
            pathogens: node.pathogens.map((pathogen: any) => {
                return {
                    pathogenID: pathogen.pathogenID,
                    result: true, // see CSV output headers
                    screening: pathogen.result === "1",
                }
            })
        }
    })

    const validated = await validate<Praktikum_CF_2020_Result>("data/Praktikum_CF_2020_Result", result)
    if (validated.success) {
        if (accumulated_errors.length === 0)
            return {
                success: true,
                data: validated.data,
            }
        else
            return {
                success: false,
                rawData: validated.data,
                errorMessage: accumulated_errors.join("\n\n"),
            }
    } else {
        accumulated_errors.push("error while validating response from Praktikum_CF_2020: " + validated.errorMessage)
        return {
            success: false,
            rawData: validated.rawData,
            errorMessage: accumulated_errors.join("\n\n"),
        }
    }
}


/**
 * Points to the executable of the algorithms.
 */
const EXECUTABLE_PATH = path.join(FOREIGN_LIBRARY_ROOT, "praktikumcf2020", "code", "bin", "main")

/**
 * The config of the executable matching the database abstraction of this project.
 */
const CONFIG_PATH = path.join(FOREIGN_LIBRARY_ROOT, "praktikumcf2020", "code", "config", "config_felix.json")


/**
 * Calls the actual executable and retrieves the resulting CSV files as objects.
 *
 * Warning: This is not engineered for security!
 *
 * @param movement_data the movement data to be delivered to the procedure for processing
 * @param micro_data the lab testing data to be delivered to the procedure for processing
 */
const _callSubprocess = async (movement_data: Bewegungen, micro_data: Labordaten):
    Promise<{ nodes: object[], edges: object[] }> => {

    let result_dir
    let csv_result_nodes
    let csv_result_edges
    try {
        // prepare a temporary directory
        result_dir = tempy.directory()

        // bash-escapes a string in a *very* unsophisticated way
        const to_argument = (data: object) => `"${JSON.stringify(data).replace(/"/g, '\\"')}"`

        // let the procedure fill it
        const data_arguments = `--move-json ${to_argument(movement_data)} --micro-json ${to_argument(micro_data)}`
        const call = `"${EXECUTABLE_PATH}" ${data_arguments} --config-file "${CONFIG_PATH}" --out "${result_dir}"`

        try {
            // ignore the output on success
            await exec(call)
        } catch (error) {
            throw new Error(`could not execute procedure: ${error}`)
        }

        // read the contents of the result file
        csv_result_nodes = fs.readFileSync(path.join(result_dir, "nodes.csv"), {encoding: 'utf8'})
        csv_result_edges = fs.readFileSync(path.join(result_dir, "edges.csv"), {encoding: 'utf8'})

    } finally {
        if (result_dir)
            try {
                // try to delete the temporary directory but ignore when it fails
                fs.rmdirSync(result_dir, {recursive: true})
            } catch {
            }
    }

    // if we arrive here csv_result contains the relevant result
    return {
        nodes: parseSpecialNodeCsv(csv_result_nodes, ",",
            ["nodeID", "time", "personID", "LocationID"],
            ["pathogenID", "result"]),

        edges: parseCsv(csv_result_edges, ",", ["nodeID_start", "nodeID_end"]),
    }
}


/**
 * Parses a string representing CSV data into an array of objects, one for each row.
 *
 * @param raw the raw string to process; assumed to contain a header row
 * @param separator the string to separate the elements of a row
 * @param header the names of the columns
 */
const parseCsv = (raw: string, separator = ",", header: string[]): object[] => {
    // get rid of a trailing newline and split lines
    const lines = raw.trimEnd().split(/\r?\n/g)
    // get rid of the header row
    lines.shift()

    return lines.map(line => {
        const parts = line.split(separator)
        if (parts.length !== header.length)
            throw new Error("each row must have exactly as many elements as the header row")
        const entries = parts.map((part, index) => [header[index], part])
        return Object.fromEntries(entries)
    })
}

/**
 * Parses a string representing some special CSV data from the node data. (Where the last two entries may get repeated.)
 *
 * @param raw the raw string to process; assumed to contain a header row
 * @param separator the string to separate the elements of a row
 * @param header_fixed the names of the columns that are always present
 * @param header_var the names of the columns that are present zero to many times in each row
 */
const parseSpecialNodeCsv = (raw: string, separator = ",", header_fixed: string[], header_var: string[]): object[] => {
    // get rid of a trailing newline and split lines
    const lines = raw.trimEnd().split(/\r?\n/g)
    // get rid of the header row
    lines.shift()

    return lines.flatMap(line => {
        const parts = line.split(separator)

        // parse fixed part
        if (parts.length < header_fixed.length)
            throw new Error("each row must have at least as many elements as the fixed header row")
        const part_fixed = parts.slice(0, header_fixed.length)
        const result_from_row: [string, any][] = part_fixed.map((part, index) => [header_fixed[index], part])

        // process chunks at the end
        let pathogens: object[] = []
        let remaining = parts.slice(header_fixed.length)
        while (remaining.length > 0) {
            if (remaining.length < header_var.length)
                throw new Error("each row must have contain `header_fixed.length + n * header_var.length` values")
            // extract chunk
            const chunk = remaining.slice(0, header_var.length)
            remaining = remaining.slice(header_var.length)
            // append to results
            pathogens.push(Object.fromEntries(
                chunk.map((part, index) => [header_var[index], part])
            ))
        }

        result_from_row.push(["pathogens", pathogens])
        return Object.fromEntries(result_from_row)
    })
}
