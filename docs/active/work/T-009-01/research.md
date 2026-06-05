# Research — T-009-01: effort-ab-on-champion

Descriptive map of the seam, the champion pipeline, and the wiring state of the `--effort` knob.
No solutions here — those are in `design.md`.

## The ticket in one line

`claude -p` exposes **no `--temperature`**; `--effort` (reasoning effort) is the only deliberation
knob. A/B it on the champion (`vRefRevise-designdoc` on `references/taj_mahal.png`, same seed): default
effort vs high effort, per-dimension scores + wall-clock, then a journal verdict.

## The seam: `src/sdk-binding.mjs`

The SINGLE live/metered seam (spec §4). All trials shell out to the `claude -p` headless CLI
(`--output-format stream-json --verbose`), authenticated by the subscription. The module exposes four
live request functions plus pure helpers. Two private spawn cores back them:
- `invokeClaude({args, stdin, onMessage})` — spawn → stream → **validate against the artifact schema**.
  Backs the two artifact-returning functions.
- `_runClaude({args, stdin, onMessage})` — spawn → stream → return terminal result (no validation).
  Backs the two text-returning functions.

### `--effort` wiring state — THE central finding

The CLI flag exists: `claude --help` shows `--effort <level>` ("Effort level for the current session").
The Node binary is on PATH at `~/.local/bin/claude`.

Within `sdk-binding.mjs`, `--effort` is **already plumbed into the two `requestText*` functions** and
**absent from the two artifact functions**:

| Function | Spawn core | `effort` param? | Pushes `--effort`? | Champion stage |
|----------|-----------|-----------------|--------------------|----------------|
| `requestText` (L452) | `_runClaude` | ✅ yes | ✅ `if (effort) args.push("--effort", String(effort))` (L455) | — |
| `requestTextWithImage` (L470) | `_runClaude` | ✅ yes | ✅ (L478) | **Stage 1** (ref design doc) |
| `requestDesignArtifact` (L289) | `invokeClaude` | ❌ no | ❌ | **Stage 2** (high-res build) |
| `requestDesignArtifactWithImage` (L344) | `invokeClaude` | ❌ no | ❌ | **Stage 3** (ref-compared 2nd pass) |

So the champion's stage 1 *could* already receive effort, but stages 2 and 3 (the two artifact-emitting
calls) **cannot** — the param is not in their signatures. To A/B effort across the *full* pipeline the
gap is exactly two functions: `requestDesignArtifact` and `requestDesignArtifactWithImage`.

The wiring pattern is fixed and trivial. `requestText` (L452–459) is the reference:
```js
const args = ["-p", "--output-format", "stream-json", "--verbose"];
if (model) args.push("--model", model);
if (effort) args.push("--effort", String(effort));   // <-- the line to mirror
if (system) args.push("--system-prompt", system);
```
Both artifact functions already build `args` the same way and already push `--model` / `--system-prompt`.
The new push slots in after `--model`, guarded `if (effort)`, so **`effort === undefined` ⇒ args
byte-identical ⇒ default path unchanged** (the same invariant T-013-01 established for `system`).

### Why this is low-risk

- The four request functions are LIVE/METERED and **not unit-tested** (spec §4). The 20 tests in
  `src/sdk-binding.test.mjs` cover only pure helpers (`withSchemaInstruction`, `stripToJson`,
  `toImageBlock`, `buildImageTurn`, `serializeStreamJsonInput`, `extractArtifact`, output-format). None
  construct or assert on `args`. So wiring a guarded pass-through touches nothing the suite exercises —
  `npm test` stays green by construction (confirmed pattern from T-013-01, mem 10261).
- The `options` param on both artifact functions is reserved/unused (`void options`); `effort` is a
  first-class named param, parallel to `model`/`system`, not smuggled through `options`.

## Prior art: T-013-01 (the direct template, this ticket's `depends_on`)

T-013-01 wired an optional `system` → `--system-prompt` pass-through into the **same three** champion
functions (`requestTextWithImage`, `requestDesignArtifact`, `requestDesignArtifactWithImage`) and threaded
a `--persona-file` flag through `run.mjs` to the `vRefRevise-designdoc` approach. That work is **already
merged into the working tree** — `run.mjs` L896–933 shows `system: persona` on all three stage calls, and
`parseArgs` (L1037) carries `--persona-file`. This ticket is the same shape, one knob over:
- `system`/`--system-prompt`/`--persona-file` → `effort`/`--effort`/`--effort`.
- T-013 needed 3 function edits (text-with-image lacked `system`); **this needs only 2** (both
  `requestText*` already have `effort`).
