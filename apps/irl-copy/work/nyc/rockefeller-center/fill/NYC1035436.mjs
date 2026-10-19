// 19 East 48th Street (2005): a Midtown office tower in the glass-and-steel curtain-wall mould of its decade, on a granite
// plinth and pale stone trim. The lidar roof is median-smoothed over 3x3 and snapped to whole 3-block storeys above one foundation course (y 0),
// so the massing steps back in clean tiers and every floor stands on the one below. Each storey is a solid floor line,
// then two rows of light-blue glass between iron mullions; corners are pale stone columns. The walls are one block thick
// with air behind the glass and a solid slab per storey, so nothing is hollow-floating. Lit windows have a glowstone
// one block back in the air gap. The entrance is a flush portal on the west face (a canopy would need to project out of
// the footprint). A penthouse and two condenser units sit on the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${FILL}/NYC1035436.cells.json`, "utf8"));   // [x, z, ground, roof]
const SIZE = [7, 38, 27];
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

const k2 = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [k2(x, z), { g, r }]));
const inFp = (x, z) => raw.has(k2(x, z));

// Storeys per cell: the lidar roof, 3x3 median, minus the foundation, over 3 blocks. Zero storeys = open paved ground.
const N = new Map();
for (const [key, { r }] of raw) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFp(x + dx, z + dz)) vals.push(raw.get(k2(x + dx, z + dz)).r);
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  N.set(key, Math.max(0, Math.round((med - 1) / 3)));
}
// Top of each cell (exclusive): 0 outside the footprint, 1 for open ground, else 1 + 3 per storey.
const top = (x, z) => { const n = N.get(k2(x, z)); return n === undefined ? 0 : n ? 1 + 3 * n : 1; };
const occ = (x, z, y) => y >= 0 && y < top(x, z);
const faces = (x, z, y) => DIRS.filter(([dx, dz]) => !occ(x + dx, z + dz, y));
const wall = (x, z, y) => occ(x, z, y) && faces(x, z, y).length > 0;

const g = new Voxels(SIZE);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const window_ = "light_blue_stained_glass", mullion = "iron_block", stone = "smooth_stone", base = "polished_granite", trim = "smooth_quartz";

// The west entrance bay: door at z 13, lantern over it, the lobby light one block in.
const ENT = { x: 0, z: 13 };
const DOOR = { facing: "west", hinge: "left", open: "false", powered: "false" };

for (const [key] of raw) {
  const [x, z] = key.split(",").map(Number);
  const T = top(x, z);
  if (T === 1) { put(x, 0, z, stone); continue; }                         // open paved forecourt
  put(x, 0, z, base);                                                      // foundation course
  const outer = faces(x, z, T - 1).length > 0;
  // Roof deck: solid under the cap, cornice on the perimeter, parapet a block above it.
  put(x, T - 1, z, outer ? trim : stone);
  if (outer) put(x, T, z, trim);

  for (let y = 1; y <= T - 2; y++) {
    const k = Math.floor((y - 1) / 3), r = (y - 1) % 3;
    if (!wall(x, z, y)) {
      if (r === 0 && k >= 1) put(x, y, z, stone);                          // floor slab per storey
      continue;                                                             // air behind the glass
    }
    const f = faces(x, z, y);
    const corner = f.length > 1;
    const pier = (f[0][0] !== 0 ? z : x) % 3 === 0;
    if (corner) { put(x, y, z, trim); continue; }
    if (k === 0) {                                                          // shopfront and lintel
      if (r === 0 || r === 1) {
        if (x === ENT.x && z === ENT.z) {
          put(x, y, z, "iron_door", { ...DOOR, half: y === 1 ? "lower" : "upper" });
        } else put(x, y, z, pier ? trim : "black_stained_glass");
      } else put(x, y, z, x === ENT.x && z === ENT.z ? "lantern" : trim, x === ENT.x && z === ENT.z ? { hanging: "true" } : undefined);
      continue;
    }
    if (r === 0) { put(x, y, z, stone); continue; }                         // spandrel line on the floor slab
    put(x, y, z, pier ? mullion : window_);
  }
}

// Lit windows: a glowstone one block back in the air gap, in some windows of the upper storeys, and the lobby light.
for (const [key] of raw) {
  const [x, z] = key.split(",").map(Number);
  const T = top(x, z);
  for (let y = 4; y <= T - 2; y++) {
    const r = (y - 1) % 3;
    if (r === 0 || !wall(x, z, y) || (x === ENT.x && z === ENT.z)) continue;
    const f = faces(x, z, y);
    if (f.length !== 1) continue;
    const pier = (f[0][0] !== 0 ? z : x) % 3 === 0;
    if (pier || (x * 5 + z * 3 + y * 7) % 9 !== 0) continue;
    const [dx, dz] = f[0];
    const ix = x - dx, iz = z - dz;
    if (occ(ix, iz, y) && !wall(ix, iz, y)) put(ix, y, iz, "glowstone");
  }
}
put(1, 2, 13, "glowstone");

// Roof: a penthouse on the tall core (a ring of light-grey concrete, a cap), and two condenser units on the north wing.
const PH = [];
for (const [key] of raw) {
  const [x, z] = key.split(",").map(Number);
  if (x >= 2 && x <= 4 && z >= 10 && z <= 16 && top(x, z) >= 22) PH.push([x, z, top(x, z)]);
}
const inPH = (x, z) => PH.some(([px, pz]) => px === x && pz === z);
for (const [x, z, T] of PH) {
  const ring = DIRS.some(([dx, dz]) => !inPH(x + dx, z + dz));
  for (let y = T; y <= T + 1; y++) if (ring) put(x, y, z, "light_gray_concrete");
  put(x, T + 2, z, stone);
}
for (const [x, z] of [[2, 2], [4, 4]]) if (top(x, z) === 7 && !inPH(x, z)) put(x, 7, z, "light_gray_concrete");

const counts = g.save(`${FILL}/NYC1035436.nbt`);
console.log(`NYC1035436.nbt: ${counts.blocks} blocks, ${counts.palette} palette entries, tallest ${Math.max(...[...raw.keys()].map((k) => { const [x, z] = k.split(",").map(Number); return top(x, z) + 3; }))} blocks`);
