---
id: E-28
title: component-fit-closure
type: epic
status: open
priority: high
depends_on: [E-27]
spec: "§1, §5, §6, §9"
stories: [S-108, S-109, S-110, S-111]
---

## Background (read this first — self-contained)

**The project.** `mc-design-eval` measures an LLM's spatial/material *design* capability via styled
Minecraft builds. After E-27 (parametric reconstruction) the pipeline regularizes the voxelized TRELLIS
mesh under a no-regress cage, decomposes it into components, regenerates the roof as fitted stair-course
construction, and skins component definitions — durable, registry-only, judged by a frozen kit-aware +
4-azimuth gate.

**Where E-27 honestly landed (2026-06-10, verified records).** Spikes: cottage 265→51, gatehouse 118→25,
church 602→202. Three azimuths now judge **same-object** (cottage 135°/225°, gatehouse 315° — from zero
before reconstruction). The remaining FAILs are no longer noise, lens debt, or skinning — they are
**named, specific form gaps**, plus one measurement-identity bug:

- **Cottage** (10/2): 45° major `form @ roof across the whole top` + major `massing @ upper storey gable
  ends`; 315° major `form @ roof`, minor eaves/edges. The fitted roof's **slopes** are right (135°/225°
  pass); its **gable ends and terminations** are not.
- **Gatehouse** (11/2): majors at 45°/135°/225° all naming `form @ roof — ridge line and slopes`,
  `massing @ upper roof edges and chimney-like protrusions`, `massing @ overall silhouette`. The
  **ridge form, upper-edge terminations, and un-fitted protrusions** are the gap.
- **Church**: never reaches the gate. Two named blockages in
  `benchmarks/sculpture/reconstructed/church.json`: (a) `roof-program-fallback` — the roof fit was not
  accepted, the sampled roof stays (honest fallback); (b) `chain-refused` — the skin coverage gate fails
  `band0 stone=0.327 < 0.5`. **But the census decomposition shows band0 is 91.5% stone-family**:
  `polished_basalt` 1225 + `stone` 681 of 2082. The assignment painted the *role* across two stone
  blocks; the gate censuses the *literal block* `stone`. This is the **kit-blind-gate class of bug**
  for the third time (T-095 kit-renamed bands censused 0; T-101 dominant-only rejected the styling) —
  a naming seam, not insufficient stone.

**The thesis.** E-27 proved fitted components move verdicts. What remains is **finishing the fit**: the
parts of a roof that aren't slopes — gable ends, verges, eaves terminations, the ridge — fitted against
the GLB like the slopes were; and **finishing the census** — coverage must measure the *intended role
family*, not one literal block name, at every naming seam. Close those and every named gap on every
subject is addressed by construction; the milestone then tests for the first **full multi-angle passes**.

## Rules of engagement (binding)

1. **The instrument stays frozen — with the one principled exception, third time now.** Thresholds,
   azimuths, and the judge contract never move. A gate-side change is permitted **only** to fix a
   measurement-identity bug (a census blind to a renaming/role seam), and only when it is **monotone**
   (everything that passed still passes), **both fractions are reported** in new records, and committed
   pre-existing records remain valid. The T-095/T-101 precedents define the class; the church band0
   census is the third instance.
2. **Fit, don't invent** (inherited E-27 Rule 1): every gable, verge, ridge, and termination is fitted
   to the GLB component with the fit error recorded; out-of-tolerance → the current geometry stays and
   the failure is named. The cage (per-azimuth silhouette IoU, closure, protected regions, auto-rollback)
   wraps every form op.
3. **Construction, not patching:** gable infill, verge trim, and ridge caps are generated constructs
   (full blocks / stairs / slabs with correct states via the proven path) extending the E-27 generators —
   not per-voxel touch-ups of the blob.
4. **No re-rolls, named gaps** (inherited): one judge run per view per milestone, verdicts committed;
   residuals named per angle/region/attribute; a marginal view's verdict is the verdict.
5. **Inherited in full:** E-24 durability, E-25 anti-tuning (registry-only, immutable references, all
   azimuths), E-26 kit accountability.

## Scope

