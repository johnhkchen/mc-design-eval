import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3329396.cells.json`, "utf8"));

// 135 Plymouth Street: 1900 brick loft/warehouse with a stone base and cornice,
// commercial shopfront at street level, punched window bays above.
const W = 45, H = 34, D = 43;
const g = new Voxels([W, H, D]);

const info = new Map();
const key = (x, z) => `${x},${z}`;
const has = (x, z) => info.has(key(x, z));

let G0 = Infinity;
for (const [x, z, gr, roof] of cells) {
  info.set(key(x, z), { gr, roof });
  if (gr < G0) G0 = gr;
}
if (!Number.isFinite(G0)) G0 = 0;

// Smooth the lidar roof onto storey lines (3-block storeys above G0).
function topOf(gr, roof) {
  let t = G0 + 3 * Math.round((roof - G0) / 3);
  t = Math.max(t, gr + 6);
  return Math.min(t, H - 5);
}

// Precompute tops so chimneys can check neighbours.
const topMap = new Map();
for (const [x, z, gr, roof] of cells) topMap.set(key(x, z), topOf(gr, roof));

// Door: shell cell on the north (low z) face nearest the middle of the width.
let doorCell = null;
{
  let best = Infinity;
  for (const k of info.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (has(x, z - 1)) continue;
    const d = Math.abs(x - Math.floor(W / 2));
    if (d < best) { best = d; doorCell = [x, z]; }
  }
}

const bricks = "bricks";
const stone = "stone_bricks";

for (const [x, z, gr, roof] of cells) {
  const top = topMap.get(key(x, z));

  const faces = [];
  if (!has(x - 1, z)) faces.push({ f: "west", along: z });
  else if (!has(x + 1, z)) faces.push({ f: "east", along: z });
  else if (!has(x, z - 1)) faces.push({ f: "north", along: x });
  else if (!has(x, z + 1)) faces.push({ f: "south", along: x });
  const shell = faces.length > 0;
  const face = faces[0] ?? null;

  for (let y = 0; y < top; y++) {
    if (y < gr) { g.set(x, y, z, stone); continue; }

    if (!shell) {
      g.set(x, y, z, y === top - 1 ? "smooth_stone" : bricks);
      continue;
    }

    const k = Math.floor((y - G0) / 3);
    const w = (y - G0) % 3;
    const along = face.along;
    const bay = along % 4;

    if (y === top - 1) { g.set(x, y, z, stone); continue; }   // cornice course
    if (w === 0) { g.set(x, y, z, stone); continue; }          // string course / sill line

    let windowBay;
    if (k === 0) windowBay = bay !== 0;                        // shopfront: wide glazing
    else windowBay = bay === 1 || bay === 2;

    if (windowBay) {
      const lit = ((x * 13 + y * 7 + z * 17) % 11) === 0 && (w === 1);
      g.set(x, y, z, lit ? "glowstone" : "glass_pane");
    } else {
      g.set(x, y, z, bricks);
    }
  }

  // Parapet on shell cells.
  if (shell && top < H) g.set(x, top, z, "stone_brick_wall");

  // Sparse roof stacks on interior roof cells whose neighbours share the same top.
  const sameTop = [[1,0],[-1,0],[0,1],[0,-1]].every(([dx, dz]) => {
    const t = topMap.get(key(x + dx, z + dz));
    return t === undefined || t === top;
  });
  if (!shell && sameTop && (x % 9 === 4) && (z % 9 === 4) && top + 3 < H) {
    for (let y = top; y < top + 3; y++) g.set(x, y, z, bricks);
    g.set(x, top + 3, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
}

// Entrance on the north front: stone pilasters flanking a door under a lantern.
if (doorCell) {
  const [dx, dz] = doorCell;
  const { gr } = info.get(key(dx, dz));
  const yb = gr;

  // Stone pilasters on the neighbouring north-face cells, two blocks tall above the door.
  for (const ox of [-1, 1]) {
    const nx = dx + ox;
    if (!has(nx, dz) || has(nx, dz - 1)) continue;
    for (let y = yb; y <= yb + 2 && y < H; y++) g.set(nx, y, dz, stone);
  }

  g.set(dx, yb, dz, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx, yb + 1, dz, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Transom lintel above the door, then a hanging lantern for dusk.
  if (yb + 2 < H) g.set(dx, yb + 2, dz, stone);
  if (yb + 3 < H) g.set(dx, yb + 3, dz, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${DIR}/NYC3329396.nbt`);
