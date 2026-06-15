# T-061-01 Research — consolidation & thin-boundary (E-18, terminal)

Descriptive map of what already exists. This ticket is a **consolidation** (verdict + honest boundary),
not a trial: no new model calls, no re-measurement. It reads the committed E-18 spine, assembles a
legible scorecard, stitches before/after composites from already-rendered PNGs, journals the findings,
and hands the beat to E-12. Modeled on E-17's T-057-01.

## The data spine already exists (T-060-01)

`benchmarks/sculpture/e18-remeasure.json` (schema `e18-remeasure/v1`, scale 32) is the whole payload.
Assembled by the pure `assembleRemeasure` (`src/form/remeasure.mjs`); the runner
`benchmarks/sculpture/e18-remeasure.mjs` collected the rows (GL render + dwebp). Shape:

- `metrics[]`: five axes, each `{key,label,better}` — `formIoU` (higher), `speckle`, `distinct`,
  `offPalette`, `valueDeltaE` (all lower).
- `builds[]`: `["r1","r2","e18"]` — R1 glb-voxel (E-17), R2 material-clean (E-17), E18 combined.
- `subjects[]` (7): each carries `r1`/`r2`/`e18` cells (the five metrics), a `thin` diagnostic
  `{components, surfaceOnlyCount, occBase, occThin}`, and `deltas.{vsR1,vsR2}.<metric> = {raw, improved}`.
- `averages.{r1,r2,e18}`, and `regressions[]` (every E18 cell not strictly better than a baseline, with
  `kind: worse|no-change`), and `notes.valueDeltaETautology`.

### The on-disk numbers (these are authoritative — supersede any cached summary)

Per-subject `formIoU` / `speckle` / `distinct` / `offPalette` / `valueDeltaE`, read **R1→R2→E18**:

| subject | form IoU | speckle | distinct | off-pal | value ΔE | thin |
|---|---|---|---|---|---|---|
| dancing-man | 0.914→0.914→**0.814** | 0.402→0.275→**0.148** | 5→5→5 | 0→973→**0** | 11.19→0→**13.82** | comp 1, +531 |
| moai | 0.565→0.565→**0.593** | 0.428→0.248→**0.136** | 5→5→5 | 0→4096→**0** | 1.0→0→1.88 | comp 3, +1844 |
| pineapple | 0.907→0.907→**0.845** | 0.422→0.25→**0.104** | 4→5→4 | 0→2939→**0** | 8.71→0→8.43 | comp 1, +1458 |
| bow-and-arrow | 0.473→0.473→**0.526** | 0.442→0.366→**0.089** | 6→8→6 | 0→352→**0** | 1.1→0→8.04 | comp 1, +697 |
| heart | 0.877→0.877→**0.895** | 0.57→0.343→**0.11** | 7→7→7 | 0→1323→**0** | 4.62→0→8.0 | comp 1, +2142 |
| mushroom | 0.98→0.98→**0.929** | 0.374→0.301→**0.131** | 6→7→6 | 0→8614→**0** | 7.17→0→4.14 | comp 1, +2453 |
| koi | 0.622→0.623→**0.706** | 0.415→0.35→**0.158** | 5→8→5 | 0→1237→**0** | 4.53→0→16.35 | comp 1, +991 |

**Averages** R1→R2→E18: formIoU 0.76→0.76→0.76 · speckle **0.44→0.30→0.13** · distinct 5.43→6.43→**5.43**
· off-pal 0→**2790.57**→**0** · value ΔE 5.47→0→**8.67**.

### What the spine says, in plain terms

- **Speckle is the decisive surface win.** E18 0.13 avg vs R2 0.30 vs R1 0.44 — segmentation roughly
  halves speckle vs R2's smoothing, and drops it on **all 7** subjects (the largest single-metric, most
  uniform win in the record).
- **Palette discipline holds at zero off-palette.** E18 off-pal = 0 on all 7. R2's 2790 avg is the
  material-clean *leak*: it snaps to the GLB's **own texture palette** (k≈8), which is not the design-doc
  manifest, so its blocks fall outside the augmented design-doc palette. E18 (and R1, now wired through
  the same augmented design-doc palette by T-058-02) snap *within* it → 0. Distinct: E18 5.43 ≤ R2 6.43.
