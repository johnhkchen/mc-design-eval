# T-189-01 — RESEARCH: where roof-material identity is decided, and why it reads brown not grey

Descriptive map of the seam this ticket must fix: the **roof-color** divergence the S-188 climb stalls
on. The gatehouse build's roof is brown timber; the concept's roof is grey stone. This is a
**recognition/material-map** fidelity gap, not a construction defect (the covering roof is structurally
correct — T-177-01). Everything below already exists; the ticket builds the one missing **hand** that lets
the loop move the roof from brown to grey. No solutions here — those are `design.md`.

## 1. The predecessor inventory: predicted, not run

**T-188-01's metered climb never ran.** Its `run.log` shows only the `GUARD_ONLY` guard probe (assets +
GL), and there is **no `trajectory.json` and no `eyes-vs-hands.md`** in `docs/active/work/T-188-01/`. The
runner (`experiments/eval-alignment/picture-climb.mjs`) was built and dry-proofed; the spend was deferred.

So the eyes-vs-hands inventory T-189 builds on is the **design's predicted** inventory (T-188 design
§"eyes-vs-hands inventory"), corroborated by T-188 research §3 and the recorded T-187 gatehouse critique
(memory 19036). Both name the SAME prime divergence, with high confidence and from independent reads:
**roof MATERIAL `replace`** — the build roof is dark-oak/brown, the concept roof is grey stone, and **no
existing hand produces a grey roof.** The ticket and S-189 both name roof color as the prime candidate.
This ticket scopes to that one, genuinely-stalled hand (anti-hedge: one real gap, fixed, not a speculative list).

## 2. Where roof-material identity is decided — two paths, both brown

There are two roof-material code paths in the gatehouse pipeline. **Neither can produce grey.**

### 2a. The seed artifact (compile path) — `dark_oak_planks`
The climb seed `benchmarks/sculpture/generated/gatehouse/artifact.json` is compiled by
`src/recognition/compile.mjs::compileProgram` (`:223`): `const fieldBlock = roleBlock(pack, m.roof.fieldRole)`.
The gatehouse program (`benchmarks/sculpture/recognition/gatehouse.program.json`) sets:
```
roof: { idiom:"roof.gable", fieldRole:"roof.trim", trimRole:"wall.dressing", gableRole:"wall.dressing" }
```
`roleBlock(rustic, "roof.trim")` = **`dark_oak_planks`** (pack `:59`, Lab L=19.9 — dark brown). The program's
reading prose says it explicitly: *"Roof reads dark (whole-roof darkened toward oak, **as the barn does**)."*
That **barn heuristic mis-fired**: it darkened a grey-stone gatehouse roof toward oak.

### 2b. The rebuild tool (`apply_gable_roof`) — `spruce_planks`
The climb's roof hand `apply_gable_roof` (`picture-climb.mjs:79`, identical in `autonomy-loop.mjs:53`)
rebuilds the gable with a **hardcoded** `FAMILY = { field:"spruce_planks", stairs:"spruce_stairs",
slab:"spruce_slab" }` (warm medium brown, Lab L=38). So even after the loop pulls `apply_gable_roof`, the
roof is still brown — just a *lighter* brown. The roof-color critique never clears. **This is the
eyes-but-no-hands wall**: the critique fires "roof brown, concept grey" on both the seed and after every
roof tool.

### 2c. The role-resolution authority
`roleBlock(pack, role)` (`compile.mjs:28`) is the ONE role→block point. The rustic pack roof family is
**entirely timber** — `roof.field`=spruce_planks, `roof.trim`=dark_oak_planks, `roof.course`=spruce_stairs,
`roof.step`=spruce_slab (pack `:51-79`). **There is no grey-stone roof role in the pack.** A grey roof
cannot come from `roleBlock` on this pack as-is.

## 3. The material-map ALREADY read the roof correctly — and it is ignored

`benchmarks/sculpture/material-map/gatehouse.json` (`material-map/v1`) is a **separate recognition product**
that read the concept's surface colors directly. Its roof entry:
```
{ role:"roof mass", block:"minecraft:deepslate_tiles", placementRule:"roof",
  rationale:"steep gable slope reads as dark, tight, cool-grey tiling … distinct dark tone, not the lighter wall stone." }
```
So recognition **already knows the roof is grey** (`deepslate_tiles`). The material-map is generated from
the concept image (`generatedFrom.concept` = the gatehouse concept PNG). **The gap is that the build's
program path (`roof.fieldRole`) and the material-map are never reconciled** — the compile path consumes the
program's role labels (geometry-grounded) and never the material-map's concept-true colors. The two
recognition artifacts disagree at the roof and nobody joins them. **This is the seam to fix.**

`src/form/material-map.mjs` is the material-map module: `parseMaterialMap`, `assertMaterialMap`,
`PLACEMENT_RULES` (includes `"roof"`), `normalizePlacementRule`, `isKnownBlock` (block→Lab table membership),
`normalizeBlock`. The roof entry is selectable by `placementRule === "roof"`.

## 4. The post-E-47 philosophy makes a concept-true grey roof legitimate

