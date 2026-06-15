# Design — T-004-02 single-shot-archetype

Decisions with rationale, grounded in research.md. The shape of the work: a
*named, versioned* function from `(target, palette, style, identity)` to a single
prompt string, routed through the existing `runTrial`, plus the enforcement that
makes the result attributable to this config — not to wording drift.

## The shape

A single-shot trial is: *pick a target brief + a style brief + a palette
whitelist → assemble ONE deterministic prompt that pins all reproducibility
metadata and injects the whitelist as the binding material constraint → hand it to
`runTrial` (one generation, no tools, no revision) → get back a schema-valid,
attributable artifact.* The archetype is the prompt-construction policy; the
runner is unchanged.

Four ACs, mapped to four decisions:
- AC #1 (versioned config constructs prompt from target+palette+style) → D1, D2, D4
- AC #2 (one generation, schema-valid) → D1 (route through `runTrial`, no revision)
- AC #3 (palette injected as *binding* constraint) → D3
- AC #4 (identified in trial metadata, attributable) → D5

## Decision 1 — The archetype is a pure prompt builder over the existing runner

**Options.** (a) The archetype owns its own SDK call / turn loop. (b) The archetype
is a *pure* function producing a prompt string, executed by the untouched
`runTrial`.

**Decision: (b).** `runTrial` (T-004-01) is explicitly "the spine ... the §7
archetypes layer prompt construction on top of this runner without changing its
spine" (trial.mjs header). Single-shot is *one* generation with *no* tools and *no*
revision — exactly what `runTrial` already does (one `query()`, `SAFE_TRIAL_OPTIONS`
= no tools). So the archetype contributes **only** the prompt and the seed
identity; it calls `runTrial({ prompt })`. This keeps the single metered seam
single, makes the whole prompt-construction surface **pure and unit-testable**
(the value of the ticket), and means AC #2 ("one generation, schema-valid") is
inherited from the runner + binding, not re-implemented. Option (a) would fork the
SDK seam and re-earn the schema-enforcement/​re-validation guarantees — rejected,
same reasoning as T-004-01 Decision 1.

