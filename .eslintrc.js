module.exports = {
  root: true,

  env: {
    browser: true,
    amd: true,
    node: true,
    es6: true,
  },

  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/recommended",
  ],

  parser: "babel-eslint",

  plugins: ["@typescript-eslint"],

  rules: {
    indent: ["error", 2],
    "linebreak-style": ["error", "unix"],
    // quotes: ["error", "double"],
    semi: ["error", "never"],
    "no-constant-condition": "warn",
    "prefer-const": "off",
    "@typescript-eslint/ban-types": "warn",
    "@typescript-eslint/no-inferrable-types": [
      {
        ignoreParameters: true,
        ignoreProperties: true,
      },
    ],
    "no-unused-vars": "warn",
    "react/prop-types": "warn",
    "react/react-in-jsx-scope": "off",
  },

  parserOptions: {
    sourceType: "module",
  },
}
