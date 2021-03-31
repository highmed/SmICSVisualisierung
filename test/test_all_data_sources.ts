import * as mysql from "mysql"
import ping from "node-http-ping"
import * as chai from "chai"
import "mocha"
import "../src/server/start_server"
import { server } from "../src/server/start_server"
import { AddressInfo } from "net"
import * as io from "socket.io-client"
import * as process from "process"
import CONFIG from "../src/server/config"

/**
 * The timout in milliseconds and per each individual data request test
 */
const TIMEOUT: number = 60 * 1000 * 15 // TODO change to 5000ms once Pascal is done with the Contact Network

/**
 * This contains each data source identifier and then all procedures that shall be tested on it with default parameters.
 * In addition, the guard is executed to determine which data source to actually test. The tests are only performed if
 * the guard returns true.
 *
 * The parameters can be set per source since only that allows to select interesting queries which actually return
 * something. As the calls for each data source is modeled as a list, even multiple calls to one procedure can be tested
 * too.
 *
 * Each call is expected to return at least one entry, in order to make sure that the validation is actually
 * performed at least once.
 */
const PROCEDURES: ReadonlyMap<
  string,
  {
    guard: () => Promise<boolean>
    tests: { name: string; parameters: object }[]
  }
> = new Map(
  Object.entries({
    // the most current IGD internal SQL database
    hmhdnov18_sql: {
      guard: async () => {
        // force testing to be done on the CI platform
        if (
          process.env.CI !== undefined &&
          process.env.CI.toLowerCase() === "true"
        )
          return true

        // below does not seem to work despite trying for long
        return new Promise<boolean>((resolve, _) => {
          mysql.createConnection(CONFIG.igd_database_config).ping((error) => {
            if (error) resolve(false)
            else resolve(true)
          })
        })
      },
      tests: [
        {
          // does not need a data source to be set but shall still work
          name: "GetDataSources",
          parameters: {},
        },
        {
          name: "GetHospitals",
          parameters: {},
        },
        {
          name: "Patient_Bewegung_Ps",
          parameters: {
            patientList: ["123", "456"],
          },
        },
        {
          name: "Patient_Labordaten_Ps",
          parameters: {
            patientList: ["123", "456"],
          },
        },
        {
          name: "Contact_NthDegree_TTKP_Degree",
          parameters: {
            starttime: "2012-04-01T00:00:00+00:00",
            endtime: "2012-04-15T00:00:00+00:00",
            patientID: "62411",
            hospital: "1",
            Degree: 1,
          },
        },
        {
          name: "Labor_ErregerProTag_TTEsKSs",
          parameters: {
            starttime: "2015-11-13T20:20:39+00:00",
            endtime: "2015-11-13T20:20:39+00:00",
            pathogenList: ["123", "456"],
            hospital: "1",
            station: ["295", "12"],
          },
        },
        {
          name: "Patient_DiagnosticResults_Ps",
          parameters: {
            patientList: ["123", "456"],
          },
        },
        {
          name: "Patient_PathogenFlag_Ps",
          parameters: {
            patientList: ["123", "456"],
          },
        },
        {
          name: "Praktikum_CF_2020",
          parameters: {
            patientList: ["123", "456"],
          },
        },
        /*{
                name: "Personaldaten_Ps",  // TODO: or something like that
                parameters: {
                    patientList: ["??????????",],
                },
            },*/
      ],
    },

    // the REST API of the MAH
    rest: {
      guard: async () => {
        return true // TODO: somehow, this HTTP "ping" does not work so we always test the REST API

        // ping the data source with HTTP(S)
        // in order to make it work, we need to ping an actual endpoint
        try {
          await ping(`${CONFIG.rest_api_path}/Patient_Bewegung_Ps`) // returns the "ping" in milliseconds
          return true
        } catch {
          return false
        }
      },
      tests: [
        {
          // does not need a data source to be set but shall still work
          name: "GetDataSources",
          parameters: {},
        },
        {
          name: "GetHospitals",
          parameters: {},
        },
        {
          name: "Patient_Bewegung_Ps",
          parameters: {
            patientList: ["6abf1aec-27f9-463d-bdc4-8b08fdc5fdb8"],
          },
        },
        {
          name: "Patient_Labordaten_Ps",
          parameters: {
            patientList: ["6abf1aec-27f9-463d-bdc4-8b08fdc5fdb8"],
          },
        },
        {
          name: "Contact_NthDegree_TTKP_Degree",
          parameters: {
            starttime: "2020-03-15T00:00:00+00:00",
            endtime: "2020-04-15T00:00:00+00:00",
            patientID: "6abf1aec-27f9-463d-bdc4-8b08fdc5fdb8",
            hospital: "1",
            Degree: 1,
          },
        },
        {
          name: "Labor_ErregerProTag_TTEsKSs",
          parameters: {
            starttime: "2020-03-15T00:00:00+00:00",
            endtime: "2020-04-15T00:00:00+00:00",
            pathogenList: ["123", "456"],
            hospital: "1",
            station: ["295", "12"],
          },
        },
        {
          name: "Patient_DiagnosticResults_Ps",
          parameters: {
            patientList: ["6abf1aec-27f9-463d-bdc4-8b08fdc5fdb8"],
          },
        },
        {
          name: "Patient_PathogenFlag_Ps",
          parameters: {
            patientList: ["6abf1aec-27f9-463d-bdc4-8b08fdc5fdb8"],
          },
        },
        {
          name: "Praktikum_CF_2020",
          parameters: {
            patientList: ["123", "456"],
          },
        },
        /*{
                name: "Personaldaten_Ps",  // TODO: or something like that
                parameters: {
                    patientList: ["??????????",],
                },
            },*/
      ],
    },
  })
)

