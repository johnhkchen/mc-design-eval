# T-047-01 — structure: files, interfaces, ordering

The blueprint. Five edits: one new module + its test (the interface), one loop refactor (wire it), one
demo extension (consult it + verdict), two docs (learnings + handoff) + pr/asset frames.

## Files

### CREATE `src/form/form-target.mjs` (~120 lines)

The form-target interface + the concept implementation + the GLB adapter point.

```
export const FORM_TARGET_SCHEMA = "form-target/v1"

// Error thrown by the GLB adapter point (seam only this phase).
export class FormTargetNotImplementedError extends Error {}

/**
 * A FormTarget answers the accept step's one question:
 *   scoreRender(renderPath, R, opts?) => Promise<number>   // [0,1] form-fidelity vs the target, framed on R
 *   kind: string                                           // provenance ("concept" | "glb" | …)
 * The loop consults ONLY scoreRender; swapping the target needs NO change to observe/diagnose/accept.
 */

// TODAY: concept image + silhouette IoU (the heuristic target).
export function conceptFormTarget({ conceptPath, grid, fit, region, _fidelity = formFidelityFromPair } = {})
  → { kind: "concept", conceptPath, scoreRender(renderPath, R) }
  // scoreRender: r = await _fidelity(renderPath, conceptPath, {grid, fit, region}); return region ? r.regionIoU : r.iou

// LATER (seam only — NO GLB/TRELLIS code): the documented adapter point.
export function glbFormTarget(opts = {})  // throws FormTargetNotImplementedError with the doc note

// The one place the default target is chosen.
export function resolveFormTarget(cfg = {})
  // cfg.formTarget present     → return it (duck-typed pass-through)
  // else cfg.conceptPath       → return conceptFormTarget(cfg)
  // else                       → throw (clear message: pass formTarget or conceptPath)
```

- Imports `formFidelityFromPair` from `./form-fidelity.mjs` (pure, no GL). `_fidelity` keeps tests pure.
- A long block comment on `glbFormTarget` documents the GLB contract: render the GLB mesh from
  `SCULPTURE_VIEW_3Q`, extract its silhouette, `iou()` against the build's R-framed silhouette — the
  observe/diagnose/accept seams never change; only the target silhouette source does. This comment IS the
  AC #1 "documented GLB adapter point."

### CREATE `src/form/form-target.test.mjs` (~120 lines, PURE — runs in `npm test`)

Groups:
- **A. concept target** — `conceptFormTarget({conceptPath, _fidelity})` with a fake `_fidelity` returning
  `{iou: 0.5, regionIoU: 0.7}`: `kind==="concept"`; `scoreRender` returns `0.5` (whole) and, with
  `region`, `0.7`; passes `{grid, fit, region}` through to `_fidelity` (assert call args).
- **B. GLB adapter point** — `glbFormTarget()` throws `FormTargetNotImplementedError`; message mentions
  GLB/TRELLIS/deferred AND that observe/diagnose/accept are unchanged.
- **C. resolveFormTarget** — returns an injected `formTarget` unchanged (identity); builds a concept target
  from `conceptPath`; throws when neither is present.
- **D. swap-invariance** — a custom duck-typed target `{kind:"fake", scoreRender: async () => 0.9}` flows
  through `resolveFormTarget` and returns `0.9` from `scoreRender` — proving a non-concept target needs no
  other change.
- **E. schema tag** — `FORM_TARGET_SCHEMA === "form-target/v1"`.

### MODIFY `src/revise/loop.mjs` — `liveFormScore` only (~8 lines changed)

- Inside the returned closure, lazy-import `resolveFormTarget` from `../form/form-target.mjs` (keeps
  loop.mjs top-level GL-free; matches the existing lazy-import pattern).
- Replace the hardcoded `formFidelityFromPair(outPath, cfg.conceptPath, opts)` + `cfg.region ? … : …`
  tail with `const target = resolveFormTarget(cfg); … return target.scoreRender(outPath, R)`.
- `cfg` now carries `{conceptPath?, formTarget?, view?, region?, grid?, fit?, width?, height?}`. The
  `conceptPath`-required throw moves into `resolveFormTarget` (same effect: throws when neither given).
