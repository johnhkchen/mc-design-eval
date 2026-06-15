# T-164-01 — Research

**Ticket:** layer-a-diagnostic-judge (Story S-164, Epic E-39). Depends on T-163-01 (done).
**Goal of this phase:** map what exists for the Layer A *diagnostic* judge, where, how it connects. No solutions.

## What the ticket asks for (restated)

Author **Layer A** — the structured "what's wrong" judge — on the T-163-01 contract:

1. A real BAML function `DiagnoseBuild(concept, render[, style]) → Critique` whose **rustic prompt is
   grounded on the concept + the recognized program**; every emitted item carries a valid `Department`
   (the T-163-01 enum, surfaced via `ctx.output_format`).
2. A **`b.parse` fixture test against a captured golden**, plus a **render golden** (prompt bytes pinned),
   plus a **smoke run on one real (concept, render) pair** showing non-vacuous expected/present/missing.
3. A **pure `.mjs` render-args serializer** mirroring `critiqueRenderArgs` so the prompt bytes are testable.
4. `npm test` green; **no gate vocabulary** (creation-loop, not the frozen judge).

Explicit non-goals (deferred to **T-164-02**): the Layer B router `RouteCritique`, and **wiring
diagnose→route into the creation loop**. T-164-01 ships Layer A's *prompt + serializer + fixtures* only;
the fused `CritiqueWorkshopRound` path stays runnable untouched for the S-166 bake-off.

## The T-163-01 contract this builds on — `baml_src/department.baml`

T-163-01 shipped the typed contract and a **carrier** `DiagnoseBuild`:
- `enum Department { ROOF WALL OPENING CHIMNEY ROOM }` — a checked mirror of `src/pack/departments.mjs`
  `DEPARTMENTS` (pinned by `departments.test.mjs` DPT3).
- `class CritiqueItem { department, expected, present, missing, severity:"minor"|"major" }` and
  `class Critique { items: CritiqueItem[] }`.
- `function DiagnoseBuild(concept_block: string, build_block: string) -> Critique` with a **placeholder
  prompt** — explicitly labelled "S-164 fills this body, it does not rename." So T-164-01 **rewrites the
  prompt + signature in place**; the name and the returned `Critique` type are fixed.

**Proportion/massing is a separate axis, not a Department** (recorded S-163 decision): the
expected/present/missing triple is an *element* vocabulary (add/replace/remove); resize rides the mass
`adjust-params` levers, off this contract. Layer A therefore does NOT emit proportion items — that nuance
is carried by the mass-params path (the fused `CritiqueWorkshopRound` still has it). This is a falsifiable-
claim watch-point: if the prose `issue` carried proportion nuance the structured form drops, report it.

## The pattern to mirror — `src/workshop/critique.mjs` + `baml_src/critique.baml`

The **fused** `CritiqueWorkshopRound(round_num, budget, image_list, program_json, source_block,
palette_block, conformance_block, last_round_note, live_actions, max_issues, concept: image,
renders: image[]) -> WorkshopReply`. Its DATA is serialized by the pure `critiqueRenderArgs({ program,
pack, round, budget, liveActions, azimuths, conformance, lastRound, source })`, which returns named string
params; the prose skeleton lives in the `.baml` template; the rendered bytes are byte-pinned to a golden.

Layer A is the **diagnosis half** of that fused call, stripped of everything dispatch-related:
- KEEP: `concept: image`, `renders: image[]`, an `image_list` label string, a palette/style grounding
  block, a program grounding block, a `max_items` cap, and `{{ ctx.output_format }}` (now renders the
  `Critique`/`Department` schema instead of `WorkshopReply`).
- DROP: `round_num`/`budget` (no rounds in a one-shot diagnosis), `conformance_block`,
  `last_round_note`, `live_actions`, the action/decision/rationale reply shape, the sanctioned-actions
  prose. Those belong to the fused loop and to Layer B.

`critiqueRenderArgs` is pure (no GL/IO/Date/random), runs under `src/**/*.test.mjs`, and is unit-tested in
`src/workshop/critique.test.mjs` ("B: render-args content pins"). The Layer A serializer mirrors this exactly.

## The grounding data available — the recognized building-program/v1

