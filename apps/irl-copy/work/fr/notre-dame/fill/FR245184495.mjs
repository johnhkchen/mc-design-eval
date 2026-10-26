import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// FR245184495: an 1800 residential block, eight storeys of cream limestone under a dark mansard. Each cell's storeys
// come from its lidar roof (median-smoothed, rounded to 3-block storeys), so the lower wings and the setbacks fall out
// of the record. Walls are one block thick with an air gap behind the glass and a floor slab per storey.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184495.cells.json`, "utf8"));
const W = 22, H = 43, D = 17;
const g = new Voxels([W, H, D]);

const MD = 3;                                   // mansard layers under the flat top
const key = (x, z) => `${x},${z}`;
const at = new Map();
for (const [x, z, G, R] of cells) at.set(key(x, z), { x, z, G, R });
const cell = (x, z) => at.get(key(x, z));
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const OPP = { north: "south", south: "north", east: "west", west: "east" };

// depth: 1 on the outer ring of the footprint, 2 one in, and so on (walls are depth 1, interiors >= 2)
const depth = new Map();
let frontier = [];
for (const c of at.values()) {
  if (Object.values(DIRS).some(([dx, dz]) => !cell(c.x + dx, c.z + dz))) { depth.set(key(c.x, c.z), 1); frontier.push(c); }
}
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const c of frontier) for (const [dx, dz] of Object.values(DIRS)) {
    const n = cell(c.x + dx, c.z + dz);
    if (n && !depth.has(key(n.x, n.z))) { depth.set(key(n.x, n.z), d + 1); next.push(n); }
  }
  frontier = next;
}
const dep = (c) => depth.get(key(c.x, c.z));
const outs = (c) => Object.entries(DIRS).filter(([, [dx, dz]]) => !cell(c.x + dx, c.z + dz)).map(([n]) => n);

// the roof (median of the 3x3 around, as lidar noise is per cell), then whole storeys of 3 blocks under a MD-block mansard
const smoothR = (c) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = cell(c.x + dx, c.z + dz); if (n) v.push(n.R); }
  v.sort((a, b) => a - b); return v[Math.floor(v.length / 2)];
};
const plan = new Map();
for (const c of at.values()) {
  const B = c.G + 1;                                           // first storey's floor slab
  const n = Math.min(8, Math.max(2, Math.round((smoothR(c) - c.G - 1 - MD) / 3)));
  plan.set(key(c.x, c.z), { c, B, n, E: B + 3 * n, top: B + 3 * n + MD });
}
const P = (c) => plan.get(key(c.x, c.z));

const GLASS = (ew) => ({ north: ew ? "false" : "true", south: ew ? "false" : "true", east: ew ? "true" : "false", west: ew ? "true" : "false", waterlogged: "false" });

// 1. plinth: solid from y 0 up to each cell's ground
for (const c of at.values()) for (let y = 0; y <= c.G; y++) g.set(c.x, y, c.z, "stone_bricks");

// 2. storeys: floor slabs (interior oak, a stone string course at the outer ring), walls one block thick
const door = (() => {
  const cands = [...at.values()].filter((c) => dep(c) === 1 && outs(c).includes("north") && c.x % 4 === 0);
  const mid = W / 2;
  return cands.sort((a, b) => Math.abs(a.x - mid) - Math.abs(b.x - mid))[0] ?? null;
})();
const windowsLit = [];
for (const c of at.values()) {
  const { B, n } = P(c);
  const d = dep(c), os = outs(c);
  for (let k = 0; k < n; k++) {
    const yf = B + 3 * k;
    if (d >= 2) { g.set(c.x, yf, c.z, "oak_planks"); continue; }
    g.set(c.x, yf, c.z, "smooth_sandstone");                   // string course / sill
    if (os.length >= 2) {                                      // corner: quoins
      g.set(c.x, yf + 1, c.z, "smooth_sandstone"); g.set(c.x, yf + 2, c.z, "smooth_sandstone");
      continue;
    }
    const o = os[0], [odx, odz] = DIRS[o];
    const t = odz !== 0 ? c.x : c.z;                           // position along the wall
    const isDoor = door && c === door && k === 0;
    if (isDoor) continue;
    if (t % 4 === 1 || t % 4 === 2) {                          // a 2-wide window, the piers (t % 4 = 0, 3) stay stone
      for (const y of [yf + 1, yf + 2]) g.set(c.x, y, c.z, "glass_pane", GLASS(odz !== 0));
      if ((t + k) % 5 === 2) windowsLit.push({ c, k, odx, odz, yy: yf + 2 });
    } else {
      g.set(c.x, yf + 1, c.z, "calcite"); g.set(c.x, yf + 2, c.z, "calcite");
    }
  }
}
// the entrance: a door on the north face, a stone hood over it at the storey-1 line
if (door) {
  const { B } = P(door);
  const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
  g.set(door.x, B + 1, door.z, "dark_oak_door", doorState("lower"));
  g.set(door.x, B + 2, door.z, "dark_oak_door", doorState("upper"));
  for (let dx = -1; dx <= 1; dx++) {
    const c = cell(door.x + dx, door.z);
    if (c && dep(c) === 1) g.set(c.x, B + 3, c.z, "smooth_sandstone_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });
  }
}
// warm light behind some of the windows (an interior glowstone in the air gap)
for (const w of windowsLit) {
  const q = cell(w.c.x - w.odx, w.c.z - w.odz);
  if (q && dep(q) >= 2) g.set(q.x, w.yy, q.z, "glowstone");
}

// 3. mansard: layer j covers depth >= j + 1; the outer edge of each layer is a stair facing outward (a chamfer)
for (const c of at.values()) {
  const { E } = P(c), d0 = dep(c);
  for (let j = 0; j < MD; j++) {
    if (d0 < j + 1) break;
    const y = E + j;
    if (d0 === j + 1) {
      if (j === 0) { g.set(c.x, y, c.z, "smooth_sandstone"); continue; }    // the cornice
      const toward = Object.entries(DIRS).find(([, [dx, dz]]) => { const n = cell(c.x + dx, c.z + dz); return n && dep(n) === d0 - 1; });
      g.set(c.x, y, c.z, "deepslate_tile_stairs", { facing: toward[0], half: "bottom", shape: "straight", waterlogged: "false" });
    } else g.set(c.x, y, c.z, "deepslate_tiles");
  }
}

// 4. roof equipment: two chimneys standing on the flat top, capped with a slab
const deep = [...at.values()].filter((c) => dep(c) >= 5);
const pickNear = (tx, tz) => deep.sort((a, b) => Math.hypot(a.x - tx, a.z - tz) - Math.hypot(b.x - tx, b.z - tz))[0];
const chimneys = [pickNear(6, 8), pickNear(15, 8)].filter(Boolean);
for (const c of chimneys) {
  const { top } = P(c);
  for (let y = top; y < top + 3; y++) g.set(c.x, y, c.z, "stone_bricks");
  g.set(c.x, top + 3, c.z, "smooth_sandstone_slab", { type: "bottom", waterlogged: "false" });
}

const stats = g.save(`${DIR}/FR245184495.nbt`);
const tops = [...plan.values()].map((p) => p.top);
console.log(`FR245184495: ${stats.blocks} blocks, palette ${stats.palette}; top ${Math.min(...tops)}-${Math.max(...tops)}; door ${door ? `${door.x},${door.z}` : "none"}; chimneys ${chimneys.length}`);
