// Galbraith's Alehouse, Mt Eden: a two-storey Edwardian masonry commercial block (red brick on a stone plinth, stone string
// courses and quoins, a parapet), with a taller attic core set back two blocks from the street edges. The lidar roof gives
// 10 blocks above the lowest ground, so the envelope is three clean tiers: wings to 6, the body to 8, a core to 10.
// Solid massing from y 0 to each tier's top (nothing floats); window and door openings carve a one-block air gap behind the
// glass; a few windows carry glowstone two blocks back.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_261494257.cells.json", "utf8"));
const SIZE = [35, 23, 36];
const key = (x, z) => `${x},${z}`;
const F = new Map();
for (const [x, z, g, r] of cells) F.set(key(x, z), { g, r });
const has = (x, z) => F.has(key(x, z));
const groundAt = (x, z) => F.get(key(x, z)).g;
const H4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIR_NAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// depth in from the footprint edge (edge cells are 1)
const depth = new Map(); const queue = [];
for (const [x, z] of cells) if (H4.some(([dx, dz]) => !has(x + dx, z + dz))) { depth.set(key(x, z), 1); queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = depth.get(key(x, z));
  for (const [dx, dz] of H4) if (has(x + dx, z + dz) && !depth.has(key(x + dx, z + dz))) { depth.set(key(x + dx, z + dz), d + 1); queue.push([x + dx, z + dz]); }
}

// tiers: wings 6, body 8, core 10 (setback two blocks in from the edge where lidar reads 9+)
const topAt = (x, z) => {
  const { r } = F.get(key(x, z));
  if (r <= 6) return 6;
  if (r >= 9 && depth.get(key(x, z)) >= 3) return 10;
  return 8;
};
const solid = (x, y, z) => has(x, z) && y >= 0 && y < topAt(x, z);
// horizontal exposures of a solid voxel: the outward directions it faces
const exposed = (x, y, z) => H4.filter(([dx, dz]) => !solid(x + dx, y, z + dz));
const along = (dx, x, z) => (dx !== 0 ? z : x);   // coordinate running along a face

// entrance: the face direction with the most ground-storey wall cells (ground 0..1), door at its middle cell
const faceCount = new Map();
for (const [x, z, g] of cells) if (g <= 1) for (const d of exposed(x, g + 1, z)) {
  const k = `${d[0]},${d[1]}`; faceCount.set(k, (faceCount.get(k) || 0) + 1);
}
const doorDir = [...faceCount.entries()].sort((a, b) => b[1] - a[1])[0][0].split(",").map(Number);
const doorCandidates = cells.filter(([x, z, g]) => g <= 1 && exposed(x, g + 1, z).some(([dx, dz]) => dx === doorDir[0] && dz === doorDir[1]))
  .map(([x, z, g]) => ({ x, z, g, d: doorDir }))
  .sort((a, b) => along(a.d[0], a.x, a.z) - along(b.d[0], b.x, b.z));
const door = doorCandidates[Math.floor(doorCandidates.length / 2)];

const carved = new Set();          // interior air cells behind glass and the door
const windows = new Map();         // "x,y,z" -> { d, lintel }
const glows = new Set();
const isFront = (d) => d[0] === doorDir[0] && d[1] === doorDir[1];
const inDoor = (x, z) => door && x === door.x && z === door.z;

