// FR245184556: a 5-storey Haussmann-type block of pale stone (calcite render over stone-brick foundations) with a
// zinc-grey (deepslate tile) mansard, stone string courses and a cornice, glass panes in stone bays, a few lit
// windows, one entrance, and brick chimney stacks. Massing follows the lidar roof, median-smoothed and tiered to
// 5-block storeys; the facade is a 1-block shell, then solid mass, with an air pocket only behind each window.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184556.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..52, z 0..27

const W = 53, D = 28, Y = 39;
const at = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const key = (x, z) => `${x},${z}`;
const inside = (x, z) => at.has(key(x, z));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Roof tiers: 3x3 median of the lidar roof, rounded to 5-block storeys (at least one).
const tier = new Map();
for (const [k, c] of at) {
  const [x, z] = k.split(",").map(Number), vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at.get(key(x + dx, z + dz)); if (n) vals.push(n.r); }
  vals.sort((a, b) => a - b);
  tier.set(k, Math.max(5, Math.round(vals[vals.length >> 1] / 5) * 5));
}
const H = (x, z) => tier.get(key(x, z));

// Facade depth: 1 on the footprint edge or where the tier steps, then 2, 3 ... inward (Manhattan distance).
const depth = new Map(); let frontier = [];
for (const [k] of at) {
  const [x, z] = k.split(",").map(Number), h = H(x, z);
  const edge = NB.some(([dx, dz]) => !inside(x + dx, z + dz) || H(x + dx, z + dz) !== h);
  if (edge) { depth.set(k, 1); frontier.push([x, z]); }
}
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const [x, z] of frontier) for (const [dx, dz] of NB) {
    const k = key(x + dx, z + dz);
    if (inside(x + dx, z + dz) && !depth.has(k)) { depth.set(k, d + 1); next.push([x + dx, z + dz]); }
  }
  frontier = next;
}

// Outward normal of a facade cell (the side with no footprint or a lower tier beside it).
const outward = (x, z) => {
  const h = H(x, z), open = ([dx, dz]) => !inside(x + dx, z + dz) || H(x + dx, z + dz) !== h;
  const ox = open([1, 0]) ? 1 : open([-1, 0]) ? -1 : 0;
  const oz = open([0, 1]) ? 1 : open([0, -1]) ? -1 : 0;
  return ox && !oz ? [ox, 0] : oz && !ox ? [0, oz] : [ox || 1, oz || 0];
};

const v = new Voxels([W, Y, D]);
const windows = [];   // facade window cells: x, y, z, outward normal

for (const [k, c] of at) {
  const [x, z] = k.split(",").map(Number), d = depth.get(k), h = H(x, z);
  const mansard = h >= 15, wt = mansard ? h - 4 : h;
  const top = mansard ? wt + Math.min(d, 4) : h + (d === 1 ? 1 : 0);
  const eaveAt = d === 1 ? top - 1 : -1;
  for (let y = 0; y < top; y++) {
    if (y < c.g) { v.set(x, y, z, "stone_bricks"); continue; }                             // foundation to the lowest-ground-free cell
    if (mansard && y >= wt) { v.set(x, y, z, y === eaveAt ? "smooth_stone" : "deepslate_tiles"); continue; }   // attic, eave lip
    if (!mansard && y === h - 1) { v.set(x, y, z, "stone_bricks"); continue; }            // flat roof deck
    if (!mansard && y >= h) { v.set(x, y, z, "smooth_stone"); continue; }                  // parapet
    const string = d === 1 && y % 5 === 0;                                                 // storey lines
    v.set(x, y, z, string ? "smooth_stone" : "calcite");
  }
  // bay windows: panes on rows 1-3 of each storey, 2 wide between 2-wide piers
  if (d === 1) {
    const [ox, oz] = outward(x, z);
    const u = ox ? z : x;
    for (let y = 1; y < top - 1; y++) {
      if (y % 5 === 0 || y % 5 === 4) continue;
      if (mansard && y >= wt) continue;
      if (!mansard && y >= h - 1) continue;
      if (u % 4 === 0 || u % 4 === 3) continue;
      windows.push({ x, y, z, ox, oz, u });
    }
  }
}

// Panes in the facade, with a 1-deep air gap behind (warm glowstone behind some of them).
for (const w of windows) {
  v.set(w.x, w.y, w.z, "glass_pane", w.ox ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
                                          : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
  // the air pocket is the cell behind the pane, and only if that cell is inside the shell (not another facade cell)
  const bx = w.x - w.ox, bz = w.z - w.oz;
  if (!inside(bx, bz) || depth.get(key(bx, bz)) < 2) continue;
  const lit = (Math.floor(w.u / 4) + Math.floor(w.y / 5)) % 3 === 0;
  v.set(bx, w.y, bz, lit ? "glowstone" : "air");
}

// Entrance on the z = D-1 face: a door in a stone surround, air behind the leaf.
const doorX = 26, doorZ = D - 1, g0 = at.get(key(doorX, doorZ)).g;
v.set(doorX, g0, doorZ, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
v.set(doorX, g0 + 1, doorZ, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
v.set(doorX, g0, doorZ - 1, "air");
v.set(doorX, g0 + 1, doorZ - 1, "air");
v.set(doorX, g0 + 2, doorZ, "stone_bricks");

// Brick chimney stacks on the mansard's flat top, a few blocks above the zinc.
for (const [k] of at) {
  const [x, z] = k.split(",").map(Number), h = H(x, z);
  if (h >= 20 && depth.get(k) >= 4 && x % 9 === 4 && z % 7 === 3) for (let y = h; y < h + 3; y++) v.set(x, y, z, "bricks");
}

const out = v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184556.nbt");
console.log(JSON.stringify({ cells: at.size, windows: windows.length, ...out }));
