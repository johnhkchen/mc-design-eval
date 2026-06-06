# T-076-01 Design — resemblance-gate

Decisions, with rejected alternatives, grounded in `research.md`. Three deliverables: a **triptych
assembler**, a **pure perceptual scorer**, and a **categorical multimodal judge** — wired into one
**reusable runner** for the gatehouse (and S-077's other subjects). Rule 2 governs: triptych = verdict,
scores = explanation.

## D1 — Pure core vs impure runner split

**Decision.** A pure, GL-free, network-free, RNG-free core in `src/form/resemblance.mjs` (the perceptual
scorer + the triptych *compose math* + the verdict *parser* + the fixed judge *prompt*), tested under the
root `npm test` glob. An impure runner `benchmarks/sculpture/resemblance.mjs` owns the edges: GL re-render,
image decode/encode, the metered `claude -p` call, file I/O, label drawing — exported as `runResemblanceGate`
for S-077, with `--offline`.

**Why.** This is the established model (`building-build.mjs` = pure `src/form/building-build.mjs` +
impure runner). It satisfies AC #2 ("pure, GL-free, unit-tested") and AC #3 ("live call is metered") at
once, and keeps the suite GL-/model-free.

**Rejected.** Putting the scorer in the runner — fails AC #2. A standalone MCP server for the judge —
out of scope this phase (CLAUDE.md), `requestTextWithImage` already is the seam.

## D2 — The triptych: what each panel shows

`concept | mesh | minecraft`, left→right, fixed order, each a square panel at a shared `BUILDING_VIEW_3Q`.

- **concept** — `concept.png` decoded, letterboxed into the panel. Carries the **color+form intent**.
- **mesh** — the **GLB silhouette** rasterized at `BUILDING_VIEW_3Q` (`rasterizeSilhouette`), drawn as a
  filled grey fill on white. Carries the **3-D form intent** — and is *exactly* the mask the form-IoU scores
  against, so the panel is honest about what the gate measures.
- **minecraft** — a **fixed-lens re-render** of `building/best/artifact.json` (T-075-01 SSAA default),
  letterboxed. The thing being judged.

**Why a silhouette (not a shaded GLB) for the mesh panel.** A shaded GLB render needs a three.js GLTF +
GL path we do not have wired; the CPU `rasterizeSilhouette` is GL-free, already trusted, and is the literal
form reference. The color/material intent is already carried by the concept panel — the mesh panel's job is
form/massing. **Rejected:** a textured GLB render (scope + new GL dependency); omitting the mesh panel
(AC #1 requires three panels).

**Compose = pure paste + separators; labels = impure cosmetic.** `composeTriptych(panels,opts)` pastes three
equal RGBA panels with separator gutters into one buffer — pure and unit-tested. Text labels
("concept"/"mesh"/"minecraft") are drawn by node-canvas in the runner before `encodeRgbaToPng`; text raster
is not pure-testable and is purely cosmetic, so it stays out of the core. **Rejected:** baking text in the
pure layer (would need a bitmap font + pull a raster dep into `src/**`).

## D3 — The perceptual scorer (diagnostic, not verdict — Rule 2)

`resemblanceRow({ renderImg, conceptImg, meshSil, artifact, blockTable }, opts) → { schema, form, material,
… }`. Two families, both pure, both rounded for stability:

### Form (reuse `extractSilhouette`/`rasterizeSilhouette`/`iou` — AC #2 verbatim)
- `meshIoU` — minecraft render silhouette (`RENDER_BG`) vs GLB mesh silhouette, both `normalizeSilhouette`d.
  The primary form number (vs the **3-D** reference).
- `conceptIoU` — minecraft render silhouette vs concept silhouette (`CONCEPT_BG`). A second, weaker view
  (concept is approximate 3/4) — reported, not gated.

### Material agreement ("via block-table.mjs Lab; land where the references place those materials")
Both sides snapped to the **block-lab table** so they speak one vocabulary (`nearestLab`):
- **`setAgreement`** — *do they use the same materials at all?* Build palette = top-K block IDs from
  `artifact.placements` → their Lab from the table. Concept palette = `medianCutLab` of concept foreground →
  each snapped to nearest table block. Score = symmetric coverage (fraction of build blocks with a concept
  block within `ΔE_set`, averaged with the reverse) → 0..1.
- **`zoneAgreement` + `meanZoneDeltaE`** — *are they in the same places?* Overlay a `Z×Z` grid on each
  image's normalized foreground bbox; per common foreground cell take the dominant Lab (mean of cell
  pixels), snap both to the table. `zoneAgreement` = fraction of common cells within `ΔE_zone`;
  `meanZoneDeltaE` = mean per-cell ΔE. Plus a `zones` block-name map per side (the diagnostic).

**Why both.** "Same materials" (set) and "same places" (zone) are different failures — the E-19/E-21 lesson
that material identity is semantic and zoning matters (memory `material-identity-is-semantic`). Snapping to
the table honors "via block-table.mjs Lab" and yields named blocks for the gap report (Rule 7).

**Honesty ledger (mirrors form-fidelity's).** Zoning is read from **render pixels**, not 3-D block
positions (the artifact has no 2-D projection); camera mismatch (concept ≈ 3/4) misaligns zones; both are
**diagnostic** under Rule 2. The verdict is the judge + the human-read triptych, never these numbers.

**Rejected.** (a) Projecting artifact blocks to 2-D for true zoning — needs the GL camera, breaks purity,
duplicates the render. (b) Bag-of-colors palette ΔE only — blind to zoning, the exact failure mode that let
"static" pass. (c) Comparing raw render pixels without the table snap — fails "via block-table.mjs Lab" and
drifts with lighting/AO.

## D4 — The categorical multimodal judge

`buildResemblancePrompt()` (pure, **fixed** — Rule 5) instructs: "you see three panels, left→right —
concept reference, 3-D mesh reference, the Minecraft build. Rule whether the build is the **same object**,
**drifted**, or a **different object** than the references. If not 'same object', name **one** gap:
`region` (where) + `attribute` ∈ {form, massing, material zoning, palette}. Reply as strict JSON
`{verdict, gap:{region,attribute}|null, rationale}`." The runner sends the **assembled triptych** (one
image) via `requestTextWithImage` (metered). `parseResemblanceVerdict(text)` (pure): `stripToJson` →
validate `verdict` ∈ the 3-enum; require a `{region,attribute}` gap with `attribute` in the 4-enum whenever
verdict ≠ "same object", forbid/allow-null otherwise; return `{schema, verdict, gap, rationale}` or throw a
precise error. **Parse/validate is unit-tested; the live call is metered** (AC #3).

**Why categorical + named gap (not a numeric score).** A 0..1 number is exactly the proxy trap E-22 rejects.
A 3-way verdict the human can confirm against the triptych, plus a named region+attribute, is the
actionable signal (Rule 7). **Why send the triptych, not three separate images** — one labeled image keeps
the panel mapping unambiguous and matches what the human reviews. **Why no BAML** — `requestTextWithImage`
+ `stripToJson` + a tiny enum validator is lighter, keeps parse pure, and avoids the tsx/BAML subprocess.
**Rejected:** N-sample median (temple-facade) — defer; one metered call is enough for the gatehouse proof,
sampling is a fixed-threshold knob S-077 can raise without touching parse logic.

## D5 — Reusability & fixed thresholds (AC #5)

`runResemblanceGate({ subject, conceptPath, glbPath, artifactPath, outDir, offline })` — references passed
as **immutable inputs** (Rule 1; never regenerated). Thresholds (`Z`, `grid`, `ΔE_set`, `ΔE_zone`, top-K,
the judge prompt) live in one frozen `RESEMBLANCE_DEFAULTS`/prompt constant (Rule 5). Outputs per subject to
`benchmarks/sculpture/resemblance/`: `<subj>-triptych.png`, `<subj>-perceptual.json`, `<subj>-verdict.json`,
`<subj>-resemblance.md`. `--offline` skips the GL re-render (uses the committed render) and the metered judge
(writes the perceptual row + triptych + a `verdict:"(not run)"` placeholder), so CI/reproduction is GL- and
model-free. S-077 calls `runResemblanceGate` per subject.

## What "done" looks like

Gatehouse: a triptych a human can read, a perceptual row (form + material, diagnostic), and a metered
verdict with a **named** gap if it drifted. `npm test` green on the pure core (scorer + compose + parser).
