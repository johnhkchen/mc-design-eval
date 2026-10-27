import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1930s brick-and-plaster commercial block on a 15 x 8 footprint: stone plinth, red brick walls, cream plaster
// storey bands and a cornice, a dark-oak fascia over the shopfronts on the north (street) face, a door with a hanging
// lantern, glass-paned windows with an air gap and lamps behind them, and the roof snapped to tiers of 11, 12 and 13.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326735494.cells.json", "utf8"));
const g = new Voxels([15, 26, 8]);

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFp = (x, z) => cell.has(`${x},${z}`);
const top = (roof) => (roof >= 13 ? 13 : roof >= 12 ? 12 : 11);
const solid = (x, y, z) => g.get(x, y, z) !== null;

// the exposed sides: out is the outward step, along is the axis the face runs along (its bays count that way)
const FACES = [
  { name: "north", out: [0, -1], along: "x" },
  { name: "south", out: [0, 1], along: "x" },
  { name: "west", out: [-1, 0], along: "z" },
  { name: "east", out: [1, 0], along: "z" },
];

const DOOR = { x: 1, z: 0 };   // third bay of the street face
const windows = [];            // window cells, to open the air gap behind each
const panes = [];              // glass panes, to connect once the walls are in

for (const [x, z, ground, roof] of cells) {
  const T = top(roof);
  const faces = FACES.filter((f) => !inFp(x + f.out[0], z + f.out[1]));
  const face = faces[0];
  const i = face ? (face.along === "x" ? x : z) : 0;
  const corner = faces.length > 1;

  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");   // foundation up to this cell's ground
  for (let y = ground; y < T; y++) {
    const s = Math.floor((y - ground) / 4), r = (y - ground) % 4;
    // corners and every third bay are piers above; the shopfront keeps its glass wider, piers every sixth bay
    const pier = corner || (s === 0 ? i % 6 === 0 : i % 3 === 0);
    if (!face) { g.set(x, y, z, y === T - 1 ? "smooth_stone" : "bricks"); continue; }   // interior: flat roof, solid mass
    if (y === T - 1) { g.set(x, y, z, "smooth_quartz"); continue; }                     // cornice on the parapet
    if (r === 0) { g.set(x, y, z, s === 0 ? "stone_bricks" : "smooth_quartz"); continue; }   // plinth, storey band
    if (r === 3) { g.set(x, y, z, s === 0 ? "dark_oak_planks" : "bricks"); continue; }      // fascia, lintel
    if (pier) { g.set(x, y, z, "bricks"); continue; }
    if (s === 0) { g.set(x, y, z, "glass"); }                                                 // shopfront glass
    else { g.set(x, y, z, "glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" }); panes.push({ x, y, z, along: face.along }); }
    windows.push({ x, y, z, r, s, i, inX: -face.out[0], inZ: -face.out[1] });
  }
}

// the room behind each window: air in its two window rows, with a lamp in some of them
for (const w of windows) {
  const bx = w.x + w.inX, bz = w.z + w.inZ;
  if (!inFp(bx, bz)) continue;
  const lit = w.r === 1 && (w.s === 0 ? w.i % 6 === 2 : (w.i + w.s) % 5 === 0);
  g.set(bx, w.y, bz, lit ? "glowstone" : "air");
}

// the entrance: a door on the street face under the fascia, its lantern hanging in the bay above
const dy = cell.get(`${DOOR.x},${DOOR.z}`).ground;
g.set(DOOR.x, dy, DOOR.z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(DOOR.x, dy + 1, DOOR.z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(DOOR.x, dy + 2, DOOR.z, "lantern", { hanging: "true", waterlogged: "false" });
g.set(DOOR.x, dy + 1, DOOR.z + 1, "glowstone");   // lamp in the hall behind the door

// a parapet-level plant box on the tallest interior tier
for (const [x, z] of [[5, 2], [6, 2], [11, 4], [12, 4]]) g.set(x, 13, z, "light_gray_concrete");

// connect each pane to the solid or glass beside it along its face, never through the depth of the wall
for (const p of panes) {
  const [a, b] = p.along === "x" ? [[p.x - 1, p.z], [p.x + 1, p.z]] : [[p.x, p.z - 1], [p.x, p.z + 1]];
  const ca = String(solid(a[0], p.y, a[1])), cb = String(solid(b[0], p.y, b[1]));
  const state = p.along === "x"
    ? { north: "false", south: "false", east: cb, west: ca, waterlogged: "false" }
    : { north: ca, south: cb, east: "false", west: "false", waterlogged: "false" };
  g.set(p.x, p.y, p.z, "glass_pane", state);
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326735494.nbt";
const { blocks, palette } = g.save(out);
console.log(`way_326735494: ${blocks} blocks, ${palette} palette entries -> ${out}`);
