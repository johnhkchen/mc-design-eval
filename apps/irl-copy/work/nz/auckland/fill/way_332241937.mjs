// Auckland, way 332241937: an interwar brick-and-plaster commercial block (Newton / Eden Terrace fabric) on a 27 x 16
// footprint. The lidar roof reads two tiers: a main block of four storeys (cornice at y16, top 17) and a three-storey
// wing (cornice at y12, top 13), each taken from a 3 x 3 median of the roof heights so the noise is gone. Foundation,
// stone plinth, a glazed shopfront with a canopied door, brick piers on cream plaster bands, glass panes with an air
// gap behind each one, a few windows lit, and a plant room on the roof. Solid from y0 up to each tier; nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241937.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241937.nbt";
const SIZE = [27, 30, 16];

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const k2 = (x, z) => `${x},${z}`;
const ground = new Map(), roof = new Map();
for (const [x, z, g, r] of cells) { ground.set(k2(x, z), g); roof.set(k2(x, z), r); }
const inFoot = (x, z) => ground.has(k2(x, z));

// ---- two flat tiers from the lidar roof: a 3 x 3 median per cell, then main (17) or wing (13) by its value ----
const top = new Map();
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number), vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFoot(x + dx, z + dz)) vals.push(roof.get(k2(x + dx, z + dz)));
  vals.sort((a, b) => a - b);
  top.set(key, vals[vals.length >> 1] >= 15 ? 17 : 13);
}
const topAt = (x, z) => top.get(k2(x, z));

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];                 // east, west, south (+z), north (-z)
const NAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
// the outward faces of a cell at height y: its neighbour is outside the footprint or a lower tier
const faces = (x, z, y) => DIRS.filter(([dx, dz]) => !inFoot(x + dx, z + dz) || topAt(x + dx, z + dz) <= y);
// the cell's wall-plane neighbour j along a face (for the entrance and its canopy)
const front = (x, z, [dx, dz], j) => (dz ? [x + j + dx, z + dz] : [x + dx, z + j + dz]);

// ---- blocks by position; a missing cell is air ----
const B = new Map();
const key3 = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => B.set(key3(x, y, z), [block, state]);
const has = (x, y, z) => B.has(key3(x, y, z));

const BANDS = new Set([4, 8, 12, 16]);                           // floor bands; each tier's top band is its cornice
const carve = [], panes = [];
for (const [key, t] of top) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < t; y++) {
    const f = faces(x, z, y);
    if (y === 0) put(x, y, z, "cobblestone");                    // foundation from the lowest ground
    else if (!f.length) put(x, y, z, y === t - 1 ? "smooth_stone" : "stone");   // hidden core, roof skin on top
    else if (BANDS.has(y)) put(x, y, z, "smooth_quartz");        // floor bands and cornices
    else if (y === 1) put(x, y, z, "polished_andesite");         // plinth
    else if (f.length > 1) put(x, y, z, y % 2 ? "bricks" : "white_concrete");    // quoins at the corners
    else {
      const [dx, dz] = f[0], p = dx ? z : x, shop = y < 4;      // p: position along the wall
      const [ix, iz] = [x - dx, z - dz];                        // the room behind this wall cell
      const roomOk = inFoot(ix, iz) && topAt(ix, iz) > y && faces(ix, iz, y).length === 0;
      if (p % 3 === 0 || !roomOk) put(x, y, z, shop ? "stone_bricks" : "bricks");   // piers
      else { put(x, y, z, "glass_pane"); carve.push([ix, y, iz]); panes.push([x, y, z, dx, dz, p]); }
    }
  }
  if (faces(x, z, t - 1).length) put(x, t, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });   // coping
}

// ---- air gap behind each glass pane, and warm light in some of them ----
for (const [x, y, z] of carve) B.delete(key3(x, y, z));
for (const [x, y, z, dx, dz, p] of panes) {
  if (y % 4 !== 2) continue;                                     // the middle row of each storey
  const [ix, iz] = [x - dx, z - dz];
  if (y < 4 && p % 6 === 1) put(ix, y, iz, "glowstone");
  else if (y >= 4 && p % 9 === 4) put(ix, y, iz, "shroomlight");
}

