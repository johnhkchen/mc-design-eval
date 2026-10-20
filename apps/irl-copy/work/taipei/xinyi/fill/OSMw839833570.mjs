import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833570";
const W = 19, H = 23, D = 24;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const gAt = (x, z) => G.get(`${x},${z}`);

const minG = Math.min(...cells.map((c) => c[2]));
// Roof sits ~11 blocks above the lowest ground: two storeys of ~5 blocks plus parapet.
const R = Math.min(minG + 11, H - 1);
const L1 = minG + 5; // first floor line, shared across the footprint

const g = new Voxels([W, H, D]);
const set = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Outward faces of a cell (faces with no neighbour in the footprint).
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// Entrance: on the north-facing edge, median x.
const northCells = cells.filter(([x, z]) => faces(x, z).includes("N")).map(([x]) => x).sort((a, b) => a - b);
const edgeCells = cells.filter(([x, z]) => faces(x, z).length > 0);
let ex = -1, ez = -1, eFace = "N";
if (northCells.length) {
  ex = northCells[Math.floor(northCells.length / 2)];
  ez = cells.find(([x, z]) => x === ex && faces(x, z).includes("N"))[1];
} else if (edgeCells.length) {
  [ex, ez] = edgeCells[Math.floor(edgeCells.length / 2)];
  eFace = faces(ex, ez)[0];
}

const doorProps = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

// Pass 1: foundations, floors, roof decks, facades.
for (const [x, z, gy] of cells) {
  for (let y = 0; y < gy; y++) set(x, y, z, "stone_bricks");

  const fs = faces(x, z);
  const edge = fs.length > 0;

  // Base course / ground slab.
  set(x, gy, z, edge ? "smooth_stone" : "light_gray_concrete");

  // First floor slab (interior) or belt course (edge).
  if (gy < L1) set(x, L1, z, edge ? "smooth_stone" : "light_gray_concrete");

  // Interior roof deck under the parapet level.
  if (!edge && R - 1 > gy) set(x, R - 1, z, "smooth_stone");

  if (!edge) continue;

  const f = eFace && (x === ex && z === ez) ? eFace : fs[0];
  const i = f === "N" || f === "S" ? x : z;
  const isDoor = x === ex && z === ez;

  for (let y = gy + 1; y <= R - 2; y++) {
    let b = "white_concrete";
    let p;
    if (y === L1) {
      b = "smooth_stone";
    } else if (y < L1) {
      // Ground floor shopfront: glass with pillars every 4 cells.
      b = i % 4 === 0 ? "light_gray_concrete" : "glass_pane";
      if (isDoor) {
        if (y === gy + 1) { b = "oak_door"; p = doorProps("lower"); }
        else if (y === gy + 2) { b = "oak_door"; p = doorProps("upper"); }
        else b = "glass_pane";
      }
    } else if (y <= L1 + 3) {
      // Upper floor windows.
      b = i % 4 === 0 ? "light_gray_concrete" : "glass_pane";
    } else {
      // Spandrel below the parapet.
      b = "white_concrete";
    }
    set(x, y, z, b, p);
  }
}

// Pass 2: cornice / parapet cap on the edge, lights behind glass, roof plant.
for (const [x, z, gy] of cells) {
  const fs = faces(x, z);
  if (fs.length === 0) {
    // Roof plant on the deck, spaced on a grid.
    if (x % 5 === 2 && z % 5 === 2 && R - 1 > gy) set(x, R, z, "light_gray_concrete");
    continue;
  }
  if (R - 1 > gy) set(x, R - 1, z, "light_gray_concrete");

  const f = fs[0];
  const i = f === "N" || f === "S" ? x : z;
  const [dx, dz] = inward[f];
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || faces(ix, iz).length > 0) continue;
  if (x === ex && z === ez) continue;

  // Warm light in some upper windows.
  if (i % 4 === 2 && (x + z) % 3 === 0 && L1 + 2 < H) {
    set(ix, L1 + 2, iz, "shroomlight");
  }
  // Warm light behind some shopfront glass.
  if (i % 4 === 2 && (x + z) % 5 === 0 && gy + 2 < L1) {
    set(ix, gy + 2, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
