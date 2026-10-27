// Way 1034703368, Eden Terrace side of the CBD ridge: a 1960s-70s Auckland concrete commercial block, five storeys
// on the high (north) side, stepping down the slope. Cream precast piers, pale spandrel bands, glass bays, a stone
// plinth that runs down into the foundation, a 26-block tower core on a 22-block body, and a plant penthouse on the core.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1034703368.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1034703368.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => x * 100 + z;
const raw = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const med = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };

// Lidar cleanup: a 3x3 median over the footprint drops the 1-block and 11-block spikes; the roof then snaps to two
// tiers, the 22-block body and the 26-block tower core (anything under 24.5 is body).
const col = new Map();
for (const [k, { g: g0, r: r0 }] of raw) {
  const x = Math.floor(k / 100), z = k % 100;
  const gs = [], rs = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = raw.get(key(x + dx, z + dz)); if (!n) continue;
    gs.push(n.g); if (n.r >= 10) rs.push(n.r);
  }
  const roof = rs.length ? med(rs) : r0;
  col.set(k, { g: med(gs.length ? gs : [g0]), R: roof >= 24.5 ? 26 : 22, pent: false });
}
// the tower core: a tier cell whose whole 3x3 is also tier 26 gets a plant penthouse on top (26..28, cornice at 29)
for (const [k, c] of col) {
  const x = Math.floor(k / 100), z = k % 100;
  c.pent = c.R === 26 && [-1, 0, 1].every((dx) => [-1, 0, 1].every((dz) => col.get(key(x + dx, z + dz))?.R === 26));
}

const top = (c) => (c.pent ? 29 : c.R);                       // solid from 0 to here (foundation, body, penthouse)
const base = (c, y) => (y < c.R ? c.g : c.R);                 // the storey line this height belongs to
const solid = (x, z, y) => { const c = col.get(key(x, z)); return !!c && y >= 0 && y < top(c); };
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// outward faces: sides with no solid column beside them at this height (the building's envelope)
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !solid(x + dx, z + dz, y));
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

// the south face's entrance: the ground-floor bay nearest the middle of the block's southern frontage
const southern = [...col].filter(([k, c]) => exposed(Math.floor(k / 100), k % 100, c.g).some(([dx, dz]) => dz === 1) && Math.floor(k / 100) % 3 === 1);
const xMid = 18;
const door = southern.length ? southern.reduce((best, cur) => (Math.abs(Math.floor(cur[0] / 100) - xMid) < Math.abs(Math.floor(best[0] / 100) - xMid) ? cur : best)) : null;
const doorKey = door ? door[0] : null;

const G = new Voxels([38, 39, 30]);
const put = (x, y, z, block, state) => G.set(x, y, z, block, state);

for (const [k, c] of col) {
  const x = Math.floor(k / 100), z = k % 100, T = top(c);
  for (let y = 0; y < c.g; y++) put(x, y, z, "stone_bricks");               // foundation, down to the lowest ground under it
  for (let y = c.g; y < T; y++) {
    const faces = exposed(x, z, y);
    const b = base(c, y), t = (y - b) % 4;
    const cap = y === T - 1, roofSlab = y === c.R - 1 || cap;
    if (!faces.length) {                                                    // interior: floor slabs and the roof, air between
      if (roofSlab) put(x, y, z, "gray_concrete");
      else if (t === 0) put(x, y, z, "smooth_stone");
      continue;
    }
    const [dx] = faces[0];
    const along = dx !== 0 ? z : x;
    const pier = along % 3 === 0;
    const ground = !c.pent && y - c.g < 4;
    let blk;
    if (ground) blk = t === 0 ? "stone_bricks" : t === 3 ? "smooth_stone" : pier ? "polished_andesite" : "light_blue_stained_glass";
    else if (cap && !pier) blk = "light_gray_concrete";
    else if (t === 1 || t === 2) blk = pier ? "white_concrete" : "light_blue_stained_glass";
    else blk = pier ? "white_concrete" : "light_gray_concrete";
    if (doorKey === k && ground) {
      if (t === 0) { put(x, y, z, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (t === 1) { put(x, y, z, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (t === 2) blk = "stone_bricks";                                   // lintel over the door
    }
    put(x, y, z, blk);
  }
  // cornice: a stone capping slab on the envelope's top edge, so setbacks show as ledges
  if (exposed(x, z, T - 1).length) put(x, T, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// warm light behind the glass: a glowstone in the ground-floor bays, lanterns on the storeys above; each stands on a slab
for (const [k, c] of col) {
  const x = Math.floor(k / 100), z = k % 100;
  for (let y = c.g; y < top(c); y++) {
    const faces = exposed(x, z, y); if (!faces.length) continue;
    const [dx, dz] = faces[0], b = base(c, y), t = (y - b) % 4;
    if (t !== 1 || (doorKey === k)) continue;
    const along = dx !== 0 ? z : x; if (along % 3 === 0) continue;   // only the glazed bays
    const ix = x - dx, iz = z - dz, ik = key(ix, iz), ic = col.get(ik);
    if (!ic || y < ic.g || y >= top(ic) || exposed(ix, iz, y).length) continue;   // the room behind must be air
    const ib = base(ic, y); if ((y - ib) % 4 !== 1) continue;
    const h = hash(x, y, z);
    const ground = !c.pent && y - c.g < 4;
    if (ground && h % 3 === 0) put(ix, y, iz, "glowstone");
    else if (!ground && h % 5 === 0) put(ix, y, iz, "lantern", { hanging: "false" });
  }
}

// roof plant: 2x2 units, two blocks high, on the body roof and set back from the edge
for (const [k, c] of col) {
  if (c.pent || c.R !== 22) continue;
  const x = Math.floor(k / 100), z = k % 100;
  if (x % 6 !== 3 || z % 6 !== 2) continue;
  const box = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dz]) => [x + dx, z + dz]);
  if (!box.every(([bx, bz]) => col.get(key(bx, bz))?.R === 22 && !exposed(bx, bz, 21).length)) continue;
  for (const [bx, bz] of box) { put(bx, 22, bz, "light_gray_concrete"); put(bx, 23, bz, "light_gray_concrete"); }
  put(x, 24, z, "iron_block");
}

G.save(OUT);
console.log(`way_1034703368: ${cells.length} footprint cells, ${G.count()} blocks, door at ${doorKey ? `${Math.floor(doorKey / 100)},${doorKey % 100}` : "none"}`);
