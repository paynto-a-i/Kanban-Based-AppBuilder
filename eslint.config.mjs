// ESLint 9+ flat config (Next.js 16+)
// Note: Next 16 no longer exposes `next lint`, so linting is done via `eslint .`
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      // React 19 "purity" rules are useful but currently too noisy across the existing codebase.
      // Keep the classic hooks lint rule as a warning, and disable the newer strict rules for now.
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react-hooks/exhaustive-deps": "warn",
      "react/no-unescaped-entities": "off",
      "prefer-const": "warn",
    },
  },
  {
    files: ["**/live-preview-frame.tsx"],
    rules: {
      "@next/next/no-img-element": "off", // Dynamic WebSocket stream images require regular img tag
    },
  },
];
