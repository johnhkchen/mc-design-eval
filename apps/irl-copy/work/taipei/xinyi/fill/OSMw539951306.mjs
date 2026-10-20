import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539951306";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 23, D = 13;
const ROOF = 11;          // roof level above lowest ground (lidar)
const TOP = ROOF - 1;     // top solid course (y=10)
const g = new Voxels([W, H, D]);

const groundOf = new Map();
for (const [x, z, gr] of cells) {
  groundOf.set(`${x},${z}`, Math.max(0, Math.min(6, Math.round(gr))));
}
const has = (x, z) => groundOf.has(`${x},${z}`);

// Outward faces of a footprint cell (cells whose neighbour is missing)
const facesOf = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
};
const isPerim = (x, z) => facesOf(x, z).length > 0;

const NORMAL = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

// Central bay of the north (street) facade for the entrance
let minX = Infinity, maxX = -Infinity;
for (const [x] of cells) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
const doorX = Math.floor((minX + maxX) / 2);

const paneProps = (face) =>
  face === "north" || face === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  const gr = groundOf.get(`${x},${z}`);

  // Foundation from y 0 up to ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const perim = isPerim(x, z);
  if (!perim) {
    // Interior: floor slab at storey line and roof deck, air between
    g.set(x, 5, z, "smooth_stone");
    g.set(x, TOP, z, "gray_concrete");
    // Rooftop units
    if (x % 7 === 3 && z % 5 === 2) g.set(x, ROOF, z, "iron_block");
    continue;
  }

  const faces = facesOf(x, z);

  if (faces.length > 1) {
    // Corner column
    for (let y = gr; y <= TOP; y++) {
      g.set(x, y, z, y === gr || y === TOP ? "stone_bricks" : "quartz_pillar", { axis: "y" });
    }
    continue;
  }

  const face = faces[0];
  const idx = face === "north" || face === "south" ? x : z;
  const isDoorCell = face === "north" && idx === doorX;

  for (let y = gr; y <= TOP; y++) {
    if (y === gr || y === TOP) { g.set(x, y, z, "stone_bricks"); continue; }
    if (y === 9 || y === 5 || y === 4) { g.set(x, y, z, "smooth_stone"); continue; }

    if (y >= 1 && y <= 3) {
      // Shopfront band
      if (isDoorCell) { g.set(x, y, z, "air"); continue; }
      if (idx % 3 === 1) {
        g.set(x, y, z, "light_blue_stained_glass_pane", paneProps(face));
      } else {
        g.set(x, y, z, "white_concrete");
      }
      continue;
    }

    if (y >= 6 && y <= 8) {
      // Upper office windows
      if (idx % 3 !== 0) {
        g.set(x, y, z, "light_blue_stained_glass_pane", paneProps(face));
        // Warm light behind some windows, standing on the floor slab
        if (y === 6 && idx % 6 === 1) {
          const [nx, nz] = NORMAL[face];
          const ix = x - nx, iz = z - nz;
          if (has(ix, iz) && !isPerim(ix, iz)) g.set(ix, 6, iz, "glowstone");
        }
      } else {
        g.set(x, y, z, "white_concrete");
      }
      continue;
    }

    g.set(x, y, z, "white_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
