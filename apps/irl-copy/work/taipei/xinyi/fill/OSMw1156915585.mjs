import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey Xinyi commercial block: white-tiled concrete frame, glass shopfront,
// stone base course, light-grey storey lines and cornice, flat roof with plant room and mast.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1156915585";
const W = 22, H = 23, D = 19;

let cells = null;
try {
  cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
} catch {
  cells = null;
}

const ground = new Map();
if (Array.isArray(cells) && cells.length) {
  for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr | 0);
} else {
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) ground.set(`${x},${z}`, 0);
}

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Exposed faces
const faceOf = (x, z) => {
  if (!has(x, z - 1)) return "n";
  if (!has(x, z + 1)) return "s";
  if (!has(x - 1, z)) return "w";
  if (!has(x + 1, z)) return "e";
  return null;
};

// Front (street) is the north face (z minimum). Door sits at the north-face cell nearest the middle.
const northXs = [];
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!has(x, z - 1)) northXs.push(x);
}
let doorX = -1;
if (northXs.length) {
  const mn = Math.min(...northXs), mx = Math.max(...northXs);
  const mid = (mn + mx) / 2;
  doorX = northXs.reduce((best, x) => (Math.abs(x - mid) < Math.abs(best - mid) ? x : best), northXs[0]);
}

const facingOf = { n: "north", s: "south", w: "west", e: "east" };
const paneProps = (f) =>
  f === "n" || f === "s"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const footprint = [...ground.keys()].map((k) => k.split(",").map(Number));

// Pass 1: foundations, floors, storey lines, roof, walls
for (const [x, z] of footprint) {
  const gr = gnd(x, z);
  const per = isPerim(x, z);

  // Foundation fill up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slabs: ground, storey line, roof
  put(x, gr, z, per ? "polished_andesite" : "smooth_stone");
  put(x, gr + 5, z, per ? "light_gray_concrete" : "smooth_stone");
  put(x, gr + 10, z, per ? "light_gray_concrete" : "smooth_quartz");

  if (!per) continue;

  const f = faceOf(x, z);
  const n = !has(x, z - 1), s = !has(x, z + 1), w = !has(x - 1, z), e = !has(x + 1, z);
  const corner = (n || s) && (w || e);
  const coord = f === "n" || f === "s" ? x : z;
  const isDoor = f === "n" && x === doorX;

  // Two storeys: storey 1 rows 1..4 (windows 1-3, lintel 4), storey 2 rows 6..9 (windows 6-8, lintel 9)
  for (const base of [1, 6]) {
    const storey = base === 1 ? 0 : 1;
    for (let k = 0; k < 4; k++) {
      const dy = gr + base + k;
      if (k === 3) {
        put(x, dy, z, "white_concrete");
        continue;
      }
      if (storey === 0 && isDoor) {
        if (k < 2) {
          const half = k === 0 ? "lower" : "upper";
          put(x, dy, z, "dark_oak_door", {
            facing: facingOf[f], half, hinge: "left", open: "false", powered: "false",
          });
        } else {
          put(x, dy, z, "glass_pane", paneProps(f));
        }
        continue;
      }
      if (corner || coord % 3 === 0) {
        put(x, dy, z, "white_concrete");
        continue;
      }
      put(x, dy, z, "light_blue_stained_glass_pane", paneProps(f));

      // Warm light in the room behind some windows (interior air cell)
      if (k === 1 && (coord + storey) % 4 === 1) {
        let ix = x, iz = z;
        if (f === "n") iz = z + 1;
        else if (f === "s") iz = z - 1;
        else if (f === "w") ix = x + 1;
        else if (f === "e") ix = x - 1;
        if (has(ix, iz) && !isPerim(ix, iz)) {
          const lightY = gnd(ix, iz) + (dy - gr);
          put(ix, lightY, iz, storey === 0 ? "shroomlight" : "glowstone");
        }
      }
    }
  }

  // Cornice cap at roof level stays light grey (set above); ground course already polished andesite.
}

// Pass 2: roof equipment (interior cells only, stands on roof slab)
for (const [x, z] of footprint) {
  if (isPerim(x, z)) continue;
  const gr = gnd(x, z);
  // Central plant room
  if (x >= 8 && x <= 13 && z >= 7 && z <= 11) {
    put(x, gr + 11, z, "light_gray_concrete");
    put(x, gr + 12, z, "light_gray_concrete");
  }
  // Small AC units near corners of the roof
  if ((x === 3 || x === 18) && (z === 3 || z === 15)) {
    put(x, gr + 11, z, "iron_block");
  }
}

// Short mast on the roof, if its cell is in the footprint and interior
{
  const mx = 10, mz = 9;
  if (has(mx, mz) && !isPerim(mx, mz)) {
    const gr = gnd(mx, mz);
    put(mx, gr + 13, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
    put(mx, gr + 14, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
