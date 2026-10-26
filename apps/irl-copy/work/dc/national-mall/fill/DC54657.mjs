import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC54657.cells.json`, "utf8"));

const W = 24, H = 26, D = 34;
const g = new Voxels([W, H, D]);

// 1970s Washington office block: pale precast piers, blue-tint glass, granite base.
const FOUND = "stone_bricks";
const BASE = "smooth_stone";
const PIER = "white_concrete";
const SPAND = "light_gray_concrete";
const GLASS = "light_blue_stained_glass";
const ROOF = "light_gray_concrete";
const CAP = "smooth_stone";
const LIGHT = "shroomlight";
const STOREY = 3;

const key = (x, z) => `${x},${z}`;
const has = (x, z) => map.has(key(x, z));
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

// Pass 1: clamp raw values and find the common storey datum (lowest ground).
const raw = [];
for (const [x, z, gr0, r0] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  raw.push([x, z, Math.max(0, Math.round(gr0)), Math.round(r0)]);
}
const baseG = Math.min(...raw.map(c => c[2]));

// Pass 2: snap roofs to clean storey tiers measured from the common datum.
const map = new Map();
for (const [x, z, gr, r0] of raw) {
  let r = baseG + STOREY * Math.round((r0 - baseG) / STOREY);
  r = Math.max(gr + STOREY, Math.min(H - 3, r));
  map.set(key(x, z), { g: gr, r });
}

// Entrance: centre bay of the north (low-z) face.
const doorX = 12;
const doorZ = map.has(key(doorX, 0)) ? 0 : 1;
const doorOK = map.has(key(doorX, doorZ));

// Penthouse: one central block on the roof of the tallest tier.
const maxR = Math.max(...[...map.values()].map(c => c.r));
const phCells = [];
for (let x = 8; x <= 15; x++) for (let z = 13; z <= 20; z++) {
  const c = map.get(key(x, z));
  if (c && c.r === maxR) phCells.push([x, z]);
}

for (const [k, c] of map) {
  const [x, z] = k.split(",").map(Number);
  const { g: gr, r } = c;

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  const faces = [];
  if (!has(x, z - 1)) faces.push({ dir: "north", i: x });
  if (!has(x, z + 1)) faces.push({ dir: "south", i: x });
  if (!has(x - 1, z)) faces.push({ dir: "west", i: z });
  if (!has(x + 1, z)) faces.push({ dir: "east", i: z });
  const exterior = faces.length > 0;

  for (let y = gr; y < r; y++) {
    // Storey rows measured from the common datum so floors line up across the slope.
    const row = (y - baseG) % STOREY;
    const isTopCornice = exterior && y === r - 1;

    // Interior: floor slab per storey, air gap otherwise.
    if (row === 0) g.set(x, y, z, SPAND);
    if (!exterior) continue;

    for (const f of faces) {
      let block;
      if (y < baseG + STOREY) block = BASE;          // granite-look base course
      else if (isTopCornice) block = BASE;           // cornice band under parapet
      else if (row === 0) block = SPAND;             // spandrel
      else if (f.i % 2 === 0) block = PIER;          // precast piers
      else block = GLASS;

      if (block === GLASS && hash(x, y, z) % 23 === 0) block = LIGHT;
      g.set(x, y, z, block);
    }
  }

  // Entrance: double door in the centre bay of the north face, with lintel.
  if (doorOK && x === doorX && z === doorZ && !has(x, z - 1)) {
    g.set(x, gr, z, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, gr + 1, z, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, gr + 2, z, PIER);
  }

  // Roof: solid cap on the top storey; parapet on the perimeter only.
  g.set(x, r - 1, z, ROOF);
  if (exterior) g.set(x, r, z, CAP);
}

// Single penthouse on the tallest tier.
for (const [x, z] of phCells) {
  if (x % 2 === 0 && z % 2 === 1) continue;
  g.set(x, maxR, z, "iron_block");
  g.set(x, maxR + 1, z, "iron_block");
}

g.save(`${DIR}/DC54657.nbt`);
