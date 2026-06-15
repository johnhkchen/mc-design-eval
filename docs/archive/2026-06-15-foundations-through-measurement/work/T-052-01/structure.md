# T-052-01 — Structure: file-level blueprint

The blueprint, not the code. One new harness + its committed outputs; one `.gitignore` line; zero `src/`
change.

## Files

### CREATE — `benchmarks/sculpture/glb-voxel-surgical.mjs` (~190 lines)
The synthesis harness. Mirrors `glb-formtarget-ab.mjs`'s shape; differs in input source, two-route region
lists, and a P14 reporter. **Imports (reuse, no clone):**

```
reviseLoop, liveFormScore                         ../../src/revise/loop.mjs
observeRegion, selectRegion, applyRegionEdit,
  subBoundsOf, artifactBounds                      ../../src/revise/region.mjs
makeFormEditor, regionKey                          ../../src/revise/form-edit.mjs
glbFormTarget                                      ../../src/form/form-target.mjs
SCULPTURE_VIEW_3Q                                  ../../src/sculpture.mjs
formVerdictOf, VERDICT_GLOSS                       ./glb-formtarget-ab.mjs   ← shared judge, imported
```

**Module-level constants**
- `HERE`, `GLB_DIR = HERE/glb`, `IN_DIR = HERE/glb-voxel`, `OUT_DIR = HERE/glb-voxel-surgical`.
- `SUBJECTS` — array of `{ key, glb, regions: [ {bbox, defect, where, route}, … ] }` for koi + heart, the
  four regions from `design.md` (LLM region first, procedural second per subject).

**Functions**
- `makeRegionCritic(regions)` → `(artifact, R) => [{defect, where, route}]`
  - Matches the live `R.spec` against the configured regions (by `JSON.stringify(spec)`); returns that
    region's configured `{defect, where, route}` (so `relief`→procedural, `curve`→LLM). Empty if unmatched
    (defensive). **Pure.**
