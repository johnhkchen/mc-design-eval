# Design — T-005-03 iterative-multimodal.v1 archetype

Decisions and rejected alternatives, grounded in `research.md`. The shape: a new
`src/iterative-multimodal.mjs` whose PURE surface (descriptor, prompt builders,
stop/round bookkeeping, palette-adherence gate) is unit-tested, and whose single
LIVE `runIterativeTrial` orchestrates the seam + render core as thin glue (NOT
unit-tested, spec §4) — mirroring `single-shot.mjs` + `smoke-trial.mjs`.

## D1 — How the loop reaches the model: orchestrate the seam directly

**Options.**
- (a) Call `runTrial` per round. `runTrial` is single-call: it writes the *whole*
  store from one artifact and keys off one `trial_id`. Round 1 would overwrite round
  0's `trial.json`/`transcript.jsonl`, and round 0 (text) can't pass an image anyway.
- (b) **Orchestrate the seam functions directly** (`requestDesignArtifact` for round
  0, `requestDesignArtifactWithImage` for rounds 1..N), accumulating messages across
  rounds, and write the store once at the end.

**Decision: (b).** It is exactly how `smoke-trial.mjs` already steps outside the
single-call runner to add rendering. The seam (`sdk-binding.mjs`) remains the one
metered boundary — we call its two public functions and nothing else touches the
CLI. Round 0 must use the **text** path (no image exists yet); rounds 1..N use the
**image** path. We reuse `tallyUsage` / `serializeTranscript` / `buildTrialRecord`
(pure, from `trial.mjs`) for logging so the record format does not fork.

Rejected (a): structurally impossible for multi-round + image (above).

## D2 — Round-0 prompt: a sibling builder, not a reuse of buildSingleShotPrompt

**Options.**
- (a) Reuse `buildSingleShotPrompt` and override metadata. Its body literally says
  "Produce the ENTIRE design in ONE response… no revision" and pins
  `prompting_method_id = single-shot.v1`. Both are wrong for us, and it is `assertSpec`-
  bound to single-shot's spec shape.
- (b) Generalize single-shot's builder to take an archetype + an "is this the final
  turn" flag. Touches `single-shot.mjs` (another ticket's file) and entangles two
  independently-versioned prompt policies — a change to one risks moving the other's
  results, defeating attribution.
