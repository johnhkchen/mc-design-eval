---
id: E-36
title: defreeze-the-creation-loop
type: epic
status: open
priority: high
spec: "§1, §5, §6, §9"
stories: [S-151, S-152, S-153]
---

## Background (read this first — self-contained)

**This is a process-remediation epic, not a milestone rung.** The build does not look like its picture
yet, and two consecutive autonomous loops (E-35 T-149-01..02, T-150-01) failed to move the *glance* —
not for lack of work (≈25 commits, 2107 green tests, every ticket "done") but because **measurement
discipline has leaked into the creation loop**, and the loop froze the build at "unsatisfactory" while
polishing regression-guards around it. The reviewer named it 2026-06-14: *"these guards are giving
major progression block smells… why don't we focus on quality first rather than freezing progress at an
unsatisfactory stage and worrying about regressions?"*

The architecture of record already says the cure (`docs/knowledge/pipeline-philosophy.md`, cross-cutting
rule #1): **"Creation is iterative and free; measurement is frozen and singular."** It even names this
exact failure as *"the project's deepest self-inflicted wound… no-re-roll leaked into building; pinned
first drafts became infrastructure."* It has recurred. This epic re-imposes the split.

**The evidence (gathered live, 2026-06-14).**

1. **Pin-guard freezes DRAFT build artifacts.** Regenerating the barn — *just to look at it* — was
   refused: `generated/barn/{base-artifact,component-plan,grammar-artifact,artifact}.json` are all
   pinned. The guard literally refused to write the *improved* barn because its bytes differ from the
   frozen-bad one. The guard's notion of "a pin" is **"any file tracked in git"** (`pin-guard.mjs`
   `decidePinWrite`: "tracked = path is committed"), so a draft becomes infrastructure the moment it is
   committed — which is exactly the wound the philosophy warned of. Worse: a pin refusal on a draft
   write got swallowed and re-surfaced as a confusing failure-record write error, masking the real
   (benign) chain behavior.
2. **"GL absent" → every render deferred.** Both loops reported no headless GL and punted the render to
   an "operator runbook." **GL is available** (`render/src/render.mjs` `GL_AVAILABLE: true`; three
   images rendered by hand this session, incl. a textured barn). So the loop built machinery for two
   sessions and **never once looked at its own output.** You cannot improve a look you never see.
3. **No-regress vs the prior draft freezes the flat box.** Creation-side gates assert byte-identity /
   silhouette-no-regress against the *committed draft*. Guarding "don't change yesterday's build"
   institutionalizes yesterday's build. During creation the comparison that matters is **vs the
   concept** (the glance), not vs the last draft.

**What must stay frozen (do not touch).** The measurement integrity this project depends on is real:
the **pinned judge** and its verdict records, **ratified packs**, committed **baselines/milestone
measurements**, the **retired-pins registry**, and *reproducibility-by-replay of a committed
measurement*. Those are the instrument; they stay exactly as locked as they are. The bug is that
draft *creation* artifacts were swept into the same vault.

## The dividing line (the whole epic in one rule)

> **An artifact is frozen once it has been MEASURED** — it is the subject of, or input to, a committed
> verdict / baseline / ratified pack. Until then it is a **draft**, and a draft regenerates freely.
> Pin-guard fires on the instrument allowlist, **not on "tracked in git."**

## Goal

```
INSTRUMENT-ONLY GUARD   pin-guard fires only on the measurement allowlist (judge records, ratified
                        packs, baselines, retired-pins); draft build artifacts regenerate with no flag
RENDER EVERY LOOP        a judge-free textured render beside the concept is produced every creation
                        pass; "no GL" is a hard, surfaced failure — never a silent defer to a runbook
GLANCE OVER REGRESSION   creation-loop gates compare to the CONCEPT, not the prior draft; no-regress-
                        vs-draft is retained ONLY where it protects the frozen instrument
```

…and the instrument stays frozen throughout (proven: every committed verdict/baseline still refuses
silent overwrite; reproducibility-by-replay of a committed measurement unchanged).

## Rules of engagement (binding)

1. **Surgical, not wholesale.** The freeze is *narrowed*, never removed. A committed judge record, a
   ratified pack, a committed baseline/milestone, and `retired-pins.json` MUST still refuse a silent
   overwrite (regression test required). Only draft creation artifacts lose the guard.
2. **No new ceremony.** This epic *removes* friction; it must not add a heavier process to do so. Favor
   deleting a guard call-site or curating an allowlist over inventing a new gate.
3. **The instrument contract is untouched.** Judge prompts, azimuths, severity grain, the
   reproducible-by-replay of a *committed measurement* — all unchanged. Reproducibility means a
   committed measurement replays; it never meant a draft can't be redrawn.
4. **Inherited in full:** the `claude -p` subscription shim for all model calls (light tier via
   per-task `--model`, never the metered API); secrets only in gitignored `.env`; run on main.

## Candidate stories & DAG

```
S-151 instrument-only-pin-guard ─┐
S-152 render-every-loop ─────────┼─ (independent seams; parallel)
S-153 glance-over-regression ────┘
```

- **S-151 — instrument-only-pin-guard.** Replace pin-guard's "tracked-in-git ⇒ pin" with a curated
  **instrument allowlist** (judge verdict records, ratified packs, committed baselines/milestones,
  `retired-pins.json`). Draft build artifacts (`generated/*`, `workshop/*` ledgers + final-artifacts
  pre-verdict, `recognition/*` programs, chain intermediates) regenerate with **no `--rotate-pins`**.
  Regression test: a draft write needs no flag; a judge record / ratified pack / baseline still refuses
  silent overwrite. Fix the swallowed-error masking so a guard refusal never hides the real chain
  behavior.
- **S-152 — render-every-loop.** Every creation run emits a **judge-free textured render beside the
  concept** (reuse `--skip-gate` + the diff/sheet path); **"no GL" is a hard failure**, surfaced, never
  a silent defer to an operator runbook. Diagnose why the agent environment reported no GL when it is
  available, and make the loop environment provide it. **Prove it:** re-run the barn creation loop
  under the new rules and produce the render — closer to the concept, with no ceremony.
- **S-153 — glance-over-regression.** Creation-loop gates compare to the **concept**, not the prior
  draft. Remove `no-regress-vs-committed-draft` from the *creation* path (keep no-regress only where it
  guards the frozen instrument — e.g. an identity-class gate change). The workshop / milestone runners
  reframed so "better" means "closer to the glance," not "byte-identical to last time."

## Definition of done

- Pin-guard fires on the instrument allowlist only; draft artifacts regenerate flag-free; the frozen
  set still refuses silent overwrite (regression test green); the swallowed-error mask is gone.
- Every creation run produces a judge-free render beside the concept; no-GL is a hard, named failure;
  the barn re-rendered through the de-frozen loop, shown against its concept.
- Creation gates judge by glance-vs-concept; no-regress-vs-draft retained only on the instrument path.
- `npm test` green; the instrument's reproducibility-by-replay of committed measurements unchanged.

## Orchestration notes

- The three stories are disjoint seams (guard scope / render + environment / gate semantics) — parallel.
- This epic should land **ahead of further E-35 creation loops** so the remaining facade/relief and
  construction work (T-149-02's fix, T-150-01's workshop-path wiring) is done with eyes open, against
  the glance, without fighting the guards.
- **Honesty.** If narrowing the guard exposes a place where a draft genuinely *is* load-bearing for a
  committed measurement, that artifact joins the allowlist with the reason recorded — the line is
  "measured or not," applied case by case, not a blanket unlock.
