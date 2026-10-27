// Way 291058283, Eden Terrace side of Maungawhau: no record, so the building is decided from the massing. A post-war
// concrete-frame office block on a falling site: five or six storeys down the slope to the north-east, stepping up
// to a three-storey core on the high ground to the south-west. Cast-concrete spandrels and mullions, blue-green tinted
// glazing, a polished-basalt base course, shopfronts at street level, two entrances, lift overrun and plant on top.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_291058283.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_291058283.nbt";

const FOUND = "stone_bricks", BASE = "polished_andesite", FLOOR = "light_gray_concrete", CONC = "white_concrete",
  ROOF = "stone", GLASS = "light_blue_stained_glass", SHOP = "glass", LAMP = "glowstone",
  LAMP2 = "shroomlight", CANOPY = "smooth_stone";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));   // [x, z, ground, roof] per footprint cell
const g = new Voxels([107, 36, 57]);

const key = (x, z) => `${x},${z}`;
const cols = new Map();
for (const [x, z, gr, rf] of cells) {
  const D = 4 * Math.ceil(gr / 4);                       // storey datum on the 4-block grid: plinth of 0-3 blocks
  const T = Math.max(D + 4, 4 * Math.round(rf / 4));     // lidar roof snapped to a flat tier, at least one storey
  cols.set(key(x, z), { x, z, gr, D, T });
}
const at = (x, z) => cols.get(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const isCol = (x, z) => x % 4 === 2 && z % 4 === 2;     // structural columns on a 4-block grid carry the floor slabs

// the sides of a storey that face outside the footprint or a lower roof: where the shell (glass, walls) stands
const exposed = (c, b) => DIRS.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.T <= b; });

// foundation to the ground, plinth to the storey datum, then storeys of slab + window band + spandrel
for (const c of cols.values()) {
  for (let y = 0; y < c.gr; y++) g.set(c.x, y, c.z, FOUND);
  for (let y = c.gr; y < c.D; y++) g.set(c.x, y, c.z, BASE);
  for (let b = c.D, k = 0; b < c.T; b += 4, k++) {
    const dirs = exposed(c, b);
    const top = b === c.T - 4;
    g.set(c.x, b, c.z, FLOOR);                            // floor slab / string course, every storey
    if (!dirs.length) {                                    // interior: air, except the columns and the roof
      if (isCol(c.x, c.z)) for (let y = b + 1; y < b + 4; y++) g.set(c.x, y, c.z, CONC);
      if (top) g.set(c.x, b + 3, c.z, ROOF);
      continue;
    }
    const [ddx] = dirs[0];
    const bay = ddx !== 0 ? c.z : c.x;                    // bays run along the wall
    const pilaster = bay % 3 === 0;
    for (let y = b + 1; y < b + 3; y++) g.set(c.x, y, c.z, pilaster ? CONC : k === 0 ? SHOP : GLASS);
    g.set(c.x, b + 3, c.z, k === 0 ? BASE : CONC);        // base course at street level, spandrels above
    // warm light in some bays, set in the air gap just behind the glass
    if (!pilaster && (bay + k) % 5 === 1) {
      const [dx, dz] = dirs[0];
      const inner = at(c.x - dx, c.z - dz);
      if (inner && inner.T > b + 2 && !exposed(inner, b).length && !isCol(inner.x, inner.z))
        g.set(inner.x, b + 2, inner.z, (bay + k) % 10 === 1 ? LAMP2 : LAMP);
    }
  }
  if (DIRS.some(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.T < c.T; }))
    g.set(c.x, c.T, c.z, CONC);                           // parapet on the roof edge
}

// two entrances on the street level: doors in the glass bays, canopy band over them
const street = [...cols.values()].filter((c) => c.T >= c.D + 4)
  .map((c) => ({ c, dirs: exposed(c, c.D) })).filter((o) => o.dirs.length && (o.c.x + o.c.z) % 3 !== 0);
const pick = (list) => { if (!list.length) return null; const mx = list.reduce((s, o) => s + o.c.x, 0) / list.length,
  mz = list.reduce((s, o) => s + o.c.z, 0) / list.length; return list.reduce((best, o) =>
  (Math.abs(o.c.x - mx) + Math.abs(o.c.z - mz) < Math.abs(best.c.x - mx) + Math.abs(best.c.z - mz) ? o : best)); };
const facing = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const doors = [
  pick(street.filter((o) => o.dirs[0][1] === 1)) ?? pick(street),
  pick(street.filter((o) => o.dirs[0][0] === 1)) ?? pick(street.filter((o) => o.dirs[0][1] === -1)),
].filter(Boolean);
for (const { c, dirs } of doors) {
  const [dx, dz] = dirs[0], y = c.D + 1;
  const st = { facing: facing[`${dx},${dz}`], hinge: "left", open: "false", powered: "false" };
  g.set(c.x, y, c.z, "oak_door", { ...st, half: "lower" });
  g.set(c.x, y + 1, c.z, "oak_door", { ...st, half: "upper" });
  const lat = dx !== 0 ? [[0, -1], [0, 1]] : [[-1, 0], [1, 0]];
  for (const [lx, lz] of [[0, 0], ...lat]) {
    const n = at(c.x + lx, c.z + lz);
    if (n && n.T > c.D + 3) g.set(n.x, c.D + 3, n.z, CANOPY);
  }
}

// roof: a lift overrun on the highest tier, and a plant box beside it
const tmax = Math.max(...[...cols.values()].map((c) => c.T));
const top = [...cols.values()].filter((c) => c.T === tmax);
const cx = top.reduce((s, c) => s + c.x, 0) / top.length, cz = top.reduce((s, c) => s + c.z, 0) / top.length;
const ok3 = (x, z, w) => { for (let i = -w; i <= w; i++) for (let j = -w; j <= w; j++) { const n = at(x + i, z + j); if (!n || n.T !== tmax) return false; } return true; };
const sites = top.filter((c) => ok3(c.x, c.z, 1)).sort((a, b) => (a.x - cx) ** 2 + (a.z - cz) ** 2 - ((b.x - cx) ** 2 + (b.z - cz) ** 2));
if (sites.length) {
  const L = sites[0];
  for (let x = L.x - 1; x <= L.x + 1; x++) for (let z = L.z - 1; z <= L.z + 1; z++) {
    g.set(x, tmax, z, CONC); g.set(x, tmax + 1, z, CONC); g.set(x, tmax + 2, z, FLOOR);
  }
  const P = sites.find((c) => Math.abs(c.x - L.x) + Math.abs(c.z - L.z) >= 5 && ok3(c.x, c.z, 1));
  if (P) for (let x = P.x - 1; x <= P.x; x++) for (let z = P.z - 1; z <= P.z; z++) { g.set(x, tmax, z, CANOPY); g.set(x, tmax + 1, z, CANOPY); }
}

const s = g.save(OUT);
console.log(`way_291058283: ${cells.length} cells, tiers ${[...new Set([...cols.values()].map((c) => c.T))].sort((a, b) => a - b)}, doors ${doors.length}, ${s.blocks} blocks, ${s.palette} palette`);
