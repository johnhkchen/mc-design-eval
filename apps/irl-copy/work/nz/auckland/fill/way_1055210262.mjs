import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Auckland Seafarers Centre: a late-20th-century concrete-frame block on the harbour edge. Each storey is four blocks:
// a floor line, two rows of glazing between white piers, and a header. Solid floor and header rows run across the whole
// footprint, so every storey and setback stands on the one below and the glass has an air gap behind it. A stone plinth
// sits at street level, the entrance is on the street (south) face, and the roof is a stepped lid with a cornice edge,
// plant boxes and a mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const NAME = "way_1055210262";
const SIZE = [44, 48, 41];
const STOREY = 4;
const SIDES = { e: [1, 0], w: [-1, 0], n: [0, -1], s: [0, 1] };

const cells = JSON.parse(readFileSync(`${DIR}/${NAME}.cells.json`, "utf8"));   // [x, z, ground, roof]

const key = (x, z) => `${x},${z}`;
const roofLidar = new Map(cells.map(([x, z, , roof]) => [key(x, z), roof]));
const inFoot = (x, z) => roofLidar.has(key(x, z));

// Lidar noise: dropouts read 0 or 4 beside real roof, so each cell takes the median of the good readings around it and
// snaps to whole storeys. Every tier comes out flat, and the setbacks fall where the massing really steps.
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];
const tierOf = new Map();
for (const [x, z] of cells) {
  let vals = [];
  for (const r of [2, 4]) {
    vals = [];
    for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      const v = roofLidar.get(key(x + dx, z + dz)); if (v !== undefined && v >= 5) vals.push(v);
    }
    if (vals.length >= 5) break;
  }
  tierOf.set(key(x, z), Math.max(8, Math.round((vals.length ? median(vals) : 8) / STOREY) * STOREY));
}
const tier = (x, z) => tierOf.get(key(x, z));

// the sides of a wall voxel that face open air: off the footprint, or over a lower tier's roof
const exposed = (x, y, z) => Object.keys(SIDES).filter((d) => {
  const [dx, dz] = SIDES[d], nx = x + dx, nz = z + dz;
  return !inFoot(nx, nz) || tier(nx, nz) <= y;
});

// the entrance: the street-facing (south) wall at its furthest south row, at the middle of that row
const southRow = cells.filter(([x, z]) => exposed(x, 1, z).join() === "s");
const maxZ = Math.max(...southRow.map(([, z]) => z));
const frontage = southRow.filter(([, z]) => z === maxZ).sort((a, b) => a[0] - b[0]);
const EX = frontage[frontage.length >> 1][0], EZ = maxZ;

const plan = new Map();   // "x,y,z" -> { block, state, pane? }
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });
const has = (x, y, z) => plan.has(`${x},${y},${z}`);
const windows = [];

const CORNICE = "stone_brick_slab";
const FLOOR = "light_gray_concrete";
const GLASS = "light_blue_stained_glass_pane";

