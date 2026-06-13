import eslint from "@eslint/js"
import tseslint from "typescript-eslint"
import eslintConfigPrettier from "eslint-config-prettier"
import reactHooks from "eslint-plugin-react-hooks"

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    files: ["**/*.ts", "**/*.tsx"],
    ...reactHooks.configs.flat["recommended-latest"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // The codebase intentionally uses []-deps effects and ref-based workarounds in places;
      // keep these as warnings rather than mass-editing effect dependencies.
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/ban-types": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/prefer-as-const": "warn",
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-empty-pattern": "warn",
    },
  },
  {
    files: ["tests/**/*.ts", "tests/**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    ignores: ["node_modules/**", "build/**", "cdk-deploy/**", ".react-router/**"],
  }
)
