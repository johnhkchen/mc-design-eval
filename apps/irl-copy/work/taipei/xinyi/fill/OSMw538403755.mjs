import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538403755.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538403755.nbt";

// 25 x 15 footprint, roof about 11 blocks above lowest ground.
// Read as a two-storey concrete-frame commercial block with tiled walls,
// glazed shopfront, a parapet, and a small rooftop plant room.
const W = 25, H = 23, D = 15;
const ROOF = 11;      // roof deck top, absolute y
const PARAPET = 12;   // parapet course on exterior ring

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const interior = (x, z) => has(x, z) && has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};
// Pane connection props: a pane on a north/south face (normal along z) joins east/west neighbours.
const pane = (onZFace) => onZFace
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const GLASS = "light_blue_stained_glass_pane";

// Pass 1: foundations, floors, storey line, roof deck.
for (const [x, z, gr] of cells) {
  const ground = Math.max(0, Math.min(Math.round(gr), H - 2));
  for (let y = 0; y < ground; y++) put(x, y, z, "stone");
  put(x, ground, z, "light_gray_concrete");          // ground-floor slab
  if (ground >= ROOF) continue;
  if (ground < 5) put(x, 5, z, "light_gray_concrete"); // storey-two floor slab
  put(x, ROOF, z, "gray_concrete");                   // roof deck
}

// Pass 2: exterior walls, windows, shopfront, door, warm lights.
for (const [x, z, gr] of cells) {
  const ground = Math.max(0, Math.min(Math.round(gr), H - 2));
  if (ground >= ROOF) continue;
  const mx = !has(x - 1, z) ? -1 : (!has(x + 1, z) ? 1 : 0);
  const mz = !has(x, z - 1) ? -1 : (!has(x, z + 1) ? 1 : 0);
  if (!mx && !mz) continue; // interior cell

  const corner = mx !== 0 && mz !== 0;
  const onZFace = mz !== 0;
  const along = onZFace ? x : z;
  const maxAlong = onZFace ? W - 1 : D - 1;
  const pier = corner || along === 0 || along === maxAlong || along % 3 === 0;

  // Parapet ring above the roof deck.
  put(x, PARAPET, z, "white_concrete");

  for (let y = ground; y <= 10; y++) {
    let id = null, props = null;
    if (y === ground && ground <= 4) {
      id = "stone_bricks";                             // base course
    } else if (y === 4 && ground <= 4) {
      id = "light_gray_concrete";                      // shopfront lintel / canopy band
    } else if (y === 5) {
      id = "light_gray_concrete";                      // storey line
    } else if (y === 10) {
      id = "stone_brick_slab";                         // cornice
      props = { type: "bottom", waterlogged: "false" };
    } else if (y === 9) {
      id = "light_gray_concrete";                      // window head frame
    } else if (y <= 3 || (y >= 6 && y <= 8)) {
      if (pier) id = "white_concrete";
      else { id = GLASS; props = pane(onZFace); }
    }
    if (id) put(x, y, z, id, props);
  }

  // Entrance: centred on the south face, only where the shopfront is low enough for a door.
  const isDoor = mz === 1 && x === 12 && ground <= 1;
  if (isDoor) {
    put(x, ground + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, ground + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  }

  // Warm light behind some windows (inside air gap, on a supporting floor).
  if (!pier && !isDoor) {
    const ix = x - mx, iz = z - mz;
    if (interior(ix, iz)) {
      if (along % 6 === 4) put(ix, 6, iz, "glowstone");          // storey two, on the 5-block slab
      if (along % 6 === 1 && ground <= 2) put(ix, ground + 1, iz, "glowstone"); // shopfront
    }
  }
}

// Pass 3: rooftop plant room, set back on the roof deck.
for (let x = 8; x <= 16; x++) {
  for (let z = 4; z <= 10; z++) {
    if (!has(x, z)) continue;
    const ring = x === 8 || x === 16 || z === 4 || z === 10;
    for (let y = 12; y <= 13; y++) {
      if (!ring) continue;
      const windowCell = (x === 12 && (z === 4 || z === 10)) || (z === 7 && (x === 8 || x === 16));
      if (windowCell) put(x, y, z, GLASS, pane(z === 4 || z === 10));
      else put(x, y, z, "white_concrete");
    }
    put(x, 14, z, "gray_concrete"); // plant room roof
  }
}

g.save(OUT);
