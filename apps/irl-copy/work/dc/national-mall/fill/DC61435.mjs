// DC61435: the Museum of Illusions, 9th St NW, Penn Quarter. Read from the record as a c.1910 Beaux-Arts commercial block:
// red brick walls, limestone (calcite) belt courses and cornice, granite bulkheads, dark-wood shopfronts at street level.
// Storeys are 2 blocks (the least that gives a window row and a belt at 0.42 blocks/m), so the lidar roofs read as
// 4-, 5-, 7- and 8-storey tiers: a 6-high glazed light court, an 8-high wing, a 10-high wing on the west side, a 14-high
// ring and a 16-high core with a 1-block parapet (17 over y 0, the lidar's ~17). Setbacks follow the lidar: a face that
// rises past its lower neighbour takes its wall from one row under that neighbour's roof, so every wall course stands on
// the storey below. Interiors are air behind the glass with a floor slab per storey; a few windows have glowstone behind them.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC61435.cells.json", "utf8"));

const g = new Voxels([26, 29, 18]);
const lidarAt = new Map(), groundAt = new Map();
for (const [x, z, gr, roof] of cells) { lidarAt.set(`${x},${z}`, roof); groundAt.set(`${x},${z}`, gr); }

// lidar roof -> smoothed flat tier (even, so every storey is two rows and the cap sits on a belt)
const tierOf = (r) => (r <= 6 ? 6 : r <= 9 ? 8 : r <= 12 ? 10 : r <= 15 ? 14 : 16);
const topAt = (x, z) => (lidarAt.has(`${x},${z}`) ? tierOf(lidarAt.get(`${x},${z}`)) : undefined);

const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const OPP = { N: "S", S: "N", E: "W", W: "E" };

// the faces of cell (x, z) that are exterior at row y: off the footprint, or the neighbour's roof is at or below y+1
// (one row under a neighbour's roof is already wall, so the rising face is carried down onto the storey floor beneath it)
function exposed(x, z, y) {
  const out = [];
  for (const d of ["N", "S", "E", "W"]) {
    const [dx, dz] = DIRS[d];
    const t = topAt(x + dx, z + dz);
    if (t === undefined || t <= y + 1) out.push(d);
  }
  return out;
}

// the entrances: a door in the west face at ground level, with a black marquee over it on the belt
const ENTRANCES = [{ x: 5, z: 6 }, { x: 0, z: 10 }];
const doorAt = (x, z) => ENTRANCES.some((e) => e.x === x && e.z === z);
const marqueeAt = (x, z) => ENTRANCES.some((e) => Math.abs(e.z - z) <= 1 && e.x === x);

for (const [x, z, gr, roof] of cells) {
  const T = tierOf(roof);
  const atrium = T === 6;
  // the lowest course is the foundation below the cell's ground, then the storeys from there up to the cap
  for (let y = 0; y < T; y++) {
    if (y < gr) { g.set(x, y, z, "stone_bricks"); continue; }
    const ex = exposed(x, z, y);

    if (y === T - 1) {                                       // the cap: cornice on the outside, roof surface inside
      if (ex.length) g.set(x, y, z, "calcite");
      else g.set(x, y, z, atrium ? "glass" : "smooth_stone");
      continue;
    }
    if (!ex.length) {                                        // interior: a floor slab each storey, air behind the glass
      if (y % 2 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }

    // exterior wall rows
    if (y % 2 === 0) {                                       // belt courses; the ground row is the granite bulkhead
      if (y === 0) {
        if (doorAt(x, z)) g.set(x, y, z, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
        else g.set(x, y, z, "polished_granite");
      } else if (y === 2 && marqueeAt(x, z)) g.set(x, y, z, "dark_oak_planks");
      else g.set(x, y, z, "calcite");
      continue;
    }
    if (y === 1 && doorAt(x, z)) { g.set(x, y, z, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }

    // window rows: piers at corners and every third bay, panes between; the ground row is the shopfront
    const corner = ex.length >= 2;
    const bay = ex.includes("N") || ex.includes("S") ? x : z;
    const pier = corner || bay % 3 === 0;
    if (pier) { g.set(x, y, z, y === 1 ? "dark_oak_planks" : "bricks"); continue; }
    if (y === 1) g.set(x, y, z, "glass");
    else {
      const ns = ex.includes("N") || ex.includes("S");
      g.set(x, y, z, "glass_pane", ns ? { north: "false", south: "false", east: "true", west: "true" }
                                       : { north: "true", south: "true", east: "false", west: "false" });
    }
    // warm light: glowstone on the far side of some panes, where the room behind is interior air
    const d = ex[0], [dx, dz] = DIRS[OPP[d]];
    if ((x * 7 + z * 3 + y) % 11 === 0 && exposed(x + dx, z + dz, y).length === 0) g.set(x + dx, y, z + dz, "glowstone");
  }

  // a 1-block parapet over the core where the lidar reads 17
  if (roof >= 17 && exposed(x, z, T - 1).length) g.set(x, T, z, "calcite");
}

// roof plant on the interior of the 14 and 16 tiers: a few iron blocks on the cap
for (const [x, z, , roof] of cells) {
  const T = tierOf(roof);
  if ((T === 14 || T === 16) && exposed(x, z, T - 1).length === 0 && x % 6 === 3 && z % 5 === 2) g.set(x, T, z, "iron_block");
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC61435.nbt";
const stats = g.save(out);
console.log(JSON.stringify(stats));
