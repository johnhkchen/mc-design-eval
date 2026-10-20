// TICC (plot 3): terrace plinth, glass hall inside a 3x3 quartz colonnade, deep overhanging roof slab, attic with
// roof plant, north annex, west and south wings, grand east stair, lit east lobby, TICC banner letters on the attic.
// Coordinates are plan.md's kit-local blocks. Every write is into air (earlier parts' cells are never touched).
import { readFileSync } from "node:fs";
import { B, plaque } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { plinth_fill, ticc_pier } from "../vocab.mjs";
import {
  COOL_LIGHT, DARK_BACKING, GRANITE, HALL_BODY, LOBBY_GLASS, PALE_QUARTZ, QUARTZ_PILLAR, ROOF_LIGHT,
  STONE_COPING, TICC_GLASS, TICC_MULLION, WARM_LIGHT,
} from "../vocab/base.mjs";

const site = JSON.parse(readFileSync(new URL("../site.json", import.meta.url), "utf8"));
const plot = site.plots.find((p) => p.name === "TICC");

// Ground level of this plot's cell at (x, z), or null off the footprint (the # cells are where we build).
function groundAt(x, z) {
  const c = Math.floor((x - plot.x0) / plot.cell), r = Math.floor((z - plot.z0) / plot.cell);
  if (r < 0 || c < 0 || r >= plot.footprint.length || c >= plot.footprint[r].length) return null;
  if (plot.footprint[r][c] !== "#") return null;
  return plot.ground[r][c];
}

// Fill a massing box column by column from each cell's ground up to y1. Walls on the box edge, `roof(x, z)` on top.
function massing(g, [x0, y0, z0, x1, y1, z1], ground, wall, roof) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const gy = ground(x, z);
    if (gy === null) continue;
    const edge = x === x0 || x === x1 || z === z0 || z === z1;
    for (let y = Math.max(y0, gy); y <= y1; y++) {
      const b = y === y1 ? roof(x, z) : edge ? wall(x, y, z) : null;
      if (b) g.set(x, y, z, b);
    }
  }
}

// Wing / annex: light concrete base course, dark glass between quartz piers every 9, a roof lit on a 12 grid.
function wingWall(gy) {
  return (x, y, z) => {
    if (y <= gy + 1) return HALL_BODY;
    return x % 9 === 0 || z % 9 === 0 ? QUARTZ_PILLAR : TICC_GLASS;
  };
}
const wingRoof = (x, z) => (x % 12 === 6 && z % 12 === 6 ? ROOF_LIGHT : HALL_BODY);

