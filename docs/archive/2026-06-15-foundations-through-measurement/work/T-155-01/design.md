# T-155-01 — Design (one-artifact-home)

Goal: **location encodes status.** Three top-level homes — `builds/` (draft), `measurements/` (frozen),
`_archive/` (dead) — and the pin-guard allowlist collapses from a five-entry hand-list to a **path
prefix**: `measurements/` ∪ ratified `packs/`. Bytes never change (E-37 Rule 1).

## Options considered

### Option A — Path-prefix allowlist + physical `git mv` of every frozen class (CHOSEN)
Move all ~74 frozen files under `measurements/`, rewrite the ~12 call sites + ~9 tests + `.gitignore`,
and replace `INSTRUMENT_ALLOWLIST` with two prefix rules. Done **class by class**, each its own commit,
`npm test` green after each. This is the only option that makes AC#2's "allowlist is a path prefix, not a
hand-list" *literally true* — because the prefix only matches if the files actually live there.

- **Pro:** the tree itself now answers draft-vs-frozen; the allowlist becomes two lines; no per-class
  special cases survive; identity-class discipline is automatic (`git mv` = rename).
- **Con:** wide blast radius; a half-migrated class dangles a path. Mitigated by per-class commits gated on
  `npm test` (a dangling path fails a test immediately) and by `git mv` (atomic, byte-preserving).

### Option B — Symlink `measurements/` → the old scattered locations
Keep files in place; add a `measurements/` directory of symlinks; make the allowlist follow links.
- **Rejected:** symlinks don't encode status (the real file still lives in a draft-looking path); git
  tracks the link target, not a move; `--repro` byte-comparisons and `git ls-files` semantics get murky.
  This is indirection, not relocation — it fails the ticket's intent ("know status by *where a file
  lives*").

### Option C — Allowlist stays a hand-list; only `builds/` + `_archive/` homes are added
Satisfy AC#1/AC#4, leave frozen records where they are, keep the five match-functions.
- **Rejected:** explicitly fails AC#2 ("allowlist becomes, by location, `measurements/` + `packs/`") and
  AC#3 ("every committed verdict/baseline/milestone moves to `measurements/`"). The hand-list is the exact
  thing the ticket exists to delete.

### Option D — Central `paths.mjs` indirection FIRST, then move
Introduce a path module every runner imports, then move files behind it.
- **Rejected as a prerequisite:** the call sites are few (~12) and already string-literal; threading a new
  module through all of them is *more* churn than editing the literals, and risks drift from the many
  tests that assert literals. We instead edit literals directly and let the **prefix in pin-guard** be the
  one new abstraction. (A future `measRel()` helper is a fine S-157 follow-up, not load-bearing here.)

## Chosen design — the shape

### 1. Three homes (AC#1, AC#4)
- `builds/` — the unified chain's draft home. `buildRels` (seed.mjs) redirects from
  `benchmarks/sculpture/{workshop/<key>-build, build}` to **`builds/<runKey>/`**:
  `builds/<runKey>/{seed-artifact,final-artifact}.json`, `builds/<runKey>/ledger.json`,
  `builds/<runKey>/build.{json,md}` (the receipt). Clean: nothing committed there yet. Renders go to
  `builds/<runKey>/renders/` (gitignored). **No pin-guard** — the E-36 free zone, matched by *not* being
  under `measurements/`.
- `measurements/` — the frozen home (below).
- `_archive/` — exists now (a `.gitkeep` + `README.md` naming S-156 as the populator); **empty** this
  ticket. AC#4's "references to moved live outputs are updated so nothing dangles" is satisfied vacuously
  for `_archive` (S-156 moves dead code) and concretely for `measurements/` (every call site updated).

### 2. The frozen home `measurements/` (AC#2, AC#3)
Mirror the relocated subtree under `measurements/`, preserving the leaf structure so the move is a flat
rename per class:

