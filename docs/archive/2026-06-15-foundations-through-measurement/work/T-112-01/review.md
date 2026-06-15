# T-112-01 hip-pyramid-cap — Review

## What changed

Six commits on `main` (`dc9d351` → `ac5d997`), ~700 lines net.

**Created**
- `src/form/roof-hip-fit.mjs` — the missing roof-family fit core: `fitHipCap` (pyramidal/hip
  cap as a FOUR-SIDED gable: as-built footprint at the band floor, per-face pitch from recorded
  planes else the GLB sane cone, apex constructed and bounded by the as-built top) and
  `fitHipEnds` (per-end GLB-fitted hip slope riding gables as `hip.fitted`). Named refusals
  throughout (Rule 2); GLB heights evidence-only.
- `src/form/roof-hip-fit.test.mjs` — 18 synthetic-spec tests.

**Modified**
- `src/form/roof-fit.mjs` — `hipEndPlanes`/`hipPlaneHeight` extracted as THE single hip-plane
  definition (was duplicated in roof-generate — the exact surface/generator divergence the
  gatehouse lesson warns about, now structural); `fillBetween` exported.
- `src/view/roof-generate.mjs` — `stairShape` corner vocabulary (outer/inner/promontory) with
  emission GATED to hip-construction owners (`cornerEligible`); outer corners back onto the
  rising diagonal. Legacy gables emit character-identical output.
- `src/view/roof-swap.mjs` — optional `hipFit` arg; `hip-end-fitted` + `hip-cap` rungs appended
  AFTER every existing rung; `pitchKey` extended so new rungs never dedup into legacy ones.
- `src/form/roof-ridge-fit.mjs` — non-2-side/kind gables pass through `ridgeVariant`.
- `benchmarks/sculpture/roof-program.mjs` — per-group hypothesis fitting (cap only when the
  group has NO sane gable; hip ends only when demanded), `hipFit` record section + markdown,
  cap45/cap135 frame pairs, accepted caps feed the termination pass's consumed planes.
- `benchmarks/sculpture/roof/church.{json,md}` + 5 frame PNGs — the live evidence.

## AC-by-AC

1. **Hip/pyramid fit core** ✓ — pure, synthetic-spec tested; apex + per-face slope (4 meeting
   planes); hip end as a slope plane; fit error recorded (`capFit.faces[].glb.rmse`,
   `hip.fitted.*.rmse`); out-of-tolerance → named fallback (`hip-cap-unfitted`,
   `hip-cap-candidate-refused`, `hip-end-unfitted`).
2. **Generator with corner states** ✓ — exhaustive (downhill × perpendicular²) unit table;
   pyramid integration test; live blockStateId proof: generated pyramid 0/84 unmapped, full
   5-shapes × 4-facings matrix 0/20 unmapped (the church artifact itself carries no corner
   stairs — see Outcome — so the live proof was run directly; logged in progress.md).
3. **Wired into the swap ladder, no collateral** ✓ — rungs appended at the tail; unit pin that
   a no-`hipFit` swap is byte-identical; **`roof:cottage --repro` and `roof:gatehouse --repro`
   MATCH** their committed shas (`47739999…`, `6ed2580c…`) — verified before any change, after
   every step, and at the end.
4. **Run on the church tower** ✓ via the alternate branch the AC names: the T-110 fallback
   ("insane gable") is now a **named refusal with decisive fit evidence** — the GLB tower-top
   window contains NO roof-like slope (per-face: 0 sane of 480/421/528 triangles; pitch
   distribution bimodal at ~0 and ≫4). **The church tower is a crenellated flat-top, not a
   pyramid** — there is no cap to fit, and inventing one would violate Rule 2. The one eave
   candidate that fit pure-side (band 11) was correctly killed by the cage (IoU regressed at 3
   azimuths, closure 11 → 203) and is recorded as the `mass-1:hip-cap` attempt with cage
   outcomes. Before/after renders + frames at 45°/135° (the judge's tower-cap azimuths).
   Artifact byte-identical (`b107b729…`); `roof:church --repro` MATCH, `--offline` OK.
5. **No subject constants; npm test green** ✓ — `HIP_FIT_DEFAULTS` = {minTriangles 1,
   apexSlack 1.0}; pitch-cone bounds derived (`minPitch = 1/run`) or shared (`maxPitch`);
   **1476/1476**.

## Test coverage

- New: 18 (fit core) + 6 (generator corners) + 3 (ladder) + 1 (ridge guard) + 3 (hip-plane
  equivalence) unit tests; all pure, under the standard glob.
- Live: determinism double-run, unmapped gate, three `--repro` byte checks, `--offline`.
- Gaps: (a) no committed artifact exercises corner stairs end-to-end through a full chain —
  the live proof was a direct world-build; the first real pyramid subject (E-29's fourth
  subject, T-116) will close this naturally. (b) `fitHipEnds` never produced an accepted
  hip-end-fitted rung on a committed subject (nave hi-end: 0 sane tris — honest refusal);
  the rung is unit-proven only.

## Open concerns for a human reviewer

1. **The headline finding**: the church tower judge gap ("tower roof/cap") cannot be fixed by
   ANY roof construction — the GLB top is flat/crenellated and the styled chain's tower noise
   comes from the blob, not a missing cap shape. A parapet/crenellation construction is a
   plausible future vocabulary member (not in this ticket's scope; relevant to T-116
   fourth-subject selection — pick a subject with a REAL pyramid roof to exercise the accept
   path live).
2. **Eave-ladder breadth**: the cap fit walks ALL recorded eave candidates downward; a
   wrong-band candidate can fit pure-side and reach the cage (as eave-11 did). The cage held,
   and per T-104 doctrine the cage is the arbiter — but each wrong-band rung costs one judged
   carve/compose pass per component. Acceptable today (≤2 candidates seen); revisit if
   candidate sets grow.
3. **Outer-corner orientation** (left/right) follows Minecraft's facing-relative convention as
   derived by hand; visually confirmed in the unit pyramid's quadrant symmetry but not yet
   eyeballed in a real render (no committed pyramid yet — same closure as gap (a)).
4. **Promontory cells** (both perpendiculars drop) stay full blocks and COUNT against the
   spike budget; a 1-cell-wide cap could in principle exceed the 6-per-gable budget — the
   unit test pins ≤6 for the square pyramid, and `assertAcceptance` was deliberately left
   unchanged (a formula change without a live subject would be speculative).
5. **Sibling-session hygiene**: `styled-milestone.mjs`, `styled/church.*`,
   `multi-angle/church-styled.*` changed concurrently in the worktree during this ticket and
   were left unstaged — they belong to another thread; nothing in T-112-01 depends on them.

## Doctrine compliance

Rule 2 (fit, never invent) — every refusal named with evidence; the flat-top truth recorded
rather than a forced fit. E-25 Rule 3 — no tuning; both new cone bounds derived or shared.
T-104 mechanism — hypotheses as rungs, the cage arbitrated (and demonstrably caught the
wrong-band cap). Reproducibility — double-run byte equality + three `--repro` MATCHes.
