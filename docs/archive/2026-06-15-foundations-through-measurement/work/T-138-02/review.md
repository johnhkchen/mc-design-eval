# Review — story S-138 (proportion milestone), tickets T-138-01 + T-138-02

E-33's terminal story, delivered across two tickets because **T-138-01's session ended at the
monthly usage limit** mid-step-8. This review covers both halves honestly: T-138-01's landed
work cited by commit, the interruption named, T-138-02's resumption with its full verification
ledger.

## What changed

### T-138-01 (the interrupted half — commits `e5b721f` … `f2e0553`)
- Code, all unit-proven: `roofIdiomForPitch` (`e5b721f`), geometry-lever steep re-aim +
  family-row validation (`6e13297`), measured-seam steep re-aim (`c747539`), workshop hands —
  source/sketch/re-recognize (`e5314d0`), pattern-book measured+armed stage-3 seed
  (`28f3dab`), proportion-milestone composer + npm scripts (`246ae49`).
- Runs: baselines banked + saltcrag measured record (`0501118`); **barn (rustic)** through the
  loop — levers `eaveHeight:12`/`depth:26` AIMED and ACCEPTED, ratios into tolerance, gate 4/4
  same-object 8 minor (`5db9a86`); **barn--saltcrag** likewise (`f2e0553`).
- Interrupted before: the cottage run, the milestone compose, witness checks, docs, review.
  Residue inherited by T-138-02: a half-re-seeded `workshop/cottage/program.json`
  (modified-uncommitted) and four uncommitted barn workshop frames.

