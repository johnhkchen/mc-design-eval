// Auckland way 162152416: a 1920s-30s brick and cream-render commercial block. Three storeys on the lidar's main
// tier, two-storey wings at the lower edges, cream stringcourses and cap, shopfronts on the ground floor, a stair
// overrun on the roof. Storey lines are absolute (datum y 2, the uphill ground), so the downhill cells show their plinth.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162152416.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162152416.nbt";
const cells = JSON.parse(readFileSync(SRC, "utf8"));

const X = 37, Y = 20, Z = 21;
const FLOOR = 2;                                   // ground floor datum: the highest ground under the footprint
const k = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [k(x, z), { g, r }]));
const inFp = (x, z) => raw.has(k(x, z));

// lidar roof: median over the 3x3 (noise out), then two flat tiers: wings 10, main body 14. The lone 16s at the edges
// are single cells standing up as stubs, so they merge into the main body's parapet line.
const tier = new Map();
for (const [key] of raw) {
  const [x, z] = key.split(",").map(Number);
  const around = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (inFp(x + dx, z + dz)) around.push(raw.get(k(x + dx, z + dz)).r);
  }
  around.sort((a, b) => a - b);
  const m = around[around.length >> 1];
  tier.set(key, m <= 12 ? 10 : 14);
}
const top = (x, z) => tier.get(k(x, z));
const ground = (x, z) => raw.get(k(x, z)).g;

// the four faces: name, outward step, and the matching door facing (the way a visitor outside looks in)
const FACES = [
  { name: "S", dx: 0, dz: 1, facing: "north" },
  { name: "N", dx: 0, dz: -1, facing: "south" },
  { name: "E", dx: 1, dz: 0, facing: "west" },
  { name: "W", dx: -1, dz: 0, facing: "east" },
];
const outsideFace = (x, z, f) => !inFp(x + f.dx, z + f.dz);
const steppedFace = (x, z, f) => inFp(x + f.dx, z + f.dz) && top(x + f.dx, z + f.dz) < top(x, z);
// a wall cell is any cell on the outer edge or standing above a lower neighbour; its face is the outward one
const faceOf = (x, z) => FACES.find((f) => outsideFace(x, z, f)) || FACES.find((f) => steppedFace(x, z, f)) || null;

// the front: the outward face with most cells, the door in the middle of its run
const counts = Object.fromEntries(FACES.map((f) => [f.name, 0]));
for (const [key] of raw) {
  const [x, z] = key.split(",").map(Number);
  for (const f of FACES) if (outsideFace(x, z, f)) counts[f.name]++;
}
const front = FACES.reduce((a, b) => (counts[b.name] > counts[a.name] ? b : a));
const frontCells = [...raw.keys()].map((s) => s.split(",").map(Number)).filter(([x, z]) => outsideFace(x, z, front));
const along = (x, z, f) => (f.dx === 0 ? x : z);
frontCells.sort((a, b) => along(a[0], a[1], front) - along(b[0], b[1], front));
const [doorX, doorZ] = frontCells[frontCells.length >> 1];

// the block grid: key "x,y,z" -> { block, state } or null (air)
const B = new Map();
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, block ? { block, state } : null);
const get = (x, y, z) => B.get(`${x},${y},${z}`) ?? null;
const T = { axis: "y" };
const panes = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

// 1. foundation plinth (solid from y 0 up past every ground) and interior slabs: ground, the two upper floors, the deck
for (const [key] of raw) {
  const [x, z] = key.split(",").map(Number);
  const R = top(x, z);
  put(x, 0, z, "stone_bricks"); put(x, 1, z, "stone_bricks");
  for (const y of [FLOOR, 6, 10]) if (y < R - 1) put(x, y, z, "smooth_stone");
  put(x, R - 1, z, "smooth_stone");
}

