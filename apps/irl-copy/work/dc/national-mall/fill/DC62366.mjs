// DC62366: a 1930s Federal civic block (Federal Triangle idiom) on the Mall: Indiana-limestone shell, five
// two-block storeys of glass bays on a stone plinth, a central portal, a flat roof with a parapet, and two
// taller pavilions (lidar 13) that step above the 11-high wings. It wraps a courtyard open to the south (the
// footprint notch). Roof heights are lidar medians (noise < 8 dropped); the body stands on y 0.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${FILL}/DC62366.cells.json`, "utf8"));
const [W, D] = [33, 13];

// footprint and lidar roof; a cell's roof is the median of the 3x3 neighbourhood (noise < 8 ignored)
const F = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const inF = (x, z) => F.has(`${x},${z}`);
const H = new Map();
for (const [k] of F) {
  const [x, z] = k.split(",").map(Number), vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const c = F.get(`${x + dx},${z + dz}`); if (c && c.r >= 8) vals.push(c.r);
  }
  vals.sort((a, b) => a - b); H.set(k, vals[vals.length >> 1]);
}
const topOf = (x, z) => H.get(`${x},${z}`) - 1;                 // highest body row of a footprint cell

// a side is open at row y when there is no neighbour cell there, or the neighbour stops below y
const face = (x, z, y) => ({
  N: !inF(x, z - 1) || y > topOf(x, z - 1),
  S: !inF(x, z + 1) || y > topOf(x, z + 1),
  W: !inF(x - 1, z) || y > topOf(x - 1, z),
  E: !inF(x + 1, z) || y > topOf(x + 1, z),
});
const shell = (f) => f.N || f.S || f.W || f.E;

// first pass: each shell cell's kind per row, and the air pockets (one cell deep, behind glass)
const kindAt = (x, z, y) => {
  const f = face(x, z, y), R = H.get(`${x},${z}`) - 2;
  if (y <= 1) return "base";
  if (!shell(f)) return y < R ? "core" : y === R ? "roof" : null;   // interior: solid to the roof slab, open above it
  if (y === R) return "cornice";
  if (y === R + 1) return "parapet";
  if (y % 2 === 1) return "string";                               // storey lines (floor slabs on the face)
  if ((f.N || f.S) && (f.W || f.E)) return "corner";
  if (((f.N || f.S) && x % 3 === 1) || ((f.W || f.E) && z % 3 === 1)) return "pier";
  return "glass";
};
const pocket = new Set();                                         // air gap behind glass
for (const [k] of F) {
  const [x, z] = k.split(",").map(Number), R = H.get(k) - 2;
  for (let y = 2; y < R; y += 2) {
    if (kindAt(x, z, y) !== "glass") continue;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz;
      if (inF(nx, nz) && !shell(face(nx, nz, y)) && y < H.get(`${nx},${nz}`) - 1) pocket.add(`${nx},${nz},${y}`);
    }
  }
}

const g = new Voxels([W, 25, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const MAT = {
  base: "stone_bricks", core: "stone", roof: "stone", cornice: "smooth_quartz", parapet: "stone_brick_wall",
  string: "smooth_quartz", corner: "smooth_quartz", pier: "smooth_quartz",
};
const WALL = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
const PARAPET = { north: "low", south: "low", east: "low", west: "low", up: "true", waterlogged: "false" };

for (const [k] of F) {
  const [x, z] = k.split(",").map(Number), top = topOf(x, z);
  for (let y = 0; y <= top; y++) {
    if (pocket.has(`${x},${z},${y}`)) continue;                  // air behind the glass
    const kind = kindAt(x, z, y);
    if (kind === null) continue;
    if (kind === "glass") put(x, y, z, "glass_pane", WALL);
    else if (kind === "parapet") put(x, y, z, "stone_brick_wall", PARAPET);
    else put(x, y, z, MAT[kind]);
  }
}

// warm lights behind a share of the windows (glowstone in the air gap)
for (const p of pocket) {
  const [x, z, y] = p.split(",").map(Number);
  if ((x * 5 + z * 3 + y) % 4 === 0) put(x, y, z, "glowstone");
}

// the central portal on the north face: a dark-oak door in the middle pier, a stone lintel above
for (const [y, half] of [[2, "lower"], [3, "upper"]]) {
  put(16, y, 0, "dark_oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
}
for (const x of [15, 16, 17]) put(x, 4, 0, "smooth_quartz");

// roof plant: boxes on the lower wings' roof, and lanterns on the parapet corners
for (let x = 20; x <= 24; x += 2) for (let z = 3; z <= 4; z++) {
  if (!inF(x, z) || H.get(`${x},${z}`) !== 11 || shell(face(x, z, 10))) continue;
  put(x, 10, z, "light_gray_concrete");
}
for (const [k] of F) {
  const [x, z] = k.split(",").map(Number), top = topOf(x, z), f = face(x, z, top);
  if (shell(f) && (f.N || f.S) && (f.W || f.E)) put(x, top + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
}

const stats = g.save(`${FILL}/DC62366.nbt`);
console.log(JSON.stringify({ cells: F.size, pockets: pocket.size, ...stats }));
