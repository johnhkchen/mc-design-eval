# Structure — T-143-01 straight-ruler-reverdict

The blueprint: which records are written, by which runner, in which order. **This ticket writes
almost no `.mjs` — it is a measurement run.** The only code/doc edits are the retired-pins audit
entries, the design-learnings section, and the work artifacts. Everything else is record rotation
through the existing, frozen runners.

## A. Records ROTATED (committed, `--rotate-pins`, T-119)

Per subject (runKey / pack / slug):

### barn (rustic) — runKey `barn`, slug `barn-patternbook`
- `benchmarks/sculpture/pattern-book/barn.{json,md}` — chain record (re-seed receipt).
- `benchmarks/sculpture/workshop/barn.json` — **new ledger** (live trajectory).
- `benchmarks/sculpture/workshop/barn/{program.json,final-artifact.json,component-plan.json}`.
- `benchmarks/sculpture/multi-angle/barn-patternbook.{json,md}` — **judge verdict** (v2 + legacy).
- `pr/assets/frames/multi-angle-barn-patternbook.png` — contact sheet.
- `benchmarks/sculpture/proportion/barn.{json,md}` — re-derived witness (GREEN vs new ledger).
- `benchmarks/sculpture/visibility/barn-patternbook.{json,md}` — re-derived (GREEN vs new gate).

### barn (saltcrag) — runKey `barn--saltcrag`, slug `barn-patternbook-saltcrag`
- `pattern-book/barn--saltcrag.{json,md}`, `workshop/barn--saltcrag.json` + `workshop/barn--saltcrag/…`.
- `multi-angle/barn-patternbook-saltcrag.{json,md}` + `pr/assets/frames/multi-angle-barn-patternbook-saltcrag.png`.
- `visibility/barn-patternbook-saltcrag.{json,md}`.
- **No** `proportion/barn--saltcrag.*` — saltcrag shares the rustic barn's geometry exactly
  (identical baseline ratios 2.4444/0.5909/2); the proportion witness is geometric and would
  duplicate. Ratios for saltcrag are carried by the chain + milestone records (parity with T-138).

### cottage — runKey `cottage`, slug `cottage-patternbook`
- `pattern-book/cottage.{json,md}`, `workshop/cottage.json` + `workshop/cottage/…`.
- `multi-angle/cottage-patternbook.{json,md}` + `pr/assets/frames/multi-angle-cottage-patternbook.png`.
- `proportion/cottage.{json,md}` — re-derived (the headline: ratios under the **straightened** eave).
- `visibility/cottage-patternbook.{json,md}`.

### Milestone + glance (after all three subjects)
- `benchmarks/sculpture/pattern-book/proportion-milestone.{json,md}` — recomposed over baselines +
  new records (`milestone:proportion --rotate-pins`).
- `pr/assets/proportion-milestone.md` — glance page (concept beside sheet, before/after/target,
  lever citations, both arithmetics).
- `pr/assets/pattern-book-milestone.md` — head-to-head recomposed on the rotated verdicts.

## B. Files EDITED (the only hand-authored changes)

1. **`benchmarks/sculpture/retired-pins.json`** — add the T-143 audit entries naming the retired
   T-138 sources. The re-run witnesses are GREEN against the *new* records, so the registry is the
   **audit trail** AC2 demands ("retired pins named"), not a functional SKIP requirement. Add under
   a new `ticket`/`reason` for each rotated source whose prior bytes are being retired:
   - `proportion[]`: update/append cottage + barn entries to name the T-143 ledger rotation
     (retiredSourceSha = the *prior committed* ledger sha = the current e1abd583 / 11ec20dd, now
     superseded by the live re-run). Exact shas read at Implement time, post-rotation.
   - `visibility[]`: append cottage-patternbook + barn-patternbook + barn-patternbook-saltcrag
     entries naming the T-143 gate re-judge (retiredSourceSha = the prior committed gate-record sha).
   - Keep the existing T-138 entries (history); add T-143's beside them. **Schema unchanged**
     (`retired-pins/v1`), subject keys stay in this data sidecar (generalization self-grep clean).

