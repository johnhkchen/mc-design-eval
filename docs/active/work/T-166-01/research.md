# T-166-01 — Research

**Ticket:** bakeoff-and-wrong-style-clean-fixture (Story S-166, Epic E-39). The referee. Two falsifiable
claims, measured honestly. Descriptive map of what exists and how it connects — no solutions here.

## The two claims (restated from the ticket)

1. **Split beats fused.** On a fixed set of (concept, build) states, the split path (diagnose→route)
   dispatches to the *worst defect's correct department* more often than the fused `WorkshopReply`.
   *Fails if* split ties/loses → collapse the split, report.
2. **Within-family gradient exists.** A **clean** build scored against a same-family **wrong-style**
   concept scores far below the same build against its **matched-style** concept — a spread outside the
   eval's noise, where the E-38 probe (on a *defective* build) left it flat at 22–32. *Fails if* it stays
   flat (the per-style `expected` is cosmetic; blindness is in the model's reading) → deeper-measurement
   epic; or no build is clean enough → name the clean-build prerequisite.

## The split path (what we measure) — already built, kept runnable

- **Layer A — `DiagnoseBuild` → `Critique`.** `src/workshop/diagnose.mjs::diagnoseRenderArgs({program,
  pack, azimuths})` serializes the typed string inputs; the BAML template (`baml_src/department.baml`)
  renders the prose around `[concept, ...renders]`. Output: `Critique{ items: [{department, expected,
  present, missing, severity}] }`. **Per-style** via `styleProfileBlock({pack})` (T-165): it emits the
  expected ROOF/WALL/OPENING grammar (materials + idioms bucketed by `departmentOf`) for the pack's style.
  `style = program.style ?? pack.style`.
- **Layer B — `RouteCritique` → `Dispatch`.** `src/workshop/route.mjs`: `routeRenderArgs({critique})` →
  the router prompt; `resolveDispatch(parsed)` is the **membership gate** (throws on empty / unknown
  department / idiom-outside-department / empty why). `dispatchToVerdict` makes `resolved[0]` the **worst**
  routed item. Style-agnostic.
- **Live invocation pattern** (the witness precedent): `benchmarks/sculpture/diagnose-smoke.mjs` and
  `route-smoke.mjs` — `bamlRender({fn, args, images})` → `runTieredOp({tier:"strong", prompt, images})` →
  `bamlParse({fn, text})`. **One call, no re-ask** (spend-limit caution; a zero-token notice reply burns
  budget). NOT in `npm test` (metered, non-deterministic); their *output* is committed evidence.

## The fused path (the baseline) — the default, byte-identical

- `src/workshop/critique.mjs::critiqueRenderArgs(...)` → BAML `CritiqueWorkshopRound`; `parseWorkshopReply`
  → `{critique:{issues:[{region, issue, severity}]}, decision, action?, rationale}`. The fused reply names
  issues with a **free-text `region`** (not a typed department) and picks one **action lever**
  (adjust-params / spray-paint / re-recognize). **No `style_profile`** — this is the E-38-equivalent
  baseline (asks "is this a tidy build", style-blind).
- Selected in the loop by the **absence** of `--split` (T-164-02). `splitExchange` is behind `--split`.
  Both paths kept runnable *for this bake-off*.

## The asymmetry that the bake-off must adapt around

The split path emits a **typed `department`** by construction; the fused path emits a **free-text region**
+ an action. To score "routed to the worst defect's department" on a common axis, the fused output needs a
`region`-text → department **adapter** (keyword map onto `DEPARTMENTS = [CHIMNEY, OPENING, ROOF, ROOM,
WALL]`). That adapter is **lossy** and that is itself part of the finding — the typing is part of *why*
split may win. It must be reported, not hidden.

## The E-38 probe (what we build on)

`experiments/eval-alignment/wrong-style-probe.mjs`: held a clean gatehouse render FIXED, varied only the
concept, replicated the **scalar defect-eval prompt verbatim** (`defect-eval.mjs`), 3 votes. Result
(`results/wrong-style-probe.json`): matched gatehouse vs same-family (barn/cottage/church) all **22–32**,
inside the ±12 per-call noise — **identity-blind**. Absurd (koi/pineapple) *did* crater (not category-
blind). The confound it named: the build under test was itself defective, masking style. **The missing
asset is a clean build × a same-family *wrong-style* concept under the *per-style* judge.**

## Assets on disk (inspected)

- **Clean build:** `builds/gatehouse/new-roof/view-{+x+z,+x-z,-x-z,-x+z}.png` — a recognizable stone
  gatehouse, brown gable roof, stone walls, arched gate. The E-38 "clean" build (climbed to q≈34). **No
  recognized `program.json`** (only barn/cottage/barn--saltcrag/fixture have one under
  `benchmarks/sculpture/workshop/<key>/program.json`). `final-artifact.json` exists for barn/cottage, not
  gatehouse — but the **renders already exist**, so DiagnoseBuild needs only a *program* object (for
  `programBlock`), which can be a fixed minimal stand-in held constant across conditions.
- **Matched concept (rustic):** `runs/015-…gatehouse…/concept.png` — stone gatehouse, peaked gable, arched
  gate. Matches the clean build.
- **Wrong-style concept (classical):** `benchmarks/temple-facade/concepts/arc-A-flash.png` — round arch,
  dressed ashlar, cornice (the T-165-02-named guildhall-grammar stand-in). **Confounds:** it is a
  freestanding monument (not house-scale) with an exotic orange/blue/gold palette — more than *just* wrong
  style. Triangulate with a second building-shaped non-rustic concept (e.g. `chapelle-A`/`mausoleum-A`) to
  separate "wrong style" from "wrong everything". A bespoke house-scale guildhall concept is an outward
  image-gen call (named as the clean follow-up, not fired unprompted — T-165-02 set that restraint).
- **Roofless state:** `builds/gatehouse/baseline/view-+x+z.png` — stone box, **no roof**, plus a wall hole
  → unambiguous **ROOF** worst-defect ground-truth for a claim-1 state.
- **Packs:** `packs/{rustic,guildhall,saltcrag}.json`. `guildhall` (T-165-02) is the genuinely-different
  classical style (pilaster/quoin/plinth + arch; no timber-frame/flat-head). `styleProfileBlock` produces
  concretely different ROOF/WALL/OPENING grammar for rustic vs guildhall (DG7 proves it deterministically).

## Claim-1 candidate states (need real recognized programs)

Only barn / cottage / barn--saltcrag have `program.json`; gatehouse can take a fixed synthetic program.
States with a **glaring, department-typed** worst defect (to be confirmed by render inspection in Implement):
- gatehouse/baseline vs gatehouse concept → **ROOF** (no roof). (synthetic program)
- barn early round vs barn concept → ROOF / WALL (the T-164-02 barn was "roofless, holey-walled").
- cottage early round vs cottage concept → ROOF or WALL.
- barn--saltcrag round-0 vs barn concept → WALL (the "-37 sparse-shell colonnade", envelope gap).

The ground-truth label is an analyst call on **unambiguous** worst defects only; ambiguous states are
excluded (and that exclusion is logged — no silent cap).

## Constraints

- **Frozen instrument untouched.** This is the *creation* loop. No edits to the scalar judge / gate /
  transport-guard TG4. New code lives under `experiments/eval-alignment/` (the harness) + one pure tested
  module under `src/workshop/` (the scoring). `npm test` stays green.
- **Spend caution.** One call per condition, no re-ask. Votes kept low. Small fixed state set. Re-runnable
  at larger scale, but the committed numbers come from a modest, honestly-sized sample.
- **Anti-hedge.** The embarrassing outcomes (split loses / fixture doesn't crater / no clean build) are the
  *most* valuable. Lead with how each claim fails; report whichever way it lands.
</content>
</invoke>
