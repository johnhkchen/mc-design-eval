// A 1980s concrete-frame office block on Mt Eden's slope (way 142976764): a white precast frame with a tinted blue glass
// ribbon, light-grey spandrels, a basalt-look base course and a double-height shopfront lobby on the low (south-east)
// street side. Lidar roofs are median-smoothed and snapped to a 4-block storey grid: a 48 crown (the tower), a 44 ring,
// a 40 wing and a 32 fringe, so the massing steps in as it rises. Every column stands on its own foundation from y 0 to
// its ground, and each storey's white band is solid across the cell, so nothing hangs. Interiors are air with a floor slab
// per storey; glowstone and hanging lanterns sit behind some panes. The crown carries a plant room with a lantern on top.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_142976764";
const cells = JSON.parse(readFileSync(`${SRC}.cells.json`, "utf8"));
const W = 35, D = 35, TOP = 60, LOBBY = 8;
const grid = (v) => Array.from({ length: W }, () => Array(D).fill(v));
const G = grid(-1);                                              // ground (foundation height), -1 = not footprint
const R = grid(0);                                               // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// edge distance (1 on the outside ring), breadth-first through the footprint
const dist = grid(0);
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

// median-smoothed roof, snapped to storey-grid tiers (cap heights are multiples of 4)
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tierOf = (r) => (r >= 46 ? 48 : r >= 40 ? 44 : r >= 36 ? 40 : 32);
const H = grid(0);
const tierCount = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  H[x][z] = Math.max(tierOf(median(x, z)), 4 * Math.ceil((G[x][z] + 4) / 4));
  tierCount[H[x][z]] = (tierCount[H[x][z]] || 0) + 1;
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const OPP = { N: "south", S: "north", E: "west", W: "east" };
// faces of a cell exposed to air at height y: outside the footprint, or beside a neighbour whose top is below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || y >= H[nx][nz];
});
const along = (k, x, z) => (k === "N" || k === "S" ? x : z);   // a face's coordinate along the wall: x on N/S, z on E/W

// the street entrance: the low (south-east) side, where the most footprint cells meet open ground with ground <= 2
const street = { N: [], S: [], E: [], W: [] };
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && G[x][z] <= 2) {
  for (const k of Object.keys(DIRS)) { const [dx, dz] = DIRS[k]; if (!inside(x + dx, z + dz)) street[k].push([x, z]); }
}
const face = Object.keys(street).sort((a, b) => street[b].length - street[a].length)[0];
const run = new Set(), pillars = new Set();
let door = null;
if (street[face].length) {
  const us = street[face].map(([x, z]) => along(face, x, z)).sort((a, b) => a - b);
  const um = us[us.length >> 1];
  const cand = street[face].filter(([x, z]) => Math.abs(along(face, x, z) - um) <= 1);
  for (const [x, z] of cand) run.add(`${x},${z}`);
  door = cand.find(([x, z]) => along(face, x, z) === um) ?? cand[0];
  for (const [x, z] of street[face]) if (Math.abs(along(face, x, z) - um) === 2) pillars.add(`${x},${z}`);
}
const doorKey = door ? `${door[0]},${door[1]}` : null;

