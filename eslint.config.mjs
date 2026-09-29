import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default defineConfig([
  {
    files: ["src/**/*.{js,ts}"],
    extends: [js.configs.recommended, tseslint.configs.strict],
    rules: {
      curly: "error",
      eqeqeq: "error",
      "no-useless-computed-key": "error",
      "no-unused-vars": "off",
      radix: "error",
      "require-await": "error",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  eslintConfigPrettier, // keep at last
]);
