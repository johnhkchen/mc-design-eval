# T-145-02 Research — storey-aware facade recognition

Descriptive map of the facade-grammar machinery as it stands after T-145-01 (recognition pass +
schema, synthetic fixture only) and the 2026-06-14 "prove the look" spike. No solutions here.

## The ticket in one line

Recognition must emit a **storey-aware** facade grammar for the *real* subjects (cottage, barn): each
face carries rhythm AND the **storey band** the relief applies to, with **roles correct per subject**.
The compiler must thread that band into the brushes so studs/piers land only in their storey. Today
none of that exists: the only grammar carrier is a synthetic fixture; the one real grammar
(`relief/barn-grammar.json`) is hand-authored, bandless, and mis-rolled.

## The facade grammar contract (T-145-01, shipped)

**Schema:** `schema/building-program.schema.json`, `masses[].facade` (lines 180–275).
- `eaveOverhang?` (int 0–8); `faces[]` (1–4), each `{wall, rhythm, memberRole, evidence}` required.
- `rhythm`: exactly one of `{period, phase}` | `{count}` (the "exactly one" rule is enforced in code,
  not schema — `validateProgramAgainstPack`).
- Optional per-face: `fields.role` (panel infill), `quoins.{role,run}`, `courseLines[].{y,role}`,
  `jettyDepth`, `openingsRhythm.{period,phase}`.
- `evidence.{source ∈ concept|textured-glb|pack-idealised, layoutOnly:bool}`.
- **All material refs are pack ROLES** (`#/$defs/role`), never block ids — the diegetic rule.
- **No storey / band / zone field exists.** This is the gap.

**Validation:** `src/recognition/program.mjs`
- `facadeBounds(pack)` (L138): periodMin/Max, maxOverhang/JettyDepth/QuoinRun from pack proportions.
- `validateProgramAgainstPack` check 9 (L318–367): pack-bounded numbers, one face per wall, roles ∈
  palette, course y < wallH, quoin run ≤ ceiling, jettyDepth needs `m.jetty`, textured-glb ⇒ layoutOnly.
- `assertFacadeDiegetic` (L169): every facade material role ∈ palette; textured-glb ⇒ layoutOnly.
  Operates only on `memberRole / fields.role / quoins.role / courseLines[].role`. A band field (no
  material) does not touch this.

## The recognition pass (emits the grammar)

**Pure module:** `src/recognition/facade-grammar.mjs`
- `facadeDigest(program, pack, {seenFaces})` (L65) — the prompt's prose skeleton: pack/setting, per-mass
  line (`w×d` plan, `storeys×storeyHeight`-block storeys), seen vs unseen faces, material role list,
  articulation bounds (`period min–max`, overhang/jetty/quoin ceilings), the textured-GLB layout-only
  rule, the pack-idealised fallback. **It does not mention storeys-as-bands or any band field.**
- `facadeSubSchema()` (L59) extracts `masses.items.properties.facade` from the committed schema — the
  typed shape handed to the model. (So a schema edit automatically reaches the prompt.)
- `facadeRenderArgs` (L101) → `{facade_digest, schema_json}`.
- `mergeFacade` (L115) merges `{massId→facade}` into a clone; `parseFacadeReply` (L137) =
  strip→parse→merge→`assertBuildingProgram`→`validateProgramAgainstPack`. Any violation throws →
  MALFORMED → same prompt re-asked within budget (T-114). No corrective addendum.

**Runner:** `benchmarks/sculpture/facade-grammar.mjs`
- `--subject <key> [--pack …] [--ticket <id>] [--rotate-pins]` (live) or `--offline`.
- Live: `requestTextWithImage` (subscription shim, MODEL_TIERS.strong), concept + textured-GLB azimuth
  renders as images; writes `replies.json`, `prompt.md`, `render.json`, record (`promptSha256`, askCount,
  budget, generalization grep, `replay.npmRun: facade-grammar:offline`).
- `--ticket` default `"T-145-01"`; threaded into every written file.
- `runOfflineDir(dir)` (L138): committed `base-program.json` + `reply.txt` → `parseFacadeReply` →
  `sha256(fresh)===sha256(committed)` byte-identity check + re-assert `assertFacadeDiegetic`.

**Synthetic fixture:** `src/recognition/fixtures/facade/`
- `base-program.json` (no facade) → `prompt.txt` → `reply.txt` (`{facades:{main:{…}}}`) →
  `expected.json` (merged) ; `articulated-program.json` is the build/compile fixture (T-147-01).
- `facade-grammar.test.mjs` L52–54 pins `facadeDigest(base,pack)+"\n" === prompt.txt`. **Any
  `facadeDigest` edit forces a regen of `prompt.txt`** (regen via the production fn, never by hand —
  [[pack-edit-blast-radius]]).

## The compiler / brush side

