// 630 Pennsylvania Ave NW (Commercial-Office-Large), built from its lidar massing: a C-shaped stone office block with a
// 16-block four-storey core and a 12-block three-storey ring/wings, round a court that opens to the north-east.
// Stripped-classical limestone (calcite, smooth quartz) on a polished granite plinth, pilaster bays, a two-leaf entrance
// on the south front, a cornice, a roof terrace with mechanical units, and a penthouse on the core.
// Four blocks a storey: belt course at y = 4s, two window rows, a head band. Every column stands on its ground and
// rises to its tier; the walls are a one-cell shell, the interior is air behind glass with a floor plate each storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${HERE}/DC87513.cells.json`, "utf8"));   // [x, z, ground, roof]
const SIZE = [42, 28, 25];
const g = new Voxels(SIZE);

const k = (x, z) => `${x},${z}`;
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const ground = new Map(cells.map(([x, z, gr]) => [k(x, z), gr]));
const has = (x, z) => ground.has(k(x, z));

// Lidar to two clean tiers (the core stands 16, the ring and wings 12), then one majority pass to drop single-cell noise.
const raw = new Map(cells.map(([x, z, , r]) => [k(x, z), r >= 15 ? 16 : 12]));
const R = new Map();
for (const [x, z] of cells) {
  const mine = raw.get(k(x, z));
  let same = 0, other = 0;
  for (const [dx, dz] of Object.values(DIRS)) {
    if (!has(x + dx, z + dz)) continue;
    if (raw.get(k(x + dx, z + dz)) === mine) same++; else other++;
  }
  R.set(k(x, z), other >= 3 && other > same ? (mine === 16 ? 12 : 16) : mine);
}
const top = (x, z) => R.get(k(x, z));

// A side is open at height y when the neighbour is off the footprint or its roof is below y: the wall shows there.
const openFaces = (x, z, y) => Object.entries(DIRS)
  .filter(([, [dx, dz]]) => !has(x + dx, z + dz) || top(x + dx, z + dz) <= y)
  .map(([name]) => name);
const isShell = (x, z, y) => y >= 1 && y <= top(x, z) - 2 && openFaces(x, z, y).length > 0;

// 1. Plinth and roof: solid under every cell, a roof slab on every tier, a floor plate at each storey line below it.
for (const [x, z] of cells) {
  const t = top(x, z);
  g.set(x, 0, z, isShell(x, 0, z) ? "polished_granite" : "stone");
  for (let s = 1; 4 * s <= t - 2; s++) g.set(x, 4 * s, z, "smooth_stone");
  g.set(x, t - 1, z, "stone");
}

