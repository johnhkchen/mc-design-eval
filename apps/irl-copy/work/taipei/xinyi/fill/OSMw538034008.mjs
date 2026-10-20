import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${dir}/OSMw538034008.cells.json`, "utf8"));

// MOS Burger: two-storey 1990s-2000s commercial block, white render and tile,
// red corporate band, glazed street shopfront on z=0, flat parapet roof.
// Roof top sits about 11 blocks above the lowest ground.

const W = 10, H = 23, D = 23;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.max(0, Math.min(12, Math.round(gr))));
const has = (x, z) => ground.has(key(x, z));

const DOOR_X = 4;
const LANTERN_X = [2, 7];
const SHROOM_X = [2, 6];

for (const [x, z, gr] of cells) {
  const gc = Math.max(0, Math.min(12, Math.round(gr)));          // ground under this cell
  const T = Math.max(11, gc + 11);                               // roof top (exclusive index)
  const edge = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  const front = z === 0;                                         // street frontage

  // Foundation: solid from y 0 up to ground under the cell
  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");
  // Base course / plinth
  g.set(x, gc, z, "stone_bricks");

  if (!edge) {
    // Interior: floor slab per storey and roof slab, no interior detail (air gap)
    g.set(x, gc + 5, z, "smooth_stone");
    g.set(x, T - 1, z, "smooth_stone");
    // Roof equipment: a few plant/AC boxes
    if (((x * 3 + z * 5) % 7) === 0 && T <= 21) g.set(x, T, z, "stone_bricks");
    continue;
  }

  // Ground storey (gc+1 .. gc+3)
  for (let y = gc + 1; y <= gc + 3; y++) {
    if (front) {
      if (x === DOOR_X && y <= gc + 2) {
        // Door handled below
        continue;
      }
      if (LANTERN_X.includes(x) && y === gc + 3) {
        g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      } else if (x === DOOR_X && y === gc + 3) {
        g.set(x, y, z, "glass");
      } else {
        g.set(x, y, z, "glass");
      }
    } else {
      g.set(x, y, z, ((x + z) % 3 === 1) ? "glass" : "white_concrete");
    }
  }
  if (front && x === DOOR_X) {
    g.set(x, gc + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gc + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }

  // Corporate sign band
  g.set(x, gc + 4, z, front ? "red_concrete" : "white_concrete");

  // Storey line
  g.set(x, gc + 5, z, "white_concrete");

  // Second storey windows (gc+6 .. gc+8)
  for (let y = gc + 6; y <= gc + 8; y++) {
    if (front) {
      if (x % 2 === 0) g.set(x, y, z, "glass");
      else g.set(x, y, z, "white_concrete");
    } else {
      g.set(x, y, z, ((x + z) % 2 === 0) ? "glass" : "white_concrete");
    }
  }
  // Warm light behind glass on the street face
  if (front) {
    for (const sx of SHROOM_X) g.set(sx, gc + 7, z, "shroomlight");
  }

  // Wall fill between windows and cornice, if any
  for (let y = gc + 9; y <= T - 3; y++) g.set(x, y, z, "white_concrete");

  // Cornice and parapet
  g.set(x, T - 2, z, "red_concrete");
  g.set(x, T - 1, z, "white_concrete");
}

g.save(`${dir}/OSMw538034008.nbt`);
