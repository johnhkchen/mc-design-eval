# T-170-02 Research — rerun-crater-with-typed-kind

Epic **E-41** / Story **S-170**. The proof ticket: re-run `experiments/eval-alignment/corpus-referee.mjs`
with the `kind`-emitting Layer A (landed by T-170-01, commit `7647ce4`) and report whether the typed tag
removes the E-40 over-cap. Descriptive only — options/decisions are for `design.md`.

## What T-170-01 already landed (the upstream this ticket consumes)

- `baml_src/department.baml` — `class CritiqueItem` now carries `kind "add" | "replace" | "remove"`
  (additive, between `missing` and `severity`). The `DiagnoseBuild` prompt gained one tagging sentence.
- The golden (`src/baml/fixtures/diagnose/prompt.golden.txt`) and the `b.parse` fixtures were re-pinned in
  that owning ticket. `npm test` is green at **2241**.
- **Scoring core is unchanged and already reads `kind`** (`src/workshop/bakeoff-score.mjs:61`
  `itemStyleClass`): `kind==="replace"→"wrong-style"`, `"add"→"absent"`, `"remove"→"match"`; only when
  `kind` is absent does it fall back to the structural `present && missing` triple read (lines 66–70).
  `styleFidelityScore` (line 152) caps the score at `WRONG_STYLE.cap=40` once any item is `"wrong-style"`.
- BO8 (`bakeoff-score.test.mjs:141`) and BO11 (`:214`) pin this mapping; T-170-01's FX-DB2 asserts the
  parse round-trips `kind` and that a BO11-shaped item (`present`+`missing` both non-empty) tagged `add`
  reads `absent` end-to-end.

## The E-40 baseline this run compares against (committed evidence)

`experiments/eval-alignment/results/corpus-referee.json` (commit `d041c06`, pre-`kind`):

- **Crater COLLAPSED**: matched **A=2**, wrong **B=0**, **B2=2**, control **C=0** — all floored; spread
  A−B=2 inside the ±12 noise band. The term tied everything at ~0.
- **Root cause (confirmed by inspecting the persisted items)**: live Layer A emits a non-empty `present`
  AND `missing` for *every* divergent department in *every* condition, so the structural rule classed
  nearly everything `"wrong-style"` and the cap fired even on the matched build. The captured matched-A
  vote-1 items show all three (WALL/OPENING/ROOF) `styleClass:"wrong-style"`.
- Agreement: easy 3/4 by ordering; only the +16 pair separates beyond noise; `cottage-vs-arc` inverts the
  human. Contested middle empty by construction. Bake-off: split 6/8 > fused 5/8 ("SPLIT WINS").

## The harness (`experiments/eval-alignment/corpus-referee.mjs`)

A metered, live-IO experiment (NOT in `npm test`). Asset-guard-first (`GUARD_ONLY=1` validates the 21
assets with no spend), `VOTES=2`, `TIER="strong"`, no re-ask on malformed. Three sections:

- **Section A — Crater** (`runCrater`): 4 fixed conditions on the held-fixed build `builds/gatehouse/new-roof`
  against rustic/guildhall packs and rustic/classical/gothic concepts. Writes `crater-*.png` beside-concept
  composites and per-condition vote scores.
- **Section B — Agreement** (`runAgreement`): the 4 wrong-style pair states, matched-vs-wrong scoring,
  `pairAgreement` ordering.
- **Section C — Bake-off** (`runBakeoff`): the 4 single states, split-vs-fused dispatch.

`diagnose()` (line 101) returns `{ev, items, score}` where `items` comes from `itemsOf` (line 77), which
persists `{department, severity, present, missing, styleClass}` per item — **it currently DROPS `kind`.**
`styleClass` is computed by `itemStyleClass(it)`, so once Layer A emits `kind`, `styleClass` will reflect
the typed short-circuit automatically; but the raw `kind` the judge chose is not recorded, so we cannot
report tag *reliability* without adding it.

Two output sinks, both **hardcoded to T-169-01**:
- `OUT_DIR = docs/active/work/T-169-01` (line 50) — the beside PNGs.
- `results/corpus-referee.json` (line 253) — the result doc (currently the E-40 baseline; re-running
  overwrites it).

## The corpus (`experiments/eval-alignment/corpus/defect-corpus.json`)

8 states: 4 single (`worstDepartment` + `confidence`) + 4 wrong-style pairs
(`matchedConcept`/`wrongStyleConcept`/`moreFaithful`/`confidence`). Loaded via
`src/workshop/defect-corpus.mjs` (ajv-validated). **Crucial for AC #2: there is NO per-item labeled
`kind` in the corpus** — its labels are department/faithfulness, not the add/replace/remove a single
critique item should carry. So "how often the judge's tag matches the corpus's labeled kind" has no
literal ground-truth column to join against. What the corpus *does* license is a **condition-level
expectation**: a build judged against the concept it matches should accrue `add`/`remove` (incomplete or
foreign-element, non-capping) items, while a build judged against a foreign-style concept should accrue
`replace` (wrong-material, capping) items.

## The confound the ticket names explicitly (the E-42 hand-off)

The crater's "matched" build is `builds/gatehouse/new-roof`, which is **itself material-wrong**: the
captured E-40 matched items show the judge correctly seeing dark timber siding where the concept wants
cobblestone+stone_bricks (WALL) and a raw void where it wants an arched timber gate (OPENING). Those are
*genuine* `replace`-class divergences against its own concept. So even with a perfect `kind` tag, the
matched gatehouse will legitimately carry `replace` items and stay capped — and that is the **correct**
answer (ticket Notes). A truly *faithful* matched build does not exist yet; building one is **E-42**
(T-171-01 material faithfulness, T-172-01 roof-as-construction). Therefore the crater cannot demonstrate
*separation* (matched ≫ wrong) from this corpus — the honest outcome is to report whether the over-cap is
*reduced/removed where the divergence is detail-only*, and to hand the separation proof to E-42.

## Constraints / assumptions

- **Frozen instrument untouched** (AC #4): no `measurements/**`, no gate vocabulary, no `department.baml`
  edit here (that was T-170-01).
- **`npm test` must stay green at 2241.** Harness is not unit-tested (live `experiments/` glob); any pure
  helper I add (e.g. a kind-reliability tally) should be co-located in `bakeoff-score.mjs` with a test, or
  kept trivial and local.
- The live run is ~48 image diagnose calls through `claude -p` (metered). Asset-guard runs first.
- Re-running overwrites the committed E-40 `corpus-referee.json` and the T-169-01 PNGs unless output is
  routed to T-170-02 — a routing decision for `design.md`.
- `results/corpus-referee.json` is creation-loop evidence under `experiments/`, not pin-guarded.
