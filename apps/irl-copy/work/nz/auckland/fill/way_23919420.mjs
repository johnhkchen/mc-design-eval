// Masonic House, Auckland: a c.1930s Classical lodge in cream plaster on a stone base, three tiers (lidar roof 20 / 22-24 / 25).
// Footprint from the lidar cells; y 0 = the lowest ground (all 0 here). Walls are one block thick on the footprint edge,
// with an air gap behind the glass, floor slabs per storey inside, a parapet course, and tiers stepped by the lidar roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23919420.cells.json", "utf8"));
const W = 27, D = 24, H = 38;

// lidar roof -> three clean flat tiers (the 1-block noise between 22-24 is smoothed into one body)
const tierOf = (r) => (r <= 21 ? 20 : r <= 24 ? 23 : 25);
const cell = new Map();                                 // "x,z" -> { ground, F: solid top of its tier }
for (const [x, z, ground, roof] of cells) cell.set(`${x},${z}`, { ground, F: tierOf(roof) });
const at = (x, z) => cell.get(`${x},${z}`) ?? null;
// lidar noise alternates tiers cell by cell (single-cell towers and pits); two passes of a 3x3 majority make contiguous tiers
for (let pass = 0; pass < 2; pass++) {
  const next = new Map();
  for (const [key, c] of cell) {
    const [x, z] = key.split(",").map(Number), votes = {};
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const n = at(x + i, z + j); if (n) votes[n.F] = (votes[n.F] || 0) + (i || j ? 1 : 1.5); }
    const best = Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0];
    next.set(key, { ground: c.ground, F: Number(best) });
  }
  cell.clear(); for (const [k, v] of next) cell.set(k, v);
}
const DIRS = { east: [1, 0], west: [-1, 0], south: [0, 1], north: [0, -1] };   // south = +z

// exposed faces: neighbours outside the footprint
const exposed = (x, z) => Object.keys(DIRS).filter(d => !at(x + DIRS[d][0], z + DIRS[d][1]));
// a block is facade shell when it is on the footprint edge, or it faces a lower in-footprint tier above that tier's roof
const isShell = (x, z, y) => {
  const c = at(x, z);
  if (exposed(x, z).length) return y < c.F;
  return Object.values(DIRS).some(([dx, dz]) => { const n = at(x + dx, z + dz); return n && n.F <= y && y < c.F; });
};
const isPerimeter = (x, z) => exposed(x, z).length > 0;

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// --- door: the south (+z) edge cell nearest the middle of that face
const southEdge = [...cell.keys()].map(k => k.split(",").map(Number)).filter(([x, z]) => exposed(x, z).includes("south"));
const midX = southEdge.reduce((s, [x]) => s + x, 0) / southEdge.length;
const [doorX, doorZ] = southEdge.reduce((best, p) => (Math.abs(p[0] - midX) < Math.abs(best[0] - midX) ? p : best));

// --- the body
for (const [key, c] of cell) {
  const [x, z] = key.split(",").map(Number);
  const ex = exposed(x, z), edge = ex.length > 0;
  const F = c.F;
  const onAxisX = ex.some(d => d === "north" || d === "south");   // the face runs along x
  const corner = ex.length > 1;

  for (let y = 0; y < F; y++) {
    if (!isShell(x, z, y)) {
      // interior: ground floor slab, a slab per storey, and the flat roof slab under the parapet
      if (y === 0 || y === F - 1 || (y % 4 === 0 && y < F - 1)) put(x, y, z, y === 0 ? "smooth_stone" : y === F - 1 ? "stone" : "smooth_stone");
      continue;
    }
    if (!edge) { put(x, y, z, y === 0 ? "stone_bricks" : "smooth_sandstone"); continue; }  // stepped face against a lower tier
    const face = ex[0];
    const along = onAxisX ? x : z;
    const pilaster = corner || along % 4 === 0;
    if (y === 0) { put(x, y, z, "stone_bricks"); continue; }                           // base course
    if (x === doorX && z === doorZ && y <= 2) {                                         // entrance, two blocks high
      put(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (pilaster) { put(x, y, z, "quartz_pillar", { axis: "y" }); continue; }
    if (y % 4 === 3) { put(x, y, z, "cut_sandstone"); continue; }                       // storey string course
    const storeyY = Math.floor(y / 4) * 4;
    const isWindow = (y === storeyY + 1 || y === storeyY + 2) && y <= F - 2;
    if (isWindow) {
      const ns = onAxisX ? "true" : "false", ew = onAxisX ? "false" : "true";
      put(x, y, z, "glass_pane", { north: ns, south: ns, east: ew, west: ew, waterlogged: "false" });
      // warm light behind some panes: one air cell of gap, then the lamp, if that cell is interior
      if (y === storeyY + 1 && (x + z + storeyY / 4) % 4 === 0) {
        const [dx, dz] = DIRS[face];
        const bx = x - 2 * dx, bz = z - 2 * dz;
        if (at(bx, bz) && !isShell(bx, bz, y)) put(bx, y, bz, "glowstone");
      }
      continue;
    }
    put(x, y, z, "smooth_sandstone");
  }

  // parapet course on the footprint edge: a bottom slab on the top of the walls
  if (edge) put(x, F, z, "cut_sandstone_slab", { type: "bottom", waterlogged: "false" });
  // the flat roof of an interior cell stays bare stone; a lower tier's roof reads through the step
}

// --- roof plant on the tallest tier: a 3x3 lidar-high pad with a small lid
const pad = [...cell.entries()].filter(([, c]) => c.F === 25).map(([k]) => k.split(",").map(Number));
const padStart = pad.find(([x, z]) => [-1, 0, 1].every(i => [-1, 0, 1].every(j => { const n = at(x + i, z + j); return n && n.F === 25 && !exposed(x + i, z + j).length; })));
if (padStart) {
  const [px, pz] = padStart;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) put(px + i, 25, pz + j, "light_gray_concrete");
  put(px + 1, 26, pz + 1, "stone_bricks");
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23919420.nbt";
const r = g.save(out);
console.log(`way_23919420: ${r.blocks} blocks, palette ${r.palette}, door at x${doorX} z${doorZ}, plant ${padStart ? "placed" : "none"}`);
