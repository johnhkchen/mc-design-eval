# T-179-01 — Structure: file-level changes

The blueprint. Two source edits (one module, additive), one test edit (extend + one rewrite), one new
witness runner, one new spec witness. No instrument / chain / pin files touched.

## 1. `src/view/treatment-grammar.mjs` (MODIFIED — additive, one rewired layer)

### 1a. NEW `deriveRakingVerge(occ, opts)` — the profile primitive for the gable rake

Placed after `deriveRoofEdges` (it is its sibling; shares the band convention).

```
export function deriveRakingVerge(occ, { ridgeAxis, eaveY, ridgeY } = {})
  → { rakeCells: string[]        // sorted "x,y,z" — the top cell per across-coord, both gable ends
      byEnd: { [endCoord:number]: string[] }   // rake cells grouped by the ridge-axis end value
      faces: string[]            // ["+x","-x"] for ridge=x; ["+z","-z"] for ridge=z
      curve: boolean             // per-across top-y is non-constant (a true rake)
      band: { yLo, yHi } }
```
Logic: band `[eaveY+1, ridgeY]`; ridge-axis extrema = the gable ends; per end, `Map(across → maxY)` over
band cells at that end value; rake cell = `${...} ` at maxY. `curve` = the maxY values vary. Fail-loud on bad
`ridgeAxis`/band (mirror `deriveRoofEdges`). PURE; JSON-round-trippable.

### 1b. NEW `deriveArchHead(aperture)` — the profile primitive for the opening crown

Placed after `deriveOpeningEdges`.

```
export function deriveArchHead(aperture)
  → { crown: {au,av}[]      // per opening column, the highest air cell toward the lintel (the soffit edge)
      voussoirs: {au,av}[]  // the bordering solid one step toward the lintel (the wedge stones to recolor)
      curve: boolean        // crown av varies across columns (arch) vs constant (flat lintel)
      side: "top" }
```
Logic: head side = toward the lintel (min `av`, lintel sits at `v0-1`); group `aperture.cells` (air) by `au`;
crown = min-av air per column; voussoir = `{au, crownAv-1}`. `curve` = crown av set size > 1. Fail-loud on a
missing aperture. PURE.

### 1c. REWIRE the verge layer in `composeRoofTreatment`

Replace the `vergeColumns` 2-D-keyed `surface.relief` (the heavy band) with a `deriveRakingVerge` 3-D-keyed
one:
- `const rake = deriveRakingVerge(occ, ctx);`
- `surface.relief` with `faces: rake.faces`, `zoneOf: pos => rakeSet.has(pos.join(",")) ? "verge" : null`,
  `rhythm: { axis:"row", every:1, span:1 }`, `depth:1`.
- Report line: drop `leak`, add `profile:"raking", rakeCells: rake.rakeCells.length, curve: rake.curve,
  resolves:"<the sloped-line leak — top-cell-per-across profile, not a flat band>"`.
- Keep `edges` in the return shape; optionally surface `rake` under `report`. Closure guard unchanged.

### 1d. EXTEND `composeTreatment`'s opening layer (optional voussoir recolor)

In the `E.opening` branch, when `E.opening.voussoir` is a block id AND the dressing seam is injected: for each
aperture, build `deriveOpeningEdges(ap)`; if `isArch`, `deriveArchHead(ap)` → recolor the voussoir stones with
`E.opening.voussoir` at their solid wall-plane depth. Depth via an injected `probeHead`/reuse of
`dressOpenings`' output region — **no new import** (the seam stays injected; if absent, the voussoir path is
skipped, exactly like the existing `skipped:"no dressing seam injected"`). Record
`byLayer.opening.voussoirs: N` and `arches: M`. The flat path is byte-unchanged.

> Keep 1d minimal and seam-injected so `treatment-grammar` stays pure. The world-space recolor helper lives in
> the witness runner (it owns the occupancy + depth probe); the *derivation* is the unit-tested part here.
> Decision recorded in design.md option 4.

## 2. `src/view/treatment-grammar.test.mjs` (MODIFIED)

- **TG16 REWRITE** — was "the verge layer records the sloped-line leak". Now: the verge is a crisp rake —
  `byLayer.verge.profile === "raking"`, `verge.placed === rakeCells.length`, and **strictly fewer** cells than
  the old full-gable-end-band count (compute the band count inline and assert `<`). Closure still ok.
- **NEW TG21** `deriveRakingVerge/ridge-x` — on `gableBoxStub`, rake cells trace the triangle top edge
  (top-y per z: 5,6,7,6,5 across z=0..4 at each end); `curve === true`; both ends present; JSON round-trips.
- **NEW TG22** `deriveRakingVerge/ridge-z` — verge faces + rake swap to the z-ends (geometry, not assumed-x).
- **NEW TG23** `deriveRakingVerge/flat-shed` — a mono-pitch / flat band → `curve === false` (the honest
  degenerate; the profile primitive does not invent a rake).
- **NEW TG24** `deriveArchHead/arch` — synthetic arched aperture (crown av varies per column) → `curve===true`,
  voussoirs trace the arc, monotone toward the keystone.
- **NEW TG25** `deriveArchHead/flat` — rectangular aperture → `curve===false`, crown is a single row
  (degenerate; equals the flat lintel — the unification).
- **NEW TG26** `composeTreatment opening voussoir` — with an injected seam stub returning an arched aperture,
  the voussoir recolor places head cells; without the seam, skipped gracefully (mirror TG11).

## 3. `experiments/eval-alignment/treatment-verge-voussoir-beside.mjs` (NEW witness runner)

Sibling of `treatment-sourced-beside.mjs`. Loads the faithful gatehouse, sources the spec (adds a
`roof.edge` + `edges.opening.voussoir` if absent), composes the **wall** treatment, then the **roof** treatment
with the **rake verge**, then applies the **voussoir head** recolor via the injected `extractApertures`/
`dressOpenings` seam + the head-recolor helper. Renders the **−x gable elevation** (where both the rake and the
arched gate read) beside the concept with `renderBesideConcept`. Asserts `closure.ok` on every build.
`assertGlAvailable()` first (fail loud, the render-every-loop rule). Output → `docs/active/work/T-179-01/`:
- `verge-voussoir-beside.png` — the headline witness (rake + arch head on the −x elevation, beside concept).
- prints rake-cell count, `curve`, voussoir count, and the old-band-vs-rake delta to stderr (the glance log).

## 4. `docs/active/work/T-179-01/gatehouse.vergehead.treatment.json` (NEW artifact)

The sourced spec actually composed (with `roof.edge` + `edges.opening.voussoir`), written by the runner — the
serializable witness that the new edges flow through the same spec (S-176 consistency).

## Ordering

1. 1a + 1b (pure derivations) → TG21–TG25 (prove them on synthetic geometry) → commit.
2. 1c (rewire verge) → TG16 rewrite → commit.
3. 1d (opening voussoir) → TG26 → commit.
4. Runner (3) → render → spec witness (4) → commit.

Each step keeps `npm test` green before the commit (the shared-file-commit-sweep rule: re-read, additive,
verify green).

## Out of scope (named)

- Promoting the voussoir recolor into `opening-dressing.mjs` / the styled chain (blast radius; design opt 4).
- Multi-ridge / valley rakes beyond the single gable (the derivation handles both ends of one ridge; a hip or
  cross-gable is a follow-on — recorded if the gatehouse needs it, it does not).
- The metered self-concept re-score (the judge is the render; spend is gated, as in T-176-01).
