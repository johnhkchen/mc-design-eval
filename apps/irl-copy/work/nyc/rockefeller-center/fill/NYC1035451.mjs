// 423 Madison Avenue, 1921: a seven-storey brick mixed-use block on a granite base, in the Renaissance Revival manner
// of its decade. Storeys are 3 blocks: a calcite storey line (sill) and two rows of glazing between piers. Shopfronts
// with granite piers on the ground floor, a double-door residential entrance and a shop door on the north face, a
// calcite cornice with a stone brick parapet on the edge of each tier, and a penthouse on the tallest tier.
// Lidar roofs are quantised to storeys (3, 9, 15, 18, 21) and majority-filtered on a 3x3 so single returns are not spikes.
// Solid massing; each window is a pane on the face with an air gap behind it, lit in some by glowstone or shroomlight.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const W = 23, D = 8, Y = 33;
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035451.cells.json`, "utf8"));

// Lidar roof per cell (0 = no return: a one-storey wing). Cells not listed are outside the footprint.
const roof = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, , r] of cells) roof[z][x] = r;
const q = (r) => (r == null ? null : Math.max(3, Math.min(21, Math.round(r / 3) * 3)));
const H = Array.from({ length: D }, (_, z) => Array.from({ length: W }, (_, x) => {
  const n = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const xx = x + dx, zz = z + dz;
    if (xx < 0 || zz < 0 || xx >= W || zz >= D) continue;
    const v = q(roof[zz][xx]); if (v != null) n.set(v, (n.get(v) || 0) + 1);
  }
  let best = q(roof[z][x]) ?? 3, bc = n.get(best) || 0;
  for (const [v, c] of n) if (c > bc) { best = v; bc = c; }
  return best;
}));
const h = (x, z) => H[z][x];
const inFoot = (x, z) => x >= 0 && z >= 0 && x < W && z < D && roof[z][x] != null;
const facade = (x, z) => z === 0 || z === D - 1 || x === 0 || x === W - 1;

const g = new Voxels([W, Y, D]);
const put = (x, y, z, b, s) => g.set(x, y, z, b, s);
const doorState = (facing, half, hinge) => ({ facing, half, hinge, open: "false", powered: "false" });

// Solid massing: brick to each cell's tier, a tar roof on the interior tops.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFoot(x, z)) continue;
  const top = h(x, z);
  for (let y = 0; y < top; y++) put(x, y, z, "bricks");
  if (!facade(x, z)) put(x, top - 1, z, "smooth_stone");
}

// Granite base, calcite storey lines, cornice and parapet on the facade; parapets on the open edge of each lower tier.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFoot(x, z)) continue;
  const top = h(x, z);
  if (facade(x, z)) {
    put(x, 0, z, "polished_granite");
    for (let y = 3; y < top; y += 3) put(x, y, z, "calcite");
    put(x, top, z, "calcite");
    put(x, top + 1, z, "stone_brick_wall");
  } else if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => inFoot(x + dx, z + dz) && h(x + dx, z + dz) < top)) {
    put(x, top, z, "stone_brick_wall");
  }
}

// Windows: glass panes in the bays between brick piers, an air gap behind each, warm light in some.
const panes = new Set();
const key = (x, y, z) => `${x},${y},${z}`;
const lit = (x, y, z) => { const s = (x * 5 + y * 3 + z * 7) % 11; return s === 0 ? "glowstone" : s === 4 ? "shroomlight" : null; };
// The lamp stands on the floor of its pocket (the sill row), so only the bottom row of a bay is ever lit.
const bay = (x, y, z, dx, dz, bottom) => {
  put(x, y, z, "glass_pane"); panes.add(key(x, y, z));
  const l = bottom ? lit(x, y, z) : null;
  put(x + dx, y, z + dz, l ?? "air");
};
const pier = (x, y, z, k) => put(x, y, z, k === 0 ? "polished_granite" : "bricks");

const entrance = (x, z) => z === D - 1 && (x === 10 || x === 11);
const shopDoor = (x, z) => z === 0 && x === 19;

// Street faces (north z=0 and south z=D-1): piers at x%3==0, glazing between.
for (const z of [0, D - 1]) {
  const dz = z === 0 ? 1 : -1;
  for (let x = 0; x < W; x++) {
    if (!inFoot(x, z)) continue;
    for (let y = 1; y < h(x, z); y++) {
      const k = Math.floor(y / 3), r = y % 3;
      if (r === 0) continue;                          // storey line, set above
      if (entrance(x, z) || shopDoor(x, z)) continue; // doors below
      if (x % 3 === 0) { pier(x, y, z, k); continue; }
      bay(x, y, z, 0, dz, r === 1);
    }
  }
}

// Ends (west x=0, east x=W-1): windows on the middle four cells, piers at the corners.
for (const x of [0, W - 1]) {
  const dx = x === 0 ? 1 : -1;
  for (let z = 0; z < D; z++) {
    if (!inFoot(x, z)) continue;
    for (let y = 1; y < h(x, z); y++) {
      const k = Math.floor(y / 3), r = y % 3;
      if (r === 0) continue;
      if (z === 0 || z === 1 || z === D - 2 || z === D - 1) { pier(x, y, z, k); continue; }
      bay(x, y, z, dx, 0, r === 1);
    }
  }
}

// Residential entrance on the south face: double doors in a vestibule, granite piers with lanterns, a dark fascia over.
for (const x of [10, 11]) {
  put(x, 1, D - 1, "dark_oak_door", doorState("south", "lower", x === 10 ? "left" : "right"));
  put(x, 2, D - 1, "dark_oak_door", doorState("south", "upper", x === 10 ? "left" : "right"));
  put(x, 1, D - 2, "air"); put(x, 2, D - 2, "air");
}
for (let x = 9; x <= 12; x++) put(x, 3, D - 1, "black_concrete");
for (const x of [9, 12]) if (h(x, D - 1) > 3) put(x, 2, D - 1, "lantern", { hanging: "true" });

// Shop door on the north face, with the vestibule behind it.
put(19, 1, 0, "dark_oak_door", doorState("north", "lower", "left"));
put(19, 2, 0, "dark_oak_door", doorState("north", "upper", "left"));
put(19, 1, 1, "air"); put(19, 2, 1, "air");

// Penthouse on the tallest tier, a calcite box two storeys high where the tier is flat.
const penthouse = [];
for (let z = 2; z <= 5; z++) for (let x = 8; x <= 11; x++) if (h(x, z) === 21) penthouse.push([x, z]);
if (penthouse.length === 16) for (const [x, z] of penthouse) { put(x, 21, z, "calcite"); put(x, 22, z, "calcite"); put(x, 23, z, "smooth_stone"); }

// Glass panes connect to their neighbours in the plane of their face.
for (const k of panes) {
  const [x, y, z] = k.split(",").map(Number);
  const on = (a, b, c) => (panes.has(key(a, b, c)) ? "true" : "false");
  put(x, y, z, "glass_pane", { north: on(x, y, z - 1), south: on(x, y, z + 1), east: on(x + 1, y, z), west: on(x - 1, y, z) });
}

// Nothing floats: every block above y 0 has a block directly under it (or is a door's upper half).
const floating = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) for (let y = 1; y < Y; y++) {
  if (!g.get(x, y, z) || g.get(x, y, z).block === "minecraft:dark_oak_door" && g.get(x, y, z).state?.half === "upper") continue;
  if (!g.get(x, y - 1, z)) floating.push([x, y, z, g.get(x, y, z).block]);
}
console.log("floating", floating.length, JSON.stringify(floating.slice(0, 20)));

g.save(`${DIR}/NYC1035451.nbt`);

// Summary for the check: tier counts and the roof map (tiers in blocks).
const tiers = {}; for (const row of H) for (const v of row) tiers[v] = (tiers[v] || 0) + 1;
console.log("cells", cells.length, "tiers", JSON.stringify(tiers));
for (let z = 0; z < D; z++) console.log(H[z].map((v) => String(v).padStart(2)).join(" "));
