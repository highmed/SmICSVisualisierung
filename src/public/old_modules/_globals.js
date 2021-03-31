let globals = {
  moduleKey: 0,
  newComponentID: function () {
    let key = globals.moduleKey
    globals.moduleKey++
    return "componentID" + key
  },
}

export default globals
