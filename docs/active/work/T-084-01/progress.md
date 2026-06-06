# Progress — T-084-01 surface-coherence-ops

## Completed

- **Step 1 — enabling exports.** `src/view/surface-grid.mjs`: `orthoSpec(dir)` (throws on diagonal) +
  `cellWorldPos(occ, spec, u, v, w)` (grid cell → world pos; round-trip tested against `projectOrtho`).
  `src/view/structural-read.mjs`: exported `airComponents`. Tests extended in both. Commit
  `surface-grid + structural-read seal-enabling exports`.
- **Steps 2–5 — pure ops.** `src/view/surface-coherence.mjs` + `.test.mjs`: `sealRoof`, `sealWallFace`,
  `sealWalls`, `watertightCheck`, `applyDeltas`, `overlay`, `roofOutlineCoverage`. 17 unit tests
  (synthetic occupancy) including the AC's "holed shell seals; strays strip; breached shell fails", an
  integration seal-compose test, the 3-D-breach-vs-projection test, and a no-API-key/GL source guard.
  Commit `surface-coherence pure ops`.
- **Step 6 — live cottage runner.** `benchmarks/sculpture/surface-coherence.mjs` + `coherence:cottage`
  npm script. Ran live: metered light-tier detectors (`claude-haiku-4-5`) + GL renders; wrote report,
  sealed artifact, before/after PNGs. Commit `live cottage surface-coherence run + speck-intrusion`.

`npm test` green at **916** throughout (was 896 at ticket start).

## Cottage results (`surface-coherence-report.json`)

- **Roof op:** field `spruce_planks`; **62 strays stripped → 0**, **1 enclosed hole filled**, outline
  **coverage 0.793 → 1.0**. AC met (roof 100% in one material, strays 0).
- **Wall-skin op:** **100 embedded-speck intrusions stripped**, **8 skin holes sealed → 0** across the four
  elevations. Intrusion + skin-hole counts down to 0 (per-face in the report).
- **Watertight check:** **false → false** — interior void 3625 cells, 2507 still reachable from outside.
  Honest pass/fail recorded (AC asks for the verdict, not a guaranteed pass). The cottage is an open
  building (doors/windows/large gaps), so it is NOT a sealed container yet; the 8 *enclosed-silhouette*
  skin holes the detector flagged are sealed, but the large 3-D openings remain — exactly the signal
  T-080-01 needs: **seal-authoring (strong tier) must close the real openings before hollowing.**

## Deviations from plan (documented per workflow rule)

1. **Watertight interior definition changed during Step 2.** The plan/design said "interior = the enclosed
   mass, treated as air". Implementing it surfaced that the **enclosed mass is tautologically sealed** — an
   all-6-neighbours-occupied cell can only be reached through other enclosed cells, which form a region
   always wrapped in a non-enclosed skin, so a breach can *never* make it leak. Replaced the leak-detection
   interior with **6-ray containment** on the (optionally carved) occupancy: an air cell is interior iff all
   6 axis rays hit occupied. Ray-based (not connectivity-based) so a single hole stays detectable instead of
   silently erasing the enclosed-pocket signal. The carve step is kept only to expose a solid build's
   interior. Unit tests pin both a solid box and a hollow box (intact → pass, breach → fail, reseal → pass).
2. **Wall intrusion = embedded speck, not "every non-dominant cell".** The first cottage run blanket-stripped
   **1548** wall cells to the dominant — destroying the intentional Tudor polychrome (stone_bricks ~40%,
   spruce_planks, cobblestone, dark_oak framing). Redefined an intrusion as a non-field cell whose **strict
   majority of present 4-neighbours are the field** (an isolated "random home"), which preserves coherent
   material bands and strips only specks: **1548 → 100** on the cottage. The roof op intentionally stays
   blanket-strip (its AC explicitly wants a *uniform* roof). `fieldMaterial`/`strip` overrides let a future
   wall-intrusion detector scope it further.

## Known limitations (handed to Review)

- Projection-based seals fix **silhouette** strays/holes; a 3-D breach hidden behind far geometry (the floor
  backing a roof gap) is **not** a projection hole — the watertight *check* surfaces it but the seal ops do
  not close it. Pinned by an explicit unit test; flagged for the strong-tier seal-authoring op.
- The wall op has no dedicated detector wiring yet (T-082 shipped roof-patch + hollowable, not a
  wall-intrusion detector); the cottage run uses the deterministic speck heuristic, which is conservative
  but unscoped. Wiring a detector's intrusion set into `strip` is a one-call change.
