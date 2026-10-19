// DC87529: Library of Congress, Thomas Jefferson Building, 10 1st St SE, DC 20003, as a 1.21.1 module.
// Beaux-Arts Italianate (1897): a three-storey limestone block round two light courts, with a taller central
// pavilion rising to a copper dome. The footprint is a ring of wings (the courts are open to the sky, so their
// walls are facades too). Lidar roofs are 3x3-median smoothed and snapped to storey lines (4 blocks), then
// mode-smoothed so the tiers come out flat: 12 (three storeys), 16, 20 and 24 (the pavilion).
// Every column is solid from y 0 up to its tier, so nothing floats. Each facade cell is a 2-deep skin: the outer
// block is wall, window pane or mullion, and behind a pane the inner block is air (the air gap), while the rest of
// the depth is solid core. Storey lines (string courses and lintels) are stone bands on every row of r = 0 and r = 3.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC87529.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC87529.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const NAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const H = 28;

// Blocks
const WALL = "calcite";            // limestone walls and piers
const TRIM = "smooth_quartz";      // string courses, lintels, sills, mullions, cornice
const PLINTH = "polished_granite"; // base course
const PARAPET = "stone_brick_wall";
const ROOF = "deepslate_tiles";    // slate roof surface
const GLASS = "glass_pane";
const DOOR = "dark_oak_door";
const LAMP = "glowstone";
const LANTERN = "lantern";
const DRUM = "smooth_quartz";
const COPPER = "oxidized_copper";
const UNIT = "iron_block";

// Smoothed roof: 3x3 median of the lidar roof over footprint cells.
const med = (vals) => { const v = [...vals].sort((a, b) => a - b); return v[v.length >> 1]; };
const neigh = (c) => { const out = []; for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = F.get(key(c.x + dx, c.z + dz)); if (n) out.push(n); } return out; };
const roof = new Map();
for (const c of F.values()) roof.set(key(c.x, c.z), med(neigh(c).map((n) => n.r)));

// Storey tiers: roof snapped to a 4-block line, at least 12 (three storeys); two mode passes drop speckle.
const T = new Map();
for (const c of F.values()) T.set(key(c.x, c.z), Math.max(12, 4 * Math.round(roof.get(key(c.x, c.z)) / 4)));
for (let pass = 0; pass < 2; pass++) {
  const next = new Map();
  for (const c of F.values()) {
    const counts = new Map();
    for (const n of neigh(c)) counts.set(T.get(key(n.x, n.z)), (counts.get(T.get(key(n.x, n.z))) || 0) + 1);
    let best = T.get(key(c.x, c.z)), bn = -1;
    for (const [t, n] of counts) if (n > bn || (n === bn && t > best)) { best = t; bn = n; }
    next.set(key(c.x, c.z), best);
  }
  for (const [k, v] of next) T.set(k, v);
}

// Depth from outside: d = 1 is the outer skin (any 4-neighbour outside the footprint, courts included), d = 2 the next.
const D = new Map(); const q = [];
for (const c of F.values()) if (DIRS.some(([dx, dz]) => !inF(c.x + dx, c.z + dz))) { D.set(key(c.x, c.z), 1); q.push(c); }
for (let i = 0; i < q.length; i++) {
  const c = q[i], d = D.get(key(c.x, c.z));
  for (const [dx, dz] of DIRS) { const n = F.get(key(c.x + dx, c.z + dz)); if (n && !D.has(key(n.x, n.z))) { D.set(key(n.x, n.z), d + 1); q.push(n); } }
}
const depth = (x, z) => D.get(key(x, z)) ?? 99;

// Outward direction of a skin cell (the first side that is outside), and the bay index along that face.
const outward = (c) => DIRS.find(([dx, dz]) => !inF(c.x + dx, c.z + dz));
const bayIndex = (c, out) => (out[0] !== 0 ? c.z : c.x);
// A window pane sits on skin cells whose bay index is 1 or 3 mod 4; 0 is a pier, 2 a mullion.
const isPane = (c, out) => { const m = bayIndex(c, out) % 4; return m === 1 || m === 3; };

const g = new Voxels([51, H, 61]);
const skin = [...F.values()].filter((c) => depth(c.x, c.z) === 1);
const outOf = new Map(skin.map((c) => [key(c.x, c.z), outward(c)]));

