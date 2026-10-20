import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${dir}/OSMw1454365475.cells.json`, "utf8"));

const W = 6, H = 23, D = 5;
const g = new Voxels([W, H, D]);

// Ground is relative to the lowest ground under the footprint.
const minG = Math.min(...cells.map((c) => c[2]));
const grid = new Map();
for (const [x, z, gr] of cells) grid.set(`${x},${z}`, gr - minG);
const has = (x, z) => grid.has(`${x},${z}`);
const groundAt = (x, z) => grid.get(`${x},${z}`);

// Roof deck, parapet and rooftop plant sit at fixed absolute heights.
const ROOF = 11;     // roof deck block layer
const PARAPET = 12;  // parapet course on exterior ring
const FLOOR2 = 5;    // storey line / second floor slab
const CORNICE = 10;  // top course of the upper storey

// Exposed faces of a footprint cell (side with no neighbour).
const exposed = (x, z) => {
  const f = [];
  if (!has(x, z + 1)) f.push("S");
  if (!has(x, z - 1)) f.push("N");
  if (!has(x + 1, z)) f.push("E");
  if (!has(x - 1, z)) f.push("W");
  return f;
};

// Door sits in the middle of the south (front) row.
const southCells = cells
  .map(([x, z]) => [x, z])
  .filter(([x, z]) => exposed(x, z).includes("S"))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = southCells.length ? southCells[Math.floor(southCells.length / 2)] : -1;

for (const [x, z, gr0] of cells) {
  const gr = gr0 - minG;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const faces = exposed(x, z);
  const ext = faces.length > 0;
  const corner = faces.length >= 2;
  const face = faces.includes("S") ? "S" : faces[0];
  const i = face === "N" || face === "S" ? x : z;

  // Interior: floor slabs only, air otherwise (no interiors).
  if (!ext) {
    if (gr <= 4 && gr >= 0) g.set(x, gr, z, "smooth_stone");
    if (FLOOR2 > gr) g.set(x, FLOOR2, z, "smooth_stone");
  }

  for (let y = gr; y <= CORNICE; y++) {
    if (!ext) {
      // Interior: keep air apart from floors (handled above) and a warm light.
      if (y === 7 && (x + z) % 2 === 0) g.set(x, y, z, "glowstone");
      if (y === 2 && gr < 2 && (x + z) % 3 === 0) g.set(x, y, z, "glowstone");
      continue;
    }

    if (y === gr) {
      g.set(x, y, z, "polished_granite"); // base course
    } else if (y === FLOOR2) {
      g.set(x, y, z, "smooth_quartz"); // storey line
    } else if (y === CORNICE) {
      g.set(x, y, z, "smooth_quartz"); // cornice
    } else if (y < FLOOR2) {
      // Ground storey: shopfront.
      if (y === 4) {
        g.set(x, y, z, "white_concrete"); // lintel over shopfront
      } else if (corner) {
        g.set(x, y, z, "white_concrete");
      } else if (face === "S" && x === doorX && (y === gr + 1 || y === gr + 2)) {
        const half = y === gr + 1 ? "lower" : "upper";
        g.set(x, y, z, "oak_door", {
          facing: "south", half, hinge: "left", open: "false", powered: "false",
        });
      } else if (face === "S" && y === gr + 3 && Math.abs(x - doorX) <= 1) {
        g.set(x, y, z, "black_concrete"); // canopy over entrance
      } else if (i % 2 === 1 && y >= gr + 1 && y <= 3) {
        g.set(x, y, z, "light_blue_stained_glass");
      } else {
        g.set(x, y, z, "white_concrete");
      }
    } else {
      // Upper storey: window grid with frames.
      if (y === 9) {
        g.set(x, y, z, "white_concrete"); // sill / head band
      } else if (!corner && i % 2 === 1 && y >= 6 && y <= 8) {
        g.set(x, y, z, "light_blue_stained_glass");
      } else {
        g.set(x, y, z, "white_concrete");
      }
    }
  }

  // Roof deck over every footprint cell (supported by the walls).
  g.set(x, ROOF, z, "gray_concrete");

  // Parapet along the exterior ring.
  if (ext) g.set(x, PARAPET, z, "smooth_quartz");
}

// Rooftop mechanical penthouse, centred, if the cells exist.
const penthouse = [[2, 1], [3, 1], [2, 2], [3, 2]];
if (penthouse.every(([x, z]) => has(x, z))) {
  for (const [x, z] of penthouse) {
    g.set(x, 12, z, "light_gray_concrete");
    g.set(x, 13, z, "light_gray_concrete");
  }
  g.set(2, 14, 1, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  g.set(3, 14, 2, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${dir}/OSMw1454365475.nbt`);
