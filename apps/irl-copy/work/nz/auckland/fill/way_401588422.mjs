import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1990s clad office tower: white precast concrete frame, tinted blue glass in mullioned bays, a stone plinth, a
// recessed lobby on the north face, and a 19-storey core in the south rising above a 17-storey main slab.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_401588422.cells.json", "utf8"));

// lidar roof -> flat tiers: >= 74 core tower (76), 71-73 setback wing (72), 60-70 main slab (70); the 48 and 18 lower
// wings are kept as read. Floors sit on a global 4-block storey grid so every tier lines up with the one below.
const tier = (r) => (r >= 74 ? 76 : r >= 71 ? 72 : r >= 60 ? 70 : r);
const at = new Map();
for (const [x, z, g, r] of cells) at.set(`${x},${z}`, { g, r: tier(r) });

const PANE = "light_blue_stained_glass_pane";
const DIRS = [[0, -1], [0, 1], [1, 0], [-1, 0]];
const B = new Map();                                  // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });

// a wall cell is exposed where a neighbour is outside the footprint or stands lower than this height
const exposed = (x, y, z) => DIRS.some(([dx, dz]) => { const n = at.get(`${x + dx},${z + dz}`); return !n || y >= n.r; });

for (const [key, { g, r }] of at) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");          // solid foundation under the ground
  for (let y = g; y < r; y++) {
    const per = exposed(x, y, z);
    let blk = null;
    if (y === g) blk = "stone_bricks";                                 // base course / plinth
    else if (y === r - 1) blk = per ? "white_concrete" : "gray_concrete";   // parapet coping, roof membrane
    else if (y % 4 === 0) blk = "white_concrete";                      // floor slab (and the edge band on the wall)
    else if (y % 4 === 3) blk = per ? "light_gray_concrete" : null;    // spandrel
    else if (per) blk = (x + z) % 3 === 0 ? "white_concrete" : PANE;  // mullioned window rows
    if (blk) put(x, y, z, blk, blk === PANE ? { waterlogged: "false" } : undefined);

    // a warm lamp in the air gap behind some glass: the one inward cell of a single-sided wall cell
    if (blk === PANE && (x + z) % 3 === 2 && Math.floor(y / 4) % 2 === 0 && y % 4 === 1) {
      const out = DIRS.filter(([dx, dz]) => !at.has(`${x + dx},${z + dz}`));
      if (out.length === 1) {
        const [ix, iz] = [x - out[0][0], z - out[0][1]];
        const inn = at.get(`${ix},${iz}`);
        if (inn && inn.g <= y && inn.r > y + 1 && !B.has(`${ix},${y},${iz}`)) put(ix, y, iz, "glowstone");
      }
    }
  }
}

// recessed lobby on the north face: double door, lantern under a canopy
const [ex, ez] = [15, 0];
const eg = at.get(`${ex},${ez}`).g;
put(ex, eg, ez, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(ex, eg + 1, ez, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let x = ex - 1; x <= ex + 1; x++) put(x, eg + 3, ez, "light_gray_concrete");
put(ex, eg + 2, ez, "lantern", { hanging: "true", waterlogged: "false" });
for (let x = ex - 1; x <= ex + 1; x++) if (x !== ex) put(x, eg, ez, "stone_bricks"), put(x, eg + 1, ez, PANE, { waterlogged: "false" });

// roof plant and an aerial on the 76 core: a low box, a lightning-rod mast on its top
const core = [...at].filter(([, v]) => v.r === 76).map(([k]) => k.split(",").map(Number));
const cx = core.reduce((s, [x]) => s + x, 0) / core.length, cz = core.reduce((s, [, z]) => s + z, 0) / core.length;
const [mx, mz] = core.reduce((best, c) => (Math.hypot(c[0] - cx, c[1] - cz) < Math.hypot(best[0] - cx, best[1] - cz) ? c : best));
for (const [x, z] of core) if (Math.abs(x - mx) <= 1 && Math.abs(z - mz) <= 1 && Math.hypot(x - cx, z - cz) < 4) {
  put(x, 76, z, "light_gray_concrete"); put(x, 77, z, "light_gray_concrete");
}
put(mx, 78, mz, "light_gray_concrete");
for (let y = 79; y <= 81; y++) put(mx, y, mz, "lightning_rod", { facing: "up", powered: "false" });

// panes connect to the solid walls and panes beside them, not to the lamps behind
const solid = (x, y, z) => { const v = B.get(`${x},${y},${z}`); return !!v && v.block !== "glowstone"; };
for (const [k, v] of B) {
  if (v.block !== PANE) continue;
  const [x, y, z] = k.split(",").map(Number);
  const c = (dx, dz) => (solid(x + dx, y, z + dz) ? "true" : "false");
  v.state = { north: c(0, -1), south: c(0, 1), east: c(1, 0), west: c(-1, 0), waterlogged: "false" };
}

const g = new Voxels([27, 89, 25]);
for (const [k, v] of B) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, v.block, v.state); }
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_401588422.nbt";
console.log(g.save(out));
