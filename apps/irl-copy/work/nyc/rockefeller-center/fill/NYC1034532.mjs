// 680 Fifth Avenue (1957), a mid-century Midtown office block: a 12-storey shoulder on a granite base, a
// 31-block wing along the north and east, a 4-storey wing to the south-east, and a 30-storey glass slab (roof 92) with
// a 95-block penthouse core. Hollow shell: a solid core, a floor slab per storey, air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034532.cells.json`, "utf8"));
const W = 34, D = 27, TOP = 108;

// Lidar roof per cell, snapped to flat tiers. Noise: two 0 holes in the tower, a 33 at the north-west corner.
const snap = (v) => v >= 70 && v <= 94 ? 92 : v >= 95 ? 95 : v >= 36 && v <= 38 ? 37 : v >= 30 && v <= 31 ? 31
  : v >= 23 && v <= 25 ? 24 : v >= 11 && v <= 12 ? 12 : v;
const FIX = { "0,4": 24, "10,16": 92, "10,17": 92 };
const roof = new Map();
for (const [x, z, , r] of cells) roof.set(`${x},${z}`, FIX[`${x},${z}`] ?? snap(r));

const has = (x, z) => roof.has(`${x},${z}`);
const hgt = (x, z) => roof.get(`${x},${z}`);
const ringOf = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
// Exposed to outside air at height y: on the footprint edge, or beside a neighbour that stops below y.
const ext = (x, z, y) => [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]].some(([a, b]) => !has(a, b) || hgt(a, b) <= y);
const inCore = (x, z) => x >= 13 && x <= 20 && z >= 12 && z <= 21;
const glass = (x, z, k) => (x * 5 + z * 3 + k) % 9 === 4 ? "cyan_stained_glass" : "light_blue_stained_glass";

// Entrances on the west (Fifth Avenue) and south faces, each with iron doors, granite jambs and a steel canopy.
const DOORS = [{ face: "west", at: 12 }, { face: "south", at: 27 }];
const onFace = (x, z, d) => (d.face === "west" ? x === 0 : z === D - 1);
const alongOf = (x, z, d) => (d.face === "west" ? z : x);

const g = new Voxels([W, TOP, D]);
const lights = [];
for (const [key, H] of roof) {
  const [x, z] = key.split(",").map(Number);
  const ring = ringOf(x, z);
  const core = inCore(x, z);
  for (let y = 0; y < H; y++) {
    const top = y === H - 1;
    const out = ext(x, z, y);
    const k = Math.floor((y - 1) / 3);            // storey index (y 1..3 is storey 0)
    const r = y >= 1 ? (y - 1) % 3 : -1;           // 0 floor line, 1 glass, 2 spandrel
    let b = null, st;
    if (y === 0) b = "polished_andesite";
    else if (top) b = out ? "light_gray_concrete" : "gray_concrete";
    else if (out) {
      const d = DOORS.find((d) => onFace(x, z, d));
      const a = d ? Math.abs(alongOf(x, z, d) - d.at) : 99;
      if (d && y <= 2 && a === 0) {
        b = "iron_door";
        st = { facing: d.face === "west" ? "west" : "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
      } else if (d && y <= 2 && a === 1) b = "polished_andesite";
      else if (d && y === 3 && a <= 2) b = "iron_block";
      else if (k === 0) b = r === 0 ? "polished_andesite" : r === 1 ? ((x + z) % 3 === 0 ? "iron_block" : glass(x, z, k)) : "light_gray_concrete";
      else if (r === 0) b = "light_gray_concrete";
      else if (r === 1) b = (x + z) % 3 === 0 ? "iron_block" : glass(x, z, k);
      else b = "white_concrete";
      if (ring && r === 1 && k >= 1 && !b.includes("iron") && (x * 3 + z * 5 + k * 7) % 11 === 2) lights.push({ x, y, z, k });
    } else if (core) b = "light_gray_concrete";
    else if (r === 0) b = "light_gray_concrete";  // floor slab over the open storey
    if (b) g.set(x, y, z, b, st);
  }
}

// Warm lights just inside some lit-glass windows: glowstone, an occasional shroomlight. Only into open air.
for (const { x, y, z, k } of lights) {
  const ix = x === 0 ? 1 : x === W - 1 ? x - 1 : x;
  const iz = x === 0 || x === W - 1 ? z : z === 0 ? 1 : z - 1;
  if (!has(ix, iz) || g.get(ix, y, iz)) continue;
  g.set(ix, y, iz, (x + z + k) % 4 === 0 ? "shroomlight" : "glowstone");
}

const box = (x0, x1, z0, z1, y0, y1, b) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) g.set(x, y, z, b);
};
// Roof plant on the terraces: the 37 shoulder, the 31 wing and the 12 south-east wing.
box(2, 5, 6, 8, 37, 39, "light_gray_concrete");
box(20, 23, 6, 8, 37, 38, "white_concrete");
box(10, 13, 1, 3, 31, 32, "light_gray_concrete");
box(29, 32, 20, 23, 12, 13, "white_concrete");
// Crown mast on the 95 penthouse.
for (let y = 95; y <= 101; y++) g.set(17, y, 18, "lightning_rod");

const res = g.save(`${DIR}/NYC1034532.nbt`);
console.log(JSON.stringify({ cells: roof.size, tiers: [...new Set(roof.values())].sort((a, b) => a - b), ...res }));
