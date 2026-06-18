# Roadmap

**Where we are (2026-06-16).** Foundations → Measurement archived (E-01…E-38) at
`docs/archive/2026-06-15-foundations-through-measurement/`. Retro:
`docs/findings/2026-06-15-sprint-retro-foundations-through-measurement.md`.

Walls done (geometry closes dense + sparse; skin reads as construction). **E-39 done** — built the
two-layer structured-feedback machinery and ran the referee, which **refuted both headline bets** and
localized the real gate. The binding constraint is now precisely **the scalar scoring step**, plus the
roof.

**Governing:** `docs/knowledge/project-direction.md` (the differentiator is the measurement, not prettier
builds) + `docs/knowledge/anti-hedge-directive.md` (every epic states how it can fail).

---

## E-39 outcome (done) — the machinery works; the scalar is the gate

Built: typed `Department` contract (generated from the idiom-registry), split Layer A (per-style diagnose)
/ Layer B (unified route), a declared `style`, and a genuinely-different second style (guildhall). The
referee (T-166-01) then landed **both bets NEGATIVE — the valuable result**:

- **Clean × wrong-style did NOT crater:** matched 52, wrong-style 46/40, control 58 — inside the ±12
  noise. *But not cosmetic:* the per-style judge reads style correctly (names guildhall quoins/pilasters/
  voussoirs). The blindness is in **severity → scalar** — the score counts *missing-element presence*, not
  *style distance*; a present-but-wrong-style element isn't scored as a major defect.
- **Split did NOT beat fused on dispatch** (split 3/6, fused 6/6) — but under-powered (2 states) and the
  one miss is a genuinely contestable worst-defect; the verdict was *adapter-sensitive*, which is an
  argument **for** the typed dispatch.

Both negatives converge on the same place: **scoring, not reading.**

## E-40 outcome (done) — the term over-caps; root cause certain

Built the labeled corpus + the style-distance severity term + the referee. Result, **third honest
negative in a row, each sharper than the last**:

- **Did NOT crater — it COLLAPSED.** Matched=2, wrong=0/2 (E-39 baseline was 52/46/40/58). The term floors
  *everything*, including a build against its own concept.
