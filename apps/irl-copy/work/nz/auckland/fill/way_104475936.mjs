// Sir Paul Reeves Building: a 1980s-style office tower on a podium. Pale precast concrete floors, spandrels and piers,
// tinted glass between the piers, a glazed lobby on the entrance face, warm glass on some floors. The massing follows the
// lidar roof: a 5x5 median smooths the noise, then the roof heights snap to flat tiers (low wing, podium, setback, tower, crown).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_104475936.cells.json`, "utf8"));
const SIZE = [80, 73, 105];

const FOUND = "stone_bricks", BASE = "polished_andesite", CONC = "light_gray_concrete", PIER = "gray_concrete";
const GLASS = "light_blue_stained_glass", LOBBY = "glass", CAP = "smooth_stone", CORNICE = "white_concrete";
const WARM = "glowstone", PLANT = "oak_leaves";

const at = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { x, z, g, r }]));
const cellsList = [...at.values()];
const inside = (x, z) => at.has(`${x},${z}`);
const edge = (x, z) => !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

// lidar roof per cell: the median over a 5x5 window of footprint cells, then snapped to a flat tier
for (const c of cellsList) {
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const n = at.get(`${c.x + dx},${c.z + dz}`); if (n) vals.push(n.r); }
  vals.sort((a, b) => a - b);
  c.hs = vals[vals.length >> 1];
  const top = c.hs >= 58 ? 60 : c.hs >= 44 ? 56 : c.hs >= 30 ? 40 : c.hs >= 16 ? 22 : Math.max(c.g + 8, c.hs);
  c.H = Math.max(top, c.g + 4);
  c.edge = edge(c.x, c.z);
}
// a tier boxed in by taller ones is a roof over air, so it rises to meet them (the noise left single cells lower)
for (let pass = 0; pass < 2; pass++) for (const c of cellsList) {
  if (c.edge) continue;
  const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => at.get(`${c.x + dx},${c.z + dz}`)).filter(Boolean);
  if (nb.filter((n) => n.H > c.H).length >= 3) c.H = Math.max(...nb.map((n) => n.H));
}

const depth = new Map(cellsList.filter((c) => c.edge).map((c) => [`${c.x},${c.z}`, 1]));
// breadth-first inward from the wall: each cell's depth is one more than its nearest wall cell
{
  const queue = [...depth.keys()];
  for (let i = 0; i < queue.length; i++) {
    const [x, z] = queue[i].split(",").map(Number), d = depth.get(queue[i]);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = `${x + dx},${z + dz}`;
      if (inside(x + dx, z + dz) && !depth.has(k)) { depth.set(k, d + 1); queue.push(k); }
    }
  }
}
for (const c of cellsList) c.depth = depth.get(`${c.x},${c.z}`);

const g = new Voxels(SIZE);
const put = (x, y, z, b) => g.set(x, y, z, b);

for (const c of cellsList) {
  const { x, z, g: gr, H } = c;
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);                       // foundation up to the lidar ground
  for (let y = gr; y < H; y++) {
    if (c.depth >= 3 && y < H - 1) { put(x, y, z, CONC); continue; }     // a solid service core: nothing in it hangs
    const m = y % 4;                                                       // storeys are 4 blocks: slab, 2 glass rows, spandrel
    let b = null;
    if (y === H - 1) b = c.edge ? CORNICE : CAP;                           // parapet / roof membrane
    else if (y === gr) b = c.edge ? BASE : CONC;                           // base course
    else if (m === 0) b = CONC;                                            // floor slab
    else if (!c.edge) b = null;                                            // air behind the glass
    else if (m === 3) b = CONC;                                            // spandrel
    else b = (x + z) % 3 === 0 ? PIER : GLASS;                             // glass panes between piers
    if (b) put(x, y, z, b);
  }
}

// warm light: a glowstone on the floor just behind some lit panes (floor-level rows only, so it stands on the slab)
const inward = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => [x + dx, z + dz]).find(([a, b]) => inside(a, b) && !edge(a, b));
for (const c of cellsList) {
  if (!c.edge || (c.x * 3 + c.z * 5) % 11 !== 0) continue;
  const inw = inward(c.x, c.z); if (!inw) continue;
  for (let y = c.g + 1; y < c.H - 1; y++) if (y % 4 === 1 && (c.x + c.z) % 3 !== 0) put(inw[0], y, inw[1], WARM);
}

// entrance on the face with the most exposed cells: a glazed lobby three cells wide, a canopy bar above it
const faces = [[0, -1], [0, 1], [-1, 0], [1, 0]];
let face = null;
for (const [dx, dz] of faces) {
  const list = cellsList.filter((c) => c.edge && !inside(c.x + dx, c.z + dz));
  if (!face || list.length > face.list.length) face = { dx, dz, list };
}
const along = (c) => (face.dx === 0 ? c.x : c.z);
const alongs = face.list.map(along).sort((a, b) => a - b);
const mid = alongs[alongs.length >> 1];
for (const c of face.list) {
  const d = Math.abs(along(c) - mid);
  if (d <= 2) put(c.x, c.g + 3, c.z, CAP);                                 // canopy bar
  if (d <= 1) for (let y = c.g; y <= c.g + 2; y++) put(c.x, y, c.z, LOBBY);
}
const centre = face.list.find((c) => along(c) === mid);
if (centre) { const inw = inward(centre.x, centre.z); if (inw) put(inw[0], centre.g + 1, inw[1], WARM); }

// roof: planters on the podium and tower tops, leaves standing on their planter
for (const c of cellsList) {
  if (c.edge) continue;
  if (c.H === 22 && (c.x * 5 + c.z * 3) % 17 === 0) { put(c.x, 22, c.z, CONC); put(c.x, 23, c.z, PLANT); }
  if (c.H === 56 && (c.x + c.z * 2) % 23 === 0) put(c.x, 56, c.z, CONC);
}

// nothing floats: every block above y 0 is carried from below, or runs from a carried block along its own storey (a floor slab)
for (let y = 1; y < SIZE[1]; y++) {
  const lit = cellsList.filter((c) => g.val(c.x, y, c.z));
  const seen = new Set(), queue = [];
  for (const c of lit) if (g.val(c.x, y - 1, c.z)) { seen.add(`${c.x},${c.z}`); queue.push(c); }
  while (queue.length) {
    const c = queue.pop();
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = `${c.x + dx},${c.z + dz}`;
      if (!seen.has(k) && inside(c.x + dx, c.z + dz) && g.val(c.x + dx, y, c.z + dz)) { seen.add(k); queue.push(at.get(k)); }
    }
  }
  const loose = lit.find((c) => !seen.has(`${c.x},${c.z}`));
  if (loose) throw new Error(`floating block at ${loose.x},${y},${loose.z}`);
}

const out = `${DIR}/way_104475936.nbt`;
const res = g.save(out);
console.log(`saved ${out}: ${res.blocks} blocks, ${res.palette} palette entries`);
