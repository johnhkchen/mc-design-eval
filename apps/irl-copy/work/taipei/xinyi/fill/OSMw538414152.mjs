import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538414152";

const W = 12, H = 23, D = 40;
const STOREY = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint lookup and lowest ground
const gmap = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  gmap.set(`${x},${z}`, gr);
  minG = Math.min(minG, gr);
}
if (!isFinite(minG)) minG = 0;

const has = (x, z) => gmap.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Roof level: about 11 blocks above lowest ground, leaving head room for roof plant
const roofY = Math.min(minG + 11, H - 4);

const vox = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};

const topMap = new Map();

// Pass 1: foundation, walls, floor slabs, glazing, entrance, warm lights
for (const [x, z, gr] of cells) {
  const gd = gr;
  let top = Math.max(roofY, gd + STOREY);
  top = Math.min(top, H - 4);
  topMap.set(`${x},${z}`, top);

  // Foundation from y=0 up to this cell's ground
  for (let y = 0; y < gd; y++) put(x, y, z, "stone_bricks");

  const west = !has(x - 1, z);
  const east = !has(x + 1, z);
  const north = !has(x, z - 1);
  const south = !has(x, z + 1);
  const edge = west || east || north || south;
  const alongZ = west || east;
  const idx = alongZ ? z : x;

  for (let y = gd; y < top; y++) {
    const r = y - gd;
    const s = Math.floor(r / STOREY);
    const o = r % STOREY;

    if (!edge) {
      // Interior: only floor slabs, air otherwise
      if (o === 0) put(x, y, z, "smooth_stone");
      continue;
    }

    const pier = idx % 3 === 0;

    if (o === 0) {
      put(x, y, z, s === 0 ? "stone_bricks" : "smooth_stone");
    } else if (o === 4) {
      put(x, y, z, "white_concrete");
    } else {
      // o = 1..3: window band
      if (pier) {
        put(x, y, z, s === 0 ? "stone_bricks" : "white_concrete");
      } else if (north && s === 0 && x === 5 && o <= 2) {
        // Main entrance door, lower and upper halves
        put(x, y, z, "dark_oak_door", {
          facing: "north",
          half: o === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else {
        put(x, y, z, "glass_pane");
      }
    }
  }
}

// Pass 2: warm lights behind some facade windows (inside the air gap)
for (const [x, z, gr] of cells) {
  const west = !has(x - 1, z);
  const east = !has(x + 1, z);
  const north = !has(x, z - 1);
  const south = !has(x, z + 1);
  if (!(west || east || north || south)) continue;

  const alongZ = west || east;
  const idx = alongZ ? z : x;
  if (idx % 3 === 0) continue;

  let ix = x, iz = z;
  if (west) ix = x + 1;
  else if (east) ix = x - 1;
  else if (north) iz = z + 1;
  else if (south) iz = z - 1;

  if (!has(ix, iz) || isEdge(ix, iz)) continue;
  const top = topMap.get(`${x},${z}`);

  for (let y = gr; y < top; y++) {
    const r = y - gr;
    const s = Math.floor(r / STOREY);
    const o = r % STOREY;
    if (o === 2 && s % 2 === 0 && idx % 6 === 2) {
      put(ix, y, iz, "glowstone");
    }
  }
}

// Pass 3: roof, parapet cap, roof plant
for (const [x, z, gr] of cells) {
  const top = topMap.get(`${x},${z}`);
  if (isEdge(x, z)) {
    put(x, top, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  } else {
    put(x, top, z, "light_gray_concrete");
  }
}

// Stair/lift core (solid massing) and AC units on the roof, only where the roof is interior
const rooftopOk = (x, z) => has(x, z) && !isEdge(x, z);
for (let x = 1; x <= 3; x++) {
  for (let z = 2; z <= 4; z++) {
    if (!rooftopOk(x, z)) continue;
    const top = topMap.get(`${x},${z}`);
    put(x, top + 1, z, "white_concrete");
    put(x, top + 2, z, "light_gray_concrete");
  }
}
for (let x = 6; x <= 8; x++) {
  for (let z = 10; z <= 12; z++) {
    if (!rooftopOk(x, z)) continue;
    const top = topMap.get(`${x},${z}`);
    put(x, top + 1, z, "iron_block");
  }
}

vox.save(`${DIR}/${ID}.nbt`);
