import globals from "globals";
import tseslint from "@typescript-eslint/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import refreshPlugin from "eslint-plugin-react-refresh";

export default [
  {
    ignores: ["dist/**", "backend/**", "scripts/**", "docker-compose.flarum.yml"],
  },

  // TypeScript flat 推荐配置（放在最前面，后面配置的规则会覆盖它）
  ...tseslint.configs["flat/recommended"],

  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2020,
        ...globals.node,
      },
      parser: tseslint.parser,
    },
    plugins: {
      react: reactPlugin,
      "react-hooks": hooksPlugin,
      "react-refresh": refreshPlugin,
    },
    rules: {
      ...reactPlugin.configs.flat.rules,
      ...hooksPlugin.configs.recommended.rules,
      "react-refresh/only-export-components": "off",
      "react-refresh/no-unknown-property": "off",
      // 生产环境禁用 console
      "no-console": "off",
      // React 规则
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      // 通用规则
      "no-var": "error",
      "prefer-const": "error",
      "eqeqeq": ["error", "always"],
      curly: ["error", "all"],
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-return-await": "error",
      "no-throw-literal": "error",
      "no-multiple-empty-lines": ["error", { max: 1 }],
      "no-trailing-spaces": "error",
      // 覆盖 TypeScript-eslint/recommended 中过于严格的规则
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/prefer-as-const": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      // React Hooks 过于严格的规则
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/unsupported-syntax": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
];
