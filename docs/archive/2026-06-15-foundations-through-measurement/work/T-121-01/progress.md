# T-121-01 barn-proof-milestone — Progress

Tracking against `plan.md`. Updated per step.

## Step 1 — gate-instrument receipt seam ✅ (commit `2f3b0a3`)

- `src/form/gate-instrument.mjs` created: pure `instrumentReceipt(committed, fresh, names)`,
  extracted from generated-milestone, byte-compatible comparator strings.
- `src/form/gate-instrument.test.mjs`: 6 tests (degenerate inputs, frozen-clean, named contract
  drift, novel judge model, committed-without-models cannot convict, null-safety).
- `generated-milestone.mjs`: local `instrumentDiff` → shared import (`INSTRUMENT_NAMES` constant).
- `styled-milestone.mjs`: prior committed gate record read **before** `spawnGate` (the rotation
  overwrites it in place); `instrument` recorded beside `gate`; one line in `renderMd`.
- Suite: **1607/1607** (baseline 1601 + 6 new). `node --check` clean on both runners.
- Deviation: none.

## Step 2 — barn proof run ▶ in flight

- `npm run generated:barn` launched (live: chain ×2 in-process + kit-aware multi-angle gate,
  4 judge views).
- **First attempt: PIPELINE FAILED at skin** — `band acceptance FAILED: roof materials 0.83
  (target >= 0.9), wall foreign residue {"band0":0} (max 0.05)`. Honest record written
  (`generated/barn.json`, status pipeline-failed). No judge spend.
- **Deviation 1 (evidence, not tuning):** the band-acceptance throw named the fraction but not the
  census — unlike the coverage gate above it (T-106 "the residual is named"). Extended the throw in
  `durable-skin.mjs` to carry the roof zone's full census. Target untouched. Re-ran:
  `roof census {"total":1184,"byBlock":{"dark_oak_planks":983,"cobblestone":201}}`.
