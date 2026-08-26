import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='style'] Property[key.name='fontSize']",
          message: "Inline font-size styles are not allowed. Use typography design system classes (e.g., text-body, text-h1)."
        },
        {
          selector: "JSXAttribute[name.name='className'] Literal[value=/\\btext-\\[\\d+(\\.\\d+)?(px|rem|em|%|ch|vh|vw)?\\]/]",
          message: "Arbitrary Tailwind font-size classes (e.g., text-[12px]) are not allowed. Use typography design system classes (e.g., text-body, text-h1)."
        },
        {
          selector: "JSXAttribute[name.name='className'] TemplateElement[value.raw=/\\btext-\\[\\d+(\\.\\d+)?(px|rem|em|%|ch|vh|vw)?\\]/]",
          message: "Arbitrary Tailwind font-size classes (e.g., text-[12px]) are not allowed. Use typography design system classes (e.g., text-body, text-h1)."
        },
        {
          selector: "JSXAttribute[name.name='className'] Literal[value=/\\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\\b/]",
          message: "Generic Tailwind text sizes (like text-xs or text-sm) are not allowed. Use semantic typography utilities (e.g., text-detail, text-caption, text-body, text-button, text-h3, text-h2, text-h1)."
        },
        {
          selector: "JSXAttribute[name.name='className'] TemplateElement[value.raw=/\\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\\b/]",
          message: "Generic Tailwind text sizes (like text-xs or text-sm) are not allowed. Use semantic typography utilities (e.g., text-detail, text-caption, text-body, text-button, text-h3, text-h2, text-h1)."
        }
      ]
    }
  }
]);

export default eslintConfig;
