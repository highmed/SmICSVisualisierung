module.exports = {
  extends: [
    "plugin:@typescript-eslint/recommended",
  ],

  plugins: [
    "@typescript-eslint",
  ],

  rules: {
    "no-constant-condition": "warn",
    "prefer-const": "off",
    "@typescript-eslint/ban-types": "warn"
  }
  
}
