# Plan — T-143-01 straight-ruler-reverdict

Ordered, independently-verifiable steps. Each subject commits atomically; the milestone and
learnings commit after. Verification is the runner's own `--repro`/`--offline` byte-check plus
`npm test` at the end. No runner `.mjs` is edited — this is a measurement run.

## Step 0 — Witnesses-before + baseline reproducibility (FREE, done this session)

Already executed and to be recorded in `progress.md`:
- `recognize:offline` → cottage/barn REPRODUCE; conformance PASS.
- `patternbook:repro` + `patternbook:saltcrag:repro` → all three chains byte-identical.
- `proportion:repro` → cottage/barn **SKIP-named** (retired by T-138).
- `visibility:repro` → the three patternbook slugs **SKIP-named**.
- `milestone:proportion:repro` → **DIVERGES** (pre-existing staleness; resolved by Step 4).

**Verify:** outputs captured verbatim in progress.md as the "before" state (the rotation-proof bar
needs both before and after). No commit (no file changes).

## Step 1 — barn (rustic): chain → gate → witnesses → commit

The clean validator (T-144 calibration already showed `barn-patternbook` PASSES v2).

1a. `node benchmarks/sculpture/pattern-book.mjs --subject barn --ticket T-143-01 --rotate-pins`
    → re-seed (deterministic, must match the reproduced seed) + **live workshop** (new ledger).
1b. `npm run gate:patternbook:barn -- --rotate-pins` → **live judge**, 4 azimuths, v2 + legacy.
1c. `node benchmarks/sculpture/proportion-witness.mjs --subject barn --rotate-pins`
    then `node benchmarks/sculpture/visibility-witness.mjs --subject barn --label patternbook --rotate-pins`.
1d. **Verify:** `proportion-witness.mjs --subject barn --repro` GREEN (re-derives the new ledger);
    `visibility-witness.mjs --subject barn --label patternbook --repro` GREEN;
    `pattern-book.mjs --subject barn --repro` byte-identical (new ledger replays).
1e. **Commit:** `feat(T-143-01): barn (rustic) re-verdict under the straight ruler — <verdict>`.

## Step 2 — barn (saltcrag): chain → gate → visibility → commit

2a. `node benchmarks/sculpture/pattern-book.mjs --subject barn --pack packs/saltcrag.json --ticket T-143-01 --rotate-pins`.
2b. `npm run gate:patternbook:barn:saltcrag -- --rotate-pins`.
2c. `node benchmarks/sculpture/visibility-witness.mjs --subject barn --label patternbook-saltcrag --rotate-pins`.
    (No proportion witness — geometry identical to rustic barn; ratios carried by chain/milestone.)
2d. **Verify:** saltcrag `patternbook --repro` byte-identical; `visibility … --repro` GREEN.
2e. **Commit:** `feat(T-143-01): barn--saltcrag re-verdict on the ratified pack — <verdict>`.

## Step 3 — cottage: chain → gate → witnesses → commit (the headline)

The epic's true question: does the 4-major / 2-of-4 residual collapse to real-only under the
straightened eave (T-139) + widened pack (T-141)?

3a. `node benchmarks/sculpture/pattern-book.mjs --subject cottage --ticket T-143-01 --rotate-pins`
    → watch the **workshop ledger**: with the eave un-latched from the plinth, the model's
    wall-raise aims should now score as improvements and (with storeyHeight≤5) land.
3b. `npm run gate:patternbook:cottage -- --rotate-pins` → live judge.
3c. `node benchmarks/sculpture/proportion-witness.mjs --subject cottage --rotate-pins`
    then `node benchmarks/sculpture/visibility-witness.mjs --subject cottage --label patternbook --rotate-pins`.
