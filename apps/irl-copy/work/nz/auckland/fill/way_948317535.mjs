// Way 948317535, Mt Eden / Newton edge: a 1930s three-storey reinforced-concrete commercial block in cream plaster,
// terracotta bands and shopfronts, with a lower east wing and a plant room on the core. Lidar roof heights are
// smoothed into three flat tiers (15 / 12 / 7); each column is solid from y 0 up to its ground and up to its tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_948317535.cells.json`, "utf8"));   // [x, z, ground, roof]

// Storeys share one floor datum: bases at 3, 7, 11 (4 blocks each), so every tier's storey lines line up.
const F = 3;
const DIRS = { E: [1, 0], W: [-1, 0], S: [0, 1], N: [0, -1] };
const FACING = { E: "east", W: "west", S: "south", N: "north" };
const tier = (r) => (r >= 14 ? 15 : r >= 9 ? 12 : 7);   // core / middle / lower east wing

const k = (x, z) => `${x},${z}`;
// Lidar roofs are noisy cell to cell: average each roof over its 5 x 5 neighbourhood (footprint cells only) before tiering,
// so the tiers come out as blocks rather than pits.
const roof = new Map(cells.map(([x, z, , r]) => [k(x, z), r]));
const top = new Map(), gnd = new Map();
for (const [x, z, g] of cells) {
  let s = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { const v = roof.get(k(x + dx, z + dz)); if (v !== undefined) { s += v; n++; } }
  top.set(k(x, z), tier(s / n)); gnd.set(k(x, z), g);
}
const topAt = (x, z) => top.get(k(x, z)) ?? 0;
const nbrTop = (x, z, d) => topAt(x + DIRS[d][0], z + DIRS[d][1]);
// a face is a wall where the neighbour is lower (or outside): the lower tier's roof meets the setback wall
const exteriorFaces = (x, z) => Object.keys(DIRS).filter((d) => nbrTop(x, z, d) < top.get(k(x, z)));
const inFp = (x, z) => top.has(k(x, z));

// Entrance: a ground-floor window bay on the outside edge, on the lowest ground (the downhill side).
let door = null;
for (const [x, z, g] of cells) {
  const out = exteriorFaces(x, z).filter((d) => nbrTop(x, z, d) === 0);
  if (out.length !== 1) continue;
  const d = out[0], u = d === "E" || d === "W" ? z : x;
  if (u % 4 !== 2) continue;
  if (!door || g < door.g) door = { x, z, d, g };
}

const V = new Voxels([27, 27, 24]);
const lights = [];   // warm lights, placed after the shell: { x, z, d, y }

for (const [x, z, g] of cells) {
  const T = top.get(k(x, z));
  const ext = exteriorFaces(x, z);
  for (let y = 0; y <= T; y++) {
    if (y < F) { V.set(x, y, z, "polished_andesite"); continue; }        // base course
    if (y < g) { V.set(x, y, z, "stone_bricks"); continue; }            // foundation up to the lidar ground
    if (y === T) { if (ext.length) V.set(x, y, z, "smooth_quartz"); continue; }   // parapet
    const faces = ext.filter((d) => y >= nbrTop(x, z, d));
    if (!faces.length) {                                               // interior: slab per storey, roof cap
      if (y === T - 1) V.set(x, y, z, "gray_concrete");
      else if (y === 3 || y === 7 || y === 11) V.set(x, y, z, "smooth_quartz");
      continue;
    }
    if (y === T - 1) { V.set(x, y, z, "terracotta"); continue; }      // cornice
    const d = faces[0], u = d === "E" || d === "W" ? z : x;
    const isDoor = door && door.x === x && door.z === z;
    if (y === 3) V.set(x, y, z, "polished_andesite");
    else if (y === 7 || y === 11) V.set(x, y, z, "smooth_quartz");
    else if (y === 6 || y === 10 || y === 14) {                       // terracotta string courses / shop fascia
      if (isDoor && y === 6) V.set(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });   // canopy over the door
      else V.set(x, y, z, "terracotta");
    } else if (u % 4 === 0) V.set(x, y, z, "quartz_bricks");          // piers
    else if (isDoor && door.d === d && (y === 4 || y === 5) && u % 4 === 2) {
      V.set(x, y, z, "dark_oak_door", { facing: FACING[d], half: y === 4 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    } else {
      const along = d === "E" || d === "W" ? { north: "true", south: "true", east: "false", west: "false" }
                                           : { north: "false", south: "false", east: "true", west: "true" };
      V.set(x, y, z, "glass_pane", { ...along, waterlogged: "false" });
      if (u % 8 === 2 && (x + z + y) % 3 === 0 && (y === 4 || y === 8 || y === 12)) lights.push({ x, z, d, y });
    }
  }
}

// Warm lights: a glowstone or lantern one cell inside a lit window, standing on its floor (never on the glass).
for (const { x, z, d, y } of lights) {
  const ix = x - DIRS[d][0], iz = z - DIRS[d][1];
  if (!inFp(ix, iz) || exteriorFaces(ix, iz).length || top.get(k(ix, iz)) <= y) continue;
  if (y === 4) V.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
  else V.set(ix, y, iz, "glowstone");
}

// Roof: a plant room (3x3, two storeys) on the core's middle, and two rooftop units on the middle tier.
let best = null, cx = 0, cz = 0, n = 0;
for (const [x, z] of [...top.keys()].map((s) => s.split(",").map(Number))) if (top.get(k(x, z)) === 15) { cx += x; cz += z; n++; }
cx /= n; cz /= n;
for (const [x, z] of [...top.keys()].map((s) => s.split(",").map(Number))) {
  let ok = true;
  for (let dx = -2; dx <= 2 && ok; dx++) for (let dz = -2; dz <= 2 && ok; dz++) if (topAt(x + dx, z + dz) !== 15) ok = false;
  if (ok && (!best || Math.hypot(x - cx, z - cz) < best.d)) best = { x, z, d: Math.hypot(x - cx, z - cz) };
}
if (best) {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    V.set(best.x + dx, 15, best.z + dz, "smooth_quartz");
    V.set(best.x + dx, 16, best.z + dz, "smooth_quartz");
    V.set(best.x + dx, 17, best.z + dz, "gray_concrete");
  }
}
const units = [];
for (const [s] of top) {
  const [x, z] = s.split(",").map(Number);
  if (top.get(s) !== 12 || exteriorFaces(x, z).length) continue;
  if (units.some(([ux, uz]) => Math.abs(ux - x) < 5 || Math.abs(uz - z) < 4)) continue;
  units.push([x, z]);
  if (units.length === 2) break;
}
for (const [x, z] of units) V.set(x, 12, z, "iron_block");

V.save(`${DIR}/way_948317535.nbt`);
