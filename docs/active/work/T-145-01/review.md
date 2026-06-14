# T-145-01 Review — facade-grammar-recognition

Handoff for a human reviewer. What changed, how it's tested, what's deferred, and the one thing worth
a careful look. Landed in three commits (`998e7b4`, `477b511`, `dde5c69`) on `main`. Full suite
**2069/2069 green**.

## What changed

**Schema (additive, optional — nothing legacy breaks):**
- `schema/building-program.schema.json` — optional per-mass `facade` { eaveOverhang, faces[] }. Each
  face: `wall`, `rhythm` ({period,phase}|{count}), `memberRole`, `fields`, `quoins`{role,run},
  `courseLines`[{y,role}], `jettyDepth`, `openingsRhythm`{period,phase}, `evidence`{source,layoutOnly}.
  **Roles only — no `block` field anywhere** (the structural half of the diegetic proof).
- `schema/style-pack.schema.json` — optional `proportions.articulation` { memberPeriod, maxOverhang,
  maxJettyDepth, maxQuoinRun }.

**Validation + the diegetic proof:**
- `src/recognition/program.mjs` — `facadeBounds(pack)` (articulation, else pack fallback from
  openingRhythm + storeyHeight.max), `assertFacadeDiegetic(program, pack)` (roles ∈ palette +
  textured-glb⇒layoutOnly + per-face receipt), and facade validation in `validateProgramAgainstPack`
  (rhythm form/bounds, ceilings, course y, one-face-per-wall, jettyDepth-needs-jetty, the diegetic
  rule). Every finding is a hard error → MALFORMED → bounded re-ask (T-114).

**Recognition (pure) + render seam:**
- `src/recognition/facade-grammar.mjs` — the second recognition pass: `unseenFaces` (concept 3/4
  camera split), `facadeDigest`/`facadeRenderArgs`, `mergeFacade` (pure), `parseFacadeReply` (the
  reply-policy parse). `FACADE_REPLY_BUDGET = MAX_REPLY_ATTEMPTS`.
- `src/recognition/facade-render.mjs` — `texturedGlbRenderPlan` (pure) + `renderTexturedGlbViews`
  (impure leaf): textured-GLB read as a **voxel-colour splat** at the 4 gate azimuths (no mesh-PBR
  renderer exists in-repo), tagged `layoutOnly:true` with the honest "layout, not relief depth" note.
- `src/recognition/prompt.mjs` — `baseRecognitionSchema()` strips the optional `facade` from the BASE
  recognition prompt so its sha stays byte-identical (the facade is a separate pass).

**Runner + records + scripts:**
- `benchmarks/sculpture/facade-grammar.mjs` — LIVE (strong tier; concept + textured-GLB images; T-114
  reply policy; pin-guarded writes incl. the diegetic receipt + render seam; `pack-idealised`
  fallback) and `--offline` (committed reply → byte-identical merged program + re-run receipt).
- `benchmarks/sculpture/recognition/facade/fixture-house/*` — the committed offline pin.
- `package.json` — `facade:cottage`, `facade:barn`, `facade:offline`.

## Test coverage

- **Schema** (`program.test.mjs`, `style-pack.test.mjs`): legacy/valid/block-rejected/missing-evidence;
  articulation present/absent.
- **Validation** (`program.test.mjs`): off-vocabulary role, off-band period, both/neither rhythm
  forms, overhang/quoin ceilings, course-y, duplicate wall, jettyDepth-needs-jetty, count-fit; clean
  accept; `assertFacadeDiegetic` receipt + leak rejection; `facadeBounds` fallback vs articulation.
- **Recognition** (`facade-grammar.test.mjs`): render-arg shape + digest determinism, committed
  prompt-digest replay, `mergeFacade` purity + unknown-mass reject, the **offline byte-identical
  replay** (AC #5), parse rejections (non-JSON / missing-facades / off-vocab / non-diegetic), and
  reply-policy (malformed×budget REFUSE no re-roll; malformed-then-good accept on attempt 2).
- **Render seam** (`facade-render.test.mjs`): pure plan only (azimuths/method/layoutOnly/note;
  config stays frozen).
- **Guard** (`prompt.test.mjs`): base recognition prompt excludes facade; committed schema keeps it.
- **Integration**: `npm run facade:offline` → byte-identical, diegetic PROVEN.

**Gaps (intentional):** the impure GL render leaf (`renderTexturedGlbViews`) and the LIVE metered ask
are not unit-tested — they need a GLB + headless GL + a model, exercised by an operator, never in CI
(the `recognize.mjs` precedent). The offline pin proves the data contract; the render seam is evidence
only (GL bytes never decide).

## Acceptance criteria

- **Facade-grammar extension, schema-validated against the pack** — ✅ (schema + pack-bounded
  validation; no per-building constants — every number is `facadeBounds`-derived).
- **Multimodal recognition step; per-face evidence source; GLB rows tagged spatial-layout; conformance
  proves no GLB-sourced material** — ✅ (`parseFacadeReply` + `assertFacadeDiegetic` receipt;
  textured-glb ⇒ layoutOnly enforced; roles-only schema).
- **Textured-GLB multi-angle renders at the gate azimuths; render seam recorded** — ✅ (voxel-colour
  splat; on-disk GLB reused; sha-receipted; `dangerouslyDisableSandbox` only needed for *minting* a
  GLB, not rendering one — we reuse).
- **Honest fallback (named record state)** — ✅ (`evidence.source:"pack-idealised"`; render-throw
  caught and recorded, never fatal).
- **Tests; --repro/--offline byte-identical; no per-building constants** — ✅ (2069/2069;
  `recognize:offline` + `facade:offline` byte-identical; self-grep clean).

## The one thing to look at — facade is RECORDED, not realized

`realizeProgram` deliberately ignores `facade`; compile/realize stay blind to it (verified by grep).
That's the seam that keeps every committed artifact byte-identical and lets this land additively. The
*consequence*: a build with a rich facade grammar still renders as the same flat box **until S-146/
S-147 ship the relief construction** that consumes the grammar. This ticket makes the program *say*
where the articulation falls and proves the saying is diegetic; it does not yet move a single voxel
proud of the wall plane. Reviewers expecting a visible texture change at the glance should expect it
at S-149 (re-skin-reverdict), not here.

## Open concerns / TODOs

1. **Tolerance/realism of the bounds.** `facadeBounds` falls back to `storeyHeight.max` for the
   overhang/jetty/quoin ceilings — a conservative pack-derived guess, not a calibrated one. When a
   pack declares `articulation`, those numbers should be authored deliberately; rustic currently has
   none, so the fallback is what's exercised. Worth a follow-up to author rustic's `articulation`.
2. **Voxel-colour splat as "textured render".** It is layout-true but coarse (the honest caveat is on
   the record). If S-146 finds the splat too blunt to read rhythm on real GLBs, a thin mesh-PBR
   renderer becomes the next lever — out of scope here by design (D3).
3. **No live verdict yet.** The LIVE facade ask for cottage/barn is wired but un-run (no model in CI).
   The first real facade grammars + a re-judge belong to S-149.
4. **Ticket frontmatter** left untouched (Lisa owns phase transitions). The `M` on
   `docs/active/tickets/T-145-01.md` in `git status` is pre-existing, not from this work.
