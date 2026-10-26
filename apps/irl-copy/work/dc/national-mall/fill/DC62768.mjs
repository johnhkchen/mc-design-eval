// DC62768: Hotel-Large, 1310 New Hampshire Ave NW. A 1920s-era brick hotel on a granite base: a stepped body of
// six storeys (ground + four windowed + an attic band) with a central penthouse core rising two blocks above its
// terrace ring, and low single-storey wings at the corners. Hollow: an air gap behind each window and a floor slab
// per storey; the lidar roof heights are snapped to clean tiers (4 wings, 8, 12 body, 14 core).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC62768.cells.json`, "utf8"));
const [W, H, D] = [16, 26, 13];

const key = (x, y, z) => `${x},${y},${z}`;
const cz = (x, z) => `${x},${z}`;
const foot = new Map(cells.map(([x, z, g, r]) => [cz(x, z), { g, r }]));
const inF = (x, z) => foot.has(cz(x, z));
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];          // N, S, W, E (N = -z, S = +z: the entrance is on the south)

// The lidar roof, snapped to tiers: >=14 is the penthouse core (its outer ring steps down to the 12 terrace),
// 8..13 is the body, and everything lower is a one-storey wing.
const core = new Set(cells.filter(([, , , r]) => r >= 14).map(([x, z]) => cz(x, z)));
const isCore = (x, z) => core.has(cz(x, z));
const isCoreRing = (x, z) => isCore(x, z) && DIRS.some(([dx, dz]) => !isCore(x + dx, z + dz));
const T = (x, z) => {                                       // the column's top: solid from y 0 to T-1
  if (core.size) return isCoreRing(x, z) ? 12 : isCore(x, z) ? 14 : foot.get(cz(x, z)).r >= 12 ? 12 : foot.get(cz(x, z)).r >= 8 ? 8 : 4;
  const r = foot.get(cz(x, z)).r; return r >= 12 ? 12 : r >= 8 ? 8 : 4;
};
const open = (x, y, z, [dx, dz]) => !inF(x + dx, z + dz) || T(x + dx, z + dz) <= y;   // air beside this voxel

const plan = new Map();
const put = (x, y, z, block, state) => plan.set(key(x, y, z), { block, state });
const pane = { waterlogged: "false" };

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const t = T(x, z);
  for (let y = 0; y < t; y++) {
    const outs = DIRS.filter((d) => open(x, y, z, d));
    const ring = outs.length > 0;
    if (y === 0) { put(x, y, z, "stone_bricks"); continue; }                  // granite-grey base course, level across the footprint
    if (y === t - 1) { put(x, y, z, ring ? "smooth_quartz" : "smooth_stone"); continue; }   // cornice ring, roof deck inside
    if (!ring) { if (y >= 4 && y % 2 === 0) put(x, y, z, "spruce_planks"); continue; }      // interior: a floor per storey, air between
    const [dx, dz] = outs[0];
    const i = dx !== 0 ? z : x;                                            // position along the facade
    const door = z === 12 && (x === 7 || x === 8) && y <= 2;               // double entrance on the south front
    if (door) { put(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: x === 7 ? "left" : "right", open: "false", powered: "false" }); continue; }
    if (y <= 2) { i % 3 === 0 ? put(x, y, z, "stone_bricks") : put(x, y, z, "glass_pane", pane); continue; }   // shopfront
    if (y === 3 || y === 4) { put(x, y, z, "smooth_quartz"); continue; }   // transom and string course
    if (y % 2 === 0) { put(x, y, z, "bricks"); continue; }                  // spandrels
    i % 3 === 0 ? put(x, y, z, "smooth_quartz") : put(x, y, z, "glass_pane", pane);   // window grid with quartz frames
  }
  // a parapet slab on the top of each outer edge
  if (DIRS.some((d) => open(x, t, z, d))) put(x, t, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// the lantern pair over the door, hung from the string course
put(7, 3, 12, "lantern", { hanging: "true", waterlogged: "false" });
put(8, 3, 12, "lantern", { hanging: "true", waterlogged: "false" });

// glass panes connect to their in-plane neighbours
for (const [k, v] of [...plan]) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const out = DIRS.find((d) => open(x, y, z, d));
  const ns = out[0] !== 0;                                                  // east/west-facing: connect north/south
  const a = ns ? [0, -1] : [-1, 0], b = ns ? [0, 1] : [1, 0];
  const lit = (d) => plan.has(key(x + d[0], y, z + d[1]));
  const has = (d) => lit(d);
  v.state = ns
    ? { north: String(has(a)), south: String(has(b)), east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: String(has([1, 0])), west: String(has([-1, 0])), waterlogged: "false" };
}

// warm light behind some panes: a glowstone or shroomlight in the air gap just inside the glass
for (const [k, v] of [...plan]) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  if (![1, 5, 7, 9, 11].includes(y) || (x * 7 + y * 5 + z * 3) % 6 !== 0) continue;
  const out = DIRS.find((d) => open(x, y, z, d));
  const [ix, iz] = [x - out[0], z - out[1]];
  if (!inF(ix, iz) || plan.has(key(ix, y, iz))) continue;
  put(ix, y, iz, (x + z) % 2 ? "glowstone" : "shroomlight");
}

// rooftop plant boxes on the body roof, off the core
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (T(x, z) !== 12 || open(x, 11, z, DIRS[0]) || DIRS.some((d) => open(x, 11, z, d))) continue;
  if ((x * 5 + z * 3) % 9 !== 4) continue;
  put(x, 12, z, "light_gray_concrete"); put(x, 13, z, "light_gray_concrete");
}

// nothing floats: every block above y 0 stands on a block beneath it, or spans between walls at its own level
// (floor slabs; lanterns hang from the string course above)
for (const [k, v] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  if (y === 0 || v.block === "lantern") continue;
  const span = DIRS.some(([dx, dz]) => plan.has(key(x + dx, y, z + dz)));
  if (!plan.has(key(x, y - 1, z)) && !span) throw new Error(`floating ${v.block} at ${k}`);
}

const g = new Voxels([W, H, D]);
for (const [k, v] of plan) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, v.block, v.state); }
const out = g.save(`${DIR}/DC62768.nbt`);
console.log(`DC62768.nbt: ${out.blocks} blocks, palette ${out.palette}`);
