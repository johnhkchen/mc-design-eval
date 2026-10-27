// A 1970s concrete-framed office tower on a basalt plinth, Eden Terrace side of the CBD ridge: 17 storeys at its crown,
// stepping down through 15, 13, 10, 6, 3 and 2-storey wings to the east and south. Lidar roof heights are smoothed over
// 5x5 cells and snapped to storey-multiple tiers, so each tier is flat and stands on the solid column below it.
// Storey lines sit on the absolute 4-block grid so every tier's bands run level across the building.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_24252775.cells.json", "utf8"));
const W = 48, D = 44, H = 82;

const key = (x, z) => x + "," + z;
const foot = new Map();
for (const [x, z, ground, roof] of cells) foot.set(key(x, z), { ground, roof });
const inF = (x, z) => foot.has(key(x, z));

// Smooth the lidar roof over a 5x5 window of footprint cells, then snap to storey-multiple tiers (4-block storeys).
function smoothRoof(x, z) {
  let sum = 0, n = 0;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const c = foot.get(key(x + dx, z + dz)); if (c) { sum += c.roof; n++; }
  }
  return sum / n;
}
const tierTop = new Map();
for (const [k, c] of foot) {
  const [x, z] = k.split(",").map(Number);
  const s = smoothRoof(x, z);
  let t = s >= 58 ? 68 : s >= 50 ? 60 : s >= 42 ? 52 : s >= 32 ? 40 : s >= 18 ? 24 : s >= 9 ? 12 : 8;
  t = Math.max(t, Math.ceil((c.ground + 4) / 4) * 4);   // every cell keeps at least one storey above its ground
  tierTop.set(k, t);
}
const top = (x, z) => tierTop.get(key(x, z));
const grd = (x, z) => foot.get(key(x, z)).ground;

const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// a shell cell is exposed to the outside on some side: no footprint beyond it, or the neighbour's roof is below this height
const exposedSides = (x, z, y) => SIDES.filter(([dx, dz]) => !inF(x + dx, z + dz) || y >= top(x + dx, z + dz));
const isShell = (x, z, y) => y >= grd(x, z) && y < top(x, z) && exposedSides(x, z, y).length > 0;

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

const PLINTH = "polished_blackstone_bricks", FOUND = "deepslate_bricks", SPANDREL = "light_gray_concrete";
const PIER = "white_concrete", GLASS = "light_blue_stained_glass", DECK = "gray_concrete", FLOOR = "smooth_stone";

for (const [k] of foot) {
  const [x, z] = k.split(",").map(Number);
  const G = grd(x, z), T = top(x, z);
  for (let y = 0; y < T; y++) {
    if (y < G) { put(x, y, z, FOUND); continue; }
    const sides = exposedSides(x, z, y);
    if (!sides.length) {                                    // interior: air, a floor slab each storey, the roof deck
      if (y === T - 1) put(x, y, z, DECK);
      else if (y % 4 === 0 && y > G) put(x, y, z, FLOOR);
      continue;
    }
    // exposed: the facade
    if (y === T - 1) { put(x, y, z, PIER); continue; }          // cornice / parapet course
    if (y === G) { put(x, y, z, PLINTH); continue; }             // base course on the foundation
    const ground = y < 4;                                        // ground-floor band: dark stone piers, shopfront glass
    const rel = y % 4;
    const [dx] = sides[0];
    const along = dx !== 0 ? z : x;                              // rhythm runs along the face
    const pier = along % 3 === 0;
    if (rel === 0 || rel === 3) { put(x, y, z, ground ? PLINTH : SPANDREL); continue; }
    if (pier) { put(x, y, z, ground ? PLINTH : PIER); continue; }
    put(x, y, z, GLASS);
    // some windows lit: a warm block in the room behind the glass
    if ((x * 31 + y * 17 + z * 7) % 11 === 0) {
      const ix = x - sides[0][0], iz = z - sides[0][1];
      if (inF(ix, iz) && !isShell(ix, iz, y) && y >= grd(ix, iz) && y < top(ix, iz) && y % 4 !== 0)
        put(ix, y, iz, (x + z) % 2 ? "glowstone" : "shroomlight");
    }
  }
}

// Entrance: the south face (+z) on the ground floor, nearest the middle of the face; a door with a lantern over it.
const southFace = [...foot.keys()].map((k) => k.split(",").map(Number))
  .filter(([x, z]) => !inF(x, z + 1) && top(x, z) >= 12);
const midX = southFace.reduce((a, [x]) => a + x, 0) / southFace.length;
const [ex, ez] = southFace.reduce((best, c) => (Math.abs(c[0] - midX) < Math.abs(best[0] - midX) ? c : best));
const eg = grd(ex, ez);
put(ex, eg, ez, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(ex, eg + 1, ez, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
put(ex, eg + 2, ez, "lantern", { hanging: "true", waterlogged: "false" });

// Rooftop plant: a few 2-high boxes on the 52 tier, and the lift overrun on the crown.
for (const [k] of foot) {
  const [x, z] = k.split(",").map(Number);
  const T = top(x, z);
  if (T === 52 && x % 7 === 3 && z % 6 === 2 && !isShell(x, z, 51)) { put(x, T, z, SPANDREL); put(x, T + 1, z, SPANDREL); }
  if (T === 68 && x >= 20 && x <= 23 && z >= 19 && z <= 22 && !isShell(x, z, 67)) { put(x, 68, z, SPANDREL); put(x, 69, z, SPANDREL); }
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_24252775.nbt");
const tiers = {}; for (const t of tierTop.values()) tiers[t] = (tiers[t] || 0) + 1;
console.log("tiers (cells per top):", JSON.stringify(tiers));
console.log("entrance:", ex, eg, ez, "blocks:", stats.blocks, "palette:", stats.palette);
