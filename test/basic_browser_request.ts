import * as chai from "chai"
import { use } from "chai"
import "mocha"
import "../src/server/start_server"
import { app } from "../src/server/start_server"
// @ts-ignore
import chaiHttp = require("chai-http")

use(chaiHttp)

describe("Basic web server access", () => {
  it("main page should return HTTP status 200", () => {
    chai
      .request(app)
      .get("/")
      .then((res) => {
        chai.expect(res.status).to.eql(200)
      })
  })

  it("missing page does not crash the web server", () => {
    chai
      .request(app)
      .get("/this_page_does_surely_not_exist/but_we_test_exactly_that.php")
      .then((res) => {
        chai.expect(res.status).to.eql(404)
      })
  })
})
