import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/TPE102-0341-4F.cells.json`, "utf8"));

const W = 18, H = 23, D = 33;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, gr);
const has = (x, z) => gmap.has(`${x},${z}`);

// Lowest ground under the footprint is the datum (first storey)
const minG = Math.min(...cells.map((c) => c[2]));
const ROOF_REL = 11; // roof surface about 11 blocks above lowest ground

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Missing neighbour side => outward facing (edge cell)
const outwardFacing = (x, z) => {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null;
};

// Entrance on the north (z-min) street face, centred at x = 8
const ENTRY_X = 8;
const isEntryHeader = (x, z, facing, rel) =>
  facing === "north" && rel === 3 && x >= ENTRY_X - 1 && x <= ENTRY_X + 1;

for (const [x, z, ground] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < ground; y++) put(x, y, z, "stone");

  const base = Math.max(ground, minG);
  const facing = outwardFacing(x, z);
  const edge = facing !== null;
  const top = minG + ROOF_REL;

  for (let y = base; y <= top; y++) {
    const rel = y - minG;

    if (edge) {
      if (rel > 10) continue; // parapet capped at rel 10

      // Entrance door, lower and upper halves at rel 1 and 2
      if (facing === "north" && x === ENTRY_X && (rel === 1 || rel === 2)) {
        put(x, y, z, "oak_door", {
          facing: "north",
          half: rel === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      // Entrance header over the door: dark wood beam
      if (isEntryHeader(x, z, facing, rel)) {
        put(x, y, z, "dark_oak_planks");
        continue;
      }

      // Corner piers (cells at the ends of the facade) get white tile
      const corner = !has(x - 1, z) || !has(x + 1, z);

      if (rel === 0) { put(x, y, z, "polished_granite"); continue; }        // base course
      if (rel <= 3) {                                                       // shopfront
        if (x % 3 === 0) put(x, y, z, "stone_bricks");                       // posts
        else put(x, y, z, "glass_pane");
        continue;
      }
      if (rel === 4) { put(x, y, z, "smooth_stone"); continue; }            // transom band
      if (rel === 5 || rel === 9) {                                         // storey lines
        put(x, y, z, corner ? "white_concrete" : "white_concrete");
        continue;
      }
      if (rel >= 6 && rel <= 8) {                                           // window grid
        if (x % 3 === 0) put(x, y, z, "white_concrete");                     // mullion piers
        else if (rel === 6 || rel === 8) put(x, y, z, "light_gray_concrete"); // sill and head frames
        else put(x, y, z, "glass_pane");
        continue;
      }
      if (rel === 10) { put(x, y, z, "smooth_stone"); continue; }          // cornice / parapet cap
    } else {
      // Interior: air gap behind glass, floor slab per storey, roof slab
      if (y === ground || rel === 5) {
        put(x, y, z, "smooth_stone");
        continue;
      }
      if (rel === 10) { put(x, y, z, "light_gray_concrete"); continue; }
      // Warm light behind the front windows
      if (rel === 7 && z === 1 && x % 3 === 1 && has(x, 0)) {
        put(x, y, z, "glowstone");
        continue;
      }
      // Roof equipment on the roof slab
      if (rel === 11) {
        if (x >= 3 && x <= 5 && z >= 12 && z <= 14) put(x, y, z, "iron_block");
        else if (x === 12 && z === 20) put(x, y, z, "lightning_rod");
      }
    }
  }
}

g.save(`${DIR}/TPE102-0341-4F.nbt`);
