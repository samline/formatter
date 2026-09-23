# Lessons — @samline/formatter

Project-scoped lessons captured from real sessions. These apply only inside this package. Cross-project rules go to agent memory; `@samline/forms`-specific rules don't apply unless explicitly said.

> Format: each entry is one durable lesson with the trigger, the rule, and the evidence (a session reference and the commit or file that surfaced it).

---

## 1. Doc-as-spec trap — never document behavior the code doesn't have

Type: rule

When writing or extending `docs/` or `example/src/content/docs/`, every example output and every signature must match what `src/` actually does **at that commit**. Do not document a function as if it strips `suffix` when the implementation only strips `prefix`.

**Rule:**

- For every documented function: open `src/`, find the implementation, and trace the example input through it.
- For every documented type: open `src/index.ts` → `src/vanilla/index.ts` → `src/core/index.ts` → leaf file, and confirm the re-export chain actually publishes the symbol.
- If the example is "how it *should* behave", write the missing test / implementation first and document the resulting behavior — never document intent as fact.

**Evidence:**

- 2026-09-23 (session this file lives in). Before this commit, `docs/api/format.md` documented `stripPrefixAndSuffix('PRE-12345-END', { prefix: 'PRE-', suffix: '-END' }) → '12345'`. The function never stripped `suffix`, so it actually returned `'PRE-12345-END'` unchanged. A user copy-pasting the snippet into a real project would silently ship the wrong canonical value. Commit `3c8e39f release: v2.0.2` fixed the runtime bug, but the doc bug had been there in my pre-release draft.

WHY: a documented behavior that the code does not implement is worse than missing documentation — it tells future maintainers "this works, you don't need to verify", which short-circuits the only check that would have caught the actual bug.

---

## 2. Recipes must round-trip — write them as if they were tests

Type: rule

A "Recipe: X with framework Y" snippet in `docs/recipes.md` or `example/src/content/docs/` is a promise: the code shown is the recommended way and it works. Writing recipes hypothetically by analogy with another package introduces real bugs that ship to users as copy-pasted snippets.

**Rule:**

- Before publishing any framework adapter (React, Vue, Svelte, vanilla), trace the snippet mentally end-to-end: what happens on first render, on every event, on every state change, on unmount?
- If the snippet mutates the DOM imperatively while also using framework state, simplify it to one ownership model.
- If the snippet attaches an event listener that duplicates wiring across re-renders or selector changes, switch to a stable single listener driven by a thunk / ref.
- If the recipe uses framework state, never reach for `document.querySelector` from inside the framework callback to mutate sibling nodes — push the value into state and let the framework render it.

**Evidence:**

- 2026-09-23, commit `3c8e39f release: v2.0.2`. Two real bugs were caught in the new recipe set:
  1. **React "single controlled input" recipe** — used `document.querySelector(...).setAttribute('value', raw)` inside the `onChange` callback to mirror the hidden field. Imperative DOM mutation inside a React state setter fights the framework's reconciliation. Reviewer replaced with `useState`-driven `value={raw}`.
  2. **Phone with country selector recipe** — called `attachPhoneInput(input, hidden, select.value)` every time the country `<select>` changed. Each call did `input.addEventListener('input', …)`, so the N-th keystroke triggered N formatters. Reviewer switched the signature to `attachPhoneInput(input, hidden, () => select.value)` — one stable listener, the thunk re-reads the country each call.

WHY: recipes are the most likely copy-pasted artifact of any documentation set. A wrong recipe is more dangerous than a missing one because it gets into real code and is rarely re-validated against the published version.

---

## 3. Export-vs-document check — verify the re-export chain

Type: rule

Before documenting a type as "exported from `@samline/formatter`", confirm the full re-export chain publishes it. The package has three layered entrypoints (`index` → `vanilla` → `core` → leaf); missing `export type { … }` in the right intermediate file silently hides the symbol from consumers.

**Rule:**

- For every type listed in `docs/typescript.md` or `example/src/content/docs/reference/typescript.md`, run `grep -R "export" src/` and confirm the symbol leaves through `src/core/index.ts` (which both `index.ts` and `vanilla/index.ts` already `export *` from).
- When documenting "re-exported from `cleave-zen`", add an explicit `export type { … } from 'cleave-zen'` in `src/core/raw.ts` (the leaf) so the chain `index → vanilla → core → raw → cleave-zen` is intact.

**Evidence:**

- 2026-09-23, commit `3c8e39f release: v2.0.2`. `DatePatternType` and `TimePatternType` were imported from `cleave-zen` inside `src/core/raw.ts` but never re-exported. My pre-release `docs/typescript.md` listed both as available imports. The actual `import type { DatePatternType } from '@samline/formatter'` failed silently for any consumer who tried it. Reviewer added `export type { DatePatternType, TimePatternType } from 'cleave-zen'` at the top of `raw.ts` and mirrored the re-export in `src/core/types.ts`.

WHY: the failure mode of "documented but not exported" is a TypeScript error at the consumer's build step, with a stack trace pointing at user code. High-friction debug, low-confidence fix.

---

## 4. CHANGELOG bullets per behavior change, especially when tests back them

Type: rule

When a release ships a code fix AND a test that would have caught the bug, both deserve their own bullets under `### Fixed` / `### Added`. Don't bury a test addition inside a "fixed X as documented" sentence — a maintainer reading the diff in six months deserves to see the evidence trail separately.

**Rule:**