// 2. Facade: belt course at each storey line, a window band (two rows) and a head band, pilasters every third bay.
// Ground floor: granite piers and clear glass shopfronts. Upper: pale quartz piers, pale glass windows.
const DOOR = { z: 24, xs: [17, 18] };
const glowSpots = [];
for (const [x, z] of cells) {
  const t = top(x, z);
  for (let y = 1; y <= t - 2; y++) {
    const faces = openFaces(x, z, y);
    if (!faces.length) continue;
    const zFace = faces.includes("N") || faces.includes("S");
    const u = zFace ? x : z;
    const band = y % 4;
    let block;
    if (band === 0 || band === 3) block = "smooth_quartz";
    else if (y < 4) block = u % 3 === 0 ? "polished_granite" : "glass";
    else block = u % 3 === 0 ? "quartz_pillar" : "light_blue_stained_glass";
    g.set(x, y, z, block, block === "quartz_pillar" ? { axis: "y" } : undefined);

    // Warm glass: a glowstone just inside some window bays, lit behind the pane.
    if ((band === 1 || band === 2) && block.includes("glass") && (x * 7 + y * 13 + z * 3) % 5 === 0) {
      const [dx, dz] = DIRS[faces[0]];
      glowSpots.push([x - dx, y, z - dz]);
    }
  }
}
// Entrance: a two-leaf dark oak door in the south front, granite piers either side, a lintel over.
for (const x of [16, 19]) for (const y of [1, 2]) g.set(x, y, DOOR.z, "polished_granite");
DOOR.xs.forEach((x, i) => {
  const hinge = i === 0 ? "left" : "right";
  g.set(x, 1, DOOR.z, "dark_oak_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
  g.set(x, 2, DOOR.z, "dark_oak_door", { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
});
for (const [x, y, z] of glowSpots) {
  if (has(x, z) && !isShell(x, y, z) && y <= top(x, z) - 2 && y % 4 !== 0 && y % 4 !== 3) {
    g.set(x, y, z, "glowstone");
  }
}

// 3. Roof: a cornice on the outer edge of every tier, a stone railing where the ring meets the core's wall,
// the mechanical units on the ring terrace, and a penthouse on the core with a lightning rod.
for (const [x, z] of cells) {
  const t = top(x, z);
  const edge = Object.values(DIRS).some(([dx, dz]) => !has(x + dx, z + dz));
  const beside = Object.values(DIRS).some(([dx, dz]) => has(x + dx, z + dz) && top(x + dx, z + dz) > t);
  if (edge) g.set(x, t, z, "smooth_quartz");
  else if (beside) g.set(x, t, z, "stone_brick_wall");
}

// Mechanical units on the ring terrace: 2x2 boxes on ring cells clear of the core, two or three of them.
// A unit sits on ring cells of footprint, none of them touching the core wall (a unit set against the core would hide it).
const ringOk = (x, z) => has(x, z) && top(x, z) === 12 && Object.values(DIRS).every(([dx, dz]) => !has(x + dx, z + dz) || top(x + dx, z + dz) <= 12);
const units = [];
for (let z = 0; z < SIZE[2] - 1 && units.length < 3; z++) for (let x = 0; x < SIZE[0] - 1 && units.length < 3; x++) {
  const sq = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!sq.every(([a, b]) => ringOk(a, b))) continue;
  if (units.some(([ux, uz]) => Math.abs(ux - x) < 4 && Math.abs(uz - z) < 4)) continue;
  units.push([x, z]);
  for (const [a, b] of sq) { g.set(a, 12, b, "stone_bricks"); g.set(a, 13, b, "stone_bricks"); g.set(a, 14, b, "iron_block"); }
}

// Penthouse: a 6 x 4 box of core cells nearest the core's centre, walls to y 18, a glazed band at 17, a roof at 19.
const core = cells.filter(([x, z]) => top(x, z) === 16);
const cx = core.reduce((s, [x]) => s + x, 0) / core.length, cz = core.reduce((s, [, z]) => s + z, 0) / core.length;
let best = null;
for (let z0 = 1; z0 + 4 < SIZE[2] - 1; z0++) for (let x0 = 1; x0 + 6 < SIZE[0] - 1; x0++) {
  let ok = true;
  for (let z = z0 - 1; z <= z0 + 4 && ok; z++) for (let x = x0 - 1; x <= x0 + 6 && ok; x++) ok = has(x, z) && top(x, z) === 16;
  if (!ok) continue;
  const d = Math.hypot(x0 + 3 - cx, z0 + 2 - cz);
  if (!best || d < best.d) best = { x0, z0, d };
}
if (best) {
  const { x0, z0 } = best;
  for (let z = z0; z <= z0 + 3; z++) for (let x = x0; x <= x0 + 5; x++) {
    const edgeCell = x === x0 || x === x0 + 5 || z === z0 || z === z0 + 3;
    for (let y = 16; y <= 18; y++) {
      if (!edgeCell) continue;
      const glass = y === 17 && (x + z) % 2 === 1 && !((x === x0 || x === x0 + 5) && (z === z0 || z === z0 + 3));
      g.set(x, y, z, glass ? "light_blue_stained_glass" : "calcite");
    }
    g.set(x, 19, z, "smooth_quartz");
  }
  g.set(x0 + 2, 20, z0 + 1, "lightning_rod");
}

const out = `${HERE}/DC87513.nbt`;
const info = g.save(out);
console.log(`built ${out}: ${info.blocks} blocks, ${info.palette} palette entries, core ${core.length} cells, penthouse ${best ? "placed" : "none"}, units ${units.length}`);
