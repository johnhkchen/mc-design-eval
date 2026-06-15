# T-100-01 kit-aware-gate — Structure

## Files

| file | change | role |
|---|---|---|
| `src/form/kit-presence.mjs` | **new** | pure core: presence checker + verdict composition + gap naming |
| `src/form/kit-presence.test.mjs` | **new** | unit tests (synthetic occupancies, fixture kits) |
| `src/view/opening-dressing.mjs` | **modify (additive)** | per-slot `placed` counters in perOpening reports |
| `src/view/opening-dressing.test.mjs` | **modify** | cover `placed`; adjust any deep-equal fixtures |
| `benchmarks/sculpture/kit-presence.mjs` | **new** | impure proof runner (no GL, no LLM) |
| `benchmarks/sculpture/kit-presence/` | **new (generated)** | `cottage.{json,md}` + `cottage/dressed-artifact.json` (committed) |
| `benchmarks/sculpture/multi-angle-gate.mjs` | **modify** | wire presence beside the gate; `kitPresence` + `overall` in record/md/exit/offline |
| `package.json` | **modify** | `presence:cottage` script |

No changes to: `src/form/multi-angle-gate.mjs` (frozen pure contract), `src/form/kit.mjs`,
`src/form/placement-grammar.mjs`, durable-skin/grammar/dress runners, schemas, config.

## `src/view/opening-dressing.mjs` — the one additive change

`dressOpenings` perOpening reports gain `placed` beside `applied`:

```
report = { ..., applied: {slot: n}, placed: {slot: n}, conflicts: [...] }
```

- `applied[slot]` (unchanged) counts *satisfied* cells — new placements AND already-dressed skips.
- `placed[slot]` (new) counts only NEW placements (`place()` returned true). For lintel/sill,
  recolors count as placed; already-frame cells do not.
