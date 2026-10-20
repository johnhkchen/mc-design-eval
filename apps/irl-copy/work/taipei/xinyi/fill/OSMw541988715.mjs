import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541988715.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541988715.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 13, H = 23, D = 13;
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Which exterior side a footprint cell sits on: "N","S","E","W","C" (corner) or null (interior)
function sideOf(x, z) {
  const n = !has(x, z - 1), s = !has(x, z + 1), w = !has(x - 1, z), e = !has(x + 1, z);
  const count = (n ? 1 : 0) + (s ? 1 : 0) + (w ? 1 : 0) + (e ? 1 : 0);
  if (count === 0) return null;
  if (count >= 2) return "C";
  if (n) return "N";
  if (s) return "S";
  if (w) return "W";
  return "E";
}

// Inward offset from an exterior side
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

for (const [x, z, gr] of cells) {
  const side = sideOf(x, z);
  const edge = side !== null;
  const idx = side === "N" || side === "S" ? x : z;
  const faceAxisEW = side === "N" || side === "S";

  // Foundation from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Base course / floor 1 interior floor level
  put(x, gr, z, edge ? "polished_granite" : "smooth_stone");

  // Floor slab between storeys
  if (!edge) put(x, gr + 5, z, "smooth_stone");
  else put(x, gr + 5, z, "smooth_stone");

  // Roof slab over full footprint
  put(x, gr + 10, z, "gray_concrete");

  if (edge) {
    // Parapet
    put(x, gr + 11, z, "white_concrete");

    if (side === "C") {
      // Corner pillars full height
      for (let y = gr + 1; y <= gr + 9; y++) {
        if (y === gr + 5) continue;
        put(x, y, z, "white_concrete");
      }
    } else {
      const [ix, iz] = inward[side];
      const inX = x + ix, inZ = z + iz;
      const interiorOk = has(inX, inZ);

      // Floor 1 (shopfront)
      const isDoor = side === "S" && idx === 6;
      for (let y = gr + 1; y <= gr + 3; y++) {
        if (isDoor) continue;
        if (y === gr + 3 && isDoor) continue;
        put(x, y, z, "glass_pane", faceAxisEW
          ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
      }
      // Shopfront fascia / canopy
      put(x, gr + 4, z, "stone_bricks");

      if (isDoor) {
        put(x, gr + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        put(x, gr + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
      }

      // Warm light behind some shopfront glass
      if (!isDoor && idx % 8 === 1 && interiorOk) {
        put(inX, gr + 2, inZ, "shroomlight");
      }

      // Floor 2 windows
      for (let y = gr + 6; y <= gr + 9; y++) {
        const isWin = idx % 3 === 1;
        if (isWin) {
          put(x, y, z, "glass_pane", faceAxisEW
            ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
            : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
        } else {
          put(x, y, z, "white_concrete");
        }
      }
      if (idx % 3 === 1 && idx % 4 === 1 && interiorOk) {
        put(inX, gr + 7, inZ, "shroomlight");
      }
    }
  }
}

// Roof equipment: light plant box in the centre, lightning-rod mast
for (const [x, z, gr] of cells) {
  if (x >= 5 && x <= 7 && z >= 5 && z <= 7) {
    put(x, gr + 11, z, "light_gray_concrete");
  }
}
if (has(6, 6)) {
  const gr = G.get("6,6");
  put(6, gr + 12, 6, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  put(6, gr + 13, 6, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(OUT);
