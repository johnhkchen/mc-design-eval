# Review — story S-143 (straight-ruler re-verdict), tickets T-143-01 + T-143-02

E-34's terminal story, delivered across two tickets because **T-143-01's session died at the
cottage's round-1 model exchange** (~11:14am 2026-06-12; the round-1 renders re-wrote
byte-identically at 11:12:44, then the shims exited with nothing produced — the same interruption
class as T-138-01 and T-138-02). This review covers both halves honestly: T-143-01's landed barns
cited by commit, the interruption named, T-143-02's resumption with its full verification ledger.

The story's question: with the E-34 instrument fixes landed (T-139 straight ruler, T-140 named lens
+ concept-precedence pitch, T-141 rustic headroom, T-142 witnesses, T-144 v2 budget), does each
subject's E-33 residual collapse to real-only, or was it instrument?

## What changed

### T-143-01 (the interrupted half — commits `5d0743e`, `979d8b7`) — CITED, not re-run
- **barn (rustic)** (`5d0743e`): 4/6 rounds, conformance PASS, judge **4/4 same-object / 8 minor /
  0 major → v2 PASS — the project's first recorded composite pass** (legacy FAIL 8/2 beside;
  kit-aware PASS). The wall-raise levers (`eaveHeight`, `depth`) aimed and accepted; witnesses
  proportion + visibility went SKIP-named → GREEN through the rotations (rotation-proof bar met);
  pitch stayed class 1 (recorded, not forced — seed reproduced byte-identical).
- **barn (saltcrag)** (`979d8b7`): 2/6 rounds, judge **4/4 same-object / 8 minor → resemblance v2
  PASS**; **kit-aware FAIL on 5 of 3,337 band0 cobblestone cells** (0.15% dressing residue,
  tolerance 0; singular judge honored, NOT re-rolled — carried as a concern below).
- Interrupted before: the cottage run, the milestone recompose, the witness checks, docs, review —
  all inherited by T-143-02.

### T-143-02 (this ticket — three commits)
- `0e35272` **cottage through the loop**: chain-regenerated seed (byte-identical, confirmed via
  `--repro` before spending), live workshop 6/6 budget-exhausted, conformance FAIL on roofShare
  only; live gate (singular, one run per view) — **coverage REJECT on all 4 views**, resemblance
  judge not called; kit-aware FAIL. Proportion + visibility witnesses rotated; all `--repro`
  byte-identical. 14 files, pins pin-guard-rotated, `--ticket T-143-02`.
- `ce7034c` **milestone recomposed**: 3 subjects (2 barns cited from T-143-01 commits, cottage
  fresh); `milestone:proportion:repro` DIVERGES → byte-identical; head-to-head + glance page
  recomposed; baselines never re-banked.
- `b903216` **docs**: design-learnings "Straight ruler (E-34)" section + E-12 handoff; the RDSPI
  work dir. `npm test` 2033/2033.

**No production `.mjs` changed in either ticket** — S-143 is a measurement run on an instrument
proven upstream (T-139…T-144). Unlike T-138-02, no test-fixture preservation was needed (the cottage
gate record is not pinned as a unit-test flip witness this cycle).

## The findings (what the re-verdict actually measured)

1. **The barns recorded the pass the glance gave them.** v2's identity-first arithmetic (minors≤10)
   turned the rustic barn's 4/4 same-object / all-minor profile into the project's **first composite
   PASS**; legacy ≤2 still reads FAIL beside it. The eyes-to-hands loop closed on the first live run.
2. **The cottage straight ruler straightened ~3.5×.** Same byte-identical seed: ridgeToEave
   **5.5 → 1.55**, roofShare **0.8182 → 0.3548** (T-139 isolated — the bent reading was the
   plinth-latched eave). deltaRelFinal **0.0958** on ridge:eave. **The E-33 residual was
   substantially the instrument.**
3. **The wall-raise landed.** `storeyHeight:5` — aimed and refused 5/6 rounds in T-138-02 — now
   applies as geometry (rounds 1, 3) under T-141 headroom. The gradient is no longer inverted: the
   model aims right AND the cage accepts. **AC3 answer: the cottage proportion residual collapses to
   a real, modest roof-heaviness** (roofShare 21% over — the dark_oak_planks roof mass), not artifact.
4. **Fixing one stage surfaced the next.** The taller band0 the wall-raise produced **outran the
   component-skin dressing**: band0 stone_bricks 1135/1920 missing (59%), so the gate coverage-
   rejected all 4 views and the resemblance judge never ran. The proportion question is answered; the
   dressing must learn to re-derive against the geometry it now moves — the next stage's ticket.
5. **The rotation resolved E-33's concern 3 for free.** The three retired-pin tripwire families
   (`proportion`/`visibility`/`measured` `:repro`, exit 1 in T-138-02) all exit 0 now — the re-runs
   re-pinned the witnesses to current ledgers. No code or registry change; the sanctioned rotation
   itself was the fix.

