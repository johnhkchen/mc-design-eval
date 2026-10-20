import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Footprint 24 x 19. Lidar: roof about 11 blocks above lowest ground.
// Reading: a 1990s Xinyi-style commercial mid-rise, two storeys of about 5 blocks,
// with a shopfront ground floor, a white-tile upper facade with a light-blue glass
// window grid, a stone cornice and a flat roof with plant boxes.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538119879.cells.json", "utf8"));

const W = 24, H = 23, D = 19;
const g = new Voxels([W, H, D]);

const S = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(x + "," + z, gr);
const inFp = (x, z) => ground.has(x + "," + z);

// Exterior faces: direction vector and name
const DIRS = [
  { dx: 1, dz: 0, name: "east", axis: "x" },
  { dx: -1, dz: 0, name: "west", axis: "x" },
  { dx: 0, dz: 1, name: "south", axis: "z" },
  { dx: 0, dz: -1, name: "north", axis: "z" },
];

const info = cells.map(([x, z, gr]) => {
  const ext = DIRS.filter((d) => !inFp(x + d.dx, z + d.dz));
  return { x, z, gr, ext };
});

// Pick one entrance: on a single-face south cell (Xinyi Road-side), middle of the run.
let doorCands = info.filter((c) => c.ext.length === 1 && c.ext[0].name === "south");
if (doorCands.length === 0) doorCands = info.filter((c) => c.ext.length === 1);
doorCands.sort((a, b) => a.x - b.x || a.z - b.z);
const doorCell = doorCands.length ? doorCands[Math.floor(doorCands.length / 2)] : null;
const doorKey = doorCell ? doorCell.x + "," + doorCell.z : null;

// Pass 1: columns, floors, roof, facade
for (const c of info) {
  const { x, z, gr } = c;
  const top = Math.max(11, gr + 5);     // flat roof slab
  const perim = c.ext.length > 0;
  const corner = c.ext.length > 1;

  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y <= gr; y++) S(x, y, z, "stone_bricks");

  if (perim) {
    // Base course
    S(x, gr + 1, z, "polished_andesite");

    // Ground-floor shopfront zone g+2..g+4
    for (let y = gr + 2; y <= gr + 4; y++) {
      if (corner) { S(x, y, z, "white_concrete"); continue; }
      const face = c.ext[0];
      const idx = face.axis === "x" ? z : x;
      const isDoor = doorKey === x + "," + z;
      if (isDoor && y <= gr + 3) {
        const p = { facing: face.name, hinge: "left", open: "false", powered: "false" };
        S(x, y, z, "dark_oak_door", { ...p, half: y === gr + 2 ? "lower" : "upper" });
      } else if (y === gr + 2 && idx % 3 === 0) {
        S(x, y, z, "white_concrete");
      } else if (idx % 3 === 0) {
        S(x, y, z, "white_concrete");
      } else {
        S(x, y, z, "light_blue_stained_glass");
      }
    }
    // Lintel above entrance
    if (doorKey === x + "," + z) S(x, gr + 4, z, "smooth_stone");

    // Storey line band at g+5
    S(x, gr + 5, z, "smooth_stone");

    // Upper floor zone g+6..top-1: sill, glazing, lintel
    for (let y = gr + 6; y <= top - 1; y++) {
      if (corner) { S(x, y, z, "white_concrete"); continue; }
      const face = c.ext[0];
      const idx = face.axis === "x" ? z : x;
      const isSill = y === gr + 6;
      const isLintel = y === top - 1;
      if (isSill || isLintel || idx % 3 === 0) {
        S(x, y, z, "white_concrete");
      } else {
        S(x, y, z, "light_blue_stained_glass");
      }
    }

    // Cornice / parapet
    S(x, top + 1, z, "smooth_stone");
  } else {
    // Interior: floor slab at storey line, air between floors
    if (gr + 5 < top) S(x, gr + 5, z, "light_gray_concrete");
  }

  // Roof slab
  S(x, top, z, "light_gray_concrete");
}

// Pass 2: warm light behind some upper windows, rooftop plant boxes
for (const c of info) {
  const { x, z, gr } = c;
  const top = Math.max(11, gr + 5);
  if (c.ext.length === 1 && top - 1 >= gr + 6) {
    const face = c.ext[0];
    const idx = face.axis === "x" ? z : x;
    if (idx % 6 === 1) {
      const ix = x - face.dx, iz = z - face.dz;
      if (inFp(ix, iz)) {
        const inGr = ground.get(ix + "," + iz);
        const inTop = Math.max(11, inGr + 5);
        if (gr + 6 < inTop) S(ix, gr + 6, iz, "glowstone");
      }
    }
  }
  if (c.ext.length === 0 && (x * 7 + z * 3) % 11 === 0 && top + 2 < H) {
    S(x, top + 1, z, "gray_concrete");
    S(x, top + 2, z, "gray_concrete");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538119879.nbt");
