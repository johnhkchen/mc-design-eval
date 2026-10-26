// 1811 S St NW, Washington DC 20009: a three-storey red-brick walk-up apartment (c. 1910s), limestone trim, flat roof
// behind a cornice, a 2x2 stair/lift bulkhead on the east side. Front (street) is the z=0 side.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC73109.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const g = new Voxels([8, 19, 13]);
const fp = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFp = (x, z) => fp.has(`${x},${z}`);

const WALL = "bricks", TRIM = "calcite", BASE = "stone_bricks", FLOOR = "smooth_stone", ROOF = "stone";
const PANE_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a north/south face
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on an east/west face
const PARAPET_Y = 6;

for (const [x, z, ground, roof] of cells) {
  const N = !inFp(x, z - 1), S = !inFp(x, z + 1), W = !inFp(x - 1, z), E = !inFp(x + 1, z);
  const ring = N || S || W || E;
  const corner = (N || S) && (W || E);
  // a window on each face's middle-spaced cells; corners and the cells between are piers
  let win = null;
  if (ring && !corner) {
    if (N || S) win = x % 2 === 0 ? { block: "glass_pane", state: PANE_NS } : null;
    else win = z % 2 === 0 ? { block: "glass_pane", state: PANE_EW } : null;
  }
  const front = N && z === 0;
  const door = front && x === 3;

  // foundation below the ground line (no-op where the ground is y 0)
  for (let y = 0; y < ground; y++) g.set(x, y, z, FLOOR);

  // ring cells are walls to the parapet; interior cells are air with floor slabs at y0, y3, y5 (the roof deck)
  const top = ring ? PARAPET_Y : roof - 1;
  for (let y = ground; y <= top; y++) {
    if (!ring) {
      if (y === 0 || y === 3) g.set(x, y, z, FLOOR);
      else if (y === 5) g.set(x, y, z, ROOF);
      else if (y === 6) g.set(x, y, z, WALL);            // stair/lift bulkhead on the roof-7 cells
      continue;
    }
    if (y === PARAPET_Y) { g.set(x, y, z, TRIM); continue; }
    if (y === 0) { g.set(x, y, z, BASE); continue; }
    if (y === 3) { g.set(x, y, z, TRIM); continue; }
    if (y === 5) { g.set(x, y, z, WALL); continue; }      // brick frieze under the calcite cornice cap
    if (door && (y === 1 || y === 2)) {
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if ((y === 1 || y === 2 || y === 4) && win) { g.set(x, y, z, win.block, win.state); continue; }
    g.set(x, y, z, WALL);                                 // piers, and the spandrels above and below the windows
  }
  // the door's lintel course (y3) stays calcite: the canopy over the entry
  if (door) g.set(x, 3, z, TRIM);
}

// warm light behind the glass: lanterns stand on the floor slabs, one glowstone behind a west window
for (const [x, y, z] of [[2, 1, 1], [4, 1, 1], [2, 4, 1], [4, 4, 1]]) g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
g.set(2, 1, 6, "glowstone");

// roof equipment on the flat deck, on interior cells (air above the deck at y5)
g.set(2, 6, 6, "iron_block");
g.set(4, 6, 10, "iron_block");

const out = g.save(`${DIR}/DC73109.nbt`);
console.log(`DC73109.nbt: ${out.blocks} blocks, palette ${out.palette}`);
