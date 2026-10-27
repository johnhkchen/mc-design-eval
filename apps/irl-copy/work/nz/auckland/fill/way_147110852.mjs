// Victoria City Apartments, Auckland (way 147110852): a ten-storey apartment block of the 1990s, concrete frame with
// precast white piers, light-grey spandrel bands and tinted glazing, on a basalt plinth. The lidar roof is 36-41 blocks
// above y 0 (median 40), so the core rises to a 42 parapet (ten storeys of 4 blocks) and the edges step down to 38 (nine),
// with a lift-and-plant box on the core. Lidar roof heights are median-smoothed and snapped to those tiers. Facades are
// built per exposed face, so setbacks show their own walls. Windows are glass panes in the wall with an air gap behind,
// some with glowstone; the entrance is a double dark-oak door with a hanging lantern. Interiors are solid stone, not air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_147110852.cells.json", "utf8"));
const W = 37, D = 28, Y = 54;
const TOWER = 42, WING = 38, PLANT = 45;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// edge distance (1 on the outside ring), BFS through the footprint
const dist = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const edge = !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
  if (edge) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// median-smoothed roof, then tiers: a tower core two cells in from the edge, wings elsewhere
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const T = Array.from({ length: W }, () => Array(D).fill(0));    // top of each column (exclusive)
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const r = median(x, z), d = dist[x][z];
  T[x][z] = r >= 39 && d >= 3 ? TOWER : r >= 34 ? WING : 22;
}
// lift-and-plant box on the tower core: a 9 x 7 block of cells rising to 45
for (let x = 14; x <= 22; x++) for (let z = 10; z <= 16; z++) if (inside(x, z) && T[x][z] === TOWER && dist[x][z] >= 4) T[x][z] = PLANT;

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// faces of a cell exposed at height y: outside the footprint, or beside a neighbour whose column stops below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || T[nx][nz] <= y;
});

// the entrance: the longest run of ground-floor exposed cells on any face, its two middle cells take the double door
const runs = [];
for (const [dir, axis] of [["N", "x"], ["S", "x"], ["E", "z"], ["W", "z"]]) {
  const lines = axis === "x" ? Array.from({ length: D }, (_, z) => z) : Array.from({ length: W }, (_, x) => x);
  for (const line of lines) {
    let cur = [];
    const span = axis === "x" ? W : D;
    for (let u = 0; u <= span; u++) {
      const [x, z] = axis === "x" ? [u, line] : [line, u];
      const ok = u < span && inside(x, z) && exposed(x, z, 2).includes(dir);
      if (ok) cur.push([x, z]); else { if (cur.length) runs.push({ dir, cells: cur }); cur = []; }
    }
  }
}
const best = runs.reduce((a, b) => (b.cells.length > a.cells.length ? b : a), { dir: "N", cells: [] });
const mid = Math.floor(best.cells.length / 2);
const doors = new Map(best.cells.slice(mid - 1, mid + 1).map(([x, z], i) => [`${x},${z}`, { dir: best.dir, hinge: i === 0 ? "left" : "right" }]));

const spec = new Map();                       // "x,y,z" -> { block, state } for every solid cell; air is absent
const put = (x, y, z, block, state) => spec.set(`${x},${y},${z}`, { block, state });
const PANE = (dirs) => (dirs.includes("N") || dirs.includes("S"))
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const glowAt = [];

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const top = T[x][z];
  for (let y = 0; y < top; y++) {
    const ex = exposed(x, z, y);
    if (ex.length === 0) {
      // interior: solid, with the roof membrane on the top
      put(x, y, z, y === top - 1 ? "gray_concrete" : "stone");
      continue;
    }
    // the basalt-style plinth course, the parapet cap
    if (y === 0) { put(x, y, z, "stone_bricks"); continue; }
    if (y === top - 1) { put(x, y, z, "stone_bricks"); continue; }

    // the entrance: a double dark-oak door on the ground storey, a hanging lantern over it
    const door = doors.get(`${x},${z}`);
    if (door && ex.includes(door.dir) && y <= 3) {
      if (y === 3) put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      else put(x, y, z, "dark_oak_door", { facing: { N: "north", S: "south", E: "east", W: "west" }[door.dir], half: y === 1 ? "lower" : "upper", hinge: door.hinge, open: "false", powered: "false" });
      continue;
    }
    // storey lines: the cornice band above the top's second course, and the floor bands
    if (y === top - 2 || y % 4 === 0 || y % 4 === 1) { put(x, y, z, "light_gray_concrete"); continue; }

    // the facade: piers at corners and every fourth bay, glass panes between, an air cell behind each pane
    const face = ex.find(k => k === "N" || k === "S") ?? ex[0];
    const u = face === "N" || face === "S" ? x : z;
    const along = face === "N" || face === "S" ? [[x - 1, z], [x + 1, z]] : [[x, z - 1], [x, z + 1]];
    const corner = ex.length > 1 || along.some(([nx, nz]) => !inside(nx, nz) || T[nx][nz] <= y);
    if (corner || u % 4 === 0) { put(x, y, z, "white_concrete"); continue; }   // piers
    put(x, y, z, "light_blue_stained_glass_pane", PANE([face]));
    if ((x * 31 + z * 17 + y * 7) % 9 === 0) glowAt.push([x - DIRS[face][0], y, z - DIRS[face][1], face]);
  }
}

// the air gap behind each pane: removed, or glowstone on some, so the glass reads lit from inside
for (const [x, y, z] of glowAt) {
  if (!inside(x, z) || exposed(x, z, y).length) continue;
  spec.delete(`${x},${y},${z}`);
  if (y % 4 !== 0 && y % 4 !== 1) put(x, y, z, "glowstone");
}
// the door's lobby is open behind it
for (const [k] of doors) {
  const [x, z] = k.split(",").map(Number);
  const d = DIRS[doors.get(k).dir], ix = x - d[0], iz = z - d[1];
  if (inside(ix, iz)) for (let y = 1; y <= 3; y++) spec.delete(`${ix},${y},${iz}`);
}

const g = new Voxels([W, Y, D]);
for (const [k, { block, state }] of spec) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, block, state); }

const counts = {}; g.forEachCell((i, v) => { counts[v] = (counts[v] || 0) + 1; });
const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_147110852.nbt");
console.log(JSON.stringify({ doors: [...doors.keys()], face: best.dir, tiers: { tower: TOWER, wing: WING, plant: PLANT }, glow: glowAt.length, ...stats }));
