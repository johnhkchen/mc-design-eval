// One Nelson, Auckland CBD: an 8-storey 1980s-style office block on a stepped podium. The lidar roof is smoothed (3x3 median)
// and snapped to four flat tiers (24, 28, 32, 34), each a whole number of 4-block storeys above y 0 (the crown is the 34
// tier). Every footprint cell is solid from y 0 to its lidar ground; from there up it is plinth, storeys, cap.
// Storey lines sit on absolute y % 4 == 0, so the bands line up across neighbouring cells of different ground. The
// facade is a 1-block shell: glass in mullion bays, white concrete piers and spandrels, air behind the glass, a floor slab
// per storey tied to the walls and to a solid service core.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const W = 44, H = 46, D = 70;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const cells = JSON.parse(readFileSync(`${DIR}/way_24021171.cells.json`, "utf8"));

// footprint: key "x,z" -> { x, z, g (ground), r (lidar roof), R (snapped tier), F (plinth top), depth }
const fpMap = new Map();
for (const [x, z, g, r] of cells) fpMap.set(`${x},${z}`, { x, z, g, r });
const fp = (x, z) => fpMap.get(`${x},${z}`);
const TIER = (r) => (r >= 33 ? 34 : r >= 31 ? 32 : r >= 27 ? 28 : 24);
for (const c of fpMap.values()) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = fp(c.x + dx, c.z + dz); if (n) vals.push(n.r); }
  vals.sort((a, b) => a - b);
  c.R = TIER(vals[vals.length >> 1]);
  c.F = Math.ceil(c.g / 4) * 4;                     // first storey line at or above the ground
  if (c.F >= c.R) throw new Error(`no storey under the tier at ${c.x},${c.z}`);
}
const all = [...fpMap.values()];

// 2-D depth from the outline (1 = edge): the service core is the deep middle of the tower
const env = (x, z, y) => { const c = fp(x, z); return !!c && y < c.R; };          // inside the solid envelope at height y
const exposed = (x, z, y) => NB.some(([dx, dz]) => !env(x + dx, z + dz, y));     // a face of the facade at height y
const depth = new Map(); let q = [];
for (const c of all) if (NB.some(([dx, dz]) => !fp(c.x + dx, c.z + dz))) { depth.set(c, 1); q.push(c); }
for (let i = 0; i < q.length; i++) {
  const c = q[i];
  for (const [dx, dz] of NB) { const n = fp(c.x + dx, c.z + dz); if (n && !depth.has(n)) { depth.set(n, depth.get(c) + 1); q.push(n); } }
}
const tower = all.filter((c) => c.R >= 32);
const cx = Math.round(tower.reduce((s, c) => s + c.x, 0) / tower.length);
const cz = Math.round(tower.reduce((s, c) => s + c.z, 0) / tower.length);
const inCore = (c) => (depth.get(c) ?? 0) >= 3 && Math.abs(c.x - cx) <= 4 && Math.abs(c.z - cz) <= 5;

// the model, one slot per cell: { name, state } or null (air)
const B = new Array(W * H * D).fill(null);
const idx = (x, y, z) => (z * H + y) * W + x;
const put = (x, y, z, name, state) => { if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return; B[idx(x, y, z)] = { name, state }; };
const at = (x, y, z) => (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D ? null : B[idx(x, y, z)]);

// the entrance: the ground storey's south-facing cell nearest the middle of the southmost run
const southGround = all.filter((c) => !env(c.x, c.z + 1, c.F + 1) && env(c.x, c.z, c.F + 1) && c.R > c.F + 3);
const zMax = Math.max(...southGround.map((c) => c.z));
const southRun = southGround.filter((c) => c.z === zMax);
const meanX = southRun.reduce((s, c) => s + c.x, 0) / southRun.length;
const door = southRun.reduce((best, c) => (Math.abs(c.x - meanX) < Math.abs(best.x - meanX) ? c : best));

