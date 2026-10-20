import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339253343";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const N = 13;
const g = new Voxels([13, 19, 13]);

// Lookup of footprint cells and their ground heights
const groundAt = new Map();
for (const [x, z, gr] of cells) groundAt.set(`${x},${z}`, gr);
const inFootprint = (x, z) => groundAt.has(`${x},${z}`);

const GLASS = "glass_pane";
const WALL = "white_concrete";
const BASE = "stone_bricks";

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(gr0, 12));
  // Mid-rise low block: ground storey + one upper storey, parapet to ~7 blocks
  const R = Math.max(7, gr + 7);

  // Foundation from y 0 up to the cell's ground, plus ground-floor slab
  for (let y = 0; y < gr; y++) g.set(x, y, z, BASE);
  g.set(x, gr, z, BASE);

  // Roof deck on top of the storeys (full footprint)
  g.set(x, R - 1, z, "light_gray_concrete");

  const edge = x === 0 || x === N - 1 || z === 0 || z === N - 1;

  if (!edge) {
    // Interior: mid-floor slab between storeys, air gap elsewhere
    g.set(x, gr + 4, z, "smooth_stone");
    continue;
  }

  // Determine facade side and position along it
  let side, t;
  if (z === 0) { side = "north"; t = x; }
  else if (z === N - 1) { side = "south"; t = x; }
  else if (x === 0) { side = "west"; t = z; }
  else { side = "east"; t = z; }

  const pier = t % 3 === 0 || t === 12;
  const entrance = side === "north" && t === 6;

  // Inward direction for placing warm light behind the glass
  const inward = {
    north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0],
  }[side];

  // Base course
  g.set(x, gr + 1, z, BASE);

  // Ground storey: shopfront glass between white piers, entrance on the north face
  for (let y = gr + 2; y <= gr + 3; y++) {
    if (entrance) continue; // door set below
    g.set(x, y, z, pier ? WALL : GLASS);
  }
  if (entrance) {
    g.set(x, gr + 2, z, "iron_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, gr + 3, z, "iron_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    // Stone lintel above the entrance
    g.set(x, gr + 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }

  // Warm light behind a shopfront window
  if (!pier && !entrance && t % 6 === 2) {
    const ix = x + inward[0], iz = z + inward[1];
    if (inFootprint(ix, iz)) g.set(ix, gr + 2, iz, "glowstone");
  }

  // Upper storey: window band between piers
  for (let y = gr + 4; y <= R - 3; y++) {
    if (entrance && y === gr + 4) continue; // lintel row
    g.set(x, y, z, pier ? WALL : GLASS);
  }

  // Cornice course and parapet
  g.set(x, R - 2, z, "smooth_stone");
  g.set(x, R, z, WALL);
}

// Rooftop plant enclosure in the centre of the roof
for (let x = 5; x <= 7; x++) {
  for (let z = 5; z <= 7; z++) {
    if (!inFootprint(x, z)) continue;
    const gr = Math.max(0, Math.min(groundAt.get(`${x},${z}`), 12));
    const R = Math.max(7, gr + 7);
    g.set(x, R, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
