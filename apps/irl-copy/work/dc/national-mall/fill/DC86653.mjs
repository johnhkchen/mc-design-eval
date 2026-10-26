import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const raw = JSON.parse(readFileSync(`${DIR}/DC86653.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? []);

const W = 8, H = 29, D = 18;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ---- read footprint -------------------------------------------------------
const raw2 = new Map();
for (const c of list) {
  const [x, z, gr, roof] = Array.isArray(c) ? c : [c.x, c.z, c.ground, c.roof];
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  raw2.set(key(x, z), { gr: Number(gr) || 0, roof: Number(roof) || 0 });
}
const has = (x, z) => raw2.has(key(x, z));

// One main roof level (median of lidar roofs), with lower wings only where
// the lidar clearly drops by more than two blocks. Ground is kept per cell.
const roofVals = [...raw2.values()].map((v) => v.roof).sort((a, b) => a - b);
const R = clamp(Math.round(roofVals[Math.floor(roofVals.length / 2)]), 8, H - 6);

const info = new Map();
for (const [k, v] of raw2) {
  const rf = v.roof < R - 2 ? clamp(Math.round(v.roof), 4, R) : R;
  info.set(k, {
    gd: clamp(Math.round(v.gr), 0, H - 1),
    rf,
  });
}

// Which exterior face(s) a perimeter cell sits on
function perimeter(x, z) {
  return !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
}
function faceOf(x, z) {
  if (!has(x, z - 1)) return { f: "N", a: x };
  if (!has(x, z + 1)) return { f: "S", a: x };
  if (!has(x - 1, z)) return { f: "W", a: z };
  return { f: "E", a: z };
}

const windows = new Set();

// ---- main massing ---------------------------------------------------------
for (const [k, o] of info) {
  const [x, z] = k.split(",").map(Number);
  const { gd, rf } = o;

  // foundation from y0 up to this cell's ground
  for (let y = 0; y < gd; y++) g.set(x, y, z, "stone_bricks");

  const perim = perimeter(x, z);

  for (let y = gd; y < rf; y++) {
    const rel = y - gd;
    const top = y === rf - 1;

    if (!perim) {
      if (top) g.set(x, y, z, "stone");                       // roof deck
      else if (rel === 0 || (rel >= 4 && (rel - 4) % 3 === 0)) g.set(x, y, z, "smooth_stone");
      continue;
    }

    if (top) { g.set(x, y, z, "smooth_quartz"); continue; }     // cornice / parapet
    if (rel === 0) { g.set(x, y, z, "polished_granite"); continue; } // base course

    const { f, a } = faceOf(x, z);
    const pier = a % 3 === 0;

    if (rel < 4) {
      // ground floor shopfront, entrance on the north (street) face
      const isDoor = f === "N" && z === 0 && (x === 3 || x === 4);
      if (isDoor && rel <= 2) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "north", half: rel === 1 ? "lower" : "upper",
          hinge: x === 3 ? "left" : "right", open: "false", powered: "false",
        });
      } else if (isDoor && rel === 3) {
        g.set(x, y, z, "glowstone");
      } else if (rel === 3) {
        g.set(x, y, z, "calcite");
      } else if (pier) {
        g.set(x, y, z, "smooth_quartz");
      } else {
        g.set(x, y, z, "light_blue_stained_glass");
        windows.add(`${x},${y},${z}`);
      }
      continue;
    }

    // upper storeys: 3-block module = spandrel + two rows of glass
    const j = (rel - 4) % 3;
    if (j === 0) g.set(x, y, z, "calcite");
    else if (pier) g.set(x, y, z, "smooth_quartz");
    else {
      g.set(x, y, z, "light_blue_stained_glass");
      windows.add(`${x},${y},${z}`);
    }
  }
}

// ---- warm light behind some windows ---------------------------------------
for (const wk of windows) {
  const [x, y, z] = wk.split(",").map(Number);
  if ((x * 5 + z * 3 + y * 7) % 9 !== 0) continue;
  let dx = 0, dz = 0;
  if (!has(x - 1, z)) dx = 1;
  else if (!has(x + 1, z)) dx = -1;
  if (!has(x, z - 1)) dz = 1;
  else if (!has(x, z + 1)) dz = -1;
  const xi = x + dx, zi = z + dz;
  if (!has(xi, zi) || perimeter(xi, zi)) continue;
  if (y <= info.get(key(xi, zi)).gd) continue;
  g.set(xi, y, zi, "glowstone");
}

// ---- setback penthouse on the main roof level -----------------------------
for (const [k, o] of info) {
  const [x, z] = k.split(",").map(Number);
  if (o.rf !== R) continue;
  if (x < 1 || x > 6 || z < 2 || z > 15) continue;
  const ring = x === 1 || x === 6 || z === 2 || z === 15;
  const a = x === 1 || x === 6 ? z : x;
  for (let y = o.rf; y <= o.rf + 2; y++) {
    const r2 = y - o.rf;
    if (r2 === 2) g.set(x, y, z, "smooth_quartz");            // cap
    else if (!ring) continue;                                 // interior air
    else if (r2 === 0) g.set(x, y, z, "calcite");
    else if (a % 3 === 0) g.set(x, y, z, "smooth_quartz");
    else g.set(x, y, z, "light_blue_stained_glass");
  }
}

g.save(`${DIR}/DC86653.nbt`);
