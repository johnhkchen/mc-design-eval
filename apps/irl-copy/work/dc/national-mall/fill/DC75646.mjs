import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1916 apartment house, R Street NW: red brick with calcite string courses, quoins, cornice and a stone plinth.
// A three-storey podium (lidar 10) carries a fourth-storey penthouse core (lidar 12) on the middle of the block.
// The walls are a one-cell shell with glass panes in the window bays and an air gap behind each pane (some lit).
// Floors are planks at each storey line, the roof is a stone slab on the top layer, two brick chimneys stand on it.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC75646.cells.json", "utf8"));
const W = 7, D = 13, H = 24;

// lidar roof per cell, quantised to two flat tiers: 11 reads as the podium (10), 12 as the penthouse core (12)
const top = new Map();
for (const [x, z, , roof] of cells) top.set(`${x},${z}`, roof >= 12 ? 12 : 10);
const T = (x, z) => top.get(`${x},${z}`) ?? 0;             // outside the footprint nothing stands
const solid = (x, y, z) => y < T(x, z);
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const exposed = (x, y, z) => Object.keys(DIRS).filter((d) => !solid(x + DIRS[d][0], y, z + DIRS[d][1]));
const along = (d, x, z) => (d === "north" || d === "south" ? x : z);   // the coordinate that runs along a face
const plane = (d, x, z) => (d === "north" || d === "south" ? z : x);   // the fixed coordinate of a face

// the first along-face cell of each face plane, so the window bays are counted from the face's own end
const minAlong = new Map(), voxels = [];
for (const [k, t] of top) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < t; y++) {
    voxels.push([x, y, z]);
    for (const d of exposed(x, y, z)) {
      const key = `${d}|${plane(d, x, z)}`;
      minAlong.set(key, Math.min(minAlong.get(key) ?? Infinity, along(d, x, z)));
    }
  }
}

const g = new Voxels([W, H, D]);
const windows = [];
for (const [x, y, z] of voxels) {
  const dirs = exposed(x, y, z), t = T(x, z);
  if (!dirs.length) {                                         // interior: a roof slab, a floor per storey, else air
    if (y === t - 1) g.set(x, y, z, "smooth_stone");
    else if (y % 3 === 0) g.set(x, y, z, "spruce_planks");
    continue;
  }
  const d = dirs[0], corner = dirs.length > 1;
  const a = along(d, x, z) - minAlong.get(`${d}|${plane(d, x, z)}`);
  if (y === t - 1) g.set(x, y, z, "calcite");                 // cornice / parapet
  else if (y === 0) g.set(x, y, z, "stone_bricks");           // plinth
  else if (y % 3 === 0) g.set(x, y, z, "calcite");            // string course at each storey line
  else if (corner) g.set(x, y, z, "calcite");                 // quoins
  else if (a % 3 === 0) g.set(x, y, z, "bricks");             // piers between the bays
  else { g.set(x, y, z, "glass_pane"); windows.push([x, y, z, d]); }
}

// entrance on the street face (z 0, centre bay x 3): dark oak door, calcite surround and lintel, sloped hood
const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
g.set(3, 0, 0, "dark_oak_door", { ...door, half: "lower" });
g.set(3, 1, 0, "dark_oak_door", { ...door, half: "upper" });
for (const [x, y] of [[2, 0], [2, 1], [2, 2], [3, 2], [4, 0], [4, 1], [4, 2]]) g.set(x, y, 0, "calcite");
for (const x of [2, 3, 4]) g.set(x, 3, 0, "stone_brick_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });

// warm light in about a sixth of the windows: glowstone in the air gap behind the pane
for (const [x, y, z, d] of windows) {
  if ((x * 5 + y * 3 + z * 7) % 6 !== 0) continue;
  const ix = x - DIRS[d][0], iz = z - DIRS[d][1];
  if (!g.get(ix, y, iz)) g.set(ix, y, iz, "glowstone");
}

// two brick chimneys on the podium roof, capped in calcite
for (const [x, z] of [[2, 8], [4, 11]]) {
  for (const y of [10, 11]) g.set(x, y, z, "bricks");
  g.set(x, 12, z, "calcite");
}

// panes join their in-plane neighbours (glass or pier), so each bay reads as a sash grid, not loose squares
for (const [x, y, z, d] of windows) {
  if (g.get(x, y, z)?.block !== "minecraft:glass_pane") continue;
  const sides = d === "north" || d === "south" ? { east: [1, 0], west: [-1, 0] } : { north: [0, -1], south: [0, 1] };
  const state = { north: "false", south: "false", east: "false", west: "false" };
  for (const [name, [dx, dz]] of Object.entries(sides)) state[name] = g.get(x + dx, y, z + dz) ? "true" : "false";
  g.set(x, y, z, "glass_pane", state);
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC75646.nbt");
console.log("blocks", g.count(), "palette", g.palette.length - 1);