| Class | From | To |
| --- | --- | --- |
| Gate verdicts | `benchmarks/sculpture/multi-angle/<x>.{json,md}` | `measurements/multi-angle/<x>.{json,md}` |
| `multi-angle/fixtures/` | (stays a DRAFT) | **NOT moved** — `benchmarks/sculpture/multi-angle/fixtures/` stays |
| Root baselines | `benchmarks/sculpture/{cleanliness,form}-baseline.*` | `measurements/<same>` |
| Pattern-book baselines | `benchmarks/sculpture/pattern-book/{facade,proportion}-*.json` | `measurements/pattern-book/<same>` |
| Reconstructed e26 | `benchmarks/sculpture/reconstructed/<subj>/e26-baseline.json` | `measurements/reconstructed/<subj>/e26-baseline.json` |
| Visibility | `benchmarks/sculpture/visibility/cottage-baseline.*` | `measurements/visibility/<same>` |
| Milestone prose | `pr/assets/*-milestone.md` | `measurements/milestones/*-milestone.md` |
| Kit | `benchmarks/sculpture/kit/*` | `measurements/kit/*` |
| Retired-pins | `benchmarks/sculpture/retired-pins.json` | `measurements/retired-pins.json` |

**Tension — fixtures inside `multi-angle/`:** the gate verdicts move to `measurements/multi-angle/` but
`fixtures/` (draft scaffolding) must NOT freeze. Resolution: move only the verdict `*.json/*.md` files at
the top level of `multi-angle/`; leave `benchmarks/sculpture/multi-angle/fixtures/` where it is and repoint
the gate's fixture references to that unchanged draft path. The new prefix `measurements/multi-angle/`
therefore contains **only verdicts** — no fixture leaks into the freeze.

### 3. The allowlist becomes a prefix (the heart, AC#2)
`src/form/pin-guard.mjs`:
```js
export const INSTRUMENT_ALLOWLIST = Object.freeze([
  { reason: "the frozen-measurement home — gate verdicts, baselines, milestones, kit, "
          + "the rotation registry (E-37: location encodes status)",
    match: (rel) => rel.startsWith("measurements/") },
  { reason: "ratified packs of record (packs/drafts/* are structurally not packs)",
    match: (rel) => rel.startsWith("packs/") && !rel.startsWith("packs/drafts/") && rel.endsWith(".json") },
]);
```
`GATE_RECORD_NAMESPACES` (judge isolation) → `["measurements/multi-angle/"]`. Two prefixes, not five
predicates. The git-tracked-AND-allowlisted freeze logic (`guardedWriteRecord`, `preflightPins`) is
**unchanged** — only the membership test narrows to "under `measurements/` or a ratified pack."

### 4. Ordering — class by class, each commit `npm test`-green
The migration is sequenced **leaf-first** (fewest call sites first) so a break is localized:
1. Homes + `builds/` redirect + `_archive/` (no frozen files touched — pure additive).
2. **Allowlist → prefix form** with a *transitional* extra entry that still matches the OLD locations,
   so step 1's commit stays green while files are mid-move. (Removed in the final step.)
3. Move gate verdicts (`multi-angle/` → `measurements/multi-angle/`) + call sites + `.gitignore` + tests.
4. Move baselines/milestones (each owning runner + its test).
5. Move kit + retired-pins (most entangled — registry data + many readers).
6. Drop the transitional allowlist entry; allowlist is exactly the two prefixes. `npm test` + the
   `--repro`/`--offline`/replay tests green.

**Deviation policy (honesty clause):** if a class proves too entangled to land green within the pass, its
*transitional allowlist entry stays* (keeping it frozen at the old path) and the deferral is documented in
`progress.md` with a concrete follow-up — the suite stays green and no frozen record is silently un-frozen.
A green tree with a named deferral beats a red tree with a complete move.

## What is explicitly NOT in scope
- Archiving dead code into `_archive/` (S-156).
- The STRUCTURE.md drift test (S-157).
- Moving the program-seed `chainRels`/`recognitionRels` draft homes (those archive in S-156).
- Re-banking any baseline or re-deriving any verdict — bytes are frozen; `git mv` only.

## Why this is correct
Identity-class discipline is automatic (rename, not rewrite). The freeze can't silently break: a frozen
file that lands outside `measurements/` stops matching the prefix → a test that writes-then-expects-refusal
fails loudly. The free zone is "everything not under `measurements/`/`packs/`" — `builds/` drafts sail
through by construction, which is exactly the E-36 invariant the tree now makes visible.
