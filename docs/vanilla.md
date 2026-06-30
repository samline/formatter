# Vanilla

The `@samline/formatter/vanilla` entrypoint exposes the same surface as the
root entrypoint. The two are aliases by design.

```ts
// Identical to:
import { format } from '@samline/formatter'
import { format } from '@samline/formatter/vanilla'
```

## When to reach for `/vanilla`

- You want an import path that maps 1:1 to the package name (some bundlers and
  codemods prefer the `/vanilla` convention).
- You are authoring a non-framework library or a Node script and want the
  smallest, most explicit surface area.
- You are documenting a usage pattern that should not depend on whatever future
  framework adapters might be added to the root entrypoint.

The root entrypoint and `/vanilla` both delegate to the same core module, so
there is no behavioral or size difference. Choose whichever reads better in
your codebase.