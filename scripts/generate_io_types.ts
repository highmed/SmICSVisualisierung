import {readdirSync, unlink, writeFileSync} from 'fs'
import {compileFromFile} from 'json-schema-to-typescript'

const base_path_in = "src/server/data_io/type_declarations/"
const base_path_out = "src/server/data_io/type_declarations/generated/"

async function generateTypescript(source: string, destination: string) {
    writeFileSync(destination, await compileFromFile(source))
}

// clean the directory
readdirSync(base_path_out).forEach(file_name => {
    console.log("Cleaning up: " + file_name)
    unlink(base_path_out + file_name, err => {
        if (err) throw err;
    })
})

// newline
console.log()

// generate the new types
readdirSync(base_path_in).forEach(file_name => {
    if (file_name.endsWith(".json")) {
        const base_name = file_name.substring(0, file_name.length - 5)
        console.log("Converting: " + base_name)
        generateTypescript(base_path_in + base_name + ".json", base_path_out + base_name + ".d.ts")
            .catch(error => console.error(error))
    }
})
