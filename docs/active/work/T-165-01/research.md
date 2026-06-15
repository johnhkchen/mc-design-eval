# T-165-01 — Research

**Ticket:** recognition-declares-style-and-suite-selection (Story S-165, Epic E-39).
First half of S-165: recognition emits an explicit `style` on the program, and `DiagnoseBuild` (Layer A,
T-164-01) selects its `expected` profile by that style. Register `rustic` and `saltcrag` as distinct
suites. Genuinely-different second style is T-165-02. Descriptive only — no solutions here.

## The Layer A judge as it stands (T-164-01)

`DiagnoseBuild(style, image_list, program_block, palette_block, departments, max_items, concept, renders)
-> Critique` lives in `baml_src/department.baml`. Its prompt is **one rustic prompt**: the only
style-bearing inputs are
- `{{ style }}` — a bare label ("The style is {{ style }}."), and
- `{{ palette_block }}` — the pack's material vocabulary ("THE STYLE'S MATERIAL VOCABULARY").

There is **no explicit per-style construction grammar** (what this style's roof / walls / openings *are*,
as construction) — only materials + the recognized program. The "expected" the judge forms is therefore
driven by (a) the recognized `program_block` and (b) the palette. There is no "suite" object selected by a
declared style; "rustic" reaches the prompt purely as a string.

### The serializer (`src/workshop/diagnose.mjs`, pure)

`diagnoseRenderArgs({ program, pack, azimuths, maxItems })` returns the typed string inputs:
- `style: pack.style` ← **read from the PACK, not the program** (key fact for this ticket).
- `image_list` (concept + azimuth labels), `program_block` (recognized masses + reading summary),
  `palette_block` (`paletteBlock({pack})`, imported from `critique.mjs`), `departments`
  (`DEPARTMENTS.join`), `max_items`.
- Pure: no GL/IO/Date/random; runs under the `src/**/*.test.mjs` glob.

### The bridge row

`src/baml/bridge.mts` → `FNS.DiagnoseBuild.request(a.style, a.image_list, a.program_block,
a.palette_block, a.departments, a.max_items, concept, renders)`. Adding a BAML param means a new positional
arg here + `npm run baml:gen` to regenerate `baml_client`. Parse is name-keyed, unchanged.

## What "style" is today (the honest baseline)

- The **building-program schema** (`schema/building-program.schema.json`) has `required:
  [schema, subject, pack, reading, masses]`, **`additionalProperties: false`**, and **no `style`
  property**. `pack` is a slug (`"rustic"`/`"saltcrag"`); the program does **not** carry a `style`.
- The **pack** (`packs/rustic.json`, `packs/saltcrag.json`) carries `style` (`"rustic"` / `"saltcrag"`).
  Today **`style === pack id === pack.style`** — there is no richer style signal. The ticket Note
  anticipates exactly this: *surface it honestly as the pack id; don't invent a richer signal.*
- Recognition is **pack-conditioned**: `recognitionRenderArgs` shows the model `packDigest(pack)` (which
  embeds `pack.style`) and the base schema; `parseProgramReply(text, {pack})` validates the reply against
  that pack's vocabulary. The model never chooses a style — **the pack the run was launched with fixes it.**
  So the honest place a `style` is *known* is the recognition seam, from the conditioning pack.

## Recognition program lifecycle (where a `style` could be stamped)

- Prompt + parse: `src/recognition/prompt.mjs` — `recognitionRenderArgs`, `baseRecognitionSchema`
  (clones the committed schema and **deletes `masses.items.properties.facade`** so the model-facing prompt
  stays byte-identical to the pre-E-35 instrument — **the FX-R1 sha pins**, `prompt.test.mjs:71`), and
  `parseProgramReply` (strip → `assertBuildingProgram` (AJV) → `validateProgramAgainstPack`).
- Live recognition runner: `benchmarks/sculpture/recognize.mjs` — `parseProgramReply(t, {pack})` at the
  live ask (`:152`) and over the committed reply for `--repro` (`:228`); writes the program record.
- Loop consumption: `benchmarks/sculpture/workshop.mjs` loads the committed program as `source` and the
  `--split` path calls `diagnoseRenderArgs({ program: diagProgram, pack, azimuths })` (`:302`).

