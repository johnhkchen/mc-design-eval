# Roof Fix — Implementation Work Packages (plan by Opus, 2026-10-10)

Source: `/Volumes/ext1/swe/repos/mc-design-eval/benchmarks/intel/roof-research.md`. Repo: `/Volumes/ext1/swe/repos/minecraft-design`. Tests: `cd tools && node --test test/*.test.mjs` — all 131 existing must stay green.

**Backward-compat rule:** every existing `roof()`/`reroof()`/preset call keeps working and keeps its geometry; block choice may change (mixing is now default). Any existing test that pins exact blocks may add `texture:false, edges:false` to its options (WP6 only); no other edits to existing tests.

## Shared contracts (all packages code against these)
1. **Material hook** `o.materialAt(ctx) -> blockName`, `ctx = { x, z, course, courses, role }`, `course` = `yt - y0` (0 = eave course), `courses` = roof height in courses, `role ∈ field|eave|ridge|verge|hip|fascia|soffit`. Absent → today's behaviour exactly.
2. **Height hook** `o.heightMod(H, info) -> { puts?: [[x, dy, z, [block, state]]] }`, `info = { M, M0, ov, rects, axis, style, P, y0 }`; mutates `H` in place (block units, rounded to halves later); `puts` are extra cells (dy relative to y0), air-only.
3. **Facts** on every roof result `r.facts = { style, preset, y0, top, wallH, roofH, ratio: roofH/wallH, span, len, pitch, overhang:{north,south,east,west}, materials:{block:count}, tones (count of mutually visible() roof blocks), ridge:bool, eave, edges:{fascia,soffit,barge}, contrast:{checked,off,distance}, longestPlane (max run of same-facing stairs in one course), breaks (dormers+chimneys+monitor+pediment+tiers placed), dormers:{requested,placed,dropped:[{at,reason}]}, chimneys:[{at,surface,top}] }`.
4. **Bypass reasons** `o.reasons = { contrast?, overhang?, texture? }` or `o.why` (applies to all).

## File ownership
| WP | may touch only |
|---|---|
| 1 Core | `tools/src/roofs.mjs`, new `tools/test/roofs-core.test.mjs` |
| 2 Texture | new `tools/src/roof-texture.mjs`, new `tools/test/roof-texture.test.mjs` |
| 3 Guard rails & CLI | new `tools/src/roof-review.mjs`, new `tools/test/roof-review.test.mjs`, `tools/bin/mcd.mjs` (`roof` case + header only) |
| 4 Forms | new `tools/src/roof-forms.mjs`, new `tools/test/roof-forms.test.mjs` |
| 5 Eaves & closeup | new `tools/src/roof-eaves.mjs`, `tools/src/inspect-views.mjs`, new `tools/test/roof-eaves.test.mjs`, new `tools/test/roof-closeup.test.mjs` |
| 6 Integration (last) | `roofs.mjs` (wiring only), new `tools/src/roof-presets.mjs`, `references/roofs.md`, `examples/roofs/regression.mjs`, new `tools/test/roof-regression.test.mjs`, `mc-design-eval/benchmarks/collection/build.mjs`, `collection.baml` |

WP1–5 run in parallel; none imports another's new module until WP6. WP4 may import from `roofs.mjs` and `shapes-curved.mjs` read-only.

