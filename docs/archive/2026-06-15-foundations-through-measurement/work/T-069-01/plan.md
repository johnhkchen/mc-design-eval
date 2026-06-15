# T-069-01 — surgical-refine-to-standard · Plan

Ordered, independently-verifiable steps. Each commits atomically. The pure core lands first (it carries all
`npm test` value); the impure runner composes proven seams; the live run is the on-demand metered surface.

## Step 1 — Pure core `src/form/surgical-standard.mjs`

Implement the public surface from structure.md: `categoryRank`, `meetsStandard`, `roundCell`,
`verdictTrajectory`, `formIoUTrajectory`, `editTraceRows`, `checkP14`, `toppingOutDetail`, `assessOutcome`,
`assembleSurgicalStandard`. Import only `boxesIntersect` from `../revise/tweak.mjs` (pure). No GL/I/O/Date/
random. Null-tolerant throughout (building-build idiom): guards return `null`, never throw except
`assembleSurgicalStandard` on a non-array `rounds`.

**Verify:** `node --check`; the file imports clean; no disallowed imports (grep for fs/gl/render).

## Step 2 — Pure tests `src/form/surgical-standard.test.mjs` + `npm test`

Cover every exported function per the structure.md group list. Key assertions:
- `meetsStandard("strong")===true`, `("competent")===false`, `("exceptional")===true`, `("unknown")===false`.
- `checkP14` flags `accepted-overlap`, `kept-non-improving`, `altered-after-lock`; passes a clean trace.
- `assessOutcome`: (a) strong mid-trajectory → `reached@atRound`; (b) tops at competent → `toppingOut` with
  the lowest-IoU rolled-back region as `unfixedDetail` + `bestVerdict:"competent"`; (c) all-rolled-back →
  topping-out at baseline.
- `assembleSurgicalStandard` returns `{md,json}` with the schema tag, both tables, the P14 line, the honest
  outcome paragraph; throws on non-array `rounds`; empty `rounds` → placeholder, no throw.

**Verify:** `npm test` green (expect the suite count to rise by the new cases over the 767 baseline). This is
**AC#4**.

**Commit:** `feat(E-20 T-069-01): pure surgical-standard analyzer (verdict/IoU trajectory, P14 check, outcome) + tests`

## Step 3 — Impure runner `benchmarks/sculpture/surgical-standard.mjs`

Compose the proven seams (no new loop/target/judge behavior):
- Load `building/best/artifact.json` + `glb/stone-gatehouse.glb` + the run-015 `design-doc.md` brief.
- `target = glbFormTarget({ glbPath, buildBounds: artifactBounds(best) })`.
- `editor = makeFormEditor({ critic: () => [{defect, where, route:"detail"}] })` (force the LLM line route;
  procedural relief stays available if the critic tags it).
- Round loop (`--rounds`, default 2): per round `reviseLoop` over remaining regions with
  `score: liveFormScore({ formTarget: target })`, `observe: observeRegion`, bounded budget; whole render →
  `wholeObjectScore` + `judgeRender(samples=3)`; write `round-<i>/summary.json`; drop accepted regions; stop
  on Strong+ / dry / exhausted.
- Baseline (round 0): whole render + judge the unedited `best` build (the trajectory's first point).
- Merge traces; `assembleSurgicalStandard(...)`; write `surgical-standard.{json,md}`; copy the final artifact
  → `building/refined/artifact.json` (`assertArtifact` first) + render → `pr/assets/frames/building-refined.png`.
- `--offline`: re-derive the report from committed `round-*/summary.json` (no GL/model) — the building-build
  verification idiom.
- Main-guarded; export `SUBJECT`, `runRound`.

**Verify:** `node --check`; `node benchmarks/sculpture/surgical-standard.mjs --offline` runs (placeholder/empty
ok before a live run); the runner imports the pure core (no logic duplicated).

**Commit:** `feat(E-20 T-069-01): surgical-refine-to-standard runner (reviseLoop + glbFormTarget + judge, bounded rounds)`

## Step 4 — `package.json` + `.gitignore` (additive)

Add `"surgical:standard"` script; gitignore `building/round-*/render-*.png`. Commit with Step 3 or separately.

## Step 5 — Live run (on demand, metered) OR documented deferral

Attempt the live run (`npm run surgical:standard`) — needs the GLB (on disk), headless GL, and claude -p
(subscription, metered). If it completes:
- Commit `surgical-standard.{json,md}`, `building/refined/artifact.json`, `round-*/summary.json`,
  `pr/assets/frames/building-refined.png`.
- The report states the **honest outcome**: Strong+ reached (with round count) OR the topping-out point
  (best verdict + the specific unfixed detail) — **AC#3**.

If the metered/GL run cannot complete in this environment (precedent: glb-formtarget-ab / building-build live
paths are run on demand, not in CI), commit the runner + the `--offline` re-derivation and the placeholder
report, and **document in review.md** that the live trajectory is pending the metered run, with the exact
command. The pure core + tests (AC#4) and the deliverable wiring (AC#1/#3 plumbing) are complete regardless;
the live numbers are the standard untested GL+model surface.

## Testing strategy

- **Unit (`npm test`, CI-safe):** the entire pure core (Step 2). Deterministic, no GL/model.
- **Live (manual, GL + claude -p):** the loop/render/judge branch — exercised by `npm run surgical:standard`;
  re-checkable via `--offline` (re-derives the report from committed summaries, no GL/model).
- **Coverage gaps (by design):** the runner's render/judge/loop-with-live-model branch is not unit-tested (the
  suite must never pull GL or a metered subprocess) — the project's standard untested surface, matching
  `glb-formtarget-ab.mjs` and `building-build.mjs`.

## AC traceability

- **AC#1** reviseLoop on the building with `glbFormTarget({glbPath})`, region-by-region, bounded rounds toward
  Strong+ → Step 3 (the runner; loop + target reused verbatim).
- **AC#2** per-round judge trajectory + per-region edit trace (procedural vs LLM, kept/rolled-back) + form-IoU
  trajectory; P14-safety holds → Step 1 pure outputs (`verdictTrajectory`, `editTraceRows`,
  `formIoUTrajectory`, `checkP14`) recorded by Step 3.
- **AC#3** outcome stated honestly (Strong+ @round OR topping-out{best, unfixed detail}) → `assessOutcome`
  (Step 1) emitted by the runner (Step 5).
- **AC#4** final refined `DesignArtifact` + render saved; `npm test` green → Step 3 (`building/refined/` +
  frame) + Step 2 (`npm test`).

## Risks & mitigations

- **Thin-reveal weak IoU** (side windows) — likely a topping-out zone, not a bug; recorded as the honest
  result (research flagged per-region single-view IoU diverges for thin features).
- **Judge temple/head-on framing vs a gatehouse 3/4** — residual; record it; the enum + dims transfer.
- **Cost** — bounded regions (4) × bounded rounds (2) × judge samples (3) + per-region LLM edits; stop-early
  on Strong+/dry keeps it tight.
- **Loop rolls back everything** — a valid cage-held outcome; the report says "topped out at baseline," and
  `refined/artifact.json` equals `best/` (documented).
