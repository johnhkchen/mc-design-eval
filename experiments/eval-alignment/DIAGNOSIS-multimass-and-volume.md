# Diagnosis — the cottage gate and the volume gate are the same problem (2026-06-15)

*Steering experiment run while the lisa loop holds T-160-01. No model spend — pure inventory +
structure read of artifacts already on disk. Lead with how this is wrong (anti-hedge): see "How this
could be wrong" at the end; the empirical confirm/refute is T-160-01's run, not this note.*

## What I looked at

- The recognition programs on disk: `benchmarks/sculpture/recognition/{cottage,barn,barn--saltcrag}.program.json`.
- The autonomy loop's subject configuration: `experiments/eval-alignment/autonomy-loop.mjs` `SUBJECTS` map.

## What I found (evidence)

| subject | masses | shape | in recognition? | in autonomy loop? |
|---|---|---|---|---|
| barn | 1 | 48×24, ridge-x | yes | yes (hardcoded eaveY 12, ridge x) |
| cottage | **2** | main 18×28 ridge-z **+ cross-wing 8×15 ridge-x** | yes | yes (hardcoded **single** eaveY 13, ridge z) |
| gatehouse | — | — | **no program exists** | yes (hardcoded eaveY 18, ridge z) |

Three facts fall out:

1. **The cottage is multi-mass; the construction tool is single-box.** The loop derives one `eaveY`,
   one `ridgeAxis`, and lays one gable. Two perpendicular gables *cannot be expressed* in that
   representation. The earlier framing — "walls have missing columns a patch can't add" — was a symptom.
   The gate is that the constructor models one box and the cottage is two.

2. **The recognition program already carries every parameter the loop hardcodes** — `rect` (footprint),
   `storeys × storeyHeight` (eave height), `roof.ridgeAxis`, and per-storey wall `role`s. The `SUBJECTS`
   map is a hand-authored, necessarily-lossy shadow of recognition (it collapses 2 masses → 1).

3. **Gatehouse has no recognition program.** It climbs on pure hardcoded constants. So "the agent climbs
   across many kinds of builds" is, for 1 of 3 subjects, hand-tuning rather than recognition-driven
   generality. Volume cannot be claimed on a roster that needs a hand-authored `SUBJECTS` entry each.

## Why this is the high-leverage steer

The cottage gate (unstick the 3rd build) and the price-of-admission gate (run across **many** subjects
unattended) are **the same fix**: construct each mass from the recognition program's `masses[]`, and
**delete the `SUBJECTS` map** so a new subject needs only its recognized program — no code edit. This is
also exactly the pipeline philosophy already on record ("build from recognition, don't fit the mesh"):
the experiment harness has been violating it by hand-deriving what recognition emits.

This sharpens E-38 / S-160 / T-160-01: the move is not "a wall brush" in isolation — it is
**recognition-driven, multi-mass construction with zero per-subject constants**, measured on the trusted
defect-eval. The cottage is the falsification fixture; volume is the payoff.

## How this could be wrong (anti-hedge)

- The cottage's dominant defect after multi-mass construction might be **materials or proportion**, not
  massing — in which case multi-mass is necessary but not sufficient, and that residual is the next
  finding. T-160-01's render + eval settle it.
- `masses[].rect` is in recognition's own frame; it may **not align to the voxel build's frame**, so
  "construct from the program" could need a registration step. If so, footprint-alignment is the real
  sub-problem (already named as a failure branch in T-160-01).
- Deleting `SUBJECTS` removes the gatehouse's only config; gatehouse must get a real recognition program
  first, or it drops from the roster. Either way the roster becomes honest.
