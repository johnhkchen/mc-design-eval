# T-146-01 — Design

Goal: one **shared surface-relief op** that emits proud cells in front of existing shell cells
(generalised from `clinker`/`jetty`), recesses by exclusion (no air op), is PURE / byte-stable /
idempotent, preserves the in-plane silhouette and the E-34 proportion ruler by construction, ships a
relief-aware 2.5-D read, a preview card, and a no-regress harness gate.

## Decisions

### D1 — A new module `src/view/surface-relief.mjs`, NOT an extension of clinker
Clinker is a *named idiom* (lapped boards: alternating proud/flush courses, trim caps, shadow lines).
The relief op is the *general primitive* underneath it: "emit a proud strip in front of the skin on a
rhythm." Folding generality into `clinker.mjs` would (a) churn a record-pinned technique module and
(b) muddy a crisp idiom. A sibling module keeps clinker frozen and gives the registry a distinct brush
`surface.relief`. **Rejected:** generalising clinker in place (risk to its committed contract for zero
gain); adding relief to `idiom-constructs.mjs` (that file is spec→cells *constructs*, not occupancy→
placements *passes* — wrong kind).

### D2 — Signature mirrors the proven pass: `surfaceRelief(occ, opts) -> {placements, report}`
Same shape as `clinkerCourses`/`limewashAspect` so it drops into the registry `kind:"pass"` slot and
the preview `realize({occ,cells})` unchanged. `opts`:

```
{ material: string,                       // the proud block (required)
  faces?: ("+x"|"-x"|"+z"|"-z")[],        // default all four side faces
  rhythm: { axis: "column"|"row",         // pilasters (vertical strips) | courses (horizontal bands)
            every: int>=1, span?: int>=1, // period; strip thickness (default 1)
            phase?: int>=0 },             // offset of the first strip
  depth?: int>=1,                         // proud projection in cells (default RELIEF_DEFAULTS.depth=1)
  zoneOf?: (pos)=>string|null, zone?: string }  // optional zone restriction (clinker's lens)
```
`zoneOf` is **optional here** (clinker made it required because boards need a storey band). Relief is a
general primitive; when omitted the whole exterior of the named faces is eligible. This keeps it
subject-agnostic and the field-recess case trivially expressible. **Rejected:** a free predicate
`select(alongIndex,y)` callback — not JSON-schema-able for the registry `paramsSchema`, and harder to
prove byte-stable/idempotent in tests. A declarative `rhythm` with `axis/every/span/phase` covers both
pilasters and belt-courses and serializes cleanly.

### D3 — Proud emission = clinker's mechanism, verbatim invariants
For each named face, build the exterior skin with `projectSurface(occ, face)` (first-occupied-per-ray —
the one canonical lens, no refork). Iterate `[...occ.cells.entries()].sort()` for byte-stable order.
A cell is eligible if it is on the face skin, passes the optional `zoneOf===zone`, and falls on a strip
(`rhythm`). For an eligible cell emit `depth` cells outward along the face normal:
`out = pos + o*DIR[face]` for `o in 1..depth`; **`if (occ.has(out)) break`** (stop the strip — never
float past or tunnel into another mass; this is also the idempotency rule — re-run finds o=1 occupied
and emits nothing). Placement block = namespaced `material`.

**In-plane silhouette preserved by construction** (D-invariant, = clinker CL4 generalized): every proud
cell shares the (in-plane u,v) of an existing exterior cell, in front of it, so on that face's own
orthographic elevation the depth axis collapses → identical mask. Relief never emits past the rake
because it only emits in front of an existing exterior voxel. **Rejected:** emitting relief at the field
columns and *recessing the strips* by burying them behind a fill — that needs an air/remove op, banned
by [[facade-recess-by-exclusion]]. Recess is the **absence** of proud emission (D4).

### D4 — Recess by exclusion is a usage pattern, not an op feature
The op only ADDS. To read a recessed field, the caller leaves the field columns at the base plane and
relieves the *surround* (pilaster strips proud, field between them flush) — the field then reads
recessed relative to the pilasters. The report counts `fieldCells` (eligible skin cells left at plane)
so the recess is *observable* without an air op. The test proves: field columns receive **zero**
placements; only strip columns get proud cells. **Rejected:** a `mode:"recess"` that digs — no air op.

### D5 — Relief-aware read lives in `surface-grid.mjs` as `reliefProfile(grid)`
surface-grid already records per-cell `depth` and is a freely-importable core (not a TECHNIQUE), so a
read placed here is callable from workshop/gate/tests with no door violation, and co-locates with the
projection that produces depth. `reliefProfile(grid)`:
- compute the per-face **plane depth** = the modal `depth` over filled cells (the dominant wall plane);
- classify each filled cell: `proud` if `depth < plane` (closer to camera), `recessed` if
  `depth > plane`, else `flush`;
