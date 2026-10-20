import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833545";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 18, H = 23, D = 29;
const g = new Voxels([W, H, D]);

// Massing: 2-storey 1980s commercial block, shopfront ground floor, mullioned upper floor,
// flat roof with parapet. Roof surface at y=10, parapet cap at y=10 (top ~11 blocks).
const TOP = 11;      // exclusive top of walls
const FLOOR2 = 5;    // storey-2 floor slab / string course
const ROOF = 9;      // roof slab (interior), cornice band on perimeter

const WALL = "white_concrete";
const FRAME = "light_gray_concrete";
const BASE = "stone_bricks";
const FOUND = "stone_bricks";
const GLASS = "light_blue_stained_glass_pane";
const SHOP = "light_blue_stained_glass";
const PILLAR = "polished_andesite";
const SLAB = "smooth_stone";
const CORNICE = "smooth_stone";
const ROOFBOX = "light_gray_concrete";

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const inBounds = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, id, props) => {
  if (!inBounds(x, y, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const OUT = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const IN = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// Entrance: centre of the south (+z) face.
const ENTRY_X = Math.floor(W / 2);
const doors = [];

for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);

  // Foundation: solid from y=0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  const outs = [];
  if (!has(x, z - 1)) outs.push("N");
  if (!has(x, z + 1)) outs.push("S");
  if (!has(x - 1, z)) outs.push("W");
  if (!has(x + 1, z)) outs.push("E");

  if (outs.length > 0) {
    // Perimeter (shell) cell.
    const face = outs[0];
    const idx = face === "N" || face === "S" ? x : z;
    const [ix, iz] = [x + IN[face][0], z + IN[face][1]];
    const innerOK = has(ix, iz);
    const isEntry = face === "S" && idx === ENTRY_X;

    for (let y = Math.max(gr, 0); y < TOP; y++) {
      let id;
      if (y === gr) {
        id = BASE;
      } else if (y <= 4 && y <= gr + 2) {
        // shopfront band
        id = idx % 3 === 0 ? PILLAR : SHOP;
      } else if (y === 4) {
        id = FRAME;                       // storey-1 lintel band
      } else if (y === FLOOR2) {
        id = SLAB;                        // storey-2 floor line
      } else if (y >= 6 && y <= 8) {
        if (idx % 3 === 0) id = FRAME;    // mullions
        else if (y === 8) id = FRAME;     // head
        else id = GLASS;                  // window pane
      } else if (y === ROOF) {
        id = CORNICE;
      } else {
        id = CORNICE;                     // parapet cap at y = 10
      }
      put(x, y, z, id);
    }

    // Warm light behind some upper-floor windows (glowstone in the air gap).
    if (innerOK && idx % 3 !== 0 && ((x * 7 + z * 13) % 5 === 0) && gr <= 7) {
      put(ix, 7, iz, "glowstone");
    }

    if (isEntry && gr + 2 < TOP) {
      doors.push([x, gr, z]);
    }
  } else {
    // Interior cell: floor slab, air storeys, roof slab; no interior fit-out.
    if (gr <= FLOOR2) {
      put(x, FLOOR2, z, SLAB);            // storey-2 floor (sits on fill or air below)
    } else if (gr <= 8) {
      for (let y = gr; y <= 8; y++) put(x, y, z, FOUND); // solid under upper air gap
    }
    if (gr <= ROOF) put(x, ROOF, z, "stone"); // roof slab
  }
}

// Entrance doors (overwrite the shopfront glass at centre of south face).
for (const [x, gr, z] of doors) {
  put(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Roof plant: a few condenser boxes in the centre of the roof, plus a mast.
let cx = 0, cz = 0, n = 0;
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  const interior = has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1);
  if (interior && gr <= ROOF && x >= 5 && x <= 12 && z >= 9 && z <= 19) {
    if ((x + z) % 3 !== 0) put(x, 10, z, ROOFBOX);
    cx += x; cz += z; n++;
  }
}
if (n > 0) {
  const mx = Math.round(cx / n), mz = Math.round(cz / n);
  put(mx, 10, mz, ROOFBOX);
  put(mx, 11, mz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