2. **`docs/knowledge/design-learnings.md`** — append a **"## Straight ruler (E-34) …"** section
   after the E-33 section (current EOF, line ~2824). Contents (the E-12 handoff):
   - What each upstream ticket straightened (T-139 eave, T-140 lens+tolerance+pitch-precedence,
     T-141 envelope, T-142 rotation-proof witnesses, T-144 v2 budget).
   - The three answered questions **with numbers** (filled at Implement from the new records):
     cottage residual movement; barn pitch stayed class 1 (recorded not forced); barn verdict under v2.
   - The honest read: what the straightened ruler changed in the verdict vs the bent one, and what
     it did *not* (any surviving real residual).
   - E-12 handoff pointers (milestone JSON/MD, glance pages, baselines, retired-pins entries).
   - No per-building constants.

## C. Work artifacts (RDSPI)

`docs/active/work/T-143-01/{research,design,structure,plan,progress,review}.md` (this set).

## D. Files that must NOT change (frozen)

- `benchmarks/sculpture/pattern-book/proportion-baselines.json` — the frozen pre-rotation
  comparison. Never re-banked.
- Any runner `.mjs` (pattern-book, workshop, geometry-levers, multi-angle-gate, recognize,
  proportion-witness, visibility-witness, proportion-milestone, ruler/budget calibration) — the
  instrument is straightened upstream; T-143 only *runs* it. Editing a runner mid-measurement would
  invalidate the "trustworthy instrument" premise.
- `recognition/*` — recognition consumed as committed (Decision 1).
- `packs/rustic.json`, `packs/saltcrag.json` — frozen (T-141 / T-132 ratified).
- `src/form/*` budget/pin-guard — config-frozen (T-144 / T-119).

## E. Ordering (where it matters)

1. **Witnesses-before** (free, capture state): already run this session — recorded in progress.md.
2. **Per subject, in order barn → barn--saltcrag → cottage:** `patternbook … --rotate-pins` →
   `gate … --rotate-pins` → witnesses `--rotate-pins` → `:repro` GREEN → **commit**.
   (Chain before gate: the gate reads `workshop/{runKey}/final-artifact.json`. Witnesses after gate:
   visibility reads the gate record; proportion reads the ledger.)
3. **After all three:** retired-pins entries → `milestone:proportion --rotate-pins` → milestone
   `:repro` GREEN → head-to-head/glance → **commit**.
4. **Learnings + full repro sweep + `npm test`** → **commit**.

## F. Interfaces / invariants touched (none broken)

- Pin-guard domain isolation holds: `patternbook`/`workshop` never write `multi-angle/`; the gate
  is the only writer there. The `--rotate-pins` flag is passed to each writer for its *own* domain.
- Replay contract: every rotated record must satisfy its `--repro`/`--offline` byte-identity check
  *after* rotation (re-derives from the new committed bytes). This is the AC1 "replay byte-identical".
- Budget contract: gate aggregate carries `gapBudget` (legacy) **and** `policy/minorCount/majorCount/
  minorBudget` (v2); milestone `arithmeticsOf` reads both. No schema migration.

## G. Saltcrag invocation specifics (no npm script for the witnesses)

- chain: `node benchmarks/sculpture/pattern-book.mjs --subject barn --pack packs/saltcrag.json --ticket T-143-01 --rotate-pins`.
- gate: `npm run gate:patternbook:barn:saltcrag -- --rotate-pins` (script exists).
- visibility: `node benchmarks/sculpture/visibility-witness.mjs --subject barn --label patternbook-saltcrag --rotate-pins`.
- (`--` is required to pass flags through `npm run` — see the npm-flag-swallowing learning.)
