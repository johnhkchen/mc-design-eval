// Way 162091761, Mt Eden / Eden Terrace: a three-storey interwar brick commercial block (c.1925-35, the stripped-classical
// shops-and-offices that line Auckland's arterials). Red brick walls on a basalt base course, cream plaster bands,
// cornice, timber-framed shopfront glazing at ground, sash-style windows above in a 3-bay rhythm, and a
// flat roof with plant boxes. Massing follows the lidar roof: 9 blocks for the body, a 2-block setback tier at 11, and
// a 13-block tower at the core. Walls are solid from y 0 (foundation included), windows are recessed glass with an air
// gap behind, and each storey has a floor slab (the band rows).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162091761.cells.json", "utf8"));

const W = 23, H = 25, D = 19;
const g = new Voxels([W, H, D]);

// Massing tiers from the lidar roof: 13 = tower (core), 11 = setback tier, 9 = body (roof 10 and below smoothed in).
const col = new Map();
for (const [x, z, ground, roof] of cells) col.set(`${x},${z}`, { ground, top: roof >= 12 ? 13 : roof >= 11 ? 11 : 9 });
const topAt = (x, z) => col.get(`${x},${z}`)?.top ?? -1;   // outside the footprint counts as air at every height

// Horizontal neighbours: dx, dz, facing name (the way a door on that face points)
const DIRS = [{ dx: 0, dz: -1, facing: "north" }, { dx: 0, dz: 1, facing: "south" }, { dx: -1, dz: 0, facing: "west" }, { dx: 1, dz: 0, facing: "east" }];
// Faces of the solid at (x, y, z) that look onto air (outside, or a neighbouring column that stands lower than y)
const exposed = (x, y, z) => DIRS.map((d, i) => (topAt(x + d.dx, z + d.dz) <= y ? i : -1)).filter((i) => i >= 0);
const solid = (x, y, z) => y < topAt(x, z);

// Storey rhythm (absolute heights, so the walls line up across the slope): plinth below 2, base course at 2,
// ground-floor glazing 3-4, floor band 5, upper windows 6-7, band 8, window row 9-10, band 11, cap at the top row.
const BANDS = new Set([5, 8, 11]);
const WIN_ROWS = new Set([3, 4, 6, 7, 9, 10]);

const spec = new Map();                               // "x,y,z" -> [block, state] or null for air
const k3 = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => spec.set(k3(x, y, z), block ? [block, state] : null);

// Pass 1: the solid massing, with facade skin on every exposed face
for (const [key, { top }] of col) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < top; y++) {
    const ex = exposed(x, y, z);
    if (y === top - 1) { put(x, y, z, ex.length ? "smooth_quartz" : "smooth_stone"); continue; }   // cap on the facade, flat roof inside
    if (!ex.length) { put(x, y, z, "bricks"); continue; }
    if (y < 2) put(x, y, z, "stone_bricks");                                                      // foundation
    else if (y === 2) put(x, y, z, "polished_basalt");                                            // base course
    else if (BANDS.has(y)) put(x, y, z, "smooth_quartz");                                         // floor bands
    else put(x, y, z, "bricks");                                                                  // piers and spandrels (windows overwrite)
  }
}

// Parapet coping on the body's outer edge, one block above the cap
for (const [key, { top }] of col) {
  const [x, z] = key.split(",").map(Number);
  if (top === 9 && exposed(x, 8, z).length) put(x, 9, z, "smooth_quartz");
}

// Pass 2: windows. A facade cell in a window row becomes air, the cell behind it is glass, and the one behind that
// is air (or a glowstone in a few), so each pane sits in a reveal with an air gap behind it. Only where both cells are
// solid, enclosed columns, so the air never opens to outside.
const winAt = (x, y, z, d) => {
  const I = { x: x - d.dx, z: z - d.dz }, I2 = { x: x - 2 * d.dx, z: z - 2 * d.dz };
  return solid(I.x, y, I.z) && !exposed(I.x, y, I.z).length && solid(I2.x, y, I2.z) && !exposed(I2.x, y, I2.z).length ? { I, I2 } : null;
};

