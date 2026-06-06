# form-revise.md — "we measured the form gap, then let the cage refuse to fake it" (E-15 / S-047)

E-14 closed the one E-13 miss that was **not** geometry (value drift). E-15 turns to the geometry itself:
the silhouettes that never quite match the concept — the koi's S-curve body that flattens, the heart's
aortic arch that never closes. The work is a **surgical revision loop**: a form-fidelity metric
(silhouette IoU, T-043-01) gives the **gap a number**; a region-lock + section-observe (T-044-01) frames
one defect at a time; a deterministic **accept-gate** (T-045-01) keeps an edit only if it *raises* the
metric, else rolls it back; an **LLM block-editor** (T-046-01) proposes the freeform edit. T-047-01 adds
the **form-target seam** the accept step consults — a concept target today, a GLB (image→3D) target later
— and the honest demo below.

Renders are **real prismarine-viewer voxels**. `before` is the committed E-13 build; `proposed` is the
build with the model's stashed form-edit applied (shown **even when the gate rolled it back**, so you can
see what was attempted). There is no `after` frame distinct from `before`: on both subjects the cage kept
the build **unchanged**.

## The number — E-13 baseline whole-object IoU, and what surgical revision did to it

| subject | E-13 IoU (before) | whole IoU after | proposed (rolled-back) | kept? | verdict |
|---|---:|---:|---:|:--:|---|
| **koi** (the flattened S-curve) | **0.481** | 0.481 | 0.481 | ✗ | **held** |
| **heart** (the open aortic arch) | **0.347** | 0.347 | **0.345** ⚠ | ✗ | **held** |

Source: `benchmarks/sculpture/form-revise-ab.{md,json}` (the loop's measured trace) vs
`benchmarks/sculpture/form-baseline.json` (T-043-01's E-13 "before"). Verdict is categorical, deterministic
(no model call): `improved | held | regressed`.

## The honest headline — the gate is real because it said no

Neither subject improved. The koi's proposed edit left the whole silhouette **unmoved** (0.481 → 0.481);
the heart's proposed edit **regressed** it (0.347 → 0.345), and the accept-gate **rejected it** — the
per-region accept signal fell (0.384 → 0.379), so the cage rolled it back and kept the original build. That
refusal *is* the result: the loop measured the form gap and **declined to keep an edit it could not earn**.
A loop that "improves" every build is not measuring anything; this one rolled back 2 of 2.

## The hero pair — what the cage refused

- **heart**: `frames/form-heart-before.png` → `frames/form-heart-proposed.png`. The model added voxels
  toward the arch; the silhouette IoU **dropped**, so the build you keep is the *before*. The honest caption:
  *"the model tried to close the arch; the metric said it made the outline worse; the cage kept the better
  one."*
- **koi**: `frames/form-koi-before.png` → `frames/form-koi-proposed.png` (byte-identical — the in-region
  edit did not move the 3/4 whole-object silhouette at all). The cage neither helped nor harmed; it held.

## Honest, on screen — why surgical revision *didn't* lift these, and what it cost

- **The signal is whole-object, single-view.** The accept number is the silhouette IoU of one 3/4 render
  vs a **flat Nano-Banana concept**. A small in-region block edit barely moves a *whole-object* outline,
  and a flat concept gives no honest **region-vs-region** target to hill-climb. This is the ceiling — and
  exactly what the **GLB form-target seam** exists to lift: a real 3-D target projects a per-region
  silhouette the loop can actually chase. The seam is in (`src/form/form-target.mjs`); the GLB is deferred.
- **It cost metered iterations for two rolled-back edits.** The LLM-edit route is a `claude -p` call per
  region; here it bought two rejections. That is the *honest* price of proving the cage rejects, not a bug.
- **IoU is necessary, not sufficient.** Two shapes can share an outline; silhouette IoU is the cheap form
  number, paired in the loop with the color gate — not a complete form judge (see `design-learnings.md`
  §E-15).

## Suggested E-12 beat

A **before → proposed** on the heart (the cage refusing a regressing edit) with **0.347 vs 0.345** burned
in, captioned *"the loop kept the better silhouette."* Then one line: *the form-target seam is wired for
the image→3D target that turns this honest no into a yes.* The beat is the **method** (measure → attempt →
refuse-if-worse), not a fabricated win.
