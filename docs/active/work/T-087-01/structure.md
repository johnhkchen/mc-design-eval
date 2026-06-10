# T-087-01 coherent-surface — Structure

File-level blueprint. Pure cores in `src/view/`, impure wiring in `benchmarks/sculpture/`, one additive
export in an existing module, one npm script, one .gitignore stanza.

## Files

### NEW `src/view/surface-pattern.mjs` (~170 lines, pure)

Surface-PATTERN ops (T-087-01, story S-087, epic E-24) — distinct from surface-COHERENCE (S-084,
geometric watertightness) and zone-FILL (S-085, dominant establishment): this module makes an already
watertight, base-coated skin *read* cleanly. Header restates: recolor+add only / never delete; pure (no
GL, I/O, Date, random); policy as data.

```
imports: bareBlock (./occupancy.mjs)
         projectSurface (./surface-grid.mjs)
         surfaceVoxelEntries, FILL_FACES (./zone-fill.mjs)   ← newly exported iterator

// — internal helpers —
namespaced(id)                       // same 3-liner the sibling modules carry
topHeightMap(occ)                    // Map "x,z" → {y, key} from projectSurface(occ,"+y")
                                     // (private; both course fns derive from it)

// — exports —
export function courseMetrics(occ)
  → {pairs, flat, step1, cliff, stepSmoothness, meanAbsStep}
  // adjacent (+x,+z) column pairs of the +y map; stepSmoothness=(flat+step1)/pairs, ‰-rounded;
  // zero-pair map → {pairs:0, …, stepSmoothness:1, meanAbsStep:0} (vacuously regular)

export function regularizeRoofCourses(occ, {dominant})
  → {placements, columnsRaised, voxelsAdded, before, after}
  // priority-flood spill levels: seeds = columns with ≥1 missing 4-neighbour (map boundary/outlets),
  //   level=ownY; pop lowest, neighbour level = max(ownY, poppedLevel); monotone heap (sorted-insert
  //   array is fine at n≈700 — no dependency).
  // placements: ADDS at (x, yTop+1 … spill, z), block = namespaced(dominant); throws if dominant
  //   is not a non-empty string. before/after = courseMetrics on occ / on overlaid occ
  //   (occupancyFromCells reuse via a local overlay of the adds).

export function stripStraySalt(occ, {zoneOf, zones, faces=FILL_FACES, minKeep=3, minExtent=3})
  → {placements, stripped, kept, byZone}
  // byZone[zone] = {offDominant, strippedCells, keptCells, byBlock:{<bare>:{stripped,kept}}}
  // skin = surfaceVoxelEntries(occ, faces) (the ONE skin definition); off-dominant = zone has a
  //   policy entry && bare ≠ zones[zone].dominant; components = 6-connected same-material over
  //   off-dominant skin cells, WHOLE-SKIN (chimney crosses zones); keep iff size≥minKeep AND
  //   maxAxisExtent≥minExtent; strip → recolor placement to the CELL's zone dominant.
  // arg validation mirrors zoneFill's (zoneOf fn, zones map with string dominants → throw).
```

Boundary rules: no zone names, no block ids, no cottage constants in this file; `zones` shape is
`{<zone>: {dominant}}` (preserve/splat keys ignored if present — the runner can pass `fill.policy`
straight through).

### NEW `src/view/surface-pattern.test.mjs` (~190 lines, in `npm test`)

Two synthetic fixtures, hand-counted in comments (zone-fill.test.mjs idiom):

