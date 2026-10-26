// DC58787: 1301 7th St NW, a 1920s-style red-brick apartment block (4 storeys over a stone plinth, 3 storeys on the
// lower wings). Outer shell only: a 1-block brick ring, floor slabs per storey, an air gap behind every window.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC58787.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const W = 12, L = 44, Y = 26;
const FLOOR = 2;                       // the floor datum: the upper ground under the building; y 0..1 is foundation
const FLOORS = [2, 5, 8, 11];          // floor slab rows; storey air is the two rows above each slab

const key = (x, z) => `${x},${z}`;
const inFp = (x, z) => foot.has(key(x, z));
const roofAt = new Map(), foot = new Map();
for (const [x, z, g, r] of cells) { foot.set(key(x, z), { g, r }); roofAt.set(key(x, z), r); }

// Lidar roof heights are noisy: take the 3x3 median, then snap to two clean tiers. Main block (roof 15, four
// storeys, cornice at 14); lower wings (roof 13, three storeys, parapet at 12).
const tier = new Map();
for (const [k, { r }] of foot) {
  const [x, z] = k.split(",").map(Number); const rs = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFp(x + dx, z + dz)) rs.push(foot.get(key(x + dx, z + dz)).r);
  rs.sort((a, b) => a - b);
  const med = rs[Math.floor(rs.length / 2)];
  tier.set(k, med >= 14 ? { main: true, ringTop: 14, deck: 14 } : { main: false, ringTop: 12, deck: 11 });
}
const tierAt = (x, z) => tier.get(key(x, z));

// A ring cell (the facade) has at least one outward neighbour missing. Its face is that direction; a corner (two
// faces) stays solid brick so the corners read as solid masonry.
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const faceOf = (x, z) => {
  const miss = DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz));
  return miss.length === 1 ? miss[0] : null;
};
const isRing = (x, z) => inFp(x, z) && DIRS.some(([dx, dz]) => !inFp(x + dx, z + dz));

// Entrance on the north (z = 0) face, the street end; door at x = 4 with a lantern just inside.
const DOOR = [4, 0];
const isDoor = (x, z) => x === DOOR[0] && z === DOOR[1];

// Window bays on facades: two glass panes, then a brick pier, repeating along the face. s is the coordinate along it.
const alongS = (x, z, [dx]) => (dx !== 0 ? z : x);
const paneHere = (x, z) => {
  if (!isRing(x, z) || isDoor(x, z)) return false;
  const f = faceOf(x, z); if (!f) return false;
  return alongS(x, z, f) % 3 !== 0;
};

const g = new Voxels([W, Y, L]);
const stoneSlab = { type: "bottom", waterlogged: "false" };
const paneState = (x, z, f) => {
  const [dx] = f;
  // connect a pane to the pane beside it on the same facade; the rest stay unconnected
  const a = dx !== 0 ? paneHere(x, z - 1) : paneHere(x - 1, z), b = dx !== 0 ? paneHere(x, z + 1) : paneHere(x + 1, z);
  const s = (v) => (v ? "true" : "false");
  return dx !== 0
    ? { north: s(a), south: s(b), east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: s(b), west: s(a), waterlogged: "false" };
};
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

// Foundation and interiors first: a solid plinth under every footprint cell; floor slabs per storey across the whole
// interior; the rest of the interior is air.
for (const [k] of foot) {
  const [x, z] = k.split(",").map(Number); const t = tierAt(x, z);
  for (let y = 0; y < FLOOR; y++) g.set(x, y, z, "stone_bricks");
  if (isRing(x, z)) continue;
  for (const f of FLOORS) if (f <= t.deck) g.set(x, f, z, "smooth_stone");
}

// The facade ring: plinth and base course, string courses at each floor, brick between, glass in the bays, a cornice
// over the top.
for (const [k] of foot) {
  const [x, z] = k.split(",").map(Number); if (!isRing(x, z)) continue;
  const t = tierAt(x, z); const f = faceOf(x, z);
  for (let y = 0; y <= t.ringTop; y++) {
    if (y < FLOOR) continue;                                             // plinth already placed
    if (y === t.ringTop) { g.set(x, y, z, "stone_brick_slab", stoneSlab); continue; }   // cornice / parapet
    if (y === FLOOR || FLOORS.includes(y)) { g.set(x, y, z, "stone_bricks"); continue; } // base and string courses
    if (isDoor(x, z) && (y === 3 || y === 4)) { g.set(x, y, z, "oak_door", doorState(y === 3 ? "lower" : "upper")); continue; }
    const under = FLOORS.filter((fl) => y > fl && y <= fl + 2).pop();   // the storey this row belongs to
    if (under !== undefined && f && paneHere(x, z)) { g.set(x, y, z, "glass_pane", paneState(x, z, f)); continue; }
    g.set(x, y, z, "bricks");
  }
}

// Windows lit from behind: glowstone on the floor slab a cell inside the glass (the air gap stays), every fourth bay.
let lit = 0;
for (const [k] of foot) {
  const [x, z] = k.split(",").map(Number); const f = faceOf(x, z);
  if (!isRing(x, z) || !f || !paneHere(x, z) || isDoor(x, z)) continue;
  const under = FLOORS.filter((fl) => fl < tierAt(x, z).ringTop - 1);
  if (alongS(x, z, f) % 12 !== 1 && alongS(x, z, f) % 12 !== 2) continue;  // a few lit bays, not all
  const ix = x - f[0], iz = z - f[1];
  if (!inFp(ix, iz) || isRing(ix, iz)) continue;
  for (const fl of under) {
    if (!(fl + 1 <= tierAt(x, z).ringTop - 2)) continue;
    if (fl === FLOOR && (alongS(x, z, f) % 2 === 0)) continue;   // keep some ground-floor windows dark
    g.set(ix, fl + 1, iz, "glowstone"); lit++;
  }
}

// The lantern just inside the entrance, on the ground-floor slab.
g.set(DOOR[0], FLOOR + 1, DOOR[1] + 1, "lantern", { hanging: "false", waterlogged: "false" });

// Roof: a mechanical penthouse on the main block's roof, set on the deck (rows 15-16 walls, slab roof at 17).
const pent = (() => {
  for (let z0 = 14; z0 < L - 3; z0++) for (let x0 = 2; x0 < W - 2; x0++) {
    let ok = true;
    for (let x = x0; x < x0 + 3 && ok; x++) for (let z = z0; z < z0 + 4 && ok; z++) {
      ok = inFp(x, z) && !isRing(x, z) && tierAt(x, z).main;
    }
    if (ok) return { x0, z0 };
  }
  return null;
})();
if (pent) {
  for (let x = pent.x0; x < pent.x0 + 3; x++) for (let z = pent.z0; z < pent.z0 + 4; z++) {
    g.set(x, 17, z, "stone_brick_slab", stoneSlab);
    const edge = x === pent.x0 || x === pent.x0 + 2 || z === pent.z0 || z === pent.z0 + 3;
    for (let y = 15; y <= 16; y++) if (edge) g.set(x, y, z, "stone_bricks");
  }
}

const out = `${DIR}/DC58787.nbt`;
const stats = g.save(out);
console.log(JSON.stringify({ footprint: foot.size, rings: [...foot.keys()].filter((k) => isRing(...k.split(",").map(Number))).length, lit, pent, ...stats, file: out }));
