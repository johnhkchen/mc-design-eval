import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541986988";
const W = 17, H = 23, D = 24;

// Two storeys of ~5 blocks, parapet course at y=10, roof surface at y=11.
const ROOF = 10;
const SHOP_TOP = 2;   // shopfront glazing runs ground..2
const LINTEL = 3;
const BAND = 4;       // storey line over ground floor
const FLOOR = 5;      // second-storey floor line / sill
const WIN_TOP = 8;    // upper glazing 6..8
const UPPER_LINTEL = 9;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
const inside = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Centre column for the entrance on the south (max z) face.
const xs = cells.map((c) => c[0]);
const zs = cells.map((c) => c[1]);
const maxZ = Math.max(...zs);
const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
let doorX = null;
for (const [x, z] of cells) {
  if (z !== maxZ) continue;
  if (doorX === null || Math.abs(x - midX) < Math.abs(doorX - midX)) doorX = x;
}

// Facade block for a perimeter cell at height y.
// t = position along the facade (creates bays of 3 columns: pillar + 2 glazed).
function facadeBlock(y, t, pillar, glowBay) {
  if (y === ROOF) return "light_gray_concrete";          // cornice / parapet cap
  if (y === UPPER_LINTEL) return "light_gray_concrete";  // upper lintel
  if (y === FLOOR) return "light_gray_concrete";         // floor line / sill
  if (y === BAND) return "smooth_stone";                 // storey line
  if (y === LINTEL) return pillar ? "stone_bricks" : "light_gray_concrete";
  if (y <= SHOP_TOP) {
    return pillar ? "stone_bricks" : "light_blue_stained_glass";  // shopfront glazing
  }
  if (y <= WIN_TOP) {
    if (pillar) return "light_gray_concrete";
    if (y === 7 && glowBay) return "glowstone";          // warm lit room
    return "light_blue_stained_glass";
  }
  return "white_concrete";                               // tiled wall
}

for (const [x, z, rawG] of cells) {
  const G = Math.max(0, Math.round(rawG));

  // Foundation: solid from y=0 up to this cell's ground.
  for (let y = 0; y < G; y++) set(x, y, z, "stone_bricks");

  const faces = [];
  if (!inside(x, z - 1)) faces.push("N");
  if (!inside(x, z + 1)) faces.push("S");
  if (!inside(x - 1, z)) faces.push("W");
  if (!inside(x + 1, z)) faces.push("E");

  if (faces.length === 0) {
    // Interior cell: floor slabs per storey, no interior fit-out.
    if (G === 0) set(x, 0, z, "smooth_stone");
    if (G <= FLOOR) set(x, FLOOR, z, "smooth_stone");
    if (G <= ROOF) set(x, ROOF, z, "smooth_stone");
    // Roof plant box near centre.
    if (x >= 5 && x <= 8 && z >= 8 && z <= 12 && G <= ROOF) {
      set(x, ROOF + 1, z, "gray_concrete");
    }
    continue;
  }

  // Perimeter cell.
  const corner = faces.length > 1;
  const face = faces[0];
  const t = (face === "N" || face === "S") ? x : z;
  const pillar = corner || (t % 3 === 0);
  const glowBay = (t % 6 === 4);

  for (let y = G; y <= ROOF; y++) {
    set(x, y, z, facadeBlock(y, t, pillar, glowBay));
  }
}

// Entrance on the south face: double-height oak door, central bay.
if (doorX !== null) {
  const G = Math.max(0, Math.round(ground.get(`${doorX},${maxZ}`)));
  set(doorX, G, maxZ, "oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  set(doorX, G + 1, maxZ, "oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

g.save(`${DIR}/${ID}.nbt`);