- (c) **Write a dedicated `buildRound0Prompt` in the new module**, reusing the same
  *construction shape* (Target → Style → binding palette via `formatPaletteBlocks` →
  metadata pins → style record) but with iterative-appropriate framing ("this is an
  initial draft you will revise from a render") and the iterative archetype id.

**Decision: (c).** Each archetype owns its own wording so each is independently
versioned — the whole point of `.v1` attribution (spec §7). ~30 lines of shared
scaffolding duplicated across two sibling archetypes is the correct cost; coupling
them through a shared mutable builder is not. Mirrors how `single-shot` and
`smoke-trial` are siblings, not a base class hierarchy.

Rejected (a): wrong wording + wrong id + wrong spec binding. Rejected (b): cross-
ticket file contention + attribution entanglement.

## D3 — The revision prompt: versioned, render-grounded, re-pins identity

`buildRevisionPrompt(spec, round) → { prompt, seedMetadata }`. PURE. Contents:
- A fixed, versioned instruction: "Here is a render of your CURRENT design. Improve
  realism, proportion, depth, and neoclassical detail — **columns, entablature,
  pediment, steps, window rhythm** — while staying strictly within the palette. Emit
  the COMPLETE revised artifact (not a diff)." (The detail vocabulary is the
  ticket's, aligned with `STYLE_BRIEFS.neoclassical`.)
- The **binding palette whitelist re-injected** (same `formatPaletteBlocks`) so
  "strictly in the palette" is enforceable and the model has the set in-context.
- **Metadata pins re-stated** — `trial_id`, `prompting_method_id =
  iterative-multimodal.v1`, `model_id`, `seed`, `server_state_id`, `target` — so the
  revised artifact stays attributable and the `trial_id` join key cannot drift.
- It does **not** restate the full target brief (the model has it from round 0 +
  the image); it states the target only by name to anchor the revision. Keeping the
  revision turn focused on "improve what you see" is the archetype's intent.

`round` is included in the prompt as a human-legible "revision N of M" line but does
**not** change the instruction text — so all revision turns are byte-identical except
that counter, preserving attribution (one versioned revision policy, not N).

**Why re-pin rather than stamp:** the harness cannot stamp the model-authored,
schema-enforced, frozen artifact (same reason single-shot pins via prompt). So we
pin via prompt and **guard** via `assertAttribution` each round (D6).

## D4 — Configurable rounds + stop conditions (pure bookkeeping)

- `rounds` is `spec.rounds ?? ITERATIVE_MULTIMODAL.defaultRounds` (default **3**),
  validated by `assertSpec` as a positive integer. "Rounds" = number of *revision*
  turns after round 0 (so default = 1 generate + 3 revisions = 4 model calls).
- **Stop conditions:** (i) the configured round count is reached; (ii) a **no-op
  revision** — the model returns a build materially identical to the prior round.
- `isNoOpRevision(prev, next) → boolean` — PURE. Compares the **build-determining**
  content: `placements` and `style` (deep, order-sensitive — placement order is part
  of the build). Metadata/palette-manifest churn is ignored (a re-pin of identical
  placements is still a no-op). Deterministic, no I/O.

**Why placements+style, not whole-artifact:** two rounds can differ only in
`palette.manifest` ordering or a reworded rationale while the *build* is identical —
that is a no-op for measurement purposes (nothing new to render/score). Excluding
metadata also avoids a false "changed" on any per-round counter we might add.

Rejected: a perceptual/pixel diff of the renders (non-deterministic, GL-bound, not
unit-testable, and overkill — identical placements ⇒ identical render by
construction).

## D5 — Palette-adherence gate (AC #3) — archetype-local, pure

AC #3 demands "schema **+ palette-adherent**" per round. Schema is re-validated
inside the seam (throws). Palette-adherence does not exist yet (`palette.mjs` defers
it to E-04). 

**Decision:** add a focused, PURE `assertInPalette(artifact, palette)` in the new
module. It (a) collects every `placement.block`, normalizes the `minecraft:` prefix,
and asserts each is in the palette's bare-id whitelist; (b) asserts
`palette.manifest ⊆ whitelist`; (c) asserts `artifact.palette.palette_id` matches the
configured palette id. Throws a located error naming the offending block(s) and
round, so a violating round **fails loudly** rather than logging a bad row.

**Why archetype-local, not in `palette.mjs`:** the full E-04 adherence scorer is out
of scope this phase, and `palette.mjs` is also touched by sibling T-005-01 (avoid
contention). This is a narrow harness gate, documented as the precursor the E-04
checker can later absorb (exactly what `palette.mjs`'s header anticipates). Noted as
a follow-up in `review.md`.

Rejected: relying on schema validation alone (does not check the whitelist — would
let an off-palette build through, violating AC #3). Rejected: editing `palette.mjs`
now (cross-ticket contention + scope creep into E-04).

## D6 — Attribution + trial-id stability per round (AC #4)

Reuse `assertAttribution(artifact, ITERATIVE_MULTIMODAL)` (already archetype-
parameterized) after **every** round, round 0 included. Add `assertTrialId(artifact,
spec.trialId)` so the join key is verified stable across all rounds — a revision that
silently changed `trial_id` would orphan the trial from its score/rating rows. Both
guards run before the round is logged, so a misattributed round throws instead of
writing a wrong record.

## D7 — Per-round logging & the trial record shape

The record extends `buildTrialRecord`'s identity fields with iterative structure
(pure builders, testable with `finishedAt` as a param):
- `buildRoundRecord({ round, mode, messages, raw, render?, image? })` — one round's
  row: `{ round, mode: "text"|"multimodal", status, usage: tallyUsage(messages,raw),
  render?: renderSummary, image? }`.
- `buildIterativeRecord({ artifact, rounds, roundsConfigured, stoppedReason,
  finishedAt })` — top-level: identity from the final artifact + `archetype: { id,
  version, rounds_configured, rounds_run, stopped_reason }`, `rounds[]`, a summed
  `usage.totals`, `status`, `finished_at`. Reuses `renderSummary` (drops the absolute
  path, like `attachRender`). Per-round usage carries image tokens (they ride in the
  turn usage `tallyUsage` reads) — giving the spec §9 turn-over-turn growth view.

Store layout under `outDir/<trial_id>/` (one dir per trial, like the others):
`artifact.json` (final), `artifact-round<k>.json` (each round, insurance/debug),
`<trial_id>-rev<k>.png` (each WIP render via `derivePath`), `transcript.jsonl` (all
rounds concatenated, stream order), `trial.json` (the iterative record).

## D8 — Heavy deps stay lazy

`renderArtifact` (GL/prismarine) is `await import(...)`-ed **inside**
`runIterativeTrial`, exactly as `smoke-trial.mjs` does. Top-level imports are pure
(`fs`, `path`, the seam, the pure render/trial helpers, briefs, palette, artifact),
so `iterative-multimodal.test.mjs` runs offline and GPU-free and the running suite
is itself the proof the deps are lazy.

## D9 — Live-path risk acknowledged, not designed around

The T-005-02 stream-json image envelope is unverified against the live CLI. We
build on the seam as-is (AC #2 is confirmed by a documented live round-trip, not
`npm test`). If the CLI rejects the envelope, the documented fallback (render MCP via
`--mcp-config` + `toToolResult`) is a seam-level change in `sdk-binding.mjs`, not an
archetype redesign — our loop would pass images the same way. Flagged in `review.md`.

## Summary of the chosen surface

PURE (unit-tested): `ITERATIVE_MULTIMODAL`, `assertSpec`, `buildRound0Prompt`,
`buildRevisionPrompt`, `isNoOpRevision`, `assertInPalette`, `assertTrialId`,
`buildRoundRecord`, `buildIterativeRecord` (+ reused `assertAttribution`).
LIVE (glue, not tested): `runIterativeTrial`. One new id in `config.mjs`.
