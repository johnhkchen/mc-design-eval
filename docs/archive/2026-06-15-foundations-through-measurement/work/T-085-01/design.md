# T-085-01 zone-fill-dominant — Design

Decision: a new pure core `src/view/zone-fill.mjs` (deterministic surface zone-fill + a surface-zone
histogram), wired into `spray-paint.mjs` between the structural-zone read (§0b) and the splat (§1/§2), with
the splat's per-zone palette reduced to **secondaries only**. Rationale and rejected options below.

## D1. Where the fill lives

**Chosen: a new pure module `src/view/zone-fill.mjs`.**
The seam invariant of the spray-paint runner (its own header) is "the pure cores are `src/view/*`
(unit-tested); the runner is impure wiring only". The AC demands "pure, unit-tested on synthetic occupancy",
and the unit-test glob is `src/**/*.test.mjs` — a runner-local helper is untestable by `npm test`
(rejected option C). Extending `face-paint.mjs` (option B) was rejected because the fill is not a
*splat back-projection* — it has no target grid, no source-priority merging, and adds preserve/run
semantics that don't belong in `paintFace`'s contract; a sibling module keeps both single-purpose.

## D2. What "fill" means (the core algorithm)

**Chosen: recolor the *visible surface* of each zone, voxel-deduped across the five exposed faces.**

