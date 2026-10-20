import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. 22 x 13 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey, 1960s-70s Taipei commercial block: stone-bricked
// base, white rendered concrete frame with a window grid, a red awning and
// shopfront on the street (north) face, flat roof with a parapet and
// rooftop plant. Two storeys of 5 blocks, storey lines at +5 and +10.

const cells = JSON.parse(
  readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538401862.cells.json", "utf8")
);
const W = 22, H = 23, D = 13;
const g = new Voxels([W, H, D]);
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538401862.nbt";

const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inF = (x, z) => ground.has(key(x, z));
const isEdge = (x, z) => !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!isEdge(x, z)) {
    // Interior: no air-free mass, just floor slabs per storey and roof slab.
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "light_gray_concrete");
    // Rooftop plant block in the middle of the roof.
    if (x >= 4 && x <= 7 && z >= 3 && z <= 5) put(x, gr + 11, z, "light_gray_concrete");
    continue;
  }

  // Edge (exterior shell).
  const northFace = !inF(x, z - 1);
  const southFace = !inF(x, z + 1);
  const faceNS = northFace || southFace;
  const pos = faceNS ? x : z;          // position along the facade
  const win = pos % 3 !== 0;           // pillars every 3 blocks
  const front = northFace;             // street (north) face

  put(x, gr, z, "stone_bricks");       // base course
  put(x, gr + 5, z, "smooth_stone");   // storey line
  put(x, gr + 10, z, "smooth_stone");  // cornice
  put(x, gr + 11, z, "light_gray_concrete"); // parapet

  for (const base of [0, 5]) {
    const storey = base === 0 ? 1 : 2;
    // Storey wall: offsets 1..4 relative to gr, storey 2 at 6..9.
    const o = (n) => gr + (base === 0 ? n : n + 5);

    // Sill row (o=1 or o=6)
    if (!(front && storey === 1)) {
      put(x, o(1), z, win ? "smooth_stone" : "white_concrete");
    }
    // Glass rows
    if (win) {
      put(x, o(2), z, "light_blue_stained_glass_pane");
      put(x, o(3), z, "light_blue_stained_glass_pane");
    } else {
      put(x, o(2), z, "white_concrete");
      put(x, o(3), z, "white_concrete");
    }
    // Lintel row
    put(x, o(4), z, "white_concrete");
  }

  // Warm lights in some upper windows (shroomlight panels).
  if (win && (x + z) % 5 === 0) put(x, gr + 7, z, "shroomlight");

  // Street face: shopfront, door, awning, hanging lantern.
  if (front) {
    // Ground-floor shopfront glass rows o=1..3 for window columns.
    if (win) {
      put(x, gr + 1, z, "light_blue_stained_glass_pane");
      put(x, gr + 2, z, (pos % 4 === 1) ? "glowstone" : "light_blue_stained_glass_pane");
      put(x, gr + 3, z, "light_blue_stained_glass_pane");
    } else {
      put(x, gr + 1, z, "white_concrete");
    }
    // Entrance on the street face at x = 11.
    if (x === 11) {
      put(x, gr + 1, z, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
    // Red awning band across the whole street face at o=4.
    put(x, gr + 4, z, "red_concrete");
  }
}

g.save(OUT);
