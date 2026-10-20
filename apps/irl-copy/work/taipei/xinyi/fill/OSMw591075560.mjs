import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075560";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Record: 14 x 6 footprint, roof ~8 blocks above lowest ground.
// Read as a two-storey 1970s-80s Xinyi-fringe commercial block: stone-brick plinth,
// pale quartz walls, white piers, glass shopfront on the street (z=0) side,
// a stringcourse at storey line y=4, cornice at y=8 and a parapet at y=9.
const W = 14, H = 20, D = 6;
const FLOOR = 4;   // storey line
const ROOF = 8;    // roof deck / cornice level
const vox = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gr = (x, z) => ground.get(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const isPierX = (x) => x % 3 === 0 || x === W - 1;

const set = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};

const GLASS_FRONT = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const GLASS_SIDE = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };

// Front (z=0) and back (z=D-1) facade material for a wall cell at height y
function facadeBlock(x, y, z, base, front) {
  const pier = isPierX(x);
  if (y < FLOOR) {
    // ground floor: shopfront glass between piers, entrance door at x=7 on the street side
    if (front && x === 7) {
      if (y === base + 1) return ["dark_oak_door", { ...DOOR, half: "lower" }];
      if (y === base + 2) return ["dark_oak_door", { ...DOOR, half: "upper" }];
      return ["light_gray_concrete"];
    }
    if (pier) return ["white_concrete"];
    return ["glass_pane", GLASS_FRONT];
  }
  // upper storey: window bays with lintel at y=7
  if (y === 7) return pier ? ["white_concrete"] : ["light_gray_concrete"];
  if (pier) return ["white_concrete"];
  return ["glass_pane", GLASS_FRONT];
}

// Side (x=0 / x=W-1) wall: a single window pair at z=2..3
function sideBlock(z, y, base) {
  const win = (z === 2 || z === 3);
  if (y === 7) return win ? ["light_gray_concrete"] : ["smooth_quartz"];
  if (win) return ["glass_pane", GLASS_SIDE];
  return ["smooth_quartz"];
}

for (const [x, z, base] of cells) {
  const edge = isEdge(x, z);

  // foundation below the cell's own ground
  for (let y = 0; y < base; y++) set(x, y, z, "stone_bricks");

  // floor slab at the cell's ground (base course on the edge, slab inside)
  set(x, base, z, edge ? "stone_bricks" : "smooth_quartz");

  for (let y = base + 1; y <= ROOF; y++) {
    if (y === ROOF) {
      set(x, y, z, edge ? "stone_bricks" : "light_gray_concrete");
      continue;
    }
    if (y === FLOOR && base < FLOOR) {
      set(x, y, z, edge ? "light_gray_concrete" : "smooth_quartz");
      continue;
    }
    if (!edge) continue; // interior air behind the glass

    let blk;
    if (z === 0) blk = facadeBlock(x, y, z, base, true);
    else if (z === D - 1) blk = facadeBlock(x, y, z, base, false);
    else if (x === 0 || x === W - 1) blk = sideBlock(z, y, base);
    else blk = ["smooth_quartz"];
    set(x, y, z, blk[0], blk[1]);
  }

  // parapet on the roof edge
  if (edge) set(x, ROOF + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  // roof equipment: two condenser boxes on the roof deck, inside the parapet
  if (!edge && z === 2 && (x === 2 || x === 9)) {
    set(x, ROOF + 1, z, "light_gray_concrete");
    set(x, ROOF + 2, z, "light_gray_concrete");
  }
}

// Warm light behind selected windows (interior air cells at z=1)
if (has(2, 1)) set(2, 5, 1, "glowstone");
if (has(8, 1)) set(8, 2, 1, "shroomlight");
if (has(11, 1)) set(11, 5, 1, "glowstone");

vox.save(`${DIR}/${ID}.nbt`);
