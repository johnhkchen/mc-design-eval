// Botanica Heritage: a 1920s-30s Auckland commercial block (four storeys, Stripped Classical with Deco string courses),
// volcanic basalt plinth and base, cream rendered upper walls with quoin-like piers, shopfronts on the ground floor,
// a flat parapet roof with plant boxes. The massing follows the lidar roof height, smoothed into 4-block storey tiers.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_270513556.cells.json", "utf8"));

const W = 49, D = 54, H = 22;
const LINES = [5, 9, 13];                       // storey floor lines (ground storey 0..5, then 4-block storeys)
const key = (x, z) => `${x},${z}`;

// ---- footprint, raw lidar roof and ground ----
const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(key(x, z), { x, z, g, r });
const inFp = (x, z) => fp.has(key(x, z));
const nb4 = (x, z) => [[x, z - 1], [x, z + 1], [x - 1, z], [x + 1, z]];

// lidar noise: cells reading under 4 blocks take the median of their valid neighbours
for (const c of fp.values()) {
  if (c.r >= 4) continue;
  const vals = nb4(c.x, c.z).filter(([x, z]) => inFp(x, z) && fp.get(key(x, z)).r >= 4).map(([x, z]) => fp.get(key(x, z)).r).sort((a, b) => a - b);
  c.r = vals.length ? vals[vals.length >> 1] : 13;
}

// storey tiers: 4 storeys (17), 3 (13), 2 (9), 1 (5); a column is never shorter than one storey above its ground
const tierOf = (r) => (r >= 15 ? 17 : r >= 12 ? 13 : r >= 8 ? 9 : 5);
for (const c of fp.values()) c.T = Math.max(tierOf(c.r), c.g + 4);

// two 3x3 majority passes on the tiers: single-column spikes and dips go, the setbacks stay as clean steps
for (let pass = 0; pass < 2; pass++) {
  const T0 = new Map([...fp].map(([k, c]) => [k, c.T]));
  for (const c of fp.values()) {
    const count = new Map();
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const n = fp.get(key(c.x + dx, c.z + dz)); if (!n) continue;
      const t = T0.get(key(n.x, n.z));
      count.set(t, (count.get(t) || 0) + 1);
    }
    let best = c.T, bestN = count.get(c.T) || 0;
    for (const [t, n] of count) if (n > bestN && t >= c.g + 4) { best = t; bestN = n; }
    c.T = best;
  }
}

// a cell is on the outside where a neighbour is off the footprint or stands lower (a setback face)
const exteriorFaces = (c) => {
  const f = [];
  const dirs = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
  for (const [name, dx, dz] of dirs) {
    const n = fp.get(key(c.x + dx, c.z + dz));
    if (!n || n.T < c.T) f.push(name);
  }
  return f;
};
for (const c of fp.values()) { c.faces = exteriorFaces(c); c.perim = c.faces.length > 0; }

