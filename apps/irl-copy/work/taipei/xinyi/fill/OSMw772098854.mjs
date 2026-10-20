import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Building OSMw772098854: a 2-storey Xinyi-style commercial block, roughly 11-12 blocks tall.
// Cream-white concrete piers, glass shopfronts with light grey frames, a stone plinth,
// a rooftop terrace with planters and plant boxes, and lanterns behind the glass at dusk.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw772098854";
const W = 27, D = 12, H = 23;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const has = (x, z) => ground.has(`${x},${z}`);
const isExt = (x, z) =>
  has(x, z) && (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1));

// Which outward face a perimeter cell sits on (N = missing z-1, S = missing z+1, W = missing x-1, E = missing x+1)
function faceOf(x, z) {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  return null;
}

const FACING = { N: "north", S: "south", W: "west", E: "east" };
const INWARD = {
  N: (x, z) => [x, z + 1],
  S: (x, z) => [x, z - 1],
  W: (x, z) => [x + 1, z],
  E: (x, z) => [x - 1, z],
};

for (const [x, z, gr] of cells) {
  const f = faceOf(x, z);
  const exterior = f !== null;
  const b = gr;

  const set = (r, id, p) => {
    const y = b + r;
    if (y < 0 || y >= H) return;
    if (p) g.set(x, y, z, id, p);
    else g.set(x, y, z, id);
  };

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Floor slabs: ground floor (r0), storey line (r5), roof (r10)
  set(0, exterior ? "polished_andesite" : "light_gray_concrete");
  set(5, "light_gray_concrete");
  set(10, exterior ? "smooth_stone" : "light_gray_concrete");

  // Parapet on the perimeter; rooftop terrace planters and plant boxes inside
  if (exterior) {
    set(11, "white_concrete");
  } else if (x % 5 === 1 && z % 4 === 1) {
    set(11, "oak_leaves", { distance: "7", persistent: "true", waterlogged: "false" });
  } else if (x % 9 === 4 && z % 6 === 2) {
    set(11, "iron_block");
  }

  if (!exterior) continue;

  // Facade: piers every 4 cells along the face, glass bays between
  const along = f === "N" || f === "S" ? x : z;
  const pier = along % 4 === 0;

  for (let s = 0; s < 2; s++) {
    for (let kk = 1; kk <= 4; kk++) {
      const r = s * 5 + kk; // storey 1: r1-4, storey 2: r6-9
      const isDoor = f === "N" && s === 0 && along === Math.floor(W / 2);

      if (isDoor) {
        if (kk === 1 || kk === 2) {
          set(r, "oak_door", {
            facing: FACING[f],
            half: kk === 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else {
          set(r, "light_gray_concrete"); // transom and lintel over the entrance
        }
        continue;
      }

      if (pier) {
        set(r, "white_concrete");
        continue;
      }

      if (kk === 1) {
        set(r, s === 0 ? "polished_andesite" : "light_gray_concrete"); // sill / bulkhead
      } else if (kk === 4) {
        set(r, "light_gray_concrete"); // lintel
      } else {
        set(r, "glass_pane"); // kk 2 and 3: glazing

        // Warm light behind the glass, placed in the interior air gap on the floor
        if (kk === 2 && (along + s) % 6 === 1) {
          const [ix, iz] = INWARD[f](x, z);
          if (has(ix, iz) && !isExt(ix, iz)) {
            g.set(ix, b + s * 5 + 1, iz, "lantern", { hanging: "false" });
          }
        }
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
