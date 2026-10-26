// 1150 12th St NW, Washington DC: a 1920s-30s red-brick apartment block. A four-storey podium (lidar roof 12-13) with a
// five-storey wing and a single-storey-higher core (14-16) stepping up from it. Storeys are 3 blocks: a limestone string
// course on each floor line (y % 3 == 0), two rows of glass panes between them, brick piers, a limestone parapet at the
// roof line, and a storefront with a recessed door on the west (street) face. The interior is one-block shell with an
// air gap behind the glass and a floor slab per storey; some windows have a warm lamp behind the pane.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${FILL}/DC79126.cells.json`, "utf8"));

const X = 9, Y = 28, Z = 24;
const STOREY = 3;

// lidar roof -> a clean storey line: 12-13 is the 4-storey podium, 14-15 the 5-storey tier, 16 the core cap
const snap = (r) => (r <= 13 ? 12 : r <= 15 ? 15 : 16);
const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(`${x},${z}`, { ground, top: snap(roof) });
const topAt = (x, z) => cell.get(`${x},${z}`)?.top ?? 0;

// horizontal faces of the solid at (x, y, z) that look onto air: outside the footprint, or a neighbour that stops below y
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];          // west, east, north, south
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => topAt(x + dx, z + dz) <= y);
const inside = (x, y, z) => cell.has(`${x},${z}`) && y >= (cell.get(`${x},${z}`).ground) && y < topAt(x, z);
const warm = (x, y, z) => ((x * 7 + y * 5 + z * 3) % 6) === 0;   // a deterministic sixth of the windows have a lamp

const g = new Voxels([X, Y, Z]);

for (const [key, { ground, top }] of cell) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");        // foundation to the lowest ground
  for (let y = ground; y < top; y++) {
    const ex = exposed(x, y, z);
    if (!ex.length) {                                                       // inside: deck, floor slab, or air gap
      if (y === top - 1) g.set(x, y, z, "gray_concrete");
      else if (y % STOREY === 0) g.set(x, y, z, "stone");
      continue;
    }
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }              // base course
    if (ex.length >= 2) { g.set(x, y, z, "smooth_quartz"); continue; }      // limestone quoins at the corners
    if (y % STOREY === 0) { g.set(x, y, z, "smooth_quartz"); continue; }   // storey string course
    const [dx, dz] = ex[0];
    const along = dx !== 0 ? z : x;
    if (along % 3 === 0) {                                                  // brick pier between the bays
      g.set(x, y, z, y < STOREY ? "dark_oak_planks" : "bricks");
      continue;
    }
    const pane = dx !== 0 ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
                          : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
    g.set(x, y, z, "glass_pane", pane);
    // a warm lamp in the air gap just behind the pane
    const ix = x - dx, iz = z - dz;
    if (warm(x, y, z) && inside(ix, y, iz) && !exposed(ix, y, iz).length && y % STOREY !== 0 && y !== top - 1)
      g.set(ix, y, iz, "glowstone");
  }
  // limestone parapet on the outer edge of the roof line
  if (exposed(x, top, z).length) g.set(x, top, z, "smooth_quartz");
}

// the street door in the west face, where the footprint reaches the wall (z 11..13): a jamb each side, the door, a lantern
const DOOR_Z = 12;
for (const y of [1, 2]) { g.set(0, y, DOOR_Z - 1, "smooth_quartz"); g.set(0, y, DOOR_Z + 1, "smooth_quartz"); }
g.set(0, 1, DOOR_Z, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(0, 2, DOOR_Z, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(1, 2, DOOR_Z, "lantern", { hanging: "true", waterlogged: "false" });

// the roof gets a few air-conditioning plant boxes on the 4-storey deck
for (const [x, z] of [[2, 3], [6, 4], [2, 17], [6, 19]]) {
  if (topAt(x, z) === 12 && !exposed(x, 12, z).length) g.set(x, 12, z, "iron_block");
}

const { blocks, palette } = g.save(`${FILL}/DC79126.nbt`);
console.log(`DC79126.nbt: ${blocks} blocks, ${palette} palette entries`);
