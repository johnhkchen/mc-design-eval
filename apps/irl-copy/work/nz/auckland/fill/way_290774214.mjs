// way 290774214: a 1930s brick-and-stone commercial block (stripped classical, three storeys over a stone plinth), on the
// Mt Eden / Eden Terrace slope. Red brick walls, stone string courses and lintels, a shopfront and a door on the street face,
// glass-pane bays with warm lights behind some panes, a stone parapet and a dark flat roof with a plant room on the tallest tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_290774214.cells.json", "utf8"));
const X = 54, Y = 28, Z = 47;
const D = 6;                                   // ground-floor datum: the highest ground under the footprint, so every cell has its ground floor above ground

// footprint: key "x,z" -> { g: ground, r: roof height above y0 }; the roof is smoothed to clean tiers by a 3x3 mode (own value wins ties)
const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, r: r });
const inFp = (x, z) => fp.has(`${x},${z}`);
// two passes: one pass left ragged steps along the tier edges, the second settles them into flat tiers
for (let pass = 0; pass < 2; pass++) {
  for (const [k, c] of fp) {
    const [x, z] = k.split(",").map(Number), n = new Map();
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const o = fp.get(`${x + dx},${z + dz}`); if (!o) continue; n.set(o.r, (n.get(o.r) ?? 0) + (dx || dz ? 1 : 1.5));
    }
    let best = c.r, bestN = n.get(c.r) ?? 0;
    for (const [v, cnt] of n) if (cnt > bestN) { best = v; bestN = cnt; }
    c.next = best;
  }
  for (const c of fp.values()) { c.r = c.next; }
}
const R = (x, z) => fp.get(`${x},${z}`).r;

// outward normals of a footprint cell that stand free at height y: the edge of the footprint, or a neighbour whose roof is
// below y (a setback face). Each direction: [dx, dz, name]
const DIRS = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
const wallDirs = (x, z, y) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz) || R(x + dx, z + dz) <= y);

const g = new Voxels([X, Y, Z]);
const set = (x, y, z, block, state) => g.set(x, y, z, block, state);
const paneState = (dirs) => {
  // a pane runs along the wall: connect in the wall's own plane, not out of it
  const alongZ = dirs.some(([dx]) => dx !== 0);   // wall normal is x, so the pane runs along z
  return { north: String(alongZ), south: String(alongZ), east: String(!alongZ), west: String(!alongZ), waterlogged: "false" };
};

// the entrance: the longest run of single-face street wall at ground level, its middle cell
const faceCount = new Map();
for (const [k, c] of fp) {
  const [x, z] = k.split(",").map(Number), d = wallDirs(x, z, D);
  if (d.length !== 1) continue;
  const key = d[0][2]; if (!faceCount.has(key)) faceCount.set(key, []);
  faceCount.get(key).push([x, z, d[0]]);
}
let door = null;
{
  let bestFace = null;
  for (const [name, list] of faceCount) if (!bestFace || list.length > bestFace[1].length) bestFace = [name, list];
  if (bestFace) {
    const list = bestFace[1].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const mid = list[Math.floor(list.length / 2)];
    door = { x: mid[0], z: mid[1], out: mid[2] };
  }
}
const isDoor = (x, z, y) => door && door.x === x && door.z === z && (y === D || y === D + 1 || y === D + 2);

// 1. the body: plinth and foundation, the three storeys, the roof and the parapet, per footprint cell
for (const [k, c] of fp) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < D; y++) {
    set(x, y, z, y === D - 1 ? "smooth_stone" : "stone_bricks");        // the plinth, with a base course capping it
  }
  for (let y = D; y < c.r; y++) {
    const dirs = wallDirs(x, z, y), ring = dirs.length > 0;
    if (y === c.r - 1) {                                               // the top course: parapet on the walls, roof cover inside
      if (ring) set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      else set(x, y, z, "stone");
      continue;
    }
    if (!ring) {
      if ((y - D) % 4 === 0) set(x, y, z, "smooth_stone");              // floor slab per storey; air between
      continue;
    }
    if (isDoor(x, z, y)) continue;                                      // the door bay is set after the walls
    const r = (y - D) % 4;
    if (r === 0) { set(x, y, z, "smooth_stone"); continue; }             // string course
    if (r === 3) { set(x, y, z, "stone_bricks"); continue; }            // lintel band
    // rows 1 and 2 are the window band: a pier of brick every third bay (every fourth on the shopfront), glass between
    const corner = dirs.length > 1 && dirs.some(([dx]) => dx) && dirs.some(([, dz]) => dz);
    const alongZ = dirs.some(([dx]) => dx !== 0), t = alongZ ? z : x;
    const period = y - D < 4 ? 4 : 3;
    if (corner || t % period === 0) { set(x, y, z, "bricks"); continue; }
    set(x, y, z, "glass_pane", paneState(dirs));
  }
}

// 2. the entrance: the door with its glass transom, and a stone hood over it
if (door) {
  const facing = door.out[2];
  const doorState = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false", waterlogged: "false" });
  set(door.x, D, door.z, "dark_oak_door", doorState("lower"));
  set(door.x, D + 1, door.z, "dark_oak_door", doorState("upper"));
  set(door.x, D + 2, door.z, "stone_brick_stairs", { facing, half: "top", shape: "straight", waterlogged: "false" });
}

// 3. warm light: a glowstone just inside some of the lower window panes, on the floor slab, in the air behind the glass
for (const [k, c] of fp) {
  const [x, z] = k.split(",").map(Number);
  for (let y = D + 1; y < c.r - 2; y++) {
    if ((y - D) % 4 !== 1) continue;
    const dirs = wallDirs(x, z, y);
    if (dirs.length !== 1) continue;
    const [dx, dz] = dirs[0], ix = x - dx, iz = z - dz;
    if (!inFp(ix, iz) || wallDirs(ix, iz, y).length) continue;
    if (((x * 7 + z * 13 + y * 3) % 9) !== 0) continue;
    set(ix, y, iz, "glowstone");
  }
}

// 4. roof equipment: a plant room 7 x 5 on the tallest tier, set in from the parapet, two blocks high
{
  const top = [...fp.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => R(x, z) === 15);
  let placed = false;
  for (const [x0, z0] of top) {
    if (placed) break;
    let ok = true;
    for (let dz = 0; dz < 5 && ok; dz++) for (let dx = 0; dx < 7 && ok; dx++) {
      const x = x0 + dx, z = z0 + dz;
      if (!inFp(x, z) || R(x, z) !== 15) ok = false;
      if (ok) for (const [ax, az] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!inFp(x + ax, z + az) || R(x + ax, z + az) < 15) ok = false;
    }
    if (!ok) continue;
    placed = true;
    for (let dz = 0; dz < 5; dz++) for (let dx = 0; dx < 7; dx++) {
      const x = x0 + dx, z = z0 + dz;
      set(x, 15, z, "bricks");
      set(x, 16, z, dz === 0 || dz === 4 || dx === 0 || dx === 6 ? "stone_brick_slab" : "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_290774214.nbt");
console.log("saved", stats);
