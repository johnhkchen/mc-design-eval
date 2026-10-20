import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538752125";
const W = 15, H = 23, D = 19;

// ---- footprint -----------------------------------------------------------
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, g] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.round(g));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const cells = [...ground.keys()].map((k) => k.split(",").map(Number));

const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const maxZ = Math.max(...cells.map((c) => c[1]));
const minG = Math.min(...cells.map((c) => gAt(c[0], c[1])));

// Floor datum = lowest ground; roof (cornice top) lands 11 blocks above it.
const B = minG;
const ROOF = B + 10;          // top course y (height 11 blocks: B..B+10)
const EQUIP = B + 11;         // rooftop plant

// ---- helpers -------------------------------------------------------------
const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const OUT = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

const facesOf = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
};
const isPerim = (x, z) => facesOf(x, z).length > 0;

// position along the face, and the face's extent (for pillar rhythm)
const along = (x, z, face) => (face === "N" || face === "S" ? x - minX : z - minZ);
const extent = (face) => (face === "N" || face === "S" ? maxX - minX : maxZ - minZ);
const isPillarOn = (x, z, face) => {
  const a = along(x, z, face);
  return a % 3 === 0 || a === extent(face);
};

// ---- entrance: middle of the north (street) face ---------------------------
const frontCells = cells
  .filter(([x, z]) => !has(x, z - 1))
  .sort((a, b) => a[0] - b[0]);
const [doorX, doorZ] = frontCells[Math.floor(frontCells.length / 2)];

// ---- interior lights behind some windows (warm glow at dusk) ---------------
const glowUpper = new Set();
const glowGround = new Set();
for (const [x, z] of cells) {
  if (!isPerim(x, z)) continue;
  for (const face of facesOf(x, z)) {
    if (isPillarOn(x, z, face)) continue;
    const [dx, dz] = OUT[face];
    const ix = x - dx, iz = z - dz;
    if (!has(ix, iz) || isPerim(ix, iz)) continue;
    const a = along(x, z, face);
    if (a % 2 === 0) glowUpper.add(`${ix},${iz}`);
    if (a % 4 === 1 && !(face === "N" && x === doorX)) glowGround.add(`${ix},${iz}`);
  }
}

// ---- rooftop plant: two short AC/plant blocks near the middle of the roof --
const interior = cells.filter(([x, z]) => !isPerim(x, z));
const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
const nearest = (tx, tz, exclude = []) =>
  interior
    .filter((c) => !exclude.some((e) => e[0] === c[0] && e[1] === c[1]))
    .sort((a, b) => Math.hypot(a[0] - tx, a[1] - tz) - Math.hypot(b[0] - tx, b[1] - tz))[0];
const plantA = nearest(cx - 3, cz + 2);
const plantB = nearest(cx + 3, cz - 3, plantA ? [plantA] : []);
const plantCells = new Set();
for (const p of [plantA, plantB]) {
  if (!p) continue;
  plantCells.add(`${p[0]},${p[1]}`);
  // second block of each unit, along x, if it is also interior
  if (has(p[0] + 1, p[1]) && !isPerim(p[0] + 1, p[1])) plantCells.add(`${p[0] + 1},${p[1]}`);
}

// ---- facade material by level ----------------------------------------------
function perimBlock(x, y, z) {
  const faces = facesOf(x, z);
  const onN = faces.includes("N");
  const pillar = faces.some((f) => isPillarOn(x, z, f));
  const isDoorCell = onN && x === doorX && z === doorZ;

  if (y === B) return ["stone_bricks"];                                  // base course
  if (y >= B + 1 && y <= B + 3) {                                         // shopfront
    if (isDoorCell) {
      if (y === B + 1) return ["dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }];
      if (y === B + 2) return ["dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }];
      return ["light_blue_stained_glass"];                                 // transom
    }
    return pillar ? ["light_gray_concrete"] : ["light_blue_stained_glass"];
  }
  if (y === B + 4) return [onN ? "red_concrete" : "smooth_stone"];       // fascia / sign band
  if (y === B + 5) return ["smooth_stone"];                               // storey line
  if (y >= B + 6 && y <= B + 8) return [pillar ? "light_gray_concrete" : "light_blue_stained_glass"];
  if (y === B + 9) return [pillar ? "light_gray_concrete" : "white_terracotta"];
  if (y === ROOF) return ["stone_bricks"];                                // cornice
  return null;
}

// ---- foundation: solid from y 0 up to each cell's own ground ---------------
for (const [x, z] of cells) {
  const gr = gAt(x, z);
  for (let y = 0; y < gr && y < H; y++) put(x, y, z, "stone_bricks");
}

// ---- building body -----------------------------------------------------------
for (const [x, z] of cells) {
  const gr = gAt(x, z);
  const perim = isPerim(x, z);
  const key = `${x},${z}`;
  for (let y = Math.max(B, gr); y <= ROOF; y++) {
    if (perim) {
      const b = perimBlock(x, y, z);
      if (!b) continue;
      put(x, y, z, b[0], b[1]);
    } else {
      // interior: floor slabs and roof deck only, air in between
      if (y === B || y === B + 5 || y === ROOF) {
        put(x, y, z, "smooth_stone");
      } else if (y === B + 7 && glowUpper.has(key)) {
        put(x, y, z, "glowstone");
      } else if (y === B + 2 && glowGround.has(key)) {
        put(x, y, z, "glowstone");
      }
    }
  }
  // rooftop plant sits on the roof deck
  if (plantCells.has(key) && EQUIP < H && gr <= ROOF) {
    put(x, EQUIP, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
