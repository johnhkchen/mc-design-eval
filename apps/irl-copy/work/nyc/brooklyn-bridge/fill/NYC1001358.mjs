import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 274 Water Street, South Street Seaport Historic District Extension.
// Built 1867: a red-brick Italianate-era walk-up with a stone plinth,
// a ground-floor shopfront with a street door, five upper storeys of
// paired windows between brick piers on stone string courses, and a
// solid stone cornice cap.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1001358";
const W = 7, H = 27, D = 25;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint and lidar record -------------------------------------------
const cmap = new Map();
const roofs = [];
for (const [x, z, gr, rf] of cells) {
  cmap.set(`${x},${z}`, { g: Math.round(gr), r: Math.round(rf) });
  roofs.push(Math.round(rf));
}
roofs.sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];

const inFp = (x, z) => cmap.has(`${x},${z}`);
const gAt = (x, z) => cmap.get(`${x},${z}`).g;

// Smooth lidar noise into one flat roof tier; keep genuine steps of more than 2 blocks.
function topAt(x, z) {
  const c = cmap.get(`${x},${z}`);
  const t = Math.abs(c.r - medRoof) <= 2 ? medRoof : c.r;
  return Math.min(24, Math.max(c.g + 10, t));
}

// Sparse lamps behind some panes, for dusk.
const lit = (x, y, z) => ((x * 5 + z * 3 + y * 7) % 5) === 0;

// Window bays: two blocks wide, separated by single-block brick piers.
// Along the face coordinate u, piers sit at u % 3 === 0.
const isBay = (u) => u % 3 !== 0;

// ---- exterior faces --------------------------------------------------------
const NORM = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
const ext = [];
for (const k of cmap.keys()) {
  const [x, z] = k.split(",").map(Number);
  for (const [dx, dz, face] of NORM) {
    if (!inFp(x + dx, z + dz)) {
      ext.push({ x, z, dx, dz, face, u: dz !== 0 ? x : z });
    }
  }
}

// Street face = the exterior face with the most cells.
const faceCount = {};
for (const e of ext) faceCount[e.face] = (faceCount[e.face] || 0) + 1;
const streetFace = Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0];
const streetUs = ext.filter(e => e.face === streetFace).map(e => e.u).sort((a, b) => a - b);
const doorU = streetUs[Math.floor(streetUs.length / 2)];
const doorFacingOf = { north: "north", south: "south", west: "west", east: "east" };

// ---- 1. foundation, masonry body, flat roof surface -----------------------
for (const k of cmap.keys()) {
  const [x, z] = k.split(",").map(Number);
  const gr = gAt(x, z);
  const T = topAt(x, z);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  for (let y = gr; y < T - 1; y++) g.set(x, y, z, "bricks");
  g.set(x, T - 1, z, "smooth_stone");
}

// ---- 2. facade articulation on exterior faces -----------------------------
// Air (or a sparse glowstone) sits just inside each glass pane.
function behindGlass(e, y) {
  const ix = e.x - e.dx, iz = e.z - e.dz;
  if (!inFp(ix, iz)) return;
  g.set(ix, y, iz, lit(ix, y, iz) ? "glowstone" : "air");
}

let doorCell = null;
for (const e of ext) {
  if (e.face === streetFace && e.u === doorU) { doorCell = e; break; }
}

for (const e of ext) {
  const { x, z, u } = e;
  const gr = gAt(x, z);
  const T = topAt(x, z);
  const isDoor = doorCell && e === doorCell;

  // Plinth course.
  g.set(x, gr, z, "stone_bricks");

  // Ground floor shopfront (rows gr+1, gr+2).
  if (isDoor) {
    g.set(x, gr + 1, z, "dark_oak_door", {
      facing: doorFacingOf[e.face], half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, gr + 2, z, "dark_oak_door", {
      facing: doorFacingOf[e.face], half: "upper", hinge: "left", open: "false", powered: "false",
    });
    const ix = x - e.dx, iz = z - e.dz;
    if (inFp(ix, iz)) {
      g.set(ix, gr + 1, iz, "air");
      g.set(ix, gr + 2, iz, "air");
    }
  } else if (isBay(u)) {
    g.set(x, gr + 1, z, "glass");
    g.set(x, gr + 2, z, "glass");
    behindGlass(e, gr + 1);
    behindGlass(e, gr + 2);
  } else {
    g.set(x, gr + 1, z, "dark_oak_log");
    g.set(x, gr + 2, z, "dark_oak_log");
  }

  // Upper walk-up storeys: 2-block bays. Floor string course at b, window at b+1.
  let b = gr + 3;
  while (b + 2 <= T - 2) {
    g.set(x, b, z, "smooth_stone");
    if (isBay(u)) {
      g.set(x, b + 1, z, "glass");
      behindGlass(e, b + 1);
    } else {
      g.set(x, b + 1, z, "bricks");
    }
    b += 2;
  }

  // Solid stone cornice: two courses plus a projecting cap.
  g.set(x, T - 2, z, "stone_bricks");
  g.set(x, T - 1, z, "stone_bricks");
  g.set(x, T, z, "stone_bricks");
}

// ---- 3. door surround: stone flanks on the street face ---------------------
if (doorCell) {
  const { x, z, dx, dz } = doorCell;
  const gr = gAt(x, z);
  // Neighbours along the facade (u +/- 1) become stone pilasters up to the string course.
  const alongs = dz !== 0 ? [[1, 0], [-1, 0]] : [[0, 1], [0, -1]];
  for (const [ax, az] of alongs) {
    const px = x + ax, pz = z + az;
    if (!inFp(px, pz)) continue;
    // Only if that cell is also on the same exterior face.
    if (inFp(px + dx, pz + dz)) continue;
    const pg = gAt(px, pz);
    g.set(px, pg, pz, "stone_bricks");
    g.set(px, gr + 1, pz, "stone_bricks");
    g.set(px, gr + 2, pz, "stone_bricks");
  }
}

// ---- 4. roof: one chimney stack on an interior cell -----------------------
let chim = null;
for (const k of cmap.keys()) {
  const [x, z] = k.split(",").map(Number);
  const interior = NORM.every(([dx, dz]) => inFp(x + dx, z + dz));
  if (interior) { chim = { x, z, T: topAt(x, z) }; break; }
}
if (chim && chim.T + 1 <= 26) {
  g.set(chim.x, chim.T, chim.z, "bricks");
  g.set(chim.x, chim.T + 1, chim.z, "stone_bricks");
}

g.save(`${DIR}/${ID}.nbt`);