// Entrance: a south-facing door (or any single-face cell) with a clear 3-wide canopy outside it on row 5
const doorCand = [];
for (const [key, { top }] of col) {
  const [x, z] = key.split(",").map(Number);
  const ex = exposed(x, 4, z);
  if (ex.length !== 1 || top < 9) continue;
  const d = DIRS[ex[0]];
  if (d.dz !== 1) continue;
  if (z + 1 >= D || topAt(x - 1, z + 1) >= 0 || topAt(x, z + 1) >= 0 || topAt(x + 1, z + 1) >= 0) continue;   // canopy room outside
  if (!solid(x, 3, z - 1)) continue;                          // solid behind the door
  doorCand.push({ x, z, d });
}
const doorCell = doorCand.sort((a, b) => Math.abs(a.x - 11) - Math.abs(b.x - 11))[0] ?? null;
const doorKey = doorCell ? `${doorCell.x},${doorCell.z}` : null;
if (doorCell) {
  const { x, z, d } = doorCell;
  put(x, 3, z, "dark_oak_door", { facing: d.facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, 4, z, "dark_oak_door", { facing: d.facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  for (let dx = -1; dx <= 1; dx++) put(x + dx, 5, z + 1, "dark_oak_slab", { type: "top", waterlogged: "false" });   // canopy off the band row
}

const windows = [];
for (const [key, { top }] of col) {
  const [x, z] = key.split(",").map(Number);
  if (key === doorKey) continue;
  for (let y = 3; y < top - 1; y++) {
    if (!WIN_ROWS.has(y)) continue;
    const ex = exposed(x, y, z);
    if (ex.length !== 1) continue;
    const d = DIRS[ex[0]];
    const u = d.dz ? x : z;                                  // along-the-wall index
    const pier = (y === 3 || y === 4) ? u % 6 === 0 : u % 3 === 0;
    if (pier) continue;
    const w = winAt(x, y, z, d);
    if (!w) continue;
    windows.push({ x, y, z, d, ...w, u });
  }
}
const glassKeys = new Set(windows.map((w) => k3(w.I.x, w.y, w.I.z)));
for (const w of windows) {
  put(w.x, w.y, w.z, null);                                   // the opening
  put(w.I.x, w.y, w.I.z, "glass_pane");                       // glazing in the reveal
}
for (const w of windows) {
  const lit = w.y >= 6 && (w.u + w.y) % 7 === 0;
  if (glassKeys.has(k3(w.I2.x, w.y, w.I2.z))) continue;        // a glazed cell of another window is never air
  put(w.I2.x, w.y, w.I2.z, lit ? "glowstone" : null);         // air gap behind the glass, a lamp in a few
}

// Pass 3: roof. Plant boxes on the body roof, and the tower's lightning rod and a plant box on the core roof
for (const [key, { top }] of col) {
  const [x, z] = key.split(",").map(Number);
  if (top === 9 && !exposed(x, 8, z).length && (x * 5 + z * 11) % 37 === 0) put(x, 9, z, "iron_block");
}
const core = [...col].filter(([, c]) => c.top === 13).map(([k]) => k.split(",").map(Number));
if (core.length) {
  const cx = core.reduce((s, [x]) => s + x, 0) / core.length, cz = core.reduce((s, [, z]) => s + z, 0) / core.length;
  const near = core.sort((a, b) => Math.hypot(a[0] - cx, a[1] - cz) - Math.hypot(b[0] - cx, b[1] - cz));
  const [rx, rz] = near[0];
  put(rx, 13, rz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  put(near[1][0], 13, near[1][1], "iron_block");
}

// Glass panes connect to whatever stands beside them in the same row, so the grid reads as one set of frames
const filled = (x, y, z) => !!spec.get(k3(x, y, z));
for (const [key, v] of spec) {
  if (!v || v[0] !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const side = (dx, dz) => (filled(x + dx, y, z + dz) ? "true" : "false");
  v[1] = { north: side(0, -1), south: side(0, 1), west: side(-1, 0), east: side(1, 0), waterlogged: "false" };
}

for (const [key, v] of spec) {
  if (!v) continue;
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, v[0], v[1]);
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162091761.nbt");