// window rows per cell: ground storey (g+1..3, shopfront glass on the street face), storey two (5..6), attic (8, core only)
for (const [x, z, g] of cells) {
  const t = topAt(x, z);
  const ex = exposed(x, 0, z);   // placeholder for corner test below
  for (let y = g + 1; y < t - 1; y++) {
    const exAt = exposed(x, y, z);
    if (!exAt.length) continue;
    const d = exAt[0];
    const idx = along(d[0], x, z);
    const ground = y <= 3;
    const upper = (y === 5 || y === 6) && t >= 8;
    const attic = y === 8 && t === 10;
    if (!ground && !upper && !attic) continue;
    if (ground && y > Math.min(3, t - 2)) continue;
    if (ground && isFront(d) ? idx % 4 === 0 : idx % 3 === 0) continue;   // piers
    if (inDoor(x, z)) continue;
    if (door && x === door.x && z === door.z) continue;
    if (door && isFront(d) && ground && Math.abs(idx - along(doorDir[0], door.x, door.z)) <= 1 && y <= door.g + 3) continue;
    windows.set(`${x},${y},${z}`, { x, y, z, d, lintel: y === 6 && t >= 8 });
  }
}
// the door: two halves, a one-block air gap behind it
if (door) {
  const d = door.d;
  carved.add(`${door.x - d[0]},${door.g + 1},${door.z - d[1]}`);
  carved.add(`${door.x - d[0]},${door.g + 2},${door.z - d[1]}`);
}
for (const w of windows.values()) {
  carved.add(`${w.x - w.d[0]},${w.y},${w.z - w.d[1]}`);
  if ((w.x * 7 + w.z * 3 + w.y) % 5 === 0 && solid(w.x - 2 * w.d[0], w.y, w.z - 2 * w.d[1])) glows.add(`${w.x - 2 * w.d[0]},${w.y},${w.z - 2 * w.d[1]}`);
}

const g = new Voxels(SIZE);
const DOOR_NAME = DIR_NAME[`${doorDir[0]},${doorDir[1]}`];
for (const [x, z] of cells) {
  const t = topAt(x, z), gr = groundAt(x, z), dp = depth.get(key(x, z));
  for (let y = 0; y < t; y++) {
    if (carved.has(`${x},${y},${z}`)) continue;
    const ex = exposed(x, y, z);
    const top = y === t - 1 && !solid(x, y + 1, z);
    if (glows.has(`${x},${y},${z}`)) { g.set(x, y, z, "glowstone"); continue; }
    if (y < gr) { g.set(x, y, z, "stone_bricks"); continue; }                        // foundation
    if (top) { g.set(x, y, z, ex.length ? "stone_bricks" : "gray_concrete"); continue; }   // coping and roof membrane
    const w = windows.get(`${x},${y},${z}`);
    if (w) { g.set(x, y, z, "glass_pane"); continue; }
    if (ex.length >= 2) { g.set(x, y, z, "stone_bricks"); continue; }                // quoins
    if (ex.length === 1 && door && x === door.x && z === door.z && (y === door.g + 1 || y === door.g + 2)) {
      g.set(x, y, z, "dark_oak_door", { facing: DOOR_NAME, half: y === door.g + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (ex.length === 1 && door && door.d && !!isFront(ex[0]) && along(ex[0][0], x, z) !== undefined) {
      const idx = along(ex[0][0], x, z), di = along(doorDir[0], door.x, door.z);
      if (Math.abs(idx - di) === 1 && y >= door.g + 1 && y <= door.g + 3) { g.set(x, y, z, "stone_bricks"); continue; }
      if (idx === di && y === door.g + 3) { g.set(x, y, z, "stone_bricks"); continue; }
    }
    if (ex.length === 1 && y === gr) { g.set(x, y, z, "stone_bricks"); continue; }   // base course
    if (ex.length === 1 && y === 4) { g.set(x, y, z, "stone_bricks"); continue; }    // string course
    if (ex.length === 1 && y === 6 && t >= 8) { g.set(x, y, z, "white_concrete"); continue; }  // sash frame head
    if (ex.length === 1 && y === 6) { g.set(x, y, z, "bricks"); continue; }
    g.set(x, y, z, "bricks");
  }
  // lintels above upper windows (the course above a window row) read as white stone frames
}

// roof plant: a few HVAC units on the core and the body roof
for (const [x, z] of cells) {
  const t = topAt(x, z), dp = depth.get(key(x, z));
  if (t === 10 && dp >= 4 && (x * 3 + z * 5) % 11 === 0) g.set(x, t, z, "iron_block");
  if (t === 8 && dp >= 3 && (x + 2 * z) % 13 === 0) g.set(x, t, z, "iron_block");
}

const counts = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_261494257.nbt");
console.log(JSON.stringify({ door: door && { x: door.x, z: door.z, g: door.g, face: DOOR_NAME }, windows: windows.size, glows: glows.size, ...counts }));
