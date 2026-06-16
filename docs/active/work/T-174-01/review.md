# T-174-01 — Review: articulation-approach spike on the gatehouse

**Scouting spike (S-174 / E-43).** Built rough versions of the candidate articulation approaches on the
material-faithful gatehouse, rendered each beside the concept, judged on the glance. Deliverable = a decision
+ evidence, not a system.

## What changed

| path | change |
|---|---|
| `experiments/eval-alignment/articulation-spike.mjs` | **new** — throwaway spike runner (composes existing brushes at varying amplitude; renders beside concept) |
| `docs/active/work/T-174-01/{baseline,candidateA,candidateB,candidateD}-beside.png` | **new** — the four beside-concept renders (the evidence) |
| `docs/active/work/T-174-01/*.md` | **new** — RDSPI artifacts |

**No production source, schema, pack, test, or instrument change.** `npm test`: **2249/2249 green**
(unchanged — spike is unswept by `src/**/*.test.mjs`). Frozen instrument (`measurements/`, pin-guard)
untouched. Git tree outside `experiments/` + the work dir is clean.

## The renders (the glance)

Base `builds/gatehouse/faithful/artifact.json` (stone_bricks walls, eaveY=19, cobblestone:4 → quoins
essentially absent). Concept: bold rubble corner quoins + timber arched gate + a lighter eave band on a dark
roof.

- **baseline** (token, quoin proud=16): the plain grey box — corners read as tiny blips. Confirms the E-42
  "token articulation" gap is real.
- **A — grammar** (full-height quoins hd2 proud=120 + eave/verge band + arch): full serrated rubble quoins on
  **every** corner, an eave cornice lip, dressed openings. Reads clearly articulated and recognizably closer
  to the concept. Clean, not noisy.
- **B — pattern-book** (bold quoins hd3 proud=160 + 2-course band + mid-height **string course** + arch):
  bolder corners (chunkier rubble, arguably the closest quoin match to the concept) — **but** the mid-height
  string course adds a horizontal belt the concept does **not** have, and it reads **busy**. First touch of
  over-articulation.
- **D — critique** (token→deepen→arch, no band): A's quoins + arch but missing the eave band — slightly
  **under-finished** versus A.

## Recommendation

**Winner: A — the compositional treatment grammar — but the lever the spike actually proves is AMPLITUDE, not
method.** The dramatic glance jump is **token → amplified** (quoin proud 16 → 120; baseline → A/B/D all read
as a different, articulated building). The differences *among* A/B/D are marginal: A is the restraint-winner
(quoins + eave band + arch — the load-bearing trio, cleanly), B over-articulates (its extra string course is
the busy hint), D under-finishes (drop the band and the build looks plainer). So this lands honestly between
the claim's "clear method-winner" and its "lever is amplitude" failure mode: **amplitude is decisive
(E-43's "amplitude is first-class" decision #1 is validated on the render), and among methods the systematic
grammar at *moderate, restrained* amplitude reads best.**

**What S-175 should build:** candidate **A** — the declarative layered treatment with **amplitude
(depth · run · course-count) as a first-class, tuned knob** — at *A's restraint, not B's boldness*. Keep the
load-bearing trio (full-height geometry-derived quoins + a single eave band + the timber arch reveal); **do
not** add mid-field belts/string courses unless the concept shows one (B's lesson: more layers ≠ richer →
busy). Guard the recessed-field layer with `reliefNoRegress` when S-175 adds one (this spike used only
additive proud relief, so closure was never at risk — the recess-by-exclusion guard is still untested and
remains S-175's job).

## What was dropped (no silent truncation)

- **Candidate C (reference/concept-driven placement) — not built.** Most expensive (an LLM concept-read seam
  that does not yet exist) and least reusable; on a hand-authorable subject like the gatehouse it can only
  *match* B's hand-tuned relief at higher cost, never out-glance it. Deferred to **S-176 (sourcing)**, where
  an LLM authoring treatments for *unseen* subjects is where concept-driven earns its generality.
- **Candidate D's loop is simulated, not a real LLM critique.** The amplitude bumps a critique would request
  here (thin→deep, arch-absent→reveal) are obvious and were applied deterministically. The *value* D would add
  — automating the amplitude decision — is exactly what S-175's first-class amplitude knob + E-39 critique
  (S-176) would wire; the spike shows the destination, not the loop.

## Open concerns / limitations

- **Roof is still the dark_oak prism** on this base (the faithful build predates the covering pipeline). The
  spike is wall/opening articulation only; the concept's *roof* eave/verge band on a real covering roof is an
  S-176 generalization, not tested here. Named, not hidden.
- **The busy ceiling is real and close.** B crossed it with one extra belt. S-175's amplitude knob must be
  bounded by restraint/taste; the render, not a score, stays the judge.
- **`eaveOverhang` as a "band" covers corners too** (whole-row proud course) — in the spike the band slightly
  overlaps the quoin tops. Cosmetic at glance; S-175's real treatment should derive the band as a *field-only*
  edge (exclude corner columns) so the quoin/cornice junction reads crisply.
- Single subject (gatehouse). The "edge-derivation breaks on hard geometry" risk (L-masses, gables) is
  untested — the gatehouse is one clean box. S-175 should retest the geometry-derived edges on the cottage's
  two-mass plan before trusting generality.

## For the human reviewer

The decision rests on four PNGs in this dir; open them and read left (concept) → right. The one call to
check: **is A's restraint right, or should S-175 carry B's quoin boldness (hd3) while dropping B's string
course?** My read is A's amplitude is enough and B's belt is the busy tell — but that is exactly the
taste/amplitude judgement the epic says the glance owns, so it is the reviewer's to confirm.
