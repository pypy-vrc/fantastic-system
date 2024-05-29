import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default defineConfig([
  {
    files: ["src/**/*.{js,ts}"],
    extends: [js.configs.recommended],
  },
  {
    files: ["src/**/*.ts"],
    extends: [tseslint.configs.strict],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    files: ["src/**/*.{js,ts}"],
    rules: {
      curly: "error",
      "dot-notation": "error",
      eqeqeq: "error",
      "no-useless-computed-key": "error",
      "no-unused-vars": "off",
      radix: "error",
      "require-await": "error",
    },
  },
  eslintConfigPrettier, // keep at last
]);
