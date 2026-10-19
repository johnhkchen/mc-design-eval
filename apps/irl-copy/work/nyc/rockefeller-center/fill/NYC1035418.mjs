// 19 East 47th Street (1930): a 15-storey limestone-and-glass Art Deco block stepping down to a low north wing.
// Lidar roof per cell, cleaned into tiers; the footprint's open courts (roof 0) stay open.
// Every column is solid at its storey floors and ceilings, so each setback sits on what is below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1035418.cells.json`, "utf8"));
const W = 9, D = 26, Y = 59;

const GLASS = "light_gray_stained_glass";
const lidar = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));

// Cleaned tiers (blocks above y 0): a 6-high north wing, setbacks at 21, 27, 30 and 39, the 45 slab,
// and a 48 tower core on the west side. Lidar noise (+-3) is smoothed into storey multiples of 3.
const tier = (x, z) => {
  if (z <= 2 && x <= 3) return 6;
  if (z === 3 && x <= 5) return 21;
  if (z === 4 && x <= 5) return 27;
  if (z === 5) return x === 0 ? 21 : 30;
  if (z === 6) return 39;
  if (x <= 2 && z >= 11 && z <= 21) return 48;
  return 45;
};
// Roof 0 in the lidar is an open court inside the footprint: no building there.
const H = (x, z) => (x < 0 || z < 0 || x >= W || z >= D || !(lidar.get(`${x},${z}`) > 0) ? 0 : tier(x, z));

// Which sides of cell (x, z) at height y are open to air (a neighbour that does not reach y).
const DIRS = [["x-", -1, 0], ["x+", 1, 0], ["z-", 0, -1], ["z+", 0, 1]];
const faces = (x, z, y) => DIRS.filter(([, dx, dz]) => H(x + dx, z + dz) <= y).map(([f]) => f);

// Facade: granite base, cut-stone storey lines, smooth-stone piers on a 4-block bay, glass windows between.
const wall = (x, y, z, f) => {
  if (y === 0) return "polished_granite";
  if (y % 3 === 0) return "cut_sandstone";
  const along = f.some((s) => s[0] === "z") ? x : z;     // street-facing (z) faces read across x, the rest across z
  return along % 4 === 0 ? "smooth_sandstone" : GLASS;
};

const g = new Voxels([W, Y, D]);
const warm = ["glowstone", "glowstone", "shroomlight"];

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const h = H(x, z);
  if (!h) continue;
  const tower = h === 48;
  for (let y = 0; y < h; y++) {
    const f = faces(x, z, y);
    // Entrance on the south (z 25) face: granite surround, a dark oak door, lobby glass either side.
    if (z === D - 1 && y >= 1 && y <= 3 && x >= 2 && x <= 6) {
      if (y === 3) g.set(x, y, z, "polished_granite");
      else if (x === 4) g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      else if (x === 3 || x === 5) g.set(x, y, z, GLASS);
      else g.set(x, y, z, "polished_granite");
      continue;
    }
    if (y === h - 1) {                                           // roof: a parapet on the edges, the deck inside
      g.set(x, y, z, f.length ? (tower ? "gold_block" : "chiseled_sandstone") : "smooth_stone");
      continue;
    }
    if (f.length) {                                              // the envelope
      const b = wall(x, y, z, f);
      g.set(x, y, z, b);
      // Warm light behind some glass: the cell just inside, on the storey floor.
      if (b === GLASS && y % 3 === 1 && (x * 7 + z * 3 + y) % 5 === 0) {
        const [, dx, dz] = DIRS.find(([s]) => s === f[0]);
        const ix = x - dx, iz = z - dz;
        if (H(ix, iz) > y && faces(ix, iz, y).length === 0) g.set(ix, y, iz, warm[(x + z + y) % warm.length]);
      }
      continue;
    }
    // Interior: solid floor and ceiling per storey, a one-block air gap behind the glass.
    if (y % 3 === 1 && y < h - 2) continue;
    g.set(x, y, z, "smooth_stone");
  }
}

// Lobby lights behind the entrance glass.
g.set(3, 1, D - 2, "glowstone");
g.set(5, 1, D - 2, "glowstone");

// Roof plant: a 3-storey penthouse on the 45 slab, a glass band at mid-height, a cut-stone cap.
for (let z = 9; z <= 12; z++) for (let x = 3; x <= 5; x++) {
  const edge = x === 3 || x === 5 || z === 9 || z === 12;
  g.set(x, 45, z, "smooth_sandstone");
  g.set(x, 46, z, edge ? GLASS : "smooth_sandstone");
  g.set(x, 47, z, "cut_sandstone");
}

const out = g.save(`${dir}/NYC1035418.nbt`);
console.log(JSON.stringify({ size: g.size, ...out }));
