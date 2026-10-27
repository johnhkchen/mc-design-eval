// Mt Eden / Eden Terrace-style 1930s brick commercial block: four storeys over a stone plinth, cream plaster string
// courses and parapet, brick piers between steel-framed windows, a shopfront ground floor with a recessed door.
// Massing follows the lidar roof: a 3x3 median smooths the noise into three flat tiers (main, 3-storey wing, 2-storey wing),
// and a plant pavilion sits on the main roof. Shell only: perimeter walls, a solid floor slab per storey, no interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_332241878.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 34, D = 22, H = 24;

const key = (x, z) => `${x},${z}`;
const foot = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inFoot = (x, z) => foot.has(key(x, z));

// Roof tiers: 3x3 median of the lidar roof (top block of each tier: 18 = main, 15 = 3-storey wing, 11 = 2-storey wing).
const tier = new Map();
for (const k of foot.keys()) {
  const [x, z] = k.split(",").map(Number);
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = foot.get(key(x + dx, z + dz)); if (n) near.push(n.r); }
  near.sort((a, b) => a - b);
  const m = near[Math.floor(near.length / 2)];
  tier.set(k, m >= 18 ? 18 : m >= 13 ? 15 : 11);
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", W: "west", E: "east" };
const exposed = (x, z) => Object.entries(DIRS).filter(([, [dx, dz]]) => !inFoot(x + dx, z + dz)).map(([f]) => f);
const FLOORS = [8, 12, 16];                       // storey slabs above the ground floor slab at y 4

const B = new Map();                               // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });
const ex = new Map();
for (const k of foot.keys()) ex.set(k, exposed(...k.split(",").map(Number)));

// Door: a main-tier, non-corner south-facing (else north-facing) wall cell nearest the footprint's middle.
const xs = [...foot.keys()].map((k) => +k.split(",")[0]);
const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
const doorCands = [...foot.keys()].filter((k) => {
  const e = ex.get(k), [x] = k.split(",").map(Number);
  return e.length === 1 && tier.get(k) === 18 && (e[0] === "S" || e[0] === "N") && x % 3 !== 0;
});
doorCands.sort((a, b) => {
  const sa = ex.get(a)[0] === "S" ? 0 : 1, sb = ex.get(b)[0] === "S" ? 0 : 1;
  return sa - sb || Math.abs(+a.split(",")[0] - midX) - Math.abs(+b.split(",")[0] - midX);
});
const doorKey = doorCands[0];

for (const k of foot.keys()) {
  const [x, z] = k.split(",").map(Number);
  const T = tier.get(k), e = ex.get(k), per = e.length > 0;
  const zFace = e.includes("N") || e.includes("S"), xFace = e.includes("E") || e.includes("W");
  const pier = (zFace && xFace) || (zFace ? x : z) % 3 === 0;          // corners and every third bay are brick piers
  for (let y = 0; y <= T; y++) {
    if (y < 4) { put(x, y, z, "stone_bricks"); continue; }            // fill from y0 to ground, plinth to the 4-block datum
    if (y === T) { put(x, y, z, per ? "smooth_quartz" : "gray_concrete"); continue; }   // parapet / roof membrane
    if (y === 4) { put(x, y, z, per ? "polished_andesite" : "smooth_stone"); continue; } // ground floor slab, base course
    if (FLOORS.includes(y)) { put(x, y, z, per ? "bricks" : "smooth_stone"); continue; } // floor slab; brick spandrel so cream reads only at lintels and caps
    if (!per) continue;                                               // interior: air between slabs
    const off = y - 4 * Math.floor(y / 4);                            // row inside its storey: 1-2 glass, 3 lintel
    if (off === 3) { put(x, y, z, "smooth_quartz"); continue; }
    if (pier) { put(x, y, z, "bricks"); continue; }
    put(x, y, z, "glass_pane");
  }
}

