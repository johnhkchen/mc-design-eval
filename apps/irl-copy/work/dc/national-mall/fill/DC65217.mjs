import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1750 H St NW: 1960s-70s Modern grey-concrete and glass office block.
// Four 4-block storeys, a light-grey concrete frame with bands of tinted glass,
// a stone-brick base, a stone-coping parapet, a recessed entrance on the south face,
// and roof plant boxes on the interior. Stepped roofs get full-height setback walls.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC65217.cells.json`, "utf8"));

const W = 20, H = 29, D = 13;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();

// Read the lidar cells: ground and roof heights, smoothed into whole storeys.
for (const c of cells) {
  const [x, z, gr, roof] = Array.isArray(c) ? c : [c.x, c.z, c.ground, c.roof];
  const G = Math.round(gr);
  const storeys = Math.max(1, Math.round((roof - G) / 4));
  const T = Math.min(G + 4 * storeys + 1, H - 5); // T-1 = roof cap row, T = parapet row
  cellMap.set(key(x, z), { x, z, G, T, storeys: Math.floor((T - 1 - G) / 4) });
}

const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const nb = (c, d) => cellMap.get(key(c.x + DIRS[d][0], c.z + DIRS[d][1]));

// A face is an outward face if there is no neighbour, or the neighbour is lower (setback).
function exposedDirs(c) {
  const out = {};
  for (const d of Object.keys(DIRS)) {
    const o = nb(c, d);
    out[d] = !o || o.T < c.T;
  }
  return out;
}
const isShell = (c) => Object.values(exposedDirs(c)).some(Boolean);
const isCorner = (c) => (c.x === 0 || c.x === W - 1) && (c.z === 0 || c.z === D - 1);

// Facade material for a shell cell at height y.
function facade(c, y) {
  const rel = y - c.G;
  const r = rel % 4;
  const ex = exposedDirs(c);
  const bay = (ex.n || ex.s) ? c.x : c.z;
  if (r === 0) return "smooth_stone";                                     // storey line
  if (isCorner(c) || bay % 3 === 0) return "light_gray_concrete";         // mullion / pier
  if (r === 3) return "light_gray_concrete";                              // spandrel
  return "light_blue_stained_glass";                                      // glazing
}

// 1. Foundations, interior floor slabs and roof caps for every cell.
for (const c of cellMap.values()) {
  for (let y = 0; y < c.G; y++) g.set(c.x, y, c.z, "stone_bricks");
  for (let k = 0; k < c.storeys; k++) g.set(c.x, c.G + 4 * k, c.z, "smooth_stone");
  g.set(c.x, c.T - 1, c.z, "smooth_stone");
}

// 2. Shell walls: perimeter cells and the tall side of every setback.
for (const c of cellMap.values()) {
  if (!isShell(c)) continue;
  for (let y = c.G; y <= c.T - 2; y++) g.set(c.x, y, c.z, facade(c, y));
  g.set(c.x, c.T, c.z, "stone_brick_wall"); // parapet coping
}

// 3. Entrance on the south face: stone surround, glazed doors at x 9 and 10.
const doorFacing = "north"; // player stands south of the wall, facing north
for (const x of [8, 9, 10, 11]) {
  let zMax = -1;
  for (const c of cellMap.values()) if (c.x === x) zMax = Math.max(zMax, c.z);
  const c = cellMap.get(key(x, zMax));
  if (!c) continue;
  if (x === 9 || x === 10) {
    const props = { facing: doorFacing, hinge: "left", open: "false", powered: "false" };
    g.set(x, c.G + 1, c.z, "dark_oak_door", { ...props, half: "lower" });
    g.set(x, c.G + 2, c.z, "dark_oak_door", { ...props, half: "upper" });
    g.set(x, c.G + 3, c.z, "stone_bricks"); // lintel over the doors
  } else {
    for (let y = c.G + 1; y <= c.G + 3; y++) g.set(x, y, c.z, "stone_bricks"); // door surround
  }
}

// 4. Warm light behind some windows (placed on the inside of the shell).
for (const c of cellMap.values()) {
  if (!isShell(c) || isCorner(c)) continue;
  const ex = exposedDirs(c);
  const d = ex.n ? "n" : ex.s ? "s" : ex.w ? "w" : ex.e ? "e" : null;
  if (!d) continue;
  const bay = (d === "n" || d === "s") ? c.x : c.z;
  const inward = { n: "s", s: "n", w: "e", e: "w" }[d];
  const inner = nb(c, inward);
  if (!inner || inner.G !== c.G || isShell(inner)) continue;
  for (let k = 0; k < c.storeys; k++) {
    if (bay % 3 === 0) continue;
    if ((bay + k * 2 + c.z) % 4 !== 0) continue;
    g.set(inner.x, c.G + 4 * k + 1, inner.z, "glowstone");
  }
}

// 5. Roof plant on the interior of the roof.
for (const c of cellMap.values()) {
  if (isShell(c)) continue;
  if (!(c.x % 5 === 2 && c.z % 4 === 2)) continue;
  g.set(c.x, c.T, c.z, "light_gray_concrete");
  g.set(c.x, c.T + 1, c.z, "iron_block");
}

g.save(`${DIR}/DC65217.nbt`);
