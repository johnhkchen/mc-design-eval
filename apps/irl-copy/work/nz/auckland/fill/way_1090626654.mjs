// Te Mātāwai, Auckland (way 1090626654): a 1980s concrete-frame office block, a 14-storey north tower (roof 58) over a
// 12-storey wing and a 6-storey podium, with a 3-storey low edge. Lidar roofs are median-smoothed and snapped to tiers on
// the 4-block storey grid (4, 12, 24, 36, 48, 56, 58). Storey lines sit on absolute multiples of 4 (the floor datum is the
// ground rounded up to 4, the plinth fills the gap), so the bands run level across the whole footprint and step only at
// the tiers. Each column is solid from y 0 to its roof: a foundation below the ground, then per storey a light-grey slab
// line, two rows of glass in white-concrete spandrels with grey-concrete mullions on every third cell, and a white header.
// The window rows are glass only on exposed faces (a neighbour that does not reach that height counts as open), so the
// setbacks read as real walls. Interiors are air behind the glass with a solid floor slab per storey. A dark-oak
// entrance sits on the low side, glowstone shows behind some panes, the tower carries a plant room, the podium carries
// boxes with lanterns on top.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1090626654.cells.json", "utf8"));
const X = 91, Z = 102, Y = 71;
const key = (x, z) => x * 1000 + z;

// per cell: lidar ground G and roof R; the footprint map
const cell = new Map();
for (const [x, z, g, r] of cells) cell.set(key(x, z), { x, z, G: g, R: r });
const inside = (x, z) => cell.has(key(x, z));

// roofs: a 3x3 median of the lidar roof, then the nearest storey-grid tier; floor datum F = ground up to a multiple of 4
const TIERS = [4, 12, 24, 36, 48, 56, 58];
const snap = (v) => TIERS.reduce((best, t) => (Math.abs(t - v) < Math.abs(best - v) ? t : best));
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const c = cell.get(key(x + dx, z + dz)); if (c) v.push(c.R); }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
for (const c of cell.values()) {
  c.F = Math.ceil(c.G / 4) * 4;                       // floor datum: lines at 0, 4, 8, 12 for every cell
  c.T = Math.max(snap(median(c.x, c.z)), c.F + 4);     // top of the column (a multiple of 4, or 58 for the crown)
}

// the 4 sides in order E W S N; a side is exposed where the neighbour does not reach that height
const SIDES = [[1, 0, "E"], [-1, 0, "W"], [0, 1, "S"], [0, -1, "N"]];
const exposedSides = (x, z, y) => SIDES.filter(([dx, dz]) => {
  const nb = cell.get(key(x + dx, z + dz));
  return !nb || y >= nb.T;
});
// the air gap: an interior cell next to a glass cell at this height (the core fills the rest, so every plate has a solid below)
const gapBehindGlass = (x, z, y) => SIDES.some(([dx, dz]) => {
  const nb = cell.get(key(x + dx, z + dz));
  return nb && exposedSides(x + dx, z + dz, y).length > 0;
});
// the cell that stands at a side's outward neighbour carries the mullion rhythm along its face
const alongOf = (side, x, z) => (side === "E" || side === "W" ? z : x);
const facingIn = { E: "west", W: "east", S: "north", N: "south" };   // a door faces into the building

// the entrance: on the lowest exposed face near the middle of its side
let entrance = null;
for (const c of cell.values()) {
  const sides = exposedSides(c.x, c.z, c.F + 1);
  if (!sides.length) continue;
  const side = sides[0][2];
  const mid = side === "E" || side === "W" ? 51 : 45;
  const score = c.F * 1000 + Math.abs(alongOf(side, c.x, c.z) - mid);
  if (!entrance || score < entrance.score) entrance = { c, side: sides[0][2], score };
}
const doorCell = entrance.c, doorSide = entrance.side;

const v = new Voxels([X, Y, Z]);

// the solid pieces, and how a window row is dressed
const glass = "light_blue_stained_glass", mullion = "gray_concrete", header = "white_concrete";
const floorLine = "light_gray_concrete", base = "stone_bricks", parapetWall = "white_concrete";
const slab = (type) => ({ type, waterlogged: "false" });
const door = (facing, half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });

