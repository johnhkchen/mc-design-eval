import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 惠安信義廣場 (Huian Xinyi Plaza): Taipei commercial block, c. 1990s.
// Stone-faced podium with shopfronts, a glazed setback tower, and a small
// lit penthouse crown with a mast. Roof slab at y 59 (about 59 blocks above
// the lowest ground); five-block storeys.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw668037872";
const W = 36, H = 71, D = 48;
const TOP = 59;      // tower roof slab
const PODIUM = 29;   // podium cap (terrace) level
const TOWER_INSET = 6;
const CROWN_INSET = 10;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const FOOT = cells.map(([x, z, gr]) => [
  x, z, Math.min(60, Math.max(0, Math.round(gr))),
]);

const k = (x, z) => `${x},${z}`;
const FOOT_SET = new Set(FOOT.map(([x, z]) => k(x, z)));

const xs = FOOT.map((c) => c[0]), zs = FOOT.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);

// Tower and crown footprints: footprint cells inside an inset box.
const T = new Set(), Q = new Set();
for (const [x, z] of FOOT) {
  if (x >= minX + TOWER_INSET && x <= maxX - TOWER_INSET &&
      z >= minZ + TOWER_INSET && z <= maxZ - TOWER_INSET) T.add(k(x, z));
  if (x >= minX + CROWN_INSET && x <= maxX - CROWN_INSET &&
      z >= minZ + CROWN_INSET && z <= maxZ - CROWN_INSET) Q.add(k(x, z));
}

// Outward sides of a cell: sides whose neighbour is not in set S.
function edgeDirs(x, z, S) {
  const out = [];
  if (!S.has(k(x, z - 1))) out.push("N");
  if (!S.has(k(x, z + 1))) out.push("S");
  if (!S.has(k(x - 1, z))) out.push("W");
  if (!S.has(k(x + 1, z))) out.push("E");
  return out;
}

const vox = new Voxels([W, H, D]);
function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
}

// Facade block for a perimeter cell on face N/S/E/W at height y.
// Returns [id, props?].
function facade(face, x, y, z, gr) {
  const horiz = face === "N" || face === "S";
  const along = horiz ? x : z;
  const cen = horiz ? (minX + maxX) / 2 : (minZ + maxZ) / 2;
  const dirName = { N: "north", S: "south", W: "west", E: "east" }[face];
  const pillar = along % 4 === 0;
  const m = y % 5;

  // Ground-floor shopfront with base course and entrance doors.
  if (y < 5 && y >= gr) {
    if (y < gr + 2 && Math.abs(along - cen) <= 0.5) {
      return ["dark_oak_door", {
        facing: dirName,
        half: y === gr ? "lower" : "upper",
        hinge: along < cen ? "left" : "right",
        open: "false",
        powered: "false",
      }];
    }
    if (y === gr) return ["polished_granite"];
    return pillar ? ["polished_granite"] : ["glass"];
  }

  if (m === 0) return ["light_gray_concrete"];   // storey line
  if (m === 4) return ["gray_concrete"];         // spandrel
  if (pillar) return ["white_concrete"];         // mullion
  if (m === 2 && (x * 3 + z * 5 + y) % 7 === 0) return ["glowstone"]; // lit office
  return ["light_blue_stained_glass"];
}

function placeFacade(face, x, y, z, gr) {
  const [id, props] = facade(face, x, y, z, gr);
  put(x, y, z, id, props);
}

// ---- Build ----
const cx = Math.floor((minX + maxX) / 2);
const cz = Math.floor((minZ + maxZ) / 2);

for (const [x, z, gr] of FOOT) {
  const key = k(x, z);
  const inT = T.has(key);

  // 1. Foundation: solid stone from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "polished_granite");

  // 2. Podium (y gr .. 28), cap at 29 across the whole footprint.
  if (gr <= PODIUM) {
    const eP = edgeDirs(x, z, FOOT_SET);
    for (let y = gr; y < PODIUM; y++) {
      if (eP.length) placeFacade(eP[0], x, y, z, gr);
      else if (y === gr || y % 5 === 0) put(x, y, z, "light_gray_concrete");
    }
    put(x, PODIUM, z, "light_gray_concrete");          // podium cap / terrace

    // Parapet on the podium's outer edge (ring cells only).
    if (!inT && eP.length) {
      put(x, 30, z, "light_gray_concrete");
      put(x, 31, z, "light_gray_concrete");
    }
  }

  // 3. Setback tower (y 30 .. 58), roof slab at 59.
  if (inT) {
    const eT = edgeDirs(x, z, T);
    for (let y = Math.max(gr, 30); y < TOP; y++) {
      if (eT.length) placeFacade(eT[0], x, y, z, gr);
      else if (y % 5 === 0) put(x, y, z, "light_gray_concrete");
    }
    put(x, TOP, z, "light_gray_concrete");

    // 4. Penthouse crown (y 60 .. 62), roof at 63.
    if (Q.has(key)) {
      const eQ = edgeDirs(x, z, Q);
      for (let y = 60; y < 63; y++) {
        if (eQ.length) placeFacade(eQ[0], x, y, z, 60);
        else if (y === 60) put(x, y, z, "light_gray_concrete");
      }
      put(x, 63, z, "light_gray_concrete");
    }
  }
}

// 5. Mast and warm beacon on the crown.
if (Q.has(k(cx, cz)) || FOOT_SET.has(k(cx, cz))) {
  for (let y = 64; y <= 68; y++) put(cx, y, cz, "iron_bars");
  put(cx, 69, cz, "lantern", { hanging: "false", waterlogged: "false" });
}

vox.save(`${DIR}/${ID}.nbt`);
