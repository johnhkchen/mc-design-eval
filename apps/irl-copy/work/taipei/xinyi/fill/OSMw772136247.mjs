import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw772136247";
const W = 30, H = 23, D = 17;
const ROOF = 11;     // roof slab row, about 11 blocks above the lowest ground
const PARAPET = 12;  // parapet course on the roof edge

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const vox = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const key = (x, z) => `${x},${z}`;

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) vox.set(x, y, z, block, props);
  else vox.set(x, y, z, block);
}

// outward faces of a footprint cell, and the inward offset for each
function exposures(x, z) {
  const out = [];
  if (!has(x, z - 1)) out.push("N");
  if (!has(x, z + 1)) out.push("S");
  if (!has(x - 1, z)) out.push("W");
  if (!has(x + 1, z)) out.push("E");
  return out;
}
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
const FACING = { N: "north", S: "south", W: "west", E: "east" };

// window rhythm: bays of 4 along the face, glass on the middle two
const glassBay = (c) => c % 4 === 1 || c % 4 === 2;

// street entrance: the two north-facing cells nearest the middle of the front
const northCells = cells.filter(([x, z]) => exposures(x, z).includes("N"));
northCells.sort((a, b) => Math.abs(a[0] - 14.5) - Math.abs(b[0] - 14.5));
const entrance = new Set(northCells.slice(0, 2).map(([x, z]) => key(x, z)));

for (const [x, z, gr0] of cells) {
  const gr = Math.min(gr0, 10);
  const ex = exposures(x, z);
  const perim = ex.length > 0;

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!perim) {
    // interior: floor slabs per storey, air between, roof on top
    put(x, gr, z, "smooth_stone");
    if (gr < 5) put(x, 5, z, "smooth_stone");
    put(x, ROOF, z, "light_gray_concrete");
    // roof plant in the middle of the plan
    if (x >= 10 && x <= 13 && z >= 6 && z <= 10) {
      put(x, ROOF + 1, z, "gray_concrete");
      if (x >= 11 && x <= 12 && z >= 7 && z <= 9) put(x, ROOF + 2, z, "gray_concrete");
    }
    continue;
  }

  // perimeter: articulated facade
  const c = ex[0] === "N" || ex[0] === "S" ? x : z;
  const glass = glassBay(c);

  for (let y = gr; y <= PARAPET; y++) {
    if (y === gr) put(x, y, z, "stone_bricks");                     // base course
    else if (y === ROOF) put(x, y, z, "light_gray_concrete");       // roof slab
    else if (y === PARAPET) put(x, y, z, "light_gray_concrete");    // parapet cap
    else if (y >= gr + 1 && y <= 4) {                                // shopfront storey
      put(x, y, z, glass ? "light_blue_stained_glass" : "white_concrete");
    } else if (y === 5) put(x, y, z, "light_gray_concrete");        // storey line
    else if (y >= 6 && y <= 8) {                                     // upper storey windows
      put(x, y, z, glass ? "light_blue_stained_glass" : "white_concrete");
    } else if (y === 9) put(x, y, z, "light_gray_concrete");        // spandrel band
    else if (y === 10) put(x, y, z, "white_concrete");              // wall below roof
  }

  // warm light behind some upper-storey windows, in the sealed air gap
  if (glass && gr <= 6) {
    const [ox, oz] = INWARD[ex[0]];
    const ix = x + ox, iz = z + oz;
    if (has(ix, iz) && exposures(ix, iz).length === 0 && (x + z) % 3 === 0) {
      put(ix, 7, iz, "shroomlight");
    }
  }

  // entrance: double door, canopy slab above it
  if (entrance.has(key(x, z)) && ex.includes("N") && gr + 2 <= 10) {
    const hinge = "left";
    put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
    put(x, gr + 3, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
}

vox.save(`${DIR}/${ID}.nbt`);
