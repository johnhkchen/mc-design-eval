// Way 1095572182, Mt Eden / Eden Terrace: a two-storey brick shop-top block of the 1900s-1920s, on a basalt plinth,
// with a polished-andesite cornice and a parapet. Footprint 8 x 10; lidar roof 10 blocks above the flat ground (two
// storeys of 4 blocks, the cornice at y8, the parapet at y9). The street is the z-min face: a glazed shopfront under a
// dark-oak fascia, the entrance on the cell at x3 z0.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1095572182.cells.json`, "utf8"));   // [x, z, ground, roof]

const g = new Voxels([8, 23, 10]);
const fp = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const has = (x, z) => fp.has(`${x},${z}`);
const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };      // n = z-min = the street face

// each footprint cell: the sides that face outside the footprint, and its place on the wall
const info = new Map();
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  const exposed = Object.keys(DIRS).filter((d) => !has(x + DIRS[d][0], z + DIRS[d][1]));
  const xFace = exposed.some((d) => d === "w" || d === "e");
  const zFace = exposed.some((d) => d === "n" || d === "s");
  info.set(key, { x, z, ...c, exposed, corner: xFace && zFace, perim: exposed.length > 0,
    along: xFace && !zFace ? z : x, front: exposed.includes("n") });
}

// glass panes connect along their wall, so a run of panes reads as one window
const pane = (c) => ({ waterlogged: "false", ...(c.exposed.some((d) => d === "w" || d === "e")
  ? { east: "false", west: "false", north: "true", south: "true" }
  : { east: "true", west: "true", north: "false", south: "false" }) });
// window bays alternate along the wall; a corner is always a pier
const isWindow = (c) => c.perim && !c.corner && (c.front ? c.along % 2 === 0 : c.along % 2 === 1);
const isDoor = (c) => c.x === 3 && c.z === 0;

for (const c of info.values()) {
  const { x, z } = c;
  // plinth and the floor slabs (interior); the roof deck sits at y8 over the interior
  if (!c.perim) { g.set(x, 0, z, "stone_bricks"); g.set(x, 4, z, "smooth_stone"); g.set(x, 8, z, "smooth_stone"); }
  if (!c.perim) continue;

  g.set(x, 0, z, "stone_bricks");                                             // basalt plinth course
  g.set(x, 4, z, "stone_bricks");                                             // storey string course
  g.set(x, 8, z, "polished_andesite");                                        // cornice
  g.set(x, 9, z, "stone_brick_slab", { type: "top", waterlogged: "false" });  // parapet coping

  if (isDoor(c)) {                                                            // street entrance, timber door
    const door = { facing: "south", hinge: "left", open: "false", powered: "false" };
    g.set(x, 1, z, "dark_oak_door", { ...door, half: "lower" });
    g.set(x, 2, z, "dark_oak_door", { ...door, half: "upper" });
    g.set(x, 3, z, "dark_oak_planks");                                        // fascia over the door
  } else if (c.front && c.along % 2 === 0) {                                  // shopfront bay: glass under a timber fascia
    g.set(x, 1, z, "glass_pane", pane(c)); g.set(x, 2, z, "glass_pane", pane(c));
    g.set(x, 3, z, "dark_oak_planks");
  } else if (isWindow(c)) {
    g.set(x, 1, z, "glass_pane", pane(c)); g.set(x, 2, z, "glass_pane", pane(c));
    g.set(x, 3, z, "stone_bricks");                                           // lintel
  } else {
    for (const y of [1, 2, 3]) g.set(x, y, z, "bricks");                      // pier
  }
  // upper storey: a window grid, with a lintel over each bay and a brick pier between them
  if (isWindow(c)) {
    g.set(x, 5, z, "glass_pane", pane(c)); g.set(x, 6, z, "glass_pane", pane(c));
    g.set(x, 7, z, "stone_bricks");
  } else {
    for (const y of [5, 6, 7]) g.set(x, y, z, "bricks");
  }
}

// the interior: air behind the glass, a warm light behind every fourth window, and hanging lanterns in the rooms
for (const c of info.values()) {
  if (!c.perim || c.corner || isDoor(c) || c.exposed.length !== 1) continue;
  if (!isWindow(c) || c.along % 4 !== 1) continue;
  const [dx, dz] = DIRS[c.exposed[0]];
  const ix = c.x - dx, iz = c.z - dz;                                         // the cell just inside the glass
  if (!has(ix, iz) || info.get(`${ix},${iz}`).perim) continue;
  g.set(ix, 2, iz, "glowstone"); g.set(ix, 6, iz, "glowstone");
}
for (const c of info.values()) {
  if (c.perim || (c.x + c.z) % 3 !== 0) continue;
  g.set(c.x, 3, c.z, "lantern", { hanging: "true", waterlogged: "false" });   // ground-floor ceiling lamp
  g.set(c.x, 7, c.z, "lantern", { hanging: "true", waterlogged: "false" });   // upper-floor ceiling lamp
}

// roof equipment: one brick chimney stack on the roof deck
g.set(4, 9, 6, "bricks"); g.set(4, 10, 6, "bricks");
g.set(4, 11, 6, "stone_brick_slab", { type: "top", waterlogged: "false" });

g.save(`${DIR}/way_1095572182.nbt`);
