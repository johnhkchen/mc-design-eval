// Way 326735495: a five-storey 1960s-70s concrete block (flat roof, basalt base, pale render, dark glazing), 20 x 30.
// Storeys sit on absolute 4-block lines (y = 4, 8, 12, 16) so the floors run level across a sloping site; the
// foundation fills down to each cell's ground. Windows are glass in the outer layer with one air block behind them.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326735495.cells.json", "utf8"));
const g = new Voxels([20, 33, 30]);

const WALL = "white_concrete", BAND = "light_gray_concrete", ROOF = "gray_concrete", BASE = "stone_bricks";
const GLASS = "gray_stained_glass_pane", DOOR = "dark_oak_door", LAMP = "lantern";

const F = new Map();
for (const [x, z, ground, roof] of cells) F.set(`${x},${z}`, { ground, roof });
const has = (x, z) => F.has(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const perimeter = (x, z) => Object.values(DIRS).some(([dx, dz]) => !has(x + dx, z + dz));

// Storey rows: y 0-2 shopfront, 3 fascia, then per 4-block storey: floor line (0), window rows (1, 2), spandrel (3).
const isWindowRow = (y) => y < 3 || y % 4 === 1 || y % 4 === 2;
const isFloorLine = (y) => y === 3 || (y % 4 === 0 && y >= 4) || y === 19;   // the render-coloured bands

// 1. Solid massing: basalt foundation to each cell's ground, render above, roof deck and cornice on top.
for (const [k, { ground, roof }] of F) {
  const [x, z] = k.split(",").map(Number);
  const edge = perimeter(x, z);
  for (let y = 0; y < roof; y++) {
    if (y < ground) g.set(x, y, z, BASE);
    else if (y === roof - 1) g.set(x, y, z, edge ? BAND : ROOF);
    else g.set(x, y, z, WALL);
  }
  if (edge) g.set(x, roof, z, BAND);                               // parapet on the cornice
}

// 2. Facades: each footprint edge gets its bays (piers every third cell along the face), glazing and lamps.
const panes = [];                                                  // glass cells, with the axis they run along
for (const [k, { ground, roof }] of F) {
  const [x, z] = k.split(",").map(Number);
  for (const [dir, [dx, dz]] of Object.entries(DIRS)) {
    if (has(x + dx, z + dz)) continue;                             // not an outside face
    const u = dx ? z : x;                                          // position along the face: bays repeat on it
    const ix = x - dx, iz = z - dz;                                // the cell just inside the face (the air gap)
    const axis = dz ? "x" : "z";
    const pier = u % 3 === 0;
    for (let y = ground; y < roof; y++) {
      if (!isWindowRow(y)) { g.set(x, y, z, isFloorLine(y) ? BAND : WALL); continue; }   // floor lines run across every bay
      if (y < 3 && pier) { g.set(x, y, z, BASE); continue; }       // shopfront piers in basalt
      if (pier) continue;                                          // upper piers stay render
      g.set(ix, y, iz, "air");                                     // air gap behind the glass
      panes.push({ x, y, z, axis });
      if (y % 4 === 2 && (x + z + y) % 5 === 0) g.set(ix, y, iz, LAMP, { hanging: "true", waterlogged: "false" });
    }
  }
}

// The entrance: a dark oak door at street level in the north shopfront, a lit entry hall behind it.
g.set(9, 0, 0, DOOR, { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(9, 1, 0, DOOR, { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(9, 2, 0, BASE);                                              // lintel pier over the door
for (let y = 0; y < 2; y++) g.set(9, y, 1, "air");
g.set(9, 2, 1, LAMP, { hanging: "true", waterlogged: "false" });
g.set(9, 3, 1, BAND);                                              // canopy fascia over the entry

// 3. Glass panes connect to whatever is beside them in their wall, as the game would connect them.
const occupied = (x, y, z) => g.get(x, y, z) !== null;
const flag = (b) => (b ? "true" : "false");
for (const { x, y, z, axis } of panes) {
  const conn = axis === "x"
    ? { east: occupied(x + 1, y, z), west: occupied(x - 1, y, z), north: false, south: false }
    : { north: occupied(x, y, z - 1), south: occupied(x, y, z + 1), east: false, west: false };
  g.set(x, y, z, GLASS, { north: flag(conn.north), east: flag(conn.east), south: flag(conn.south), west: flag(conn.west), waterlogged: "false" });
}

// 4. Roof plant: a service box on the roof deck, with a smaller housing on top.
for (let x = 8; x <= 11; x++) for (let z = 12; z <= 15; z++) if (has(x, z)) g.set(x, 20, z, BAND);
for (let x = 9; x <= 10; x++) for (let z = 13; z <= 14; z++) if (has(x, z)) g.set(x, 21, z, BAND);

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326735495.nbt");
console.log(out);
