import { reactRouter } from "@react-router/dev/vite"
import { defineConfig } from "vite"
import { reactRouterDevTools } from "react-router-devtools"

export default defineConfig({
  resolve: { tsconfigPaths: true },
  // Bundle MUI and react-transition-group into the SSR build so Vite resolves
  // MUI's directory import of `react-transition-group/TransitionGroupContext`
  // instead of letting Node's ESM resolver reject it.
  ssr: { noExternal: ["@mui/material", "react-transition-group"] },
  plugins: [reactRouterDevTools(), reactRouter()]
});