**Consequence:** the archetype's testable heart is `buildSingleShotPrompt(spec) →
{ prompt, seedMetadata }`. The live leg is a thin `runSingleShotTrial(spec)`
wrapper that calls `buildSingleShotPrompt` then `runTrial` — metered, **not** in
`npm test`, mirroring the runner's live/pure split.

## Decision 2 — A versioned archetype descriptor, id single-sourced

**Options.** (a) Hardcode the string `"single-shot.v1"` at the prompt site.
(b) A frozen descriptor object `SINGLE_SHOT = { id, version, label }` whose `id`
re-exports the constant already in `config.mjs`.

**Decision: (b), reusing `config.mjs`'s `DEFAULT_PROMPTING_METHOD_ID`.** Research
found the id **already declared** in `src/config.mjs`
(`DEFAULT_PROMPTING_METHOD_ID = "single-shot.v1"`) with a comment naming it the
Phase-1 baseline. The archetype must not introduce a *second* spelling of its own
id. So `SINGLE_SHOT.id` **is** `DEFAULT_PROMPTING_METHOD_ID` (imported), and the
descriptor adds `version: 1` and a human `label`. "Versioned" (spec §7, AC #1) is
realized by the `.v1` suffix being part of the id that lands in
`metadata.prompting_method_id`: any change to prompt construction that could move
results bumps the suffix to `.v2`, so every logged trial is attributable to the
*exact* construction that produced it. The descriptor is the one place that
couples "this code" to "this id."

## Decision 3 — Palette injection: the whitelist as an explicit, framed constraint

This is AC #3's heart and the thing `scripts/run-trial.mjs` does **not** do today
(it names the palette but never supplies the blocks).

**Decisions:**
- **A shared loader, `src/palette.mjs`.** No JS palette loader exists (research);
  the render side and E-04 will also need one. `loadPalette(id)` reads
  `palettes/<id>.json` (a file path — *not* an import of the `palettes/` module's
  validator/`node_modules`) and returns the parsed object. Kept minimal: no
  re-validation here (the palette is validated at authoring time by
  `palettes/validate.mjs`); this is a data read.
- **A deterministic formatter, `formatPaletteBlocks(palette)`.** Renders the
  whitelist for the prompt using `groups` when present (the legible
  "structure / metal / glazing / accent" framing T-001-04 built `groups` for),
  falling back to a flat list. Bare names, as authored.
- **Binding language, not suggestion.** The injected block is explicit: the
  whitelist is *the only* allowed material set; every placement's `block` must be
  one of these; using anything outside it is a scored violation (spec §9 palette
  adherence). The prompt also instructs `palette.palette_id = "<id>"` and
  `palette.manifest ⊆ whitelist`. "Binding" = the constraint is stated as a hard
  rule the design is measured against, and the palette id is recorded so adherence
  is checkable.
- **Spelling note in-prompt.** Because the schema's block ids are namespaced and
  the whitelist is bare (research), the prompt tells the model to emit
  `minecraft:`-prefixed ids drawn from the bare whitelist — removing the one
  ambiguity that could cause spurious adherence violations.

Rejected: injecting only the palette `description` (that is *style* intent, not the
*binding set* — fails AC #3's "binding material constraint"); re-validating the
palette inside `loadPalette` (duplicates `palettes/validate.mjs`, couples `src/` to
that module's policy — the validator is the authority at authoring time).

## Decision 4 — Target & style briefs as shared, spec-grounded data (`src/briefs.mjs`)

The prompt has three content ingredients (spec §7: same target, same style brief,
same palette). Palette is data (D3). The other two:

- **`TARGET_BRIEFS`** — keyed by the schema's `target` enum. Each is the spec §8
  capability statement turned into a build brief (house: "bounded volume with
  interior logic — enclosed space, rooms, openings, fit-out"). Ship **house**
  concretely (the only target the milestone T-004-03 needs); include path and
  landscape briefs as data too, since §8 fully specifies them and the Phase-1
  matrix (spec §11 step 2) will need them — pure data is cheap and anticipates the
  3×3 without new code.
- **`STYLE_BRIEFS`** — keyed by style name. `industrial` reuses the palette's own
  `description` as the material spine plus a short architectural intent. One style
  ships (spec §12 leaves "one palette or a set" open; T-001-04 shipped one).

**Why a separate `briefs.mjs` and not inside `single-shot.mjs`?** Targets and
styles are **shared across archetypes** (spec §7: the multi-shot and multimodal
archetypes build the *same* targets in the *same* styles). Putting house/path/
landscape briefs inside the single-shot module would mis-file shared constants
under one archetype and force the next archetype to either import across archetypes
or duplicate. A tiny `briefs.mjs` is the honest home; both `single-shot.mjs` and
future siblings import it.

Rejected: deriving the style brief solely from the palette (loses the
architectural intent that is distinct from the material list); hardcoding briefs in
the prompt string (the wording-drift failure mode the ticket exists to prevent).

## Decision 5 — Attribution enforced, not hoped (`assertAttribution`)

AC #4: "identified in the trial metadata so results are attributable." Research
found the only lever on artifact metadata is the prompt (model-authored, frozen),
and that `runTrial` asserts `trial_id` agreement but has **no** check on
`prompting_method_id`.

**Decision: two layers.**
1. **Drive it from the prompt.** `buildSingleShotPrompt` pins
   `metadata.prompting_method_id = SINGLE_SHOT.id` (and all other reproducibility
   fields) as explicit directives, and returns the `seedMetadata` it asked for.
2. **Verify it after.** A pure `assertAttribution(artifact, archetype)` throws if
   `artifact.metadata.prompting_method_id !== archetype.id`. The live
   `runSingleShotTrial` calls it on the returned artifact — so a trial whose
   artifact is *not* attributable to this archetype fails loudly rather than
   landing a mislabeled row in `trial.json`. This mirrors the runner's existing
   `trial_id`-mismatch guard and makes AC #4 *enforced*, not merely defaulted.

**Why not modify `runTrial` to check `prompting_method_id`?** The runner is generic
across archetypes and intentionally minimal; the *expected* method id is the
archetype's knowledge, not the runner's. Keeping the assert in the archetype keeps
T-004-01 untouched and the check where the expectation lives. (No change to
`trial.mjs` at all — only `scripts/run-trial.mjs` is rewired.)

## Decision 6 — Module boundary & entrypoint

- **`src/palette.mjs`** (+ test) — `loadPalette(id)`, `formatPaletteBlocks(palette)`.
  Shared loader/formatter. Pure formatter is unit-tested; `loadPalette` reads the
  shipped `industrial.json` in a test (a repo file, deterministic — no network/SDK).
- **`src/briefs.mjs`** — `TARGET_BRIEFS`, `STYLE_BRIEFS`, frozen data. Exercised
  indirectly via the prompt-builder test.
- **`src/single-shot.mjs`** (+ test) — `SINGLE_SHOT` descriptor,
  `buildSingleShotPrompt(spec) → { prompt, seedMetadata }`,
  `assertAttribution(artifact, archetype?)`, and the live
  `runSingleShotTrial(spec)`. Pure functions unit-tested; the live wrapper is not.
- **`scripts/run-trial.mjs`** (modify) — replace the ad-hoc `SAMPLE_PROMPT` with
  `runSingleShotTrial({ target:"house", paletteId:"industrial", style:"industrial",
  ... })`. The demonstrable entrypoint now *is* the archetype.
- **`src/README.md`** (modify) — a "Single-shot archetype (T-004-02)" section.

No change to `src/trial.mjs`, `src/sdk-binding.mjs`, `src/config.mjs` (only an
import *from* config), `src/artifact.mjs`, `palettes/**`, `render/**`, or the
schema. Disjoint file set from any concurrent work.

## What this design explicitly does not do

- Does **not** measure palette adherence — it *asks for* the constraint and records
  `palette_id`; counting violations is E-04 (spec §9).
- Does **not** add path/landscape *trials* — it ships their briefs as data so the
  matrix is one call away, but the milestone (T-004-03) and tests exercise house.
- Does **not** wire rendering — that convergence is T-004-03.
- Does **not** re-validate the palette or re-implement schema enforcement — those
  are owned upstream (`palettes/validate.mjs`, the SDK binding + `artifact.mjs`).
