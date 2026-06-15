# T-134-01 — steep-pitch-construct — Review

Phase artifact 6/6. The handoff: what changed, how it's proven, what a human should look at.

## What shipped (5 commits: 782cf45, e2e8c28, 3f9704a, 4c718f9, 609fb9d)

**The brush.** `roof.gable.steep` — pitch classes above the stair's native 45°, realized as the
Minecraft 2:1/3:1 mixed full-block/stair stepping family. The construction itself was already
latent in `generateRoof`'s whole-step-edge rule; the brush owns the contract that path never had:

- `src/view/roof-steep.mjs` (new): declared classes `STEEP_PITCH_CLASSES = [2, 3]`
  (≈63.4°/≈71.6°); **named refusals as exported data + thrown findings** — non-integer classes
  (slab serration), ≤1 (roof.gable's domain), >3 (a wall), missing stair family (no silent
  full-block fallback here), off-stepping ridge, unreachable ridge; delegation to the shared
  `gableRecord` + `generateRoof` core (no emission fork); a post-emission **steep invariant**
  (every non-cap slope column tops with a straight uphill tread) as a generator-drift tripwire.
- Registry entry with pitch enum [2,3]; three committed preview cards (both axes at 2:1, one
  3:1); catalog regenerated — **23 brushes, unmapped 0**; brush-count baseline updated with
  history; `roof-steep` joined the brush-door guarded set (allowlisted only for its
  roof-generate core import).

**Demand-side surfaces.** `roof.gable` now refuses pitch >1 by name (the silent unproven steep
door is closed); `ROOF_LAYOUTS` routes the steep idiom like a gable; compile's `roofBlocks`
rides the pack's roof.gable row when the steep idiom has no row of its own; the **dormer seat is
pitch-aware** (`eaveY + ⌈pitch⌉` — byte-identical at every legacy class; at steep classes the
legacy seat would flood the dormer light with a tread); `REALIZABLE_PITCHES` is {0.5, 1, 2, 3}.

**The barn realization** (`benchmarks/sculpture/steep-pitch.mjs` + records):
- `barn--saltcrag`: one parameter through one seam (gable → steep class 2, same
  seedWorkshopProgram); ridge 21→33; ridge:eave 2.4444→3.7778; **conformance PASS including
  courses-even on steep courses**; before/after renders at all four gate azimuths committed
  (`benchmarks/sculpture/steep-pitch/view-*.png`) — **the silhouette visibly steepens** toward
  the concept's tall gable read.
- `barn` (rustic): **named refusal, committed** — the style declares no steep class
  (vocabulary [1]); widening rustic is a pack/style decision, not this runner's.
- Demand recorded honestly per E-33's honesty rule: the brief says "steep gabled roof", the
  concept gable end reads ≈2:1, the mesh-derived sketch says 45° (TRELLIS flattening) — the
  record carries all three side by side; T-133's measured record (ridge:eave target 2.1 stuck
  at 2.4 under the 45° ceiling) is the same gap seen from the measurement side.

## Test coverage

- `src/view/roof-steep.test.mjs` ST1–ST10: orientation matrix (ridge axis × class × span
  parity, all four tread facings), ridge caps (odd/even parity), verge/ends sheet behavior,
  gable-end solidity, **dormer-on-steep composition** (light clear, niche sealed, face on mass,
  no floaters), courses-even with chain-shaped declarations, every named refusal, determinism/
  byte-stability, plateau caps, and the single-door property (roof.gable refuses >1 by name).
- `src/recognition/compile.test.mjs`: steep lowering (family fallback, ridge-on-stepping,
  pitch-aware dormer seat, legacy seat byte-identical).
- `src/pack/style-pack.test.mjs`: classes 2/3 declarable, 0.75 still refused.
- Replays: full suite **1949 pass / 0 fail**; `patternbook:offline` (both packs, incl. the
  dormered cottage), `measured:offline`, `steep:repro`/`steep:offline` (both packs) all
  REPRODUCE byte-identically. Registry growth absorbed by the T-132 registry-as-recorded seam
  (formation tests green, no fixture churn).
- **No judge runs anywhere; no per-building constants** (runner self-grep clean).

## Gaps / not tested (named)

- **Steep hip/pyramid are not offered** (refusal data names it): corner stair states at
  multi-rise steps are unproven vocabulary. A future ticket if a concept demands it.
- Class 3 has no realized building yet (cards + unit tests only) — no pack declares 3.
- The steep invariant restates the emission rule rather than deriving it independently; it
  catches drift (top-cell shape/facing changes), not deeper surface-law changes — ST1's
  explicit surface formula covers that.

## Open concerns for the reviewer

1. **The after-build overshoots the sketch's ratio target** (ridge:eave 3.78 vs sketch target
   2.1) — expected: the sketch is the TRELLIS-flattened mesh and *under*-demands (E-33 honesty:
   concept is the contract). Whether class 2 on the *expanded* footprint reads taller than the
   concept at the glance is exactly S-135's (proportion conformance) and S-138's (the frozen
   gate) question — the renders are committed for that judgement. If the glance says too tall,
   the levers (S-136) can lower ridgeY onto a below-apex plateau without touching this brush.
2. **Rustic's steep adoption is deliberately not done here** — two pack decisions are pending
   in one place: adding a steep pitch class, and the pre-existing finding that the rustic barn's
   roof family carries **no stair blocks at all** (program fieldRole dark oak vs the pack's
   spruce gable row → full-block fallback; the committed rustic barn build has zero treads).
   Both belong to S-133/S-136-adjacent pack work; the refusal record documents it.
3. **Chain adoption** (recognition prompts offering the steep idiom, re-recognized or measured
   programs naming it) is S-136/S-138's, matching T-133's identical handoff. The compile +
   layouts wiring is in place; a re-seeded program naming `roof.gable.steep` with a declared
   class compiles and realizes today (proven by the compile test and the runner).
4. **A sibling-session `--amend` incident** (progress.md deviation 4): briefly rewrote a T-133
   commit while folding a fix; recovered via reflog with no content loss. Worth a Lisa-level
   note that shared-branch sessions should avoid `--amend` entirely.

## AC ledger

- Brush through the door, pitch-class-parametrized, realizable/refused declared by construction,
  pure, orientation-tested, unmapped empty, preview card, catalog 23 ✓
- Composes with ridge caps, verges, gable ends, dormers; courses-even passes on steep ✓
- Realized on the barn (saltcrag, whose style affords the class) with committed 4-azimuth
  before/after renders; silhouette visibly steepens; rustic = honest named refusal ✓
- No judge runs ✓; replay byte-identical (steep:repro + all prior chains) ✓; no per-building
  constants ✓; `npm test` green (1949) ✓
