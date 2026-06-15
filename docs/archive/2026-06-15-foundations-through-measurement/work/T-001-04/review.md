# Review — T-001-04 style-palette-whitelist

Handoff document. What changed, how it was verified, and what a reviewer should
know without reading every diff.

## Summary

This ticket defines a JSON **format** for style palettes and authors the **first**
palette (`industrial`). A palette is a whitelist of survival-obtainable Minecraft
block IDs scoped to a named style — the binding material constraint of the design
instrument (spec §6). Everything lives in a self-contained `palettes/` module so
this independent ticket's file footprint is disjoint from concurrent tickets on the
shared branch.

All four acceptance criteria are demonstrated by a single green command:

```
$ cd palettes && npm test
✓ industrial: 37 blocks valid & survival-obtainable for Minecraft 1.20.4
```

## Files created (all under `palettes/`, nothing modified or deleted)

| File | Role |
|------|------|
| `palette.schema.json` | The format definition — JSON Schema (draft 2020-12). **AC #1 (machine).** |
| `industrial.json` | The first palette: 37 blocks, MC 1.20.4. **AC #2.** |
| `validate.mjs` | Two-layer validator (structural Ajv + semantic minecraft-data). Proves **AC #3, #4.** |
| `README.md` | The format definition in prose + authoring guide. **AC #1 (prose).** |
| `package.json` | Scoped Node module: `ajv` + `minecraft-data` deps, `validate`/`test` scripts. |
| `package-lock.json` | Pinned, reproducible dependency tree. |
| `.gitignore` | Keeps `node_modules/` out of the commit. |

RDSPI artifacts under `docs/active/work/T-001-04/` (research, design, structure,
plan, progress, review). `docs/` is untracked by project convention — Lisa watches
the filesystem for artifacts, not git.

## How it works (for the reviewer)

- **`blocks` is the single source of truth** — a flat, unique, non-empty array of
  **bare** block IDs (`stone`, not `minecraft:stone`). The schema's block pattern
  `^[a-z][a-z0-9_]*$` forbids the `minecraft:` prefix in authored palette files, so
  the data has exactly one spelling.
- **`groups` is advisory** (structure / concrete / metal / glazing / accent) for
  prompt and human legibility, and is enforced to be a **strict subset** of
  `blocks` — it organizes the canonical set, never extends it.
- **`minecraftVersion` (required)** makes "valid block ID" decidable: the validator
  resolves that version's block list from `minecraft-data` and checks against it.
- **Validation is two layers, one command.** Layer A (Ajv) = shape; Layer B
  (minecraft-data existence + the `NON_SURVIVAL` exclusion set) = validity +
  survival-obtainability; plus the `groups ⊆ blocks` invariant.
- **`NON_SURVIVAL`** (in `validate.mjs`) is a curated, commented denylist of blocks
  that exist in game data but a survival player can't obtain/place (air variants,
  `barrier`, command/structure blocks, `bedrock`, portals, fluids, …). It is
  cross-palette *policy*, so it lives in the validator, not in any palette file.

## Test coverage

There is no application logic to unit-test; the deliverable is data + its format.
The test *is* the validator run over the data, plus negative tests proving the
validator rejects bad input:

| Check | Input | Expected | Result |
|-------|-------|----------|--------|
| Happy path | `industrial.json` | exit 0, summary | ✓ |
| Unknown + creative-only block | `not_a_real_block`, `command_block` | exit 1, both named | ✓ |
| Orphan group member | group ref not in `blocks` | exit 1, named | ✓ |
| Namespaced ID in palette file | `minecraft:iron_block` | exit 1 at Layer A | ✓ |
| Well-formed stub | bare names only | exit 0 | ✓ |

Reproducibility confirmed by a clean `npm test` re-run after all commits.

**Coverage gaps (intentional / acknowledged):**

- Negative tests were run transiently and are **not committed** as a test suite —
  the validator has no automated regression test checked into the repo. If the
  project later adopts a test runner, these cases should be codified. Low risk now
  (the validator is ~90 lines, single-purpose) but worth a follow-up.
- `NON_SURVIVAL` is **conservative, not exhaustive.** It excludes the unambiguous
  creative/technical blocks. A handful of genuinely-debatable blocks (e.g.
  `dirt_path`, `farmland`, `petrified_oak_slab`) are neither excluded nor used in
  `industrial`, so the judgement call is documented but deferred — it will need a
  decision the first time a palette wants such a block.

## Open concerns / notes for the human reviewer

1. **Toolchain precedent (worth a glance).** This ticket introduces the project's
   first runnable code: a *scoped* Node module under `palettes/` with its own
   `package.json`, chosen to (a) align with the Node/`prismarine-viewer` render
   harness and the `minecraft-data` oracle, and (b) avoid a root `package.json`
   collision with the concurrent T-001-01 schema work on the shared branch. It is
   deliberately liftable: if a repo-root toolchain is later established, this module
   can fold into it. Confirm this scoping matches the intended repo structure.
2. **Block-ID vocabulary must match the artifact schema (T-001-01).** This palette
   speaks bare `minecraft-data` block names. The artifact schema and its
   placements must speak the same vocabulary (with the `minecraft:`-stripping
   tolerance) or the E-04 adherence check can never match palette to placements.
   The two tickets developed in parallel — a cross-check at integration is prudent.
3. **Version pin is `1.20.4`.** Single-sourced per palette. If the render harness or
   Litematica round-trip later pins a different version, palettes must be re-checked
   against it (one `npm run validate` per file). Spec §12's "schematic format /
   version" question is not resolved here.
4. **Phase-1 palette count is not decided here** (spec §12). This ticket ships the
   *format* (adding a style is one new file + `npm run validate`) and exactly one
   palette. Whether Phase 1 uses one style or a small set remains open by design.

## Verdict

Complete and verified. The format is defined two ways (schema + prose), the first
palette is authored and **mechanically proven** valid and survival-obtainable, and
the validator demonstrably rejects malformed, unknown, creative-only, and
orphan-group input. No blockers for the downstream consumers (T-004-02, E-04).
