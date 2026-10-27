// way_292667908: a late-1980s office tower on a pale podium, from the lidar roofs. The 124-block core (about 31 storeys,
// blue-glass curtain wall in white precast bands) stands on stepped tiers of 112, 92 and 64, with 16 and 28 wings at the
// edges. Zero-height lidar cells read as open courts (foundation only). Storey lines sit on absolute multiples of 4, so
// every tier and floor lines up across the footprint; a plinth fills the slope on the uphill cells.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292667908.cells.json", "utf8"));
const W = 42, D = 30, H = 138;
const g = new Voxels([W, H, D]);

const TIERS = [16, 28, 64, 92, 112, 124];   // the roof levels the lidar settles on (all multiples of 4)
const MATS = {
  tower: { band: "white_concrete", frame: "light_gray_concrete", glass: "light_blue_stained_glass", slab: "light_gray_concrete", roof: "gray_concrete", parapet: "white_concrete" },
  podium: { band: "light_gray_concrete", frame: "gray_concrete", glass: "cyan_stained_glass", slab: "light_gray_concrete", roof: "gray_concrete", parapet: "light_gray_concrete" },
};
const N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
const key = (x, z) => `${x},${z}`;
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[s.length >> 1]; };
const nearTier = (r) => TIERS.reduce((b, L) => (Math.abs(L - r) < Math.abs(b - r) ? L : b), TIERS[0]);

// the cell model: ground, top (the roof deck's y), tier and style; lidar noise smoothed by the median of the 3x3
const raw = new Map();
for (const [x, z, ground, roof] of cells) raw.set(key(x, z), { x, z, ground, roof });
const model = new Map();
for (const c of raw.values()) {
  const court = c.roof === 0;                                  // no lidar roof: an open court, foundation only
  const ring = [c.roof];
  for (const [dx, dz] of N8) { const n = raw.get(key(c.x + dx, c.z + dz)); if (n && n.roof > 0) ring.push(n.roof); }
  const tier = court ? 0 : nearTier(median(ring));
  model.set(key(c.x, c.z), { ...c, court, tier, top: court ? c.ground : tier, style: tier >= 92 ? "tower" : "podium" });
}
const cellsOf = [...model.values()];

// built below y: foundation under the ground, then the building up to the top
const occ = (x, z, y) => { const n = model.get(key(x, z)); return !!n && y < n.top; };
const sides = (x, z, y) => ({ w: !occ(x - 1, z, y), e: !occ(x + 1, z, y), n: !occ(x, z - 1, y), s: !occ(x, z + 1, y) });
const any = (s) => s.w || s.e || s.n || s.s;

// the shell: foundation, plinth on the slope, then storeys of slab / glass band / glass band / ceiling-spandrel
for (const c of cellsOf) {
  for (let y = 0; y < c.ground; y++) g.set(c.x, y, c.z, "stone_bricks");
  if (c.court) continue;
  const M = MATS[c.style];
  const first = c.ground > 0 ? 4 : 0;                         // the first floor line; the plinth fills [ground, first)
  const groundK = first / 4;                                   // the shopfront / lobby storey
  for (let y = c.ground; y < c.top; y++) {
    if (y < first) { g.set(c.x, y, c.z, "stone_bricks"); continue; }
    const r = y % 4, k = (y - r) / 4, s = sides(c.x, c.z, y), ext = any(s);
    const frame = ((s.w || s.e) && c.z % 3 === 0) || ((s.n || s.s) && c.x % 3 === 0);   // mullions every 3rd cell
    let b;
    if (r === 0) b = !ext ? M.slab : k === groundK ? "polished_andesite" : M.band;      // floor line / base course
    else if (r === 3) b = ext ? M.band : M.slab;                                          // spandrel and ceiling
    else if (!ext) continue;                                                              // air behind the glass
    else b = frame ? M.frame : k === groundK ? "glass" : M.glass;
    g.set(c.x, y, c.z, b);
  }

  // roof: deck on the top, a parapet on the rim, terraces on the 64 tier and roof plant on the wings
  const T = c.top, roofRim = any(sides(c.x, c.z, T + 1));
  g.set(c.x, T, c.z, c.tier === 64 && !roofRim && (c.x + c.z) % 3 ? "moss_block" : M.roof);
  if (roofRim) g.set(c.x, T + 1, c.z, M.parapet);
  else if ((c.tier === 16 || c.tier === 28) && c.x % 4 === 1 && c.z % 3 === 2) g.set(c.x, T + 1, c.z, "iron_block");
}

// roof plant on the tower's centre: a 3x3 box, two storeys of plant room
const tower = cellsOf.filter((c) => c.tier === 124);
if (tower.length) {
  const cx = Math.round(tower.reduce((a, c) => a + c.x, 0) / tower.length), cz = Math.round(tower.reduce((a, c) => a + c.z, 0) / tower.length);
  for (const c of tower) if (Math.abs(c.x - cx) <= 1 && Math.abs(c.z - cz) <= 1) for (const dy of [1, 2]) g.set(c.x, c.top + dy, c.z, "light_gray_concrete");
}

// the entrance: on the north face of a ground-level cell near x 18; a stone step, an iron door, a canopy band and lanterns
const entry = cellsOf.filter((c) => !c.court && c.ground === 0 && c.top > 4 && sides(c.x, c.z, 1).n)
  .sort((a, b) => Math.abs(a.x - 18) - Math.abs(b.x - 18))[0];
if (entry) {
  const { x: ex, z: ez } = entry;
  g.set(ex, 0, ez, "stone_brick_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });
  g.set(ex, 1, ez, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(ex, 2, ez, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 0, 1]) if (model.has(key(ex + dx, ez))) g.set(ex + dx, 3, ez, "polished_andesite");
  for (const dx of [-1, 1]) if (model.has(key(ex + dx, ez))) g.set(ex + dx, 2, ez, "lantern", { hanging: "true", waterlogged: "false" });
}

// warm light: glowstone behind some lit windows (in the air gap, toward the centre), lanterns hanging in the shopfronts
const mx = cellsOf.reduce((a, c) => a + c.x, 0) / cellsOf.length, mz = cellsOf.reduce((a, c) => a + c.z, 0) / cellsOf.length;
for (const c of cellsOf) {
  if (c.court) continue;
  const first = c.ground > 0 ? 4 : 0, groundK = first / 4;
  for (let k = groundK; 4 * k + 3 < c.top; k++) {
    const y = 4 * k + 1, s = sides(c.x, c.z, y), ext = any(s);
    const frame = ((s.w || s.e) && c.z % 3 === 0) || ((s.n || s.s) && c.x % 3 === 0);
    if (ext && !frame && (c.x * 5 + c.z * 3 + k * 2) % 7 === 0) {
      const inward = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => model.get(key(c.x + dx, c.z + dz)))
        .filter((n) => n && y >= n.ground && y < n.top && !any(sides(n.x, n.z, y)))
        .sort((a, b) => Math.hypot(a.x - mx, a.z - mz) - Math.hypot(b.x - mx, b.z - mz))[0];
      if (inward) g.set(inward.x, y, inward.z, "glowstone");
    }
    if (k === groundK && !ext && (c.x + c.z) % 3 === 0) g.set(c.x, 4 * k + 2, c.z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292667908.nbt");
console.log(`way_292667908: ${g.count()} blocks, ${g.palette.length - 1} block states, entrance ${entry ? `${entry.x},${entry.z}` : "none"}`);