/**
 * Iterate over all data sources and over all data requests and test whether the data can be parsed correctly.
 *
 * This is required to be a separate function to allow for using async code.
 */
const construct_tests: () => Promise<void> = async () => {
  // create/ping for all test suite in parallel to save time by potentially overlapping the pings
  await Promise.all(
    new Array(PROCEDURES.entries()).map(async (suite) => {
      // for each data source, run the guard to determine whether the tests should be skipped and if not, run them
      for (const [data_source_identifier, { guard, tests }] of suite) {
        const basic_title = `Test the data access functions of source "${data_source_identifier}" via websocket`

        const [create_suite, title] = (await guard())
          ? [describe, basic_title]
          : [describe.skip, `${basic_title} - UNAVAILABLE`]

        // we determined a title for the test suite and whether to skip it; now create it. Mocha will then
        // run it at some point in the future
        create_suite(title, () => {
          // for each procedure entry create a test in the suite of the data source
          for (const procedure of tests)
            it(`test procedure ${procedure.name} via websocket`, (done) => {
              // first, we determine the websocket to call through
              const address: AddressInfo | string | null = server.address()
              chai.expect(address).to.be.an("object")
              const socket = io(
                `http://localhost:${(address as AddressInfo).port}`
              )

              // then we actually establish a connection and install an error handler
              socket.connect()

              socket.once("error", (error: any) => {
                chai.expect.fail(`error: ${error}`)
              })

              // then we can finally request the data
              socket.emit("getData", {
                dataSourceIdentifier: data_source_identifier,
                procedureName: procedure.name,
                procedureParameters: procedure.parameters,
              })

              // this will be stopped if data was received
              const timerId = setTimeout(() => {
                chai.expect.fail(
                  `timeout: we did not receive an answer within the time bound of ${TIMEOUT} ms`
                )
              }, TIMEOUT)

              socket.once("dataError", (error: any) => {
                clearTimeout(timerId)
                socket.disconnect()
                // there was an error requesting the data
                chai.expect.fail(error)
              })

              socket.once("dataResult", (dataString: any | null) => {
                clearTimeout(timerId)

                // check that we got an result at all
                chai
                  .expect(dataString)
                  .to.not.equal(
                    null,
                    "dataResult contained no data (because it was null)"
                  )
                // check that it can be parsed as valid JSON
                const dataObject: any = JSON.parse(dataString)

                // check that no validation has failed
                if (!dataObject.success)
                  chai.expect.fail(
                    `validation of the result failed: ${dataObject.errorMessage}`
                  )

                if (Array.isArray(dataObject.data))
                  // make sure that the array has at least one item, as only then the validation has actually been performed
                  chai
                    .expect(dataObject.data.length)
                    .to.be.greaterThan(0, "dataResult delivered an empty array")

                // clean up afterwards
                socket.disconnect()

                done()
              })
            }).timeout(TIMEOUT + 500)
        })
      }
    })
  )
}

// https://mochajs.org/#delayed-root-suite -> This is required since the ping to mysql might take so long, that Mocha
// finishes this process because these seems to be no test suite being created for too long.
construct_tests()
  .finally(() => run()) // always do this, even on a failure
  .catch((error) => {
    throw error
  })
