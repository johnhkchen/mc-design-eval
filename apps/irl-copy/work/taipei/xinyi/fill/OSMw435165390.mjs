import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const W = 85, H = 86, D = 55;
const ROOF = 74;          // roof level above y 0 (lowest ground), from lidar
const STOREY = 5;
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw435165390.cells.json", "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const foot = new Map();
for (const [x, z, gr] of cells) foot.set(key(x, z), gr);
const inF = (x, z) => foot.has(key(x, z));

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const cx = Math.round((minX + maxX) / 2);
const cz = Math.round((minZ + maxZ) / 2);

function put(x, y, z, id, p) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
}

// Entrance: north-face edge cell closest to the centre line.
let doorKey = null, bestD = Infinity;
for (const [x, z] of cells) {
  if (!inF(x, z - 1) && Math.abs(x - cx) < bestD) {
    bestD = Math.abs(x - cx);
    doorKey = key(x, z);
  }
}

const GLASS = "light_blue_stained_glass_pane";
const PILLAR = "white_concrete";
const BAND = "light_gray_concrete";

for (const [x, z, gr] of cells) {
  // Foundation
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const nW = !inF(x - 1, z), nE = !inF(x + 1, z);
  const nN = !inF(x, z - 1), nS = !inF(x, z + 1);
  const faces = [nW, nE, nN, nS].filter(Boolean).length;
  const edge = faces > 0;
  const corner = faces >= 2;
  const u = (nW || nE) ? z : x;     // position along the wall
  const isDoor = key(x, z) === doorKey;

  const n = Math.floor((ROOF - gr) / STOREY);
  for (let s = 0; s < n; s++) {
    const base = gr + s * STOREY;
    const ground = s === 0;

    // Floor slab / storey line
    put(x, base, z, ground && edge ? "stone_bricks" : BAND);
    if (!edge) continue;

    // Storey 1..3: pillars and windows
    for (let rel = 1; rel <= 3; rel++) {
      const y = base + rel;
      if (isDoor && ground) {
        if (rel === 1 || rel === 2) {
          put(x, y, z, "dark_oak_door", {
            facing: "north", half: rel === 1 ? "lower" : "upper",
            hinge: "left", open: "false", powered: "false",
          });
        } else {
          put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        }
        continue;
      }
      if (corner || u % 4 === 0) {
        put(x, y, z, ground ? "polished_andesite" : PILLAR);
      } else if (rel === 2 && !ground && s % 3 === 1 && u % 8 === 6) {
        put(x, y, z, "glowstone");           // lit room behind glass
      } else if (rel === 2 && ground && u % 8 === 6) {
        put(x, y, z, "glowstone");
      } else {
        put(x, y, z, GLASS);
      }
    }
    // Storey line above the window band
    put(x, base + 4, z, BAND);
  }

  // Leftover course between last storey and roof
  for (let y = gr + n * STOREY; y < ROOF; y++) {
    put(x, y, z, edge ? PILLAR : BAND);
  }
  // Roof slab on every cell
  put(x, ROOF - 1, z, BAND);

  // Parapet on edges
  if (edge) {
    put(x, ROOF, z, PILLAR);
    put(x, ROOF + 1, z, PILLAR);
  }

  // Rooftop plant room, centred
  if (!edge && Math.abs(x - cx) <= 12 && Math.abs(z - cz) <= 8) {
    for (let y = ROOF; y <= ROOF + 3; y++) {
      const ring = Math.abs(x - cx) === 12 || Math.abs(z - cz) === 8;
      if (ring && y >= ROOF + 1 && y <= ROOF + 2) put(x, y, z, GLASS);
      else put(x, y, z, BAND);
    }
  }
}

// Antenna on the plant room
put(cx, ROOF + 4, cz, "iron_bars");
put(cx, ROOF + 5, cz, "iron_bars");
put(cx, ROOF + 6, cz, "lightning_rod", { facing: "up", waterlogged: "false", powered: "false" });

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw435165390.nbt");
