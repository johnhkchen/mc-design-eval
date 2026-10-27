// Whitaker Park Apartments: a 1980s concrete-frame residential tower on a one-storey podium, with a three-storey shoulder
// on its southern edge. Lidar roof heights are median-filtered over 3x3 and snapped to three flat tiers (76, 68, 48), so
// the massing steps down in clean setbacks. Walls are a one-block skin with floor slabs every 4 blocks and no interiors
// (air behind the glass); the glazing is blue, the spandrels and mullions white concrete, and some windows show glowstone.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_440300789.cells.json`, "utf8"));
const W = 31, H = 90;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const cell = new Map();
for (const [x, z, gr, roof] of cells) cell.set(`${x},${z}`, { x, z, gr, roof });
const inFp = (x, z) => cell.has(`${x},${z}`);

// flat tiers: tower 76 (19 storeys), shoulder 68, wing 48; below 36 m of roof, a one-storey podium on the ground
const tierTop = (m, gr) => (m >= 72 ? 76 : m >= 60 ? 68 : m >= 36 ? 48 : 4 * Math.ceil((gr + 4) / 4));
const median = (v) => { const s = [...v].sort((a, b) => a - b); return s[s.length >> 1]; };
const top = new Map();
for (const c of cell.values()) {
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = cell.get(`${c.x + dx},${c.z + dz}`); if (n) near.push(n.roof); }
  top.set(`${c.x},${c.z}`, tierTop(median(near), c.gr));
}
const Tof = (x, z) => (inFp(x, z) ? top.get(`${x},${z}`) : -1);

// the faces of a footprint cell at height y that show to air: a neighbour outside, or one whose wall has ended below y
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz) || y >= Tof(x + dx, z + dz));
const lit = (x, y, z) => (x * 7 + z * 13 + Math.floor(y / 4) * 5) % 5 === 0;

const g = new Voxels([W, H, W]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (const c of cell.values()) {
  const { x, z, gr } = c, T = top.get(`${x},${z}`);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");                       // the foundation, so nothing floats on the slope
  for (let y = gr; y < T; y++) {
    const ex = exposed(x, z, y), skin = ex.length > 0;
    if (y === gr) { put(x, y, z, skin ? "stone_bricks" : "smooth_stone"); continue; }   // plinth course, then the ground floor slab
    if (y === T - 1) { put(x, y, z, skin ? "smooth_stone" : "gray_concrete"); continue; } // coping, and the roof deck inside
    if (y === T - 2) { if (skin) put(x, y, z, "white_concrete"); continue; }            // parapet band
    const yy = y % 4;
    if (yy === 0) { put(x, y, z, "light_gray_concrete"); continue; }                   // floor slab (belt course on the skin)
    if (!skin) continue;                                                               // the air behind the glass
    if (yy === 3) { put(x, y, z, "white_concrete"); continue; }                        // spandrel under each window band
    const missX = ex.some(([dx]) => dx), missZ = ex.some(([, dz]) => dz);
    const along = missX && missZ ? null : missX ? z : x;
    const mullion = along === null || along % 3 === 0;
    put(x, y, z, mullion ? "white_concrete" : "light_blue_stained_glass");
  }
}

// lit windows: a glowstone just inside the glass, on the storey's window row
for (const c of cell.values()) {
  const { x, z, gr } = c, T = top.get(`${x},${z}`);
  for (let y = gr + 1; y < T - 2; y++) {
    if (y % 4 !== 1) continue;
    const ex = exposed(x, z, y);
    if (!ex.length || !lit(x, y, z)) continue;
    const [dx, dz] = ex[0], ix = x - dx, iz = z - dz;
    if (inFp(ix, iz) && y > cell.get(`${ix},${iz}`).gr && exposed(ix, iz, y).length === 0) put(ix, y, iz, "glowstone");
  }
}

// entrance: the north face's lowest ground, centred; oak door, stair step, a lintel canopy along the face
const north = [...cell.values()].filter((c) => !inFp(c.x, c.z - 1));
const minG = Math.min(...north.map((c) => c.gr));
const pool = north.filter((c) => c.gr === minG);
const meanX = pool.reduce((s, c) => s + c.x, 0) / pool.length;
const ent = pool.reduce((a, c) => (Math.abs(c.x - meanX) < Math.abs(a.x - meanX) ? c : a));
const { x: ex0, z: ez0, gr: eg } = ent;
put(ex0, eg, ez0, "oak_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });
put(ex0, eg + 1, ez0, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(ex0, eg + 2, ez0, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let dx = -2; dx <= 2; dx++) if (inFp(ex0 + dx, ez0)) put(ex0 + dx, eg + 3, ez0, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

// plant room on the tower roof, centred, a storey high with a louvred band
for (let z = 11; z <= 19; z++) for (let x = 11; x <= 19; x++) {
  if (!inFp(x, z) || Tof(x, z) !== 76) continue;
  const edge = x === 11 || x === 19 || z === 11 || z === 19;
  for (let y = 76; y <= 79; y++) {
    if (y === 79) put(x, y, z, "smooth_stone");
    else if (!edge) continue;
    else if (y === 77 && (x + z) % 3 !== 0) put(x, y, z, "light_blue_stained_glass");
    else put(x, y, z, "white_concrete");
  }
}

// a check: solid blocks with air under them and nothing beside them at their height (a float)
let floats = 0, solid = 0;
g.forEachCell((i) => {
  solid++;
  const x = i % W, y = Math.floor(i / W) % H, z = Math.floor(i / (W * H));
  if (y === 0 || g.val(x, y - 1, z)) return;
  if (!DIRS.some(([dx, dz]) => g.val(x + dx, y, z + dz))) floats++;
});
const out = g.save(`${DIR}/way_440300789.nbt`);
console.log(JSON.stringify({ footprint: cells.length, solid, floats, ...out }));
