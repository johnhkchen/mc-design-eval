# T-097-01 fixture-path-proof — Progress

- [x] Step 1 — state-id decoder (render/src/version.mjs) — commit `state-id decoder`
- [x] Step 2 — fixture card pure module + tests — commit `fixture test-card` (suite 1129→1140)
- [x] Step 3 — occupancy third class — commit 70ed8b6 (suite 1146)
- [x] Step 4 — dressed-opening semantics — commit 2879d55 (suite 1156)
- [x] Step 5 — runner + committed regression reference — final commit (suite 1156 green)

## Log

- 12:58p Research/Design/Structure/Plan artifacts written. No sibling session on this ticket.
- 1:00p Step 1: decodeIndices shared radix walk; stateProps/decodeStateId exported. Manual
  round-trip verified for all 12 card state shapes (trapdoor/fence/stairs/slab/door/lantern/stone).
- 1:04p Step 2: 25-row CARD_ROWS; live-gate pin + per-row encode→decode round-trip in unit suite.
- 1:07p Step 3: forms/states sparse maps; solidOccupancy identity for cube-only builds; suite green
  with zero consumer changes (back-compat held as designed).
- 1:12p Step 4: openings on the solid view + dressing annotation; closureCheck solid-only skin +
  dressed tally; strayFixtures; rebuild paths (componentStrip/plugClosure/rebuildArtifact) carry
  forms/states. One test-data fix: a "stray" fence initially REPLACED a wall cell (last-write-wins)
  and legitimately opened a hole — moved to the wall's exterior.
- 1:20p Step 5: ladder passes (gate / 349 placed, unmapped 0 / 25/25 read-back / 5 renders @1024).
  Eyeball check per family (close-up renders): trapdoors, fences, slabs (front view disambiguates
  top/bottom), doors, lanterns all correct. **Deviation/discovery: NO stair block renders at any
  state (probed oak, stone_brick, cobblestone; default + explicit states) — prismarine-viewer
  1.33.0 mesher gap. Placement proven by read-back; recorded as a NAMED RESIDUAL in the runner
  record/md rather than gating on pixels (plan's fallback path).**
- 1:22p A sibling session added challenge:* npm scripts to package.json mid-flight; my card:fixtures
  line coexists (no conflict).

## Deviations from plan

1. Step 1's durable decoder unit tests landed with Step 2's test file as planned (one-off manual
   verification recorded above bridged the gap).
2. Stray-fixture test data corrected (exterior mount, not wall replacement) — semantics unchanged.
3. Render resolution raised to 1024² for the committed reference (512 default too small to judge
   orientation).
