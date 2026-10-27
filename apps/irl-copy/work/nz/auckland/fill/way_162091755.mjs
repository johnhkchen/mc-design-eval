// Way 162091755, Mt Eden / Eden Terrace: a three-storey Edwardian brick commercial block on a stone plinth, with
// a lower wing to the south (downhill) and a shopfront on the north (street) face. The building is a hollow shell:
// 1-block brick walls, floor slabs per storey, air inside; windows are glass in the wall plane with air behind.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162091755.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..16, z 0..22
const SAVE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162091755.nbt";
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const key = (x, z) => `${x},${z}`;

// 1. Columns. The lidar roof is noisy: snap it to two flat tiers (the main block at 12, the south wing at 11), keeping the
//    small 8 at the NW corner as a real setback. top = the index of the column's top block (roof height - 1).
const C = new Map();
for (const [x, z, ground, roof] of cells) {
  const tier = roof <= 8 ? roof : z <= 13 ? 12 : 11;
  C.set(key(x, z), { x, z, g: ground, D: tier - 1, open: [], ext: [] });
}
const at = (x, z) => C.get(key(x, z));
for (const c of C.values()) {
  for (const [d, [dx, dz]] of Object.entries(DIRS)) {
    const n = at(c.x + dx, c.z + dz);
    if (!n) c.open.push(d);                       // the outside of the building: a facade
    if (!n || n.D < c.D) c.ext.push(d);           // a facade, or a step down to a lower tier: a wall
  }
  c.wall = c.ext.length > 0;
  // floor lines: the ground floor on the ground, then 3-block storeys, the top storey under the roof deck
  const F = [c.g];
  if (c.g + 3 <= c.D - 3) F.push(c.g + 3);
  if (c.D - 3 >= F[F.length - 1] + 3) F.push(c.D - 3);
  c.F = F;
}

// 2. Overrides: the shopfront and door on the north face, the south door on the wing, lanterns behind some windows,
//    roof plant on the main block.
const DOORS = new Map([[key(5, 1), "N"], [key(9, 22), "S"]]);   // cell -> the face the door is on
const EQUIP = new Set([key(6, 5), key(7, 5), key(6, 6), key(7, 6), key(10, 9), key(11, 9), key(10, 10), key(11, 10)]);

const storeyOf = (c, y) => {
  // the storey (air between two floor lines) that holds row y, or null on a floor / the foundation / the roof
  for (let i = 0; i < c.F.length; i++) {
    const lo = c.F[i], hi = i + 1 < c.F.length ? c.F[i + 1] : c.D;
    if (y > lo && y < hi) return { i, lo, hi };
  }
  return null;
};

// lanterns in the interior air, hung under the floor above, behind some of the windows
const lamps = new Set();
for (const c of C.values()) {
  if (!c.wall || !c.open.includes(c.ext[0])) continue;
  const d = c.ext[0], [dx, dz] = DIRS[d];
  for (let y = c.g + 1; y < c.D; y++) {
    const s = storeyOf(c, y); if (!s || y !== s.hi - 1) continue;
    const a = d === "N" || d === "S" ? c.x : c.z;
    if (a % 6 !== 2 + s.i % 2) continue;
    const q = at(c.x - dx, c.z - dz);
    if (q && !q.wall) lamps.add(`${q.x},${y},${q.z}`);
  }
}

const GLASS = (d) => ({ block: "glass_pane", state: d === "N" || d === "S" ? { east: "true", west: "true", north: "false", south: "false" } : { north: "true", south: "true", east: "false", west: "false" } });
const BRICK = { block: "bricks" }, STONE = { block: "stone_bricks" }, QUARTZ = { block: "quartz_block" }, SLAB = { block: "smooth_stone" };

// what block sits at x, y, z (null = air or nothing)
function spec(c, y) {
  const { x, z, g, D } = c;
  if (y > D) return EQUIP.has(key(x, z)) && y <= D + 2 ? STONE : null;      // roof plant on the main block
  if (y < g) return STONE;                                                  // the plinth under the lowest floor
  if (y === D) return c.wall ? QUARTZ : SLAB;                              // cornice / roof deck
  if (!c.wall) {                                                           // the interior: floor slabs and lamps only
    if (c.F.includes(y) || y === g) return SLAB;
    if (lamps.has(`${x},${y},${z}`)) return { block: "lantern", state: { hanging: "true" } };
    return null;
  }
  if (y === g) return STONE;                                               // base course
  if (c.F.includes(y)) return c.ext.includes("N") && y === c.F[1] ? { block: "dark_oak_planks" } : QUARTZ;   // string courses; a timber fascia over the shops
  const s = storeyOf(c, y);
  if (!s) return BRICK;
  if (!c.open.includes(c.ext[0])) return BRICK;                            // steps down to a lower tier: solid
  const dir = c.ext[0], a = dir === "N" || dir === "S" ? x : z, top = s.hi - 1;
  if (top - s.lo - 1 >= 3 && y === top) return { block: "white_concrete" };   // window head
  if (DOORS.get(key(x, z)) === dir && (y === s.lo + 1 || y === s.lo + 2)) {
    return { block: "dark_oak_door", state: { facing: dir === "N" ? "north" : "south", half: y === s.lo + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
  }
  if (dir === "N" && s.i === 0) return a % 3 === 0 ? { block: "dark_oak_planks" } : GLASS(dir);   // shopfront
  if (a % 3 === 0) return BRICK;                                           // pier between bays
  return GLASS(dir);
}

// 3. Build.
const v = new Voxels([17, 25, 23]);
for (const c of C.values()) {
  for (let y = 0; y <= c.D + 2; y++) {
    const s = spec(c, y);
    if (s) v.set(c.x, y, c.z, s.block, s.state);
  }
}
const out = v.save(SAVE);
console.log(`way_162091755: ${out.blocks} blocks, palette ${out.palette}`);
