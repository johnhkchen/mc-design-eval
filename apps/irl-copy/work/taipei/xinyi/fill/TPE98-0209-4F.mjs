import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE98-0209-4F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 8, H = 33, D = 5;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, y]) => [key(x, z), y]));
const has = (x, z) => ground.has(key(x, z));

const xs = cells.map(c => c[0]);
const zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const spanX = maxX - minX, spanZ = maxZ - minZ;

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Palette
const GLASS = "light_blue_stained_glass";
const WALL = "white_concrete";      // spandrels
const PIER = "quartz_block";        // piers and corners
const STORY_LINE = "stone_bricks";  // one-block storey line on the perimeter
const SLAB = "light_gray_concrete"; // interior floors (hidden behind walls)
const PLINTH = "polished_granite";
const FASCIA = "polished_andesite";
const FOUNDATION = "gray_concrete";
const PARAPET = "white_concrete";
const LIGHT = "glowstone";
const MECH = "iron_block";

const doorProps = (half) => ({
  facing: "north", half, hinge: "left", open: "false", powered: "false",
});

const doorU = Math.floor(spanX / 2); // door on the north (street) face

for (const [x, z, gr] of cells) {
  const n = !has(x, z - 1), s = !has(x, z + 1);
  const w = !has(x - 1, z), e = !has(x + 1, z);
  const edge = n || s || w || e;
  const corner = (n || s) && (w || e);
  const onNS = n || s;
  const ux = x - minX, uz = z - minZ;
  const u = onNS ? ux : uz;
  const span = onNS ? spanX : spanZ;
  const frontFace = n && !corner;
  const doorCell = frontFace && u === doorU;
  const doorFlank = frontFace && Math.abs(u - doorU) === 1;

  // Foundation up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, FOUNDATION);

  // Floors: interior slab for each storey line, roof deck at top
  for (let k = 0; k <= 4; k++) put(x, gr + 5 * k, z, SLAB);

  if (edge) {
    // Plinth
    put(x, gr, z, corner ? PIER : PLINTH);

    // Storey lines on the perimeter (one stone row per storey, incl. roof cornice)
    for (let k = 1; k <= 4; k++) put(x, gr + 5 * k, z, corner ? PIER : STORY_LINE);

    for (let k = 0; k < 4; k++) {
      const L = gr + 5 * k;
      for (let rel = 1; rel <= 4; rel++) {
        const r = L + rel;
        if (corner) { put(x, r, z, PIER); continue; }

        if (k === 0) {
          // Ground floor shopfront
          if (rel === 4) { put(x, r, z, FASCIA); continue; }
          if (doorCell && rel === 1) { put(x, r, z, "oak_door", doorProps("lower")); continue; }
          if (doorCell && rel === 2) { put(x, r, z, "oak_door", doorProps("upper")); continue; }
          if (doorFlank) { put(x, r, z, PIER); continue; }
          const win = u >= 1 && u <= span - 1;
          put(x, r, z, win ? GLASS : PIER);
          continue;
        }

        // Upper storeys: white spandrels top and bottom, two glass rows between
        if (rel === 1 || rel === 4) { put(x, r, z, WALL); continue; }
        const win = u >= 2 && u <= span - 2;
        if (!win) { put(x, r, z, PIER); continue; }
        if (rel === 2 && (k === 1 || k === 2) && (u + k) % 3 === 0) {
          put(x, r, z, LIGHT);
        } else {
          put(x, r, z, GLASS);
        }
      }
    }

    // Parapet on the roof edge
    put(x, gr + 21, z, corner ? PIER : PARAPET);
  }

  // Roof plant
  if (!edge && ((ux === 2 && uz === 1) || (ux === 5 && uz === 3))) {
    put(x, gr + 21, z, MECH);
  }
}

g.save(`${DIR}/${ID}.nbt`);
