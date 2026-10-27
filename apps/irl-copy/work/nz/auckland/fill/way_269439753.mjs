// J.A. Russell, Mt Eden / Auckland CBD edge: a four-storey concrete-frame office block of the 1960s-70s (the record
// gives no era, so this is the period the lidar massing and the city's commercial stock suggest). Storey lines every
// 3 blocks, pale concrete spandrels, pier-and-ribbon glazing, a polished-andesite base course, a stone parapet, a
// plant core on the lidar's 15 m-high cells, and a recessed iron-door entrance on the flat face.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269439753.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269439753.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));   // [x, z, ground, roof] per footprint cell
const fp = new Set(cells.map(([x, z]) => `${x},${z}`));
const inFp = (x, z) => fp.has(`${x},${z}`);
const facade = (x, z) => ({ E: !inFp(x + 1, z), W: !inFp(x - 1, z), S: !inFp(x, z + 1), N: !inFp(x, z - 1) });

const STOREY = 3;   // storey lines (spandrel + floor slab) at y % 3 == 0; glazing in the two rows between
const ROOF = 13;    // flat roof tier: the lidar's 12-14 cells smoothed onto one level, edge noise (6, 9) with them
const CORE = 16;    // plant core where the lidar reads 15 (roof + 3)
const CORE_LIMIT = 15;

const g = new Voxels([52, 28, 65]);
const paneState = (runZ) => (runZ
  ? { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" }
  : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" });

// 1. massing and facades, cell by cell, bottom up: foundation, base course, storeys, roof
for (const [x, z, ground, roof] of cells) {
  const core = roof >= CORE_LIMIT;
  const top = core ? CORE : ROOF;                         // first row above the building
  const f = facade(x, z);
  const faces = [f.E, f.W, f.N, f.S].filter(Boolean).length;
  const perim = faces > 0, corner = faces >= 2;
  const runZ = f.E || f.W;                                  // an x-facing wall runs along z
  const along = runZ ? z : x;                               // bay coordinate on that wall
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone");                  // foundation down to the ground
  for (let y = ground; y < top; y++) {
    if (y === ground) { g.set(x, y, z, "polished_andesite"); continue; }     // base course
    if (y === top - 1) { g.set(x, y, z, perim ? "stone_bricks" : "smooth_stone"); continue; }   // cornice / roof
    if (core && y >= 13) { g.set(x, y, z, "stone_bricks"); continue; }       // plant core walls
    if (y % STOREY === 0) { g.set(x, y, z, "white_concrete"); continue; }    // storey line: spandrel + floor
    if (!perim) {                                                            // interior: air gap, column grid
      if (x % 4 === 0 && z % 4 === 0) g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (corner || along % 4 === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }   // piers
    g.set(x, y, z, y < 3 ? "glass_pane" : "light_blue_stained_glass_pane", paneState(runZ));  // glazing
  }
  if (!core && perim) g.set(x, ROOF, z, "stone_bricks");                     // parapet
}

// 2. warm light behind some glazing: a glowstone in the air gap just inside the glass
for (const [x, z, , roof] of cells) {
  if (roof >= CORE_LIMIT) continue;
  const f = facade(x, z);
  const faces = [f.E, f.W, f.N, f.S].filter(Boolean).length;
  if (!faces || faces >= 2) continue;
  const runZ = f.E || f.W, along = runZ ? z : x;
  const dx = f.E ? -1 : f.W ? 1 : 0, dz = f.S ? -1 : f.N ? 1 : 0;
  const ix = x + dx, iz = z + dz;
  if (!inFp(ix, iz) || (ix % 4 === 0 && iz % 4 === 0)) continue;
  for (let y = 1; y < ROOF - 1; y++) {
    if (y % STOREY === 0 || along % 4 === 0) continue;
    if (((x * 31 + z * 17 + y * 7) % 9) === 0) g.set(ix, y, iz, "glowstone");
  }
}

// 2b. roof plant: 2 x 2 x 2 air-handling plinths on a loose grid, only where all four cells are plain roof
const roofOk = (x, z) => inFp(x, z) && !facade(x, z).E && !facade(x, z).W && !facade(x, z).N && !facade(x, z).S
  && cells.find(([cx, cz]) => cx === x && cz === z)[3] < CORE_LIMIT;
for (const [x, z] of cells) {
  if (x % 9 !== 5 || z % 9 !== 5) continue;
  if (![[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => roofOk(x + dx, z + dz))) continue;
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) for (let y = ROOF; y < ROOF + 2; y++)
    g.set(x + dx, y, z + dz, "light_gray_concrete");
}

// 3. entrance: an iron door in a ground-floor glazed bay on a flat south or north wall, a lantern hung just inside
const doorOn = (face) => {
  const cand = cells.filter(([x, z, ground, roof]) => ground === 0 && roof < CORE_LIMIT
    && facade(x, z)[face] && !Object.entries(facade(x, z)).filter(([k, v]) => v && k !== face).length
    && (face === "S" || face === "N" ? x : z) % 4 !== 0);
  if (!cand.length) return null;
  const mid = [...cand].sort((a, b) => a[0] - b[0] || a[1] - b[1])[cand.length >> 1];
  return mid;
};
for (const face of ["S", "N"]) {
  const d = doorOn(face);
  if (!d) continue;
  const [x, z] = d;
  const facing = face === "S" ? "south" : "north";
  const inZ = face === "S" ? z - 1 : z + 1;
  g.set(x, 1, z, "iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, 2, z, "iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(x, 2, inZ, "lantern", { hanging: "true", waterlogged: "false" });
  break;
}

const { blocks, palette } = g.save(OUT);
console.log(`way_269439753: ${cells.length} cells, ${blocks} blocks, ${palette} palette entries -> ${OUT}`);
