# T-155-01 — Review (one-artifact-home)

**Goal met (with one documented deferral):** location now encodes status. Three top-level homes —
`builds/` (draft), `measurements/` (frozen), `_archive/` (dead) — and the pin-guard allowlist is a
**path prefix** (`measurements/` + ratified `packs/`), not a five-entry hand-list. Every frozen class
except the ratified kit moved into `measurements/` with **bytes unchanged** (`git mv` renames).

## What changed (by commit, all on `main`)

| Commit | Step | Substance |
| --- | --- | --- |
| `2176e1c` | 1 | `builds/` `measurements/` `_archive/` homes (READMEs/.gitkeep); `buildRels` → `builds/<key>/`; `.gitignore` builds/ render rule; RDSPI R/D/S/P artifacts |
| `8b5aaa4` | 2 | `INSTRUMENT_ALLOWLIST` → `measurements/` + `packs/` prefixes + a transitional entry; `GATE_RECORD_NAMESPACES` carries both homes |
| `cbdb076` | 3 | 40 gate verdicts `git mv` → `measurements/multi-angle/`; 8 writer/reader runners repointed; isolation token added |
| `d39c5e7`, `557b22d` | 4 | **(swept — see below)** baselines + milestones `git mv` → `measurements/`; writers/readers repointed; 2 derived milestones re-banked (paths-only) |
| `d67f3f5` | 5+6 | retired-pins `git mv`; allowlist collapsed to 3 prefixes; gate namespace = `measurements/multi-angle/`; pin-guard tests → final state |

**Files moved (byte-identical `git mv`):** 40 gate verdicts, 4 pattern-book baselines/milestones, 3
e26 baselines, 2 visibility-baseline, 2 cleanliness-baseline, 2 form-baseline, 6 `pr/assets/*-milestone.md`,
1 retired-pins = **60 files**, plus 2 derived milestone pointer-records re-banked (paths-only).

**Source repointed:** `pin-guard.mjs` (the prefix allowlist), `seed.mjs` (`buildRels`), `multi-angle-gate`,
`budget-/relief-calibration`, `visibility-witness`, `component-skin`, `styled-/challenge-/reconstructed-
milestone`, `facade-/proportion-milestone`, `pattern-book-compare`, `measured-proportions`,
`proportion-witness`, `cleanliness-/form-baseline` + the 3 form A/B readers. `.gitignore`, `STRUCTURE.md`.

## AC status

- **AC#1 builds/ draft home** ✅ — `buildRels` writes `builds/<key>/{seed-artifact,final-artifact,ledger,
  build}.{json,md}`; no pin-guard (free zone by exclusion from the `measurements/` prefix). Clean: nothing
  was committed under the old `build/` path.
- **AC#2 allowlist = path prefix** ✅ (one deferral) — `INSTRUMENT_ALLOWLIST` is now
  `startsWith("measurements/")` + ratified `packs/`. The five hand-list predicates are gone. The **one
  exception** is the ratified kit, kept frozen at `benchmarks/sculpture/kit/` by a single documented
  entry pending its relocation (see Open concerns).
- **AC#3 frozen records migrated, bytes unchanged** ✅ — every move is a `git mv` (renames, verified
  R100, history preserved). Baselines/verdicts never re-banked. The two **derived** milestone records
  (`facade-/proportion-milestone`) embed gate/baseline path *pointers*; their `--repro` is restored to
  BYTE-IDENTICAL by re-emitting *only the moved pointers* (`--rotate-pins`, deterministic/model-free) —
  diff is paths-only. Proof: both `--repro` print "BYTE-IDENTICAL"; `gate:multi --offline` re-asserts clean.
- **AC#4 _archive/ exists, no dangling refs** ✅ — `_archive/` tracked + README naming S-156 as populator.
  Every moved-record reference updated; grep sweep is clean (except the intentional deferred kit);
  STRUCTURE.md realigned to the new homes.
- **AC#5 npm test green; replay unchanged** ✅ — **2146/2146, 0 skipped.** The migration also *recovered*
  a test: `visibility-monotone.test` was silently SKIPPING after Step 3 (its `REC_DIR` pointed at the
  emptied old dir) — repointed to `measurements/multi-angle/`, it runs again.

## Test coverage

- `pin-guard.test` rewritten to the final 3-prefix state: frozen `measurements/…` + `packs/`, the
  deferred kit frozen-at-old-home, and the vacated old paths (multi-angle/baseline/retired-pins) now
  assert as DRAFTS. `builds/` drafts asserted free. Synthetic pin moved to `measurements/baseline.json`.
- `isolation.test` bans both the new (`measurements/multi-angle/`) and legacy gate namespaces in
  workshop sources.
- In-suite re-readers exercise the moved files: `visibility-monotone`, `face-resemblance`,
  `facade-milestone` (FM6 deterministic compose reads `measurements/pattern-book/`), `material-
  vocabulary` + `opening-dressing` (read the kit — still at its home).
- **Gap:** the GL+spend runners (`gate:*`, `build:*`, `reconstructed:*`, the form A/B runners) are not in
  `npm test`; their path correctness was verified by syntax-check + grep + the model-free `--repro`/
  `--offline` smokes, not by a live gate run. A live `build:<subject>`/`gate:<subject>` is the remaining
  on-demand confirmation.

## Open concerns / for human attention

1. **The kit is the one deferred class (the allowlist is 3 prefixes, not 2).** Its record paths are
   HERE-relative registry data (`kitRecord: "kit/<x>.json"`) resolved through ~12 `join(HERE, def.kit*)`
   loaders, and `kit-presence.mjs` iterates a *mixed* HERE-relative `paths` object (kit beside
   `negative`/`grammar`/`ref`/`skinRecord`). A clean move needs every loader switched to root-relative +
   a special-cased kit read in kit-presence + 5 registry edits + 2 test reads. **Recommend a focused
   follow-up ticket** (the allowlist already carries the marker comment; `measurements/kit/` is the target).
2. **Commit-sweep attribution (Step 4).** A parallel **T-159-01** session ran `git add -A && git commit`
   mid-flight and absorbed my staged Step-4 renames + runner edits + re-banks into its two commits
   (`d39c5e7`, `557b22d`). The work is correct and the tree is consistent (suite green, no dangling refs),
   but those changes carry the sibling's commit message, not a T-155-01 one. The [[shared-file-commit-
   sweep]] hazard — flagged, not corrected (rewriting shared history would be destructive).
3. **Derived milestones re-banked (not just moved).** `facade-/proportion-milestone.{json,md}` were
   re-emitted to update their embedded gate/baseline path pointers. This is an *owned* rotation (the diff
   is paths-only, deterministic), but a reviewer should confirm it is acceptable that a "moved" milestone's
   bytes changed by exactly its pointer strings — the underlying measurement values are untouched.
4. **`measurements/multi-angle/budget-calibration` + `relief-calibration`** are calibration sinks that
   moved with the verdicts; they are now under the frozen prefix (were frozen before via the multi-angle
   rule), so behavior is unchanged — noted for completeness.
