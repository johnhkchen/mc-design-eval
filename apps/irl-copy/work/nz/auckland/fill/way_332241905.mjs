// Way 332241905, Eden Terrace: a 1930s reinforced-concrete mixed-use block (stripped Moderne), 4 storeys at its tower,
// stepping down to 2 and 3 storeys. Cream plaster on a stone base, chiseled-quartz string courses and sills, glass
// shopfronts with striped awnings on the ground floor, a flat roof behind a parapet, a rooftop lift housing on the tower.
// Windows are glass recessed one block behind the facade with an air pocket between; some pockets hold glowstone.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241905.cells.json", "utf8"));

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "west", "-1,0": "east", "0,1": "north", "0,-1": "south" };   // a door's facing is the way its user stands, i.e. against the exposed side
const k2 = (x, z) => `${x},${z}`, k3 = (x, y, z) => `${x},${y},${z}`;

// ground and roof per cell; the roof is quantized to three flat tiers (2, 3, 4 storeys) and then majority-smoothed
const ground = new Map(), rawRoof = new Map();
for (const [x, z, g0, r] of cells) { ground.set(k2(x, z), g0); rawRoof.set(k2(x, z), r); }
const tierOf = (r) => (r <= 8 ? 8 : r <= 12 ? 12 : 15);
const top = new Map();
for (const [key, r] of rawRoof) top.set(key, tierOf(r));
{
  const smooth = new Map();
  for (const [key] of top) {
    const [x, z] = key.split(",").map(Number), self = top.get(key), n = new Map([[self, 1]]);
    for (const [dx, dz] of DIRS) { const t = top.get(k2(x + dx, z + dz)); if (t !== undefined) n.set(t, (n.get(t) ?? 0) + 1); }
    let best = self; for (const [t, c] of n) if (c > (n.get(best) ?? 0)) best = t;
    smooth.set(key, best);
  }
  for (const [key, t] of smooth) top.set(key, t);
}
const inFp = (x, z) => top.has(k2(x, z));
const topAt = (x, z) => top.get(k2(x, z));
const groundAt = (x, z) => ground.get(k2(x, z));

// the sides of a cell at height y that face air: outside the footprint, or a neighbour whose roof is already below y
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz) || topAt(x + dx, z + dz) <= y);

// the entrance: a grade-level cell on the +z front, the one nearest the middle of that run
const front = [...top.keys()].map((k) => k.split(",").map(Number))
  .filter(([x, z]) => groundAt(x, z) === 0 && exposed(x, z, 1).some(([dx, dz]) => dz === 1))
  .sort((a, b) => a[0] - b[0]);
const doorCell = front.length ? front[Math.floor(front.length / 2)] : null;

// pass 1: what each solid cell is; window candidates carry their inward direction for the pocket check
const cellsOut = new Map();   // key3 -> { b, s, win }
const put = (x, y, z, b, s, win) => cellsOut.set(k3(x, y, z), { x, y, z, b, s, win });
for (const [key, T] of top) {
  const [x, z] = key.split(",").map(Number), g0 = groundAt(x, z);
  for (let y = 0; y < T; y++) {
    if (y < g0) { put(x, y, z, "stone_bricks"); continue; }
    const ex = exposed(x, z, y);
    if (y === T - 1) {                                       // roof: parapet on the edges, roof membrane inside
      put(x, y, z, ex.length ? "quartz_bricks" : "smooth_stone"); continue;
    }
    if (!ex.length) { put(x, y, z, "smooth_quartz"); continue; }
    if (ex.length > 1) { put(x, y, z, "quartz_pillar"); continue; }   // corners
    const [dx, dz] = ex[0], t = dx ? z : x, inward = [-dx, -dz];
    if (y === g0) { put(x, y, z, "stone_bricks"); continue; }          // plinth
    if (y < 4 && y === 3) { put(x, y, z, t % 2 ? "white_terracotta" : "red_terracotta"); continue; }   // awning stripes
    if (y < 4) {                                                      // shopfront
      if (t % 4 === 0) put(x, y, z, "stone_bricks"); else put(x, y, z, "glass", null, { inward, d: [dx, dz] });
      continue;
    }
    const m = y % 4;
    if (m === 0) { put(x, y, z, "chiseled_quartz_block"); continue; }    // string course
    if (m === 1) { put(x, y, z, "quartz_bricks"); continue; }            // sill line
    if (t % 3 === 0) { put(x, y, z, "smooth_quartz"); continue; }        // pier between bays
    put(x, y, z, "glass", null, { inward, d: [dx, dz] });
  }
}

// the door: two halves on the chosen front, replacing its glass
if (doorCell) {
  const [x, z] = doorCell, facing = FACING["0,1"];
  for (const [y, half] of [[groundAt(x, z) + 1, "lower"], [groundAt(x, z) + 2, "upper"]])
    put(x, y, z, "oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
}

// pass 2: a glass pane needs an air pocket behind it, walled by solid on every side but the facade
const pockets = new Set();
for (const c of cellsOut.values()) {
  if (c.b !== "glass") continue;
  const [px, pz] = [c.x + c.win.inward[0], c.z + c.win.inward[1]], p2 = [px + c.win.inward[0], pz + c.win.inward[1]];
  const ok = inFp(px, pz) && topAt(px, pz) > c.y && inFp(p2[0], p2[1]) && topAt(p2[0], p2[1]) > c.y &&
    DIRS.every(([dx, dz]) => (dx === c.win.d[0] && dz === c.win.d[1]) || (inFp(px + dx, pz + dz) && topAt(px + dx, pz + dz) > c.y));
  // a wing only two cells deep has no room for a pocket that stays closed: its glass is then set flush, on solid
  if (ok) pockets.add(k3(px, c.y, pz));
}
// pass 3: the solid cells, then each pocket left empty (or glowstone on about one in five)
const g = new Voxels([21, 28, 16]);
for (const c of cellsOut.values()) g.set(c.x, c.y, c.z, c.b, c.s ?? undefined);
for (const key of pockets) {
  const [x, y, z] = key.split(",").map(Number);
  if ((x * 31 + y * 17 + z * 7) % 5 === 0) g.set(x, y, z, "glowstone");
  else g.set(x, y, z, "air");
}

// lift housing on the tower roof: a 3 x 3 box of smooth quartz standing on the tier-15 roof, with a stone-brick cap
let best = null, bestN = -1;
for (const [key, T] of top) {
  if (T !== 15) continue;
  const [x, z] = key.split(",").map(Number); let n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (topAt(x + dx, z + dz) === 15) n++;
  if (n > bestN) { bestN = n; best = [x, z]; }
}
if (best && bestN === 9) {
  const [cx, cz] = best;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const x = cx + dx, z = cz + dz;
    for (let y = 15; y <= 16; y++) if (dx || dz) g.set(x, y, z, "smooth_quartz");   // a ring of walls, the middle left open
    g.set(x, 17, z, "stone_bricks");
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241905.nbt";
const stats = g.save(out);
console.log(JSON.stringify({ cells: cells.length, tiers: { 8: [...top.values()].filter((t) => t === 8).length, 12: [...top.values()].filter((t) => t === 12).length, 15: [...top.values()].filter((t) => t === 15).length }, door: doorCell, pockets: pockets.size, ...stats }));
