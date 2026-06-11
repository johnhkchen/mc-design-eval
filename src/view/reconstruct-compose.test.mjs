// Unit tests — reconstruction delta-composition (T-106-01). Synthetic base + reconstruction
// occupancies: the empty diff, each delta kind (changed/added/removed), state-only changes
// (a stair re-facing IS a change), disjoint composition with per-delta stats, the overlap
// TRIPWIRE (throws, names both deltas), the empty-delta passthrough (byte-identical placements —
// the AC's graceful-fallback witness), and serialization determinism (compose twice, same bytes).

import test from "node:test";
import assert from "node:assert/strict";

import { occupancyFromCells, artifactOccupancy } from "./occupancy.mjs";
import { rebuildArtifact } from "./shell-integrity.mjs";
import { occupancyDelta, deltaKeys, composeReconstruction, RECONSTRUCT_SCHEMA } from "./reconstruct-compose.mjs";

const TEMPLATE = { schema_version: "0.3", metadata: { title: "t" }, style: {}, palette: { manifest: [] } };

/** A 3×3×3 stone cube at origin, with overrides applied as {key → cell|null(delete)}. */
function cube(overrides = {}) {
  const cells = [];
  const seen = new Set();
  for (let x = 0; x <= 2; x++) for (let y = 0; y <= 2; y++) for (let z = 0; z <= 2; z++) {
    const key = `${x},${y},${z}`;
    seen.add(key);
    if (key in overrides) {
      if (overrides[key] !== null) cells.push({ pos: [x, y, z], ...overrides[key] });
    } else {
      cells.push({ pos: [x, y, z], block: "stone" });
    }
  }
  for (const [key, cell] of Object.entries(overrides)) {
    if (!seen.has(key) && cell !== null) cells.push({ pos: key.split(",").map(Number), ...cell });
  }
  return occupancyFromCells(cells);
}

const artifactOf = (occ) => rebuildArtifact(occ, TEMPLATE);

// --- occupancyDelta ------------------------------------------------------------------------------

test("occupancyDelta: identical occupancies diff empty", () => {
  const d = occupancyDelta(cube(), cube());
  assert.deepEqual(d, { changed: [], added: [], removed: [], size: 0 });
});

test("occupancyDelta: changed, added, removed each detected; deterministic key order", () => {
  const base = cube();
  const recon = cube({
    "1,1,1": { block: "oak_planks" },                       // changed
    "0,0,0": null,                                           // removed
    "0,3,0": { block: "spruce_slab", state: { type: "bottom" } }, // added (stateful)
  });
  const d = occupancyDelta(base, recon);
  assert.deepEqual(d.changed, [{ key: "1,1,1", from: { block: "stone" }, to: { block: "oak_planks" } }]);
  assert.deepEqual(d.added, [{ key: "0,3,0", to: { block: "spruce_slab", state: { type: "bottom" } } }]);
  assert.deepEqual(d.removed, [{ key: "0,0,0", from: { block: "stone" } }]);
  assert.equal(d.size, 3);
  assert.deepEqual([...deltaKeys(d)].sort(), ["0,0,0", "0,3,0", "1,1,1"]);
});

test("occupancyDelta: a state-only change is a change (stair re-facing)", () => {
  const stair = (facing) => ({ block: "spruce_stairs", state: { facing, half: "bottom" } });
  const d = occupancyDelta(cube({ "1,2,1": stair("north") }), cube({ "1,2,1": stair("south") }));
  assert.equal(d.changed.length, 1);
  assert.deepEqual(d.changed[0].to.state, { facing: "south", half: "bottom" });
  // and key-order-insensitive state signatures do NOT flag a reordered-but-equal state
  const same = occupancyDelta(
    cube({ "1,2,1": { block: "s", state: { a: "1", b: "2" } } }),
    cube({ "1,2,1": { block: "s", state: { b: "2", a: "1" } } })
  );
  assert.equal(same.size, 0);
});

// --- composeReconstruction -----------------------------------------------------------------------

test("composeReconstruction: empty delta list is a byte-identical passthrough", () => {
  const base = artifactOf(cube());
  const r = composeReconstruction(base, []);
  assert.equal(JSON.stringify(r.artifact), JSON.stringify(base));
  assert.deepEqual(r.stats, { perDelta: [], cells: 0 });
  assert.equal(r.touched.size, 0);
});

test("composeReconstruction: disjoint deltas both land, stats per delta, states carried", () => {
  const baseOcc = cube();
  const base = artifactOf(baseOcc);
  const roofRecon = cube({
    "1,2,1": { block: "spruce_stairs", state: { facing: "north", half: "bottom" } },
    "0,2,0": null,
  });
  const headRecon = cube({ "2,0,2": { block: "stone_bricks" } });
  const r = composeReconstruction(base, [
    { name: "roof", delta: occupancyDelta(baseOcc, roofRecon) },
    { name: "shaped", delta: occupancyDelta(baseOcc, headRecon) },
  ]);
  assert.deepEqual(r.stats.perDelta, [
    { name: "roof", changed: 1, added: 0, removed: 1 },
    { name: "shaped", changed: 1, added: 0, removed: 0 },
  ]);
  assert.equal(r.stats.cells, 3);
  const occ = artifactOccupancy(r.artifact);
  assert.equal(occ.block(0, 2, 0), null);                          // roof removal landed
  assert.equal(occ.block(2, 0, 2), "minecraft:stone_bricks");      // shaped change landed
  assert.equal(occ.block(1, 2, 1), "minecraft:spruce_stairs");     // roof stateful change landed
  assert.deepEqual(occ.states.get("1,2,1"), { facing: "north", half: "bottom" });
  assert.deepEqual([...r.touched].sort(), ["0,2,0", "1,2,1", "2,0,2"]);
});

test("composeReconstruction: overlap THROWS naming both deltas — no precedence rule", () => {
  const baseOcc = cube();
  const base = artifactOf(baseOcc);
  const a = occupancyDelta(baseOcc, cube({ "1,1,1": { block: "oak_planks" } }));
  const b = occupancyDelta(baseOcc, cube({ "1,1,1": { block: "stone_bricks" } }));
  assert.throws(
    () => composeReconstruction(base, [{ name: "roof", delta: a }, { name: "shaped", delta: b }]),
    /"roof" and "shaped" overlap on 1 cell.*1,1,1/s
  );
  // malformed delta entries are loud, not skipped
  assert.throws(() => composeReconstruction(base, [{ delta: a }]), /name:string/);
});

test("composeReconstruction: serialization is deterministic (compose twice, same bytes)", () => {
  const baseOcc = cube();
  const base = artifactOf(baseOcc);
  const recon = cube({ "0,3,0": { block: "spruce_slab", state: { type: "bottom" } }, "2,2,2": null });
  const deltas = [{ name: "roof", delta: occupancyDelta(baseOcc, recon) }];
  const r1 = composeReconstruction(base, deltas);
  const r2 = composeReconstruction(base, deltas);
  assert.equal(JSON.stringify(r1.artifact), JSON.stringify(r2.artifact));
  // and the composed artifact re-diffs to exactly the input delta (round trip — diffed against
  // the base ARTIFACT's occupancy, since rebuildArtifact namespaces block ids on emission)
  const d = occupancyDelta(artifactOccupancy(base), artifactOccupancy(r1.artifact));
  assert.equal(d.size, 2);
});

test("schema constant exported for record provenance", () => {
  assert.equal(RECONSTRUCT_SCHEMA, "reconstruct-compose/v1");
});
