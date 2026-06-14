# Plan — T-143-02 straight-ruler-reverdict-resumption

Ordered, independently-verifiable steps resuming T-143-01 at the cottage. The cottage commits
atomically; milestone and learnings commit after; the S-143 review closes. Verification is each
runner's own `--repro`/`--offline` byte-check plus `npm test`. **No runner `.mjs` is edited.**

## Step 0 — Resumption pre-flight (FREE) — record in progress.md

Already probed this session: `claude -p` (haiku) → `ok`; `render.mjs GL_AVAILABLE: true`. The barns
are cited (commits `5d0743e`, `979d8b7`); their before-state + outcomes are verbatim in
`docs/active/work/T-143-01/progress.md` (the rotation-proof "before"). Confirm the cottage seed
reproduces byte-identically before spending: this was true under T-143-01; re-assert with a cottage
`--repro` of the *current committed* chain (the T-138-02 cottage record) as the seed-stability check.
**Verify:** probes recorded; no commit (no file changes).

## Step 1 — cottage: chain → gate → witnesses → commit (the headline)

The epic's true question: does the T-138-02 residual (2/4 same-object, 7 minor + 4 major,
part-real roof-heaviness / part-instrument) collapse to real-only under the straight eave (T-139) +
admissible wall-raise (T-141)?

1a. `node benchmarks/sculpture/pattern-book.mjs --subject cottage --ticket T-143-02 --rotate-pins`
    → re-seed (deterministic; must match the reproduced seed) + **live workshop** (new ledger).
    Watch the ledger: with the eave un-latched from the plinth, do the model's wall-raise aims now
    score as improvements and land (storeyHeight≤5)? Record the trajectory verbatim.
1b. `npm run gate:patternbook:cottage -- --rotate-pins` → **live judge**, 4 azimuths, v2 + legacy +
    T-100 kit-presence companion. One run per view. Malformed reply → T-114 re-ask within budget;
    never re-roll a clean verdict.
1c. `node benchmarks/sculpture/proportion-witness.mjs --subject cottage --rotate-pins`
    then `node benchmarks/sculpture/visibility-witness.mjs --subject cottage --label patternbook
    --rotate-pins`.