- Update the JSDoc `@param cfg` to add `formTarget?` and a one-line note that the GLB target swaps in here
  with no loop change.
- **Unchanged:** `reviseLoop` body, the accept gate, `score`/`diagnose`/`observe` seams, the no-top-level-GL
  invariant (loop.test group LE still passes — form-target is lazy-imported and is itself GL-free).

### MODIFY `benchmarks/sculpture/form-revise-ab.mjs` (~40 lines)

- Import `conceptFormTarget` from `../../src/form/form-target.mjs`; change the loop's `score` to
  `liveFormScore({ formTarget: conceptFormTarget({ conceptPath }) })` (proves the demo consults the interface).
- Read `form-baseline.json`; attach `e13Baseline` per subject.
- Add pure exported helpers `formVerdictOf(baseline, after, accepted, eps=1e-3)` →
  `improved | held | regressed`, and `VERDICT_GLOSS`. Add `verdict` to each json subject + a verdict column
  + gloss to the md (mirroring `codesign-ab.mjs`).
- `main()` unchanged in spirit (GL + metered, run-on-demand). Add a `--offline` path: recompute
  `e13Baseline` + `verdict` + regenerate the `.md` from the **committed** `form-revise-ab.json` (no GL, no
  model) so the committed artifacts carry the verdict without a model re-run.

### MODIFY committed `benchmarks/sculpture/form-revise-ab.{json,md}`

Regenerated via `form-revise-ab.mjs --offline`: existing measured IoU numbers preserved verbatim;
`e13Baseline` + `verdict` (+ gloss, verdict column) added. koi → `held`, heart → `held`.

### MODIFY `docs/knowledge/design-learnings.md` (append ~45 lines)

New `## E-15 surgical form revision — the gap measured, the cage that won't fake it (S-047, T-047-01)`
section after §E-14. Structure mirrors E-14:
- intro paragraph (what E-15 added: metric + region-lock + accept-gate + LLM editor + the form-target seam);
- before/after IoU table: `| subject | E-13 IoU (before) | after | Δ | kept? | verdict |`;
- "The honest read (the headline)" — both held; heart's edit *regressed* and was rejected → the gate is real;
- "Honest notes — where surgical revision *didn't* help, and what it cost" — whole-object-only signal, the
  single-view silhouette ceiling, iteration cost (metered model calls for two rolled-back edits), the GLB
  lever as the forward target;
- one-sentence summary.

### MODIFY `pr/assets/` — the E-12 handoff

- CREATE `pr/assets/form-revise.md` mirroring `value-true.md`: number table, the hero pair (before →
  proposed, since after==before — *what the cage refused*), honest caveat block, "Suggested E-12 beat."
- ADD frames to `pr/assets/frames/`: `form-koi-before.png`, `form-koi-proposed.png`,
  `form-heart-before.png`, `form-heart-proposed.png` (copied from the committed
  `benchmarks/sculpture/form-revise-ab/<subj>/{before,proposed}.png`).

## Module boundaries / invariants

- `form-target.mjs` imports only `form-fidelity.mjs` (pure). No GL, no model, no loop import → no cycle
  (`loop.mjs` lazy-imports `form-target.mjs`, never the reverse at top level).
- The accept gate and the three loop seams keep their exact signatures (AC #1).
- New `npm test` surface is `form-target.test.mjs` only (pure). The `liveFormScore` change is covered by
  the unchanged GL-gated live tests.
- Honesty: no number is invented; the committed measured IoUs are preserved; the verdict is a pure,
  documented function of them.

## Ordering (why this order)

1. `form-target.mjs` + test (the interface; independently verifiable, no deps on the rest).
2. Wire `liveFormScore` to it (depends on 1; verify live tests still green where GL is up).
3. Extend `form-revise-ab.mjs` + regenerate committed `.json/.md` offline (depends on 1).
4. Copy frames + write `pr/assets/form-revise.md` (depends on 3's renders, which already exist).
5. Append the E-15 learnings section (depends on 3's verdict numbers).
