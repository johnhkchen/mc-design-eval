import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw365099780";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 57 x 71 x 29. Full-footprint shaft to y 44 (floor line), inset setback tier to the
// roof slab at y 59, parapet and penthouse above.
const W = 57, H = 71, D = 29;
const TOP = 59;   // roof slab of the tier
const SET = 44;   // terrace level where the tier starts (floor line: 59 - 15)
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.min(gr, 50));
const has = (x, z) => ground.has(key(x, z));
const gAt = (x, z) => ground.get(key(x, z));

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const isEdge = (x, z) => DIRS.some(([dx, dz]) => !has(x + dx, z + dz));

// Setback tier: cells whose whole Manhattan-3 neighbourhood is footprint.
const tier = (x, z) => {
  if (!has(x, z)) return false;
  for (let dx = -3; dx <= 3; dx++)
    for (let dz = -3; dz <= 3; dz++)
      if (Math.abs(dx) + Math.abs(dz) <= 3 && !has(x + dx, z + dz)) return false;
  return true;
};
const tierEdge = (x, z) => tier(x, z) && DIRS.some(([dx, dz]) => !tier(x + dx, z + dz));
const edgeAt = (x, z, y) => (y >= SET ? tierEdge(x, z) : isEdge(x, z));
const inBody = (x, z, y) => (y >= SET ? tier(x, z) : has(x, z));

// Floor lines every 5 blocks, counted down from the tier roof.
const fl = (y) => ((y - TOP) % 5 + 5) % 5 === 0;

// Entrance: centre of the front (minimum-z) row.
const frontXs = cells.filter(([, z]) => z === minZ).map(([x]) => x);
const cx = Math.round(frontXs.reduce((a, b) => a + b, 0) / frontXs.length);
const isEntranceRow = (x, z) => z === minZ && Math.abs(x - cx) <= 2;
const isDoorway = (x, z) => z === minZ && Math.abs(x - cx) <= 1;

// Penthouse footprint on the tier roof.
const inPenthouse = (x, z) =>
  x >= minX + 9 && x <= maxX - 9 && z >= minZ + 8 && z <= maxZ - 8 && tier(x, z);

// ---- facade -------------------------------------------------------------------
function glassAt(x) {
  return Math.floor(x / 4) % 3 === 1 ? "cyan_stained_glass" : "light_blue_stained_glass";
}

function facade(x, y, z, gr) {
  if (y === gr) return "polished_granite";                       // base course
  if (y === TOP - 1) return "smooth_quartz";                     // cornice
  if (y < gr + 4) {                                              // shopfront
    return (x + z) % 4 === 0 ? "white_concrete" : glassAt(x);
  }
  if (fl(y)) return "smooth_quartz";                             // storey line
  return (x + z) % 3 === 0 ? "white_concrete" : glassAt(x);      // window grid
}

// ---- 1. foundation, shaft and setback tier -----------------------------------
for (const [x, z] of cells) {
  const gr = gAt(x, z);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Body from ground to roof slab, stepping in above SET.
  for (let y = gr; y < TOP; y++) {
    if (!inBody(x, z, y)) continue;
    if (edgeAt(x, z, y)) {
      g.set(x, y, z, facade(x, y, z, gr));
    } else if (y > gr && fl(y)) {
      g.set(x, y, z, "light_gray_concrete");                    // floor slab
    }
    // interior otherwise stays air (no interiors)
  }
}

// Terrace on the shaft roof at SET, ringing the tier.
for (const [x, z] of cells) {
  if (tier(x, z)) continue;
  g.set(x, SET, z, "light_gray_concrete");
  if (isEdge(x, z)) {
    g.set(x, SET, z, "smooth_quartz");
    g.set(x, SET + 1, z, "white_concrete");
    g.set(x, SET + 2, z, "white_concrete");
    g.set(x, SET + 3, z, "smooth_quartz");
  }
}

// Tier roof slab and parapet.
for (const [x, z] of cells) {
  if (!tier(x, z)) continue;
  g.set(x, TOP, z, "light_gray_concrete");
  if (tierEdge(x, z)) {
    g.set(x, TOP + 1, z, "white_concrete");
    g.set(x, TOP + 2, z, "white_concrete");
    g.set(x, TOP + 3, z, "smooth_quartz");
  }
}

// ---- 2. entrance -------------------------------------------------------------
for (const [x, z] of cells) {
  if (!isEntranceRow(x, z)) continue;
  const gr = gAt(x, z);
  if (isDoorway(x, z)) {
    for (let y = gr + 1; y <= gr + 3; y++) g.set(x, y, z, "air");
  }
  g.set(x, gr + 4, z, "smooth_stone");                          // canopy
}
for (const dx of [-2, 2]) {
  const x = cx + dx;
  if (!has(x, minZ)) continue;
  const gr = gAt(x, minZ);
  g.set(x, gr + 3, minZ, "lantern", { hanging: "true", waterlogged: "false" });
}

// ---- 3. warm lights behind glass ----------------------------------------------
for (const [x, z] of cells) {
  const gr = gAt(x, z);
  for (let y = gr + 4; y <= TOP - 2; y++) {
    if (fl(y) || !inBody(x, z, y) || !edgeAt(x, z, y)) continue;
    if ((x * 3 + z * 5 + y) % 11 !== 0) continue;
    for (const [dx, dz] of DIRS) {
      const ix = x + dx, iz = z + dz;
      if (!inBody(ix, iz, y) || edgeAt(ix, iz, y)) continue;
      if (gAt(ix, iz) > y) continue;
      g.set(ix, y, iz, (x + z) % 2 === 0 ? "glowstone" : "shroomlight");
      break;
    }
  }
}

// ---- 4. penthouse on the tier roof --------------------------------------------
for (const [x, z] of cells) {
  if (!inPenthouse(x, z)) continue;
  const boundary = DIRS.some(([dx, dz]) => !inPenthouse(x + dx, z + dz));
  if (boundary) {
    for (let y = TOP + 1; y <= TOP + 4; y++) g.set(x, y, z, "smooth_stone");
  }
  g.set(x, TOP + 5, z, "smooth_stone");
}

g.save(`${DIR}/${ID}.nbt`);
