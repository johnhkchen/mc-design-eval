import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE111-0087-14F";
const W = 33, H = 81, D = 75;

// Record: built 2022, Xinyi office/residential tower, ~69 blocks to roof (~14 storeys of 5 blocks).
// Form: stone plinth, a 3-storey podium, two setback tiers of blue-glass curtain wall with
// white concrete mullions and spandrels, a plant penthouse, and a short mast.

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, g] of cells) ground.set(key(x, z), g);
const inside = (x, z) => ground.has(key(x, z));
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Distance from the footprint edge (1 = outermost ring).
const dist = new Map();
const queue = [];
for (const [x, z] of cells) {
  if (N4.some(([dx, dz]) => !inside(x + dx, z + dz))) {
    dist.set(key(x, z), 1);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist.get(key(x, z));
  for (const [dx, dz] of N4) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist.has(key(nx, nz))) {
      dist.set(key(nx, nz), d + 1);
      queue.push([nx, nz]);
    }
  }
}

// Body top (inclusive) per cell: podium 14, tower tier A 49, tier B 69, penthouse 74.
function topOf(x, z) {
  const d = dist.get(key(x, z)) ?? 1;
  const base = d <= 2 ? 14 : d <= 5 ? 49 : d <= 8 ? 69 : 74;
  return Math.max(base, ground.get(key(x, z)));
}

// A cell face is exposed at height y if its neighbour is outside the footprint or lower than y.
function exposedAt(x, z, y) {
  for (const [dx, dz] of N4) {
    const nx = x + dx, nz = z + dz;
    if (!inside(nx, nz)) return true;
    if (topOf(nx, nz) < y) return true;
  }
  return false;
}

// True if a neighbour is a facade at height y (so this cell is the air gap behind the glass).
function nearFacade(x, z, y) {
  for (const [dx, dz] of N4) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && topOf(nx, nz) >= y && exposedAt(nx, nz, y)) return true;
  }
  return false;
}

const g3 = new Voxels([W, H, D]);
const set = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g3.set(x, y, z, id, props);
  else g3.set(x, y, z, id);
};

// Entrance on the minimum-z face, centred on the footprint.
const zMin = Math.min(...cells.map(([, z]) => z));
const xs = cells.map(([x]) => x);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const cx = Math.round((minX + maxX) / 2);
const cz = Math.round((zMin + Math.max(...cells.map(([, z]) => z))) / 2);

for (const [x, z, g] of cells) {
  // Foundation below the ground line.
  for (let y = 0; y < g; y++) set(x, y, z, "stone_bricks");

  const top = topOf(x, z);
  for (let y = g; y <= top; y++) {
    if (y === g) { set(x, y, z, "stone_bricks"); continue; } // plinth course
    const ex = exposedAt(x, z, y);
    const m = y % 5;
    if (m === 0 || m === 4) {
      // Floor slab / spandrel rows (solid so every storey stands on the one below).
      set(x, y, z, ex ? "white_concrete" : "light_gray_concrete");
      continue;
    }
    if (ex) {
      // Glass window band with white concrete mullions every 3 cells.
      set(x, y, z, (x + z) % 3 === 0 ? "white_concrete" : "light_blue_stained_glass");
    } else if (nearFacade(x, z, y)) {
      // Air gap behind the glass, with some warm lights.
      if (m === 2 && (x * 3 + z * 5) % 11 === 0) set(x, y, z, "glowstone");
      else set(x, y, z, "air");
    } else {
      set(x, y, z, "light_gray_concrete");
    }
  }

  // Parapet on edges where the neighbour drops away.
  if (top + 1 < H && N4.some(([dx, dz]) => !inside(x + dx, z + dz) || topOf(x + dx, z + dz) < top)) {
    set(x, top + 1, z, "white_concrete");
  }
}

// Entrance: door at the centre, glass shopfront either side, flush canopy band above.
for (const [x, z, g] of cells) {
  if (z !== zMin || x < cx - 2 || x > cx + 2) continue;
  if (dist.get(key(x, z)) !== 1) continue;
  if (x === cx) {
    set(x, g + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    set(x, g + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  } else {
    set(x, g + 1, z, "light_blue_stained_glass");
    set(x, g + 2, z, "light_blue_stained_glass");
  }
  set(x, g + 3, z, "smooth_stone");
}

// Penthouse plant and mast on the centre, 3x3 then 1x1 then lightning rod.
const centreOK = (x, z) => inside(x, z) && dist.get(key(x, z)) >= 9;
if (centreOK(cx, cz)) {
  for (let y = 75; y <= 77; y++)
    for (let dx = -1; dx <= 1; dx++)
      for (let dz = -1; dz <= 1; dz++)
        if (centreOK(cx + dx, cz + dz)) set(cx + dx, y, cz + dz, "white_concrete");
  set(cx, 78, cz, "white_concrete");
  set(cx, 79, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g3.save(`${DIR}/${ID}.nbt`);
