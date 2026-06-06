# T-047-01 — design: the form-target seam + the honest consolidation

Two decisions: **(D-A)** how the form-target interface enters the loop without touching observe/diagnose/
accept; **(D-B)** how the honest demo + number lands (and stays honest given both koi and heart roll back).

---

## D-A — the form-target interface

### The shape of the seam (chosen)

A **FormTarget** answers exactly one question the accept step asks: *"how well does this render match the
target shape, framed on region R?"* Duck-typed:

```
FormTarget = {
  kind: string,                                  // provenance tag: "concept" | "glb" | …
  scoreRender(renderPath, R, opts?) => Promise<number>   // [0,1] form-fidelity of the render vs the target
}
```

The loop's accept step consults **only** `scoreRender`. R is passed in, so the target is **per-region**.
Today's implementation wraps the concept PNG + silhouette IoU; a GLB implementation would wrap a mesh
projection — *same method, different silhouette source*.

### Where it plugs in

`liveFormScore(cfg)` is refactored to **resolve a target from cfg, then consult it**:

```
liveFormScore(cfg) → async (artifact, R) => {
  const target = resolveFormTarget(cfg)            // cfg.formTarget ?? conceptFormTarget(cfg)
  await observeRegion(artifact, R, {outPath, …})   // unchanged
  return target.scoreRender(outPath, R)            // was: formFidelityFromPair(outPath, cfg.conceptPath, …)
}
```

- `liveFormScore`'s own signature is **unchanged** (`(cfg) => (artifact, R) => Promise<number>`); `cfg`
  merely gains an optional `formTarget`. Every existing `conceptPath` caller keeps working: `resolveFormTarget`
  builds a `conceptFormTarget` when only `conceptPath` is given.
- The loop's three seams (`score`, `diagnose`, `observe`) and the accept gate (`after > before + epsilon`)
  are **byte-for-byte unchanged**. The target lives *inside* `score`. ✅ AC #1 "no change to
  observe/diagnose/accept."

### The module (chosen): `src/form/form-target.mjs`

- `conceptFormTarget({conceptPath, grid, fit, region, _fidelity?})` — **today's implementation**.
  `scoreRender(renderPath, R)` = `formFidelityFromPair(renderPath, conceptPath, {grid, fit, region})` then
  returns `region ? regionIoU : iou`. `_fidelity` is an injectable seam (defaults to
  `formFidelityFromPair`) so unit tests stay pure (no PNG decode, no GL).
- `glbFormTarget(opts)` — **the documented GLB adapter point**. Throws `FormTargetNotImplementedError`
  with a message stating: TRELLIS→GLB is deferred (E-09); the seam is identical; a GLB target's
  `scoreRender` would render the mesh from `SCULPTURE_VIEW_3Q`, extract its silhouette, and IoU it against
  the build's R-framed silhouette — **observe/diagnose/accept never change**. The throw + the doc comment
  ARE the deliverable (seam only, no GLB code).
- `resolveFormTarget(cfg)` — returns `cfg.formTarget` as-is if present (duck-typed pass-through →
  swapping needs no loop change); else `conceptFormTarget(cfg)` if `cfg.conceptPath`; else throws a clear
  error. This is the one place the default is chosen, so a future caller passes `{formTarget: glbFormTarget(…)}`
  and nothing else moves.
- `FORM_TARGET_SCHEMA = "form-target/v1"`.

### Alternatives rejected

- **Thread `formTarget` through `reviseLoop` opts and into the accept gate.** Rejected: the accept gate is
  a pure numeric compare; giving it a target re-introduces the reference into the loop body and *changes
  the accept step* — the exact thing AC #1 forbids. The score seam is already the encapsulation boundary.
- **Augment the `observe` result with the target.** Rejected: `observe` is optional and feeds the *model
  critic*, not the accept signal; the accept signal comes from `score`. Putting the target there splits it
  from where it's consumed and would change `observe`'s contract.
