import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC1001378.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC1001378.nbt";
const W = 7, H = 26, D = 16;

// ---- read footprint -------------------------------------------------------
const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const cells = new Map(); // "x,z" -> { x, z, gy, top }
for (const row of raw) {
  const x = Math.round(row[0]), z = Math.round(row[1]);
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gy = Math.max(0, Math.round(row[2]));
  const roof = Math.round(row[3]);
  cells.set(x + "," + z, { x, z, gy, roof });
}

// Two flat roof tiers: the main block at lowest ground + 14, lower wings at +10.
const minG = Math.min(...[...cells.values()].map(c => c.gy));
for (const c of cells.values()) {
  const rel = c.roof - minG;
  c.top = rel >= 12 ? minG + 14 : minG + 10;
  c.top = Math.min(H - 1, Math.max(c.top, c.gy + 10));
}

const has = (x, z) => cells.has(x + "," + z);

// Street door: the west-face cell nearest the facade middle.
let doorZ = -1;
for (let z = 0; z < D; z++) {
  if (has(0, z) && (doorZ < 0 || Math.abs(z - 8) < Math.abs(doorZ - 8))) doorZ = z;
}

// ---- voxel helpers --------------------------------------------------------
const g = new Voxels([W, H, D]);
function put(x, y, z, id, p) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
}

function faceOf(x, z) {
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  if (!has(x, z - 1)) return "N";
  return "S";
}

const glassProps = (face) => {
  const ew = face === "W" || face === "E";
  return {
    north: ew ? "true" : "false",
    south: ew ? "true" : "false",
    east: ew ? "false" : "true",
    west: ew ? "false" : "true",
    waterlogged: "false",
  };
};

const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// ---- build ----------------------------------------------------------------
for (const c of cells.values()) {
  const { x, z, gy, top } = c;

  // foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  if (isPerim(x, z)) {
    const face = faceOf(x, z);
    const ew = face === "W" || face === "E";
    const a = ew ? z : x;
    const len = ew ? D : W;
    const corner = a === 0 || a === len - 1;
    const bayCol = !corner && a % 2 === 1;

    const inward = { W: [x + 1, z], E: [x - 1, z], N: [x, z + 1], S: [x, z - 1] }[face];
    const innerIsInterior = has(inward[0], inward[1]) && !isPerim(inward[0], inward[1]);

    for (let y = gy; y < top; y++) {
      const k = y - gy;
      let id = "bricks", p;

      if (y === top - 1) {
        id = "stone_bricks";                 // parapet cap
      } else if (y === top - 2) {
        id = "smooth_stone";                 // cornice band
      } else if (k === 0) {
        id = "stone_bricks";                 // base course
      } else if (k % 3 === 0) {
        id = "smooth_stone";                 // storey string courses at k = 3, 6, 9
      } else if (k < 3) {
        // ground-floor shopfront
        if (face === "W" && a === doorZ) {
          id = "oak_door";
          p = {
            facing: "west",
            half: k === 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          };
        } else if (bayCol) {
          id = "glass_pane";
          p = glassProps(face);
        } else {
          id = "stone_bricks";               // pilasters
        }
      } else {
        // upper storeys: window grid in brick
        if (bayCol) {
          id = "glass_pane";
          p = glassProps(face);
        } else {
          id = "bricks";
        }
      }

      put(x, y, z, id, p);

      // warm light behind some upper-floor windows
      if (id === "glass_pane" && k % 3 === 2 && k >= 3 && innerIsInterior) {
        if (((a * 5 + k) % 4) === 0) put(inward[0], y, inward[1], "glowstone");
      }
    }
  } else {
    // interior cell: floor slabs per storey, roof deck, otherwise air
    for (let y = gy; y < top; y++) {
      const k = y - gy;
      if (y === top - 2) put(x, y, z, "stone");
      else if (k > 0 && k % 3 === 0 && y < top - 2) put(x, y, z, "oak_planks");
    }
  }
}

g.save(OUT);
