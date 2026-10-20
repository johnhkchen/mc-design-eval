import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001592";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 10, H = 22, D = 3;
const g = new Voxels([W, H, D]);

const S = (x, y, z, id, props) => (props ? g.set(x, y, z, id, props) : g.set(x, y, z, id));
const PANE = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Ground per cell from lidar, one flat roof for the whole block (about 10 blocks above lowest ground)
const map = new Map();
let minG = Infinity, maxG = -Infinity;
for (const [x, z, gr] of cells) {
  const G = Math.max(0, Math.round(gr));
  map.set(`${x},${z}`, { G });
  minG = Math.min(minG, G);
  maxG = Math.max(maxG, G);
}
const R = Math.min(H - 3, Math.max(minG + 10, maxG + 6));
for (const v of map.values()) v.R = R;

for (const [key, { G }] of map) {
  const [x, z] = key.split(",").map(Number);
  const front = z === 0 || z === 2;
  const end = x === 0 || x === W - 1;
  const facade = front || end;

  // Foundation
  for (let y = 0; y < G; y++) S(x, y, z, "stone");

  // Base course
  S(x, G, z, "stone_bricks");

  // Storeys: even offset = floor band, odd offset = window row
  for (let y = G + 1; y < R - 1; y++) {
    const off = y - G;
    if (off % 2 === 0) {
      if (facade) S(x, y, z, "terracotta");
      else S(x, y, z, "smooth_stone");
    } else {
      if (end) {
        S(x, y, z, "terracotta");
      } else if (front) {
        if (x % 3 === 0) S(x, y, z, "stone_bricks");
        else S(x, y, z, "glass_pane", PANE);
      }
    }
  }

  // Cornice and roof slab at the top storey line
  const topY = R - 1;
  if (facade) S(x, topY, z, "stone_bricks");
  else S(x, topY, z, "smooth_stone");

  // Parapet on perimeter
  if (facade) S(x, R, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Stone cornice band just under the parapet on the street and rear faces
for (let x = 0; x < W; x++) {
  for (const z of [0, 2]) {
    if (R - 2 > 0) S(x, R - 2, z, "stone_bricks");
  }
}

// Roof bulkhead / stair-tower housing set back from the street face, on the flat roof
for (let x = 3; x <= 6; x++) {
  for (let y = R; y <= R + 1; y++) {
    if (y >= H) continue;
    S(x, y, 1, "stone_bricks");
  }
}
for (let x = 3; x <= 6; x++) {
  if (R + 2 < H) S(x, R + 2, 1, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Entrance: dark oak door at x=4 on the street face, lantern beside it
const doorX = 4, doorZ = 0;
const doorCell = map.get(`${doorX},${doorZ}`);
if (doorCell) {
  const G = doorCell.G;
  S(doorX, G, doorZ, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  S(doorX, G + 1, doorZ, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  S(3, G + 1, doorZ, "lantern", { hanging: "false", waterlogged: "false" });
}

// Warm light behind glass in the interior air gap
for (const [key, { G }] of map) {
  const [x, z] = key.split(",").map(Number);
  if (z !== 1) continue;
  if (x === 2 || x === 7) {
    for (const off of [1, 5]) {
      const y = G + off;
      if (y < R - 1) S(x, y, z, "glowstone");
    }
  }
  if (x === 5) {
    const y = G + 3;
    if (y < R - 1) S(x, y, z, "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
