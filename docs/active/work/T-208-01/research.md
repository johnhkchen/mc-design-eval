# T-208-01 Research — the score-0 cold-start trap in the detail accept-gate

**Ticket:** detail-credit-score-zero-cold-start-accept-gate (S-208, E-53). **CONTINGENT** on T-207's finding:
real work only if the metered re-climb still **stalls at score 0 on a genuinely-closed form**; a no-op if
T-207 reaches the picture. This artifact maps the mechanism (descriptive, no fix) and records T-207's
in-flight evidence so the contingency can be resolved at Implement.

## 1. T-207 in-flight state (the gating evidence, as of 2026-06-18 00:07)

T-207's metered climb (PID 1612, `CLIMB_MAX_ROUNDS=8`) is **still running** — not yet terminal. `climb.log`
so far:

```
[round 0] score=0 (0/0/0) closure=0.608 → agent picks close_shell  ← T-206 fix LIVE: seed reads OPEN
  [close_shell] CLOSED: closure 0.608 → 1.000 (ring 102, cov 0.69)
[round 1] close_shell: 0→0 (0/0/0) — KEPT (closure +0.392 form-credit)  ← form closed & KEPT
           next: apply_gable_roof   ← detail/roof phase begins on a CLOSED shell at score 0
```

Two facts are already established and decisive for this ticket's premise:
- **The T-206 form fix works live.** The seed reads `closure=0.608` (OPEN colonnade), not the bogus 0.980
  T-205 saw. `close_shell` fires first (agent-chosen), closes to **1.000**, and is **KEPT** by the form-credit
  clause — exactly the path T-205 never reached.
- **A genuinely-closed shell still scores 0** (`0/0/0`). This is the cold-start setup the ticket predicts:
  the picture scalar is saturated at the floor even though the form is now closed.

What is **not yet known** (needs T-207 terminal): whether the following detail rounds (gable, recolor, relief,
rebuild_arch, band_eave) **compound off 0 and reach the picture** (→ this ticket is a **no-op**) or **each ties
at 0 and rolls back** (→ this ticket is **real work**). Implement must re-read T-207's `trajectory.json` /
`climb.log` before choosing the branch. The mechanism mapped below is what would trap a stall **if** it occurs.

## 2. The accept-gate — `src/workshop/climb-gate.mjs` `acceptsRound` (lines 267–312)

PURE (no GL/LLM/I/O), unit-tested in `test/workshop/climb-gate.test.mjs`. For a **detail** move
(`isFormMove=false` — relief_walls, rebuild_arch, band_eave, articulate_walls, apply_gable_roof, recolor_roof,
frame_arch, add_timber_framing) the decision path is, in order:

1. `delta >= margin` (margin=4) → **accept**. At the cold start `before.score=after.score=0` → `delta=0` → no.
2. `departmentDominant(...)` → accept iff a **targeted dept's major count fell** (`beforeDeptMajors[d] >
   afterDeptMajors[d]`), no new targeted major, no targeted net-burden growth. At the cold start the judge
   **keeps all majors** (`deptMajorsBefore == deptMajorsAfter`, the T-205 trajectory signature) → no clear → `null`.
3. `formCredit(...)` → **inert for detail moves**: guard (2) `closureBefore >= formReadyThreshold` returns
   `null` once the shell is closed (closure ≥ 0.9). So a closed-form detail move gets no form credit.
4. `delta <= -margin` → regression reject. `delta=0`, not ≤ −4 → no.
5. **tie zone**: accept iff `wrongStyleBreadth` shrank OR whole-build `nMajor` shrank. At the cold start both
   are flat → neither shrank → **`tie (0): no shrink` → ROLLBACK** (line 311).

**This is the trap.** Every detail move at the score-0 floor lands on branch 5 and rolls back. The greedy
per-move gate can never let a single hand escape 0 — even though *compounding* several (pale field + wide arch
+ slate roof + relief) would move the judge off 0. The form moves escaped this only because `formCredit` gave
them a deterministic structural gradient (closure) the picture scalar lacked; **detail moves have no analog.**

## 3. Why the form fix (E-49/T-199/T-206) does NOT cover detail

`formCredit` (lines 222–238) and the `isFormMove` routing (lines 286–293) credit a move on **`eaveRingClosure`**
— a deterministic structural scalar — when the picture vote is unreliable. But it is gated to **form moves with
a form gap open** (`closureBefore < 0.9`). Once the shell is closed, `formCredit` is inert and **detail moves
fall through to the noisy picture path** (branches 1/4/5 above). The picture scalar's documented **0–76
same-seed swing** (T-187), saturated at its **0 floor** on a far-from-picture build, gives detail moves no
gradient. That is the precise, code-confirmed shape of "the picture-scalar-reliability problem for detail
moves" the ticket names. The form fix solved the analog for form only.

## 4. The runner loop — `experiments/eval-alignment/picture-climb.mjs` (lines 711–798)

Out of `npm test` (metered). Per round:
- **form-readiness eligibility** (`formReadyGate`, lines 718–731): a detail tool is blocked with no spend until
  closure ≥ 0.9. Post-`close_shell` this passes (closure 1.000).
- **no-op guard** (`buildDigest`, 738–750): a byte-identical re-pick is rolled back with no spend.
- **score candidate** (`scoreBuild`, 752–753): renders 4 azimuths + beside, VOTES=3 median strong-tier
  `DiagnoseBuild`. **This is the only spend** and the only score source.
- **gate** (760–793): builds `deptMajor`/`deptItem` maps + `closureAfter`, calls `acceptsRound`. On
  `gate.accept` it commits `occ = cand` and `prevDigest = candDigest`; **otherwise `occ` is unchanged** — the
  candidate is discarded (the implicit rollback: `prev` and `occ` simply stay). `prev = gate.accept ? candScore
  : prev`.

**Snapshot/rollback is trivially available**: the runner never mutates `occ` until accept, and each tool is a
pure `occ → occ'` transform (`TOOLS[pick.tool](occ)`). A batch could stack `occ₀ → occ₁ → … → occ_N` purely,
score only `occ_N`, and commit or discard the whole chain — no new snapshot machinery needed.