// the street entrance: the south (z+) face at the lowest ground, the middle of its run
let door = null;
{
  const south = [...fp.values()].filter((c) => c.faces.includes("S") && !c.faces.includes("N") && c.faces.length === 1);
  const minG = Math.min(...south.map((c) => c.g));
  const run = south.filter((c) => c.g === minG).map((c) => c.x).sort((a, b) => a - b);
  door = { x: run[run.length >> 1], z: 0 };
  door.z = south.find((c) => c.x === door.x && c.g === minG).z;
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;
const PANE_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const DOOR = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

// the wall at height y on a perimeter cell: plinth, shopfront, storey bands, parapet cap
function wallAt(c, y) {
  if (y === c.g) return ["polished_andesite"];
  if (y === c.T - 1) return ["stone_brick_slab", { type: "bottom", waterlogged: "false" }];
  const ns = c.faces.includes("N") || c.faces.includes("S");
  const ew = c.faces.includes("E") || c.faces.includes("W");
  const corner = ns && ew;
  const along = ns ? c.x : c.z;
  const pier = corner || along % 4 === 0;
  if (y < 5) {                                  // ground storey: shopfront glass in frames
    if (y === 4) return ["dark_oak_planks"];    // transom
    if (pier) return ["polished_andesite"];
    return ns ? ["glass_pane", PANE_NS] : ["glass_pane", PANE_EW];
  }
  const B = LINES.filter((L) => L <= y).pop();  // the storey this row belongs to
  const r = y - B;
  if (r === 0) return ["chiseled_quartz_block"]; // string course
  if (r === 3) return ["smooth_quartz"];        // sill and lintel band
  if (pier) return ["quartz_block"];
  return ns ? ["glass_pane", PANE_NS] : ["glass_pane", PANE_EW];
}

for (const c of fp.values()) {
  const { x, z, g: gr, T } = c;
  for (let y = 0; y < gr; y++) put(x, y, z, "polished_andesite");          // foundation under the ground
  if (!c.perim) {
    // interior: air with floor slabs at the ground, each storey line and the roof deck
    for (let y = gr; y < T; y++) if (y === gr || y === T - 1 || (LINES.includes(y) && y > gr)) put(x, y, z, "stone");
    continue;
  }
  for (let y = gr; y < T; y++) {
    const [b, s] = wallAt(c, y);
    put(x, y, z, b, s);
  }
}

// the entrance: two-leaf doorway in the south wall, pier either side, a dark oak canopy over it
{
  const { x, z } = door;
  const gr = fp.get(key(x, z)).g;
  put(x, gr + 1, z, "dark_oak_door", DOOR("lower"));
  put(x, gr + 2, z, "dark_oak_door", DOOR("upper"));
  for (const dx of [-1, 1]) put(x + dx, gr + 1, z, "polished_andesite");
  for (const dx of [-1, 0, 1]) if (gr + 3 < 5) put(x + dx, gr + 3, z, "dark_oak_planks");
  // the shopfront's glowing counter behind the glass, one each side of the door
  for (const dx of [-2, 2]) {
    if (inFp(x + dx, z - 1) && fp.get(key(x + dx, z - 1)).g <= gr) put(x + dx, gr + 2, z - 1, "glowstone");
  }
}

// warm light behind some upper windows: glowstone and shroomlight in the room just inside the glass
for (const c of fp.values()) {
  if (!c.perim || c.faces.length !== 1) continue;
  const [face] = c.faces;
  const [ix, iz] = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }[face].map((v, i) => (i === 0 ? c.x + v : c.z + v));
  const inner = fp.get(key(ix, iz));
  if (!inner || inner.perim) continue;
  for (let y = c.g + 1; y < c.T - 1; y++) {
    const B = LINES.filter((L) => L <= y).pop() ?? 0;
    const r = y - B;
    if (y < 5 || (r !== 1 && r !== 2)) continue;
    const h = hash(c.x, y, c.z);
    if (h % 7 !== 0 || (c.x % 4) === 0) continue;
    put(ix, y, iz, h % 3 === 0 ? "shroomlight" : "glowstone");
  }
}

// roof plant: two screened plant rooms on the top tier (a 4 x 4 block each, two high, a slab cap), set on the deck
const plantRooms = [];
for (const c of fp.values()) {
  if (c.perim || c.T !== 17 || c.x % 6 !== 0 || c.z % 6 !== 0) continue;
  const box = [0, 1, 2, 3].flatMap((dz) => [0, 1, 2, 3].map((dx) => [c.x + dx, c.z + dz]));
  if (box.every(([x, z]) => fp.get(key(x, z))?.T === 17 && !fp.get(key(x, z)).perim)) plantRooms.push(box);
}
for (const box of plantRooms.slice(0, 2)) {
  for (const [x, z] of box) {
    const edge = x === box[0][0] || x === box[0][0] + 3 || z === box[0][1] || z === box[0][1] + 3;
    put(x, 17, z, edge ? "stone_bricks" : "smooth_stone");
    put(x, 18, z, edge ? "stone_bricks" : "air");
    if (edge) put(x, 19, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_270513556.nbt";
const r = g.save(out);
console.log(JSON.stringify({ saved: out, ...r, tiers: Object.fromEntries([17, 13, 9, 5].map((t) => [t, [...fp.values()].filter((c) => c.T === t).length])) }));
