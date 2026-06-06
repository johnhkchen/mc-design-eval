# T-041-01 — Design: value-matched-build

Decisions for the value-matched (`.v2`) build path, grounded in Research. One new **pure** module
(`src/color/value-build.mjs`), a tiny additive runner flag, a `.v2` method id, and an offline A/B
script. The build *prompt* is unchanged — the model owns form + where; the engine re-chooses blocks.

## What we are deciding

1. The snap algorithm — how a placement's model-named block becomes a value-true block.
2. Where the value (the snap target) comes from, and the realized-palette source.
3. The output contract (snapped artifact + swap report).
4. How it stays additive (`.v1` intact) and where the wiring lives.
5. Determinism + the test boundary.

## Decision 1 — Snap algorithm: **hue-anchor → nearest realized cluster → its value-true block**

For each distinct block name appearing in the artifact's placements (and manifest):

1. **Anchor.** `resolveValueTruePalette([name]).card[0]` → the name's **value-honest Lab** (T-039-01).
   A real block anchors on its own true color; an imaginary/non-cube name (`honey_block`, `oak_stairs`)
   anchors on the real block it resolves to. This is the *hue/value identity* of what the model meant.
2. **Associate.** `nearestLab(anchor.lab, realizedClusters)` → the concept's realized color cluster
   closest to that anchor. The cluster carries the *realized value* the concept actually showed.
3. **Place.** The cluster's **value-true block** (the extractor's discover-mode match — the real
   full-cube block nearest the realized color) becomes the block actually placed.

So block choice is driven by `nearestLab` against the realized palette resolved through the T-039-01
contract — exactly the AC. The model's *name* only routes the placement to a realized region (the
bridge, since no placement↔pixel mapping exists); the *engine* picks the value-true block.

**Why hue-anchor and not coverage-rank alignment** (dominant model block → dominant realized cluster):
coverage-rank assumes `palette.manifest` is sorted by coverage — it is not, and placements don't carry
coverage. Hue-anchor is deterministic, needs no ordering assumption, and is principled: it matches a
block to the realized region it most resembles. Its cost — a dark-neutral model block anchors to a
dark realized cluster and so only *partially* lifts the moai (gray_concrete +5.5, not the +16 a
coverage match to the L41 dominant would give) — is honest under-correction, surfaced in the report
(we print the realized dominant + residual). *Rejected:* coverage-rank (fragile), and pixel-projection
(no 3-D↔2-D mapping; out of scope — that is the deferred image→3D path).

**Why route through `resolveValueTruePalette` for the anchor** rather than the raw table: it handles
imaginary/non-cube names uniformly (the model emits `honey_block`, not a cube) and reuses the exact
S-039 contract this epic is built on — zero new color math, one source of truth for "the name's value".

## Decision 2 — Snap target value source: the **concept's realized palette** (dominant extractor)

`extractPaletteFromImage(concept.png, {k})` (discover mode) → `palette[]` of realized clusters, each
`{ block, repColor:{lab}, coveragePct }`. Two facts make this the right source:
- `repColor.lab` is the **value the concept actually rendered** (the L\* the model never saw at name
  time) — the thing we want placements to hit.
- `block` is already the **value-true** block for that realized color (nearest real full-cube). So the
  cluster *is* a `{ value-true block, realized value }` pair — no second snap needed.

The snap consumes clusters as `[{ key: block, lab: repColor.lab }]` (what `nearestLab` wants).
`gridFromImage` is **rejected** as the source: it carries spatial cells but no way to align them to 3-D
placements (Research §1); the dominant palette is the usable signal. `k` (cluster count) is a knob:
more clusters → more distinct value-true targets, fewer → more collapse. Default to the extractor's
`k=8`; expose it so a run can widen the target set.

## Decision 3 — Output contract

`snapArtifactToValueTrue(artifact, realized, opts)` →