1d. **Verify:** `proportion-witness.mjs --subject cottage --repro` GREEN (compare recorded ratio to
    the baseline's bent 5.5/0.8182 and the corrected ≈1.7/0.45 against targets 1.4145/0.293);
    `visibility-witness.mjs --subject cottage --label patternbook --repro` GREEN;
    `pattern-book.mjs --subject cottage --repro` byte-identical (new ledger replays).
1e. **Commit:** `feat(T-143-02): cottage re-verdict — <residual collapses to real-only | persists>`.

## Step 2 — retired-pins audit + milestone recompose + glance → commit

2a. Read the post-rotation cottage pin shas. If `proportion:repro`/`visibility:repro` re-pin clean to
    the new T-143-02 ledger (GREEN, as the barns did), no retired-pins edit is needed — record that.
    If any record still references the retired cottage source and DIVERGES, append a T-143-02
    `proportion[]`/`visibility[]` entry to `benchmarks/sculpture/retired-pins.json` naming the retired
    source sha + reason + ticket; keep T-138 entries beside.
2b. `node benchmarks/sculpture/proportion-milestone.mjs --rotate-pins` → recompose over the frozen
    baselines + cottage record + the two cited barn records; writes milestone JSON/MD +
    `pr/assets/proportion-milestone.md`. **This resolves the pre-existing DIVERGES.**
2c. `node benchmarks/sculpture/pattern-book-compare.mjs` (pass `--rotate-pins` if it rotates) →
    `pr/assets/pattern-book-milestone.md`.
2d. **Verify:** `milestone:proportion:repro` GREEN (was DIVERGES); `git diff --stat` shows
    `proportion-baselines.json` **byte-unchanged**.
2e. **Commit:** `feat(T-143-02): proportion milestone recomposed on the three straight-ruler verdicts`.

## Step 3 — design-learnings (E-34) + full repro sweep + npm test → commit

3a. Append the **Straight ruler (E-34)** section to `docs/knowledge/design-learnings.md` with the
    real numbers from the two cited barns + the fresh cottage, the honest read (residual collapse?),
    and the **E-12 handoff**. No per-building constants.
3b. **Full repro sweep (all GREEN-or-named-SKIP, recorded as the rotation-proof "after"):**
    `patternbook:repro`, `patternbook:saltcrag:repro`, `proportion:repro`, `visibility:repro`,
    `milestone:proportion:repro`, `recognize:offline`; plus `gate … --offline` per slug. Expect some
    adjacent witness families to be **pre-existing FAIL-not-SKIP on retired pins** (T-138-02 review
    concern 3) — name them, prove provenance against a pre-T-143 baseline, do not paper over.
3c. `npm test` (baseline ~2033; expect green — no source changed).
3d. **Commit:** `docs(T-143-02): straight-ruler (E-34) learnings + E-12 handoff; repro green`.

## Step 4 — S-143 review → (review.md)

4a. Write `docs/active/work/T-143-02/review.md` as the **story-level S-143 review** spanning both
    tickets, modeled on `docs/active/work/T-138-02/review.md`: T-143-01's landed barns cited by
    commit + the interruption named; T-143-02's commits; the milestone's findings; the verification
    ledger (every claim exit-coded at HEAD); open concerns (saltcrag band0 5/3337 carried; ≤2 gap
    budget — third epic's data, still the reviewer's call; pre-existing retired-pin tripwire families;
    the cottage outcome); test coverage; AC ledger.
4b. No commit needed beyond what Lisa handles; the review.md write closes the ticket.

## Testing strategy

- **No new unit tests.** T-143-02 changes no `.mjs`; the instrument's units are proven upstream
  (T-139 maskProportions, T-140 ruler, T-141 levers, T-142 witness-repro, T-144 budgetVerdict).
- **The verification IS the replay:** each rotated record passes its own `--repro`/`--offline`
  byte-check after rotation (the Rule-5 anchor). This is the regression net for a measurement run.
- **`npm test` green** confirms no fixture drifted. If a fixture pinned the live cottage gate record
  (as T-137's did in T-138-02), preserve it as a test-only retired fixture and name it — the sole
  permissible source-tree touch, exactly T-138-02's `e0d000d` precedent.
- **Witnesses are the rotation-proof regression:** GREEN-or-named-SKIP before and after, both
  recorded. A bare DIVERGE/throw after rotation is a failure to fix before commit.

## Risks & stop conditions

- **Malformed live judge reply:** T-114 re-asks within budget; if still failing, record undecided —
  do **not** paper over; stop for the cottage.
- **`patternbook --repro` diverges after the live run:** the new ledger doesn't replay — a real
  defect; stop, do not commit.
- **A witness FAILs (not SKIP/GREEN) after rotation:** missing/incorrect retired-pins entry or
  corrupted source; fix the registry entry or investigate before commit.
- **Cottage still FAILs the gate:** legitimate recorded outcome (residual part-real); record the
  honest verdict — a PASS is required by no AC.
- **Session interruption (the recurring failure mode):** commit each step atomically so a death
  leaves a clean resumption point (this very ticket exists because of one).
- **Cost ceiling:** the cottage is this ticket's only judge run (AC2). Run each step once;
  `--rejudge` reserved for malformed replies, never for re-rolling a clean verdict.

## Definition of done (maps to AC)

- **AC1** — cottage through the full loop behind `--ticket T-143-02 --rotate-pins`: chain + live
  workshop + gate, ledger committed, replay byte-identical, decided under v2 with legacy beside, pins
  rotated (retired named), witnesses green-or-named-SKIP before & after. ✓ Step 1.
- **AC2** — milestone recompose: 3 subjects (2 barns cited from commits, cottage fresh), baselines
  quoted pre-rotation, both rulers where they differ, both budget arithmetics beside every verdict,
  `--repro` byte-identical, baselines never re-banked. ✓ Step 2.
- **AC3** — recorded honestly: does the cottage residual collapse to real-only? Sheets beside concepts
  in `pr/assets/`; residuals carry measured ratio deltas + named lenses. ✓ Steps 1–2 records.
- **AC4** — design-learnings straight-ruler (E-34) section + E-12 handoff; S-143 review spanning both
  tickets (barns by commit, interruption named, saltcrag band0 concern carried). ✓ Steps 3–4.
- **AC5** — replay green on touched chains/gates; no per-building constants; `npm test` green. ✓
  Step 3.
