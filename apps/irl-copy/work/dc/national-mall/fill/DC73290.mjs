// 1771 N St NW (Commercial-Office-Large): a 1980s Dupont Circle office block. Pale stone shell, bronze-blue glass in
// two-bay piers, a stone base course, a smooth cornice, a 4-storey wing (lidar 13) and a 6-storey tower (lidar 15-16)
// that steps back in its top two storeys. Plan and roof follow the lidar record; the shell is 1 block thick, interiors
// are air behind the glass, and each floor is a slab on the walls and a solid core.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC73290.cells.json`, "utf8"));
const SIZE = [15, 27, 13];

// Lidar roofs fall in 13 (wings) and 15-16 (tower). Smooth the noise into two flat tiers: 13 and 16.
const F = new Map();
for (const [x, z, ground, roof] of cells) F.set(`${x},${z}`, { ground, tower: roof >= 15 });
const cell = (x, z) => F.get(`${x},${z}`);
const inF = (x, z) => F.has(`${x},${z}`);
const inner = (x, z) => inF(x - 1, z) && inF(x + 1, z) && inF(x, z - 1) && inF(x, z + 1);
const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Body top = the cap row (roof deck). Wings cap at 12 (roof 13). Tower cap at 15 (roof 16); its outer ring steps back
// to 13 so the top two storeys are set back onto the lower storey's roof. A rim (parapet) sits one row above a cap
// wherever the cell's edge is exposed.
const top = (x, z) => (!cell(x, z).tower ? 12 : inner(x, z) ? 15 : 13);
const hasRimTier = (x, z) => !cell(x, z).tower || inner(x, z);
const rimAt = (x, z) =>
  hasRimTier(x, z) && DIRS4.some(([dx, dz]) => !inF(x + dx, z + dz) || top(x + dx, z + dz) <= top(x, z));
const solid = (x, y, z) => {
  if (!inF(x, z) || y < 0) return false;
  const t = top(x, z);
  return y <= t || (y === t + 1 && rimAt(x, z));
};
const exterior = (x, y, z) => DIRS4.some(([dx, dz]) => !solid(x + dx, y, z + dz));
const zFace = (x, y, z) => !solid(x, y, z - 1) || !solid(x, y, z + 1);
const xFace = (x, y, z) => !solid(x - 1, y, z) || !solid(x + 1, y, z);
// Glazing bays: a pier every third column on each face (two-pane windows between), corners always piered.
const pier = (x, y, z) => {
  const zf = zFace(x, y, z), xf = xFace(x, y, z);
  return (zf && xf) || (zf && x % 3 === 0) || (xf && z % 3 === 0);
};

// Penthouse: a block set in from the tower's cap, on tower cells that are at least one step inside the tower's edge.
const CORE = (x, z) => x >= 5 && x <= 9 && z >= 4 && z <= 8;
const pent = (x, z) => {
  if (!(x >= 4 && x <= 10 && z >= 3 && z <= 9)) return false;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (!inF(x + dx, z + dz) || top(x + dx, z + dz) !== 15) return false;
  return true;
};

const M = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => M.set(key(x, y, z), { block, state });
const at = (x, y, z) => M.has(key(x, y, z));

// 1. the shell, row by row: base, plinth, glazed storeys, band rows (storey lines), cap, rim, core, floor slabs
for (const [id, c] of F) {
  const [x, z] = id.split(",").map(Number);
  const T = top(x, z);
  for (let y = 0; y <= T + 1; y++) {
    if (!solid(x, y, z)) continue;
    const ext = exterior(x, y, z);
    if (y <= 2) {
      // plinth: the foundation runs up to the base course at 2 on every cell; on the downhill side (ground 0) the
      // lowest row shows basement lights
      if (y === 1 && ext && c.ground === 0 && !pier(x, y, z)) put(x, y, z, "light_blue_stained_glass_pane");
      else put(x, y, z, y === 2 ? "polished_andesite" : "stone_bricks");
      continue;
    }
    if (y === T + 1) { put(x, y, z, "calcite"); continue; }   // rim / parapet
    if (y === T) { put(x, y, z, "smooth_stone"); continue; }  // cap and cornice
    const band = y >= 5 && y % 2 === 1;                        // storey lines: spandrels and floor slabs
    if (!ext) {
      if (CORE(x, z)) put(x, y, z, "stone_bricks");
      else if (band) put(x, y, z, "smooth_stone");
      continue;
    }
    if (band) { put(x, y, z, "smooth_stone"); continue; }
    if (z === 0 && (y === 3 || y === 4)) {                     // lobby on the front (z 0) face
      if (x === 7) continue;                                    // the door, set below
      if (x === 6 || x === 8) { put(x, y, z, "light_blue_stained_glass"); continue; }
      if (x === 5 || x === 9) { put(x, y, z, "calcite"); continue; }
    }
    put(x, y, z, pier(x, y, z) ? "calcite" : "light_blue_stained_glass_pane");
  }
}

