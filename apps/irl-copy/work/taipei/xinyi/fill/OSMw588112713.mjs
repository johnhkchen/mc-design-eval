import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, footprint 23 x 44, roof ~24 blocks above the lowest ground.
// Reading: a five-storey, late-20th-century Taipei commercial/office block.
// Concrete frame with white and light-grey concrete facades, a granite base
// course, a shopfront ground floor with a central entrance, bands at every
// storey line, a stone cornice and parapet, and a flat roof with a service core
// and water tank. Glass sits on the facade with an air gap behind it, and some
// windows show warm glowstone a block inside.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588112713";
const W = 23, H = 36, D = 44;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr);
const b = Math.min(...G.values());          // lowest ground under the footprint
const TOP_REL = 24;                          // roof block level, relative to b

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const has = (x, z) => G.has(key(x, z));
const exN = (x, z) => !has(x, z - 1);
const exS = (x, z) => !has(x, z + 1);
const exW = (x, z) => !has(x - 1, z);
const exE = (x, z) => !has(x + 1, z);
const isEdge = (x, z) => exN(x, z) || exS(x, z) || exW(x, z) || exE(x, z);

const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const midX = (minX + maxX) / 2;
const midZ = (minZ + maxZ) / 2;

// Entrance: on the north (low z) face, low-ground and near the middle of the frontage.
let door = null;
for (const [x, z, gr] of cells) {
  if (!exN(x, z)) continue;
  const score = (gr - b) * 100 + Math.abs(x - midX);
  if (!door || score < door.score) door = { x, z, score };
}
const isDoor = (x, z) => door && door.x === x && door.z === z;

// Palette
const FOUND = "stone_bricks";
const BASE = "polished_granite";
const BODY = "white_concrete";
const BAND = "light_gray_concrete";
const CORNICE = "smooth_stone";
const GLASS = "light_blue_stained_glass";
const ROOF = "light_gray_concrete";

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  const edge = isEdge(x, z);
  const r0 = Math.max(0, gr - b);
  const faceNS = exN(x, z) || exS(x, z);
  const bayIdx = faceNS ? x - minX : z - minZ;
  const pier = ((bayIdx % 4) + 4) % 4 === 0;

  // Inward neighbour for a facade cell (where its lit interior lives).
  let inward = null;
  if (edge) {
    if (exN(x, z)) inward = [x, z + 1];
    else if (exS(x, z)) inward = [x, z - 1];
    else if (exW(x, z)) inward = [x + 1, z];
    else if (exE(x, z)) inward = [x - 1, z];
  }

  for (let rel = r0; rel <= TOP_REL; rel++) {
    const y = rel + b;

    if (!edge) {
      // Interior: floor slab each storey and the roof; air between (no interiors).
      if (rel === TOP_REL || rel % 5 === 0) put(x, y, z, ROOF);
      continue;
    }

    // Facade cell.
    if (rel === TOP_REL) { put(x, y, z, BODY); continue; }          // parapet
    if (rel === TOP_REL - 1) { put(x, y, z, CORNICE); continue; }   // cornice
    if (rel === 0) { put(x, y, z, BASE); continue; }                // base course

    const w = rel % 5;
    if (w === 0 || w === 4) { put(x, y, z, BAND); continue; }       // storey lines

    // w in 1..3: wall zone of the storey.
    const k = Math.floor(rel / 5);
    if (pier) { put(x, y, z, BODY); continue; }

    if (isDoor(x, z)) {
      if (rel === 1 || rel === 2) {
        put(x, y, z, "oak_door", {
          facing: "north",
          half: rel === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (rel === 3) { put(x, y, z, BAND); continue; }              // lintel over door
    }

    put(x, y, z, GLASS);

    // Warm light behind some windows, one block inside the glass (air gap kept).
    if (rel === 2 && inward) {
      const [ix, iz] = inward;
      const ig = G.get(key(ix, iz));
      if (ig !== undefined && !isEdge(ix, iz) && ig <= y) {
        if (((x * 31 + z * 17 + k * 7) % 4) === 0) {
          put(ix, y, iz, "glowstone");
        }
      }
    }
  }
}

// Roof plant: a stair/lift core and a water tank on the flat roof, on interior cells only.
const cx = Math.round(midX), cz = Math.round(midZ);
const coreOK = [];
for (let dx = -2; dx <= 1; dx++) for (let dz = -2; dz <= 1; dz++) {
  const x = cx + dx, z = cz + dz;
  if (has(x, z) && !isEdge(x, z)) coreOK.push([x, z]);
}
for (const [x, z] of coreOK) {
  for (let rel = TOP_REL + 1; rel <= TOP_REL + 3; rel++) put(x, rel + b, z, BAND);
  put(x, TOP_REL + 4 + b, z, CORNICE);
}

const tankCell = [cx + 5, cz - 6];
if (has(...tankCell) && !isEdge(...tankCell)) {
  put(tankCell[0], TOP_REL + 1 + b, tankCell[1], "iron_block");
  put(tankCell[0], TOP_REL + 2 + b, tankCell[1], "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
