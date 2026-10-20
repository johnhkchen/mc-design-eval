import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw520038107";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 16, H = 23, D = 40;
const vox = new Voxels([W, H, D]);

// Materials: 1990s-era low-rise commercial block, pale tiled/quartz cladding,
// grey concrete trim, stone plinth, glazed shopfronts and upper windows.
const WALL = "smooth_quartz";
const TRIM = "light_gray_concrete";
const BASE = "stone_bricks";
const FOUND = "stone";
const GLASS = "glass_pane";
const LAMP = "glowstone";
const ROOFBOX = "light_gray_concrete";

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));

const has = (x, z) => ground.has(key(x, z));
const DIRS = {
  north: [0, -1],
  south: [0, 1],
  east: [1, 0],
  west: [-1, 0],
};

function outward(x, z) {
  for (const [name, [dx, dz]] of Object.entries(DIRS)) {
    if (!has(x + dx, z + dz)) return name;
  }
  return null;
}
const isPerim = (x, z) => outward(x, z) !== null;

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) vox.set(x, y, z, block, props);
  else vox.set(x, y, z, block);
}

// Storey datum (relative to lowest ground):
//  ground floor 0..4, spandrel 5, upper floor 6..9, cornice 10, parapet 11.
// Roof deck is y=10; roof is 11 blocks above lowest ground.

// Pick entrance: north-facing perimeter cell nearest the centre line.
let entrance = null;
{
  let best = Infinity;
  for (const [k, gg] of ground) {
    const [x, z] = k.split(",").map(Number);
    if (outward(x, z) !== "north") continue;
    const d = Math.abs(x - 7.5);
    if (d < best) { best = d; entrance = { x, z, gg }; }
  }
  if (!entrance) {
    for (const [k, gg] of ground) {
      const [x, z] = k.split(",").map(Number);
      if (isPerim(x, z)) { entrance = { x, z, gg }; break; }
    }
  }
}

for (const [k, gg] of ground) {
  const [x, z] = k.split(",").map(Number);

  // Foundation: solid from y=0 up to this cell's ground.
  for (let y = 0; y < gg; y++) put(x, y, z, FOUND);

  const out = outward(x, z);

  if (out) {
    // ---- Perimeter (facade) cell ----
    const [dx, dz] = DIRS[out];
    const ix = x - dx, iz = z - dz;              // inward neighbour
    const inwardOpen = has(ix, iz) && !isPerim(ix, iz);
    const parity = (x + z);

    // Plinth course
    put(x, gg, z, BASE);

    // Ground floor: shopfront glazing with piers.
    for (let y = Math.max(gg + 1, 1); y <= 3; y++) {
      put(x, y, z, parity % 3 === 0 ? TRIM : GLASS);
    }
    // Ground floor lintel
    if (4 >= gg) put(x, 4, z, WALL);

    // Storey line
    if (5 >= gg) put(x, 5, z, TRIM);

    // Upper floor: window bays alternating with quartz piers.
    for (let y = Math.max(gg, 6); y <= 8; y++) {
      put(x, y, z, parity % 2 === 0 ? GLASS : WALL);
    }
    // Upper lintel
    if (9 >= gg) put(x, 9, z, WALL);

    // Cornice and parapet
    if (10 >= gg) put(x, 10, z, TRIM);
    put(x, 11, z, WALL);

    // Warm light behind some glazed bays
    if (inwardOpen) {
      if (parity % 4 === 0 && 7 >= gg) put(ix, 7, iz, LAMP);
      if (parity % 6 === 0 && 2 >= gg) put(ix, 2, iz, LAMP);
    }
  } else {
    // ---- Interior cell: floor slabs and roof deck, air gap elsewhere ----
    if (5 >= gg) put(x, 5, z, TRIM);
    if (10 >= gg) put(x, 10, z, TRIM);
    // Roof equipment boxes, sparse
    if ((x * 7 + z * 3) % 9 === 0 && 11 >= gg) put(x, 11, z, ROOFBOX);
  }
}

// Entrance: door on the north facade, flanked by piers, with a dark lintel.
if (entrance) {
  const { x, z, gg } = entrance;
  const y0 = Math.max(gg + 1, 1);
  const facing = "north";
  put(x, y0, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, y0 + 1, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  // Door head and flanking piers
  put(x, y0 + 2, z, TRIM);
  for (const dxx of [-1, 1]) {
    const nx = x + dxx;
    if (has(nx, z) && isPerim(nx, z)) {
      for (let y = y0; y <= 3; y++) put(nx, y, z, TRIM);
    }
  }
}

vox.save(`${DIR}/${ID}.nbt`);