`benchmarks/sculpture/recognition/<subject>.program.json` (e.g. `barn`, `cottage`) is the recognized
program: `{ schema:"building-program/v1", subject, pack, reading:{ summary, symmetryClaim }, masses:[
{ id, rect, storeys, storeyHeight, walls:{ treatment, ground/upper/dressing:{role} }, plinth, roof:{ idiom,
ridgeAxis, pitchClass, fieldRole, gableRole }, chimney, openings:[{wall,kind,count,w,h,sill,head,headRole}]
} ] }`. The `reading.summary` is the VLM's own prose intent ("steep gable… walls are stone… wagon doors…").

This is the **"program"** the AC says to ground on: it states, per mass, what each department *should* be
(roof idiom, wall roles, openings, chimney presence). Fed to Layer A it gives the judge the `expected`
column directly, so `expected/present/missing` is grounded, not vacuous. The pack
(`packs/rustic.json`, `style:"rustic"`, `palette:[{role,block,…}]`, `decoration`) gives the block
vocabulary — the same `palette_block` the fused path renders.

Note: the workshop distinguishes the COMPILED `program` (elements) from the recognized `source` (masses).
Layer A's natural grounding is the **recognized program (masses)** — the per-department intent — not the
compiled element list. The serializer takes that recognized program.

## The BAML bridge + fixtures — `src/baml/bridge.mts`, `src/baml/fixtures*`

- `bridge.mts` `FNS.DiagnoseBuild` currently wires `request: (a) => b.request.DiagnoseBuild(a.concept_block,
  a.build_block)` and `parse: (t) => b.parse.DiagnoseBuild(t)`. The signature change means the **request
  builder must be updated** to pass the new string params + images (mirroring `CritiqueWorkshopRound`'s
  `toImage(img.concept)` + `(img.renders ?? []).map(toImage)`). `parse` is keyed on the function NAME only,
  so it is unaffected — T-163-01's `critique-contract.test.mjs` (CC1/CC2/CC3 parse pins) stays green.
- **Transport-guard TG3** pins the exact `baml_client` importer set; `bridge.mts` is already in it; editing
  an existing `FNS` entry adds no importer → TG3 green. **TG4** (frozen judge path) and **TG5** (.baml
  judge-vocabulary list) are untouched: `department.baml` is not in TG5's list, but I keep the banned
  tokens (`JudgeFacade`, `same object|drifted|different object`) out by convention.
- **Fixture patterns:** `src/baml/fixtures.test.mjs` (the batched golden file) pins render goldens
  (`prompt.golden.txt` for critique, `prompt.txt`+sha for vernacular/decompose) and parse round-trips.
  `src/baml/critique-contract.test.mjs` (T-163-01) already pins **parse** over
  `fixtures/critique-contract/{reply.txt, reply-bad-department.txt}` → `expected.json` — a 3-item Critique
  spanning ROOF/WALL/OPENING with **non-vacuous** expected/present/missing. That committed `expected.json`
  is effectively the **captured golden** the AC's `b.parse` bullet wants; T-164-01 adds the **render
  golden** (the real prompt) and the **smoke**.

## The smoke witness — how the repo treats live model evidence

Live `claude -p` smoke runs are NOT part of `npm test` (metered, non-deterministic). The repo's witness
pattern is a runner script that renders/queries once and writes evidence beside the work (e.g.
`render:beside`, `workshop.mjs`). Layer A's smoke = a small script that takes one committed concept PNG +
one committed build render PNG, calls `DiagnoseBuild` live through the tiered shim (`runTieredOp`, the same
path `workshop.mjs`'s `exchange` uses), parses with `b.parse`, and prints the Critique to confirm
non-vacuous fields. **Spend-limit caution** (memory `spend-limit-reply-failure-mode`): probe minimally; a
zero-token notice reply burns the re-ask budget — keep the smoke a single un-retried call.

## Constraints & assumptions surfaced

- **No new BAML function name; no rename.** Author the prompt + params on the existing `DiagnoseBuild`.
- **Render golden depends on serializer output bytes.** The committed `fixtures/diagnose/inputs.json` must
  be the real `diagnoseRenderArgs(...)` output over a committed program (barn) so the golden is
  reproducible and a serializer change trips the render pin (the decompose/critique cascade lesson).
- **Pure serializer**, no per-subject constants — keyed on the program/pack passed in.
- **Departments single-sourced:** the prompt's department enumeration should come from
  `DEPARTMENTS` (departments.mjs) or `ctx.output_format`, not a hand-typed list, to keep one
  composition point.
- `npm test` runs `baml:gen` first; rewriting `DiagnoseBuild` regenerates `baml_client` automatically.
