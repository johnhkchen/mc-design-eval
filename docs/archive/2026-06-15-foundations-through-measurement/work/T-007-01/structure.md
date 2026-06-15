# Structure — T-007-01: ground-on-horyuji

The shape of the work: which files change, which are produced, which are frozen, and the ordering.
This ticket is **experiment-shaped** — most "structure" is artifacts + a journal append, with a *code
edit only as a conditional contingency*. No new modules.

## Files — source code

### Reverted to HEAD (the one guaranteed code action)
- **`benchmarks/temple-facade/run.mjs`** — `git checkout HEAD --` to drop S-010's un-promoted
  texture-grain working-tree edit, restoring the committed **015-menu champion** (Decision A).
  Net effect vs HEAD after this: **zero diff** (tree clean) unless a P12/P13 trigger fires.

### Conditionally modified (ONLY if a pre-registered P12/P13 trigger fires — Decision C)
- **`benchmarks/temple-facade/run.mjs`** — a *single minimal clause* in exactly one of:
  - `composeRefRevisionPrompt` (~L419, the P13 one-plane block) — generalize "corner towers/minarets"
    to also name "**stacked tiers / a tower mass = setbacks of one connected plane, not free boxes**";
    and/or
  - the P12 color-hold block (~L443) — name the *timber/wood* monochrome failure mode explicitly.
  - Boundaries: append/replace within the existing bullet only; no new function, no signature change,
    no call-site change. `composeRefRevisionPrompt` has exactly one call site (stage 3, ~L930).

### Frozen (must not change — per AC)
- `benchmarks/temple-facade/task.mjs` (brief, seed=11, view), `judge.mjs` + `baml-judge.mts` +
  `baml_src/*` (rubric `v2-categorical-baml`), the AJV schema, `src/config.mjs` (model pin),
  `composeHighResBuildPrompt` (round-0 control), `composeReferenceDesignDocPrompt` (stage-1 doc).

## Files — work artifacts (`docs/active/work/T-007-01/`)

- `research.md` *(done)* — map.
- `design.md` *(done)* — Decisions A–D.
- `structure.md` *(this file)*.
- `plan.md` — ordered steps + verification.
- `progress.md` — live tracker + the A/B scoreboard (round-0 vs render, per dimension) + P12/P13
  verdict scratch.
- `judge-round0.mjs` — **copied** from `docs/active/work/T-006-01/judge-round0.mjs` (proven helper;
  scores any PNG via `judgeRender` median-of-3 against the frozen brief). Same relative-import depth
  (`../../../../benchmarks/temple-facade/…`) since it sits at the same directory depth — no path edit
  needed. This satisfies AC #1's "round-0.png … scored" without touching `run.mjs`'s `main()`.
- `review.md` — handoff.

## Files — the journal (the substantive deliverable)

- **`docs/knowledge/design-learnings.md`** — append ONE dated entry to the "Attempt log (newest last)"
  section (~L206, append at end). Content (AC #2/#3):
  - run id (`019-vRefRevise-designdoc`), reference (Hōryū-ji), config (champion, 015 menu, reverted).
  - **A/B per-dimension table**: round-0 vs render × {proportion, color, detail, fidelity, overall}.
  - **P12 verdict** — held / failed (+ scope if failed): did it stay colorful, or did the timber
    palette leak to monochrome?
  - **P13 verdict** — held / failed (+ scope if failed): one connected plane with surviving
    proportion under vertical massing, or detached/floating tiers/tower?
  - judge `notes` excerpts grounding each verdict in the render.
  - if any minimal prompt edit was made: the diff + the `npm test` green confirmation.
  - **Refine the Principles section** (P12/P13 text, and/or the P15 measurement caveat) *only* as the
    result warrants — e.g. generalize P13's wording to cover stacked-tier references if it held, or
    scope it if it failed.

## Files — run outputs (auto-produced by `run.mjs`, retained — AC #4)

`benchmarks/temple-facade/runs/019-vRefRevise-designdoc/`: `reference.JPG`, `design-doc.md`,
`*.prompt.txt`, `round-0.png`, `render.png`, `artifact.json`, `summary.json`, `transcript.jsonl`.
README gallery regenerates automatically. These are the durable evidence; do not prune.

## Ordering (where it matters)

1. **Revert → test** must precede the run (the run reads the working-tree prompt; it must be the
   champion). Already executed in Implement once research/design/structure/plan are written, but the
   *causal* order is fixed: clean tree → green test → launch.
2. **Run → judge** — `render.png` is auto-judged by `main()`; `round-0.png` is judged *after* with the
   helper. Both before the journal entry (the entry needs both columns).
3. **Judge → verdict → journal → (conditional edit) → review.** The conditional edit, if any, is
   decided from the render *before* writing it, then re-tested.

## Risk / blast radius

- The revert touches only `run.mjs` and only the detail bullet region (confirmed +14/−4 at start);
  reversible (T-010-01 artifacts document the texture edit if it must be reapplied later).
- A conditional prompt edit is confined to one bullet in one single-call-site function; `npm test`
  (133) re-run guards artifact validity (a string edit cannot break the schema, but the gate is cheap).
- No frozen file is touched; no schema/rubric/brief drift; the generalization signal is preserved.
