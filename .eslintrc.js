module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  rules: {
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/ban-types": "off",
    "@typescript-eslint/no-empty-object-type": "off"
  },
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
}
