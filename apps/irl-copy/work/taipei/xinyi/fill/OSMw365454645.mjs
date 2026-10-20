// Xinyi low-rise commercial block, two storeys over a plinth, flat roof with parapet.
// Materials: white concrete pilasters and frames, light-blue glazing in grey surrounds,
// stone base course and storey lines, a recessed shopfront with a central entrance.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw365454645";
const W = 34, H = 23, D = 45;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  G.set(`${x},${z}`, Math.round(gr));
}
const has = (x, z) => G.has(`${x},${z}`);
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];

const o = Math.min(...G.values());   // lowest ground under the footprint
const R = o + 11;                    // shared roof deck level

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

// Street-side (min-z) cells, sorted by x. The entrance is the middle three.
const frontCells = [];
for (const [key] of G) {
  const [x, z] = key.split(",").map(Number);
  if (!has(x, z - 1)) frontCells.push(x);
}
frontCells.sort((a, b) => a - b);
const entrX = frontCells.length ? frontCells[Math.floor(frontCells.length / 2)] : -1;
const entrSet = new Set([entrX - 1, entrX, entrX + 1]);

const GLASS = "light_blue_stained_glass_pane";
const FRAME = "white_concrete";     // pilasters and mullions
const SURROUND = "light_gray_concrete"; // sills, heads and spandrels
const BAND = "smooth_stone";        // storey lines

for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone");

  const faces = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  const perim = faces.length > 0;

  // Storey line and roof deck for every footprint cell.
  if (o + 6 > gr) put(x, o + 6, z, perim ? BAND : "light_gray_concrete");
  if (R > gr) put(x, R, z, perim ? BAND : "gray_concrete");
  if (perim && R + 1 > gr) put(x, R + 1, z, FRAME); // parapet

  if (!perim) continue;

  const corner = faces.length > 1;
  const [fdx, fdz] = faces[0];
  const bay = fdx !== 0 ? z : x;
  const pillar = corner || bay % 3 === 0;
  const onStreet = !corner && fdz === -1;          // min-z face
  const inEntr = onStreet && entrSet.has(x);
  const isDoorCell = onStreet && x === entrX;
  const paneProps = fdx !== 0
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

  // Recessed shopfront: entrance cells step back to glass, with the door at centre.
  if (inEntr && !isDoorCell) {
    for (let y = gr + 1; y <= o + 4; y++) {
      if (y === gr + 1) put(x, y, z, "stone_bricks");
      else put(x, y, z, GLASS, paneProps);
    }
  } else {
    // Storey 1: base course, glazed bays, pilasters.
    for (let y = gr + 1; y <= o + 5; y++) {
      if (y === gr + 1) put(x, y, z, "stone_bricks");
      else if (y === o + 5) put(x, y, z, SURROUND);
      else if (pillar) put(x, y, z, FRAME);
      else if (y === gr + 2 || y === o + 4) put(x, y, z, SURROUND); // sill and head
      else put(x, y, z, GLASS, paneProps);
    }
  }

  // Storey 2: window bands between the storey line (o+6) and the roof (o+11).
  for (let y = o + 7; y <= o + 10; y++) {
    if (y <= gr) continue;
    if (pillar) put(x, y, z, FRAME);
    else if (y === o + 7 || y === o + 10) put(x, y, z, SURROUND);
    else put(x, y, z, GLASS, paneProps);
  }

  // Entrance door (centre cell), two blocks tall, with a lit canopy band.
  if (isDoorCell) {
    if (gr + 1 <= o + 5) {
      put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    }
    if (gr + 2 <= o + 5) {
      put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    }
    // Hanging lanterns beside the door, under the header band.
    if (gr + 3 < o + 5) {
      put(x - 1, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
      put(x + 1, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
  if (inEntr) {
    // Dark canopy band over the shopfront entrance.
    put(x, o + 5, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }

  // Warm lights behind some windows, on the interior side of the facade.
  if (!pillar && !inEntr && has(x - fdx, z - fdz)) {
    const ix = x - fdx, iz = z - fdz;
    if (bay % 6 === 2 && o + 8 > gr) put(ix, o + 8, iz, "glowstone");
    if (bay % 6 === 4 && o + 3 > gr) put(ix, o + 3, iz, "shroomlight");
  }
}

// Roof plant: a set-back housing on the roof deck, with a louvred top.
const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
const deep = (x, z) => {
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    if (!has(x + dx, z + dz)) return false;
  }
  return true;
};
for (let x = cx - 4; x <= cx + 4; x++) {
  for (let z = cz - 6; z <= cz + 6; z++) {
    if (!has(x, z) || !deep(x, z) || R <= G.get(`${x},${z}`)) continue;
    put(x, R + 1, z, "stone_bricks");
    if (x >= cx - 2 && x <= cx + 2) {
      put(x, R + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
