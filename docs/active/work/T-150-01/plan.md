# T-150-01 Plan — ordered, atomically committable steps

Every step keeps `npm test` green. Cores are byte-identical by default (opt-in), so each commit is safe.

## Step 1 — `generateRoof` gable-end-wall core (AC1)
- Add `gableEndColumns(gable)` (pure, exported); stamp `gableEnd` onto `owner` in `roofHeightfield`.
- In `generateRoof`, honour `opts.gableBlock`: sub-surface end-slice cells → `gableBlock`, collect
  `gableWallKeys`; return it. Covering surface untouched. Absent ⇒ identical.
- **Tests** (roof-generate.test.mjs): material on end-slice, surface unchanged, `gableWallKeys`
  content, hip ⇒ empty, byte-identity off. **Verify:** `node --test src/view/roof-generate.test.mjs`.
- Commit: `feat(T-150-01): gable-end-as-wall in generateRoof (opt-in gableBlock)`.

## Step 2 — zone classification consumes `gableWallKeys` (AC2)
- `zonesFromBands`: optional `gableWallKeys`; in `zoneOf`, wall-band a gable-wall key before the roof
  clause. `structuralZones`: same, base/upper.
- **Tests** (zone-map / structural-read tests): gable-wall key above `upperTop` ⇒ wall band; absent
  ⇒ "roof". **Verify** the two test files.
- Commit: `feat(T-150-01): zone-map classifies gable-end keys as wall, not roof`.

## Step 3 — idiom-registry/steep constructs thread `spec.blocks.gable`
- `roofGableConstruct` + steep construct pass `{ gableBlock: spec.blocks.gable }` to `generateRoof`.
- **Tests** (idiom-registry.test.mjs): a spec with `blocks.gable` yields gable-wall cells; without ⇒
  identical. **Verify.**
- Commit: `feat(T-150-01): roof constructs thread gableBlock through the spec`.

## Step 4 — compile consumes `gableRole` + overhang (AC1/AC3)
- `compileProgram` roof block: `blocks.gable = roleBlock(pack, m.roof.gableRole ?? m.walls.ground.role)`;
  overhang amount `ov` from `pack.proportions?.roofOverhang` (default keeps current 1-cell eave widen,
  byte-identical); when a verge component is carried, widen the gable-axis ends + mark sheet ring.
  Guard to `layout.ridge` gable idioms.
- **Tests** (compile.test.mjs): `blocks.gable` present from gableRole; default footprint byte-identical;
  verge widening present only when pack carries it. **Verify.** Run full suite; regenerate any
  legitimately-changed *non-judge-pinned* compile fixture via its production function.
- Commit: `feat(T-150-01): compile consumes gableRole + pack-carried roof overhang`.

## Step 5 — provision-generate activation (AC1/AC2/AC4)
- Resolve `gableBlock = wallBlockAt(gen.bandFloor)`; pass to `generateRoof`; collect
  `gableWallKeys` into `roofPlan.gableWallKeys`; exclude gable-wall cells from the fascia recolour.
- **Tests** (provision-generate.test.mjs): single-gable fit ⇒ gable-end sub-surface is wall material,
  `roofPlan.gableWallKeys` non-empty, fascia skips them, hollow interior preserved, covering
  byte-identical to the gableBlock-off baseline. **Verify.** Update the module's own unit fixture if it
  asserts the gable cell block (legitimate change for this module).
- Commit: `feat(T-150-01): provision-generate builds gable-end walls + threads gableWallKeys`.

## Step 6 — generated-milestone skin wiring (AC5, operator render deferred)
- Thread `gen.roofPlan.gableWallKeys` into the skin's zone classifier call (`zonesFromBands` /
  `structuralZones`). No re-pin of committed `generated/barn.json` / `pr/assets` here.
- **Verify:** `npm test` green (runner is not in `npm test`; assert no import/typo regressions via a
  `node -e` smoke that imports the runner module if practical, else lint by `node --check`).
- Commit: `feat(T-150-01): generate-first skin dresses gable-end as wall`.

## Step 7 — slope no-regress unit guard (AC2)
- A test that runs `generateRoof` with and without `gableBlock` and asserts the covering subset
  (stairs/slabs/cap positions+states) is byte-identical — the unit-level companion to the GL
  silhouette gate. **Verify.**
- Commit folded into Step 1's test file if cleaner; otherwise its own commit.

## Step 8 — design-learnings + review (AC6)
- `docs/knowledge/design-learnings.md` E-35: the construction-model note.
- `docs/active/work/T-150-01/review.md`: files changed, test coverage, the deferred operator GL step
  (the glance), the ruler-reads-overhang record, open concerns.
- Commit: `docs(T-150-01): construction-model learnings + review`.

## Testing strategy
- **Unit (npm test):** cores (Steps 1-3,7), compile (4), provision (5) — the byte-identity and
  gable-end/covering/overhang contracts. This is the gate.
- **Operator (GL, not npm test):** `npm run generated:barn -- --repro` (byte-identical, judge-free
  via `--skip-gate`) → `npm run diff:roof -- --subject barn` → the `pr/assets` sheet (corrected vs
  prior-flat vs concept). The glance is the proof; named in review.
- **No judge run** (AC5 explicit).

## Verification criteria (Definition of Done)
- `npm test` green; no per-building constants; byte-identity preserved for all callers that don't pass
  the new inputs and for committed judge-pinned records.
- Gable-end cells are wall material + wall zone; covering (slopes+ridge) is roof, byte-unchanged.
- Overhang is pack/recognition-carried, eave + verge, open underside; ruler reading recorded both ways.
- Hollow loft preserved. Learnings + review written.

## Rollback / risk
- Any unexpected committed-fixture churn ⇒ prefer guarding activation so the unit fixture stays
  byte-identical over re-pinning. Never edit judge pins (pin-guard is structural). If the generate-first
  overhang proves entangled, land the compile-path overhang (tested) and name the generate-first
  fitted-overhang wiring as the documented follow-on (honest limitation, Rule 1).
