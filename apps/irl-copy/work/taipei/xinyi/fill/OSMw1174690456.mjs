import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/OSMw1174690456.cells.json`, "utf8"));

// Record: 19 x 23 footprint, roof ~11 above lowest ground, 2 storeys of ~5 blocks
// (roughly 8 m): a low-rise Xinyi-era commercial block with a white tiled-concrete
// facade, stone base and cornice, a shopfront ground floor and a window grid above.
const W = 19, H = 23, D = 23;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const fp = new Map();
for (const [x, z, gr] of cells) fp.set(key(x, z), gr);
const has = (x, z) => fp.has(key(x, z));
const isEdge = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

// Front = the low-z face (street side). Door sits on the middle cell of that face.
const frontCells = cells.filter(([x, z]) => !has(x, z - 1)).map(([x, z]) => x).sort((a, b) => a - b);
const doorX = frontCells.length ? frontCells[Math.floor(frontCells.length / 2)] : -1;

const glassProps = (alongX) => alongX
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

for (const [x, z, b] of cells) {
  // Foundation below the floor line
  for (let y = 0; y < b; y++) g.set(x, y, z, "stone_bricks");
  // Ground floor slab / base course
  g.set(x, b, z, "stone_bricks");

  // Upper floor slab (interior) and roof deck (interior)
  const edge = isEdge(x, z);
  const zFace = !has(x, z - 1) || !has(x, z + 1); // wall runs along x
  const u = zFace ? x : z;

  if (!edge) {
    g.set(x, b + 5, z, "smooth_stone");
    g.set(x, b + 10, z, "gray_concrete");
    // Roof equipment: AC plant blocks and a few lanterns
    if (x % 7 === 3 && z % 7 === 3) g.set(x, b + 11, z, "iron_block");
    else if (x % 5 === 2 && z % 5 === 2) g.set(x, b + 11, z, "lantern");
    continue;
  }

  // ---- Perimeter facade ----
  // Ground floor: shopfront with pilasters, glazed bays, door in centre
  const isDoorCell = (x === doorX) && !has(x, z - 1);
  for (let y = b + 1; y <= b + 3; y++) {
    if (isDoorCell && y <= b + 2) {
      if (y === b + 1) g.set(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      else g.set(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    } else if (u % 3 === 1 && !isDoorCell) {
      g.set(x, y, z, "glass_pane", glassProps(zFace));
    } else {
      g.set(x, y, z, "white_concrete");
    }
  }
  // Fascia / canopy line over the shopfront
  g.set(x, b + 4, z, "smooth_stone");
  // Storey line
  g.set(x, b + 5, z, "white_concrete");

  // Upper floor: window grid, glazed bays with white piers; some lit from behind
  for (let y = b + 6; y <= b + 8; y++) {
    if (u % 3 === 1) {
      if (y === b + 7 && u % 6 === 4) g.set(x, y, z, "glowstone");
      else g.set(x, y, z, "glass_pane", glassProps(zFace));
    } else {
      g.set(x, y, z, "white_concrete");
    }
  }
  // Lintel, cornice, parapet
  g.set(x, b + 9, z, "white_concrete");
  g.set(x, b + 10, z, "smooth_stone");
  g.set(x, b + 11, z, "white_concrete");
}

g.save(`${DIR}/OSMw1174690456.nbt`);
