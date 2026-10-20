import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1001322";
const W = 13, H = 27, D = 12;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, block, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Footprint lookup
const F = new Map();
for (const c of cells) {
  const [x, z, gr, rf] = c;
  F.set(`${x},${z}`, { x, z, gr: Math.max(0, Math.round(gr)), rf: Number(rf) });
}
const has = (x, z) => F.has(`${x},${z}`);

const paneProps = (zface) => zface
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Per-cell classification
const info = [];
for (const c of F.values()) {
  const { x, z, gr, rf } = c;
  const N = !has(x, z - 1);   // outside faces -z (north)
  const S = !has(x, z + 1);   // outside faces +z (south)
  const Wm = !has(x - 1, z);  // outside faces -x (west)
  const E = !has(x + 1, z);   // outside faces +x (east)
  const perim = N || S || Wm || E;
  const zface = N || S;
  const xface = Wm || E;
  const corner = zface && xface;
  const u = corner ? -1 : (zface ? x : z);
  let Sk = Math.max(2, Math.min(8, Math.round((rf - gr) / 3)));
  let top = gr + 3 * Sk;
  while (top > 25 && Sk > 2) { Sk--; top = gr + 3 * Sk; }
  if (top > 25) top = 25;
  info.push({ x, z, gr, rf, N, S, Wm, E, perim, zface, xface, corner, u, Sk, top });
}
const byKey = new Map(info.map((c) => [`${c.x},${c.z}`, c]));

// Foundations, ground plinth and floor
for (const c of info) {
  const { x, z, gr } = c;
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (c.perim) put(x, gr, z, "stone_bricks");
  else put(x, gr, z, "smooth_stone");
}

// Storeys
for (const c of info) {
  const { x, z, gr, Sk } = c;
  for (let k = 0; k < Sk; k++) {
    const b = gr + 3 * k;
    if (k > 0 && !c.perim) put(x, b, z, "smooth_stone"); // floor slab
    if (!c.perim) continue;

    if (c.corner) {
      put(x, b, z, k === 0 ? "stone_bricks" : "stone_bricks");
      put(x, b + 1, z, "bricks");
      put(x, b + 2, z, "bricks");
      continue;
    }

    if (k === 0) {
      // Cast-iron-era shopfront: piers, glass, dark transom
      const pier = c.u % 3 === 0;
      put(x, b + 1, z, pier ? "deepslate_bricks" : "glass_pane", pier ? undefined : paneProps(c.zface));
      put(x, b + 2, z, "dark_oak_planks");
    } else {
      // String course, window band, lintel course
      put(x, b, z, "stone_bricks");
      const win = c.u % 2 === 1;
      put(x, b + 1, z, win ? "glass_pane" : "bricks", win ? paneProps(c.zface) : undefined);
      put(x, b + 2, z, "bricks");
    }
  }
}

// Roof slab, parapet, and interior roof
for (const c of info) {
  const { x, z, top } = c;
  if (c.perim) put(x, top, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  else put(x, top, z, "smooth_stone");
}

// Entrance on the north face (min z) if present, else south face
const northCells = info.filter((c) => c.N && !c.corner && c.zface);
const southCells = info.filter((c) => c.S && !c.corner && c.zface);
let doorCell = null, doorFacing = "north";
const pickMid = (arr) => {
  if (!arr.length) return null;
  const xs = arr.map((c) => c.x);
  const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
  return arr.reduce((best, c) => (Math.abs(c.x - mid) < Math.abs(best.x - mid) ? c : best));
};
if (northCells.length) { doorCell = pickMid(northCells); doorFacing = "north"; }
else if (southCells.length) { doorCell = pickMid(southCells); doorFacing = "south"; }

if (doorCell) {
  const { x, z, gr } = doorCell;
  put(x, gr + 1, z, "dark_oak_door", { facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, z, "dark_oak_door", { facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Warm light behind some upper windows (interior air gap, supported by floor slab)
for (const c of info) {
  if (!c.perim || c.corner) continue;
  for (let k = 1; k < c.Sk; k++) {
    const b = c.gr + 3 * k;
    if (((c.x * 3 + c.z * 5 + k) % 4) !== 0) continue;
    if (c.u % 2 !== 1) continue;
    let ix = c.x, iz = c.z;
    if (c.N) iz = c.z + 1;
    else if (c.S) iz = c.z - 1;
    else if (c.Wm) ix = c.x + 1;
    else if (c.E) ix = c.x - 1;
    const inner = byKey.get(`${ix},${iz}`);
    if (!inner || inner.perim) continue;
    if (inner.top <= b + 1) continue;
    put(ix, b + 1, iz, "glowstone");
  }
}

// Rooftop chimney on an interior cell of the tallest massing
let chim = null;
for (const c of info) {
  if (c.perim) continue;
  if (!chim || c.top > chim.top) chim = c;
}
if (chim && chim.top + 2 <= 26) {
  put(chim.x, chim.top + 1, chim.z, "bricks");
  put(chim.x, chim.top + 2, chim.z, "bricks");
}

g.save(`${DIR}/${ID}.nbt`);
