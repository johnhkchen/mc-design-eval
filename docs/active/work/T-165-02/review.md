# T-165-02 — Review

**Ticket:** second-genuinely-different-style (Story S-165, Epic E-39). Handoff for a human reviewer. Supply
a **second, non-rustic** style as a Layer-A `expected` profile whose roof/wall/opening expectations differ
in *grammar*, not just block choice — the breadth gate the whole epic leans on — and record honestly where
the grammar vocabulary stops.

## What changed

A second style, **`guildhall`** — a polite/classical dressed-ashlar town building — is now available to
Layer A's per-style `expected` mechanism (the `styleProfileBlock` T-165-01 built). It is **not** a third
rustic-family reskin: it differs from rustic and saltcrag at the **idiom** level — a `pilaster`+`quoin`
classical order and `arch` (round-arched) openings, vs the vernacular `timber-frame` + `head.flat` both
existing styles lean on. A rustic build critiqued under guildhall therefore reads as wrong-*style* (missing
the classical order, presenting the timber frame the classical style forbids), not "wrong colour".

The honest boundary is recorded in full: the **roof-form** axis cannot go orthogonal to "pitched" because
every roof idiom in the registry is a pitched roof — that gap is the finding, scoped to a generator epic.

### Files created
- `packs/guildhall.json` — the `style-pack/v1` second style. Passes `loadStylePack` (schema + all six
  semantic checks). All idioms are **real registry idioms** (`roof.hip`, `pilaster`, `quoin`, `plinth`,
  `course.slab`, `eave-overhang`, `arch`, `opening-dressing`, `chimney`, `hollow`, `floorplan`,
  `surface.roof-courses`); all `valueCheck` Lab triples derived from the committed block-Lab table; **no**
  `ratification` (an unratified eval-only `expected` profile, like rustic predates the formation chain).
- `docs/active/work/T-165-02/FINDINGS.md` — the AC3 honest record: the WALL+OPENING success, the ROOF-form
  ceiling, the scoped generator epic, the S-166 deferrals.
- `docs/active/work/T-165-02/{research,design,structure,plan,progress,review}.md` — RDSPI artifacts.

### Files modified
- `src/workshop/diagnose.test.mjs` — loads `guildhall`; adds **DG7**, the deterministic wrong-style fixture.

### Files NOT changed (deliberately)
- **No production `.mjs`.** The T-165-01 mechanism (`styleProfileBlock`/`diagnoseRenderArgs`) already
  consumes any validated pack; this ticket is *data + a pin + the finding*.
- The frozen scalar instrument, `baml_src/department.baml`, the diagnose golden (FX-DB1, barn+rustic), the
  recognition prompt (FX-R1), the fused path — all untouched.

## Acceptance criteria — status

- [x] **A second style as an `expected` profile whose roof/wall/opening differ in *grammar*; a concept to
  test against.** `guildhall` differs at the idiom level on **WALL** (`pilaster`/`quoin` vs `timber-frame`)
  and **OPENING** (`arch` vs `head.flat`) — genuine construction grammar, fixture-asserted (DG7), not a
  recolor. ROOF differs on idiom (`roof.hip`), pitch (shallow `[0.5,1]`) and material (lead-grey stone) but
  remains pitched — the registry ceiling, recorded. **Concept:** an existing stand-in with matching grammar
  is referenced (`benchmarks/temple-facade/concepts/arc-A-flash.png` — dressed stone + round arch); a
  house-scale matched render is S-166's bake-off asset (S-166 AC2 owns "renders beside both concepts") and
  a metered image-gen call not fired unprompted — named in FINDINGS, not silently dropped.
- [x] **Fixture: a rustic build critiqued under the second style produces wrong-style `missing`/`present`
  items (not just "wrong colour").** DG7: the same synthetic rustic barn `PROGRAM` under guildhall's
  `expected` is **missing** pilaster/quoin/arch/dressed-ashlar and **presents** `timber-frame` + flat-head
  the classical style forbids. Both directions asserted; deterministic; selection flows from the declared
  style.