## 5. The tools (the "detail hands" that would compound)

`TOOLS` map (picture-climb.mjs ~line 200–430) + `TOOL_DEPARTMENTS`/`TOOL_STAGE` (climb-gate.mjs 31–88). Detail
(form-ready-gated) hands, each a pure `occ → occ'` targeting one department:
- **WALL:** `relief_walls` (proud quoins/plinth + pale field — construction, T-195), `articulate_walls`
  (recolor field pale, keep quoins), `add_timber_framing`.
- **OPENING:** `rebuild_arch` (wide voussoir gate, T-203; self-reverts on coherence refute),
  `frame_arch` (frame the 1-wide slot).
- **ROOF:** `apply_gable_roof` (steep gable form), `recolor_roof` (slate material), `band_eave` (lighter
  eave/verge band — a MINOR).
These are the moves that "compounding several would read better" refers to: together they are the pale dressed
gatehouse with a wide arch and dark slate roof; individually, none clears a major or beats 0.

## 6. Structural signals already computed (candidates for a fallback)

The runner already derives deterministic structural facts the gate could consult when the scalar saturates:
- **`eaveRingClosure(occ, …)`** (wall-generate.mjs) — perimeter occupancy; the form-credit signal. Blind to
  detail dressing (T-206 made it ignore proud relief), so **not** a detail discriminator by itself.
- **`deptMajorCounts` / `deptItemCounts`** (climb-gate.mjs 127–154) — per-department major/minor burden from
  the *critique items*. These DO move when the judge sees a change, but at the cold start they are flat.
- **build occupancy** — block-id census per cell is available (`occToCells`, `buildDigest`); a structural
  "is the pale field / wide arch / slate roof PRESENT" predicate could be computed GL-free from `occ` + the
  recognition program, analogous to how closure is computed. Not currently computed for detail.

The **rubber-stamp risk** the ticket flags lives here: any detail placement adds cells, so "added cells" is too
weak a signal — it would accept a deliberately-bad compound. A trustworthy fallback must measure *the right
structure toward the concept* (or re-use the picture judge over the compound, where a bad batch scores ≤ the
pre-batch build and is rejected).

## 7. Test & invariant boundaries

- **Pure decisions are unit-tested**: `test/workshop/climb-gate.test.mjs` (CG/CG-FC/WG suites) covers
  `acceptsRound`, `departmentDominant`, `formCredit`, `formReadyGate`. A new batch/structural decision belongs
  here, with a **deliberately-bad-compound** case (AC: must reject a worse batch).
- **The runner is not in `npm test`** (metered). The live re-climb is the evidence, not a unit test (same
  rationale as T-205/T-207 reviews).
- **Frozen instrument**: `measurements/` must stay byte-clean before+after. Subscription shim only
  (`ANTHROPIC_API_KEY` unset). The T-198 subprocess-timeout guard + `RoundAbortedError` bound the spend.
- **`CLIMB_DEFAULTS` is frozen** and never asserted in tests; a new knob (e.g. batch size) follows the
  `CLIMB_MAX_ROUNDS` precedent (env-read, default-preserving).

## 8. Constraints & assumptions carried into Design

- The escape must be **PURE where the decision lives** (climb-gate.mjs) and **gated to the failure state** so
  it is a **no-op when the climb is healthy** (anti-hedge: do not perturb a succeeding climb; precedent —
  fieldResolution gated on the failure state, T-117).
- It must **reject a deliberately-bad compound** (the falsification, AC) — the rubber-stamp guard is
  non-negotiable.
- The live "leaves 0 / reaches the picture" proof is **metered + gated on T-207**; it cannot be fabricated.
  Implement reads T-207's terminal trajectory first and branches (no-op vs build).
- Snapshot/rollback needs no new machinery: tools are pure `occ → occ'`; a batch is a pure chain scored once.
