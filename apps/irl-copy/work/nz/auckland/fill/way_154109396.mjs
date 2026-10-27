// Tetra Serviced Apartments, Auckland (way 154109396): a 13-storey concrete-frame serviced-apartment block of the late
// 20th century on a basalt plinth, the lidar's flat roof at 52 (parapet to 54) with a lift-and-plant enclosure on it.
// The storey grid is absolute (floor slabs every 4 blocks from the ground floor line F, the grid line at or above each
// cell's ground), so a downhill cell carries extra storeys down to its grade. Each storey is a light-grey floor slab
// and three rows of glazing (blue glass panes between white concrete piers), with a spandrel-line band at each floor.
// The ground storey has a basalt base course, a dark-oak entrance with a lintel on the longest street face, and
// glowstone behind some panes, standing on the floor slab with an air gap behind the glass. Interiors are air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154109396";
const cells = JSON.parse(readFileSync(`${FILE}.cells.json`, "utf8"));
const W = 51, D = 49, TOP = 66;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground under each cell (-1 = outside the footprint)
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// edge distance: 1 on the outer ring, BFS through the footprint
const dist = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  if (!inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1)) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// Tiers from the lidar, flattened: the tower reads 52 (lidar 49-54, a 13-storey slab with a 2-block parapet above),
// lower cells keep their own storey count (lidar 13-48, snapped to the 4-block grid), and anything under 13 is a
// one-storey ground wing. F is the ground floor slab, S the roof deck's exclusive top (the deck is row S-1).
const F = Array.from({ length: W }, () => Array(D).fill(0));
const S = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const r = R[x][z], f = 4 * Math.ceil(G[x][z] / 4);
  const tier = r >= 49 ? 52 : r >= 13 ? 4 * Math.round(r / 4) : 0;
  F[x][z] = f; S[x][z] = Math.max(tier, f + 4);
}

const DIRS = [["N", 0, -1], ["S", 0, 1], ["E", 1, 0], ["W", -1, 0]];
const NAME = { N: "north", S: "south", E: "east", W: "west" };
// an interior air row: above its floor slab, below the next, under the roof deck
const air = (x, z, y) => inside(x, z) && y >= F[x][z] && y < S[x][z] - 1 && y % 4 !== 0;
// the faces of a window row that face outside or onto a solid neighbour. A neighbour on another roof height is a wall
// too, even where its interior is air: a taller cell's wall keeps going down past a lower wing's roof, so nothing hangs
const exposed = (x, z, y) => DIRS.filter(([, dx, dz]) => !air(x + dx, z + dz, y) || (inside(x + dx, z + dz) && S[x + dx][z + dz] !== S[x][z])).map(([n]) => n);

// the entrance: the face with the most single-exposed cells on the ground window row, then the middle of its lowest run
const faceRuns = { N: [], S: [], E: [], W: [] };
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const ex = exposed(x, z, F[x][z] + 2);
  if (ex.length === 1) faceRuns[ex[0]].push({ x, z, f: F[x][z], c: ex[0] === "N" || ex[0] === "S" ? x : z });
}
let door = null;
{
  const best = Object.keys(faceRuns).sort((a, b) => faceRuns[b].length - faceRuns[a].length)[0];
  const run = faceRuns[best];
  if (run.length) {
    const minF = Math.min(...run.map(c => c.f));
    const low = run.filter(c => c.f === minF).sort((a, b) => a.c - b.c);
    door = { ...low[low.length >> 1], face: best };
  }
}
const doorLintel = (x, z) => door && (door.face === "N" || door.face === "S" ? z === door.z && Math.abs(x - door.x) <= 1
  : x === door.x && Math.abs(z - door.z) <= 1);

const FULL = ["white_concrete", "light_gray_concrete", "polished_basalt", "gray_concrete", "glowstone"];
const g = new Voxels([W, TOP, D]);

