import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC80701";
const W = 24, H = 35, D = 41;

// Mid-century/1980s glass-and-precast office block on K Street: calcite base,
// tinted glass bands with white-concrete mullions, light-grey spandrels,
// calcite cornice and parapet, stepped roof tiers with mechanical boxes.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const STOREY = 2;
const BASE_ROWS = 4;

const raw = new Map();
for (const c of cells) {
  const x = c[0], z = c[1];
  const gnd = Math.max(0, Math.round(c[2]));
  raw.set(x + "," + z, { x, z, gnd, roofRaw: Math.round(c[3]) });
}

// Snap each cell's roof to a storey tier: cap row sits on a floor plate.
const map = new Map();
let minZ = Infinity, maxX = 0, maxRoof = 0;
for (const { x, z, gnd, roofRaw } of raw.values()) {
  const k = Math.max(1, Math.round((roofRaw - gnd - 1) / STOREY));
  const roof = Math.min(H - 4, gnd + 1 + STOREY * k);
  map.set(x + "," + z, { x, z, gnd, roof });
  if (z < minZ) minZ = z;
  if (x > maxX) maxX = x;
  if (roof > maxRoof) maxRoof = roof;
}

const get = (x, z) => map.get(x + "," + z);
// A side is exposed if the neighbour is missing, lower, or sits on lower ground:
// setback walls and the flanks of taller wings read as facade, not interior.
const isEdge = (x, z) => {
  const c = get(x, z);
  for (const [dx, dz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const n = get(x + dx, z + dz);
    if (!n) return true;
    if (n.roof < c.roof - 1) return true;
    if (n.gnd > c.gnd + 1) return true;
  }
  return false;
};
const hash = (x, y, z) => (((x * 73856093) ^ (y * 83492791) ^ (z * 19349663)) >>> 0) % 31;
const doorX = Math.floor(maxX / 2);

const GLASS = "light_blue_stained_glass";
const SPANDREL = "light_gray_concrete";
const FRAME = "white_concrete";
const CALCITE = "calcite";
const FOUND = "smooth_stone";

for (const { x, z, gnd, roof } of map.values()) {
  const edge = isEdge(x, z);

  for (let y = 0; y < gnd; y++) g.set(x, y, z, FOUND);
  if (!edge) g.set(x, gnd, z, FOUND);

  for (let y = gnd; y <= roof; y++) {
    const rel = y - gnd;

    if (y === roof) {
      if (edge) g.set(x, y, z, CALCITE);
      continue;
    }

    if (y === roof - 1) {
      g.set(x, y, z, edge ? CALCITE : SPANDREL);
      continue;
    }

    if (!edge) {
      if (rel > 0 && rel % STOREY === 0) g.set(x, y, z, SPANDREL);
      continue;
    }

    // ---- Facade ----
    const mullion = (x + z) % 3 === 0;

    if (rel === 0) {
      g.set(x, y, z, CALCITE);
      continue;
    }

    if (rel < BASE_ROWS) {
      const onStreet = z === minZ;
      if (onStreet && Math.abs(x - doorX) <= 2 && rel <= 2) {
        if (x === doorX) {
          g.set(x, y, z, "dark_oak_door", {
            facing: "south",
            half: rel === 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else {
          g.set(x, y, z, GLASS);
        }
        continue;
      }
      if (rel === BASE_ROWS - 1) { g.set(x, y, z, FRAME); continue; }
      g.set(x, y, z, mullion ? FRAME : GLASS);
      continue;
    }

    const isSpandrel = (rel - BASE_ROWS) % STOREY === 0;
    if (isSpandrel || mullion) {
      g.set(x, y, z, isSpandrel ? SPANDREL : FRAME);
    } else if (hash(x, y, z) === 0) {
      g.set(x, y, z, "glowstone");
    } else {
      g.set(x, y, z, GLASS);
    }
  }

  if (edge && z === minZ && Math.abs(x - doorX) <= 2) {
    g.set(x, gnd + 3, z, CALCITE);
  }
}

// Roof equipment on the top tier, interior cells only.
for (const { x, z, roof } of map.values()) {
  if (isEdge(x, z)) continue;
  if (roof !== maxRoof) continue;
  if (x % 5 === 2 && z % 5 === 2 && roof + 2 < H) {
    g.set(x, roof, z, SPANDREL);
    g.set(x, roof + 1, z, FRAME);
  }
}

g.save(`${DIR}/${ID}.nbt`);