for (const [x, z] of cells) {
  const top = tier(x, z);
  for (let y = 0; y < top; y++) {
    const k = Math.floor(y / STOREY), r = y % STOREY;
    const sides = exposed(x, y, z), ext = sides.length > 0;

    // roof: a cornice ledge at the edge, a flat deck inside
    if (y === top - 1) {
      if (ext) put(x, y, z, CORNICE, { type: "bottom", waterlogged: "false" });
      else put(x, y, z, "smooth_stone");
      continue;
    }
    // floor line: plinth at street level, spandrel band above; solid across the footprint so storeys stack
    if (r === 0) { put(x, y, z, ext && k === 0 ? "stone_bricks" : FLOOR); continue; }
    // header: solid across the footprint; over the entrance bay it is a dark oak canopy strip
    if (r === 3) {
      if (ext && k === 0 && z === EZ && Math.abs(x - EX) <= 1 && sides.includes("s")) put(x, y, z, "dark_oak_planks");
      else put(x, y, z, ext ? FLOOR : "smooth_stone");
      continue;
    }
    // glazing rows: air behind the glass inside, so only the outer skin is filled
    if (!ext) continue;

    const eW = sides.includes("e") || sides.includes("w"), nS = sides.includes("n") || sides.includes("s");
    const corner = eW && nS;
    const bay = eW ? z : x;               // a wall that runs along z is numbered by z
    if (k === 0 && z === EZ && x === EX && !eW) {
      put(x, y, z, "dark_oak_door", { facing: "south", half: r === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const flank = k === 0 && z === EZ && Math.abs(x - EX) === 1 && !eW;
    if (corner || flank || bay % 3 === 0) {
      put(x, y, z, k === 0 ? "stone_bricks" : tier(x, z) >= 20 ? "smooth_quartz" : "white_concrete");
    } else {
      plan.set(`${x},${y},${z}`, { block: GLASS, state: null, pane: true });
      windows.push({ x, y, z, side: sides[0], bay, k, r });
    }
  }
}

// warm light behind some glass on the first glazing row: glowstone and shroomlight, spread by bay and storey
for (const w of windows) {
  if (w.r !== 1) continue;
  const [dx, dz] = SIDES[w.side], ix = w.x - dx, iz = w.z - dz, iy = w.y;
  if (!inFoot(ix, iz) || tier(ix, iz) <= iy || exposed(ix, iy, iz).length || has(ix, iy, iz)) continue;
  const n = (w.bay + 2 * w.k) % 7;
  if (n === 0) put(ix, iy, iz, "glowstone");
  else if (n === 4) put(ix, iy, iz, "shroomlight");
}

// a lantern just inside the entrance
if (inFoot(EX, EZ - 1) && !has(EX, 1, EZ - 1)) put(EX, 1, EZ - 1, "lantern", { hanging: "false", waterlogged: "false" });

// roof plant: 2x2 boxes on the tiers from 16 up, set on the deck; a mast on the tallest core
const plantSpots = [];
for (const [x, z] of cells) {
  const T = tier(x, z);
  if (T < 16 || x % 7 !== 3 || z % 7 !== 3) continue;
  const quad = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (quad.every(([a, b]) => inFoot(a, b) && tier(a, b) === T && !exposed(a, T - 1, b).length)) {
    for (const [a, b] of quad) put(a, T, b, FLOOR);
    plantSpots.push([x, T, z]);
  }
}
const maxTier = Math.max(...cells.map(([x, z]) => tier(x, z)));
const mast = cells.find(([x, z]) => tier(x, z) === maxTier && !exposed(x, maxTier - 1, z).length && !has(x, maxTier, z));
if (mast) for (let y = maxTier; y < maxTier + 4; y++) put(mast[0], y, mast[1], "iron_bars");

// glass panes connect to their neighbours: a pane joins a pane or a full block in its wall plane
const FULL_NOT = /door|slab|lantern|pane|iron_bars|lightning/;
const joins = (x, y, z) => {
  const p = plan.get(`${x},${y},${z}`);
  if (!p) return false;
  return p.pane || !FULL_NOT.test(p.block);
};

const g = new Voxels(SIZE);
for (const [k, v] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  if (v.pane) {
    const c = (dx, dz) => (joins(x + dx, y, z + dz) ? "true" : "false");
    g.set(x, y, z, v.block, { north: c(0, -1), east: c(1, 0), south: c(0, 1), west: c(-1, 0), waterlogged: "false" });
  } else {
    g.set(x, y, z, v.block, v.state);
  }
}

const out = g.save(`${DIR}/${NAME}.nbt`);
console.log(`built ${NAME}: ${out.blocks} blocks, ${out.palette} palette entries, tiers ${[...new Set(cells.map(([x, z]) => tier(x, z)))].sort((a, b) => a - b).join(",")}, entrance (${EX}, ${EZ}), ${plantSpots.length} plant boxes`);
