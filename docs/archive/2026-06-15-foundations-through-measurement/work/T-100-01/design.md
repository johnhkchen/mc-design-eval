# T-100-01 kit-aware-gate — Design

## The problem, sharpened by research

A presence checker over "frame block on the frame lines, panel block in the fields, course block
on the roof, fence + shutters at each opening" cannot be naive equality:

- Frame lines legitimately carry **respected** declared-secondary runs (chimney cobble), **adopted**
  donor blocks (line continuity), and **skipped isolates** (live cottage: 181 of 321 cells painted,
  the rest honest reductions). Demanding 100% frame block fails the grammar's own output.
- Shutters legitimately miss where there is **no jamb** (3 of 12 sides on the live cottage —
  floating panes). Demanding 12/12 fails the dressed positive.
- The artifact is in **shipped space** (value-true substitution ∘ kit overrides): band0's panel
  binds stone_bricks but ships as tuff. Demanding the named kit block fails on naming (the
  `reproducibility-excludes-gl-from-decisions` trap).
- The committed dressed cottage (`dress-openings/cottage/artifact.json`) was dressed over the
  durable skin, **not** over the grammar output — no committed artifact contains the full kit.

## Options considered

### O1 — Per-site census with thresholds

For each feature, count sites carrying the expected block; pass at a threshold (e.g. coverage's
0.5). **Rejected**: introduces magic fractions per feature class; cannot distinguish "65% because
the skin never framed anything" from "65% because chimney + isolates are tolerated"; the tolerated
geometry would be re-encoded as numbers and drift from the ops that define it.

### O2 — Ask the judge to enumerate (prompt extension)

Add "check for trapdoor shutters" to the v2 judge prompt. **Rejected outright**: image-shaped —
the exact fooled-gate lineage (E-22/E-24/E-25) this ticket exists to break; non-deterministic;
violates Rule 5 (frozen prompt); and the ticket demands a deterministic checker.

### O3 — Validate the committed grammar/dress RECORDS

