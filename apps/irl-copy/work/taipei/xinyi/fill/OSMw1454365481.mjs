import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey post-war concrete shophouse: stone plinth, white-concrete frame,
// a glazed shopfront on the street (z=0) face, aluminium-look window bands above,
// a parapet with a coping line, and a small rooftop plant room.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1454365481";
const W = 18, H = 23, D = 9;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const grid = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => grid.has(key(x, z));
const groundAt = (x, z) => grid.get(key(x, z));

// Edge tests: a cell is on the outer skin if any side has no neighbour.
const edgeN = (x, z) => !has(x, z - 1); // street face (z = min)
const edgeS = (x, z) => !has(x, z + 1);
const edgeW = (x, z) => !has(x - 1, z);
const edgeE = (x, z) => !has(x + 1, z);
const isEdge = (x, z) => edgeN(x, z) || edgeS(x, z) || edgeW(x, z) || edgeE(x, z);

const set = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);

  // Foundation: solid from y 0 up to the cell's own ground.
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  // Floor slabs: ground floor at gr, upper floor at gr+5, roof deck at gr+10.
  set(x, gr, z, edge ? "stone_bricks" : "smooth_stone");
  set(x, gr + 5, z, "smooth_stone");
  set(x, gr + 10, z, "smooth_stone");

  if (!edge) {
    // Plant room on the roof: a 6x3 block of concrete with a cap band.
    if (x >= 6 && x <= 11 && z >= 3 && z <= 5) {
      set(x, gr + 11, z, "light_gray_concrete");
      set(x, gr + 12, z, "light_gray_concrete");
      set(x, gr + 13, z, "stone_bricks");
    }
    continue;
  }

  // Perimeter walls: pick the dominant face (street first).
  const front = edgeN(x, z);
  const back = !front && edgeS(x, z);
  const west = !front && !back && edgeW(x, z);
  const along = front || back ? x : z; // position along the face
  const winCol = along % 2 === 1 && along > 0 && along < (front || back ? W - 1 : D - 1);

  // Ground storey (gr+1 .. gr+4)
  if (front) {
    const isDoor = x === 9;
    if (isDoor) {
      set(x, gr + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      set(x, gr + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      set(x, gr + 3, z, "glass_pane");
    } else if (x % 3 === 0) {
      // Concrete pier between shop bays
      for (let y = gr + 1; y <= gr + 3; y++) set(x, y, z, "white_concrete");
    } else {
      // Shop glazing with a stone sill
      set(x, gr + 1, z, "stone_bricks");
      for (let y = gr + 2; y <= gr + 3; y++) set(x, y, z, "glass_pane");
    }
    // Fascia / lintel over the shopfront
    set(x, gr + 4, z, "smooth_stone");
  } else {
    // Side and rear ground storey: concrete with a few small openings
    for (let y = gr + 1; y <= gr + 4; y++) {
      set(x, y, z, winCol && y >= gr + 2 && y <= gr + 3 ? "glass_pane" : "white_concrete");
    }
  }

  // Upper storey (gr+6 .. gr+9): window bands with concrete mullions and lintel
  for (let y = gr + 6; y <= gr + 9; y++) {
    const isLintel = y === gr + 9;
    const isWindowRow = y >= gr + 6 && y <= gr + 8;
    set(x, y, z, !isLintel && isWindowRow && winCol ? "glass_pane" : "white_concrete");
  }

  // Parapet and coping
  set(x, gr + 10, z, "white_concrete");
  set(x, gr + 11, z, "smooth_stone");

  // Warm light behind a subset of upper-floor windows (inside the air gap)
  if (winCol && along % 4 === 1) {
    const inZ = front ? 1 : back ? D - 2 : null;
    const inX = west ? 1 : edgeE(x, z) ? W - 2 : null;
    if (inZ !== null && has(x, inZ)) set(x, gr + 7, inZ, "glowstone");
    if (inX !== null && has(inX, z)) set(inX, gr + 7, z, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
