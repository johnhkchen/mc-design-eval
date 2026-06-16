# T-171-01 — Research

**Ticket:** material-faithfulness-gatehouse-program (S-171 / E-42). Give the gatehouse a recognition
program and make construction consume its material *roles* so the build is materially faithful
(cobblestone, not plank/basalt). Witness = the gatehouse; report its self-concept score vs the E-40
floor (~2). No per-subject constants. Frozen instrument untouched.

## The defect, measured (not asserted)

The current gatehouse build is `builds/gatehouse/new-roof/artifact.json` — the *crater build* the
corpus-referee scores (`CRATER_BUILD`, harness line 119). It was produced by the **generate-first /
`glb-voxel.v1`** path (`metadata.trial_id = "gatehouse-generate-first"`, `style.name =
"generate-first"`), NOT by recognition. Block distribution (8692 placements):

| block | count | % | role it should read as |
| --- | --- | --- | --- |
| `spruce_planks` | 4590 | **52.8%** | roof field — but it is a SOLID PRISM, drowns the walls |
| `polished_basalt` | 3108 | **35.8%** | the WALLS — should be cobblestone, reads near-black |
| `spruce_stairs` | 702 | 8.1% | roof course |
| `deepslate_bricks` | 288 | 3.3% | trim/base |
| `cobblestone` | 4 | 0.04% | — essentially absent |

So the build is materially unfaithful on two axes: (1) **walls are `polished_basalt`, not
cobblestone** — the program-less generate-first path picked blocks by color-matching the GLB texture,
not by a recognized role; (2) a **52.8% spruce-plank roof prism** dominates. This ticket owns (1);
(2) is S-172 (roof-as-construction). The hardcoded manifest
(`["cobblestone","deepslate_bricks","polished_basalt","spruce_planks","spruce_stairs"]`) lists
cobblestone but the path barely used it — confirming "program-less subjects get default materials."

## How a faithful build is actually produced (the recognition → compile → realize chain)

The canonical path that DOES consume material roles already exists and is used for barn/cottage:

1. **`benchmarks/sculpture/recognize.mjs`** (`runLive`, lines 114–222) — the LIVE metered runner.
   Reads `concept.png` + the conditioned form-sketch, asks the STRONG-tier model (via
   `requestTextWithImage`, the `claude -p` shim) under the T-114 bounded re-ask policy, and the model
   AUTHORS a `building-program/v1` (the program *speaks pack roles, never blocks*). Then:
   - `compileProgram(program, pack)` (`src/recognition/compile.mjs`) lowers roles→blocks **once**, via
     `roleBlock(pack, role)` (line 28) — the single role→block point. Walls become a banded `shell`
     element (`groundBlock`/`upperBlock`); roof becomes a registry `roof.gable` *construct* (stair
     courses), NOT a solid fill.
   - `realizeProgram(...)` (`src/workshop/program.mjs`) renders the workshop program to an artifact.
   - `runConformance(...)` judges; `renderEvidence(...)` renders 4 azimuths (evidence, never gating —
     "GL absent" recorded, not fatal).
   - Writes `recognition/<key>.program.json`, `.artifact.json`, `.record.json`, `.md`, `.replies.json`,
     `.prompt.md`, plus `view-<key>-<azimuth>.png` renders into `recognition/`.
2. **`--offline`** (`runOffline`, lines 224–245) — replays a committed program → compile → realize →
   byte-compares against the committed artifact (E-31 Rule 5 determinism). Needs a committed artifact,
   so it cannot bootstrap a new subject; it is the *replay assert* after the live run.

Subjects come from the `SUBJECTS` registry in `durable-skin.mjs`; `subjectDefs()` selects those with
`glb && generated.scale`. **The gatehouse already qualifies** (`durable-skin.mjs:138`): `glb:
"glb/stone-gatehouse.glb"`, `generated.scale: 32`, `concept:
"runs/015-…-stone-gatehouse-…/concept.png"`. Its conditioned sketch exists:
`form-sketch/gatehouse.json` + `gatehouse-sheet.png`. **The only thing missing is that recognition was
never run for it** — `recognition/` holds barn, barn--saltcrag, cottage, but no gatehouse. That is the
whole gap: coverage (run recognition once) + consumption (the chain already consumes roles).