// the facade of one window row of a building cell: the door, the lintel over it, the base course, piers at the corners
// and every fourth column, and glass panes between (their connections are set after the walls are placed)
const facade = (x, y, z, ex) => {
  const f = F[x][z], onGround = y < f + 4;
  if (door && door.x === x && door.z === z && (y === f + 1 || y === f + 2) && ex.includes(door.face)) {
    return g.set(x, y, z, "dark_oak_door", { facing: NAME[door.face], half: y === f + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
  }
  if (y === f + 3 && doorLintel(x, z)) return g.set(x, y, z, "light_gray_concrete");
  if (y === f + 1) return g.set(x, y, z, "polished_basalt");                  // basalt base course
  if (ex.length >= 2) return g.set(x, y, z, onGround ? "polished_basalt" : "white_concrete");
  const coord = ex.includes("N") || ex.includes("S") ? x : z;
  if (coord % 4 === 0) return g.set(x, y, z, onGround ? "polished_basalt" : "white_concrete");
  g.set(x, y, z, "light_blue_stained_glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
};

// the hash picks the lit panes, deterministically
const lit = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const f = F[x][z], s = S[x][z];
  // foundation: solid from y 0 up to the ground floor slab, so nothing floats on the slope
  for (let y = 0; y < f; y++) g.set(x, y, z, "polished_basalt");
  for (let y = f; y < s; y++) {
    if (y === s - 1) g.set(x, y, z, "gray_concrete");                        // roof membrane
    else if (y % 4 === 0) g.set(x, y, z, "light_gray_concrete");           // floor slab per storey: the storey line
    else {
      const ex = exposed(x, z, y);
      if (ex.length) facade(x, y, z, ex);                                    // else interior air behind the glass
    }
  }
  // parapet on the outer ring and where a neighbour stands lower
  const edge = DIRS.some(([, dx, dz]) => !inside(x + dx, z + dz) || S[x + dx][z + dz] < s);
  if (edge) for (let y = s; y < s + 2; y++) g.set(x, y, z, "light_gray_concrete");
}

// warm light behind some upper panes: the interior cell two in from the glass is lit, the one next to it stays air,
// and the lamp stands on the floor slab (row 4k+1)
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  for (let y = F[x][z] + 5; y < S[x][z] - 2; y++) {
    if ((y - F[x][z]) % 4 !== 1) continue;
    const ex = exposed(x, z, y);
    if (ex.length !== 1 || lit(x, y, z) % 3 !== 0) continue;
    const [, dx, dz] = DIRS.find(([n]) => n === ex[0]);
    const x1 = x - dx, z1 = z - dz, x2 = x - 2 * dx, z2 = z - 2 * dz;
    if (air(x1, z1, y) && air(x2, z2, y)) g.set(x2, y, z2, "glowstone");
  }
}

// roof plant: a 7 x 5 lift and plant enclosure on the tower's roof, walls to row 55 with a roof over, placed nearest the
// tower's middle with its footprint wholly on the 52 tier, clear of the parapet
const tower = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && S[x][z] === 52 && dist[x][z] >= 3) tower.push([x, z]);
const cx = tower.reduce((a, [x]) => a + x, 0) / tower.length, cz = tower.reduce((a, [, z]) => a + z, 0) / tower.length;
let box = null;
for (let x0 = 0; x0 + 6 < W; x0++) for (let z0 = 0; z0 + 4 < D; z0++) {
  let ok = true;
  for (let dx = 0; dx < 7 && ok; dx++) for (let dz = 0; dz < 5 && ok; dz++) {
    const x = x0 + dx, z = z0 + dz;
    if (!inside(x, z) || S[x][z] !== 52 || dist[x][z] < 3) ok = false;
  }
  if (ok) {
    const d = Math.hypot(x0 + 3 - cx, z0 + 2 - cz);
    if (!box || d < box.d) box = { x0, z0, d };
  }
}
if (box) {
  for (let dx = 0; dx < 7; dx++) for (let dz = 0; dz < 5; dz++) {
    const x = box.x0 + dx, z = box.z0 + dz, ring = dx === 0 || dx === 6 || dz === 0 || dz === 4;
    g.set(x, 55, z, "gray_concrete");
    if (!ring) continue;
    for (let y = 52; y < 55; y++) g.set(x, y, z, y === 52 ? "polished_basalt" : "light_gray_concrete");
  }
}

// panes connect to the solid and glass neighbours they meet, as the game would draw them
const solidish = (name) => name && (name.endsWith("_pane") || FULL.some(f => name === `minecraft:${f}`));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) for (let y = 0; y < TOP; y++) {
  if (g.get(x, y, z)?.block !== "minecraft:light_blue_stained_glass_pane") continue;
  const nb = (dx, dz) => solidish(g.get(x + dx, y, z + dz)?.block);
  g.set(x, y, z, "light_blue_stained_glass_pane", {
    north: String(nb(0, -1)), south: String(nb(0, 1)), east: String(nb(1, 0)), west: String(nb(-1, 0)), waterlogged: "false",
  });
}

// checks: nothing floats (every block above y 0 rests on a block) except a storey's floor, the roof deck or the plant
// roof over interior air, which the shell around it carries
let floating = 0; const floats = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) for (let y = 1; y < TOP; y++) {
  if (!g.val(x, y, z) || g.val(x, y - 1, z) || y % 4 === 0 || (inside(x, z) && y === S[x][z] - 1) || y === 55) continue;
  floating++; if (floats.length < 12) floats.push([x, y, z, g.get(x, y, z).block]);
}
const stats = g.save(`${FILE}.nbt`);
console.log(JSON.stringify({ floating, floats, door, box, storeys: Math.max(...S.flat()) / 4, ...stats }));