## WP1 — Core rasterizer (`roofs.mjs`)
Goal: hooks, facts, default edges, per-side overhang, height cap, dormer/chimney/materialOf fixes.
- Call `materialAt` in `matFor` and wherever trim/verge/ridge/hip material is chosen, with the correct `role`. Call `heightMod` after the pediment pass, before rasterising. Return `r.facts`; move the wall-height detection out of `presetOptions` into exported `wallHeightOf(g, R, y0)`.
- `o.dryRun: true` → compute everything, skip `commit`, return `{dryRun:true, facts, notes}`.
- **Edges** (new `edges` option, default `{fascia:true, soffit:true, barge:true}`, active when overhang ≥ 1 and style ≠ flat-parapet; `edges:false` turns off): fascia = open trapdoor on the outward face of each eave cell's outer side (the cell just outside the eave cell, `facing` outward so the panel hugs the eave), default `spruce_trapdoor` on stone roofs / `birch_trapdoor` on wood roofs; soffit = top slabs under the overhang (reuse current soffit code), default `spruce` on stone / `oak` on spruce or dark-oak roofs, never `oak` when material is oak (then `birch`); barge = verge course on by default (default `o.verge` ?? `trim` ?? `dark_oak` on stone / `spruce` on dark roofs). Ridge cap defaults to slab for any pitch > 0.5, using role `ridge`.
- **Overhang** accepts number or `{north,south,east,west}`: height = distance-to-wall-line (Chebyshev inside M0, negative distance outside); identical to today for uniform values.
- **`maxHeight`**: if top would exceed it, step pitch down the ladder 3 → 2 → 1 → 0.5 and note it.
- **Flat**: coping slab defaults to `trim` when it differs from the parapet block, else `smooth_stone`; deck uses role `field`; new `cantilever:true` extends the deck by the per-side overhang as top slabs with fascia + soffit.
- **Dormers**: hipped/pyramid roofs on faces ≥ 7 long get one centred dormer instead of a silent drop; `face` may be `"all"` or an array; every drop recorded in `facts.dormers.dropped` and notes with its reason.
- **Chimneys**: `top = max local surface over the chimney footprint + rise` (rise default 2), not `topY + rise`; add one `trim` course at the surface as a base; a chimney outside M0 is clamped inside with a note.
- **`materialOf`**: map non-cut copper to the cut variant (`weathered_copper` → `weathered_cut_copper`); note when a material has no stairs (terracotta, concrete, logs).
- Export `DEFAULT_MATERIAL` (WP6 changes it) and `wallHeightOf`.
- Tests: hooks called for every role; uniform `{n:1,s:1,e:1,w:1}` gives the same signature as `overhang:1`; `{north:2}` lengthens the north side only; dry run writes nothing; chimney top ≤ local surface + 3; a pyramid with `dormers` places one or reports why; `weathered_copper` yields valid stairs; fascia trapdoor count = eave perimeter.
- Visual: `examples/roofs/gallery.mjs` + `mcd render --closeups` — eaves show a thin light line and a soffit underneath. Accept: 131 + new tests green; no style loses watertightness or symmetry.

## WP2 — Texture (`roof-texture.mjs`)
Goal: mixed roofs by default, never one flat plane.
- API: `ROOF_PALETTES`; `textureOf(spec, {seed}) -> { materialAt(ctx), roles, meanRgb, members }` where `spec` = palette name | `{ mix:[[block,weight],...], eave, ridge, verge, fascia, soffit, gradient:"eave-dark"|"none", rows:bool }` | a single block (expanded by `autoMix`); `autoMix(block)` = the block 60% + two same-family stair-capable members 25/15; `STAIR_SLAB` (blocks with both stairs and slab); `toneReport(tex) -> {tones, eaveVsField}`.
- Rules: deterministic hash of (x, z, course, seed); per-cell pick but no more than 2 cells in a row share a member; gradient: course 0 always `eave`, course 1 `eave` with probability 0.5; `rows:true` alternates mix members by course (the copper look); non-stair members (e.g. `cracked_deepslate_tiles`) only for full-block cells, else fall back to the top-weighted member.
- Palettes (field mix / eave / ridge / verge):
  - `slate` (new default): cobbled_deepslate 45, deepslate_tile 35, polished_deepslate 20 / polished_blackstone_brick / stone_brick / dark_oak
  - `dark-slate`: deepslate_tile 70, cobbled_deepslate 15, polished_blackstone_brick 10, cracked_deepslate_tiles 5 (full-only) / polished_blackstone_brick / polished_deepslate / spruce
  - `spruce-shingle`: spruce 60, dark_oak 25, mangrove 15 / dark_oak / dark_oak / birch
  - `red-tile`: brick 55, granite 25, polished_granite 10, mangrove 10 / mud_brick / mud_brick / smooth_quartz
  - `barn-red`: mangrove 55, brick 25, dark_oak 20 / dark_oak / dark_oak / smooth_quartz
  - `copper`: weathered_cut_copper / oxidized_cut_copper with `rows` / exposed_cut_copper / cut_copper / —
  - `dark-glazed`: deepslate_tile 50, cobbled_deepslate 30, polished_blackstone_brick 20 / polished_blackstone_brick / smooth_quartz / dark_oak
  - `sandstone-deck`: smooth_sandstone 70, cut_sandstone 20, sandstone 10
