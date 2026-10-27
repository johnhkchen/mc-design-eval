// Microsoft House, a 1990s concrete-framed office block on the CBD ridge: a two-storey stone podium with shopfront glass at
// street level under an eight-storey tower of blue glass and white piers, its edge wings stepped down to seven storeys.
// Lidar roof heights (29 to 31 above the lowest ground, with a little lower at the edge) are smoothed over 5x5 cells and
// snapped to two flat tiers, 32 and 28 blocks (4-block storeys), so each tier stands on the solid column below it.
// Storey lines sit on the absolute 4-block grid so every tier's bands run level across the building.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_28737286.cells.json", "utf8"));
const W = 66, D = 71, H = 44;
const PODIUM_TOP = 8;                                   // the two-storey podium runs under every tier

const key = (x, z) => x + "," + z;
const foot = new Map();
for (const [x, z, ground, roof] of cells) foot.set(key(x, z), { ground, roof });
const inF = (x, z) => foot.has(key(x, z));

// Smooth the lidar roof over a 5x5 window of footprint cells, then snap to the two tiers (and the 20 low end, if any).
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
  let t = s >= 30 ? 32 : s >= 26 ? 28 : 20;
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

const FOUND = "deepslate_bricks", BASE = "polished_andesite", STONE = "stone_bricks";   // foundation, base course, podium
const PIER = "white_concrete", SPANDREL = "light_gray_concrete", GLASS = "light_blue_stained_glass";
const DECK = "gray_concrete", FLOOR = "smooth_stone", PARAPET = "white_concrete";

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
    if (y === T - 1) { put(x, y, z, PARAPET); continue; }       // cornice / parapet course
    if (y === G) { put(x, y, z, BASE); continue; }              // base course on the foundation
    const podium = y < PODIUM_TOP, ground = y < 4;              // stone podium below 8, shopfront glass at street level
    const rel = y % 4;
    const [dx] = sides[0];
    const along = dx !== 0 ? z : x;                             // rhythm runs along the face
    const pier = along % 3 === 0;
    if (rel === 0 || rel === 3) { put(x, y, z, podium ? STONE : SPANDREL); continue; }
    if (pier) { put(x, y, z, podium ? BASE : PIER); continue; }
    put(x, y, z, GLASS);
    // some windows lit: a warm block in the room behind the glass
    if ((x * 31 + y * 17 + z * 7) % 11 === 0) {
      const ix = x - sides[0][0], iz = z - sides[0][1];
      if (inF(ix, iz) && !isShell(ix, iz, y) && y >= grd(ix, iz) && y < top(ix, iz) && y % 4 !== 0)
        put(ix, y, iz, (x + z) % 2 ? "glowstone" : "shroomlight");
    }
  }
}

// Entrance: the south face (+z), nearest the middle of the face: a double-height door, with a flush stone lintel over it
// (the footprint leaves no room for a canopy to project, so the canopy is the lintel band across the entrance bay).
const southFace = [...foot.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => !inF(x, z + 1));
const midX = southFace.reduce((a, [x]) => a + x, 0) / southFace.length;
const [ex, ez] = southFace.reduce((best, c) => (Math.abs(c[0] - midX) < Math.abs(best[0] - midX) ? c : best));
const eg = grd(ex, ez);
put(ex, eg, ez, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(ex, eg + 1, ez, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let x = ex - 2; x <= ex + 2; x++) {
  if (inF(x, ez) && !inF(x, ez + 1) && eg + 2 >= grd(x, ez)) put(x, eg + 2, ez, "stone_brick_slab", { type: "top", waterlogged: "false" });
}
put(ex - 1, eg + 1, ez, "lantern", { hanging: "false", waterlogged: "false" });   // lit bays either side of the door
put(ex + 1, eg + 1, ez, "lantern", { hanging: "false", waterlogged: "false" });

// Roof: plant boxes on the 32 tier and the 28 wings, a lift overrun on the crown, all off the parapet edge.
for (const [k] of foot) {
  const [x, z] = k.split(",").map(Number);
  const T = top(x, z);
  if (T === 32 && x % 9 === 4 && z % 8 === 3 && !isShell(x, z, 31)) { put(x, 32, z, SPANDREL); put(x, 33, z, SPANDREL); }
  if (T === 28 && x % 6 === 2 && z % 7 === 3 && !isShell(x, z, 27)) { put(x, 28, z, SPANDREL); }
  if (T === 32 && x >= 28 && x <= 33 && z >= 28 && z <= 33 && !isShell(x, z, 31)) { put(x, 32, z, PIER); put(x, 33, z, GLASS); }
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_28737286.nbt");
const tiers = {}; for (const t of tierTop.values()) tiers[t] = (tiers[t] || 0) + 1;
console.log("tiers (cells per top):", JSON.stringify(tiers));
console.log("entrance:", ex, eg, ez, "blocks:", stats.blocks, "palette:", stats.palette);
