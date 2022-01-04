module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  ignorePatterns: [
    "**/generated/",
    "**/cdk.out/",
    "**/node_modules/",
    "**/build/",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 13,
    sourceType: "module",
  },
  plugins: [
    "react",
    "@typescript-eslint",
    "react-hooks",
  ],
  rules: {
    "indent": [
      "error",
      2,
      // Allow switch cases to be indented past the braces.
      { SwitchCase: 1 },
    ],
    "linebreak-style": [
      "error",
      "unix",
    ],
    "quotes": [
      "error",
      "double",
    ],
    "semi": [
      "error",
      "always",
    ],
    "comma-dangle": [
      "error", {
        arrays: "always-multiline",
        objects: "always-multiline",
      },
    ],
    "eqeqeq": [
      "warn",
      "always",
    ],
    "eol-last": [
      "error",
      "always",
    ],
    "no-trailing-spaces": [
      "error",
    ],
    // Mandate quote props on an object if any prop needs it, otherwise disallow.
    "quote-props": [
      "error",
      "consistent-as-needed",
    ],
    "prefer-const": [
      "error",
    ],
    "react-hooks/rules-of-hooks": "error", // Checks rules of Hooks
    "react-hooks/exhaustive-deps": "error", // Checks effect dependencies
    // No errors for missing 'import React' when using JSX because Remix has it.
    "react/react-in-jsx-scope": "off",
    "react/jsx-closing-bracket-location": 1,
  },
};
