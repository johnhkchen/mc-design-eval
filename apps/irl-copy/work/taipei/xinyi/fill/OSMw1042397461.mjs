import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Commercial office block, 1990s glass-and-concrete: five storeys of 5 blocks,
// white concrete frame with cyan-tinted glazing, shopfront at grade,
// parapet and a rooftop plant room. Roof surface at y 26.
const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1042397461";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 33, H = 38, D = 16;
const ROOF = 26;      // roof surface
const PARAPET_TOP = 28;
const g = new Voxels([W, H, D]);

const idx = new Map();
for (const [x, z, gr] of cells) idx.set(`${x},${z}`, gr);
const inFP = (x, z) => idx.has(`${x},${z}`);
const perimeter = (x, z) => !inFP(x + 1, z) || !inFP(x - 1, z) || !inFP(x, z + 1) || !inFP(x, z - 1);

function put(x, y, z, block, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

const paneX = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneZ = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const glass = "light_blue_stained_glass_pane";
const frame = "white_concrete";
const spandrel = "light_gray_concrete";

for (const [x, z, gr] of cells) {
  const per = perimeter(x, z);

  // foundation under every cell, up to its own ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!per) {
    // interior: ground slab, storey floor slabs, roof slab; air otherwise
    put(x, gr, z, "smooth_stone");
    for (let k = 1; k <= 5; k++) {
      const y = 5 * k;
      if (y > gr && y <= 25) put(x, y, z, spandrel);
    }
    put(x, ROOF, z, spandrel);
    continue;
  }

  // perimeter: full wall column from ground to parapet
  const zEdge = !inFP(x, z - 1) || !inFP(x, z + 1); // wall runs along x
  const u = zEdge ? x : z;
  const pane = zEdge ? paneX : paneZ;
  const dx = !inFP(x - 1, z) ? 1 : -1;
  const dz = !inFP(x, z - 1) ? 1 : -1;

  // entrance on the centre bay of the south/north facade
  const isDoorBay = zEdge && x === 16;
  const doorFacing = !inFP(x, z + 1) ? "south" : (!inFP(x, z - 1) ? "north" : null);
  const doorBay = isDoorBay && doorFacing !== null;

  for (let y = gr; y <= PARAPET_TOP; y++) {
    if (y === gr) { put(x, y, z, "polished_granite"); continue; }
    if (y === ROOF) { put(x, y, z, "smooth_stone"); continue; }
    if (y === 27) { put(x, y, z, frame); continue; }
    if (y === PARAPET_TOP) { put(x, y, z, spandrel); continue; }

    if (doorBay && (y === gr || y === gr + 1) && y <= 4) {
      const half = y === gr ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", { facing: doorFacing, half, hinge: "left", open: "false", powered: "false" });
      continue;
    }

    const m = y % 5;
    if (y < 5) {
      // ground storey shopfront
      put(x, y, z, u % 3 === 0 ? frame : glass, u % 3 === 0 ? undefined : pane);
      continue;
    }
    if (m === 0 || m === 4) { put(x, y, z, spandrel); continue; }

    // upper window bands (m = 1..3)
    if (u % 3 === 0) { put(x, y, z, frame); continue; }
    put(x, y, z, glass, pane);

    // warm light standing on the floor slab behind some windows
    if (m === 1 && u % 6 === 4 && inFP(x + dx, z) && !perimeter(x + dx, z) && !zEdge) {
      put(x + dx, y, z, "lantern", { hanging: "false", waterlogged: "false" });
    } else if (m === 1 && u % 6 === 4 && zEdge && inFP(x, z + dz) && !perimeter(x, z + dz)) {
      put(x, y, z + dz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }

  // interior floor slabs for upper storeys hidden behind the wall
  for (let k = 1; k <= 5; k++) {
    const y = 5 * k;
    if (y > gr && y <= 25) { /* covered by window/spandrel wall; interior floor below */ }
  }
}

// interior floor slabs need to exist on interior cells that were not perimeter (handled above),
// and every perimeter cell's interior neighbour needs a floor slab at each storey line:
for (const [x, z, gr] of cells) {
  if (perimeter(x, z)) continue;
  for (let k = 1; k <= 5; k++) {
    const y = 5 * k;
    if (y > gr && y <= 25) put(x, y, z, spandrel);
  }
}

// rooftop plant room on the roof
const rx0 = 6, rx1 = 11, rz0 = 5, rz1 = 10;
let roofOK = true;
for (let x = rx0; x <= rx1; x++) for (let z = rz0; z <= rz1; z++) if (!inFP(x, z)) roofOK = false;
if (roofOK) {
  for (let x = rx0; x <= rx1; x++) for (let z = rz0; z <= rz1; z++) {
    const edge = x === rx0 || x === rx1 || z === rz0 || z === rz1;
    for (let y = 27; y <= 29; y++) {
      if (edge) {
        const ww = (x + z + y) % 3 === 0;
        put(x, y, z, ww ? glass : spandrel, ww ? paneX : undefined);
      }
    }
    put(x, 30, z, "stone_bricks");
  }
  put(8, 31, 7, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${dir}/${id}.nbt`);
