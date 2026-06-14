# T-145-01 Progress — facade-grammar-recognition

Implemented per `plan.md`. Full suite **2069/2069 green**; all three replay invariants byte-identical
(`recognize:offline`, `facade:offline`, and the recognition prompt sha pins). Facade is **recorded,
not realized** (design D0), so no committed artifact moved.

## Status by step

- **Step 1 — schema (additive)** ✅
  - `schema/building-program.schema.json`: optional per-mass `facade` (eaveOverhang, faces[] with
    rhythm/memberRole/fields/quoins/courseLines/jettyDepth/openingsRhythm/evidence). Roles only — no
    `block` field anywhere (the structural diegetic proof).
  - `schema/style-pack.schema.json`: optional `proportions.articulation` (memberPeriod, maxOverhang,
    maxJettyDepth, maxQuoinRun).
  - *Deviation from plan:* the `rhythm` oneOf moved out of the schema — AJV `strict:true`
    (`strictRequired`) rejects `required` in `oneOf` branches without local `properties`. The
    "exactly {period,phase} OR {count}" rule is enforced in `validateProgramAgainstPack` instead
    (Step 2), which is cleaner and where the other semantic rules live. Documented in the schema.
  - Tests: `program.test.mjs` (legacy/valid/block-rejected/missing-evidence), `style-pack.test.mjs`
    (articulation present/absent).

- **Step 2 — program validation + diegetic proof** ✅
  - `src/recognition/program.mjs`: `facadeBounds(pack)` (articulation or pack fallback),
    `assertFacadeDiegetic(program, pack)` (roles-in-palette + textured-glb⇒layoutOnly + per-face
    receipt), and facade validation folded into `validateProgramAgainstPack` (roles, rhythm form +
    period band / count fit, overhang/quoin/jetty ceilings, course y < wall top, one face per wall,
    jettyDepth needs a declared jetty, the diegetic rule). Every finding a hard error → MALFORMED →
    re-ask.
  - Tests: off-vocabulary / off-bound / non-diegetic / duplicate-wall / jetty-needs-jetty / count-fit
    rejections; clean facade accept; `facadeBounds` fallback.

- **Step 3 — recognition pure core + offline fixture** ✅
  - `src/recognition/facade-grammar.mjs`: `FACADE_REPLY_BUDGET`, `ALL_WALLS`, `unseenFaces` (concept
    3/4-camera split — a registry fact), `facadeSubSchema`, `facadeDigest`, `facadeRenderArgs`,
    `mergeFacade` (pure), `parseFacadeReply` (the runReplyPolicy parse: strip → merge → schema →
    pack+diegetic gate).
  - Fixture `src/recognition/fixtures/facade/{base-program.json, reply.txt, expected.json,
    prompt.txt}` — `expected.json` and `prompt.txt` generated via the real parse (never hand-authored).
  - Tests: render-arg shape + digest determinism, committed prompt-digest replay, `mergeFacade`
    purity + unknown-mass reject, the **offline byte-identical replay** (AC #5), parse rejections,
    and reply-policy (malformed×budget → REFUSE no re-roll; malformed-then-good → accept on attempt 2).

- **Step 4 — textured-GLB render seam** ✅
  - `src/recognition/facade-render.mjs`: pure `texturedGlbRenderPlan` (defaults to the 4 gate
    azimuths, `method:"voxel-colour-splat"`, `layoutOnly:true`, the honest-caveat note) + the impure
    leaf `renderTexturedGlbViews` (lazy-imports `glbVoxelBuild` + `renderViews`; GLB texture snapped
    to the design palette, rendered, sha-receipted). No mesh-PBR renderer was built (design D3).
  - Tests: the pure plan only (azimuths/method/layoutOnly/note; config stays frozen).

- **Step 5 — runner + committed records + npm scripts** ✅
  - `benchmarks/sculpture/facade-grammar.mjs`: LIVE (strong tier, concept + textured-GLB images,
    T-114 reply policy, pin-guarded writes incl. the diegetic receipt + render seam; render absence
    recorded, never fatal; `pack-idealised` fallback) and `--offline` (committed reply → byte-compare
    merged program + re-run the diegetic receipt). E-25 self-grep clean.
  - `benchmarks/sculpture/recognition/facade/fixture-house/{base-program.json, reply.txt,
    merged-program.json}` — the committed offline pin.
  - `package.json`: `facade:cottage`, `facade:barn`, `facade:offline`.

## Deviation discovered & resolved — base recognition prompt sha drift

Adding `facade` to the program schema drifted the BASE recognition prompt sha (FX-R1, `cottage`/
`barn`) because `recognitionRenderArgs` embeds the whole program schema via `loadProgramSchema()`.
Resolved architecturally, not by re-pinning: the facade is a *separate* pass, so the base prompt must
stay byte-identical. Added `baseRecognitionSchema()` (`prompt.mjs`) that strips the optional `facade`
property from the schema the base pass shows the model; the base prompt is unchanged and FX-R1 passes
without regenerating any committed record. A guard test (`prompt.test.mjs`) pins this so a future
schema-add can't silently re-drift.

## Verification

- `npm test` → 2069/2069.
- `npm run recognize:offline` → cottage + barn artifacts byte-identical, conformance PASS.
- `npm run facade:offline` → merged program byte-identical, **diegetic PROVEN**.
- `grep -n facade src/recognition/compile.mjs src/workshop/program.mjs` → only an unrelated comment;
  compile/realize stay blind to the facade (byte-identity substrate intact).
- Runner self-grep: no subject keys in `benchmarks/sculpture/facade-grammar.mjs`.

## Not done here (by design — downstream stories)

- **Relief construction** (proud pilasters/recessed fields, course relief): S-146 (relief-by-
  construction) + S-147 (articulation brushes). This ticket records *where* the articulation falls;
  the brushes build the depth. `realizeProgram` deliberately ignores `facade`.
- **Live metered facade asks** for real subjects (cottage/barn): the LIVE runner path is wired but
  un-exercised here (no model in CI — the `recognize.mjs` precedent). The offline pin proves the
  contract; a live run belongs to S-149 (re-skin-reverdict).
- **BAML migration** of the facade function: deferred (design D4) — the pure prompt+parse is
  sufficient; a later ticket can migrate it the way T-129 migrated `RecognizeBuildingProgram`.
