// Way 827744435, Mt Eden / Eden Terrace: a 1930s stripped-classical commercial block, four storeys at its north
// (the lidar's 14-17 block roofs, a tower on the podium) stepping down to two and one toward the south and east.
// Basalt-look plinth on the downhill side, plaster (smooth quartz) walls with white-concrete piers and quoins,
// polished-andesite string courses and a cornice, dark-oak shopfront piers on the ground floor, a door on the south
// (street) face under a lantern. Each storey is a one-block shell with an air gap behind the glass and a floor slab.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_827744435.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const cell = new Map();
for (const [x, z, g, r] of cells) cell.set(key(x, z), { x, z, g, r });
const at = (x, z) => cell.get(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// 1. the lidar roof, median-smoothed over the 3x3 footprint neighbourhood, snapped to four flat tiers
const median = (a) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)];
for (const c of cell.values()) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(c.x + dx, c.z + dz); if (n) vals.push(n.r); }
  c.rs = median(vals);
  c.T = c.rs >= 14 ? 18 : c.rs >= 10 ? 14 : c.rs >= 7 ? 10 : 6;      // four, three, two, one storey(s)
}
// 2. a shell cell is on the outside: a footprint edge, or the taller side of a step down (its wall closes the lower roof);
// everything else is interior, so each shell is one block thick with air behind its glass
for (const c of cell.values()) c.shell = DIRS.some(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.T < c.T; });
const exteriorDirs = (c) => DIRS.filter(([dx, dz]) => !at(c.x + dx, c.z + dz));

// the street entrance: a ground-1 cell on the south edge, under a lantern
const ENTRANCE = at(11, 20);

const g = new Voxels([19, 30, 21]);
const WALLS = new Set(["smooth_quartz", "white_concrete", "dark_oak_planks", "polished_andesite", "smooth_stone", "stone_bricks"]);
const glass = [];        // window panes, connected in a pass at the end
const lights = [];       // warm lights behind the glass, placed after the shell so no column overwrites them
const recesses = [];     // air cells behind windows where the wall is two blocks thick

function shellBlock(c, y) {
  const row = y % 4, s = Math.floor(y / 4);
  const ext = exteriorDirs(c);
  if (ENTRANCE === c && c.g === 1 && y === 1) return ["dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }];
  if (ENTRANCE === c && c.g === 1 && y === 2) return ["dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }];
  if (ENTRANCE === c && c.g === 1 && y === 3) return ["lantern", { hanging: "true", waterlogged: "false" }];
  if (row === 0 || y === c.T - 2) return ["polished_andesite", null];   // string course, cornice
  if (y === c.T - 1) return ["smooth_quartz", null];                      // coping
  if (ext.length >= 2) return ["white_concrete", null];                   // quoins
  if (ext.length === 0 || row === 3) return ["smooth_quartz", null];      // transom, stepped face, or no street face
  const [dx, dz] = ext[0];
  if ((dx ? c.z : c.x) % 3 === 0) return [s === 0 ? "dark_oak_planks" : "white_concrete", null];   // piers
  const inward = at(c.x - dx, c.z - dz);
  if (!inward) return ["smooth_quartz", null];
  // a step wall behind the glass is opened as a one-cell recess (only where it has no street face, so no new openings)
  if (inward.shell) { if (exteriorDirs(inward).length) return ["smooth_quartz", null]; recesses.push([inward.x, y, inward.z]); }
  const lit = (c.x * 7 + c.z * 3 + s * 5) % 4 === 0;
  if (lit) lights.push(s === 0 ? { x: inward.x, y: 3, z: inward.z, b: "lantern", st: { hanging: "true", waterlogged: "false" } }
                               : { x: inward.x, y: 4 * s + 1, z: inward.z, b: "glowstone", st: null });
  glass.push([c.x, y, c.z]);
  return ["glass_pane", {}];
}

for (const c of cell.values()) {
  for (let y = 0; y < c.T; y++) {
    if (y < c.g) { g.set(c.x, y, c.z, "stone_bricks"); continue; }          // foundation under the sloping ground
    if (!c.shell) {                                                          // interior: floor slabs, a flat roof, air between
      if (y === c.T - 1) g.set(c.x, y, c.z, "smooth_stone");
      else if (y % 4 === 0) g.set(c.x, y, c.z, "smooth_quartz");
      continue;
    }
    const [b, st] = shellBlock(c, y);
    g.set(c.x, y, c.z, b, st ?? undefined);
  }
}
for (const [x, y, z] of recesses) g.set(x, y, z, "air");
for (const l of lights) g.set(l.x, l.y, l.z, l.b, l.st ?? undefined);

// roof plant on the tower: a few concrete boxes on the interior roof
for (const c of cell.values()) if (c.T === 18 && !c.shell && c.x % 4 === 1 && c.z % 4 === 1) {
  g.set(c.x, 18, c.z, "light_gray_concrete"); g.set(c.x, 19, c.z, "light_gray_concrete");
}

// panes join their neighbours: glass or wall material on each side
const joins = (b) => b === "glass_pane" || WALLS.has(b);
for (const [x, y, z] of glass) {
  const side = (dx, dz) => { const n = g.get(x + dx, y, z + dz); return n && joins(n.block.replace("minecraft:", "")) ? "true" : "false"; };
  g.set(x, y, z, "glass_pane", { east: side(1, 0), west: side(-1, 0), north: side(0, -1), south: side(0, 1), waterlogged: "false" });
}

const info = g.save(`${DIR}/way_827744435.nbt`);
console.log(`way_827744435: ${info.blocks} blocks, ${info.palette} palette entries, ${glass.length} panes, ${lights.length} lights`);
