// Tower Centre, Auckland CBD (way 154089909): a 1980s-90s glass-and-concrete office tower, about 20 storeys (roof about
// 84 blocks = 70 m above its lowest ground), on a stepped massing. Lidar roof heights are median-smoothed over 5x5 and
// snapped to a 4-block storey grid, so the footprint steps in tiers (84 core, 80, 76 wings, 72 and 68 at the low
// edges), each tier standing on the storey below and carried down to the ground by a granite foundation. The facade is
// a 4-block storey rhythm: white concrete floor lines and piers, a light-grey spandrel, tinted cyan glass between,
// granite base course with shopfront glass on the ground floor and a dark-oak entrance with a lintel on the lowest
// street face. Each tier has a white cornice and parapet on its edge, and the core carries two plant boxes with
// shroomlight crowns. Warm light: glowstone behind some panes and at the lobby. Interiors are air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154089909.cells.json", "utf8"));
const W = 48, D = 48, TOP = 96;
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

// median-smoothed roof (5x5), snapped to the storey grid: each tier is a whole number of storeys above the ground
const median = (x, z) => {
  const v = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const H = Array.from({ length: W }, () => Array(D).fill(0));   // top tier: the cap sits at H - 1
const tiers = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const snapped = 4 * Math.round(median(x, z) / 4);
  const minTop = 4 * Math.ceil((G[x][z] + 8) / 4);              // at least two storeys above the ground under the cell
  H[x][z] = Math.max(snapped, minTop);
  tiers[H[x][z]] = (tiers[H[x][z]] || 0) + 1;
}
const maxTop = Math.max(...cells.map(([x, z]) => H[x][z]));

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// faces of a cell exposed at height y: outside the footprint, or beside a neighbour that stops below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || H[nx][nz] <= y;
});
const PANE = (dirs) => (dirs.includes("N") || dirs.includes("S"))
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// the entrance: on the lowest street face (the lowest ground, then the tallest), a 3-cell bay with the door in the middle
const cand = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  for (const k of exposed(x, z, G[x][z] + 1)) if (k !== "" && (k === "N" || k === "S" || k === "E" || k === "W")) cand.push({ x, z, k, gr: G[x][z], top: H[x][z] });
}
cand.sort((a, b) => a.gr - b.gr || b.top - a.top);
const onFace = (x, z, k) => inside(x, z) && exposed(x, z, G[x][z] + 1).includes(k);
let ent = null;
for (const c of cand) {
  const [tx, tz] = c.k === "N" || c.k === "S" ? [1, 0] : [0, 1];
  if ([-1, 0, 1].every(o => onFace(c.x + o * tx, c.z + o * tz, c.k))) { ent = { ...c, tx, tz }; break; }
}
const entrance = new Map();   // "x,z" -> role: 'door' | 'bay'
if (ent) {
  for (const o of [-1, 0, 1]) entrance.set(`${ent.x + o * ent.tx},${ent.z + o * ent.tz}`, o === 0 ? "door" : "bay");
}