- Code change without test → one bullet.
- Code change with new or strengthened test → two bullets: one for the behavior change, one for the test that locks it in (under `### Added` or `### Fixed` whichever fits the wording).
- Documentation-only clarification that does **not** match what was previously documented → call it out explicitly. Reviewers and consumers rely on the changelog to understand whether something was always true or is newly true.

**Evidence:**

- 2026-09-23, commit `3c8e39f release: v2.0.2`. The CHANGELOG entry reads:

  > Made `stripPrefixAndSuffix()` remove the dedicated `suffix` option as documented, including combined prefix/suffix values.

  The reviewer also added two tests in `test/core/raw.test.ts` covering the new behavior. The wording implicitly bundles the test evidence with the fix. A future maintainer reading just the changelog would not know there is now a regression guard in `test/core/raw.test.ts` and would not know that the previous behavior contradicted a 2.0.1-era `docs/api/format.md` example. Recommend splitting into two bullets next time: one `### Fixed` for the runtime fix and one `### Added` or `### Tests` for the regression guard.

WHY: a CHANGELOG that does not separate fixes from tests makes it harder to bisect drift between docs and code on later audits.

---

## 5. Mirroring rule for formatter: `docs/` (npm-bundled markdown) ↔ Starlight (`example/src/content/docs/`)

Type: pattern

The package ships two documentation surfaces and they must agree at every commit:

1. `docs/` — markdown bundled with the npm tarball (consumers reading from the installed package get this).
2. `example/src/content/docs/` — Starlight site published to `https://samline.github.io/formatter`.

**When a release adds, removes, or changes any of:**

- A public function, method, helper, constant, or type.
- A `formatType` option, default, or behavior.
- A `regex.*` entry (static or parametric).
- A recipe, configuration example, or end-to-end sample.

…you must update both surfaces in the same commit. Doc-only changes (typo, prose polish, anchor fix) are also expected to flow through both.

**Rule:**

- After every code change that touches public surface, grep `docs/` and `example/src/content/docs/` for the old and new names and confirm parity.
- Before every release commit, the version sweep (memory rule `Barrido completo de versiones antes de commitear un bump`) applies to both surfaces.

**Evidence:**

- 2026-09-23, commits `7f6ead4 release: v2.0.1` and `3c8e39f release: v2.0.2`. Both incremented `package.json` and bumped every `@samline/formatter@<version>` reference in both surfaces in the same commit. That discipline is why version bumps land cleanly.

WHY: mirroring is the only reason a consumer reading the installed `docs/` and a developer reading the published Starlight site see the same package. Drift between the two creates "but it says so on the site" support tickets.

---

## 6. The `recipes.md` library-wide rule: every example that mutates the DOM must be the **only** owner

Type: rule

Inside `docs/recipes.md` and the Starlight `reference/recipes.md`, every "attach X to a Y input" helper that calls `input.addEventListener('input', …)` must assume the listener is bound **once** and re-binding is a bug. Patterns that re-attach on every state change (country selector change, prop change, route change) leak listeners and multiply work per keystroke.

**Rule:**

- The listener body must read whatever state it depends on through a thunk / ref / closure — never through a captured value at attach time.
- If the helper exposes a `country` parameter, expose it as `getCountry: () => string`, not as `country: string`.
- Document this expectation explicitly in the helper signature (JSDoc or code comment) so consumers know re-binding is unsupported.

**Evidence:**

- 2026-09-23, commit `3c8e39f release: v2.0.2`. The "Phone with country selector" recipe in `docs/recipes.md` originally took `country: string` and was re-invoked on every `change` event of the country `<select>`. Each re-invocation added another `input` listener. Reviewer changed the signature to `getCountry: () => Country` and bound the listener once at setup.

WHY: this is a class of bug that is invisible at one keystroke (works fine), visible at two (still seems fine), and a memory leak at N (slow page). Reviewing recipes for this shape takes 10 seconds and prevents an entire category of follow-up issues.

---

## 7. When in doubt, compare to `@samline/forms` for structure but not for substance

Type: pattern

The user has signaled they like the structural shape of `@samline/forms`' documentation (sidebar layout, per-method pages, recipes collection, side-effects table). That shape is a good blueprint for `@samline/formatter` because both packages share the same delivery surface and the same author.

**However:** do not lift prose, examples, recipes, or behavior claims from `@samline/forms` directly. `@samline/formatter` is pure / stateless / framework-agnostic; `@samline/forms` is controller-driven with a lifecycle. Their correct mental models differ.

**Rule:**

- Match `forms`' **structure** when adding pages or reorganizing docs (sidebar groups, page templates, "Side effects per …" lookup tables, "Related" blocks at the end of each page).
- Always regenerate `forms`' content for `formatter` — every example, every claim, every option name — by reading `src/` here, not by copying from `forms/docs/`.
- When the two packages genuinely share behavior (e.g. `regex` is re-exported from `@samline/formatter` and consumed by `@samline/forms`), link to `forms`' documentation rather than duplicating.

**Evidence:**

- 2026-09-23, pre-release draft of formatter docs. I structurally matched `forms` (sidebar with "Guide / Reference / Examples", side-effects table, recipes collection) and then backfilled recipes by analogy. Two of the backfilled recipes introduced real bugs (see lesson #2). The structural mirroring was the right call; the analogical recipe-writing was the wrong call.

WHY: structural mirroring gets the navigation and lookup ergonomics right; substance mirroring smuggles in mismatched promises.
