# T-131-01 design-backlog-factory — Design

Phase: Design. Options weighed against the research; decisions with rationale.

## D1 — Factory shape: pure module + thin impure runner (chosen)

**Options.** (a) One impure script doing everything (the early-mint shape); (b) pure module
`src/factory/backlog.mjs` (decompose-output → draft documents, dedup, scan-dir reasoning, all
deterministic) + impure runner `scripts/design-backlog.mjs` (load pack, render via bridge, ask
via shim, write via pin-guard); (c) a benchmarks/ chain runner.

**Chosen: (b).** It is the house pattern (T-127's composer, T-128's catalog: pure half carries
the unit tests, impure half is I/O glue), and every AC that says "unit-tested" lands in the pure
half: draft rendering, duplicate detection, scan-dir assertion, empty-union classification. A
new `src/factory/` directory names the E-32 concern; `src/pack/` stays the brush/pack domain.
(c) rejected: this is not a measurement chain — no GL, no gates; `scripts/` is the precedent set
by the fixture minter, the factory's nearest relative.

## D2 — Reply policy: promote the shared async variant (chosen)

The factory runner needs bounded same-prompt re-asks with an async parse (`bamlParse`) plus the
FX-D1 classification (empty union = malformed). T-129's review names this exact moment: "if a
third caller needs async-parse reply policy, promote a shared async variant in a non-judge
module — deliberately not done here." The factory is the third caller.

**Chosen:** new `src/baml/reply-policy.mjs` — `runAsyncReplyPolicy({ ask, parse, maxAttempts })`
with T-114 semantics verbatim (parsed = FINAL, re-ask on malformed only, same ask thunk every
attempt, every attempt ledgered with `{attempt, parsed, rawReply-clip, parseError?, transport?,
usage, source}`, full rawTexts kept). Non-judge module ✓ (lives beside the bridge it pairs
with); the frozen `judge-reply.mjs` is untouched (TG4 stays green by construction).
`scripts/mint-baml-fixture.mjs` is refactored to call it — net deletion, one loop to maintain,
ledger fields identical (the mint script's committed fixtures are inputs/outputs, not the loop
code; behavior-preserving by the shared function returning the exact entry shape mint built).

**Rejected:** a second local copy in the factory runner (the smell T-129 named); widening frozen
`judge-reply.mjs` with an async path (instrument surface, E-32 Rule 2).

## D3 — Duplicate detection: code-enforced demotion post-parse (chosen)

The prompt already instructs the distinction, and the fixture shows the model honoring it (18
notes name owned brushes). But the AC wants it *caught*, unit-tested both ways — prompt
instructions are not enforcement.

**Chosen:** pure `enforceRegistryDedup(backlog, ownedNames)`:
- a work item whose `name` is an owned brush (exact registry-name match) is **demoted** to a
  `ParametrizationNote` ({need: its purpose, existing_brush: its name, note: derived from the
  sketch}) and recorded in a `demotions[]` ledger field — the event is the factory's quality
  signal, never silently dropped;
- a note whose `existing_brush` is NOT owned is kept but flagged in `warnings[]` (the model
  hallucinated a covering brush; a human reading the notes file should see the flag, but
  auto-promoting it to a work item would manufacture a draft no one reviewed).
Unit tests cover both directions plus the no-op case. "Covered via parameters" stays the
model's judgment (prompt-level) — code cannot decide semantic coverage, only ownership.

## D4 — Draft format: ticket-shaped but structurally unschedulable (chosen)