- **A class / formal `implements`.** Rejected: the codebase is duck-typed ESM (no TS on the hot path).
  A documented object shape + a `resolveFormTarget` guard matches `makeFormEditor`/`liveFormScore` style.
- **Make `region` IoU the default signal.** Rejected: region-vs-region needs a 3-D→2-D projection of the
  target the flat concept can't provide (it's literally why the GLB seam exists). Whole-object IoU stays
  the honest default; `region` remains opt-in. The interface doc names this as the GLB payoff.

---

## D-B — the honest demo + number

### The consolidation (chosen)

Extend the existing `form-revise-ab.mjs` (don't fork it) so the demo:
1. **Consults the interface**: `score: liveFormScore({ formTarget: conceptFormTarget({conceptPath}) })` —
   proving the swap-point is load-bearing in the actual demo, not just the unit test.
2. **Reads the E-13 baseline** per subject from `form-baseline.json` (koi 0.481, heart 0.347) as the
   "before."
3. **Emits a deterministic categorical verdict** vs that baseline — the form analogue of E-14's
   `verdictOf`. No model call (the verdict is over IoU numbers, like E-14's was over ΔE):
   - `improved` — kept an edit AND whole IoU rose above baseline + ε.
   - `held` — no edit kept, whole IoU within ε of baseline (the cage refused a non-improving edit; no
     regression).
   - `regressed` — whole IoU fell below baseline − ε (must not happen under the gate; a guard/alarm).
4. Saves before/after/proposed renders (already does) + writes **before/after pair frames** to
   `pr/assets/frames/` for the E-12 beat.

### Staying honest when both subjects roll back

The committed measured result is `held` for both: koi 0.481→0.481, heart 0.347→0.347 (proposed *regressed*
to 0.345, correctly rolled back). The demo must **not** spin this as a win. The honest story (and the
headline of the learnings + handoff): **the gap is measured (T-043), the surgical cage runs end-to-end
(T-044/45/46), and on koi + heart the local edits did not beat the single-view silhouette baseline — so the
cage kept the build unchanged rather than fake an improvement.** That refusal *is* the proof the accept-gate
is real (it rejected heart's regressing edit), and it names the forward lever: a **better target** (the GLB
seam), since a flat concept gives only a whole-object signal that local edits barely move.

### Regenerating the committed artifacts without a model re-run

The committed `form-revise-ab.json` already holds the real measured loop numbers. The verdict + baseline
are a pure function of those numbers + `form-baseline.json`. So the harness's verdict/table logic is
exported as pure helpers, and the committed `form-revise-ab.{json,md}` are regenerated **offline** from
the existing committed numbers (no GL, no claude -p, no fabrication) — the IoU values are preserved
verbatim; only `e13Baseline` + `verdict` fields are added. A future live re-run (`node form-revise-ab.mjs`)
produces the same shape with fresh numbers.

### Docs (chosen)

- `docs/knowledge/design-learnings.md` — new `## E-15 surgical form revision …` section, mirroring E-14:
  before/after IoU table (koi/heart, E-13 baseline → after, verdict), a headline paragraph, "Honest notes
  — where surgical revision *didn't* help, and what it cost" (both rolled back; whole-object-only signal;
  iteration cost; the GLB lever), a one-sentence summary.
- `pr/assets/form-revise.md` — the E-12 beat, mirroring `value-true.md`: the number table, the hero pair
  (koi/heart before → proposed, since after==before — showing *what the cage refused*), an honest caveat
  block, a "Suggested E-12 beat." Frames added under `pr/assets/frames/form-*`.

### Verification

- `npm test` stays green: new `form-target.test.mjs` is pure (injected `_fidelity`); the `liveFormScore`
  refactor is exercised only by the existing GL-gated live tests (unchanged `conceptPath` path) — pure loop
  tests inject `score` and never touch it.
- A focused check the live test still wires: `liveFormScore({conceptPath})` and
  `liveFormScore({formTarget})` both yield a working `score` (the former via `resolveFormTarget`'s default).
