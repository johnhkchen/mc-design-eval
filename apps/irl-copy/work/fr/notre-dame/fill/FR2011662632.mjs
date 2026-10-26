// FR2011662632: a two-storey commercial block of cream limestone (Haussmann-style, 1850s) on the lidar footprint, roof flat at 10.
// The lidar roof is one level across the footprint (4-9 at edge cells is noise, smoothed to the 10 tier), so there are no setbacks.
// Storey lines: shopfront rows g+1..4 (g = that cell's ground, so a sloped street sinks the shop, not the upper floor),
// string course at 5, windows 6-7, lintel at 8, cornice (stone-brick half slab) at 9. Each cell is a 1-block facade skin with
// an air gap behind it, a floor slab at its ground and at 5, and a deepslate roof at 9. Two chimney stacks rise from the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR2011662632.cells.json`, "utf8"));

const X = 20, Y = 26, Z = 25;
const TOP = 10;                                    // one roof tier: every lidar roof reads 10 once the edge noise is smoothed
const FLOOR = 5;                                   // the upper floor's line, shared by every cell
const LINTEL_TOP = 8, CORNICE = 9;

const fp = new Map();                              // "x,z" -> g (ground)
for (const [x, z, g] of cells) fp.set(`${x},${z}`, g);
const inF = (x, z) => fp.has(`${x},${z}`);
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];

// the sides a cell's wall faces (a neighbour outside the footprint)
const facesOut = (x, z) => DIRS.filter(([, dx, dz]) => !inF(x + dx, z + dz));

const v = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => v.set(x, y, z, block, state);

// The entrance: the street (north) face, a dark-oak door at x 10, with its fascia above.
const DOOR_X = 10;

for (const [x, z, g] of cells) {
  const out = facesOut(x, z);
  const perimeter = out.length > 0;
  const corner = out.length >= 2 && out.some(([n]) => n === "north" || n === "south") && out.some(([n]) => n === "west" || n === "east");

  // the foundation and the ground-floor slab, on every cell
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");
  put(x, g, z, perimeter ? "stone_bricks" : "smooth_stone");     // the base course on the face, a floor slab inside

  if (!perimeter) {
    if (FLOOR > g) put(x, FLOOR, z, "smooth_stone");              // the upper floor slab
    put(x, CORNICE, z, "deepslate_tiles");                        // roof
    continue;
  }

  // the face's bay index: along x on the north and south faces, along z on the east and west
  const [face] = out[0];
  const u = face === "north" || face === "south" ? x : z;

  for (let y = g + 1; y < TOP; y++) {
    if (y <= 4) {
      // shopfront: piers every 4 bays, glass between, the door at the entrance
      if (face === "north" && z === 0 && x >= DOOR_X - 1 && x <= DOOR_X + 1 && y <= g + 2) {
        if (x === DOOR_X) {
          const half = y === g + 1 ? "lower" : "upper";
          const st = { facing: "north", half, hinge: "left", open: "false", powered: "false" };
          put(x, y, z, "dark_oak_door", st);
        } else put(x, y, z, "dark_oak_planks");
        continue;
      }
      if (face === "north" && z === 0 && x === DOOR_X && y === g + 3) { put(x, y, z, "dark_oak_planks"); continue; }
      put(x, y, z, u % 4 === 0 || corner ? "stone_bricks" : "glass");
    } else if (y === FLOOR) {
      put(x, y, z, "smooth_stone");                               // string course
    } else if (y < LINTEL_TOP) {
      put(x, y, z, corner ? "stone_bricks" : u % 3 === 1 ? "glass" : "calcite");
    } else if (y === LINTEL_TOP) {
      put(x, y, z, "smooth_stone");
    } else if (y === CORNICE) {
      put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// Warm light behind some glass: the cell just inside a lit window, kept air otherwise.
for (const [x, z, g] of cells) {
  const out = facesOut(x, z);
  if (!out.length || out.length > 1) continue;
  const [, dx, dz] = out[0];
  const ix = x - dx, iz = z - dz;
  if (!inF(ix, iz)) continue;
  const u = dx !== 0 ? z : x;
  for (const y of [g + 2, 7]) {
    if (y === FLOOR || y >= CORNICE || y <= g) continue;
    const shop = y <= 4;
    if (shop && u % 8 === 6) put(ix, y, iz, "glowstone");
    if (!shop && y === 7 && u % 6 === 4) put(ix, y, iz, "shroomlight");
  }
}

// Two chimney stacks on the roof, on interior cells.
for (const [cx, cz] of [[8, 11], [14, 16]]) {
  if (!inF(cx, cz)) continue;
  put(cx, 10, cz, "bricks"); put(cx, 11, cz, "bricks");
  put(cx, 12, cz, "brick_slab", { type: "bottom", waterlogged: "false" });
}

v.save(`${DIR}/FR2011662632.nbt`);
console.log(`FR2011662632: ${v.count()} blocks, ${v.palette.length - 1} palette entries`);
