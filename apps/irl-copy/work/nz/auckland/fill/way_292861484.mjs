// Way 292861484: a 1980s concrete-frame commercial block on Mt Eden's flank, Auckland CBD edge. Stone-faced podium
// with shopfronts, white spandrels over ribbon glazing on the upper floors, a stepped tower (48 / 32 / 20 / 12 / 8).
// Massing follows the lidar roof, median-smoothed and quantised to storey tiers; every column is solid from y 0 up
// to its top, so nothing floats. Facade blocks are the outer skin; glass has a one-block air gap behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861484.cells.json", "utf8"));

const W = 64, D = 42, H = 62;
const key = (x, z) => `${x},${z}`;

// per footprint cell: ground g, top T (absolute y of the top of the massing)
const roof = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
const ground = new Map(cells.map(([x, z, g]) => [key(x, z), g]));

// median of the 3x3 neighbourhood (footprint cells only), applied twice: lidar noise out, edges kept
const median = (v) => { const s = [...v].sort((a, b) => a - b); return s[(s.length - 1) >> 1]; };
function smooth(field) {
  const out = new Map();
  for (const k of field.keys()) {
    const [x, z] = k.split(",").map(Number), vals = [];
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = field.get(key(x + dx, z + dz)); if (n !== undefined) vals.push(n); }
    out.set(k, median(vals));
  }
  return out;
}
const s2 = smooth(smooth(roof));

// storey tiers: 12 storeys tower, a 32 setback, a 20 podium, 12 and 8 wings
const tier = (s) => (s >= 40 ? 48 : s >= 28 ? 32 : s >= 16 ? 20 : s >= 10 ? 12 : 8);
const below = { 48: 32, 32: 20, 20: 12, 12: 8, 8: 8 };
// a tall tier must have mass around it: a spike 1 or 2 cells wide (lidar edge noise) steps down one tier, twice over
let tiers = new Map([...s2].map(([k, s]) => [k, tier(s)]));
for (let pass = 0; pass < 3; pass++) {
  const next = new Map();
  for (const [k, t] of tiers) {
    const [x, z] = k.split(",").map(Number);
    let mass = 0;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if ((dx || dz) && (tiers.get(key(x + dx, z + dz)) ?? -1) >= t) mass++;
    next.set(k, t >= 20 && mass < 6 ? below[t] : t);
  }
  tiers = next;
}
const cell = new Map();
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number), g = ground.get(k);
  cell.set(k, { x, z, g, T: Math.max(tiers.get(k), g + 4) });
}
const at = (x, z) => cell.get(key(x, z));
const solid = (x, y, z) => { const c = at(x, z); return c !== undefined && y >= 0 && y < c.T; };

// outward normals: [dx, dz, facing name]
const NORMALS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];
const exposed = (x, y, z) => NORMALS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));
const tangent = (dx, x, z) => (dx !== 0 ? z : x);     // position along a face: z on east/west faces, x on north/south
const hash = (x, y, z) => (Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791)) >>> 0;

const put = new Map();      // "x,y,z" -> [block, state] | null (air)
const P = (x, y, z) => `${x},${y},${z}`;
const pockets = [];         // glass cells whose inner neighbour may become an air gap, lit or not

for (const c of cell.values()) {
  const { x, z, g, T } = c;
  const GF = g <= 3 ? 8 : 12;                           // first upper storey line: shopfront zone below it
  for (let y = 0; y < T; y++) {
    const sides = exposed(x, y, z);
    if (y === T - 1) {                                  // top course: cornice on the edge, roof membrane inside
      if (sides.length) {
        put.set(P(x, y, z), ["smooth_stone"]);
        put.set(P(x, y + 1, z), ["white_concrete"]);    // parapet, one block above the lidar roof
      } else put.set(P(x, y, z), ["light_gray_concrete"]);
      continue;
    }
    if (!sides.length) { put.set(P(x, y, z), ["stone"]); continue; }    // core: hidden inside the skin
    const [dx, dz, facing] = sides[0];
    const t = tangent(dx, x, z);
    if (y < g) { put.set(P(x, y, z), ["stone_bricks"]); continue; }     // foundation, below the local ground
    if (y === g) { put.set(P(x, y, z), ["polished_andesite"]); continue; }   // base course
    if (y < GF) {                                       // shopfront: glass bays between stone piers
      if (y === GF - 1 || t % 4 === 0) { put.set(P(x, y, z), ["polished_andesite"]); continue; }
      put.set(P(x, y, z), ["light_blue_stained_glass"]);
      pockets.push({ x, y, z, dx, dz, shop: true });
      continue;
    }
    if ((y - GF) % 4 === 0) { put.set(P(x, y, z), ["white_concrete"]); continue; }   // storey spandrel
    if (t % 3 === 0) { put.set(P(x, y, z), ["light_gray_concrete"]); continue; }     // mullion pier
    put.set(P(x, y, z), ["light_blue_stained_glass"]);
    pockets.push({ x, y, z, dx, dz, shop: false });
  }
}

