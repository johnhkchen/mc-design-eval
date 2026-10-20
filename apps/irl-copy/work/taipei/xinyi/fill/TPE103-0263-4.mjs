import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE103-0263-4";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 5 x 18. Two storeys of about 5 blocks, parapet at the top, roof about 11 above ground.
const W = 5, H = 23, D = 18;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));

const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Glass pane whose connections run along the wall it sits in.
function pane(alongX) {
  return alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

// Facade shell for an exposed cell. gy = that cell's ground level.
function facade(x, z, gy) {
  const onZFace = z === 0 || z === D - 1;     // wall runs along x
  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
  const pillar = corner || ((x + z) % 3 === 0);
  const front = z === 0;                       // street frontage
  const entry = front && x === 2;
  const shop = front && x >= 1 && x <= 3;

  for (let h = 0; h <= 10; h++) {
    const y = gy + h;
    if (h === 0) { put(x, y, z, "stone_bricks"); continue; }          // base course
    if (h === 10) { put(x, y, z, "stone_bricks"); continue; }         // parapet cap
    if (h === 4) {
      // Shopfront canopy: a dark oak slab sitting on the lintel course.
      if (shop) put(x, y, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
      else put(x, y, z, "light_gray_concrete");
      continue;
    }
    if (h === 5) { put(x, y, z, "smooth_stone"); continue; }         // storey line
    if (h === 9) { put(x, y, z, "light_gray_concrete"); continue; }   // upper sill

    const groundFloor = h <= 3;
    if (entry && h === 1) { put(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
    if (entry && h === 2) { put(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    if (entry && h === 3) { put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }

    if (pillar) { put(x, y, z, "white_concrete"); continue; }

    if (groundFloor && front) { put(x, y, z, "glass"); continue; }  // shopfront glazing

    if (!groundFloor && h === 7 && ((x * 2 + z) % 5 === 1)) {
      put(x, y, z, "sea_lantern");                                  // warm lit window
      continue;
    }
    put(x, y, z, "glass_pane", pane(onZFace));
  }
}

// Open interior: floor slabs per storey and a roof deck, air between.
function interior(x, z, gy) {
  put(x, gy, z, "light_gray_concrete");
  put(x, gy + 5, z, "light_gray_concrete");
  put(x, gy + 10, z, "light_gray_concrete");
  // Roof equipment on the deck
  if ((x === 1 || x === 3) && z % 6 === 3) put(x, gy + 11, z, "smooth_quartz");
}

for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

for (const [x, z, gr] of cells) {
  if (isEdge(x, z)) facade(x, z, gr);
  else interior(x, z, gr);
}

g.save(`${DIR}/${ID}.nbt`);
