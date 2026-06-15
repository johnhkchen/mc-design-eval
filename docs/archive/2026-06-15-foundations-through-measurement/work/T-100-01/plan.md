# T-100-01 kit-aware-gate — Plan

Four commits, each independently green. `npm test` (AJV self-test + `node --test
"src/**/*.test.mjs"`, currently 1199 passing) is the gate for every commit; deterministic
runners re-assert committed records via `--offline`.

## Step 1 — `placed` counters in opening-dressing (Commit A)

1.1 Read `src/view/opening-dressing.test.mjs` for deep-equal assertions on `perOpening` shape
    (T-099 fixture idioms — 17 tests).
1.2 Add `placed: {slot: 0…}` per report in `dressOpenings`, incremented only on the `place()`
    path (never on already-dressed / already-frame skips). Touch points: infill loop, shutter
    loop, lintel/sill loop, door leaves, light. No reordering, no new placements.
1.3 Extend tests: a fresh dressing has `placed === applied` counts where nothing pre-existed;
    an idempotent re-run has `placed` all-zero while `applied` stays full. Adjust any fixture
    that deep-equals a report.
1.4 Verify: `npm test` green; `npm run dress:cottage -- --offline` still passes (committed
    record + artifact untouched by a code-only additive change).

## Step 2 — pure core `src/form/kit-presence.mjs` (Commit B)

2.1 Implement per structure.md: cube half (placementGrammar fixpoint → frame/panel/course rows),
    fixture half (dressOpenings fixpoint → infill/shutter/door/light rows, lintel/sill
    informational), `toleratedConflict`, gap naming, `composeKitAwareVerdict`, skips.
2.2 Unit tests `src/form/kit-presence.test.mjs` on synthetic occupancies (zone-fill `hut()` /
    opening-dressing fixture idioms; injectable cubeSet/vocab so no live-table surprises):
    - **frame missing**: hut with panel-only walls → frame gap names the shipped block and the
      cell count; **frame present**: same hut with frame cells painted (+ a respected declared
      secondary run + a skipped isolate) → frame row passes, tolerated counters recorded.
    - **panel/course missing**: a band field cell carrying a foreign block → `panel:<band>` gap;
      roof cell foreign → course gap; clean hut → both rows pass.
    - **openings**: sealed window → infill + shutter gaps with 1-based indices in the ticket's
      format (`missing: … @ openings 1`); dressed window (fence + trapdoors placed as fixtures)
      → rows pass via idempotence; one-side no-jamb geometry → tolerated, not a gap; door-kind
      aperture undressed → door gap; no door aperture → named skip.
    - **composeKitAwareVerdict matrix**: refusal×(presence pass/fail) → refusal with presence
      reported; decided pass×presence fail → FAIL (cannot pass a missing build); decided
      fail×presence pass → FAIL (cannot replace the judge); pass×pass → PASS; presence
      `ran:false` → aggregate verdict passthrough with reason recorded.
    - **immutability (AC #4)**: `Object.freeze` (deep) the kit entries + record inputs; checker
      runs without throwing and output references no mutated state; no re-extraction call sites
      exist (the module imports no extraction code — assert by API: kit array in === kit array
      compared deep-equal after run).
2.3 Verify: `npm test` green (expect ~+15 tests).

## Step 3 — proof runner + committed proof (Commit C)

3.1 `benchmarks/sculpture/kit-presence.mjs` per structure.md (registry data-only; steps:
    inputs → compose positive → double-run checker on negative+positive → expectations →
    record + md + dressed-artifact fixture; `--offline`).
3.2 `package.json`: `"presence:cottage": "node benchmarks/sculpture/kit-presence.mjs --subject
    cottage"`.
3.3 Run `npm run presence:cottage`. **Empirical checkpoints** (design's named risk):
    - the grammar∘dress positive really reaches `passed: true` — i.e. placementGrammar and
      zoneFill are fixpoints on the composed artifact and dressOpenings re-run is idempotent.
      If reveal-cell fill placements appear: apply the recorded fallback (scope fill-derived
      absences to wall-field/roof cells; out-of-scope placements become a named non-gating row),
      document the deviation in progress.md.
    - the negative names at least: frame (≈181 cells), infill @ openings 1..6, shutters @ the
      geometry-bearing openings (9 of 12 sides; no-jamb sides tolerated). Panels/courses pass.
    - double-run JSON-identical; dressed-artifact AJV-valid; sha recorded.
3.4 Verify: exit 0; `npm run presence:cottage -- --offline` passes; record + md +
    dressed-artifact committed.

## Step 4 — gate wiring + live proof (Commit D)

4.1 Wire `benchmarks/sculpture/multi-angle-gate.mjs` per structure.md (presence inputs from
    deriveZones/policyInShippedPalette context; `kitPresence` + `overall` in record; exit from
    `overall`; md section; additive `--offline` checks; `ran:false` reasons for synthetic-hut /
    prior-fallback zones).
4.2 Live run: `npm run gate:multi -- --subject cottage` (4 renders + ≤4 judge calls,
    precedented). Expected: `kitPresence.passed === false` with the step-3 gap names;
    `overall` FAIL regardless of judge outcome — the recorded proof that the gate cannot pass
    a kit-less build while the resemblance verdicts are still produced and reported (both run).
4.3 Verify: `npm run gate:multi -- --subject cottage --offline` passes on the new record;
    `gatehouse-current.json` (no kitPresence field) still passes `--offline` — no weakening for
    current callers; `npm test` green.
4.4 Commit D: runner wiring + new cottage-current record/md/sheet.

## Step 5 — Review

5.1 `npm test` + all four `--offline` re-assertions (dress, grammar, presence, multi-angle) in
    one final pass; `git status` clean of strays.
5.2 Write `docs/active/work/T-100-01/progress.md` updates throughout steps 1–4 (deviations
    recorded when they happen, not after); finish with `review.md` (changes, coverage, concerns).

## Testing strategy summary

| layer | what | how |
|---|---|---|
| unit (pure) | presence rows, gap naming, tolerated geometry, verdict matrix, immutability | `kit-presence.test.mjs` synthetic occupancies |
| unit (pure) | `placed` counters additive behavior + idempotence | `opening-dressing.test.mjs` |
| integration (deterministic) | proof both ways on committed artifacts; fixpoint risk | `presence:cottage` + `--offline` |
| integration (metered, once) | gate composition on the live judge path | `gate:multi --subject cottage` |
| regression | frozen contracts untouched | full suite + the three pre-existing `--offline` runners |

## Acceptance-criteria map

- AC kit-presence checker, pure, named gaps → Steps 2 (core+tests), 3 (live names recorded).
- AC wired beside the gate, both run/both reported, cannot pass missing / cannot replace judge →
  Step 4 (wiring + live record) + verdict-matrix unit tests.
- AC proof both ways recorded → Step 3 record (negative gaps, positive pass), Step 4 record
  (gate-level negative).
- AC kit immutable at gate time, `npm test` green, no weakening → Step 2 immutability test;
  committed-kit-only inputs everywhere; Step 4.3 regression checks.
