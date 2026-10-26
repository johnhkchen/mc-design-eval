// DC77149: a three-storey Beaux-Arts office block in pale limestone (calcite, quartz trim) with a one-block
// central pavilion, a granite-grey plinth and a three-high entrance annex on the south front. Storeys are 3 blocks
// (about 7 m at 0.42), the parapet tops the lidar's 11, the pavilion its 12. Lidar 11/12 noise is smoothed to one
// main roof and a pavilion box (x3..5, z5..8), the lidar 3 is kept as the annex. No interiors: air behind every pane,
// a floor string course per storey, glowstone in some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC77149.cells.json", "utf8"));
const H = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));
const has = (x, z) => H.has(`${x},${z}`);
const PAV = (x, z) => x >= 3 && x <= 5 && z >= 5 && z <= 8;
// the height each cell is built to (top = number of blocks from y 0)
const T = (x, z) => (!has(x, z) ? 0 : H.get(`${x},${z}`) <= 4 ? 3 : PAV(x, z) ? 12 : 11);

const DIRS = [[0, -1, "N"], [0, 1, "S"], [1, 0, "E"], [-1, 0, "W"]];
// the faces of a footprint cell that stand free at height y: the neighbour is outside the footprint or lower than y
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => T(x + dx, z + dz) <= y);

const WALL = "calcite", STRING = "smooth_quartz", PIER = "quartz_pillar", PLINTH = "polished_andesite";
const HVAC = [[1, 8], [2, 8], [8, 8]];
const PAV_GLASS = { "4,5": "N", "4,8": "S", "3,6": "W", "3,7": "W", "5,6": "E", "5,7": "E" };
const pane = (d) => (d === "N" || d === "S"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const crossPane = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

const g = new Voxels([11, 24, 12]);
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const t = T(x, z);
  g.set(x, 0, z, PLINTH);

  if (t === 3) {
    // entrance annex: a glazed shopfront over the plinth, a cornice cap
    const ex = exposed(x, z, 1);
    g.set(x, 1, z, "glass_pane", ex.length > 1 ? crossPane : pane(ex[0][2]));
    g.set(x, 2, z, STRING);
    continue;
  }

  // ground, second and third storeys: 2-high openings between the string courses
  for (const [lo, hi] of [[1, 2], [4, 5], [7, 8]]) for (let y = lo; y <= hi; y++) {
    if (x === 5 && z === 11 && y <= 2) {
      // the entrance door, centred on the south front
      g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const ex = exposed(x, z, y);
    if (!ex.length) continue;
    if (ex.length > 1) { g.set(x, y, z, PIER); continue; }
    const [dx, dz, d] = ex[0];
    const along = d === "N" || d === "S" ? x : z;
    if (along % 2 === 0) { g.set(x, y, z, WALL); continue; }
    g.set(x, y, z, "glass_pane", pane(d));
    // warm light behind some panes: glowstone in the air gap inside the glass, on the band's lower row
    const ix = x - dx, iz = z - dz;
    if (y === lo && (x + z) % 3 === 0 && T(ix, iz) > y && !exposed(ix, iz, y).length) g.set(ix, y, iz, "glowstone");
  }

  // the string courses and the roof deck under the parapet, floors of the upper storeys
  for (const y of [3, 6, 9]) if (t > y) g.set(x, y, z, STRING);

  if (PAV(x, z)) {
    // the pavilion's own faces: its neighbours are the main roof, so faces are judged against the pavilion box
    const pex = DIRS.filter(([dx, dz]) => !PAV(x + dx, z + dz));
    const key = `${x},${z}`;
    if (pex.length > 1) g.set(x, 10, z, PIER);
    else if (PAV_GLASS[key]) g.set(x, 10, z, "glass_pane", pane(PAV_GLASS[key]));
    else if (pex.length === 1) g.set(x, 10, z, WALL);
    g.set(x, 11, z, STRING);
  } else {
    // the main parapet on the footprint's edge
    const ex = exposed(x, z, 10);
    if (ex.length > 1) g.set(x, 10, z, PIER);
    else if (ex.length === 1) g.set(x, 10, z, WALL);
    else if (HVAC.some(([hx, hz]) => hx === x && hz === z)) g.set(x, 10, z, "smooth_stone");
  }
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC77149.nbt");
console.log(JSON.stringify(stats));
