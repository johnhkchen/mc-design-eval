# Structure — T-009-01: effort-ab-on-champion

File-level blueprint. Like T-013-01, this ticket has a **real (small) source change** — the `--effort`
pass-through — plus a two-run A/B and a journal entry. The change is a near-exact one-knob analogue of the
already-merged persona wiring.

## Files — source code (the code change; minimal, default-preserving)

### `src/sdk-binding.mjs` — add an optional `effort` pass-through to TWO functions
Mirror the existing `requestText` line `if (effort) args.push("--effort", String(effort));` (L455) into the
two artifact functions that the champion uses for stages 2–3 and that currently lack it:

- **`requestDesignArtifact`** (L289) — add `effort` to the destructured params (alongside
  `prompt, model, system, options, onMessage, retries`); push `--effort` after the `--model` push (L292),
  before/after `--system-prompt` (order irrelevant — flags are position-independent; match `requestText`'s
  `model → effort → system` order for consistency). Stage 2: high-res build.
- **`requestDesignArtifactWithImage`** (L344) — same: add `effort` to params; push `--effort` after
  `--model` (L356). Stage 3: reference-compared 2nd pass.
- **Invariant:** each push is guarded `if (effort)`, so `effort === undefined` ⇒ `args` unchanged ⇒
  default path byte-identical. Update each JSDoc `@param` block to document `effort` (copy the phrasing
  from `requestText`'s doc, L448–450: "`effort` maps to the CLI's `--effort` (reasoning-effort knob — the
  closest tunable to 'temperature', which `claude -p` does not expose)").
- **No change** to `invokeClaude`, `_runClaude`, `requestText`/`requestTextWithImage` (already wired), or
  any pure helper. The `void options;` line and the retry loop stay exactly as-is — the new param is read
  once when building `args`, outside the loop.

Resulting `args` head in each function becomes:
```js
const args = ["-p", "--output-format", "stream-json", "--verbose", /* …image flags… */];
if (model)  args.push("--model", model);
if (effort) args.push("--effort", String(effort));   // <-- NEW (guarded)
if (system) args.push("--system-prompt", system);
```

### `benchmarks/temple-facade/run.mjs` — thread an `--effort` flag to the champion
- **`parseArgs`** (L1030) — add `else if (argv[i] === "--effort") out.effort = argv[++i];`; add
  `effort: undefined` to the `out` default object (L1031).
- **`main`** (L1093) — destructure `effort` from `parseArgs`; pass it into the ctx object handed to
  `run(...)` (L1114): `{ runId, dir, renderArtifact, k, ref, persona, effort }`.
- **`summary.json`** (L1147) — replace the hardcoded `effort: null` with `effort: effort ?? null` so the
  arm is recorded (`null` = default arm, `"high"` = high arm). The neighboring comment already explains the
  field; leave it.
- **`vRefRevise-designdoc` approach** (L881) — add `effort: ctx.effort` to the three stage calls:
  - Stage 1 `requestTextWithImage` (L903) — already accepts `effort`; pass `effort: ctx.effort`.
  - Stage 2 `requestDesignArtifact` (L917) — pass `effort: ctx.effort` (newly wired).
  - Stage 3 `requestDesignArtifactWithImage` (L927) — pass `effort: ctx.effort` (newly wired).
  When `ctx.effort` is undefined → `effort` undefined → default path. (Stage 1 already sits next to its
  `system: persona` arg — add `effort` right beside it.)
- **No change** to other approaches, `nextSeq`, `regenerateReadme`, the render/judge calls, or the persona
  threading (independent knob; both can be set, but this ticket sets only effort).

### Frozen (must not change — per AC, would confound the A/B)
- `benchmarks/temple-facade/task.mjs` (brief, `seed: 11`, view), `judge.mjs` + `baml-judge.mts` +
  `baml_src/*` (rubric), the AJV schema, `src/config.mjs` (model pin), and every `compose*Prompt` builder
  (effort is an invocation knob, never a prompt edit).

## Files — work artifacts (`docs/active/work/T-009-01/`)

- `research.md` *(done)* — seam map; effort already wired in `requestText*`, absent from the 2 artifact fns.
- `design.md` *(done)* — Decisions A (wiring), B (levels: `high` vs omit), C (full pipeline), D (verdict).
- `structure.md` *(this file)*.
- `plan.md` — ordered steps + verification criteria.
- `judge-round0.mjs` — **copied** from `docs/active/work/T-006-01/judge-round0.mjs` (scores any PNG via
  `judgeRender` median-of-3 against the frozen brief). Same relative-import depth (`../../../../benchmarks/
  temple-facade/...`) — no path edit needed. Used to judge each run's `round-0.png` for P14 build-vs-2nd-
  pass attribution.
- `progress.md` — live tracker + the default-vs-high A/B scoreboard (both rounds, both runs, per dimension,
  plus wall-clock).
- `review.md` — handoff.

## Files — the journal (a substantive deliverable, AC #3)

- **`docs/knowledge/design-learnings.md`** — append ONE dated entry to the "Attempt log (newest last)" tail
  (currently ends at the run-022 / Cobalt Ascendant entry). Content:
  - the two run ids (default + high), reference (Taj), seed (11), config (champion `vRefRevise-designdoc`),
    and the exact `--effort` level used for the high arm.
  - **the wiring diff** (the `effort` pass-through into the 2 artifact fns + the `--effort` flag) and
    `npm test` green.
  - **per-dimension default-vs-high table** — both rounds (round-0 build, render 2nd pass) of both runs.
  - **the wall-clock cost difference** (from `summary.json.durationMs`).
  - the **verdict** — *adopt high effort as default* / *not worth the latency* / *inconclusive* — calibrated
    to effect size per Decision D, with the n=1 / P15-detail-noise caveat stated; if "adopt," note a
    confirmer run is required before changing any default.
  - optionally a new tunable-params note on whether `--effort` is a lever — only if the effect is credible;
    otherwise record "no measurable effect at n=1" honestly.

## Files — run outputs (auto-produced by `run.mjs`, retained — AC #4)

Two dirs `benchmarks/temple-facade/runs/<NNN>-vRefRevise-designdoc/` (default) and `<NNN+1>-…` (high),
each carrying: `reference.png`, `design-doc.md`, `*.prompt.txt`, `round-0.png`, `render.png`,
`artifact.json`, `summary.json` (with the `effort` arm field populated), `transcript.jsonl`. README gallery
regenerates from the summaries.

## Ordering (where it matters)

1. **Probe the legal `--effort` token** (non-metered: `claude --help` / a trivial dry call) → pin `high`.
2. **Wire code (2 fns + run.mjs) → `npm test` green → capture the diff.** The wiring must be in place and
   tested *before* either run; both runs use post-wiring code, and the default arm re-confirms the path is
   intact (no flag ⇒ unchanged).
3. **Run DEFAULT arm** (no `--effort`) → completes → **Run HIGH arm** (`--effort high`). Sequential — avoids
   `nextSeq()` collision and respects rate limits. Same `--ref references/taj_mahal.png` both times.
4. **Judge `round-0.png`** of each via `judge-round0.mjs` (render.png is auto-judged by `main`).
5. **Fill `progress.md` scoreboard → append the journal entry → write `review.md`.**

## Interfaces touched (summary)

| Symbol | File | Change |
|--------|------|--------|
| `requestDesignArtifact` | sdk-binding.mjs | +`effort` param, +guarded `--effort` push, +JSDoc |
| `requestDesignArtifactWithImage` | sdk-binding.mjs | +`effort` param, +guarded `--effort` push, +JSDoc |
| `parseArgs` | run.mjs | +`--effort` flag, +`effort` default |
| `main` | run.mjs | +destructure `effort`, +ctx thread, +`summary.effort` |
| `vRefRevise-designdoc` | run.mjs | +`effort: ctx.effort` on 3 stage calls |