One markdown file per work item, `docs/active/backlog/<style>--<brush-name>.md`, YAML
frontmatter + house body. Deliberate differences from a ticket: **no `id:`/`story:`/`phase:`**
fields (lisa's vocabulary is absent, so even a mis-copied file cannot enter the DAG);
`status: draft`; provenance block (style, function, model, prompt sha, run date from the
ledger); empty `promotion:` and `rework:` skeletons for the human to fill. Body sections:
Context (self-contained, from `context` + `purpose`), Acceptance Criteria (from
`acceptance_criteria[]`), Parameter sketch, Composition, Test plan, Preview subject — the
T-128 brush-contract dimensions, so a promoted draft maps 1:1 onto what the registry door
demands. Parametrization notes are **not** per-file (they are not schedulable work): one
`<style>--parametrization-notes.md` per run, warnings inline.

**Rejected:** full ticket frontmatter with a draft id (one `cp` away from being scheduled —
the runaway risk the ticket exists to prevent); JSON drafts (humans review these; the review
surface is markdown, the parsed `backlog.json` record keeps the machine form).

## D5 — Records and reproducibility

The runner writes, all pin-guarded with preflight-before-spend (T-119):
- `docs/active/backlog/records/<style>/{inputs.json, prompt.txt, ledger.json, backlog.json}` —
  T-114 ledger with full rawTexts (the AC's committed raws), the parsed+deduped backlog;
- the draft files + notes file (drafts are pin-guarded too: once committed, a re-run cannot
  silently clobber a human-edited draft — rotation needs `--rotate-pins` in an owning ticket).
`--offline` re-derives every draft from the committed `backlog.json` and asserts byte-identity
(E-31 Rule 5: reproducible-by-replay; rendering is pure, so this is cheap and total). Records
live inside `docs/active/backlog/` (still outside scan dirs — one home for everything the
factory emits) rather than `benchmarks/` (not a measurement chain).

## D6 — The live proof vs the missing T-130 style

T-130 has not started; `packs/rustic.json` is the only formed style on disk. **Chosen:** the
runner is pack-agnostic (`--pack <path>`, no default baked into the module); the live proof runs
against **rustic as the stand-in**, with the caveat named in the records and review (the
research-phase finding, not hidden). Rationale: every AC mechanism (factory, dedup, drafts,
scan-dir guard, promotion doc, raws, offline replay) is provable on rustic today; when T-130's
style is ratified, the milestone run is one command. The rustic registry digest is unchanged
since the fixture mint, so the live prompt should byte-match the fixture's `promptSha256` —
recorded as a cross-check, not hard-asserted (registry growth must not break the runner).

**Rejected:** blocking on T-130 (serializes the epic for a proof the fixture already
half-carries); synthesizing a fake "new style" pack inside T-131 (would duplicate T-130's
deliverable — the parallel-roots lesson).

## D7 — Promotion flow and the rework measure

`docs/active/backlog/README.md` (the one page, in the dir it governs): what a draft is, the
promotion steps (human review → assign id/story/priority → move to `docs/active/tickets/` with
ticket frontmatter → lisa picks it up), who may promote (human, or planner under explicit user
direction — never the factory, never a build session), and the **rework log**: after lisa
executes a promoted draft, record `none` or the edits that were needed in the draft's
`rework:` field plus one line in the README's log table. The factory's quality metric is that
table. The "≥1 promoted and executed cleanly" AC half is a human act by the ticket's own rule —
the review will flag it as the open handoff item, with the exact promotion steps ready.

## D8 — The scan-dir guard

Pure `lisaScanDirs(tomlText)` (flat key-value parse of `[dirs]` — no TOML dep for three lines)
+ `isOutsideScanDirs(dir, scanDirs)` (path-prefix semantics, separator-safe). One test feeds
synthetic configs (both verdicts), one reads the real `.lisa.toml` and asserts
`docs/active/backlog` is outside every scan dir — the AC's "a test asserts the config".

## Decision summary

| seam | decision |
| --- | --- |
| layout | `src/factory/backlog.mjs` (pure) + `scripts/design-backlog.mjs` (impure) |
| reply policy | new shared `src/baml/reply-policy.mjs`; mint refactored onto it; FX-D1 empty-union classifier in the factory module |
| dedup | post-parse demotion + warning, ledgered, unit-tested both ways |
| drafts | ticket-shaped markdown, lisa vocabulary structurally absent, pin-guarded |
| records | `docs/active/backlog/records/<style>/`, T-114 ledger, `--offline` byte-replay |
| live proof | rustic stand-in (T-130 absent), caveat named; runner pack-agnostic |
| promotion | README.md in the backlog dir; rework log = quality metric; promotion stays human |
| `style_summary` | `packSummary` moves to the factory module; mint imports it (one source) |
