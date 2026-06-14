# T-145-01 Design — facade-grammar-recognition

Decisions, with rejected alternatives, grounded in `research.md`. The through-line: **ship the
grammar (recognition + record + program-level proof), not the relief (construction).** Relief depth
is S-146/S-147's brushes (philosophy §Stage 4); this ticket makes the program *say* where the
articulation falls, schema-validated and pack-sanctioned, with each face's evidence source recorded.

## D0. The load-bearing seam: facade is RECORDED, never realized here

`realizeProgram` (`src/workshop/program.mjs:180`) consumes masses → shells/idioms and is the
byte-identity substrate. **The facade block is read by recognition and the gate, and ignored by
compile/realize in this ticket.** Consequences:
- Existing committed programs (no facade) realize **byte-identically** → `--repro`/`--offline`
  trivially green.
- A program *with* facade realizes the *same* artifact (compile doesn't read facade) → the offline
  replay still byte-compares clean.
- The grammar is a promise the downstream brushes (S-146/S-147) will keep; here it is a validated,
  diegetic, evidence-tagged record. This matches "depth is idealized by the brushes, never fit to the
  mesh" (philosophy §Stage 2 narrowing).

This is why the schema edit can be purely additive and the ticket lands without touching the realize
path or any committed artifact.

## D1. Schema: extend building-program/v1 additively (chosen) vs a sibling schema

**Chosen — an OPTIONAL per-mass `facade` object inside `building-program/v1`.** One program object,
one AJV pass, `additionalProperties:false` preserved by adding the named optional property. Absence =
the legacy state, so every committed program stays schema-valid (prior obs 15928: any addition must be
deliberate; optional makes it non-breaking).

Shape (per mass; all material refs are **roles, never blocks** — the diegetic-proof substrate):
```
facade: {                                  // optional; recorded, not realized (D0)
  eaveOverhang: int≥0,                      // blocks proud of the wall plane (overhang depth)
  faces: [ {
    wall: "+x"|"-x"|"+z"|"-z",
    rhythm: { period:int, phase:int } | { count:int },   // pilaster/stud spacing
    memberRole: role,                       // the frame member (∈ palette)
    fields:  { role } | null,               // panel infill between members (∈ palette)
    quoins:  { role, run:int } | null,      // corner run depth in cells (∈ palette)
    courseLines: [ { y:int, role } ],       // y-row course lines (∈ palette)
    jettyDepth: int≥1 | null,               // per-storey jetty lip depth (refines masses[].jetty)
    openingsRhythm: { period:int, phase:int } | null,    // openings on a rhythm
    evidence: { source:"concept"|"textured-glb"|"pack-idealised", layoutOnly:bool }  // REQUIRED
  } ]
}
```
**No `block` field anywhere in `facade`** (schema-enforced via the existing `role` `$def` +
`additionalProperties:false`). This is the architectural half of the diegetic proof: a GLB render
*cannot* inject a material because the grammar has nowhere to put one — only roles, which resolve
through the diegetic palette.

*Rejected — a separate `facade-grammar/v1` schema attached by reference.* It would fork the
validation path, need its own AJV validator, its own join key to the program, and a second
pack-vocabulary gate. The grammar *is* per-mass program data; co-locating it reuses
`validateProgramAgainstPack` and the one reply-policy parse. No upside to splitting.

## D2. "No material decision sourced from the GLB" — the proof (AC #2)

Two layers, both checkable from the record:
1. **Structural (schema):** facade carries only `role` refs (D1). Materials are diegetic by
   construction — the same guarantee the whole program already enjoys ("programs speak roles, never
   blocks", `program.mjs:8`).
2. **Procedural (program-level check):** `assertFacadeDiegetic(program, pack)` proves, per face:
   (a) no raw block ids (redundant with schema, asserted anyway as a receipt); (b) every role ∈
   palette; (c) every face whose `evidence.source === "textured-glb"` has `layoutOnly === true`.
   The runner writes the receipt `{checked:true, faces:[{wall,source,layoutOnly}], diegetic:true}` so
   the record *proves* the GLB informed layout only. This is folded into `validateProgramAgainstPack`
   (hard error on violation → MALFORMED → re-ask) **and** exported standalone for the receipt.

*Rejected — an occupancy-level conformance check (`facade-material-diegetic` in `conformance.mjs`).*
Conformance runs on the realized occupancy + declarations; the facade lives in the *program* and is
not realized here (D0), so there is nothing in occupancy to check. The proof belongs at the program
gate, where the evidence tags exist.

## D3. Textured-GLB multi-angle render: voxel-colour splat (chosen), no mesh-PBR renderer

`research.md §5`: **the repo has no textured-GLB→PNG renderer** (`glb-splat.mjs:4`). Two options:

**Chosen — reuse the voxel-colour splat seam.** `glbVoxelOccupancy({occupancy, surface, texture,
palette})` (`glb-splat.mjs:29`) already decodes the GLB texture, snaps per-voxel colour to a palette,
and yields an artifact; `renderViews(artifact, MULTI_ANGLE_GATE.azimuths)` (`multi-angle.mjs:77`)
renders it to PNG at the four gate azimuths. This is exactly "the splat method anticipated in E-23"
the philosophy narrowing names. The render shows the *texture-contrast layout* (where studs/courses/
openings fall) without ever being the substrate. Honest caveat, recorded on the seam: this is
**layout evidence, not relief depth** — TRELLIS bakes detail flat on a near-smooth mesh
([[trellis-facet-normals-lie]]). The palette used for the splat is the *concept/design* palette
already in the program (so the render is colour-true to the brief), but its colours are **never
copied into the grammar** — D2 guarantees that. The render seam is recorded:
`{glb, method:"voxel-colour-splat", azimuths, sha256[]}`.

**Rejected — build a headless GL glTF-PBR renderer.** A large new dependency surface (PBR shading,
glTF material/texture binding in the headless-WebGL harness) for a render the ticket itself says
yields only layout evidence. Out of proportion; `dangerouslyDisableSandbox` + Modal is for *minting*
a GLB, not rendering one. We reuse the on-disk GLB (AC #3: "reuse the on-disk GLB; the render seam
recorded").

## D4. The recognition step: pure prompt-builder + parse, runner owns transport

Mirror `src/recognition/prompt.mjs` exactly. New pure module `src/recognition/facade-grammar.mjs`:
- `facadeDigest(program, pack, {seenFaces})` — prose: the masses + their walls, which faces the
  single concept view shows vs the unseen back/sides/roof, the pack's admissible articulation idioms
  + roles + bounds, and the facade sub-schema. Teaches the vocabulary; the parser enforces it.
- `facadeRenderArgs({program, pack, sketch})` → `{facade_digest, schema_json}` (the live request's
  text params; images are concept + the D3 textured-GLB azimuth renders, attached by the runner).
- `parseFacadeReply(text, {program, pack})` — the `runReplyPolicy` `parse`: strip → JSON → merge
  facade into a deep clone of the program → `assertBuildingProgram` → `validateProgramAgainstPack`
  (now incl. facade + diegetic) → return the program-with-facade. Any violation throws → MALFORMED →
  same-prompt re-ask within `FACADE_REPLY_BUDGET = MAX_REPLY_ATTEMPTS` (T-114; no corrective addendum).
- Light vs strong tier: the **strong** tier writes the per-mass design judgement (one ask, the
  grammar); the AC's "light tier for scoped per-face detectors" is honored by the *option* to run
  per-face confirmation asks on the light tier — designed as a tier knob on the runner, defaulting to
  a single strong ask (cheapest correct path; matches `recognize.mjs` which uses one strong ask).

*Rejected — a new BAML function `RecognizeFacadeGrammar`.* BAML adds `baml_src` + `bridge.mts` +
codegen churn ([[baml-bridge-revival-learnings]]) for a step whose prompt is a pure string and whose
parse is the same throw-on-violation gate. The pre-T-129 builder pattern (pure string + sha-pinned
fixture) is sufficient and lower-risk for a one-pass landing; a later ticket can migrate it to BAML
the way T-129 migrated `RecognizeBuildingProgram`. Noted as deferred, not lost.

## D5. Honest fallback — a named record state (AC #4)

When the textured-GLB render is unavailable (no GLB, render throws) or the model cannot read an
unseen face, that face's `evidence.source = "pack-idealised"` and its grammar is the pack default
(member spacing from `proportions.openingRhythm`, field = upper wall role, no quoins). The runner
records `fallback: {faces:[{wall, reason}], idealisedFrom:"pack"}`. The front face always defaults to
`evidence.source = "concept"`. **Never a silent default** — the state is named in the schema enum and
the record. Render absence is recorded, never fatal (the `recognize.mjs renderEvidence` precedent).

## D6. Pack sanction & the "no per-building constants" rule

The pack must bound the recognised numbers. Add an **optional** `proportions.articulation` to
`style-pack/v1`: `{ memberPeriod:{min,max}, maxOverhang:int, maxJettyDepth:int, maxQuoinRun:int }`.
When **absent**, bounds fall back to existing pack data: period ∈ `[openingRhythm.minSpacing,
openingRhythm.maxSpacing]`, overhang/jetty/quoin ≤ a pack-derived ceiling (`storeyHeight.max`),
documented so no number is building-specific. `validateProgramAgainstPack` enforces every facade
number against these pack-carried bounds; the runner self-grep stays clean (no subject keys in
source). Material roles ∈ palette; rhythm idioms need no new registry entry (rhythm is a *number*,
not a construct — the constructs that *build* the rhythm are S-147's brushes).

## D7. Determinism & replay

- Facade is recorded, not realized (D0) → artifact bytes unchanged → `--offline` byte-compare green.
- The recognition fixture (`reply.txt` → merged-program `expected.json`) replays byte-identically via
  `parseFacadeReply`, no model — the AC's offline-replay test.
- The render seam records sha256 per view; render bytes never gate (evidence only — E-24/E-28).
