import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

/**
 * Flat config for ESLint 9 + eslint-config-next 16.
 * `eslint-config-next` ships native flat configs; spread its arrays
 * and append project-specific rules.
 */
const eslintConfig = [
  ...nextCoreWebVitals,
  {
    rules: {
      // Tracker pages intentionally pass stores through closures; the
      // exhaustive-deps heuristic produces false positives there, and
      // React Compiler handles memoization now.
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    ignores: [".next/**", "out/**", "build/**", "node_modules/**"],
  },
];

export default eslintConfig;
