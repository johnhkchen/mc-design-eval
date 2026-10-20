import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw426070797";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 14 x 28, roof ~16 blocks above lowest ground: three storeys of ~5 blocks
// plus a 1-block parapet. Mid-rise Taipei commercial/residential block, c. 1980s:
// white tiled concrete walls, quartz pilasters, smooth stone bands, blue-tinted glazing,
// street-level shopfront with a header course and a canopy over a single entrance,
// rooftop plant box.
const W = 14, H = 28, D = 28;
const g = new Voxels([W, H, D]);

const S = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, Math.max(0, Math.min(H - 1, Math.round(gy))));
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const cxMid = (minX + maxX) / 2;

const outer = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const inCore = (x, z) => x >= 5 && x <= 8 && z >= 11 && z <= 16;

// Front = north face (z = minZ). Door sits on a window bay, off the pilaster grid.
let door = null;
{
  const cands = cells
    .filter(([x, z]) => z === minZ && !has(x, z - 1) && ((x - minX) % 3 === 1))
    .sort((a, b) => Math.abs(a[0] - cxMid) - Math.abs(b[0] - cxMid));
  if (cands.length) door = { x: cands[0][0], z: cands[0][1] };
}

// Pass 1: foundations, interior floor slabs, outer walls and facade.
for (const [x, z] of cells) {
  const gy = G(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) S(x, y, z, "stone_bricks");

  if (!outer(x, z)) {
    // Interior: floor slabs per storey (air gap is left between them).
    for (const fy of [0, 5, 10, 15]) if (fy >= gy) S(x, fy, z, "light_gray_concrete");
    continue;
  }

  // Outer wall column from ground to the parapet course.
  for (let y = gy; y <= 14; y++) S(x, y, z, "white_concrete");

  // Facade rhythm: pilasters on a 3-block grid along the wall they belong to.
  const alongX = !has(x, z - 1) || !has(x, z + 1);
  const c = alongX ? x : z;
  const c0 = alongX ? minX : minZ;
  const bay = (c - c0) % 3;

  if (bay === 0) {
    for (let y = gy; y <= 15; y++) S(x, y, z, "quartz_block");
    continue;
  }

  // Base course in stone brick at the ground, parapet cap smooth stone.
  if (gy <= 0) S(x, 0, z, "stone_bricks");
  S(x, 15, z, "smooth_stone");

  // Storey bands at 0, 5, 10: spandrel course at b, glazing rows b+1..b+3, lintel at b+4.
  for (const b of [0, 5, 10]) {
    if (b >= gy) S(x, b, z, "smooth_stone");
    for (let y = b + 1; y <= b + 3; y++) {
      if (y < gy) continue;
      // Ground-floor shopfront: glazing only to row 2, header course at row 3.
      if (b === 0 && y === 3) {
        S(x, y, z, "smooth_stone");
        continue;
      }
      S(x, y, z, "light_blue_stained_glass");
    }
  }
}

// Pass 2: entrance on the front face, canopy and lantern above the door.
if (door) {
  const { x, z } = door;
  const gy = G(x, z);
  S(x, gy, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  S(x, gy + 1, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Canopy strip across the entrance bay, carried on the header row.
  for (const dx of [-1, 0, 1]) {
    if (!has(x + dx, z)) continue;
    S(x + dx, 3, z, "black_concrete");
  }
  S(x, 2, z, "lantern", { hanging: "true", waterlogged: "false" });
}

// Pass 3: stair/lift core (structural, solid), so the slabs have support.
for (const [x, z] of cells) {
  if (outer(x, z) || !inCore(x, z)) continue;
  for (let y = G(x, z); y <= 15; y++) S(x, y, z, "stone_bricks");
}

// Pass 4: warm lights behind some glazing, sparse so they read as rhythm.
for (const [x, z] of cells) {
  if (!outer(x, z)) continue;
  const alongX = !has(x, z - 1) || !has(x, z + 1);
  const c = alongX ? x : z;
  const c0 = alongX ? minX : minZ;
  const bay = (c - c0) % 3;
  if (bay !== 1) continue;
  if (Math.floor((c - c0) / 3) % 3 !== 1) continue;

  let dx = 0, dz = 0;
  if (!has(x, z - 1)) dz = 1;
  else if (!has(x, z + 1)) dz = -1;
  else if (!has(x - 1, z)) dx = 1;
  else dx = -1;

  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || outer(ix, iz) || inCore(ix, iz)) continue;
  for (const b of [5, 10]) {
    const gy = G(x, z);
    if (b + 2 < gy) continue;
    S(ix, b + 2, iz, "glowstone");
  }
}

// Pass 5: rooftop plant box on the roof slab, clear of the parapet.
for (const [x, z] of cells) {
  if (outer(x, z)) continue;
  if (x < 3 || x > 10 || z < 6 || z > 20) continue;
  S(x, 16, z, "light_gray_concrete");
  S(x, 17, z, "light_gray_concrete");
  S(x, 18, z, "smooth_stone");
}

g.save(`${DIR}/${ID}.nbt`);