const glowCandidates = [];
for (const c of all) {
  const { x, z, g, R, F } = c;
  for (let y = 0; y < F; y++) put(x, y, z, y >= g && exposed(x, z, y) && y === F - 1 ? "polished_andesite" : "stone_bricks");
  for (let y = F; y < R; y++) {
    const ex = exposed(x, z, y);
    if (y === R - 1) { put(x, y, z, ex ? "smooth_stone" : "gray_concrete"); continue; }   // cornice and roof membrane
    if (!ex) {
      if (inCore(c)) put(x, y, z, "light_gray_concrete");
      else if (y % 4 === 0) put(x, y, z, "light_gray_concrete");                       // floor slab per storey
      continue;
    }
    const ground = y < F + 4;
    const row = y % 4;                                                                  // 0 band, 1-2 glass, 3 transom
    const ezFace = !env(x, z - 1, y) || !env(x, z + 1, y);
    const exFace = !env(x - 1, z, y) || !env(x + 1, z, y);
    const pier = (ezFace && x % 3 === 0) || (exFace && z % 3 === 0);
    if (row === 0) put(x, y, z, ground ? "polished_andesite" : "light_gray_concrete");
    else if (row === 3) put(x, y, z, ground ? "stone_bricks" : "white_concrete");
    else if (pier) put(x, y, z, ground ? "stone_bricks" : "white_concrete");
    else {
      if (door && x === door.x && z === door.z && (y === F + 1 || y === F + 2)) {
        put(x, y, z, "dark_oak_door", { facing: "south", half: y === F + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      } else put(x, y, z, "light_blue_stained_glass");
      // warm light behind the glass, on the floor slab, one window in seven
      if (row === 1 && (x * 73 + z * 151 + y * 37) % 7 === 0) {
        const inward = !env(x, z - 1, y) ? [0, 1] : !env(x, z + 1, y) ? [0, -1] : !env(x - 1, z, y) ? [1, 0] : [-1, 0];
        glowCandidates.push([x + inward[0], y, z + inward[1]]);
      }
    }
  }
}

// lights go only where the cell behind the glass is air sitting on a floor slab (nothing floats)
let glow = 0;
for (const [x, y, z] of glowCandidates) {
  const c = fp(x, z);
  if (!c || y >= c.R || inCore(c) || exposed(x, z, y) || y % 4 !== 1) continue;
  if (!at(x, y - 1, z) || at(x, y, z)) continue;
  put(x, y, z, "glowstone"); glow++;
}
// the lantern light at the entrance hall: standing on the slab behind the door
if (door) {
  const hx = door.x, hz = door.z - 1;
  const hc = fp(hx, hz);
  if (hc && door.F + 1 < hc.R && !at(hx, door.F + 1, hz) && at(hx, door.F, hz)) put(hx, door.F + 1, hz, "lantern", { hanging: "false" });
}

// the plant room on the crown: a 3x3 block of the 34 tier, stone with glass louvres, on the crown's roof membrane
let plant = null;
for (const c of all.filter((c) => c.R === 34)) {
  let whole = true;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = fp(c.x + dx, c.z + dz); if (!n || n.R !== 34) whole = false; }
  if (whole && (!plant || Math.hypot(c.x - cx, c.z - cz) < Math.hypot(plant.x - cx, plant.z - cz))) plant = c;
}
if (plant) {
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const x = plant.x + dx, z = plant.z + dz, edge = Math.abs(dx) === 1 || Math.abs(dz) === 1;
    put(x, 34, z, "stone_bricks");
    if (edge) put(x, 35, z, "light_blue_stained_glass");
    put(x, 36, z, "smooth_stone");
  }
}

// nothing floats: every block sits on a block below or touches one at its own height
let floats = 0;
for (let z = 0; z < D; z++) for (let y = 1; y < H; y++) for (let x = 0; x < W; x++) {
  if (!at(x, y, z)) continue;
  const below = at(x, y - 1, z), side = NB.some(([dx, dz]) => at(x + dx, y, z + dz));
  if (!below && !side) floats++;
}

const out = new Voxels([W, H, D]);
let placed = 0;
for (let z = 0; z < D; z++) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const b = at(x, y, z); if (!b) continue;
  out.set(x, y, z, b.name, b.state); placed++;
}
const saved = out.save(`${DIR}/way_24021171.nbt`);
const maxRoof = Math.max(...all.map((c) => c.R));
console.log(JSON.stringify({ cells: all.length, placed, floats, glow, door: door ? [door.x, door.z] : null, plant: !!plant, maxRoof, core: [cx, cz], ...saved }));
