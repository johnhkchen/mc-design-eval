# T-149-01 Design — re-skin-reverdict (E-35 terminal)

One decision dominates: **what is deterministic code (commit + test offline) vs. operator-run live
spend (model + GL + the epic's only judge runs)**. Everything else follows.

## Decision 0 — the scope split (the framing decision)

E-35's terminal question — *does the flat box become the articulated build at the glance?* — can only
be answered by a **live** chain: a model that recognizes a `facade` grammar from the concept, a
workshop loop that critiques real GL renders, **the epic's only judge runs** (real, non-reproducible
model calls on fresh renders), and a milestone that re-renders. None of that is byte-reproducible, and
the judge runs are singular and must **not** be burned speculatively or fabricated.

But there is exactly one **deterministic, missing code defect** standing between "everything is
built" and "a facade-bearing program builds with relief": `seedWorkshopProgram` (and the loop/geometry
rebuilds) **drop the `articulation` plan** `compileProgram` returns. Until that is closed, even a
live-recognized facade would render flat — `applyArticulation` is exported, tested, and unreached.

**Chosen split:**
- **Implement here (deterministic, committed, `npm test`-green, byte-identity-proven):** wire
  `applyArticulation` into the build occupancy at every realization point, so a facade-bearing program
  constructs relief and a facade-less program stays byte-identical. Add the relief-merge helper +
  tests (a facade fixture grows relief cells; cottage/barn/fixture are byte-unmoved). Add the milestone
  *successor* runner skeleton in `--repro` form that quotes E-34 baselines and reports both
  arithmetics (no live spend). Write the docs (design-learnings E-35 section + E-12 handoff).
- **Hand to the operator (live, documented runbook in `progress.md`/`review.md`, NOT executed):** the
  live facade recognition of cottage/barn, the `--ticket T-149-01 --rotate-pins` workshop runs, the
  gate `def.facadeGrammar` opt-in once a grammar is committed, the epic's judge runs, the S-142
  witnesses before/after, the milestone's live renders, the sheets in `pr/assets/`.

