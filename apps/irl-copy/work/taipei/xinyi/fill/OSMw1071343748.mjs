import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343748";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 40, H = 23, D = 28;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height (y of the cell's first solid-free block)
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

function put(x, y, z, b, p) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

// Deterministic pseudo-random for window accents and rooftop plant
const hash = (x, z, k) => Math.abs(Math.imul(x * 31 + z * 17 + k * 7 + 11, 2654435761)) >>> 0;

// Outward faces. axis "z" faces run along x; axis "x" faces run along z.
const DIRS = [
  { n: "north", dx: 0, dz: -1, axis: "z" },
  { n: "south", dx: 0, dz: 1, axis: "z" },
  { n: "east", dx: 1, dz: 0, axis: "x" },
  { n: "west", dx: -1, dz: 0, axis: "x" },
];

// Classify exterior cells: each cell lists the outward faces it touches.
const facesOf = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));
const uOf = (x, z, d) => (d.axis === "z" ? x : z);

// Choose the main entrance on the first face direction (north, then south, east, west) that has exterior cells.
let doorKey = null, doorFacing = null;
for (const d of DIRS) {
  const list = [];
  for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
    if (facesOf(x, z).includes(d)) list.push([x, z]);
  }
  if (list.length) {
    const us = list.map(([x, z]) => uOf(x, z, d)).sort((a, b) => a - b);
    const med = us[Math.floor(us.length / 2)];
    const pick = list.reduce((best, c) =>
      Math.abs(uOf(c[0], c[1], d) - med) < Math.abs(uOf(best[0], best[1], d) - med) ? c : best
    );
    doorKey = `${pick[0]},${pick[1]}`;
    doorFacing = d.n;
    break;
  }
}

for (const [x, z, gr] of cells) {
  const faces = facesOf(x, z);
  const exterior = faces.length > 0;
  const isDoor = doorKey === `${x},${z}`;

  // Foundation from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground-level slab / base course (level gr)
  put(x, gr, z, "polished_andesite");

  // Floor slab at storey line (gr+5) and roof deck (gr+10) on interior cells
  if (!exterior) {
    put(x, gr + 5, z, "light_gray_concrete");
    put(x, gr + 10, z, "light_gray_concrete");
    // Rooftop plant boxes, sparse
    if (hash(x, z, 11) % 17 === 0) put(x, gr + 11, z, "chiseled_stone_bricks");
  }

  if (!exterior) continue;

  const d = faces[0];
  const u = uOf(x, z, d);
  const facing = d.n;

  // Ground storey: shopfront with piers and glass, entrance at door cell
  if (isDoor) {
    const dp = (half) => ({ facing: doorFacing, half, hinge: "left", open: "false", powered: "false" });
    put(x, gr + 1, z, "dark_oak_door", dp("lower"));
    put(x, gr + 2, z, "dark_oak_door", dp("upper"));
    put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  } else {
    for (let k = 1; k <= 3; k++) {
      if (u % 4 === 0) put(x, gr + k, z, "white_concrete");
      else put(x, gr + k, z, "glass");
    }
  }

  // Ground storey lintel and first floor line
  put(x, gr + 4, z, "white_concrete");
  put(x, gr + 5, z, "smooth_stone");

  // Upper storey: sill, window grid with piers, header
  put(x, gr + 6, z, "white_concrete");
  for (let k = 7; k <= 8; k++) {
    if (u % 3 === 0) {
      put(x, gr + k, z, "white_concrete");
    } else if (hash(x, z, 3) % 5 === 0) {
      put(x, gr + k, z, "glowstone"); // warm lit office behind the glass line
    } else {
      put(x, gr + k, z, "light_blue_stained_glass");
    }
  }
  put(x, gr + 9, z, "white_concrete");

  // Cornice and parapet
  put(x, gr + 10, z, "smooth_stone");
  put(x, gr + 11, z, "white_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
