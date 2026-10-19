// 201006.0001114: a two-storey stucco block with a red tile roof and a parapet, the Main Post's
// Army-institutional type (barracks / headquarters on the parade ground). Walls are two cells thick,
// with glass in the outer layer and air behind it; the interior is air apart from a floor slab per storey.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill/201006.0001114.cells.json", "utf8"));   // [x, z, ground]
const g = new Voxels([52, 17, 22]);

const G = new Map(); for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const key = (x, z) => `${x},${z}`, inF = (x, z) => G.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const outsOf = (x, z) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz));

// Depth from the outside edge: 1 = outer skin, 2 = second layer of the wall, 3+ = interior.
const dist = new Map(), q = [];
for (const k of G.keys()) { const [x, z] = k.split(",").map(Number); if (outsOf(x, z).length) { dist.set(k, 1); q.push(k); } }
for (let i = 0; i < q.length; i++) {
  const [x, z] = q[i].split(",").map(Number), d = dist.get(q[i]);
  for (const [dx, dz] of DIRS) { const nk = key(x + dx, z + dz); if (G.has(nk) && !dist.has(nk)) { dist.set(nk, d + 1); q.push(nk); } }
}

// Plan first, then write: later puts overwrite earlier ones.
const plan = new Map();
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { x, y, z, block, state });

// Outer facade cells: one outward face each (corners have two and get quoins).
const facade = new Map(), corners = new Set();
for (const [k, gr] of G) {
  if (dist.get(k) !== 1) continue;
  const [x, z] = k.split(",").map(Number), outs = outsOf(x, z);
  if (outs.length === 1) { const [dx, dz] = outs[0]; facade.set(k, { x, z, dx, dz, g: gr, a: dz ? x : z, line: dz ? z : x }); }
  else if (outs.length === 2) corners.add(k);
}

// Runs of facade cells on one face, so the entrances go in the longest unbroken stretches.
const runs = new Map();
for (const f of facade.values()) { const k = `${f.dx},${f.dz},${f.line}`; if (!runs.has(k)) runs.set(k, []); runs.get(k).push(f); }
const stretches = [];
for (const list of runs.values()) {
  list.sort((p, q2) => p.a - q2.a); let s = [list[0]];
  for (let i = 1; i <= list.length; i++) {
    if (i < list.length && list[i].a === list[i - 1].a + 1) { s.push(list[i]); continue; }
    if (s.length >= 5) stretches.push(s); s = list[i] ? [list[i]] : [];
  }
}
stretches.sort((p, q2) => q2.length - p.length);
const doors = stretches.slice(0, 2).map((s) => s[Math.floor(s.length / 2)]);

const at3 = (f, dd) => [f.x - dd * f.dx, f.z - dd * f.dz];         // a cell `dd` deep, inward from facade f
const facing = (dx, dz) => (dz === 1 ? "north" : dz === -1 ? "south" : dx === 1 ? "west" : "east");   // placed from outside
const pane = (dz) => (dz ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
                         : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" });

// 1. Foundation: solid from y 0 up to each cell's ground, under the whole footprint.
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number), d = dist.get(k);
  for (let y = 0; y < gr; y++) put(x, y, z, d === 1 ? "stone_bricks" : "stone");
}

// 2. Walls (depth 1 and 2) from ground to the cornice, roof deck and parapet on top.
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number), d = dist.get(k);
  if (d > 2) continue;
  for (let y = gr; y <= gr + 4; y++) {
    let b = "smooth_quartz";
    if (y === gr || y === gr + 2 || y === gr + 4) b = "stone_bricks";        // base course, string course, cornice
    put(x, y, z, b);
  }
  if (d === 1) put(x, gr + 5, z, "smooth_quartz");                              // parapet
  if (d === 1 && corners.has(k)) for (let y = gr; y <= gr + 5; y++) put(x, y, z, "stone_bricks");   // quoins
}

// 3. Facade bays: stone pilasters, paired windows with air behind, a plain wall bay.
for (const f of facade.values()) {
  const { x, z, dx, dz, g: gr, a } = f;
  const bay = ((a % 4) + 4) % 4;
  if (bay === 0) for (const y of [gr + 1, gr + 3]) put(x, y, z, "stone_bricks");
  if (bay === 1 || bay === 2) for (const y of [gr + 1, gr + 3]) {
    put(x, y, z, "glass_pane", pane(dz));
    const [bx, bz] = at3(f, 1); put(bx, y, bz, "air");                            // air gap behind the glass
  }
}

// 4. Two entrances on the longest stretches: dark oak doors, a red canopy over, lanterns either side.
// Along the wall: a facade cell `o` steps from the door (x for z-facing walls, z for x-facing ones).
const along = (f, o) => facade.get(f.dz ? key(f.x + o, f.z) : key(f.x, f.z + o));
for (const f of doors) {
  const st = { facing: facing(f.dx, f.dz), hinge: "left", open: "false", powered: "false" };
  put(f.x, f.g, f.z, "dark_oak_door", { ...st, half: "lower" });
  put(f.x, f.g + 1, f.z, "dark_oak_door", { ...st, half: "upper" });
  const [bx, bz] = at3(f, 1);
  put(bx, f.g, bz, "air"); put(bx, f.g + 1, bz, "air");
  for (const o of [-1, 0, 1]) {                                          // canopy plate over the door, outer and inner layers
    const c = along(f, o); if (!c) continue;
    const slab = { type: "bottom", waterlogged: "false" };
    put(c.x, c.g + 3, c.z, "red_terracotta_slab", slab);
    const [cx, cz] = at3(c, 1); put(cx, c.g + 3, cz, "red_terracotta_slab", slab);
  }
  for (const o of [-2, 2]) {                                             // lanterns either side on the string course
    const c = along(f, o);
    if (c) put(c.x, c.g + 2, c.z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// 5. Interior: floor slab per storey, roof deck under the cornice, warm light behind some windows.
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number), d = dist.get(k);
  if (d < 3) continue;
  put(x, gr + 2, z, "smooth_stone");
  put(x, gr + 4, z, "red_terracotta");
}
for (const f of facade.values()) {
  const bay = ((f.a % 8) + 8) % 8;
  if (bay !== 1 && bay !== 5) continue;
  const [ix, iz] = [f.x - 2 * f.dx, f.z - 2 * f.dz];
  if (dist.get(key(ix, iz)) !== 3) continue;
  put(ix, bay === 1 ? f.g + 3 : f.g + 1, iz, "glowstone");
}

// 6. Roof equipment: three brick chimney stacks with stone caps, spread across the roof.
const deep = [...G.entries()].filter(([k]) => dist.get(k) >= 4).map(([k, gr]) => [...k.split(",").map(Number), gr]).sort((p, q2) => p[0] - q2[0] || p[1] - q2[1]);
for (const i of [0.25, 0.5, 0.75]) {
  const [x, z, gr] = deep[Math.floor(deep.length * i)] ?? [];
  if (x === undefined) continue;
  for (let y = gr + 5; y <= gr + 7; y++) put(x, y, z, "bricks");
  put(x, gr + 8, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

for (const { x, y, z, block, state } of plan.values()) {
  if (y < 0 || y >= 17) continue;
  g.set(x, y, z, block, state);
}
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill/201006.0001114.nbt");