1. **The noisy hip roof** for course ops: a 9×9 stepped pyramid (courses y=3..6) over a solid base, with
   (a) a 1-cell pit, (b) a 2×2 basin 2 deep, (c) a 1-wide valley channel draining to the eave,
   (d) a 2-cell bump, (e) a notch on the eave edge (draining outlet). Asserts: pit+basin raised to spill
   in dominant blocks; valley/notch/bump untouched; placements are adds-only at empty cells; pos-set of
   `expandArtifact(applyPaint(art, placements))` ⊇ original and equals original ∪ adds; metrics
   hand-checked before/after (cliff count drops by the two defects' pairs exactly).
2. **The salted hut** for the strip: zone-fill's hut shape re-used with: 1 isolated cobble speck in the
   plaster field (STRIP→plaster), a 2×2 log clump (STRIP), a 3-cell vertical stud (KEEP), a 3-cell
   cross-zone brick chimney (KEEP via whole-skin connectivity), and a no-policy zone cell (untouched).
   Asserts per-zone counts exactly; recolor-only (every placement pos ∈ occ); the two AC-named behaviors
   are individually named tests ("isolated speck stripped", "stud run preserved").

zoneOf is hand-rolled per fixture; tests never import structuralZones.

### MODIFIED `src/view/zone-fill.mjs` (one line + doc)

`function* surfaceVoxelEntries` → `export function* surfaceVoxelEntries`, JSDoc gains "the canonical
visible-skin iterator (S-087 consumes it)". No behavior change; zone-fill.test.mjs untouched.

### NEW `benchmarks/sculpture/surface-pattern.mjs` (~200 lines, impure runner)

Mirrors value-select runner shape (the T-086 precedent). NOT in `npm test`; GL best-effort.

```
inputs:  benchmarks/sculpture/spray-paint/cottage/artifact.json   (the baseline build)
         benchmarks/sculpture/spray-paint/cottage.json            (record → fill.policy = zone dominants)
outputs: benchmarks/sculpture/surface-pattern/cottage.json        (committed record)
         benchmarks/sculpture/surface-pattern/cottage.md          (committed summary)
         benchmarks/sculpture/surface-pattern/cottage/artifact.json (committed, AJV-valid)
         benchmarks/sculpture/surface-pattern/cottage/view-{front,side,top}-{before,after}.png (gitignored)
flow:    load → artifactOccupancy → structuralZones().zoneOf
         → regularizeRoofCourses(occ, {dominant: policy.roof.dominant})
         → applyPaint → re-occupancy
         → stripStraySalt(occ2, {zoneOf, zones: policy})
         → applyPaint → assertArtifact
         → best-effort renders (renderViews front/side/top, before on input, after on result)
         → write record {schema:"surface-pattern/v1", subject, inputs, course:{before,after,
           columnsRaised,voxelsAdded}, salt:{minKeep,minExtent,stripped,kept,byZone},
           placements:{courseAdds,saltRecolors}, faces:[render refs/errors], note}
--offline: read committed record + artifact; assert salt.stripped > 0,
           course.after.stepSmoothness > course.before.stepSmoothness, assertArtifact passes;
           exit 1 on violation. No GL, no decode.
```

zoneOf comes from `structuralZones(occ)` of the INPUT build and is reused for the post-fill occupancy
read (raised cells are roof by +y membership either way; one zoning, no drift between ops). Note in the
runner header: spray-paint.mjs is deliberately not modified (T-088 turf; consolidation is S-089/E-25).

### MODIFIED `package.json`

`"pattern:cottage": "node benchmarks/sculpture/surface-pattern.mjs"` after `value:select`-area scripts.

### MODIFIED `.gitignore`

Stanza mirroring spray-paint's: comment + `benchmarks/sculpture/surface-pattern/**/*.png`.

## Public interface summary (what other tickets may consume)

- `courseMetrics(occ)` — the roof-regularity number (S-088's gate could later read it).
- `regularizeRoofCourses(occ, {dominant})`, `stripStraySalt(occ, {zoneOf, zones, …})` — op-result idiom
  `{placements, …counts, before?, after?}` consistent with sealRoof/zoneFill.
- `surfaceVoxelEntries(occ, faces)` (zone-fill.mjs) — now public; the one skin iterator.
- The record file `surface-pattern/cottage.json` — downstream evidence (S-089 consolidation).

## Ordering of changes

1. zone-fill.mjs export (additive, zero-risk) — unblocks the new module.
2. surface-pattern.mjs + surface-pattern.test.mjs — the reviewable core; `npm test` green here.
3. Runner + package.json + .gitignore — wiring.
4. Live run on the cottage → committed record/md/artifact (+ local PNGs); `--offline` re-assert.

Each step is an atomic commit; 2 is the high-review-value one.

## Invariants the structure preserves

- Pure/impure split: src/ has no GL/IO/model; the runner owns files, GL, process.argv.
- No delete: course op ADDS, salt op RECOLORS; both emit appended `{op:"voxel"}` placements consumed by
  `applyPaint`; AJV asserted after both.
- Policy as data: dominants/zones flow from the spray-paint record into both ops; src/ stays generic.
- No shared-file collision with T-088-01 (its surface: face-resemblance/value-gate + spray-paint.mjs).
