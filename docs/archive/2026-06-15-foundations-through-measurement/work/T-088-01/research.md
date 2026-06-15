# T-088-01 coverage-aware-gate — Research

Descriptive map of everything the coverage-aware gate touches. No solutions proposed here.

## The failure this ticket addresses

The E-22 per-face gate (`acceptIfCloser`, `src/view/face-resemblance.mjs:50`) accepts a paint pass on a
strict resemblance improvement (`after > before + epsilon`). On the E-23 cottage it accepted a marginal
`0.25→0.40` while the upper-storey wall was ~91% un-plastered: the score measured "did this paint move
the face toward the concept" but never "is the zone's intended dominant material actually applied". The
T-085-01 review (handoff §3) names the residue explicitly: *"Coverage is reported, not gated… the
threshold gate ('fail under X%') is T-088-01's, and `surfaceZoneHistogram` is the seam built for it."*

## The components, as they exist today

### 1. The census seam — `src/view/zone-fill.mjs` (T-085-01, pure, unit-tested)

- `surfaceZoneHistogram(occ, zoneOf, {faces})` (line 132) — per-zone material census of the visible
  skin: `{[zone]: {total, byBlock:{bareId:count}}}`. Surface = union of the five exposed-face
  projections (`FILL_FACES` = 4 elevations + roof top, via `projectSurface`), deduped by voxel. Its
  docstring says verbatim: "the seam the S-088 coverage gate consumes."
- `zoneFill(occ, {zoneOf, zones, faces, minRun})` (line 94) — the deterministic base coat. Not directly
  relevant to the gate, but it is what makes a passing coverage number achievable.
- Both are PURE (no GL, no I/O, no Date/random) and covered by `zone-fill.test.mjs` (9 tests,
  hand-counted synthetic two-storey hut).

### 2. The gate — `src/view/face-resemblance.mjs` (E-22 / T-079-01, pure)

- `faceResemblance(buildFaceImg, conceptFaceImg, blockTable, opts)` — headline `score` is the E-22
  `zoneAgreement`; optional `setAgreement` diagnostic. Pure scorer over decoded RGBA.
- `acceptIfCloser({before, after, epsilon})` → `{accepted, before, after, delta, epsilon}` — the
  P14-safe hill-climb accept, mirroring `revise/loop.mjs`. **This is the gate that rubber-stamped the
  un-skinned surface** — it has no notion of coverage.
- Test file `face-resemblance.test.mjs`: `node:test` + `assert/strict`, solid-color RGBA helpers,
  block table injected via `loadBlockTable()`.

### 3. The runner — `benchmarks/sculpture/spray-paint.mjs` (impure wiring, GL, on-demand)

The seam invariant (file header): all decisions are pure `src/view/*` cores; the runner does GL renders,
GLB decode, and the durable record. Pipeline order:

