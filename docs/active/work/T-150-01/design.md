# T-150-01 Design — envelope-then-covering

Decisions grounded in research.md. The construction model changes from **prism-on-prism** (a solid
roof-material triangle dropped on the wall box) to **envelope-then-covering** (wall envelope incl.
gable-end walls; roof = sloped skin with overhang).

## The core insight that keeps this small

For a gable, `gableSurfaceHeight` depends only on the run coordinate, so the volume is one extruded
triangle. The "gable-end triangular face" is exactly the **outermost slice along the ridge axis**
(columns at `bbox.minX`/`bbox.maxX` for ridge=x). The fix is **silhouette-neutral for the existing
cells**: the same cells stay occupied; only the **material** of the gable-end-slice sub-surface cells
and their **zone** change (roof→wall). The overhang (AC3) is *additive* honest widening, kept
separate. This means the change is local to three pure cores + the compiler, opt-in for byte-identity.

## Approach chosen

### A. Gable-end-as-wall (AC1) — emit + tag in `generateRoof`, opt-in via `opts.gableBlock`

`generateRoof(gables, family, opts)` gains `opts.gableBlock` (a namespaced wall block id). When
present:
- A column is a **gable-end column** when, for its owning gable with `hip.demanded === false`, its
  ridge-axis coordinate equals `bbox.minX`/`bbox.maxX` (ridge=x) or `bbox.minZ`/`bbox.maxZ` (ridge=z).
  (Hip ends have no vertical triangular face — excluded, named.)
- For a gable-end column, the **sub-surface fill cells** (`floor .. top-1`, and any cell that is NOT
  the covering surface) are emitted with `block: opts.gableBlock` and their keys added to a new
  returned `gableWallKeys` Set. The **covering surface** cell (the top stair/slab/full, the cap, the
  verge edge) stays `family.field`/shaped — it is the roof rake, not wall.
- When `opts.gableBlock` is absent → **identical legacy emission** (no new branch taken,
  `gableWallKeys` empty). This guarantees byte-identity for every current caller and committed record.

Return shape adds `gableWallKeys: Set<string>` ("x,y,z").

### B. Roof-as-covering + zone classification (AC2) — `gableWallKeys` flows to `zoneOf`

`zonesFromBands` and `structuralZones` gain an optional `gableWallKeys` arg (default empty Set). In
`zoneOf`, **before** the `y >= upperTop || roofKeys` roof clause, check
`if (gableWallKeys.has(key)) return <wall band for y>`. The wall band is resolved by the existing
band y-range walk (zonesFromBands) / `y >= storeyDivide ? "upper" : "base"` (structuralZones). The
sloped covering cells are untouched → still roof. The slopes' pitch/eave/ridge are byte-unchanged
(the covering emission is identical), so `maskProportions` + `reliefNoRegress` see no slope movement.

### C. Overhang (AC3) — reuse the generator `sheet` + compile verge widening, no per-building constant

Two honest-widening additions, both pack/recognition-carried (no constant in source):
1. **Eave drip + gable verge widening** at the compiler: extend the existing eave-widening
   (compile.mjs:226-231) to also widen the **verge** (gable-axis ends) by the pack-carried overhang
   amount, AND mark the widened perimeter ring as **sheet** so the underside is open (a real
   overhang, not a solid lip). The amount comes from the pack roof idiom params (a pack field, e.g.
   `params.overhang`), defaulting to the current 1-cell eave widen when absent → byte-identical.
2. The `sheet` machinery (roof-generate.mjs:271, provision-generate.mjs:128-132) already opens the
   underside and excludes those columns from walls; we feed it the perimeter ring.

Because the overhang course *is* wider than the wall, `maskProportions` will read it as the eave line
(research §E-34). That is architecturally correct (the overhang IS the eave). We **record the reading
both ways** (overhang-present eave row vs wall-plane eave row) rather than fight the ruler — AC3's
explicit instruction.

**Scope guard:** to honour "scoped to the barn" and protect committed multi-gable records, the
compiler emits `gableBlock`/verge-overhang **only for a single clean gable end** — a `roof.gable`
(or `roof.gable.steep`) mass whose ridge reaches the footprint edge (`hip.demanded` false at fit).
The cottage's intersecting gables (cross-gable valleys) are *not* clean ends and keep legacy output.
This is a principled geometric distinction, not a per-building key.

### D. Hollowness (AC4) — unchanged

The loft stays hollow via the existing carve path. The gable-end-wall cells are the **outermost
slice** (the shell), never interior fill, so they are part of the envelope by construction. No carve
change needed; we verify the carve still leaves the gable slice intact.

## Options considered & rejected

1. **Move gable-end walls into `provision-generate` mass extrusion (extrude walls up into the
   triangle), roof emits covering only.** *Rejected:* large rewrite of the mass loop (walls extrude to
   `wallTop=eaveY`; the triangle is above), risks every committed generated record, and duplicates the
   surface-height math the roof already owns. The chosen approach keeps one geometry owner
   (`gableSurfaceHeight`) and is silhouette-neutral.
2. **Carve the gable-end fill to a 1-cell shell and let the wall skin paint it.** *Rejected:* changes
   occupancy/silhouette (AC1 demands silhouette-neutral, same cells occupied) and reopens hollow/seal
   concerns. Material+zone retag achieves the read without moving cells.
3. **Resolve `gableRole` always in the compiler and pass for every subject.** *Rejected:* breaks
   cottage byte-identity. Opt-in + single-clean-end scope protects committed records.
4. **Recolour the gable end purely in zone-fill (no generator change).** *Rejected:* the generated
   manifest would still ship the gable in roof material (palette-discipline / coverage census would
   not see the wall material present), and the deterministic generate-first artifact would still be
   "roof". The material must be authored at generation, then zone-classified consistently.
5. **A new `eaveOverhang` relief pass post-realize (like the S-147 brushes).** *Partially adopted as
   fallback:* `surfaceRelief`-based soffit is the right tool for a *drip course* on an already-built
   eave, but the generator `sheet` ring is the right tool for the *covering projection* (open
   underside, wall-exclusion). We use the generator ring for the structural overhang and leave the
   relief brush available for a decorative soffit (documented, not required for the glance).

## Why this satisfies the ACs

- **AC1** gable end in `gableBlock` (default wall ground), tagged `gableWallKeys`, zoned wall.
- **AC2** covering emission byte-unchanged → slopes byte-identical under the ruler + silhouette gate.
- **AC3** overhang from pack-carried amount (no constant), eaves + verge, open underside; ruler
  interaction recorded both ways.
- **AC4** outermost-slice walls are shell; hollow carve untouched.
- **AC5** deterministic; `npm run generated:barn` (+ `diff:roof`) produces the sheet — operator/GL
  step (judge-free, the established E-35 runbook pattern). Core proven in `npm test`.
- **AC6** design-learnings note + review.md + unit tests (gable-end material, covering-only, overhang,
  slope no-regress) + green suite, opt-in keeps no-per-building-constant + byte-identity.

## Risks

- **Compiler change touches real subjects.** Mitigated by the opt-in + single-clean-end scope; `npm
  test` is the gate. Expect to regenerate any committed *barn* generate fixtures via the production
  functions (never hand-edit; the "pack edit blast radius" lesson).
- **Overhang vs ruler.** Recorded both ways; no gate is moved (the slope ratios are what
  `reliefNoRegress` protects, and they don't change).
- **GL sheet** is operator-run; review.md will name the exact command and that it is deferred.
