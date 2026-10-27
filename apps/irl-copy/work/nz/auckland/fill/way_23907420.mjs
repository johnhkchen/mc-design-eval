// Way 23907420, Auckland: a 1970s-80s mid-rise office/apartment block on a 32 x 40 footprint. Seven storeys of
// 4 blocks on one shared floor grid (floors at y = 1, 5, ... 25), a pale concrete frame with tinted glazing in
// ribbons between piers, a stone plinth, shopfronts at street level, a cornice, and a raised plant core in the
// middle of the roof (the lidar's 30-31 m). Lower wings on the rim stop at six storeys. The shell is built only on
// the faces that are exposed (to the air outside the footprint or to a lower neighbour); everything else is air
// behind the glass with one floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${FILL}/way_23907420.cells.json`, "utf8"));
const OUT = `${FILL}/way_23907420.nbt`;
const SIZE = [32, 44, 40];

const k2 = (x, z) => `${x},${z}`;
const fp = new Map();
for (const [x, z, ground, roof] of cells) fp.set(k2(x, z), { x, z, ground, roof, top: 0 });
const at = (x, z) => fp.get(k2(x, z));

// Roof tiers from the lidar: a 3x3 median over real roof readings (lidar edge noise under 20 is dropped), snapped to
// the storey grid: 31 = plant core, 29 = seven-storey rim, 25 = six-storey wings.
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };
for (const c of fp.values()) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(c.x + dx, c.z + dz); if (n && n.roof >= 20) vals.push(n.roof); }
  const m = vals.length ? median(vals) : 29;
  c.top = m >= 30 ? 31 : m >= 27 ? 29 : 25;
}

const DIRS = { E: [1, 0], W: [-1, 0], N: [0, -1], S: [0, 1] };
// the sides of a cell at row y that are open to air: outside the footprint, or over a neighbour that stops below y
function exposed(c, y) {
  const out = [];
  for (const [d, [dx, dz]] of Object.entries(DIRS)) {
    const n = at(c.x + dx, c.z + dz);
    if (!n || n.top <= y) out.push(d);
  }
  return out;
}

const g = new Voxels(SIZE);
const panes = [];    // glass panes and iron bars, with the wall they sit in, so their arms can be set after
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); return block; };

// What a cell holds at row y: a shell piece on an exposed face, a floor/roof slab, or air (the building's interior).
function place(c, y) {
  if (y === 0) return { block: "stone_bricks" };             // foundation under every cell (fills to the ground)
  if (y >= c.top) return null;
  const ex = exposed(c, y);
  const slabRow = y % 4 === 1 || y === 28 || y === c.top - 1 || (c.top === 31 && y >= 29);
  if (!ex.length) {
    if (!slabRow) return null;
    return { block: y === c.top - 1 ? "gray_concrete" : "light_gray_concrete" };   // roof membrane / floor slab
  }
  const ew = ex.includes("E") || ex.includes("W");
  const ns = ex.includes("N") || ex.includes("S");
  const corner = ew && ns;
  // EW: the wall's plane runs north-south (its sheet is along z). A stepped edge exposes both axes on most cells,
  // so it follows the east/west rhythm; a true corner also takes a pier on either axis.
  const orient = ew ? "EW" : "NS";
  const coord = orient === "EW" ? c.z : c.x;
  const pier = coord % 3 === 0 || (corner && (c.x % 3 === 0 || c.z % 3 === 0));
  const k = (y - 1) >> 2, rel = (y - 1) % 4;
  if (c.top === 31 && y >= 29) {                             // plant core: a white cap, then louvres
    if (y === 29) return { block: "white_concrete" };
    if (pier) return { block: "light_gray_concrete" };
    return { block: "iron_bars", orient };
  }
  if (y === c.top - 1) return { block: "smooth_stone" };       // cornice
  if (rel === 0) return { block: k === 0 ? "stone_bricks" : "light_gray_concrete" };   // plinth / storey line
  if (rel === 3) return { block: "light_gray_concrete" };     // head of the window band
  if (pier) return { block: "white_concrete" };
  return { block: "light_blue_stained_glass_pane", orient };  // tinted glazing in the bay
}

