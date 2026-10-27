// Queens Square Residences (way 243876088): a 2000s waterfront apartment block at the Viaduct end of the CBD. A polished
// basalt plinth (Auckland's volcanic rock) carries a white render frame on a 4-block storey rhythm: a white floor band
// at each storey line, two rows of glass panes between white piers, a light-grey spandrel, a cream cornice at each top.
// The lidar roof is median-smoothed onto that 4-block grid and capped by rings from the edge (a setback every two
// storeys, 16 / 28 / 40 / 52 / 68), so the tower rises off wings and terraces. Ground-floor shopfronts run round the
// base with a dark canopy over the entrance. Interiors are air behind the glass with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_243876088.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..74, z 0..53
const g = new Voxels([75, 80, 54]);

const W = 75, D = 54;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation top), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, gr, r] of cells) { G[x][z] = gr; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", E: "east", W: "west" };

// edge distance (1 on the outside ring), breadth-first through the footprint
const dist = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const edge = !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
  if (edge) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of Object.values(DIRS)) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// the lidar roof, median over a 5 x 5 window, then onto the storey grid; capped by ring so the mass steps in as it rises
const median = (x, z, k) => {
  const v = [];
  for (let dx = -k; dx <= k; dx++) for (let dz = -k; dz <= k; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const cap = (d) => (d >= 9 ? 68 : 16 + 12 * Math.floor((d - 1) / 2));
const floorOf = (x, z) => 4 * Math.ceil(G[x][z] / 4);                 // the first storey line at or above the ground
const H = Array.from({ length: W }, () => Array(D).fill(0));          // top of each column (a multiple of 4)
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const top = 4 * Math.round(median(x, z, 2) / 4);
  H[x][z] = Math.max(floorOf(x, z) + 4, Math.min(top, cap(dist[x][z])));
}

// a side is exposed at height y when the cell beside it is outside the footprint or stops below y
const exposed = (x, z, y) => Object.keys(DIRS).filter((k) => {
  const [dx, dz] = DIRS[k];
  return !inside(x + dx, z + dz) || H[x + dx][z + dz] <= y;
});
const outside = (x, z) => Object.keys(DIRS).filter((k) => !inside(x + DIRS[k][0], z + DIRS[k][1]));

// the entrance: a single-sided edge cell on the lowest ground, nearest the footprint's middle
const centre = [W / 2, D / 2];
let ent = null;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z) || H[x][z] < 16) continue;
  const side = outside(x, z);
  if (side.length !== 1) continue;
  const score = G[x][z] * 1000 + Math.hypot(x - centre[0], z - centre[1]);
  if (!ent || score < ent.score) ent = { x, z, face: side[0], score, floor: floorOf(x, z) };
}
// the entrance bay is the door cell and the cells either side of it on the same face, under one dark canopy
const isEntBay = (x, z, face) => !!ent && face === ent.face && outside(x, z).includes(ent.face) &&
  (ent.face === "N" || ent.face === "S" ? z === ent.z && Math.abs(x - ent.x) <= 1 : x === ent.x && Math.abs(z - ent.z) <= 1);

const panes = [];
const pane = (x, y, z) => { g.set(x, y, z, "light_blue_stained_glass_pane", { waterlogged: "false" }); panes.push([x, y, z]); };

const facade = (x, y, z, ex, f, h) => {
  const face = ex[0], [dx, dz] = DIRS[face];
  const bay = face === "N" || face === "S" ? x : z;   // position along the face: piers every third bay
  const within = y % 4, ground = y < f + 4;
  if (y === h - 1) return g.set(x, y, z, "smooth_quartz");                                          // cornice
  if (within === 3) return g.set(x, y, z, isEntBay(x, z, face) ? "black_concrete" : "light_gray_concrete");   // spandrel / canopy
  if (ent && x === ent.x && z === ent.z && face === ent.face && (y === ent.floor + 1 || y === ent.floor + 2)) {
    const half = y === ent.floor + 1 ? "lower" : "upper";
    return g.set(x, y, z, "dark_oak_door", { facing: FACING[face], half, hinge: "left", open: "false", powered: "false" });
  }
  if (ex.length > 1) return g.set(x, y, z, "white_concrete");                                     // corner pier
  if (bay % 3 === 0) return g.set(x, y, z, ground ? "black_concrete" : "white_concrete");          // pier / shopfront frame
  pane(x, y, z);
  // a warm light in some windows, in the air just inside the glass
  if ((x * 7 + z * 13 + y * 5) % 9 === 0) {
    const ix = x - dx, iz = z - dz;
    if (inside(ix, iz) && H[ix][iz] > y && !exposed(ix, iz, y).length) g.set(ix, y, iz, (ix + iz) % 3 === 0 ? "shroomlight" : "glowstone");
  }
};

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const f = floorOf(x, z), h = H[x][z];
  for (let y = 0; y < f; y++) g.set(x, y, z, "polished_basalt");                                 // foundation and plinth
  for (let y = f; y < h; y++) {
    if (y % 4 === 0) { g.set(x, y, z, "smooth_quartz"); continue; }                              // floor slab / string course
    const ex = exposed(x, z, y);
    if (!ex.length) { if (y === h - 1) g.set(x, y, z, "gray_concrete"); continue; }               // interior, roof plate on top
    facade(x, y, z, ex, f, h);
  }
}

// roof: plant rooms on the flat crown (a 2 x 2 block, two high) and a lightning rod on the highest interior cell
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z) || H[x][z] < 52 || dist[x][z] < 5 || x % 8 !== 3 || z % 8 !== 3) continue;
  const h = H[x][z], quad = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!quad.every(([a, b]) => inside(a, b) && H[a][b] === h)) continue;
  for (const [a, b] of quad) { g.set(a, h, b, "light_gray_concrete"); g.set(a, h + 1, b, "gray_concrete"); }
}
let crown = null;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z) || dist[x][z] < 9) continue;
  const score = H[x][z] * 100 - Math.hypot(x - centre[0], z - centre[1]);
  if (!crown || score > crown.score) crown = { x, z, y: H[x][z], score };
}
if (crown) g.set(crown.x, crown.y, crown.z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

// glass panes join their neighbours the way a pane does: to a pane or a solid block on each side
const FULL = new Set(["white_concrete", "light_gray_concrete", "gray_concrete", "black_concrete", "smooth_quartz", "polished_basalt"].map((b) => `minecraft:${b}`));
const PANE = "minecraft:light_blue_stained_glass_pane";
for (const [x, y, z] of panes) {
  const joins = (dx, dz) => { const n = g.get(x + dx, y, z + dz); return !!n && (n.block === PANE || FULL.has(n.block)); };
  g.set(x, y, z, "light_blue_stained_glass_pane", {
    north: String(joins(0, -1)), south: String(joins(0, 1)), east: String(joins(1, 0)), west: String(joins(-1, 0)), waterlogged: "false",
  });
}

console.log(g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_243876088.nbt"));