// ---- the entrance: a pier on the street wall of the ground storey, a canopy on two posts, a step ----
const cx = [...ground.keys()].reduce((s, key) => s + Number(key.split(",")[0]), 0) / ground.size;
const cz = [...ground.keys()].reduce((s, key) => s + Number(key.split(",")[1]), 0) / ground.size;
const doors = [];
for (const [key] of top) {
  const [x, z] = key.split(",").map(Number), f = faces(x, z, 1);
  if (f.length !== 1) continue;
  const d = f[0], p = d[0] ? z : x;
  if (p % 3) continue;
  const fr = [-1, 0, 1].map((j) => front(x, z, d, j));
  if (fr.some(([fx, fz]) => inFoot(fx, fz) || fx < 0 || fz < 0 || fx > SIZE[0] - 1 || fz > SIZE[2] - 1)) continue;
  doors.push({ x, z, d });
}
if (!doors.length) throw new Error("no entrance cell on a clean wall");
const door = doors.reduce((a, b) => (Math.hypot(a.x - cx, a.z - cz) <= Math.hypot(b.x - cx, b.z - cz) ? a : b));
{
  const { x, z, d: [dx, dz] } = door;
  put(x, 1, z, "dark_oak_door", { facing: NAME[`${-dx},${-dz}`], half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, 2, z, "dark_oak_door", { facing: NAME[`${-dx},${-dz}`], half: "upper", hinge: "left", open: "false", powered: "false" });
  const [sx, sz] = front(x, z, door.d, 0);
  put(sx, 0, sz, "stone_brick_stairs", { facing: NAME[`${dx},${dz}`], half: "bottom", shape: "straight", waterlogged: "false" });
  for (const j of [-1, 1]) { const [px, pz] = front(x, z, door.d, j); for (let y = 0; y <= 2; y++) put(px, y, pz, "dark_oak_log", { axis: "y" }); }
  for (const j of [-1, 0, 1]) { const [px, pz] = front(x, z, door.d, j); put(px, 3, pz, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); }
  put(sx, 2, sz, "lantern", { hanging: "true", waterlogged: "false" });
}

// ---- roof plant room: a 4 x 3 box on the main block's roof, clear of the parapet ----
{
  const main = [...top].filter(([, t]) => t === 17).map(([key]) => key.split(",").map(Number));
  const mx = main.reduce((s, [x]) => s + x, 0) / main.length, mz = main.reduce((s, [, z]) => s + z, 0) / main.length;
  let best = null;
  for (const [x, z] of main) {
    let clear = true;
    for (let i = -1; i <= 4 && clear; i++) for (let j = -1; j <= 3 && clear; j++) if (topAt(x + i, z + j) !== 17) clear = false;
    if (clear && (!best || Math.hypot(x - mx, z - mz) < Math.hypot(best[0] - mx, best[1] - mz))) best = [x, z];
  }
  if (best) for (let dx = 0; dx < 4; dx++) for (let dz = 0; dz < 3; dz++) {
    const [x, z] = [best[0] + dx, best[1] + dz];
    put(x, 17, z, "stone_bricks"); put(x, 18, z, "stone_bricks");
    put(x, 19, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// ---- glass panes connect to the wall cells on either side of them in their own plane ----
for (const [x, y, z, dx] of panes) {                              // dx: the wall faces east or west
  const st = dx ? { north: has(x, y, z - 1), south: has(x, y, z + 1), east: false, west: false }
                : { north: false, south: false, east: has(x + 1, y, z), west: has(x - 1, y, z) };
  put(x, y, z, "glass_pane", { north: st.north ? "true" : "false", south: st.south ? "true" : "false",
    east: st.east ? "true" : "false", west: st.west ? "true" : "false", waterlogged: "false" });
}

// ---- build, check nothing floats, save ----
const g = new Voxels(SIZE);
for (const [key, [block, state]] of B) { const [x, y, z] = key.split(",").map(Number); g.set(x, y, z, block, state); }
// a block is held up from below, or it is a floor or ceiling tied into a wall beside it (the room behind a window)
const floats = [...B.keys()].filter((key) => {
  const [x, y, z] = key.split(",").map(Number);
  if (y === 0 || has(x, y - 1, z)) return false;
  if (["lantern", "stone_brick_slab", "smooth_quartz_slab", "stone_brick_stairs"].includes(B.get(key)[0])) return false;
  return !DIRS.some(([dx, dz]) => has(x + dx, y, z + dz));
});
const info = g.save(OUT);
console.log(`way 332241937: ${info.blocks} blocks, ${info.palette} palette; ${floats.length} unsupported cells${floats.length ? ` (${floats.slice(0, 8).join(" ")})` : ""}; door ${door.x},${door.z} facing ${NAME[`${door.d}`]}`);
