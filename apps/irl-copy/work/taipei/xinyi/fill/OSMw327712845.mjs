import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw327712845";
const W = 86, H = 23, D = 40;

// Two storeys of ~5 blocks under a flat parapet at y = 11 (lidar: roof ~11 above lowest ground).
const ROOF = 11;      // parapet top
const CORNICE = 10;   // roof slab / cornice line
const BELT = 5;       // storey line between floors
const GF_LO = 1, GF_HI = 4;   // ground-storey window rows (sill, head)
const UP_LO = 6, UP_HI = 9;   // upper-storey window rows (sill, head)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const inFp = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// Exterior face of a footprint cell (first open side), or null for interior cells.
const faceOf = (x, z) => {
  if (!inFp(x, z + 1)) return "S";
  if (!inFp(x, z - 1)) return "N";
  if (!inFp(x + 1, z)) return "E";
  if (!inFp(x - 1, z)) return "W";
  return null;
};

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Glass panes must connect along the wall they sit in.
const paneProps = (face) =>
  face === "N" || face === "S"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Main entrance: centre of the south (max-z) facade.
const southXs = cells
  .filter(([x, z]) => faceOf(x, z) === "S")
  .map(([x]) => x)
  .sort((a, b) => a - b);
const cx = southXs.length ? southXs[southXs.length >> 1] : -1;
const entCell = cells.find(([x, z]) => x === cx && faceOf(x, z) === "S");
const ge = entCell ? Math.round(entCell[2]) : 0;
const ENT_HALF = 3;   // entrance bay spans cx-3 .. cx+3

for (const [x, z] of cells) {
  const gr = gAt(x, z);
  const face = faceOf(x, z);

  // Foundation up to the local ground, then the base course / floor at ground level.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, face ? "stone_bricks" : "smooth_stone");

  if (!face) {
    // Interior: floor slab at the storey line and the roof slab, both on columns.
    if (BELT > gr) put(x, BELT, z, "smooth_stone");
    if (CORNICE > gr) put(x, CORNICE, z, "light_gray_concrete");
    continue;
  }

  // Exterior wall column from above ground to the parapet.
  const t = face === "N" || face === "S" ? x : z;
  const dx = x - cx;
  const inEntrance = face === "S" && cx >= 0 && Math.abs(dx) <= ENT_HALF;

  for (let y = gr + 1; y <= ROOF; y++) {
    if (y === ROOF) {
      put(x, y, z, inEntrance ? "blue_concrete" : "smooth_quartz");
      continue;
    }
    if (y === CORNICE) {
      put(x, y, z, "smooth_quartz");
      continue;
    }
    if (y === BELT) {
      // Blue storey line across the entrance bay, quartz elsewhere.
      put(x, y, z, inEntrance ? "blue_concrete" : "smooth_quartz");
      continue;
    }

    // Entrance bay: doors, glazing, blue lintel band; quartz surround at the edges.
    if (inEntrance && y <= GF_HI && y >= ge + 1) {
      if (y <= ge + 2) {
        if (dx === 0) {
          const half = y === ge + 1 ? "lower" : "upper";
          if (ge + 2 <= GF_HI) {
            put(x, y, z, "iron_door", {
              facing: "south", half, hinge: "left", open: "false", powered: "false",
            });
          } else {
            put(x, y, z, "smooth_quartz");
          }
        } else if (Math.abs(dx) <= 2) {
          put(x, y, z, "light_blue_stained_glass_pane", paneProps("S"));
        } else {
          put(x, y, z, "smooth_quartz");
        }
      } else {
        put(x, y, z, Math.abs(dx) === ENT_HALF ? "smooth_quartz" : "blue_concrete");
      }
      continue;
    }

    // Regular facade band.
    let lo, hi;
    if (y >= GF_LO && y <= GF_HI) { lo = GF_LO; hi = GF_HI; }
    else if (y >= UP_LO && y <= UP_HI) { lo = UP_LO; hi = UP_HI; }
    else { put(x, y, z, "white_terracotta"); continue; }

    const m = t % 4;
    if (m === 0) {
      put(x, y, z, "smooth_quartz");                       // pier / mullion
    } else if (m === 3) {
      put(x, y, z, "white_terracotta");                    // solid wall between bays
    } else {
      // Window bay (m = 1, 2): frame at sill and head, glass between.
      if (y === lo || y === hi) {
        put(x, y, z, "smooth_quartz");
      } else {
        const lit = (Math.floor(t / 4) * 3 + y * 7) % 9 === 0;
        if (lit && y !== lo) {
          put(x, y, z, "glowstone");
        } else {
          put(x, y, z, "light_blue_stained_glass_pane", paneProps(face));
        }
      }
    }
  }
}

// Interior columns on a 6-block grid carry the storey slab and roof slab.
for (const [x, z] of cells) {
  if (faceOf(x, z) !== null) continue;
  if (x % 6 !== 3 || z % 6 !== 3) continue;
  const gr = gAt(x, z);
  for (let y = gr + 1; y < CORNICE; y++) put(x, y, z, "smooth_quartz");
}

// Roof plant: small AC housings resting on the interior roof slab.
const unitXs = [6, 20, 34, 48, 62, 74];
const unitZs = [8, 24];
for (const bx of unitXs) {
  for (const bz of unitZs) {
    let ok = true;
    for (let x = bx; x < bx + 6 && ok; x++) {
      for (let z = bz; z < bz + 4 && ok; z++) {
        if (!inFp(x, z) || faceOf(x, z) !== null || gAt(x, z) >= CORNICE) ok = false;
      }
    }
    if (!ok) continue;
    for (let x = bx; x < bx + 6; x++) {
      for (let z = bz; z < bz + 4; z++) {
        put(x, ROOF, z, "light_gray_concrete");
        put(x, ROOF + 1, z, "iron_block");
      }
    }
  }
}

// Flagpole on the roof, behind the entrance.
if (cx >= 0) {
  for (let dz = 3; dz <= 8; dz++) {
    const zz = (entCell ? entCell[1] : D - 1) - dz;
    if (inFp(cx, zz) && faceOf(cx, zz) === null && gAt(cx, zz) < CORNICE) {
      for (let y = ROOF; y <= ROOF + 4; y++) {
        put(cx, y, zz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
      }
      break;
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
