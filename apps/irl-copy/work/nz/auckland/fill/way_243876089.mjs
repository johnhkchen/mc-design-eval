// Airedale Exchange, Auckland (way 243876089): a late-1980s concrete-frame office exchange, read from the lidar roof. A
// 44-48 block main block (9-12 storeys by the ground under it) with a 52 core, and a slim tower at 92 (the record's 94)
// on shoulders of 64-72 that step in as they rise. Lidar tops are median-smoothed and snapped to the 4-block storey grid.
// Facade: a basalt base storey, a light-grey floor line and spandrel, white piers every third bay, light-blue glass panes
// between, glowstone behind some panes. The entrance is on the lowest street-level face, with a white surround and lintel.
// The roof is grey membrane with a light cornice on the edge, a parapet on the outer ring and the step edges, plant boxes on
// the main block, and a mast on the tower. Interiors are air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_243876089.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_243876089.nbt";
const W = 46, D = 63, Y = 106;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground under each cell, -1 = outside the footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// roof tops: the lidar median over the 3x3 around each cell, snapped to the 4-block storey grid
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const H = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) H[x][z] = 4 * Math.round(median(x, z) / 4);

const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const OUT_FACING = { N: "north", S: "south", W: "west", E: "east" };
const PANE = {
  N: { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" },
  S: { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" },
  W: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" },
  E: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" },
};

// the faces of a cell at height y that show open air: outside the footprint, or above a neighbour's roof (a neighbour whose
// foundation is still solid at y hides its side)
const faces = (x, z, y) => DIRS.filter(([, dx, dz]) => {
  const nx = x + dx, nz = z + dz;
  if (!inside(nx, nz)) return true;
  if (y < G[nx][nz]) return false;
  return y >= H[nx][nz];
});
const perimeter = (x, z) => DIRS.some(([, dx, dz]) => !inside(x + dx, z + dz) || H[x + dx][z + dz] < H[x][z]);
const key = (x, y, z) => `${x},${y},${z}`;
const facadeOf = (fs) => fs.find(([n]) => n === "N" || n === "S") || fs[0];   // north/south faces first: a corner reads as the long wall
const base = (gr) => 4 * (Math.floor(gr / 4) + 1);                              // the basalt base storey runs to the next storey line

// the entrance: the outside face with the lowest ground (the street), and the two bays either side of it on that face
let door = null;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) for (const [n, dx, dz] of DIRS) {
  if (inside(x + dx, z + dz)) continue;
  if (!door || G[x][z] < door.gr) door = { x, z, n, dx, dz, gr: G[x][z] };
}
const doorCells = new Set();
if (door) {
  doorCells.add(key(door.x, 0, door.z));
  for (const s of [-1, 1]) {
    const sx = door.x + (door.n === "E" || door.n === "W" ? 0 : s), sz = door.z + (door.n === "E" || door.n === "W" ? s : 0);
    if (inside(sx, sz) && G[sx][sz] === door.gr && faces(sx, sz, door.gr).some(([n]) => n === door.n)) doorCells.add(key(sx, 0, sz));
  }
}

// lit windows: glowstone one cell in, behind a pane on the first row of every storey, on about one bay in 13
const glow = new Set();
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], cap = H[x][z] - 1;
  for (let y = gr; y < cap; y++) {
    const fs = faces(x, z, y);
    if (!fs.length || y % 4 !== 1 || y < base(gr)) continue;
    const [n, dx, dz] = facadeOf(fs);
    const idx = n === "N" || n === "S" ? x : z;
    if (idx % 3 === 0 || (idx * 7 + Math.floor(y / 4) * 5) % 13 !== 0) continue;
    const ix = x - dx, iz = z - dz;
    if (inside(ix, iz) && y >= G[ix][iz] && y < H[ix][iz] - 1 && faces(ix, iz, y).length === 0) glow.add(key(ix, y, iz));
  }
}

const g = new Voxels([W, Y, D]);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = H[x][z], cap = top - 1, edge = perimeter(x, z);
  // foundation: solid from y 0 up to the ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  // roof: grey membrane, with a light cornice on the outer edge, and a parapet on the outer ring and the step edges
  g.set(x, cap, z, edge ? "light_gray_concrete" : "gray_concrete");
  if (edge) g.set(x, top, z, "stone_brick_wall");

  for (let y = gr; y < cap; y++) {
    const fs = faces(x, z, y);
    if (!fs.length) {
      // interior: air, with a floor slab per storey and on the ground, and any glowstone behind a lit pane
      if (y === gr || y % 4 === 0) g.set(x, y, z, "smooth_stone");
      if (glow.has(key(x, y, z))) g.set(x, y, z, "glowstone");
      continue;
    }
    const [n, dx, dz] = facadeOf(fs);
    const idx = n === "N" || n === "S" ? x : z;
    const row = y % 4;
    const onEntrance = door && doorCells.has(key(x, 0, z)) && fs.some(([m]) => m === door.n);
    if (onEntrance) {
      if (y === gr || y === gr + 1) {
        if (x === door.x && z === door.z) {
          const half = y === gr ? "lower" : "upper";
          g.set(x, y, z, "iron_door", { facing: OUT_FACING[door.n], half, hinge: "left", open: "false", powered: "false" });
        } else g.set(x, y, z, "light_blue_stained_glass");
      } else g.set(x, y, z, "white_concrete");                 // the lintel over the entrance and its side bays
      continue;
    }
    if (y < base(gr)) g.set(x, y, z, "polished_basalt");           // basalt base storey
    else if (row === 0) g.set(x, y, z, "smooth_stone");            // floor line
    else if (row === 3) g.set(x, y, z, "light_gray_concrete");     // spandrel
    else if (idx % 3 === 0) g.set(x, y, z, "white_concrete");      // pier between the bays
    else g.set(x, y, z, "light_blue_stained_glass_pane", PANE[n]); // glass pane
  }

  // roof plant on the main block: small boxes, clear of the edges
  if (!edge && top === 48 && x % 9 >= 3 && x % 9 <= 5 && z % 7 >= 2 && z % 7 <= 3) g.set(x, top, z, "light_gray_concrete");
}

// the tower's mast on the core cell's roof
const coreMast = cells.filter(([, , , r]) => r >= 90).map(([x, z]) => [x, z]);
if (coreMast.length) {
  const [mx, mz] = coreMast[Math.floor(coreMast.length / 2)];
  const top = H[mx][mz];
  for (let y = top; y < top + 8; y++) g.set(mx, y, mz, "iron_bars");
  g.set(mx, top + 8, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

const stats = g.save(OUT);
const tops = {};
for (const [x, z] of cells.map(([x, z]) => [x, z])) tops[H[x][z]] = (tops[H[x][z]] || 0) + 1;
console.log(JSON.stringify({ saved: OUT, ...stats, tiers: tops, entrance: door ? { x: door.x, z: door.z, face: door.n, ground: door.gr } : null, lit: glow.size }));