- Door/light: `placed.door` counts leaves whose cells actually placed (vs idempotent re-run),
  implemented by checking the `placeAtPane`/`place` path taken. Internal helpers thread a
  `(slot)` tag where needed; no behavior, ordering, or placement change — byte-identical
  placements for all existing callers (the dress runner's committed sha must still re-assert).

## `src/form/kit-presence.mjs` — public interface

```js
export const KIT_PRESENCE_SCHEMA = "kit-presence/v1";
export const KIT_AWARE_GATE_SCHEMA = "kit-aware-gate/v1";

// T-099's acceptance predicate, shared semantics: geometry constraints, not dressing failures.
export const toleratedConflict = (c) =>
  (c.slot.startsWith("shutter") && c.name.startsWith("shutter-no-jamb")) ||
  c.slot === "lintel" || c.slot === "sill";

export function kitPresence(occ, {
  kit,                       // kit/v1 entries — IMMUTABLE input (never re-ranked, never mutated)
  bandNames, policy, zoneOf, // shipped-space zone policy (skin record / derived zones)
  floorLines, upperTop, roofKeys,
  sub,                       // named→shipped renaming (value-true substitution ∘ kit overrides)
  apertures,                 // extractApertures(refOcc) — concept-declared openings
  treatments,                // treatmentsFromKit(kitRecord)
  minRun,
}) → {
  schema, passed,
  checks: [...],             // one row per feature/slot (see below)
  gaps: ["missing: …"],      // named absences, gating only
  skips: [{feature, reason}],// no-candidate bindings, no door apertures, …
  grammar: {frame, fill, bindings},   // the fixpoint evidence (counters, not placements)
  dressing: {stats, perOpening},      // ditto
}

export function composeKitAwareVerdict(aggregate, presence) → {
  schema: KIT_AWARE_GATE_SCHEMA,
  decided, refusal?,
  passed?,                   // decided: aggregate.passed && presence.passed (when presence ran)
  components: {
    resemblance: {decided, passed?, refusal?},
    kitPresence: {ran:true, passed, gaps} | {ran:false, reason},
  },
}
```

### Internal organization (three checks + composition)

1. **Cube half — `placementGrammar` fixpoint.** Run the T-098 pure grammar verbatim over `occ`
   with the committed kit. Derive:
   - `frame` row: `missing = frame.painted + frame.adopted`; `tolerated = {respected,
     skippedIsolated}`; `satisfied = alreadyFrame`; sites = `counts.cornerPost + counts.roofline
     + counts.floorLine`. Gap: `missing: <shipped.frame> frame @ <missing>/<sites> frame-line cells`.
   - `panel:<band>` / `course` rows: bucket `fill.placements` by `zoneOf(pos)` — counts per band
     → panel gaps; roof zone → course gap. Zero-bucket rows are passing rows.
   - `bindings.skipped` → `skips` (a kit with no trim-tagged cube yields a recorded skip, not a
     crash — the runner/gate decides whether a skip is acceptable; for subjects with full kits it
     simply doesn't occur).
2. **Fixture half — `dressOpenings` fixpoint.** Run T-099's pure op verbatim over `occ` with the
   concept-declared apertures + kit treatments. Openings numbered 1-based in aperture order
   (deterministic — extractApertures order). Per slot family, gating rows:
   - `infill`: missing at opening *i* ⇔ `placed.infill > 0` there. Gap aggregated across
     openings: `missing: <block> infill @ openings 1/2/5`.
   - `shutters`: missing side ⇔ `placed.shutterLeft|Right > 0`; `toleratedConflict` rows
     (no-jamb) are tolerated, other conflicts (blocked, no-treatment) are gaps. Gap:
     `missing: <block> shutters @ openings 3/4`.
   - `door`/`light`: gating the same way when a door-kind aperture exists; the cottage's
     none-detected case lands in `skips` with the T-099 honesty wording.
   - `lintel`/`sill`: **informational rows, non-gating** (geometry-dependent frame recolor; the
     frame-line check is the frame's gate; AC enumerates fence + shutters at openings).
3. **Gap naming.** One helper builds the `missing: <shipped block> <slot label> @ <site list>`
   strings; checks rows carry the structured equivalent so consumers never parse strings.
4. **`composeKitAwareVerdict`** — pure table over (aggregate.decided/refusal/passed) ×
   (presence ran/passed): refusal stays refusal (presence still reported); decided AND; skip
   passes through the resemblance verdict with `ran:false` recorded.

Purity: imports only pure modules (`placement-grammar.mjs`, `opening-dressing.mjs`, `occupancy
.mjs`); no I/O beyond opening-dressing's committed-vocab idiom (already test-glob-safe).

## `benchmarks/sculpture/kit-presence.mjs` — proof runner

Registry (data only): `cottage: {key, negative: "durable-skin/cottage/artifact.json", grammar:
"placement-grammar/cottage/artifact.json", ref: "concept-materials/cottage/after-artifact.json",
kit: "kit/cottage.json", skinRecord: "durable-skin/cottage.json"}`.

Steps (all deterministic; a failed expectation exits 1, the record says so):
1. Load inputs; `assertArtifact` on artifacts; kit schema check; bandNames from
   `skinRec.zoneMap.bands`, policy from `skinRec.fill.policy`, `sub` from
   `valueTrue.substitution ∘ kit.overrides`, geometry from `structuralZones`, zoneOf from
   `zonesFromBands` — exactly the grammar runner's composition.
2. Compose the **positive**: `dressOpenings(grammarOcc, apertures, treatments)` →
   `applyDressing(grammarArtifact, placements)` → `assertArtifact` → write
   `kit-presence/cottage/dressed-artifact.json` (committed; sha recorded).
3. `kitPresence` on negative and positive; **double-run** each, JSON-identical or hard fail.
4. Expectations: negative `passed === false` with gaps covering ≥ {frame, infill, shutters};
   positive `passed === true` (zero gaps). Mismatch → exit 1.
5. Write `kit-presence/cottage.{json,md}`; `--offline` re-asserts record schema, expectation
   flags, and the committed dressed-artifact sha.

## `benchmarks/sculpture/multi-angle-gate.mjs` — wiring (order of edits)

1. Presence inputs assembled after `deriveZones`/`policyInShippedPalette`: when `def.kitRecord`
   exists AND `derived.source === "concept"` → load kit entries, ref artifact (`def.build`),
   compute apertures/treatments, run `kitPresence` with `zonesShipped` as policy and the same
   `ship` mapping. Otherwise `kitPresence = {ran:false, reason}` (synthetic-hut: "no-kit-record";
   prior-fallback zones: "no-concept-bands").
2. `record.kitPresence` (full result incl. gaps) and `record.overall =
   composeKitAwareVerdict(aggregate, presence)`.
3. Exit code from `overall` (0 pass / 1 fail / 2 refusal) — for kit-less subjects identical to
   today's `aggregate`-derived code (no weakening, no behavior change for current callers).
4. Markdown gains a "Kit presence (T-100)" section: per-check table + gap lines.
5. `--offline`: additive checks — when `rec.kitPresence?.ran`, assert `rec.overall` consistency
   (decided ⇒ `overall.passed === (aggregate.passed && kitPresence.passed)`); records without
   the field (gatehouse, synthetic, pre-T-100) remain valid as-is.

## Ordering

1. **Commit A** — opening-dressing `placed` counters + tests green (additive, sha-stable).
2. **Commit B** — kit-presence pure core + unit tests.
3. **Commit C** — proof runner + npm script + committed proof records/fixture (`presence:cottage`
   run live, deterministic).
4. **Commit D** — multi-angle gate wiring + one live `gate:multi --subject cottage` run
   (records re-committed) + offline assertions for dress/grammar records re-verified.
