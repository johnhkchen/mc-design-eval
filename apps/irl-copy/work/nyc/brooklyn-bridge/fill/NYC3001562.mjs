import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3001562.cells.json`, "utf8"));

const W = 6, H = 25, D = 12;
const g = new Voxels([W, H, D]);

// Ground per cell (foundation fills up to it); one flat roof for the whole block.
const cm = new Map();
const roofs = [];
for (const [x, z, gr, roof] of cells) {
  cm.set(x + "," + z, { g: Math.round(gr) });
  roofs.push(Math.round(roof));
}
roofs.sort((a, b) => a - b);
const medianRoof = roofs[Math.floor(roofs.length / 2)];
const R = Math.min(H - 3, Math.max(medianRoof, 12));           // flat roof top (exclusive wall top = R-1)
for (const c of cm.values()) c.r = R;

const inF = (x, z) => cm.has(x + "," + z);
const perim = (x, z) => !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);
const corner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

function put(x, y, z, id, p) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
}

const G = Math.min(...[...cm.values()].map(c => c.g));
const storeys = [0, 1, 2].map(k => G + 4 * k);

const paneProps = (x, z) =>
  (z === 0 || z === D - 1)
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundation, walls, quoins, base course, cornice, parapet, roof deck
for (const [key, c] of cm) {
  const [x, z] = key.split(",").map(Number);
  const p = perim(x, z);
  for (let y = 0; y < c.g; y++) put(x, y, z, "stone_bricks");
  if (p) {
    for (let y = c.g; y < c.r - 1; y++) {
      put(x, y, z, corner(x, z) ? "stone_bricks" : "brown_terracotta");
    }
    put(x, c.g, z, "stone_bricks");                                        // base course
    put(x, c.r - 1, z, "smooth_stone");                                    // cornice
    put(x, c.r, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); // parapet cap
  } else {
    put(x, c.r - 1, z, "gravel");                                          // roof deck
  }
}

// Pass 2: storey lines and window bays with lintels
for (const [key, c] of cm) {
  const [x, z] = key.split(",").map(Number);
  if (!perim(x, z) || corner(x, z)) continue;
  const onFront = z === 0 || z === D - 1;
  const bayOK = onFront ? (x >= 1 && x <= 4) : ((x === 0 || x === W - 1) && [2, 4, 7, 9].includes(z));
  for (let k = 0; k < storeys.length; k++) {
    const F = storeys[k];
    if (F >= c.g && F < c.r - 1) put(x, F, z, "smooth_stone");           // storey line / sill
    const isDoor = (z === 0 && x === 2 && k === 0);
    if (bayOK && !isDoor) {
      for (const yy of [F + 1, F + 2]) {
        if (yy >= c.g && yy < c.r - 1) put(x, yy, z, "glass_pane", paneProps(x, z));
      }
      if (F + 3 >= c.g && F + 3 < c.r - 1) put(x, F + 3, z, "smooth_stone"); // lintel
    }
  }
}

// Pass 3: entrance door with stone surround and hood
const doorCell = cm.get("2,0");
if (doorCell) {
  const dy = doorCell.g;
  put(2, dy, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(2, dy + 1, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(1, dy + 1, 0, "stone_bricks");
  put(3, dy + 1, 0, "stone_bricks");
  put(1, dy, 0, "stone_bricks");
  put(3, dy, 0, "stone_bricks");
  for (const xx of [1, 2, 3]) {
    put(xx, dy + 2, 0, "smooth_stone_slab", { type: "top", waterlogged: "false" }); // hood
  }
}

// Pass 4: interior floor slabs per storey (air gaps otherwise)
for (const [key, c] of cm) {
  const [x, z] = key.split(",").map(Number);
  if (perim(x, z)) continue;
  for (const F of storeys) {
    if (F >= c.g && F < c.r - 1) put(x, F, z, "spruce_planks");
  }
}

// Warm lights behind a few front windows
const warm = [[1, 1, storeys[0] + 1], [3, 1, storeys[0] + 1], [2, 1, storeys[1] + 1], [4, 1, storeys[2] + 1]];
for (const [x, z, y] of warm) {
  const c = cm.get(x + "," + z);
  if (c && y >= c.g && y < c.r - 1) put(x, y, z, "glowstone");
}

// Chimney rising from the roof deck
const chim = cm.get("4,9");
if (chim) {
  put(4, chim.r, 9, "bricks");
  put(4, chim.r + 1, 9, "bricks");
}

g.save(`${DIR}/NYC3001562.nbt`);
