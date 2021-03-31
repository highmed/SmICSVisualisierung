/**
 * data cache
 * not final, maybe should be implemented
 * with mongoDB or sth else in the future...
 */

const example = {
  raw_data: {
    // hash from parameters = id
    data_name: {
      hashID: {
        // if error, it is saved here
        error: undefined,
        // timestamp when data was fetched
        timestamp: "",
        // last parameters
        parameters: {},
        data: [],
      },
    },
  },
  parsed_data: {
    // hash from parameters = id
    data_name: {
      hashID: {
        // if error, it is saved here
        error: undefined,
        // timestamp when data was fetched
        timestamp: "",
        // last parameters
        parameters: {},
        data: [],
      },
    },
  },
  vis_data: {
    // hash from parameters = id
    data_name: {
      hashID: {
        // if error, it is saved here
        error: undefined,
        // timestamp when data was fetched
        timestamp: "",
        // last parameters
        parameters: {},
        data: [],
      },
    },
  },
}

// TODO: cache muss mit allen data_names einmal initialisiert werden...

// const cache: object[] = []
const cache: any = {
  raw_data: {
    // hash from parameters = id
    data_name: {},
  },
  parsed_data: {
    // hash from parameters = id
    data_name: {},
  },
  vis_data: {
    // hash from parameters = id
    data_name: {},
  },
}

export default cache
