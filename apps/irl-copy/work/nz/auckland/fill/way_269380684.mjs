// KnK Architectural Hardware, Mt Eden / Eden Terrace fringe (way 269380684). Read from the lidar record: a 1960s-70s
// commercial block, four storeys of rendered concrete on a volcanic basalt base, a glazed shopfront with a red KnK
// fascia on the street face, a setback top storey, a lower two-storey wing to the south and a stair core that rises a
// storey and a half above the main roof. Columns are built from the lidar tiers, so every storey sits on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269380684.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269380684.nbt";
const g = new Voxels([23, 31, 36]);

const key = (x, z) => x * 64 + z;
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];          // N, E, S, W: a corner's face is read in this order
const onFootprint = new Set(cells.map(([x, z]) => key(x, z)));
const inside = (x, z) => onFootprint.has(key(x, z));

// Steps from the outside: 1 on the outer edge, 2 one in, and so on (the setback is measured from it)
const dist = new Map(), queue = [];
for (const [x, z] of cells) if (DIRS.some(([dx, dz]) => !inside(x + dx, z + dz))) { dist.set(key(x, z), 1); queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = dist.get(key(x, z));
  for (const [dx, dz] of DIRS) if (inside(x + dx, z + dz) && !dist.has(key(x + dx, z + dz))) { dist.set(key(x + dx, z + dz), d + 1); queue.push([x + dx, z + dz]); }
}

// Lidar roof height -> a clean tier (top is exclusive, its top block is the parapet or cornice):
// the 10-block south wing -> 11; the main roof at 15-16 -> 16; the 17-18 stair core -> 19 (the brief's ~19).
const tierOf = (r) => (r <= 11 ? 11 : r >= 17 ? 19 : 16);
const col = new Map();
for (const [x, z, gc, r] of cells) {
  const d = dist.get(key(x, z)), t = tierOf(r);
  // the top storey is set back two cells from the outer edge of the main block; the ring below becomes a terrace
  const ring = t === 16 && d <= 2;
  col.set(key(x, z), { x, z, gc, d, ring, T: ring ? (d === 1 ? 13 : 12) : t });
}
const topAt = (x, z) => (col.has(key(x, z)) ? col.get(key(x, z)).T : 0);

function lightBehind(c, y, dx, dz, block) {
  // the cell just inside the wall, in the air gap behind the glass
  const ix = c.x - dx, iz = c.z - dz;
  if (!inside(ix, iz) || topAt(ix, iz) <= y) return;
  if (DIRS.some(([ax, az]) => topAt(ix + ax, iz + az) <= y)) return;   // not against the outside
  g.set(ix, y, iz, block);
}

function wall(c, y, ex) {
  const { x, z, gc, T, d, ring } = c;
  const [dx, dz] = ex[0];
  if (y === T - 1) {
    if (ring && d === 1) return g.set(x, y, z, "stone_brick_wall");          // terrace parapet
    return g.set(x, y, z, "smooth_stone");                                    // cornice
  }
  // bays four blocks wide: piers at 0 and 3 of each bay, glazing at 1 and 2; along a north or south face the bay runs in x
  const u = dz !== 0 ? x : z, p = ((u % 4) + 4) % 4, glass = p === 1 || p === 2;
  const pane = () => g.set(x, y, z, "light_blue_stained_glass_pane", dz !== 0
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" });
  const lit = (x * 7 + y * 3 + z * 5) % 6 === 0;
  if (y < 4) {                                                                 // the ground storey: shopfront
    if (y === 3) return g.set(x, y, z, ex.some(([, b]) => b === -1) ? "red_concrete" : "black_concrete");   // KnK fascia
    if (y === gc && gc <= 1) return g.set(x, y, z, "polished_basalt");        // base course
    if (!glass) return g.set(x, y, z, "black_concrete");
    pane();
    if (lit) lightBehind(c, y, dx, dz, "glowstone");
    return;
  }
  if (y === gc && gc >= 4) return g.set(x, y, z, "polished_basalt");          // base course on the lower south side
  if (y % 4 === 0 || y % 4 === 3) return g.set(x, y, z, "light_gray_concrete"); // spandrel and header bands
  if (!glass) return g.set(x, y, z, "white_concrete");
  pane();
  if (lit) lightBehind(c, y, dx, dz, (x + y + z) % 2 ? "shroomlight" : "glowstone");
}

for (const c of col.values()) {
  const { x, z, gc, T, ring } = c;
  for (let y = 0; y < gc; y++) g.set(x, y, z, "polished_basalt");           // foundation, hidden under the ground
  for (let y = gc; y < T; y++) {
    const ex = DIRS.filter(([dx, dz]) => topAt(x + dx, z + dz) <= y);
    if (ex.length) wall(c, y, ex);
    else if (y === T - 1) g.set(x, y, z, ring ? "stone_bricks" : "gray_concrete");   // roof membrane, or terrace
    else if (y % 4 === 0 && y > 0) g.set(x, y, z, "light_gray_concrete");          // floor slab per storey
  }
}

// The entrance: a dark-oak door in the north face at the lowest ground corner, under the red fascia
g.set(9, 1, 0, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(9, 2, 0, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });

// Roof plant: 2x2 condenser units on the main roof, clear of the setback
for (const c of col.values()) {
  if (c.T !== 16 || c.ring || c.d < 4 || c.x % 6 !== 2 || c.z % 6 !== 2) continue;
  const four = [[c.x, c.z], [c.x + 1, c.z], [c.x, c.z + 1], [c.x + 1, c.z + 1]];
  if (four.every(([x, z]) => topAt(x, z) === 16)) for (const [x, z] of four) g.set(x, 16, z, "iron_block");
}

// Terrace planting: oak leaves on the setback ring (above its terrace, clear of the parapet)
for (const c of col.values()) if (c.ring && c.d === 2 && (c.x + c.z) % 3 === 0) g.set(c.x, c.T, c.z, "oak_leaves", { distance: "7", persistent: "true" });

const { blocks, palette } = g.save(OUT);
console.log(`way_269380684: ${blocks} blocks, palette ${palette}`);