- Tests: every palette member ∈ `STAIR_SLAB` (except those marked full-only); each palette has ≥ 3 visible()-distinct members across roles; `toneDistance(eave, field mean) ≥ 0.15`; ridge vs field ≥ 0.15; deterministic; weights within ±5% over 1000 cells.
- Visual: a 16x16 swatch NBT per palette rendered `--closeups`. Accept: no palette renders as one tone at 18 px.

## WP3 — Guard rails, proportion report, CLI
- `roof-review.mjs`: `reviewRoof(facts, opts) -> { ok, warnings:[{code,message,fix}], lookNotes, report }`. Codes: `ROOF_CONTRAST_OFF` (contrast:false, no reason); `ROOF_NO_OVERHANG` (any side 0, no reason); `ROOF_SINGLE_MATERIAL` (tones < 3 or texture:false without reason); `ROOF_TOO_TALL` (ratio > ratioCap); `ROOF_LOW_PITCH` (< 0.5 on a non-flat style); `ROOF_BIG_PLANE` (longestPlane ≥ 10 and breaks == 0); `ROOF_NO_RIDGE`; `ROOF_BLACK_LID` (field mean luminance < 60 and luminance contrast vs walls < 0.3); `ROOF_DORMER_DROPPED`. A given reason turns the warning into a lookNote quoting it. `ratioCap(style, preset, wallH)`: 0.6 if wallH ≤ 5; 1.0 if wallH ≤ 9; 1.8 for the steep-by-design list (cottage, shop, granary, barn, cone, tower-cap, tiered, church). `formatReport(facts, review)` → text table (roof/wall heights, ratio, overhang, tones, breaks) + warnings. `SIZE_BUDGET` table by building type, for the prompt.
- `mcd roof`: `--dry-run` (print the report, write nothing); `--why "<reason>"`; `--no-contrast`, `--overhang 0` and `--texture none` error unless `--why` is given; `--overhang n,s,e,w`; `--texture <palette>`; `--strict` (exit 2 on any warning); always print the warnings after a run (call `reviewRoof(r.facts, o)` when `r.facts` exists). Read valid styles from `ROOF_STYLES`, never hardcode.
- Tests: each code fires on a synthetic facts object and is silenced by its reason; `ratioCap` table; CLI via spawnSync: `--no-contrast` without `--why` exits non-zero; `--dry-run` leaves the output file absent. Accept: all the research's bypass cases produce a warning.

## WP4 — New forms (`roof-forms.mjs`)
Each form `(g, footprint, o)` returns the same shape as `roof()` `{cells, refused, shift, eave, top, footprint, notes, facts}`; honours `protect`, `keep`, `grow`, `materialAt`, `y`; uses a local copy of the writer; uses `revolveCells` from `shapes-curved.mjs` (pure; do not use `dome()`, it ignores `protect`).
- `cone`: R = floor(min(w,d)/2) + overhang (default 1); `shape` round when R ≥ 4 else octagon; `pitch` default 2.75 (≥ 2.5), H = round(pitch·(R+0.5)); concave flare profile r(t) = (1−t)^1.35; bottom ring role `eave` plus a trim ring course one cell out; `lean:{dir,amount}` shifts the centre by round(amount·t²); `finial` default `lightning_rod`; `dormer:{face}` = a 3-wide gable dormer at t ≈ 0.25.
- `dome`: `profile` hemisphere|onion|pointed|shallow; `drum:{height:2, block:wall, band:trim}`; R < 4 falls back to cone with a note; `ribs` (default 8 when R ≥ 5) as trim meridians; cornice slab ring at the base; finial `end_rod` over a `gold_block` for onion.
- `tiered`: `tiers` 3, `skirt` (lean-to ring) width 2, `inset` 2, `band` = 2 courses of wall block with a window every 3 cells, `pitches` [1, 1.5, 2], overhang 1 per tier; the top tier is a hip or gable via `roof()`; `ridgeEnds:"dragon"` puts an upside-down stair + slab curl at tier corners.
- `sawtooth`: `bays` round(len/5); each bay a shed of pitch 1, height ≤ 4; the vertical face `glass_pane` framed in trim, facing `glaze` (default north); gable ends filled with the wall block; copper uses `cut_copper` forms (no gaps).
- Tests: watertight over the footprint; deterministic; cone H/R ≥ 2.5 with monotonically decreasing layer radii; dome R=3 → cone + note; tiered has 3 distinct overhang rings with wall-band cells between; sawtooth glass count = bays × face width × face height, no air gaps in the slope.
- Visual: wizard 9x9 cone in 3/4 view (should read as a hat), onion on a drum, 3-tier church, 3-bay workshop.

