// Part 6, final check (lamplighter): runs last, after every other part, so it sees the whole build.
// 1. Reports what the parts left outside the rules: blocks above their plot's max y, blocks outside the plots, and panes
//    whose connection states do not match their neighbours. Earlier parts' cells are locked, so these are reported, not fixed.
// 2. Lights every sky-exposed walkable surface that no lamp reaches: a standing lantern on the air cell above it, placed
//    greedily so each walkable cell has a light source within 7 blocks (light 8+, so no mob spawns and nothing reads dark).
//    Only air cells are written, so nothing an earlier part built is touched.
import { PLOT_ORIGIN, PLOT_SIZE, PLOT_MAX_Y, onLot } from "../vocab/base.mjs";

const LAMP_RE = /^(ochre_froglight|lantern|soul_lantern|sea_lantern|glowstone|jack_o_lantern|shroomlight|end_rod|campfire|soul_campfire|candle|redstone_lamp|torch|wall_torch)$/;
const LIT_ONLY = new Set(["campfire", "soul_campfire", "candle", "redstone_lamp"]);
// blocks a standing lantern cannot sit on: thin, open or non-sturdy blocks
const NO_SUPPORT_RE = /pane|slab|stair|fence|door|trapdoor|bars|lantern|candle|flower|poppy|allium|cornflower|daisy|tulip|gravel|path|carpet|torch|rod|sign|banner|chain|wall|pressure|button|sapling|fern|vine|azalea$|^grass$|^lever|^tripwire|^ladder/;
const LAMP_RADIUS = 7; // Manhattan blocks: light 15 at the lamp, 8 at 7 blocks away

const short = (id) => id.replace("minecraft:", "");
const plotOf = (x, z) => {
  for (let p = 0; p < PLOT_ORIGIN.length; p++) {
    const [ox, oz] = PLOT_ORIGIN[p], [sx, sz] = PLOT_SIZE[p];
    if (x >= ox && x < ox + sx && z >= oz && z < oz + sz) return p;
  }
  return -1;
};

export function build(g) {
  const [SX, SY, SZ] = g.size;
  const lamps = [];           // [x, y, z] of every light source, existing and placed here
  const tops = [];            // sky-exposed walkable surfaces: [x, y, z] of the air cell standing on a solid block
  const problems = { height: [], outside: [], panes: [] };

  for (const c of g.cells.values()) {
    const [x, y, z] = c.pos;
    const b = short(c.block);
    if (b === "air" || b === "cave_air" || b === "void_air") continue;
    const p = plotOf(x, z);
    if (p < 0) problems.outside.push([x, y, z, b]);
    else if (y > PLOT_MAX_Y[p]) problems.height.push([x, y, z, b]);
    if (LAMP_RE.test(b) && (!LIT_ONLY.has(b) || c.state?.lit === "true")) lamps.push([x, y, z]);
  }

  // sky-exposed standing cells: solid support below, air here and above, nothing overhead to the top of the grid
  const solidAt = (x, y, z) => {
    if (x < 0 || y < 0 || z < 0 || x >= SX || y >= SY || z >= SZ) return false;
    const b = short(g.blockAt(x, y, z));
    return !g.isAir(x, y, z) && !NO_SUPPORT_RE.test(b);
  };
  const skyOpen = (x, y, z) => {
    for (let yy = y; yy < SY; yy++) if (!g.isAir(x, yy, z)) return false;
    return true;
  };
  for (const c of g.cells.values()) {
    const [x, y, z] = c.pos;
    if (plotOf(x, z) < 0 || !solidAt(x, y, z)) continue;
    const up = y + 1;
    if (up >= SY || !g.isAir(x, up, z) || !skyOpen(x, up, z)) continue;
    const p = plotOf(x, z);
    if (!onLot(p, x - PLOT_ORIGIN[p][0], z - PLOT_ORIGIN[p][1])) continue;
    tops.push([x, up, z]);
  }
  tops.sort((a, b) => a[2] - b[2] || a[0] - b[0] || a[1] - b[1]);

  // greedy lamp placement: a walkable cell with no lamp within LAMP_RADIUS gets a standing lantern on it
  const near = (x, y, z) => lamps.some(([lx, ly, lz]) => Math.abs(lx - x) + Math.abs(ly - y) + Math.abs(lz - z) <= LAMP_RADIUS);
  let placed = 0, dark = 0;
  for (const [x, y, z] of tops) {
    if (near(x, y, z)) continue;
    dark++;
    if (!g.isAir(x, y, z)) continue; // an earlier part's block took the cell; nothing to light there
    g.set(x, y, z, "lantern", { hanging: "false" });
    lamps.push([x, y, z]);
    placed++;
  }

  // pane connections: a pane joins each side that holds a pane or a solid block
  const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
  for (const c of g.cells.values()) {
    if (short(c.block) !== "glass_pane") continue;
    const [x, y, z] = c.pos;
    for (const [side, [dx, dz]] of Object.entries(DIRS)) {
      const nb = short(g.blockAt(x + dx, y, z + dz));
      const joins = nb === "glass_pane" || (solidAt(x + dx, y, z + dz) && !/pane|bars|door|trapdoor|fence|wall|stair|slab/.test(nb));
      const has = c.state?.[side] === "true";
      if (joins !== has) { problems.panes.push([x, y, z, side]); break; }
    }
  }

  console.log(`final check: ${placed} lanterns on ${tops.length} sky-open walkable cells (${dark} were beyond 7 blocks of a lamp)`);
  for (const [k, list] of Object.entries(problems)) {
    if (!list.length) continue;
    console.log(`  ${k}: ${list.length} (e.g. ${list.slice(0, 4).map((p) => p.join(",")).join("; ")})`);
  }
}
