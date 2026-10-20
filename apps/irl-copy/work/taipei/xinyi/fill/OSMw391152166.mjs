import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw391152166";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 9 x 24 x 23: x 0..8, z 0..22, y 0..23
const W = 9, H = 24, D = 23;
const g = new Voxels([W, H, D]);

// Two storeys of ~5 blocks (shopfront + upper floor), flat roof with parapet to y 12.
const FLOOR2 = 5;   // second-floor slab / belt course
const ROOF = 10;    // roof slab row
const TOP = 12;     // parapet cap row

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Street frontage is the west face (x = 0). Entrance at the middle street cell.
const streetZs = cells.filter(([x]) => x === 0).map(([, z]) => z).sort((a, b) => a - b);
let doorZ = streetZs.length ? streetZs[Math.floor(streetZs.length / 2)] : -1;
if (doorZ % 3 === 0) doorZ += 1;
const doorOK = streetZs.includes(doorZ);

const PANE_X = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_Z = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (const [x, z, grRaw] of cells) {
  const gr = Math.round(grRaw);
  const edge = isEdge(x, z);
  const xFace = x === 0 || x === 8;
  const zFace = z === 0 || z === 22;
  const corner = xFace && zFace;
  const t = xFace ? z : x;
  const street = x === 0;
  // Piers on every third bay, corners always; door surround also reads as pier on the street
  const doorSurround = street && doorOK && Math.abs(z - doorZ) === 1;
  const pier = corner || t % 3 === 0 || doorSurround;

  // Foundation from y 0 up to this cell's ground, then ground slab
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, edge ? "stone_bricks" : "smooth_stone");

  // Storey slabs across the whole footprint (floor 2 and roof)
  if (FLOOR2 >= gr) put(x, FLOOR2, z, "light_gray_concrete");
  if (ROOF >= gr) put(x, ROOF, z, "light_gray_concrete");

  if (!edge) continue; // interior stays air behind the glass

  // ---- Ground storey: shopfront ----
  for (let y = gr + 1; y <= 4; y++) {
    if (y === 4) {
      // Coloured sign / transom band; red on the street face reads as shopfront signage
      put(x, y, z, street && !pier ? "red_concrete" : "light_gray_concrete");
    } else if (pier) {
      put(x, y, z, street ? "stone_bricks" : "light_gray_concrete");
    } else if (street && z === doorZ && doorOK) {
      // Doorway opening; door placed below
      put(x, y, z, "air");
    } else {
      put(x, y, z, "light_blue_stained_glass_pane", xFace ? PANE_X : PANE_Z);
    }
  }

  // Entrance door with stone surround
  if (street && z === doorZ && doorOK && gr + 2 <= 3) {
    put(x, gr + 1, z, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
  }

  // ---- Floor-2 belt course ----
  put(x, FLOOR2, z, "light_gray_concrete");

  // ---- Upper storey (y 6..9) ----
  for (let y = 6; y <= 9; y++) {
    if (pier) {
      put(x, y, z, "light_gray_concrete");
    } else if (y === 6) {
      // Window sill: a bottom slab so the glazing reads recessed
      put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    } else if (y === 9) {
      // Window head: top slab lintel
      put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    } else {
      put(x, y, z, "light_blue_stained_glass_pane", xFace ? PANE_X : PANE_Z);
    }
  }

  // Warm lights set in the air gap behind some upper windows
  if (!pier && t % 6 === 1) {
    let ix = x, iz = z;
    if (xFace) ix = x === 0 ? 1 : 7;
    else iz = z === 0 ? 1 : 21;
    if (has(ix, iz) && !isEdge(ix, iz)) {
      const lamp = t % 12 < 6 ? "glowstone" : "shroomlight";
      put(ix, 7, iz, lamp);
    }
  }

  // ---- Parapet and cap to y 12 ----
  put(x, 11, z, "white_concrete");
  put(x, TOP, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// Roof plant: a few proper condenser units on the flat roof, grouped in pairs
// (interior cells only, resting on the roof slab)
const unitCells = [
  [2, 7], [3, 7], [2, 8], [3, 8],
  [5, 11], [6, 11], [5, 12], [6, 12],
  [2, 15], [3, 15], [2, 16], [3, 16],
];
for (const [x, z] of unitCells) {
  if (!has(x, z) || isEdge(x, z)) continue;
  put(x, 11, z, "gray_concrete");
  put(x, 12, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
