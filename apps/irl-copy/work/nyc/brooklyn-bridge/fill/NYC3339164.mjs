import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3339164.cells.json`, "utf8"));

const W = 9, H = 16, D = 4;
const g = new Voxels([W, H, D]);

// Collect footprint data
const map = new Map();
let roofSum = 0, n = 0;
for (const c of cells) {
  const [x, z, gr0, rf] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gr = Math.round(gr0);
  map.set(`${x},${z}`, { gr, rf });
  roofSum += rf;
  n++;
}

// Flat roof: mean lidar roof, never below 4 blocks above each cell's ground
let top = Math.round(n ? roofSum / n : 4);
for (const { gr } of map.values()) top = Math.max(top, gr + 4);
top = Math.min(top, H - 1);

const BRICK = "bricks";
const STONE = "stone_bricks";
const GLASS = "glass_pane";

const isZFace = (x, z) => (z === 0 || z === D - 1) && x >= 1 && x <= W - 2;

// Window columns: z-faces at x 1..7 except the entrance bay (x=4); x-faces at z=1,2
const isWindowCol = (x, z) => {
  if (z === 0 || z === D - 1) return x >= 1 && x <= W - 2 && x !== 4;
  if (x === 0 || x === W - 1) return z === 1 || z === 2;
  return false;
};

const winAt = (x, z) => {
  if (x < 0 || x >= W || z < 0 || z >= D) return false;
  return isWindowCol(x, z);
};

for (const [key, { gr }] of map) {
  const [x, z] = key.split(",").map(Number);
  const perim = x === 0 || x === W - 1 || z === 0 || z === D - 1;

  // Foundation from y0 up to this cell's ground
  for (let y = 0; y < gr && y < H; y++) g.set(x, y, z, STONE);

  for (let y = gr; y <= top - 1; y++) {
    if (y < 0 || y >= H) continue;
    const fromTop = top - 1 - y;

    // Roof deck, base course at grade, and floor/string courses are solid stone
    if (y === top - 1 || y === gr || fromTop % 2 === 0) {
      g.set(x, y, z, STONE);
      continue;
    }

    // Window band rows (always above the base course, so no floating glass)
    if (perim) {
      // Entrance bay on street face (z=0, x=4)
      if (z === 0 && x === 4) {
        g.set(x, y, z, BRICK);
        continue;
      }
      if (isWindowCol(x, z)) {
        const props = { waterlogged: "false" };
        if (isZFace(x, z)) {
          props.north = "false";
          props.south = "false";
          props.east = winAt(x + 1, z) ? "true" : "false";
          props.west = winAt(x - 1, z) ? "true" : "false";
        } else {
          props.east = "false";
          props.west = "false";
          props.north = winAt(x, z - 1) ? "true" : "false";
          props.south = winAt(x, z + 1) ? "true" : "false";
        }
        g.set(x, y, z, GLASS, props);
      } else {
        g.set(x, y, z, BRICK);
      }
    } else {
      // Interior: air behind glass, with warm light in some rooms
      if (z === 1 && (x === 2 || x === 6) && fromTop % 4 === 1) {
        g.set(x, y, z, "glowstone");
      }
    }
  }

  // Low stone parapet slab on the roof edge (renders as a cap, not a tall post)
  if (perim && top < H) {
    g.set(x, top, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Entrance: door on street face at x=4, z=0
const doorCell = map.get("4,0");
if (doorCell) {
  const dg = doorCell.gr;
  const doorProps = (half) => ({
    facing: "north",
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  });
  if (dg < H) g.set(4, dg, 0, "dark_oak_door", doorProps("lower"));
  if (dg + 1 < H) g.set(4, dg + 1, 0, "dark_oak_door", doorProps("upper"));

  // Canopy over entrance
  const cy = dg + 2;
  if (cy < H && cy < top) {
    for (let x = 3; x <= 5; x++) {
      for (let z = 0; z <= 1; z++) {
        g.set(x, cy, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      }
    }
  }
  // Lantern under canopy for dusk
  if (dg + 1 < top && dg + 1 < H) {
    g.set(4, dg + 1, 1, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/NYC3339164.nbt`);
