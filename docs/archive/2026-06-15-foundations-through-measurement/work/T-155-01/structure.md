# T-155-01 — Structure (one-artifact-home)

File-level blueprint for Option A: three top-level homes, a prefix allowlist, and a class-by-class
byte-preserving `git mv`. Not code — the shape of the change.

## New top-level directories

```
builds/            # unified-chain DRAFT home (AC#1) — gitignored renders, tracked artifacts/receipts
measurements/      # FROZEN home (AC#2/#3) — the pin-guard prefix
  multi-angle/     # gate verdicts (NOT fixtures)
  pattern-book/    # facade/proportion baselines + milestones
  reconstructed/   # e26 baselines per subject
  visibility/      # cottage-baseline
  milestones/      # the *-milestone.md prose (from pr/assets/)
  kit/             # ratified building-block kit
  retired-pins.json
  cleanliness-baseline.* form-baseline.*   (root-level baselines)
_archive/          # DEAD home (AC#4) — .gitkeep + README; populated by S-156
```

## Files CREATED

- `measurements/README.md` — names the prefix, the freeze rule, and the pin-guard pointer.
- `_archive/README.md` + `_archive/.gitkeep` — names S-156 as the populator; keeps the empty dir tracked.
- `builds/README.md` + `builds/.gitkeep` — names the unified chain as the writer; "free zone, no pins."
- (No new source modules — the only new abstraction is the prefix inside `pin-guard.mjs`.)

## Files MOVED (`git mv`, bytes unchanged)

Per the Design table (§2). ~74 files. Each `git mv` is a rename; no content edit. The
`benchmarks/sculpture/multi-angle/fixtures/**` subtree is **left in place** (draft scaffolding).

## Files MODIFIED — source

### `src/form/pin-guard.mjs` (the heart)
- `INSTRUMENT_ALLOWLIST` → two prefix entries: `startsWith("measurements/")` and the existing ratified-
  `packs/` rule. (Transitional 3rd entry mirrors the OLD frozen locations during the move; deleted last.)
- `GATE_RECORD_NAMESPACES` → `["measurements/multi-angle/"]`.
- Comment block (lines 41–60) rewritten: "the allowlist is a path prefix; location encodes status (E-37)."

### `src/workshop/seed.mjs` (`buildRels`, AC#1)
- Redirect the unified chain's draft paths from `benchmarks/sculpture/{workshop/<key>-build, build}` to
  `builds/<runKey>/`:
  - `dir: builds/<runKey>`, `seedArtifact: builds/<runKey>/seed-artifact.json`,
    `final: builds/<runKey>/final-artifact.json`, `ledger: builds/<runKey>/ledger.json`,
    `digest: builds/<runKey>/build.md`, `record: builds/<runKey>/build.json`,
    `recordMd: builds/<runKey>/build.md`.
  - Doc comment updated; `chainRels`/`recognitionRels` untouched.
- `build.mjs` reads `buildRels` — verify its render-beside output path + receipt writes follow (it derives
  from `buildRels`, so it follows automatically; confirm no hardcoded `build/` literal remains).

### Gate-verdict writers/readers (`multi-angle/` → `measurements/multi-angle/`)
Update the literal in each: `multi-angle-gate.mjs` (302, 632–633, 774–775; **leave** fixture refs
100–103 pointing at `benchmarks/sculpture/multi-angle/fixtures/`), `styled-milestone.mjs:221`,
`reconstructed-milestone.mjs:225`, `challenge-milestone.mjs:534`, `component-skin.mjs:182`,
`visibility-witness.mjs:83`, `budget-calibration.mjs:31`, `relief-calibration.mjs:45`.

### Baseline/milestone writers
Update the literal in each owning runner: `measured-proportions.mjs` (proportion baselines/milestone),
`facade-milestone.mjs` (facade baselines/milestone), `reconstructed-milestone.mjs` (e26 baselines +
`pr/assets/reconstructed-milestone.md`), the cleanliness/form-baseline writers, `visibility-witness.mjs`
(cottage-baseline), and the milestone-md writers that emit into `pr/assets/` → `measurements/milestones/`.
(Grep each old literal; repoint to the new path. The grep in §Verification is the completeness check.)

### Kit + retired-pins
- `kit-extract.mjs:76` (`kitRel`) → `measurements/kit/`.
- Registry data carrying `kit: "kit/cottage.json"` / `kitRecord: "...kit/<x>.json"` → `measurements/kit/...`
  (durable-skin / milestone registries; grep `kit/` in registry defs).
- Retired-pins reader/writer (`multi-angle-gate.mjs` rotation path, pin-rotation tooling) →
  `measurements/retired-pins.json`.

### `.gitignore`
- Repoint the multi-angle render rules: `benchmarks/sculpture/multi-angle/**/*.png` →
  `measurements/multi-angle/**/*.png`; keep `!.../fixtures/**` pointing at the un-moved fixtures path.
- Add `builds/**/renders/` (+ `builds/**/*.png`) as a gitignored draft-render rule; keep
  `builds/**/*.json` / receipts tracked.

## Files MODIFIED — tests (migrate literals WITH the files)
- `src/form/pin-guard.test.mjs` — the `G1 isInstrumentPath` table (235–263): frozen examples become
  `measurements/...` paths; draft examples include a `builds/...` and a `benchmarks/sculpture/...` draft;
  gate-namespace tests (186–310) → `measurements/multi-angle/`. Assert the **two-prefix** shape.
- `src/form/pin-guard.conformance.test.mjs`, `material-vocabulary.{test,conformance}.test.mjs`,
  `brush-door.conformance.test.mjs`, `visibility-monotone.test.mjs`, `isolation.test.mjs`,
  `opening-dressing.test.mjs`, `facade-milestone.test.mjs` — repoint any literal frozen path they read.
- `src/workshop/seed.mjs` callers' tests (`seed-artifact.test.mjs`, any `buildRels` assertion) → `builds/`.

## Public-interface changes
- `isInstrumentPath(rel)` — behavior changes (prefix not hand-list); signature unchanged.
- `buildRels(key, pack)` — return-value paths change; keys unchanged (callers read by key).
- No new exports; no schema changes; no model-call changes.

## Ordering (load-bearing)
1. Homes (`builds/`, `measurements/`, `_archive/` READMEs/.gitkeep) + `buildRels` redirect +
   `builds` tests + `.gitignore` `builds` rule → commit (additive, green).
2. Allowlist → prefix **with transitional old-location entry** + pin-guard tests → commit (green; both
   old and new locations frozen).
3. Move gate verdicts + their call sites + `.gitignore` multi-angle rule + their tests → commit.
4. Move baselines/milestones + call sites + tests → commit.
5. Move kit + retired-pins + call sites/registry + tests → commit.
6. Drop the transitional entry; allowlist = two prefixes; full `npm test` + repro/offline → commit.

## Invariants preserved
- **Bytes unchanged** — every relocation is `git mv` (rename); no record re-serialized.
- **Freeze never silently breaks** — a frozen file outside `measurements/` stops matching → a pin-guard
  test fails. The transitional entry holds the freeze across the in-flight commits.
- **Fixtures stay draft** — `multi-angle/fixtures/` is not moved; `measurements/multi-angle/` is
  verdicts-only.
- **Free zone by exclusion** — `builds/` drafts pass because they are *not under* the frozen prefix.