**In:** (a) **gable-and-verge fit** — gable-end triangles, verge/rake lines, eave terminations fitted to
the GLB roof component and generated cleanly (the cottage 45°/315° majors); (b) **ridge-and-silhouette
fit** — ridge line/cap construction, upper-edge terminations, and removal/refit of unfitted protrusions
against the GLB silhouette (the gatehouse majors); (c) **church unblock** — align the coverage census to
role-family identity at its naming seam (Rule 1's exception), re-attempt the church roof fit
**per component** (tower + nave from the T-103 decomposition), and take the church through skin → kit →
gates for the first time; (d) the **closure milestone** — all three subjects re-run end-to-end,
instrument-diff recorded, testing for the first full multi-angle passes.

**Out:** new subjects; interiors; sculpture form work; TRELLIS mesh quality; any threshold/azimuth/judge
change (Rule 1); the brief/rubric (immutable).

## Candidate stories & DAG

```
S-108 gable-and-verge-fit ─▶ S-109 ridge-and-silhouette-fit ──┬─▶ S-111 closure-milestone
S-110 church-unblock (census identity + per-component roof) ──┘
```

- **S-108 — gable-and-verge-fit.** Extend the E-27 roof program beyond slopes: fit and generate
  **gable-end triangles** (infill plane on the component's end faces), **verge/rake lines**, and **eave
  terminations** against the GLB. Targets the cottage's two failing views by name.
- **S-109 — ridge-and-silhouette-fit.** **Ridge construction** (cap courses — slabs/stairs — fitted to
  the GLB ridge line), **upper-edge terminations**, and a **silhouette-residual pass**: protrusions the
  GLB doesn't show (the gatehouse "chimney-like" lumps) get refit-or-removed under the cage. Targets the
  gatehouse's three failing views by name. Runs after S-108 (both extend the same roof program — kept
  sequential to keep the generator coherent).
- **S-110 — church-unblock.** Two named causes, two fixes: (1) the coverage census composes
  **role-family identity** at its naming seam — band0's intended stone role counts `stone` +
  `polished_basalt` (measured 91.5% together) instead of one literal name; monotone, both fractions
  reported (Rule 1 exception, third instance of the class). (2) The `roof-program-fallback`: re-attempt
  the fit **per component** — the church has a tower roof and a nave roof (T-103 decomposition); fitting
  them separately is the expected unblock for what a single whole-mass fit rejected. Then the chain runs
  through skin → kit extraction → both gates for the first time; every stage's outcome named.
- **S-111 — closure-milestone (terminal).** Cottage, gatehouse, church through the full reconstructed
  chain — one named `npm run` each, reproducible, instrument-diff recorded (`diffs: []` or the named
  Rule-1 census exception only). The test: **first full multi-angle passes** (every azimuth same-object,
  ≤2 named minor gaps) — or honestly named residuals with the fit errors that explain them.

## Definition of done

- **The named gaps are addressed by construction:** cottage gable ends and eaves generated from fitted
  parameters (45°/315° re-judged); gatehouse ridge/upper edges/protrusions fitted or removed under the
  cage (45°/135°/225° re-judged); fit errors recorded everywhere.
- **The church is unblocked or its residual is measured:** coverage censuses role families at the naming
  seam (both fractions reported), the per-component roof fit attempted, and the church reaches the gates
  — its first verdicts recorded, whatever they are.
- **The milestone is judged with the receipt:** instrument-diff committed per subject; no re-rolls; full
  passes or named residuals per angle/region/attribute.
- **Durable + general:** named `npm run` per subject, reproducible, registry-only; `npm test` green;
  journal (`design-learnings.md`) + E-12 handoff.

## Orchestration notes (for the autonomous run)

- **Runs on the E-27 chain**; committed component/decomposition/roof records are the inputs. S-108 and
  S-110 are independent and can start immediately; S-109 follows S-108 (same generator); S-111 is
  terminal.
- **GL-free where it counts:** fits, generators, census composition, and the cage are pure/deterministic,
  unit-tested on synthetic components; renders and the judge are the metered edges. One judge run per
  view (Rule 4).
- **The census change is the sensitive edit.** It touches a gate seam — follow the T-101 precedent
  exactly: monotone proof, both fractions in new records, committed records untouched and still valid,
  the reasoning written down for the reviewer. Anything beyond identity composition is out of bounds.
- **Honesty.** If a gable can't be fitted (genuinely irregular mesh end), if the church tower roof
  rejects even per-component, or if a re-judged view flips the wrong way, those are recorded findings
  with measurements. The milestone's value is the verdict's trustworthiness, not its direction.
