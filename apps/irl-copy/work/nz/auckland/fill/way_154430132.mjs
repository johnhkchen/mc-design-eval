// way/154430132: a 1970s concrete office block on a podium, Auckland's CBD edge (Eden Terrace / Newton side).
// 12 storeys of light concrete piers and cyan tinted ribbon glazing, a dark plinth, a 3-storey northwest wing,
// a 1-storey east wing, the podium at 40 and the tower at 47, a setback lip at its edge, a lift overrun and
// a recessed entrance. Built on the footprint only; the shell is one block thick with air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154430132.cells.json", "utf8"));   // [x, z, ground, roof]
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154430132.nbt";

const W = 44, H = 60, D = 49;
const DIRS = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };    // N is -z, S is +z

// footprint cells: { x, z, g (ground), r (lidar roof height) }
const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { x, z, g, r });
const at = (x, z) => fp.get(`${x},${z}`);

// 1. smooth the lidar roof: median over the 3x3 footprint neighbourhood
for (const c of fp.values()) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(c.x + dx, c.z + dz); if (n) vals.push(n.r); }
  vals.sort((a, b) => a - b);
  c.rs = vals[vals.length >> 1];
}

// 2. snap to clean flat tiers: 11 (east wing), 14 (northwest wing), 24 (shoulder), 40 (podium), 47 (tower)
const tier = (v) => (v >= 44 ? 47 : v >= 30 ? 40 : v >= 18 ? 24 : v >= 12 ? 14 : 11);
const isEdge = (c) => Object.values(DIRS).some(([dx, dz]) => !at(c.x + dx, c.z + dz));
for (const c of fp.values()) c.T = Math.max(tier(c.rs), c.g + 4);      // T = top surface y
// setback: the outer ring of the tower steps down three blocks below the core
for (const c of fp.values()) if (c.T === 47 && isEdge(c)) c.T = 43;

// a face is exposed at height y when the neighbour is missing or its top is below y
const exposed = (c, y) => Object.entries(DIRS).filter(([, [dx, dz]]) => { const n = at(c.x + dx, c.z + dz); return !n || y >= n.T; }).map(([d]) => d);

// 3. the plan: "x,y,z" -> { b (block), face (glass only), s (state) }
const plan = new Map();
const put = (x, y, z, b, extra = {}) => plan.set(`${x},${y},${z}`, { b, ...extra });
const got = (x, y, z) => plan.get(`${x},${y},${z}`);

for (const c of fp.values()) {
  const { x, z, g, T } = c;
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");
  // the shell and the floors: y from ground to the deck below the top
  for (let y = g; y < T - 1; y++) {
    const rel = y - g, k = Math.floor(rel / 4), r = rel % 4;
    const ex = exposed(c, y);
    if (!ex.length) { if (r === 0) put(x, y, z, "smooth_stone"); continue; }    // interior: a floor slab per storey, air between
    const corner = ex.length >= 2;
    const idx = ex[0] === "E" || ex[0] === "W" ? z : x;                        // position along the face
    if (r === 0) put(x, y, z, k === 0 ? "polished_andesite" : "white_concrete");   // base course / storey spandrel
    else if (k === 0 && r === 3) put(x, y, z, "light_gray_concrete");              // shopfront lintel
    else if (corner || idx % 4 === 0) put(x, y, z, "light_gray_concrete");         // piers, corners: three panes between them
    else put(x, y, z, "cyan_stained_glass_pane", { face: ex[0] });                 // glazing
  }
  // the deck over every cell; cornice where it is exposed, parapet on the perimeter
  put(x, T - 1, z, exposed(c, T - 1).length ? "white_concrete" : "gray_concrete");
  if (isEdge(c)) put(x, T, z, "light_gray_concrete");
}

// 4. recessed entrance on a west face at ground level: a porch cell, a door behind it, a canopy over it
const porchs = [...fp.values()].filter((c) => exposed(c, c.g).join() === "W" && at(c.x + 1, c.z) && at(c.x, c.z - 1) && at(c.x, c.z + 1) && exposed(c, c.g + 1).join() === "W")
  .sort((a, b) => a.g - b.g || Math.abs(a.z - 24) - Math.abs(b.z - 24));
const porch = porchs[0];
if (porch) {
  const { x, z, g } = porch;
  put(x, g, z, "smooth_stone");                       // the porch floor
  plan.delete(`${x},${g + 1},${z}`); plan.delete(`${x},${g + 2},${z}`);   // open porch
  for (let dz = -1; dz <= 1; dz++) put(x, g + 3, z + dz, "dark_oak_slab", { s: { type: "bottom", waterlogged: "false" } });   // canopy
  const door = { facing: "west", hinge: "left", open: "false", powered: "false" };
  put(x + 1, g + 1, z, "dark_oak_door", { s: { ...door, half: "lower" } });
  put(x + 1, g + 2, z, "dark_oak_door", { s: { ...door, half: "upper" } });
}

// 5. warm lights behind some panes (the air cell inside the glass)
for (const [k, p] of [...plan.entries()]) {
  if (p.b !== "cyan_stained_glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const rel = y - (fp.get(`${x},${z}`)?.g ?? 0);
  if (rel % 4 !== 2 || rel < 4 || (x * 31 + z * 17 + y * 7) % 5 !== 0) continue;
  const [dx, dz] = DIRS[p.face];
  const ix = x - dx, iz = z - dz;
  if (at(ix, iz) && !got(ix, y, iz)) put(ix, y, iz, "glowstone");
}

// 6. roof plant: a lift overrun on the tower, air-con units and planters on the podium roof
const tower = [...fp.values()].filter((c) => c.T === 47 && !isEdge(c));
if (tower.length) {
  const cx = Math.round(tower.reduce((s, c) => s + c.x, 0) / tower.length);
  const cz = Math.round(tower.reduce((s, c) => s + c.z, 0) / tower.length);
  for (let x = cx - 2; x <= cx + 1; x++) for (let z = cz - 1; z <= cz + 1; z++) {
    const c = at(x, z); if (!c || c.T !== 47) continue;
    for (let y = 47; y < 49; y++) put(x, y, z, "light_gray_concrete");
    put(x, 49, z, "white_concrete");
  }
}
for (const c of fp.values()) {
  if (c.T !== 40 || isEdge(c)) continue;
  if (c.x % 3 === 1 && c.z % 3 === 1) put(c.x, 40, c.z, "iron_block");
  else if ((c.x * 13 + c.z * 7) % 9 === 0) put(c.x, 40, c.z, "oak_leaves", { s: { distance: "7", persistent: "true", waterlogged: "false" } });
}

// 7. panes connect along the face to their neighbours, not into the air behind
const sideOf = (face) => (face === "E" || face === "W" ? ["north", "south"] : ["east", "west"]);
const NB = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
for (const [k, p] of plan) {
  if (p.b !== "cyan_stained_glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const inPlane = sideOf(p.face);
  const s = { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" };
  for (const side of inPlane) { const [dx, dz] = NB[side]; s[side] = got(x + dx, y, z + dz) ? "true" : "false"; }
  p.s = s;
}

// 8. write the volume
const g = new Voxels([W, H, D]);
for (const [k, p] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, p.b, p.s);
}
const res = g.save(out);
console.log(`way_154430132: ${res.blocks} blocks, ${res.palette} palette entries, porch ${porch ? `${porch.x},${porch.z}` : "none"}`);
