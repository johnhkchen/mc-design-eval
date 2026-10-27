import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// WO Building: a 1980s concrete-frame office tower on a stone podium. Tiers come from the lidar roof (floor(roof-7)/4
// storeys above a 7-block ground floor), mode-smoothed over 5x5 so each tier is one flat level. Pale precast piers,
// blue-tinted glazing, a spandrel band per storey, a parapet on every exposed top edge, one plant room on the tower.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_104745101.cells.json", "utf8"));
const X = 60, Y = 79, Z = 43;
const FLOOR0 = 7;                 // ground-storey slab: above the highest ground under the footprint (6)
const STOREY = 4;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACE = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

const GLASS = "light_blue_stained_glass_pane", PIER = "light_gray_concrete", SLAB = "smooth_stone";
const DECK = "gray_concrete", FOUND = "stone", PLINTH = "stone_bricks", BASE = "polished_andesite";

// footprint cells: n0 = raw storeys from the lidar roof; n = mode of n0 over the 5x5 around it
const at = new Map();
for (const [x, z, g, r] of cells) at.set(x + "," + z, { g, r, n0: Math.max(0, Math.floor((r - 7) / STOREY)), n: 0 });
const cell = (x, z) => at.get(x + "," + z);
for (const [k, c] of at) {
  const [x, z] = k.split(",").map(Number), votes = new Map();
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const o = cell(x + dx, z + dz); if (o) votes.set(o.n0, (votes.get(o.n0) || 0) + 1);
  }
  c.n = [...votes].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
}
const NMAX = Math.max(...[...at.values()].map((c) => c.n));

// the faces of a cell at storey s that have no storey s beside them (outside the footprint first)
function exposed(x, z, s) {
  const out = [];
  for (const [dx, dz] of DIRS) { const o = cell(x + dx, z + dz); if (!o || o.n <= s) out.push([dx, dz, !o]); }
  return out.sort((a, b) => Number(b[2]) - Number(a[2]));
}

