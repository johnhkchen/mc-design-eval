// 1900 N St NW: a 1960s-70s Modernist office block on a polished-granite base, with a limestone-white
// precast frame, mullioned tinted glass and a stepped tower over a podium (lidar: 1 / 11 / 14 blocks).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC62032.cells.json", "utf8"));

// lidar roof heights smoothed into three flat tiers: a terrace (1), the podium (11), the tower (14)
const tier = (r) => (r <= 2 ? 1 : r <= 12 ? 11 : 14);
const R = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, T: tier(r) }]));
const has = (x, z) => R.has(`${x},${z}`);
const boundary = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

// storey lines: floor slabs at 3, 6, 9, 12; window bands in the rows between
const SLAB = new Set([3, 6, 9, 12]);
const WIN = new Set([1, 2, 4, 5, 7, 8, 10, 11]);
const ENTRY = [5, 0];   // the door bay on the north face
const g = new Voxels([10, 26, 10]);

for (const [key, { g: ground, T }] of R) {
  const [x, z] = key.split(",").map(Number);
  const edge = boundary(x, z);
  const entry = x === ENTRY[0] && z === ENTRY[1];
  for (let y = 0; y < T; y++) {
    // foundation: solid from y 0 up to this cell's ground
    if (y < ground) { g.set(x, y, z, edge ? "polished_granite" : "stone_bricks"); continue; }
    // the terrace: a one-block plinth that is the roof
    if (T === 1) { g.set(x, y, z, "polished_granite"); continue; }
    if (!edge) {
      // interior: an air gap, a floor slab per storey, and the roof membrane on top
      if (y === T - 1) g.set(x, y, z, "gray_concrete");
      else if (y === 0 || SLAB.has(y)) g.set(x, y, z, "smooth_quartz");
      continue;
    }
    // exterior shell
    if (y === 0) {
      if (entry) g.set(x, y, z, "polished_granite_stairs", { facing: "south", half: "bottom", shape: "straight", waterlogged: "false" });
      else g.set(x, y, z, "polished_granite");   // base course
      continue;
    }
    if (y === T - 1) { g.set(x, y, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" }); continue; }   // cornice
    if (entry && y === 3) { g.set(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" }); continue; } // door canopy
    if (SLAB.has(y)) { g.set(x, y, z, "smooth_quartz"); continue; }                                              // storey line
    if (!WIN.has(y)) continue;
    if (entry && y <= 2) {
      const door = { facing: "south", hinge: "left", open: "false", powered: "false" };
      g.set(x, y, z, "dark_oak_door", { ...door, half: y === 1 ? "lower" : "upper" });
      continue;
    }
    // the bays: a mullion every other bay, glass between; ground floor is shopfront glass
    if ((x + z) % 2 === 0) g.set(x, y, z, "polished_andesite");
    else g.set(x, y, z, y <= 2 ? "glass" : "light_blue_stained_glass");
  }
}

// warm lamps: on the floor of a few rooms behind the windows, standing on the slab (nothing floats)
for (const [key, { T }] of R) {
  const [x, z] = key.split(",").map(Number);
  if (!boundary(x, z) || T === 1) continue;
  const inward = [];
  if (!has(x + 1, z)) inward.push([-1, 0]);
  if (!has(x - 1, z)) inward.push([1, 0]);
  if (!has(x, z + 1)) inward.push([0, -1]);
  if (!has(x, z - 1)) inward.push([0, 1]);
  for (const [dx, dz] of inward) {
    const ix = x + dx, iz = z + dz;
    if (!has(ix, iz) || boundary(ix, iz)) continue;
    for (const floor of [0, 3, 6, 9]) {
      if (floor >= T - 1 || (x * 7 + z * 3 + floor) % 5 !== 0) continue;
      const wy = floor + 1;
      if (wy >= T - 1 || (x + z) % 2 === 0) continue;
      g.set(ix, wy, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// roof plant: one 2 x 2 x 2 mechanical unit on the tower's roof, set back from the parapet
for (const x of [3, 4]) for (const z of [3, 4]) for (const y of [14, 15]) g.set(x, y, z, "light_gray_concrete");

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC62032.nbt");
console.log("cells", R.size, "blocks", g.count());
