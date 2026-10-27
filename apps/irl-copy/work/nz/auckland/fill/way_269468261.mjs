// A two-storey brick commercial block (1930s stripped classical, Auckland): a one-storey wing and a two-storey core
// on the lidar tiers (4 / 6 / 8 blocks, parapet to 9), shopfronts and a canopied entrance on the south street face,
// stone quoins, string course and cornice, glass panes in brick piers, warm lights behind some glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269468261.cells.json", "utf8"));
const X = 57, Y = 21, Z = 46;

// footprint, ground and lidar roof per cell
const key = (x, z) => `${x},${z}`;
const G = new Map(), R = new Map();
for (const [x, z, g, r] of cells) { G.set(key(x, z), g); R.set(key(x, z), r); }
const inF = (x, z) => G.has(key(x, z));

// lidar noise to clean tiers: 3x3 median of the roof, then three flat heights (wing 4, body 6, core 8)
const median = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const H = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inF(x + dx, z + dz)) v.push(R.get(key(x + dx, z + dz)));
  const m = median(v);
  H.set(key(x, z), m <= 4 ? 4 : m <= 6 ? 6 : 8);
}
const hgt = (x, z) => (inF(x, z) ? H.get(key(x, z)) : -1);
const gnd = (x, z) => G.get(key(x, z));

const DIRS = [
  { n: "south", dx: 0, dz: 1 }, { n: "north", dx: 0, dz: -1 },
  { n: "east", dx: 1, dz: 0 }, { n: "west", dx: -1, dz: 0 },
];
// faces that open onto air at height y: outside the footprint, or a neighbour whose top is below y
const exposed = (x, z, y) => DIRS.filter((d) => hgt(x + d.dx, z + d.dz) <= y);
const perimeter = (x, z) => DIRS.some((d) => !inF(x + d.dx, z + d.dz));
const paneState = (d) => (d.dz !== 0
  ? { east: "true", west: "true", north: "false", south: "false" }
  : { north: "true", south: "true", east: "false", west: "false" });

// the street entrance: the south-edge cell nearest the middle of that edge
const southEdge = cells.filter(([x, z]) => !inF(x, z + 1));
const midX = southEdge.reduce((s, [x]) => s + x, 0) / southEdge.length;
const [doorX, doorZ] = southEdge.reduce((best, c) => (Math.abs(c[0] - midX) < Math.abs(best[0] - midX) ? c : best))
  .slice(0, 2);
const doorLow = gnd(doorX, doorZ) === 0 ? 1 : 2;

const g = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => { if (y >= 0 && y < Y) g.set(x, y, z, block, state); };

// the deck (top layer of each tier, interior) and the floor slabs
const slab = (x, z, y) => {
  const h = hgt(x, z);
  if (y === gnd(x, z) || y === h - 1 || (y === 4 && h >= 6)) return true;
  return DIRS.some((d) => inF(x + d.dx, z + d.dz) && hgt(x + d.dx, z + d.dz) < h && hgt(x + d.dx, z + d.dz) - 1 === y);
};

// the facade: one block of wall, with the band rules (base, lintel, string course, cornice) and the openings
const facade = (x, y, z, ex, h, gr) => {
  const corner = ex.some((d) => d.dz !== 0) && ex.some((d) => d.dx !== 0);
  const d = ex.find((e) => e.n === "south") ?? ex.find((e) => e.n === "north") ?? ex.find((e) => e.n === "east") ?? ex[0];
  const along = d.dz !== 0 ? x : z;
  const front = d.n === "south" && z === doorZ;
  const inDoor = front && x === doorX;
  if (inDoor && (y === doorLow || y === doorLow + 1)) {
    return put(x, y, z, "dark_oak_door", { facing: "south", half: y === doorLow ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
  }
  if (front && y === 3 && Math.abs(x - doorX) <= 2) return put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  if (corner) return put(x, y, z, y < 4 ? "stone_bricks" : "smooth_quartz");
  if (y === gr) return put(x, y, z, "stone_bricks");
  if (y === 3 || y === h - 1 || (y === 4 && h >= 8)) return put(x, y, z, "smooth_quartz");
  if (y < 4) {
    if (front && Math.abs(x - doorX) === 2 && y === 2) return put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
    const pier = front ? along % 4 === 0 : along % 3 === 0;
    return pier ? put(x, y, z, "stone_bricks") : put(x, y, z, "glass_pane", paneState(d));
  }
  const pier = along % 3 === 0;
  if (pier) return put(x, y, z, "bricks");
  put(x, y, z, "glass_pane", paneState(d));
  // a warm light behind some panes, in the air of the room inside
  if (along % 6 === 2 && (y === 2 || y === 5 || y === 6)) {
    const ix = x - d.dx, iz = z - d.dz;
    if (inF(ix, iz) && g.val(ix, y, iz) === 0) put(ix, y, iz, "glowstone");
  }
};

// build column by column
for (const k of G.keys()) {
  const [x, z] = k.split(",").map(Number);
  const gr = gnd(x, z), h = hgt(x, z);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");        // foundation to the ground
  for (let y = gr; y < h; y++) {
    const ex = exposed(x, z, y);
    if (ex.length) facade(x, y, z, ex, h, gr);
    else if (slab(x, z, y)) put(x, y, z, y === h - 1 ? "light_gray_concrete" : "smooth_stone");
  }
  if (perimeter(x, z)) put(x, h, z, "bricks");   // a solid parapet course, one block above the wall head
}

// roof plant on the core: a stair housing and a few units, inset from the parapet
const core = [];
for (const k of H.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (hgt(x, z) !== 8) continue;
  if (DIRS.every((d) => hgt(x + 2 * d.dx, z + 2 * d.dz) === 8 && hgt(x + d.dx, z + d.dz) === 8)) core.push([x, z]);
}
if (core.length) {
  const cx = core.reduce((s, c) => s + c[0], 0) / core.length, cz = core.reduce((s, c) => s + c[1], 0) / core.length;
  const [hx, hz] = core.reduce((b, c) => (Math.hypot(c[0] - cx, c[1] - cz) < Math.hypot(b[0] - cx, b[1] - cz) ? c : b));
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) put(hx + dx, 8, hz + dz, "stone_bricks");
  for (const [dx, dz] of [[0, 0], [1, 0]]) put(hx + dx, 9, hz + dz, "stone_bricks");
  for (const [x, z] of core) if ((x * 7 + z * 3) % 13 === 0 && g.val(x, 8, z) === 0 && g.val(x, 7, z) !== 0) put(x, 8, z, "iron_block");
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269468261.nbt");
