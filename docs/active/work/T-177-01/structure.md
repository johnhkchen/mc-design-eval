# T-177-01 — Structure

The shape of the change. One new runner, one new build dir, zero production-geometry edits, zero
frozen-instrument touches.

## Files

### CREATE — `experiments/eval-alignment/faithful-roof.mjs` (the runner)
A focused, recognition-program-driven carve+cover on a finished artifact. ~120 lines. Public surface: a
CLI `main()`; no exported API (a runner, like `roof-climb.mjs`).

**CLI flags (defaults = gatehouse faithful build; no per-subject dispatch map):**
- `--build <path>`   default `builds/gatehouse/faithful/artifact.json`
- `--program <path>` default `benchmarks/sculpture/recognition/gatehouse.program.json`
- `--concept <path>` default the gatehouse concept png (witness input only)
- `--out <dir>`      default `builds/gatehouse/faithful-covered`

**Imports (all existing, no new modules):**
```
artifactOccupancy, occupancyFromCells        ../../src/view/occupancy.mjs
gableRecord, generateRoof, roofMaterialFraction  ../../src/view/roof-generate.mjs
closureOf                                     ../../src/view/wall-generate.mjs
rebuildArtifact                               ../../src/view/shell-integrity.mjs
renderViews                                   ../../src/view/multi-angle.mjs
renderBesideConcept                           ../../src/view/render-beside.mjs
```

**Internal helpers (pure, kept in-file):**
- `eaveFromProgram(prog)` → `{ eaveY, ridgeAxis, pitch }`
  - `eaveY = m.storeys * m.storeyHeight − 1`; `ridgeAxis = m.roof.ridgeAxis`; `pitch` from
    `pitchClass` (1→1; clamp ≥1). Throws a named error if `masses[0]` lacks the fields (no silent
    fallback to a magic number — a missing field is a finding).
- `deriveFamily(modalRoofBlock)` → `{ field, stairs, slab }`
  - stem the field id (preserve `minecraft:` ns), name-morph `_planks`→`_stairs`/`_slab`. Mirrors
    `roof-generate.mjs::familyStem` morphology but keeps the namespace.
- `modalBlock(cells, predicate)` → most common block among matching cells (eave-layer → `gableBlock`;
  above-eave carved → roof field).

### CREATE — `builds/gatehouse/faithful-covered/` (the deliverable build dir)
- `artifact.json` — faithful walls + covering roof (written by the runner).
- `view-{+x+z,+x-z,-x-z,-x+z}.png` — 4 azimuth renders (AC #2).
- `beside-concept.png` — witness beside the gatehouse concept.
- `SOURCE.md` — provenance: which build + program produced it, the seam used, census + closure numbers.

### COPY (witness) — `docs/active/work/T-177-01/`
- `beside-concept.png` (copy of the build-dir one) and the 4 azimuth views, so the work dir carries the
  glance evidence per AC #2 ("saved to the work dir").

### MODIFY — none in `src/`.
No production geometry change. `generateRoof`'s covering mode (T-172-01) already does the work; this
ticket only *drives* it from the faithful artifact + program. Therefore **no new unit tests are required
for production code** (none changed); the runner follows the metered-harness posture (verified by
running), exactly as `roof-climb.mjs` does.

### UNTOUCHED (asserted)
- `measurements/**` — frozen instrument.
- `builds/gatehouse/faithful/**` — the prism baseline (S-178 compares against it).
- `experiments/eval-alignment/roof-climb.mjs` — left as-is (its `--score` crater is T-178-01).

## Runner control flow (the blueprint)

```
main():
  args ← parse flags (build, program, concept, out)
  raw  ← read(build);  occ ← artifactOccupancy(raw)
  prog ← read(program)
  { eaveY, ridgeAxis, pitch } ← eaveFromProgram(prog)

  # carve y > eaveY, keep walls with forms/states; collect eave-layer footprint + cols
  kept, eaveCols, bbox(x0,x1,z0,z1), carvedCells ← scan occ.cells:
      y ≤ eaveY → keep {pos, block, form, state}; if y==eaveY → eaveCols.add, grow bbox
      y  > eaveY → carvedCells.push (for roof-field detection)

  roofField  ← modalBlock(carvedCells)          # = minecraft:dark_oak_planks (faithful)
  family     ← deriveFamily(roofField)          # field/stairs/slab, ns-preserving
  gableBlock ← modalBlock(kept @ y==eaveY)       # = minecraft:stone_bricks

  perpSpan ← ridgeAxis=="x" ? (z1−z0) : (x1−x0)
  ridgeY   ← eaveY + floor(perpSpan/2)
  gable    ← gableRecord({footprint:bbox, ridgeAxis, eaveY, ridgeY, pitch, hip:{demanded:false}})
  gen      ← generateRoof([gable], family, { covering:true, gableBlock })

  newOcc      ← occupancyFromCells([...kept, ...gen.cells])
  newArtifact ← rebuildArtifact(newOcc, raw)

  # census + closure (report, don't gate beyond the AC)
  roofIds  ← [family.field, family.stairs, family.slab]
  cPrism   ← roofMaterialFraction(raw.placements, roofIds)        # the input (faithful prism)
  cCover   ← roofMaterialFraction(newArtifact.placements, roofIds)
  closure  ← closureOf(eaveCols)        # compare to closureOf of the faithful input's eave ring

  write out/artifact.json
  renderViews(newArtifact, 4 az → out)
  renderBesideConcept(newArtifact, concept, out/beside-concept.png)
  write out/SOURCE.md (provenance + numbers)
  print the census + closure summary
```

## Ordering of changes

1. Write the runner.
2. Run it once → inspect renders (the glance) + census + closure in the console.
3. If the glance reads as a covered roof and closure holds: copy witnesses to the work dir, write
   `SOURCE.md`, commit.
4. `npm test` (must stay green — no production change, so this is a regression guard).

## Interfaces relied on (contract pins, from research)
- `gableRecord({footprint:{x0,x1,z0,z1}, ridgeAxis, eaveY, ridgeY, pitch, hip})`.
- `generateRoof(gables, {field,stairs,slab}, {covering:true, gableBlock})` → `{cells, ...}`.
- `rebuildArtifact(occupancyFromCells(cells), raw)` → artifact with merged palette/metadata.
- `closureOf(Set<"x,z">)` → number; `roofMaterialFraction(placements, ids)` → `{roof,total,frac}`.
- `renderViews(artifact, ["+x+z","+x-z","-x-z","-x+z"], {outDir,label,width,height})`.
- `renderBesideConcept(artifact, conceptAbsPath, outPath, {label})`.
