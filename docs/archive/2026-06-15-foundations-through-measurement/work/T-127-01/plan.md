# T-127-01 styled-house-milestone — Plan

Phase artifact 4/6. Ordered, individually-committable steps. Suite baseline: 1818/1818.

## Step 1 — seed helpers + workshop registry derivation
**Code**: `src/workshop/seed.mjs` (`PATTERN_BOOK_BUDGET`, `seedWorkshopProgram`,
`workshopSubjectsFrom`); `src/workshop/seed.test.mjs`; workshop.mjs SUBJECTS = fixture +
`workshopSubjectsFrom(durable-skin)`; isolation.test.mjs scan-set check (seed.mjs must fall
under the existing src/workshop glob — verify; add pattern-book.mjs path now, pointing at a
file that lands in Step 2? NO — add it in Step 2 with the file, the scan must never reference
an absent path).
**Verify**: `node --test "src/workshop/*.test.mjs"` green (new tests incl. byte-stable
double-run); `npm run workshop:replay && npm run workshop:offline` still exit 0 (fixture
untouched by derivation); `node -e` smoke: derived table has cottage+barn rows with expected
paths and no fixture collision.
**Commit**: `feat(E-31 T-127-01): workshop seed seam — compile-to-workshop with declared budget, registry-derived subjects`

## Step 2 — the chain runner + scripts + isolation extension
**Code**: `benchmarks/sculpture/pattern-book.mjs` (live/--repro/--offline per structure);
package.json scripts (`patternbook:cottage|barn|repro|offline`, `gate:patternbook:cottage|barn`,
`patternbook:compare` placeholder LAST in step 5 — only add scripts whose files exist);
isolation.test.mjs gains pattern-book.mjs in the scanned set.
**Verify**: isolation test green (the new runner carries no judge tokens);
`node benchmarks/sculpture/pattern-book.mjs --subject cottage --repro` exits 1 HONESTLY
(no committed workshop program yet — the error must name the missing seam, not crash);
self-grep clean (`node -e` over the source for subject keys); full unit suite green.
**Commit**: `feat(E-31 T-127-01): pattern-book chain runner — seam verification, seeded workshop spawn, repro/offline modes`

## Step 3 — live chain, cottage then barn (METERED + GL)
**Run**: `npm run patternbook:cottage` → stages: sketch shas → recognition re-assert → seed
(program committed, conformance PASS) → workshop spawn (≤6 rounds live) → chain record.
Then `npm run patternbook:barn`. After each: `npm run patternbook:repro` and
`npm run patternbook:offline` must exit 0; inspect `workshop/<key>.md` digest + round renders;
eyeball before/after frames.
**Contingencies**:
- Workshop exchange refused/unparsed within T-114 bounds → loop records it (refused rounds are
  ledgered, loop continues/terminates structurally); the chain record stays honest.
- Cage rollback storms (T-126 concern #1) are EXPECTED on real subjects — not a defect; do not
  tune the cage or the prompt mid-run. One prompt revision is allowed by T-126 precedent ONLY
  if a systematic malformed-reply class appears (parse failures, not content) — record it.
- GL render failure → workshop throws, chain writes `pipeline-failed`, fix lens, re-run with
  `--rotate-pins` ONLY for this ticket's own freshly-created pins (named in the record).
- Conformance FAIL at seed (stage 3) → pipeline-failed record; diagnose (T-125 committed both
  drafts passing, so only a compile/seed regression can cause this — fix in seed, not in data).
**Commit** (per subject or together): `feat(E-31 T-127-01): pattern-book chain live — cottage+barn workshop revision, ledgered, replay byte-identical`

## Step 4 — the frozen gate, once per subject (METERED judge — the epic's only judge calls)
**Run**: `npm run gate:patternbook:cottage` then `gate:patternbook:barn`. Fresh `patternbook`
label → first-write pins, no rotation, no retired pins (record this in the chain/journal).
Then `node benchmarks/sculpture/multi-angle-gate.mjs --subject <key> --label patternbook
--offline` re-asserts each record clean.
**Contingencies**:
- A view exhausts unparsed → `npm run gate:rejudge -- --subject <key> --label patternbook`
  (the one sanctioned in-place completion; receipts must show `instrumentDiff: []`).
- Coverage-rejects or presence-fails are verdict-bearing findings, NOT bugs to fix; they enter
  the head-to-head as named causes.
- Exit code 1 (FAIL) is an acceptable, journaled outcome; exit 2 (REFUSAL) demands the cause be
  fixed (render/inputs) or recorded as a measured limit — a refusal is not a verdict and the
  head-to-head must then say so for that subject.
**Commit**: `feat(E-31 T-127-01): frozen-gate verdicts — cottage+barn patternbook label, receipts clean`

## Step 5 — head-to-head composer
**Code**: `src/form/head-to-head.mjs` + `head-to-head.test.mjs` (fixture-record composition,
same-object counting, delta signs, schema pin, coverage-reject rows);
`benchmarks/sculpture/pattern-book-compare.mjs`; `patternbook:compare` script.
**Run**: `npm run patternbook:compare` → `pattern-book/head-to-head.{json,md}` +
`pr/assets/pattern-book-milestone.md` (sheets side by side). Re-run → byte-identical
(deterministic over committed inputs).
**Verify**: table carries all four gate records' verdicts/causes + conformance + census;
deltas vs the ticket's baselines (cottage 10/2, 2/4; barn 12/2, 0/4) stated plainly.
**Commit**: `feat(E-31 T-127-01): head-to-head — pattern-book vs metrology bests, one table, sheets side by side`

## Step 6 — journal + close
**Code/docs**: append **pattern-book builder (E-31)** to `docs/knowledge/design-learnings.md`
(thesis, mode split, what the revision loop did/didn't catch — from the committed ledgers,
over/under-reach, the head-to-head inline, honest-miss attributions per D6); `npm test` full
suite green; write `progress.md` final state + `review.md`.
**Commit**: `docs(E-31 T-127-01): design-learnings — the pattern-book builder, journaled whichever way it fell`

## Test strategy summary
- **Unit (new)**: seed (budget override, byte-stability, conformance integration, registry
  derivation), head-to-head composition. Target: every pure branch.
- **Structural**: isolation scan now covers the chain runner.
- **Integration (exit-coded, not in `npm test`)**: `patternbook:repro`, `patternbook:offline`,
  `gate:multi --offline` per record — the Rule 5 replay receipts the AC names.
- **Not covered (convention)**: live shim behavior, GL bytes — evidence ledgers are the record.

## Acceptance-criteria → step map
- AC1 end-to-end + replay → Steps 1–3.  AC2 one frozen-gate run each + receipts + isolation
  cited → Step 4 (+ isolation receipt from Steps 1–2).  AC3 verdicts vs bests, honest causes →
  Steps 4–6.  AC4 head-to-head table + sheets → Step 5.  AC5 design-learnings + tests green →
  Step 6.