**`src/recognition/compile.mjs`**
- `compileProgram` (L115) builds elements; L219 `articulation.push(...facadeArticulationPlan(m, pack))`.
- `facadeArticulationPlan(m, pack)` (L380, **not exported**) → `{massId, brush, params}[]`, **PURE DATA
  (no functions) so the plan is replay-stable**. Computes `eaveY = m.storeys * m.storeyHeight`. Per face:
  - `eave-overhang` (whole-mass soffit at `eaveY-1`) if `facade.eaveOverhang>0`;
  - `infill-panel` (member+field) **or** `pilaster` (member only) per face;
  - `quoin` if `face.quoins`; `eave-overhang` per `courseLines[]` (belt course at `cl.y`).
  - **Roles resolved to blocks here** via `roleBlock(pack, role)` (the single vocabulary authority).
  - **`m.storeys`/`m.storeyHeight` are in scope but never passed to any brush as a band/zone.**
- `applyArticulation(occ, plan)` (L424, **exported**) iterates the plan, resolves each brush via the
  registry door `getBrush`, runs `entry.fn(occ, params)`, accumulates placements + per-brush report.

**`src/view/facade-articulation.mjs`** — the four E-35 brushes, all delegating to `surfaceRelief`:
- `pilaster(occ,{material,faces,rhythm,span,depth,zoneOf,zone})` (L77): column-rhythm proud strips;
  passes `zoneOf/zone` through **only if supplied**.
- `quoin(occ,{material,faces,run,headerDepth,zoneOf,zone})` (L99): builds an inner `restrict` closure
  (corner column + course parity + run height) that **composes** with an outer `zoneOf` (L122:
  `if (zoneOf && zoneOf(pos)!==zone) return null`).
- `infillPanel(occ,{memberMaterial,fieldMaterial,faces,rhythm,…,zoneOf,zone})` (L142): proud studs on
  rhythm + recolor the non-stud field; **both** honor `zoneOf` if supplied.
- `eaveOverhang(occ,{material,faces,depth,eaveRow})` (L180): soffit at one **positional** y row — builds
  its own `zoneOf=(pos)=>pos[1]===row?…` ; storey-agnostic.

**`src/view/surface-relief.mjs`** `surfaceRelief` (L52): `zoneOf?:(pos)=>string|null`, `zone="upper"`
default; L105 `if (zoneOf && zoneOf([x,y,z])!==zone) continue`. The band gate already lives here — the
brushes just need to *construct* the predicate from recognized data.

> **Key structural constraint:** the plan is pure data (replay-stable). A `zoneOf` **function** cannot
> live in `params`. The band must travel as DATA in the plan, and a predicate be built downstream.

## The two real subjects (programs already recognized)

- **Cottage** (`benchmarks/sculpture/recognition/cottage.program.json`): 2 masses (`main`, `wing`),
  each `storeys:2 storeyHeight:4` (wall top y=8), **timber-frame** treatment, ground `wall.dressing`
  (ashlar stone), upper `wall.infill.upper` (cream plaster), jettied. Target look: `frame.timber` studs
  framing `wall.infill.upper` plaster, **upper storey only** (y∈[4,7]) — Tudor half-timber.
- **Barn** (`barn.program.json`): single mass `barn`, `storeys:3 storeyHeight:3` (wall top y=9, eave
  ~10), ground & upper both `wall.field.ground` (cobble), `wall.dressing` (stone_bricks) dressing,
  steep gable. Target look: `wall.dressing` piers framing `wall.field.ground` panels, **whole wall
  below the eave** (excludes the gable triangle). Roles: member `wall.dressing`, field `wall.field.ground`.

**`benchmarks/sculpture/relief/barn-grammar.json`** — hand-authored, 2 faces (+z/-z), `period 4`, **no
band**, **`memberRole:"frame.timber"` on a stone barn** (the mis-roll the ticket names), no fields. It
is a stray artifact (not on the recognition→compile path); to be fixed for correctness.

## Render proof seam

`src/view/render-beside.mjs`: `assertGlAvailable` (loud `GlUnavailableError`), `renderBesideConcept`
(judge-free, multi-angle gate azimuths, composes concept panel + render panels → PNG to `pr/assets/`).
Runner `benchmarks/sculpture/render-beside.mjs`, `npm run render:beside -- --subject <key>`. GL lives in
the nested `render/` project; authoritative probe is `render/src` `GL_AVAILABLE` ([[gl-probe-nested-render-project]]).

## Constraints carried into Design

1. **Plan stays pure data** — band travels as data, predicate built in the brush.
2. **Additive & byte-identical** — fixture (no band) and all facade-less programs must compile/replay
   byte-identically; only an explicit band changes bytes.
3. **No per-building constants** — the band is recognized (named) and the y-range derived from the
   mass's own `storeyHeight`/`eaveY`.
4. **Diegetic** — band is geometry, not material; it must not perturb `assertFacadeDiegetic`.
5. **facadeDigest edit ⇒ regen fixture `prompt.txt`** via the production fn.
6. **Live model + GL** availability is environment-dependent; the offline replay + records are the
   durable proof, the live run is the producer.
