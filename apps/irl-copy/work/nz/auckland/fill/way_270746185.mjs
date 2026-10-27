// Der Rohe Apartments, Mt Eden: a 1960s-70s Auckland modernist apartment block on the Miesian grid. Concrete frame
// (white piers, grey spandrels), tinted glass between, a stone base, a timber-deck entrance canopy, and a stepped
// massing: a 6-storey core, a 5-storey ring, 4-storey wings, 2-storey annexes at the low edges. Storeys are 4 blocks.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${FILL}/way_270746185.cells.json`, "utf8"));   // [x, z, ground, roof]
const g = new Voxels([51, 36, 51]);

const K = (x, z) => `${x},${z}`;
const at = new Map(cells.map(([x, z, gr, r]) => [K(x, z), { x, z, g: gr, r }]));
const cell = (x, z) => at.get(K(x, z));
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];

// 1. Massing from the lidar roof, smoothed into flat tiers. Tower zone = roof >= 17; its cells 3+ in from the edge
//    rise to 24 (the core), the 2-cell ring to 20; other cells above 12 are the 16-high wings; the low edges are
//    annexes of at least 2 storeys over their own ground.
const TOWER = 17;
const inTower = (c) => c.r >= TOWER;
const depth = new Map(), queue = [];
for (const c of at.values()) {
  if (inTower(c) && DIRS.some(([dx, dz]) => { const n = cell(c.x + dx, c.z + dz); return !n || !inTower(n); })) {
    depth.set(K(c.x, c.z), 1); queue.push(c);
  }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i], d = depth.get(K(c.x, c.z));
  for (const [dx, dz] of DIRS) {
    const n = cell(c.x + dx, c.z + dz);
    if (n && inTower(n) && !depth.has(K(n.x, n.z))) { depth.set(K(n.x, n.z), d + 1); queue.push(n); }
  }
}
for (const c of at.values()) {
  if (inTower(c)) c.T = (depth.get(K(c.x, c.z)) ?? 99) >= 3 ? 24 : 20;
  else if (c.r >= 12) c.T = 16;
  else c.T = Math.max(8, Math.ceil((c.g + 4) / 4) * 4);
}

// 2. Facade = any side open to the air or to a lower neighbour (a setback exposes the taller column's wall).
for (const c of at.values()) {
  c.ex = DIRS.filter(([dx, dz]) => { const n = cell(c.x + dx, c.z + dz); return !n || n.T < c.T; });
  c.facade = c.ex.length > 0;
}

// 3. Entrance: on the south-facing street side (or any exposed face), at the lowest ground there, mid-run.
let front = [...at.values()].filter((c) => c.facade && c.T >= 16 && c.ex.some(([, dz]) => dz === 1));
if (!front.length) front = [...at.values()].filter((c) => c.facade && c.T >= 16);
const minG = Math.min(...front.map((c) => c.g));
const pool = front.filter((c) => c.g === minG).sort((a, b) => a.x - b.x || a.z - b.z);
const ent = pool[Math.floor(pool.length / 2)];
const entDir = ent.ex.find(([, dz]) => dz === 1) ?? ent.ex[0];
const entAlong = entDir[0] !== 0;                              // along the face: z for east/west faces, x for north/south

// 4. Columns: foundation to the ground, then the body from ground to the tier top.
const pillar = (x, z) => x % 6 === 3 && z % 6 === 3 && [-1, 0, 1].every((dx) => [-1, 0, 1].every((dz) => {
  const n = cell(x + dx, z + dz); return !n || !n.facade;
}));
for (const c of at.values()) {
  const { x, z, g: G, T } = c;
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");
  for (let y = G; y < T; y++) {
    const top = y === T - 1, rel = y % 4;
    if (!c.facade) {
      if (y === G || (rel === 0 && y >= 4)) g.set(x, y, z, "light_gray_concrete");   // floor plates
      else if (top) g.set(x, y, z, "gray_concrete");                                 // roof membrane
      else if (pillar(x, z)) g.set(x, y, z, "white_concrete");                       // structure, out of the glass' way
      continue;                                                                      // air otherwise: the interior
    }
    const along = c.ex[0][0] !== 0 ? z : x, pier = along % 4 === 0;
    let m;
    if (y === G) m = "polished_andesite";                                            // base course
    else if (top) m = "smooth_stone";                                                // cornice
    else if (rel === 0 && y >= 4) m = "light_gray_concrete";                         // storey string course
    else if (pier) m = "white_concrete";                                             // concrete piers, every 4
    else if (rel === 1 && y >= 4) m = "gray_concrete";                               // spandrel under the glass
    else m = "light_blue_stained_glass";
    g.set(x, y, z, m);
  }
}

// 5. Lobby: a glazed-timber door, lintel canopy of dark oak over the bay.
const { x: ex, z: ez, g: EG } = ent;
const doorState = { facing: entDir[2], hinge: "left", open: "false", powered: "false" };
g.set(ex, EG + 1, ez, "iron_door", { ...doorState, half: "lower" });
g.set(ex, EG + 2, ez, "iron_door", { ...doorState, half: "upper" });
for (const d of [0, -1, 1]) {
  const cx = entAlong ? ex : ex + d, cz = entAlong ? ez + d : ez;
  if (cell(cx, cz)) g.set(cx, EG + 3, cz, "dark_oak_planks");
}

// 6. Warm light: hanging lanterns in some window bays, one cell inside the glass, hung from the floor plate above.
for (const c of at.values()) {
  if (!c.facade) continue;
  for (let y = c.g + 1; y < c.T - 1; y++) {
    if (y % 4 !== 3 || y < 4) continue;
    const along = c.ex[0][0] !== 0 ? c.z : c.x;
    if (along % 4 === 0 || (c.x * 7 + c.z * 11 + y * 5) % 6 !== 0) continue;
    const [dx, dz] = c.ex[0], n = cell(c.x - dx, c.z - dz);
    if (!n || n.facade || n.T < y + 2) continue;
    g.set(c.x - dx, y, c.z - dz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// 7. Roof plant: two 3x3 boxes on the core's roof, with an iron screen on top.
const coreCells = [...at.values()].filter((c) => c.T === 24);
const cx0 = coreCells.reduce((s, c) => s + c.x, 0) / coreCells.length, cz0 = coreCells.reduce((s, c) => s + c.z, 0) / coreCells.length;
const plantable = (x, z) => [-1, 0, 1].every((dx) => [-1, 0, 1].every((dz) => {
  const n = cell(x + dx, z + dz); return n && n.T === 24 && !n.facade;
}));
const sites = coreCells.filter((c) => plantable(c.x, c.z)).sort((a, b) => Math.hypot(a.x - cx0, a.z - cz0) - Math.hypot(b.x - cx0, b.z - cz0));
const picked = [];
for (const s of sites) if (picked.every((p) => Math.max(Math.abs(p.x - s.x), Math.abs(p.z - s.z)) >= 7)) picked.push(s);
for (const p of picked.slice(0, 2)) {
  for (const [dx, dz] of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 0], [0, 1], [1, -1], [1, 0], [1, 1]]) {
    g.set(p.x + dx, 24, p.z + dz, "light_gray_concrete");
    g.set(p.x + dx, 25, p.z + dz, "light_gray_concrete");
    g.set(p.x + dx, 26, p.z + dz, "iron_bars");
  }
}

const out = g.save(`${FILL}/way_270746185.nbt`);
console.log(`way_270746185: ${cells.length} cells, ${out.blocks} blocks, ${out.palette} palette entries; entrance at ${ex},${ez} (${entDir[2]}), ${Math.min(2, picked.length)} roof plant boxes`);
