# E-20 beyond facade — we broke facade-only (the hero handoff, T-070-01)

The terminal E-20 handoff for the showcase. **The beat:** text→JSON's ceiling was **one grand face** — a
temple facade, a single connected plane, with a *flat reverse side*. The matured pipeline (TRELLIS bulk →
E-19/E-21 clean materials → E-15 surgical cage → the T-068 high-res voxel build) produced a **whole structure,
in the round** — a stone gatehouse, **54×64×54**, **57,202 blocks**, four real sides and a stepped roof. The
leap is *completeness*: a building where there was only a face. This doc is the narrative + asset manifest the
Production desk slots into the cut.

## Why it lands — the turntable is the proof

Every committed `spin-*.mp4` before this one revealed a **flat facade back** when it rotated past 180°
(`pr/assets/rotations/README.md` says so in its own honest note — that flat back is the gap that motivated the
whole-structure arc). `spin-building-e20.mp4` is the **first `spin-*` whose full 360° does not** — the back and
the roof are real geometry. You cannot fake that with a flat AI picture, and you could not get there with
text→JSON. One rotation makes the whole E-11→E-21 journey pay off on screen.

## Assets shipped (all committed, in `pr/assets/`)

| asset | path | mark | use |
| ----- | ---- | ---- | --- |
| **360 turntable** | `rotations/spin-building-e20.mp4` (768², 48f @ 12fps, ~1.5 MB) | ⟳ | the hero rotation — all sides + roof, real back |
| **before/after** | `frames/beyond-facade-before-after.png` (2072×1190) | ▣ | one grand face (Taj facade) ∥ the full building, captioned |
| **4 turntable stills** | `frames/building-turntable-{front,right,back,left}.png` (768², az 45/135/225/315) | — | the "all four sides" evidence for static beats |

Receipts (the real numbers, not inflated): `benchmarks/sculpture/building/best/artifact.json` (57,202
placements, 4-block palette); `benchmarks/sculpture/surgical-standard.{md,json}` (the verdict + IoU); the E-20
capstone in `docs/knowledge/design-learnings.md`; `docs/active/work/T-069-01/review.md` (the topping-out
measurement).

## The verdict chip — truth beside the chip (do NOT inflate)

Per the desk norm (`sequence.md`: "shown beside the truth so nothing is inflated"), the headline is the
**scale/completeness leap**, *not* the judge verdict. The verdict is recorded honestly:

- **Scale chip (the real win):** `54×64×54 · 57,202 blocks · 4 clean blocks · in the round`.
- **Verdict chip (honest):** **weak — *as rendered by the 512² no-AA lens* (E-22; aliasing ≠ geometry).** The
  categorical judge returned `weak` at whole-object form-IoU **0.929** (final — the surgical loop accepted zero
  edits, so `building/best` *is* the final build). But the judge's "chaotic grey jumble" complaint is
  **texture-minification aliasing in the render**, not the build (T-068: off-palette 0, speckle ~0; E-21
  restored the 4 materials). E-22 fixes the lens and may lift this. **Do not put "Strong" on screen** — the
  build is a *complete structure*, and its *finish* tops out at weak-as-rendered. That honesty is on-thesis: the
  project exists to find where quality tops out.

## The honest residual (where detail tops out — say it, it's on-brand)

The bulk is complete; the **fine relief** (window reveals, cornices, arch voussoirs) is the ceiling, for two
*measured* reasons (T-069-01):
1. The **E-15 surgical LLM-edit route doesn't scale** to a 57k-block build — every region proposal overflowed
   the 1M-token context ("prompt too long"). The loop refined zero regions; the cage held.
2. The **TRELLIS form target dropped the defining detail** upstream (arch ring, gable ridge, slit windows), so
   there was no per-region signal toward them.

This is not a hidden failure — it is the residual the showcase *names*: "we build the whole thing now; making
the fine detail crisp is the next frontier (a better mesh + a context-fittable region editor + the E-22 lens)."

## Where it slots in the cut (proposed — the cut is Production's to make)

A **completeness / "we broke facade-only" coda** after the facade-hero spine (F04) and the breadth beat (F12).
Candidate placement: a new **F12.5 (E-20 coda)**, marked ⟳, that plays `spin-building-e20.mp4` under the line
*"The facade was the ceiling. Now we build the whole thing."* then cuts to `beyond-facade-before-after.png`
holding on the scale chip. It pairs naturally with F13 ("Vision — where it's heading"): E-20 is the *arrival*
of the whole-structure thesis F13 forecasts. Leave the F-table edit to the Production desk;
this handoff supplies the assets and the honest chips, nothing inflated.

**One sentence:** E-20 broke facade-only — `spin-building-e20.mp4` is the first turntable with a real back and
roof (a complete 54×64×54, 57,202-block structure), and the handoff leads with that *completeness* leap while
carrying the honest verdict (weak as-rendered, E-22 lens) and the named residual (fine detail still tops out),
nothing on screen inflated past the truth.
