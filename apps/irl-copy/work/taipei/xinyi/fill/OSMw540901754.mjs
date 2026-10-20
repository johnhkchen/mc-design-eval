import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540901754";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 16 x 11 footprint, two-storey 1970s-80s Taipei shophouse-style block:
// stone plinth, white/light-grey concrete walls, shopfront on the south (street) face,
// glass-and-quartz window bays with piers, flat roof with parapet and a small penthouse.
const W = 16, H = 23, D = 11;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const groundOf = (x, z) => ground.get(`${x},${z}`);

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

const STOREY = 5;          // blocks per storey
const PARAPET_TOP = 11;    // roof about 11 blocks above lowest ground

for (const [x, z, gr] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  const nN = has(x, z - 1), nS = has(x, z + 1), nW = has(x - 1, z), nE = has(x + 1, z);
  const edge = !(nN && nS && nW && nE);

  // floor slabs at ground, storey 1/2 line and roof line (every cell, interior too)
  for (const dy of [0, STOREY, 2 * STOREY]) put(x, gr + dy, z, "light_gray_concrete");

  if (!edge) {
    // interior: only floor slabs, air between; penthouse and parapet handled below
    if (x >= 10 && x <= 12 && z >= 3 && z <= 6) {
      put(x, gr + 2 * STOREY + 1, z, "stone_bricks");
      put(x, gr + 2 * STOREY + 2, z, "stone_bricks");
    }
    continue;
  }

  // which face is this wall cell on? (street = south, z max)
  let face, coord;
  if (!nN) { face = "north"; coord = x; }
  else if (!nS) { face = "south"; coord = x; }
  else if (!nW) { face = "west"; coord = z; }
  else { face = "east"; coord = z; }

  // inward neighbour (for window lights behind the glass)
  const inward = { north: [x, z + 1], south: [x, z - 1], west: [x + 1, z], east: [x - 1, z] }[face];
  const inwardOk = has(inward[0], inward[1]);

  // plinth course
  put(x, gr, z, "stone_bricks");

  // wall body up to the roof slab
  for (let dy = 1; dy < 2 * STOREY; dy++) put(x, gr + dy, z, "white_concrete");

  // pane orientation so glass joins neighbouring glass along the wall
  const paneProps = (face === "north" || face === "south")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  const isPier = coord % 3 === 0;
  const centre = face === "south" ? 7 : -1; // entrance column on the street face

  // ---- storey 1 (y gr+1 .. gr+4) ----
  if (face === "south") {
    // shopfront: glass with concrete piers, quartz sign band at top
    if (x === centre || x === centre + 1) {
      // entrance opening: doors at lower two blocks
      if (x === centre) {
        put(x, gr + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        put(x, gr + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
      } else {
        put(x, gr + 1, z, "glass");
        put(x, gr + 2, z, "glass");
        put(x, gr + 3, z, "glass");
      }
    } else if (isPier) {
      for (let dy = 1; dy <= 3; dy++) put(x, gr + dy, z, "white_concrete");
    } else {
      for (let dy = 1; dy <= 3; dy++) put(x, gr + dy, z, "glass");
    }
    // sign band / lintel over the shopfront
    put(x, gr + 4, z, "smooth_quartz");
  } else {
    // other faces: window bays between concrete piers
    if (isPier) {
      for (let dy = 1; dy <= 4; dy++) put(x, gr + dy, z, "white_concrete");
    } else {
      put(x, gr + 1, z, "smooth_quartz");                       // sill
      for (let dy = 2; dy <= 3; dy++) put(x, gr + dy, z, "glass_pane", paneProps);
      put(x, gr + 4, z, "smooth_quartz");                       // head
      if (inwardOk && coord % 6 === 1) put(inward[0], gr + 2, inward[1], "glowstone");
    }
  }

  // ---- storey 2 (y gr+6 .. gr+9) ----
  if (isPier) {
    for (let dy = 6; dy <= 9; dy++) put(x, gr + dy, z, "white_concrete");
  } else {
    put(x, gr + 6, z, "smooth_quartz");                         // sill
    for (let dy = 7; dy <= 8; dy++) put(x, gr + dy, z, "glass_pane", paneProps);
    put(x, gr + 9, z, "smooth_quartz");                         // head
    if (inwardOk && coord % 6 === 4) put(inward[0], gr + 7, inward[1], "shroomlight");
  }

  // ---- parapet and cap (y gr+11, gr+12) ----
  put(x, gr + PARAPET_TOP, z, "white_concrete");
  put(x, gr + PARAPET_TOP + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
