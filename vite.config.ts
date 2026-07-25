import { reactRouter } from "@react-router/dev/vite"
import { defineConfig } from "vite"
import { bundledDependencies } from "./bundled-dependencies"

export default defineConfig({
  resolve: { tsconfigPaths: true },
  // See bundled-dependencies.ts. Shared with vitest.config.ts so the two configs can't drift.
  // `optimizeDeps` pre-bundles the same list for the dev server, whose SSR module runner
  // otherwise evaluates react-transition-group's CJS files as ESM ("exports is not defined").
  ssr: { noExternal: bundledDependencies, optimizeDeps: { include: bundledDependencies } },
  plugins: [reactRouter()]
});
