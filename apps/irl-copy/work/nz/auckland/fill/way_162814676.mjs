// Haka House Hostel, Auckland City: a four-storey rendered-masonry commercial block (early-to-mid 20th century,
// cream plaster on a stone plinth, a shopfront ground floor, rows of sash-style windows), footprint 75 x 37 blocks.
// The lidar roof is smoothed into level tiers (17 = the main roof, 13 and 9 setbacks, 5 and bare ground for the
// low wings and decks). Each cell stands on its own foundation (solid from y 0 to its ground), its walls run up to its
// tier, and every storey rests on a floor slab, so nothing floats. Interiors are not modelled: the walls are one block
// thick with the glass set in them, and the rooms behind are air, with a floor slab per storey and a roof slab on top.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const SIZE = [75, 31, 37];
const FLOORS = [1, 5, 9, 13];                 // storey lines: four 4-block storeys stacked down from the 17-block roof
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const M = {
  found: "stone", base: "stone_bricks", wall: "smooth_quartz", pier: "quartz_pillar", string: "quartz_bricks",
  cornice: "polished_andesite", glass: "glass", floor: "smooth_stone", roof: "stone", door: "dark_oak_door",
  lintel: "polished_andesite", light: "glowstone", plant: "light_gray_concrete", lift: "smooth_quartz",
};

// the lidar roof is noisy (16 to 18 over the main roof): round it to the nearest storey tier
const tierTop = (r) => (r >= 16 ? 17 : r >= 11 ? 13 : r >= 7 ? 9 : r >= 3 ? 5 : r);

const cells = JSON.parse(readFileSync(`${DIR}/way_162814676.cells.json`, "utf8"));
const cols = new Map();
const at = (x, z) => cols.get(`${x},${z}`);
for (const [x, z, g, r] of cells) {
  const T = tierTop(r), deck = T <= g;
  cols.set(`${x},${z}`, { x, z, g, deck, T: deck ? g : T, faces: [], bands: [], ring: false, corner: false });
}
const all = [...cols.values()];

// Walls: a column is a wall column when a side is open to the air (outside the footprint, or beside a lower tier);
// its faces say from which row the open side starts. Storeys: the stack of storey bands from ground to tier top.
for (const c of all) {
  if (c.deck) continue;
  for (const [dx, dz] of DIRS) {
    const n = at(c.x + dx, c.z + dz);
    if (!n) c.faces.push({ dx, dz, from: c.g });
    else if (n.T < c.T) c.faces.push({ dx, dz, from: Math.max(c.g, n.T) });
  }
  c.ring = c.faces.length > 0;
  c.corner = c.faces.some((f) => f.dx) && c.faces.some((f) => f.dz);
  const cuts = [c.g, ...FLOORS.filter((f) => f > c.g && f < c.T), c.T];
  for (let i = 0; i + 1 < cuts.length; i++) {
    const y0 = cuts[i], y1 = cuts[i + 1], last = i + 2 === cuts.length;
    c.bands.push({ y0, y1, kind: !last && y1 - y0 < 3 ? "plinth" : "storey" });
  }
  c.groundIdx = c.bands.findIndex((b) => b.kind === "storey");
}

const bandAt = (c, y) => c.bands.find((b) => y >= b.y0 && y < b.y1);
const isFloorRow = (c, y) => c.bands.some((b) => b.y0 === y);
const isWindowRow = (c, b, y) => b.kind === "storey" && y >= b.y0 + 1 && y <= b.y1 - 2;

const vox = new Voxels(SIZE);

// 1. foundations, decks and the body of each column
for (const c of all) {
  for (let y = 0; y < c.g; y++) vox.set(c.x, y, c.z, M.found);
  if (c.deck) { vox.set(c.x, c.g, c.z, M.floor); continue; }
  for (let y = c.g; y < c.T; y++) {
    if (c.ring) {
      const b = bandAt(c, y);
      let blk = M.wall;
      if (y === c.T - 1) blk = M.cornice;
      else if (b.kind === "plinth") blk = M.base;
      else if (y === b.y0 && y > c.g) blk = M.string;
      else if (c.corner) blk = M.pier;
      vox.set(c.x, y, c.z, blk);
    } else if (isFloorRow(c, y)) vox.set(c.x, y, c.z, M.floor);
    else if (y === c.T - 1) vox.set(c.x, y, c.z, M.roof);
  }
}