// 2. the facade of every wall cell: piers, glass in a grid with iron mullions, string courses, cream cap
const floorsFor = (R) => [2, 6, 10, 14].filter((f) => f < R);
function facade(x, z, y, R, f) {
  if (y === R - 1) return ["quartz_block"];
  const F = floorsFor(R).filter((g) => g <= y).pop();
  const row = y - F, p = along(x, z, f) % 4;
  if (row === 0) return [F === FLOOR ? "polished_andesite" : "quartz_block"];
  if (row === 1 || row === 2) {
    if (p === 0) return ["quartz_pillar", T];
    if (p === 2) return ["iron_bars", panes];
    return ["glass_pane", panes];
  }
  if (row === 3 && F === FLOOR) return ["quartz_block"];
  return ["bricks"];
}
const windowRows = new Set();
for (const [key] of raw) {
  const [x, z] = key.split(",").map(Number);
  const f = faceOf(x, z);
  if (!f) continue;
  const R = top(x, z);
  for (let y = FLOOR; y < R; y++) {
    const [block, state] = facade(x, z, y, R, f);
    put(x, y, z, block, state);
    if (block === "glass_pane" || block === "iron_bars") windowRows.add(`${x},${y},${z},${f.name}`);
  }
}

// 3. the air gap behind every window: the cell just inside the glass is cleared at window rows
for (const key of windowRows) {
  const [x, y, z, name] = key.split(",");
  const f = FACES.find((q) => q.name === name);
  const ix = +x - f.dx, iz = +z - f.dz;
  if (inFp(ix, iz)) put(ix, +y, iz, null);
}

// 4. the entrance on the front: door in the middle of the run, a red awning over the bay, the room behind it kept clear
{
  const f = front;
  const R = top(doorX, doorZ);
  put(doorX, 3, doorZ, "oak_door", { facing: f.facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(doorX, 4, doorZ, "oak_door", { facing: f.facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  const ix = doorX - f.dx, iz = doorZ - f.dz;
  if (inFp(ix, iz)) { put(ix, 3, iz, null); put(ix, 4, iz, null); }
  for (const d of [-1, 0, 1]) {
    const x = doorX + (f.dx === 0 ? d : 0), z = doorZ + (f.dz === 0 ? d : 0);
    if (inFp(x, z) && faceOf(x, z) && top(x, z) === R) put(x, 5, z, "red_concrete");
  }
}

// 5. warm light: glowstone on the inside of some windows, against the glass
for (const key of windowRows) {
  const [x, y, z] = key.split(",").map(Number);
  const f = FACES.find((q) => q.name === key.split(",")[3]);
  const F = floorsFor(top(x, z)).filter((g) => g <= y).pop();
  if (y !== F + 1) continue;
  if ((x * 5 + z * 3 + F) % 4 !== 0) continue;
  const ix = x - f.dx, iz = z - f.dz;
  if (inFp(ix, iz)) put(ix, y, iz, "glowstone");
}

// 6. stair overrun on the main roof: the 3x3 of main-tier interior cells nearest the middle of the footprint
{
  const cs = [...raw.keys()].map((s) => s.split(",").map(Number));
  const cx = cs.reduce((a, c) => a + c[0], 0) / cs.length, cz = cs.reduce((a, c) => a + c[1], 0) / cs.length;
  let best = null;
  for (const [x, z] of cs) {
    let ok = true;
    for (let dz = -1; dz <= 1 && ok; dz++) for (let dx = -1; dx <= 1 && ok; dx++) {
      const a = x + dx, b = z + dz;
      ok = inFp(a, b) && top(a, b) === 14 && !faceOf(a, b);
    }
    if (!ok) continue;
    const d = (x - cx) ** 2 + (z - cz) ** 2;
    if (!best || d < best.d) best = { x, z, d };
  }
  if (best) {
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const a = best.x + dx, b = best.z + dz;
      put(a, 14, b, "bricks"); put(a, 15, b, "quartz_block");
    }
    for (const [dx, dz] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      put(best.x + dx, 14, best.z + dz, "glass_pane", panes);
    }
  }
}

// 7. roof plant: two low boxes on the main deck, away from the overrun
{
  const cs = [...raw.keys()].map((s) => s.split(",").map(Number));
  let placed = 0;
  for (const [x, z] of cs) {
    if (placed >= 2) break;
    if (top(x, z) !== 14 || faceOf(x, z)) continue;
    if (get(x, 14, z)) continue;
    if (Math.abs(x - 17) <= 3 && Math.abs(z - 9) <= 3) continue;
    if ((x + z) % 7 !== 0) continue;
    put(x, 14, z, "light_gray_concrete"); placed++;
  }
}

// 8. write the volume
const g = new Voxels([X, Y, Z]);
for (const [key, v] of B) {
  if (!v) continue;
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const stats = g.save(OUT);
console.log(`front ${front.name}, door at ${doorX},${doorZ}; ${stats.blocks} blocks, ${stats.palette} palette entries`);
