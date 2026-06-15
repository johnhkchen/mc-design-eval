# T-164-01 — Design

Decisions, with rejected alternatives. Grounded in `research.md`.

## Decision 1 — `DiagnoseBuild` signature: images + grounding blocks (mirror the fused call, minus dispatch)

Rewrite the T-163-01 carrier in place (same name, same `-> Critique` return) to:

```
function DiagnoseBuild(
  style:          string,    // the concept's style, e.g. "rustic" — sets up T-165's gradient
  image_list:     string,    // "1. the CONCEPT (target)\n2. your build, azimuth …"
  program_block:  string,    // the recognized building-program intent (per-mass), grounds `expected`
  palette_block:  string,    // the pack vocabulary (role: block) — the style's material grammar
  departments:    string,    // the Department vocabulary, single-sourced from DEPARTMENTS
  max_items:      int,
  concept:        image,
  renders:        image[]
) -> Critique
```

This is the **diagnosis half** of `CritiqueWorkshopRound` (research §pattern): KEEP concept+renders+labels+
palette+a program grounding+a cap+`ctx.output_format`; DROP round/budget/conformance/last-round/
live-actions and the whole decision/action/rationale reply shape. `style` is added (not in the fused call)
to make the per-style gradient a one-param change in T-165 — for now it is the constant `"rustic"`.

**Why a `program_block` (not just the two images).** The AC says "grounded on the concept **+ program**."
The recognized building-program states, per mass, the intended roof idiom / wall roles / openings / chimney
— i.e. the `expected` column, already departmentized by construction. Feeding it makes
expected/present/missing concrete (the anti-hedge "vacuous fields" failure is what grounding prevents). The
concept image is the visual target; `program_block` is the structured intent; `renders` are the build.

**Rejected — keep `(concept_block, build_block)` two-string carrier.** That stub took no images; a
diagnostic judge that never sees the build render or the concept can only hallucinate. The S-164 signature
is `DiagnoseBuild(concept, render[, style])` — images are intrinsic.

**Rejected — pass the COMPILED program (elements) like the fused call's `program_json`.** The compiled
element list is the *revisable object* the builder mutates; Layer A is comparing **read vs intent**, and
the recognized masses (roles + roof idiom + openings) ARE the per-department intent. The element list would
bury the department signal under realization detail. Use the recognized program.

## Decision 2 — A new pure serializer `diagnoseRenderArgs` in a new file `src/workshop/diagnose.mjs`

