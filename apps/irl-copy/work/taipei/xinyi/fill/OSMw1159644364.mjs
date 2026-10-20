import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1159644364";
const W = 32, H = 23, D = 33;
const ROOF_TOP = 11;   // parapet top, lidar: ~11 above lowest ground
const DECK = 10;       // roof deck / top cornice course
const FLOOR2 = 5;      // storey line between the two storeys

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map(([x, z, gr]) => [x, z, Math.round(gr)]);
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const missing = (x, z) => ({ n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) });

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

// 1. Foundations: solid from y 0 up to each cell's ground
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// 2. Main body
for (const [x, z, gr] of cells) {
  if (gr >= ROOF_TOP) continue;
  const edge = isEdge(x, z);

  if (!edge) {
    // Interior: floor slabs at ground, storey line and deck; air between
    if (gr <= DECK) {
      put(x, gr, z, "smooth_stone");
      if (FLOOR2 > gr) put(x, FLOOR2, z, "smooth_stone");
      put(x, DECK, z, "light_gray_concrete");
      // roof plant on the deck
      if (gr <= DECK && x % 6 === 2 && z % 6 === 2) {
        put(x, DECK + 1, z, "light_gray_concrete");
        put(x, DECK + 2, z, "iron_block");
      }
    } else {
      put(x, gr, z, "smooth_stone");
    }
    continue;
  }

  // Edge (facade) cell
  const m = missing(x, z);
  const idx = (m.n || m.s) ? x : z;
  const inward = m.n ? [x, z + 1] : m.s ? [x, z - 1] : m.w ? [x + 1, z] : [x - 1, z];
  const inwardInterior = has(inward[0], inward[1]) && !isEdge(inward[0], inward[1]);

  for (let y = gr; y <= DECK && y < H; y++) {
    if (y === gr) {
      put(x, y, z, "polished_granite");                    // base course
    } else if (y === FLOOR2 || y === DECK) {
      put(x, y, z, "smooth_quartz");                       // storey / cornice belts
    } else {
      // window band
      if (idx % 3 === 0) {
        put(x, y, z, "white_concrete");                    // piers
      } else {
        const lit = ((x * 5 + z * 7 + y * 3) % 9) === 0;
        if (lit) {
          put(x, y, z, "yellow_stained_glass");
          if (inwardInterior) put(inward[0], y, inward[1], "glowstone");
        } else {
          put(x, y, z, "light_blue_stained_glass");
        }
      }
    }
  }

  // Parapet with merlons above the deck
  if (DECK + 1 < ROOF_TOP && idx % 2 === 0) {
    put(x, DECK + 1, z, "white_concrete");
  }
}

// 3. Main entrance on the north-most edge, median x
const northRow = cells.filter(([x, z]) => !has(x, z - 1));
if (northRow.length) {
  const minZ = Math.min(...northRow.map(([, z]) => z));
  const row = northRow.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
  const ex = row[Math.floor(row.length / 2)];
  const egr = ground.get(`${ex},${minZ}`);

  // door (two blocks), then a canopy over the entrance bay
  if (egr + 2 < FLOOR2) {
    put(ex, egr + 1, minZ, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(ex, egr + 2, minZ, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
  if (egr + 3 < FLOOR2) {
    for (const dx of [-1, 0, 1]) {
      const cx = ex + dx;
      if (has(cx, minZ)) put(cx, egr + 3, minZ, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
