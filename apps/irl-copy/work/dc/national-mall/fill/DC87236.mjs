import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87236.cells.json`, "utf8"));

const W = 6, D = 4, H = 18;
const g = new Voxels([W, H, D]);

const cellMap = new Map();
for (const [x, z, gr, rf] of cells) cellMap.set(`${x},${z}`, { gr, rf });

// Two storeys of 3 blocks for a ~6 block roof; generalised for other spans.
function plan(gr, rf) {
  const span = Math.max(6, rf - gr);
  const n = Math.max(2, Math.round(span / 3));
  const sh = 3;
  const top = Math.min(H - 2, gr + n * sh);
  return { n, sh, top };
}

const FRONT_Z = 0;   // street facade
const BACK_Z = D - 1;
const DOOR_X = 2;

for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    const c = cellMap.get(`${x},${z}`);
    if (!c) continue;
    const gr = c.gr;
    const { n, sh, top } = plan(gr, c.rf);

    // Foundation from y0 up to this cell's ground
    for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

    const perim = x === 0 || x === W - 1 || z === 0 || z === D - 1;
    const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
    const front = z === FRONT_Z;
    const back = z === BACK_Z;
    const side = x === 0 || x === W - 1;
    const winFace = (front || back) && x > 0 && x < W - 1;
    const winSide = side && z > 0 && z < D - 1;

    for (let y = gr; y < top; y++) {
      const rel = y - gr;
      const k = Math.min(n - 1, Math.floor(rel / sh));
      const w = rel - k * sh;          // 0 belt/base, 1 window band, 2 lintel
      const cornice = y === top - 1;

      if (!perim) {
        // Interior: air gap with floor slabs, roof deck at the top
        if (y === gr || (w === 0 && k > 0)) g.set(x, y, z, "oak_planks");
        if (cornice) g.set(x, y, z, "smooth_stone");
        // warm lamps behind front-room glass, upper and lower storeys
        if (w === 1 && x === 1 && z === 1) g.set(x, y, z, "glowstone");
        if (w === 1 && x === 4 && z === 1 && k === n - 1) g.set(x, y, z, "glowstone");
        continue;
      }

      // Perimeter shell: solid masonry at the cornice and base, corners full height
      if (corner || cornice || y === gr) { g.set(x, y, z, "stone_bricks"); continue; }

      // Street door with surround on the ground storey
      if (k === 0 && front && x === DOOR_X && (w === 0 || w === 1)) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "north",
          half: w === 0 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (k === 0 && front && x === DOOR_X && w === 2) {
        g.set(x, y, z, "stone_bricks");      // lintel over door
        continue;
      }

      if (w === 0 && k > 0) { g.set(x, y, z, "white_concrete"); continue; } // storey belt course
      if (w === 2) { g.set(x, y, z, "stone_bricks"); continue; }            // lintel band

      if (w === 1 && (winFace || winSide)) {
        g.set(x, y, z, "glass_pane");
        continue;
      }

      g.set(x, y, z, "bricks");
    }

    // Parapet on the perimeter, standing on the cornice
    if (perim && top < H) {
      g.set(x, top, z, "stone_brick_wall");
    }
  }
}

// Rooftop chimney stack on the interior roof deck
const chim = cellMap.get("1,1");
if (chim) {
  const { top } = plan(chim.gr, chim.rf);
  for (let y = top; y < top + 2 && y < H; y++) g.set(1, y, 1, "bricks");
  if (top + 2 < H) g.set(1, top + 2, 1, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/DC87236.nbt`);
