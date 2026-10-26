// DC78775: an 8 x 3 Federal-era office block (pale limestone front, brick rear wing) around a paved light court.
// The lidar gives the front a flat 6-block cornice on every cell, the rear a stepped roof (2 / 4 / 5) that is
// smoothed into tiers, and the middle row a ground-level court. Front and rear walls stand on a foundation filled
// from y 0 up to each cell's ground; the court is paved at y 0. Nothing is built above a roof value.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC78775.cells.json", "utf8"));
const W = 8, D = 3, H = 18;

const ground = new Map(), roof = new Map();
for (const [x, z, gr, r] of cells) { ground.set(`${x},${z}`, gr); roof.set(`${x},${z}`, r); }
const G = (x, z) => ground.get(`${x},${z}`);

// the planned blocks, keyed by x,y,z: panes need their neighbours before they are written
const plan = new Map();
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });
const has = (x, y, z) => plan.has(`${x},${y},${z}`);

// rear tops, smoothed from the lidar (2 / 4 / 4 / 4 / 4 / 5 / 5 / 5): a low west wing, one tier of 4, one tier of 5
const rearTop = [2, 4, 4, 4, 4, 5, 5, 5];

// the foundation: solid from y 0 up to each cell's ground, the court paved at y 0
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const gr = G(x, z);
  for (let y = 0; y < gr; y++) put(x, y, z, z === 1 ? "smooth_stone" : "stone_bricks");
}
for (let x = 0; x < W; x++) put(x, 0, 1, "smooth_stone");                 // the court floor, ground level throughout

// front (z 0): a base course, ground storey (pilasters, windows, a double door), a spandrel band, upper windows, cornice
const GROUND = ["Q", "W", "W", "D", "D", "W", "W", "Q"];                    // Q pilaster, W window, D door
const UPPER = ["Q", "W", "W", "Q", "Q", "W", "W", "Q"];
const GLOW = new Set(["2,2,0", "6,4,0"]);                                  // lit windows
for (let x = 0; x < W; x++) {
  if (G(x, 0) === 0) put(x, 0, 0, "polished_andesite");                    // base course on the downhill side
  for (let y = 1; y <= 2; y++) {
    const k = GROUND[x];
    if (k === "Q") put(x, y, 0, "quartz_pillar", { axis: "y" });
    else if (k === "W") put(x, y, 0, GLOW.has(`${x},${y},0`) ? "glowstone" : "glass_pane");
    else put(x, y, 0, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: x === 3 ? "left" : "right", open: "false", powered: "false" });
  }
  put(x, 3, 0, x === 3 || x === 4 ? "chiseled_quartz_block" : "quartz_bricks");   // the spandrel band, textured against the smooth cornice
  const u = UPPER[x];
  if (u === "Q") put(x, 4, 0, "quartz_pillar", { axis: "y" });
  else put(x, 4, 0, GLOW.has(`${x},4,0`) ? "glowstone" : "glass_pane");
  put(x, 5, 0, "smooth_quartz");                                          // the cornice at the 6-block roof
}

// rear (z 2): brick above a stone base, panes on the court side, a smooth cap course at the roof, a brick chimney
for (let x = 0; x < W; x++) {
  const gr = G(x, 2), top = rearTop[x];
  for (let y = gr; y < top; y++) {
    if (y === top - 1) put(x, y, 2, "smooth_quartz");
    else if (y === 0) put(x, y, 2, "stone_bricks");
    else if ((y === 2 && [1, 2, 5, 6].includes(x)) || (y === 3 && [2, 5, 6].includes(x))) put(x, y, 2, "glass_pane");
    else put(x, y, 2, "bricks");
  }
}
put(5, 3, 2, "shroomlight");                                                  // a warm light in the rear wing
put(7, 5, 2, "bricks");                                                      // roof chimney on the cap
put(7, 6, 2, "bricks");

// panes take their connections from the neighbours that are built
for (const [key, v] of plan) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const c = (b) => (b ? "true" : "false");
  v.state = {
    north: c(has(x, y, z - 1)), south: c(has(x, y, z + 1)),
    east: c(has(x + 1, y, z)), west: c(has(x - 1, y, z)), waterlogged: "false",
  };
}

const g = new Voxels([W, H, D]);
for (const [key, v] of plan) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC78775.nbt");
console.log("DC78775", out);
