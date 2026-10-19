// Federal Office Building 10B: a stripped-classical federal office of the 1930s, Indiana-limestone-look walls on a
// granite base, a stepped massing (11-block wings, a 12-block shoulder, a 14-block core), punched glass bays with
// pilasters and an air gap behind each pane, a central entrance under a canopy, and a few warm lights behind glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86812.cells.json", "utf8"));
const X = 56, Z = 12, Y = 26;

// Footprint and ground (third number) and the lidar roof (fourth), with a 3x3 median to drop the lidar noise
// (courtyard-like pits and single-cell spikes), then snapped to three tiers: 11 wings, 12 shoulder, 14 core.
const ground = new Map(), raw = new Map();
for (const [x, z, g, r] of cells) { ground.set(`${x},${z}`, g); raw.set(`${x},${z}`, r); }
const inFoot = (x, z) => ground.has(`${x},${z}`);
const med = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFoot(x + dx, z + dz)) v.push(raw.get(`${x + dx},${z + dz}`));
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tier = (r) => (r <= 11 ? 11 : r === 12 ? 12 : 14);
const top = new Map();                                                    // solid up to top-1; top = roof row
for (const k of ground.keys()) { const [x, z] = k.split(",").map(Number); top.set(k, tier(med(x, z))); }
const H = (x, z) => (inFoot(x, z) ? top.get(`${x},${z}`) : 0);
const exposed = (x, y, z) => {                                            // directions whose neighbour is air at this height
  const out = [];
  if (H(x, z - 1) <= y) out.push("-z");
  if (H(x, z + 1) <= y) out.push("+z");
  if (H(x - 1, z) <= y) out.push("-x");
  if (H(x + 1, z) <= y) out.push("+x");
  return out;
};
const inward = { "-z": [0, 1], "+z": [0, -1], "-x": [1, 0], "+x": [-1, 0] };

const g = new Voxels([X, Y, Z]);
const put = (x, y, z, b, s) => { if (y >= 0 && y < Y) g.set(x, y, z, b, s); };
const airAt = (x, y, z) => { if (y >= 0 && y < Y) g.set(x, y, z, "air"); };

// Entrance: centre of the street front (z = 0), x 25..30. Doorway 26..29 open two blocks high, doors at 27 and 28,
// posts at 25 and 30, a canopy slab over the top; two hanging lanterns inside.
const entrance = (x, y, z) => z <= 1 && x >= 25 && x <= 30 && y >= 2 && y <= 4;

for (const [k, t] of top) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < t; y++) {
    if (y <= 1) { put(x, y, z, "polished_granite"); continue; }           // foundation and base course
    if (entrance(x, y, z)) {
      if (y === 4) { put(x, y, z, "smooth_quartz"); continue; }           // canopy
      if (x === 25 || x === 30) { put(x, y, z, "calcite"); continue; }    // posts
      if (z === 0 && (x === 27 || x === 28)) continue;                    // doors placed below
      if (z === 1 && (x === 26 || x === 29)) { if (y === 3) put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
      if (z === 0 || z === 1) continue;                                   // doorway air
    }
    if (y === t - 1) { put(x, y, z, "smooth_quartz"); continue; }         // cornice, the roof edge
    const faces = exposed(x, y, z);
    const onZ = faces.find((d) => d.endsWith("z"));
    const face = onZ ?? faces[0];
    const pilaster = face && (face.endsWith("z") ? x % 4 === 0 : z % 4 === 0);
    const glassRow = y % 2 === 1;                                         // windows on odd rows, spandrels on even
    if (!face || !glassRow || pilaster) { put(x, y, z, (face && pilaster) ? "smooth_quartz" : "calcite"); continue; }
    put(x, y, z, "light_blue_stained_glass_pane", face.endsWith("z")
      ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
  }
}

// Second pass: the air gap behind every window pane, the warm lights behind some of them, and the doors.
for (const [k, t] of top) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 2; y < t - 1; y++) {
    if (entrance(x, y, z)) continue;
    const faces = exposed(x, y, z);
    const face = faces.find((d) => d.endsWith("z")) ?? faces[0];
    if (!face || y % 2 === 0) continue;
    if (face.endsWith("z") ? x % 4 === 0 : z % 4 === 0) continue;
    const [dx, dz] = inward[face];
    airAt(x + dx, y, z + dz);                                             // the air gap behind the pane
    if ((x * 5 + y * 3) % 11 === 0 && H(x + 2 * dx, z + 2 * dz) > y) put(x + 2 * dx, y, z + 2 * dz, "glowstone");
  }
}

for (const x of [27, 28]) {
  const hinge = x === 27 ? "left" : "right";
  put(x, 2, 0, "iron_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
  put(x, 3, 0, "iron_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
}

// Roof plant on the core: two stone plant boxes and a lantern-lit stair bulkhead on the parapet line.
for (let x = 17; x <= 21; x++) for (let z = 4; z <= 6; z++) { put(x, 14, z, "stone_bricks"); put(x, 15, z, "stone_bricks"); }
for (let x = 33; x <= 36; x++) for (let z = 6; z <= 7; z++) { put(x, 14, z, "polished_andesite"); put(x, 15, z, "polished_andesite"); }
put(19, 16, 5, "sea_lantern");

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86812.nbt");
console.log("blocks", g.count(), "palette", g.palette.length);
