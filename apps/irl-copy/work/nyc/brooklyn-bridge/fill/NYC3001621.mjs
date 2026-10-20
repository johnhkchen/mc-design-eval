import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001621";
const W = 11, H = 24, D = 6;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const key = (x, z) => `${x},${z}`;

// Footprint cells with their own ground; roof is one flat level for the whole building
const cells = new Map();
const roofs = [];
for (const [x, z, gr, rf] of raw) {
  cells.set(key(x, z), { x, z, g: clamp(Math.round(gr), 0, 12) });
  roofs.push(Math.round(rf));
}
const has = (x, z) => cells.has(key(x, z));
const shell = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

// Shared datum: highest ground under the footprint; downhill cells get the extra solid storey
const base = Math.max(...[...cells.values()].map(c => c.g));
roofs.sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const top = clamp(medRoof, base + 7, 19) - 1; // top = roof slab row (flat roof)

const span = top - base;
const n = Math.floor(span / 3);                  // storeys of about 3 blocks
const L = [];
for (let k = 0; k < n; k++) L.push(base + Math.round((k * span) / n));

const FACES = [[0, -1], [0, 1], [-1, 0], [1, 0]];

for (const c of cells.values()) {
  const { x, z } = c;

  // Foundation / solid plinth up to the shared datum
  for (let y = 0; y < base; y++) g.set(x, y, z, "stone_bricks");

  if (shell(x, z)) {
    // Street-wall column: base course, brick shaft, stone string courses, cornice
    for (let y = base; y <= top; y++) {
      const b = y === base ? "stone_bricks"
        : y === top ? "smooth_stone"
        : L.includes(y) ? "smooth_stone"
        : "bricks";
      g.set(x, y, z, b);
    }

    const exposed = FACES.filter(([dx, dz]) => !has(x + dx, z + dz));
    if (exposed.length === 1) {
      const [dx, dz] = exposed[0];
      const along = dz !== 0 ? x : z;
      const len = dz !== 0 ? W : D;
      const isWindowCol = along % 2 === 1 && along > 0 && along < len - 1;

      if (isWindowCol) {
        for (let k = 0; k < n; k++) {
          const Lk = L[k];
          const nxt = k + 1 < n ? L[k + 1] : top;
          const m = nxt - 1 - Lk;
          if (m < 2) continue;
          for (let y = Lk + 1; y <= nxt - 2; y++) g.set(x, y, z, "glass");
          g.set(x, nxt - 1, z, "stone_bricks"); // lintel
          // warm light on the floor behind some windows
          const ix = x - dx, iz = z - dz;
          if (has(ix, iz) && !shell(ix, iz) && (x * 7 + z * 13 + k * 5) % 3 === 0) {
            g.set(ix, Lk + 1, iz, "glowstone");
          }
        }
      }

      // Front (z = 0) entrance: stone surround, dark wood door
      if (dz === -1) {
        if (x === 4 || x === 6) {
          for (let y = base + 1; y <= base + 3; y++) g.set(x, y, z, "stone_bricks");
        }
        if (x === 5) {
          g.set(x, base + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
          g.set(x, base + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
          g.set(x, base + 3, z, "stone_bricks");
        }
      }
    }

    // Brick chimney stacks standing on the cornice line
    if ((x === 2 && z === 5) || (x === 8 && z === 0)) {
      for (let y = top + 1; y <= top + 2; y++) g.set(x, y, z, "bricks");
      g.set(x, top + 3, z, "smooth_stone");
    }
  } else {
    // Interior: air, with a floor slab at each storey line and the flat roof slab
    for (let k = 0; k < n; k++) g.set(x, L[k], z, "spruce_planks");
    g.set(x, top, z, "stone");
    // Small stair bulkhead on the roof
    if (x === 5 && z === 2) {
      g.set(x, top + 1, z, "bricks");
      g.set(x, top + 2, z, "smooth_stone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
