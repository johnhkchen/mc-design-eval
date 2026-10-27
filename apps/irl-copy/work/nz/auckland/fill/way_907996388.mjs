// U Convenience Store, Eden Terrace side of Maungawhau: a 1950s-60s rendered-concrete shop block, a ground-floor
// shopfront under a red fascia, storey string courses, and a three-storey tower on a two-storey and single-storey body.
// Lidar roof heights are snapped to four tiers (5, 8, 12, 15 blocks: single storey, two, three, and a tall corner) so the
// massing reads as clean flat tiers; every tier stands on the foundation under it.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_907996388.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_907996388.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

const W = 12, H = 27, D = 19;
const g = new Voxels([W, H, D]);

// lidar roof height -> tier top (absolute y, exclusive: solid up to tier-1)
const tierOf = (r) => (r >= 13 ? 15 : r >= 10 ? 12 : r >= 7 ? 8 : 5);
const cellMap = new Map();
for (const [x, z, ground, roof] of cells) cellMap.set(`${x},${z}`, { g: ground, T: tierOf(roof) });
const at = (x, z) => cellMap.get(`${x},${z}`);
const DIRS = [{ n: "N", dx: 0, dz: -1 }, { n: "S", dx: 0, dz: 1 }, { n: "W", dx: -1, dz: 0 }, { n: "E", dx: 1, dz: 0 }];
const nbrs = (x, z) => DIRS.map((d) => ({ ...d, c: at(x + d.dx, z + d.dz) }));

// the entrance: the south face, a window-type bay
const DOOR = { x: 4, z: 18 };

const shellOf = new Map(), facesOf = new Map();
for (const [x, z, , ] of cells) {
  const c = at(x, z), ns = nbrs(x, z);
  const exts = ns.filter((d) => !d.c);                                     // the street-side faces
  const steps = ns.some((d) => d.c && d.c.T < c.T);                       // a lower tier beside: a visible step, a solid wall
  shellOf.set(`${x},${z}`, exts.length > 0 || steps);
  facesOf.set(`${x},${z}`, exts);
}

// the bay pattern on a shell cell: piers on every third cell along its street face, windows between; corners are piers
const isWindowBay = (x, z) => {
  const ex = facesOf.get(`${x},${z}`);
  if (ex.length !== 1) return false;
  const idx = ex[0].n === "N" || ex[0].n === "S" ? x : z;
  return idx % 3 !== 0;
};

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const c = at(x, z), shell = shellOf.get(`${x},${z}`);
  const win = shell && isWindowBay(x, z);
  const isDoor = x === DOOR.x && z === DOOR.z;
  for (let y = 0; y < c.T; y++) {
    const cap = c.T - 1;
    let b = null, st;
    if (y < c.g) b = "stone_bricks";                                        // foundation under the ground
    else if (y === c.g) b = shell ? "stone_bricks" : "smooth_stone";        // plinth / floor plate
    else if (y === cap) b = shell ? "light_gray_concrete" : "gray_concrete"; // cornice / roof
    else if (!shell) b = y % 4 === 0 ? "smooth_stone" : null;               // interior: floor slabs, air between
    else if (isDoor && (y === c.g + 1 || y === c.g + 2)) {                   // the entrance, glazed door
      b = "oak_door"; st = { facing: "south", half: y === c.g + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
    }
    else if (y === (c.g === 0 ? 3 : 4) && z === D - 1) b = "red_concrete";  // shopfront fascia along the street face
    else if (y % 4 === 0 && y > 0) b = "light_gray_concrete";              // storey string course
    else if (y < 4) {                                                       // the ground storey
      if (y === 3 && c.g === 0) b = "white_concrete";                        // transom
      else b = win ? "glass" : "white_concrete";
    }
    else if (y % 4 === 3) b = "white_concrete";                             // spandrel under each window
    else b = win ? "light_blue_stained_glass" : "white_concrete";           // upper-storey window or pier
    if (b) g.set(x, y, z, b, st);
  }
}

// warm lights behind some glass: a glowstone in the room behind the window (interior air cell)
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const c = at(x, z), ex = facesOf.get(`${x},${z}`);
  if (!shellOf.get(`${x},${z}`) || !isWindowBay(x, z) || ex.length !== 1) continue;
  const d = ex[0], ix = x - d.dx, iz = z - d.dz, inner = at(ix, iz);
  if (!inner || shellOf.get(`${ix},${iz}`)) continue;
  for (const y of [5, 9, 13]) {
    if (y >= c.T - 1 || y % 4 === 0 || (x * 5 + z * 3 + y) % 7 !== 0) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// roof plant: boxes on the tall tier's roof, standing on the cap
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const c = at(x, z);
  if (c.T !== 15 || shellOf.get(`${x},${z}`) || x % 4 !== 1 || z % 4 !== 1) continue;
  g.set(x, 15, z, "light_gray_concrete"); g.set(x, 16, z, "light_gray_concrete");
}

g.save(OUT);
console.log(`saved ${OUT}: ${g.count()} blocks, ${g.palette.length - 1} distinct`);
