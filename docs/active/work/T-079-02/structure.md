# T-079-02 — Structure: file-level changes

The blueprint. Six files: two pure cores, two runners, two test files, one journal. No deletions.

---

## 1. `src/view/structural-read.mjs` — MODIFY (add `structuralZones`)

New pure export, appended after `structuralRead`. No change to existing functions.

```js
/**
 * Structural ZONES for material masking — classify a voxel into "base" | "upper" | "roof".
 * Derived from GEOMETRY (floor lines + the top-exposed roof shell), NOT current dominant blocks, so it
 * survives a material collapse (the raw cottage's plaster has already collapsed to stone). The spray-
 * paint zone-mask gate consumes `zoneOf`; the runner maps zones → allowed materials.
 *   • roof  — voxel is a roofRegion (+y top-exposed) cell. Membership, not a y-threshold (the pitched
 *             roof's y-range overlaps the walls').
 *   • upper — not roof and y >= storeyDivide (the upper-storey wall band).
 *   • base  — y < storeyDivide (the lower stone base).
 * storeyDivide = floorLines[1] (floor OF the upper storey) when present, else min y + baseHeight.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{storeyDivide?:number, baseHeight?:number, floorFillThreshold?:number}} [opts]
 * @returns {{zoneOf:(voxel:number[])=>("base"|"upper"|"roof"), storeyDivide:number,
 *            roofKeys:Set<string>, floorLines:number[]}}
 */
export function structuralZones(occ, opts = {}) { ... }
```

Internals: `roofRegion(occ)` → `roofKeys = new Set(cells.map(c => `${c.x},${c.y},${c.z}`))`;
`storeyBands(occ, opts).floorLines`; `storeyDivide = opts.storeyDivide ?? (floorLines.length >= 2 ?
floorLines[1] : (occ.bounds ? occ.bounds.min[1] : 0) + (opts.baseHeight ?? 6))`. `zoneOf` reads
`voxel = [x,y,z]`, returns `"roof"` on roofKeys hit, else `y >= storeyDivide ? "upper" : "base"`.
Pure — no GL/IO/Date/random. Reuses the existing `roofRegion`/`storeyBands` (no new geometry rules).

**Boundary:** the function returns the *classifier + boundaries* only. It does NOT know cottage
materials — that policy is the runner's. One geometry definition, no subject baked into `src/view`.

---

## 2. `src/view/face-paint.mjs` — MODIFY (`paintFace` zone gate)

Extend the `paintFace` signature and the `PaintPass` typedef. Backward compatible: zone args optional.

- **Typedef** `PaintPass`: add `@property {number} zoneRejected  target cells dropped for being
  disallowed in the cell's structural zone`.
- **Signature:** `paintFace(occ, dir, targetGrid, { allowed, source = "concept", zoneOf, allowedByZone
  } = {})`.
- **Body:** initialise `let zoneRejected = 0;`. Inside the per-cell loop, *after* the existing
  `allowed.has(bareTarget)` off-palette check and *before* the no-change check:
  ```js
  if (zoneOf) {
    const zoneAllowed = allowedByZone?.get(zoneOf(cell.voxel));
    if (!zoneAllowed || !zoneAllowed.has(bareTarget)) { zoneRejected++; continue; }
  }
  ```
- **Return:** add `zoneRejected` to the returned object.
- **Guard (parity with `allowed`):** if `zoneOf` is given, require `allowedByZone instanceof Map`
  (throw a clear error otherwise) — same defensive style as the existing `allowed instanceof Set` check.

`mergePaints` / `applyPaint` unchanged. The zone gate is purely additive — when `zoneOf` is absent the
function behaves exactly as today, so the five existing `face-paint.test.mjs` cases pass unmodified.

---

## 3. `benchmarks/sculpture/spray-paint.mjs` — MODIFY (seal-first, zone mask, proof)

Impure runner. Changes, in order through `main()`:

1. **New imports:** `sealRoof, sealWalls, applyDeltas` from `../../src/view/surface-coherence.mjs`;
   `structuralZones` from `../../src/view/structural-read.mjs`.
2. **Zone-materials config** (module const, cottage policy ∩ manifest is built at runtime):
   ```js
   const ZONE_MATERIALS = {
     base:  ["stone_bricks", "cobblestone", "dark_oak_log"],
     upper: ["white_terracotta", "dark_oak_log", "stone_bricks"],
     roof:  ["spruce_planks", "dark_oak_planks", "cobblestone", "bricks"],
   };
   ```
3. **Seal before paint:** after `const artifact = ...raw`, compute
   `const sealed = applyDeltas(artifact, [...sealRoof(rawOcc).placements, ...sealWalls(rawOcc).placements]);`
   then `const occ = artifactOccupancy(sealed);` and use `sealed`/`occ` everywhere downstream (the
   `before` counts, projections, paint, render, record). Record both the raw and sealed placement
   counts.
4. **Build the mask:** `const { zoneOf } = structuralZones(occ);` and
   `const allowedByZone = new Map(Object.entries(ZONE_MATERIALS).map(([z, m]) => [z, new Set(m.filter(b => allowed.has(b)))]));`
