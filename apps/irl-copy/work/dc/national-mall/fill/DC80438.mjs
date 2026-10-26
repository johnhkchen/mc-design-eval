// DC80438: a Federal-era (1930s-50s) brick office block with limestone bands, a granite plinth and a
// calcite cornice, on the Mall's south side. Lidar roof 7 / 8 / 9 gives three flat tiers: the north wing (7),
// the main block (8), and a south-east tower (9). Heights are absolute, so a cell on the downhill side (ground 0)
// shows extra storeys below the ground-storey windows, and the uphill cells (ground 2) start on the granite plinth.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC80438.cells.json", "utf8"));
const FOUND = "polished_granite", BAND = "calcite", BRICK = "bricks", CORNICE = "smooth_quartz", FLOOR = "smooth_stone";
const ROOF = "stone_bricks", PANE = "light_blue_stained_glass_pane", LAMP = "glowstone", LAMP2 = "shroomlight";

const ground = new Map();                                    // "x,z" -> lidar ground
for (const [x, z, g] of cells) ground.set(`${x},${z}`, g);
const inFp = (x, z) => ground.has(`${x},${z}`);
const exterior = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inFp(x + dx, z + dz));
// Tiers from the lidar roof, smoothed: the north wing (z 0..3) is 7, the south-east corner (x 5..6, z 6..10) is 9, the rest 8
const tier = (x, z) => (z <= 3 ? 7 : x >= 5 && z >= 6 ? 9 : 8);

const g = new Voxels([7, 9, 11]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (const [x, z] of cells) {
  const gr = ground.get(`${x},${z}`), top = tier(x, z) - 1, ex = exterior(x, z), u = x + z;
  for (let y = 0; y <= top; y++) {
    let b = null;
    if (y < gr) b = FOUND;                                   // foundation up to the lidar ground
    else if (y === top) b = ex ? CORNICE : ROOF;             // parapet and roof deck
    else if (!ex) { if (y % 2 === 0) b = FLOOR; }            // interior: a floor slab per storey, air between (the gap behind the glass)
    else if (y === 0) b = FOUND;                             // exposed plinth on the downhill side
    else if (y % 2 === 0) b = BAND;                          // storey lines: limestone sills and lintels
    else b = u % 2 === 1 ? PANE : BRICK;                     // window bays on odd u, brick piers between
    if (b) put(x, y, z, b);
  }
}

// Entrance on the south face (x 3): a two-high iron door with calcite jambs and a smooth-stone canopy, the hall cell
// cleared out of the ground floor slab so the door opens into air
put(3, 2, 10, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(3, 3, 10, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.setCellAt(g.at(3, 2, 9), 0);
for (const [x, y] of [[2, 2], [2, 3], [4, 2], [4, 3]]) put(x, y, 10, BAND);
for (const x of [2, 3, 4]) put(x, 4, 10, CORNICE);

// Warm light behind some panes (in the air gap), one glowstone and a few shroomlights for colour
const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
let lamps = 0;
for (const [x, z] of cells) {
  if (!exterior(x, z)) continue;
  for (let y = 3; y <= tier(x, z) - 3; y += 2) {
    const u = x + z;
    if (u % 2 !== 1 || (u + y) % 8 !== 0) continue;
    for (const [dx, dz] of dirs) {
      const nx = x + dx, nz = z + dz;
      if (!inFp(nx, nz) || exterior(nx, nz) || g.val(nx, y, nz) !== 0) continue;
      put(nx, y, nz, (u + y) % 16 === 0 ? LAMP : LAMP2); lamps++; break;
    }
  }
}

// Panes join their neighbours: a side is open only where the neighbour is air (so the glass reads as a grid, not stubs)
const sideOf = { east: [1, 0], west: [-1, 0], north: [0, -1], south: [0, 1] };
for (const [x, z] of cells) {
  const top = tier(x, z) - 1;
  for (let y = 1; y <= top; y++) {
    const cur = g.get(x, y, z);
    if (!cur || cur.block !== PANE) continue;
    const state = { waterlogged: "false" };
    for (const [side, [dx, dz]] of Object.entries(sideOf)) state[side] = g.get(x + dx, y, z + dz) ? "true" : "false";
    put(x, y, z, PANE, state);
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC80438.nbt";
const r = g.save(out);
console.log(JSON.stringify({ ...r, lamps }));
