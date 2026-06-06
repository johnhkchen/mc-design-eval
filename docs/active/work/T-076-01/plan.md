# T-076-01 Plan — resemblance-gate

Ordered, independently-verifiable steps. Testing strategy per step. Commit boundaries from `structure.md`.

## Testing strategy (overview)
- **Pure core** (`src/form/resemblance.mjs`) → deterministic unit tests in `src/form/resemblance.test.mjs`,
  run by root `npm test`. Synthetic decoded RGBA images + a synthetic block table — **no GL, no model, no
  files, no network, no `Date`/random**. This is the durable regression surface (AC #2, AC #3 parse logic).
- **Runner** (`benchmarks/sculpture/resemblance.mjs`) → NOT unit-tested (pulls GL + the metered model, per
  the `building-build.mjs` convention). Verified by `--offline` (GL-free, model-free) and the committed live
  outputs (AC #4, AC #6, Rule 6).
- **Verification gate each step:** `npm test` stays green; `--offline` produces the triptych + perceptual row.

---

## Step 1 — Pure form + material scorer
**Do.** In `resemblance.mjs`: constants/defaults; `formScores` (wrap `extractSilhouette`/`normalizeSilhouette`/
`iou` + the injected mesh mask → `meshIoU`, `conceptIoU`); `buildPalette` (artifact placements → top-K block
IDs → Lab via injected table); `cellDominantLab`; `setAgreement` (symmetric coverage via `nearestLab`);
`zoneAgreement` (Z×Z grid over fg bbox, snap both sides, fraction within `deltaEZone` + mean ΔE + zone maps).
**Test.**
- `formScores`: identical render==mesh masks → IoU 1; disjoint → low; both-empty → 1.
- `buildPalette`: count + Lab join correct; top-K ordering; unknown block ID skipped gracefully.
- `setAgreement`: same palette → 1; fully disjoint colors → 0; symmetric (swap args → same score).
- `zoneAgreement`: identical images → score 1, meanΔE 0; uniformly shifted color → degrades; zero common
  fg cells → score `null` (not NaN).
**Verify.** `npm test` green; new cases pass.

## Step 2 — Verdict parser + fixed judge prompt
**Do.** `VERDICTS`, `GAP_ATTRS`; `buildResemblancePrompt()` (fixed string, panel order + JSON contract);
`parseResemblanceVerdict(text)` = `stripToJson` → JSON.parse → validate enum + gap integrity (gap required &
well-formed iff verdict≠"same object"; null allowed iff "same object").
**Test.**
- valid "same object" + null gap → ok; valid "drifted" + `{region,attribute}` → ok.
- fenced ```json wrapper stripped; prose around object sliced.
- bad verdict enum → throw; "drifted" + null gap → throw; "same object" + non-null gap → throw; gap with
  bad `attribute` → throw; non-JSON → throw with a clear message.
- `buildResemblancePrompt()` is stable (snapshot a substring + the three verdict words + four attrs present).
**Verify.** `npm test` green.

## Step 3 — Triptych compose math (pure)
**Do.** `resampleRgba(img,W,H,fit)` (inverse-map box filter + letterbox, mirroring `resampleInto`);
`silhouetteToRgba(sil,{fg,bg})` (mask → grey-on-white panel); `composeTriptych([p0,p1,p2],opts)`
(equal panels + gutters → one RGBA buffer, fixed left→right order).
**Test.**
- `resampleRgba`: identity (W,H==in) → unchanged; 2×→1× box mean of a known 2×2; letterbox pads with bg,
  aspect preserved.
- `silhouetteToRgba`: fg cell → fg color, bg cell → bg color, dims match.
- `composeTriptych`: output `w == 3*panel + 2*gutter`, `h == panel`; panel 0 pixels land at x-offset 0,
  panel 2 at `2*(panel+gutter)`; gutter columns are the separator color.
**Verify.** `npm test` green. **Commit boundary 1** — pure core complete, CI-safe.

## Step 4 — `resemblanceRow` orchestrator (pure)
**Do.** `resemblanceRow({renderImg,conceptImg,meshSil,artifact,blockTable,subject},opts)` → assemble the
schema-tagged row (form + material + immutable references + Rule-2 note). Round all floats.
**Test.** End-to-end on synthetic inputs: shape matches the documented JSON; `schema` stamped; references
echoed; deterministic (same inputs → byte-identical JSON).
**Verify.** `npm test` green.

## Step 5 — Impure runner + `--offline`
**Do.** `benchmarks/sculpture/resemblance.mjs`: `runResemblanceGate(...)` per `structure.md` flow;
`main()` wires gatehouse paths; `--offline` (committed render, placeholder verdict); GLB-absent guard;
node-canvas labels; `encodeRgbaToPng`; write the four outputs. Add the `resemblance` npm script.
**Test.** No unit test (GL/model). `node benchmarks/sculpture/resemblance.mjs --offline` must:
- run with **no GL and no model call**, produce `gatehouse-triptych.png` (valid PNG, 3 panels) +
  `gatehouse-perceptual.json` (valid row) + a placeholder verdict + the md.
**Verify.** `--offline` artifacts present and well-formed; `npm test` still green. **Commit boundary 2.**

## Step 6 — Live run on the gatehouse (Rule 6 reproduce)
**Do.** `node benchmarks/sculpture/resemblance.mjs` live (fixed-lens re-render + metered judge) if GL +
subscription are available in this env. Inspect the triptych; record the verdict + **named** gap (Rule 7).
If live is unavailable, fall back to the committed `--offline` triptych + perceptual row and state the judge
was not run (honest, per Rule 6 — no fabricated verdict).
**Test.** Manual inspection of the triptych; verdict JSON validates against the parser.
**Verify.** Four output artifacts committed. **Commit boundary 3.**

## Step 7 — Review
`review.md`: files changed, AC table, test coverage + gaps, open concerns (camera-mismatch caveat, zoning =
render-pixel proxy, single metered sample, GLB gitignored). Honesty ledger.

---

## Risks & mitigations
- **GLB gitignored** → live run may be impossible in CI; `--offline` path + committed PNG cover reproduction.
- **node-canvas resolvable from `benchmarks/`?** T-075-01 hit "canvas not resolvable from `docs/`"; it *is*
  resolvable from the render package. Mitigation: import `encodeRgbaToPng` from `render/src/headless-canvas.mjs`
  (same cross-package path `building-build.mjs` uses), not a bare `canvas` import.
- **Concept camera mismatch** depresses `conceptIoU`/zone ΔE → documented as diagnostic (Rule 2), the
  categorical judge + human triptych are the verdict.
- **Judge JSON drift** → parser throws precisely; runner writes `verdict:"unparsed"` instead of crashing.

## Definition of done
All six ACs: triptych assembler ✓, pure GL-free unit-tested scorer ✓, categorical metered judge with named
gap ✓, gatehouse run with triptych+row+verdict+gap ✓, reusable `runResemblanceGate` with immutable refs +
fixed thresholds ✓, `npm test` green ✓.
