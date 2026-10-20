import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1188120076";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 39, H = 15, D = 7;
const ROOF_MIN = 3;            // lidar: roof ~3 blocks above lowest ground
const DOOR_XS = [2, 34];       // entrances on the street (z = 0) frontage
const g = new Voxels([W, H, D]);

// footprint lookup and ground levels, normalised so the lowest ground is y 0
const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) { ground.set(`${x},${z}`, gr); minG = Math.min(minG, gr); }
if (!isFinite(minG)) minG = 0;

const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
const isPier = (x) => x % 4 === 0 || x === W - 1;
const isDoor = (x) => DOOR_XS.includes(x);

const OPEN = { waterlogged: "false" };

for (const [key, raw] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gc = raw - minG;

  // foundation and floor slab
  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gc, z, "smooth_stone");

  // storey walls: one storey, roof deck on top, sized to the lidar envelope
  const top = Math.min(H - 2, Math.max(ROOF_MIN, gc + 3));
  const edge = isEdge(x, z);
  const facade = z === 0;
  const back = z === D - 1;

  for (let y = gc + 1; y <= top; y++) {
    if (y === top) { g.set(x, y, z, "smooth_stone"); continue; } // roof deck / cornice
    if (!edge) continue; // interior: air gap, no partitions

    const k = y - gc; // 1 = shopfront row, 2 = transom row
    if (facade) {
      if (isDoor(x)) {
        g.set(x, y, z, "oak_door", {
          facing: "north",
          half: k === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (isPier(x)) {
        g.set(x, y, z, "white_concrete");
      } else {
        g.set(x, y, z, "glass");
        // warm light behind some transom glass, in the air gap at z = 1
        if (k === 2 && x % 8 === 5) g.set(x, y, 1, "glowstone");
      }
    } else if (back) {
      g.set(x, y, z, k === 1 ? "gray_concrete" : "white_concrete");
    } else {
      g.set(x, y, z, "white_concrete");
    }
  }

  // parapet / cornice course standing on the roof on the street face
  if (facade && top + 1 < H) {
    g.set(x, top + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }

  // base course along the street, flush with the floor slab
  if (facade && gc + 1 < top) {
    // kept as walls above; base shows through the foundation stone
  }
}

g.save(`${DIR}/${ID}.nbt`);
