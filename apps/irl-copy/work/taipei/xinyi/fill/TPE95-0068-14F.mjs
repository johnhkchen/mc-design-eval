import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE95-0068-14F";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 54 x 20 footprint, roof at y=55 (about 55 blocks above lowest ground), parapet and plant to y=66.
const W = 54, H = 67, D = 20, TOP = 55;
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground height for that cell.
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const GLASS = "cyan_stained_glass";     // blue-green low-iron curtain wall, 2006 office glass
const FRAME = "white_concrete";          // mullions
const SPANDREL = "light_gray_concrete";  // floor lines, spandrels
const BASE = "polished_granite";         // base course at street level
const PLINTH = "stone_bricks";           // foundation fill below ground
const PARAPET = "smooth_quartz";         // roof edge
const CAP = "stone_brick_slab";          // parapet cap
const ROOF = "gray_concrete";

// Per-cell columns: foundation, envelope, floors.
for (const [x, z, gr] of cells) {
  const gg = Math.round(gr);
  const edge = isEdge(x, z);
  const front = z === 0;
  const back = z === D - 1;
  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

  // Foundation fill from y 0 up to this cell's ground.
  for (let y = 0; y < gg && y < H; y++) put(x, y, z, PLINTH);

  for (let y = gg; y < TOP; y++) {
    const s = Math.floor(y / 5);
    const r = y % 5;

    // Entrance door: two-block-high, centred on the street (z=0) frontage.
    if (front && edge && (x === 26 || x === 27) && (y === gg || y === gg + 1)) {
      const half = y === gg ? "lower" : "upper";
      put(x, y, z, "oak_door", {
        facing: "north", half, hinge: x === 26 ? "left" : "right",
        open: "false", powered: "false",
      });
      continue;
    }

    // Floor slabs and storey lines inside and out.
    if (r === 0) {
      if (edge && y === gg) put(x, y, z, BASE);
      else put(x, y, z, SPANDREL);
      continue;
    }

    // Interior: air gap, with warm lanterns set back two cells behind selected bays.
    if (!edge) {
      const nearFront = z === 2 && x % 6 === 1;
      const nearBack = z === D - 3 && x % 6 === 4;
      if ((nearFront || nearBack) && r === 2 && s > 0 && x > 1 && x < W - 2) {
        put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      }
      continue;
    }

    // Envelope.
    if (r === 4) { put(x, y, z, SPANDREL); continue; }

    // Corner piers run the full height of the envelope in frame material.
    if (corner) { put(x, y, z, FRAME); continue; }

    // Facade rhythm: frames every third bay along the face.
    const idx = (front || back) ? x : z;
    if (idx % 3 === 0) put(x, y, z, FRAME);
    else put(x, y, z, GLASS);
  }
}

// Entrance surround on the street frontage: granite jambs and lintel, so the
// door reads as a distinct opening in the glass.
for (let x = 24; x <= 29; x++) {
  if (!has(x, 0)) continue;
  const gg = Math.round(ground.get(`${x},0`));
  const jamb = x === 24 || x === 29;
  for (let y = gg; y <= gg + 3; y++) {
    if (jamb) put(x, y, 0, "polished_granite");
    else if (y === gg + 3) put(x, y, 0, "polished_granite");
  }
}

// Roof edge: parapet with a stepped cap, then the roof slab inside.
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const edge = isEdge(x, z);
  if (edge) {
    for (let y = TOP; y <= TOP + 2; y++) put(x, y, z, PARAPET);
    put(x, TOP + 3, z, CAP);
  } else {
    put(x, TOP, z, ROOF);
  }
}

// Roof plant: a louvred penthouse box, a flat cap, and a mast.
const PX0 = 18, PX1 = 35, PZ0 = 7, PZ1 = 12;
for (let x = PX0; x <= PX1; x++) {
  for (let z = PZ0; z <= PZ1; z++) {
    const wall = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
    for (let y = TOP + 1; y <= TOP + 5; y++) {
      if (wall) put(x, y, z, "gray_concrete");
    }
    put(x, TOP + 6, z, "smooth_stone");
  }
}
// Louvre slots on the penthouse faces.
for (let x = PX0 + 1; x < PX1; x += 2) {
  put(x, TOP + 3, PZ0, "iron_bars");
  put(x, TOP + 3, PZ1, "iron_bars");
}
// Mast on top of the penthouse.
for (let y = TOP + 7; y <= TOP + 11 && y < H; y++) put(26, y, 10, "iron_bars");

g.save(`${DIR}/${ID}.nbt`);
