// 1271 Avenue of the Americas, the Time & Life Building (1961): a glass-and-metal office tower on a stone-faced podium.
// The lidar gives a roof of about 164 blocks over most of the footprint and a podium of about 30 over the rest. Each cell's
// roof is the median of its 5x5 neighbourhood (footprint cells only), which drops the edge noise, and is classed as tower
// (164) or podium (30). The tower is one slab with no setback in the record. Its shell is one cell thick with an air gap
// behind the glass and a floor slab per storey; a six-block mechanical penthouse stands on the roof. Materials come from the
// building's era and type (stone podium, aluminium mullions, tinted glass), not from its documented finish.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill/NYC1022709.cells.json", "utf8"));

const TOWER_TOP = 164, PODIUM_TOP = 30;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIRNAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const key = (x, z) => `${x},${z}`;

// Massing: each cell's roof is the median of its 5x5 neighbourhood, classed as tower (>= 100) or podium.
const raw = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
const FOOT = new Map();
for (const [x, z, gr] of cells) {
  const near = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (raw.has(key(x + dx, z + dz))) near.push(raw.get(key(x + dx, z + dz)));
  near.sort((a, b) => a - b);
  const tower = near[Math.floor(near.length / 2)] >= 100;
  FOOT.set(key(x, z), { g: gr, R: tower ? TOWER_TOP : PODIUM_TOP, tower });
}
const solid = (x, y, z) => { const c = FOOT.get(key(x, z)); return !!c && y >= 0 && y < c.R; };

// Two entrances, recessed: the street front (north, z 0) and the avenue front (west, x 0). Each has a dark canopy at y 3.
const DOORS = [{ x: 20, z: 0, dx: 0, dz: -1 }, { x: 0, z: 36, dx: -1, dz: 0 }];
const DOOR = new Map(DOORS.map((d) => [key(d.x, d.z), d]));
const CANOPY = new Set();
for (const d of DOORS) for (const s of [-1, 0, 1]) for (const k of [0, 1]) {
  const along = d.dz !== 0 ? [s, 0] : [0, s];
  CANOPY.add(key(d.x + along[0] - k * d.dx, d.z + along[1] - k * d.dz));   // the face row, then one cell in
}

// Glass panes connect along their wall: a z-facing wall runs its panes along x, and the reverse.
const paneState = (normalZ) => (normalZ
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// An exposed face cell at height y. Podium: granite base, shopfront, stone-framed office floors. Tower: spandrel bands at
// the storey lines, aluminium mullions every fourth cell, tinted glass between.
function facade(x, y, z, [dx, dz], R, tower) {
  const along = dz !== 0 ? x : z;                // position along the face, for the piers
  if (y >= R - 2) return ["smooth_stone"];       // cornice and parapet
  if (!tower || y < PODIUM_TOP) {
    if (y === 0) return ["polished_granite"];
    if (y <= 2) {
      const d = DOOR.get(key(x, z));
      if (d) return ["dark_oak_door", { facing: DIRNAME[`${d.dx},${d.dz}`], hinge: "left", open: "false", powered: "false", half: y === 1 ? "lower" : "upper" }];
      return along % 3 === 0 ? ["black_concrete"] : ["glass"];
    }
    if (y % 3 === 0) return ["smooth_quartz"];
    return along % 3 === 0 ? ["smooth_quartz"] : ["gray_stained_glass_pane", paneState(dz !== 0)];
  }
  if (y % 3 === 0) return ["gray_concrete"];
  return along % 4 === 0 ? ["iron_block"] : ["light_blue_stained_glass_pane", paneState(dz !== 0)];
}

const g = new Voxels([110, 176, 55]);
const lit = [];   // interior cells behind some windows, for a warm light
for (const [x, z] of cells) {
  const { g: gr, R, tower } = FOOT.get(key(x, z));
  for (let y = 0; y < R; y++) {
    if (y < gr) { g.set(x, y, z, "stone"); continue; }                                  // foundation
    if (y === R - 1 || y === PODIUM_TOP - 1) { g.set(x, y, z, "smooth_stone"); continue; }  // roof slabs; the podium roof also carries the tower
    if (y === 3 && CANOPY.has(key(x, z))) { g.set(x, y, z, "black_concrete"); continue; }
    const exposed = DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));
    if (exposed.length) {
      const dir = exposed[0];
      const [block, state] = facade(x, y, z, dir, R, tower);
      g.set(x, y, z, block, state);
      if (block.includes("glass") && (Math.imul(x * 73 + y * 151 + z * 277, 2654435761) >>> 0) % 23 === 0) lit.push([x - dir[0], y, z - dir[1], (x + y + z) % 2]);
    } else if (y % 3 === 0) {
      g.set(x, y, z, "stone");                                                          // a floor slab per storey
    }
  }
}

for (const [x, y, z, warm] of lit) if (g.get(x, y, z) === null) g.set(x, y, z, warm ? "glowstone" : "shroomlight");
for (const d of DOORS) for (const y of [1, 2]) g.set(d.x - d.dx, y, d.z - d.dz, "glowstone");   // warm lobby behind each door

// Mechanical penthouse on the tower roof: a six-block box with glass louvres and a stone cap.
const ph = (x, z) => x >= 40 && x <= 60 && z >= 24 && z <= 39 && !!FOOT.get(key(x, z))?.tower;
for (const [x, z] of cells) {
  if (!ph(x, z)) continue;
  const exposed = DIRS.filter(([dx, dz]) => !ph(x + dx, z + dz));
  for (let y = TOWER_TOP; y < TOWER_TOP + 6; y++) {
    if (y === TOWER_TOP + 5) g.set(x, y, z, "smooth_stone");
    else if (exposed.length) {
      if (y === TOWER_TOP + 1 || y === TOWER_TOP + 2) g.set(x, y, z, "light_blue_stained_glass_pane", paneState(exposed[0][1] !== 0));
      else g.set(x, y, z, "light_gray_concrete");
    }
  }
}

// Plant on the podium roof: a few two-block condenser units.
for (const [x, z] of cells) {
  if (!FOOT.get(key(x, z)).tower && x % 13 === 5 && z % 9 === 4) {
    g.set(x, PODIUM_TOP, z, "light_gray_concrete");
    g.set(x, PODIUM_TOP + 1, z, "iron_block");
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill/NYC1022709.nbt";
console.log(g.save(out));
