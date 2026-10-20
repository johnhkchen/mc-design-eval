import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1339999083";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 10, H = 19, D = 6;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const cellMap = new Map();
for (const [x, z, gr] of cells) cellMap.set(`${x},${z}`, gr);
const has = (x, z) => cellMap.has(`${x},${z}`);

const minG = Math.min(...cells.map((c) => c[2]));
// Roof about 7 blocks above the lowest ground (lidar record)
const topY = minG + 7;

const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Street frontage: the footprint's lowest-z row; entrance near its middle
const xs = cells.map((c) => c[0]);
const zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs);
const midX = (minX + maxX) / 2;
let doorX = null;
for (const [x, z] of cells) {
  if (z !== minZ) continue;
  if (doorX === null || Math.abs(x - midX) < Math.abs(doorX - midX)) doorX = x;
}
const doorKey = `${doorX},${minZ}`;

const glassPane = (edgeAlongX) =>
  edgeAlongX
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const h = topY - gr;
  if (h < 1) continue;
  const edge = isEdge(x, z);
  const alongX = !has(x, z - 1) || !has(x, z + 1); // on a street/side face running along x
  const a = x + z; // along-face index for mullion rhythm

  // Base course (plinth) at ground level
  g.set(x, gr, z, "polished_andesite");

  if (!edge) {
    // Interior: floor slab per storey and roof slab, no interior fit-out
    if (3 < h - 2) g.set(x, gr + 3, z, "light_gray_concrete");
    if (h - 2 > 0) g.set(x, gr + h - 2, z, "light_gray_concrete");
    // Roof equipment (AC plant) on the roof slab
    if (h - 1 > h - 2 && ((x === 3 && z === 2) || (x === 6 && z === 3))) {
      g.set(x, gr + h - 1, z, "stone_bricks");
    }
    continue;
  }

  // Edge: facade bands
  for (let k = 1; k <= h - 1; k++) {
    const y = gr + k;
    if (k === h - 1) {
      // Parapet cap
      g.set(x, y, z, "white_concrete");
    } else if (k === h - 2) {
      // Cornice
      g.set(x, y, z, "smooth_quartz");
    } else if (k === 3) {
      // Storey line
      g.set(x, y, z, "light_gray_concrete");
    } else if (x === doorX && z === minZ && (k === 1 || k === 2)) {
      // Entrance door, placed in the ground storey on the street face
      g.set(x, y, z, "dark_oak_door", {
        facing: "south",
        half: k === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
    } else if (k <= 2) {
      // Shopfront glass with white frame mullions
      if (a % 3 === 0) g.set(x, y, z, "white_concrete");
      else if (k === 2 && a % 5 === 1) g.set(x, y, z, "shroomlight");
      else g.set(x, y, z, "glass_pane", glassPane(!alongX));
    } else {
      // Upper storey windows with mullions, some warm lit
      if (a % 3 === 0) g.set(x, y, z, "white_concrete");
      else if (k === 4 && a % 4 === 1) g.set(x, y, z, "glowstone");
      else g.set(x, y, z, "glass_pane", glassPane(!alongX));
    }
  }
}

g.save(`${dir}/${id}.nbt`);
