# T-079-02 — Design: paint = splat ∩ structural-zone, on the sealed surface

**The fix in one line (from the ticket):** paint with **splat ∩ structural-zone**, on the **sealed**
surface — *color* chooses which block within a zone, the *structural read* chooses which zone allows it.

Four root causes, four design decisions. Each grounded in the Research map.

---

## D1 — Where the zone mask lives: a pure `zoneOf` from the structural read (RC1)

**Decision.** Add a pure `structuralZones(occ, opts)` to `src/view/structural-read.mjs` that returns a
classifier `zoneOf(voxel) → "base" | "upper" | "roof"`, plus the derived boundaries. `paintFace` gains
an optional zone gate. The cottage-specific *zone→materials* policy lives in the runner, not the core.

**Zone derivation (geometric, from primitives that already exist):**
- **roof** — `voxel ∈ roofRegion(occ).cells` (top-exposed +y surface). Membership, not a y-threshold:
  the pitched roof's y-range (eaves y7 … ridge/chimney y26) *overlaps* the wall y-range, so any single
  threshold would misclassify either eaves or gable. Membership is exact.
- **upper** — not roof, and `y ≥ storeyDivide`. `storeyDivide = floorLines[1]` (= 7 for the cottage:
  the floor *of* the upper storey = top of the stone base). Falls back to `minY + baseHeight` (default
  6, the design-doc base height) when fewer than two floor lines exist.
- **base** — everything else (`y < storeyDivide`, not roof).

This matches the design-doc's three bands (base y0–6 / upper y7–13 / roof y14+) and the measured
`floorLines [0,7,14]` exactly. The gable triangle wall faces ±z/±x (not top-exposed), so it classifies
**upper** — correctly plaster-eligible, as a Tudor gable should be.

**Why a classifier, not a baked target rewrite.** Keeping `zoneOf` a pure function of the *voxel* (not
the face grid) means it works for the front (+z), the side (+x), and any future face identically, and is
trivially unit-testable on a synthetic build. The split — geometry in `src/view/*`, the cottage's
material policy in the runner — mirrors how `palette-cans` keeps the *membership oracle* pure while the
*manifest* is the artifact's.

**Rejected:** deriving zones from `storeyBands.bands` dominant blocks. The raw build's plaster has
already collapsed to stone, so the *current* dominant-block bands encode the wrong materials, not intent
(Research RC1/measured bands). Zones must come from **geometry** (floor lines + roof shell), which
survives the material collapse.

---

## D2 — How the mask is applied in `paintFace`: a second, independent gate (RC1)

**Decision.** `paintFace` accepts `{ zoneOf, allowedByZone }` (both optional; absent ⇒ today's
behaviour, all existing tests untouched). Per cell, after the existing global-palette gate:

```
allowedHere = allowedByZone.get(zoneOf(cell.voxel)) ?? EMPTY_SET     // zone's materials
if (!allowed.has(bareTarget))      { offPalette++;  continue }       // global palette (unchanged)
if (zoneOf && !allowedHere.has(bareTarget)) { zoneRejected++; continue } // NEW: zone mask
```