- **Thin form is a routed tradeoff (the headline boundary).** Form IoU **rises** on thin/organic subjects
  (bow +0.053, koi +0.084, heart +0.018, moai +0.028) but **dips** on already-solid subjects
  (dancing-man −0.10, pineapple −0.06, mushroom −0.05). The conservative surface trace
  (`voxelizeGlbThin`) adds a ~1-voxel shell to **every** subject (occupancy grew on all 7), recovering
  severed members on thin forms and over-thickening solid ones. Net avg form IoU is flat (0.76).
- **Value ΔE rises (honest cost).** E18 8.67 avg > R1 5.47. The augmented design-doc palette (k≈6) is
  *tighter* than the GLB texture reference R2 snaps to, so per-voxel value drift against that reference
  grows. This is the documented non-tautology: R2's 0 is by construction; E18's nonzero is a real,
  small price of palette discipline. `notes.valueDeltaETautology` spells this out.

## The before/after renders already exist (gitignored — must be committed as composites)

All `benchmarks/sculpture/**` renders are gitignored (root `.gitignore:15–63`). Confirmed present locally:

- **Speckle before/after** — before `glb-voxel-clean/<subj>/render-3q.png` (R2, smoothed but still
  speckled); after `e18-build/<subj>/render-3q.png` (segmented). Present for heart, koi (and all 7).
- **Thin before/after** — `glb-voxel-thin/bow-and-arrow/render-base-3q.png` (severed: 4→1 components) vs
  `render-thin-3q.png` (connected). Present for bow-and-arrow (and koi).

Composites must be committed under `pr/assets/frames/` so the bundle stays self-contained
(`pr/assets/frames/README.md` documents this rule and the provenance table).

## Reusable pure primitives

- `src/form/montage.mjs` — `montageRow(images,{gap,bg})`: pastes RGBA8 panels left→right. GL-free,
  unit-tested. The E-17 march strips used it; before/after pairs are the same call with 2 panels.
- `src/form/scorecard.mjs` (E-17) — the *pattern*: a pure spine→`{md,json}` transform with a Levels
  table, Marginal Δ table, per-technique AVG/Δ attribution, verdict gloss, honesty notes. Not reused
  directly (different spine shape, 5 metrics not 2), but the structure is the template.
- `src/form/remeasure.mjs` — `METRICS`, `BUILDS`, `delta()`, `improved()` exports; direction-aware delta
  math the new scorecard can reuse instead of re-deriving.
- `RENDER_BG` (`src/form/form-fidelity.mjs`) — the drop/bg color for montage gutters.

## The consolidation conventions (from E-14/15/16/17)

- Pure tested core in `src/form/`; I/O+stitch runner in `benchmarks/sculpture/`; tracked bundle in
  `pr/assets/` (a themed `.md` scorecard + committed `frames/*.png` + an E-12 handoff section).
- `docs/knowledge/design-learnings.md` gains one epic section appended after the prior epic's
  (currently ends at the E-17 "Consolidation sweep" section, line ~1687): before/after numbers, a
  "where it didn't help (shown, not dropped)" paragraph, the residual, one-sentence distillation.
- Honesty discipline (AC #5 in every prior consolidation): zero/negative deltas shown as such; n on
  every average; tautologies flagged, not sold.

## The qualitative deliverable — form-type routing (not in the spine)

The ticket's second deliverable is a **finding**, not a number: **sword has no GLB** — TRELLIS 500s on
the thin blade across 4 attempts (incl. after trimming to fill the frame; `glb/README.md`,
memory: image→3D-thin-subject-limit) — yet sword's **text→JSON** build was one of the better E-13 ones
("faithful cruciform"). So the pipeline is **form-type-routed**: bulky/organic → image→3D → voxelize;
thin/angular → text→JSON. The per-subject form-IoU routing in the spine (thin helps organic, hurts
solid) is the *quantitative half* of the same rule; the sword is the *boundary case* where image→3D
fails outright. This is the deliverable, stated as the rule — not logged as a gap.

## Constraints / assumptions

- No new GL, no model calls — pure read + PNG stitch only. Keeps the ticket deterministic and fast.
- The five-metric spine is frozen; the scorecard must consume it verbatim (no re-derivation → cannot
  drift from the record). Same discipline as E-17's scorecard-over-spine.
- `npm test` baseline is 600 green; new pure module + tests must keep it green.
