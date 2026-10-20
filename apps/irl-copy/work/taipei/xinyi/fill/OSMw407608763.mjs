import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw407608763";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 36, H = 23, D = 32;
const g = new Voxels([W, H, D]);

// ---- footprint bookkeeping -------------------------------------------------
const ground = new Map();
let minG = Infinity;
let sx = 0, sz = 0;
for (const [x, z, gy] of cells) {
  ground.set(`${x},${z}`, gy);
  minG = Math.min(minG, gy);
  sx += x; sz += z;
}
const cx = sx / cells.length;
const cz = sz / cells.length;
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const isEdge = (x, z) => has(x, z) && (!has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1));

// 11-block building measured from the lowest ground:
// storey 1 = minG..minG+4, storey 2 = minG+5..minG+9, cornice/parapet course at minG+10.
const FLOOR2 = minG + 5;
const TOP = minG + 10;
const LINTEL1 = minG + 4;

// ---- materials -------------------------------------------------------------
const WALL = "smooth_quartz";            // cream ceramic-tile facade
const PIER = "quartz_pillar";            // fluted pilasters between bays
const BASE = "stone_bricks";             // granite-style plinth
const CORNICE = "smooth_quartz_slab";    // projecting-looking cornice band
const GLASS = "gray_stained_glass_pane"; // tinted 1980s glazing
const ROOF = "gray_concrete";            // flat tar-and-gravel roof
const DOOR = "dark_oak_door";
const LAMP = "glowstone";
const WARM = "shroomlight";
const MECH = "iron_block";               // plant room
const MECH2 = "light_gray_concrete";     // cooling units

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

function paneProps(x, z) {
  const c = (a, b) => (isEdge(a, b) ? "true" : "false");
  return { north: c(x, z - 1), south: c(x, z + 1), east: c(x + 1, z), west: c(x - 1, z), waterlogged: "false" };
}

function parapetProps(x, z) {
  const c = (a, b) => (has(a, b) ? "low" : "none");
  return {
    north: c(x, z - 1), south: c(x, z + 1), east: c(x + 1, z), west: c(x - 1, z),
    up: "true", waterlogged: "false",
  };
}

const edgeDirs = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
function outward(x, z) {
  for (const [dx, dz, name] of edgeDirs) {
    if (!has(x + dx, z + dz)) return { dx, dz, name };
  }
  return null;
}

// Corners and every third bay are pilasters; glass sits in the bays between.
const isCorner = (x, z) =>
  (!has(x + 1, z) && !has(x, z + 1)) || (!has(x - 1, z) && !has(x, z + 1)) ||
  (!has(x + 1, z) && !has(x, z - 1)) || (!has(x - 1, z) && !has(x, z - 1));
const isPier = (x, z) => isCorner(x, z) || (((x + z) % 3) + 3) % 3 === 0;

// ---- entrance: on the south-facing (+z) edge nearest the centre -----------
let door = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    if (!isEdge(x, z)) continue;
    const o = outward(x, z);
    if (!o || o.dz !== 1) continue;
    const d = Math.abs(x - cx);
    if (d < best) { best = d; door = { x, z, o }; }
  }
  if (!door) {
    for (const [x, z] of cells) {
      if (!isEdge(x, z)) continue;
      const o = outward(x, z);
      if (!o) continue;
      const d = Math.abs(x - cx);
      if (d < best) { best = d; door = { x, z, o }; }
    }
  }
}

// ---- foundations, floors, roof deck ----------------------------------------
for (const [x, z, gy] of cells) {
  for (let y = 0; y < gy; y++) put(x, y, z, BASE);
  if (!isEdge(x, z)) {
    if (gy <= FLOOR2) put(x, FLOOR2, z, WALL);   // storey slab
    if (gy <= TOP) put(x, TOP, z, ROOF);         // roof deck
  }
}

// ---- facade columns ---------------------------------------------------------
for (const [x, z, gy] of cells) {
  if (!isEdge(x, z)) continue;
  const pier = isPier(x, z);

  for (let y = gy; y <= TOP; y++) {
    if (y === TOP) {
      // parapet with coping
      put(x, y, z, "stone_brick_wall", parapetProps(x, z));
    } else if (y === TOP - 1) {
      // cornice band, stepped in from the wall face by a slab course
      put(x, y, z, CORNICE, { type: "top", waterlogged: "false" });
    } else if (y === gy) {
      put(x, y, z, BASE);                        // plinth
    } else if (y === gy + 1 && y < LINTEL1) {
      put(x, y, z, BASE);                        // second plinth course
    } else if (y <= LINTEL1) {
      // ground-floor shopfront band
      if (y === LINTEL1) put(x, y, z, WALL);     // storey line
      else if (pier) put(x, y, z, PIER);
      else put(x, y, z, GLASS, paneProps(x, z));
    } else if (y === FLOOR2) {
      put(x, y, z, WALL);                        // storey line
    } else if (y === FLOOR2 + 1 || y === FLOOR2 + 4) {
      // sill / head courses above and below the upper windows
      put(x, y, z, WALL);
    } else {
      // upper storey windows
      if (pier) put(x, y, z, PIER);
      else put(x, y, z, GLASS, paneProps(x, z));
    }
  }
}

// ---- warm light behind some glass (air-gap cell inward) --------------------
for (const [x, z, gy] of cells) {
  if (!isEdge(x, z)) continue;
  const o = outward(x, z);
  if (!o) continue;
  const ix = x - o.dx, iz = z - o.dz;
  if (!has(ix, iz) || isEdge(ix, iz)) continue;
  const igy = gnd(ix, iz);

  // upper-storey lamps, staggered
  if (((x * 5 + z * 7) % 6 + 6) % 6 === 0 && !isPier(x, z)) {
    const y = FLOOR2 + 2;
    if (y > FLOOR2 && y >= igy) put(ix, y, iz, LAMP);
  }
  // shopfront shroomlights
  if (((x + 2 * z) % 4 + 4) % 4 === 0 && !isPier(x, z) && gy + 2 <= LINTEL1) {
    const y = gy + 2;
    if (y >= igy) put(ix, y, iz, WARM);
  }
}

// ---- entrance: canopy lintel, door ------------------------------------------
if (door) {
  const { x, z, o } = door;
  const facing = o.name;
  const gy = gnd(x, z);
  if (gy + 2 <= LINTEL1) {
    put(x, gy + 1, z, DOOR, { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gy + 2, z, DOOR, { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    // a lit lantern-style head over the door, and a lintel course above it
    if (gy + 3 <= LINTEL1) {
      put(x, gy + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// ---- roof plant: one coherent cluster instead of scattered boxes ------------
// Plant room (2 high) in the middle of the roof, cooling units alongside.
{
  const inCluster = (x, z) => Math.abs(x - cx) <= 3 && Math.abs(z - cz) <= 2;
  for (const [x, z, gy] of cells) {
    if (isEdge(x, z) || gy > TOP) continue;
    if (!inCluster(x, z)) continue;
    const plantRoom = Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 1;
    if (plantRoom) {
      put(x, TOP + 1, z, MECH);
      if (TOP + 2 < H) put(x, TOP + 2, z, MECH);
    } else if (TOP + 1 < H) {
      put(x, TOP + 1, z, MECH2);
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
