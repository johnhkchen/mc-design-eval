// 1702 14th St NW, Public Service: a 1920s-30s civic block in red brick with white stone trim, a 4-storey podium
// (roof 12) on the north and flanks, a 5-storey tower core (roof 15) across the south front, and a one-storey wing
// on the west (roof 3). Hollow: 1-block shell, a floor slab per storey, air between, so the glass has air behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC53987.cells.json", "utf8"));
const W = 18, D = 10, H = 27;
const g = new Voxels([W, H, D]);

// lidar roof -> three clean tiers: wing 3, podium 12, tower core 15; a lone tall cell drops to the podium
const raw = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));
const rawAt = (x, z) => raw.get(`${x},${z}`) ?? 0;
const inFp = (x, z) => x >= 0 && x < W && z >= 0 && z < D;
const DIRS = [[0, -1, "z"], [0, 1, "z"], [-1, 0, "x"], [1, 0, "x"]];
const tier = (x, z) => {
  const r = rawAt(x, z);
  if (r <= 4) return 3;
  const near = (lo) => DIRS.filter(([dx, dz]) => inFp(x + dx, z + dz) && rawAt(x + dx, z + dz) >= lo).length;
  // a lone podium or tower column among wing cells reads as the wing
  if (r < 14) return near(8) ? 12 : 3;
  return near(14) >= 2 ? 15 : near(8) ? 12 : 3;
};
const T = Array.from({ length: W }, () => new Array(D).fill(0));
for (const [x, z] of cells.map(([x, z]) => [x, z])) T[x][z] = tier(x, z);
const hAt = (x, z) => (inFp(x, z) ? T[x][z] : 0);
// a rim cell has a lower neighbour (or the footprint edge): its column is solid wall, faces get the facade
const rim = (x, z) => DIRS.some(([dx, dz]) => hAt(x + dx, z + dz) < hAt(x, z));
const pierZ = (x) => x % 3 === 0 || x <= 1 || x >= 16;   // on the north/south faces, by column
const pierX = (z) => z % 3 === 0 || z <= 1 || z >= 8;    // on the east/west faces, by row of cells

const BRICK = "bricks", TRIM = "smooth_quartz", PLINTH = "stone_bricks", FLOOR = "polished_andesite";
const PANE = (axis) => (axis === "z"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

const lit = [];   // interior cells to light behind glass, after the shell
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const h = hAt(x, z); if (!h) continue;
  if (!rim(x, z)) {
    // hollow interior: a floor per storey (every 3rd row), a deck (roof) on top, air between
    for (let y = 0; y < h; y++) {
      if (y === 0 || (y % 3 === 0 && y < h - 1)) g.set(x, y, z, FLOOR);
      else if (y === h - 1) g.set(x, y, z, h === 15 ? "oxidized_cut_copper" : "smooth_stone");
    }
    continue;
  }
  // rim: a solid column, faced by exposure (a face is open if its neighbour is air at that row)
  for (let y = 0; y < h; y++) {
    const open = DIRS.filter(([dx, dz]) => hAt(x + dx, z + dz) <= y);
    const zOpen = open.some(([, dz]) => dz !== 0), xOpen = open.some(([dx]) => dx !== 0);
    if (y === 0) { g.set(x, y, z, PLINTH); continue; }               // plinth course
    if (y === h - 1 || y % 3 === 0) { g.set(x, y, z, TRIM); continue; }  // cornice and storey lines
    if (!open.length) { g.set(x, y, z, BRICK); continue; }
    if (zOpen && xOpen) { g.set(x, y, z, TRIM); continue; }          // quoin at the corner
    const axis = zOpen ? "z" : "x";
    const pier = axis === "z" ? pierZ(x) : pierX(z);
    if (pier) { g.set(x, y, z, TRIM); continue; }
    g.set(x, y, z, "glass_pane", PANE(axis));
    if (y >= 3) {
      const [dx, dz] = open.find(([, , a]) => a === axis);
      lit.push([x - dx, y, z - dz, x, y]);
    }
  }
}

// warm light behind some panes, in the air gap (glowstone on the upper storeys)
for (const [ix, y, iz, x] of lit) {
  if (inFp(ix, iz) && !rim(ix, iz) && hAt(ix, iz) > y && (x + y) % 4 === 0) g.set(ix, y, iz, "glowstone");
}

// entrance on the north street front (the sheet's front): double doors under a lintel, lanterns either side
const door = (half, hinge) => ({ facing: "north", half, hinge, open: "false", powered: "false" });
for (const [x, hinge] of [[8, "left"], [9, "right"]]) {
  g.set(x, 1, 0, "dark_oak_door", door("lower", hinge));
  g.set(x, 2, 0, "dark_oak_door", door("upper", hinge));
}
g.set(7, 1, 0, "lantern", { hanging: "false" });
g.set(10, 1, 0, "lantern", { hanging: "false" });

// roof plant on the podium deck (y 12), and a lightning rod on the tower
for (const [x, z] of [[14, 2], [15, 2], [14, 3], [15, 3]]) {
  if (hAt(x, z) === 12 && !rim(x, z)) g.set(x, 12, z, "light_gray_concrete");
}
g.set(9, 15, 4, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC53987.nbt";
console.log(g.save(out));
