// Way 293020923, Mt Eden lower slope, Auckland. A one-storey red-brick commercial block of the 1920s-30s: basalt-grey
// stone base and foundation, a stone string course and a cornice parapet, a timber shopfront with a recessed door on the
// street (north) front, sash-style glass with warm lights behind it, and a flat roof with a plant box. Built on the
// footprint only: each column is solid from y 0 to its ground, the lidar roof height sets the wall top, and the
// roof is the same tier across the block, so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020923.cells.json", "utf8"));
const g = new Voxels([16, 20, 10]);

const FOUNDATION = "cobblestone", BASE = "stone_bricks", WALL = "bricks", CAP = "smooth_stone", ROOF = "stone";
const FLOOR = "spruce_planks", SHOP = "dark_oak_planks", GLASS = "glass_pane", FRONT = "north";
const DOOR = { x: 12, z: 0 };                            // the street-front cell that takes the entrance
const SOLID = new Set([FOUNDATION, BASE, WALL, CAP, ROOF, FLOOR, SHOP]);

const k2 = (x, z) => `${x},${z}`, k3 = (x, y, z) => `${x},${y},${z}`;
const cellAt = new Map(cells.map(([x, z, ground, roof]) => [k2(x, z), { x, z, ground, roof }]));
const inFp = (x, z) => cellAt.has(k2(x, z));
const SIDES = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const openSides = (x, z) => SIDES.filter(([, dx, dz]) => !inFp(x + dx, z + dz));

const placed = new Map();                                // "x,y,z" -> block, for the pane joins below
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); placed.set(k3(x, y, z), block); };

const glassCells = [], lights = [];
for (const { x, z, ground: gr, roof: R } of cellAt.values()) {
  for (let y = 0; y < gr; y++) put(x, y, z, FOUNDATION);
  const faces = openSides(x, z), wallCell = faces.length > 0;
  const string = gr + 3 <= R - 2 ? gr + 3 : -1;           // a stone storey line, where the wall is tall enough
  if (!wallCell) {                                         // inside: a timber floor per storey, a roof over
    put(x, gr, z, FLOOR);
    if (string > 0) put(x, string, z, FLOOR);
    put(x, R - 1, z, ROOF);
    continue;
  }
  put(x, gr, z, BASE);                                     // base course
  for (let y = gr + 1; y <= R - 2; y++) put(x, y, z, WALL);
  if (string > 0) put(x, string, z, BASE);
  put(x, R - 1, z, CAP);                                   // cornice / parapet cap

  const winRows = [];
  for (let y = gr + 1; y <= R - 2; y++) if (y !== string) winRows.push(y);
  for (const [name, dx, dz] of faces) {
    const u = dx ? z : x;                                  // position along this face
    const bay = faces.length === 1 && u % 2 === 1;         // a window bay; piers at even bays and corners
    if (name === FRONT && x === DOOR.x && z === DOOR.z) {  // the entrance: a two-high door, in the ground band
      put(x, gr + 1, z, "oak_door", { facing: FRONT, half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "oak_door", { facing: FRONT, half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    for (const y of winRows) {
      const ground = name === FRONT && y <= gr + 2;         // the shopfront band
      if (bay) {
        put(x, y, z, GLASS);
        glassCells.push({ x, y, z });
        const inx = x - dx, inz = z - dz;                  // the room behind the glass
        if (u % 4 === 1 && !wallCell_(inx, inz)) lights.push({ x: inx, y, z: inz, block: ground ? "shroomlight" : "glowstone" });
      } else if (ground && faces.length === 1) {
        put(x, y, z, SHOP);                                // timber shopfront piers
      }
    }
  }
}

// a cell is a wall if it has any open side; used for the room behind the glass
function wallCell_(x, z) { return !inFp(x, z) || openSides(x, z).length > 0; }

for (const { x, y, z, block } of lights) if (inFp(x, z) && !placed.has(k3(x, y, z))) put(x, y, z, block);

// the roof plant: an HVAC pair with a lantern, on the tall tier's roof
for (const [x, z] of [[6, 4], [7, 4], [9, 4], [10, 4]]) {
  const c = cellAt.get(k2(x, z));
  if (!c || c.roof !== 7 || wallCell_(x, z)) continue;
  put(x, 7, z, x === 6 || x === 7 ? "iron_block" : "light_gray_concrete");
}
put(6, 8, 4, "lantern", { hanging: "false", waterlogged: "false" });

// glass panes join the panes and the solid wall beside them, as a window run does
for (const { x, y, z } of glassCells) {
  const join = (dx, dz) => { const b = placed.get(k3(x + dx, y, z + dz)); return b === GLASS || SOLID.has(b) ? "true" : "false"; };
  put(x, y, z, GLASS, { north: join(0, -1), south: join(0, 1), west: join(-1, 0), east: join(1, 0), waterlogged: "false" });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020923.nbt");