`zoneRejected` is a new counter on `PaintPass`, **logged like `offPalette`** (the ticket's wording). The
two gates are independent: global palette = "is this block in the build's manifest at all", zone mask =
"is this block legal in *this* part of the build". `allowedHere` is the *intersection* the ticket asks
for — `allowed ∩ zoneAllowed` — because the runner builds `allowedByZone` as each zone's materials ∩ the
manifest.

**The cottage zone→materials policy (runner, derived from `material-map/cottage.json` roles ∩ manifest):**
- **base** → `{stone_bricks, cobblestone, dark_oak_log}` (coursed stone + quoins + sill timber)
- **upper** → `{white_terracotta, dark_oak_log, stone_bricks}` (plaster + timber frame + window reveals)
- **roof** → `{spruce_planks, dark_oak_planks, cobblestone, bricks}` (roof courses + chimney)

The **binding invariant** is `white_terracotta ∈ upper only`. base and roof exclude it → a plaster
target there is `zoneRejected`, never painted (AC #1: "a target landing in a disallowed zone is
rejected, not painted"). The other materials are allowed generously per zone so legitimate recolors
(stone on the base, planks on the roof) still happen — the fix *removes* the smear, it does not freeze
the skin.

**Rejected:** a single global "plaster band [y7,y13]" predicate. It would work for the cottage but bakes
one subject's numbers into `paintFace`; the `zoneOf` + `allowedByZone` pair is general (any zoned build)
while keeping `paintFace` subject-agnostic.

---

## D3 — Seal before paint (RC3)

**Decision.** Both runners seal **first**, then paint the sealed occupancy.

- **Standalone `spray-paint.mjs`:** after loading raw, compute `sealed = applyDeltas(raw, [...sealRoof
  (occ).placements, ...sealWalls(occ).placements])`; derive `sealedOcc`; do *all* downstream work
  (zones, projection, paint, gate) on `sealed`/`sealedOcc`. Self-contained — seal inline rather than
  reading T-084's committed artifact, so the runner has no cross-ticket file dependency.
- **Milestone `hollow-cottage-milestone.mjs`:** reorder the chain from *paint → seal → hollow →
  floorplan* to **seal → paint → hollow → floorplan**. Sealing first gives paint a complete, stray-free
  skin; the strays the old order painted (→ floating pink blocks) are stripped *before* paint runs.
  Hollow/floorplan are geometry-interior ops and are unaffected by the reorder (they preserve the
  painted skin; `exteriorHeld` already proves it).

**Why inline-seal over loading the sealed artifact:** the sealed artifact is a *derived* file in another
ticket's work dir; re-deriving from raw keeps spray-paint reproducible from one input and avoids a stale
coupling. `applyDeltas` + the seal ops are pure and cheap.

**Rejected:** "exclude the stray set" (the ticket's alternative). Sealing also closes skin *holes*, so
the full seal is strictly better than a stray-only exclusion and is what the milestone already trusts.

---

## D4 — Gate not fooled: a structural post-check that THROWS (RC4)

**Decision.** The zone mask makes off-zone paint impossible *by construction* (D2) — that is the primary
guard. On top of it, both runners add a **hard structural assertion**: after merging the accepted paint,
recount **surface** plaster per zone; if any `white_terracotta` lands on a **base** or **roof** surface
cell, **throw** (mirroring the milestone's `exteriorHeld` throw — "must never silently pass").

This is the ticket's option "have the per-face accept-gate reject a paint that violates a zone": a
marginal `0.25→0.40` resemblance number can no longer ship a zone-wrong skin, because a zone-wrong skin
cannot be produced (mask) and would crash the run if it somehow were (assertion). The resemblance gate
(`acceptIfCloser`) keeps its existing job — decide whether the *zone-clean* paint moves toward the
concept — but it is no longer the thing standing between us and a pink blob.

Refine stays optional (`--refine`); we state plainly that the structural invariant, not the metered
refine, is the guard. This is sound because the failure mode (RC1) was *structural*, not a missing
human-in-the-loop pass.

**Rejected:** wiring the metered LLM refine as the fix. It is orthogonal to the zoning bug and adds cost
+ nondeterminism for no coverage of the actual defect.

---

## D5 — The measurable & visual proof (AC #2, #5)

- **Per-zone plaster histogram, before/after the fix.** The runner paints the sealed build **twice** —
  once **without** the zone mask (the old smear) and once **with** it — and reports plaster counts per
  zone (base / upper / roof) for each, over **surface** cells. Expected: without-mask spreads plaster
  across base+upper+roof; with-mask → base 0, roof 0, all plaster in upper. This *is* the fix's proof
  and is honest about being a surface (skin) measurement.
- **Interior strays** (5 pre-existing `white_terracotta` voxels not on any face) are reported separately
  and explicitly excluded from the skin measurable — paint/seal cannot reach them and they are not the
  visible defect.
- **Visual:** re-render cottage front (+z) + side (+x) before/after; re-run `npm run milestone:cottage`
  to refresh `pr/assets/cottage-face-after.png` + `cottage-multi-angle.png`. Saved to the work dir.

## D6 — Journal correction (AC #6)

Add an honest correction note to `docs/knowledge/design-learnings.md` (E-23 section): the color-only
splat was *more sophisticated but worse* than the band-masked T-079-01 POC because it dropped the
structural constraint — **splat must be ∩ structural-zone**. Color picks the block within a zone; the
structural read picks which zone allows it.

## Summary of changes the Structure phase will detail

1. `structural-read.mjs` — add pure `structuralZones(occ, opts)`.
2. `face-paint.mjs` — `paintFace` gains `{zoneOf, allowedByZone}` + `zoneRejected` counter.
3. `spray-paint.mjs` — seal-first; zone mask; twice-paint histogram; throw-on-violation.
4. `hollow-cottage-milestone.mjs` — reorder to seal→paint; zone mask; throw-on-violation; refresh assets.
5. Tests — `structural-read.test.mjs` (zones), `face-paint.test.mjs` (zone gate: base rejects plaster,
   upper accepts, roof rejects).
6. `design-learnings.md` — correction note.
</content>
