import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    // As capas dos jogos vêm da RAWG, de vários domínios diferentes, então o
    // projeto usa <img> comum em vez de next/image.
    rules: { "@next/next/no-img-element": "off" },
  },
]);

export default eslintConfig;
