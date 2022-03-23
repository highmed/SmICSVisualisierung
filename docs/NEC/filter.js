const fs = require("fs")
// const csv = require("csv-parser")

const dir = "generated_data/"

let max_count = 10000

let input_ids = ["first_" + max_count]

let filtered_data = []

let object_buffer = ""
let count = 0

let last_buffer = false
let zwischenspeicher = ""
let object_array = []

let timespan = []
let patient_ids = []
let station_ids = []
let room_ids = []
let pathogen_ground_truths = []

let object_counter = 0

/**
 * filtered patients meta data
 * -> count movements
 * - timespan
 * - [predictions]
 *
 * ----------
 *
 * --> pro Patient
 * count strationIDs
 * count movementIDS
 * count roomIDs
 *
 * ----------
 *
 * --> all data
 * count patientIDs
 * count dataObjects
 *
 */

fs.createReadStream("output.json")
  // .pipe(jsp())
  .on("data", (line) => {
    // console.log(line.toString())
    let str = line.toString().trim()

    let str_arr = str.split("{")

    str_arr.forEach((d, i) => {
      if (d[0] === "[") {
        // nothing
      } else {
        let str_arr_2 = d.split("}")

        let str2 = "{" + str_arr_2[0] + "}"

        if (i === 0) {
          // console.log("Zwischenspeicher:")
          // console.log(zwischenspeicher)

          str_arr_2 = (zwischenspeicher + d).split("}")

          str2 = "{" + str_arr_2[0] + "}"
          // console.log("resultierendes String-Object")
          // console.log(str2)
        }

        if (i === str_arr.length - 1 && str_arr_2[1] !== "]") {
          // console.log(
          //   "letztes string fragment aus diesem Puffer = abgeschnitten = Zwischenspeicher"
          // )
          zwischenspeicher = d
          // console.log("Iteration " + i)
          // console.log("auf Zwischenspeicher wird gespeichert:")
          // console.log(zwischenspeicher)
          return
        } else {
          // console.log(
          //   "irgendwas zwischendrin oder aller letztes string fragment"
          // )
        }

        try {
          let str_obj = JSON.parse(str2)

          // if (input_ids.includes(Number(str_obj.PatientID))) {
          //   // console.log("anfang", i)
          //   // console.log(str_obj)
          //   // console.log("ende", i)
          //   object_array.push(str_obj)
          // }

          if (object_counter <= max_count) {
            object_array.push(str_obj)
          }

          object_counter++
        } catch (e) {
          console.log("ERRO ?!?!?!?!")
          console.log(" - - - - - ")
          console.log(str2)
          console.log(" - - - - - ")
          console.log(e)
          console.log(" - - - - - ")
          throw e
        }
      }
    })

    // if (count < 1) {
    //   console.log(str)
    //   console.log(str.length)
    //   count++
    // }

    // if (str === "{\n") {
    //   console.log("{ TRUE")
    //   object_buffer = str
    // } else if (str === "},") {
    //   str = "}"

    //   let obj = JSON.parse(object_buffer)
    //   // console.log(obj)
    // } else {
    //   try {
    //     object_buffer += str
    //   } catch (e) {
    //     // console.log(`String-length ${object_buffer.length}`)
    //     // console.log(e)
    //   }
    // }
  })
  .on("end", () => {
    fs.writeFile(
      dir + "metadata_and_filtered_output" + input_ids.toString() + ".json",
      JSON.stringify({ filtered_data: object_array }),
      (err) => {
        if (err) return console.log(err)
        console.log("Writing filtered output JSON into file")
        console.log(`Totaling ${object_counter} objects`)
      }
    )
  })

// fs.readFile("output.json", (error, raw_data) => {
//   if (error) {
//     throw error
//   }

//   let data = JSON.parse(raw_data)
//   console.log(data)
// })
