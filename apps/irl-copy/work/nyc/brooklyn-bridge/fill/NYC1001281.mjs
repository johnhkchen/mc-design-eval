import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC1001281.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC1001281.nbt";
const W = 33, H = 52, D = 44;

// 1955 Manhattan office block (postwar International Style): stone plinth,
// tinted glass curtain wall with aluminium mullions, light concrete spandrels,
// granite cornice and parapet, a framed lobby entrance on the street face,
// and a set-back mechanical penthouse on the tallest tier.
const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => x + "," + z;
const cell = new Map();
for (const [x, z, g, r] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  cell.set(key(x, z), { x, z, g: Math.round(g), r: Math.round(r) });
}
const has = (x, z) => cell.has(key(x, z));
const cells = [...cell.values()];

// Smooth lidar roof noise: 3x3 median, then snap to storey (3-block) tiers.
for (const c of cells) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = cell.get(key(c.x + dx, c.z + dz));
    if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  let top = Math.round(med / 3) * 3;
  top = Math.max(c.g + 3, top);
  top = Math.min(top, H - 8);
  c.top = top;
}
const maxTop = Math.max(...cells.map(c => c.top));

// Neighbour info, perimeter flag, and depth from the outside edge.
const nb = (c) => ({ w: has(c.x - 1, c.z), e: has(c.x + 1, c.z), n: has(c.x, c.z - 1), s: has(c.x, c.z + 1) });
for (const c of cells) {
  const m = nb(c);
  c.perim = !(m.w && m.e && m.n && m.s);
  c.depth = c.perim ? 0 : 999;
}
{
  const q = cells.filter(c => c.perim);
  while (q.length) {
    const c = q.shift();
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = cell.get(key(c.x + dx, c.z + dz));
      if (n && n.depth > c.depth + 1) { n.depth = c.depth + 1; q.push(n); }
    }
  }
}

// Penthouse footprint: cells on the tallest tier, set back at least 4 from the edge.
const ph = new Set();
for (const c of cells) if (c.top === maxTop && c.depth >= 4) ph.add(key(c.x, c.z));
const phEdge = (c) => {
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (!ph.has(key(c.x + dx, c.z + dz))) return true;
  }
  return false;
};

// Mullion pattern on the facade: corners always, otherwise every second bay.
function mullion(c) {
  const m = nb(c);
  const mx = !m.w || !m.e; // east/west face, runs along z
  const mz = !m.n || !m.s; // north/south face, runs along x
  if (mx && mz) return true;
  if (mx) return c.z % 2 === 0;
  if (mz) return c.x % 2 === 0;
  return false;
}

// Main entrance: bay nearest the centre on the north (low z) street face.
let door = null;
{
  const cands = cells.filter(c => c.perim && !has(c.x, c.z - 1) && has(c.x - 1, c.z) && has(c.x + 1, c.z));
  if (cands.length) {
    cands.sort((a, b) => Math.abs(a.x - 16) - Math.abs(b.x - 16));
    door = cands[0];
  }
}
const isDoorFlank = (c) => door && c.z === door.z && Math.abs(c.x - door.x) === 1 && c.perim;

const g = new Voxels([W, H, D]);

for (const c of cells) {
  const { x, z, g: gy, top, perim } = c;
  const isDoor = door && door.x === x && door.z === z;
  const lightsOk = c.depth === 1;

  // Foundation: solid from 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gy; y < top; y++) {
    // Roof deck and cornice course.
    if (y === top - 1) {
      g.set(x, y, z, perim ? "polished_granite" : "smooth_stone");
      continue;
    }
    if (perim) {
      if (y === gy) { g.set(x, y, z, "polished_granite"); continue; }   // base course
      if (y - gy < 3) {                                                  // shopfront band
        if (isDoor && (y === gy || y === gy + 1)) {
          g.set(x, y, z, "dark_oak_door", {
            facing: "north",
            half: y === gy ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
          continue;
        }
        // Framed entrance: granite piers flanking the door, fascia across the top.
        if (y === gy + 2 || isDoorFlank(c)) { g.set(x, y, z, "polished_granite"); continue; }
        g.set(x, y, z, mullion(c) ? "iron_block" : "light_blue_stained_glass");
        continue;
      }
      if (y % 3 === 0) { g.set(x, y, z, "light_gray_concrete"); continue; } // spandrel
      g.set(x, y, z, mullion(c) ? "iron_block" : "gray_stained_glass");
      continue;
    }
    // Interior: floor slabs per storey, air gap, occasional warm lights behind glass.
    if (y === gy || y % 3 === 0) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (lightsOk && y % 3 === 1 && y > gy && ((x * 7 + z * 13 + y) % 9 === 0)) {
      if ((x + z + y) % 2) g.set(x, y, z, "lantern", { hanging: "false" });
      else g.set(x, y, z, "shroomlight");
    }
  }

  // Parapet on the outer edge of the roof, one course above the cornice.
  if (perim && top < H) g.set(x, top, z, "polished_granite");

  // Mechanical penthouse on the tallest tier: 3 rows (walls + glass band + roof),
  // resting directly on the roof deck at top-1.
  if (ph.has(key(x, z))) {
    const b = top; // first penthouse row sits on the deck
    if (phEdge(c)) {
      g.set(x, b, z, "light_gray_concrete");
      g.set(x, b + 1, z, mullion(c) || (x + z) % 2 ? "iron_block" : "gray_stained_glass");
      g.set(x, b + 2, z, "polished_granite");
    } else {
      g.set(x, b, z, "white_concrete");
      g.set(x, b + 1, z, (x * 3 + z) % 7 === 0 ? "lantern" : "air", { hanging: "false" });
      if (g && (x * 3 + z) % 7 === 0) { /* lantern placed above */ }
      g.set(x, b + 2, z, "smooth_stone");
    }
  }
}

g.save(OUT);
