# T-090-01 full-shell-zone-fill — Plan

Three implementation steps, three commits, each independently verifiable. Verification commands are
exact. Baseline: `npm test` green at 1,014 tests (HEAD `ada0472`).

## Step 1 — Pure core: exposure skin + regions in `zone-fill.mjs` (+ tests)

**Edit `src/view/zone-fill.mjs`:**
1. Module header: add the T-090-01 paragraph (projection skin = five-ortho-camera union; exposure skin
   = any-camera 6-dir air test; the fill moves to the latter; `-y`/interior-cavity inclusions are
   spec'd-in limits).
2. Add `export function* exposedVoxelEntries(occ)` after `surfaceVoxelEntries` (reuse `NEIGHBORS`;
   first-air-neighbor yield+break; insertion order).
3. Add `function skinEntries(occ, skin, faces)` dispatcher (throws on unknown skin).
4. `zoneFill`: accept `skin = "projection"` and `regions = []`; validate regions (string `name`,
   function `contains`, else throw); enumerate via `skinEntries`; region check FIRST in the per-voxel
   chain (keep + `byRegion[name]++` + zone `kept++`); return `byRegion`.
5. `surfaceZoneHistogram`: accept `skin = "projection"`, dispatch via `skinEntries`.

**Extend `src/view/zone-fill.test.mjs`:** add the `gabledRoof()` synthetic and tests 1–8 from
structure §2. While writing test 2, *first* print the projection/exposure membership of the chosen
grey cells with a scratch run to fix exact coordinates, then pin them (hand-counted, like the hut
comments). Existing tests untouched.

**Verify:** `npm test` — all green, new tests present (count > 1,014). Spot: `node --test
src/view/zone-fill.test.mjs`.

**Commit:** `feat(E-25 T-090-01): exposure-skin enumerator + declared sub-regions in zone-fill (pure core)`

## Step 2 — Runner wiring in `benchmarks/sculpture/spray-paint.mjs`

1. `ZONE_POLICY.roof.preserve += "dark_oak_log"` with the gable-framing comment (design D5).
2. §0c: fill with `skin: "exposure"`; add `fillProjection`/`basedProjection` replay (the old
   wall-field fill, kept as the before-baseline); update comments (T-090-01 replaces the wall-field
   stage — strict superset).
3. Add `{skin: "exposure"}` to every `surfaceZoneHistogram` call (§2b splat-only, §4 front-candidate,
   §5b final) — the census basis switch (design D4).
4. §5b: `bandsBefore`/`bandsAfter` (exposure census of `basedProjection`/`painted`), `acceptance`
   computation, module consts `ROOF_BAND_TARGET = 0.9` / `UPPER_RESIDUE_MAX = 0.05`, hard throw on
   violation, console lines.
5. §5c: best-effort oblique renders of `basedProjection`/`painted` at `"-x-z"` (225°), labels
   `oblique225-before`/`oblique225-after`.
6. §6 record: `fill.skin`, `fill.byRegion`, `coverage.skin`, `zones.bands` (skin, measuredOn, before,
   after, acceptance, thresholds), `renders.oblique`; `renderMd` gains the "Full-shell fill
   (T-090-01)" section.
7. `--offline`: add `bandsOk` (skip-if-absent) to the assertion set + summary line.

**Verify (no GL, no regen):**
- `npm test` — green (runner isn't under the test glob, but imports must parse: `node --check
  benchmarks/sculpture/spray-paint.mjs`).
- `node benchmarks/sculpture/spray-paint.mjs --offline` — exit 0 against the OLD committed record
  (bands absent → skipped; the degradation path is itself the test).

**Commit:** `feat(E-25 T-090-01): full-shell exposure fill wired as THE base-coat stage; band evidence + offline checks`

## Step 3 — Live run, evidence, records

1. `npm run spray:paint` (GL). Expected console: fill places ≈2,900 more cells than the old ≈? (the
   exposure skin is 5,338 vs 2,450 — fills ≈ stone/cobble/log non-dominant non-preserved cells),
   coverage gate splat-only REJECTED / final PASS, bands acceptance roofMaterials ≥ 0.9 (predicted
   ≈1.0) and upperStone ≤ 0.05 (predicted 0), both renders written.
2. Inspect `cottage/view-oblique225-{before,after}.png` — the grey roof sides visibly gone (E-25
   Rule 1: the render IS the evidence; if the after-render still shows grey jumble, STOP — re-examine
   zone classification rather than tuning thresholds).
3. Re-verify the AC numbers from the regenerated record with the research §3 measurement script
   (6-dir exposure per zone) — the before/after histograms must be the same measurement.
4. `node benchmarks/sculpture/spray-paint.mjs --offline` — exit 0 with bands now asserted.
5. Check gitignore status of the two oblique PNGs (`git check-ignore -v`); narrowly un-ignore if
   caught (they are the committed AC evidence).
6. `npm test` — still green (records are not test inputs, but guard against accidental glob hits).

**Commit:** `feat(E-25 T-090-01): full-shell fill proven on the cottage — oblique renders + exposure-band histograms (records)`

## Step 4 — progress.md + review.md

`progress.md`: per-step outcomes, measured numbers vs predictions, any deviations + rationale.
`review.md`: change summary, test coverage assessment, open concerns (interior-cavity skins, `-y`
inflation, T-087-01 contention, plaster-guard basis left on projection).

## Test strategy summary

| Layer | What | How verified |
|---|---|---|
| Pure core | exposure enumerator, subset relation, occluded-cell pin, regions, recolor invariant | unit tests on synthetic occupancy (hut + gabledRoof), `npm test` |
| Runner | wiring, record fields, degradation | `--offline` against old record (step 2), new record (step 3) |
| Acceptance | roof ≥90% / upper ≤5% / renders | hard throws in the live run + committed renders + record |

## Risks / contingencies

- **GL unavailable at step 3**: face renders degrade per existing policy, but AC #4 *requires* the
  oblique renders — if headless GL fails, fix the environment before committing records (the render is
  the acceptance evidence, not optional).
- **Predicted fractions wrong** (e.g. roof dominant < 0.5 because preserve set keeps too much): the
  coverage-gate throw will fire; resolve by policy review (preserve set), never by threshold tuning.
- **T-087-01 lands spray-paint.mjs changes mid-step-2**: rebase; seams are disjoint (their wiring is
  stray-salt/basin-fill stages, ours is §0c/§5b/§6).
- **storeyDivide/upperTop drift after refill** (floor lines are fill-invariant — recolor only — so no
  drift expected; assert zones identical before/after in step 3's spot-check if numbers look odd).
