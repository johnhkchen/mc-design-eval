// FR2496152967: an Indifférencié block on the Île de la Cité, read as a pale Haussmann-era render block with a dark zinc roof.
// Roof heights from the lidar are snapped to five tiers (1, 2, 6, 11, 12 blocks), so each tier top sits on a solid
// floor or string row (tier top minus 2 is always a row 0 or 4 mod 5). Storeys are 5 blocks: a base course, three window
// rows, a string course. Only the outer shell is glazed; the interior is air except the floor slabs, one per storey line.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR2496152967.cells.json`, "utf8"));

const W = 35, H = 28, D = 23;
const TIERS = [1, 2, 6, 11, 12];

const raw = new Map();                                // "x,z" -> lidar roof height above y 0
for (const [x, z, , r] of cells) raw.set(`${x},${z}`, r);
const snap = (v) => TIERS.reduce((best, t) => (Math.abs(t - v) <= Math.abs(best - v) ? t : best));  // ties go up

// 3x3 median of the lidar, then snap to the nearest tier. A lidar zero stays zero: nothing is built there.
const top = new Map();
for (const [key, r] of raw) {
  if (r <= 0) { top.set(key, 0); continue; }
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = raw.get(`${x + dx},${z + dz}`); if (n !== undefined) vals.push(n); }
  vals.sort((a, b) => a - b);
  top.set(key, snap(vals[Math.floor(vals.length / 2)]));
}
const T = (x, z) => top.get(`${x},${z}`) ?? 0;        // outside the footprint, or a zero cell: no building

const NEI = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
// The faces of a cell at height y that look onto air: no building beside it that reaches that row.
const exposed = (x, z, y) => NEI.filter(([, dx, dz]) => T(x + dx, z + dz) <= y).map(([n]) => n);

const g = new Voxels([W, H, D]);

// Walls and floors.
for (const [key, t] of top) {
  if (t === 0) continue;
  const [x, z] = key.split(",").map(Number);
  if (t === 1) { g.set(x, 0, z, "stone_bricks"); continue; }          // a podium course: the paved plinth
  g.set(x, 0, z, "stone_bricks");                                     // base course
  for (let y = 1; y < t; y++) {
    const faces = exposed(x, z, y);
    if (y === t - 1) { g.set(x, y, z, "deepslate_tiles"); continue; } // zinc roof cap
    if (y % 5 === 4) { g.set(x, y, z, "smooth_stone"); continue; }    // string course and floor slab
    if (y % 5 === 0) { g.set(x, y, z, "white_concrete"); continue; }  // lintel row and floor slab
    if (faces.length === 0) continue;                                 // interior: air behind the glass
    if (y === t - 2) { g.set(x, y, z, "smooth_stone"); continue; }    // cornice
    if (faces.length >= 2) { g.set(x, y, z, "stone_bricks"); continue; }  // corner quoin
    const along = faces[0] === "north" || faces[0] === "south" ? x : z;
    if (along % 3 !== 0) {                                            // window: two glazed bays to a pier, so the glass reads as glass
      const lit = (x * 7 + z * 3 + y) % 5 === 0;
      g.set(x, y, z, lit ? "glowstone" : "light_blue_stained_glass");
    } else {
      g.set(x, y, z, "white_concrete");                               // pier between the windows
    }
  }
}

// Entrance: the middle of the south face's tall run (tier 6 or more), two blocks of dark oak door.
const southRun = [];
for (const [key, t] of top) {
  const [x, z] = key.split(",").map(Number);
  if (t >= 6 && T(x, z + 1) === 0) southRun.push([x, z]);
}
if (southRun.length) {
  southRun.sort((a, b) => a[0] - b[0]);
  const [x0, z0] = southRun[Math.floor(southRun.length / 2)];
  const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
  g.set(x0, 1, z0, "dark_oak_door", { ...door, half: "lower" });
  g.set(x0, 2, z0, "dark_oak_door", { ...door, half: "upper" });
}

// Roof: two brick stacks on the tallest tier, set in from the edge so they stand on the cap.
const tall = [...top].filter(([, t]) => t === 12).map(([k]) => k.split(",").map(Number));
const stacks = tall.filter(([x, z]) => exposed(x, z, 12).length === 0).slice(0, 2);
for (const [x, z] of stacks) for (let y = 12; y <= 14; y++) g.set(x, y, z, "bricks");

const out = `${DIR}/FR2496152967.nbt`;
const r = g.save(out);
console.log(`saved ${out}: ${r.blocks} blocks, palette ${r.palette}`);
