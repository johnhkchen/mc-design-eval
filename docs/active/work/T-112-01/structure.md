# T-112-01 hip-pyramid-cap — Structure

## Files created

### `src/form/roof-hip-fit.mjs` (new pure core)
Header doctrine: positions as-built, slopes GLB-fittable, geometric gates only, Rule 2 named
refusals, PURE (no I/O/GL/Date/random). Exports:

- `HIP_FIT_SCHEMA = "roof-hip-fit/v1"` — record tag.
- `HIP_FIT_DEFAULTS` — `{faceAngleDeg: 25}` (the END_FIT cone, reused value, declared once
  here); pitch sanity comes from `ROOF_FIT_DEFAULTS` (`maxPitch`, `minRun`) — imported, not
  restated.
- `capFootprint(occ, massPlanCols, bandFloor)` — occupied columns at the band floor ∩ the mass
  plan, fill-between applied; returns `{cols, bbox}` (internal helper, exported for tests).
- `fitHipCap({record, massId, gables, occ, tris, opts})` → `{gable, evidence, findings}` with
  `gable: null` on refusal. The returned gable: `kind: "hip-cap"`, `id: "hip-cap-<massId>"`,
  `ridge: {axis, y}` (constructed apex/ridge), 4 `sides` (planeId or null, pitch/pitchSource,
  eaveY, eaveEdge, extentCells [] for synthetic faces, voxelPitch/glbPitch recorded), standard
  `footprint`, `hip: {demanded: false}`, `sane: true`, `capFit` (per-face rmse/triangles, apex
  evidence `{constructedY, glbMaxY}`).
- `fitHipEnds(gables, occ, tris, opts)` → `{gables, findings}` — per demanded end of each sane
  hip-demanded gable, fitted slope plane (`hip.fitted.{lo,hi} = {pitch, rmse, triangles}`),
  named finding + heuristic-stays on refusal.

### `src/form/roof-hip-fit.test.mjs`
Synthetic-spec tests (the AC's "unit-tested on synthetic specs"): square pyramid (4 faces, apex
point, sane), elongated footprint (emergent ridge, axis chosen by long side), missing GLB face
triangles → named refusal, too-thin footprint (minRun) → named refusal, recorded-plane pitch
preferred over GLB cone, hip-end fit happy path + refusal, determinism (same input → deep-equal).

## Files modified

### `src/form/roof-fit.mjs`
- Extract `hipEndPlanes(gable)` — the ONE definition of the hip end planes (per-end `{dir, lo:
  bool, anchor, eave, pitch}`), today's arithmetic verbatim (mean side pitch, min eave, bbox
  edges) EXCEPT: when `gable.hip.fitted?.{lo,hi}` exists, that end's pitch is the fitted one.
  Exported; consumed by `gableSurfaceHeight` AND `roof-generate`'s `gableDownhillAt` so the
  surface and the downhill question can never diverge (the gatehouse lesson, now structural).
- `gableSurfaceHeight` rewritten over `hipEndPlanes` — output byte-identical for every gable
  without `hip.fitted` (asserted by existing tests + a new regression test).
- No change to `gablesFromRecord` / `programFitError` / variants (4-side gables already work:
  sides iteration is generic; synthetic faces contribute 0 fit-error cells by empty extents).

### `src/view/roof-generate.mjs`
- `gableDownhillAt` re-based on `hipEndPlanes` (same arithmetic; per-end fitted pitch follows).
- `roofHeightfield`: owner gains `cornerEligible` — true iff the owning gable has
  `kind === "hip-cap"` or an active fitted hip end owns the column's constraint.
- `generateRoof`: corner-state branch, gated on `own.cornerEligible && stair-conditions`:
  - both-perpendicular-drop (apex/arris seat) → full block (unchanged emission);
  - one perpendicular drops ≥1 → `shape: "outer_left"|"outer_right"` (LEFT map: north→west,
    west→south, south→east, east→north, relative to `facing` = uphill);
  - one perpendicular rises ≥1 while straight conditions hold → `inner_left`/`inner_right`;
  - otherwise today's straight tread, character-identical.
  Non-eligible cells take the existing code path untouched.