3d. **Verify:** cottage `proportion --repro` GREEN (ratios now read off the true eave, not the
    plinth — compare the recorded ratio to the baseline's bent 5.5/0.8182 and hand-corrected ≈1.7/0.45);
    `visibility --repro` GREEN; `patternbook --repro` byte-identical.
3e. **Commit:** `feat(T-143-01): cottage re-verdict — <residual collapses to real-only | residual persists>`.

## Step 4 — retired-pins audit + milestone recompose + glance → commit

4a. Read the post-rotation shas (the *prior* committed sources are now retired). Edit
    `benchmarks/sculpture/retired-pins.json`: append T-143 `proportion[]` (cottage, barn) and
    `visibility[]` (all three slugs) entries naming the retired prior sources + reason + ticket.
    Keep T-138 entries beside.
4b. `node benchmarks/sculpture/proportion-milestone.mjs --rotate-pins` → recompose milestone over
    `proportion-baselines.json` (frozen) + the new records; writes milestone JSON/MD +
    `pr/assets/proportion-milestone.md`.
4c. Recompose the head-to-head: `node benchmarks/sculpture/pattern-book-compare.mjs` (if it rotates
    pins, pass `--rotate-pins`) → `pr/assets/pattern-book-milestone.md`.
4d. **Verify:** `milestone:proportion:repro` GREEN (was DIVERGES); confirm baselines.json byte-unchanged
    (`git diff --stat` shows no change to it).
4e. **Commit:** `feat(T-143-01): proportion milestone v2 recomposed on the straight-ruler re-verdicts`.

## Step 5 — design-learnings (E-34) + final repro sweep + npm test → commit

5a. Append the **Straight ruler (E-34)** section to `docs/knowledge/design-learnings.md` with the
    real numbers from Steps 1–3, the honest read, and the E-12 handoff. No per-building constants.
5b. **Full repro sweep (all GREEN-or-named-SKIP):** `patternbook:repro`, `patternbook:saltcrag:repro`,
    `proportion:repro`, `visibility:repro`, `milestone:proportion:repro`, `recognize:offline`.
    Also `gate … --offline` per slug (re-asserts the committed verdict records).
5c. `npm test` (baseline was 2033 passing per T-144 progress; expect green — no source changed).
5d. **Commit:** `docs(T-143-01): straight-ruler (E-34) learnings + E-12 handoff; repro green`.

## Testing strategy

- **No new unit tests.** T-143 changes no `.mjs`; the instrument's units are already proven upstream
  (T-139 maskProportions, T-140 ruler, T-141 levers, T-142 witness-repro, T-144 budgetVerdict).
- **The verification IS the replay:** each rotated record must pass its own `--repro`/`--offline`
  byte-check after rotation (the Rule-5 anchor). This is the regression net for a measurement run.
- **`npm test` green** confirms no fixture drifted (none should — no source/pack/prompt changed; the
  recognition prompt shas were already settled by T-141).
- **The witnesses are the rotation-proof regression:** GREEN-or-named-SKIP before and after, both
  recorded. A bare DIVERGE/throw after rotation is a failure to fix before commit.

## Risks & stop conditions

- **If a live judge reply is malformed:** the gate's T-114 reply-policy re-asks within budget; if it
  still fails, the record is undecided — do **not** paper over it; record and stop for that subject.
- **If `patternbook --repro` diverges after a live run:** the new ledger doesn't replay — a real
  defect; stop, do not commit that subject.
- **If a witness FAILs (not SKIP/GREEN) after rotation:** the retired-pins entry is missing or the
  source corrupted; fix the registry entry or investigate before commit.
- **If the cottage still FAILs the gate:** legitimate recorded outcome (residual part-real); record
  the honest verdict — a PASS is not required by any AC.
- **Cost ceiling:** these are the epic's only judge runs (AC2). Run each exactly once; `--rejudge`
  is reserved for malformed replies, never for re-rolling a clean verdict.

## Definition of done (maps to AC)

- AC1: three chains re-seeded + live workshop + gate, ledgers committed, replay byte-identical. ✓ Steps 1–3.
- AC2: judge runs are the epic's only ones; witnesses green-or-named-SKIP before & after, both recorded;
  retired pins named. ✓ Steps 0,1c–3c,4a.
- AC3: per-subject ratios (both rulers where they differ), lens named, lever use, verdict vs baseline,
  decided under v2 with legacy beside; the three questions answered honestly. ✓ Steps 1–4 records + learnings.
- AC4: sheets in pr/assets, residual ratio deltas, milestone recomposed, `--repro` byte-identical. ✓ Step 4.
- AC5: design-learnings E-34 section + E-12 handoff; review.md honest; no per-building constants; npm test green. ✓ Step 5 + review.
