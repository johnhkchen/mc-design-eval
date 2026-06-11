# T-108-01 gable-and-verge-fit — Review (handoff)

## What changed

Five commits on `main` (chain: `ca9e42b` → `d77b5f4` → `b27ba7e` → `613a119` → `2e69c21`):

| File | Change |
|---|---|
| `src/form/roof-end-fit.mjs` | **new** pure core: per-gable-end GLB fit — as-built wall anchor (median outermost column in the storey below the band) + GLB differentials (wall plane / dominant-area gable-face cluster / verge-tip extreme) inside an anchor-bounded selection window; geometric sanity (wall ≤ face ≤ tip ≤ blob end, no tuned constants); fit error = area-weighted face-cluster RMSE; hip/buried/anchorless ends refused with named findings |
| `src/form/roof-end-fit.test.mjs` | **new** 9 tests, synthetic meshes + gables (clean fit, deep verge, insane bound, missing wall/face, hip vs suppressed, immutability) |
| `src/view/roof-generate.mjs` | `roofHeightfield` trims columns past `ends.*.coord`, flags `owner.sheet` past `ends.*.faceCoord`; `generateRoof` places sheet columns as the surface course only (open underside) and returns `sheetKeys`; no-ends output regression-pinned byte-identical |
| `src/view/roof-swap.mjs` | end-fitted rungs lead the T-104 ladder (×{glb,voxel pitch}×{hips-as-detected,suppressed}), legacy four verbatim as tail, dedup key includes ends; carve/census columns = surviving pool's UNTRIMMED footprints (blob past a fitted tip is removed and measured); `roofBandCensus` gains a counted-never-hidden `exclude` for sheet keys; `generated.fittedEnds`/`endCoords` recorded |
| `src/view/roof-{generate,swap}.test.mjs` | +9 tests (trim/sheet/composition, residue carving, ladder order, dedup collapse, named rejection fallback, census exclusion) |
| `benchmarks/sculpture/roof-program.mjs` | end fit wired per component group (plain + suppressed variants), `aabbAlignment` + `parseGlbMesh`, budget `6·gables + 2·fittedEnds`, 45° joins evidence angles, `end45`/`end315` frame pairs, record gains `endFit` + `params.endFit` (additive to `roof-program/v1`) |
| `benchmarks/sculpture/roof/{cottage,gatehouse}.{json,md}`, `roof/cottage/artifact.json`, `pr/assets/frames/roof-*-end*.png` | regenerated live evidence |

## Acceptance criteria — status

- **Fitted gable-end construction (pure, unit-tested)**: done. Triangle = the wedge's end face on
  the fitted face plane (fit error recorded per end); verge/rake = sheet courses in the E-27
  stair/slab/full vocabulary (unmapped 0 live-proven); eave terminations = courses end at the
  fitted tip with an open-underside overhang face.
- **Cage-wrapped**: done — same T-102 checks, end-fitted rungs cage-arbitrated, auto-rollback
  observed live (cottage `end-fitted` glb-pitch rung rejected on IoU, voxel rung accepted;
  gatehouse 3 rungs rejected before the accept). Out-of-tolerance/unfittable ends keep current
  geometry with named findings (`end-fit-insane`, `end-unfitted`, `end-hip`) — never invented.
- **Run on cottage + gatehouse**: done behind `npm run roof:{cottage,gatehouse}`; before/after at
  45°/315° committed as frames; fit errors + cage outcomes in the records; `--repro` MATCHES and
  `--offline` OK for both.
- **No re-judging**: honored — no judge invocations; reconstructed verdicts untouched (T-111 owns).
- **No subject constants / no hand-edits / npm test green**: declared defaults only
  (`END_FIT_DEFAULTS`: cone 25°, minTriangles 1, anchorSlack 1.5 — quantization-derived);
  1389/1389 green.

## Live outcomes (the headline)

- **Cottage**: 3/4 ends fitted (main gable lo/hi, cross gable hi; cross-lo honestly refused as a
  buried interior end). The 3–4-cell solid overruns past both main gable walls are now
  open-underside verge sheets standing on fitted face planes. Protrusions 16 → 0 (43 sheet cells
  censused separately); IoU at the failing 45° azimuth improved (.9273 → .9307), all others held.
- **Gatehouse**: the +x end fitted with zero delta (face=tip=13, rmse 0.001) — the end was already
  correct as-built, so the artifact is byte-identical; −x end refused (GLB roof end inside the
  gable face). The ticket's "where its component record names gable ends" clause is satisfied;
  gatehouse's failing views name ridge/upper-edge gaps, which are S-109's scope by design.

## Test coverage

End-fit math, generator trim/sheet, swap ladder/carve/census all unit-tested on synthetics; live
determinism double-run + fresh-process `--repro` both green. **Gaps**: (1) no unit test pins the
runner's per-group endFit split (runner is impure by convention — covered only live); (2) the
surface-cell tip bound (`min` with `round(roofEnd − 0.5)`) is exercised live (cottage −z) but not
by a dedicated synthetic; (3) `composeComponentSwaps` aggregation of `fittedEnds` over accepted
components only — live-covered, no unit.

## Open concerns for the reviewer

1. **The sheet census exclusion is the sensitive edit** (same family as the kit-blind-gate class,
   but geometry-side, not the frozen gate): `roofBandCensus` now excludes generator-declared sheet
   keys. It is key-scoped, counted in the record (`census.after.excluded`), and inert for every
   caller that doesn't pass `exclude` — but it weakens "after ≈ 0" as an independent signal for
   sheet-heavy roofs. The honest alternative (slab-built sheets, censused as fixtures) changes the
   visible surface line by a half-cell; I chose geometry fidelity + declared exclusion.
2. **Face RMSE ≈ 1.0–1.5 on cottage ends** — the TRELLIS end faces are not flat; the fit records
   the error but there is no declared RMSE ceiling on the face fit itself (the cage + the
   geometric bounds are the acceptance). If a ceiling is wanted, it belongs in `END_FIT_DEFAULTS`
   with a refusal path — one more named rung, cheap to add.
3. **Cottage 45° "form @ roof across the whole top" is only partially addressed**: the west wing
   (`roof-1/5/6/7`, 197 plane-cells) remains regularized blob by design (`roof-region-unfitted`).
   S-109's silhouette-residual pass owns it; the 45° re-judge (T-111) may still find it.
4. **Downstream pins are now stale by intent**: `roof/cottage/artifact.json` changed
   (sha `149de232c80c`), so reskin/reconstructed pins drift loudly until T-111 re-runs the chain.
   Gatehouse artifact is byte-identical — no drift there.
5. **Sibling concurrency note**: T-110-01 landed a per-component swap loop in `roof-program.mjs`
   mid-ticket; integrated (end fit split per component group, aggregation over accepted
   components). The two tickets shared this file without a DAG edge — worth a dependency edge in
   future planning (see memory note `parallel-roots-duplicate-shared-deps`).
6. **anchorSlack 1.5** is declared as quantization-derived (one cell + half-cell face offset), not
   measured. It survived both subjects; if a future subject's blob spread exceeds one cell at an
   end, the window could exclude the true wall cluster and refuse the end (safe direction).

## Suggested follow-ups (not blocking)

- S-109 should reuse `alignedTriangles` + the anchor-window pattern for ridge-line fitting.
- A synthetic for the surface-cell tip bound and a unit on `composeComponentSwaps` aggregation.