### `src/form/roof-ridge-fit.mjs`
- `ridgeVariant`: gables with `kind` set or `sides.length !== 2` pass through unchanged (no
  finding — a cap's apex is already a fitted construction, not an unfitted ridge).

### `src/view/roof-swap.mjs`
- `swapRoof(occ, args)` accepts `hipFit: {cap?: gable|null, hipEnds?: gables|null}`.
  Rungs appended AFTER `voxel-pitch-gable-ends`, in order:
  `hip-end-fitted` (group gables with `hip.fitted`), then `hip-cap` (`[cap]` alone — the cap
  replaces the refused group; carve cols = the cap footprint). Both flow through the existing
  dedup → judgeVariant loop; no ridge-fit flavor is generated for them (the ridgeVariant guard
  makes the flavor collapse into the plain rung automatically).
- `pitchKey`: tuple extended with `g.kind ?? null` and `hip.fitted` per-end pitches so the new
  rungs can never dedup-collapse into a legacy rung (and vice versa).

### `benchmarks/sculpture/roof-program.mjs`
- Hoist `alignedTriangles(meshTris, alignment)` above the component loop (it currently computes
  after, for ridge evidence — reuse one computation).
- Per group: `cap = (no sane gable in group) ? fitHipCap({record, massId, gables: grp.gables,
  occ: occCur, tris: aTris}) : null`; `hipEnds = (any gable hip.demanded) ? fitHipEnds(...)
  : null`; pass `hipFit` to `swapRoof`. Findings concat into the component's swap findings.
- Durable record: new top-level `hipFit` section (`schema: HIP_FIT_SCHEMA`, per-component cap
  evidence + hip-end fits + findings + a sourcing note); markdown renderer gains a short
  "Hip/pyramid fit (T-112-01)" section.
- Frames: when a cap hypothesis was attempted for any component, frame pairs
  `roof-<subj>-cap45` / `roof-<subj>-cap135` (the azimuths whose judge verdicts named the
  tower cap; generic rule — fires for any subject with a cap attempt).
- Terminations/consumed-planes: no code change needed — accepted cap gables carry `sides[]
  .planeId` (non-null for recorded planes) and `footprint.cols`, which the existing
  `consumedPlaneIds` / `excludeCols` derivation already consumes; a null planeId lands in the
  Set harmlessly (no plane has id null). Verified by test.
- `assertAcceptance`: UNCHANGED — a cap's honest line features (4 eave corners + 1 apex cell
  = 5) fit inside the existing per-gable budget of 6; documented, not re-formulated.

### Tests modified
- `src/view/roof-generate.test.mjs` — corner-state exhaustives: a synthetic 5×5 hip-cap gable;
  assert the full emitted state table per corner cell (all four facings × outer/inner), apex
  seat stays full, non-eligible (legacy) gable with identical geometry emits straight-only;
  every emitted (block,state) validates against the injected vocabulary path.
- `src/view/roof-swap.test.mjs` — appended-rung order; dedup never collapses hip rungs into
  legacy rungs; `swapRoof` WITHOUT `hipFit` produces today's attempt list verbatim on the
  existing fixtures (the no-collateral unit proof); a refused-gable group + cap accepts at
  `hip-cap`.
- `src/form/roof-fit.test.mjs` — `hipEndPlanes` equivalence: for every existing hip fixture,
  new `gableSurfaceHeight` === old values (golden assertions); fitted-pitch override changes
  only the fitted end.
- `src/form/roof-ridge-fit.test.mjs` — kind/4-side pass-through guard.

## Ordering (matters)

1. `roof-hip-fit.mjs` + tests — standalone, nothing imports it yet.
2. `roof-fit.mjs` `hipEndPlanes` extraction + `roof-generate.mjs` re-base — the byte-compat
   refactor, proven by the existing suite BEFORE any new behavior lands.
3. Corner-state emission + exhaustive tests (gated; legacy paths untouched).
4. `ridgeVariant` guard + `swapRoof` hipFit rungs + `pitchKey` extension + tests.
5. Runner wiring + record/markdown/frames.
6. Live evidence: `roof:cottage --repro` MATCH, `roof:gatehouse --repro` MATCH (no-collateral),
   `npm run roof:church` (live, double-run determinism + unmapped gate + renders), then
   `roof:church -- --repro` MATCH against the fresh record; commit record + frames.

## Interfaces unchanged (the contract surface)

`gablesFromRecord`, `generateRoof`/`roofFamily` signatures, `judgeVariant` internals, the cage
checks, `componentGableGroups`, the record schema's existing sections, all npm script names.
