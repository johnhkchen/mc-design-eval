// Saint Matthew-in-the-City, Auckland CBD: a Gothic Revival stone church, read from the lidar record. The roof runs as a
// steep slate nave (roof 20-30 blocks above the lowest ground) with a square tower on the low north-east corner that
// rises to 48 blocks, so it is a tower on a podium beside a stepped nave. Stone walls with polished-andesite pilasters
// and string courses, paired lancet glass per bay, a dark-oak double door under a canopy on the uphill west face
// (ground 4, so the entrance sits at grade), and slate roofs on stairs where the lidar steps down by one block.
// Interior: an air gap behind the glass, a floor slab per storey, a solid attic under each roof. Nothing floats:
// the foundation runs from y 0 to the ground-floor datum, which is above every cell's ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_260057689.cells.json`, "utf8"));

const X = 58, Z = 42, Y = 61;
const F0 = 4;               // ground-floor datum (the uphill entrance's ground)
const STOREY = 4;
const ROOF_MAX = 48;

const grid = () => Array.from({ length: X }, () => Array(Z).fill(null));
const raw = grid();
for (const [x, z, , r] of cells) raw[x][z] = r;
const inF = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && raw[x][z] !== null;
if (Math.max(...cells.map((c) => c[2])) > F0) throw new Error("a cell's ground is above the datum: the foundation would float");

// Lidar roof: the mean of the footprint cells in each 5x5 (the noise goes), then snapped to a storey line above the
// datum, so every massing tier is flat and each setback steps in by whole storeys (the brief's tiers, not jags).
const roof = grid();
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z)) continue;
  let sum = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inF(x + dx, z + dz)) { sum += raw[x + dx][z + dz]; n++; }
  const storeys = Math.round((sum / n - F0) / STOREY);
  roof[x][z] = Math.min(ROOF_MAX, F0 + STOREY * Math.max(1, storeys));
}

const FACES = [{ dx: 0, dz: -1 }, { dx: 0, dz: 1 }, { dx: -1, dz: 0 }, { dx: 1, dz: 0 }];
const at = (x, y, z) => (z * Y + y) * X + x;
const S = new Uint8Array(X * Y * Z);                      // solid volume, decided before any material
const solid = (x, y, z) => x >= 0 && z >= 0 && y >= 0 && x < X && z < Z && y < Y && S[at(x, y, z)] === 1;
const hash = (...a) => { let v = 2166136261; for (const n of a) v = Math.imul(v ^ n, 16777619) >>> 0; return v; };

// Pass 1: the massing. Perimeter columns (beside the outside or a lower neighbour) are solid to the roof, so setbacks
// and the tower's faces are walls. Interior columns hold a solid floor slab per storey, air between, and a solid attic.
const isPerimeter = (x, z) => {
  const R = roof[x][z];
  return FACES.some((f) => !inF(x + f.dx, z + f.dz) || roof[x + f.dx][z + f.dz] < R);
};
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z)) continue;
  const R = roof[x][z], perim = isPerimeter(x, z);
  const topFloor = F0 + STOREY * Math.floor((R - 2 - F0) / STOREY);   // highest storey line under the roof
  for (let y = 0; y < R - 1; y++) {
    const floorLine = y >= F0 && (y - F0) % STOREY === 0;
    if (y < F0 || floorLine || perim || y > topFloor) S[at(x, y, z)] = 1;
  }
  S[at(x, R - 1, z)] = 1;                                              // the roof deck
}

// Pass 2: the materials, facade by facade.
const g = new Voxels([X, Y, Z]);
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z)) continue;
  const R = roof[x][z];
  for (let y = 0; y < R; y++) {
    if (!S[at(x, y, z)]) continue;
    const put = (b, st) => g.set(x, y, z, b, st);
    const exposed = FACES.filter((f) => !solid(x + f.dx, y, z + f.dz));

    if (y === R - 1) {                                                 // flat slate deck; the tower's top is an openwork parapet
      if (isPerimeter(x, z) && R >= 40 && exposed.length && (x + z) % 2 === 0) put("stone_brick_wall", { up: "true" });
      else put("deepslate_tiles");
      continue;
    }
    if (y < F0) {                                                      // foundation and plinth
      const onGrade = exposed.some((f) => !inF(x + f.dx, z + f.dz));
      put(y === F0 - 1 && onGrade ? "polished_andesite" : "stone_bricks");   // base course
      continue;
    }

    const floorLine = (y - F0) % STOREY === 0;
    const storeyIdx = Math.floor((y - F0) / STOREY);
    // The west entrance: a dark-oak double door (z 15, 16) under a canopy band, on the uphill side at grade.
    if (x === 0 && (z === 15 || z === 16) && y <= F0 + 1) {
      const hinge = z === 15 ? "right" : "left";
      put("dark_oak_door", { facing: "west", half: y === F0 ? "lower" : "upper", hinge, open: "false", powered: "false" });
      continue;
    }
    if (x === 0 && z >= 15 && z <= 17 && y === F0 + 2) {
      put("dark_oak_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (y === R - 2 && exposed.length) { put("polished_andesite"); continue; }   // cornice under the roof
    if (!exposed.length) { put(floorLine ? "smooth_stone" : "stone_bricks"); continue; }   // floor slab or inner wall
    if (floorLine) { put("polished_andesite"); continue; }             // storey string course
    const f = exposed[0];
    const t = f.dx !== 0 ? z : x;                                      // position along the face
    const m = t % 4;                                                   // bay: pilaster, glass, glass, wall
    const inX = x - f.dx, inZ = z - f.dz;                              // the room cell behind this face
    if (m === 0) { put("polished_andesite"); continue; }
    if ((m === 1 || m === 2) && !solid(inX, y, inZ) && inF(inX, inZ)) {
      const pane = f.dx !== 0
        ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
        : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
      put("glass_pane", pane);
      const bay = Math.floor(t / 4);
      if (m === 2 && (y - F0) % STOREY === 2 && (bay * 5 + storeyIdx * 3 + (f.dx !== 0 ? 1 : 0)) % 4 === 0) {
        g.set(inX, y, inZ, "glowstone");                               // a lit room behind the glass
      }
      continue;
    }
    put(hash(x, y, z) % 9 === 0 ? "cracked_stone_bricks" : "stone_bricks");
  }
}

// Interior lights under the ground floor's ceiling, just inside the door.
g.set(1, F0 + 3, 15, "lantern", { hanging: "true", waterlogged: "false" });
g.set(1, F0 + 3, 16, "lantern", { hanging: "true", waterlogged: "false" });

const out = g.save(`${DIR}/way_260057689.nbt`);
console.log(`way_260057689: ${out.blocks} blocks, palette ${out.palette}, tallest roof ${Math.max(...cells.map((c) => c[3]))}`);
