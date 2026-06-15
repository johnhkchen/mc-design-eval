# T-160-01 Progress

## Done

- **Step 1 — pure brush `src/view/wall-generate.mjs`** ✅ (committed `d19b2c1`)
  - `closeColumns`, `perimeterColumns`, `spaceOpenings`, `constructWalls`. PURE.
  - Replace semantics: drops band cells in perimeter columns, solidifies floor→eave in each column's local
    material, carves a regular opening rhythm; keeps roof (above eave) + interior cells verbatim.
- **Step 2 — unit tests `src/view/wall-generate.test.mjs`** ✅ (same commit)
  - WG1–WG8, 11 tests green. Full suite **2172/2172** green (brush is additive).
- **Step 3 — wired into `autonomy-loop.mjs`** ✅ (uncommitted, this WIP)
  - `seal_walls` → `construct_walls` (thin adapter over `constructWalls`, program loaded from disk).
  - `TOOLS` / `MENU` / agent enum updated. Toolset stays **size-3** (gable / walls / timber). Dropped the
    now-unused `sealWalls` import. `node --check` clean.
- **Smoke on real occupancies** ✅ — cottage/barn/gatehouse: roof cells preserved EXACTLY (3154→3154,
  2257→2257, 1177→1177), band columns added (+12 / +8 / +12), artifacts rebuild validly.
- **Step 4 — volume batch** ✅ complete. cottage 22→15 (−7), barn 14→15 (+1), gatehouse 14→34 (+20);
  climbed 2/3, mean +4.7. Results in `experiments/eval-alignment/results/`. Log: `batch.log`.
- **Step 5 — beside witnesses** ✅ `{cottage,barn,gatehouse}-walls-beside.png`. **Eye-verified all three**
  (big deltas): gatehouse +20 real (solid stone envelope), cottage −7 real (monotone ribbed colonnade),
  barn +1 flat (posts, not closed). Render and score agree — no over-read.
- **Verdict:** claim REFUTED on the cottage (regressed, not climbed). Localized gate = (1) per-storey
  material assignment, (2) absolute-footprint registration for sparse shells. Full analysis in `review.md`.

## Deviation from plan (documented, honest)

**The "adds missing columns" claim is narrower than Design stated.** While unit-testing `closeColumns` I
measured that morphological close (dilate→erode, r=2) fills **enclosed holes and concavities** but does
**NOT** bridge a 1-wide gap on a *flat boundary run* — the dilate/erode shadow it at the edge (proven in
WG1; the original WG1/WG4 edge-notch asserts FAILED and were corrected to assert the true behaviour).

So the brush's missing-wall repair decomposes into:
1. **Vertical holes within present columns → solidified floor→eave** (WG4). This is the *dominant* holey-wall
   defect on these GLB-voxelized shells and the brush fixes it strongly (band cells +284/+377/+777).
2. **Concave / enclosed ring gaps → bridged** by close+perimeter (the +12/+8/+12 columns).
3. **Straight-run fully-absent columns → NOT repaired.** If the cottage needs these, that is the named
   follow-up (Option A: register the program's absolute footprint to the build frame), exactly the
   ticket's alternative outcome.

This is consistent with Design's stated risk ("if the ragged ring is so damaged close+perimeter can't
recover it, that under-recovery is the honest finding"). The renders + the batch delta are the witnesses.

## Remaining

- Batch completes → read `results/volume-ledger.json` trajectory; replay → `*-walls-beside.png`.
- Eyeball the renders; write the **honest per-subject climb** in `review.md` (did cottage climb? regressions?).
- Commit 2 (wiring) + Commit 3 (batch results + renders + report).

## Verification status

- `npm run test:unit`: **2172/2172 green** with the new brush + tests.
- `defect-eval.mjs`: untouched. `roof-climb.mjs`: untouched. No per-building constants in the brush.
- Toolset size-3 preserved.
