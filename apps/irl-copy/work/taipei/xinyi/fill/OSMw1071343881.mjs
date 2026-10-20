import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343881";
const W = 22, H = 23, D = 17;
const ROOF = 11;            // roof slab top, about 11 blocks above lowest ground
const SLAB_Y = 5;           // second-storey floor line
const CORNICE_Y = 10;       // cornice band under the parapet

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint map: "x,z" -> ground y (clamped so every storey stays below the roof)
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.min(ROOF - 1, Math.round(gr))));
}

const key = (x, z) => `${x},${z}`;
const has = (x, z) => ground.has(key(x, z));
const gAt = (x, z) => ground.get(key(x, z));

// Exterior faces of a footprint cell (neighbour missing)
const outward = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
};
const step = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// ---- Pass 1: foundations, floors, walls, windows, roof -------------------
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const faces = outward(x, z);
  const perim = faces.length > 0;

  // Foundation fill up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior: floor slabs only, air elsewhere (no interiors)
    put(x, gr, z, "smooth_stone");
    if (SLAB_Y > gr) put(x, SLAB_Y, z, "smooth_stone");
    put(x, ROOF, z, "gray_concrete");
    continue;
  }

  const face = faces[0];
  const idx = (face === "north" || face === "south") ? x : z;

  for (let y = gr; y < ROOF; y++) {
    let id;
    if (y === gr) id = "polished_andesite";          // base course
    else if (y === CORNICE_Y) id = "stone_bricks";    // cornice
    else if (y === SLAB_Y) id = "smooth_stone";       // storey line
    else if (idx % 4 === 0) id = "smooth_quartz";     // pier / mullion
    else id = "light_blue_stained_glass";             // glazing
    put(x, y, z, id);
  }
  put(x, ROOF, z, "stone_bricks");                    // parapet
}

// ---- Pass 2: entrance, warm lights behind glass ---------------------------
// Entrance on the north-facing front, centred along its run of cells
const northCells = [];
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (outward(x, z).includes("north")) northCells.push([x, z, gr]);
}
let doorCell = null;
if (northCells.length) {
  northCells.sort((a, b) => a[0] - b[0]);
  doorCell = northCells[Math.floor(northCells.length / 2)];
}
if (doorCell) {
  const [dx, dz, dg] = doorCell;
  put(dx, dg, dz, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, dg + 1, dz, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(dx, dg + 2, dz, "smooth_quartz");               // lintel over door
}

// Warm light behind selected windows (inside the air gap, against the glass)
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const faces = outward(x, z);
  if (!faces.length) continue;
  const face = faces[0];
  const idx = (face === "north" || face === "south") ? x : z;
  if (idx % 4 === 0) continue; // pier, not glass
  const [sx, sz] = step[face];
  const ix = x - sx, iz = z - sz;   // inward neighbour
  if (!has(ix, iz) || outward(ix, iz).length) continue;
  const igr = gAt(ix, iz);
  // Upper storey lights
  if (idx % 8 === 2 && 7 > igr && 7 < ROOF) put(ix, 7, iz, "glowstone");
  // Ground storey lights
  if (idx % 8 === 5 && gr + 2 <= 4 && gr + 2 > igr) put(ix, gr + 2, iz, "shroomlight");
}

// ---- Pass 3: roof equipment on the roof slab -----------------------------
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (outward(x, z).length) continue;
  if (x % 7 === 3 && z % 5 === 2) {
    put(x, ROOF + 1, z, "iron_block");               // AC plant
  }
}

g.save(`${DIR}/${ID}.nbt`);
