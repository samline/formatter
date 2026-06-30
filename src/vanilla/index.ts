// Vanilla entrypoint — exposes the base utility API directly.
// This is the canonical surface for non-framework consumers (Node scripts,
// libraries, or any caller that wants a 1:1 mapping to the core module).
//
// `@samline/formatter/vanilla` resolves to this file via the package.json
// `exports` map and ships as ESM + CJS + .d.ts through tsup.

export * from '../core'