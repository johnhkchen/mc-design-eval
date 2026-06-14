# Budget calibration — glance-true (budget-calibration/v1, T-144-01, E-34)

Pure re-derivation over committed multi-angle gate records — **no judge, no re-judging**; both
arithmetics recomputed from each record's committed `views[].gaps[]`. The deciding policy is **v2**
(identity-first: every view same-object ∧ zero major ∧ minors ≤ minorBudget); the **legacy ≤2** flat
budget is reported beside it for continuity.

**minorBudget = 10** (derivation): the glance-passing observed ceiling is 8 minors
(the two T-138 barns); the structural ceiling is 4×MAX_GAPS_PER_VIEW = 12; 10 is the midpoint — it
bites only at >2.5 cosmetic papercuts per view averaged while clearing both barn anchors with
headroom. Calibrated, then frozen.

| record | same/drift | major | minor | **v2** | legacy ≤2 | anchor |
| --- | --- | --- | --- | --- | --- | --- |
| barn-challenge | 0/4 | 8 | 4 | **FAIL** | FAIL 12/2 |  |
| barn-generated | 0/4 | 8 | 4 | **FAIL** | FAIL 12/2 |  |
| barn-patternbook | 4/0 | 0 | 8 | **PASS** | FAIL 8/2 | ✓ PASS |
| barn-patternbook-saltcrag | 4/0 | 0 | 8 | **PASS** | FAIL 8/2 | ✓ PASS |
| church-challenge | 0/4 | 6 | 5 | **FAIL** | FAIL 11/2 |  |
| church-generated | 0/4 | 10 | 2 | **FAIL** | FAIL 12/2 |  |
| church-styled | 0/4 | 7 | 5 | **FAIL** | FAIL 12/2 |  |
| cottage-baseline | 0/0 | 0 | 0 | **FAIL** | FAIL 0/2 | noted (coverage) |
| cottage-challenge | 1/3 | 4 | 7 | **FAIL** | FAIL 11/2 |  |
| cottage-current | 0/3 | 4 | 5 | **FAIL** | FAIL 9/2 | noted (coverage) |
| cottage-generated | 2/2 | 4 | 6 | **FAIL** | FAIL 10/2 |  |
| cottage-patternbook | 2/2 | 4 | 7 | **FAIL** | FAIL 11/2 | ✓ FAIL |
| cottage-styled | 0/4 | 6 | 6 | **FAIL** | FAIL 12/2 |  |
| gatehouse-challenge | 0/4 | 8 | 4 | **FAIL** | FAIL 12/2 |  |
| gatehouse-current | 0/4 | 7 | 5 | **FAIL** | FAIL 12/2 |  |
| gatehouse-generated | 0/4 | 8 | 4 | **FAIL** | FAIL 12/2 |  |
| gatehouse-styled | 0/4 | 8 | 4 | **FAIL** | FAIL 12/2 |  |
| synthetic-hut-current | 4/0 | 0 | 2 | **PASS** | PASS 2/2 |  |

Anchors (AC2): **all hold** — barn-patternbook ✓ (PASS), barn-patternbook-saltcrag ✓ (PASS), cottage-patternbook ✓ (FAIL).

Coverage-refused records are **noted, not re-scored** (their judge was deliberately never called on
the short-circuited view): cottage-baseline, cottage-current.