for (const c of cell.values()) {
  const { x, z, G, F, T } = c;
  for (let y = 0; y < T; y++) {
    // foundation below the ground, then the plinth up to the floor datum
    if (y < G) { v.set(x, y, z, "stone"); continue; }
    if (y < F) { v.set(x, y, z, base); continue; }

    const storey = Math.floor((y - F) / 4), k = (y - F) % 4;
    const sides = exposedSides(x, z, y);
    const outer = sides.length > 0;
    const top = y === T - 1;

    if (top) {
      if (outer) v.set(x, y, z, "stone_brick_slab", slab("top"));
      else v.set(x, y, z, floorLine);
      continue;
    }
    if (k === 0) { v.set(x, y, z, storey === 0 ? base : floorLine); continue; }
    if (k === 3) { v.set(x, y, z, header); continue; }

    // rows 1 and 2: the window band on an exposed face; a one-cell air gap behind the glass, the core solid beyond it
    if (!outer) {
      if (!gapBehindGlass(x, z, y)) v.set(x, y, z, "stone");
      continue;
    }
    if (y === T - 2) { v.set(x, y, z, parapetWall); continue; }

    const side = sides[0][2];
    const a = alongOf(side, x, z);
    if (x === doorCell.x && z === doorCell.z && storey === 0 && doorSide === side) {
      v.set(x, y, z, "dark_oak_door", door(facingIn[side], k === 1 ? "lower" : "upper"));
      continue;
    }
    if (a % 3 === 0) { v.set(x, y, z, mullion); continue; }
    v.set(x, y, z, glass);
  }

  // roof plant boxes on the podium and the wings, a lantern on each
  if ((x % 9 === 4 && z % 9 === 4) && T >= 36 && T < 58) {
    for (let y = T; y < T + 2; y++) v.set(x, y, z, floorLine);
    v.set(x, T + 2, z, "lantern", { hanging: "false" });
  }
}

// the tower's plant room on the crown (roof 58): a block of grey concrete over the central top cells
const crown = [...cell.values()].filter((c) => c.T === 58);
const cx = Math.round(crown.reduce((s, c) => s + c.x, 0) / crown.length);
const cz = Math.round(crown.reduce((s, c) => s + c.z, 0) / crown.length);
for (let x = cx - 5; x <= cx + 5; x++) for (let z = cz - 4; z <= cz + 4; z++) {
  const c = cell.get(key(x, z));
  if (!c || c.T !== 58) continue;
  for (let y = 58; y < 61; y++) v.set(x, y, z, y === 60 ? "stone_brick_slab" : floorLine, y === 60 ? slab("bottom") : undefined);
}

// warm light: glowstone one block inside some windows of the upper storeys, and a shroomlight behind the lobby door
let lit = 0;
for (const c of cell.values()) {
  // the lamp stands on the floor slab (the storey's first row), one block in from the glass
  for (let y = c.F + 5; y < c.T - 3; y += 4) {
    const sides = exposedSides(c.x, c.z, y);
    if (!sides.length || (c.x * 7 + c.z * 13 + y) % 9 !== 0) continue;
    const [dx, dz] = [SIDES.find(([, , n]) => n === sides[0][2])[0], SIDES.find(([, , n]) => n === sides[0][2])[1]];
    const ix = c.x - dx, iz = c.z - dz;
    if (!inside(ix, iz) || exposedSides(ix, iz, y).length) continue;
    v.set(ix, y, iz, "glowstone"); lit++;
  }
}
const dx = SIDES.find(([, , n]) => n === doorSide)[0], dz = SIDES.find(([, , n]) => n === doorSide)[1];
v.set(doorCell.x - dx, doorCell.F + 1, doorCell.z - dz, "shroomlight");

v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1090626654.nbt");
console.log(`way_1090626654: ${cell.size} cells, entrance ${doorSide} at (${doorCell.x},${doorCell.z}), ${lit} lit windows, ${v.count()} blocks`);
