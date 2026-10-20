import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1334984539";
const cells = JSON.parse(readFileSync(`${BASE}.cells.json`, "utf8"));

// 10 x 10 footprint, roof about 26 blocks above the lowest ground: a
// 1990s five-storey office block with a tinted glass curtain wall,
// pale spandrel bands, a quartz parapet and a roof plant room.
const W = 10, H = 38, D = 10;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const gr = new Map();
for (const [x, z, k] of cells) gr.set(key(x, z), k);
const inFp = (x, z) => gr.has(key(x, z));
const g0 = Math.min(...gr.values());
const TOP = g0 + 26;          // parapet top, relative to lowest ground
const STOREY = 5;             // blocks per storey

function put(x, y, z, b, p) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (!inFp(x, z)) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

// Pass 1: foundations, walls, floors, roof deck
for (const [x, z, ground] of cells) {
  // foundation from y 0 up to this cell's ground
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  const xEdge = !(inFp(x - 1, z) && inFp(x + 1, z));
  const zEdge = !(inFp(x, z - 1) && inFp(x, z + 1));
  const isEdge = xEdge || zEdge;
  const isCorner = xEdge && zEdge;

  for (let y = ground; y < TOP; y++) {
    const rel = y - g0;
    const o = rel % STOREY;            // position within storey
    const k = Math.floor(rel / STOREY); // storey index

    if (isCorner) {
      put(x, y, z, "quartz_pillar", { axis: "y" });
    } else if (isEdge) {
      if (o === 0) {
        put(x, y, z, "light_gray_concrete");          // spandrel / floor line
      } else if (o === 4) {
        put(x, y, z, "white_concrete");               // lower sill band
      } else {
        // window band: mullions every third cell, tinted glass between
        if ((x + z) % 3 === 0) {
          put(x, y, z, "white_concrete");
        } else if (k >= 1 && o === 2 && (x + z + k) % 5 === 0) {
          put(x, y, z, "glowstone");                  // warm lit office
        } else {
          put(x, y, z, "gray_stained_glass");
        }
      }
    } else {
      // interior: only floor slabs, air gap otherwise
      if (y === ground || o === 0) {
        put(x, y, z, "light_gray_concrete");
      }
    }
  }

  // roof: parapet cap on the edge, roof deck inside
  put(x, TOP, z, isEdge ? "quartz_slab" : "light_gray_concrete",
      isEdge ? { type: "bottom", waterlogged: "false" } : undefined);
}

// Pass 2: ground-floor entrance on the south face (z = 9), lanterns beside it
for (const [x, z, ground] of cells) {
  if (z !== 9) continue;
  if (x === 4) {
    put(x, ground, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, ground + 1, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
  if (x === 5) {
    // clear lobby glass beside the door
    put(x, ground, z, "glass");
    put(x, ground + 1, z, "glass");
  }
  if (x === 3 || x === 6) {
    put(x, ground + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Pass 3: roof plant room and lightning rod
const plantY = TOP + 1;
for (let x = 3; x <= 6; x++) {
  for (let z = 3; z <= 6; z++) {
    put(x, plantY, z, "gray_concrete");
  }
}
for (let x = 4; x <= 5; x++) {
  for (let z = 4; z <= 5; z++) {
    put(x, plantY + 1, z, "stone_bricks");
    put(x, plantY + 2, z, "stone_bricks");
  }
}
put(4, plantY + 3, 4, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(`${BASE}.nbt`);