// 2. the front door, two tall, opening outward (north)
const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
put(7, 3, 0, "iron_door", door("lower"));
put(7, 4, 0, "iron_door", door("upper"));

// 3. the penthouse: calcite ring, glazed bays on its upper row, a cap, set in from the tower edge
for (const [id] of F) {
  const [x, z] = id.split(",").map(Number);
  if (!pent(x, z)) continue;
  const ring = DIRS4.some(([dx, dz]) => !pent(x + dx, z + dz));
  if (ring) {
    put(x, 16, z, "calcite");
    put(x, 17, z, (x + z) % 2 ? "light_blue_stained_glass_pane" : "calcite");
  }
  put(x, 18, z, "smooth_stone");
}

// 4. roof equipment: a few air-handling boxes on the roof decks (on the cap, never on air)
for (const [id] of F) {
  const [x, z] = id.split(",").map(Number);
  const T = top(x, z);
  if (!(x % 4 === 1 && z % 4 === 1) || rimAt(x, z) || pent(x, z)) continue;
  put(x, T + 1, z, "light_gray_concrete");
}

// 5. the entrance lanterns on the lobby floor
put(6, 3, 1, "lantern", { hanging: "false", waterlogged: "false" });
put(8, 3, 1, "lantern", { hanging: "false", waterlogged: "false" });

// 6. warm light behind some glazing: a glowstone or shroomlight on the room side of a pane, standing on a floor
for (const [id] of F) {
  const [x, z] = id.split(",").map(Number);
  const T = top(x, z);
  for (const y of [3, 6, 8, 10, 12, 14]) {
    if (y > T - 1 || !solid(x, y, z) || !exterior(x, y, z) || pier(x, y, z)) continue;
    if (y === 3 && z === 0) continue;                         // the lobby glass
    if ((x * 7 + y * 5 + z * 3) % 5 !== 0) continue;
    for (const [dx, dz] of DIRS4) {
      const ix = x + dx, iz = z + dz;
      if (!inF(ix, iz) || at(ix, y, iz) || !at(ix, y - 1, iz) || exterior(ix, y, iz)) continue;
      put(ix, y, iz, (x + y + z) % 2 ? "glowstone" : "shroomlight");
      break;
    }
  }
}

// 7. panes take their connections from their neighbours in the wall
for (const [id, v] of M) {
  if (!v.block.endsWith("_stained_glass_pane")) continue;
  const [x, y, z] = id.split(",").map(Number);
  const n = (dx, dz) => M.has(key(x + dx, y, z + dz));
  v.state = { east: String(n(1, 0)), west: String(n(-1, 0)), north: String(n(0, -1)), south: String(n(0, 1)), waterlogged: "false" };
}

// 8. write the structure, and check that nothing is left hanging (a block with air below it and no neighbour at its level)
const hanging = [];
for (const [id] of M) {
  const [x, y, z] = id.split(",").map(Number);
  if (y === 0 || at(x, y - 1, z)) continue;
  if (!DIRS4.some(([dx, dz]) => at(x + dx, y, z + dz))) hanging.push(id);
}
const g = new Voxels(SIZE);
for (const [id, v] of M) { const [x, y, z] = id.split(",").map(Number); g.set(x, y, z, v.block, v.state); }
const out = g.save(`${DIR}/DC73290.nbt`);
console.log(JSON.stringify({ ...out, hanging: hanging.length, hangingSample: hanging.slice(0, 5) }));
