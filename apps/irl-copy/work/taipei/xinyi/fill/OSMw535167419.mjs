import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw535167419";
const W = 19, H = 38, D = 20;
const ROOF = 26;                       // roof top, blocks above lowest ground
const SLABS = [5, 10, 15, 20, 25];     // storey floor levels (5 blocks per storey)
const PANE = "light_blue_stained_glass_pane";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const k = (x, z) => `${x},${z}`;
const fp = new Map();
for (const [x, z, gy] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) fp.set(k(x, z), Number(gy) || 0);
}
const gmin = Math.min(...fp.values());
for (const [kk, v] of fp) fp.set(kk, v - gmin);

// Outward facing directions (dx, dz, facing name)
const DIRS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];
const outward = (x, z) => DIRS.filter(([dx, dz]) => !fp.has(k(x + dx, z + dz)));
const isRing = (x, z) => fp.has(k(x, z)) && outward(x, z).length > 0;

const plan = new Map();
const put = (x, y, z, name, props) => plan.set(`${x},${y},${z}`, { x, y, z, name, props });
const at = (x, y, z) => plan.get(`${x},${y},${z}`)?.name;

// Entrance: non-corner north-facing ring cell nearest the facade centre
const ringCells = [...fp.keys()].map(s => s.split(",").map(Number)).filter(([x, z]) => isRing(x, z));
const nonCorner = ringCells.filter(([x, z]) => outward(x, z).length === 1);
let cand = nonCorner.filter(([x, z]) => outward(x, z)[0][2] === "north");
if (!cand.length) cand = nonCorner;
cand.sort((a, b) => Math.abs(a[0] - 9) - Math.abs(b[0] - 9));
const [ex, ez] = cand[0] ?? [-1, -1];

const lights = [];

for (const [kk, gy] of fp) {
  const [x, z] = kk.split(",").map(Number);

  // Foundation under the building
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  // Floor slabs across the whole footprint (ground, storey lines, roof)
  const levels = new Set([gy, ...SLABS].filter(y => y >= gy && y < ROOF));
  for (const y of levels) put(x, y, z, "white_concrete");

  const out = outward(x, z);
  if (!out.length) continue;               // interior cell: slabs only
  const corner = out.length >= 2;

  for (let y = gy + 1; y <= ROOF; y++) {
    if (levels.has(y)) continue;
    if (corner) { put(x, y, z, "quartz_block"); continue; }
    if (y === ROOF) { put(x, y, z, "light_gray_concrete"); continue; }

    const [ox, oz, facing] = out[0];
    const isEnt = x === ex && z === ez;

    // Entrance door and lintel on the ground storey
    if (y < 5 && isEnt && (y === gy + 1 || y === gy + 2)) {
      put(x, y, z, "iron_door", {
        facing: out[0][2],
        half: y === gy + 1 ? "lower" : "upper",
        hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (y < 5 && isEnt && y === gy + 3) { put(x, y, z, "white_concrete"); continue; }

    let ls = gy;
    for (const s of SLABS) if (s <= y) ls = Math.max(ls, s);
    const pos = y - ls;

    // Top row of ground storey: signage band; top row of upper storeys: spandrel
    if (y < 5 ? y === 4 : pos === 4) {
      put(x, y, z, y < 5 ? "light_gray_concrete" : "white_concrete");
      continue;
    }

    // Mullions every third column
    if ((x + z) % 3 === 0) { put(x, y, z, "white_concrete"); continue; }

    put(x, y, z, PANE);

    // Warm light behind some panes, in the interior cell just inside the facade
    const lightRow = y < 5 ? y === gy + 2 : pos === 2;
    if (lightRow && (x * 5 + z * 3 + y) % 7 === 0) {
      const ix = x - ox, iz = z - oz;
      if (fp.has(k(ix, iz)) && !isRing(ix, iz)) lights.push([ix, y, iz]);
    }
  }
}

for (const [ix, y, iz] of lights) put(ix, y, iz, "glowstone");

// Roof plant penthouse, solid, centred on the roof
for (let x = 5; x <= 13; x++) {
  for (let z = 6; z <= 13; z++) {
    if (!fp.has(k(x, z))) continue;
    const edge = x === 5 || x === 13 || z === 6 || z === 13;
    for (let y = ROOF; y <= 28; y++) {
      if (y === 27 && edge && (x + z) % 2 === 0) put(x, y, z, PANE);
      else put(x, y, z, "light_gray_concrete");
    }
    put(x, 29, z, "light_gray_concrete");
  }
}

// Lightning-rod mast on the penthouse
if (fp.has(k(9, 10))) for (let y = 30; y <= 34; y++) put(9, y, 10, "lightning_rod");

// Glass panes connect to neighbouring panes in the same plane
for (const e of plan.values()) {
  if (e.name !== PANE) continue;
  const { x, y, z } = e;
  e.props = {
    north: at(x, y, z - 1) === PANE ? "true" : "false",
    south: at(x, y, z + 1) === PANE ? "true" : "false",
    east: at(x + 1, y, z) === PANE ? "true" : "false",
    west: at(x - 1, y, z) === PANE ? "true" : "false",
    waterlogged: "false",
  };
}

const g = new Voxels([W, H, D]);
for (const e of plan.values()) {
  if (e.props) g.set(e.x, e.y, e.z, e.name, e.props);
  else g.set(e.x, e.y, e.z, e.name);
}
g.save(`${DIR}/${ID}.nbt`);