### T-138-02 (this ticket — four commits)
- `487fe2e` **cottage through the loop**: working-tree seed discarded UNADOPTED, chain
  regenerated it deterministically (`--ticket T-138-02 --rotate-pins`); workshop
  budget-exhausted 6/6, final proportion check FAIL (honest); first cottage pattern-book gate
  run — 4/4 views judged (T-137's 0/4→4/4 lift consumed), 2 same-object + 2 drifted, both
  arithmetics (identity 2/4; budget 11/2 FAIL); 12 files, all pins pin-guard-rotated, retired
  pins quoted in `proportion-baselines.json`.
- `1a3d3af` **milestone composed**: `proportion-milestone.{json,md}` (repro byte-identical),
  head-to-head + `pattern-book-milestone.md` re-composed via `--rotate-pins`, four barn frames
  committed as T-138-01 run evidence.
- `e0d000d` **test-only fixture fix**: the T-137 monotone tests pinned the LIVE
  cottage-patternbook record as their flip witness; this ticket's sanctioned rotation retired
  it. The retired record (sha `f5567754…` — the exact pin quoted in baselines) is pinned
  verbatim at `src/view/fixtures/cottage-patternbook.t127-retired.json`; the flip proof reads
  the fixture, the monotone sweep keeps reading live records. **The only source-tree change in
  this ticket, and it is test-only.**
- `5db9706` **docs**: design-learnings "Measured proportion loop (E-33)" + E-12 handoff; both
  tickets' RDSPI work dirs committed.

## The findings (what the milestone actually measured)

1. **Measured beats estimated** where estimation guessed worst: cottage seed Δrel 0.59→0.096
   on ridge:eave (T-133's numbers, quoted in the milestone).
2. **Eyes-to-hands closed on the barns' first live run**: critique aimed the levers, the cage
   accepted, ratios landed in tolerance; proportion-flavored gaps 4→1 (survivor: rustic's
   class-1 pitch ceiling — pack data).
3. **The steep door is real and unused**: unit-proven both directions; both sketches
   TRELLIS-flattened ≤45°, so no run demanded it. Honest either way.
4. **The cottage headline — the loop hill-climbed a bent ruler**: the realized plinth band
   (y3–4, 1–2 blocks wider than the walls) latched `eaveWidthFrac 0.98`'s eave detection
   (recorded 5.5/0.8182 vs corrected ≈1.7/0.45 vs targets 1.4145/0.293), inverting the
   gradient: the model aimed the CORRECT wall-raise in 5/6 rounds (refused by the rustic
   storeyHeight band + schema storeys≤4), and the one accepted move was the wrong-direction
   `storeys:3`. The judge's two drifted views independently name the same roof-heaviness, so
   the residual is part-real, part-instrument. Diagnosed from artifact extents, flagged with
   the owning fix named (eave detection must ignore sub-wall skirt bands), NOT repaired —
   re-shaping `proportionRatios` mid-milestone would re-derive conformance under every
   committed replay.

## Verification ledger (every claim exit-coded at HEAD)

- Chains: `patternbook:repro` + `:offline` — cottage/barn byte-identical; saltcrag sweep
  byte-identical. **The T-138-01 step-5 KNOWN-RED seed window is closed for all three.**
- Gates: cottage/barn/barn--saltcrag `--offline` all green ("kit-aware consistent; visibility
  consistent").
- Milestone: `milestone:proportion:repro` byte-identical. Baselines NEVER re-banked.
- `npm test` 2009/2009 (after `e0d000d`).
- Pin-guard: every rotation explicit; zero preflight disagreements; no per-building constants
  added (the only code change is a test fixture; runner self-greps recorded "grep clean").

## Open concerns — for the reviewer

1. **The ≤2 gap-budget recalibration (E-33 Rule 3, REVIEWER'S DECISION)**: barns read 4/4
   same-object all-minor yet FAIL 8/2; cottage 2/4 with 11/2. Both arithmetics sit beside
   every verdict in the milestone record; three epics' data now say the two arithmetics
   disagree. Decide or re-scope; nothing here decided it.
2. **The plinth-eave instrument defect** (finding 4): needs an owning ticket. Until then the
   armed proportion check actively misleads the loop on any build with a wider skirt band.
3. **Retired-pin tripwires now fail three witness/record families** (all FAIL-not-SKIP, all
   provenance-proven at a `caf0d13` baseline worktree — barn legs pre-existing from
   T-138-01's rotations, which died before its step 9 ever ran these checks; cottage legs
   joined after this ticket's sanctioned rotation):
   - `proportion:repro` exit 1 — the witness's `replayLedger` never passes the pack;
     geometry-bearing ledgers (new in E-33) throw.
   - `visibility:repro` exit 1 — `DIVERGES` on the three rotated patternbook gate records;
     the SKIP guard covers artifact pins only.
   - `measured:repro/:offline` exit 1 — all three measured records' `ratios.before` read the
     live workshop programs, which the re-runs rotated.
   The expected behavior ("named SKIPs") exists only on the artifact-pin path
   (gatehouse-current shows it). These records/witnesses are T-133/T-134/T-137 authorities —
   refreshing them is a pin rotation needing an owning ticket; this ticket recorded, proved
   provenance, and touched neither code nor pins. None are in `npm test`.
4. **The cottage chain record carries `ticket: T-138-02`** while the barns carry T-138-01 —
   deliberate (the record names the authority that ran it; the interruption is story-visible).
5. **Sibling-session interactions, observed not repaired**: T-136's untracked
   `benchmarks/sculpture/levers/*` records now reference a retired cottage seed sha
   (input-ref drift of the recorded kind; their replay runs off their own ledger).
   Stray untracked files not mine: `challenge/cottage/{component-plan,reconstructed-artifact}
   .json` (note: `visibility:repro`'s cottage-challenge leg reads them — it diverges in a
   clean worktree), `generated/barn/HEIF Image.heic`.
6. **Tolerance 0.15 is uncalibrated** and the program-level vs occupancy-level ratio lenses
   can disagree by 3× (the cottage proves it); any future gate work must name its lens.

## Test coverage

No production code changed in T-138-02, so coverage is unchanged structurally: 2009 passing
(T-138-01 added G3b/G3c/G3d, MP14, seed/workshop suites — all green). The new committed
records are covered by the runners' own repro/offline modes (exit-coded above), which is this
repo's integration-test idiom. Gap: the three retired-pin tripwire families (concern 3) have
no owning regression test for their SKIP-vs-FAIL semantics — that belongs to whichever ticket
owns the fix.

## AC ledger (T-138-02)

- AC1 cottage loop — **met** (chain-regenerated seed, levers+gate armed every round, 4/4
  judged via visibility-aware census, T-114 bounds honored — zero re-asks needed, pins rotated
  + retired named). The loop's outcome is an honest FAIL, which the AC never promised away.
- AC2 milestone compose — **met** (3 subjects, pre-rotation baselines, before/after ratios,
  both arithmetics, ≤2 flagged not decided, repro byte-identical, compare rotated;
  witness-degradation checks RUN — outcome was FAIL-not-SKIP, recorded verbatim, concern 3).
- AC3 sheets + evidence — **met** (glance page with concept-beside-sheet ×3, ratio deltas on
  residuals, ledgers cited; barn frames + cottage frames + cottage gate sheet committed).
- AC4 design-learnings + S-138 review — **met** (this document; the interruption named).
- AC5 replay green on chains and gates, no per-building constants, `npm test` green — **met**
  as written (chains ✓ gates ✓ tests ✓); the adjacent measured/witness records fail on
  retired pins (concern 3, pre-existing class, named not hidden).