// The door: lower and upper halves in the ground-floor bay, lintel above (row 7 is already the cream lintel).
{
  const [x, z] = doorKey.split(",").map(Number), facing = FACING[ex.get(doorKey)[0]];
  put(x, 5, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, 6, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Warm light: lanterns hung in the shop bays, glowstone behind some upper-storey panes (interior cell just inside).
for (const [k] of foot) {
  const [x, z] = k.split(",").map(Number), e = ex.get(k);
  if (!e.length) continue;
  const zFace = e.includes("N") || e.includes("S"), xFace = e.includes("E") || e.includes("W");
  if (zFace && xFace) continue;
  const [dx, dz] = zFace ? [0, e.includes("N") ? 1 : -1] : [e.includes("W") ? 1 : -1, 0];   // inward step
  const ix = x + dx, iz = z + dz;
  if (!inFoot(ix, iz) || ex.get(key(ix, iz)).length) continue;
  for (const y of [5, 6, 9, 10, 13, 14, 17]) {
    const b = B.get(`${x},${y},${z}`);
    if (!b || b.block !== "glass_pane") continue;
    if (y <= 6 && (x + z) % 3 === 0) put(ix, 7, iz, "lantern", { hanging: "true", waterlogged: "false" });
    else if (y > 6 && (x + y + z) % 4 === 0) put(ix, y, iz, "glowstone");
  }
}

// Plant pavilion on the main roof: a 6 x 4 box, glass on its long sides, cream cap, sitting on the roof membrane.
{
  let best = null, bestD = Infinity;
  const mains = [...foot.keys()].filter((k) => tier.get(k) === 18).map((k) => k.split(",").map(Number));
  const cx = mains.reduce((s, [x]) => s + x, 0) / mains.length, cz = mains.reduce((s, [, z]) => s + z, 0) / mains.length;
  for (let x0 = 0; x0 <= W - 6; x0++) for (let z0 = 0; z0 <= D - 4; z0++) {
    let ok = true;
    for (let x = x0; x < x0 + 6 && ok; x++) for (let z = z0; z < z0 + 4 && ok; z++)
      ok = inFoot(x, z) && tier.get(key(x, z)) === 18 && ex.get(key(x, z)).length === 0;
    if (!ok) continue;
    const d = Math.hypot(x0 + 2.5 - cx, z0 + 1.5 - cz);
    if (d < bestD) { bestD = d; best = [x0, z0]; }
  }
  if (best) {
    const [x0, z0] = best;
    for (let x = x0; x < x0 + 6; x++) for (let z = z0; z < z0 + 4; z++) {
      const edge = x === x0 || x === x0 + 5 || z === z0 || z === z0 + 3;
      const corner = (x === x0 || x === x0 + 5) && (z === z0 || z === z0 + 3);
      put(x, 19, z, edge ? "smooth_quartz" : "gray_concrete");
      if (edge) put(x, 20, z, corner ? "bricks" : "glass_pane");
      put(x, 21, z, "smooth_quartz");
    }
  }
}

// Glass panes connect to their neighbours like a wall does: to panes and to any full block.
const NONFULL = new Set(["glass_pane", "dark_oak_door", "lantern", "glowstone", "shroomlight"]);
const solid = (x, y, z) => { const b = B.get(`${x},${y},${z}`); return !!b && !NONFULL.has(b.block); };
for (const [k, b] of B) {
  if (b.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const link = (dx, dz) => { const n = B.get(`${x + dx},${y},${z + dz}`); return solid(x + dx, y, z + dz) || (!!n && n.block === "glass_pane"); };
  b.state = { north: String(link(0, -1)), south: String(link(0, 1)), east: String(link(1, 0)), west: String(link(-1, 0)), waterlogged: "false" };
}

const g = new Voxels([W, H, D]);
for (const [k, { block, state }] of B) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, block, state); }
g.save(`${DIR}/way_332241878.nbt`);
