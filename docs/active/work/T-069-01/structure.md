# T-069-01 — surgical-refine-to-standard · Structure

The file-level blueprint. Two new files (pure core + impure runner) mirroring the T-068-01 split, plus
generated artifacts. **Zero edits to existing source** (reviseLoop, glbFormTarget, editors, judge are reused
verbatim — the seam invariant). One additive `package.json` script and a `.gitignore` line.

## Created

### `src/form/surgical-standard.mjs` — the PURE core (the only new reviewable logic)

No GL, no I/O, no Date/random → runs under `src/**/*.test.mjs` → `npm test`. Mirrors `building-build.mjs`
(schema const + pure functions + private `render*Md`). Public surface:

```
export const SURGICAL_STANDARD_SCHEMA = "surgical-standard/v1";
export const STANDARD_BAR = "strong";
export const CATEGORIES = ["weak","competent","strong","exceptional"];  // ranked low→high
export const VERDICT_GLOSS = { reached, topped-out, … };

categoryRank(cat) -> int            // -1 for unknown/null (ranks below weak)
meetsStandard(verdict, bar=STANDARD_BAR) -> bool

roundCell(cell) -> normalized {round, overall, proportion, color, detail, fidelity, perSample, wholeIoU}
  // pass-through with guards; missing → null (rendered "—"); PURE

verdictTrajectory(cells) -> [{round, overall, wholeIoU}]            // ordered, the AC#2 judge trajectory
formIoUTrajectory(trace) -> { perRegion:[{region,before,after,delta,accepted}], net }  // AC#2 IoU trajectory

editTraceRows(trace) -> [{region, route, kind:"procedural"|"llm", tweak, before, after, accepted, reason}]
  // kind = relief|material → "procedural", else → "llm"; AC#2 per-region edit trace

checkP14(trace, {eps}) -> { safe, violations:[{type, …}] }
  // type "accepted-overlap": two accepted regions whose subBounds intersect (boxesIntersect, reused from tweak.mjs)
  // type "kept-non-improving": an accepted entry with after <= before+eps (gate violated)
  // type "altered-after-lock": an edit on a region intersecting an already-accepted (earlier) region

toppingOutDetail(trace) -> { region, finalIoU, kept, attempts } | null
  // the rolled-back region with the LOWEST final per-region IoU — the specific detail the loop couldn't fix

assessOutcome({ trajectory, trace, bar }) -> {
  reachedStandard:bool, atRound:int|null, bestVerdict, bestAtRound, toppingOut:{verdict, detail}|null }

assembleSurgicalStandard({ rounds, trace, baseline, locked, generatedFrom, brief }) -> { md, json }
  // json: {schema, subject, brief, bar, trajectory, formIoU, editTrace, p14, outcome, rounds, note}
  // md: trajectory table + edit-trace table + the P14 line + the honest outcome paragraph
```

Reuses (pure imports only): `boxesIntersect`, `subBoundsOf`-style key from existing pure modules — but to
keep the core import-light it inlines a tiny `regionKey`/`boxesIntersect` only if importing `tweak.mjs`
pulls non-pure deps (it does not — `tweak.mjs` is pure), so **import `boxesIntersect` from
`../revise/tweak.mjs`**.

### `src/form/surgical-standard.test.mjs` — the PURE unit suite (AC#4)

Node test runner (the repo idiom). Groups:
- **rank/standard**: `categoryRank` ordering incl. unknown=-1; `meetsStandard` strong/exceptional pass,
  weak/competent/unknown fail; custom bar.
- **trajectory**: `verdictTrajectory` order + null tolerance; `formIoUTrajectory` per-region delta + net;
  baseline-only (no rounds) degeneracy.
- **editTraceRows**: relief/material → procedural, curve/detail/llm-edit → llm; clean/locked rows skipped or
  flagged; reason pass-through.
- **checkP14**: a clean accepted-disjoint trace → safe; two overlapping accepted → `accepted-overlap`; an
  accepted entry with after≤before → `kept-non-improving`; an edit intersecting an earlier lock →
  `altered-after-lock`. (These are the safety invariants the AC requires *recorded*.)
- **toppingOutDetail**: picks the lowest-IoU rolled-back region; null when everything accepted.
- **assessOutcome**: reached-at-round (strong appears mid-trajectory); never-reached → topping-out with the
  right detail + bestVerdict; all-rolled-back → topping-out at baseline.
