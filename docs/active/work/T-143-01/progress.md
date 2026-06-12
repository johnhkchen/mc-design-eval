# Progress — T-143-01 straight-ruler-reverdict

Live measurement run. Per-subject commits, then milestone + learnings. Deviations recorded inline.

## Step 0 — Witnesses-before + baseline reproducibility (FREE) — DONE

Environment feasibility (probed):
- `claude -p` authenticated (haiku probe → `ok`). Subscription shim live.
- GL: `render/src/render.mjs` `GL_AVAILABLE: true`.

Before-state (the rotation-proof bar's "before"), captured verbatim:
- `recognize:offline` → cottage & barn artifacts REPRODUCE byte-identically; conformance PASS.
  (gatehouse/church skipped — no committed program.)
- `patternbook:repro` → cottage & barn chains REPRODUCE byte-identically (sketch→program→seed→final).
- `patternbook:saltcrag:repro` → barn--saltcrag chain REPRODUCES byte-identically.
- `proportion:repro` → **cottage SKIP** (retired T-138-02), **barn SKIP** (retired T-138-01) — named.
- `visibility:repro` → **cottage-patternbook SKIP** (T-138-02), **barn-patternbook-saltcrag SKIP**
  (T-138-01 saltcrag ratify), **barn-patternbook SKIP** (T-138-01) — all named. (Unrelated:
  `gatehouse-current` SKIP on artifact pin mismatch — pre-existing, not in scope.)
- `milestone:proportion:repro` → **DIVERGES** (1 problem). Pre-existing staleness: the committed
  milestone is T-138-01, but the records moved under T-138-02 (cottage re-bank) + T-144 (v2 fields).
  Resolved by the T-143 recompose (Step 4), not introduced here.

Key derived fact: the deterministic **seed reproduces byte-identically under the new code**, so the
live re-run changes only the workshop trajectory + the judge verdict; the seed pitch target stays
**class 1** (pre-answers AC3-Q2: pitch recorded class 1, not forced).

## Step 1 — barn (rustic) — DONE (committed)

- **Chain**: `pattern-book … --subject barn --ticket T-143-01 --rotate-pins` → live workshop
  converged at **4/6 rounds**, final conformance PASS (7 checks, 0 findings), grep clean. The
  deterministic seed was byte-identical (not rotated); ledger/final/component-plan/chain rotated.
- **Judge** (live, 4 azimuths): **all 4 views "same object (2 minor)"** → **4/4 same-object**.
  Gaps (8, all minor): material-zoning@window rhythm ×3, palette@roof shading ×2, **form@roof
  ridge pitch ×1** (the pitch — present but **minor**, not closed), form@gable apex, form@windows.
  - **v2 verdict: PASS** (`multi-angle-budget/v2`, major 0 / minor 8 / minorBudget 10).
  - **legacy: FAIL** (gapCount 8 > gapBudget 2) — reported beside in `aggregate.legacy`.
  - kit-aware verdict: **PASS** (resemblance pass + kit presence pass).
- **Witnesses (rotate)**: proportion `barn` = 5 rows (seed + 4 rounds), final **PASS**, targets
  2.1/0.5238/1.8462 (sketch-sourced); visibility `barn-patternbook` = legacy 4/4 → aware 4/4.
- **Repro (after)**: `patternbook --repro` byte-identical; `proportion --repro` **byte-identical
  (GREEN, was SKIP)**; `visibility --repro` **byte-identical (GREEN, was SKIP)**; `gate --offline`
  PASS, all 11 checks OK. **Rotation-proof bar met: before SKIP-named → after GREEN.**
- **Answer (AC3-Q3, barn)**: YES — the barn now **records** the pass the glance already gave it,
  under v2 (4/4 same-object, all-minor). AC3-Q2: pitch stays **class 1** (the shallowness is a
  minor form gap, not a major; the seed pitch target reproduced class 1).

## Step 2 — barn (saltcrag) — DONE (committed)

- **Chain**: `… --pack packs/saltcrag.json --ticket T-143-01 --rotate-pins` → workshop converged
  **2/6 rounds**, conformance PASS (7 checks, 0 findings), grep clean. Seed byte-identical.
- **Judge** (live, 4 azimuths): **all 4 views "same object"** → **4/4 same-object**, 8 minor / 0
  major (material-zoning@windows/doors/courses, palette@roof). **Resemblance v2: PASS**
  (`multi-angle-budget/v2`, minorBudget 10); **legacy: FAIL** (8 > 2) beside.
- **DEVIATION / honest finding — kit-aware verdict: FAIL.** The gate's T-100 kit-presence
  companion flags `panel:band0 cobblestone`: 3337 sites, **5 missing (foreign) cells**, residue
  tolerance 0 → gating FAIL. So the *resemblance/proportion* (the straight-ruler question) passes
  cleanly, but the composite kit-aware verdict is FAIL on a 0.15% band0 dressing residue. This is
  the "dressing breaks runs" residue family (own-vocab specks), trajectory-dependent (the fast 2/6
  convergence left band0 marginally under-dressed). **Per AC2 the judge run is singular — not
  re-rolled.** Recorded as-is; flagged as an open concern in review.md. Orthogonal to the epic's
  proportion finding (resemblance + ratios), which is clean.
- **Witness (rotate)**: visibility `barn-patternbook-saltcrag` = legacy 4/4 → aware 4/4 (visibility
  is per-view own-coverage, clean — distinct from the band0 kit-presence census).
  No proportion witness (geometry identical to rustic barn; ratios carried by chain/milestone).
- **Repro (after)**: `patternbook --repro` byte-identical; `visibility --repro` byte-identical;
  `gate --offline` self-consistent (recorded outcome PASS → kit-aware FAIL, all 11 checks OK).
- **Answer (AC3-Q3, saltcrag)**: resemblance records the pass (4/4 same-object v2 PASS); the
  composite verdict trips a marginal 5-cell band0 kit-presence gate — recorded honestly.

## Step 3 — cottage (the headline) — IN PROGRESS
