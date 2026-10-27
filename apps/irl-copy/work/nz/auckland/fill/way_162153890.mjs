// Way 162153890, Auckland: a four-storey brick-and-plaster commercial block of the 1920s-30s. Ground-floor shopfront in
// dark oak under a polished andesite base; brick upper storeys with plaster (smooth quartz) bands at each floor line and
// quartz pilasters every third bay; a cornice slab on each roof. The lidar roof is smoothed (3x3 median) into three
// flat tiers, 14 (wings), 16 (body), 18 (core), so the core steps up from the wings like a setback. Interior is hollow
// (air behind the glass, a floor slab per storey), with a few warm lights behind the windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162153890.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162153890.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const k = (x, z) => `${x},${z}`;
const lidarRoof = new Map(cells.map(([x, z, , r]) => [k(x, z), r]));
const inF = (x, z) => lidarRoof.has(k(x, z));

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const NAME = { N: "north", S: "south", W: "west", E: "east" };
const OPP = { N: "S", S: "N", W: "E", E: "W" };
const PLANE = { N: ["E", "W"], S: ["E", "W"], W: ["N", "S"], E: ["N", "S"] };   // the directions a pane on that face runs along
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !inF(x + DIRS[d][0], z + DIRS[d][1]));
// position along a face: x for a north or south face, z for an east or west one
const uOf = (x, z, d) => (d === "N" || d === "S" ? x : z);

// lidar noise -> a 3x3 median -> three flat tiers
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inF(x + dx, z + dz)) v.push(lidarRoof.get(k(x + dx, z + dz)));
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
};
const tierOf = (x, z) => { const m = median(x, z); return m >= 18 ? 18 : m >= 16 ? 16 : 14; };

// entrance: the face with the most single-face cells, the window bay nearest its middle
const singles = cells.map(([x, z]) => ({ x, z, ex: exposed(x, z) })).filter((c) => c.ex.length === 1).map((c) => ({ x: c.x, z: c.z, d: c.ex[0] }));
const faceCount = {};
for (const s of singles) faceCount[s.d] = (faceCount[s.d] || 0) + 1;
const doorDir = Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0];
const doorUs = singles.filter((s) => s.d === doorDir).map((s) => uOf(s.x, s.z, doorDir)).sort((a, b) => a - b);
const uMid = doorUs[doorUs.length >> 1];
const doorCell = singles
  .filter((s) => s.d === doorDir && uOf(s.x, s.z, doorDir) % 3 !== 0)
  .sort((a, b) => Math.abs(uOf(a.x, a.z, doorDir) - uMid) - Math.abs(uOf(b.x, b.z, doorDir) - uMid))[0];

const g = new Voxels([25, 31, 39]);
const glass = [];   // every window pane: where, and which face it sits in

function setGlass(x, y, z, d) { glass.push({ x, y, z, d }); g.set(x, y, z, "glass_pane", {}); }

// the facade of a footprint cell on its exposed face (or a corner): y from 0 to the roof's top course
function facade(x, z, y, H, ex) {
  const single = ex.length === 1 ? ex[0] : null;
  const pier = ex.length > 1 || (single && uOf(x, z, single) % 3 === 0);
  if (y === 0) { g.set(x, y, z, "polished_andesite"); return; }
  if (y < 4) {                                                   // ground floor: shopfront
    if (doorCell && doorCell.x === x && doorCell.z === z && (y === 1 || y === 2)) {
      g.set(x, y, z, "dark_oak_door", { facing: NAME[doorDir], half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      return;
    }
    if (y === 3 || pier) { g.set(x, y, z, "dark_oak_planks"); return; }
    setGlass(x, y, z, single);
    return;
  }
  if (y === H - 1) { g.set(x, y, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" }); return; }   // cornice
  if (y % 4 === 0) { g.set(x, y, z, "smooth_quartz"); return; }                                              // storey band
  if (pier) { g.set(x, y, z, "quartz_pillar", { axis: "y" }); return; }
  if (y % 4 === 1 || y % 4 === 2) { setGlass(x, y, z, single); return; }                                     // glazing
  g.set(x, y, z, "bricks");                                                                                   // head course
}

// hollow interior: the ground slab, a floor slab per storey, a roof slab; air between
function interior(x, z, y, H) {
  if (y === 0) g.set(x, y, z, "polished_andesite");
  else if (y === H - 1) g.set(x, y, z, "smooth_stone");
  else if (y >= 4 && y % 4 === 0) g.set(x, y, z, "smooth_quartz");
}

const tiers = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const H = tierOf(x, z);
  tiers.set(k(x, z), H);
  const ex = exposed(x, z);
  for (let y = 0; y < H; y++) {
    if (ex.length) facade(x, z, y, H, ex);
    else interior(x, z, y, H);
  }
}

// window panes connect along their own face only
for (const p of glass) {
  const st = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  for (const d of PLANE[p.d]) {
    const [dx, dz] = DIRS[d];
    if (g.get(p.x + dx, p.y, p.z + dz)) st[NAME[d]] = "true";
  }
  g.set(p.x, p.y, p.z, "glass_pane", st);
}

// warm light just inside a window: lanterns on the ground floor, shroomlight or glowstone on the storeys above
for (const p of glass) {
  const [dx, dz] = DIRS[OPP[p.d]];
  const ix = p.x + dx, iz = p.z + dz;
  if (!inF(ix, iz) || exposed(ix, iz).length) continue;   // only interior cells
  const h = (p.x * 31 + p.z * 17 + p.y * 7) % 9;
  if (p.y < 4) { if (p.y === 1 && h % 3 === 0) g.set(ix, 1, iz, "lantern", { hanging: "false", waterlogged: "false" }); }
  else if (p.y % 4 === 1) {
    if (h === 0) g.set(ix, p.y, iz, "shroomlight");
    else if (h === 4) g.set(ix, p.y, iz, "glowstone");
  }
}

// roof: plant boxes on the wing roof, a lantern pair and a lightning rod on the core
const plateau = (x, z, t) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => tiers.get(k(x + dx, z + dz)) === t);
const wing = cells.map(([x, z]) => [x, z]).filter(([x, z]) => tiers.get(k(x, z)) === 14 && plateau(x, z, 14) && x % 4 === 1 && z % 4 === 1);
for (const [x, z] of wing.slice(0, 3)) { g.set(x, 14, z, "stone_bricks"); g.set(x, 15, z, "stone_bricks"); }
const core = cells.map(([x, z]) => [x, z]).filter(([x, z]) => tiers.get(k(x, z)) === 18 && plateau(x, z, 18));
const mid = core[Math.floor(core.length / 2)];
if (mid) {
  g.set(mid[0], 18, mid[1], "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  for (const [x, z] of core.filter((c, i) => i % 9 === 4 && c !== mid).slice(0, 2)) g.set(x, 18, z, "lantern", { hanging: "false", waterlogged: "false" });
}

const r = g.save(OUT);
const tierCount = { 14: 0, 16: 0, 18: 0 };
for (const t of tiers.values()) tierCount[t]++;
console.log(JSON.stringify({ cells: cells.length, tiers: tierCount, glass: glass.length, door: doorCell, doorDir, wing: wing.length, core: core.length, ...r }));
