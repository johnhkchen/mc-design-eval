// Way 876331760: a 1980s CBD office block in Auckland (precast concrete piers, grey spandrels, blue glass).
// Footprint 30 x 80 cells; the lidar roof (about 52 blocks) becomes a 52-block tower with 48-block shoulders,
// an 8-block podium on the west wing, and a plant room on the roof. Floor lines sit at 2 mod 4 (6, 10, 14, ...)
// so every tier's storeys align across the footprint; a setback's floor is the lower neighbour's roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_876331760.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_876331760.nbt";
const W = 30, H = 65, D = 80;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const site = new Map();
for (const [x, z, g, r] of cells) site.set(`${x},${z}`, { x, z, g, r });
const cellAt = (x, z) => site.get(`${x},${z}`);

// Roof tier: the lidar roof quantised to 4-block tiers, then a 3x3 mode so single noisy cells join their neighbours.
const q = (r) => Math.max(4, Math.round(r / 4) * 4);
for (const c of site.values()) c.t0 = q(c.r);
for (const c of site.values()) {
  const counts = new Map();
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = cellAt(c.x + dx, c.z + dz); if (n) counts.set(n.t0, (counts.get(n.t0) || 0) + 1);
  }
  let best = c.t0, bestN = counts.get(c.t0) || 0;
  for (const [t, n] of counts) if (n > bestN) { best = t; bestN = n; }
  c.t = Math.max(best, Math.ceil((c.g + 4) / 4) * 4);   // at least one storey above its own ground
}

const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const outside = (c, y) => DIRS.filter(([dx, dz]) => !cellAt(c.x + dx, c.z + dz));
// a wall face is exposed where the neighbour is outside the footprint or its roof is below this row
const exposed = (c, y) => DIRS.filter(([dx, dz]) => { const n = cellAt(c.x + dx, c.z + dz); return !n || y >= n.t; });

// Solid rows of a column: the ground, the floor lines, the roof deck, and each lower neighbour's roof (a setback floor).
const solidRows = (c) => {
  const s = new Set([c.g, c.t - 1]);
  for (let L = 6; L < c.t; L += 4) if (L >= c.g + 4) s.add(L);
  for (const [dx, dz] of DIRS) { const n = cellAt(c.x + dx, c.z + dz); if (n && n.t < c.t) s.add(n.t - 1); }
  return s;
};

// Entrance: a street-level cell on an east or west face, nearest the middle of the footprint, lowest ground first.
const zMid = [...site.values()].reduce((a, c) => a + c.z, 0) / site.size;
const faceCells = [...site.values()].filter((c) => c.g <= 2 && outside(c, c.g + 1).some(([dx]) => dx !== 0));
faceCells.sort((a, b) => (a.g - b.g) || (Math.abs(a.z - zMid) - Math.abs(b.z - zMid)));
const entrance = faceCells[0];
const doorDir = outside(entrance, entrance.g + 1).find(([dx]) => dx !== 0);
const doorFacing = doorDir[0] > 0 ? "east" : "west";

const out = new Map();
const put = (x, y, z, block, state, pane) => out.set(`${x},${y},${z}`, { block, state, pane, pos: [x, y, z] });
const get = (x, y, z) => out.get(`${x},${y},${z}`);
const isFull = (e) => e && !/_door$/.test(e.block);

