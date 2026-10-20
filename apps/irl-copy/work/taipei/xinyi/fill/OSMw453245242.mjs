import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw453245242.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw453245242.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 17, H = 28, D = 16;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const gMin = Math.min(...cells.map(c => c[2]));
// Roof level: about 16 blocks above the lowest ground.
const T = gMin + 16;

// Neighbour info: which outward faces are open (missing neighbour).
const missingOf = (x, z) => {
  const m = [];
  if (!G.has(key(x - 1, z))) m.push("-x");
  if (!G.has(key(x + 1, z))) m.push("+x");
  if (!G.has(key(x, z - 1))) m.push("-z");
  if (!G.has(key(x, z + 1))) m.push("+z");
  return m;
};

// 1. Foundation: solid from y 0 up to each cell's ground, base course on top.
for (const [x, z, gr] of cells) {
  for (let y = 0; y <= gr; y++) {
    put(x, y, z, y === gr ? "stone_bricks" : "stone");
  }
}

// 2. Storeys: 5-block storeys per column, starting above its own ground.
for (const [x, z, gr] of cells) {
  const base = gr + 1;
  if (base > T) continue;
  const miss = missingOf(x, z);
  const edge = miss.length > 0;
  const corner = miss.some(m => m[1] === "x") && miss.some(m => m[1] === "z");

  // Ground-level floor slab for every cell.
  put(x, base, z, "light_gray_concrete");

  for (let y = base + 1; y <= T - 1; y++) {
    const rel = y - base;
    const k = Math.floor(rel / 5);
    const l = rel % 5;

    if (!edge) {
      if (l === 0) put(x, y, z, "light_gray_concrete"); // floor slab
      continue;
    }

    if (l === 0) { put(x, y, z, "light_gray_concrete"); continue; } // spandrel / floor line
    if (corner) { put(x, y, z, "smooth_quartz"); continue; }

    const pillar = (x + z) % 3 === 0;

    if (k === 0) {
      // Commercial shopfront with frame and base course.
      if (l === 4) { put(x, y, z, "stone_bricks"); continue; }
      if (pillar) { put(x, y, z, "smooth_quartz"); continue; }
      if (l === 2 && (x + z) % 4 === 1) { put(x, y, z, "glowstone"); continue; }
      put(x, y, z, "glass");
      continue;
    }

    // Upper office storeys: window grid with mullions.
    if (l === 4) { put(x, y, z, "light_gray_concrete"); continue; }
    if (pillar) { put(x, y, z, "smooth_quartz"); continue; }
    if (l === 2 && (x * 5 + z * 3 + k * 7) % 9 === 0) {
      put(x, y, z, "shroomlight"); // warm light behind glass
      continue;
    }
    put(x, y, z, "light_blue_stained_glass");
  }

  // Roof slab and cornice course.
  if (edge) put(x, T, z, "smooth_quartz");
  else put(x, T, z, "light_gray_concrete");

  // Parapet on the edge.
  if (edge && T + 1 < H) put(x, T + 1, z, "white_concrete");

  // Rooftop plant boxes on interior cells.
  if (!edge && T + 1 < H && (x * 3 + z * 5) % 7 === 0) {
    put(x, T + 1, z, "light_gray_concrete");
  }
}

// 3. Entrance: on the street-facing (-z) side near the centre of the front.
let door = null;
let best = Infinity;
for (const [x, z, gr] of cells) {
  if (gr + 1 > T - 3) continue;
  const miss = missingOf(x, z);
  if (!miss.length) continue;
  const front = miss.includes("-z") ? 0 : 6;
  const score = Math.abs(x - 8) + front + (miss.includes("-z") ? 0 : Math.abs(z - 7));
  if (score < best) { best = score; door = { x, z, gr, out: miss.includes("-z") ? "-z" : miss[0] }; }
}

if (door) {
  const facingMap = { "-z": "south", "+z": "north", "-x": "east", "+x": "west" };
  const facing = facingMap[door.out];
  const base = door.gr + 1;
  // Recessed entrance: clear the glass row above the door, add a lintel.
  put(door.x, base, door.z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(door.x, base + 1, door.z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  put(door.x, base + 2, door.z, "stone_bricks");
}

g.save(OUT);
