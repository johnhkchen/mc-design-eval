---
id: E-52
title: finish-the-gatehouse-to-its-picture
type: epic
status: open
priority: high
depends_on: [E-49]
spec: "§1, §5, §6, §9"
stories: [S-202, S-203, S-204, S-205]
---

## Background (the constraint finally moved — from the instrument to construction geometry)

**Milestone rung: M1, landed — "one house that looks like its picture," for real, on the gatehouse.** The
E-49 capstone climb (T-201) is the turning point: for the first time the binding constraint is **not** in the
measurement instrument (the gradient reads the picture, E-47) and **not** in gate arbitration (the form-credit
fix took live — `close_shell` now sticks on a tie, detail unlocks, the carve/relief hands read as construction
on a closed wall). The eyes and the ruler are good enough. **What's left is hands — three specific construction
geometry gaps** the live climb named and ranked, with renders as evidence:

1. **The form-readiness metric collapses under proud detail.** After `relief_walls`, `closureOf` cratered
   **1.000 → 0.068** though the shell is physically intact — because `eaveRingClosure` (`wall-generate.mjs:275`)
   folds *every* band column into the perimeter, so the 224 proud quoins + 106 plinth cells that make the wall
   *read as construction* register as "open." The climb's own gate then turns against the build (round 5
   re-picks `close_shell`, which no-ops), and on a longer budget it **oscillates** (detail → "reopened" →
   close no-op → detail). This sabotages the climb after the *first* detail pass — the highest-leverage fix.
2. **No arched gate** — the defining feature of a *gatehouse*. `carve_arch` produced a ragged notched carve
   (correctly refuted by the coherence gate); `frame_arch` left a too-narrow framed slot. The 1-wide passage
   needs a **rebuild to a wide opening**, not a widen-carve.
3. **Roof is brown not slate, and too steep.** The terminal `recolor_roof` never ran (round cap); the framing
   eyes flagged **SCALE: ridgeToEave 1.63 vs 1.35**. The E-50 roof residual, confirmed live.

This epic finishes the gatehouse: fix the three, re-climb, and judge on the glance whether it reaches its
picture. Governed by `docs/knowledge/project-direction.md` + `docs/knowledge/anti-hedge-directive.md`; frozen
instrument untouched; subscription shim only.

> **Scope (2026-06-17):** E-52 closes M1 on **one subject**. Generalizing the climb across subjects/styles
> (the old E-49 stub's intent) moves to a future **E-53 stub** — to be shaped from *this* epic's outcome
> ([[diverge-before-converge-experiment-freedom]]). One M1 house before multiplying.

## The three fixes (ranked by leverage; the live climb's ordering)

**Form-metric first** (it unblocks the climb's own gate from sabotaging every detail pass), then the wide-arch
rebuild and the roof — those two are independent and can land in parallel once the metric reads true.

## Stories

- **S-202 — form-readiness metric invariant to proud detail (the unblocker).** Measure closure on the **wall
  plane / footprint**, not over all band columns, so proud quoins/plinth (relief that *should* read as
  construction) no longer crater `closureOf`. The climb must be able to add relief and keep a closed-shell
  reading. Regression: the real T-201 relief build (closure must stay high), and a genuinely-reopened shell
  must still read low (don't make the metric blind to real holes).
- **S-203 — wide arched gate by rebuild, not widen-carve (the defining feature).** A hand that **rebuilds**
  the declared gate aperture to its intended wide arched form (head/jambs/sill, voussoir from S-179),
  satisfying the aperture-coherence gate — the thing `carve_arch`'s widen-a-1-wide-slot could not. Closure
  holds everywhere but the declared aperture.
- **S-204 — roof to its picture: slate colour + correct pitch.** Land the agent's already-correct
  `recolor_roof` intent (brown → dark slate) and bring the pitch to the concept (ridgeToEave ~1.35, down from
  1.63) so the framing eyes' scale flag clears. The E-50 roof residual, finished.
- **S-205 — the M1 capstone: re-climb and judge the glance.** Re-run the metered gatehouse climb with the
  three fixes; does it now reach **its** picture — closed dressed walls, **wide arched gate**, **dark gabled
  roof at the right pitch**, right orientation/scale — mostly autonomously? Or a precisely-named **sixth gap**.
  Depends on S-202 + S-203 + S-204.

## How this epic can fail (state it up front — anti-hedge)

- **The form-metric fix over-corrects** — measuring on the wall plane makes it blind to a *real* reopened shell
  (a true hole now reads closed). Then the metric is wrong the other way; the regression fixture (reopened
  shell reads low) is what guards it.
- **The wide-arch rebuild reopens the closure war** — rebuilding the aperture drops closure below the form-ready
  threshold and the climb re-locks detail / oscillates. Then S-203 and S-202 are coupled and must be designed
  together (the aperture is *declared*-open, so closure-except-aperture must hold).
- **The pitch lever doesn't exist** — bringing ridgeToEave to 1.35 needs roof-geometry control the generator
  doesn't expose (the S-163 geometry-lever path is off the picture-climb). Then roof pitch is a named limit and
  the roof reaches its picture on colour only.
- **The fixes land but the glance still misses** — a **sixth gap** appears (interior/ROOM, a material the kit
  lacks, proportion beyond pitch). Then M1 on the gatehouse is genuinely deep; name it for E-53.
- **Scope creep into generalization.** This epic is the *gatehouse*. Other subjects are E-53.

## Done when

The form metric stays high through a relief pass (and still flags a genuinely reopened shell); the gatehouse has a wide
arched gate that passes the coherence gate; the roof reads dark slate at ~1.35 pitch (or pitch is a named
limit); and a re-run metered climb reaches the gatehouse's picture on the glance — closed dressed walls, arched
gate, dark gabled roof, right orientation/scale — mostly autonomously. **Or** a sixth gap is named at full
strength as the input to E-53 (generalize). Frozen instrument untouched; subscription shim only.
