# Research — T-013-01: persona-system-prompt-ab

Descriptive map of the code, data, and prior results this ticket touches. No solutions here.

## What the ticket asks (restated)

A/B the **`--system-prompt`** knob on the `claude -p` seam. Two parts:
1. **Plumbing:** confirm whether a system prompt is already threaded through `src/sdk-binding.mjs` to the
   champion pipeline; if not, **wire a minimal pass-through** (default path byte-unchanged), record the
   diff, `npm test` green.
2. **Experiment:** author a concise **master-architect persona / grounding** system prompt — *stance +
   standards*, NOT new build rules (it must not duplicate the brief or the schema directives, or it
   confounds the test). Run the **champion** config twice on the **same reference + seed (Taj)**: persona
   **on** vs **off**. One variable. Judge each (median-of-3, per-dimension). Verdict: adopt as default /
   no effect / harmful. Note the persona text.

This is **not** a generalization run — it is a genuine code change (the wiring) plus a controlled A/B.

## The seam (`src/sdk-binding.mjs`) — what's already plumbed vs what isn't

Five public request functions; **only one currently forwards a system prompt:**

| function | used by champion stage | takes `system`? | spawns |
|----------|------------------------|:---------------:|:------:|
| `requestText` (L446) | — (not used by vRefRevise) | **YES** → `--system-prompt` (L450) | yes |
| `requestTextWithImage` (L463) | **Stage 1** (ref design doc) | **NO** | yes |
| `requestDesignArtifact` (L287) | **Stage 2** (high-res build) | **NO** (`options` reserved/voided, L288) | yes |
| `requestDesignArtifactWithImage` (L339) | **Stage 3** (ref-compared 2nd pass) | **NO** (`options` voided, L342) | yes |
| (judge path is separate — `judge.mjs` → `baml-judge.mts`) | — | — | — |

**Key finding:** the precedent already exists — `requestText` maps `system → --system-prompt` (L450) and
`effort → --effort` (L449). But the **champion `vRefRevise-designdoc` pipeline does not call
`requestText`.** Its three stages call `requestTextWithImage`, `requestDesignArtifact`, and
`requestDesignArtifactWithImage` — **none of which accept `system`**. So a system prompt is **NOT**
currently reachable by the champion; minimal wiring is required in exactly those three functions (mirroring
the one-line pattern already in `requestText`).

**The default path is trivially preservable:** every spawn builds `args` then conditionally pushes flags
(`if (model) args.push("--model", …)`, `if (effort) …`). Adding `if (system) args.push("--system-prompt",
system)` leaves `args` **byte-identical when `system` is undefined** → the persona-off / default path is
unchanged by construction. This is the "default path unchanged" the ticket requires.

`invokeClaude` (L203, the schema-validating spine for the two artifact paths) and `_runClaude` (L381, the
plain-text spine) both just take `args`/`stdin` — no change needed; the `system` flag rides in `args`.

## The harness (`benchmarks/temple-facade/run.mjs`) — threading a CLI flag

- **`parseArgs` (L1024):** parses `--approach / --note / --k / --ref`. No system/persona flag yet → add one.
- **`main` (L1085):** destructures the args, computes `seq`/`runId`/`dir`, then calls
  `run(TEMPLE_FACADE_TASK, { runId, dir, renderArtifact, k, ref })` (L1104). The `ctx` object is where a
  `persona` string would be threaded to the approach.
- **`vRefRevise-designdoc` approach (L881–940):** the three stage calls (L899 `requestTextWithImage`,
  L912 `requestDesignArtifact`, L922 `requestDesignArtifactWithImage`) each take `{ prompt, …, model,
  onMessage }`. Adding `system: ctx.persona` to all three applies the persona across the whole pipeline;
  when `ctx.persona` is undefined, `system` is undefined → default path. (`ctx.ref` is already threaded
  this exact way — `refPath = ctx.ref || DEFAULT_REF`, L883 — so `ctx.persona` follows an established
  pattern.)
- **`summary.json` (L1125):** records `model/seed/temperature/effort/note` per run for attribution. A
  `persona` boolean/string field belongs here so the on/off runs are self-describing (attribution, per the
  "record any variation" tunable-params note in design-learnings).

## The judge (`judge.mjs` → `baml-judge.mts`, rubric `v2-categorical-baml`) — FROZEN, and isolated

`judgeRender({ imagePath, brief, samples = 3 })` shells to the BAML categorical judge (separate process),
median-of-3, dims `proportion/color/detail/fidelity/overall` ∈ `{weak,competent,strong,exceptional}`.
**It does not go through `sdk-binding`'s request functions**, so wiring `system` into them **cannot leak
into judging** — the judge stays frozen and persona-blind, which is exactly what a clean A/B needs (the
persona must affect *generation*, not *scoring*).

## Round-0 judging helper (reusable)

`docs/active/work/T-006-01/judge-round0.mjs`: scores any PNG via `judgeRender` median-of-3 against the
frozen brief. Copy into this ticket's work dir to judge each trial's `round-0.png` (so the A/B can attribute
any persona effect to the **build** stage vs the **2nd pass**, per P14), in addition to `main()`'s auto-judge
of each `render.png`.

## Test surface (what `npm test` covers, what it doesn't)

- The two artifact-spawning request functions are **explicitly not unit-tested** (file header L30–32: "only
  the two request* functions spawn a process and are not tested"). `grep` confirms **no test asserts their
  `args` arrays** — so adding a conditional `--system-prompt` push has **no test to update or break**.
- `npm test` (133, green at session start) covers the **pure** helpers (`withSchemaInstruction`,
  `stripToJson`, `toImageBlock`, `buildImageTurn`, `serializeStreamJsonInput`, artifact validation). A
  `system` param that only appends a CLI flag touches none of these. Tests must stay 133/133 green.

## Prior Taj champion baselines (context for the on/off read)

Runs **014** (proportion competent→strong via 2nd pass, color/fidelity strong, detail competent, overall
**strong 3/3**) and **015** (all strong, overall **strong 3/3**) are champion Taj runs at the same seed
(11). They establish that the champion already sits at **strong** on the Taj — so the persona A/B is asking
whether a stance/standards system prompt can move a *near-ceiling* build (toward `exceptional`, the E-08
climb target) or whether it's a no-op/harmful. Detail is the lone sub-strong dimension and the likeliest
place to see movement (or noise — see the P15 boundary-noise caveat). **Both on/off runs are run FRESH this
session** (not reusing 014/015) so they share identical post-wiring code and differ only in the flag —
controlling for any drift; generation noise still applies (esp. detail).

## Constraints & assumptions

- **Frozen:** `task.mjs` (brief/seed=11/view), `judge.*` (rubric). The persona is a NEW system prompt, not
  an edit to the brief/schema (which would confound — AC).
- **Live & metered:** **TWO** champion runs ≈ 6 model calls total, ~30 min wall, ~$4 (runs 014–021 were
  ~$1.5–2.1 each). Rate limits serialize claude calls, so launch sequentially to avoid `nextSeq()`
  collisions (both `main()`s compute seq then mkdir; concurrent launches could collide on the same seq).
- **`claude -p` knobs:** `--system-prompt` is a real CLI flag (already used by `requestText` L450);
  `claude` v2.1.165 on PATH; `node` v22.22.
- **One variable:** persona text is the ONLY difference between the two runs (same approach, ref, seed,
  model, code). The persona must be stance/standards only — no size, relief, color, or schema directives.
