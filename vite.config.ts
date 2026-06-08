import { reactRouter } from "@react-router/dev/vite"
import { defineConfig } from "vite"
import { reactRouterDevTools } from "react-router-devtools"
import { bundledDependencies } from "./bundled-dependencies"

export default defineConfig({
  resolve: { tsconfigPaths: true },
  // See bundled-dependencies.ts. Shared with vitest.config.ts so the two configs can't drift.
  ssr: { noExternal: bundledDependencies },
  plugins: [reactRouterDevTools(), reactRouter()]
});
