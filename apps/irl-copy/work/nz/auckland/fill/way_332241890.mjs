// A 1920s single-storey brick shop with a cream plaster parapet, on the Mt Eden / Newton main-street type:
// stone plinth, brick walls, a glazed shopfront with a dark fascia, a cornice and parapet, a lower lean-to wing
// at the east tip, one entrance on the north (street) front, and a roof deck with an air-conditioning unit.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241890.cells.json", "utf8"));
const W = 12, H = 19, D = 10;
const C = new Map();                                       // "x,z" -> { ground, roof }
for (const [x, z, ground, roof] of cells) C.set(`${x},${z}`, { ground, roof });
const inF = (x, z) => C.has(`${x},${z}`);
const DIR = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const outFaces = (x, z) => Object.keys(DIR).filter((d) => !inF(x + DIR[d][0], z + DIR[d][1]));

// the lidar's roof tiers, smoothed: 5s and 6s are one parapet, 4s are the east lean-to wing
const tier = (r) => (r >= 5 ? 6 : 4);

const P = new Map();                                       // "x,y,z" -> { block, state } (the final picture, carved last)
const put = (x, y, z, block, state) => P.set(`${x},${y},${z}`, { block, state });
const carve = (x, y, z) => P.set(`${x},${y},${z}`, null);
const pane = (face) => (face === "north" || face === "south"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

let lanterns = 0;
for (const [k, { ground: G, roof: r }] of C) {
  const [x, z] = k.split(",").map(Number);
  const R = tier(r), faces = outFaces(x, z);
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");          // plinth under the ground cells
  if (!faces.length) {                                                 // interior: solid to the roof deck
    for (let y = G; y < R - 1; y++) put(x, y, z, "bricks");
    put(x, R - 1, z, "smooth_stone");                                  // roof deck, under the parapet
    continue;
  }
  for (let y = G; y <= R; y++) {
    if (y === R) put(x, y, z, "white_concrete");                       // plaster parapet cap
    else if (y === R - 1) put(x, y, z, "smooth_stone");                // cornice course
    else if (y === G) put(x, y, z, "stone_bricks");                    // base course
    else if (y <= G + 2) put(x, y, z, "bricks");                       // shopfront band, filled by windows below
    else put(x, y, z, "bricks");
  }
  // the shopfront: glass with a dark fascia above it on the street front
  for (const face of faces) {
    const [dx, dz] = DIR[face];
    const idx = face === "north" || face === "south" ? x : z;
    const inner = [x - dx, z - dz];
    const entrance = face === "north" && z === 0 && x === 8;
    if (entrance) {
      put(x, G + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, G + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      if (inF(...inner)) for (let y = G + 1; y <= G + 2; y++) carve(inner[0], y, inner[1]);   // a small vestibule
      continue;
    }
    if (face === "north" && z === 0) {
      put(x, G + 3, z, "dark_oak_planks");                              // fascia over the shopfront
    }
    if (idx % 3 === 0) continue;                                        // every third cell is a pier
    for (let y = G + 1; y <= G + 2; y++) {
      if (y >= R - 1) continue;
      put(x, y, z, "glass_pane", pane(face));
      if (inF(...inner)) carve(inner[0], y, inner[1]);                 // air behind the glass
    }
    if (inF(...inner) && lanterns < 4 && (x + z) % 4 === 0) {
      put(inner[0], G + 1, inner[1], "lantern", { hanging: "false", waterlogged: "false" });
      lanterns++;
    }
  }
}
// the roof: an air-conditioning unit on the deck, standing on the solid interior
put(6, 6, 3, "iron_block"); put(4, 6, 6, "iron_block");

const g = new Voxels([W, H, D]);
for (const [key, v] of P) {
  if (!v) continue;
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241890.nbt");
console.log(JSON.stringify(out));