## The rustic pack (the matched style) — the roles construction will lower

`packs/rustic.json` palette (role → block): `wall.field.ground → cobblestone`, `wall.dressing →
stone_bricks`, `frame.timber → dark_oak_log`, `wall.infill.upper → white_terracotta`, `roof.field →
spruce_planks`, `roof.trim → dark_oak_planks`, `roof.course → spruce_stairs`, `roof.step →
spruce_slab`, `chimney.cap → bricks`, doors/shutters. `storeyHeight ∈ [3,5]`, `pitchClasses [1,2]`.

Consequences for faithfulness: a faithful **stone** gatehouse program sets `walls.ground` (and, since
the whole gatehouse is masonry not timber-frame, `walls.upper`) to a *stone* role — `wall.field.ground`
(cobblestone) and/or `wall.dressing` (stone_bricks). **Walls go cobblestone — the ticket's win.** Note
the rustic `roof.field` is `spruce_planks`: the roof stays *wooden* by the pack's own vocabulary, so any
residual roof-plank read is style-correct material on a (now constructed, not prism) gable — and if the
roof still caps the score, that is S-172, reported honestly (AC #3).

## How the self-concept score is measured (the floor to beat)

The corpus-referee's **Section A crater** (`runCrater`) scores `CRATER_BUILD` against four conditions.
`A-matched` = rustic concept + rustic pack = **the self-concept score** (~2 in the E-40/E-41 live runs —
the floor). Scoring is one `DiagnoseBuild` call (`diagnose()`, lines 108–114): `diagnoseRenderArgs({
program, pack, azimuths })` + concept + build renders → `styleFidelityScore(critique)` from
`src/workshop/bakeoff-score.mjs`. The referee passes a **synthetic** stand-in `PROGRAM` (lines 67–70,
explicitly "NOT a recognition output"); with this ticket a *real* gatehouse program exists to pass
instead. To measure the NEW build's self-concept score I run the same diagnose against the new build's
renders + the gatehouse concept + the new program (one metered call, VOTES=2) — not the frozen
instrument, a witness measurement under the work dir.

## Constraints / boundaries

- **Frozen instrument untouched** (AC #4): `recognition/` is NOT under `measurements/`
  (`MEASUREMENTS_PREFIX`, pin-guard), so its writes are *drafts* — `preflightPins` only freezes
  tracked ∧ instrument-allowlist paths; new gatehouse files are untracked → write freely, no
  `--rotate-pins`. The corpus-referee and `bakeoff-score.mjs` are NOT in `npm test`; I must not edit
  their committed E-40 baseline results.
- **No per-subject constants** (AC #1): the program is *data* (`recognition/gatehouse.program.json`);
  the runner is subject-blind (`generalizationGrep` self-test asserts no subject key in its source).
  Authoring must not add a gatehouse branch to any `.mjs`.
- **GL is available** (verified: `cd render && require('gl')` returns a context; the authoritative probe
  is `render/src/render.mjs::GL_AVAILABLE`). So renders + beside-concept are live, not deferred.
- **Live recognition is metered + nondeterministic.** The model authors the program; it may need
  bounded re-asks; conformance may FAIL (recorded, not fatal). Risk: model emits a timber-frame
  (white_terracotta) program if it misreads the masonry — the concept ("thick masonry walls") should
  prevent it, but the program must be inspected before claiming faithfulness.

## Open questions for Design

- Live recognition (canonical, model-authored, matches barn/cottage) vs hand-authored program (data
  witness, deterministic)? Trade nondeterminism/cost against fidelity-to-pipeline.
- Where to source the new build's renders for the beside-PNG and the score (reuse recognize's
  `view-gatehouse-*` renders, or re-render into a `view-<az>.png` dir for the scorer)?
- Is the self-concept score worth a metered diagnose in this ticket, or is the materially-faithful
  render (AC #2) the primary deliverable with the score reported best-effort?
