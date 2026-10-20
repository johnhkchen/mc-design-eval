import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE99-0163-4F";
const W = 21, H = 33, D = 28;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const fp = new Map();
for (const [x, z, gr] of cells) fp.set(`${x},${z}`, gr);
const has = (x, z) => fp.has(`${x},${z}`);

function put(x, y, z, b, p) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

const NORMALS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const sidesOf = (x, z) => NORMALS.filter(([dx, dz]) => !has(x + dx, z + dz));
const sameN = (a, b) => a[0] === b[0] && a[1] === b[1];
const along = (x, z, n) => (n[0] !== 0 ? z : x);

// Entrance / garage face: prefer north (z-min)
const faceCells = (n) => cells.filter(([x, z]) => {
  const s = sidesOf(x, z);
  return s.length === 1 && sameN(s[0], n);
});
let GN = [0, -1];
if (faceCells(GN).length === 0) {
  const any = cells.find(([x, z]) => sidesOf(x, z).length === 1);
  if (any) GN = sidesOf(any[0], any[1])[0];
}
const gf = faceCells(GN);
const gAlong = gf.map(([x, z]) => along(x, z, GN));
const aMin = Math.min(...gAlong), aMax = Math.max(...gAlong);
const aMid = (aMin + aMax) / 2;
const garageHalf = 3;
const inGarage = (a) => Math.abs(a - aMid) <= garageHalf;

// Entrance door sits just outside the garage bay, with stone jambs either side
let doorA = null;
if (aMax - 1 > aMid + garageHalf + 1) doorA = aMax - 1;
else if (aMin + 1 < aMid - garageHalf - 1) doorA = aMin + 1;
const isJamb = (a) => doorA !== null && Math.abs(a - doorA) === 1;

const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
const cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;

for (const [x, z, gr] of cells) {
  // foundation
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const s = sidesOf(x, z);
  const perimeter = s.length > 0;

  // storey slabs and roof
  for (let k = 0; k <= 3; k++) {
    put(x, gr + 5 * k, z, k === 0 && perimeter ? "stone_bricks" : "light_gray_concrete");
  }
  put(x, gr + 20, z, perimeter ? "light_gray_concrete" : "gray_concrete");
  if (perimeter) put(x, gr + 21, z, "light_gray_concrete");

  if (!perimeter) continue; // interior: air between slabs

  if (s.length >= 2) {
    // corner pillar: solid, with a stone cap for a crisp corner
    for (let y = gr + 1; y <= gr + 20; y++) put(x, y, z, "white_concrete");
    put(x, gr + 21, z, "stone_bricks");
    continue;
  }

  const n = s[0];
  const a = along(x, z, n);
  const onGarageFace = sameN(n, GN);
  const isG = onGarageFace && inGarage(a);
  const isDoor = onGarageFace && doorA !== null && a === doorA;
  const isJ = onGarageFace && isJamb(a);

  for (let k = 0; k <= 3; k++) {
    const base = gr + 5 * k;
    for (let r = 1; r <= 3; r++) {
      const y = base + r;
      if (k === 0 && isG) {
        // rolling shutter lattice over the garage bays
        put(x, y, z, "iron_bars", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
        continue;
      }
      if (k === 0 && isDoor) {
        if (r === 1) put(x, y, z, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (r === 2) put(x, y, z, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        else put(x, y, z, "lantern_placeholder_glass", {}); // replaced below
        continue;
      }
      if (k === 0 && isJ) {
        // stone jambs framing the entrance
        put(x, y, z, "stone_bricks");
        continue;
      }
      if (a % 3 === 0) {
        put(x, y, z, "light_gray_concrete"); // mullion / frame
      } else if (k > 0 && r === 2 && (a + k) % 9 === 4 && (k === 1 || k === 3)) {
        put(x, y, z, "glowstone"); // warm light behind glass
      } else {
        put(x, y, z, "light_blue_stained_glass");
      }
    }
    // lintel band
    put(x, base + 4, z, "white_concrete");
  }

  // warm entrance lamp above the door transom
  if (isDoor) {
    put(x, gr + 3, z, "light_blue_stained_glass");
  }
}

// Entrance canopy-style lintel: a dark stone band over the door opening
for (const [x, z, gr] of cells) {
  const s = sidesOf(x, z);
  if (s.length !== 1) continue;
  const n = s[0];
  if (!sameN(n, GN)) continue;
  if (doorA === null || along(x, z, n) !== doorA) continue;
  put(x, gr + 4, z, "stone_brick_slab_placeholder", {});
}

// Roof equipment: housing, water tank, antenna
const roofCells = cells.filter(([x, z]) => sidesOf(x, z).length === 0);
for (const [x, z, gr] of cells) {
  if (sidesOf(x, z).length !== 0) continue;
  if (Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 2) {
    put(x, gr + 21, z, "light_gray_concrete");
    put(x, gr + 22, z, "light_gray_concrete");
  }
  const tx = Math.round(cx + 5), tz = Math.round(cz - 5);
  if ((x - tx) ** 2 + (z - tz) ** 2 <= 2) {
    for (let y = gr + 21; y <= gr + 23; y++) put(x, y, z, "iron_block");
  }
}

let best = null, bestD = Infinity;
for (const [x, z, gr] of roofCells) {
  const d = (x - cx) ** 2 + (z - cz) ** 2;
  if (d < bestD) { bestD = d; best = [x, z, gr]; }
}
if (best) {
  const [rx, rz, rg] = best;
  for (let y = rg + 23; y <= rg + 27; y++) {
    put(rx, y, rz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
