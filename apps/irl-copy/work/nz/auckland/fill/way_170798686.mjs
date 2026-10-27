// ACS House, Auckland CBD: a 1980s concrete-frame office block on a plinth. Pale precast spandrels and mullions,
// tinted glass in a 1-block shell with air behind it, a shopfront ground storey, and three massing tiers (36 / 40 / 44)
// read from the lidar roof heights, with a plant box on the tower. Every storey is 4 blocks; every column is solid
// from 0 to the floor line at 4, so the module stands on the slope and nothing hangs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_170798686.cells.json`, "utf8"));
const W = 23, D = 33, H = 58;

const foot = new Map();                                       // "x,z" -> { ground, roof }
for (const [x, z, ground, roof] of cells) foot.set(`${x},${z}`, { ground, roof });
const inFoot = (x, z) => foot.has(`${x},${z}`);
// lidar roof heights rounded to storey lines: 36 (lower wings), 40 (mid), 44 (tower core)
const tierOf = (x, z) => 4 * Math.floor((foot.get(`${x},${z}`).roof + 2) / 4);
const open = (x, z, dx, dz) => !inFoot(x + dx, z + dz) || tierOf(x + dx, z + dz) !== tierOf(x, z);
const isShell = (x, z) => open(x, z, 1, 0) || open(x, z, -1, 0) || open(x, z, 0, 1) || open(x, z, 0, -1);
const isCorner = (x, z) => (open(x, z, 1, 0) || open(x, z, -1, 0)) && (open(x, z, 0, 1) || open(x, z, 0, -1));

const plan = new Map();                                       // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => plan.get(`${x},${y},${z}`);

const ENTRANCE = { x: 13, z: 0 };                             // the north face's middle bay, facing the street
const glassPane = "light_blue_stained_glass_pane";
const frame = "white_concrete";

const footCells = cells.map(([x, z]) => [x, z]);
for (const [x, z] of footCells) {
  const T = tierOf(x, z), shell = isShell(x, z), corner = isCorner(x, z);
  // plinth: solid from 0 to the ground floor's slab; the top course is the base band on the shell
  for (let y = 0; y < 4; y++) put(x, y, z, y === 3 && shell ? "stone_bricks" : "polished_andesite");
  for (let k = 1; 4 * k < T; k++) {
    const s = 4 * k, ground = k === 1;
    // floor slab (the storey line on the shell, a light slab inside): it stands on the storey below
    if (shell) put(x, s, z, ground ? "stone_bricks" : frame);
    else put(x, s, z, "light_gray_concrete");
    if (shell) {
      // glazing rows: pale mullion every third block, panes between; the ground storey is a shopfront
      for (const y of [s + 1, s + 2]) {
        if (corner || (x + z) % 3 === 0) put(x, y, z, frame);
        else put(x, y, z, glassPane);
      }
      put(x, s + 3, z, frame);                                // spandrel at the storey's top
    } else if (s + 3 === T - 1) {
      put(x, s + 3, z, "smooth_stone");                       // roof membrane over the top storey (light, so it reads as roof, not a pit)
    }
  }
  if (shell) put(x, T, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });   // coping
}

// entrance: a half-block step from the plinth into the lobby, a pair of doors and a pale lintel
const { x: ex, z: ez } = ENTRANCE;
put(ex, 4, ez, "stone_brick_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });
put(ex, 5, ez, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(ex, 6, ez, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
put(ex, 7, ez, frame);

// warm light: some glazing has a glowstone just inside it, standing on the floor slab
let lights = 0;
for (const [x, z] of footCells) {
  if (!isShell(x, z) || isCorner(x, z)) continue;
  const T = tierOf(x, z);
  for (let k = 1; 4 * k < T; k++) {
    if ((x * 5 + z * 3 + k * 7) % 7 !== 0 || (x + z) % 3 === 0 || (x === ex && z === ez)) continue;
    if (!at(x, 4 * k + 1, z) || at(x, 4 * k + 1, z).block !== glassPane) continue;
    const inward = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => [x + dx, z + dz])
      .find(([nx, nz]) => inFoot(nx, nz) && !isShell(nx, nz) && tierOf(nx, nz) === T);
    if (!inward || at(inward[0], 4 * k + 1, inward[1])) continue;
    put(inward[0], 4 * k + 1, inward[1], "glowstone");
    lights++;
  }
}

// roof plant: a box on the tower core's roof, two blocks high (the roof reads 46 with it), inside the tier with margin
const tower = footCells.filter(([x, z]) => tierOf(x, z) === 44);
const fitsBox = (x0, z0, bw, bd) => {
  for (let x = x0 - 1; x <= x0 + bw; x++) for (let z = z0 - 1; z <= z0 + bd; z++)
    if (!inFoot(x, z) || tierOf(x, z) !== 44 || isShell(x, z)) return false;
  return true;
};
const cx = tower.reduce((a, [x]) => a + x, 0) / tower.length, cz = tower.reduce((a, [, z]) => a + z, 0) / tower.length;
let box = null;
for (let x0 = 0; x0 < W && !box; x0++) for (let z0 = 0; z0 < D && !box; z0++) {
  if (!fitsBox(x0, z0, 5, 3)) continue;
  if (!box || Math.hypot(x0 + 2 - cx, z0 + 1 - cz) < Math.hypot(box.x0 + 2 - cx, box.z0 + 1 - cz)) box = { x0, z0 };
}
if (box) {
  for (let x = box.x0; x < box.x0 + 5; x++) for (let z = box.z0; z < box.z0 + 3; z++) {
    const edge = x === box.x0 || x === box.x0 + 4 || z === box.z0 || z === box.z0 + 2;
    const mid = (x === box.x0 + 2 && (z === box.z0 || z === box.z0 + 2)) || (z === box.z0 + 1 && (x === box.x0 || x === box.x0 + 4));
    for (const y of [44, 45]) {
      if (y === 45) put(x, y, z, "light_gray_concrete");
      else if (edge) put(x, y, z, mid ? "iron_bars" : "light_gray_concrete");
    }
  }
}

// the glass panes connect to the frame and to each other, as vanilla panes do
const connects = (x, y, z) => { const p = at(x, y, z); return !!p && (p.block === glassPane || p.block === frame); };
for (const [key, p] of plan) {
  if (p.block !== glassPane) continue;
  const [x, y, z] = key.split(",").map(Number);
  p.state = { north: String(connects(x, y, z - 1)), south: String(connects(x, y, z + 1)),
    east: String(connects(x + 1, y, z)), west: String(connects(x - 1, y, z)) };
}

const g = new Voxels([W, H, D]);
for (const [key, { block, state }] of plan) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = g.save(`${DIR}/way_170798686.nbt`);
console.log(JSON.stringify({ ...out, towerCells: tower.length, lights, plantBox: box }));
