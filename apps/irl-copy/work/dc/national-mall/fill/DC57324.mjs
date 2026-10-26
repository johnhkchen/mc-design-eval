import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC57324.cells.json`, "utf8"));

// 1776 F St NW: mid-century office block. Portland-stone-look piers and
// spandrels, tinted glass bays, flat roof with parapet and a central
// mechanical penthouse. Storeys are 3 blocks tall.
const W = 23, H = 27, D = 16;
const g = new Voxels([W, H, D]);

const cellMap = new Map();
const has = (x, z) => cellMap.has(x + "," + z);
const isEdge = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

// Raw storey counts from lidar
const raw = cells.map(([x, z, gr0, rf]) => {
  const gr = Math.round(gr0);
  let n = Math.round((rf - gr - 1) / 3);
  return { x, z, gr, n: Math.max(1, Math.min(7, n)) };
});

// Dominant storey count for the main body; keep only real wing steps
const freq = new Map();
for (const r of raw) freq.set(r.n, (freq.get(r.n) || 0) + 1);
let mode = raw[0].n, best = -1;
for (const [n, c] of freq) if (c > best) { best = c; mode = n; }

for (const r of raw) {
  let n = Math.abs(r.n - mode) >= 2 ? r.n : mode;
  while (r.gr + 1 + 3 * n > 22 && n > 1) n--;
  const top = r.gr + 1 + 3 * n;
  cellMap.set(r.x + "," + r.z, { x: r.x, z: r.z, gr: r.gr, n, top });
}

let maxTop = 0;
for (const c of cellMap.values()) if (c.top > maxTop) maxTop = c.top;

// Facade block for an exterior voxel of a perimeter cell
function faceBlock(c, y) {
  const { x, z, gr, n, top } = c;
  const faces = [];
  if (!has(x, z - 1)) faces.push("N");
  if (!has(x, z + 1)) faces.push("S");
  if (!has(x - 1, z)) faces.push("W");
  if (!has(x + 1, z)) faces.push("E");
  const corner = faces.length >= 2;
  const bay = faces.includes("N") || faces.includes("S") ? x : z;
  const mull = corner || bay % 3 === 0;

  if (y <= gr) return "stone_bricks";                 // plinth / base course
  if (y === top) return "stone_bricks";               // parapet coping
  if (y === top - 1) return "smooth_stone";           // cornice band
  const k = Math.floor((y - gr - 1) / 3);
  const off = (y - gr - 1) - 3 * k;
  if (k >= n) return null;
  if (off === 0) return "light_gray_concrete";        // spandrel at storey line
  return mull ? "calcite" : "light_blue_stained_glass_pane";
}

for (const c of cellMap.values()) {
  const { x, z, gr, n, top } = c;
  const perim = isEdge(x, z);

  // Foundation and base course
  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone_bricks");

  if (perim) {
    for (let y = gr + 1; y <= top; y++) {
      const b = faceBlock(c, y);
      if (b) g.set(x, y, z, b);
    }
  } else {
    // Interior: floor slabs and flat roof only, air gap between
    g.set(x, gr, z, "smooth_stone");
    for (let k = 1; k < n; k++) g.set(x, gr + 1 + 3 * k, z, "smooth_stone");
    g.set(x, top, z, "light_gray_concrete");
  }
}

// Shopfront and entrance on the north (z=0) face
const entryX = 11;
if (has(entryX, 0)) {
  const c0 = cellMap.get(entryX + ",0");
  const dy = c0.gr + 1;
  // Glazed shopfront across the ground bay, with stone pilasters either side
  for (let x = 7; x <= 15; x++) {
    if (!has(x, 0)) continue;
    const cc = cellMap.get(x + ",0");
    const pier = x === 7 || x === 15 || x === entryX - 2 || x === entryX + 2;
    for (let y = cc.gr + 1; y <= cc.gr + 2; y++) {
      if (x === entryX) continue;
      g.set(x, y, 0, pier ? "calcite" : "light_blue_stained_glass_pane");
    }
    g.set(x, cc.gr + 3, 0, "smooth_stone");            // shopfront lintel
  }
  // Recessed door with a warm lobby light behind
  g.set(entryX, dy, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(entryX, dy + 1, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  if (has(entryX, 1)) g.set(entryX, dy + 1, 1, "glowstone");
}

// Warm lights behind some upper-storey windows
for (const c of cellMap.values()) {
  const { x, z, gr, n } = c;
  if (!isEdge(x, z)) continue;
  for (let k = 1; k < n; k++) {
    if (k % 2 !== 1) continue;
    const b = gr + 1 + 3 * k;
    const faces = [];
    let inX = null, inZ = null;
    if (!has(x, z - 1)) { faces.push("N"); inZ = z + 1; }
    if (!has(x, z + 1)) { faces.push("S"); inZ = z - 1; }
    if (!has(x - 1, z)) { faces.push("W"); inX = x + 1; }
    if (!has(x + 1, z)) { faces.push("E"); inX = x - 1; }
    if (faces.length !== 1) continue;
    const bay = faces[0] === "N" || faces[0] === "S" ? x : z;
    if (bay % 3 === 0 || bay % 4 !== 2) continue;
    const ix = inX !== null ? inX : x;
    const iz = inZ !== null ? inZ : z;
    if (!has(ix, iz) || isEdge(ix, iz)) continue;
    const ic = cellMap.get(ix + "," + iz);
    if (k >= ic.n) continue;
    g.set(ix, b + 1, iz, "shroomlight");
  }
}

// Mechanical penthouse: solid box on the tallest roof, glazed band, concrete cap
for (const c of cellMap.values()) {
  const { x, z, top } = c;
  if (top !== maxTop) continue;
  if (x < 7 || x > 14 || z < 5 || z > 10) continue;
  const ring = x === 7 || x === 14 || z === 5 || z === 10;
  g.set(x, top + 1, z, "light_gray_concrete");
  if (ring) {
    g.set(x, top + 2, z, "light_blue_stained_glass_pane");
  } else {
    g.set(x, top + 2, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/DC57324.nbt`);
