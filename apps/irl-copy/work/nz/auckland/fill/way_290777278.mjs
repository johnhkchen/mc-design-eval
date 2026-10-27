import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 290777278: a 1970s concrete-framed office block on the Mt Eden / Newton edge of the CBD. Concrete frame and
// panels (white and light grey), tinted glass in a strip-window grid, a dark stone base, a plant room on the tower.
// Four storey tiers (16, 20, 24, 28 blocks: 4, 5, 6, 7 storeys) follow the lidar roof, quantised to storey lines.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_290777278.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_290777278.nbt";
const g = new Voxels([33, 43, 50]);

const DIR = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };     // outward normals
const NAME = { n: "north", s: "south", w: "west", e: "east" };
const PANE = "light_blue_stained_glass_pane";
const key = (x, z) => x * 100 + z;

// every footprint cell: g = its ground (plinth below it), T = top of its solid (roof slab at T-1), T a storey line
const cellOf = new Map();
for (const [x, z, ground, roof] of cells) {
  const T = Math.max(4 * Math.floor(roof / 4), 4 * Math.ceil((ground + 1) / 4), 4);
  cellOf.set(key(x, z), { x, z, g: ground, T, depth: 0 });
}
const all = [...cellOf.values()];
const at = (x, z) => cellOf.get(key(x, z));

// depth: 1 on the outer edge, growing inward (a window's air gap and the plant room's walls key off it)
let frontier = all.filter(c => Object.values(DIR).some(([dx, dz]) => !at(c.x + dx, c.z + dz)));
for (const c of frontier) c.depth = 1;
for (let i = 0; i < frontier.length; i++) {
  const c = frontier[i];
  for (const [dx, dz] of Object.values(DIR)) {
    const n = at(c.x + dx, c.z + dz);
    if (n && !n.depth) { n.depth = c.depth + 1; frontier.push(n); }
  }
}

// the faces a voxel shows: the footprint edge, or a neighbour whose roof lies below it (a setback)
const exposed = (c, y) => Object.entries(DIR).filter(([, [dx, dz]]) => {
  const n = at(c.x + dx, c.z + dz);
  return !n || y >= n.T;
}).map(([d]) => d);

// the street front: the longest run of outward-facing cells, lower ground wins a tie; its middle is the entrance
const runs = [];
for (const d of ["n", "s", "w", "e"]) {
  const [dx, dz] = DIR[d];
  const fixed = d === "n" || d === "s" ? "z" : "x", vary = d === "n" || d === "s" ? "x" : "z";
  const groups = new Map();
  for (const c of all) if (!at(c.x + dx, c.z + dz)) { if (!groups.has(c[fixed])) groups.set(c[fixed], []); groups.get(c[fixed]).push(c); }
  for (const list of groups.values()) {
    list.sort((a, b) => a[vary] - b[vary]);
    let run = [list[0]];
    for (let i = 1; i <= list.length; i++) {
      if (i < list.length && list[i][vary] === list[i - 1][vary] + 1) { run.push(list[i]); continue; }
      if (run.length >= 3) runs.push({ d, cells: run, ground: run.reduce((s, c) => s + c.g, 0) / run.length });
      run = [list[i]];
    }
  }
}
runs.sort((a, b) => b.cells.length - a.cells.length || a.ground - b.ground);
const front = runs[0];
const fd = front.d, [fox, foz] = DIR[fd];
const mid = front.cells[Math.floor(front.cells.length / 2)];
const bay = [front.cells[Math.floor(front.cells.length / 2) - 1], mid, front.cells[Math.floor(front.cells.length / 2) + 1]];
const frontSet = new Set(front.cells.map(c => key(c.x, c.z)));
const inward = c => at(c.x - fox, c.z - foz);

// a deterministic ~1-in-9 of the windows is lit from behind the glass
const lit = (x, y, z) => (x * 73 + y * 151 + z * 37) % 9 === 0;

const panes = [];   // { x, y, z, d }: each pane's neighbours decide its connection arms at the end