```js
{
  schema: "value-matched-build/v1",
  artifact,           // a CLONE: every placement.block rewritten to its value-true block (namespaced),
                      //   palette.manifest rebuilt (distinct, first-seen placement order),
                      //   metadata.prompting_method_id <- opts.methodId if given. Original NOT mutated.
  swaps: [ {          // one row per distinct model-named block — the per-region swap the AC asks for
    name,             //   model's original block (normalized) — "from"
    valueHonest,      //   its T-039-01 value-honest block (== name if real)
    valueHonestL,     //   that block's true L*
    to,               //   the value-true block actually placed in .v2
    toL,              //   the realized cluster's L* (the value being matched)
    deltaE,           //   ΔE(anchor.lab → cluster.lab) — how far the association reached
    valueShift,       //   toL - valueHonestL — the value correction (the moai-drift number)
    changed,          //   to !== name — did the placed block differ from the model's literal choice
  }, ... ],
  manifest,           // the rebuilt namespaced manifest (== snapped artifact's)
  changedPlacements,  // count of placements whose block was rewritten
  realizedUsed,       // the realized clusters used (block + L*), for the report's "concept showed" col
}
```

One row per distinct name (a palette is a set, like S-039's card). The report shows **original name →
value-true block** with the value shift — the AC's "value-true blocks the engine chose vs the model's
original names." `valueShift` on the moai row is the headline number.

## Decision 4 — Additive wiring (`.v1` intact)

- **`src/color/value-build.mjs`** — the pure module (no I/O, no GL, no sculpture-specific ids). Lives in
  `src/color/` next to its S-039 dependency so it is under the test glob and keeps the color contract
  together. Generic: takes a parsed artifact + realized palette, returns the snapped artifact + report.
- **`src/config.mjs`** — add `VCONCEPT_SCULPTURE_METHOD_ID_V2 = "vconcept-sculpture.v2"` (single-source).
- **`src/sculpture.mjs`** — add a `VCONCEPT_SCULPTURE_V2` descriptor (attribution only); the build
  **prompt is shared with v1** (deliberate: the model owns form + where; only the post-build engine snap
  differs). Documented in the module header so the `.v1→.v2` rule is honored without forking the prompt.
- **`benchmarks/sculpture/run.mjs`** — add an **off-by-default `--value-match` flag**. When set, after
  the existing `.v1` artifact/render, it extracts the concept palette, snaps (stamping the `.v2` id),
  and writes `artifact.value-matched.json` + `value-swaps.{json,md}` + renders `render-3q.value.png`.
  `.v1` files are untouched. This is the live `.v2` build path (AC1).
- **`benchmarks/sculpture/value-match-ab.mjs`** — an **offline A/B** over committed runs (default
  moai/sword/pineapple): no model call, reuses each run's `artifact.json` + `concept.png`, writes the
  same `.v2` outputs into the run dir + renders the value-matched still, and emits a top-level
  `value-match-ab.md` with side-by-side swap tables + render links (AC2/AC3). This is what we execute now.

*Rejected:* changing `composeSculptureBuildPrompt` to ask the model for value-true blocks. That puts the
engine's job (which block) back on the model (whose name-by-hue is the documented failure) and would
require a `.v1` prompt fork. The division of labor is the whole point.

## Decision 5 — Determinism & test boundary

- **Pure & deterministic:** `structuredClone` (Node 20) for the copy; `nearestLab` is argmin with a
  stable tiebreak; the extractor's median-cut is deterministic; first-seen ordering for the manifest.
  No `Math.random`/`Date`. Two calls deep-equal; the input artifact is never mutated.
- **Unit-tested** under `src/**/*.test.mjs` on **synthetic** artifacts + synthetic realized palettes
  (`[{block,lab}]` from real table rows) — the AC's "pure block-choice logic unit-tested". No
  model/GL/network in the test path (extraction needs only pngjs decode; tests avoid even that by
  passing the realized palette directly).
- **GL/metered** is only the A/B *render*; `GL_AVAILABLE` is true here, so the value-matched stills are
  produced and saved. The snap + extraction run offline.
