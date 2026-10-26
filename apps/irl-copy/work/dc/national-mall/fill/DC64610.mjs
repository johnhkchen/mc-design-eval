// 1759 R St NW (Thomas Nelson Page House), a Romanesque-Revival brick rowhouse-office of the 1890s on a stone plinth:
// three storeys over the core, two over the wings, a stone cornice band and a flat roof behind it. Massing follows the
// lidar roof, smoothed into tiers (7, 8, 9) so the core stands up and the wings step down. Only the shell is built:
// exterior walls, a floor belt per storey, a roof over each tier, and an air gap behind every pane.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC64610.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..12, z 0..12
const key = (x, z) => `${x},${z}`;
const inM = new Set(cells.map(([x, z]) => key(x, z)));

// Flat tiers: each cell's roof is the mean of its footprint neighbours (lidar noise out), rounded and held to 7..9
const top = new Map();
for (const [x, z] of cells) {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const k = key(x + dx, z + dz); if (!inM.has(k)) continue;
    s += cells.find(([a, b]) => a === x + dx && b === z + dz)[3]; n++;
  }
  top.set(key(x, z), Math.min(9, Math.max(7, Math.round(s / n))));
}
const T = (x, z) => top.get(key(x, z)) ?? 0;

// Palette
const PLINTH = "stone_bricks", BELT = "smooth_stone", BRICK = "bricks", CORNICE = "stone_bricks", ROOF = "deepslate_tiles";
const PIER = "dark_oak_planks", PANE = "glass_pane", LIGHT = "glowstone";
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Outward faces of a voxel at height y: a neighbour column that does not reach y leaves it exposed
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !inM.has(key(x + dx, z + dz)) || T(x + dx, z + dz) <= y);

// Storey rows: 1-2 ground, 4-5 second, 7 third (core only); belts at 3 and 6; the top row is the cornice or roof
const windowRows = (t) => (t >= 9 ? [1, 2, 4, 5, 7] : [1, 2, 4, 5]);

// Entrance: the exposed storey-1 face nearest the middle of the footprint, on a tier of 8 or more
let door = null, best = Infinity;
for (const [x, z] of cells) {
  const ex = exposed(x, 1, z); if (ex.length !== 1 || T(x, z) < 8) continue;
  const [dx, dz] = ex[0]; if (dx !== 0) continue;               // a north or south face, so the door faces the Mall axis
  const d = Math.abs(x - 6) + Math.abs(z - 6);
  if (d < best) { best = d; door = { x, z, dx, dz }; }
}
const facing = door.dz === 1 ? "south" : "north";

const height = Math.max(...cells.map(([x, z]) => T(x, z)));
const g = new Voxels([13, 21, 13]);

for (const [x, z] of cells) {
  const t = T(x, z);
  for (let y = 0; y < t; y++) {
    const ex = exposed(x, y, z);
    if (y === 0) { g.set(x, y, z, PLINTH); continue; }
    if (y === t - 1) { g.set(x, y, z, ex.length ? CORNICE : ROOF); continue; }
    if (y === 3 || y === 6) { g.set(x, y, z, BELT); continue; }
    if (!ex.length) continue;                                   // interior air; floors and roof are the belts and caps
    if (door && x === door.x && z === door.z && (y === 1 || y === 2)) {
      g.set(x, y, z, "dark_oak_door", { facing, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (!windowRows(t).includes(y)) { g.set(x, y, z, BRICK); continue; }
    if (ex.length > 1) { g.set(x, y, z, BRICK); continue; }   // corner pier
    const [dx] = ex[0];
    const u = dx !== 0 ? z : x;                                 // along the face
    const bay = u % 4;                                          // 2-pane windows between 1-block piers, every 4 along the face
    if (y <= 2) {                                               // ground storey: shopfront, glass between dark piers
      if (bay === 0) { g.set(x, y, z, PIER); continue; }
      g.set(x, y, z, PANE);
    } else {
      if (bay !== 1 && bay !== 2) { g.set(x, y, z, BRICK); continue; }
      g.set(x, y, z, PANE);
    }
    // a warm window: glowstone in the air gap behind every fourth pane
    if ((u + y) % 4 === 0) {
      const [ex0, ez0] = ex[0], ix = x - ex0, iz = z - ez0;
      if (inM.has(key(ix, iz)) && T(ix, iz) > y) g.set(ix, y, iz, LIGHT);
    }
  }
}

// Entrance pilasters: the belt over the door carries on as stone, the jambs are dressed
if (door) {
  const { x, z, dx, dz } = door;
  for (const s of [-1, 1]) {
    const jx = x + (dx === 0 ? s : 0), jz = z + (dz === 0 ? s : 0);
    if (inM.has(key(jx, jz)) && exposed(jx, 1, jz).length) g.set(jx, 1, jz, PIER);
  }
}

// Roof equipment on the core: two brick chimneys with stone caps and a plant box
const core = cells.filter(([x, z]) => T(x, z) === 9 && exposed(x, 8, z).length === 0);
const pick = (i) => core[Math.min(core.length - 1, Math.floor(i * core.length))];
if (core.length) {
  for (const [x, z] of [pick(0.25), pick(0.75)]) {
    g.set(x, 9, z, BRICK); g.set(x, 10, z, BRICK); g.set(x, 11, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
  const [px, pz] = pick(0.5);
  g.set(px, 9, pz, "iron_block");
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC64610.nbt");
console.log({ height, door, cells: cells.length, blocks: g.count() });
