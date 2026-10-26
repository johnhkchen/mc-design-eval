import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 555 11th St NW, Commercial-Office-Large: a 1960s-70s office block in pale stone, the lidar roof read as clean tiers.
// Roof records 5-7 become a 6-block podium, 8-11 a 9-block low wing, 15-17 a 16-block wing, 19-20 the 19-block body,
// and 21 the central 21-block core. Storeys are 3-block modules measured from each cell's ground (a string course on
// the base row, then two rows of glass between piers), so the storey lines step with the site slope. Walls are one
// block thick with an air gap behind the glass and a floor slab per storey; a 2-block ceiling caps each cell under its
// roof deck, and a cornice and a parapet ring finish the tiers. The street front is z = 0: a recessed double-door entrance.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC68837.cells.json`, "utf8")); // [x, z, ground, roof] per footprint cell

const X = 20, Y = 33, Z = 46;
const g = new Voxels([X, Y, Z]);

const FOUND = "stone_bricks";        // foundation below each cell's ground
const FIELD = "smooth_quartz";       // walls, piers, string courses, floor slabs, ceilings
const BASE = "polished_granite";     // base course at grade and the cornice cap
const ROOF = "gray_concrete";        // roof membrane over the interior
const EQUIP = "light_gray_concrete"; // roof plant on the core
const GLASS = "light_blue_stained_glass_pane";

// the lidar roof record smoothed into five flat tiers
const tierOf = (r) => (r <= 7 ? 6 : r <= 11 ? 9 : r <= 17 ? 16 : r <= 20 ? 19 : 21);

const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(`${x},${z}`, { g: ground, T: tierOf(roof) });
const at = (x, z) => cell.get(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// a wall face is exposed where the neighbour is outside the footprint or stands lower than this height
const exposedDirs = (x, y, z) => DIRS.filter(([dx, dz]) => { const n = at(x + dx, z + dz); return !n || y >= n.T; });

// glass panes join along their wall: east-west on a z face, north-south on an x face
const pane = (dx) => (dx !== 0 ? { north: "true", south: "true", east: "false", west: "false" } : { east: "true", west: "true", north: "false", south: "false" });
const door = (half, hinge) => ({ facing: "north", half, hinge, open: "false", powered: "false" });

const placed = []; // interior lanterns, set after the shell so nothing overwrites them
for (const [x, z, ground, roof] of cells) {
  const { g: gr, T } = at(x, z);
  for (let y = 0; y < T; y++) {
    if (y < gr) { g.set(x, y, z, FOUND); continue; }
    const rel = y - gr;
    const ex = exposedDirs(x, y, z);
    const shell = ex.length > 0;
    // roof: a cornice ring on the perimeter, membrane inside
    if (y === T - 1) { g.set(x, y, z, shell ? BASE : ROOF); continue; }
    // the ceiling under the roof is solid so the roof stands on something
    if (y === T - 2) { g.set(x, y, z, FIELD); continue; }
    // base course at grade on the perimeter; floor slab per storey everywhere (it carries the walls and the lanterns)
    if (rel === 0) { g.set(x, y, z, shell ? BASE : FIELD); continue; }
    if (rel % 3 === 0) { g.set(x, y, z, FIELD); continue; }
    if (!shell) continue; // interior: air behind the glass
    if (ex.length > 1) { g.set(x, y, z, FIELD); continue; } // corner pier
    const [dx, dz] = ex[0];
    const along = dz !== 0 ? x : z;
    // the street front (z = 0): recessed entrance, granite pilasters, two doors, and a lintel slab above
    if (dz === -1 && x >= 5 && x <= 8 && rel <= 2) {
      if (rel === 1 || rel === 2) {
        if (x === 6 || x === 7) g.set(x, y, z, "dark_oak_door", door(rel === 1 ? "lower" : "upper", x === 6 ? "left" : "right"));
        else g.set(x, y, z, BASE);
      }
      continue;
    }
    if (along % 2 === 0) { g.set(x, y, z, FIELD); continue; } // piers every second bay
    g.set(x, y, z, GLASS, pane(dx));
    // warm light: some bottom-row windows get a lantern on the slab just inside
    if (rel % 3 === 1 && (x * 31 + z * 17 + rel * 7) % 9 === 0) placed.push([x - dx, y, z - dz]);
  }
}
for (const [x, y, z] of placed) {
  const c = at(x, z);
  if (c && y >= c.g && y < c.T - 2) g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// roof plant on the 21-block core: a penthouse box with a smaller unit on top
for (let x = 5; x <= 8; x++) for (let z = 12; z <= 17; z++) if (at(x, z)?.T === 21) g.set(x, 21, z, EQUIP);
for (let x = 6; x <= 7; x++) for (let z = 13; z <= 15; z++) if (at(x, z)?.T === 21) g.set(x, 22, z, ROOF);

g.save(`${DIR}/DC68837.nbt`);
