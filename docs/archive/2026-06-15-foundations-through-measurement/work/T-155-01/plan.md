# T-155-01 — Plan (one-artifact-home)

Ordered, independently-verifiable steps. Each step is a commit; `npm test` is green at every commit
boundary. The migration is **leaf-first** so any break is localized to the class just moved.

## Testing strategy
- **Unit (in `npm test`):** `pin-guard.test.mjs` proves the prefix allowlist (frozen vs draft tables,
  gate-namespace isolation). Every test that reads a frozen literal is repointed in the same commit that
  moves the file → the suite is the completeness check for "no dangling path."
- **Byte-identity proof (AC#3):** `git mv` guarantees bytes; `git diff --stat <move-commit>` must show
  pure renames (R100), zero content lines. A scripted check (`git log --follow` / `git show --stat`)
  is the monotone proof committed alongside.
- **Repro/offline (AC#5):** the in-`npm test` replay/conformance tests re-read the moved bytes; the
  on-demand `gate:*`/`build:*` `--repro`/`--offline` flags are smoke-run where GL is available, else the
  path-only change is argued from the rename + unchanged serialization code (documented in progress.md).
- **Grep completeness:** after each class, `grep -rn "<old-prefix>"` over `src/ benchmarks/ .gitignore`
  must return only intentional draft references (e.g. `multi-angle/fixtures/`).

## Step 1 — The three homes + `builds/` redirect (additive, no frozen file touched)
- Create `builds/{README.md,.gitkeep}`, `measurements/README.md`, `_archive/{README.md,.gitkeep}`.
- `.gitignore`: add `builds/**/renders/` and `builds/**/*.png` (draft renders); keep receipts tracked.
- `src/workshop/seed.mjs`: redirect `buildRels` paths to `builds/<runKey>/...` (per Structure §buildRels).
- Update `buildRels` assertions in `seed-artifact.test.mjs` (and any `build.mjs` smoke) to `builds/`.
- **Verify:** `npm test` green; `node -e` print `buildRels('cottage')` shows `builds/cottage-build/...`;
  `build.mjs` has no remaining `benchmarks/sculpture/build/` literal.
- **Commit:** `feat(T-155-01): builds/ measurements/ _archive/ homes + build chain writes to builds/`

## Step 2 — Allowlist → prefix form, with a transitional old-location entry
- `src/form/pin-guard.mjs`: replace `INSTRUMENT_ALLOWLIST` with `measurements/` + ratified-`packs/`
  prefixes **plus** a transitional entry matching the current scattered frozen locations
  (`multi-angle/`, the baseline/milestone suffix regex, `kit/`, `retired-pins.json`) — so nothing
  un-freezes while files are still at the old paths. Rewrite the doc comment to "prefix; location encodes
  status."
- `GATE_RECORD_NAMESPACES`: add `measurements/multi-angle/` beside the existing `benchmarks/.../multi-angle/`
  (both valid during the move).
- `pin-guard.test.mjs`: assert the **new** prefix freezes a `measurements/...` path AND a draft
  (`builds/...`, a plain `benchmarks/sculpture/...`) is free; keep old-location assertions (still frozen
  via the transitional entry).
- **Verify:** `npm test` green; `isInstrumentPath('measurements/multi-angle/x.json')===true`,
  `isInstrumentPath('builds/cottage-build/final-artifact.json')===false`.
- **Commit:** `feat(T-155-01): pin-guard allowlist becomes a measurements/ + packs/ prefix (transitional)`

## Step 3 — Move gate verdicts (`multi-angle/` → `measurements/multi-angle/`)
- `git mv` the 40 verdict `*.json/*.md` (NOT `fixtures/`).
- Repoint call sites: `multi-angle-gate.mjs` (302/632/633/774/775), `styled-milestone.mjs`,
  `reconstructed-milestone.mjs`, `challenge-milestone.mjs`, `component-skin.mjs`, `visibility-witness.mjs`,
  `budget-calibration.mjs`, `relief-calibration.mjs`. **Leave** gate fixture refs at the old path.
- `.gitignore`: `measurements/multi-angle/**/*.png`; keep fixtures un-ignore at the old path.
- Tests: repoint `pin-guard.test.mjs` gate examples, `visibility-monotone.test.mjs`, `isolation.test.mjs`,
  any conformance test reading a verdict, to `measurements/multi-angle/`.
- **Verify:** `npm test` green; `git show --stat` = pure renames; `grep -rn "sculpture/multi-angle/[^f]"`
  in source returns nothing (only `fixtures/` remains).
- **Commit:** `refactor(T-155-01): gate verdicts → measurements/multi-angle/ (git mv, bytes unchanged)`

## Step 4 — Move baselines + milestones
- `git mv`: root `{cleanliness,form}-baseline.*` → `measurements/`; `pattern-book/{facade,proportion}-*`
  → `measurements/pattern-book/`; `reconstructed/<subj>/e26-baseline.json` →
  `measurements/reconstructed/<subj>/`; `visibility/cottage-baseline.*` → `measurements/visibility/`;
  `pr/assets/*-milestone.md` → `measurements/milestones/`.
- Repoint owning runners (`measured-proportions.mjs`, `facade-milestone.mjs`, `reconstructed-milestone.mjs`,
  cleanliness/form-baseline writers, the milestone-md writers) and tests (`facade-milestone.test.mjs`,
  `material-vocabulary.{test,conformance}.test.mjs`, `brush-door.conformance.test.mjs`).
- **Verify:** `npm test` green; renames only; grep old baseline/milestone paths returns nothing in source.
- **Commit:** `refactor(T-155-01): baselines + milestones → measurements/ (git mv, bytes unchanged)`

## Step 5 — Move kit + retired-pins
- `git mv` `benchmarks/sculpture/kit/*` → `measurements/kit/*`; `retired-pins.json` →
  `measurements/retired-pins.json`.
- Repoint `kit-extract.mjs` `kitRel`, every registry `kit`/`kitRecord` literal, and the retired-pins
  reader/writer in the rotation path.
- Tests: `pin-guard.test.mjs` kit examples, `material-vocabulary.*` kit reads, `opening-dressing.test.mjs`.
- **Verify:** `npm test` green; renames only; `grep -rn "sculpture/kit/\|sculpture/retired-pins"` in source
  returns nothing.
- **Commit:** `refactor(T-155-01): kit + retired-pins → measurements/ (git mv, bytes unchanged)`

## Step 6 — Collapse the allowlist to exactly two prefixes
- Delete the transitional old-location entry from `INSTRUMENT_ALLOWLIST`; drop the old
  `benchmarks/.../multi-angle/` from `GATE_RECORD_NAMESPACES`.
- `pin-guard.test.mjs`: remove old-location assertions; assert old paths are now **drafts** (free) and the
  allowlist is exactly two entries.
- **Verify:** full `npm test` green; run the byte-identity proof script (renames across steps 3–5);
  where GL present, smoke `npm run gate:patternbook:cottage -- --offline` / `build:cottage:repro`.
- **Commit:** `feat(T-155-01): allowlist is exactly measurements/ + packs/ — location encodes status`

## Risk / rollback
- **Risk:** a missed call site dangles a write to the old path. **Caught by:** the per-class grep + a
  pin-guard test that writes-then-expects-refusal at the new path. **Rollback:** the transitional entry
  (steps 2–5) keeps the old path frozen, so a missed site that still writes old still refuses correctly —
  no silent un-freeze. Worst case a class is reverted and deferred (progress.md), suite stays green.
- **Deferral clause:** if kit (step 5) proves too entangled to land green, keep its transitional entry,
  document the deferral + a follow-up ticket, and ship steps 1–4 + a 3-prefix allowlist. The architecture
  (location encodes status) holds for the moved classes; kit follows next.

## Done when
AC#1 (builds/ home + chain writes there) ✓; AC#2 (prefix allowlist) ✓; AC#3 (frozen moved, bytes
unchanged, monotone proof) ✓; AC#4 (`_archive/` exists, no dangling refs) ✓; AC#5 (`npm test` green,
replay unchanged) ✓.
