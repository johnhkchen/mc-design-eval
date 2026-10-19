// DC83236: a Beaux-Arts office block on the Mall's flank, as a 1.21.1 module. The lidar roof (median-smoothed over
// the footprint, snapped to tiers of 4, 7, 10, 13, 16 and 23 blocks) gives a tall south-west tower with a copper
// cupola, a 16-block mass beside it, a 10-13 block centre, and 4-7 block wings and pavilions. Limestone-look walls
// on a stone plinth, quartz belt courses every 4 blocks (one storey), a 3-cell pier-and-bay rhythm for mullioned glass,
// copper roofs with a parapet, a portico on the south front, and some glowstone lamps set behind the glass.
// Every column is solid from y 0 up to its roof, with a floor slab each storey, so nothing hangs in the air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC83236.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC83236.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Smoothed roof: median of the footprint cells in the 3x3 around each cell (lidar noise drops out).
const smooth = new Map();
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  smooth.set(key(c.x, c.z), vals[vals.length >> 1]);
}
// Flat tiers: the roof top of each cell snaps to the nearest of these (a tier is a roof height, not a storey count).
const TIERS = [4, 7, 10, 13, 16, 23];
const tierOf = (h) => TIERS.reduce((b, t) => (Math.abs(t - h) < Math.abs(b - h) ? t : b));
const T = (x, z) => tierOf(smooth.get(key(x, z)));

// Palette: limestone-look walls, quartz trim, copper roofs, glass in mullioned bays.
const BASE = "stone_bricks";          // plinth and foundations
const WALL = "smooth_quartz";         // the piers between the bays
const CORNER = "quartz_pillar";       // corner quoins
const BELT = "quartz_block";          // sills and string courses, one per storey
const CORNICE = "quartz_block";       // the top course under the parapet
const PARAPET = "stone_bricks";
const FLOOR = "smooth_stone";         // floor and ceiling slabs
const GLASS = "glass_pane";
const LAMP = "glowstone";             // lit rooms, just behind the glass
const ROOF = "oxidized_cut_copper";   // copper roof deck on the taller tiers
const TERRACE = "smooth_stone";       // flat roof on the low wings
const COPPER = "oxidized_copper";
const AC = "iron_block";
const DOOR = "dark_oak_door";

const vox = new Voxels([30, 35, 40]);
const set = (x, y, z, b, s) => vox.set(x, y, z, b, s);

const outDirs = (x, z) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz));
const shellOf = (x, z) => outDirs(x, z).length > 0;
// Bays on a 3-cell rhythm (pier, pier, bay) so each face reads as a grid of mullioned glass. The bay test follows the
// face: a south or north face runs along x, an east or west face along z.
const isBay = (x, z, [dx, dz]) => (dz !== 0 ? x % 3 === 1 : z % 3 === 1);
// Deterministic lit rooms: about one bay in nine is lamplit on each storey.
const litAt = (x, z, y) => (x * 7 + z * 13 + Math.floor(y / 4) * 5) % 9 === 0;
// An interior cell is lamplit when the lit bay in front of it (the shell cell on its outward side) is lit.
const lampBehind = (x, z, y) => DIRS.some(([dx, dz]) => {
  const s = [x + dx, z + dz];
  if (!inF(...s)) return false;
  const out = outDirs(...s).find(([a, b]) => a === dx && b === dz);
  return !!out && isBay(s[0], s[1], out) && litAt(s[0], s[1], y);
});

// Entrance: a bay on the south face with room for a portico (the three cells outside it in front are free), roughly
// in the middle of the footprint.
const cx = cells.reduce((a, c) => a + c[0], 0) / cells.length, cz = cells.reduce((a, c) => a + c[1], 0) / cells.length;
const doorCands = cells.filter(([x, z]) => {
  const c = [x, z];
  if (z > 38 || T(x, z) < 7 || !shellOf(x, z)) return false;
  if (!outDirs(x, z).some(([dx, dz]) => dx === 0 && dz === 1)) return false;
  if (!isBay(x, z, [0, 1])) return false;
  return [x - 1, x, x + 1].every((xx) => !inF(xx, z + 1));
}).map(([x, z]) => ({ x, z }));
doorCands.sort((a, b) => Math.hypot(a.x - cx, a.z - cz) - Math.hypot(b.x - cx, b.z - cz));
const door = doorCands[0];

for (const c of F.values()) {
  const { x, z, g: ground } = c;
  const t = T(x, z);
  const od = outDirs(x, z);
  const shell = od.length > 0;
  const corner = od.length > 1;
  const bay = shell && isBay(x, z, od[0]);

  for (let y = 0; y < t; y++) {
    if (y < ground) { set(x, y, z, BASE); continue; }                   // foundation under a raised cell
    if (y === t - 1) {                                                   // roof deck (or cornice on the shell)
      set(x, y, z, shell ? CORNICE : t >= 16 ? ROOF : TERRACE);
      continue;
    }
    const r = y % 4;
    if (r === 0) { set(x, y, z, shell ? (y === 0 ? BASE : BELT) : FLOOR); continue; }   // plinth or sill and floor slab
    if (r === 3) { set(x, y, z, shell ? BELT : FLOOR); continue; }                       // string course and ceiling slab
    // r = 1 or 2: the window band. Shell carries glass in bays and piers between; interior is air behind the glass.
    if (!shell) { if (lampBehind(x, z, y)) set(x, y, z, LAMP); continue; }
    if (!bay) { set(x, y, z, corner ? CORNER : WALL); continue; }
    set(x, y, z, GLASS);
  }

  if (shell && t >= 7) set(x, t, z, PARAPET);                           // parapet on the roof edge of the taller tiers
  if (!shell && t >= 7 && t < 23 && (x * 5 + z * 3) % 13 === 0) set(x, t, z, AC);   // roof plant on the terraces
}

// Tower crown: the 23-block tower gets a 3x3 copper cap, a short copper pinnacle and a lantern at its centre, where the
// 3x3 is all top tier.
for (const c of F.values()) {
  const { x, z } = c;
  if (T(x, z) !== 23 || shellOf(x, z)) continue;
  const around = [-1, 0, 1].every((dx) => [-1, 0, 1].every((dz) => inF(x + dx, z + dz) && T(x + dx, z + dz) === 23));
  if (!around) continue;
  set(x, 23, z, "oxidized_cut_copper");
  if (DIRS.every(([dx, dz]) => T(x + dx, z + dz) === 23) && [[1, 1], [1, -1], [-1, 1], [-1, -1]].every(([dx, dz]) => T(x + dx, z + dz) === 23)) {
    set(x, 24, z, COPPER);
    set(x, 25, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Entrance: dark oak doors (both halves), a portico of quartz columns on a stoop with a copper canopy.
if (door) {
  const { x, z } = door;
  const dstate = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
  set(x, 1, z, DOOR, dstate("lower"));
  set(x, 2, z, DOOR, dstate("upper"));
  for (const xx of [x - 1, x, x + 1]) set(xx, 0, z + 1, BASE);            // stoop
  for (const xx of [x - 1, x + 1]) for (const y of [1, 2]) set(xx, y, z + 1, "quartz_pillar");
  for (const xx of [x - 1, x, x + 1]) set(xx, 3, z + 1, "oxidized_cut_copper_slab", { type: "bottom", waterlogged: "false" });
  set(x, 2, z + 1, "lantern", { hanging: "true", waterlogged: "false" });  // lantern hung under the canopy
}

const stats = vox.save(OUT);
console.log(`DC83236: ${stats.blocks} blocks, ${stats.palette} palette entries, door at ${door ? `${door.x},${door.z}` : "none"}`);
