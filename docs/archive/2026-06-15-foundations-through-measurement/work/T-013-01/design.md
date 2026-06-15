# Design — T-013-01: persona-system-prompt-ab

Decisions (rationale + rejected alternatives), grounded in `research.md`. Three design problems:
**(A) the minimal wiring shape**, **(B) the persona text**, **(C) the A/B protocol**.

## Decision A — Wire `system` into the three champion functions; thread `--persona-file` through run.mjs

**Choice:** add an optional `system` parameter to the three functions the champion uses and which lack it
(`requestTextWithImage`, `requestDesignArtifact`, `requestDesignArtifactWithImage`), each pushing
`--system-prompt <text>` onto `args` **only when set** — mirroring the one line already in `requestText`
(L450). In `run.mjs`, add a **`--persona-file <path>`** CLI flag: `parseArgs` records it, `main` reads the
file into a string and threads it as `ctx.persona`, and the `vRefRevise-designdoc` approach passes
`system: ctx.persona` into its three stage calls. Record `persona` (the basename or a boolean) in
`summary.json` for attribution.

**Why this shape:**
- **Minimal + default-preserving.** When no `--persona-file` is given, `ctx.persona` is `undefined`,
  `system` is `undefined`, no flag is pushed → `args` byte-identical to today. The persona-**off** run *is*
  the current default path, unchanged — satisfying the AC's "default path unchanged."
- **`--persona-file` over `--system-prompt <string>`.** A persona is multi-line prose; passing it as a
  quoted CLI string is fragile (shell escaping, newlines) and isn't recorded. A file path is clean, and the
  file **is the artifact** the AC wants ("note the persona text used") — it lives in the work dir and is
  copied into each run dir. (The underlying CLI knob is still `--system-prompt`; `--persona-file` is just
  the harness-level affordance that feeds it.)
- **Mirrors the existing `effort`/`system` precedent** in `requestText` and the `ctx.ref` threading
  pattern — no new architecture, lowest blast radius. The two spawn cores (`invokeClaude`, `_runClaude`)
  are untouched; the flag rides in `args`.

**Apply the persona to ALL THREE stages (doc, build, revision), not a subset.** The persona is a *grounding
stance* for the model-as-designer; the cleanest single-variable "persona on" is "the designer holds this
stance throughout the pipeline." Applying it to only one stage would be an arbitrary, harder-to-interpret
condition.

**Rejected — pass the persona via `options` (the reserved param).** `options` is documented as SDK-shaped
and explicitly `void`-ed on the CLI path; overloading it would be more confusing than a named `system`
param that matches `requestText`'s existing signature. Rejected.

**Rejected — wire it into every approach.** Only the champion (`vRefRevise-designdoc`) is under test.
Threading `ctx.persona` into the other approaches is unused scope. The `system` param on the sdk-binding
functions is general (any caller can pass it), but run.mjs only wires the champion.

**Rejected — reuse runs 014/015 as the "off" arm.** They predate this session's code; using them confounds
the persona variable with any intervening drift, and a single old generation is a noisy control. Run both
arms fresh this session (Decision C).

## Decision B — The persona: stance + standards, zero build rules

**Choice:** a short master-architect **grounding** prompt that sets *who the designer is* and *what bar
they hold* — and deliberately says **nothing** about size, relief depth, color scheme, materials, the JSON
schema, or the temple brief (all of which live in the prompts already and would confound the test). Draft
(stored as `persona.md`, fed verbatim via `--persona-file`):

> *You are a master architect with decades of practice across the world's great building traditions —
> classical, Islamic, East Asian, Gothic, and modern. You carry the standards of the field's finest work:
> proportion is felt before it is measured; every element earns its place or is cut; ornament serves the
> whole rather than decorating it; and materials are chosen with intent, never by default. You have studied
> the canon deeply, so you reach for the considered move over the obvious one, and you are never satisfied
> with the merely competent when a more resolved composition is within reach. Bring that judgment, taste,
> and exacting eye to whatever you are asked to design.*

**Why this content:** it is pure **stance (who) + standards (what bar)**. It does not tell the model to use
deep relief, to be colorful, to make a temple, or anything the brief/schema already specify — so any score
movement is attributable to *grounding/standards framing*, not to smuggled-in build instructions. It gently
points at the project's known frontier ("never satisfied with merely competent", "resolved composition")
without naming a dimension or a fix — testing whether a *general* push for taste/resolution helps a build
already at `strong` climb toward `exceptional`.