const g = new Voxels([W, TOP, D]);
// glazing is whole tinted glass, so the ribbon reads as glass at street distance (thin panes vanish into the frame)
const GLASS = (block = "cyan_stained_glass") => ({ block });
const glowAt = [];
const lanterns = [];

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = H[x][z], d = dist[x][z];
  // foundation: solid from y 0 up to the ground, so the column stands on the slope
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  // roof membrane on the top of the cell, a parapet on the outside ring
  g.set(x, top, z, "light_gray_concrete");
  if (d === 1) g.set(x, top + 1, z, "white_concrete");

  const key = `${x},${z}`;
  for (let y = gr; y < top; y++) {
    const ex = exposed(x, z, y);
    if (ex.length === 0) {
      // interior: air, with a floor slab per storey (and the lobby floor)
      if (y === gr || y % 4 === 0) g.set(x, y, z, "smooth_stone");
      else if (y % 8 === 3 && (x * 5 + z * 3) % 13 === 0 && y + 1 < top) lanterns.push([x, y, z]);   // hangs from the slab above
      continue;
    }
    // the street entrance: a glazed portal with a door, a lintel course and stone pillars on either side
    if (run.has(key) || pillars.has(key)) {
      if (y < gr + 3) {
        if (pillars.has(key)) g.set(x, y, z, "stone_bricks");
        else if (key === doorKey && y === gr) g.set(x, y, z, "dark_oak_door", { facing: OPP[face], half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (key === doorKey && y === gr + 1) g.set(x, y, z, "dark_oak_door", { facing: OPP[face], half: "upper", hinge: "left", open: "false", powered: "false" });
        else if (y === gr) g.set(x, y, z, "stone_bricks");
        else g.set(x, y, z, GLASS().block);
        continue;
      }
      if (y === gr + 3 && run.has(key)) { g.set(x, y, z, "polished_andesite"); continue; }
    }
    if (y < LOBBY) {
      // shopfront: a base course at the ground, glass between piers, the lobby band at the top
      if (y === gr) { g.set(x, y, z, "stone_bricks"); continue; }
      const u = along(ex.includes("N") || ex.includes("S") ? "N" : "E", x, z);
      if (ex.length > 1 || u % 3 === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }
      g.set(x, y, z, GLASS().block);
      continue;
    }
    if (y % 4 === 0) { g.set(x, y, z, "white_concrete"); continue; }                  // floor line band (solid)
    if (y % 4 === 3) { g.set(x, y, z, "light_gray_concrete"); continue; }             // spandrel
    const corner = ex.length > 1;
    const u = along(ex.includes("N") || ex.includes("S") ? "N" : "E", x, z);
    if (corner || u % 3 === 0) { g.set(x, y, z, "white_concrete"); continue; }        // pier
    g.set(x, y, z, GLASS(H[x][z] === 48 ? "gray_stained_glass" : "cyan_stained_glass").block);
    if ((x * 31 + z * 17 + y * 7) % 6 === 0) {
      // warm light behind this pane: the cell just inside the glass, if it is interior air
      const [dx, dz] = DIRS[ex[0]];
      const ix = x - dx, iz = z - dz;
      if (inside(ix, iz) && y % 4 !== 0 && exposed(ix, iz, y).length === 0) glowAt.push([ix, y, iz]);
    }
  }
}

// warm light behind some panes: a glowstone in the interior air, standing on the floor slab
for (const [x, y, z] of glowAt) g.set(x, y, z, "glowstone");
// hanging lanterns from the storey slabs, in some interior bays
for (const [x, y, z] of lanterns) g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });

// the crown's plant room: the largest 3 x 3 block of the 48 tier well inside the ring, standing on the roof membrane
let plant = null;
for (let x = 1; x < W - 1; x++) for (let z = 1; z < D - 1; z++) {
  let ok = true;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (H[x + dx][z + dz] !== 48 || dist[x + dx][z + dz] < 3) ok = false;
  if (ok && (!plant || dist[x][z] > dist[plant[0]][plant[1]])) plant = [x, z];
}
if (plant) {
  const [px, pz] = plant;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let y = 49; y <= 50; y++) g.set(px + dx, y, pz + dz, "light_gray_concrete");
  g.set(px, 51, pz, "lantern", { hanging: "false", waterlogged: "false" });
}
// roof plant on the 44 ring: two low air-handling boxes on the centre-most cells
let ahu = 0;
for (let x = 2; x < W - 2 && ahu < 2; x++) for (let z = 2; z < D - 2 && ahu < 2; z++) {
  let ok = true;
  for (let dx = 0; dx <= 1; dx++) for (let dz = 0; dz <= 1; dz++) if (H[x + dx][z + dz] !== 44 || dist[x + dx][z + dz] < 3) ok = false;
  if (!ok || (ahu === 1 && Math.abs(x - 14) < 6)) continue;
  for (let dx = 0; dx <= 1; dx++) for (let dz = 0; dz <= 1; dz++) g.set(x + dx, 45, z + dz, "iron_block");
  ahu++;
}

const counts = {}; g.forEachCell((i, v) => { counts[v] = (counts[v] || 0) + 1; });
const stats = g.save(`${SRC}.nbt`);
console.log(JSON.stringify({ tiers: tierCount, entrance: { face, door, run: [...run] }, plant, ahu, glow: glowAt.length, lanterns: lanterns.length, ...stats }));