for (const c of site.values()) {
  // foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y <= c.g; y++) put(c.x, y, c.z, "stone_bricks");

  const solid = solidRows(c);
  for (let y = c.g + 1; y < c.t; y++) {
    if (solid.has(y)) {
      if (y === c.t - 1) put(c.x, y, c.z, "gray_concrete");          // roof deck
      else put(c.x, y, c.z, "smooth_quartz");                         // floor line / setback floor
      continue;
    }
    const dirs = exposed(c, y);
    if (!dirs.length) {                                               // interior air, but a column every 6 cells holds the floors
      if (c.x % 6 === 3 && c.z % 6 === 3) put(c.x, y, c.z, "white_concrete");
      continue;
    }
    let lo = c.g, hi = c.t - 1;
    for (const s of solid) { if (s < y && s > lo) lo = s; if (s > y && s < hi) hi = s; }
    const ground = lo === c.g, head = y === hi - 1;
    if (dirs.length >= 2) { put(c.x, y, c.z, "white_concrete"); continue; }   // corner pier
    const [dx, dz] = dirs[0];
    const axis = dx !== 0 ? "x" : "z";
    const i = dx !== 0 ? c.z : c.x;                                   // position along the face
    const isDoor = c === entrance && (y === c.g + 1 || y === c.g + 2);
    if (isDoor) {
      const half = y === c.g + 1 ? "lower" : "upper";
      put(c.x, y, c.z, "dark_oak_door", { facing: doorFacing, half, hinge: "left", open: "false", powered: "false" });
    } else if (head) {
      put(c.x, y, c.z, ground ? "smooth_stone" : "gray_concrete");    // header or spandrel
    } else if (ground && y === lo + 1) {
      put(c.x, y, c.z, "polished_granite");                           // base course
    } else if (i % 3 === 0) {
      put(c.x, y, c.z, "white_concrete");                             // precast mullion
    } else {
      put(c.x, y, c.z, "light_blue_stained_glass_pane", null, axis);  // glass; connections set below
      // a warm light behind some panes, in the air gap inside
      if ((c.x * 7 + c.z * 13 + y * 5) % 9 === 0) {
        const ix = c.x - dx, iz = c.z - dz, inner = cellAt(ix, iz);
        // only on a floor's first glass row, so the lamp stands on the floor line
        if (inner && solidRows(inner).has(y - 1) && !get(ix, y, iz)) put(ix, y, iz, "glowstone");
      }
    }
  }

  // parapet on the outside edge of the roof
  if (outside(c, c.t).length) put(c.x, c.t, c.z, "white_concrete");

  // plant room: a two-block block of plant on the roof of the central tower
  const plant = c.t >= 52 && [-3, -2, -1, 0, 1, 2, 3].every((dx) => [-3, -2, -1, 0, 1, 2, 3].every((dz) => {
    const n = cellAt(c.x + dx, c.z + dz); return n && n.t >= 52;
  }));
  if (plant) { put(c.x, c.t, c.z, "light_gray_concrete"); put(c.x, c.t + 1, c.z, "light_gray_concrete"); }
}

// Glass panes connect to full blocks along their wall, as in the world.
for (const e of out.values()) {
  if (!e.pane) continue;
  const [x, y, z] = e.pos;
  const st = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  // a pane on an x-facing wall runs along z (north/south); on a z-facing wall, along x (east/west)
  const tangent = e.pane === "x"
    ? [["north", x, y, z - 1], ["south", x, y, z + 1]]
    : [["west", x - 1, y, z], ["east", x + 1, y, z]];
  for (const [k, nx, ny, nz] of tangent) if (isFull(get(nx, ny, nz))) st[k] = "true";
  e.state = st;
}

// self-check: no hole in an exposed wall, nothing floating (every block has something under it)
const holes = [], floating = [];
for (const c of site.values()) for (let y = c.g + 1; y < c.t; y++) {
  if (!get(c.x, y, c.z) && exposed(c, y).length) holes.push([c.x, y, c.z]);
}
for (const e of out.values()) {
  const [x, y, z] = e.pos;
  // floor lines span the interior air between columns; everything else must have something under it
  if (y > 0 && !get(x, y - 1, z) && e.block !== "smooth_quartz") floating.push([e.block, ...e.pos]);
}
const kinds = {};
for (const [b] of floating) kinds[b] = (kinds[b] || 0) + 1;
console.log(`holes ${holes.length}, floating ${floating.length}`, kinds, floating.slice(0, 5));

const g = new Voxels([W, H, D]);
for (const e of out.values()) {
  const [x, y, z] = e.pos;
  g.set(x, y, z, e.block, e.state);
}
const stats = g.save(OUT);
console.log(`saved ${OUT}: ${stats.blocks} blocks, ${stats.palette} palette entries, entrance at x${entrance.x} z${entrance.z} facing ${doorFacing}`);