- Same A/B protocol: two champion runs, same ref + seed, per-dimension median-of-3 scores, journal verdict.
- T-013's artifacts (`research.md`…`review.md`, `judge-round0.mjs`, `persona.md`) are the format model.

## The champion pipeline: `vRefRevise-designdoc` (run.mjs L881–952)

Three live stages, all on `PHASE1_MODEL_ID = "claude-opus-4-8"`:
1. **Stage 1** — `requestTextWithImage`: reference photo → grounded design doc (plain text). *Has effort.*
2. **Stage 2** — `requestDesignArtifact`: high-res build from the doc → artifact. *Needs effort.*
3. **Stage 3** — `requestDesignArtifactWithImage`: render stage-2, then revise comparing build to
   reference (2 images) → improved artifact. *Needs effort.*

`run.mjs main()` renders the final artifact head-on, scores it with `judgeRender` (median-of-3), and
writes `runs/<NNN>-vRefRevise-designdoc/{design-doc.md, build.prompt.txt, round-0.png, render.png,
artifact.json, summary.json, transcript.jsonl}`. The README gallery regenerates from `summary.json`.

`summary.json` **already carries an `effort: null` field** (L1147–1148) with a comment naming `--effort`
as "the available knob" — a placeholder this ticket finally populates.

`ctx` passed into each approach is `{ runId, dir, renderArtifact, k, ref, persona }` (L1114). There is
**no `effort` in ctx and no `--effort` flag in `parseArgs`** (L1030–1040) — that threading is the
`run.mjs` half of the change.

## The harness CLI surface: `run.mjs parseArgs` (L1030)

Flags today: `--approach`, `--note`, `--k`, `--ref`, `--persona-file`. `main()` (L1092) destructures them,
reads `persona` from the file, computes `runId = <NNN>-<approach>`, and threads ctx. A new `--effort`
flag follows `--persona-file` verbatim: parse a string, default `undefined`, thread into ctx, record in
`summary.json`. The `effort` summary field already exists — just assign it instead of hardcoding `null`.

## Frozen surfaces (changing them would confound the A/B)

- `benchmarks/temple-facade/task.mjs` — brief (`task.goal`), `seed: 11`, `view {az0,el0,fov40}`,
  `serverStateId`. Immutable per AC ("Rubric and brief immutable", same seed).
- `judge.mjs` + `baml-judge.mts` + `baml_src/*` — the categorical rubric (v2-categorical-baml,
  median-of-3 by default). Immutable.
- The `compose*Prompt` builders — effort is an invocation knob, never a prompt-body edit.
- `src/config.mjs` — the model pin (`claude-opus-4-8`).

## Reference & judge specifics

- `references/taj_mahal.png` **exists** (confirmed). The Taj is the established "champion config"
  reference (ticket Context). `run.mjs` copies it into the run dir as `reference.png` for provenance.
- `judgeRender({imagePath, brief, samples=3})` already returns median-aggregated per-dimension categorical
  scores (`proportion/color/detail/fidelity/overall`) plus `perSample`. The `--effort` of the *judge* is
  not under test — only the *generator's* effort. (The judge runs through its own BAML/`claude -p` path.)
- `docs/active/work/T-006-01/judge-round0.mjs` is the reusable round-0 scorer (median-of-3 against the
  frozen brief) — copyable to attribute build (round-0) vs 2nd-pass (render.png) per P14.

## Constraints & assumptions surfaced

- **n=1 per arm.** Two runs (one default, one high) at the same seed is a single paired sample. Generation
  noise (P15: detail especially swings run-to-run) means a small per-dimension delta cannot be separated
  from noise. The verdict must be calibrated to effect size, with the n=1 caveat explicit (same discipline
  as the T-013 persona verdict).
- **`--effort` levels are not yet enumerated here.** `claude --help` shows `--effort <level>` but not the
  legal values; design.md must pin the exact "default" and "high" tokens (likely `high`; "default" = omit
  the flag entirely so the arm is genuinely the unchanged path). To verify before the run.
- **Wall-clock is a first-class output** (AC #3): higher effort plausibly costs latency; the verdict
  weighs any quality lift against that cost. `summary.json.durationMs` already captures per-run wall-clock.
- **Same seed, but `claude -p` is not bit-deterministic** across effort levels — effort changes the
  reasoning trace, so the builds will differ structurally regardless. The seed pins the *task*
  (metadata.seed), not the sampling; this is a quality A/B, not a diff.
