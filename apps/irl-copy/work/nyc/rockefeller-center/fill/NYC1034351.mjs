// 76 West 47th Street, 1965: a two-storey commercial block with a one-storey light court at the rear of the middle. Street
// front on the north (z 0) with a shopfront and a recessed-free entrance at x 2; masonry-look shell in quartz with
// spandrel bands and tinted glass; a flat tar roof over the solid interior (no rooms, so nothing hangs).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1034351.cells.json`, "utf8"));
const W = 5, D = 19, H = 19;
const grid = (v) => Array.from({ length: D }, () => Array(W).fill(v));
const inFoot = (x, z) => x >= 0 && x < W && z >= 0 && z < D;
const edge = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;

// Ground and raw lidar roof per cell.
const G = grid(null), RAW = grid(null);
for (const [x, z, g, r] of cells) { G[z][x] = g; RAW[z][x] = r; }

// Snap the lidar roof to three tiers: two storeys (7), one-storey light court (5), the entrance bay (4). Readings of
// 1-3 are noise and take the neighbours' tier; one majority pass irons out the rest (the 4 bay is left as read).
const snap = (r) => (r >= 6 ? 7 : r === 5 ? 5 : r === 4 ? 4 : null);
const neighbours = (R, x, z) => [[0, -1], [0, 1], [-1, 0], [1, 0]].map(([dx, dz]) => [x + dx, z + dz]).filter(([a, b]) => inFoot(a, b)).map(([a, b]) => R[b][a]);
let R = RAW.map((row) => row.map(snap));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (R[z][x] === null) {
  const n = neighbours(R, x, z).filter((v) => v !== null);
  R[z][x] = n.sort((a, b) => n.filter((v) => v === a).length - n.filter((v) => v === b).length).pop();
}
const S = R.map((row) => row.slice());
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (R[z][x] === 4) continue;
  const all = [R[z][x], ...neighbours(R, x, z)];
  for (const v of [5, 7]) if (v !== R[z][x] && all.filter((u) => u === v).length >= 3) S[z][x] = v;
}
R = S;

// Exposure of a cell's faces at height y: a face is open where it is on the outline or the neighbour is lower.
const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
function exposure(x, z, y) {
  const out = [];
  for (const [d, dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (!inFoot(nx, nz)) out.push({ d, dx, dz, perimeter: true });
    else if (R[nz][nx] <= y) out.push({ d, dx, dz, perimeter: false });
  }
  return out;
}

const M = {
  found: "polished_granite", fill: "stone", base: "polished_granite", band: "light_gray_concrete",
  pier: "smooth_quartz", glass: "light_blue_stained_glass", corn: "smooth_quartz", roof: "gray_concrete", canopy: "polished_deepslate",
};

function blockAt(x, z, y) {
  const g = G[z][x], r = R[z][x];
  if (y < g) return edge(x, z) ? M.found : M.fill;
  if (y >= r) return null;
  const k = y - g, exp = exposure(x, z, y);
  if (!exp.length) return y === r - 1 ? M.roof : M.fill;
  if (y === r - 1) return M.corn;
  const per = exp.find((e) => e.perimeter);
  if (per) {
    if (k === 0) return M.base;
    if (y === 4 && z === 0 && x >= 1 && x <= 3) return M.canopy;          // entrance canopy over the door
    if (k % 3 === 0) return M.band;                                       // storey lines (spandrels)
    const a = per.dx ? z : x;                                             // along the face: piers on even bays
    return a % 2 === 0 ? M.pier : M.glass;
  }
  return k === 0 ? M.base : k % 3 === 0 ? M.band : M.pier;               // stepped-down faces: solid, no glass
}

const out = new Voxels([W, H, D]);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const top = R[z][x];
  for (let y = 0; y < Math.max(top, G[z][x]); y++) {
    const b = blockAt(x, z, y);
    if (b) out.set(x, y, z, b);
  }
}

// Air gap one cell inside each window, and warm light in some of them.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const g = G[z][x], r = R[z][x];
  for (let y = g; y < r - 1; y++) {
    const k = y - g;
    if (k % 3 === 0 || k === 0) continue;
    const per = exposure(x, z, y).find((e) => e.perimeter);
    if (!per) continue;
    const ix = x - per.dx, iz = z - per.dz;
    if (!inFoot(ix, iz) || edge(ix, iz)) continue;
    out.set(ix, y, iz, "air");
    const a = per.dx ? z : x;
    if (a % 2 === 1 && (a * 5 + y * 3 + x) % 4 === 0) out.set(ix, y, iz, "glowstone");
  }
}

// Entrance: a dark double-height door set in the piers at x 2 (north face), a lantern hung in the vestibule.
const g2 = G[0][2];
for (const [y, half] of [[g2 + 1, "lower"], [g2 + 2, "upper"]]) {
  out.set(2, y, 0, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
  out.set(2, y, 1, "air");
}
out.set(2, g2 + 2, 1, "lantern", { hanging: "true", waterlogged: "false" });

// Flat roof plant: a two-by-two bulkhead on the rear of the two-storey part, with a vent stack beside it.
for (const z of [15, 16]) for (const x of [2, 3]) for (const y of [7, 8]) out.set(x, y, z, "smooth_quartz");
for (const y of [7, 8]) out.set(1, y, 17, "iron_bars");

out.save(`${dir}/NYC1034351.nbt`);
console.log(`roof tiers (z rows, x 0..4):`);
R.forEach((row, z) => console.log(String(z).padStart(2), row.join(" ")));
console.log(`blocks: ${out.count()}, palette: ${out.palette.length - 1}`);