**Rejected — a persona that names the weak dimension** ("pay special attention to surface detail / avoid
flat fields"). That duplicates the brief's detail clause and the P15 lever under test elsewhere — it would
confound this A/B with the detail experiments (S-006/S-010) and stop measuring the *persona* knob itself.
Rejected explicitly (the AC forbids duplicating brief/schema directives).

**Rejected — a long, ornate persona.** Verbosity dilutes the signal and risks crowding the model's context
against the actual task prompt. Keep it ~5 sentences.

## Decision C — Protocol: two fresh champion runs, Taj, same seed, judge both rounds of each

**Choice:** the fixed sequence
1. Wire the code (Decision A); `npm test` must stay 133/133 green; capture `git diff` for the journal.
2. Run **OFF** first: `--approach vRefRevise-designdoc --ref references/taj_mahal.png` (no persona flag) →
   run NNN. This is the default-path control and also re-confirms the wiring didn't perturb the default.
3. Run **ON** second: same command **+ `--persona-file docs/active/work/T-013-01/persona.md`** → run NNN+1.
   Launched **after** OFF completes (sequential — avoids `nextSeq()` collision; rate limits serialize anyway).
4. Judge **both rounds of both runs** (4 median-of-3 scorings): each `render.png` is auto-judged by
   `main()`; each `round-0.png` via the copied helper. This lets the verdict attribute any persona effect
   to the **build** stage and/or the **2nd pass**, not just the final.
5. Compare per-dimension OFF vs ON (final render is the headline; round-0 is the secondary attribution).

**Why Taj + same seed:** the AC fixes the reference (Taj) and seed; seed=11 is hard-coded in `task.mjs`, so
both runs share it automatically. Taj is the reference the champion is best-characterized on (014/015 both
strong 3/3), so it's the cleanest substrate to detect a *small* persona effect against a known baseline.

**Why both runs fresh:** controls the persona as the *only* variable (identical post-wiring code). Note the
**irreducible confound**: `claude -p` is non-deterministic (no temperature control), so a single on/off pair
cannot separate a small persona effect from generation noise — especially on `detail` (P15: competent in
014 vs strong in 015, identical config). The verdict must therefore be **calibrated to effect size**: only
a **categorical, multi-dimension, same-direction** shift is credible as a persona effect; a single-dimension
single-step flip (esp. detail) is within noise and must be reported as *inconclusive*, not as an effect.

**Rejected — N>1 generations per arm** (to beat noise). Correct in principle, but ~$4 and ~30 min *per
extra pair*; out of proportion for a knob A/B. One pair, with an effect-size-calibrated verdict and the
noise caveat stated, is the honest scope. If the single pair shows a large same-direction shift, recommend a
confirmer run rather than claiming significance from n=1.

## Decision D — Verdict rubric (decided before seeing renders)

Pre-registering the read prevents post-hoc rationalizing:
- **Adopt as default** ⇐ ON beats OFF by a **categorical step on ≥2 dimensions in the same direction**, OR
  lifts `overall` a step, with no dimension regressing — a credible, above-noise improvement.
- **No effect** ⇐ scores identical, or differ only on a single dimension by one step (within noise; detail
  especially). This is the **expected** outcome given the champion is already near-ceiling and a persona
  adds no build rules.
- **Harmful** ⇐ ON regresses `overall` or ≥2 dimensions vs OFF — the persona crowded/derailed the task.
Round-0 vs render attribution refines *where* any effect landed but does not change the headline verdict
(which is on the final renders).

## What is explicitly NOT changed

`task.mjs` (brief/seed/view), `judge.*` (rubric), the AJV schema, `src/config.mjs` (model pin), the four
`compose*Prompt` builders (the persona is a *separate* system prompt, not a prompt-body edit), and the two
spawn cores. The code change is confined to: 3 small param additions in `sdk-binding.mjs`, a CLI flag +
ctx-thread + 3 call-site `system:` args + 1 summary field in `run.mjs`. Default path byte-unchanged.

## Success definition

Not "the persona helps." Success = **(1)** a minimal, default-preserving wiring with the diff recorded and
tests green; **(2)** a clean two-run Taj A/B differing only in the persona; **(3)** a per-dimension on/off
comparison with an **effect-size-calibrated, noise-honest verdict** (adopt / no effect / harmful) and the
persona text recorded. A well-supported "**no effect** (within noise)" is a fully successful result.