- [x] **Recorded honestly: if the second style can't be expressed beyond rustic idioms, say so and scope
  the generator epic.** FINDINGS.md: WALL+OPENING **can** be expressed (the claim succeeds there);
  ROOF-form **cannot** (every roof idiom is pitched) → the scoped generator epic (new `roof.flat`/
  `roof.parapet`/`roof.mansard`/`roof.dome`/deep-eave idioms). The negative half is led with, not hidden.
- [x] **`npm test` green; frozen instrument untouched.** 2216/2216 (2215 + DG7). No production-code change,
  so FX-DB1/FX-R1/replay/offline pins are byte-identical by construction (nothing on their path moved); the
  frozen scalar instrument carries no pack/BAML dependency.

## Falsifiable-claim assessment (anti-hedge)

The claim — "a non-rustic style profile makes Layer A describe a materially different `expected`" — **lands
as a split, and both halves are reported with calibrated honesty:**

- **Succeeds (WALL + OPENING):** guildhall's expected names a classical order (`pilaster`/`quoin`) and round
  arches (`arch`) that neither rustic nor saltcrag carries, and drops the `timber-frame`/`head.flat` both
  vernacular styles use. This is a genuine second *language* — vernacular framing vs the classical order,
  an art-historical family boundary — surfaced as distinct idioms, **not** a reskin. DG7 proves it offline.
- **Capped (ROOF form — the finding):** the registry's roof idioms are *all* pitched, so the most legible
  style signal can't go orthogonal. The named failure mode of the claim **did** partially fire on this axis,
  and per the ticket that **is** the finding, not a failure to hide — routed to a generator epic.

No inflation ("a whole new style family, milestone!") and no false brutality ("the registry can't do a
second style"). The within-family blindness can be disproven on two of three axes today; the third is
scoped.

## Test coverage & gaps

- **Covered (in `npm test`):** DG7 — the pack loads (fail-loud schema + semantic validation exercised
  inside the test) and the same build yields genuinely different (idiom-level) `expected` under guildhall
  vs rustic, and vs saltcrag; suite selection by declared style; self-grep discipline; determinism. DG1–DG6
  and the rest of the suite remain green (no regression, no pin moved).
- **Gaps / not automated (named, mirrors T-165-01):**
  1. **The live `expected`-prose diff** (`diagnose:smoke`) was not run — a metered call; the smoke does not
     yet expose `--pack guildhall`. The deterministic DG7 profile-diff is the provable witness here.
  2. **S-166's clean×wrong-style crater** (does the model's emitted critique actually tank?) and the
     **house-scale matched concept render** are S-166's referee, deferred and named in FINDINGS.
  3. **No *built* guildhall.** This is a Layer-A `expected` profile, not a realized build; the build path
     would need the workshop/seed to route a build to this style (and, for a non-pitched roof, the generator
     epic). Out of scope for the breadth gate.

## Open concerns / for the next ticket (S-166)

1. **The roof-form ceiling is the next gate.** If S-166 (or a later epic) wants a style that reads as
   *instantly* non-European-vernacular (flat Mediterranean, pagoda, domed), the generator epic in FINDINGS
   (new non-pitched roof idioms) is the prerequisite — not another pack.
2. **`diagnose:smoke --pack` is unwired.** S-166's bake-off harness is the natural home for a multi-pack
   live witness; flag it there.
3. **guildhall is unratified.** It is an eval-only `expected` profile; if it ever becomes a *built* style,
   it needs the human taste gate's `ratification` receipt (the formation chain stamps it at ratify time).

## Risk

Low and contained. Additive: one new pack file + one new test + docs; **zero** production-code surface. The
only regression path is a bad `valueCheck` snapshot → `loadStylePack` throws loudly in DG7, caught before
commit (it did not). Rollback = delete the three new files + DG7; the mechanism is inert without a pack
passed to it.
</content>
