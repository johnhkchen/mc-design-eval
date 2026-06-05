# Design — T-009-01: effort-ab-on-champion

Four decisions: (A) wiring shape, (B) the two effort levels, (C) pipeline shaping (full vs round-0),
(D) the pre-registered verdict rubric. Each grounded in `research.md`.

## Decision A — wiring shape: mirror `requestText`, two functions only

**Chosen:** Add an optional `effort` named param to `requestDesignArtifact` and
`requestDesignArtifactWithImage`, pushing `--effort String(effort)` guarded by `if (effort)`, immediately
after the existing `--model` push — byte-for-byte the line already in `requestText` (L455). Update each
JSDoc to document `effort` (parity with `requestText`'s doc at L448–450).

**Why:**
- It is the *minimal* change that closes the gap research found: stages 2 and 3 are the only champion
  calls lacking the knob; stage 1 (`requestTextWithImage`) already has it. Two edits, not three.
- The guarded push preserves the default path exactly: `effort === undefined` ⇒ `args` unchanged ⇒
  byte-identical to today. This is the same invariant T-013-01 proved for `system`, and it is what lets
  `npm test` stay green without new tests (the request functions are untested-by-design; pure helpers are
  untouched).
- `effort` as a first-class named param (next to `model`/`system`) matches how the other two functions
  already expose tunables, and keeps it out of the reserved-but-unused `options` bag.

**Rejected:**
- *Route effort through `options`.* `options` is `void`-ed and reserved; overloading it would be a
  hidden, untyped channel inconsistent with `requestText`/`model`/`system`. No.
- *Wire a fourth function or a shared helper that all four call.* Over-engineering for a 1-line push that
  already exists verbatim in two siblings; a refactor would touch the tested `_runClaude`/`invokeClaude`
  cores and widen the blast radius for zero benefit. No.
- *Make effort apply only to stage 2 (the build), leaving stage 3 default.* The ticket explicitly notes
  "effort plausibly affects the revision too" — to A/B *the config*, the IV must be set consistently
  across every generative stage, exactly as the persona was. Half-applying it confounds the result. No.

## Decision B — the two effort levels: `high` vs omit-the-flag

**Chosen:** The **default arm omits `--effort` entirely** (the genuinely unchanged path); the **high arm
passes `--effort high`**. Confirm the legal level token against `claude --help` / a dry probe before the
metered runs; if `high` is rejected, fall back to the documented top level the CLI advertises and record
the substitution.

**Why:**
- "Default effort" must mean *the current production behavior*, which is no flag at all — that is what
  every prior champion run (010–023) used and what the chain's accumulated scores are calibrated against.
  Passing an explicit `--effort medium` (or whatever the implicit default is named) would risk a *third*
  behavior and muddy "is high better than what we ship."
- `high` is the obvious upper level and the one the ticket means by "high effort." Pinning the exact token
  pre-run (not from memory) avoids a wasted metered run on a rejected flag value.
- `summary.json.effort` records the arm: `null` for default (matches the existing placeholder semantics),
  `"high"` for the high arm — self-documenting provenance.

**Rejected:** sweeping 3+ levels (low/medium/high). The AC asks for a *pairwise* default-vs-high A/B; a
sweep multiplies metered cost for a question (does *high* help?) that two runs answer. Out of scope.

## Decision C — pipeline shaping: full pipeline (not round-0-only)

**Chosen:** Run the **full `vRefRevise-designdoc` champion** (all three stages) for both arms — do not
shape to round-0-only.

**Why:** The ticket gives the choice explicitly: "round-0-only … to halve cost — but effort plausibly
affects the revision too, so full-pipeline is acceptable." Reasoning effort is most likely to change the
deliberative work in *every* stage, and the 2nd-pass revision (stage 3) is the champion's signature move
and a known double-edge (P14). Cutting it would blind the A/B to where effort might matter most. The cost
is two extra metered calls per arm — acceptable for the only knob this ticket gets to test.

Per-round attribution is preserved by judging **both `round-0.png` (build, stages 1–2) and `render.png`
(2nd pass, stage 3)** with the median-of-3 scorer, via a copied `judge-round0.mjs`. This separates "did
effort help the build?" from "did effort help the revision?" — the same P14 lens T-013 used.

**Rejected:** round-0-only. Halves cost but cannot see the revision effect, which the ticket itself flags
as plausibly the most effort-sensitive stage. No.

## Decision D — pre-registered verdict rubric (lock BEFORE seeing scores)

Pre-registration guards against reading noise as signal. The verdict is one of three, decided by the
per-dimension default-vs-high deltas under the categorical rubric (`weak<competent<strong<exceptional`)
across **both rounds of both runs**, weighed against the **wall-clock delta**:

- **ADOPT high effort as default** — only if high **improves ≥2 of the 4 dimensions by a full categorical
  step** (e.g. competent→strong) on the final render **and regresses none**, *and* the wall-clock penalty
  is tolerable (design target: < ~2× the default run's duration). A single-dimension bump is *not* enough
  to adopt at n=1 (could be generation noise; P15). If ADOPT, the journal must flag that a **confirmer run
  is required** before any default is actually changed — n=1 cannot separate a small effect from noise.
- **NOT WORTH THE LATENCY** — if high shows **no dimension improving by a full step** (flat or within-noise
  wiggle) **and** costs materially more wall-clock. The pragmatic null: the knob exists, it's slower, it
  doesn't move the rubric.
- **INCONCLUSIVE** — if results are **mixed** (one dimension up a step, another down a step), or the
  wall-clock delta is negligible *and* quality is flat (no cost, no benefit — nothing to decide), or a run
  fails/degenerates. Honest non-result; recommend a repeat at n>1 if the signal is borderline.

**Tie-breakers / discipline:**
- **Detail is the noisy dimension** (P15: relief/flat-field swings run-to-run independent of the IV). A
  lone detail move is treated as suspect and explicitly down-weighted in the verdict.
- **Overall** is reported but is a summary, not a 5th independent vote — the four dimensions drive the call.
- The verdict names the **effect size** (how many dimensions, how many steps) and states the **n=1 caveat**
  verbatim, mirroring the T-013 persona-verdict discipline. No default is changed inside this ticket.

## What this design explicitly does NOT do

- Does **not** change any prompt builder, the rubric, the seed, the model pin, or the reference — all
  frozen (research "Frozen surfaces"). Effort is an invocation knob only.
- Does **not** add unit tests for the request functions (they are live/untested by spec §4); correctness of
  the guarded push is established by inspection + `npm test` green + the default-arm run reproducing the
  unchanged path.
- Does **not** sweep effort, change defaults, or touch `requestText*` (already wired).

## Open item carried to Structure/Plan

Confirm the exact `--effort` level token(s) the CLI accepts (`high`, and whether an explicit "default"
level exists) with a non-metered probe before the two live runs, so neither metered run is wasted on a
rejected value.
