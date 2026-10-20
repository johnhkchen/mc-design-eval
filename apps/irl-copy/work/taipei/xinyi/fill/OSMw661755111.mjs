import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw661755111";
const W = 36, D = 42, H = 71;
const ROOF = 59;        // roof slab top, 59 blocks above lowest ground
const STOREY = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => G.has(`${x},${z}`);

// Outward normal of an exterior footprint cell, or null if interior.
function outward(x, z) {
  if (!has(x - 1, z)) return [-1, 0];
  if (!has(x + 1, z)) return [1, 0];
  if (!has(x, z - 1)) return [0, -1];
  if (!has(x, z + 1)) return [0, 1];
  return null;
}

// True when every cell within 2 blocks is footprint (for the penthouse).
function deep(x, z) {
  for (let dx = -2; dx <= 2; dx++)
    for (let dz = -2; dz <= 2; dz++)
      if (!has(x + dx, z + dz)) return false;
  return true;
}

const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

const g = new Voxels([W, H, D]);

// Door column on the south face: centre of the south-facing exterior cells.
const southXs = [];
for (const k of G.keys()) {
  const [x, z] = k.split(",").map(Number);
  const o = outward(x, z);
  if (o && o[0] === 0 && o[1] === 1) southXs.push(x);
}
const doorX = southXs.length
  ? Math.round((Math.min(...southXs) + Math.max(...southXs)) / 2)
  : -1;

for (const k of G.keys()) {
  const [x, z] = k.split(",").map(Number);
  const gr = G.get(k);
  const out = outward(x, z);
  const penthouse = !out && deep(x, z) && Math.abs(x - 17.5) <= 7 && Math.abs(z - 20.5) <= 9;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Storeys from this cell's ground up to the roof.
  for (let y = gr; y < ROOF; y++) {
    if (!out) {
      // Interior: floor slabs only, air otherwise.
      if (y === gr || y % STOREY === 0) g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // Exterior wall.
    if (y === gr) {
      g.set(x, y, z, "polished_granite");
      continue;
    }
    // Entrance on the south face, centre column, two blocks high.
    if (out[0] === 0 && out[1] === 1 && x === doorX && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y % STOREY === 0) {
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (y % STOREY === 4) {
      g.set(x, y, z, "white_concrete");
      continue;
    }
    // Window band: mullions every 3 blocks, glass panes between.
    const u = out[0] !== 0 ? z : x;
    if (u % 3 === 0) {
      g.set(x, y, z, "white_concrete");
    } else {
      const props = out[0] !== 0 ? PANE_NS : PANE_EW;
      g.set(x, y, z, "light_blue_stained_glass_pane", props);
      // Warm light just inside, in alternate bays.
      if (y % STOREY === 2 && (Math.floor(u / 3) + Math.floor(y / STOREY)) % 2 === 0) {
        const ix = x - out[0], iz = z - out[1];
        if (has(ix, iz) && outward(ix, iz) === null) g.set(ix, y, iz, "glowstone");
      }
    }
  }

  // Roof slab over every footprint cell.
  g.set(x, ROOF, z, "light_gray_concrete");

  // Parapet on the perimeter.
  if (out) {
    g.set(x, ROOF + 1, z, "white_concrete");
    g.set(x, ROOF + 2, z, "white_concrete");
  }

  // Rooftop plant room in the middle, stands on the roof slab.
  if (penthouse) {
    for (let y = ROOF + 1; y <= ROOF + 4; y++) g.set(x, y, z, "light_gray_concrete");
    g.set(x, ROOF + 5, z, "white_concrete");
  }
}

// Mast on the plant room centre.
for (let y = 65; y <= 68; y++) g.set(17, y, 20, "lightning_rod");

g.save(`${DIR}/${ID}.nbt`);
