// DC68641: a 1960s Commercial-Office on Connecticut Avenue NW, read from the lidar record. A 21 x 12 footprint of a
// brick-faced office block, three storeys of 2 blocks over a 3-block shopfront, with a stone plinth, smooth-stone floor
// lines and cornice, blue-tinted glass in grey-iron frames, and a dark entrance band and door on the north front. The
// lidar roof is median-smoothed over each cell's 3x3 neighbourhood and clamped to 6..9 blocks, so the massing lands in
// clean flat tiers (a 9-block core, 8-block main body, 6-7 block wings) rather than following the noise. Each column
// fills from y 0 to its ground as foundation, so the downhill side shows its extra storeys and nothing floats.
//
// Storey lines sit on absolute rows (floor slabs at 3, 5, 7), so neighbouring tiers line up where they step. Exterior
// cells (any side open to the street) carry the facade; interior cells are air between floor slabs with a roof slab on
// top. Some windows are lit: a glowstone just behind the glass, on the floor slab. The 9-block core carries a one-storey
// penthouse, and the 6-8 block roofs carry a few plant units.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC68641.cells.json`, "utf8"));
const W = 21, D = 12, Hmax = 21;

const BASE = "stone_bricks";        // foundation and plinth
const WALL = "bricks";              // brick facade
const TRIM = "smooth_stone";        // floor lines, cornice, interior slabs
const GLASS = "light_blue_stained_glass";   // full glass blocks: the panes read as holes in the sheet
const SHOP_GLASS = "light_blue_stained_glass";
const FRAME = "iron_block";         // grey-iron mullions
const ROOF = "gray_concrete";       // roof membrane
const CANOPY = "black_concrete";    // entrance band
const LIGHT = "glowstone";

const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => byXZ.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Lidar roof: median of the 3x3 neighbourhood (kills single-cell noise).
const medianRoof = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(byXZ.get(key(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
};
// Second pass: each cell takes the most common clamped tier in its 3x3 (ties go higher), so lone 7s and 9s in the
// 8-block body become flat tiers instead of steps.
const clampTier = (x, z) => Math.min(9, Math.max(6, medianRoof(x, z)));
const tierOf = (x, z) => {
  const n = new Map();
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) {
    const t = clampTier(x + dx, z + dz); n.set(t, (n.get(t) ?? 0) + 1);
  }
  let best = 0, bestN = -1;
  for (const [t, c] of n) if (c > bestN || (c === bestN && t > best)) { best = t; bestN = c; }
  return best;
};

// Exterior: at least one side open to outside the footprint.
const openSides = (x, z) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz));
const isRing = (x, z) => openSides(x, z).length > 0;

// Entrance: the north front (z = 0), centred on the front's middle column.
const frontCols = cells.filter(([, z]) => z === 0).map(([x]) => x).sort((a, b) => a - b);
const DOOR = { x: frontCols[Math.floor(frontCols.length / 2)], z: 0 };
const isCanopy = (x, z) => z === 0 && Math.abs(x - DOOR.x) <= 1;

// Penthouse: a one-storey setback on the tallest core, standing on the roof slab (interior cells on a 9-block tier
// whose four neighbours are also interior 9-block tier cells).
const top9 = (x, z) => inside(x, z) && !isRing(x, z) && tierOf(x, z) === 9;
const isPenthouse = (x, z) => top9(x, z) && DIRS.every(([dx, dz]) => top9(x + dx, z + dz));

const v = new Voxels([W, Hmax, D]);
let lit = 0, plant = 0;
for (const [x, z, g] of cells) {
  const T = tierOf(x, z), ring = isRing(x, z), sides = openSides(x, z);  // sides: the open faces of an exterior cell
  // Foundation: solid from 0 up to the cell's ground.
  for (let y = 0; y < g; y++) v.set(x, y, z, BASE);

  if (!ring) {
    for (let y = g; y < T; y++) {
      if (y === T - 1) v.set(x, y, z, ROOF);
      else if (y === 0 || y === 3 || y === 5 || y === 7) v.set(x, y, z, TRIM);
    }
    if (isPenthouse(x, z)) { v.set(x, T, z, BASE); v.set(x, T + 1, z, TRIM); }
    else if (T <= 8 && (x * 5 + z * 3) % 9 === 0) { v.set(x, T, z, FRAME); plant++; }
    continue;
  }

  // Facade axis: a z-facing side sets the bays along x, otherwise along z (a corner takes its z-facing side).
  const zSide = sides.find(([, dz]) => dz !== 0);
  const [odx, odz] = zSide ?? sides[0];
  const bay = zSide ? x : z;
  const mullion = bay % 3 === 0;
  // The cell one step inward, the room behind the glass.
  const [idx, idz] = zSide ? [0, -zSide[1]] : [-odx, 0];

  for (let y = g; y < T; y++) {
    if (y === T - 1) { v.set(x, y, z, TRIM); continue; }                     // cornice / parapet
    if (y === g) { v.set(x, y, z, BASE); continue; }                          // plinth course
    if (y <= 2) {                                                             // shopfront, with the entrance
      if (x === DOOR.x && z === DOOR.z) {
        v.set(x, y, z, "iron_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      } else if (x === DOOR.x - 1 && z === DOOR.z && y === 1) {
        v.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      } else if (x === DOOR.x + 1 && z === DOOR.z && y === 1) {
        v.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      } else {
        v.set(x, y, z, mullion ? FRAME : SHOP_GLASS);
      }
      continue;
    }
    if (y === 3 || y === 5 || y === 7) {                                     // floor line / spandrel
      v.set(x, y, z, y === 3 && isCanopy(x, z) ? CANOPY : TRIM);            // dark entrance band over the door
      continue;
    }
    if (y === 4 || y === 6) {                                                 // upper window rows
      if (mullion) { v.set(x, y, z, FRAME); continue; }
      v.set(x, y, z, GLASS);
      if (!ring || !inside(x + idx, z + idz) || isRing(x + idx, z + idz)) continue;
      if ((x * 31 + z * 17 + y * 7) % 6 === 0 && lit < 60) {                  // warm room behind the glass
        v.set(x + idx, y, z + idz, LIGHT); lit++;
      }
      continue;
    }
    v.set(x, y, z, WALL);
  }
}

const info = v.save(`${DIR}/DC68641.nbt`);
console.log(`DC68641: ${info.blocks} blocks, ${info.palette} palette, ${lit} lit windows, ${plant} roof units`);
