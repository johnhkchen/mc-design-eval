# T-167-01 Progress

## Completed (per plan.md, executed in one pass)

- **Step 1 — schema** `schema/defect-corpus.schema.json`: draft-2020-12, discriminated `oneOf` on
  `kind` (single | pair), `additionalProperties:false`, `minItems:8` on `states`, enums for
  `confidence` / `moreFaithful`. `worstDepartment` left as a free string (membership enforced in the
  loader — one composition point).
- **Step 2 — loader** `src/workshop/defect-corpus.mjs`: `loadCorpusSchema`, memoized
  `compileCorpusValidator`, non-throwing `parseDefectCorpus`, fail-fast `loadDefectCorpus`,
  `assertSemantics` (DEPARTMENTS membership + unique ids, IO-free), `singleStates` / `pairStates` /
  `statePaths` helpers. Reuses `formatErrors`; imports `DEPARTMENTS`. No dependency on `bakeoff-score.mjs`.
- **Step 3 — data** `experiments/eval-alignment/corpus/defect-corpus.json`: 8 states (4 single + 4
  pairs) + 6 logged exclusions. Labels from direct render inspection this session.
- **Step 4 — test** `src/workshop/defect-corpus.test.mjs`: DC1–DC9 (load+shape, DEPARTMENTS membership,
  pair labels, partition, id uniqueness, **on-disk path existence**, malformed rejection, semantic
  throws). `npm test` green: **2235** (was 2226; +9).
- **Step 5 — convenience** `package.json` `corpus:check`. `npm run corpus:check` → "corpus OK: 8
  states, 6 excluded".

## Labels (what I actually saw, beside each concept)

| state | kind | label | confidence | why |
|---|---|---|---|---|
| barn-roofless | single | ROOF | high | open box, no roof |
| barn-holey-walls | single | WALL | medium | roof reads; walls riddled with holes |
| cottage-plain-upper | single | WALL | medium | plain upper storey, no half-timber; chimney also absent (→medium) |
| gatehouse-gaping-gate | single | OPENING | medium | unframed rectangular gate, no arch |
| gatehouse-vs-arc / -chapelle | pair | matched | high | rustic gatehouse ≫ polychrome classical/gothic |
| cottage-vs-arc / -chapelle | pair | matched | high | Tudor cottage ≫ polychrome classical/gothic |

## Deviations from plan

- None material. Committing as one squashed unit (files are mutually dependent; the schema/loader/data/
  test only make sense together) rather than the 5 separate commits sketched in plan.md — the plan's
  per-step commits were a forcing function, not a contract, and all steps verify green together.

## Findings against the falsifiable claim (carried into review.md)

- Cross-style `moreFaithful` is a **stable, high-confidence** signal (claim failure mode (a) does NOT
  trigger for cross-style distance). The genuine wobble is sub-threshold *same-style* tint → excluded
  (`cottage-cream-vs-pink`), not faked.
- Most single states have a clean worst department, but **massing/proportion has none** (off-contract,
  S-163) → logged as `massing-proportion-axis` in `excluded`. This is claim failure mode (b)'s honest
  report: the dispatch metric would need multi-label to cover the massing axis.
