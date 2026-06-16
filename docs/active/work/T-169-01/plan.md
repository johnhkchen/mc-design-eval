# T-169-01 Plan — ordered, independently verifiable steps

Each step commits atomically. Pure logic first (offline-verifiable), then the metered run, then the
write-up. `npm test` must be green before the live run and after.

## Step 1 — `pairAgreement` + BO12 (pure, no spend)
- Add `pairAgreement(rows)` to `src/workshop/bakeoff-score.mjs` (signature in structure.md), beside
  `dispatchCorrectness`. Pure, no IO.
- Append BO12 to `bakeoff-score.test.mjs`: ordering agree→easy, disagree, medium→contested, empty→no
  NaN, `moreFaithful:"wrong"` branch.
- **Verify:** `npm test` green (expect 2239 → 2240+). 
- **Commit:** `feat(T-169-01): pairAgreement easy/contested bucketing in bakeoff-score (E-40/S-169)`

## Step 2 — `corpus-referee.mjs` harness + package script (no spend yet)
- Create `experiments/eval-alignment/corpus-referee.mjs` per structure.md: three sections, asset-guard
  before each, beside-PNGs first, full items persisted, one result JSON. `VOTES=2`, `tier="strong"`,
  `NOISE=12`.
- Add `package.json` script `"corpus-referee"`.
- **Verify (no spend):** `node --check` the file; run with an asset-guard-only dry path — confirm it
  loads the corpus (`loadDefectCorpus`), resolves every concept/render path, and throws on none. (Guard
  the spend behind the guard passing.)
- **Commit:** `feat(T-169-01): corpus-referee harness — crater + agreement + bake-off (E-40/S-169)`

## Step 3 — probe, then the live run (metered)
- Probe already done (research.md): text `PROBE_OK`; diagnose A-matched=4 / B-arc=0 — path live, term
  collapses both. 
- Run `npm run corpus-referee` (background; ~10–15 min, ~48 image calls). It writes
  `results/corpus-referee.json` + the three beside-PNGs.
- **Verify:** result JSON parses; every section populated; spreads + summaries present; no FATAL.
- **Commit:** `chore(T-169-01): live corpus-referee evidence (crater/agreement/bake-off)` (results JSON
  + PNGs).

## Step 4 — FINDINGS + recommendation (from the actual numbers)
- `FINDINGS.md`: the three results read against the falsifiable claim, leading with how it failed:
  - **Crater:** matched & wrong both floor (collapsed, not cratered) — quote the per-item `present`
    that proves every item classed wrong-style; spread vs ±12.
  - **Agreement:** easy bucket rate (ordering matched>wrong?), contested bucket **empty by construction**
    (the corpus excludes the contested middle — `cottage-cream-vs-pink`), said plainly.
  - **Bake-off:** split-vs-fused on 4 single states; whether the bigger set changes the E-39 FUSED-WINS
    verdict; fused-wins reported if so.
- `recommendation.md`: **promote / re-calibrate / do-not-promote**, with the evidence. Pre-committed
  direction (design.md D6): **do-not-promote / re-calibrate** — the structural `itemStyleClass` rule
  over-penalizes the close style to the floor because live Layer A emits `present`+`missing` for every
  item; prerequisite is the typed `kind` discriminator (re-pinned E-39 ticket). Frozen instrument
  untouched here; promotion (if ever) is a separate re-pinned ticket. State the exact failure mode the
  ticket named that this lands in.
- **Verify:** `npm test` still green; recommendation cites concrete numbers from the JSON.
- **Commit:** `docs(T-169-01): FINDINGS + promotion recommendation (do-not-promote/re-calibrate)`

## Step 5 — Review
- `review.md`: files changed, test coverage + gaps, open concerns, AC checklist. Stop.

## Testing strategy
- **Unit (offline, in `npm test`):** `pairAgreement` (BO12). The rest of the scoring math is already
  pinned (BO1–BO11). The harness itself is NOT unit-tested (live IO, `experiments/` glob) — same as the
  precedents; its correctness is the asset-guard + the persisted full-item audit trail.
- **Integration (live, metered, NOT in `npm test`):** the `corpus-referee` run is the integration test
  — it is the AC. Its output is evidence, committed for re-inspection.
- **Verification criteria:** result JSON has all three sections; the recommendation's numbers match the
  JSON; `npm test` green at Steps 1, 4.

## Risks / mitigations
- *Model path drops mid-run* → partial JSON + the probed headline still ground the recommendation; the
  asset-guard + beside-PNGs-first mean evidence survives. Re-run is idempotent.
- *Spend* → VOTES=2, probe-first, asset-guard-first; no re-ask on malformed (precedent rule — a
  zero-token notice reply burns budget).
- *Over-claiming a crater* → the JSON persists every item's `present`; FINDINGS leads with the collapse,
  not a spun "it separated by 4 points."