// Entrances: on the north and south faces, the two skin cells nearest each face's centre.
const doors = [];
for (const face of [[0, 1], [0, -1]]) {
  const fc = skin.filter((c) => { const o = outOf.get(key(c.x, c.z)); return o[0] === face[0] && o[1] === face[1]; });
  if (!fc.length) continue;
  const m = Math.round(fc.reduce((s, c) => s + c.x, 0) / fc.length);
  const pair = fc.filter((c) => c.x === m || c.x === m + 1).sort((a, b) => a.x - b.x);
  if (pair.length === 2) doors.push({ cells: pair, face });
}
const doorKeys = new Set(doors.flatMap((d) => d.cells.map((c) => key(c.x, c.z))));

// Interior of the skin cells: the pane backs (air) are the depth-2 cells behind a pane.
const paneBack = new Set();
for (const c of skin) {
  const o = outOf.get(key(c.x, c.z));
  if (!isPane(c, o)) continue;
  paneBack.add(key(c.x - o[0], c.z - o[1]));
}

// Dome: the centre of the tallest tier, with a drum, two copper rings and a lantern.
const top = [...F.values()].filter((c) => T.get(key(c.x, c.z)) === 24 && depth(c.x, c.z) >= 2);
const cx = Math.round(top.reduce((s, c) => s + c.x, 0) / top.length);
const cz = Math.round(top.reduce((s, c) => s + c.z, 0) / top.length);
const dd = (c) => Math.hypot(c.x - cx, c.z - cz);

// The column, storey by storey.
for (const c of F.values()) {
  const t = T.get(key(c.x, c.z)), d = depth(c.x, c.z), k = key(c.x, c.z);
  const o = outOf.get(k);
  for (let y = 0; y < t; y++) {
    const r = y % 4;
    if (d === 1) {
      if (y === 0) { g.set(c.x, y, c.z, PLINTH); continue; }
      if (r === 0 || r === 3) { g.set(c.x, y, c.z, TRIM); continue; }     // string course and lintel / sill
      const m = bayIndex(c, o) % 4;
      if (m === 0) g.set(c.x, y, c.z, WALL);                                 // pier
      else if (m === 2) g.set(c.x, y, c.z, TRIM);                            // mullion
      else g.set(c.x, y, c.z, GLASS, paneState(c, o, y));                    // pane
      continue;
    }
    if (y === t - 1) { g.set(c.x, y, c.z, ROOF); continue; }                // slate roof surface
    if (d === 2 && paneBack.has(k) && (r === 1 || r === 2)) {               // air behind the pane
      if (r === 1 && (c.x * 7 + c.z * 5) % 11 === 0 && !doorKeys.has(k)) g.set(c.x, y, c.z, LAMP);
      continue;
    }
    g.set(c.x, y, c.z, r === 0 || r === 3 ? TRIM : WALL);
  }
  // Parapet on the outer skin of each tier; flat roofs of the courts and wings are open to the sky.
  if (d === 1) g.set(c.x, t, c.z, PARAPET);
  else if (d >= 2 && (c.x % 8 === 4) && (c.z % 8 === 4)) g.set(c.x, t, c.z, UNIT);
}

// The pane's connections: tangential neighbours inside the footprint, so the glass joins its frame.
function paneState(c, o) {
  const s = { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" };
  for (const [dx, dz] of DIRS) {
    if (dx === o[0] && dz === o[1]) continue;
    if (dx === -o[0] && dz === -o[1]) continue;
    if (inF(c.x + dx, c.z + dz)) s[NAME[`${dx},${dz}`]] = "true";
  }
  return s;
}

// Entrances: a dark oak door, lower and upper halves, in the skin, with air behind it and a lantern in the air.
for (const { cells: pair, face } of doors) {
  const facing = face[1] === 1 ? "south" : "north";
  pair.forEach((c, i) => {
    const hinge = i === 0 ? "left" : "right";
    const st = (half) => ({ facing, half, hinge, open: "false", powered: "false" });
    g.set(c.x, 1, c.z, DOOR, st("lower"));
    g.set(c.x, 2, c.z, DOOR, st("upper"));
    const o = outOf.get(key(c.x, c.z));
    const bx = c.x - o[0], bz = c.z - o[1];
    g.set(bx, 1, bz, "air");
    g.set(bx, 2, bz, LANTERN, { hanging: "true", waterlogged: "false" });
  });
}

// Dome: a drum on the tallest tier, two copper rings stepping in, and a lantern on the top. Each ring sits on the one below.
for (const c of top) {
  const r = dd(c);
  if (r <= 4) g.set(c.x, 24, c.z, DRUM);
  if (r <= 3) g.set(c.x, 25, c.z, COPPER);
  if (r <= 1.8) g.set(c.x, 26, c.z, COPPER);
  if (r <= 0.7) g.set(c.x, 27, c.z, LANTERN, { hanging: "false", waterlogged: "false" });
}

const info = g.save(OUT);
console.log("saved", OUT, info);
