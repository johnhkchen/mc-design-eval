import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise reinforced-concrete commercial block, c. 1970s-80s Taipei:
// two storeys over a shopfront base, white tiled/rendered walls with
// light-grey storey bands, a cornice, parapet, rooftop stair housing and AC units.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540300023";
const W = 19, H = 23, D = 20;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const WALL = "white_concrete";
const BAND = "light_gray_concrete";
const FOUND = "stone_bricks";
const FLOOR = "smooth_stone";
const GLASS = "glass_pane";
const MECH = "smooth_stone";

const ROOF_Y = 10;     // roof slab / cornice level
const PARAPET_Y = 11;  // parapet top (about 11 above lowest ground)
const STOREY_Y = 5;    // storey line
const GF_TOP = 3;      // last ground-floor glass row

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const gOf = (x, z) => ground.get(key(x, z));

const DIRS = {
  N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0],
};
const exposedFaces = (x, z) =>
  Object.keys(DIRS).filter(f => !has(x + DIRS[f][0], z + DIRS[f][1]));

const minX = Math.min(...cells.map(c => c[0]));
const minZ = Math.min(...cells.map(c => c[1]));

const put = (x, y, z, name, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
};

// 1. Foundation, floors, walls, storey bands, cornice and parapet
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  const faces = exposedFaces(x, z);
  if (faces.length === 0) {
    // Interior: floor slabs only, air between
    if (gr >= 0) put(x, gr, z, FLOOR);
    if (STOREY_Y >= gr) put(x, STOREY_Y, z, FLOOR);
    put(x, ROOF_Y, z, BAND);
  } else {
    // Perimeter wall column
    for (let y = gr; y <= ROOF_Y; y++) put(x, y, z, WALL);
    if (STOREY_Y >= gr) put(x, STOREY_Y, z, BAND);   // storey line
    put(x, gr, z, BAND);                              // base course
    put(x, ROOF_Y, z, BAND);                          // cornice
    put(x, PARAPET_Y, z, WALL);                       // parapet
    put(x, PARAPET_Y, z, BAND);                       // parapet cap band
  }
}

// 2. Openings on exposed faces
// Pick the front door: south-facing perimeter cell with idx%3===1, lowest x
let doorCell = null;
for (const [x, z, gr] of cells) {
  if (!exposedFaces(x, z).includes("S")) continue;
  if (exposedFaces(x, z).length !== 1) continue;
  const idx = x - minX;
  if (idx % 3 !== 1) continue;
  if (!doorCell || x < doorCell[0]) doorCell = [x, z, gr];
}

for (const [x, z, gr] of cells) {
  const faces = exposedFaces(x, z);
  if (faces.length !== 1) continue; // keep corners solid
  const f = faces[0];
  const [dx, dz] = DIRS[f];
  const along = (f === "N" || f === "S") ? x - minX : z - minZ;
  const mull = along % 3 === 0;
  const panesProps = (f === "N" || f === "S")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  // Shopfront glass on ground floor
  for (let y = gr + 1; y <= GF_TOP; y++) {
    if (mull) put(x, y, z, BAND);
    else put(x, y, z, GLASS, panesProps);
  }

  // Upper storey windows (y 7-8) with a sill and head band
  if (!mull) {
    for (const y of [7, 8]) put(x, y, z, GLASS, panesProps);
  }

  // Warm light behind some upper windows (air gap inward)
  const ix = x - dx, iz = z - dz;
  if (!mull && along % 6 === 2 && has(ix, iz) && gOf(ix, iz) <= 7) {
    put(ix, 7, iz, "shroomlight");
  }
  // Ground-floor glowstone behind some shopfront glass
  if (!mull && along % 6 === 0 && has(ix, iz) && gr + 1 <= GF_TOP) {
    put(ix, gr + 2, iz, "glowstone");
  }
}

// Front entrance door on the chosen south cell, with lanterns either side
if (doorCell) {
  const [dx0, dz0, dgr] = doorCell;
  put(dx0, dgr + 1, dz0, "oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(dx0, dgr + 2, dz0, "oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Lanterns on the shopfront row flanking the door, hung from the lintel
  for (const ox of [-1, 1]) {
    if (has(dx0 + ox, dz0) && exposedFaces(dx0 + ox, dz0).includes("S")) {
      put(dx0 + ox, dgr + 3, dz0, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

// 3. Rooftop: stair housing (3x3 interior block nearest centre) and AC units
const interior = cells.filter(([x, z]) => exposedFaces(x, z).length === 0);
const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
const cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;

let best = null;
for (const [x, z] of interior) {
  let ok = true;
  for (let i = -1; i <= 1 && ok; i++)
    for (let j = -1; j <= 1 && ok; j++)
      if (!has(x + i, z + j) || exposedFaces(x + i, z + j).length !== 0) ok = false;
  if (!ok) continue;
  const d = Math.hypot(x - cx, z - cz);
  if (!best || d < best.d) best = { x, z, d };
}

const usedRoof = new Set();
if (best) {
  for (let i = -1; i <= 1; i++)
    for (let j = -1; j <= 1; j++) usedRoof.add(key(best.x + i, best.z + j));
  for (let i = -1; i <= 1; i++)
    for (let j = -1; j <= 1; j++) {
      const x = best.x + i, z = best.z + j;
      const perimeterCell = (i === -1 || i === 1 || j === -1 || j === 1);
      for (let y = PARAPET_Y; y <= PARAPET_Y + 2; y++) {
        if (y === PARAPET_Y + 2 && !(i === 0 && j === 0)) continue;
        put(x, y, z, perimeterCell ? WALL : MECH);
      }
    }
  // Stair housing door and roof cap
  put(best.x, PARAPET_Y, best.z - 1, "oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(best.x, PARAPET_Y + 1, best.z - 1, "oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Restore housing door cell to air-friendly placement if outside footprint
  put(best.x, PARAPET_Y + 3, best.z, BAND);
}

// AC condenser units on remaining interior roof cells
let acPlaced = 0;
for (const [x, z] of interior) {
  if (acPlaced >= 3) break;
  if (usedRoof.has(key(x, z))) continue;
  if (!has(x + 1, z) || usedRoof.has(key(x + 1, z))) continue;
  if (exposedFaces(x + 1, z).length !== 0) continue;
  put(x, PARAPET_Y, z, "iron_block");
  put(x, PARAPET_Y + 1, z, "iron_block");
  put(x + 1, PARAPET_Y, z, "iron_block");
  put(x + 1, PARAPET_Y + 1, z, "iron_block");
  usedRoof.add(key(x, z));
  usedRoof.add(key(x + 1, z));
  acPlaced++;
}

g.save(`${DIR}/${ID}.nbt`);
