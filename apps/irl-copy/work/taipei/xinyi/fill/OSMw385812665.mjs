import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 實踐樓: three-storey mid-century reinforced-concrete institutional block.
// Cream painted walls, light-grey pilasters and belt courses, blue-glass window
// bands, stone-brick plinth, a stone-framed entrance on each long face,
// flat roof with parapet, and a few roof plant boxes.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw385812665";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 97, H = 28, D = 26;
const g = new Voxels([W, H, D]);

const ROOF = 15;       // roof slab level for flat ground
const WALL_TOP = 14;   // last wall course under the roof slab
const DOOR_X = 48;     // central entrance on both long faces

const ground = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const has = (x, z) => ground.has(key(x, z));
const gAt = (x, z) => ground.get(key(x, z));

function put(x, y, z, block, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

const doorProps = (facing, half) => ({
  facing, half, hinge: "left", open: "false", powered: "false",
});

for (const [x, z, gr] of cells) {
  const base = Math.round(gr);
  const roofY = Math.max(ROOF, base);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  // Interior floor slabs at storey lines, and the roof slab across the footprint.
  for (const fy of [5, 10]) {
    if (fy >= base && fy < roofY) put(x, fy, z, "light_gray_concrete");
  }
  put(x, roofY, z, "smooth_stone");

  const exposedS = !has(x, z + 1);
  const exposedN = !has(x, z - 1);
  const exposedE = !has(x + 1, z);
  const exposedW = !has(x - 1, z);
  if (!(exposedS || exposedN || exposedE || exposedW)) continue;

  const face = exposedS ? "S" : exposedN ? "N" : exposedE ? "E" : "W";
  const idx = (face === "N" || face === "S") ? x : z;
  const along = (face === "N" || face === "S") ? x : z;

  // Inner cell one block behind the facade (for light behind glass).
  const inward = { S: [x, z - 1], N: [x, z + 1], E: [x - 1, z], W: [x + 1, z] }[face];

  // Entrance bay on the long faces (N and S).
  const isLongFace = face === "N" || face === "S";
  const inDoorBay = isLongFace && along >= DOOR_X - 2 && along <= DOOR_X + 2;
  const doorCentre = isLongFace && along === DOOR_X;
  const facingOut = face === "S" ? "south" : face === "N" ? "north" : face === "E" ? "east" : "west";

  for (let y = base; y <= WALL_TOP; y++) {
    if (y === base) {
      put(x, y, z, "stone_bricks");                    // plinth / base course
      continue;
    }

    // Entrance: stone surround, door, transom and lintel.
    if (inDoorBay && y <= 4) {
      if (doorCentre && (y === base + 1 || y === base + 2) && base + 2 <= 3) {
        put(x, y, z, "oak_door", doorProps(facingOut, y === base + 1 ? "lower" : "upper"));
        continue;
      }
      if (y === 4 || (y === base + 3 && base + 3 <= 3)) {
        put(x, y, z, "stone_bricks");                  // lintel / transom
        continue;
      }
      if (along === DOOR_X - 2 || along === DOOR_X + 2) {
        put(x, y, z, "stone_bricks");                  // door-surround jambs
        continue;
      }
      if (y >= 1 && y <= 3) {
        put(x, y, z, "stone_bricks");                  // solid stone under the door bay
        continue;
      }
    }

    if (y === 5 || y === 10) { put(x, y, z, "light_gray_concrete"); continue; }     // belt courses
    if (y === 4 || y === 9 || y === 14) { put(x, y, z, "smooth_quartz"); continue; } // spandrels

    // Window rows: pilasters every fourth bay, glass between.
    if (idx % 4 === 0) {
      put(x, y, z, "light_gray_concrete");
    } else {
      put(x, y, z, "light_blue_stained_glass");
      // Sparse warm light behind a few top-storey windows only.
      const [ix, iz] = inward;
      if (y === 12 && idx % 12 === 6 && has(ix, iz) && y >= gAt(ix, iz) && y < Math.max(ROOF, gAt(ix, iz))) {
        put(ix, y, iz, "glowstone");
      }
    }
  }

  // Parapet on the roof edge.
  put(x, roofY + 1, z, "light_gray_concrete");
}

// Roof plant boxes on the roof slab, set back from the facades.
const plantRanges = [[14, 22], [44, 52], [72, 80]];
for (let x = 0; x < W; x++) {
  if (!plantRanges.some(([a, b]) => x >= a && x <= b)) continue;
  for (let z = 9; z <= 16; z++) {
    if (!has(x, z)) continue;
    const roofY = Math.max(ROOF, gAt(x, z));
    for (let y = roofY + 1; y <= roofY + 2; y++) put(x, y, z, "white_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
