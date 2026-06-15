# T-159-01 Structure — generate-first watertightness

All changes land in **`src/form/provision-generate.mjs`** (the construction stage) + its test file.
No changes to `provision-fit.mjs`, `roof-generate.mjs`, or the milestone runner. Additive,
re-Read-before-edit ([[shared-file-commit-sweep]]).

## 1. New defaults (`PROVISION_GENERATE_DEFAULTS`)

```js
export const PROVISION_GENERATE_DEFAULTS = Object.freeze({
  wallThickness: 2,
  carveDepth: 2,
  planCloseRadius: 1,   // NEW — morphological-close SE radius for footprint regularization
  minOpeningW: 2,       // NEW — an aperture narrower than this (cols) is a blob speck, not a window
  minOpeningH: 2,       // NEW — …and shorter than this (rows) likewise; both must hold to carve
  schemaVersion: "1.0.0",
});
```

General defaults (the existing `minRunWidth`/`wallThickness` precedent), never per-building.

## 2. New pure module-scope helpers (exported for unit tests)

Extract the existing inline `erode` closure to module scope and add the regularizer. All operate on
`Set<"x,z">` plan-column keys; all PURE.

```js
/** Erode a plan col-set: a cell survives iff all 4 ortho neighbours are present. */
export function erodePlan(cols) { … }            // = today's inline `erode`, hoisted

/** Dilate a plan col-set by the 4-neighbour SE (grows concavities; outer growth is pulled back
 *  by the matching erode in the close). */
function dilatePlan(cols) { … }

/** Fill ENCLOSED plan holes: flood 4-connected "air" from a 1-cell margin around the bbox; any
 *  in-bbox cell the flood never reaches is an enclosed hole → add it. Guarantees a hole-free region
 *  whose boundary is a single closed loop. */
function fillPlanHoles(cols, bbox) { … }

/** Regularize a footprint plan: morphological CLOSE (dilate^r then erode^r) to bridge ≤r-wide
 *  notches/run-gaps, then FILL enclosed holes. Identity on a clean (rectangular, hole-free) plan.
 *  PURE; `bbox` defaults to the cols extent. */
export function regularizePlan(cols, { radius = 1, bbox } = {}) {
  if (cols.size === 0) return new Set();
  const bb = bbox ?? bboxOf(cols);
  let cur = new Set(cols);
  for (let i = 0; i < radius; i++) cur = dilatePlan(cur);
  for (let i = 0; i < radius; i++) cur = erodePlan(cur);
  return fillPlanHoles(cur, bb);
}
```

`bboxOf(cols)` — small local helper (min/max over the keys) or reuse `footprintOfRuns`-style math.

### Why close THEN fill, and why this is identity-on-clean

- A clean rectangle: dilate grows the border outward by 1; erode removes exactly that grown border
  (those cells lack a full 4-neighbourhood) → back to the rectangle; fill finds no enclosed holes →
  returns the rectangle unchanged. **Identity.** (Inert-where-clean, proven by test.)
- A holey/ragged plan: close bridges 1-wide notches and run gaps; fill closes any remaining enclosed
  void. The boundary of the result is a closed loop → the wall ring is watertight regardless of
  residual outer raggedness.

## 3. Wall-building loop change (the body-mass loop)

Current (provision-generate.mjs ~166–186): `cols` (raw) → `erode` closure ×wallThickness → place
ring. Change to regularize `cols` first, then erode the **regularized** set:

```js
for (const m of bodies) {
  let cols = new Set();
  for (const r of m.runs) for (let x = r.x0; x <= r.x1; x++) cols.add(`${x},${r.z}`);
  cols = regularizePlan(cols, { radius: o.planCloseRadius });   // NEW: watertight, hole-free footprint
  let interior = cols;
  for (let i = 0; i < o.wallThickness; i++) interior = erodePlan(interior);  // erode regularized F
  for (const col of cols) {
    if (sheetCols.has(col) || interior.has(col)) continue;     // sheet exclusion applied AFTER regularize
    … place wall y = baseY..wallTop  (unchanged: wallBlockAt(y), provenance `mass:${m.id}`)
  }
}
```

- The inline `const erode = (set) => …` closure is **deleted**; both call sites use `erodePlan`.
- Filled/closed cells get normal `mass:${m.id}` provenance → the zero-blob check (provenance-based,
  NOT blob-intersection) passes unchanged.
- `sheetCols` (roof overhang) exclusion stays AFTER regularization — an overhang column still has no
  wall below it.
- Protrusion loop (chimneys) is **unchanged** — protrusions are solid, not ring-eroded; no holes there.

## 4. Opening coherence gate (the openings loop)

Current (~212–237): every `op` in every group is carved. Add a per-`op` coherence test before the
carve; skipped apertures become NAMED findings (Rule 1), never silent.

```js
for (const op of grp.openings) {
  const [lo, hi] = op.extent.range;
  const w = hi - lo + 1;
  const h = (op.crown ?? op.sillY) - op.sillY + 1;   // nominal aperture height
  if (w < o.minOpeningW || h < o.minOpeningH) {
    findings.push(finding("opening-incoherent", grp.id,
      `aperture ${w}×${h} at sillY=${op.sillY} below ${o.minOpeningW}×${o.minOpeningH} — blob speck, not carved`));
    continue;                                          // leave the wall solid
  }
  … existing per-column carve (facePos / headTopAt / wallMap.delete), unchanged
}
```

- Skipping = more wall solidity → strictly additive watertightness, inert where openings were coherent.
- The real wagon door (13×7) and all ≥2×2 apertures carve unchanged; the barn's 1×1 phantom specks
  (og-3/og-4/og-14/og-15) are skipped + recorded.

## 5. Tests — `src/form/provision-generate.test.mjs` (additive)

- **regularizePlan identity:** a 6×6 solid rectangle in → identical Set out (close + fill = identity).
- **regularizePlan fills hole:** rectangle minus one interior cell → that cell restored.
- **regularizePlan bridges a 1-wide notch:** a perimeter notch closed by close-1.
- **erodePlan:** unchanged behaviour vs the old closure (a 4×4 erodes to 2×2).
- **opening gate skips speck:** a fit with a 1×1 opening → wall cell NOT carved, `opening-incoherent`
  finding present.
- **opening gate keeps real door:** a 3×3 opening → carved (cells absent), no finding.
- **end-to-end inert:** a synthetic clean fit (rectangular footprint, all openings ≥2×2) →
  `generateProvision` output byte-identical with/without the new code path (regularize = identity,
  gate = no-op). Guards the "inert where clean" AC.

## 6. Render proof + replay (Implement phase, not a code change)

- Regenerate: `npm run generated:barn` → new `base-artifact.json` + `artifact.json`.
- `npm run render:beside -- --subject barn` → `pr/assets/frames/beside-concept-barn.png`; copy a proof
  frame into `pr/assets/` with an honest caption (build solidity, not facade texture).
- `npm run generated:barn -- --repro` → two fresh runs byte-identical (determinism holds).
- `npm test` green; cottage/other clean subjects unaffected (regularize/gate inert there).

## Ordering

1. Add defaults + pure helpers (`erodePlan`, `dilatePlan`, `fillPlanHoles`, `regularizePlan`) + their
   unit tests → commit.
2. Wire the wall loop to `regularizePlan` + `erodePlan` (delete inline closure) → commit.
3. Add the opening coherence gate + its tests → commit.
4. Regenerate, render proof, --repro, full suite → commit (artifacts + proof).