**Constraint:** `additionalProperties: false` means a stamped `program.style` is only legal if `style`
becomes a *known* (optional) schema property; otherwise `assertBuildingProgram` would reject any
record that carries it. Committed records have no `style` → it must stay **optional** (they must still
validate). And it must be **stripped in `baseRecognitionSchema`** (like `facade`) or the model-facing
`schema_json` changes and the FX-R1 cottage/barn prompt shas drift (memory:
*recognition-prompt-embeds-program-schema*).

## The two packs — genuinely different, not reskins (evidence for AC2)

| axis | rustic | saltcrag |
|---|---|---|
| roof.field | `spruce_planks` | `dark_oak_planks` |
| roof extras | (course/step slabs) | `roof.ridge → deepslate_tiles`, `thatch→hay_block`, `turf→moss_block` |
| walls | `timber-frame` idiom; `wall.infill.upper → white_terracotta` | `wall.finish.limewash`, `wall.infill.cobble → mossy_cobblestone`, `wall.dressing.quoin` |
| idioms | timber-frame, jetty, dormer, hip, pyramid, arch | surface.fill / paint / roof-courses / strip-salt; **no** timber-frame/jetty/dormer/hip |
| pitchClasses | `[1,2]` | `[2,1,0.5]` |

The roof material, the wall grammar (timber-frame vs limewash+cobble+quoins), and the available idioms
all differ. **A per-style `expected` profile derived from these will genuinely differ** — the falsifiable
claim is more likely to *succeed* than to fall into the reskin escape hatch.

### A bonus: the same subject already recognized under both packs

`benchmarks/sculpture/recognition/barn.program.json` (pack `rustic`) and `barn--saltcrag.program.json`
(pack `saltcrag`) both exist. Both declare `roof.idiom = roof.gable` and `walls.ground.role =
wall.field.ground` — **the per-mass roles overlap**; the *meaning* (palette) and the style grammar are what
diverge. This confirms the program alone does not differentiate style; the **suite** must.

## Fixtures & pins in the blast radius

- `src/baml/fixtures/diagnose/{inputs.json, prompt.golden.txt, reply.txt, expected.json}` — FX-DB1 renders
  `inputs.json` through the bridge and byte-compares `prompt.golden.txt` (`fixtures.test.mjs:132`); FX-DB2
  parses `reply.txt` vs `expected.json`. Adding a `style_profile` input → **inputs.json + prompt.golden.txt
  regenerate**; `reply.txt`/`expected.json` unchanged (reply text is style-independent).
- `src/workshop/diagnose.test.mjs` — DG1–DG4 pin the serializer's content/determinism/single-source.
- `src/recognition/prompt.test.mjs:71` — the FX-R1 "no facade in base prompt" guard; the `style`-strip
  must join it so the recognition prompt stays pinned.
- `src/baml/transport-guard.test.mjs` — TG5 scans `department.baml` for gate vocabulary; a `style_profile`
  block must carry no `JudgeFacade` / `same object|drifted|different object` / actions/rounds/proportion.
- `baml_src/department.baml` golden minting: there is **no `diagnose` entry** in
  `scripts/mint-baml-fixture.mjs` (it covers vernacular/decompose). The diagnose golden was produced by
  rendering `inputs.json` through the bridge; regen is "render inputs → write prompt.golden.txt".

## Constraints / assumptions carried into Design

1. **Honest style = pack id today.** Stamp `program.style = pack.style` at the recognition seam; do not
   fabricate a model-authored style. State it as such (ticket Note).
2. **Schema additions must be optional + stripped from the base prompt** (FX-R1 untouched, committed
   records still validate).
3. **diagnose.mjs stays pure** — no pack-loading-by-style IO inside it; the seam loads the pack for the
   declared style and passes it (IO belongs at the seam).
4. **No per-subject constants** (recognize self-grep discipline): the suite is keyed on *style* and derived
   from *pack data*, never hand-listed per subject.
5. **Frozen instrument untouched**; this is a creation-loop change (the fused `CritiqueWorkshopRound` and
   the scalar judge stay as-is).