- Surface set = union of non-null cells of `projectSurface(occ, dir)` for `dir ∈ {"+x","-x","+z","-z","+y"}`,
  deduped by voxel — exactly the set `surfacePlasterByZone` measures and the set the eval lens (renders)
  can see. `+y` is required so the **roof zone's dominant** (spruce field) can be established; `-y` is the
  unseen underside, excluded (matches the runner's `SURFACE_FACES`).
- Per surface voxel, classify with `zoneOf(voxel)` and apply the zone policy
  `{dominant, preserve:[...]}`:
  - current block == dominant → **keep** (no placement);
  - current block ∈ preserve **and** part of a *run* → **keep**;
  - anything else (the 64% stone in the upper band, isolated preserve-material specks, off-policy strays) →
    **fill**: emit `{op:"voxel", pos, block: minecraft:<dominant>}`.
- A zone with no policy entry → untouched (forward-compatible: a caller can fill one zone only).
- Output: `{ placements, filled, kept, byZone }` — placements are recolors at existing voxels (no air op,
  geometry untouched), exactly the `applyPaint` contract.

**Rejected — volumetric fill** (recolor every voxel in a zone): touches interior cells the lens never sees,
inflates the artifact diff, and tramples E-23's interior work (hollow/floorplan operate on interiors).
The visible defect is the skin; fill the skin.

**Rejected — express the fill through `paintFace`** (build a per-face target grid of `dominant`-where-not-
preserved and reuse the splat machinery): run detection is natural in voxel space and shared across faces;
through `paintFace` it would have to be re-derived per face, corners would need `mergePaints`, and the
zone gate/off-palette accounting are dead weight for a deterministic fill. More moving parts, same result.

## D3. Preserve semantics — "runs, not isolated cells"

**Chosen: a preserve-set cell survives iff its same-material 6-connected component (over the full
occupancy, interior included) has size ≥ `minRun` (default 2).**

- A timber stud is a vertical line of `dark_oak_log` ≥2 voxels → component ≥2 → kept. A lone speck has a
  singleton component → filled. This is the AC's "runs, not isolated cells" with the weakest useful
  threshold; `minRun` is a knob, not a hard-coded magic.
- Components are computed in voxel space (not per-face grid) so a corner post shared by two elevations is
  one run, and a stud that continues into the wall interior still counts its full length.
- Per-zone preserve sets (cottage policy, derived from the E-21 map's non-field roles — see D5):
  - `base`: `cobblestone` (quoins/plinth), `dark_oak_log` (sill timber).
  - `upper`: `dark_oak_log` (the half-timbering — the signature secondary), `spruce_planks` +
    `dark_oak_planks` (roof-skirt/gable cells that geometrically classify `upper`; in-repo comments warn a
    spruce gable cell is a legit `upper` resident — plastering it would eat the roof edge).
  - `roof`: `dark_oak_planks` (eaves/verge), `cobblestone` (chimney shaft), `bricks` (chimney cap).
- **`stone_bricks` is deliberately NOT preserved in `upper`** — it is the material the fill exists to
  displace; it sits in large runs, so any run-based preservation of it would no-op the whole fix. Cost:
  legitimate stone window reveals in the upper band get plastered. Accepted and named (E-24 Rule 5 honesty);
  the splat re-places timber but not stone there, and reveal restoration is a T-087/S-087 pattern concern.

**Rejected — neighbor-count / per-face-grid runs**: equivalent at minRun=2 but doesn't generalize and
splits runs at face boundaries. **Rejected — orientation-aware line detection** (only vertical/horizontal
lines count): over-fits the cottage stud pattern; a diagonal brace would be salt-stripped.

## D4. Demoting the splat to secondaries (AC #2)

**Chosen: the fill runs first (on the sealed occupancy); the splat then runs on the *base-coated*
occupancy with per-zone palettes reduced to the zone's secondaries.**

New splat palettes (replacing today's generous `ZONE_MATERIALS`):
`base={cobblestone, dark_oak_log}`, `upper={dark_oak_log}`, `roof={dark_oak_planks, cobblestone, bricks}`.

Why the reduction is load-bearing, not cosmetic: the quantization collapse maps the concept's cream to
`stone_bricks` for most upper-band cells. Today `upper` allows `stone_bricks` ("window reveals"), so an
unreduced splat would **repaint the fresh plaster back to stone** — re-applying the 64% failure on top of
the fix. Removing each zone's dominant *and* other zones' field materials from the splat palette makes the
base coat un-overwritable by construction; the splat can only add timber/trim/chimney secondaries, which is
the story's thesis ("splat/LLM places secondaries only").

**Rejected — fill after the splat** (fill wins by ordering): makes the splat's work dead writes, breaks the
accept-gate semantics (the gate would score a pre-fill candidate), and inverts the epic's "base coat first,
details on top" composition. **Rejected — keep palettes, rely on paint-priority**: `mergePaints` priority is
source-based, not correctness-based; concept paint would outrank the fill.

## D5. Where the zone policy comes from

**Chosen: an explicit, commented `ZONE_POLICY` const in the runner — `{zone: {dominant, preserve, splat}}` —
derived from `material-map/cottage.json` roles, intersected with the build manifest at runtime.** This is
the existing pattern (`ZONE_MATERIALS` carries the same provenance comment). The map has no machine-readable
zone/dominant field (the storey association lives in role prose), so a programmatic derivation would be
fuzzy text-matching — rejected as false generality. T-086-01 (value-true selection) will later change *which
block* fills a role; keeping the policy a single visible const gives it one obvious seam to edit.
The pure core takes the policy as data — nothing cottage-specific in `src/`.

## D6. Producing the 9%→≈77% evidence by pipeline (AC #3)

**Chosen: a pure `surfaceZoneHistogram(occ, zoneOf)` in the new module** (per zone: total surface cells +
per-block counts), used by the runner to record, in `cottage.json`:
- `zones.coverage.splatOnly` — the *legacy* path replayed deterministically (sealed occ, no fill, old
  generous palettes) → upper plaster ≈9%;
- `zones.coverage.zoneFilled` — the shipped path (fill + secondary splat) → upper plaster ≈77%;
plus dominant-fraction summaries in `cottage.md`. No GL needed; both histograms are pure computation, so the
numbers appear even when headless GL is unavailable. The existing `zones.histogram` (masked/unmasked surface
*plaster counts*) and the §5b base/roof=0 throw are kept unchanged — `--offline` keeps validating. A
threshold/fail on coverage is **out** (T-088-01 owns the gate; it can consume `surfaceZoneHistogram`).

## D7. Gate interaction

The per-face accept-if-closer gate now measures the splat's *marginal* contribution over the base coat:
`before` renders the base-coated artifact, `after` renders base coat + face splat. The plaster
reversal check (`after > before && after > 8`) keeps its meaning with `before` counted on the sealed,
pre-fill artifact. `stripOffZonePlaster` keeps running (pre-existing base/roof plaster strays predate the
fill; the fill never emits plaster outside `upper` because only `upper`'s dominant is plaster).

## D8. Risks

- The measured upper plaster may land near-but-not-at 77% (the inline fix's preserve set was "stone→plaster,
  keep logs"; ours also fills isolated specks and preserves gable planks). AC says **≈77%** — report the
  honest number; investigate only if it diverges grossly (e.g. <60%).
- T-086-01 may edit `spray-paint.mjs` concurrently (block-choice seam). Mitigation: keep the policy const
  small and isolated; Lisa's lock serializes commits.
- `structuralZones` storeyDivide/upperTop on the *sealed* cottage must match the inline fix's band
  [7..14] — verified at runtime by the printed `storeyDivide` (existing log) before trusting coverage.
