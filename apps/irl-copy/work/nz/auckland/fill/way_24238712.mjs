// OSM way 24238712, Mt Eden / Eden Terrace side of the CBD: a six-storey concrete-frame office and apartment block of the
// 1960s-70s. A basalt plinth (Auckland's own volcanic stone), white precast piers, tinted glazing in a 4-block bay rhythm,
// smooth-stone storey bands, a gravel roof with plant, a stepped lift core, and a lobby on the uphill (north) street face.
// Heights come from the lidar roof record: most of the footprint is one flat roof at 23, the edges step down to lower
// wings (snapped to storey caps), and a 24-25 core rises over the roof. The shell is one block thick with air behind the
// glass; storey slabs run through the whole footprint.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_24238712.cells.json", "utf8"));

const FOUNDATION = "polished_basalt", SLAB = "smooth_stone", CAP = "smooth_stone", PIER = "white_concrete";
const CORE = "light_gray_concrete", GLASS = "light_blue_stained_glass", ROOF = "gravel", PLANT = "iron_block", LAMP = "glowstone";
const SLABS = [3, 7, 11, 15, 19];      // storey floor rows; each storey is the room rows above its slab (rel 1..3)
const TIERS = [7, 11, 15, 19, 23];     // wing roofs snap to the cap row of a storey (cap = tier - 1)
const MAIN = 23, CORE_FROM = 24;
const ENTRANCE = new Set(["26,0", "27,0"]);   // two-bay lobby doorway on the uphill street face

const inFoot = new Set(cells.map(([x, z]) => `${x},${z}`));
const has = (x, z) => inFoot.has(`${x},${z}`);
const exterior = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// the face a shell cell stands on (first open side), its bay coordinate u, and the cell just inside it
function face(x, z) {
  if (!has(x, z - 1)) return { u: x, inward: [x, z + 1], name: "north" };
  if (!has(x, z + 1)) return { u: x, inward: [x, z - 1], name: "south" };
  if (!has(x - 1, z)) return { u: z, inward: [x + 1, z], name: "west" };
  return { u: z, inward: [x - 1, z], name: "east" };
}

// per cell: ground g and the roof R (top of its solid, exclusive), with lidar noise snapped to flat tiers
const plan = cells.map(([x, z, g, raw]) => {
  let R, core = false;
  if (raw >= CORE_FROM) { R = raw; core = true; }
  else if (raw >= 22) R = MAIN;
  else {
    R = TIERS.reduce((b, t) => (Math.abs(t - raw) <= Math.abs(b - raw) ? t : b));   // ties go up
    while (R - g < 4 && R < MAIN) R = TIERS[TIERS.indexOf(R) + 1];                   // keep at least one storey
  }
  return { x, z, g, R, core, ext: exterior(x, z) };
});

const [X, Y, Z] = [37, 38, 44];
const g = new Voxels([X, Y, Z]);

for (const c of plan) {
  const { x, z, g: ground, R, core, ext } = c;
  const f = ext ? face(x, z) : null;
  for (let y = 0; y < R; y++) {
    const L = SLABS.filter((s) => s <= y).pop() ?? -1;   // the slab under this row (-1 = the terrain)
    const rel = y - L;                                    // 0 = slab row, 1..3 = room rows
    if (y < ground) { g.set(x, y, z, FOUNDATION); continue; }
    if (core && y >= MAIN) { g.set(x, y, z, y === R - 1 ? CAP : CORE); continue; }
    if (y === R - 1) { g.set(x, y, z, ext ? CAP : ROOF); continue; }
    if (rel === 0) { g.set(x, y, z, SLAB); continue; }
    if (!ext) continue;                                   // interior: air behind the glass
    if (rel === 3) { g.set(x, y, z, PIER); continue; }    // head over each window band
    if (ENTRANCE.has(`${x},${z}`) && (y === L + 1 || y === L + 2)) {
      g.set(x, y, z, "iron_door", {
        facing: "north", half: y === L + 1 ? "lower" : "upper", hinge: x === 26 ? "left" : "right", open: "false", powered: "false",
      });
      continue;
    }
    // the lobby: a four-bay glazed front around the doors, lit from inside
    if (ext && f.name === "north" && z === 0 && x >= 25 && x <= 28 && (y === L + 1 || y === L + 2)) {
      g.set(x, y, z, GLASS);
      if (y === L + 1 && (x === 25 || x === 28)) g.set(x, y, 1, LAMP);
      continue;
    }
    if (f.u % 4 === 0) { g.set(x, y, z, PIER); continue; }
    g.set(x, y, z, GLASS);
    // warm light in some windows: a glowstone just inside the glass, on the slab
    const [ix, iz] = f.inward;
    if (has(ix, iz) && !exterior(ix, iz) && (x * 31 + z * 17 + y * 7) % 9 === 0) g.set(ix, y, iz, LAMP);
  }
}

// roof plant on the main roof, away from the edges and the core
for (const c of plan) {
  if (c.ext || c.core || c.R !== MAIN) continue;
  if (c.x % 8 >= 3 && c.x % 8 <= 5 && c.z % 10 >= 4 && c.z % 10 <= 6) g.set(c.x, MAIN, c.z, PLANT);
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_24238712.nbt");
console.log(`way_24238712: ${plan.length} cells, ${stats.blocks} blocks, ${stats.palette} palette entries`);
