module.exports = {
  root: true,

  env: {
    browser: true,
    amd: true,
    node: true,
    es6: true
  },

  extends: ["eslint:recommended"],

  parser: "babel-eslint",

  plugins: [],

  rules: {
    "indent": ["error", 2],
    "linebreak-style": ["error", "unix"],
    "quotes": ["error", "double"],
    "semi": ["error", "never"],
  },
}