**Why this split and not "run it all here":** (a) the judge runs are *the epic's only* — singular,
billed, non-reproducible; speculatively spawning them, then having them be discarded on a context
reset, destroys the one artifact the story owns. (b) `claude -p` + headless WebGL are not available as
reproducible operations; a fabricated verdict would violate "recorded honestly." (c) The sibling
tickets set the precedent exactly: T-148's integration is "committed, operator-run"; T-147 *deferred*
the live hook to S-149 with the code "exported and ready." This ticket closes the code seam they left
and writes the runbook for the spend. **Honesty is the acceptance criterion** ("if an articulated
cottage still doesn't read, that is the finding") — so a faithful runbook + the proven-inert wiring is
the correct terminal deliverable, not a fabricated pass.

## Decision 1 — where to apply articulation in the build

`applyArticulation(occ, plan)` returns proud `placements` to add *in front of* the existing skin.
Options:

- **(A) Inside `realizeProgram`.** Rejected: `realizeProgram` takes a `workshopProgram` that has no
  `facade` (the facade lives on the *building-program* mass; `compileProgram` consumes it). It would
  need the plan threaded in, muddying the pure realizer that 30+ call-sites depend on and that has a
  strict "every element realizes ≥1 cell" contract.
- **(B) A new pure helper `realizeWithArticulation(workshopProgram, articulation)` called at each
  realization site.** Chosen. It calls `realizeProgram`, then folds the articulation placements onto
  the artifact (later-wins, like realization's own "later cells win"), recomputes the manifest, and
  re-asserts. A facade-less program passes `articulation=[]` → returns the *identical* artifact object
  shape with identical placement bytes. One helper, three call-sites (`seed.mjs`, `loop.mjs`,
  `geometry.mjs`), all already importing from `compile.mjs`/`program.mjs`.
- **(C) Apply only at the final commit in `workshop.mjs`.** Rejected: the workshop *critiques the
  rendered build each round*; if relief appears only at the end, the model never sees it and can't
  revise it, and the gate's per-round geometry diverges from what's rendered. Relief must be present
  on every realization the loop renders.

**Merge rule (in B):** articulation placements are `{pos, block}`; convert to
`{op:"voxel", pos, block: namespaced(block)}` and append after the skin placements, deduped by
`pos.join(",")` with **articulation winning** (it is, by charter, in front of the skin and may also
re-block a skin cell it fronts). Recompute `manifest` from the merged set; re-run `assertArtifact`.
Placement order: skin first (realization order), then articulation in the brushes' already-byte-stable
order — deterministic, replay-stable.

## Decision 2 — the gate opt-in (`def.facadeGrammar`)

`multi-angle-gate.mjs:loadReliefLens` already fires on `def.facadeGrammar` + `def.pack`. **No code
change is needed in the gate.** The opt-in is *data*: once a live facade-bearing recognized program is
committed for cottage/barn, the operator points `def.facadeGrammar` at it and the relief-aware verdict
becomes the exit-beside arithmetic. Authoring that path here, with no committed grammar to point at,
would create the untested-dead-code condition T-147 explicitly refused. **Decision: leave the gate
def to the operator step**, document the one-line addition in the runbook, and keep the wiring inert
on today's committed records (byte-identical, proven by the offline sweep).

## Decision 3 — the milestone recompose: reuse vs successor

The ticket allows "`milestone:*` or successor." `milestone:proportion` (E-34) quotes E-34 baselines
and re-renders both subjects — but it reports the *proportion* arithmetic, not relief. Forcing relief
into it would re-bank E-34's instrument. **Chosen: a successor runner
`benchmarks/sculpture/facade-milestone.mjs` (`milestone:facade`)** that (a) quotes the committed E-34
verdicts (barn) + T-143-02 cottage verdict **pre-rotation** verbatim as the texture baseline, (b)
reports BOTH arithmetics beside every verdict (kit-aware `overall` + `relief-aware-gate/v1`), (c) has a
`--repro` mode that re-derives from committed records with **zero** live spend and is byte-identical,
(d) the live (sheet-rendering) mode is the operator step. The skeleton + `--repro` path + the baseline
quotes are deterministic and ship here; the live render is the runbook.

**Rejected:** extending `proportion-milestone.mjs` — couples two instruments and risks re-banking
E-34. A successor keeps E-34 frozen (memory: baselines never re-banked).

## Decision 4 — no per-building constants

The relief demand period comes from the recognized grammar JSON (S-148 charter); the merge helper has
no thresholds (it is set algebra over placements); the milestone reads verdicts from committed records.
The only "number" is the fixpoint `missing===0`, owned by S-148. **Held.**

## What "done" means for this ticket (honest)

Deterministic and verifiable *here*: the build path constructs relief when a facade is present and is
byte-identical when it is not (tests + offline sweep); the milestone successor exists, quotes baselines,
reports both arithmetics, repros byte-identically; the docs land; `npm test` green. The live texture
verdict — *does the gap close at the glance* — is produced by the documented operator runbook, because
it requires the epic's singular judge runs and headless GL that cannot be faithfully reproduced in this
session. That honesty IS the deliverable the ticket's third AC demands.

## Risks

- **Merge byte-drift on facade-less builds.** Mitigation: the empty-plan path must return the *same*
  artifact object (not a rebuilt-but-equal one) — guard `if (!plan?.length) return realizeProgram(...)`
  unchanged, and a byte-identity test over cottage/barn/fixture artifacts.
- **Loop/geometry double-application.** Each rebuild re-realizes from the program and re-applies the
  plan from scratch (idempotent per round — articulation reads the freshly-realized skin, not an
  already-relieved occupancy). Verified by an idempotence test (apply twice ⇒ same).
- **Operator runbook rot.** Mitigation: exact commands + the retired-pin list template in
  `progress.md`, cross-checked against `pattern-book`/`multi-angle-gate`/milestone flags.
