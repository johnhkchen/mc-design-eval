# T-174-01 — Structure: files & shape of the spike

Spike code is **throwaway and lives entirely under `experiments/`** (unswept by `src/**/*.test.mjs`, so it may
import `opening-dressing` and inject the dressing seam — the brush-door rule). **No production-module edits.**
Renders + decision land in the work dir.

## Files

### Created — the one spike runner
`experiments/eval-alignment/articulation-spike.mjs` (new; ~150 lines, throwaway scouting script)

A self-contained Node ESM script. Shape mirrors `skin-beside.mjs` / `roof-climb.mjs`:

```
imports:
  node:fs (readFileSync), node:path, node:url
  artifactOccupancy, occupancyFromCells            ../../src/view/occupancy.mjs
  quoin, eaveOverhang                              ../../src/view/facade-articulation.mjs
  surfaceRelief                                    ../../src/view/surface-relief.mjs
  extractApertures, dressOpenings                  ../../src/view/opening-dressing.mjs
  rebuildArtifact                                  ../../src/view/shell-integrity.mjs
  renderBesideConcept                              ../../src/view/render-beside.mjs

constants:
  BASE    = builds/gatehouse/faithful/artifact.json
  CONCEPT = benchmarks/sculpture/runs/015-…/concept.png
  OUT     = docs/active/work/T-174-01/
  FLOOR=0, EAVE_Y=19, FACES=[+x,-x,+z,-z]
  roles:  QUOIN=cobblestone, FIELD=stone_bricks, TIMBER=dark_oak_log, BAND=stone_bricks

helpers:
  occToCells(occ)                  → cell list for re-folding
  fold(occ, placements)            → occupancyFromCells([...occToCells, ...placements])   // last-writer via map
  dressArch(occ)                   → extractApertures + dressOpenings({door:spruce_door, frame:dark_oak_log, light:lantern})

candidates (each: occ → occ):
  candidateA(occ)   // grammar:   quoin(run=full,hd=2) + eave band(1 course) + verge(1 course) + arch reveal
  candidateB(occ)   // patternbook: quoin(run=full,hd=3 bold) + 2-course band + arch + subtle coursed-field belt
  candidateD(occ)   // critique:  token → +deepen quoins → +arch ; render final, log the 3-round progression
  baseline(occ)     // token: quoin(run=4,hd=1) only — the E-42 "before"

main():
  load BASE → occ0
  for [baseline, A, B, D]:
    occN = candidate(occ0)
    art  = rebuildArtifact(occN, raw)
    await renderBesideConcept(art, CONCEPT, OUT/<name>-beside.png, {label:`gatehouse-<name>`})
    print per-candidate cell delta + brush reports (proudCells per layer)
```

Each candidate composes brush ops with `fold` between layers (so a later brush sees the earlier proud cells —
quoins-then-band stack correctly; `surfaceRelief`/`quoin` are idempotent on their own output, charter-safe).

### Created — render outputs (the deliverable)
- `docs/active/work/T-174-01/baseline-beside.png` — token (E-42 "before")
- `docs/active/work/T-174-01/candidateA-beside.png` — compositional grammar
- `docs/active/work/T-174-01/candidateB-beside.png` — curated pattern-book
- `docs/active/work/T-174-01/candidateD-beside.png` — critique-amplification (final)
- (optionally) a side-by-side contact sheet is unnecessary — each is already concept-first.

### Created — RDSPI artifacts
`research.md`, `design.md`, `structure.md`, `plan.md`, `progress.md`, `review.md` in the work dir.

### Modified / Deleted
**None.** No production source, schema, pack, or test changes. The frozen instrument is untouched.

## Interfaces relied on (all existing, unchanged)

- `quoin(occ, {material, faces, run, headerDepth})` → `{placements, report:{corners, proudCells}}`.
  Corners derived from geometry (`faceSkin` aMin/aMax) — no per-build corner list needed.
- `eaveOverhang(occ, {material, faces, depth, eaveRow})` → one proud course at `eaveRow`. Called twice (eaveY
  and eaveY-1) for B's 2-course band; once for A.
- `surfaceRelief(occ, {material, faces, rhythm:{axis:"row", every, span}, depth, zoneOf, zone})` → coursed
  belt for B's subtle field.
- `extractApertures(occ)` + `dressOpenings(occ, apertures, {slots})` → arch frame/reveal placements.
- `rebuildArtifact(occ, raw)` → renderable artifact (preserves palette/metadata).
- `renderBesideConcept(artifact, conceptPath, outPath, {label})` → writes the 5-panel sheet (concept + 4 az).

## Ordering

1. Runner skeleton + `baseline` + `candidateA` → render → eyeball (cheapest, proves the path).
2. Add `candidateB` (+ arch via `dressArch`) and `candidateD` → render all.
3. Inspect renders, write the recommendation.

If `dressOpenings` proves fiddly on this build, the fallback (noted in plan) is a manual timber-perimeter
reveal — the arch is one of four glance elements, not the whole spike.
