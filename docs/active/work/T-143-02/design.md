# Design — T-143-02 straight-ruler-reverdict-resumption

The decision: **resume T-143-01's plan at Step 3**, run the cottage exactly as the barns were run,
recompose the milestone over all three subjects, write the E-34 learnings + E-12 handoff, and write
the **story-level S-143 review** that spans both tickets. No runner `.mjs` is edited — this is a
measurement run; the instrument's units are already proven upstream.

## What is decided vs. what is open

**Decided (by the epic, by T-143-01, by the ACs):** the runners to call, the flags
(`--ticket T-143-02 --rotate-pins`), the singular-judge rule, the v2-with-legacy verdict, the
rotation-proof bar, the frozen baselines. These are not re-litigated here.

**Open (the honest unknown this run resolves):** does the cottage residual collapse to real-only
under the straight ruler (T-139) + headroom (T-141)? The design must *record* whatever happens, not
steer toward a PASS.

## Option space

### A. Re-run all three subjects fresh under T-143-02
Rejected. The barns landed under T-143-01 (`5d0743e`, `979d8b7`) with full verification ledgers; the
ticket explicitly says "treat as done, do not re-run." Re-running would burn the epic's singular
judge budget a second time on already-decided subjects, rotate already-rotated pins, and contradict
AC2 ("the judge run is singular"). The barns are **cited by commit** in the milestone and review.

### B. Resume at the cottage; cite the barns; recompose + document (CHOSEN)
This is T-143-01's plan Steps 3–5 plus the S-143 review. The cottage runs once through the live loop
with the new instrument; the milestone composes the two cited barn re-verdicts + the fresh cottage;
the learnings record the straight-ruler findings across all three; the review spans both tickets.
Grounded in: the barns are genuinely done (verified, committed), the cottage seed reproduces
byte-identically (so only the trajectory/verdict change), and the milestone composer already reads
committed records (it does not need the barns re-run, only their committed records present).

### C. Skip the live cottage run; compose from the T-138-02 cottage record
Rejected. The whole point of E-34 is to re-verdict the cottage **under the new instrument**. The
T-138-02 cottage verdict was measured on the bent ruler; reusing it answers nothing. AC1 demands the
cottage "through the full loop" behind the named run. The live run is mandatory.

## Decision detail — the cottage step (Step 3)

Mirror T-143-01 Step 3 exactly, with `--ticket T-143-02`:

1. **Chain**: `node benchmarks/sculpture/pattern-book.mjs --subject cottage --ticket T-143-02
   --rotate-pins`. Watch the workshop ledger: with the eave un-latched from the plinth (T-139) and
   the wall-raise admissible (T-141, storeyHeight≤5), the model's wall-raise aims should now score as
   improvements and land — *if* the bent-ruler diagnosis was right. Either outcome is recorded.
2. **Judge**: `npm run gate:patternbook:cottage -- --rotate-pins`. One run per view, v2 + legacy.
3. **Witnesses**: `proportion-witness.mjs --subject cottage --rotate-pins`, then
   `visibility-witness.mjs --subject cottage --label patternbook --rotate-pins`.
4. **Verify**: cottage `proportion --repro` GREEN (ratios now read off the true eave, not the
   plinth — compare to the baseline's bent 5.5/0.8182 and corrected ≈1.7/0.45); `visibility --repro`
   GREEN; `patternbook --repro` byte-identical (the new ledger replays).
5. **Commit** atomically: `feat(T-143-02): cottage re-verdict — <residual collapses | persists>`.

Rationale for one-shot discipline: memory [[spend-limit-reply-failure-mode]] — zero-token notice
replies burn the re-ask budget; the haiku probe already confirmed the shim is live, so the workshop
spend is safe to start. Memory [[judge-reply-policy-seam]] — malformed ≠ verdict; bounded same-prompt
re-asks are the *only* sanctioned retry; a clean verdict is never re-rolled.

## Decision detail — milestone recompose (Step 4)

1. **Retired-pins audit**: after rotation, read the new cottage pin shas; if the cottage witness
   re-pins to the new T-143-02 ledger and `proportion:repro` re-derives GREEN (as the barns did under
   T-143-01), no new retired-pins entry is required for that path. If any *other* record still
   references the retired cottage source and DIVERGES, append a T-143-02 cottage entry naming the
   retired source + reason + ticket, keeping T-138 entries beside. This is an Implement-time
   observation, recorded honestly either way (memory [[pin-guard-is-structural]]).
2. **Compose**: `node benchmarks/sculpture/proportion-milestone.mjs --rotate-pins` → recompose over
   the frozen baselines + the new cottage record + the cited barn records. This **resolves the
   pre-existing `milestone:proportion:repro` DIVERGES** (staleness, not a defect).
3. **Head-to-head**: `pattern-book-compare.mjs` (with `--rotate-pins` if it rotates) →
   `pr/assets/pattern-book-milestone.md`.
4. **Verify**: `milestone:proportion:repro` GREEN (was DIVERGES); `proportion-baselines.json`
   byte-unchanged (`git diff --stat`).
5. **Commit**: `feat(T-143-02): proportion milestone recomposed on the three straight-ruler verdicts`.

## Decision detail — learnings, repro sweep, S-143 review (Step 5 + review)

1. **design-learnings**: append the **Straight ruler (E-34)** section — the real numbers from the two
   cited barns + the fresh cottage, the honest read (did the residual collapse?), the **E-12 handoff**.
   No per-building constants.
2. **Full repro sweep** (all GREEN-or-named-SKIP, both recorded): `patternbook:repro`,
   `patternbook:saltcrag:repro`, `proportion:repro`, `visibility:repro`, `milestone:proportion:repro`,
   `recognize:offline`; plus `gate … --offline` per slug. Memory [[challenge-repro-drift-preexisting]]
   + T-138-02 review concern 3: some adjacent witness/record families are **pre-existing
   FAIL-not-SKIP** on retired pins (T-133/T-134/T-137 authorities) — these are named, provenance-
   proven, not in `npm test`, and **not introduced here**. Record them; do not paper over.
3. **`npm test`** green (~2033 baseline; no source change expected).
4. **review.md for S-143** — spans both tickets: T-143-01's landed barns cited by commit, the
   interruption named, the **saltcrag band0 kit-presence concern carried forward** (5/3337 cells,
   tolerance 0, singular-judge honored), the cottage outcome, the open ≤2 gap-budget calibration
   question (still the reviewer's decision, now with a third epic's data).

## Risks & stop conditions (inherited from T-143-01 plan)

- Malformed judge reply → T-114 re-asks within budget; if still failing, record undecided, **stop**
  for the cottage. Do not paper over.
- `patternbook --repro` diverges after the live run → the new ledger doesn't replay; real defect;
  **stop**, do not commit.
- A witness FAILs (not SKIP/GREEN) after rotation → missing retired-pins entry or corrupted source;
  fix the registry entry or investigate before commit.
- Cottage still FAILs the gate → **legitimate recorded outcome** (residual part-real); record the
  honest verdict. A PASS is required by no AC.
- Cost ceiling: the cottage is the only judge run; run it once; `--rejudge` only for malformed replies.

## Why this is the right call

The barns are real, verified, committed results; re-running them is waste and violates the singular-
judge rule. The cottage is the genuine open question and the one piece T-143-01 never reached. The
milestone composer reads committed records, so it needs the cottage *record present*, not the barns
re-run. The review is story-level because S-143 was delivered across two tickets — exactly as S-138
was, and T-138-02's review is the proven template for that shape.
