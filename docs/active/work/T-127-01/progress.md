# T-127-01 styled-house-milestone — Progress

Phase artifact 5/6. Step-by-step against plan.md.

## Step 1 — seed helpers + workshop registry derivation ✅
- `src/workshop/seed.mjs`: `PATTERN_BOOK_BUDGET` (rounds 6), `seedWorkshopProgram`
  (compile → declared budget → assert → realize → conformance; byte-stable `serialized`),
  `workshopSubjectsFrom` (durable-skin registry → workshop data rows, recognize predicate).
- `src/workshop/seed.test.mjs`: SEED1–6 (budget override, byte-stability, real-pack
  integration PASS, pack-invalid role throws, derivation predicate + real-registry leg).
- `benchmarks/sculpture/workshop.mjs`: SUBJECTS = explicit fixture + derived rows.
- **Deviation from structure.md (recorded)**: `seedWorkshopProgram` returns the conformance
  result instead of throwing on a conformance FAIL — the chain owns that verdict (honest
  pipeline-failed record); validation/role gates still throw. Structure said "throws on any
  gate failure"; returning is strictly more testable and the chain asserts `passed` itself.
- Verified: 56/56 workshop tests; `workshop:replay` BYTE-IDENTICAL + `workshop:offline` clean
  (fixture untouched by derivation); full `npm test` 1827/1827.

## Step 2 — chain runner + scripts + isolation extension — IN PROGRESS

## Step 3 — live chains (cottage, barn) — pending
## Step 4 — frozen gate ×2 — pending
## Step 5 — head-to-head composer — pending
## Step 6 — design-learnings + review — pending
