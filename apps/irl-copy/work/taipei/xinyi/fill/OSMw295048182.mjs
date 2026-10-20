import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 聯合報系第四大樓, Xinyi, Taipei. Late-1990s/2000s Taipei office tower:
// granite plinth, shopfront ground floor, grey-framed light-blue glass curtain wall
// with white spandrels, a cornice and parapet, and a setback upper tier with a
// rooftop mechanical block.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw295048182";
const W = 26, H = 90, D = 50;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const groundOf = new Map();
for (const [x, z, gr] of cells) groundOf.set(key(x, z), gr);

const xs = cells.map((c) => c[0]);
const zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const B = Math.min(...cells.map((c) => c[2]));   // lowest ground = storey datum
const mid = (minX + maxX) / 2;

const inFp = (x, z) => groundOf.has(key(x, z));
const INNER = { x0: minX + 3, x1: maxX - 3, z0: minZ + 3, z1: maxZ - 3 };
const MECH = { x0: INNER.x0 + 5, x1: INNER.x1 - 5, z0: INNER.z0 + 12, z1: INNER.z1 - 12 };
const inInner = (x, z) => x >= INNER.x0 && x <= INNER.x1 && z >= INNER.z0 && z <= INNER.z1;
const inMech = (x, z) => x >= MECH.x0 && x <= MECH.x1 && z >= MECH.z0 && z <= MECH.z1;

const TOP_LOW = 60;   // main body roof, relative to datum
const TOP_HIGH = 75;  // setback tier roof

const bodyAt = (x, z, rel) => inFp(x, z) && (rel <= TOP_LOW || inInner(x, z));
const topRel = (x, z) => (inInner(x, z) ? TOP_HIGH : TOP_LOW);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (x, z, rel) => DIRS.some(([dx, dz]) => !bodyAt(x + dx, z + dz, rel));
const faceU = (x, z, rel) =>
  (!bodyAt(x - 1, z, rel) || !bodyAt(x + 1, z, rel)) ? z : x;

// Five-bay lobby centred on the south face.
const entranceCell = (x, z) => z === maxZ && Math.abs(x - mid) <= 2;
const doorCell = (x, z) => z === maxZ && Math.abs(x - mid) <= 0.5;

function put(x, y, z, block, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

function facade(x, z, rel) {
  const u = faceU(x, z, rel);
  const ent = entranceCell(x, z);
  if (rel === 0) return { block: "polished_granite" };
  if (rel <= 3 && ent) {
    if (doorCell(x, z)) {
      const hinge = x < mid ? "left" : "right";
      if (rel === 1) return { block: "iron_door", props: { facing: "south", half: "lower", hinge, open: "false", powered: "false" } };
      if (rel === 2) return { block: "iron_door", props: { facing: "south", half: "upper", hinge, open: "false", powered: "false" } };
    }
    if (rel === 3) return { block: "black_concrete" };           // canopy soffit band
    return { block: x === Math.round(mid) - 2 || x === Math.round(mid) + 2 ? "gray_concrete" : "light_blue_stained_glass" };
  }
  if (rel === 4) return { block: "smooth_stone" };                 // shopfront lintel
  if (rel <= 3) {
    if (u % 3 === 0) return { block: "gray_concrete" };
    const lit = (u * 5 + rel * 3) % 19 === 0;                      // sparse warm shopfronts
    return { block: lit ? "glowstone" : "light_blue_stained_glass" };
  }
  if (rel % 5 === 0) return { block: "white_concrete" };          // floor spandrel line
  if (u % 3 === 0) return { block: "light_gray_concrete" };       // mullion
  const lit = (u * 7 + rel * 5) % 61 === 0;                       // rare lit office windows
  return { block: lit ? "shroomlight" : "light_blue_stained_glass" };
}

// 1. Body, foundations, roofs and parapets, column by column.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const T = B + topRel(x, z);
  for (let y = gr; y <= T; y++) {
    const rel = y - B;
    if (y === T) {
      put(x, y, z, exposed(x, z, rel) ? "smooth_stone" : "gray_concrete");
      continue;
    }
    if (exposed(x, z, rel)) {
      const f = facade(x, z, rel);
      put(x, y, z, f.block, f.props);
    } else if (rel > 0 && rel % 5 === 0) {
      put(x, y, z, "white_concrete");
    }
  }

  // Parapet on the outer ring and on the setback perimeter.
  const edgeRing = DIRS.some(([dx, dz]) => !inFp(x + dx, z + dz));
  const wantParapet = inInner(x, z) ? exposed(x, z, T + 1 - B) : edgeRing;
  if (wantParapet) {
    for (let k = 1; k <= 2; k++) put(x, T + k, z, "white_concrete");
  }
}

// 2. Rooftop mechanical block on the setback roof.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (!inMech(x, z) || !inInner(x, z)) continue;
  const T = B + TOP_HIGH;
  for (let k = 1; k <= 4; k++) {
    put(x, T + k, z, k === 4 ? "light_gray_concrete" : "gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
