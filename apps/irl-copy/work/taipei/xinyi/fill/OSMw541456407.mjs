import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw541456407";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// Footprint 18 x 13, 23 blocks tall. Two storeys of about 5 blocks, parapet at y 11.
const W = 18, H = 23, D = 13;
const CORNICE = 10;   // top of walls, roof deck level
const PARAPET = 11;   // top of parapet, roof reads ~11 above lowest ground

const inFp = new Set();
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const k = `${x},${z}`;
  inFp.add(k);
  ground.set(k, Math.min(9, Math.max(0, Math.round(gr))));
}
const has = (x, z) => inFp.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`) ?? 0;

const isPerim = (x, z) => has(x, z) && (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1));
const onZFace = (x, z) => !has(x, z - 1) || !has(x, z + 1);
const onXFace = (x, z) => !has(x - 1, z) || !has(x + 1, z);

// Bay logic: piers at every third column of a face, at corners and at the far end.
function faceInfo(x, z) {
  const zf = onZFace(x, z), xf = onXFace(x, z);
  const corner = zf && xf;
  let u, len;
  if (zf) { u = x; len = W; } else { u = z; len = D; }
  const pier = corner || u % 3 === 0 || u === len - 1;
  return { zf, xf, corner, u, pier };
}

const g = new Voxels([W, H, D]);

function perimBlock(x, z, y, gg, pier) {
  if (y === gg + 1) return ["stone_bricks"];        // plinth course
  if (y === CORNICE) return ["smooth_stone"];       // cornice
  if (y === PARAPET) return ["white_concrete"];     // parapet
  if (y === 4) return ["red_terracotta"];           // ground-floor canopy fascia
  if (y === 5) return ["smooth_stone"];             // storey line
  if (y === 9) return ["white_concrete"];           // upper lintel band
  const upperWin = y >= 6 && y <= 8;
  const groundWin = y >= gg + 2 && y <= 3;
  if ((upperWin || groundWin) && !pier) return ["glass_pane"];
  return ["white_concrete"];
}

// Pass 1: foundations, walls, interior slabs
for (const k of inFp) {
  const [x, z] = k.split(",").map(Number);
  const gg = G(x, z);
  for (let y = 0; y <= gg; y++) g.set(x, y, z, "stone_bricks");

  if (isPerim(x, z)) {
    const { pier } = faceInfo(x, z);
    for (let y = gg + 1; y <= PARAPET; y++) {
      let b;
      const isDoor = x === 8 && z === 0 && gg === 0 && (y === 2 || y === 3);
      if (isDoor) {
        const half = y === 2 ? "lower" : "upper";
        g.set(x, y, z, "oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
        continue;
      }
      b = perimBlock(x, z, y, gg, pier);
      if (b[1]) g.set(x, y, z, b[0], b[1]);
      else g.set(x, y, z, b[0]);
    }
  } else {
    if (5 > gg) g.set(x, 5, z, "smooth_stone");          // interior floor slab
    if (CORNICE > gg) g.set(x, CORNICE, z, "gray_concrete"); // interior roof deck
  }
}

// Pass 2: warm lights behind some windows (interior air cells)
for (const k of inFp) {
  const [x, z] = k.split(",").map(Number);
  if (!isPerim(x, z)) continue;
  const gg = G(x, z);
  const { zf, pier, u } = faceInfo(x, z);
  if (pier) continue;
  let dx = 0, dz = 0;
  if (zf) dz = has(x, z + 1) ? 1 : -1;
  else dx = has(x + 1, z) ? 1 : -1;
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz)) continue;
  if (u % 6 === 1) g.set(ix, 7, iz, "shroomlight");
  if (u % 6 === 4 && gg + 2 <= 2) g.set(ix, 2, iz, "glowstone");
}

// Pass 3: roof equipment standing on the roof deck at y 10
// Stair-house, 4 x 4 box with a cap.
for (let x = 10; x <= 13; x++) for (let z = 4; z <= 7; z++) {
  if (!has(x, z)) continue;
  const edge = x === 10 || x === 13 || z === 4 || z === 7;
  for (let y = 11; y <= 13; y++) {
    if (edge) g.set(x, y, z, "white_concrete");
  }
  g.set(x, 14, z, "smooth_stone");
}

// Water tank, 3 x 3 round-ish drum with iron cap.
for (let x = 3; x <= 5; x++) for (let z = 8; z <= 10; z++) {
  if (!has(x, z)) continue;
  const corner = (x === 3 || x === 5) && (z === 8 || z === 10);
  if (corner) continue;
  for (let y = 11; y <= 13; y++) g.set(x, y, z, "light_gray_concrete");
}
if (has(4, 9)) g.set(4, 14, 9, "iron_block");

g.save(`${dir}/${id}.nbt`);
