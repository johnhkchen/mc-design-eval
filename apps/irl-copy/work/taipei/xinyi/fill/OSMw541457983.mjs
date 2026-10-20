import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1980s Taipei commercial block: stone-bricks plinth, white concrete
// piers with glass-pane bays, a red sign band over a shopfront, a quartz floor
// band and cornice, a parapet, and a rooftop water tank on a steel-coloured stand.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541457983";
const W = 15, H = 23, D = 36;
const ROOF = 11; // roof slab at y=10, parapet at y=11

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);
const footprint = [...ground.keys()].map((k) => k.split(",").map(Number));

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  east: [1, 0],
  west: [-1, 0],
};

// Returns { name, dx, dz, corner } for perimeter cells, null for interior cells.
function ringOut(x, z) {
  const missing = [];
  for (const name of ["north", "south", "east", "west"]) {
    const [dx, dz] = DIRS[name];
    if (!has(x + dx, z + dz)) missing.push(name);
  }
  if (missing.length === 0) return null;
  const [dx, dz] = DIRS[missing[0]];
  return { name: missing[0], dx, dz, corner: missing.length > 1 };
}

const g = new Voxels([W, H, D]);
function set(x, y, z, block, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

const PANE = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
const glassAt = new Map(); // "x,y,z" -> true for window glass (used for glow placement)

// ---- Main shell, cell by cell ----
for (const [x, z] of footprint) {
  const gr = G(x, z);

  // Foundation: solid from y=0 up to this cell's ground.
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");
  if (gr >= 10) continue; // no room for a storey above this cell

  const out = ringOut(x, z);

  // Floor slabs: ground-floor slab at gr, storey line at y=5 (if above ground), roof slab at y=10.
  const floors = new Set([gr, 10]);
  if (gr < 5) floors.add(5);
  for (const y of floors) {
    let b;
    if (y === gr && out) b = "polished_andesite";      // plinth / base course
    else if (y === 5 && out) b = "smooth_quartz";      // storey line band
    else if (y === 10 && out) b = "smooth_stone";      // cornice
    else b = "light_gray_concrete";                     // slab / roof deck
    set(x, y, z, b);
  }

  if (!out) continue;

  // Facade: window bays on the outward faces, piers between them.
  const t = out.name === "north" || out.name === "south" ? x : z;
  for (let y = gr + 1; y <= 9; y++) {
    if (y === 5) continue;
    let b;
    let isGlass = false;
    if (out.corner || t % 3 === 0) {
      b = "white_concrete";                             // piers and corners
    } else if (y === gr + 4 && gr + 4 < 5) {
      b = "red_concrete";                               // shopfront sign band
    } else if (y === 6 || y === 9) {
      b = "white_concrete";                             // sill and lintel
    } else if (y >= 7 && y <= 8) {
      b = "glass_pane"; isGlass = true;                 // upper window
    } else if (y < 5) {
      b = "glass_pane"; isGlass = true;                 // shopfront glazing
    } else {
      b = "white_concrete";
    }
    if (isGlass) {
      set(x, y, z, b, PANE);
      glassAt.set(`${x},${y},${z}`, true);
    } else {
      set(x, y, z, b);
    }
  }

  // Parapet.
  set(x, ROOF, z, "white_concrete");
}

// ---- Entrance: one door on a north/south facing shopfront bay near the centre ----
{
  const meanX = footprint.reduce((s, [x]) => s + x, 0) / footprint.length;
  let best = null;
  for (const [x, z] of footprint) {
    const gr = G(x, z);
    const out = ringOut(x, z);
    if (!out || out.corner) continue;
    if (out.name !== "north" && out.name !== "south") continue;
    if (x % 3 === 0) continue;
    if (gr + 2 > 4) continue;
    const score = Math.abs(x - meanX) + gr * 0.5;
    if (!best || score < best.score) best = { x, z, gr, out, score };
  }
  if (best) {
    const { x, z, gr, out } = best;
    set(x, gr + 1, z, "oak_door", { facing: out.name, half: "lower", hinge: "left", open: "false", powered: "false" });
    set(x, gr + 2, z, "oak_door", { half: "upper", hinge: "left", powered: "false" });
    glassAt.delete(`${x},${gr + 1},${z}`);
    glassAt.delete(`${x},${gr + 2},${z}`);
  }
}

// ---- Warm light: glowstone behind every other upper window bay ----
for (const [x, z] of footprint) {
  const out = ringOut(x, z);
  if (!out || out.corner) continue;
  const t = out.name === "north" || out.name === "south" ? x : z;
  if (t % 6 !== 1) continue;
  if (!glassAt.has(`${x},7,${z}`)) continue;
  const ix = x - out.dx, iz = z - out.dz;
  if (!has(ix, iz)) continue;
  if (G(ix, iz) >= 7) continue;
  set(ix, 7, iz, "glowstone");
}

// ---- Rooftop water tank on a platform, sited on the roof-slab cells nearest the centroid ----
{
  const cxm = footprint.reduce((s, [x]) => s + x, 0) / footprint.length;
  const czm = footprint.reduce((s, [, z]) => s + z, 0) / footprint.length;
  let best = null;
  for (const [cx, cz] of footprint) {
    let ok = true;
    for (let i = -1; i <= 1 && ok; i++)
      for (let j = -1; j <= 1 && ok; j++) {
        if (!has(cx + i, cz + j) || G(cx + i, cz + j) > 9) ok = false;
      }
    if (!ok) continue;
    const d = Math.hypot(cx - cxm, cz - czm);
    if (!best || d < best.d) best = { cx, cz, d };
  }
  if (best) {
    const { cx, cz } = best;
    // Platform on the roof slab.
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++) set(cx + i, 11, cz + j, "stone_bricks");
    // Tank body: 3x3 with corners cut away, standing on the platform.
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++) {
        const corner = Math.abs(i) === 1 && Math.abs(j) === 1;
        if (corner) continue;
        for (let y = 12; y <= 14; y++) set(cx + i, y, cz + j, "light_gray_concrete");
      }
    // Cap: plus shape, every block resting on the body.
    const cap = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [i, j] of cap) set(cx + i, 15, cz + j, "smooth_stone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