5. **Zone-masked paint:** pass `{ allowed, source, zoneOf, allowedByZone }` to both `paintFace` calls.
   Log `zoneRejected` alongside `offPalette`.
6. **Twice-paint histogram (the proof):** also run an *unmasked* front+side paint (no `zoneOf`) and
   compute a per-zone **surface** plaster histogram for masked vs unmasked. Helper `surfacePlasterByZone
   (occ, paintedArtifact, zoneOf)` projects the 5 surface faces, classifies each painted-plaster surface
   voxel by zone, tallies `{base, upper, roof}`. Record both columns.
7. **Throw-on-violation:** after building the final `painted`, assert
   `histAfter.base === 0 && histAfter.roof === 0` else `throw new Error("zone violation: plaster on
   base/roof surface")`.
8. **Record:** extend `spray-paint/cottage.json` with `zones: { storeyDivide, materials: ZONE_MATERIALS,
   histogram: { masked, unmasked }, interiorStrays }` and `sealed: { raw: N, sealed: M }`; add
   `zoneRejected` per face. Update `renderMd` to print the histogram + the seal-first note.
9. **Refine note:** reword to state the structural invariant (zone mask + throw) is the guard; refine
   stays optional.
10. **`--offline`:** keep; extend the reversal check to also require `rec.zones.histogram.masked.base ===
    0 && .roof === 0` when the field is present.

---

## 4. `benchmarks/sculpture/hollow-cottage-milestone.mjs` — MODIFY (reorder + mask + assets)

1. **New imports:** `structuralZones` from structural-read.
2. **Reorder STAGE 1↔2 → seal first:**
   - Move the seal block (`sealRoof`/`sealWalls`/`applyDeltas`) to run on the **raw** occupancy,
     producing `sealed`/`sealedOcc`, *before* the paint block.
   - Run spray-paint on `sealed`/`sealedOcc` (not `raw`): projections, `structuralZones(sealedOcc)`,
     `allowedByZone`, both `paintFace` calls with the zone mask, `mergePaints`, `painted =
     applyPaint(sealed, merged.placements)`.
   - `paintedOcc = artifactOccupancy(painted)` feeds STAGE 3 (hollow) directly — the separate post-paint
     seal is gone (sealing already happened).
3. **Reuse the same `ZONE_MATERIALS`** const (define once near the top, mirroring spray-paint).
4. **Throw-on-violation:** same surface-plaster-by-zone assertion after `painted` is built.
5. **Watertight note:** `watertightCheck` now runs on `sealedOcc` (pre-paint) — paint is a recolor, so
   watertightness is identical before/after paint; keep the check, note it measures the sealed shell.
6. **Assets:** unchanged wiring — `copyIf(faceAfter.path, "cottage-face-after.png")` + the multi-angle
   montage already refresh `pr/assets`; they now reflect the zone-clean skin.
7. **Report:** add `zones` (storeyDivide + histogram) to the `exteriorResemblance` gate block; update the
   residual prose to reference the band mask.

---

## 5. `src/view/structural-read.test.mjs` — MODIFY (zone tests)

Add `structuralZones` to the import line. Add a test using the existing ring/slab helpers: a build with
a stone base (rings y0–2), a slab floor (y3), upper walls (rings y4–6), and a flat roof (slab y7) →
assert `zoneOf` returns `"base"` for a y1 wall voxel, `"upper"` for a y5 wall voxel, `"roof"` for a
top-exposed y7 voxel, and that `storeyDivide` equals the second floor line. Pure; runs under `npm test`.

---

## 6. `src/view/face-paint.test.mjs` — MODIFY (zone gate)

Add one test (reusing `cube`, `fillTarget`, `ALLOWED`): build a `zoneOf` that maps the cube's lower half
to `"base"` and upper half to `"upper"`, and `allowedByZone = Map{ base→Set(["stone_bricks"]),
upper→Set(["white_terracotta"]) }`. Paint a `white_terracotta` target over the `+x` face; assert plaster
is painted only on upper-half voxels, base-half cells are counted in `zoneRejected`, and (a roof-style
zone with no plaster) rejects plaster. Confirms: base rejects plaster, upper accepts, roof rejects (AC #1).

---

## 7. `docs/knowledge/design-learnings.md` — MODIFY (correction note)

Append a short correction inside the E-23 section: the color-only splat (T-079-01 shipped) was more
sophisticated but **worse** than the band-masked POC because it dropped the structural constraint —
**splat must be ∩ structural-zone**; color picks the block within a zone, the structural read picks the
zone. Link the learning slug `twodee-interaction-sector`.

---

## Ordering & interfaces

- **Cores before runners:** `structuralZones` + `paintFace` zone gate land first (with their unit
  tests), then the runners consume them. The runners cannot be green until the cores exist.
- **Public interface added:** `structuralZones(occ, opts)`; `paintFace(..., {zoneOf, allowedByZone})` +
  `PaintPass.zoneRejected`. Both additive — no existing caller breaks.
- **No schema change:** paint stays a recolor; `assertArtifact` still validates the painted build.
- **No new dependency.** Everything reuses existing pure modules.
</content>
