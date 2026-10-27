// A 1970s cream-concrete office block with blue glass, on the footprint's own ground and lidar roof.
// Tiers: low wing 2 storeys (top 8), body 3 storeys (12), tower 4 storeys (16). Storeys are 4 high on absolute y:
// band (y%4==0), two rows of window (1, 2), lintel band (3). Each window has a 1-deep air pocket behind the pane.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(DIR + "way_162152810.cells.json", "utf8"));   // [x, z, ground, roof]
const [W, H, D] = [20, 27, 31];

const FOUND = { b: "stone_bricks" };
const PLINTH = { b: "polished_andesite" };
const WALL = { b: "white_concrete" };
const BAND = { b: "light_gray_concrete" };
const ROOF = { b: "gray_concrete" };
const SHOP_PIER = { b: "stone_bricks" };
const CAP = { b: "smooth_stone_slab", s: { type: "bottom" } };
const NAME = { N: "north", S: "south", E: "east", W: "west" };
const NB = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };

const K = (x, z) => `${x},${z}`;
const P = (x, y, z) => `${x},${y},${z}`;

const FOOT = new Map();                                    // "x,z" -> { g: ground, raw: lidar roof }
for (const [x, z, g, r] of cells) FOOT.set(K(x, z), { g, raw: r });

// lidar roof -> a flat tier (8, 12 or 16), then each column takes the commonest tier of its 3x3 footprint (ties keep its own)
const tier = (r) => (r <= 9 ? 8 : r <= 13 ? 12 : 16);
const TOP = new Map();
for (const [k, c] of FOOT) {
  const [x, z] = k.split(",").map(Number), count = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = FOOT.get(K(x + dx, z + dz)); if (!n) continue;
    count.set(tier(n.raw), (count.get(tier(n.raw)) || 0) + 1);
  }
  const own = tier(c.raw); let best = own, bestN = count.get(own) || 0;
  for (const [t, n] of count) if (n > bestN) { best = t; bestN = n; }
  TOP.set(k, best);
}
const top = (x, z) => TOP.get(K(x, z)) ?? 0;              // outside the footprint nothing stands
const gnd = (x, z) => FOOT.get(K(x, z))?.g ?? 0;
const inFoot = (x, z) => FOOT.has(K(x, z));
// the faces a solid cell shows: any side whose neighbour column stands lower than this cell
const exposed = (x, y, z) => Object.keys(NB).filter((d) => y >= top(x + NB[d][0], z + NB[d][1]));
const along = (d, x, z) => (d === "N" || d === "S" ? x : z);   // position along a face
const isPier = (d, x, z) => along(d, x, z) % 3 === 0;
const isWindow = (x, y, z, d) => y % 4 !== 0 && y % 4 !== 3 && y !== gnd(x, z) && !isPier(d, x, z);
const paneState = (d) => (d === "N" || d === "S"
  ? { east: "true", west: "true", north: "false", south: "false" }
  : { north: "true", south: "true", east: "false", west: "false" });

// Specials: a cell that is not the generic face rule (window pockets, the entrance, cap, roof plant). null = air.
const SPECIAL = new Map();

// Window pockets: the cell behind each pane is air (or a warm light), enclosed by the storey bands above and below
for (const [k, c] of FOOT) {
  const [x, z] = k.split(",").map(Number);
  for (let y = c.g; y < top(x, z); y++) {
    const ex = exposed(x, y, z);
    if (!ex.length || !isWindow(x, y, z, ex[0])) continue;
    const [nx, nz] = NB[ex[0]], ix = x - nx, iz = z - nz;   // the cell one step inside
    if (!inFoot(ix, iz) || y < gnd(ix, iz) || y >= top(ix, iz) - 1 || exposed(ix, y, iz).length) continue;
    const h = (x * 7 + y * 13 + z * 31) % 6;
    SPECIAL.set(P(ix, y, iz), h === 0 ? { b: "glowstone" } : h === 3 ? { b: "shroomlight" } : null);
  }
}

