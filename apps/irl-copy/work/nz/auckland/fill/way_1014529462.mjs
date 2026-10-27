import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1014529462.cells.json", "utf8"));

// A 1930s interwar commercial block: stone plinth, shopfront at street level, cream plaster upper storeys with red
// terracotta string courses and a cornice, a flat roof behind a stone parapet, and a plant box on the roof.
// Lidar roofs read 14-15 blocks; smoothed to one flat tier at 15 (blocks run to y 14).
const TOP = 15, DECK = TOP - 1;
const FLOORS = [6, 10];          // upper floor plates (absolute); the ground floor sits on each cell's own ground
const DOOR = [5, 9];             // south face (+z), the downhill side where the ground is at y 0

const fp = new Map(); for (const [x, z, gr] of cells) fp.set(`${x},${z}`, gr);
const has = (x, z) => fp.has(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

const g = new Voxels([10, 28, 10]);
const glass = [], lights = [];

for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");          // foundation up to the cell's ground
  const out = exposed(x, z);
  if (!out.length) {                                                     // inside: floor slabs only, no rooms
    for (const f of [gr, ...FLOORS, DECK]) g.set(x, f, z, "smooth_stone");
    continue;
  }
  const [ox, oz] = out[0], corner = out.length > 1;
  const along = ox ? z : x;                                              // position along the face
  const pier = corner || along % 3 === 0;                                // corners and every third bay
  const door = x === DOOR[0] && z === DOOR[1];
  for (let y = gr; y < TOP; y++) {
    if (door && y < 2) { g.set(x, y, z, "dark_oak_door", { facing: "south", half: y ? "upper" : "lower", hinge: "left", open: "false", powered: "false" }); continue; }
    if (door && y === 2) { g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
    if (y === DECK) { g.set(x, y, z, "stone_bricks"); continue; }
    if (y === gr) { g.set(x, y, z, "polished_andesite"); continue; }     // base course
    if (y < FLOORS[0]) {                                                  // ground floor shopfront
      if (y === gr + 3) g.set(x, y, z, "dark_oak_planks");                // fascia
      else if (y < gr + 3) {
        if (pier) g.set(x, y, z, "quartz_pillar");
        else { g.set(x, y, z, "glass_pane"); glass.push([x, y, z, ox, oz]); }
      } else g.set(x, y, z, pier ? "quartz_pillar" : "smooth_quartz");
      continue;
    }
    const F = FLOORS.filter(f => f <= y).pop();                          // upper storeys
    if (y === F || y === F + 3) { g.set(x, y, z, "red_terracotta"); continue; }   // string course, spandrel, cornice
    if (pier) g.set(x, y, z, "quartz_pillar");
    else { g.set(x, y, z, "glass_pane"); glass.push([x, y, z, ox, oz]); }
  }
  // warm light just inside some windows
  for (let y = gr; y < TOP; y++) {
    if (!pier && out.length === 1 && (y > gr && y < gr + 3 || y > FLOORS[0] && y < FLOORS[0] + 3 || y > FLOORS[1] && y < FLOORS[1] + 3) && (along + y) % 3 === 0) {
      const ix = x - ox, iz = z - oz;
      if (has(ix, iz) && !exposed(ix, iz).length) lights.push([ix, y, iz]);
    }
  }
}

for (const [x, y, z] of lights) g.set(x, y, z, "glowstone");

// Glass panes: connect along the face to whatever is beside them.
for (const [x, y, z, ox, oz] of glass) {
  const solid = (dx, dz) => (g.val(x + dx, y, z + dz) ? "true" : "false");
  const st = { north: "false", south: "false", east: "false", west: "false" };
  if (ox) { st.north = solid(0, -1); st.south = solid(0, 1); }
  else { st.east = solid(1, 0); st.west = solid(-1, 0); }
  g.set(x, y, z, "glass_pane", st);
}

// Roof plant box on the deck, two blocks tall.
for (const x of [4, 5]) for (const z of [3, 4]) for (const y of [TOP, TOP + 1]) g.set(x, y, z, "stone_bricks");

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1014529462.nbt");