function facade(c, y, ex) {
  const { x, z } = c;
  if (y < c.g) { g.set(x, y, z, "stone_bricks"); return; }                 // plinth: fill below the ground
  if (y === c.g) { g.set(x, y, z, "polished_andesite"); return; }          // base course
  if (y % 4 === 0) { g.set(x, y, z, "smooth_stone"); return; }             // storey floor line
  if (y % 4 === 3) { g.set(x, y, z, "light_gray_concrete"); return; }      // spandrel under the window band
  const d = ex[0];
  const along = d === "n" || d === "s" ? x : z;
  const shop = frontSet.has(`${x},${z}`) && y < 4;                        // the street storey is a shopfront
  if (ex.length > 1 || (shop ? along % 4 === 0 : along % 3 === 0)) { g.set(x, y, z, "white_concrete"); return; }  // pier
  g.set(x, y, z, PANE);
  panes.push({ x, y, z, d });
  const i = inward(c);
  if (i && i.T > y) {                                                      // air gap behind the glass
    if (lit(x, y, z) && y % 4 === 2) g.set(i.x, y, i.z, "lantern", { hanging: "true" });
    else if (lit(x, y, z) && y % 4 === 1) g.set(i.x, y, i.z, "glowstone");
    else g.set(i.x, y, i.z, "air");
  }
}

// solid core, so every storey and tier stands on solid
for (const c of all) for (let y = 0; y < c.T; y++) g.set(c.x, y, c.z, "stone");

for (const c of all) {
  for (let y = 0; y < c.T; y++) {
    const ex = exposed(c, y);
    if (ex.length) facade(c, y, ex);
    else if (y === c.T - 1) g.set(c.x, y, c.z, "gray_concrete");          // roof membrane
  }
  if (c.depth === 1) g.set(c.x, c.T, c.z, "white_concrete");              // parapet on the outer edge
}

// terraces on the lower tiers: a few planters (pohutukawa-red azalea) where a taller tier rises beside them
const higher = c => Object.values(DIR).some(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return n && n.T > c.T; });
for (const c of all) {
  if (c.depth >= 2 && c.T < 28 && higher(c) && (c.x * 7 + c.z * 3) % 5 === 0) {
    g.set(c.x, c.T, c.z, "flowering_azalea_leaves", { persistent: "true" });
  }
}

// the plant room: a solid block on the tower's core, louvred walls, a roof and a mast
const plant = all.filter(c => c.T === 28 && c.depth >= 3);
for (const c of plant) {
  for (const y of [28, 29]) g.set(c.x, y, c.z, c.depth === 3 && (c.x + c.z + y) % 2 === 0 ? "gray_concrete" : "light_gray_concrete");
  g.set(c.x, 30, c.z, "gray_concrete");
}
if (plant.length) {
  const mx = plant.reduce((s, c) => s + c.x, 0) / plant.length, mz = plant.reduce((s, c) => s + c.z, 0) / plant.length;
  const m = plant.reduce((best, c) => (Math.hypot(c.x - mx, c.z - mz) < Math.hypot(best.x - mx, best.z - mz) ? c : best));
  for (const y of [31, 32]) g.set(m.x, y, m.z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

// the entrance: a recessed bay, three cells wide and three high, with a canopy and a door set back from the street
const ge = at(mid.x, mid.z).g;
for (const b of bay) {
  for (let y = ge; y <= ge + 2; y++) g.set(b.x, y, b.z, "air");
  g.set(b.x, ge + 3, b.z, "smooth_stone");                                  // canopy
  const i = inward(b);
  if (!i) continue;
  if (b === mid) {
    g.set(i.x, ge, i.z, "iron_door", { facing: NAME[fd], half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(i.x, ge + 1, i.z, "iron_door", { facing: NAME[fd], half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(i.x, ge + 2, i.z, PANE); panes.push({ x: i.x, y: ge + 2, z: i.z, d: fd });
  } else {
    g.set(b.x, ge + 2, b.z, "lantern", { hanging: "true" });
    for (let y = ge; y <= ge + 2; y++) { g.set(i.x, y, i.z, PANE); panes.push({ x: i.x, y, z: i.z, d: fd }); }
  }
}

// glass panes connect to the neighbours in their face
for (const p of panes) {
  const horiz = p.d === "n" || p.d === "s";
  const solid = (dx, dz) => g.val(p.x + dx, p.y, p.z + dz) !== 0;
  const state = horiz
    ? { east: String(solid(1, 0)), west: String(solid(-1, 0)), north: "false", south: "false", waterlogged: "false" }
    : { north: String(solid(0, -1)), south: String(solid(0, 1)), east: "false", west: "false", waterlogged: "false" };
  g.set(p.x, p.y, p.z, PANE, state);
}

const stats = g.save(OUT);
console.log(JSON.stringify({ front: fd, entrance: [mid.x, ge, mid.z], panes: panes.length, ...stats }));
