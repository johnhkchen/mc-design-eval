import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833624";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 10 x 37 footprint, about 11 blocks to the roof: a two-storey, mid-century
// Taipei commercial block. Cream painted concrete with a stone plinth, a
// shopfront at ground level, aluminium-framed windows with a storey line,
// a cornice and parapet, and a small rooftop plant box.
const W = 10, H = 23, D = 37;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const WALL = "white_concrete";
const TRIM = "smooth_quartz";
const SILL = "light_gray_concrete";
const PLINTH = "polished_andesite";
const FOUND = "stone_bricks";
const FLOOR = "smooth_stone";
const GLASS = "light_blue_stained_glass_pane";
const LIGHT = "glowstone";

// Panes connect along the wall they sit in.
// nsFace = window in a north/south face (wall runs along x, so connect east/west).
const pane = (nsFace) => nsFace
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const doorProps = (half) => ({
  facing: "north", half, hinge: "left", open: "false", powered: "false",
});

for (const [x, z, gr] of cells) {
  // Foundation fill up to the cell's ground, then the ground-floor slab.
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);
  put(x, gr, z, FLOOR);
  put(x, gr + 5, z, FLOOR);   // first/second floor slab
  put(x, gr + 10, z, FLOOR);  // roof slab

  const N = !has(x, z - 1), S = !has(x, z + 1);
  const Wm = !has(x - 1, z), E = !has(x + 1, z);

  // Interior cells: floors only, plus a rooftop plant box in the middle.
  if (!(N || S || Wm || E)) {
    if (x >= 3 && x <= 6 && z >= 15 && z <= 21) {
      put(x, gr + 11, z, "gray_concrete");
    }
    continue;
  }

  // Assign the facade face. Corners take the north/south face.
  let face, u, uMax;
  if (N) { face = "n"; u = x; uMax = W - 1; }
  else if (S) { face = "s"; u = x; uMax = W - 1; }
  else if (Wm) { face = "w"; u = z; uMax = D - 1; }
  else { face = "e"; u = z; uMax = D - 1; }

  const nsFace = face === "n" || face === "s";
  const pier = u % 3 === 0 || u === 0 || u === uMax;

  // Inward neighbour, used to place lights behind glass.
  const inward = {
    n: [x, z + 1], s: [x, z - 1], w: [x + 1, z], e: [x - 1, z],
  }[face];

  // Storey rows relative to the cell's ground.
  put(x, gr + 1, z, PLINTH);                                  // shop kickboard
  put(x, gr + 2, z, pier ? WALL : pane(nsFace) && GLASS, pier ? undefined : pane(nsFace));
  put(x, gr + 3, z, pier ? WALL : GLASS, pier ? undefined : pane(nsFace));
  put(x, gr + 4, z, TRIM);                                    // fascia
  put(x, gr + 5, z, TRIM);                                    // storey line
  put(x, gr + 6, z, pier ? WALL : SILL);                      // upper sill
  put(x, gr + 7, z, pier ? WALL : GLASS, pier ? undefined : pane(nsFace));
  put(x, gr + 8, z, pier ? WALL : GLASS, pier ? undefined : pane(nsFace));
  put(x, gr + 9, z, TRIM);                                    // lintel band
  put(x, gr + 10, z, TRIM);                                   // cornice
  put(x, gr + 11, z, WALL);                                   // parapet

  // Warm light behind some glass, on the inward cell (an air gap behind the pane).
  if (!pier && has(inward[0], inward[1])) {
    const [ix, iz] = inward;
    if (u % 6 === 2) put(ix, gr + 2, iz, LIGHT);
    if (u % 6 === 4) put(ix, gr + 7, iz, LIGHT);
  }

  // Entrance: a single door on the north face, in the shopfront.
  if (face === "n" && z === 0 && x === 4) {
    put(x, gr + 1, z, "oak_door", doorProps("lower"));
    put(x, gr + 2, z, "oak_door", doorProps("upper"));
    put(x, gr + 3, z, WALL);
  }
}

g.save(`${DIR}/${ID}.nbt`);
