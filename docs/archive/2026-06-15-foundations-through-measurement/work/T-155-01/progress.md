# T-155-01 — Progress (one-artifact-home)

Executing `plan.md`. `npm test` green at every commit boundary. Bytes preserved by `git mv`.

## Step 1 — Three homes + `builds/` redirect (additive)  — IN PROGRESS
- `src/workshop/seed.mjs`: `buildRels` redirected to `builds/<runKey>/` (seed-artifact, ledger.json,
  ledger.md, final-artifact, build.json, build.md). All keys preserved; callers (build.mjs, workshop.mjs)
  derive from `buildRels` — no hardcoded literals remained.
- `src/workshop/seed-artifact.test.mjs`: AS1 repointed to `builds/...`; added "never under measurements/".
- Created `builds/`, `measurements/`, `_archive/` with READMEs (+ `.gitkeep` for the two empties).
- `.gitignore`: added `builds/**/renders/` + `builds/**/*.png`; added `measurements/multi-angle/**/*.png`
  (ahead of the move); documented fixtures-stay-draft.
- Pending: run `npm test`, then commit.

Step 1 committed `2176e1c`.

## Step 2 — Allowlist → prefix (transitional) — DONE (commit `8b5aaa4`)
- `pin-guard.mjs`: `INSTRUMENT_ALLOWLIST` = `measurements/` + ratified `packs/` prefixes + a TRANSITIONAL
  third entry matching the still-scattered frozen locations. `GATE_RECORD_NAMESPACES` carries both new
  and old gate namespaces. `pin-guard.test` G1 asserts the prefix freeze + builds/ drafts free.

## Step 3 — Gate verdicts → measurements/multi-angle/ — DONE (commit `cbdb076`)
- `git mv` 40 verdict json/md (fixtures left as drafts). Repointed: gate OUT_DIR + verdict pins,
  budget/relief-calibration sinks+readers, visibility-witness, component-skin live-pin, styled/
  challenge/reconstructed milestone record pointers. isolation.test bans the new namespace token.
- **Step-3 misses caught in Step 4:** three no-slash `GATE_REL = "benchmarks/sculpture/multi-angle"`
  readers (facade-/proportion-milestone, pattern-book-compare) + `visibility-monotone.test` REC_DIR
  (was silently SKIPPING after the move) — all repointed to `measurements/multi-angle`.

## Step 4 — Baselines + milestones → measurements/ — DONE (see sweep note)
- `git mv` (pure renames, bytes unchanged): cleanliness/form baselines → `measurements/`; the 4
  pattern-book baselines/milestones → `measurements/pattern-book/`; 3 e26 baselines →
  `measurements/reconstructed/<subj>/`; visibility baseline → `measurements/visibility/`; 6
  `pr/assets/*-milestone.md` → `measurements/milestones/`.
- Repointed writers/readers: cleanliness-/form-baseline writers + the 3 form A/B readers
  (glb-formtarget-ab, form-revise-ab, glb-grounded-ab), facade-/proportion-milestone (split
  `CHAIN_REL` drafts vs `MEAS_REL` frozen + `GATE_REL`), pattern-book-compare, reconstructed e26
  reader.
- **AC#3 byte-identity:** the two DERIVED milestone pointer-records embed gate/baseline PATH strings, so
  their `--repro` diverged purely on the moved pointers. Re-banked `facade-milestone` + `proportion-
  milestone` (.json/.md) with `--rotate-pins` (deterministic, model-free) — diff is PATHS-ONLY; `--repro`
  now BYTE-IDENTICAL for both. Baselines + verdicts moved byte-unchanged (never re-banked).
- **⚠ Commit-sweep:** a parallel **T-159-01** session ran `git add -A && git commit` mid-flight and swept
  my staged Step-4 renames + runner edits + re-banks into its TWO commits (`d39c5e7`, `557b22d`) — the
  documented [[shared-file-commit-sweep]] hazard. The work is correct and landed; only the commit
  *attribution* is the sibling's. Full suite 2146/2146 (0 skipped); no dangling old-path refs.

## Step 5 + 6 — retired-pins moved; allowlist collapsed — DONE (commit `d67f3f5`)
- `git mv retired-pins.json → measurements/` (R100, byte-identical); 3 root-relative readers
  (measured-proportions, proportion-witness, visibility-witness) repointed.
- `INSTRUMENT_ALLOWLIST` collapsed from 5 hand-list entries to **3 prefixes**: `measurements/`,
  ratified `packs/`, and the ONE DEFERRED `benchmarks/sculpture/kit/`. `GATE_RECORD_NAMESPACES` =
  `["measurements/multi-angle/"]` (old namespace dropped). pin-guard tests assert the final state
  (D synthetic pin → `measurements/baseline.json`; F/G tables → `measurements/…`; the deferred kit
  asserted frozen-at-old-home).
- **KIT DEFERRED (the one open class):** the ratified kit's record paths are HERE-relative registry
  data (`kitRecord: "kit/<x>.json"`) resolved through ~12 `join(HERE, def.kitRecord)` loaders, and
  `kit-presence.mjs` iterates a *mixed* HERE-relative `paths` object (kit beside `negative`/`grammar`/
  `ref`). Relocating it cleanly needs each loader switched to root-relative + a special-cased kit read
  in kit-presence — a focused follow-up. Doing it under the active T-159-01 commit-sweep risked
  landing a broken partial state. Kept frozen at its current home via the one deferred allowlist entry.
- STRUCTURE.md updated: build-chain rows → `builds/<key>/`, gate row → `measurements/multi-angle/`,
  invariant + a "location encodes status" note (AC#4 — the canonical map no longer dangles).

## Final state
- `npm test` 2146/2146, **0 skipped** (visibility-monotone now runs against the moved verdicts).
- AC#3 reproducibility proven: `facade-milestone --repro` + `proportion-milestone --repro` BYTE-IDENTICAL
  (after the owned pointer-rebank); `gate:multi --offline cottage-styled` re-asserts clean.
- Allowlist = exactly `measurements/` + `packs/` + the deferred kit (verified via `isInstrumentPath`).
- No dangling old-path references in source (grep-clean except the deferred kit).
