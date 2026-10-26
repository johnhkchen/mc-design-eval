// 1140 Connecticut Ave NW: a 1960s-70s precast-and-glass office, nine storeys over a granite shopfront.
// Massing follows the lidar roof, quantised to three tiers (17 / 19 / 21) with the 3 and 4 wings as their own roofs.
// Facade: granite plinth, glass shopfront, then 2-row storeys (light-grey spandrel over a tinted window), quartz piers
// every third bay, a smooth quartz cap. Interiors are air with one floor slab per storey, so only the shell reads.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC60355.cells.json`, "utf8"));
const SIZE = [22, 33, 18];

// footprint: "x,z" -> { ground, roof }
const foot = new Map();
for (const [x, z, ground, roof] of cells) foot.set(`${x},${z}`, { ground, roof });
const inF = (x, z) => foot.has(`${x},${z}`);

// tiers: low wings keep their own height; the lidar's 17-18 band is the main roof, 19 a setback, 20-21 the core
const tier = (x, z) => {
  const r = foot.get(`${x},${z}`).roof;
  if (r <= 4) return r;
  if (r <= 18) return 17;
  if (r === 19) return 19;
  return 21;
};
// the lidar's cell-by-cell steps (17/19/21 interleaved) become flat tiers: each main-massing cell takes the most common tier around it
const smooth = new Map();
for (const key of foot.keys()) {
  const [x, z] = key.split(",").map(Number);
  const r = tier(x, z);
  if (r <= 4) { smooth.set(key, r); continue; }
  const votes = {};
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const k = `${x + dx},${z + dz}`;
    if (foot.has(k) && tier(x + dx, z + dz) > 4) votes[tier(x + dx, z + dz)] = (votes[tier(x + dx, z + dz)] || 0) + 1;
  }
  smooth.set(key, Number(Object.entries(votes).sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0]));
}
const T = (x, z) => smooth.get(`${x},${z}`);
// a side is exposed when the neighbour is outside the footprint or stands lower (a setback face)
const lower = (x, z, dx, dz) => !inF(x + dx, z + dz) || T(x + dx, z + dz) < T(x, z);

const put = new Map(); // "x,y,z" -> [block, state]
const set = (x, y, z, block, state) => put.set(`${x},${y},${z}`, [block, state]);
const has = (x, y, z) => put.has(`${x},${y},${z}`);
const facadeCells = new Set();
const pierAt = new Map();

for (const key of foot.keys()) {
  const [x, z] = key.split(",").map(Number);
  const top = T(x, z);
  const zFace = lower(x, z, 0, -1) || lower(x, z, 0, 1); // wall runs along x
  const xFace = lower(x, z, -1, 0) || lower(x, z, 1, 0); // wall runs along z
  const facade = zFace || xFace;
  const pier = (zFace && x % 3 === 0) || (xFace && z % 3 === 0) || (zFace && xFace);
  if (facade) facadeCells.add(key);
  pierAt.set(key, pier);

  for (let y = 0; y < top; y++) {
    if (y === 0) { set(x, 0, z, facade ? "polished_granite" : "smooth_stone"); continue; }
    if (y === top - 1) { set(x, y, z, "smooth_quartz"); continue; }                // cap / parapet, also the roof slab
    if (!facade) { if (y >= 3 && y % 2 === 1) set(x, y, z, "light_gray_concrete"); continue; } // interior floor slabs
    if (y <= 2) { // ground-floor shopfront
      if (pier) set(x, y, z, "polished_granite");
      else set(x, y, z, "light_blue_stained_glass_pane");
      continue;
    }
    if (y % 2 === 1) set(x, y, z, pier ? "quartz_pillar" : "light_gray_concrete"); // storey spandrel
    else set(x, y, z, pier ? "quartz_pillar" : "light_blue_stained_glass_pane");   // window band
  }
}

// main entrance on the west face: double doors at z 8-9 under a stone canopy
const door = (y, z, half, hinge) => ({ facing: "west", half, hinge, open: "false", powered: "false" });
set(0, 1, 8, "dark_oak_door", door(1, 8, "lower", "left"));
set(0, 2, 8, "dark_oak_door", door(2, 8, "upper", "left"));
set(0, 1, 9, "dark_oak_door", door(1, 9, "lower", "right"));
set(0, 2, 9, "dark_oak_door", door(2, 9, "upper", "right"));
for (let z = 7; z <= 10; z++) { set(0, 4, z, "smooth_stone"); set(1, 4, z, "smooth_stone"); }

// warm light: hanging lanterns behind some glass, on the inside cells next to the facade
for (const key of foot.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (facadeCells.has(key)) continue;
  const nextToFacade = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => facadeCells.has(`${x + dx},${z + dz}`));
  if (!nextToFacade || (x + z) % 5 !== 0) continue;
  for (const y of [4, 8, 12, 16]) {
    if (has(x, y + 1, z) && !has(x, y, z) && T(x, z) > y + 2) set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// rooftop: a set-back plant room on the core (3+ cells in from the core's edge), a few units on the main roof
const core = (x, z) => inF(x, z) && T(x, z) === 21;
const dist = new Map();
let frontier = [];
for (const key of foot.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (!core(x, z)) continue;
  const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !core(x + dx, z + dz));
  if (edge) { dist.set(key, 0); frontier.push([x, z]); }
}
while (frontier.length) {
  const next = [];
  for (const [x, z] of frontier) {
    const d = dist.get(`${x},${z}`);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = `${x + dx},${z + dz}`;
      if (core(x + dx, z + dz) && !dist.has(k)) { dist.set(k, d + 1); next.push([x + dx, z + dz]); }
    }
  }
  frontier = next;
}
const plant = new Set([...dist].filter(([, d]) => d >= 3).map(([k]) => k));
for (const k of plant) {
  const [x, z] = k.split(",").map(Number);
  const edgeP = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !plant.has(`${x + dx},${z + dz}`));
  set(x, 21, z, "light_gray_concrete");                                   // floor on the core's cap
  if (edgeP) set(x, 22, z, (x + z) % 2 === 0 ? "iron_bars" : "light_gray_concrete"); // louvred screen
  set(x, 23, z, "smooth_quartz");                                         // roof slab over the whole plant room
}
for (const [x, z] of [[2, 6], [2, 9], [4, 12]]) set(x, 17, z, "iron_block");

// glass panes and bars connect to any neighbour in their plane, so the window grid reads as one frame
const connect = (x, y, z, block) => {
  const st = {};
  for (const [name, dx, dz] of [["east", 1, 0], ["west", -1, 0], ["south", 0, 1], ["north", 0, -1]]) {
    st[name] = has(x + dx, y, z + dz) ? "true" : "false";
  }
  st.waterlogged = "false";
  return st;
};
for (const [key, [block]] of put) {
  if (block !== "light_blue_stained_glass_pane" && block !== "iron_bars") continue;
  const [x, y, z] = key.split(",").map(Number);
  put.set(key, [block, connect(x, y, z, block)]);
}

const g = new Voxels(SIZE);
for (const [key, [block, state]] of put) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = g.save(`${DIR}/DC60355.nbt`);
console.log(`DC60355.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