Post-T-186/T-187 (E-46/E-47): **the CONCEPT IMAGE is the standard; the pack is a naming vocabulary only.**
`diagnose.mjs:82` states it verbatim — *"a build that matches its concept image is correct even if its
materials differ from this [pack] list … these materials are NEVER the expected material."* So a roof in
`deepslate_tiles` (not in the rustic pack) that matches the concept's grey is a **match, not a `replace`** —
the out-of-pack block is licit because it is picture-true. The "palette-in-pack by construction" rule
(`compile.mjs` header) governs the pack-driven compile path; the material-map is the concept-driven
authority that overrides it for color, exactly as E-47 intends.

## 5. The hand must build grey FORM-faithfully — honest cubes are canonical

`generateRoof(gables, family)` (`roof-generate.mjs:257`) tolerates `family.stairs=null` / `family.slab=null`
(`:268, :281`): with a field-only family it emits a **solid stepped wedge in the field block, honest cubes,
no stair/slab members.** This is exactly `compile.mjs`'s own behavior for a field that doesn't match the
pack roof idiom (`roofBlocks` `:87` returns `{field, stairs:null, slab:null}`) — *"any other field realizes
as full cubes, honestly chunky rather than mismatched"* (`compile.mjs` header). So a grey roof = the gable
geometry rebuilt with `FAMILY={ field: greyBlock, stairs:null, slab:null }`. The roof FORM (T-177-01) is
preserved; only the material identity changes. Blockiness is the **voxel medium**, not a divergence (T-187
tolerance clause in `diagnose.mjs`/`department.baml`) — grey honest cubes read grey and clear the COLOR critique.

## 6. The lever's home: the climb runner + the gate's department map

- **The loop lever** is an `occ → occ` tool, like the three existing hands in `picture-climb.mjs:79-112`
  (`apply_gable_roof`, `construct_walls`, `add_timber_framing`) registered in `TOOLS` (`:113`) and `MENU`
  (`:114`). A new roof-material hand joins them; the sonnet `agentPick` (`:159`) selects it when the
  critique names a ROOF material/color divergence.
- **`src/workshop/climb-gate.mjs` `TOOL_DEPARTMENTS`** (`:28`) is the pure, `npm test`-covered map of which
  departments each tool can move (used by `classifyInventory` to label acted-on vs eyes-only). A roof-color
  hand maps to `["ROOF"]`. This file is in the test suite (`climb-gate.test.mjs`).
- **`rerecognize.mjs` exists** (`src/workshop/`, the E-33 "re-recognize didn't exist" closure) but
  re-recognizes a whole MASS through the **sketch digest — no images, no color** (`:14, :35`). It reads
  geometry, not concept color, so it **cannot** fix a roof-COLOR identity. The roof-material hand is a
  distinct, color-aware recognition lever; `rerecognize` is the geometry analogue, not this.

## 7. Render / verification seam, metering, constraints

- **GL is AVAILABLE** (probed: `assertGlAvailable()` from `render-beside.mjs` passes). So the
  **render-beside glance** — the grey roof rebuilt and rendered beside the concept — is producible at
  **zero metered cost** (`renderBesideConcept`, `render-beside.mjs:75`). This is the falsifiable evidence
  this ticket can produce cheaply: brown-roof beside → grey-roof beside.
- **Metered**: the full "critique fires → clears" proof needs `DiagnoseBuild` strong-tier votes (paid).
  Discipline from prior runs: asset-guard before spend, `GUARD_ONLY` dry probe, no re-ask on malformed
  ([[spend-limit-reply-failure-mode]]).
- **Frozen instrument untouched**: `measurements/` is the pin-guard prefix ([[location-encodes-status]],
  [[pin-guard-is-structural]]); this ticket writes only `src/recognition/`, the climb runner, and
  `builds/gatehouse/…` + the work dir. Recess-by-exclusion / no air-op ([[facade-recess-by-exclusion]]):
  the hand REBUILDS the roof field, it never buries or air-carves.
- **`npm test` green**: the pure recognition function + the `TOOL_DEPARTMENTS` entry are the test surface;
  the metered/GL runner stays out of the suite (like its `experiments/` siblings).

## 8. Open questions for Design (grounded, not assumed)

1. **Source of grey**: trust the committed material-map's roof block (`deepslate_tiles`, the concept-true
   read), or re-read the concept live (VLM, metered)? The committed map is deterministic + testable + IS the
   material-identity recognition artifact.
2. **Reconcile vs always-override**: should the hand only fire when the program block and material-map block
   **disagree by material family** (timber vs stone), so it is a no-op on matched subjects (cottage/barn,
   where roof IS brown timber and concept roof IS brown)? That keeps it an honest, general reconciliation.
3. **Apply as rebuild or recolor**: rebuild the gable with a grey field-only family (mirrors compile's
   honest-cubes path, preserves form), or remap roof-band timber cells in place? Rebuild is the canonical,
   form-faithful expression.
4. **Family classifier**: name-based (timber: `*_log|*_planks|oak|spruce…`; stone: `stone|cobble|deepslate|
   *_tiles…`) or Lab-chroma from the block table? Name-based is deterministic and legible.
