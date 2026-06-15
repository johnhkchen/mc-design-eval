# T-092-01 — concept-derived-zone-map — Review

## What changed

**Created**
- `src/color/band-profile.mjs` — the pure concept band-profile extractor: validate-mode concept
  grid → row histograms → robust-extent calibration → anchored piecewise row→layer map →
  field-class band segmentation in voxel space → snap-when-near floor-line alignment → E-21 role
  resolution → `{readable, bands:[{name, yRange, dominantBlock, dominantRole, share, secondaries}],
  roof, params}` or an honest refusal `{readable:false, reason}`.
- `src/color/band-profile.test.mjs` — 22 tests: per-function contracts + an end-to-end synthetic
  image (committed-table colors, white field, chimney spur) + every refusal reason.
- `src/view/zone-map.mjs` — occupancy side: `layerCounts`, `zonesFromBands` (bands + structural
  roof contract → the `{zoneOf, zones}` pair all name-agnostic consumers take), `diffZoneMaps`.
- `src/view/zone-map.test.mjs` — 8 tests incl. a direct `zoneFill` round-trip.
- `benchmarks/sculpture/zone-map.mjs` (`npm run zone:map`) — the T-092 runner: derives + saves +
  diffs both subjects' maps; renders the cottage prior-vs-derived before/after.
- Committed records/evidence: `benchmarks/sculpture/zone-map/{cottage,gatehouse}.{json,md}`,
  `pr/assets/frames/zonemap-cottage-{before,after,strip}.png`.

**Modified**
- `benchmarks/sculpture/durable-skin.mjs` — `buildSkin(def, {zoneSource:"derived"})` (default
  derived; prior is the recorded fallback or an explicit override); zone-map record agreement
  THROW (value-select precedent); legacy splat-only baseline pinned to the prior zone geometry;
  gates generalized for N wall bands (plaster invariant = zero outside zones whose policy includes
  the block; per-band foreign-dominant residue ≤ 0.05); record/md/`--offline` extended; `SUBJECTS`
  gains `zoneMapRecord`, policies re-documented as the fallback prior.
- `package.json` (`zone:map`), `.gitignore` (zone-map renders), refreshed
  `durable-skin/{cottage,gatehouse}` records/artifacts + `durable-*` frames.

Commits: `51f4398`, `b515961`, `f106d70`, `b78ecbb`, `41b4070`.

## Acceptance criteria

- **Pure extractor, unit-tested on synthetic images** — yes (22 + 8 tests; `npm test` 1084/1084).
- **Role resolution + `{bands:[{yRange, dominantRole, secondaries}]}` + prior as recorded
  fallback** — yes; fallback reasons are explicit values, recorded in the durable record and the
  zone-map record, never overriding a readable concept.
- **Maps saved and diffed** — `zone-map/<subj>.json` carries derived bands, the prior policy, and
  the per-y wall diff + roof pair.
- **Consumed by zone-fill, zero subject-specific code** — durable-skin passes the derived
  `{zoneOf, zones}` straight into the existing `zoneFill`/census/gates; every threshold is a
  generic exported constant; subjects contribute registry data only. `npm test` green.
- **End-to-end cottage run + before/after render** — done (gates pass, double-run byte-equal,
  `--offline` green). **With a substantive caveat — see the finding.**

## THE FINDING (needs human attention)

**The cottage AC's expected outcome contradicts the actual concept image.** AC3 expects "a low
stone plinth + plaster/timber on both storeys, not a full stone ground storey". Direct crop
inspection of concept 014 (see progress.md) shows the ground storey is **entirely stone up to the
jetty**; plaster+timber exist only on the upper storey and gables. The extractor reads exactly
that: `band0 y0..6 stone_bricks, band1 y7..13 white_terracotta` — wall-wise identical to the
prior (`diff.wallDiffs: []`). I did not tune the extractor to fabricate the expected plinth
boundary (E-25 Rule 2: concept immutable; Rule 6: honest gaps beat faked passes; Rule 3 forbids
the subject-specific nudge it would take). The synthetic suite proves the mechanism finds a
mid-storey plinth boundary when a concept actually shows one (and that it is NOT forced onto a
floor-line). The epic-level claim behind S-092 should be re-examined — possibly it described a
different/earlier concept or misread the jetty shadow.

What the derivation **did** change, visibly: the cottage **roof dominant is `dark_oak_planks`**
(the concept's roof is dark), not the prior's `spruce_planks` — the after-strip shows the derived
roof closer to the concept. Gatehouse: all-stone walls, `deepslate_tiles` roof, no brown base —
its half of AC3 is satisfied as written.

## Test coverage and gaps

- Pure cores fully covered (synthetic images + synthetic occupancy; every refusal path asserted).
- The impure runners are covered by their built-in proofs (double-run byte-equality, record
  agreement throws, coverage/band/invariant gates, `--offline`), not by `npm test` — the
  repo-standard seam.
- Not covered: a unit test exercising `anchorIndex` against a *real*-shaped silhouette (the
  cottage numbers live only in the live run + module comment); GL render paths (best-effort by
  design).

## Open concerns / limitations

1. **The roof-dominant flip is shading-sensitive.** Roof-class dominance by cell count conflates
   the field role with the eave-fascia role and with slope shading; T-086's value-select kept
   spruce for the *roof field role* while the band profile picks dark_oak_planks for the *roof
   zone*. Both are recorded; if E-25's multi-angle gate (S-093) judges the darker roof worse, the
   roof dominant could be re-grounded via the role swatches rather than raw counts — a follow-on,
   not done here.
2. **Anchor assumption**: the widest-silhouette line must be the same physical feature in concept
   and build. True for eave-overhang buildings (both subjects, measured); a battered-base fort
   would anchor at the base on both axes (still consistent), but a concept whose widest feature is
   absent from the build (e.g. trimmed by voxelization) would mis-pin — the floor-line snap bounds
   the damage to ±2 layers only near floor-lines.
3. **Wall bands are horizontal only** — a vertically split facade (half stone tower, half plaster
   wing) is out of model; the row histogram would average it. Matches the ticket's banding scope.
4. **`legacy`/`plasterInvariant` registry fields remain name-coupled to the prior's zones** (the
   legacy replay is intentionally frozen history); the challenge subject (S-095) needs neither.
5. The S-091 shell-integrity runner landed concurrently (`9143d63`); durable-skin does not yet
   chain it — integration ordering belongs to S-095.
