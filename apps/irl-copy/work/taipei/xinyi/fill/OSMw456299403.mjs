import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw456299403";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Two-storey 1970s-80s Taipei shophouse-style block: white tiled concrete frame,
// stone shopfront base, light-grey storey belts, a flat roof with parapet
// and a small rooftop plant room. Roof deck sits at y=11.
const W = 15, H = 23, D = 21;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), gr);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const has = (x, z) => ground.has(key(x, z));
const gnd = (x, z) => ground.get(key(x, z));
const inBounds = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, block, props) => {
  if (!inBounds(x, y, z)) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const glass = (x, y, z, ns) => put(x, y, z, "glass_pane", ns ? PANE_NS : PANE_EW);

const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Pass 1: foundation, interior floor slabs and roof deck.
for (const [x, z, gr] of cells) {
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone");          // foundation up to ground
  if (!isEdge(x, z)) {
    put(x, 5, z, "smooth_stone");                               // floor slab, storey 2
    put(x, 11, z, "smooth_stone");                              // roof deck
  }
}

// Pass 2: shell, shopfront, windows, belts, parapet.
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;

  const nN = !has(x, z - 1), nS = !has(x, z + 1);
  const nW = !has(x - 1, z), nE = !has(x + 1, z);
  const ns = nN || nS, ew = nW || nE;
  const corner = ns && ew;
  const idx = ns ? x - minX : z - minZ;
  const winPos = !corner && (idx % 4 === 1 || idx % 4 === 2);
  const isDoor = nN && idx === 7;
  const lowY = gr + 1;

  // Walls from the cell's ground up to the cornice.
  for (let y = lowY; y <= 10; y++) put(x, y, z, "white_concrete");

  // Ground floor: stone base course and piers, glass shopfront between.
  for (let y = lowY; y <= 4; y++) {
    if (winPos && y >= lowY + 1) glass(x, y, z, ns);
    else put(x, y, z, "polished_andesite");
  }
  if (lowY <= 4 && winPos) put(x, lowY, z, "polished_andesite");

  // Entrance door, centred on the street (north) face.
  if (isDoor) {
    put(x, lowY, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, lowY + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }

  // Storey belt at y=5, cornice at y=10.
  put(x, 5, z, "light_gray_concrete");
  put(x, 10, z, "light_gray_concrete");

  // Upper floor windows: sill and head bands framing glass at y=7..9.
  if (winPos) {
    put(x, 6, z, "light_gray_concrete");
    for (let y = 7; y <= 9; y++) glass(x, y, z, ns);
  }

  // Parapet with coping.
  put(x, 11, z, "white_concrete");
  put(x, 12, z, "white_concrete");
  put(x, 13, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  // Warm light behind some glass: glowstone on the interior floor.
  if (winPos) {
    let ix = x, iz = z;
    if (nN) iz = z + 1; else if (nS) iz = z - 1; else if (nW) ix = x + 1; else if (nE) ix = x - 1;
    if (has(ix, iz) && !isEdge(ix, iz)) {
      const h = (x * 5 + z * 3) % 4;
      if (h === 0) put(ix, 6, iz, "glowstone");                 // upper floor
      if (h === 2) put(ix, lowY, iz, "glowstone");              // shopfront
    }
  }
}

// Pass 3: rooftop plant room with AC units.
const x0 = minX + 4, x1 = minX + 10, z0 = minZ + 6, z1 = minZ + 14;
for (let x = x0; x <= x1; x++) {
  for (let z = z0; z <= z1; z++) {
    if (!has(x, z)) continue;
    const wallX = x === x0 || x === x1;
    const wallZ = z === z0 || z === z1;
    if (wallX || wallZ) {
      put(x, 12, z, "light_gray_concrete");
      put(x, 13, z, "light_gray_concrete");
      if (wallZ && !wallX && (x - x0) % 2 === 0) glass(x, 12, z, true);
      if (wallX && !wallZ && (z - z0) % 2 === 0) glass(x, 12, z, false);
    }
    put(x, 14, z, "light_gray_concrete");                       // plant room roof
  }
}
// Two AC units on the roof deck.
for (const [ax, az] of [[minX + 12, minZ + 3], [minX + 2, minZ + 17]]) {
  if (has(ax, az)) put(ax, 11, az, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