// Entrance: the street-level face with the most exposed cells, its middle bay; a dark oak door, air hall behind, a hood
const faces = { N: [], S: [], E: [], W: [] };
for (const [k, c] of FOOT) {
  const [x, z] = k.split(",").map(Number);
  if (c.g < top(x, z)) for (const d of exposed(x, c.g, z)) faces[d].push([x, z]);
}
const front = Object.keys(faces).sort((a, b) => faces[b].length - faces[a].length)[0];
const runs = faces[front].sort((a, b) => along(front, ...a) - along(front, ...b));
const [dx0, dz0] = runs[Math.floor(runs.length / 2)];
const G0 = gnd(dx0, dz0);
for (const dy of [0, 1]) {
  SPECIAL.set(P(dx0, G0 + dy, dz0), { b: "dark_oak_door", s: { facing: NAME[front], half: dy ? "upper" : "lower", hinge: "left", open: "false", powered: "false" } });
  const [nx, nz] = NB[front];
  if (inFoot(dx0 - nx, dz0 - nz)) SPECIAL.set(P(dx0 - nx, G0 + dy, dz0 - nz), null);   // the hall behind the door
}
for (const s of [-1, 0, 1]) {
  const hx = front === "N" || front === "S" ? dx0 + s : dx0, hz = front === "N" || front === "S" ? dz0 : dz0 + s;
  if (inFoot(hx, hz)) SPECIAL.set(P(hx, G0 + 2, hz), BAND);
}

// Parapet caps on the perimeter; roof plant: one 2x2 lift overrun on the tower's roof (nearest its centre), two plant boxes on the body
const interiorRoof = (x, z) => !exposed(x, top(x, z) - 1, z).length;
const tower = [...FOOT.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => top(x, z) === 16);
const cx = tower.reduce((s, [x]) => s + x, 0) / tower.length, cz = tower.reduce((s, [, z]) => s + z, 0) / tower.length;
const lift = tower.filter(([x, z]) => interiorRoof(x, z) && interiorRoof(x + 1, z) && interiorRoof(x, z + 1) && interiorRoof(x + 1, z + 1) && top(x + 1, z) === 16 && top(x, z + 1) === 16 && top(x + 1, z + 1) === 16)
  .sort((a, b) => Math.hypot(a[0] - cx, a[1] - cz) - Math.hypot(b[0] - cx, b[1] - cz))[0];
if (lift) for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
  SPECIAL.set(P(lift[0] + dx, 16, lift[1] + dz), BAND); SPECIAL.set(P(lift[0] + dx, 17, lift[1] + dz), BAND);
}
const plant = [...FOOT.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => top(x, z) === 12 && interiorRoof(x, z) && x % 6 === 2 && z % 6 === 2);
for (const [x, z] of plant) SPECIAL.set(P(x, 12, z), { b: "smooth_stone" });
for (const [k] of FOOT) {
  const [x, z] = k.split(",").map(Number);
  if (!interiorRoof(x, z)) SPECIAL.set(P(x, top(x, z), z), CAP);
}

// The cell's material: foundation under the ground, specials, the roof cover, then the face rule
function blockAt(x, y, z) {
  const G = gnd(x, z), T = top(x, z), ex = exposed(x, y, z);
  if (y < G) return FOUND;
  if (SPECIAL.has(P(x, y, z))) return SPECIAL.get(P(x, y, z));
  if (y === T - 1 && !ex.length) return ROOF;
  if (!ex.length) return WALL;
  const d = ex[0];
  if (y === G) return PLINTH;
  if (y % 4 === 0 || y % 4 === 3) return BAND;
  if (y < 4) return isPier(d, x, z) ? SHOP_PIER : { b: "light_blue_stained_glass_pane", s: paneState(d) };
  return isPier(d, x, z) ? WALL : { b: "light_blue_stained_glass_pane", s: paneState(d) };
}

const g = new Voxels([W, H, D]);
let placed = 0;
for (const [k] of FOOT) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < top(x, z); y++) {
    const m = blockAt(x, y, z);
    if (m) { g.set(x, y, z, m.b, m.s); placed++; }
  }
}
// specials above the roof (parapet caps, roof plant) sit on the columns; the ones inside the walls went in above
for (const [k, m] of SPECIAL) {
  const [x, y, z] = k.split(",").map(Number);
  if (m && FOOT.has(K(x, z)) && y >= top(x, z)) g.set(x, y, z, m.b, m.s);
}
const out = g.save(DIR + "way_162152810.nbt");
console.log(`placed ${out.blocks} blocks, palette ${out.palette}, ${placed} cell fills, ${SPECIAL.size} specials`);
