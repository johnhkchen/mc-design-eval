import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const raw = JSON.parse(readFileSync(`${DIR}/NYC3413890.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? raw.footprint ?? []);

const W = 14, H = 32, D = 22;
const g = new Voxels([W, H, D]);

// ---- raw footprint ----
const raws = new Map();
for (const c of list) {
  const [x, z, gr, rf] = Array.isArray(c) ? c : [c.x, c.z, c.ground, c.roof];
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  raws.set(`${x},${z}`, { x, z, gr: Number(gr), rf: Number(rf) });
}
const has = (x, z) => raws.has(`${x},${z}`);

// ---- 3x3 median smoothing of lidar heights (removes single-cell spikes) ----
const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const cell = new Map();
for (const [key, c] of raws) {
  const gs = [], rs = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = raws.get(`${c.x + dx},${c.z + dz}`);
    if (n) { gs.push(n.gr); rs.push(n.rf); }
  }
  const ground = Math.max(0, Math.min(H - 6, Math.round(median(gs))));
  // round the roof to a clean tier (even numbers read as floors at 2 blocks/storey)
  let roof = Math.round(median(rs) / 2) * 2;
  roof = Math.max(ground + 4, Math.min(H - 5, roof));
  cell.set(key, { ground, roof });
}

// ---- massing: a single tower tier plus a lower wing on the north-east corner ----
// Cells whose smoothed roof is within 1 block of the mode form the main tier;
// the rest step down to a 4-block setback so the top reads as a stepped crown.
const roofVals = [...cell.values()].map((v) => v.roof);
const mode = roofVals.sort((a, b) => a - b)[Math.floor(roofVals.length / 2)];
for (const [, v] of cell) {
  if (v.roof > mode + 2) v.roof = mode + 2;
  if (v.roof < mode - 2) v.roof = mode - 2;
}

// ---- build ----
for (const [key, { ground, roof }] of cell) {
  const [x, z] = key.split(",").map(Number);

  const fN = !has(x, z - 1), fS = !has(x, z + 1);
  const fW = !has(x - 1, z), fE = !has(x + 1, z);
  const faceCount = [fN, fS, fW, fE].filter(Boolean).length;
  const perim = faceCount > 0;
  const corner = faceCount >= 2;
  const face = fN ? "n" : fS ? "s" : fW ? "w" : fE ? "e" : null;
  const t = (face === "n" || face === "s") ? x : z;

  let dx = 0, dz = 0;
  if (face === "n") dz = 1;
  else if (face === "s") dz = -1;
  else if (face === "w") dx = 1;
  else if (face === "e") dx = -1;

  const isFront = face === "n";
  const doorCell = isFront && (t === 6 || t === 7);
  const doorHinge = t === 6 ? "left" : "right";
  const entranceBay = isFront && t >= 5 && t <= 8;

  for (let y = 0; y < roof; y++) {
    // foundation
    if (y < ground) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }
    const local = y - ground;

    // roof cap / cornice
    if (y === roof - 1) {
      g.set(x, y, z, perim ? "smooth_stone" : "stone_bricks");
      continue;
    }

    if (!perim) {
      // interior: floor slabs only, air between them
      if (local % 2 === 0) g.set(x, y, z, "stone_bricks");
      continue;
    }

    // perimeter shell
    if (corner) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    // entrance: recessed frame, doors, dark lintel
    if (entranceBay && local <= 2) {
      if (local === 2) {
        g.set(x, y, z, "black_concrete"); // canopy / lintel
      } else if (doorCell) {
        g.set(x, y, z, "oak_door", {
          facing: "north",
          half: local === 0 ? "lower" : "upper",
          hinge: doorHinge,
          open: "false",
          powered: "false",
        });
      } else {
        // frame posts at t=5 and t=8, glazed storefront
        g.set(x, y, z, (t === 5 || t === 8) ? "polished_andesite" : "glass_pane");
      }
      continue;
    }

    if (local === 0) {
      g.set(x, y, z, "stone_bricks"); // base course
      continue;
    }

    if (local % 2 === 0) {
      g.set(x, y, z, "smooth_stone"); // storey line / spandrel course
      continue;
    }

    // window rows: piers every fourth bay
    if (t % 4 === 0) {
      g.set(x, y, z, "stone_bricks");
    } else {
      g.set(x, y, z, "glass_pane");
      // warm light behind some glass, in the air gap
      if (!corner && (t % 8 === 2) && local === 3 && (dx || dz)) {
        const ix = x + dx, iz = z + dz;
        if (ix >= 0 && ix < W && iz >= 0 && iz < D) {
          g.set(ix, y, iz, "glowstone");
        }
      }
    }
  }

  // mechanical penthouse on the central roof
  if (!perim && x >= 4 && x <= 9 && z >= 7 && z <= 14 && roof + 2 <= H - 1) {
    g.set(x, roof, z, "light_gray_concrete");
    g.set(x, roof + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/NYC3413890.nbt`);
