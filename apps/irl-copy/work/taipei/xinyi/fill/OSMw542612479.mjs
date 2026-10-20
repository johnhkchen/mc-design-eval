import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542612479";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 12, H = 23, D = 20;
const g = new Voxels([W, H, D]);

// Storey levels (absolute y indices)
const FLOOR1_TOP = 4;   // ground storey occupies gr..4
const FLOOR_SLAB = 5;   // slab / awning band between storeys
const STOREY2_TOP = 8;  // windows 6..8
const LINTEL = 9;       // lintel / cornice band
const PARAPET = 10;     // parapet cap; roof deck sits here too
const ROOF_EQUIP = 11;  // rooftop equipment above roof line

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => Math.max(0, Math.min(9, Math.round(ground.get(`${x},${z}`))));

const inBounds = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, id, props) => {
  if (!inBounds(x, y, z) || !has(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Outward face of an edge cell: facing name, index along the face, and inward offset
function outwardOf(x, z) {
  if (!has(x, z - 1)) return { facing: "north", idx: x, dx: 0, dz: 1 };
  if (!has(x, z + 1)) return { facing: "south", idx: x, dx: 0, dz: -1 };
  if (!has(x + 1, z)) return { facing: "east", idx: z, dx: -1, dz: 0 };
  if (!has(x - 1, z)) return { facing: "west", idx: z, dx: 1, dz: 0 };
  return null;
}

// Pick the street front: the north (z-min) face, centred on the footprint
const frontDoorX = Math.floor(W / 2) - 1; // x = 5

// Rooftop corner for a lightning rod
let rodPlaced = false;

for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  const gr = gnd(x, z);

  // Foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);

  if (edge) {
    const out = outwardOf(x, z);
    const mullion = out.idx % 3 === 0;
    const isFront = out.facing === "north";
    const isDoorCell = isFront && out.idx === frontDoorX;

    // Base course at ground level
    if (gr <= FLOOR1_TOP) put(x, gr, z, "polished_andesite");

    // Ground-floor shopfront: glass with dark posts, entrance on the front
    for (let y = gr + 1; y <= FLOOR1_TOP; y++) {
      if (isDoorCell && y === gr + 1 && gr + 2 <= FLOOR1_TOP) {
        put(x, y, z, "dark_oak_door", {
          facing: out.facing, half: "lower", hinge: "left", open: "false", powered: "false",
        });
      } else if (isDoorCell && y === gr + 2 && gr + 2 <= FLOOR1_TOP) {
        put(x, y, z, "dark_oak_door", {
          facing: out.facing, half: "upper", hinge: "left", open: "false", powered: "false",
        });
      } else if (mullion) {
        put(x, y, z, "dark_oak_planks");
      } else {
        put(x, y, z, "glass");
      }
    }

    // Floor band / awning line between storeys
    if (gr <= FLOOR_SLAB) put(x, FLOOR_SLAB, z, isFront ? "dark_oak_planks" : "smooth_stone");

    // Upper storey: window grid with white piers and glass panes
    for (let y = FLOOR_SLAB + 1; y <= STOREY2_TOP; y++) {
      if (mullion) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass_pane");
    }

    // Warm light behind some upper windows
    if (!mullion && out.idx % 6 === 2) {
      const ix = x + out.dx, iz = z + out.dz;
      if (has(ix, iz) && !isEdge(ix, iz)) put(ix, 7, iz, "glowstone");
    }

    // Lintel / cornice band and parapet cap
    put(x, LINTEL, z, "light_gray_concrete");
    put(x, PARAPET, z, "stone_bricks");
  } else {
    // Interior: ground-floor ceiling/upper floor slab and roof deck, air between
    if (gr <= FLOOR_SLAB) put(x, FLOOR_SLAB, z, "light_gray_concrete");
    put(x, PARAPET, z, "gray_concrete");

    // Roof equipment: condenser units and a few taller plant boxes
    if (x % 4 === 1 && z % 5 === 2) {
      put(x, ROOF_EQUIP, z, "iron_block");
      put(x, ROOF_EQUIP + 1, z, "iron_block");
    } else if ((x * 3 + z * 5) % 11 === 0) {
      put(x, ROOF_EQUIP, z, "light_gray_concrete");
    }
  }

  // Lightning rod on the first footprint corner found
  if (!rodPlaced && edge && (!has(x - 1, z - 1) || !has(x + 1, z - 1))) {
    put(x, ROOF_EQUIP, z, "lightning_rod");
    rodPlaced = true;
  }
}

g.save(`${DIR}/${ID}.nbt`);
