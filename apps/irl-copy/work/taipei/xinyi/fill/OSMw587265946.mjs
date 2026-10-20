import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587265946";
const W = 46, H = 33, D = 19;
const ROOF_Y = 21;           // parapet top, 4 storeys of 5 blocks plus parapet

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Palette: 1970s-80s Taipei mid-rise, light concrete frame, aluminium-framed glass, stone base
const FOUND = "stone_bricks";
const BASE = "polished_andesite";
const WALL = "white_concrete";
const SLAB = "light_gray_concrete";
const PANE = "light_blue_stained_glass_pane";
const SHOP = "tinted_glass";
const LIGHT = "glowstone";

const key = (x, z) => x + "," + z;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), Math.round(gr));
const has = (x, z) => G.has(key(x, z));
const DIRS = { west: [-1, 0], east: [1, 0], north: [0, -1], south: [0, 1] };
const OPP = { west: "east", east: "west", north: "south", south: "north" };
const missingOf = (x, z) => Object.keys(DIRS).filter(f => !has(x + DIRS[f][0], z + DIRS[f][1]));
const isInterior = (x, z) => has(x, z) && missingOf(x, z).length === 0;

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const list = cells.map(([x, z]) => [x, z]);

// Entrance: middle of the longest south-facing (else north-facing) plain facade run
function pickEntrance() {
  for (const face of ["south", "north"]) {
    const run = list
      .filter(([x, z]) => {
        const m = missingOf(x, z);
        return m.length === 1 && m[0] === face;
      })
      .sort((a, b) => (face === "south" || face === "north") ? a[0] - b[0] : a[1] - b[1]);
    if (run.length >= 5) return { face, run, idx: Math.floor(run.length / 2) };
  }
  return null;
}
const ent = pickEntrance();
const entKey = ent ? key(...ent.run[ent.idx]) : null;
const entBand = new Set();
if (ent) for (let j = ent.idx - 2; j <= ent.idx + 2; j++) if (ent.run[j]) entBand.add(key(...ent.run[j]));

for (const [x, z] of list) {
  const gr = G.get(key(x, z));
  const miss = missingOf(x, z);
  const perim = miss.length > 0;
  const corner = miss.length >= 2;
  const face = miss[0];

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y <= gr; y++) put(x, y, z, FOUND);

  for (let y = gr + 1; y <= ROOF_Y; y++) {
    const s = Math.floor(y / 5);
    const ly = y % 5;

    if (y === ROOF_Y) {
      if (perim) put(x, y, z, WALL);
      continue;
    }
    if (y === 20) {
      put(x, y, z, SLAB);      // roof slab / top floor soffit line
      continue;
    }
    if (!perim) {
      if (ly === 0) put(x, y, z, SLAB); // interior floor slabs, air elsewhere
      continue;
    }

    // Perimeter
    if (corner) { put(x, y, z, WALL); continue; }

    const along = (face === "north" || face === "south") ? x : z;
    const isMullion = along % 3 === 0;

    if (y === gr + 1) { put(x, y, z, BASE); continue; }     // base course
    if (ly === 0) { put(x, y, z, WALL); continue; }          // floor band
    if (ly === 4) { put(x, y, z, SLAB); continue; }          // lintel / spandrel

    if (s === 0) {
      // Shopfront: tinted glass with pillars
      put(x, y, z, isMullion ? WALL : SHOP);
      continue;
    }

    if (isMullion) { put(x, y, z, WALL); continue; }
    put(x, y, z, PANE);

    // Warm light behind some glass, in the interior cell just inside
    if (ly === 2 && along % 6 === 1) {
      const dx = -DIRS[face][0], dz = -DIRS[face][1];
      const ix = x + dx, iz = z + dz;
      if (isInterior(ix, iz)) put(ix, y, iz, LIGHT);
    }
  }
}

// Entrance: doors, canopy, surround
if (ent) {
  const [ex, ez] = ent.run[ent.idx];
  const egr = G.get(key(ex, ez));
  const facing = ent.face;
  put(ex, egr + 1, ez, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ex, egr + 2, ez, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  for (let j = ent.idx - 2; j <= ent.idx + 2; j++) {
    const c = ent.run[j];
    if (!c) continue;
    const [cx, cz] = c;
    const cgr = G.get(key(cx, cz));
    if (j !== ent.idx) put(cx, cgr + 1, cz, BASE);
    put(cx, cgr + 3, cz, SLAB); // canopy band over the entrance
    if (j !== ent.idx) {
      put(cx, cgr + 2, cz, WALL);
    }
  }
  // Door reveals
  for (const j of [ent.idx - 1, ent.idx + 1]) {
    const c = ent.run[j];
    if (c) {
      const [cx, cz] = c;
      const cgr = G.get(key(cx, cz));
      put(cx, cgr + 1, cz, BASE);
    }
  }
}

// Roof: mechanical plant on a grid and a lightning rod mast near the centre
let cxs = 0, czs = 0, n = 0;
for (const [x, z] of list) { cxs += x; czs += z; n++; }
const mx = cxs / n, mz = czs / n;
let best = null, bestD = Infinity;
for (const [x, z] of list) {
  if (!isInterior(x, z)) continue;
  const d = (x - mx) ** 2 + (z - mz) ** 2;
  if (d < bestD) { bestD = d; best = [x, z]; }
}
for (const [x, z] of list) {
  if (!isInterior(x, z)) continue;
  if ((x % 7 === 2) && (z % 5 === 2)) put(x, ROOF_Y, z, "iron_block");
}
if (best) {
  const [bx, bz] = best;
  put(bx, ROOF_Y, bz, "iron_block");
  put(bx, ROOF_Y + 1, bz, "lightning_rod", { facing: "up", powered: "false" });
  put(bx, ROOF_Y + 2, bz, "lightning_rod", { facing: "up", powered: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