- `wholeObjectIoU(artifact, target, outPath)` → `Promise<number>`
  - Lazy-import `renderArtifact`; render whole artifact @ `SCULPTURE_VIEW_3Q`; `target.wholeObjectScore`.
    (Identical to the sibling — could be imported, but the sibling does not export it; a 3-line local copy
    of GL glue is acceptable and avoids widening the sibling's export surface.)
- `p14Report(out)` → `{ ok, locked, acceptedRegions, rolledBack, violations[] }`
  - **Pure.** Reads the loop's `out.trace` + `out.locked`. Computes: accepted entries, rolled-back entries;
    asserts every accepted entry's `subBounds` is present in `out.locked`; asserts no trace entry edits a
    region overlapping an already-locked region *without* being marked `locked-overlap` (the loop
    guarantees this — the report just confirms it from the record). `ok` iff no violations.
- `reviseSubject(s)` → `Promise<row>`
  - Read `IN_DIR/<key>/artifact.json`; `buildBounds = artifactBounds`; `target = glbFormTarget({glbPath:
    s.glb, buildBounds})`; `beforeWhole = wholeObjectIoU(before.png)`.
  - `editor = makeFormEditor({ critic: makeRegionCritic(s.regions) })`.
  - `out = await reviseLoop(artifact, { regions: s.regions.map(r => ({bbox:r.bbox})), observe:
    observeRegion→crop-<i>.png, diagnose: editor.diagnose, tweakFor: editor.tweakFor, score:
    liveFormScore({formTarget: target}), budget:{maxIterations: 8, perRegion: 1} })`.
  - `afterWhole = wholeObjectIoU(after.png)`. Render each stashed *proposed* candidate (per LLM region) to
    `proposed-<i>.png` via `applyRegionEdit` (shown even if rolled back).
  - Build `perRegion[]` from `out.trace` (region, route, defect/where, scoreBefore→scoreAfter, accepted,
    reason) + `p14Report(out)`. Return the row (subject, glb, buildIoU baseline from summary.json,
    whole before/after, verdict = `formVerdictOf(beforeWhole, afterWhole, anyAccepted)`, perRegion, p14,
    proposals).
- `mdTable(rows)` / `emit(rows)` — write `glb-voxel-surgical.json` (`schema:
  "glb-voxel-surgical/v1"`) + `glb-voxel-surgical.md`. The md leads with a synthesis headline (did surgical
  tweaks clean any voxelization artifact? kept-vs-rolled-back counts per route), a table, the verdict
  gloss, then a per-subject section with the per-region trace JSON + render pointers.
- `regenerateOffline()` — re-derive verdict from committed `glb-voxel-surgical.json` numbers (no GL/model).
- `main()` — `--offline` → regen; else loop SUBJECTS, skip a subject whose `artifact.json` **or** `.glb` is
  absent (clear stderr note), `reviseSubject`, `emit`.

### MODIFY — `.gitignore` (+1 line)
- Add `benchmarks/sculpture/glb-voxel-surgical/**/*.png` — renders are image-heavy, derived, regenerable;
  the durable record is `glb-voxel-surgical.{json,md}` (repo convention, matches the `glb-voxel/**` and
  `glb-formtarget-ab/` precedent — note the sibling commits its PNGs, but the GLB-voxel renders are large
  and already-precedented as gitignored under `glb-voxel/`; keep consistent with the heavier-render rule).

### CREATE (committed outputs) — the durable record
- `benchmarks/sculpture/glb-voxel-surgical/glb-voxel-surgical.json`
- `benchmarks/sculpture/glb-voxel-surgical/glb-voxel-surgical.md`
- (PNGs under `glb-voxel-surgical/<subj>/` are written but gitignored.)

> Path note: the AC says outputs under `benchmarks/sculpture/glb-voxel-surgical/<subj>/` + an A/B summary.
> The `.json`/`.md` summary lives at `glb-voxel-surgical/` root (one level up from `<subj>/`), per-subject
> renders under `<subj>/`. (The sibling writes its summary at `sculpture/` root; here both summary and
> per-subject dirs live under one `glb-voxel-surgical/` tree — cleaner grouping for the synthesis output.)

### NONE — `src/`
No source change. `reviseLoop`, `glbFormTarget`, `makeFormEditor`, `region.mjs` are consumed unchanged —
the seam invariant is the point. `npm test` surface untouched → stays green.

## Public interface / contracts touched

- **Consumed unchanged:** `reviseLoop`, `liveFormScore`, `glbFormTarget`, `makeFormEditor`, `regionKey`,
  `observeRegion`, `selectRegion`, `applyRegionEdit`, `subBoundsOf`, `artifactBounds`, `SCULPTURE_VIEW_3Q`.
- **Newly imported across benchmark files:** `formVerdictOf`, `VERDICT_GLOSS` from `glb-formtarget-ab.mjs`
  (already `export`ed there — no change to that file).
- **New (harness-local, not exported anywhere src depends on):** `makeRegionCritic`, `p14Report`,
  `reviseSubject`, `emit`, `regenerateOffline`.

## Output schema — `glb-voxel-surgical/v1`

```
{ schema, metric, generatedFrom, note,
  subjects: [ {
    subject, glb, buildSilhouetteIoU,            // T-051-01 baseline (from summary.json)
    wholeObjectIoUBefore, wholeObjectIoUAfter, verdict,
    keptCount, rolledBackCount,
    perRegion: [ { region, route, defect, where, scoreBefore, scoreAfter, accepted, reason,
                   proposedWholeIoU? } ],
    p14: { ok, locked, violations },
    proposals,                                    // editor.proposals (LLM op counts/rejections)
    trace                                         // raw out.trace
  } ] }
```

## Ordering of work (detail in plan.md)

1. Harness skeleton + imports + SUBJECTS + critic + P14 reporter (offline-shaped; `--offline` exercisable
   once a JSON exists).
2. Live wiring (`reviseSubject`, `wholeObjectIoU`, proposed renders) + `emit`/`mdTable`.
3. `.gitignore` line.
4. Live run on koi + heart → committed `.json`/`.md`.
5. `npm test` green; write `progress.md` then `review.md`.
