// Way 264868506: a 1980s-90s Auckland office block on a sloping site (Maungawhau view). Frame-and-glass curtain wall on a
// basalt plinth, pale precast spandrels, a stepped massing (46 / 50 / 54 / 62 / 74 / 86 tops) from the lidar roof, and
// a thin crown tower. Storey lines sit on one absolute grid (y = 2 mod 4) so the floors line up across the sloping
// footprint; downhill cells show extra storeys below the datum. The interior is air behind the glass, with a slab per
// storey and a cover over every cell.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_264868506.cells.json", "utf8"));   // [x, z, ground, roof]
const W = 20, D = 18, H = 97;

// Blocks
const FOUNDATION = "stone", PLINTH = "polished_basalt", SLAB = "smooth_stone", SPANDREL = "light_gray_concrete";
const PIER = "white_concrete", GLASS = "light_blue_stained_glass", LIT = "glowstone", CORNICE = "quartz_block";
const PARAPET = "quartz_slab", ROOF = "gray_concrete", CANOPY = "smooth_stone", PLANT = "iron_block";
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];

// Lidar roof -> flat tier (no noise, the crown kept sharp)
const tierOf = (r) => (r >= 80 ? 86 : r >= 64 ? 74 : r >= 58 ? 62 : r >= 54 ? 54 : r >= 48 ? 50 : 46);
const C = new Map();
for (const [x, z, g, r] of cells) C.set(`${x},${z}`, { x, z, g, r, T: tierOf(r), f0: g + ((2 - g) % 4 + 4) % 4 });
const at = (x, z) => C.get(`${x},${z}`);

// Exposed faces of cell c at height y: the outside, or a neighbour whose roof is below y
const faces = (c, y) => DIRS.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || y >= n.T; });
const isLine = (y) => ((y - 2) % 4 + 4) % 4 === 0;
const rowOf = (y) => ((y - 2) % 4 + 4) % 4;   // 0 slab, 1-2 glass, 3 spandrel

// Entrance: a single outward face at the lowest floor line, on the bottom storey, so the door stands on its slab
const outsideOnly = (c) => { const fs = faces(c, c.f0 + 1); return fs.length === 1 && !at(c.x + fs[0][0], c.z + fs[0][1]); };
const entrance = [...C.values()].filter(outsideOnly).sort((a, b) => a.f0 - b.f0 || a.z - b.z)[0];
const doorFace = entrance ? faces(entrance, entrance.f0 + 1)[0] : null;

const v = new Voxels([W, H, D]);
const topCell = [...C.values()].reduce((a, b) => (b.T > a.T || (b.T === a.T && Math.abs(b.x - 9) + Math.abs(b.z - 15) < Math.abs(a.x - 9) + Math.abs(a.z - 15)) ? b : a));

for (const c of C.values()) {
  const { x, z, g, f0, T } = c;
  for (let y = 0; y < g; y++) v.set(x, y, z, FOUNDATION);
  for (let y = g; y < f0; y++) v.set(x, y, z, PLINTH);
  for (let y = f0; y < T; y++) {
    const fs = faces(c, y);
    const perim = fs.length > 0;
    if (y === T - 1) { v.set(x, y, z, perim ? CORNICE : ROOF); continue; }
    const r = rowOf(y);
    if (r === 0) { v.set(x, y, z, perim ? SPANDREL : SLAB); continue; }
    if (!perim) continue;                        // interior air behind the glass
    if (r === 3) { v.set(x, y, z, SPANDREL); continue; }
    // glazing rows: a pier every second block along the face, glass between; corners are piers
    const corner = fs.some(([dx]) => dx !== 0) && fs.some(([, dz]) => dz !== 0);
    const u = fs.some(([, dz]) => dz !== 0) ? x : z;
    const pier = corner || (((u % 2) + 2) % 2 === 0);
    const lit = ((x * 31 + z * 17 + y * 7) % 9 === 0);
    v.set(x, y, z, pier ? PIER : lit ? LIT : GLASS);
  }
  if (c.T < H && faces(c, c.T).length) v.set(x, T, z, PARAPET, { type: "bottom", waterlogged: "false" });
}

// Roof plant on a few interior roof cells, and the crown mast on the tallest cell
for (const c of C.values()) {
  if (faces(c, c.T).length) continue;
  if (c.T >= 50 && c.x % 4 === 1 && c.z % 3 === 1) { v.set(c.x, c.T, c.z, PLANT); }
}
for (let y = topCell.T; y < topCell.T + 6; y++) v.set(topCell.x, y, topCell.z, "iron_bars");
v.set(topCell.x, topCell.T + 6, topCell.z, "shroomlight");

// Entrance: door on the lower two rows, canopy over it, a hanging lantern beside it
if (entrance) {
  const [dx, dz, name] = doorFace;
  const { x, z, f0 } = entrance;
  const st = { facing: name, hinge: "left", open: "false", powered: "false" };
  v.set(x, f0 + 1, z, "dark_oak_door", { ...st, half: "lower" });
  v.set(x, f0 + 2, z, "dark_oak_door", { ...st, half: "upper" });
  // canopy along the face, one cell either side
  for (const [ox, oz] of dz !== 0 ? [[-1, 0], [0, 0], [1, 0]] : [[0, -1], [0, 0], [0, 1]]) {
    const n = at(x + ox, z + oz);
    if (n) v.set(n.x, f0 + 3, n.z, CANOPY);
  }
  for (const [ox, oz] of dz !== 0 ? [[-1, 0]] : [[0, -1]]) {
    const n = at(x + ox, z + oz);
    if (n) v.set(n.x, f0 + 2, n.z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

const out = v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_264868506.nbt");
console.log(JSON.stringify(out));
