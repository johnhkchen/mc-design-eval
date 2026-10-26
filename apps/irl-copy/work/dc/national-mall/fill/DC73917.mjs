import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A Federal-era red-brick office block with limestone trim on the Mall's east edge: a 10-block tower on
// the NW corner (the lidar's 9-10), a main body of 7 (three storeys on the downhill side), SE steps of 6 and 5.
// Facades are brick piers with calcite string courses and quoins, glass windows on every odd bay, a dark oak
// entrance on the north face, glowstone behind some glass and a lantern over the door. No interiors: floor slabs
// per storey and an air gap behind the glass.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC73917.cells.json`, "utf8"));

// Lidar roof -> flat tiers (noise out): tower 10, main 7, SE steps 6 and 5
const tier = (x, z) => {
  if (x <= 1 && z <= 1) return 10;
  if (z <= 3) return 7;
  if (z === 4) return x === 1 ? 7 : 6;
  if (z === 5) return x <= 1 ? 7 : 5;
  return x === 1 ? 7 : x <= 3 ? 6 : 5;
};

const C = new Map();
for (const [x, z, g] of cells) C.set(`${x},${z}`, { g, R: tier(x, z) });
const at = (x, z) => C.get(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// a neighbour covers height y if it stands that high (its foundation counts as solid below its floor)
const covers = (x, z, y) => { const c = at(x, z); return !!c && y < c.R; };
const exposed = (x, z, y) => Object.keys(DIRS).filter((d) => !covers(x + DIRS[d][0], z + DIRS[d][1], y));

const V = new Voxels([10, 22, 8]);
const paneState = (d) => (d === "N" || d === "S"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

const windows = [];   // [x, y, z, face] for glowstone behind glass
for (const [key, { g, R }] of C) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < R; y++) {
    if (y < g) { V.set(x, y, z, "stone_bricks"); continue; }          // foundation down to the lowest ground
    const o = y - g, ex = exposed(x, z, y);
    if (y === R - 1) { V.set(x, y, z, ex.length ? "calcite" : "stone"); continue; }   // parapet cap, roof deck
    if (o === 0) { V.set(x, y, z, ex.length ? "polished_andesite" : "smooth_stone"); continue; }  // base course, floor
    if (!ex.length) { if (o % 2 === 0) V.set(x, y, z, "smooth_stone"); continue; }    // floor slab per storey; odd rows air
    if (ex.length > 1 || o === 2) { V.set(x, y, z, "calcite"); continue; }           // quoins, first string course
    if (o % 2 === 0) { V.set(x, y, z, "bricks"); continue; }                         // brick between the glazed rows
    const d = ex[0], along = DIRS[d][0] ? z : x;
    if (along % 2 === 1) {
      V.set(x, y, z, "light_blue_stained_glass_pane", paneState(d));
      windows.push([x, y, z, d]);
    } else V.set(x, y, z, "bricks");
  }
}

// Glowstone one cell inside some glazed bays, only where that cell is an open storey (odd row, no wall)
for (const [x, y, z, d] of windows) {
  const o = y - at(x, z).g;
  if ((x + z + o) % 3 !== 0) continue;
  const ix = x - DIRS[d][0], iz = z - DIRS[d][1], inner = at(ix, iz);
  if (!inner || y >= inner.R - 1 || y < inner.g || (y - inner.g) % 2 === 0 || exposed(ix, iz, y).length) continue;
  V.set(ix, y, iz, "glowstone");
}

// North (the street) face: entrance at x 5, flanked by calcite pilasters, a lantern over the door
const g5 = at(5, 1).g;
V.set(4, g5 + 1, 1, "calcite"); V.set(4, g5 + 2, 1, "calcite");
V.set(6, g5 + 1, 1, "calcite"); V.set(6, g5 + 2, 1, "calcite");
const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
V.set(5, g5 + 1, 1, "dark_oak_door", { ...door, half: "lower" });
V.set(5, g5 + 2, 1, "dark_oak_door", { ...door, half: "upper" });
V.set(5, g5 + 3, 1, "lantern", { hanging: "true", waterlogged: "false" });

// Plant units on the main roof (tier 7), standing on the roof deck
for (const [x, z] of [[3, 3], [4, 3], [6, 3]]) V.set(x, 7, z, "light_gray_concrete");

const info = V.save(`${DIR}/DC73917.nbt`);
console.log(info);
