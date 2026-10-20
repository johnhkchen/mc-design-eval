import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey Taiwanese commercial block, c. 1980s: white tiled walls, red-tile
// fascia and parapet cap, granite base, shopfront glass at street level,
// punched window grid above, flat roof with a small rooftop box.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541456400";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 12, H = 23, D = 23;
const g = new Voxels([W, H, D]);

// footprint lookup and lowest ground (B = base line of the building)
const fp = new Map();
let B = Infinity;
for (const [x, z, gr] of cells) {
  fp.set(`${x},${z}`, gr);
  if (gr < B) B = gr;
}
const has = (x, z) => fp.has(`${x},${z}`);
const ground = (x, z) => fp.get(`${x},${z}`);

// place only on footprint cells, inside the volume
function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (!has(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// exterior cell = at least one side has no neighbour in the footprint
function exterior(x, z) {
  return !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
}

// facade material for an exterior voxel at height t above the base line (B)
// returns block id or null (air = opening)
function facade(x, z, t) {
  const front = z === D - 1;
  const back = z === 0;
  let u, pillar, entrance = false;
  if (front || back) {
    u = x;
    pillar = u === 0 || u === W - 1 || u % 3 === 0;
    entrance = front && (u === 4 || u === 5);
  } else {
    u = z;
    pillar = u === 0 || u === D - 1 || u % 3 === 0;
  }

  if (t === 0) return "polished_granite";
  if (t === 4) return "red_terracotta";
  if (t === 5) return "smooth_stone";
  if (t === 9) return "smooth_stone";
  if (t === 10) return "red_terracotta";

  if (t >= 1 && t <= 3) {
    if (entrance) return t === 3 ? "dark_oak_planks" : null;
    if (pillar) return "white_concrete";
    return "glass_pane";
  }
  if (t >= 6 && t <= 8) {
    if (pillar) return "white_concrete";
    return "glass_pane";
  }
  return null;
}

// 1. foundations: solid from y 0 up to each cell's ground
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// 2. storeys, floor slabs, roof and facade
for (const [x, z, gr] of cells) {
  const ext = exterior(x, z);
  for (let y = Math.max(gr, B); y <= B + 10; y++) {
    const t = y - B;
    if (ext) {
      const b = facade(x, z, t);
      if (b) put(x, y, z, b);
    } else {
      if (t === 5) put(x, y, z, "smooth_stone");        // upper floor slab
      if (t === 10) put(x, y, z, "light_gray_concrete"); // flat roof
    }
  }
}

// 3. warm lights behind some windows (interior air gap, on the floor)
const lamps = [
  [2, B, D - 2, "shroomlight"],     // ground shopfront
  [9, B, D - 2, "shroomlight"],
  [2, B + 6, D - 2, "glowstone"],   // upper front windows
  [8, B + 6, D - 2, "glowstone"],
  [1, B + 6, 10, "glowstone"],      // one upper side window
];
for (const [x, y, z, id] of lamps) {
  if (has(x, z) && !exterior(x, z) || (has(x, z) && z === D - 2)) put(x, y, z, id);
}

// 4. small rooftop utility box, set in from the parapet, door facing south
for (let x = 3; x <= 7; x++) {
  for (let z = 14; z <= 18; z++) {
    const ring = x === 3 || x === 7 || z === 14 || z === 18;
    if (ring) {
      if (z === 14 && x === 5) continue; // doorway
      put(x, B + 11, z, "white_concrete");
      put(x, B + 11, z, "white_concrete");
    }
    put(x, B + 12, z, "light_gray_concrete"); // cap over the box
  }
}

g.save(`${DIR}/${ID}.nbt`);
