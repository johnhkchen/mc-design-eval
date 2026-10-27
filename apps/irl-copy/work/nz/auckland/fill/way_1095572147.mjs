// Way 1095572147: a two-storey Edwardian brick commercial block (Eden Terrace / Mt Eden fringe), flat roof with a brick
// parapet. Record: footprint 30 cells in an 8 x 6 box, ground 0 everywhere, roof 9 blocks above y 0 (about 2 storeys of
// 4 blocks: ground storey y 0-3, upper storey y 4-7, roof layer y 8). Walls are a 1-cell ring of the footprint; the
// cells inside it are air at storey height, with a floor slab at y 0, 4 and a roof deck at y 8, so each storey stands on
// the one below and nothing hangs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${dir}/way_1095572147.cells.json`, "utf8"));   // [x, z, ground, roof]

const H = 22;
const g = new Voxels([8, H, 6]);

// one map of every block, so the glass panes can be connected to their neighbours before anything is written
const blocks = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => { blocks.set(key(x, y, z), { x, y, z, block, state }); };

const foot = new Set(cells.map(([x, z]) => `${x},${z}`));
const has = (x, z) => foot.has(`${x},${z}`);
const roof = Math.max(...cells.map((c) => c[3]));   // 9: the top of layer 8 (the lidar height is uniform here)

for (const [x, z, ground] of cells) {
  // foundation under the cell, from y 0 up to its ground (none here: ground is 0 everywhere)
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  const n = has(x - 1, z), e = has(x + 1, z), nn = has(x, z - 1), s = has(x, z + 1);
  const perimeter = !(n && e && nn && s);
  if (!perimeter) {
    // interior: floor slabs at y 0, 4 and the roof deck at y 8; air between (no interiors)
    put(x, ground, z, "smooth_stone");
    put(x, 4, z, "smooth_stone");
    put(x, roof - 1, z, "gray_concrete");
    // warm light in the air of the ground and upper storey, standing on each floor slab
    if ((x + 2 * z) % 3 === 1) put(x, 1, z, "lantern", { hanging: "false" });
    if ((x + 2 * z) % 3 === 0) put(x, 5, z, "lantern", { hanging: "false" });
    continue;
  }

  // the wall ring: a corner (two or more open sides) is a brick pier; on the other faces an odd bay is a pier and an
  // even bay a window; the street face is shopfront glass between its corners, with the door in the middle
  const open = [n, e, nn, s].filter((v) => !v).length;
  const front = !nn;                              // the street side: the z = 0 face
  const door = front && x === 2 && z === 0;
  const pier = open >= 2 || (!front && (x + z) % 2 === 1);

  put(x, 0, z, "stone_bricks");                   // plinth / base course
  if (door) {
    put(x, 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  } else if (pier) {
    put(x, 1, z, "bricks"); put(x, 2, z, "bricks");
  } else if (front) {
    put(x, 1, z, "glass"); put(x, 2, z, "glass");  // shopfront: solid glass, brighter than the panes above
  } else {
    put(x, 1, z, "glass_pane"); put(x, 2, z, "glass_pane");
  }
  put(x, 3, z, "dark_oak_planks");                 // shopfront fascia / lintel band
  put(x, 4, z, "smooth_stone");                    // storey line (string course)
  if (pier) {
    put(x, 5, z, "bricks"); put(x, 6, z, "bricks");
  } else {
    put(x, 5, z, "glass_pane"); put(x, 6, z, "glass_pane");
  }
  put(x, 7, z, "smooth_stone");                    // dentil-style cornice shelf under the parapet
  put(x, roof - 1, z, "bricks");                   // brick parapet on the edge
}

// connect each glass pane to its neighbours, as a pane does in the world (to panes and to solid blocks)
const solid = (x, y, z) => blocks.has(key(x, y, z));
for (const b of blocks.values()) {
  if (b.block !== "glass_pane") continue;
  const { x, y, z } = b;
  b.state = {
    north: String(solid(x, y, z - 1)), south: String(solid(x, y, z + 1)),
    west: String(solid(x - 1, y, z)), east: String(solid(x + 1, y, z)),
  };
}

for (const b of blocks.values()) g.set(b.x, b.y, b.z, b.block, b.state);

const out = g.save(`${dir}/way_1095572147.nbt`);
console.log(`way_1095572147: ${out.blocks} blocks, palette ${out.palette}`);