// one-block air gap behind each glass bay where the cell inside is a solid core; about one in six is lit
for (const p of pockets) {
  const inner = at(p.x - p.dx, p.z - p.dz);
  if (!inner || p.y >= inner.T - 1 || exposed(inner.x, p.y, inner.z).length) continue;
  const h = hash(p.x, p.y, p.z);
  const lit = p.shop ? h % 4 === 0 : h % 6 === 0;
  put.set(P(inner.x, p.y, inner.z), lit ? [p.shop ? "shroomlight" : "glowstone"] : null);
}

// the entrance: the street face with the most shopfront exposure, a 2-high dark oak door at its middle
const faces = new Map(NORMALS.map(([dx, dz, f]) => [f, []]));
for (const c of cell.values()) {
  if (c.g + 1 >= (c.g <= 3 ? 8 : 12)) continue;      // shopfront zone only
  for (const [dx, dz, f] of exposed(c.x, c.g + 1, c.z)) faces.get(f).push(c);
}
const [face, list] = [...faces].sort((a, b) => b[1].length - a[1].length)[0];
const [dxF, dzF] = NORMALS.find(([, , f]) => f === face);
list.sort((a, b) => tangent(dxF, a.x, a.z) - tangent(dxF, b.x, b.z));
const door = list[list.length >> 1];
if (door) {
  const { x, z, g } = door;
  const hinge = "left";
  put.set(P(x, g + 1, z), ["dark_oak_door", { facing: face, half: "lower", hinge, open: "false", powered: "false" }]);
  put.set(P(x, g + 2, z), ["dark_oak_door", { facing: face, half: "upper", hinge, open: "false", powered: "false" }]);
  // the lintel over the door, across three bays of the same face
  for (const d of [-1, 0, 1]) {
    const cx = dxF !== 0 ? x : x + d, cz = dxF !== 0 ? z + d : z;
    const c = at(cx, cz);
    if (c && c.T > g + 3) put.set(P(cx, g + 3, cz), ["polished_andesite"]);
  }
}

// roof plant: 3 x 3 boxes of 2 blocks on interior roof cells, on the tower (two) and the podium (one)
const placed = [];
function plant(level, count) {
  for (const c of cell.values()) {
    if (count === 0) return;
    if (c.T !== level) continue;
    let ok = true;
    for (let dz = -2; dz <= 4 && ok; dz++) for (let dx = -2; dx <= 4 && ok; dx++) { const n = at(c.x + dx, c.z + dz); if (!n || n.T !== level) ok = false; }
    if (!ok) continue;
    if (placed.some((p) => Math.abs(p.x - c.x) < 6 && Math.abs(p.z - c.z) < 6)) continue;
    placed.push({ x: c.x, z: c.z });
    for (let dz = 0; dz < 3; dz++) for (let dx = 0; dx < 3; dx++) for (let y = level; y < level + 2; y++) put.set(P(c.x + dx, y, c.z + dz), ["light_gray_concrete"]);
    count--;
  }
}
plant(48, 2); plant(20, 1);

const g = new Voxels([W, H, D]);
for (const [k, v] of put) {
  if (!v) continue;
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v[0], v[1]);
}
const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861484.nbt");
console.log("saved", out, "footprint", cell.size, "entrance face", face, "door", door && [door.x, door.z]);