// 2. the facades: pilasters every fourth block, glass in the bays, a shopfront on the ground storey
const windows = [];
for (const c of all) {
  if (!c.ring || c.deck) continue;
  for (const f of c.faces) {
    const u = f.dz !== 0 ? c.x : c.z;
    for (let y = Math.max(f.from, c.g); y < c.T - 1; y++) {
      const b = bandAt(c, y);
      if (!isWindowRow(c, b, y) || c.corner) {
        if (!c.corner && vox.get(c.x, y, c.z)?.block === M.wall && u % 4 === 0) vox.set(c.x, y, c.z, M.pier);
        continue;
      }
      const ground = c.bands.indexOf(b) === c.groundIdx;
      const open = ground ? u % 4 !== 0 : u % 4 === 1 || u % 4 === 2;
      if (!open) { if (u % 4 === 0) vox.set(c.x, y, c.z, M.pier); continue; }
      vox.set(c.x, y, c.z, M.glass);
      windows.push({ c, f, y, ground });
    }
  }
}

// 3. the entrance: two-wide door on the street (-z) face, centred on the ground storey's frontage
const front = all.filter((c) => c.ring && c.faces.some((f) => f.dz === -1 && f.from === c.g) &&
  c.groundIdx >= 0 && c.bands[c.groundIdx].y1 - c.bands[c.groundIdx].y0 >= 3);
const mid = front.map((c) => c.x).sort((a, b) => a - b)[Math.floor(front.length / 2)];
const doorCols = front.filter((c) => c.x === mid || c.x === mid + 1);
for (const c of doorCols) {
  const gb = c.bands[c.groundIdx];
  const st = { facing: "south", hinge: "left", open: "false", powered: "false" };
  vox.set(c.x, gb.y0 + 1, c.z, M.door, { ...st, half: "lower" });
  vox.set(c.x, gb.y0 + 2, c.z, M.door, { ...st, half: "upper" });
  vox.set(c.x, gb.y0 + 3, c.z, M.lintel);
}

// 4. warm light: a glowstone just inside some of the glass, in the air gap behind it
let lit = 0;
for (const { c, f, y } of windows) {
  const ic = at(c.x - f.dx, c.z - f.dz);
  if (!ic || ic.deck || ic.ring || y >= ic.T - 1 || isFloorRow(ic, y)) continue;
  if ((c.x * 3 + y * 5 + c.z * 7) % 4 !== 0) continue;
  vox.set(ic.x, y, ic.z, M.light); lit++;
}

// 5. roof plant: two plant boxes and a stair/lift overrun on the main 17-block roof, away from the edges
const top = all.filter((c) => !c.deck && !c.ring && c.T === 17);
const topSet = new Set(top.map((c) => `${c.x},${c.z}`));
const mx = top.reduce((s, c) => s + c.x, 0) / top.length, mz = top.reduce((s, c) => s + c.z, 0) / top.length;
const anchors = [...top].sort((a, b) => Math.hypot(a.x - mx, a.z - mz) - Math.hypot(b.x - mx, b.z - mz));
const used = new Set();
const fits = (x0, z0, w, d) => {
  for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) if (!topSet.has(`${x},${z}`) || used.has(`${x},${z}`)) return false;
  return true;
};
const place = (w, d, h, blk, cap) => {
  const a = anchors.find((c) => fits(c.x, c.z, w, d));
  if (!a) return;
  for (let x = a.x; x < a.x + w; x++) for (let z = a.z; z < a.z + d; z++) {
    used.add(`${x},${z}`);
    for (let y = 17; y < 17 + h; y++) vox.set(x, y, z, y === 17 + h - 1 && cap ? cap : blk);
  }
};
place(3, 2, 2, M.plant);
place(3, 2, 2, M.plant);
place(2, 2, 3, M.lift, "polished_andesite");

const stats = vox.save(`${DIR}/way_162814676.nbt`);
console.log(JSON.stringify({ footprint: all.length, walls: all.filter((c) => c.ring).length, windows: windows.length, lit, doors: doorCols.length, ...stats }));
