# T-209-01 — Structure: file-level changes

The change is deliberately narrow: one function body in one module, plus tests and a probe. No new module,
no new metric, no signature change — `eaveRingClosure` keeps its parameter list (`coverageFloor` stays;
`openCols` stays).

## Modified

### `src/view/wall-generate.mjs` — `eaveRingClosure` only

Rewrite the body of `eaveRingClosure` (currently lines ~298–329). Public signature unchanged.

```
export function eaveRingClosure(occ, { floor, eaveY, openCols, program, coverageFloor = 0.5 } = {}) {
  guard occ.bounds / eaveY                              // unchanged
  f = floor ?? occ.bounds.min[1]
  yHi = eaveY > f ? eaveY - 1 : eaveY                   // NEW: census below the eave (roof base course)
  cols = {}      // wall-plane cols  floor..yHi   → registration + footprint census
  fullCols = {}  // full band        floor..eaveY  → no-program fallback (unchanged behaviour)
  for each cell in band [f..eaveY]:
     fullCols.add(x,z); if (y <= yHi) cols.add(x,z)
  if cols.size == 0: return 0
  reg = program has rect ? registerRect(program.masses, cols) : null
  if reg && reg.coverage >= coverageFloor && reg.ring.size > 0:
     bb = bboxOf(reg.ring); cx,cz = ring-centre                       // NEW (proud direction)
     present = count ring cols c where:
         cols.has(c) || openCols?.has(c)                              // on-ring / declared-open (unchanged)
         || cols.has(outward-x) || cols.has(outward-z) || cols.has(outward-diag)   // NEW ±1 outward-proud
     return present / reg.ring.size
  // FALLBACK — raw FULL-band perimeter closure, no clamp (BYTE-UNCHANGED from today)
  ring = perimeterColumns(fullCols)
  ... existing openCols-aware closureOf reproduction over fullCols ...
}
```

Key invariants of the edit:

- **`bboxOf` and `perimeterColumns`** already exist in the module (lines 93, 61) — reuse, no new helper.
- **`registerRect` is fed `cols`** (eave-excluded). That is the load-bearing part: the roof prism's base
  course no longer floods the registration, so `reg.coverage` recovers above the 0.5 floor on the real
  build and the footprint path is taken.
- **outward direction** = `Math.sign(x - cx)`, `Math.sign(z - cz)` over the ring's own bbox centre. A
  column on a face has at least one coordinate at an extreme, so the outward step is always defined; a
  centre-line column with `sign==0` checks itself (a no-op), never a false forgive.
- **No double-count of the declared aperture**: the proud branch is reached only when `cols.has(c) ||
  openCols.has(c)` is false, and `present` increments at most once per ring column.
- **Fallback path** keeps using `fullCols` and the existing `closureOf` reproduction verbatim → WG-CS1 /
  WG-CS8 (no-program) readings are byte-identical.

Doc comment updated to state: census on the wall plane below the eave (why: roof prism base course), the
±1-outward-proud tolerance and its gap guard, and the registration-rescaling limitation (full-face loss is
out of scope).

## Added (tests)

### `src/view/wall-generate.test.mjs` — new block "T-209-01 — relief-tolerant closure (S-209, E-54)"

Four fixture tests on **real builds**, plus an integration assertion. Reuse the existing real-build harness
already imported at the top of the file: `artifactOccupancy`, `closeShell`, `buildWallRelief`,
`registerRect`, `T202_PROGRAM`, `T202_PACK`, `T206_SEED`, `T206_EAVE`, `FORM_READY_CLOSURE`. Add a local
helper to assemble the live sequence (close → gable → relief) mirroring `closure-probe.mjs`, and an
extent-preserving reopen.

- **WG-CS15** open colonnade seed → `< FORM_READY_CLOSURE` (T-206 invariant held; ≈0.61).
- **WG-CS16** the live close→gable→relief build (the T-208 proud-dressed batch) → `≥ FORM_READY_CLOSURE`
  (≈0.96) — the 1.000→0.068 collapse gone.
- **WG-CS17** an extent-preserving mid-face reopen of the closed+gabled shell → `< FORM_READY_CLOSURE`
  (≈0.79) — relief over it still reads open (the over-correction guard).
- **WG-CS18** the full `closure-probe.mjs` sequence: assert closure **stays ≥0.9 across
  close_shell→gable→relief** (no collapse at the relief step), and the colonnade seed it starts from is
  <0.9.
- **WG-CS19** integration: `formReadyGate({tool:"relief_walls", closure})` allows on the relieved build,
  and `acceptsBatch(before, after, {closureBefore, closureAfter})` does **not** fire the form-integrity
  guard for the close→...→relief compound (the +20 batch is not rejected as a reopen).

The new fixtures need a small **gable-roof helper** in the test file (the prism the runner applies between
close_shell and relief). Copy the minimal `gableRoof` from `closure-probe.mjs` (it already encodes the
runner's apply_gable_roof) into a test-local helper, or import the probe's logic. Keep it local and PURE.

Existing **WG-CS6, CS10, CS11, CS12, CS13, CS14** are re-run; if eave-exclusion shifts any asserted value
outside its ±0.02 tolerance, update the literal with a one-line rationale (real-fixture diagnostic, not a
frozen pin). Expectation from the prototype: colonnade 0.608 and the bare-ring relief/reopen values are
stable (full-height drops are unaffected by dropping the eave row), so these should stay green as-is.

## Updated (evidence, not code)

### `docs/active/work/T-209-01/closure-probe.mjs` (new — a thin wrapper / re-point)

Add a probe that prints the closure at each stage **under the new metric**, showing
`1.000 → 1.000 → ≥0.9` (the collapse gone), as the deterministic witness for AC4 / the review. Reuse the
T-208 probe's sequence; this is evidence captured into the work dir, not shipped source.

## Not touched

- `src/workshop/climb-gate.mjs` — consumes the scalar; no change (the metric is the single authority).
- `experiments/eval-alignment/picture-climb.mjs` — already calls `eaveRingClosure` with `program`+`openCols`
  at every site; it inherits the fix. No metered re-run required (the change is deterministic; the probe +
  units are the witnesses).
- The frozen instrument, schemas, packs, the fallback path, `closeShell`'s ring-building. Untouched.

## Ordering

1. Edit `eaveRingClosure` (the metric).
2. Run full `npm test`; reconcile any shifted WG-CS literals.
3. Add WG-CS15–19 (real-build fixtures).
4. Add/refresh the probe; capture evidence.
