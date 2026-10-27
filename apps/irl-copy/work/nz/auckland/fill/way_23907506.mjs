// Way 23907506, LabPlus and Mortuary: a 1970s–80s institutional concrete block, read from the lidar record.
// Footprint 68 x 96 blocks; roof 22 blocks above the lowest ground on the podium, 26 on the core (lidar 22–28, median-smoothed
// into two flat tiers). Five storeys on the podium, six on the core, ~4 blocks a storey. Light grey concrete walls, white piers
// as window frames, gray storey bands, blue-grey glazing, a recessed entrance under the first-floor slab, lanterns in the
// glazing and the porch, and a roof plant box. Hollow: a 1-block facade ring, air behind the glass, floor slabs per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_23907506.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell
const W = 68, H = 41, D = 96;

// [dx, dz, name]: z grows south, so dz -1 is north
const DIRS = [[0, -1, "north"], [1, 0, "east"], [0, 1, "south"], [-1, 0, "west"]];
const OPP = { north: "south", south: "north", east: "west", west: "east" };

const at = new Map();
for (const [x, z, g, r] of cells) at.set(`${x},${z}`, { g, r });
const cell = (x, z) => at.get(`${x},${z}`);

// two flat tiers from the lidar: 3x3 median roof, podium 22 or core 26
for (const [k, c] of at) {
  const [x, z] = k.split(",").map(Number), v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = cell(x + dx, z + dz); if (n) v.push(n.r); }
  v.sort((a, b) => a - b);
  c.top = v[v.length >> 1] >= 24 ? 26 : 22;
}

// a ring cell touches the outside, or a lower tier (its wall stands above that tier's roof)
const outOf = (x, z) => DIRS.filter(([dx, dz]) => !cell(x + dx, z + dz));
const isRing = (x, z) => { const c = cell(x, z); return !!c && DIRS.some(([dx, dz]) => { const n = cell(x + dx, z + dz); return !n || n.top < c.top; }); };

// the entrance: the outer face with the most low-ground cells, its middle cell, a 3-wide porch two deep
const faces = {};
for (const [k, c] of at) {
  if (c.g > 1) continue;
  const [x, z] = k.split(",").map(Number);
  for (const [dx, dz, name] of DIRS) if (!cell(x + dx, z + dz)) (faces[name] ??= []).push({ x, z, dx, dz, name });
}
const face = Object.values(faces).sort((a, b) => b.length - a.length)[0];
face.sort((a, b) => (a.dz ? a.x - b.x : a.z - b.z));
const door = face[Math.floor(face.length / 2)];
const t = door.dz ? [1, 0] : [0, 1];                     // along the face
const porch = new Set();
for (let o = -1; o <= 1; o++) for (let dep = 0; dep <= 1; dep++)
  porch.add(`${door.x + o * t[0] - dep * door.dx},${door.z + o * t[1] - dep * door.dz}`);

const v = new Voxels([W, H, D]);
const placed = new Map();                                // "x,y,z" -> block name, for the pane connections
const put = (x, y, z, block, state) => { v.set(x, y, z, block, state); placed.set(`${x},${y},${z}`, block); };
const glazed = [];                                        // { x, y, z, ox, oz } for the glass on the outer faces

for (const [k, c] of at) {
  const [x, z] = k.split(",").map(Number), { g, top: T } = c;
  const out = outOf(x, z), ring = isRing(x, z);
  const along = out.length ? (out[0][0] ? z : x) : 0;    // index along the outer face: piers every 3 blocks
  for (let y = 0; y < T; y++) {
    if (porch.has(k) && y >= 1 && y <= 3) continue;      // the entrance opening
    if (y < g) { put(x, y, z, "stone_bricks"); continue; }   // foundation down to the lowest ground under the cell
    if (y === 0) { put(x, y, z, ring ? "stone_bricks" : "smooth_stone"); continue; }
    if (!ring) {                                         // interior: floor slab per storey, roof deck, otherwise air
      if (y % 4 === 0) put(x, y, z, "smooth_stone");
      else if (y === T - 1) put(x, y, z, "gray_concrete");
      continue;
    }
    if (y === g) { put(x, y, z, "stone_bricks"); continue; }      // plinth course
    if (y === T - 1) { put(x, y, z, "light_gray_concrete"); continue; }  // parapet
    if (y === T - 2) { put(x, y, z, "smooth_stone"); continue; }        // cornice
    const row = y % 4, pier = out.length > 0 && along % 3 === 0;
    if (row === 0) put(x, y, z, "gray_concrete");        // storey band
    else if (row === 3) put(x, y, z, "light_gray_concrete");   // spandrel
    else if (out.length === 0 || y > T - 3) put(x, y, z, "light_gray_concrete");
    else if (pier) put(x, y, z, "white_concrete");       // window frame between bays
    else {
      put(x, y, z, Math.floor(y / 4) % 2 ? "gray_stained_glass_pane" : "light_blue_stained_glass_pane");
      glazed.push({ x, y, z, ox: out[0][0], oz: out[0][1] });
    }
  }
}

// warm lanterns standing just behind some windows, two blocks in, on the storey slab
for (const { x, y, z, ox, oz } of glazed) {
  if (y % 4 !== 1 || (x * 7 + z * 13 + Math.floor(y / 4) * 5) % 9 !== 0) continue;
  const x2 = x - 2 * ox, z2 = z - 2 * oz, c2 = cell(x2, z2);
  if (!c2 || isRing(x2, z2) || y < c2.g || y + 1 >= c2.top || porch.has(`${x2},${z2}`)) continue;
  put(x2, y, z2, "lantern", { hanging: "false" });
}

// glass panes join their neighbours: a pane connects to a pane or a wall block beside it
for (const { x, y, z } of glazed) {
  const pane = placed.get(`${x},${y},${z}`);
  const link = (dx, dz) => { const b = placed.get(`${x + dx},${y},${z + dz}`); return !!b && b !== "lantern" ? "true" : "false"; };
  v.set(x, y, z, pane, { north: link(0, -1), east: link(1, 0), south: link(0, 1), west: link(-1, 0), waterlogged: "false" });
}

// the entrance: iron doors in the middle of the porch, lanterns either side under the storey slab
const facing = OPP[door.name];
for (const half of ["lower", "upper"]) v.set(door.x, half === "lower" ? 1 : 2, door.z, "iron_door", { facing, half, hinge: "left", open: "false", powered: "false" });
for (const o of [-1, 1]) put(door.x + o * t[0], 3, door.z + o * t[1], "lantern", { hanging: "true" });

// roof plant on the core: a 7 x 5 box with walls and a roof, on the core's roof deck
const core = [...at].filter(([, c]) => c.top === 26).map(([k]) => k.split(",").map(Number));
const cx = Math.round(core.reduce((s, p) => s + p[0], 0) / core.length), cz = Math.round(core.reduce((s, p) => s + p[1], 0) / core.length);
for (let dx = -3; dx <= 3; dx++) for (let dz = -2; dz <= 2; dz++) {
  const x = cx + dx, z = cz + dz, c = cell(x, z);
  if (!c || c.top !== 26 || porch.has(`${x},${z}`)) continue;
  const edge = Math.abs(dx) === 3 || Math.abs(dz) === 2;
  if (edge) { put(x, 26, z, "light_gray_concrete"); put(x, 27, z, "light_gray_concrete"); }
  put(x, 28, z, "gray_concrete");
}

const out = `${DIR}/way_23907506.nbt`;
const res = v.save(out);
console.log(`way_23907506: ${res.blocks} blocks, ${res.palette} palette entries -> ${out}`);