- §0 seal → §0b `structuralZones(occ)` → `zoneOf` (base/upper/roof, `src/view/structural-read.mjs:257`)
- §0c zone-fill base coat (`zoneFill`) → `based`/`occBased`
- §1–2 splat targets + `paintFace` (secondaries only; per-zone splat palettes exclude all field materials)
- §2b **the two replays this ticket needs for proof-both-ways** — both built from the pre-fill sealed
  artifact and already in the file:
  - `splatOnlyBuild` (line 341): the legacy T-079-02 path (splat with dominants allowed, no fill) — the
    under-applied skin. Recorded coverage: **upper `white_terracotta` dominantFraction 0.13**.
  - the final `painted` build (§5): fill + demoted splat. Recorded coverage: **upper 0.712** (base
    0.619, roof 0.89). (The ticket's "≈77%" is the fill-stage number; the recorded final skin is 71.2%
    — T-085-01 review AC#3 documents the honest delta.)
- §4 per-face accept: `tryRenderFace` (GL, best-effort) → `acceptIfCloser` on front (+z) vs concept;
  `frontGate.before == null` (GL blind) → accept by construction. **This is the wiring point "ahead of
  the hill-climb count".**
- §5b structural guard: `surfacePlasterByZone` + a hard **throw** if plaster appears on base/roof
  surface — precedent for "a marginal resemblance number cannot rubber-stamp a zone-wrong skin".
- Runner-local helpers `coverageRecord(hist)` / `coverageLine(cov)` (lines 147–164): decorate the
  histogram with each zone's intended dominant + ‰-rounded `dominantFraction`. **Pure logic living in
  the impure file, un-unit-tested** — T-085-01 review flags this gap explicitly.
- `--offline` mode (line 238): replays assertions from the committed record `spray-paint/cottage.json`
  without GL; currently asserts only `zoneFilled.upper > splatOnly.upper` and notes "the threshold gate
  itself is S-088".

### 4. The intent source — E-21 material map + `ZONE_POLICY`

- `benchmarks/sculpture/material-map/cottage.json` (`material-map/v1`): role→block entries (ground-floor
  wall field = `stone_bricks`, half-timbering = `dark_oak_log`, plaster infill = `white_terracotta`, …).
- The runner's `ZONE_POLICY` (line 71) hand-derives per-zone `{dominant, preserve, splat}` from those
  roles, intersected with the build manifest at runtime. The "intended dominant" per zone therefore
  reaches the runner as **data** (`base: stone_bricks, upper: white_terracotta, roof: spruce_planks`);
  pure cores receive it as a `zones` map argument (the `zoneFill` precedent).

### 5. The committed evidence — `benchmarks/sculpture/spray-paint/cottage.json`

`zones.coverage = {splatOnly, zoneFilled}` with per-zone `{total, byBlock, dominant, dominantFraction}`:

| zone  | splat-only | zone-filled |
|-------|-----------:|------------:|
| base  | 0.562      | 0.619       |
| upper | **0.130**  | **0.712**   |
| roof  | 0.642      | 0.890       |

Any threshold T with `0.13 < T ≤ 0.619` separates the two skins when the rule is "ANY zone below T
fails". Faces records carry `gate {before, after, delta, accepted}` and `gateBlind`.

## Test & build conventions

- `npm test` = artifact self-test + `node --test "src/**/*.test.mjs"` (991 tests green as of T-085-01).
  Benchmarks/ runners are NOT in `npm test`; their deterministic `--offline` replays are the cheap check.
- Pure-core rules observed across `src/view/*`: no FS/GL/Date/random; injected tables; bare block ids
  normalized via `bareBlock` (`occupancy.mjs`); placements namespaced on emit.
- Commit style: `feat(E-24 T-088-01): …` / `docs(E-24 T-088-01): …`, incremental.

## Constraints & assumptions surfaced

1. **Zones span faces.** Coverage is a property of the SKIN (all five projections), not of one face;
   the per-face gate decision must consume a skin-level precondition. The runner's front-face gate is
   currently the only resemblance-gated face (side is GLB-truth, gated by construction).
2. **Denominator question.** "Wall-field surface" in the AC vs. the recorded `dominantFraction`, whose
   denominator is the FULL zone skin census (legit secondaries — 184 timber-stud cells = 29% of upper —
   included). The recorded 0.13/0.712 numbers use the full denominator. `wallFields()` in
   `structural-read.mjs:196` exists but feeds hollowing, not the coverage record.
3. **GL is optional; coverage is not.** The histogram/coverage path is GL-free, so the precondition can
   gate even when the resemblance score is blind (`frontGate.before == null`).
4. **Concurrent ticket**: T-086-01 (value-true selection) may retarget upper's dominant
   (`white_terracotta` → a cream block) via `ZONE_POLICY`/the map. The gate must treat the dominant as
   data, never hard-code plaster.
5. **Tautology risk** (memory: [[ablation-value-de-tautology]] pattern): post-fill, filled cells equal
   the dominant by construction — but the gate's job is detecting "the fill never ran / was bypassed",
   which the full-skin fraction still catches (splat-only upper = 0.13).
6. **Records regenerate by run only** (E-24 Rule 1, no hand edits): the proof-both-ways record must be
   produced by `node benchmarks/sculpture/spray-paint.mjs` (GL available on this machine per the last
   run) and re-checked by `--offline`.