Mirror `critiqueRenderArgs` exactly (pure, deterministic, no GL/IO/Date/random, runs under the test glob).
Signature `diagnoseRenderArgs({ program, pack, azimuths, maxItems = MAX_DIAGNOSIS_ITEMS })` →
the typed string args above. Internals:
- `style`: `pack.style`.
- `image_list`: `"  1. the CONCEPT (the target)"` + `azimuths.map((a,i) => `  ${i+2}. your build, ${ANGLE_DESCRIPTIONS[a]}`)` — **reuse the exact `ANGLE_DESCRIPTIONS` map** from `critique.mjs` (export it) so the lens labels match the fused path byte-for-byte.
- `program_block`: the recognized program serialized — `reading.summary` (the VLM's intent prose) + a
  compact per-mass JSON (`{ masses: program.masses }`), in a fenced block. This is the `expected` source.
- `palette_block`: **identical construction to `critiqueRenderArgs`** (`role: block` lines + optional
  `decoration:` lines) — reuse so the material grammar reads the same in both judges.
- `departments`: `DEPARTMENTS.join(", ")` imported from `departments.mjs` — single composition point, no
  hand-typed enum echo.
- `max_items`: the cap.

**Why a NEW file `src/workshop/diagnose.mjs`, not append to `critique.mjs`.** Keeps Layer A physically
separate from the fused-path file S-164/T-164-02 will dismantle behind a flag; mirrors the conceptual split.
The two small shared helpers (`ANGLE_DESCRIPTIONS`, the palette-block builder) get **exported from
`critique.mjs` and imported** — one definition, so the lens labels and palette format can never drift
between the two judges. (Exporting `ANGLE_DESCRIPTIONS` and a `paletteBlock({pack})` helper is an additive,
byte-neutral refactor of `critique.mjs`.)

**Rejected — duplicate the helpers into `diagnose.mjs`.** Two copies of the azimuth labels / palette format
drift silently; the whole point of E-39's "one composition point" discipline is to not do this.

## Decision 3 — Grounding without dispatch leakage / gate vocabulary

The prompt instructs: "Compare the build (renders) against the concept; for each construction department
that diverges, state what the concept's style calls for (`expected`), what the build has (`present`), and
what is absent (`missing`); tag each with its `department`." It must NOT mention actions, idioms, rounds,
conformance, or the frozen-judge tokens (`same object`/`drifted`/`different object`/verdict/gap budget).
The Department enum reaches the model through `{{ ctx.output_format }}` (BAML renders the `Critique` schema
incl. the enum); the `departments` param adds a one-line human-readable reminder. Proportion is explicitly
out — a short line tells the judge to name element-level divergences (material/feature presence), not size.

**Rejected — let the judge also propose the fix.** That is Layer B (T-164-02). Fusing it back here is
exactly what E-39 splits; keep Layer A diagnosis-only.

## Decision 4 — Fixtures: reuse the T-163-01 captured golden for parse; add a render golden + a smoke script

The AC's `b.parse` against a captured golden is **already satisfied in shape** by
`critique-contract.test.mjs` (CC1: `fixtures/critique-contract/reply.txt` → `expected.json`, a non-vacuous
3-item Critique). T-164-01 adds, in `src/baml/fixtures.test.mjs` (the batched golden file):
- **FX-DB1 render golden** — `diagnoseRenderArgs` over the committed barn recognized program →
  `bamlRender("DiagnoseBuild")` → assert the prompt `===` `fixtures/diagnose/prompt.golden.txt` and the
  image count is `1 + azimuths.length`. Inputs committed as `fixtures/diagnose/inputs.json` (the real
  serializer output) so a serializer/template change trips the pin (the decompose-cascade lesson).
- **FX-DB2 parse round-trip** — `b.parse` over a committed `fixtures/diagnose/reply.txt` (a non-vacuous
  reply spanning ≥3 departments) `deepEqual`s `fixtures/diagnose/expected.json`; assert every item's
  `department` ∈ `DEPARTMENTS` and that `expected/present/missing` are non-empty (the **non-vacuous**
  proof, in-suite). A prose specimen coerces to `{items:[]}` (the FX-D1 all-array leniency — pin it so
  T-164-02's reply gate inherits the documented behaviour).

**Smoke (AC bullet 2, live):** `benchmarks/sculpture/diagnose-smoke.mjs` (`npm run diagnose:smoke --
--subject barn`) loads the committed concept PNG + an existing committed build render, calls `DiagnoseBuild`
live via `runTieredOp`, `b.parse`s, prints the Critique, and writes it to the work dir as evidence.
Single un-retried call (spend-limit caution). Not in `npm test`.

**Rejected — re-pin parse in the new file too.** Redundant with CC1; the new file owns the render golden +
the non-vacuous/leniency assertions. CC1 already proves the captured-golden parse.

## Decision 5 — Keep the fused path byte-identical

No edit to `critique.baml`, `critiqueRenderArgs`'s output, or `CritiqueWorkshopRound`. The only edit to
`critique.mjs` is **adding two `export`s** (the shared helpers) — the existing functions' returns are
unchanged, so FX-C1 (the critique render golden) stays green. T-164-02 will introduce the
`--fused`/`--split` flag and the loop wiring; T-164-01 leaves the loop alone.

## Falsifiable-claim watch (carry into review)

The claim fails if structure drops nuance the prose carried, or the model fills fields vacuously. Mitigations
designed in: `program_block` grounds `expected`; FX-DB2 asserts non-empty fields; the **proportion nuance**
the triple cannot carry is named explicitly (the known, reported gap — it rides the mass-params path, not a
regression). The S-166 bake-off (not this ticket) is the referee; T-164-01 must leave the fused path runnable.