- **assemble**: `{md,json}` shape, schema tag, the trajectory + edit tables render, the honest outcome
  paragraph present, throw-on-non-array `rounds`, empty-rounds placeholder.

### `benchmarks/sculpture/surgical-standard.mjs` — the IMPURE runner (GL + claude -p; NOT in `npm test`)

Mirrors `glb-formtarget-ab.mjs` (loop + glbFormTarget) ⊕ `building-build.mjs` (asset load + per-round write +
`--offline`). Shape:

```
imports: reviseLoop, liveFormScore (revise/loop)
         observeRegion, selectRegion, subBoundsOf, artifactBounds (revise/region)
         makeFormEditor, regionKey (revise/form-edit)
         glbFormTarget (form/form-target)
         judgeRender (benchmarks/temple-facade/judge.mjs)
         BUILDING_VIEW_3Q (building); assertArtifact (artifact)
         assembleSurgicalStandard, … (form/surgical-standard)

const SUBJECT = { building best artifact + stone-gatehouse.glb + run-015 brief(design-doc.md) }
const REGIONS = [ {where:"top",fraction:.22}, {where:"front",fraction:.30},
                  {where:"left",fraction:.28}, {where:"right",fraction:.28} ]   // --regions overrides

wholeRender(artifact, outPath) -> render @ BUILDING_VIEW_3Q              // GL
judgeWhole(renderPath, brief, samples) -> judgeRender(...)              // claude -p, median
runRound(artifact, regions, target, editor, dir, roundIdx) ->
   reviseLoop(artifact, {regions, observe, diagnose:editor.diagnose, tweakFor:editor.tweakFor,
                         score:liveFormScore({formTarget:target}), budget})
   → whole render → wholeObjectScore + judgeWhole → write round-<i>/summary.json
   → returns {cell, trace, accepted:[regions], artifact:out.artifact}

main():
  --offline → re-derive report from committed round-*/summary.json (no GL/model) via the pure assembler
  live → load assets, baseline render+judge (round 0), then up to --rounds rounds; drop accepted regions
         each round; stop on Strong+ / dry / exhausted; merge traces;
         emit surgical-standard.{json,md}; copy final → building/refined/artifact.json (assertArtifact) +
         pr/assets/frames/building-refined.png
main-guarded (importable exports: SUBJECT, runRound) like glb-formtarget-ab.mjs
```

### Generated / committed artifacts

- `benchmarks/sculpture/surgical-standard.json` + `.md` — the report (committed).
- `benchmarks/sculpture/building/refined/artifact.json` — the refined AJV-valid build (committed deliverable,
  AC#3). If the loop rolls back everything it equals `best/artifact.json` (recorded honestly).
- `benchmarks/sculpture/building/round-*/summary.json` — per-round metrics (committed; lightweight; feeds
  `--offline`).
- `pr/assets/frames/building-refined.png` — the refined render (E-12 nicety).
- `docs/active/work/T-069-01/{research,design,structure,plan,progress,review}.md`.

## Modified (additive only)

- `package.json` — add `"surgical:standard": "node benchmarks/sculpture/surgical-standard.mjs"` script.
- `.gitignore` — ignore the per-round large renders (`building/round-*/render-*.png`) like the per-scale
  renders; the `round-*/summary.json` + `refined/artifact.json` are committed.

## Untouched (zero regression surface)

`src/revise/{loop,region,form-edit,tweak,material-edit}.mjs`, `src/form/form-target.mjs`, `baml_src/judge.baml`,
`benchmarks/temple-facade/{judge,baml-judge}.mjs/.mts`, the schema, every existing runner. This ticket adds a
pure analyzer + a composition runner; it changes **no** loop/target/judge capability — exactly the E-16 seam
invariant (the only new behavior is orchestration + measurement).

## Ordering of changes

1. `src/form/surgical-standard.mjs` (pure core) → `surgical-standard.test.mjs` → `npm test` green.
2. `benchmarks/sculpture/surgical-standard.mjs` (runner) + `package.json`/`.gitignore`.
3. Live run (on demand, metered) → commit the report + refined artifact + render, OR document the live path
   as the standard untested surface with the `--offline` re-derivation if the metered run can't complete here.