- return `{plane, proud, flush, recessed, max, byCell}` where counts are integers and `byCell` is a
  parallel grid of `-1|0|+1` (proud/flush/recessed) for the workshop to *see* structure.
Diagonal grids carry depth too, so the read works on the 45° azimuths the gate uses. **Rejected:**
putting the read in `structural-read.mjs` (it would then need surface-grid which it already imports, but
structural-read is about storey/footprint primitives; relief depth is a surface-grid concern — keep the
read next to its data). **Rejected:** putting it in `surface-relief.mjs` — that is a TECHNIQUE module
behind the door; a read consumed by the workshop must not be door-gated.

### D6 — The no-regress harness is an exported pure function + a test, not just asserts
`reliefNoRegress(occBefore, placements, {faces})` in `surface-relief.mjs` returns a verdict
`{inPlanePreserved: bool, ratiosPreserved: bool, perFace: [...], detail}`:
- builds `occAfter` = occBefore + placements;
- for each relieved face, projects the **own-face elevation** of before/after (via
  `elevationMask` along that face's normal axis) and asserts the mask bytes are identical, and that
  `maskProportions(maskBefore)` deep-equals `maskProportions(maskAfter)`;
- asserts whole-build `proportionRatios` `ridgeToEave` and `roofShare` are byte-identical (heights);
- records (does NOT fail on) the perpendicular-extent / `aspect` widening as `expectedWidening` — that
  is honest visible relief, explicitly outside the byte-unchanged claim (research §"the ruler").
The function is **the acceptance gate**: relief that moves the in-plane mask or the height ratios
returns `inPlanePreserved/ratiosPreserved=false`, and the test fails. Exporting it (not burying it in a
test) lets a future relief-aware gate (S-148/T-148) reuse the same predicate. It imports
`silhouette-proportion.mjs` (a metrics module, NOT a TECHNIQUE — free to import) and `occupancy.mjs`.

### D7 — Registry entry `surface.relief` (the door) + conformance
Add `kind:"pass"` entry mirroring clinker: `fn: surfaceRelief`, `composition {consumes:["occupancy"],
emits:["placements","report"]}`, `preview` with a `shell` substrate and a `realize` that relieves a
pilaster rhythm on one face (so the card shows proud strips over a flush field — the recess read),
`paramsSchema` over `{material, faces, rhythm, depth}`. Add `"surface-relief"` to `TECHNIQUES` in
`brush-door.conformance.test.mjs`. No allowlist entry needed — only the door imports it. **Rejected:**
exporting `surfaceRelief` from an existing allowlisted runner — that is the anti-pattern the door
forbids; register a brush instead ([[brush-door-export-not-allowlist]]).

### D8 — Defaults are named frozen constants
`RELIEF_DEFAULTS = Object.freeze({ depth: 1, span: 1, phase: 0 })`. No subject tuning; the rhythm
`every` is always caller-supplied (there is no universal pilaster period). Mirrors
`IDIOM_CONSTRUCT_DEFAULTS` / `PROPORTION_DEFAULTS`.

## Why this satisfies the ACs
- **AC1 shared op through the door**: D1/D2/D3/D7 — proud emission generalised from clinker/jetty,
  recess-by-exclusion (D4), PURE, byte-stable (sorted iteration), idempotent (break-on-occupied),
  parametrized by face/rhythm/depth/material, registered as `surface.relief`.
- **AC2 silhouette preserved + no-regress harness gate**: D3 invariant + D6 `reliefNoRegress` proving
  the own-face mask and `maskProportions` and the height ratios byte-unchanged.
- **AC3 2.5-D reads relief**: D5 `reliefProfile` consumes the depth field; documented as a
  construction-stage capability, never a workshop paint air-op (the no-air-op rule stands for paint).
- **AC4 preview card + tests + green + repro**: D7 preview, new test file mirroring clinker.test.mjs,
  additive registry edits keep `--repro`/`--offline` byte-identical, defaults frozen (D8).

## Risks
- **Skirt-detector interaction** ([[proportion-eave-latches-plinth]]): a relief band at the silhouette
  bottom could read as a skirt on the *perpendicular* view. Mitigation: the harness only claims the
  **own-face in-plane** mask byte-unchanged; perpendicular widening is recorded, not gated. Documented.
- **Shared-file races** ([[shared-file-commit-sweep]], [[pack-edit-blast-radius]]): re-Read
  registry/conformance before each Edit; verify full `npm test` before committing.
