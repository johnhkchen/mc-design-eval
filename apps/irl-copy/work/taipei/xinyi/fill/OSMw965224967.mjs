import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Footprint 21 x 18. Roof deck at y 10 (top at 11) with a parapet at y 11.
// Mid-rise commercial block, c. 1990s-2000s Xinyi: white-concrete frame,
// light-grey piers, tinted glazing, stone base and cornice, shopfront at grade,
// and a central penthouse with mechanical plant.
const W = 21, H = 23, D = 18;
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw965224967.cells.json", "utf8"));

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => G.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Doorway: south-facing edge cell closest to the centre line.
const doorCand = cells
  .filter(([x, z]) => !has(x, z + 1))
  .sort((a, b) => Math.abs(a[0] - 10) - Math.abs(b[0] - 10))[0];
const doorX = doorCand ? doorCand[0] : null;
const doorZ = doorCand ? doorCand[1] : null;

for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  const hW = has(x - 1, z), hE = has(x + 1, z), hN = has(x, z - 1), hS = has(x, z + 1);
  const perim = !(hW && hE && hN && hS);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  if (!perim) {
    // Interior: floor slabs and roof deck only; air between (no interiors).
    put(x, gr, z, "smooth_stone");
    if (gr <= 5) put(x, 5, z, "smooth_stone");
    put(x, 10, z, "light_gray_concrete");
    continue;
  }

  const zFace = !hN || !hS;   // wall runs along x
  const xFace = !hW || !hE;   // wall runs along z
  const along = zFace && !xFace ? x : xFace && !zFace ? z : x + z;
  const corner = zFace && xFace;
  const pier = corner || along % 3 === 0;

  for (let y = gr; y <= 10; y++) {
    let id = "white_concrete";
    let p;
    if (y === gr) {
      id = "stone_bricks";                       // base course
    } else if (y === 10) {
      id = "stone_bricks";                       // cornice
    } else if (y <= 4) {                         // shopfront storey
      if (pier) { id = "quartz_pillar"; p = { axis: "y" }; }
      else if (y === 4) id = "light_gray_concrete";  // transom band
      else if (y >= gr + 1 && along % 3 === 1) {
        id = "glass";
        if (y === 2 && (x + 2 * z) % 5 === 0) id = "shroomlight";
      } else id = "smooth_stone";
    } else {                                     // upper storey, y 5..9
      if (pier) id = "light_gray_concrete";
      else if (y === 5 || y === 9) id = "white_concrete";
      else if (along % 3 === 1) {
        id = "glass";
        if (y === 7 && (x * 5 + z * 3) % 7 === 0) id = "glowstone";
      } else id = "white_concrete";
    }
    put(x, y, z, id, p);
  }

  // Parapet course on the roof edge.
  put(x, 11, z, "white_concrete");

  // Entrance canopy over the door on the south frontage.
  if (doorX !== null && zFace && !hS && Math.abs(x - doorX) <= 1 && gr <= 4) {
    put(x, 4, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Entrance door (two-high) at the chosen south-face cell.
if (doorCand) {
  const gr = Math.round(doorCand[2]);
  if (gr + 2 <= 3) {
    put(doorX, gr + 1, doorZ, "dark_oak_door",
      { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(doorX, gr + 2, doorZ, "dark_oak_door",
      { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// Central penthouse with glazed band, cap slab and a lightning rod.
for (let x = 7; x <= 13; x++) {
  for (let z = 6; z <= 11; z++) {
    if (!has(x, z)) continue;
    const edgeX = x === 7 || x === 13, edgeZ = z === 6 || z === 11;
    const corner = edgeX && edgeZ;
    for (let y = 11; y <= 13; y++) {
      let id = "white_concrete";
      if (edgeX || edgeZ) {
        id = corner ? "light_gray_concrete" : (y === 12 ? "glass" : "light_gray_concrete");
      }
      put(x, y, z, id);
    }
    put(x, 14, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}
if (has(10, 8)) {
  put(10, 15, 8, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

// Rooftop air-handling units.
for (let x = 2; x <= 4; x++) {
  for (let z = 2; z <= 4; z++) {
    if (!has(x, z)) continue;
    for (let y = 11; y <= 12; y++) put(x, y, z, "iron_block");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw965224967.nbt");