const g = new Voxels([X, Y, Z]);
// a pane runs along the wall it sits in, so it joins its neighbours
const pane = (dx) => (dx
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

for (const [k, c] of at) {
  const [x, z] = k.split(",").map(Number);
  // foundation under the ground, then the plinth up to the ground-storey slab
  for (let y = 0; y < c.g; y++) g.set(x, y, z, FOUND);
  for (let y = c.g; y < FLOOR0; y++) g.set(x, y, z, y === FLOOR0 - 1 ? BASE : PLINTH);

  for (let s = 0; s < c.n; s++) {
    const F = FLOOR0 + STOREY * s;
    g.set(x, F, z, SLAB);                               // floor slab, every storey, every cell
    const ex = exposed(x, z, s);
    if (!ex.length) continue;                           // interior: an air gap up to the next slab
    const [dx, dz] = ex[0];
    const idx = dx ? z : x;                             // position along the face
    if (idx % 3 === 0) {                                // precast pier, full storey
      for (let y = F + 1; y <= F + 3; y++) g.set(x, y, z, PIER);
      continue;
    }
    for (let y = F + 1; y <= F + 2; y++) g.set(x, y, z, GLASS, pane(dx));
    g.set(x, F + 3, z, SLAB);                           // spandrel band under the next slab
    // a warm glowstone just inside some panes (upper storeys)
    if (s >= 1 && (x * 7 + z * 13 + s * 31) % 9 === 0) {
      const ix = x - dx, iz = z - dz, inner = cell(ix, iz);
      if (inner && inner.n > s && !exposed(ix, iz, s).length) {
        for (let y = F + 1; y <= F + 2; y++) g.set(ix, y, iz, "glowstone");
      }
    }
  }

  // roof deck, and a parapet on every top edge that stands above a lower neighbour or the outside
  const T = FLOOR0 + STOREY * c.n;
  g.set(x, T, z, DECK);
  const edge = DIRS.some(([dx, dz]) => { const o = cell(x + dx, z + dz); return !o || o.n < c.n; });
  if (edge) { g.set(x, T + 1, z, PIER); g.set(x, T + 2, z, SLAB); }
}

// the plant room: a box on the tower's flat top, ringed in concrete, iron equipment inside
{
  const top = [...at].filter(([, c]) => c.n === NMAX).map(([k]) => k.split(",").map(Number));
  const cx = Math.round(top.reduce((a, p) => a + p[0], 0) / top.length);
  const cz = Math.round(top.reduce((a, p) => a + p[1], 0) / top.length);
  const T = FLOOR0 + STOREY * NMAX;
  for (let z = cz - 3; z <= cz + 3; z++) for (let x = cx - 5; x <= cx + 5; x++) {
    const c = cell(x, z); if (!c || c.n !== NMAX) continue;
    const ring = x === cx - 5 || x === cx + 5 || z === cz - 3 || z === cz + 3;
    if (ring) { for (let y = T + 1; y <= T + 3; y++) g.set(x, y, z, PIER); }
    else { for (let y = T + 1; y <= T + 2; y++) g.set(x, y, z, "iron_block"); g.set(x, T + 3, z, SLAB); }
  }
}

// the entrance: the longest run of footprint cells on a face whose outward cell is in the box and outside the footprint
const runs = new Map();
for (const [k] of at) {
  const [x, z] = k.split(",").map(Number);
  for (const [dx, dz] of DIRS) {
    const ox = x + dx, oz = z + dz;
    if (cell(ox, oz) || ox < 0 || oz < 0 || ox >= X || oz >= Z) continue;
    const rk = `${dx},${dz},${dx ? x : z}`;
    if (!runs.has(rk)) runs.set(rk, []);
    runs.get(rk).push(dx ? z : x);
  }
}
let best = null;
for (const [rk, along] of runs) {
  along.sort((a, b) => a - b);
  let run = [along[0]];
  const consider = () => { if (!best || run.length > best.run.length) best = { rk, run: [...run] }; };
  for (let i = 1; i < along.length; i++) {
    if (along[i] === along[i - 1] + 1) run.push(along[i]); else { consider(); run = [along[i]]; }
  }
  consider();
}
if (best && best.run.length >= 4) {
  const [dx, dz, line] = best.rk.split(",").map(Number);
  const at2 = (a) => (dx ? [line, a] : [a, line]);             // footprint cell of a run position
  const out = (a) => { const [x, z] = at2(a); return [x + dx, z + dz]; };
  const m = Math.floor(best.run.length / 2) - 1;               // the two door cells, centred
  const facing = FACE[`${dx},${dz}`];
  const door = (a, half, hinge) => { const [x, z] = at2(a); g.set(x, FLOOR0 + 1 + (half === "upper" ? 1 : 0), z, "iron_door", { facing, half, hinge, open: "false", powered: "false" }); };
  for (const [a, hinge] of [[best.run[m], "left"], [best.run[m + 1], "right"]]) {
    door(a, "lower", hinge); door(a, "upper", hinge);
  }
  // a canopy over the door, on two posts, with lanterns hanging from its edge
  const lo = Math.max(0, m - 2), hi = Math.min(best.run.length - 1, m + 3);
  const CAN = FLOOR0 + 3;
  for (let i = lo; i <= hi; i++) { const [ox, oz] = out(best.run[i]); g.set(ox, CAN, oz, BASE); }
  for (const i of [lo, hi]) {
    const [ox, oz] = out(best.run[i]);
    for (let y = 0; y < CAN; y++) g.set(ox, y, oz, PLINTH);
  }
  for (const i of [m, m + 1]) {
    const [ox, oz] = out(best.run[i]);
    g.set(ox, CAN - 1, oz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_104745101.nbt");
console.log("way_104745101", { storeys: NMAX, ...stats });
