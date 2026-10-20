import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1970s-80s Xinyi shophouse: stone plinth, cream facade with white
// concrete piers, two storeys of tinted-glass windows over a glazed shopfront,
// a flat roof with parapet cap and rooftop units.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542682854";
const W = 14, H = 23, D = 10;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const gAt = (x, z) => G.get(`${x},${z}`);

const set = (x, y, z, block, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const exposed = (x, z) => ({
  N: !has(x, z - 1),
  S: !has(x, z + 1),
  W: !has(x - 1, z),
  E: !has(x + 1, z),
});
const isPerim = (x, z) => {
  const e = exposed(x, z);
  return e.N || e.S || e.W || e.E;
};
// Piers sit on every third column/row and at the ends of each facade run.
const isPier = (x, z) => {
  const e = exposed(x, z);
  if ((e.N || e.S) && (x % 3 === 0 || !has(x - 1, z) || !has(x + 1, z))) return true;
  if ((e.E || e.W) && (z % 3 === 0 || !has(x, z - 1) || !has(x, z + 1))) return true;
  return false;
};

// Pass 1: foundation, floor slabs, roof deck for every footprint cell.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");
  set(x, gr, z, "smooth_stone");        // ground floor slab
  set(x, gr + 5, z, "smooth_stone");    // second floor slab
  set(x, gr + 10, z, "gray_concrete");  // roof deck
}

// Pass 2: facade rings (overwrite floors where they meet walls).
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z)) continue;
  const pier = isPier(x, z);
  for (let o = 0; o <= 10; o++) {
    const y = gr + o;
    let b;
    if (o === 0) b = "stone_bricks";                                   // plinth
    else if (o <= 3) b = pier ? "white_concrete" : "glass";            // shopfront
    else if (o === 4) b = "white_concrete";                            // lintel band
    else if (o === 5) b = "smooth_quartz";                             // spandrel
    else if (o <= 8) b = pier ? "white_concrete" : "light_blue_stained_glass";
    else if (o === 9) b = "smooth_quartz";                             // spandrel
    else b = "white_concrete";                                         // parapet cap
    set(x, y, z, b);
  }
}

// Pass 3: entrance on the north face, middle of its run.
const northCells = cells
  .filter(([x, z]) => !has(x, z - 1))
  .sort((a, b) => a[0] - b[0]);
if (northCells.length) {
  const [dx, dz, dg] = northCells[Math.floor(northCells.length / 2)];
  set(dx, dg + 1, dz, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  set(dx, dg + 2, dz, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Pass 4: warm light behind some glass, using an interior neighbour cell.
const interiorNeighbour = (x, z) => {
  for (const [nx, nz] of [[x, z + 1], [x, z - 1], [x + 1, z], [x - 1, z]]) {
    if (has(nx, nz) && !isPerim(nx, nz)) return [nx, nz];
  }
  return null;
};
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z) || isPier(x, z)) continue;
  const n = interiorNeighbour(x, z);
  if (!n) continue;
  const [nx, nz] = n;
  // Upper floor: glowstone behind a few windows.
  if ((x + z) % 4 === 0) set(nx, gr + 7, nz, "glowstone");
  // Shopfront: shroomlight behind a few display windows.
  else if ((x + z) % 5 === 1) set(nx, gr + 2, nz, "shroomlight");
}

// Pass 5: rooftop units and a small water tank on interior roof cells.
for (const [x, z, gr] of cells) {
  if (isPerim(x, z)) continue;
  if (x % 5 === 2 && z % 4 === 1) set(x, gr + 11, z, "iron_block");
  else if (x % 5 === 3 && z % 4 === 2) set(x, gr + 11, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
