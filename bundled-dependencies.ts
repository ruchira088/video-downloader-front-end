// Dependencies that must be bundled (not externalized) by Vite.
//
// When these are left external, Node's strict ESM resolver handles their imports
// and rejects MUI's directory import of `react-transition-group/TransitionGroupContext`
// (react-transition-group ships no ESM subpath/exports entry for it). Bundling them
// lets Vite's resolver handle the directory import instead.
//
// Referenced by both vite.config.ts (build) and vitest.config.ts (tests) via
// `ssr.noExternal`, so the list lives in one place.
export const bundledDependencies = ["@mui/material", "react-transition-group"]
