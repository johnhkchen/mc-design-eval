// NYC1035470: 488 Madison Avenue, NYC individual landmark, Commercial & Office, 1950. A mid-century office block in the
// International style: a granite base and a shopfront storey, a pale spandrel-and-pier curtain wall with blue-glass
// bands, the lidar roof turned into flat storey tiers (setbacks), a mechanical penthouse on the tower, and a recessed
// entrance with a canopy on the street face (z = 0). Each facade cell is a glass or pier skin with an air gap of one
// block behind it and a solid core behind that, so every storey, tier and roof has something under it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const W = 38, D = 55, H = 87;
const cells = JSON.parse(readFileSync(`${dir}/NYC1035470.cells.json`, "utf8"));

// Materials
const BASE = "polished_granite", BASE_SLAB = "polished_granite_slab";
const SPANDREL = "white_concrete", PIER = "smooth_quartz", PANE = "light_blue_stained_glass_pane", GLASS = "glass";
const FLOOR = "stone", CORE = "stone", ROOF = "smooth_stone", PAVING = "smooth_stone", PARAPET = "smooth_quartz";
const PLANT = "light_gray_concrete", LANTERN = "lantern";

// Footprint cells, keyed by z * W + x
const at = new Map();
const cellAt = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? null : at.get(z * W + x) ?? null);
for (const [x, z, g, r] of cells) at.set(z * W + x, { x, z, g, r, n: 0 });

const median = (v) => { const s = [...v].sort((a, b) => a - b); return s[s.length >> 1]; };
const ring = (c, f) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const m = cellAt(c.x + dx, c.z + dz); if (m) v.push(f(m)); }
  return v;
};

// Lidar roof -> storeys of 3 blocks. A 3x3 median on the roof, then on the storey count, turns lidar noise into flat tiers.
for (const c of at.values()) { const v = ring(c, (m) => m.r); const rm = v.length >= 5 ? median(v) : c.r; c.n = rm < 6 ? 0 : Math.round((rm - 1) / 3); }
// Two more 3x3 passes, then a 5x5 pass: the setback edges come out as clean steps rather than protruding cells
const ring2 = (c) => { const v = []; for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { const m = cellAt(c.x + dx, c.z + dz); if (m) v.push(m.n); } return v; };
for (let pass = 0; pass < 3; pass++) {
  const nq = new Map();
  for (const c of at.values()) nq.set(c, pass < 2 ? median(ring(c, (m) => m.n)) : median(ring2(c)));
  for (const c of at.values()) c.n = nq.get(c);
}

const topOf = (c) => (c.n > 0 ? 3 * c.n : c.g);                  // the cap row: roof slab, or the paving of a low lot
const solidAt = (m, y) => !!m && y <= topOf(m);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (c, y) => DIRS.filter(([dx, dz]) => !solidAt(cellAt(c.x + dx, c.z + dz), y));
const isFacade = (c, y) => c.n > 0 && y >= c.g && y < topOf(c) && exposed(c, y).length > 0;
// Air one block deep behind a window: a non-floor row beside a facade cell, not the ceiling under the roof
const isGap = (c, y) => c.n > 0 && y >= c.g && y < topOf(c) - 1 && y % 3 !== 0 && !isFacade(c, y) &&
  DIRS.some(([dx, dz]) => { const m = cellAt(c.x + dx, c.z + dz); return m && isFacade(m, y); });

// The massing, as block placements keyed "x,y,z"
const vox = new Map();
const put = (x, y, z, b, s) => { if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return; vox.set(`${x},${y},${z}`, { b, s }); };
const get = (x, y, z) => vox.get(`${x},${y},${z}`);