- **Root cause (named):** the barn's steep gable-end triangles are cobblestone WALL planes (the
  fitted ±x wall slabs span y 0..19/20, to the apex; the ±z eave walls stop at y 9 — the concept's
  stone tithe barn has stone gables to the ridge). The census y-bins those 201 cells into the
  "roof" zone, diluting roofMaterialsFraction to 0.83. `planCensusZoneOf` already reclassifies
  roof-PROGRAM cells INTO "roof" from any y-band ("a rake stair on the gable-end plane must not be
  counted against the wall band it y-bins into") but never the dual — a defined wall-plane cell
  out of the roof band. Cottage/church pass only because their gable dilution is < 10%; the steep
  gable is the first-run generalization finding.
- **Deviation 2 (census-only instrument fix, in `planCensusZoneOf`):** when a roof PROGRAM exists
  (the definition is the census authority) a cell that y-bins "roof", is NOT a program cell, and
  IS a defined wall — generator-provenance mass cell (plan gains `mass.cells`, serialized/revived)
  or fitted-slab-plane cell — censuses as `roof:gable`: measured, never gated. Placements/fill
  zoneOf untouched; engages only when `plan.roof.cells` exists; a roof-band cell NO definition
  claims still censuses "roof" (spike detection preserved). Both band-acceptance call sites
  (durable-skin, placement-grammar) flow through this one composition point. Unit-tested.
- **Deviation 3 (sealRoof program-blindness — the 201-cell residual):** stage-attribution in the
  throw proved the diluting cobble was the roof program's slab/stair eave courses (`raw:spruce_slab
  → sealed:cobblestone`): `sealRoof`'s +y read picks the most-common top block as "the roof", and
  on the barn that is the WALL field (gable tops + wall-top course + protrusion tops out-project
  the roof planes) — it stripped 320 cells toward cobblestone and filled 248 holes with it. Fix
  mirrors the stage-8 course rule verbatim: on the roof program's footprint the courses are the
  contract — seal placements on `footprintCols` are filtered (`programFiltered` recorded);
  off-footprint columns keep today's behavior. (A first sealWalls-attributed filter was reverted —
  probe proved sealWalls emitted none of the diluting cells.) Band acceptance now PASSES; the chain
  advanced to grammar.
- **Deviation 4 (kit binding degrade, the T-117→S-121 handoff):** grammar stalled next: `kit binds
  no frame block — requires a trim-tagged cube entry`. Cause: the barn kit's ONLY trim cube
  (stone_bricks) and ONLY roof cube (spruce_planks) are `flagged-mismatch` from the first-run value
  check, and a flagged entry never binds (the kit's own don't-trust flag). T-117 explicitly handed
  "whether these recognitions ship" to S-121. Decision: they do NOT ship (the flag stands; nothing
  is tuned) — instead the milestone honors `bindKit`'s documented contract ("degrades to a recorded
  no-op — never a throw"): `bindKit` now distinguishes `all-flagged` from `no-candidate`, and
  grammarStage degrades to the recorded no-op on `all-flagged` only (a true no-candidate still
  throws as a wiring bug). Kit-presence and the kit-aware gate still judge; the gaps get named by
  the frozen gates, not by a bootstrap stall.

- **The proof run (one named run, judged):** `generated:barn` COMPLETE end-to-end — evidence →
  fit → generate (zero-blob PASS, 6513 cells, blob overlap 25.2% as fit-quality evidence) → skin →
  grammar (frame/course unshipped, named `all-flagged`) → dressing → settle (0 iterations) →
  kit-aware multi-angle gate. **Verdict vs the pinned bar: kit presence PASS · resemblance FAIL,
  0/4 same-object, gaps 12/2** — the bar is MISSED with named causes, recorded per angle:
  - 45°: drifted — major form@walls and roof all around; major massing@long side wall; minor
    material zoning@roof and wall blocks
  - 135°: drifted — major form@roof, top of the building; minor form@long side walls; minor
    material zoning@wall stonework
  - 225°: drifted — major massing@long wall and roof plane; major form@roof surface; minor
    material zoning@stone wall coursing
  - 315°: drifted — major massing@roof across the full ridge; major form@long side and gable
    walls; minor material zoning@upper wall and roof courses
  Same first-contact profile as church's first generated run (12/2, 0/4). Kit presence passes as
  the fixpoint (the unshipped frame/course are SKIPS with named reasons, not gaps — presence
  judges what shipped).
- **Receipts (first-ever for barn):** `--repro` exit 0 (fresh-process chain reproduces committed
  artifacts, styled sha `8db2e8d3f4dc…` match); `--offline` exit 0 (shas match, zero-blob
  recorded, gate record well-formed, AJV ok). In-process double-run byte-identical. Instrument
  receipt `frozen, diffs: []` (fallback comparator — no styled-label record exists for this
  subject), judge model pinned `claude-opus-4-8`.
- **Roof-diff first measurement:** `diff:roof -- --subject barn` → barn-generated 4416px mismatch,
  roof share 35.054%, worst view +x+z (the instrument agrees with the judges' major form@roof);
  barn-reconstructed stays a named skip (no reconstructed-path inputs — correct, never built).
- **Deviation 5 (recorded residual):** the committed record carries
  `generalization: {subjectKeysInRunner: ["barn"], clean: false}` — the grep caught a CODE COMMENT
  this ticket added to the runner (the word, not a branch/constant; zero behavioral
  subject-keying). Comments reworded in all touched files (runner now greps 0 hits) so every
  subsequent run is clean; the record is NOT re-rolled to refresh the field (one judge run per
  view — E-28 Rule 4 outranks a cosmetic evidence fix). Named for the reviewer.

## Step 3 — legacy re-judge ✅ (one judge run per view, all under `-- --rotate-pins`)

Before-state preserved first: prior sheets copied to `pr/assets/frames/multi-angle-cottage-styled-
t111pin.png`, `…gatehouse-styled-t115pin.png`, `…church-generated-prevpin.png`,
`…cottage-generated-prevpin.png`; prior gate + milestone records into `before/` here.

| chain | prior pin | fresh verdict | artifact sha | instrument |
|---|---|---|---|---|
| styled:cottage | FAIL 10/2, **135°/225° same-object** | FAIL **12/2, 0/4** | MOVED `33ffd0c8…`→`55407a93…` | frozen, `diffs: []` |
| styled:gatehouse | FAIL 12/2, 0/4 | FAIL 12/2, 0/4 (held) | moved (chain changes) | frozen, `diffs: []` |
| generated:church | FAIL 12/2, 0/4 | FAIL 12/2, 0/4 (held) | moved | frozen, `diffs: []` |
| generated:cottage | FAIL 12/2, 1/4 (135° held) | FAIL 12/2, 0/4 | MOVED `e7f97344…`→`5edf5892…` | frozen, `diffs: []` |

- **Movement explained:** every artifact moved because the chains now include this ticket's
  first-contact fixes (program-exempt seal, gable census dual) on top of the T-118-era code; the
  instrument receipts prove the RULER held (contract + judge model byte-stable), so verdict
  movement is build+judge, not gate drift. The cottage same-object holds (135°/225°) did NOT
  survive the re-cut — consistent with the known budget-edge flap (T-111/T-116); every angle now
  names roof form/massing as the major gap, same as the instrument.
- **The T-118 cross-gable target did NOT close:** roof-diff cottage-generated before→after:
  total mismatch 6231→5922px (small improvement from the seal/census fixes), but
  `gable-roof-2-roof-3` mean ridge delta **−4.015 unchanged** (the −3.445-class signal). The
  T-118 repair fixed the instrument's apex READING; the generated ridge itself is still built ~4
  cells low on the cross-gable. Named residual, standing target for the next owned ticket.
- Roof-diff refreshed judge-free for cottage/church generated paths; reconstructed-path records
  re-derived byte-identical (untouched in git). Church-generated roof-diff: 6848px, share 40.7%.
- **F1 tripwire fired exactly as designed** (T-119): the rotated styled records diverged from the
  committed component-skin distillations → suite 1608/1609. Rotated the reskin pins via the
  sanctioned judge-free path (`reskin:<s> -- --distill-only --rotate-pins`); church distilled
  byte-identical (guard skip). Suite back to 1609/1609.

## Step 4 — journal + E-12 ✅ (commit `cdf631b`)

- `docs/knowledge/design-learnings.md` gains "First-run generalization (E-30)" after E-29:
  weakest-lens closure, diff-then-fit, pin/registration preconditions, the barn proof's three
  first-contact defects + honest FAIL 12/2, the legacy re-judge, over/under-reach, E-12 handoff.
- `npm test` 1609/1609 green.

## Step 5 — review ✅

- `review.md` written; RDSPI artifacts committed.

## Commit chain

1. `2f3b0a3` gate-instrument receipt (shared same-ruler proof + 6 tests)
2. `7e98254` first-contact chain fixes (census dual, program-exempt seal, all-flagged degrade + 3 tests)
3. `b95c3b8` barn proof (records, receipts, first-ever sheets)
4. `45bca5a` legacy re-judge + RETIRED PINS (50 files)
5. `cdf631b` design-learnings E-30 + E-12 handoff
6. (this commit) RDSPI artifacts
