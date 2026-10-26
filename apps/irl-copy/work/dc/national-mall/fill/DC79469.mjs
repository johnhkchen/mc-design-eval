// 1930s stripped-classical federal office on the Mall's south-east flank: calcite (limestone) piers and cornice, a
// polished-andesite ground course, a granite base, and a bronze-trimmed main door. Massing from the lidar roof (cells
// file): a 8-block core on the stepped middle, 7-block main wings, a 6-block range and 5-block low annexes at the ends.
// Each roof reading is smoothed to one of four flat tiers. Two office storeys over a ground storey, with floor plates
// at y 3 and 6 solid across the footprint, so every tier stands on the course below and nothing floats. Room rows
// between the plates are air behind the glass (lanterns and glowstone in some bays), and the roof deck is closed.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC79469.cells.json`, "utf8"));

// lidar roof -> one flat tier top (3 is a lone notch at the corner, folded into the 5-block annex tier)
const tierTop = (r) => (r >= 8 ? 8 : r === 7 ? 7 : r === 6 ? 6 : 5);
const foot = new Map();
for (const [x, z, g, r] of cells) foot.set(`${x},${z}`, { g, R: tierTop(r) });
const built = (x, z, y) => { const c = foot.get(`${x},${z}`); return !!c && y < c.R; };
const DIRS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];
// faces at height y with no building behind them: outside the footprint, or the neighbour is a lower tier
const exteriorDirs = (x, z, y) => DIRS.filter(([dx, dz]) => !built(x + dx, z + dz, y));

const STONE = "calcite", TRIM = "smooth_quartz", BASE = "polished_andesite", GROUND = "stone_bricks";
const GLASS = "glass_pane", ROOF = "smooth_stone", CAP = "smooth_stone_slab";
const PLATES = [3, 6];                                   // floor slabs and string courses, solid across the footprint
const ROOMS = [1, 2, 4, 5];                              // glazed rows: ground storey (1 sill, 2 sash), upper storey (4, 5)
// the main entrance on the north face of the ground storey, dark-oak doors in place of two glazed bays
const DOOR = { x: 4, z: 3, facing: "north" };

const vox = new Map();                                    // "x,y,z" -> { b, s }: every solid or glazed block, air is absent
const put = (x, y, z, b, s) => vox.set(`${x},${y},${z}`, { b, s });
const has = (x, y, z) => vox.has(`${x},${y},${z}`);

for (const [key, { g: ground, R }] of foot) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < R; y++) {
    if (y < ground) { put(x, y, z, GROUND); continue; }             // foundation up to the lidar ground
    if (y === 0) { put(x, y, z, GROUND); continue; }                 // granite base course
    if (y === R - 1) { put(x, y, z, exteriorDirs(x, z, y).length ? TRIM : ROOF); continue; }   // cornice or roof deck
    if (PLATES.includes(y)) { put(x, y, z, TRIM); continue; }
    if (!ROOMS.includes(y)) { put(x, y, z, STONE); continue; }
    const ext = exteriorDirs(x, z, y);
    if (!ext.length) continue;                                       // interior room: air behind the glass
    if (x === DOOR.x && z === DOOR.z && (y === 1 || y === 2)) {
      put(x, y, z, "dark_oak_door", { facing: DOOR.facing, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const [dx] = ext[0];                                             // the first open face carries the bay
    const t = dx !== 0 ? z : x;                                      // position along the face
    if (t % 3 === 0 || (ext.length > 1 && (x + z) % 2 === 0)) put(x, y, z, STONE);   // piers between the bays, and corners
    else if (y === 1) put(x, y, z, BASE);                            // ground-storey sill
    else put(x, y, z, GLASS);
  }
  // a parapet cap on every outer edge of the tier (sits on the cornice)
  if (exteriorDirs(x, z, R - 1).length) put(x, R, z, CAP, { type: "bottom", waterlogged: "false" });
}

// warm light in the air gap behind some glass: a lantern on the ground floor, glowstone on the upper floor
for (const [k, { b }] of [...vox]) {
  if (b !== GLASS) continue;
  const [x, y, z] = k.split(",").map(Number);
  const ext = exteriorDirs(x, z, y);
  if (!ext.length || (x + 2 * z + y) % 6 !== 0) continue;
  const [dx, dz] = ext[0];
  const ix = x - dx, iz = z - dz;                                    // the cell behind the glass
  if (foot.has(`${ix},${iz}`) && !has(ix, y, iz)) {
    if (y === 1) put(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
    else put(ix, y, iz, "glowstone");
  }
}

// one brick chimney on the roof of the core's first interior cell (the 8-block tier)
for (const [key, c] of foot) {
  const [x, z] = key.split(",").map(Number);
  if (c.R === 8 && !exteriorDirs(x, z, 7).length) { put(x, 8, z, "bricks"); put(x, 9, z, "bricks"); break; }
}

// glass panes connect to whatever stands beside them in the same row
const PANE = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
for (const [k, cell] of vox) {
  if (cell.b !== GLASS) continue;
  const [x, y, z] = k.split(",").map(Number);
  cell.s = Object.fromEntries([...Object.entries(PANE).map(([d, [dx, dz]]) => [d, has(x + dx, y, z + dz) ? "true" : "false"]), ["waterlogged", "false"]]);
}

const g = new Voxels([11, 20, 11]);
for (const [k, { b, s }] of vox) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, b, s);
}
const out = g.save(`${DIR}/DC79469.nbt`);
console.log(`DC79469.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
