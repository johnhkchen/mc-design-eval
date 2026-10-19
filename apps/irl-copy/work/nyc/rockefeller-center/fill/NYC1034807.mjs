// 20 West 55th Street, 1987: a commercial office tower on a granite base. A twelve-storey curtain wall (blue-green glass,
// light grey spandrels, iron mullions) rises from a granite lobby and a one-storey shopfront along the south street. A
// seven-storey wing stands on the east end, the top two storeys step back from the north face onto a terrace with a rail,
// and a small mechanical penthouse sits on the roof. Lanterns hang in some windows. The lidar roofs are read per class
// (tower, wing, shopfront) so each tier is flat; floors sit on the 3-block storey grid from y 1.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034807.cells.json`, "utf8"));   // [x, z, ground, roof] per cell

const X = 14, Y = 40, Z = 5;
const g = new Voxels([X, Y, Z]);
const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { x, z, ground, roof }]));

// Massing class from the lidar roof: a tower (roof >= 30), a wing (15 to 29), or a one-storey shopfront / lobby.
const cls = (c) => (c.roof >= 30 ? "tower" : c.roof >= 15 ? "wing" : "low");
// Last solid y of each cell. Tower storeys run to y 37 (roof 38, as the lidar reads it); the north row steps down to a
// terrace at y 31; the wing tops out at 22; the shopfront at 4.
const topOf = (x, z) => {
  const c = cell.get(`${x},${z}`);
  const k = cls(c);
  if (k === "tower") return z === 0 ? 31 : 37;
  return k === "wing" ? 22 : 4;
};
const DIRS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];
// The faces of a cell at height y that touch the outside, or touch a neighbour lower than y.
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => {
  const n = `${x + dx},${z + dz}`;
  return !cell.has(n) || y > topOf(x + dx, z + dz);
}).map(([, , name]) => name);
// A pane on a north or south face runs east-west; on an east or west face it runs north-south.
const panel = (ns) => (ns ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
// Blue-green 1987 glass, with an occasional darker or cyan pane so the grid does not read as a single colour.
const glass = (x, y, z) => ((x * 2 + y) % 7 === 0 ? "cyan_stained_glass_pane" : (x + y + z) % 5 === 0 ? "gray_stained_glass_pane" : "light_blue_stained_glass_pane");

// 1. Solid body: plinth at y 0, foundation down to each cell's ground, then the storeys and roofs.
for (const c of cell.values()) {
  const { x, z, ground } = c;
  const k = cls(c), top = topOf(x, z);
  for (let y = 0; y <= top; y++) {
    if (y === 0 || y < ground) { g.set(x, y, z, "stone_bricks"); continue; }
    const ex = exposed(x, z, y);
    const slab = y % 3 === 1;                                    // storey lines: floors, spandrels and cornices
    if (y === top) {                                             // roof surface, terrace or cornice
      if (ex.length === 0) g.set(x, y, z, k === "low" ? "light_blue_stained_glass" : "gray_concrete");   // shopfront skylight, roof deck
      else if (z === 0 && k === "tower") g.set(x, y, z, "smooth_stone");                                  // north terrace paving
      else g.set(x, y, z, k === "low" ? "smooth_stone" : "polished_andesite");
      continue;
    }
    if (ex.length === 0) { if (slab) g.set(x, y, z, "smooth_stone"); continue; }   // interior: floor slabs, air between
    if (ex.length >= 2) { g.set(x, y, z, "polished_andesite"); continue; }        // corner piers, full height
    if (slab) { g.set(x, y, z, k === "low" || y === 1 ? "polished_andesite" : "light_gray_concrete"); continue; }   // granite base, spandrels
    const ns = ex.includes("north") || ex.includes("south");
    const u = ns ? x : z;                                          // mullions on a 2-block module
    if (u % 2 === 0) g.set(x, y, z, "iron_bars", panel(ns));
    else g.set(x, y, z, glass(x, y, z), panel(ns));
  }
}

// 2. Terrace rail on the north edge (the stepped-back top two storeys stand behind it).
for (let x = 0; x < X; x++) if (cell.has(`${x},0`) && cls(cell.get(`${x},0`)) === "tower") g.set(x, 32, 0, "iron_bars", panel(true));

// 3. Rooftop mechanical penthouse, reading as the lidar's 39 on the east end of the roof.
for (const [x, z] of [[10, 1], [11, 1], [10, 2], [11, 2]]) {
  g.set(x, 38, z, "light_gray_concrete");
  g.set(x, 39, z, "polished_andesite");
}

// 4. Lobby entrance on the south street: a door in the shopfront, granite lintel above, glass either side.
g.set(4, 1, 4, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(4, 2, 4, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(4, 3, 4, "polished_andesite");

// 5. Warm lights: lanterns hang from the floor slab above, in the air gap behind the north glass, in some bays.
for (let x = 1; x <= 11; x++) for (let y = 3; y <= 31; y += 3) {
  const c = cell.get(`${x},1`);
  if (!c || cls(c) !== "tower" || y + 1 > topOf(x, 1)) continue;
  if ((x + y / 3) % 4 === 1) g.set(x, y, 1, "lantern", { hanging: "true", waterlogged: "false" });
}

const { blocks, palette } = g.save(`${DIR}/NYC1034807.nbt`);
console.log(`saved NYC1034807.nbt: ${blocks} blocks, ${palette} palette entries`);
