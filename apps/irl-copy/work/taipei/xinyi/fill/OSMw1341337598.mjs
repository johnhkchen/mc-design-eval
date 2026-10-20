import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1341337598";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// 5 x 5 footprint, roof at about 7 blocks above the lowest ground.
// Two storeys of a low Taiwanese shophouse-style block, 1980s-90s:
//   ground storey: stone base, shopfront glass, timber-look lintel band
//   upper storey: white tiled walls, window grid with glass panes
//   roof: stone parapet with a flat gray deck
const W = 5, H = 19, D = 5;
const g = new Voxels([W, H, D]);

const ROOF_Y = 6;   // highest used block; roof surface sits at height 7
const BAND_Y = 4;   // storey line between ground and upper storey
const LINTEL_Y = 3; // top of the shopfront

const ground = new Map();
for (const [x, z, gr] of cells) {
  // clamp so the storey layout always fits the 19-block volume
  ground.set(`${x},${z}`, Math.min(3, Math.max(0, gr)));
}
const has = (x, z) => ground.has(`${x},${z}`);

const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const midX = (minX + maxX) / 2, midZ = (minZ + maxZ) / 2;

const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const isCorner = (x, z) => (x === minX || x === maxX) && (z === minZ || z === maxZ);

const BODY = "white_concrete";
const BASE = "stone_bricks";
const BAND = "smooth_stone";
const LINTEL = "dark_oak_planks";
const GLASS_UP = "light_blue_stained_glass_pane";
const GLASS_DN = "glass_pane";
const PARAPET = "smooth_stone";
const DECK = "gray_concrete";
const FLOOR = "gray_concrete";

for (const [x, z, gr0] of cells) {
  const gr = ground.get(`${x},${z}`);

  // foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, BASE);

  if (isEdge(x, z)) {
    const front = z === minZ;
    const corner = isCorner(x, z);
    for (let y = gr; y <= ROOF_Y; y++) {
      let id = null;
      let props;

      if (y === gr) {
        id = BASE; // base course on the ground line
      } else if (y <= 2) {
        // shopfront storey
        if (corner) id = BASE;
        else if (front && x === midX && y === gr + 1 && gr + 1 <= 2) {
          id = "oak_door";
          props = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
        } else if (front && x === midX && y === gr && gr <= 2) {
          id = "oak_door";
          props = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };
        } else id = GLASS_DN;
      } else if (y === LINTEL_Y) {
        id = LINTEL;
      } else if (y === BAND_Y) {
        id = BAND;
      } else if (y === 5) {
        // upper windows: pillars at corners, glass between
        id = corner ? BODY : GLASS_UP;
      } else if (y === ROOF_Y) {
        id = PARAPET; // stone parapet cap
      }

      if (id) {
        if (props) g.set(x, y, z, id, props);
        else g.set(x, y, z, id);
      }
    }
  } else {
    // interior cells: floor slabs and roof deck only, air between
    g.set(x, gr, z, FLOOR);
    g.set(x, BAND_Y, z, FLOOR);
    g.set(x, ROOF_Y, z, DECK);
  }
}

// warm light behind the centre window of each face
const lightAt = [
  [Math.round(midX), 5, minZ + 1],
  [Math.round(midX), 5, maxZ - 1],
  [minX + 1, 5, Math.round(midZ)],
  [maxX - 1, 5, Math.round(midZ)],
];
for (const [x, y, z] of lightAt) {
  if (has(x, z) && !isEdge(x, z)) g.set(x, y, z, "glowstone");
}

g.save(`${dir}/${id}.nbt`);
