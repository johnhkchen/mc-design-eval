import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588109965";
const W = 25, H = 33, D = 52;

// ---- footprint -------------------------------------------------------------
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;
const ground = new Map();
for (const c of list) {
  const [x, z, gy] = Array.isArray(c) ? c : [c.x, c.z, c.ground];
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, Math.max(0, Math.round(gy)));
}
const inside = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const perimeter = (x, z) => inside(x, z) && (!inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1));
const missX = (x, z) => !inside(x - 1, z) || !inside(x + 1, z);
const missZ = (x, z) => !inside(x, z - 1) || !inside(x, z + 1);
const mullion = (x, z) => {
  const mx = missX(x, z), mz = missZ(x, z);
  if (mx && mz) return true;
  if (mx) return z % 3 === 0;
  if (mz) return x % 3 === 0;
  return false;
};

// ---- voxel target ----------------------------------------------------------
const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// ---- entrance: centre of the lowest-z street face -------------------------
let doorZ = Infinity;
const zFaceCells = [];
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (perimeter(x, z) && !inside(x, z - 1)) zFaceCells.push([x, z]);
}
for (const [, z] of zFaceCells) doorZ = Math.min(doorZ, z);
const xsOnFace = zFaceCells.filter(([, z]) => z === doorZ).map(([x]) => x);
const midX = xsOnFace.length ? (Math.min(...xsOnFace) + Math.max(...xsOnFace)) / 2 : W / 2;
const doorX = xsOnFace.length
  ? xsOnFace.reduce((best, x) => (Math.abs(x - midX) < Math.abs(best - midX) ? x : best), xsOnFace[0])
  : -1;

// ---- penthouse core (roof mechanical block, centred on the plan) ----------
const inPent = (x, z) => inside(x, z) && Math.abs(x - 12) <= 5 && Math.abs(z - Math.floor(D / 2)) <= 10;
const pentEdge = (x, z) => inPent(x, z) && (!inPent(x - 1, z) || !inPent(x + 1, z) || !inPent(x, z - 1) || !inPent(x, z + 1));

// ---- build -----------------------------------------------------------------
// Storeys are 5 blocks: r%5==0 band, 1..3 window zone, 4 spandrel.
// Ground storey: r0 stone base course, r1..3 shopfront, r4 lintel.
// Roof deck at r20, parapet r21..22, penthouse r21..24.
for (const [k, gy] of ground) {
  const [x, z] = k.split(",").map(Number);
  const per = perimeter(x, z);

  // foundation
  for (let y = 0; y < gy; y++) put(x, y, z, "stone");

  for (let r = 0; r <= 22; r++) {
    const y = gy + r;
    if (y >= H) break;
    const s = Math.floor(r / 5);

    if (r === 20) {
      put(x, y, z, "light_gray_concrete");          // roof deck / cornice
      continue;
    }
    if (r > 20) {
      if (per) {
        if (r === 21) put(x, y, z, "white_concrete");
        else put(x, y, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
      }
      continue;
    }

    if (per) {
      // door override (ground storey, two blocks tall)
      if (x === doorX && z === doorZ && (r === 1 || r === 2)) {
        put(x, y, z, "oak_door", {
          facing: "north",
          half: r === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (r % 5 === 0) {
        put(x, y, z, s === 0 ? "stone_bricks" : "light_gray_concrete");
      } else if (r % 5 === 4) {
        put(x, y, z, "white_concrete");
      } else {
        const frame = mullion(x, z);
        if (frame) put(x, y, z, "white_concrete");
        else if (s === 0) put(x, y, z, "glass");                 // shopfront
        else put(x, y, z, "light_blue_stained_glass");           // office glazing
      }
    } else {
      // interior: floor slabs only, air elsewhere (no interiors modelled)
      if (r % 5 === 0) put(x, y, z, r === 0 ? "smooth_stone" : "light_gray_concrete");
      // warm lights just behind the glazing
      const nearPer = perimeter(x - 1, z) || perimeter(x + 1, z) || perimeter(x, z - 1) || perimeter(x, z + 1);
      if (nearPer && r % 5 === 2 && (x + z + s) % 3 === 0) {
        put(x, y, z, s % 2 === 0 ? "glowstone" : "shroomlight");
      }
    }
  }
}

// penthouse: solid walls, glazed band, cap
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!inPent(x, z)) continue;
  const gy = gAt(x, z);
  const edge = pentEdge(x, z);
  if (edge) {
    put(x, gy + 21, z, "white_concrete");
    put(x, gy + 22, z, "light_blue_stained_glass");
    put(x, gy + 23, z, "white_concrete");
  }
  put(x, gy + 24, z, "light_gray_concrete");
}

// Note: penthouse interior and roof-top walls stand on the roof deck at r20.
g.save(`${DIR}/${ID}.nbt`);
