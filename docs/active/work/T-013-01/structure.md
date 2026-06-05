# Structure — T-013-01: persona-system-prompt-ab

The shape of the work: which files change, which are produced, which are frozen, ordering. Unlike the
generalization tickets, this one has a **real (if small) source change** — the `--system-prompt` wiring —
plus the persona artifact and a two-run A/B.

## Files — source code (the guaranteed code change; minimal, default-preserving)

### `src/sdk-binding.mjs` — add an optional `system` pass-through to three functions
Mirror the existing `requestText` line `if (system) args.push("--system-prompt", system)` (L450) into the
three functions the champion uses and which currently lack it:
- **`requestTextWithImage`** (L463) — add `system` to the destructured params; push `--system-prompt`
  after the `--model`/`--effort` pushes (L470–471). (Stage 1: reference design doc.)
- **`requestDesignArtifact`** (L287) — add `system` to params; push `--system-prompt` after `--model`
  (L290). Keep the `options`-reserved comment. (Stage 2: high-res build.)
- **`requestDesignArtifactWithImage`** (L339) — add `system` to params; push `--system-prompt` after
  `--model` (L351). (Stage 3: reference-compared 2nd pass.)
- **Invariant:** each push is guarded `if (system)`, so `system === undefined` ⇒ `args` unchanged ⇒
  default path byte-identical. Update each JSDoc to document the new `system` param (parity with
  `requestText`'s doc, L442).
- **No change** to `invokeClaude`, `_runClaude`, `requestText` (already wired), or any pure helper.

### `benchmarks/temple-facade/run.mjs` — thread a `--persona-file` flag to the champion
- **`parseArgs`** (L1024) — add `else if (argv[i] === "--persona-file") out.personaFile = argv[++i];`;
  add `personaFile: undefined` to the `out` default (L1025).
- **`main`** (L1085) — destructure `personaFile`; if set, `persona = readFileSync(personaFile, "utf8")`
  (else `undefined`); pass `persona` into the `run(..., { runId, dir, renderArtifact, k, ref, persona })`
  ctx (L1104). Add `personaFile` basename (or `persona != null`) to `summary.json` (near `effort`, L1138)
  for attribution.
- **`vRefRevise-designdoc` approach** (L881) — add `system: ctx.persona` to the three stage calls (L899
  `requestTextWithImage`, L912 `requestDesignArtifact`, L922 `requestDesignArtifactWithImage`). When
  `ctx.persona` is undefined → `system` undefined → default path. (Optionally `copyFileSync` the persona
  file into the run dir for provenance.)
- **No change** to other approaches, `nextSeq`, `regenerateReadme`, or the render/judge calls.

### Frozen (must not change — per AC, would confound the test)
- `benchmarks/temple-facade/task.mjs` (brief, seed=11, view), `judge.mjs` + `baml-judge.mts` +
  `baml_src/*` (rubric), the AJV schema, `src/config.mjs` (model pin), and the four `compose*Prompt`
  builders (the persona is a *separate* system prompt, never a prompt-body edit).

## Files — work artifacts (`docs/active/work/T-013-01/`)

- `research.md` *(done)* — the seam map; what's already wired (`requestText`) vs not (the 3 champion fns).
- `design.md` *(done)* — Decisions A (wiring shape), B (persona text), C (protocol), D (verdict rubric).
- `structure.md` *(this file)*.
- `plan.md` — ordered steps + verification.
- **`persona.md`** — the master-architect persona text (Decision B), fed verbatim via `--persona-file`.
  **This file IS the AC's "note the persona text used"** and the experiment's independent variable.
- `progress.md` — live tracker + the on/off A/B scoreboard (both rounds, both runs, per dimension).
- `judge-round0.mjs` — **copied** from `docs/active/work/T-006-01/judge-round0.mjs` (scores any PNG via
  `judgeRender` median-of-3 against the frozen brief). Same relative-import depth — no path edit. Used to
  judge each trial's `round-0.png` (P14 attribution: build vs 2nd pass).
- `review.md` — handoff.

## Files — the journal (a substantive deliverable)

- **`docs/knowledge/design-learnings.md`** — append ONE dated entry to the "Attempt log (newest last)"
  (EOF; currently ends at the run-021 / Arc entry). Content (AC #3):
  - the two run ids (OFF + ON), reference (Taj), seed (11), config (champion), and the **persona text** (or
    a pointer to `persona.md` + a quoted summary).
  - **the wiring diff** (the `system` pass-through + `--persona-file` flag) and `npm test` green.
  - **per-dimension on-vs-off table** (both rounds of both runs).
  - **which dimensions moved (if any)** and the **verdict** — adopt as default / no effect / harmful —
    **calibrated to effect size** with the n=1 generation-noise caveat (esp. detail; P15) stated.
  - if the verdict is "adopt," note that a confirmer run is recommended before changing any default
    (n=1 cannot separate a small effect from noise).
  - **Possibly a new Principle / tunable-params note** on whether a persona system prompt is a lever — but
    only if the effect is credible; otherwise record "no measurable effect at n=1" honestly.

## Files — run outputs (auto-produced by `run.mjs`, retained — AC)

Two dirs, `benchmarks/temple-facade/runs/<NNN>-vRefRevise-designdoc/` (OFF) and `<NNN+1>-…` (ON), each:
`reference.png`, `design-doc.md`, `*.prompt.txt`, `round-0.png`, `render.png`, `artifact.json`,
`summary.json` (carrying the persona attribution field), `transcript.jsonl`. README gallery regenerates.

## Ordering (where it matters)

1. **Wire code → `npm test` green → capture diff.** The wiring must be in place and tested *before* either
   run (both runs use the post-wiring code; OFF re-confirms the default path is intact).
2. **Run OFF → completes → Run ON.** Sequential (avoid `nextSeq()` collision; rate limits serialize).
3. **Judge all four images** (2× round-0 helper + 2× render auto). Then the comparison → journal → review.

## Risk / blast radius

- **Source change is small and guarded:** 3 one-line conditional pushes + 3 JSDoc lines in `sdk-binding`; 1
  flag + 1 file-read + 1 ctx field + 3 call-site args + 1 summary field in `run.mjs`. Every new flag is
  `if`-guarded so the default path is byte-identical — the OFF run proves it.
- **No frozen file touched;** the judge is a separate process (persona cannot leak into scoring).
- **No test breaks:** the spawn functions are not unit-tested and no test asserts their `args`; `npm test`
  (133) covers only pure helpers, which are untouched. Re-run after wiring to confirm green.
- **Rollback:** `git checkout HEAD -- src/sdk-binding.mjs benchmarks/temple-facade/run.mjs` restores the
  pre-wiring state; the wiring is additive and inert without the flag.