Read `placement-grammar/<s>.json` + `dress-openings/<s>.json` and assert their counters.
**Rejected**: records describe a *past run on some artifact*, not the artifact at gate time; the
gate must be "deterministic over the artifact + structural read" (AC #1). A gate that trusts a
record can be fed a record from a different build.

### O4 — Fixpoint check: "the supplying op has nothing left to supply" ← CHOSEN

A kit entry is *present at its grammar sites* iff re-running the pure op that supplies it, over
the artifact under test, is a **no-op at those sites**:

- **frame / panels / course** — run `placementGrammar(occ, {kit, bandNames, policy, zoneOf,
  floorLines, upperTop, roofKeys, sub})` (the committed kit + the recorded shipped policy):
  - frame missing ⇔ `frame.painted + frame.adopted > 0` (cells the grammar would still paint).
    `respected`, `alreadyFrame`, and `skippedIsolated` are satisfied/tolerated *by the same logic
    that defines them* — no re-encoding.
  - panel/course missing ⇔ `fill.placements` land in that zone (band → panel gap, roof → course
    gap). zoneFill is a fixpoint on its own output (paints only exposed cells not carrying the
    dominant or a kept preserve run), so the grammar output passes and anything the fill would
    still repaint is a named absence.
- **fence infill / shutters / door / light** — run `dressOpenings(occ, apertures, treatments)`
  with `treatmentsFromKit(kitRec)` and `extractApertures(refOcc)` (the concept-declared openings,
  the T-099/E-25 source of truth — a sealed build has no detectable openings to demand at):
  - slot missing at opening *i* ⇔ the re-run would place that slot there (placements > 0 for it);
    `alreadyDressed` and TOLERATED conflicts (`shutter-no-jamb-*`, lintel/sill geometry rows) are
    satisfied/tolerated. dressOpenings is idempotent by design (module header; placeAtPane skips
    same-fixture cells), so the dressed positive passes.

**Why chosen**: zero new thresholds; the demand *is* the supply — site logic cannot drift from
T-098/T-099 because it is T-098/T-099; tolerated geometry is inherited, not duplicated; honest
named gaps fall out of the per-opening/per-feature structure ("missing: spruce_trapdoor shutters
@ openings 3/4"); deterministic and pure end-to-end. This is the fifth-why made structural: the
gate enumerates by running the enumerators.

**Risk + mitigation**: if zoneFill turns out not to be a fixpoint on the dressed-positive
artifact (re-opened panes exposing unskinned reveal cells), the panel/course absence test gets
false positives. Research argues this cannot happen (the durable skin's exposure fill already
skinned interior-exposed cells of the hollowed build; dressing only turns pane cells non-solid).
The implementation step "compose the positive and run the checker" verifies this empirically
before anything is wired; the recorded fallback is to scope fill-derived absences to *wall-field
and roof-surface cells only* (still threshold-free) and record any out-of-scope placements as a
named non-gating row.

## The verdict composition (AC #2)

New pure function `composeKitAwareVerdict(aggregate, presence)`:

- `aggregate` is the untouched `multi-angle-gate/v1` aggregate (REFUSE/DECIDE — frozen, no edits
  to `aggregateMultiAngle` or the verdict vocabularies).
- returns `{schema: "kit-aware-gate/v1", passed, components: {resemblance, kitPresence}, reasons}`:
  - resemblance REFUSAL → overall refusal (still no pass/fail), kit presence **still reported**.
  - decided: `passed = aggregate.passed && presence.passed` — the kit check cannot be passed
    around (a missing-ingredient build fails even on 4× "same object") and cannot replace the
    judge (a fully-kitted build still fails on a drifted verdict).
  - presence skipped (no kit record — synthetic-hut): overall = aggregate, skip recorded. A
    subject *with* a kit record never skips.

Not a T-088-style short-circuit: the judge runs regardless of presence outcome (both run; both
reported). Rejected alternative — folding presence into `aggregateMultiAngle` as a fifth view or
a failure row: would change a frozen pure contract and break `--offline` re-assertion of the five
committed multi-angle records.

## Immutability (AC #4, E-26 Rule 2)

The checker takes the **committed kit record as given**: binding via `bindKit`/`treatmentsFromKit`
verbatim (same ranking, same `usable` flag rule), no re-extraction, no re-ranking, no mutation
(unit test deep-freezes the kit input). The friendlier-kit attack — re-extracting until the check
passes — is structurally impossible at gate time because the gate's only kit input is the
committed `kit/v1` file, sha-recorded in the gate record.

## Proof both ways (AC #3)

A dedicated deterministic runner (`benchmarks/sculpture/kit-presence.mjs`, no GL, no LLM):

- **negative** — `durable-skin/cottage/artifact.json` (the kit-less cottage): expect named gaps —
  frame (181 paintable frame-line cells), trapdoor shutters @ all geometry-bearing openings,
  fence infill @ openings 1..6. Panels/courses present (the skin's zone dominants are the shipped
  panel blocks) — recorded as passing rows, which is honest: the skin supplied them.
- **positive** — the full-pipeline composition, built in memory and committed as a fixture:
  `placement-grammar/cottage/artifact.json` (frame+fields+courses) ∘ `dressOpenings` (fence,
  shutters) → `kit-presence/cottage/dressed-artifact.json`. Expect zero gaps. This is not a
  synthetic stand-in — it is the recorded pipeline order (durable-skin → grammar → T-099)
  actually composed.
- Double-run determinism (sha-recorded), `--offline` re-assertion — the E-24 Rule 2 idiom.

Then the gate wiring proof: one live `gate:multi --subject cottage` run (4 renders + ≤4 judge
calls — precedented cost): record gains `kitPresence` (FAIL, named gaps) + `overall` (FAIL even
where the judge says same-object). The dressed positive through the *full* gate is **not**
claimed: memory says obliques fail the resemblance judge on roof form — and that is the point of
AC #2's second clause (kit pass must not override judge fail). The kit-presence PASS for the
dressed artifact is proven in the kit-presence record.

## Where things live

- `src/form/kit-presence.mjs` — pure core (kitPresence + composeKitAwareVerdict + gap naming).
  Sits beside placement-grammar.mjs/multi-angle-gate.mjs; imports view ops the same way the
  grammar does. `kit-presence/v1` schema tag.
- `src/form/kit-presence.test.mjs` — unit tests on synthetic occupancies (the hut()/fixture
  idioms from zone-fill and opening-dressing tests).
- `benchmarks/sculpture/kit-presence.mjs` — impure proof runner (registry-driven, data-only
  subject defs reusing durable-skin SUBJECTS paths; E-25 Rule 3: no subject branches).
- `benchmarks/sculpture/multi-angle-gate.mjs` — wiring: load skin record + ref build, run the
  pure checker, add `kitPresence` + `overall` to the record/md/exit code; `--offline` checks
  extended additively (old records without `kitPresence` stay valid — no weakening, no breaking).
- npm scripts: `presence:cottage` (+ gatehouse later; gatehouse's grammar artifact exists —
  registry covers it, proof runs target cottage per the AC).

## What is explicitly out of scope

- Door-opening detection for the cottage (doorway is not a through-hole — S-101's detector gap;
  the checker records the named skip exactly as T-099 did).
- Any change to `aggregateMultiAngle`, the v1/v2 verdict schemas, judge prompts, or thresholds.
- Re-running durable-skin/grammar/dress pipelines; all inputs are committed records/artifacts.
