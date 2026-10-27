import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 813759343: a two-storey brick commercial block of the 1920s, the shopfront-over-flat type of the Mt Eden and
// Eden Terrace road frontages. Stone plinth and string course, brick walls with glass sash windows, a shopfront of
// glass and dark-oak fascia on the street (south, +z) face with one door, a dentilled cornice and a brick parapet.
// Flat roof membrane with a small plant box. Warm light: lanterns behind the shop glass, glowstone behind some sashes.
// Storeys: ground y 0-3 (y 0 is the plinth and floor), first floor slab y 4, upper storey y 5-6, roof membrane y 7,
// parapet y 8 (the lidar roof is 9 above y 0). Every column is solid from y 0 up, so nothing floats.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_813759343.cells.json", "utf8"));
const g = new Voxels([8, 22, 8]);

const key = (x, z) => `${x},${z}`;
const plan = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { x, z, ground, roof }]));
const inside = (x, z) => plan.has(key(x, z));
const DIR = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// the faces a footprint cell shows to the outside; a cell with two or more is a corner
const faces = (x, z) => Object.keys(DIR).filter((d) => !inside(x + DIR[d][0], z + DIR[d][1]));

const DOOR = [4, 6];                  // on the street face, one cell in from the corner
const placed = new Map();             // "x,y,z" -> block name, so pane connections can see their neighbours
const panes = [];
const put = (x, y, z, block, state) => { placed.set(`${x},${y},${z}`, block); g.set(x, y, z, block, state); };

for (const { x, z, roof } of plan.values()) {
  const top = roof - 1;               // the parapet course
  const out = faces(x, z);
  const shell = out.length > 0;
  const street = out.includes("S");
  const bay = (x + z) % 2 === 0;      // alternate bays on the side and back walls
  const plant = x >= 2 && x <= 3 && z >= 2 && z <= 3;

  put(x, 0, z, "stone_bricks");       // plinth and ground floor slab
  put(x, 4, z, "smooth_stone");       // first-floor slab and string course
  if (shell) put(x, 7, z, bay ? "stone_bricks" : "chiseled_stone_bricks");   // dentilled cornice
  else put(x, 7, z, "gray_concrete"); // roof membrane over the upper storey
  if (shell) put(x, top, z, "bricks");                                       // parapet
  else if (plant) put(x, top, z, "stone_bricks");                            // roof plant box

  if (!shell) continue;               // interior: air, with the gap behind each window
  for (const y of [1, 2, 3, 5, 6]) {
    if (y === 3) { put(x, y, z, street ? "dark_oak_planks" : "bricks"); continue; }   // shopfront fascia
    if (y <= 2 && street && [x, z].join() === DOOR.join()) {                 // the door, lower and upper halves
      const half = y === 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y <= 2) {
      if (street || bay) { put(x, y, z, "glass_pane"); panes.push([x, y, z]); }
      else put(x, y, z, "bricks");
      continue;
    }
    if (y >= 5 && bay) { put(x, y, z, "glass_pane"); panes.push([x, y, z]); }    // upper sashes
    else if (y >= 5) put(x, y, z, "bricks");
  }
}

// glass panes join the walls and panes beside them, so they read as sashes, not posts
for (const [x, y, z] of panes) {
  const state = { waterlogged: "false" };
  for (const d of Object.keys(DIR)) {
    const nb = placed.get(`${x + DIR[d][0]},${y},${z + DIR[d][1]}`);
    const name = { N: "north", S: "south", W: "west", E: "east" }[d];
    state[name] = nb && nb !== "dark_oak_door" ? "true" : "false";
  }
  g.set(x, y, z, "glass_pane", state);
}

// warm light: a lantern on the floor behind the shop glass, a glowstone behind some upper sashes (the air gap stays)
for (const { x, z } of plan.values()) {
  const out = faces(x, z);
  if (!out.length || out.length > 1) continue;          // plain wall cells only
  const d = out[0];
  const [dx, dz] = DIR[d];
  const ix = x - dx, iz = z - dz;                       // the cell just inside this face
  if (!inside(ix, iz) || faces(ix, iz).length) continue;
  if (d === "S" && (x + z) % 2 === 0 && placed.get(`${x},1,${z}`) === "glass_pane") put(ix, 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  else if (d !== "S" && (x + 2 * z) % 4 === 0 && placed.get(`${x},5,${z}`) === "glass_pane") put(ix, 5, iz, "glowstone");
}

console.log(g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_813759343.nbt"));