## Verification ledger (every claim exit-coded at HEAD)

- Chains: `patternbook:repro` + `:saltcrag:repro` — cottage/barn/barn--saltcrag byte-identical (0).
- Witnesses: `proportion:repro` + `visibility:repro` byte-identical (0); `visibility:repro` SKIPs
  `gatehouse-current` (named — pre-existing artifact-pin mismatch, not S-143's). `measured:repro` (0).
- Gates: cottage/barn/barn--saltcrag `--offline` all self-consistent (cottage FAIL→kit-aware FAIL;
  barn PASS→PASS; saltcrag PASS→kit-aware FAIL).
- Milestone: `milestone:proportion:repro` byte-identical (was DIVERGES). **Baselines + retired-pins
  byte-unchanged** (`git diff --stat` empty — never re-banked).
- `npm test` 2033/2033, 0 fail.
- Pin-guard: every rotation explicit (`--rotate-pins`); no per-building constants; runner self-greps
  recorded "grep clean".
- **Rotation-proof bar:** witnesses green-or-named-SKIP before (T-143-01 `progress.md`) AND after
  (T-143-02 `progress.md` sweep table) — both recorded.

## Open concerns — for the reviewer

1. **The cottage band0 dressing collapse (finding 4)** — the headline open issue. The geometry fix
   let the wall-raise land, and the dressing did not follow, so the resemblance judge could not even
   be asked. Needs an owning ticket: component-skin must re-derive coverage against the workshop's
   geometry moves (the dressing/geometry coupling). Until then, a successful proportion move can trip
   the composite gate on coverage.
2. **The saltcrag band0 kit-presence FAIL (5/3337 cells)** — carried from T-143-01. Resemblance is a
   clean v2 PASS; the composite verdict trips a marginal 0.15% band0 residue (tolerance 0,
   fast-convergence trajectory). Same residue family as concern 1, at small scale. Singular judge
   honored. Decide tolerance or accept as recorded.
3. **The ≤2 gap budget vs v2 identity arithmetic (E-33/E-34 Rule 3, REVIEWER'S DECISION)** — three
   epics' data now say the two arithmetics disagree (barns 4/4 same-object yet legacy FAIL 8/2).
   E-34 *ships* v2 as the proposed resolution (the first composite PASS depends on it) with legacy
   beside every verdict; it does not unilaterally retire legacy. Decide or re-scope.
4. **Tolerance 0.15 uncalibrated** — nothing yet ties the proportion band to what a stranger's glance
   forgives. Carried from E-33.
5. **The cottage was not resemblance-judged this run** — by design (coverage pre-gate), but it means
   the AC3 "does the residual collapse" question is answered at the *proportion* level (conformance +
   witness ratios), not at the *judge* level. Honest scope note, not a defect.

## Test coverage

No production code changed in either ticket, so structural coverage is unchanged: 2033 passing (the
instrument's units — T-139 maskProportions, T-140 ruler, T-141 levers, T-142 witness-repro, T-144
budgetVerdict — were proven in their own tickets). The new committed records are covered by the
runners' own `--repro`/`--offline` modes (exit-coded above), this repo's integration-test idiom.
**Gap:** the dressing/geometry coupling (concern 1) has no regression test — it belongs to the ticket
that owns the fix; today it is recorded honestly, not guarded.

## AC ledger (S-143, both tickets)

- **AC1 cottage through the full loop** — met (T-143-02 `0e35272`): chain-regenerated seed, levers +
  proportion gate armed every round, live judge one-run-per-view (T-114 honored, zero re-asks
  needed), decided under v2 with legacy beside, pins rotated, witnesses green-or-named-SKIP before &
  after. The outcome is an honest kit-aware FAIL (coverage), which no AC promised away.
- **AC2 milestone recompose** — met (`ce7034c`): 3 subjects (2 barns cited from commits, cottage
  fresh), baselines quoted pre-rotation, both rulers + both budget arithmetics beside every verdict,
  `--repro` byte-identical, baselines never re-banked.
- **AC3 recorded honestly** — met: the cottage residual collapses to real roof-heaviness under the
  straight ruler + headroom (5.5/0.8182 → 1.55/0.3548); sheets beside concepts in `pr/assets/`;
  residuals carry measured ratio deltas + named lenses. The dressing-coverage FAIL is recorded, not
  hidden.
- **AC4 learnings + S-143 review** — met (`b903216` + this document): design-learnings "Straight
  ruler (E-34)" + E-12 handoff; both tickets covered, the interruption named, the saltcrag band0
  concern carried.
- **AC5 replay green; no per-building constants; npm test green** — met: chains ✓ gates ✓ witnesses
  ✓ milestone ✓ `npm test` 2033/2033 ✓; the E-33 concern-3 tripwire families are now green too.
