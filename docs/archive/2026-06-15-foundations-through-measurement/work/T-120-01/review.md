# T-120-01 review — registration-hardening

## What changed (5 commits: 8f1709e, 2c5c5ef, eae0f9c, c8aed30, 1903e66)

**New pure logic (two modules):**
- `src/form/voxel-components.mjs` — `speckVerdict(sizes, total, {speckFraction})` +
  `GLB_SMOKE_SPECK_FRACTION = 0.02`: every non-principal 26-conn component must individually
  be ≤ the declared fraction of total cells; specks are reported (sorted, with fractions) and
  delegated to the standing `shellStage` componentStrip; ANY larger component fails — the
  moai fragmentation class is gated exactly as before, strict above the budget. Empty
  voxelization fails.
- `src/form/registration-smoke.mjs` — the pre-spend smoke. `proxyGeometry` synthesizes the
  lens's occupancy-side inputs from the concept's own row profile (identity-shaped row→layer
  map preserves every material-readability refusal verbatim); the wall/roof split comes from
  a 3-rung ladder (widest-row eave anchor → roof-run bottom counted through
  `fieldResolution` → named `proxy-eave-undecidable` refusal). `registrationSmoke` runs the
  REAL `extractConceptZoneMap` (T-117 rung included), then the kit-extract dry-run
  (`bandRefsFromZoneRecord` + `buildKitPrompt` on an ephemeral zone-record from the lens
  bands — the exact precondition that refused the barn). No I/O in the module: zero spend is
  structural.

**Runners:**
- NEW `benchmarks/sculpture/registration-smoke.mjs` (`npm run registration:smoke`): builds
  the grid exactly as `buildSkin` does, runs the pure smoke, writes
  `registration-smoke.{json,md}` beside the concept through the pin-guard; exit 0/1/2.
- `benchmarks/sculpture/glb-smoke.mjs`: gate moved from `components === 1` to `speckVerdict`
  (raw conn26/conn6 stats stay in the report as evidence); `--record <repo-rel.json>` writes
  guarded fixture records (mkdirs first); the failing path records before exiting.
- `benchmarks/sculpture/trellis-glb.mjs` (CLI main only; `generateGlb` untouched): refuses
  before the POST when a sibling `registration-smoke.json` says fail; absent record →
  note-and-proceed (sculpture subjects have no map; their path is unchanged).
- Both new/changed writers joined the pin-guard conformance PIN_WRITERS list.

**Records (regression fixtures, AC3):**
- `runs/017-…/registration-smoke.{json,md}` — barn concept PASSES post-T-117 (eave via
  anchor; band0 cobblestone, `fieldResolution` engaged; agrees with the committed
  `zone-map/barn.json` derivation). Former deviation 1.
- `glb/smoke/barn@48.json` PASS (one 1-cell speck of 3579, fraction 0.000279);
  `glb/smoke/moai@48.json` FAIL (2 oversize components, largestFraction 0.5213 — the
  control); `glb/smoke/church@48.json` PASS clean (baseline). Former deviation 2.

**Docs:** `docs/knowledge/registration-runbook.md` — the one place for the 8-step flow;
the S-094 checklist gains item 8 (the lens smoke); material-map minting documented as moving
BEFORE TRELLIS (the lens is map-relative; the map is concept-only). One-line pointers from
`provision-concept.mjs` and `glb/README.md`.

## Test coverage

- 20 new unit tests (suite 1581 → **1601/1601**, `npm test` green): 7 for `speckVerdict`
  (both witness shapes, exact-boundary pair, sweep shape, empty, custom budget), 13 for the
  smoke (ladder rungs incl. the resolution-aware roof-run, PASS end-to-end, the barn-shaped
  witness, the synthetic-unreadable `no-field-cells` refusal, proxy/lens stage separation,
  the dry-run's real precondition bite, determinism).
- Conformance tripwire extended to the two new writers (guard import, no sdk-binding, no raw
  record writes — all pass).
- Integration: four committed fixture records from real inputs (zero model spend); the
  trellis ordering probe (failing record refuses before env consultation) run manually,
  results in progress.md.
- **Gaps:** (1) the `kit-dry-run` refusal stage of `registrationSmoke` is defensively coded
  but structurally unreachable from real lens output (readable lens always yields valid
  bands) — tested only via direct `bandRefsFromZoneRecord` assertions; (2) no automated test
  decodes the real barn PNG (suite stays decode-free by design — the committed record + the
  pin-guard's byte-identity refusal on re-runs are the regression surface, the T-117
  precedent); (3) the trellis sibling-gate has no unit test (script main, no test harness for
  runner CLIs in this repo — covered by the manual probe).

## Open concerns for a human reviewer

1. **The proxy upperTop ladder is the one new heuristic.** The barn took rung 1 (a real eave
   anchor) and the rungs are unit-tested, but a future flat-sided subject whose map declares
   no roof-class blocks will refuse `proxy-eave-undecidable` — by design (a smoke must not
   guess), yet it is a new refusal class a future registrar will meet before the lens ever
   runs. The runbook documents it; judge whether the wording is loud enough.
2. **The 2% speck budget is declared, not derived.** Grounded on an order-of-magnitude gap
   (barn worst per-component < 1.87%, moai ≈ 25–48%), but a mesh fragmented into many
   1.9%-shards would pass speck-wise while totaling real debris. `strayCount`/fractions stay
   in every report, so such a mesh is visible; tightening would be a one-constant change.
3. **The trellis gate is advisory-by-absence.** A building registrar who never runs the
   smoke gets only a stderr note (the sculpture path must stay usable). Process (checklist
   item 8 + runbook) closes that hole; mechanism alone cannot distinguish a building PNG
   from a sculpture PNG. If stricter is wanted later: a `--building` flag on trellis-glb
   requiring the record.
4. **Bootstrap reorder is doc-level.** Material-map-before-TRELLIS is recorded in the
   runbook (and is what the smoke's CLI demands in practice); no code enforces the order of
   steps 3↔5 themselves. The next first-run subject (S-121?) is the live validation.
5. The smoke record cross-checks against the barn's committed zone map (same dominants, same
   resolution pairs) — evidence the proxy read is faithful, but n=1 on real concepts. The
   three legacy subjects could be smoke-recorded retroactively for more ground truth (left
   undone: their runs predate the map-first order, and the records would be new pins).

## Hand-off state

Working tree clean for this ticket (all five commits on `main`); `npm test` 1601/1601;
no judge runs, no metered calls, no TRELLIS calls were made during the ticket. Ticket
frontmatter untouched per workflow (Lisa advances phases).