const g = new Voxels([W, TOP, D]);
const glowAt = [];

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = H[x][z], d = dist[x][z];
  const base = 4 * Math.floor(gr / 4) + 4;                     // the base band runs up to the first floor line
  const ent_ = entrance.get(`${x},${z}`);
  // foundation: granite from y 0 up to the ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "polished_granite");

  for (let y = gr; y <= top - 2; y++) {
    const ex = exposed(x, z, y);
    if (ex.length === 0) {
      // interior: air, with a floor slab per storey (and the ground floor)
      if (y === gr || y % 4 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (ent_ === "door" && y - gr <= 1) {
      const face = ex.find(k => k === "N" || k === "S" || k === "E" || k === "W");
      g.set(x, y, z, "dark_oak_door", { facing: { N: "north", S: "south", E: "east", W: "west" }[face], half: y === gr ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y === gr) { g.set(x, y, z, "polished_granite"); continue; }                // plinth
    if (ent_ && y === gr + 2) { g.set(x, y, z, "polished_granite"); continue; }   // entrance lintel over the bay
    if (y < base) {                                                                  // ground-floor base band: shopfront
      const u = ex.includes("N") || ex.includes("S") ? x : z;
      if (u % 3 === 0 || ex.length > 1) g.set(x, y, z, "polished_granite");
      else g.set(x, y, z, "light_blue_stained_glass_pane", PANE(ex));
      continue;
    }
    if (y % 4 === 0) { g.set(x, y, z, "white_concrete"); continue; }               // floor line
    if (y % 4 === 3) { g.set(x, y, z, "light_gray_concrete"); continue; }          // spandrel
    const corner = (ex.includes("N") || ex.includes("S")) && (ex.includes("W") || ex.includes("E"));
    const face = ex.includes("N") || ex.includes("S") ? ex.find(k => k === "N" || k === "S") : ex[0];
    const u = face === "N" || face === "S" ? x : z;
    if (corner || u % 4 === 0) { g.set(x, y, z, "white_concrete"); continue; }     // pier: three panes to a bay, so the glass reads
    g.set(x, y, z, "cyan_stained_glass_pane", PANE(ex));
    if ((x * 31 + z * 17 + y * 7) % 9 === 0) glowAt.push([x - DIRS[face][0], y, z - DIRS[face][1], x, z]);
  }

  // the roof: a white cornice on the tier's edges with a parapet, the membrane elsewhere
  const edgeTier = exposed(x, z, top - 1).length > 0;
  g.set(x, top - 1, z, edgeTier ? "white_concrete" : "smooth_stone");
  if (edgeTier) g.set(x, top, z, "white_concrete");
  // the entrance bay's glass and the lobby: a warm lamp behind the door (inside, on the floor slab)
  if (ent_ === "door") {
    const k = exposed(x, z, gr + 1)[0];
    const [dx, dz] = DIRS[k];
    if (inside(x - dx, z - dz) && exposed(x - dx, z - dz, gr + 1).length === 0) glowAt.push([x - dx, gr + 1, z - dz, -1, -1]);
  }
}

// warm light behind some panes: an interior air cell next to the glass, standing on the floor slab
for (const [x, y, z] of glowAt) if (inside(x, z) && exposed(x, z, y).length === 0 && y % 4 !== 0) g.set(x, y, z, "glowstone");

// roof plant: two solid 3x3 plant boxes on the core's top tier (away from the cornice), each with a shroomlight crown
const plant = [];
for (let x = 2; x < W - 2; x++) for (let z = 2; z < D - 2; z++) {
  let ok = true;
  for (let dx = -2; dx <= 2 && ok; dx++) for (let dz = -2; dz <= 2 && ok; dz++) if (!inside(x + dx, z + dz) || H[x + dx][z + dz] !== maxTop) ok = false;
  if (ok) plant.push([x, z]);
}
const pick = [];
for (const [x, z] of plant) {
  if (pick.every(([px, pz]) => Math.abs(px - x) >= 9 || Math.abs(pz - z) >= 9)) pick.push([x, z]);
  if (pick.length === 2) break;
}
for (const [cx, cz] of pick) {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let y = maxTop; y <= maxTop + 2; y++) g.set(cx + dx, y, cz + dz, "light_gray_concrete");
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) g.set(cx + dx, maxTop + 3, cz + dz, "smooth_stone");
  g.set(cx, maxTop + 4, cz, "shroomlight");
}

const counts = {}; g.forEachCell((i, v) => { counts[v] = (counts[v] || 0) + 1; });
const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154089909.nbt");
console.log(JSON.stringify({ tiers, maxTop, entrance: ent ? { x: ent.x, z: ent.z, face: ent.k, gr: ent.gr } : null, plant: pick, glow: glowAt.length, ...stats }));