for (const c of at.values()) {
  const top = topOf(c);
  for (let y = 0; y < c.g; y++) put(c.x, y, c.z, BASE);             // foundation, so nothing floats on the slope
  if (c.n === 0) { put(c.x, top, c.z, PAVING); continue; }
  for (let y = c.g; y <= top; y++) {
    if (y === top) { put(c.x, y, c.z, ROOF); continue; }
    const r = y % 3, k = Math.floor(y / 3), sides = exposed(c, y), face = isFacade(c, y);
    // Canopy over the recessed entrance: the storey-1 spandrel row in front of the doors
    if (k === 1 && r === 0 && c.z <= 1 && c.x >= 18 && c.x <= 22) { put(c.x, y, c.z, BASE_SLAB, { type: "bottom", waterlogged: "false" }); continue; }
    if (r === 0) { put(c.x, y, c.z, face ? (k === 0 ? BASE : SPANDREL) : FLOOR); continue; }
    if (!face) { if (!isGap(c, y)) put(c.x, y, c.z, CORE); continue; }   // gap stays air
    // Facade wall: piers on the column grid (every third cell along the wall), glass between; corners are piers
    const normalX = sides.some(([dx]) => dx !== 0), normalZ = sides.some(([, dz]) => dz !== 0);
    const pier = (normalX && c.z % 3 === 0) || (normalZ && c.x % 3 === 0) || (normalX && normalZ);
    const door = c.z === 0 && c.x >= 19 && c.x <= 21 && k === 0;
    if (k === 0) put(c.x, y, c.z, pier && !door ? BASE : GLASS);     // shopfront: granite bulkheads, glass
    else put(c.x, y, c.z, pier ? PIER : PANE, pier ? undefined : { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  }
  if (exposed(c, top + 1).length) put(c.x, top + 1, c.z, PARAPET);
}

// Mechanical penthouse on the tower: a solid box on the caps of the tallest cells around the mass centre
const tall = [...at.values()].filter((c) => c.n >= 20);
const cx = Math.round(tall.reduce((s, c) => s + c.x, 0) / tall.length), cz = Math.round(tall.reduce((s, c) => s + c.z, 0) / tall.length);
for (const c of tall) {
  if (Math.abs(c.x - cx) > 4 || Math.abs(c.z - cz) > 4) continue;
  const top = topOf(c);
  put(c.x, top + 1, c.z, PLANT); put(c.x, top + 2, c.z, PLANT); put(c.x, top + 3, c.z, PARAPET);
}

// Warm lights: a lantern in some air gaps behind the glass (standing on the floor, or hanging from the slab above)
for (const c of at.values()) {
  for (let y = c.g; y < topOf(c); y++) {
    const r = y % 3, k = Math.floor(y / 3);
    if (k < 1 || (r !== 1 && r !== 2) || !isFacade(c, y) || (c.x * 7 + c.z * 13 + k * 5) % 19 !== 0) continue;
    const [dx, dz] = exposed(c, y)[0], x = c.x - dx, z = c.z - dz;
    if (!cellAt(x, z) || get(x, y, z)) continue;
    put(x, y, z, LANTERN, { hanging: r === 2 ? "true" : "false", waterlogged: "false" });
  }
}

// Glass panes connect to the solid or pane neighbours that are in their plane
const PANE_LINKS = [["north", 0, -1], ["south", 0, 1], ["east", 1, 0], ["west", -1, 0]];
for (const [key, v] of vox) {
  if (v.b !== PANE) continue;
  const [x, y, z] = key.split(",").map(Number);
  const s = { waterlogged: "false" };
  for (const [name, dx, dz] of PANE_LINKS) { const m = get(x + dx, y, z + dz); s[name] = m && m.b !== LANTERN ? "true" : "false"; }
  v.s = s;
}

const g = new Voxels([W, H, D]);
for (const [key, v] of vox) { const [x, y, z] = key.split(",").map(Number); g.set(x, y, z, v.b, v.s); }
const out = `${dir}/NYC1035470.nbt`;
const stats = g.save(out);
const tops = [...at.values()].map(topOf);
console.log(`cells ${at.size}, blocks ${stats.blocks}, palette ${stats.palette}, highest ${Math.max(...tops)} (lidar 75), tower centre x${cx} z${cz}, wrote ${out}`);