export function build(g) {
  // 1. Terrace plinth: granite fill to ground, top at y 5 so the terrace surface is y 6. The grand stair zone
  //    (x 702..713, z 48..79) is left out here: the stair builds its own steps there.
  const terraceGround = (x, z) => groundAt(x, z);
  plinth_fill(g, [598, 0, 32, 701, 5, 95], terraceGround, GRANITE);
  plinth_fill(g, [702, 0, 32, 713, 5, 47], terraceGround, GRANITE);
  plinth_fill(g, [702, 0, 80, 713, 5, 95], terraceGround, GRANITE);
  // Rim cells: full granite instead of a bottom slab, so the colonnade bases and rim lights stand on solid stone.
  for (const [x0, x1, z0, z1] of [[598, 701, 32, 95], [702, 713, 32, 47], [702, 713, 80, 95]]) {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      if (terraceGround(x, z) == null) continue;
      const rim = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => {
        const nx = x + dx, nz = z + dz;
        return nx < x0 || nx > x1 || nz < z0 || nz > z1 || terraceGround(nx, nz) == null;
      });
      if (rim) g.set(x, 5, z, GRANITE);
    }
  }

  // 2. Glass hall: black glass curtain, gray mullions every 3, transoms at 16/26/36/46, gray cap at y 56.
  //    The east lobby span (x 697, z 52..75, y 6..20) is left open for the lit lobby below.
  massing(g, [610, 6, 40, 697, 56, 87], () => 6,
    (x, y, z) => {
      if (x === 697 && z >= 52 && z <= 75 && y <= 20) return null;
      const k = x === 610 || x === 697 ? z - 40 : x - 610;
      const transom = [16, 26, 36, 46].includes(y);
      return k % 3 === 0 || transom ? TICC_MULLION : TICC_GLASS;
    },
    () => TICC_MULLION);

  // 3. East lobby: glass behind gray mullions every 4, lit ceiling row, doors left open at z 62..65.
  for (let z = 52; z <= 75; z++) {
    for (let y = 6; y <= 19; y++) {
      if (z >= 62 && z <= 65 && y <= 8) continue;
      if ((z - 52) % 4 === 0) g.set(697, y, z, TICC_MULLION);
      else g.set(697, y, z, LOBBY_GLASS);
      g.set(696, y, z, y === 19 ? WARM_LIGHT : DARK_BACKING);
    }
    g.set(697, 20, z, TICC_MULLION);
  }

  // 4. Colonnade: 3x3 quartz piers at plan centres (min corner = centre - 1), y 6..56. Corner piers shared.
  const ns = [609, 618, 627, 636, 645, 654, 663, 672, 681, 690];
  const we = [39, 48, 57, 66, 75, 84];
  const seen = new Set();
  const pier = (x, z) => {
    const key = `${x},${z}`;
    if (seen.has(key)) return;
    seen.add(key);
    ticc_pier(g, x - 1, z - 1);
  };
  for (const x of [605, 700]) for (const z of [35, 90]) pier(x, z);
  for (const x of ns) for (const z of [35, 90]) pier(x, z);
  for (const x of [605, 700]) for (const z of we) pier(x, z);

  // 5. Deep roof slab y 57..61 over the colonnade: pale fascia, recessed line at y 59, lit soffit grid at y 57.
  for (let x = 600; x <= 703; x++) for (let z = 32; z <= 95; z++) {
    const edge = x === 600 || x === 703 || z === 32 || z === 95;
    for (let y = 57; y <= 61; y++) {
      let b = PALE_QUARTZ;
      if (y === 57) b = (x - 600) % 6 === 0 && (z - 32) % 6 === 0 ? COOL_LIGHT : STONE_COPING;
      else if (y === 59 && edge) b = HALL_BODY;
      else if (y === 61 && !(x >= 606 && x <= 697 && z >= 38 && z <= 89) && (x % 12 === 0 && z % 12 === 0)) b = ROOF_LIGHT;
      g.set(x, y, z, b);
    }
  }

  // 6. Attic y 62..67 (light concrete walls, deck at 67 lit on a 12 grid), parapet 68..69 of pale stone.
  for (let x = 606; x <= 697; x++) for (let z = 38; z <= 89; z++) {
    const edge = x === 606 || x === 697 || z === 38 || z === 89;
    if (edge) for (let y = 62; y <= 66; y++) g.set(x, y, z, HALL_BODY);
    g.set(x, 67, z, x % 12 === 0 && z % 12 === 0 ? ROOF_LIGHT : HALL_BODY);
    if (edge) for (let y = 68; y <= 69; y++) g.set(x, y, z, PALE_QUARTZ);
  }

  // 7. Roof plant 630..680 x 55..72, y 68..72 (solid, stands on the attic deck), iron grille on the sides not needed.
  g.fill([630, 68, 55], [680, 72, 72], HALL_BODY);
  for (let x = 630; x <= 680; x += 12) for (let z = 55; z <= 72; z += 12) g.set(x, 72, z, ROOF_LIGHT);

  // 8. Grand stair east: climbs west from x 713 (ground) to the terrace at x 702, y 6.
  // Stair written here, not by grand_stair: its end slab ramps need 18 cells for the 5-block rise and the run has 12.
  // One granite step per cell (back to the west), the lower cells solid granite under it, flat granite at the top.
  // A cell's step surface is 2 + (713 - x), so the step at x 709 reaches the terrace at y 6 and the flat run starts at 708.
  for (let x = 702; x <= 713; x++) for (let z = 48; z <= 79; z++) {
    const rise = 2 + (713 - x);
    if (rise <= 6) {
      for (let y = 1; y < rise - 1; y++) g.set(x, y, z, GRANITE);
      g.set(x, rise - 1, z, ...B.stairs("polished_granite", "west", "bottom"));
    } else {
      for (let y = 1; y <= 5; y++) g.set(x, y, z, GRANITE);
    }
  }

  // 9. North annex (x 638..689, z 0..31, roof 28) and the west and south wings.
  massing(g, [638, 0, 0, 689, 28, 31], groundAt, (x, y, z) => wingWall(groundAt(x, z))(x, y, z), wingRoof);
  massing(g, [582, 0, 56, 597, 18, 95], groundAt, (x, y, z) => wingWall(groundAt(x, z))(x, y, z), wingRoof);
  massing(g, [610, 0, 96, 713, 16, 111], groundAt, (x, y, z) => wingWall(groundAt(x, z))(x, y, z), wingRoof);

  // 10. Terrace lights: flush sea_lantern on the plinth top on a 12 grid (ground cells only).
  for (let x = 598; x <= 713; x += 12) for (let z = 32; z <= 95; z += 12) {
    if (groundAt(x, z) !== null && !(x >= 702 && z >= 48 && z <= 79)) g.set(x, 5, z, ROOF_LIGHT);
  }

  // 11. TICC banner letters on the east attic face (x 697, hung at 698), centred z 63.
  plaque(g, "TICC", { at: [698, 62, 63], face: "east", width: 16, height: 6, material: DARK_BACKING, frame: PALE_QUARTZ });
}
