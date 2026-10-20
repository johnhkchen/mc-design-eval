import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey Xinyi commercial block: white cladding, light grey
// shopfront frames, red terracotta storey band, smooth stone cornice.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540300025";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 19, H = 23, D = 15;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const [x, z, gr] of cells) cellMap.set(key(x, z), gr);

const L = Math.min(...cells.map((c) => c[2]));   // lowest ground under footprint
const TOP = L + 10;                              // cornice row (last occupied y)
const ROOF = L + 11;                             // roof surface

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};
const PANE_STATE = {
  north: { north: "false", south: "false", east: "true", west: "true" },
  south: { north: "false", south: "false", east: "true", west: "true" },
  east: { north: "true", south: "true", east: "false", west: "false" },
  west: { north: "true", south: "true", east: "false", west: "false" },
};

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Entrance: centre-most cell of the south (street-facing) edge.
const southX = cells
  .filter((c) => !cellMap.has(key(c[0], c[1] + 1)))
  .map((c) => c[0])
  .sort((a, b) => a - b);
const doorX = southX.length ? southX[Math.floor(southX.length / 2)] : -1;

for (const [x, z, gr] of cells) {
  // Foundation fill from y 0 up to this cell's ground.
  for (let y = 0; y < gr && y < H; y++) put(x, y, z, "stone_bricks");

  const faces = [];
  for (const [name, [dx, dz]] of Object.entries(DIRS)) {
    if (!cellMap.has(key(x + dx, z + dz))) faces.push(name);
  }

  if (gr > TOP) continue; // nothing above the roof line for this cell

  if (faces.length === 0) {
    // Interior: air, with floor slabs at the storey line and the roof deck.
    for (let y = gr; y <= TOP && y < H; y++) {
      const k = y - L;
      if (k === 5 || k === 10) put(x, y, z, "smooth_stone");
    }
    // Rooftop AC plant on a sparse pattern of interior cells.
    if (ROOF < H && (x * 3 + z * 5) % 11 === 0) {
      put(x, ROOF, z, "iron_block");
    }
    continue;
  }

  const corner = faces.length > 1;
  const f = faces[0];
  const along = f === "north" || f === "south" ? x : z;
  const pillar = corner || along % 3 === 0;
  const isDoorCell = f === "south" && x === doorX && !corner;

  for (let y = gr; y <= TOP && y < H; y++) {
    const k = y - L;

    if (isDoorCell && (y === gr || y === gr + 1)) {
      const half = y === gr ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: "south",
        half,
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    let b;
    if (y === gr) {
      b = "polished_granite";                  // base course
    } else if (k <= 3) {
      b = pillar ? "light_gray_concrete" : "glass"; // shopfront frames and glazing
    } else if (k === 4) {
      b = "red_terracotta";                    // storey band
    } else if (k === 5) {
      b = "light_gray_concrete";               // spandrel
    } else if (k <= 8) {
      if (pillar) b = "white_concrete";
      else {
        put(x, y, z, "glass_pane", PANE_STATE[f]);
        // Warm light behind some upper windows, inside the air gap.
        if (k === 7 && along % 6 === 1) {
          const [dx, dz] = DIRS[f];
          const ix = x - dx, iz = z - dz;
          if (cellMap.has(key(ix, iz))) put(ix, y, iz, "glowstone");
        }
        continue;
      }
    } else if (k === 9) {
      b = "light_gray_concrete";               // upper lintel
    } else {
      b = "smooth_stone";                      // cornice / parapet
    }
    put(x, y, z, b);
  }
}

g.save(`${DIR}/${ID}.nbt`);
