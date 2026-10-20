import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542682849";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 26, H = 23, D = 16;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const G = new Map();
let L = Infinity;
for (const [x, z, gr] of cells) {
  G.set(`${x},${z}`, gr);
  L = Math.min(L, gr);
}
const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);

// Vertical plan (absolute y), relative to lowest ground L.
// Roof reads ~11 blocks above L: cornice at L+10, parapet at L+11.
const SL = L + 5;      // storey line / second-floor slab (storey ~5 blocks)
const ROOF = L + 10;   // roof slab / cornice level
const PAR = ROOF + 1;  // parapet

const set = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const keys = [...G.keys()].map((k) => k.split(",").map(Number));

// Pass 1: foundations, walls, interior slabs, roof
for (const [x, z] of keys) {
  const gr = gnd(x, z);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  const N = !has(x, z - 1);
  const S = !has(x, z + 1);
  const Wf = !has(x - 1, z);
  const E = !has(x + 1, z);
  const ex = [N, S, Wf, E].filter(Boolean).length;
  const perimeter = ex > 0;

  if (!perimeter) {
    // Interior: storey slab, roof slab, occasional warm light
    if (SL >= gr && SL < H) {
      set(x, SL, z, "smooth_stone");
      if (x % 4 === 1 && z % 4 === 1 && SL + 1 < H) set(x, SL + 1, z, "glowstone");
    }
    if (ROOF < H) set(x, ROOF, z, "smooth_stone");
    continue;
  }

  // Perimeter wall cell
  const face = N ? "N" : S ? "S" : Wf ? "W" : "E";
  const along = face === "N" || face === "S" ? x : z;
  const pier = ex >= 2 || along % 3 === 0;
  const glassP =
    face === "N" || face === "S"
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  for (let y = gr; y < ROOF; y++) {
    let b = "white_concrete";
    let p;
    if (y === gr) {
      b = "polished_andesite";                 // base course
    } else if (y === SL) {
      b = "light_gray_concrete";               // storey line
    } else if (!pier) {
      b = "light_blue_stained_glass_pane";     // glazing between piers
      p = glassP;
    }
    set(x, y, z, b, p);
  }

  set(x, ROOF, z, "smooth_stone");             // cornice
  set(x, PAR, z, "white_concrete");            // parapet
}

// Pass 2: entrance on the north (low-z) face, near the middle of the frontage
const northCells = keys.filter(([x, z]) => !has(x, z - 1));
if (northCells.length) {
  const xs = northCells.map(([x]) => x).sort((a, b) => a - b);
  const mid = xs[Math.floor(xs.length / 2)];
  const [ex, ez] = northCells.reduce((best, c) =>
    Math.abs(c[0] - mid) < Math.abs(best[0] - mid) ? c : best
  );
  const gr = gnd(ex, ez);
  const doorP = { facing: "north", hinge: "left", open: "false", powered: "false" };
  set(ex, gr, ez, "dark_oak_door", { ...doorP, half: "lower" });
  set(ex, gr + 1, ez, "dark_oak_door", { ...doorP, half: "upper" });
  set(ex, gr + 2, ez, "smooth_stone");        // lintel over the door
}

// Pass 3: roof plant room (air-conditioning and lift overrun) on the interior roof
for (const [x, z] of keys) {
  const gr = gnd(x, z);
  const perimeter = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
  if (perimeter) continue;
  if (x >= 8 && x <= 12 && z >= 5 && z <= 10 && PAR + 1 < H && gr <= ROOF) {
    set(x, PAR, z, "light_gray_concrete");
    if (x >= 9 && x <= 11 && z >= 6 && z <= 9) set(x, PAR + 1, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
