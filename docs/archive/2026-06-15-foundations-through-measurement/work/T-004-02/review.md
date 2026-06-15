# Review — T-004-02 single-shot-archetype

Handoff: what changed, how the ACs are met, test coverage, and open concerns. The
ticket adds the single-shot prompting archetype (spec §7 archetype 1) — a named,
versioned prompt-construction policy over the T-004-01 runner.

## What changed

**Created**
- `src/palette.mjs` — shared palette loader (`loadPalette`) + prompt formatter
  (`formatPaletteBlocks`). Consumer #1 of the T-001-04 whitelist.
- `src/palette.test.mjs` — 7 unit tests.
- `src/briefs.mjs` — frozen `TARGET_BRIEFS` (house/path/landscape) + `STYLE_BRIEFS`
  (industrial). Shared across archetypes (spec §7).
- `src/single-shot.mjs` — `SINGLE_SHOT` descriptor, `buildSingleShotPrompt`,
  `assertAttribution` (pure), `runSingleShotTrial` (live/metered).
- `src/single-shot.test.mjs` — 11 unit tests.

**Modified**
- `scripts/run-trial.mjs` — rewired from a hand-written `SAMPLE_PROMPT` to
  `runSingleShotTrial` (house / industrial).
- `src/README.md` — "Single-shot archetype (T-004-02)" section + test-line update.

**Untouched** (verified): `src/trial.mjs`, `src/sdk-binding.mjs`, `src/config.mjs`
(imported from only), `src/artifact.mjs`, `palettes/**`, `render/**`, `schema/**`.
Disjoint file set from the concurrent T-003-03 render work on the same branch — no
lock contention, no shared file.

5 commits on `main`. Working tree clean apart from untracked Lisa/work docs.

## Acceptance criteria — how each is met

- **AC #1 — a versioned single-shot archetype config constructs the prompt from
  target + palette + style brief.** `SINGLE_SHOT` is the versioned descriptor
  (`id = "single-shot.v1"`, single-sourced from `config.mjs`). `buildSingleShotPrompt`
  assembles the prompt from `TARGET_BRIEFS[target]`, `STYLE_BRIEFS[style]` + the
  palette `description`, and the injected whitelist — in fixed, ordered sections so
  the wording is stable (the anti-drift property §7 asks for). Covered by the
  "carries the target brief and the named style brief" and determinism tests.
- **AC #2 — one generation produces a complete, schema-valid artifact.** The
  archetype routes through `runTrial` → `requestDesignArtifact`, which constrains
  the model to the schema (`outputFormat`) and re-validates the result. Single-shot
  = one `query()`, `SAFE_TRIAL_OPTIONS` (no tools), no revision turn. The prompt
  explicitly demands the ENTIRE design in ONE response ("no revision" test). The
  schema-validity guarantee is inherited from the binding, not re-implemented.
- **AC #3 — the palette is injected as the binding material constraint.**
  `formatPaletteBlocks` renders the full whitelist into the prompt under a
  "Material constraint (binding)" heading framed as the ONLY allowed set, with
  out-of-whitelist = violation, plus directives to record `palette.palette_id` and
  keep `manifest ⊆ whitelist`. The "prompt injects the whole palette whitelist"
  test asserts every one of the 37 industrial blocks appears, plus the binding
  phrasing and the palette_id directive.
- **AC #4 — the archetype is identified in the trial metadata so results are
  attributable.** The prompt pins `metadata.prompting_method_id = SINGLE_SHOT.id`;
  `buildTrialRecord` (T-004-01) copies that field from the artifact into
  `trial.json`; and `assertAttribution` *verifies* it on the returned artifact,
  failing a mislabeled trial loudly. Attribution is thus prompt-driven **and**
  enforced. Covered by the metadata-pinning and `assertAttribution` tests.

## Test coverage

`npm test` → **72/72** (was 54; +7 palette, +11 single-shot). All offline,
deterministic, no SDK import, no network — they assert over the real shipped
`industrial` palette and plain objects.

Well covered: palette load (incl. unknown-id error) + formatting (grouped, `other`,
flat, deterministic); prompt content (whitelist injection, binding framing, target
+ style briefs, single-shot framing); metadata pinning incl. the archetype id;
model override; optional `createdAt`; spec validation (unknown target/style, empty
ids, non-integer seed); prompt determinism; attribution pass/throw.

**Deliberately not unit-tested** (spec §4 — metered): `runSingleShotTrial` and the
rewired CLI. Identical posture to T-004-01's `runTrial`/`run-trial.mjs`. Their
logic is the pure functions that *are* tested plus the already-tested `runTrial`.

## Open concerns / flags for human attention

1. **The live path is unexercised in this ticket.** `runSingleShotTrial` and the
   CLI have never made a real call here (by §4 policy). The first true end-to-end
   single-shot run is **T-004-03** (the milestone). Worth a deliberate first run
   there to confirm the prompt actually elicits a schema-valid, attributed artifact
   — the unit tests prove the prompt *says* the right things, not that the model
   *obeys*. **Low–medium risk; expected, and owned by T-004-03.**
2. **Attribution depends on model compliance, with a backstop.** If the model
   ignores the pinned `prompting_method_id`, `assertAttribution` throws rather than
   logging a wrong row — correct failure mode, but it means a non-compliant model
   yields *no* trial rather than a mislabeled one. If that proves brittle in
   T-004-03, the mitigation is small (the harness could reconcile the field
   post-hoc), but I deliberately did **not** post-stamp the frozen, model-authored
   artifact. **Flag, not a defect.**
3. **Bare-vs-namespaced block ids.** The prompt instructs `minecraft:`-prefixed
   emission from the bare whitelist; E-04 adherence already strips the prefix, so
   the spellings reconcile. No code path here depends on the model obeying — it
   only affects later scoring. **Low risk.**
4. **`path`/`landscape` briefs ship but are untested/unrun.** Pure data,
   spec-§8-grounded, included to make the 3×3 matrix one call away. They are
   exercised by neither a test nor the CLI yet. **Negligible risk; flagged for
   honesty.**
5. **`loadPalette` does not re-validate.** By design (the palette is validated at
   authoring time by `palettes/validate.mjs`). If a hand-edited, never-validated
   palette file is loaded, a malformed `blocks` would flow into the prompt
   unchecked. Acceptable for Phase 1 (palettes are authored + validated, not
   user-supplied), but a future ticket wiring user palettes should add a load-time
   structural check. **Low risk; noted.**

## Verdict

All four ACs met and covered by the offline suite; no regressions (72/72); changes
confined to a disjoint, additive file set. The single remaining unknown — does the
live model produce an attributed, schema-valid house from this prompt — is the
explicit job of the next ticket (T-004-03, the milestone). **Safe to advance.**