const shell = new Map();   // "x,y,z" -> placed piece (for lights, door and pane arms)
for (const c of fp.values()) {
  for (let y = 0; y < c.top; y++) {
    const p = place(c, y);
    if (!p) continue;
    put(c.x, y, c.z, p.block);
    if (p.orient) { panes.push({ x: c.x, y, z: c.z, block: p.block, orient: p.orient }); shell.set(`${c.x},${y},${c.z}`, p); }
  }
}

// Entrance: a street-side bay on the north face, near the middle of the front, lower half at street level
const northFace = [...fp.values()].filter(c => c.top >= 25 && exposed(c, 1).includes("N") && !exposed(c, 1).some(d => d === "E" || d === "W"));
const meanX = northFace.reduce((s, c) => s + c.x, 0) / northFace.length;
const door = northFace.filter(c => c.x % 3 !== 0).sort((a, b) => Math.abs(a.x - meanX) - Math.abs(b.x - meanX))[0];
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
put(door.x, 1, door.z, "dark_oak_door", doorState("lower"));
put(door.x, 2, door.z, "dark_oak_door", doorState("upper"));
for (const dx of [-1, 1]) {   // two hanging lanterns beside the door, under the lintel
  const lx = door.x + dx;
  if (shell.has(`${lx},3,${door.z}`)) put(lx, 3, door.z, "lantern", { hanging: "true", waterlogged: "false" });
}

// Warm light: shopfront interiors at street level, and a few lit windows above. The lamp goes one cell inside the
// glass, in the air gap, and only where that cell is interior (not another shell piece).
for (const p of panes) {
  if (p.block !== "light_blue_stained_glass_pane") continue;
  const c = at(p.x, p.z);
  const k = (p.y - 1) >> 2, rel = (p.y - 1) % 4;
  if (rel !== 1) continue;
  const lit = k === 0 ? (p.x + p.z) % 3 === 0 : (p.x * 5 + p.z * 3 + k) % 11 === 0;
  if (!lit) continue;
  const ex = exposed(c, p.y);
  if (ex.length !== 1) continue;
  const [dx, dz] = DIRS[ex[0]];
  const ix = p.x - dx, iz = p.z - dz, inner = at(ix, iz);
  if (!inner || inner.top <= p.y || exposed(inner, p.y).length) continue;
  put(ix, p.y, iz, "glowstone");
}

// Rooftop plant: a few 3 x 2 boxes on the seven-storey rim roof, set in from the cornice
const boxes = [];
for (let z = 3; z < 36 && boxes.length < 3; z += 5) for (let x = 2; x < 28 && boxes.length < 3; x += 6) {
  const cs = [];
  for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 3; dx++) cs.push(at(x + dx, z + dz));
  if (cs.some(c => !c || c.top !== 29 || exposed(c, 28).length)) continue;
  if (boxes.some(b => Math.abs(b.x - x) < 5 && Math.abs(b.z - z) < 4)) continue;
  boxes.push({ x, z });
  for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 3; dx++) for (const y of [29, 30]) put(x + dx, y, z + dz, "light_gray_concrete");
}

// Glass panes and iron bars connect along their wall to whatever is there, as the game would draw them.
for (const p of panes) {
  const [a, b] = p.orient === "EW" ? [[0, -1], [0, 1]] : [[1, 0], [-1, 0]];
  const link = (dx, dz) => {
    const n = g.get(p.x + dx, p.y, p.z + dz);
    return n ? "true" : "false";
  };
  const arms = p.orient === "EW"
    ? { north: link(...a), south: link(...b), east: "false", west: "false" }
    : { north: "false", south: "false", east: link(...a), west: link(...b) };
  put(p.x, p.y, p.z, p.block, { ...arms, waterlogged: "false" });
}

const counts = {};
g.forEachCell((i, v) => { const b = g.palette[v].block; counts[b] = (counts[b] || 0) + 1; });
const r = g.save(OUT);
const tiers = {};
for (const c of fp.values()) tiers[c.top] = (tiers[c.top] || 0) + 1;
console.log(JSON.stringify({ footprint: cells.length, tiers, blocks: r.blocks, palette: r.palette, door: [door.x, door.z], boxes: boxes.length, counts }, null, 1));