## WP5 — Upturned eaves + roof close-up
- `roof-eaves.mjs`: `upturn({cells:2, rafters:"spruce_trapdoor"})` returns a `heightMod`: along each eave the 2 cells before an outer corner rise +0.5 then +1, the corner cell +1.5; `puts` adds a rafter-tail trapdoor row (top half, closed) under the overhang edge every other cell. `curvedRise(P, span, sag=0.25)` — a rise function that sags the middle of the slope.
- `inspect-views.mjs`: `closeupPlan` adds a `kind:"roof"` tile — box = roof cells above the eave, cropped to one eave corner + the ridge; camera front-left, `up:0.9`, ≥ 24 px/block (double `MIN_PX`). New export `roofTile(grid, assets, opts)`.
- Tests: corner heights exceed mid-eave by +1.5, symmetric; `closeupPlan` on a roofed house contains exactly one roof tile with `pxPerBlock` ≥ 24 (camera math only, no assets).
- Visual: a tea house with `dutch-gable`, pitch 0.67, `heightMod: upturn()` — corners read as a flick, not horns.

## WP6 — Integration (after WP1–5 merge)
1. Wiring in `roofs.mjs`: `material` (string, palette or mix) → `textureOf(...).materialAt` unless `texture:false`; `DEFAULT_MATERIAL = "slate"`; the contrast check uses `meanRgb`; `eave:"upturned"` → `upturn()`; add `cone`, `dome`, `onion`, `tiered`, `sawtooth` to `ROOF_STYLES` and dispatch them to WP4 (the ESM cycle is safe: nothing is called at module evaluation); when no explicit `pitch`, `maxHeight = ratioCap × wallH`; attach `r.warnings = reviewRoof(...)` and copy them into `notes`.
2. Presets (`roof-presets.mjs`, merged into `ROOF_PRESETS`): existing ones switch to palettes (cottage → spruce-shingle, civic → slate, townhouse → dark-slate, granary → slate). New: `barn` (gambrel on the long axis, lower = max(2, round(0.4·span/2)) at pitch 1.5, upper 0.5, barn-red, quartz verge, overhang 1, 2 dormers per side (3 if len ≥ 18), a size-3 lantern cupola on the ridge); `teahouse`/`pagoda` (dutch-gable, pitch 0.67, upturned, dark-glazed, overhang 1, ratio 0.6); `tower-cap` (cone 2.75, slate or copper); `lantern-cap` (cone, pitch 0.75, ring course); `church`/`stave` (tiered 3, spruce-shingle, dragon ridge ends); `workshop` (sawtooth, copper); `desert` (flat, sandstone-deck, smooth_quartz coping, optional dome); `cafe` (flat cantilever, overhang {north:2, south:1, east:1, west:1}, smooth_quartz fascia, spruce soffit).
3. Docs & builder prompt: `roofs.md` — a preset table chosen by building type, the palettes, the bypass rule, `--dry-run`. `build.mjs` builder prompt: pick the preset by type from the table; run `--dry-run` first and fix every warning; never bypass a guard rail without `--why` citing the concept. Add the roof close-up tile to `card()`.
4. Judge (`collection.baml`): one added line — grade the roof against the brief's roof type, suggest only existing tools. Version it `JudgeGlanceV2` so earlier runs stay comparable.
5. Regression gallery: `examples/roofs/regression.mjs` builds the research's 8 cases (walls + presets), writes `regression.png` (each card + its roof close-up) and `regression.json` (facts + warnings); `roof-regression.test.mjs` checks each case: 0 warnings, ≥ 3 tones, fascia/verge tone distance vs field ≥ 0.15, ≥ 1 break, ratio within its cap, watertight, ≥ 2 wall courses visible below the eave.
- Accept: the full suite passes; a Sonnet builder run on barn, tea house and wizard reaches a preset on its first `mcd roof` call; the judge grades the roof below Major on ≥ 6 of the 8 cases (the research's bar is 8).