- **Root cause is mechanical and certain:** the structural `itemStyleClass` calls an item "wrong-style"
  whenever live Layer A emits a non-empty `present` AND `missing` — which is *almost every* item. The cap
  fires on correct builds. **Recommendation: DO NOT PROMOTE; re-calibrate via a typed `kind` discriminator
  from Layer A** (the scoring core is already wired to read it; Layer A doesn't emit it yet).
- **Agreement:** easy 3/4 by ordering, one inversion; the **contested middle is untestable** here (corpus
  excludes its only contested pair) — stated, not averaged away.
- **Second finding (a named failure mode fired):** the "matched" gatehouse scores 2 *against its own
  concept* — the build is materially unfaithful (plank/log siding, no cobblestone). The ceiling is on the
  floor because the **build itself is wrong**, not just the metric.

## E-41 outcome (done) — typed `kind` wired; over-cap discriminator in place

Layer A emits `kind ∈ {add, replace, remove}`; the structural `present∧missing` over-cap heuristic is
replaced by the judged tag the scoring core already reads. The crater stayed un-separated at this rung (8 /
14) — *as the wrinkle predicted*: a correct judge still caps the gatehouse because the build is genuinely
material-wrong vs its concept. A fixed the over-cap of incomplete-but-right builds and handed
crater-separation to E-42.

## E-42 outcome (done) — the crater SEPARATES (fragile), the gate moved to the build

- **T-171-01 / T-172-01:** material faithfulness (gatehouse → cobblestone/stone) + roof-as-construction
  covering (kills the plank prism; multi-ridge per `masses[]`).
- **T-173-01 crater re-run:** on a materially-faithful build, **matched 28 ≫ wrong-style 0 — spread 28,
  outside the ±12 noise and the 2·noise bar. The first real separation of the arc.** The driver is material
  faithfulness (the wrong-style twin earns 2 `replace` departments → floors to 0).
- **But PROMOTE-PENDING-CONFIRMATION, for build-side reasons:** (1) no single *fully*-faithful build — the
  faithful walls and the covering roof live on different pipelines, so the matched build still self-caps on
  a residual dark-oak **prism roof**; (2) the separation is a **2-vote coin-flip** (2 vs 1 `replace` tags).
  **Both are creation-loop tasks, not term-scale re-calibration — the residual gate is the build, not the
  measure.** → E-44.

## E-43 outcome (done) — articulation reads; sourcing reproduces hand-authored; one leak named

Reshaped **spike-first** (diverge before converging). **T-174-01** spiked A/B/D on the gatehouse: winner is
the compositional grammar (A) — *but the spike's honest finding is the real lever is AMPLITUDE, not method*
(token→amplified is the dramatic jump; B's extra string course read **busy**). **T-175-01** built the grammar
(edges-from-geometry, recess-by-exclusion closure-guarded) — the gatehouse now reads as a rusticated stone
gatehouse with quoins, cornice, and a dressed arch. **T-176-01's standout:** `sourceTreatment(program,pack)`
**reproduced the hand-authored spec byte-identically from role lookup** — so LLM-authoring/pattern-book
wasn't needed; the missing piece was amplitude, supplied by the critique→amplify loop the one-shot builds
lacked. Two honest negatives: the amplitude loop **overshoots** (hd3, glance-overruled to hd2), and the
roof/opening unification **leaks** on the raking verge (sloped line) and voussoir head (curve) — the two
edges the wall row/column model can't name. → E-44 (S-179).

## E-44 outcome (done) — the crater REFUTED; the gate is the measure

The payoff measurement landed in its embarrassing branch, reported in full.

- **S-177 / T-177-01:** one fully-faithful gatehouse delivered (covering roof on faithful walls; prism census
  53%→17%, closure 1.000, program-driven). Seam named honestly: not an in-path pipeline merge but a
  post-realize carve+cover (no prism fallback).
- **S-178 / T-178-01 — the crater COLLAPSED at VOTES=6.** Matched 13±12 vs wrong-style 0±0 (A−B=13, *inside*
  ±12 noise). **T-173-01's 28 was a 2-vote sampling artifact** (per-vote `[0,4,20,28,28,0]`). The matched
  build earns WALL:replace 6/6 + OPENING:replace 6/6 against its **own** concept, identical to its wrong-style
  twin (`replaceContrast −0.20`). Making the build faithful did NOT lift matched; more votes dissolved the
  crater. **The residual gate was never the build — it's the measure:** `styleFidelityScore`'s `replace`→hard-
  cap is not concept-conditional. **DO-NOT-PROMOTE / RE-CALIBRATE.** (Lesson: VOTES=2 means are unreliable on
  this near-bimodal fixture — use ≥6.)
- **S-179 / T-179-01:** both E-43 leaks closed with one *profile* primitive (extreme-cell-per-across; a flat
  row is its degenerate). Raking verge reads on the real gatehouse (198→34 cells, follows the pitch); voussoir
  head proven on synthetic arch — but no-ops on the faithful build because its gate isn't a true arch aperture
  (a build gap, named, not a grammar gap).

## E-45 outcome (done) — the measure MECHANISM is fixed; a pack confound blocks the freeze

The recalibration worked at the mechanism level and landed in the honest middle.

- **S-180 / T-180-01:** locus = **BOTH**. WALL = R (the judge mis-read a *material-matching* wall as
  wrong-style); OPENING/ROOF = S (genuine divergences the binary cap floors). Binding defect pinned to a
  **forced 32-per-`replace`, severity-blind** penalty (reproduced `[0,4,20,28,28,0]` in code).
- **S-181 / T-181-01:** implemented both — concept-conditional `DiagnoseBuild` (R) + graded style-distance
  replacing the binary cap (S), creation-loop scoring only, golden re-pinned.
- **S-182 / T-182-01 — the payoff.** Same crater @VOTES=6 that collapsed in T-178-01: matched **13→41**,
  `replaceContrast` **−0.20→+0.245 (DISCRIMINATES)**, matched `replace` 12/12→**0/25**, wrong twins stay low
  (no over-soften). **The mechanism is fixed.** *But* two pre-registered shortfalls block a clean promote:
  A−B=22 is **2 short of the strict 24 bar**, and a **pack confound** — the separation rides on the **pack**,
  not the concept image (pack effect C−B=+29 vs concept-image effect A−C=−7). **PROMOTE-LEANING, DO-NOT-FREEZE;
  the deciding gate is the labeled multi-state corpus.**

## E-46 outcome (done) — the gate ran and returned DO-NOT-PROMOTE: the term reads the PACK, not the picture

The decoupling corpus did its job and produced the arc's sharpest, pre-registered negative.

- **S-183 / T-183-01:** the decoupling corpus — 3 subjects, 12 states, the pack×picture 2×2 + a labelable
  hard middle, replay-reproducible.
- **S-184 / T-184-01 — the decomposition: PACK-DRIVEN.** Pooled `packEffect 45 ≫ conceptImageEffect 8`.
  Smoking gun: a faithful cottage in the wrong pack scored **0**; a wrong-picture build in the right pack
  (61) **outranked** the faithful build (47). Hard-middle term-vs-label agreement **1/5**, τ **−0.14**.
  The gate was *labelable* (0.90 self-consistency) → the term is wrong, not the labels. **The eval was
  measuring the material spec it was handed, not whether the build looks like its picture.**
- **S-185 / T-185-01:** DO-NOT-PROMOTE; localized the seam (`diagnose.mjs::styleProfileBlock` — "expected" is
  pack-derived) + scoped the successor. `measurements/` untouched (no autonomous freeze; proxy labels are
  non-licensing anyway).

## Active — E-47 concept-image-conditioned-style-distance

Make the term read the **picture**, then re-run the *same* E-46 gate (corpus + harness unchanged).

- **S-186 / T-186-01 (done) — picture-anchored expectation.** Anchored the judge's "expected" on the concept
  image, demoted the pack to vocabulary. **Big directional win:** `packEffect 45→12`, `conceptImageEffect
  8→18` (now leads), hard-middle agreement **0.20→1.00** (τ −0.14→**+1**), every E-46 inversion reversed,
  `ct-wrongpack` 0→16. **But DO-NOT-PROMOTE (MIXED):** the +6 picture lead sits inside the ±12 noise band —
  because matched builds **compressed 53→21** (picture-anchoring grades blocky voxel renders against concept
  *art*, flooring even faithful builds and squeezing the margin).
- **S-187 / T-187-01 (active) — voxel-vs-art tolerance + re-gate.** Restore matched dynamic range
  (blocky-but-faithful ≠ wrong-style) **without** re-lifting wrong-picture builds — the crux — diagnose
  `gh-wrongpack`, re-run the same gate. A clean **PICTURE-DRIVEN** re-gate (`conceptImageEffect > packEffect +
  NOISE`, agreement ≥0.70) is what licenses the human-signed-off promotion.

This is the E-38 → … → E-47 arc: style-blindness → structured feedback → typed kind → faithful build →
articulation reads → crater refuted (gate is the measure) → mechanism fixed → **gate says it reads the PACK**
→ **make it read the PICTURE** (done: reads it, scale compressed) → **restore the scale, then freeze.**

## E-48 outcome (done) — the build CLIMBED; the ceiling is the accept-gate, not the hands

The first real build improvement of the whole arc, and a sharp surprise.

- **The climb worked, autonomously:** `0 → 8 → 60` (box → recognizable gabled gatehouse, +52), glance-agreed,
  **zero human intervention during the run**. The loop's eyes, hands, and agent all worked.
- **The ceiling (T-190-01):** the agent autonomously picked `recolor_roof`, correctly named the brown-vs-grey
  gap, and **cleared the ROOF major** to a concept-true dark roof — and the **accept-gate ROLLED IT BACK**
  (whole-build scalar 60→48). Mechanism: clearing the worst defect let the judge promote pre-existing
  WALL+OPENING majors (attention-shift) + vote noise. **The build failed the gate but passed the glance → the
  gate is wrong.** Bottleneck moved past "eyes but no hands" to **the accept signal itself.**

## Active — E-50 accept-gate-follows-the-glance (M1 finish line)

Fix the *creation-loop* accept-gate (NOT the E-46/E-47 promotion term), then finish the one-subject climb.

- **S-191 — department-dominant override, falsified.** Keep a tool that cleared a major in a targeted dept +
  added no new major in any targeted dept, even on a whole-build regression. Must KEEP the grey roof AND
  REJECT a deliberately-bad change (the override trades scalar-trust for department-trust — prove it's safe).
- **S-192 — build the remaining gatehouse hands** the resumed climb stalls on (arched gate — **dressing both
  through-passages**; roof **orientation to the gate**; wall-relief contrast; eave banding). Folds in the
  reviewer's 2026-06-17 glance audit (roof rotated 90° vs gate; twin voids).
- **S-193 — finish the gatehouse climb (M1 proof):** dark roof + arch + quoins + banding, human-glance agreed.

**Reviewer glance audit (2026-06-17) — a meta-finding:** three divergences (roof orientation, undressed twin
passages, scale/proportion) the picture-critique did **not** surface → the next frontier after the accept-gate
is **critique COVERAGE** (orientation / scale / opening-cleanliness). The human glance still sees more than the
loop's eyes. Scale/proportion ties to the E-33/E-34 thread.

- **E-49 — generalize the climb (stub, behind E-50).** "Better *generations*" plural: the same loop unattended
  across several subjects/styles (multi-mass, kill the `SUBJECTS` map, longevity). Shape from E-50's residual.
  M3 approach.

- **A style-distance severity term:** present-but-wrong-style = MAJOR, so a clean wrong-style build is
  capped, not waved through. This is the term that should have made the fixture crater.
- **A consensus-labeled ≥8–10-state, multi-department defect corpus** — the bake-off was under-powered at
  2 states; a real corpus is needed to judge split-vs-fused and any new severity term.
- **Cleaner builds (the roof line below) to lift the matched ceiling** — matched only scored 52 because
  the build itself is defective, masking the style spread.
- **Keep the wall:** still the *creation* loop; the frozen scalar instrument stays separate.

## Then, in priority order

1. **Roof as construction** — kill the plank-prism; multi-ridge per `masses[]` (the cottage's two gables).
   (was S-150 / deferred T-160-03.)
2. **More than one architectural language** — recognition must *declare style*; schema must express
   non-rustic grammars; need ≥2 genuinely different styles. Prereq for per-style judging above.
3. **Price of admission — volume & longevity** — delete the per-subject `SUBJECTS` map, drive purely from
   recognised programs; run across many subjects, unattended. (was S-162.)
4. **Eval human-validation on the contested middle** — its missing test asset: a *clean* build scored
   against a *same-family wrong-style* concept, expected to crater. (was S-161, sharpened.)

## Owed

- Combined re-run of the wall skin + footprint registration to confirm the sparse-shell barn recovers
  from −37 and to get honest fresh deltas.

---

*Carry-forward: the generator only knows one style because the metric never punished using the wrong one.
Teach the measure to care about fidelity to the spec, then let the agent climb that.*
