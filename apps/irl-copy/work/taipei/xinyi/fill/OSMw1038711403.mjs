import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1038711403";

// 36 x 32 footprint, roughly 11 blocks to roof above lowest ground.
// Two storeys of about 5 blocks, a concrete-and-glass office block in the
// 1990s Xinyi commercial style: white concrete piers, tinted glazing,
// quartz cornice, a roof parapet and a central mechanical penthouse.
const W = 36, H = 23, D = 32;
const ROOF_Y = 11;      // roof slab, absolute height (lowest ground = 0)
const CORNICE_Y = 10;   // top of the second storey wall
const FLOOR_Y = 5;      // storey line between the two storeys
const PARAPET_Y = 12;   // parapet course on the roof edge

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const groundMap = new Map();
for (const [x, z, gr] of cells) groundMap.set(`${x},${z}`, gr);

const inside = (x, z) => groundMap.has(`${x},${z}`);
const groundAt = (x, z) => groundMap.get(`${x},${z}`);
const edge = (x, z) => !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Inward neighbour for a perimeter cell (used for light behind glass).
function inward(x, z) {
  if (!inside(x, z - 1)) return [x, z + 1];
  if (!inside(x, z + 1)) return [x, z - 1];
  if (!inside(x - 1, z)) return [x + 1, z];
  return [x - 1, z];
}

for (const [x, z, groundRaw] of cells) {
  const gr = Math.min(groundRaw, H - 2);

  // 1. Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  // 2. Roof slab on every footprint cell (sits on walls or floor slabs).
  if (gr < ROOF_Y) put(x, ROOF_Y, z, "gray_concrete");

  const isEdge = edge(x, z);
  const xMissing = !inside(x - 1, z) || !inside(x + 1, z);
  const zMissing = !inside(x, z - 1) || !inside(x, z + 1);
  const isCorner = xMissing && zMissing;
  const southFace = !inside(x, z + 1);
  const northFace = !inside(x, z - 1);
  const onSouthEdge = southFace && (zMissing);
  // Along-wall coordinate for the bay rhythm.
  const u = (southFace || northFace) ? x : z;
  const entranceCell = onSouthEdge && x >= 14 && x <= 21;

  if (isEdge) {
    // 3. Exterior wall, from just above the ground up to the cornice.
    for (let y = gr + 1; y <= CORNICE_Y; y++) {
      let id;
      if (y === CORNICE_Y) {
        id = "quartz_block";                       // cornice
      } else if (y === gr + 1 && y < FLOOR_Y) {
        id = "smooth_stone";                       // base course
      } else if (y === FLOOR_Y) {
        id = "white_concrete";                     // storey line
      } else if (isCorner) {
        id = "white_concrete";                     // corner piers
      } else if (entranceCell && (y === 2 || y === 3)) {
        // Entrance: glazed doors between piers at x 14 and 21.
        id = (x === 14 || x === 21) ? "white_concrete" : "glass";
      } else if (entranceCell && y === 4) {
        id = "light_gray_concrete";                // entrance lintel
      } else if (u % 3 === 0) {
        id = "white_concrete";                     // vertical piers
      } else if (y === 2 || y === 3 || y === 7 || y === 8) {
        id = "light_blue_stained_glass";           // glazing
      } else {
        id = "light_gray_concrete";                // spandrel
      }
      if (gr + 1 > y) continue;
      put(x, y, z, id);
    }

    // Entrance canopy lanterns beneath the lintel, dusk lighting.
    if (entranceCell && (x === 16 || x === 19) && gr < 3) {
      put(x, 3, z, "lantern", { hanging: "true" });
    }

    // Parapet on the roof edge.
    if (gr < ROOF_Y) put(x, PARAPET_Y, z, "quartz_block");

    // Glowstone behind selected second-storey glazing.
    if (!isCorner && !entranceCell && u % 3 !== 0 && ((x * 7 + z * 3) % 5 === 0)) {
      const [ix, iz] = inward(x, z);
      if (inside(ix, iz) && !edge(ix, iz) && groundAt(ix, iz) < 7) {
        put(ix, 7, iz, "glowstone");
      }
    }
  } else {
    // 4. Interior: only the floor slabs at storey lines, air between.
    for (let y = gr + 1; y <= CORNICE_Y; y++) {
      if (y === FLOOR_Y || y === CORNICE_Y) put(x, y, z, "white_concrete");
    }
  }
}

// 5. Central mechanical penthouse on the roof, inset from the edges.
const PH = { x0: 10, x1: 25, z0: 9, z1: 22 };
for (let x = PH.x0; x <= PH.x1; x++) {
  for (let z = PH.z0; z <= PH.z1; z++) {
    if (!inside(x, z)) continue;
    const perim = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
    const corner = (x === PH.x0 || x === PH.x1) && (z === PH.z0 || z === PH.z1);
    if (perim) {
      for (const y of [12, 13]) {
        let id;
        if (corner) id = "white_concrete";
        else id = ((x + z) % 2 === 0) ? "light_blue_stained_glass" : "white_concrete";
        put(x, y, z, id);
      }
    }
    // Cap over the whole penthouse footprint.
    put(x, 14, z, "gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
