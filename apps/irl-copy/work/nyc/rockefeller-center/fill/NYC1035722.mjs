// 673 Fifth Avenue, 1930 commercial and office building: a nine-storey Art Deco block in Indiana-style limestone on a
// granite plinth, 28 x 7 blocks. The front (low z, the 28-block face) is the street facade: a shopfront storey with a
// bronze door (x 13) between quartz piers, then eight storeys of pane windows in a three-block rhythm (quartz piers
// every third block, dark polished-deepslate spandrels, a granite lintel over the shops). Lidar roof tiers, smoothed:
// main roof 28, a lower NE wing stepping 22 then 24, a rear setback at 26, and a 30-block crown bay over x 21-27 with
// an oxidised-copper cap. Windows sit one block behind a glass skin with an air gap; a floor slab (spandrel row) runs
// through each gap. Warm glowstone sits in some gaps. No interiors. Two roof penthouses with copper caps.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035722.cells.json`, "utf8"));
const X = 28, Y = 41, Z = 7;

const foot = new Set(cells.map(([x, z]) => `${x},${z}`));
const inFoot = (x, z) => foot.has(`${x},${z}`);
const key = (x, y, z) => `${x},${y},${z}`;

// The top of each column (layers 0..top-1), read from the lidar roof and smoothed into clean tiers.
function top(x, z) {
  if (x >= 20 && x <= 24 && z === 0) return 22;   // NE lower wing
  if (x >= 20 && x <= 24 && z === 1) return 24;   // its step
  if (x >= 21 && z >= 2 && z <= 5) return 30;     // crown bay
  if (z === 6 && x >= 18 && x <= 23) return 26;   // rear setback
  return 28;                                      // main roof
}

// Outward faces of a column at height y: a neighbour that is off the footprint, or lower than y. z-faces first.
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
function facade(x, y, z) {
  return DIRS.find(([dx, dz]) => !inFoot(x + dx, z + dz) || top(x + dx, z + dz) <= y) ?? null;
}

// What one voxel is: a block, or a window (its glass plus the gap behind it, carved to air).
function kind(x, y, z) {
  const h = top(x, z);
  if (y <= 1) return { block: "polished_granite" };                          // plinth and bulkhead
  if (y === h - 1) {                                                        // roof cap / crown
    if (h === 30) return { block: "waxed_oxidized_copper" };
    return { block: x % 3 === 0 ? "chiseled_quartz_block" : "smooth_quartz" };
  }
  const f = facade(x, y, z);
  if (!f) return { block: "calcite" };                                      // solid core
  const [dx, dz] = f;
  const along = dx === 0 ? x : z;
  if (along % 3 === 0) return { block: "quartz_pillar", state: { axis: "y" } };
  if (y === 4) return { block: "polished_granite" };                        // shop lintel
  if ((y - 4) % 3 === 0) return { block: "polished_deepslate" };            // storey spandrel
  const inward = [x - dx, y, z - dz];
  if (dz === -1 && y <= 3) {                                                // shopfront storey on the street face
    if (x === 13) {
      return { block: "iron_door", carve: inward,
        state: { facing: "north", half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
    }
    return { block: "glass", carve: inward };
  }
  const state = dx === 0
    ? { east: "true", west: "true", north: "false", south: "false" }
    : { north: "true", south: "true", east: "false", west: "false" };
  return { block: "gray_stained_glass_pane", state, carve: inward, glow: (x * 7 + y * 5) % 13 === 0 };
}

// Pass 1: classify every footprint voxel, collecting the air gaps behind windows and the glowstone among them.
const grid = [], carve = new Set(), glow = new Set();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  for (let y = 0; y < top(x, z); y++) {
    const k = kind(x, y, z);
    grid.push([x, y, z, k]);
    if (k.carve) carve.add(key(...k.carve));
    if (k.glow) glow.add(key(...k.carve));
  }
}

// Pass 2: place it all in a voxel volume.
const g = new Voxels([X, Y, Z]);
for (const [x, y, z, k] of grid) {
  const id = key(x, y, z);
  if (glow.has(id)) g.set(x, y, z, "glowstone");
  else if (carve.has(id)) continue;                                         // air gap: left empty
  else g.set(x, y, z, k.block, k.state);
}

// The vestibule behind the bronze door hangs a lantern.
g.set(13, 3, 1, "lantern", { hanging: "true", waterlogged: "false" });

// Two roof penthouses, stone-brick boxes with oxidised-copper caps (on the main roof at 28).
for (const x0 of [5, 16]) {
  for (let x = x0; x <= x0 + 2; x++) for (let z = 2; z <= 4; z++) {
    g.set(x, 28, z, "stone_bricks");
    g.set(x, 29, z, "stone_bricks");
    g.set(x, 30, z, "waxed_oxidized_copper");
  }
}

// A lightning rod on the crown bay.
g.set(24, 30, 3, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

const stats = g.save(`${DIR}/NYC1035722.nbt`);
console.log(JSON.stringify(stats));
