// Way 326735496, Eden Terrace side of Maungawhau: a 1930s rendered-concrete commercial block, three storeys on a
// stone base, with a lower-ground storey showing on the downhill side. Flat tiers from the lidar roof (median-smoothed):
// the main block stands to 17 with a parapet, the low cells step down to a two-storey wing at 13.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_326735496.cells.json`, "utf8"));
const W = 24, D = 36, H = 30;

const k2 = (x, z) => `${x},${z}`;
const k3 = (x, y, z) => `${x},${y},${z}`;
const cell = new Map();
for (const [x, z, g, r] of cells) cell.set(k2(x, z), { g, r });
const has = (x, z) => cell.has(k2(x, z));
const gOf = (x, z) => cell.get(k2(x, z)).g;

// the four facade directions: outward offset, the door facing (opposite), and the two in-plane neighbours a pane joins
const DIRS = [
  { name: "north", opp: "south", dx: 0, dz: -1, run: [["east", 1, 0], ["west", -1, 0]] },
  { name: "south", opp: "north", dx: 0, dz: 1, run: [["east", 1, 0], ["west", -1, 0]] },
  { name: "west", opp: "east", dx: -1, dz: 0, run: [["south", 0, 1], ["north", 0, -1]] },
  { name: "east", opp: "west", dx: 1, dz: 0, run: [["south", 0, 1], ["north", 0, -1]] },
];

// the roof tier: the 5x5 median of the lidar roof, so noise becomes flat tiers (a 3x3 left lone low cells as stray wings)
const med = (x, z) => {
  const v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (has(x + dx, z + dz)) v.push(cell.get(k2(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
};
const top = (x, z) => (med(x, z) >= 15 ? 17 : 13);   // solid through top-1; 17 = three storeys, 13 = a two-storey wing

// a face is exposed at height y where the neighbour is off the footprint or its solid column has ended below y
const exposed = (x, z, y) => DIRS.filter((d) => !has(x + d.dx, z + d.dz) || y >= top(x + d.dx, z + d.dz));
// a pier on every third cell of a face, corners always
const pierAt = (x, z, d) => ((d.dz ? x : z) % 3) === 0;
// storey rows: GF glass 6-7 (transom 8), 2F glass 10-11, 3F glass 14-15 (cornice at top-1), lower-ground glass on the downhill side
const winRow = (y, T, gr) => (y >= 6 && y <= 7) || (y >= 10 && y <= 11) || (T === 17 && y >= 14 && y <= 15) || (gr <= 2 && y >= gr + 1 && y <= gr + 2);

// the entrance: a ground-level (g = 5) cell on a single outward face, nearest the middle of its face
function pickDoor() {
  let best = null;
  for (const k of cell.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (gOf(x, z) !== 5) continue;
    const out = DIRS.filter((d) => !has(x + d.dx, z + d.dz));
    if (out.length !== 1 || pierAt(x, z, out[0])) continue;
    const idx = out[0].dz ? x : z, mid = out[0].dz ? 11.5 : 17.5;
    if (!best || Math.abs(idx - mid) < best.score) best = { x, z, d: out[0], score: Math.abs(idx - mid) };
  }
  return best;
}
const door = pickDoor();

// Pass 1: the glass (one pane per window cell) and the air behind it, which is a lit glowstone in a quarter of them
const panes = [], pockets = new Map();
for (const k of cell.keys()) {
  const [x, z] = k.split(",").map(Number), gr = gOf(x, z), T = top(x, z);
  for (let y = gr; y < T; y++) {
    const ex = exposed(x, z, y);
    if (ex.length !== 1 || pierAt(x, z, ex[0]) || !winRow(y, T, gr)) continue;
    const d = ex[0];
    panes.push({ x, y, z, d });
    const ix = x - d.dx, iz = z - d.dz;
    if (has(ix, iz) && gOf(ix, iz) <= y && exposed(ix, iz, y).length === 0) pockets.set(k3(ix, y, iz), (x + 3 * z + y) % 4 === 0);
  }
}
if (door) {
  const ix = door.x - door.d.dx, iz = door.z - door.d.dz;
  for (const y of [5, 6]) if (has(ix, iz)) pockets.set(k3(ix, y, iz), false);   // the vestibule behind the door
}

// Pass 2: the solid massing and its facades
const g3 = new Voxels([W, H, D]);
const occ = new Set();
const put = (x, y, z, b, s) => { g3.set(x, y, z, b, s); occ.add(k3(x, y, z)); };

for (const k of cell.keys()) {
  const [x, z] = k.split(",").map(Number), gr = gOf(x, z), T = top(x, z);
  const isDoor = door && door.x === x && door.z === z;
  for (let y = 0; y < T; y++) {
    const pk = k3(x, y, z);
    if (pockets.has(pk)) { if (pockets.get(pk)) put(x, y, z, "glowstone"); continue; }
    if (y < gr) { put(x, y, z, "stone_bricks"); continue; }                                // foundation on the downhill side
    if (isDoor && y === 5) { put(x, y, z, "dark_oak_door", { facing: door.d.opp, half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
    if (isDoor && y === 6) { put(x, y, z, "dark_oak_door", { facing: door.d.opp, half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    if (isDoor && y === 7) { put(x, y, z, "smooth_quartz"); continue; }                  // the lintel over the door
    const ex = exposed(x, z, y);
    if (ex.length === 0) { put(x, y, z, y === T - 1 ? "stone" : "smooth_quartz"); continue; }   // solid core; the roof membrane on top
    const pier = ex.length > 1 || pierAt(x, z, ex[0]);
    if (y === T - 1) { put(x, y, z, "red_terracotta"); continue; }                        // cornice
    if (y === 5 || y === 9 || (T === 17 && y === 13)) { put(x, y, z, "red_terracotta"); continue; }   // string courses
    if (!pier && ex.length === 1 && winRow(y, T, gr)) { put(x, y, z, "glass_pane"); continue; }
    if (y < 5) { put(x, y, z, "stone_bricks"); continue; }                                 // base course
    put(x, y, z, pier ? "quartz_pillar" : "smooth_quartz");
  }
  // parapet on the outer edge of the roof
  if (DIRS.some((d) => !has(x + d.dx, z + d.dz))) {
    const pier = DIRS.filter((d) => !has(x + d.dx, z + d.dz)).length > 1 || DIRS.some((d) => !has(x + d.dx, z + d.dz) && pierAt(x, z, d));
    put(x, T, z, pier ? "quartz_pillar" : "smooth_quartz");
  }
}

// Pass 3: lit glowstone and glass panes joined to their in-plane neighbours
for (const p of panes) {
  const props = { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" };
  for (const [name, rx, rz] of p.d.run) props[name] = occ.has(k3(p.x + rx, p.y, p.z + rz)) ? "true" : "false";
  g3.set(p.x, p.y, p.z, "glass_pane", props);
}

// Pass 4: a stair-and-lift penthouse on the main roof, two cooling units beside it, lanterns on its corners
const innerCell = (x, z) => has(x, z) && top(x, z) === 17 && DIRS.every((d) => has(x + d.dx, z + d.dz) && top(x + d.dx, z + d.dz) === 17);
const cx0 = W / 2, cz0 = D / 2;
const centres = [...cell.keys()].map((k) => k.split(",").map(Number))
  .sort((a, b) => Math.hypot(a[0] - cx0, a[1] - cz0) - Math.hypot(b[0] - cx0, b[1] - cz0));
let pen = null;
for (const [x, z] of centres) {
  let ok = true;
  for (let dz = -2; dz <= 2 && ok; dz++) for (let dx = -2; dx <= 2 && ok; dx++) ok = innerCell(x + dx, z + dz);
  if (ok) { pen = { x, z }; break; }
}
if (pen) {
  for (let y = 17; y <= 19; y++) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) put(pen.x + dx, y, pen.z + dz, "smooth_quartz");
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) put(pen.x + dx, 20, pen.z + dz, "red_terracotta");
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) put(pen.x + dx, 21, pen.z + dz, "lantern", { hanging: "false", waterlogged: "false" });
  let ac = null;
  for (const [x, z] of centres) {
    if (Math.max(Math.abs(x - pen.x), Math.abs(z - pen.z)) < 5) continue;
    if (innerCell(x, z) && innerCell(x + 1, z)) { ac = { x, z }; break; }
  }
  if (ac) { put(ac.x, 17, ac.z, "iron_block"); put(ac.x + 1, 17, ac.z, "iron_block"); }
}

const out = `${DIR}/way_326735496.nbt`;
const res = g3.save(out);
console.log(`way_326735496: ${res.blocks} blocks, ${res.palette} palette entries, door at ${door ? `${door.x},${door.z} facing ${door.d.name}` : "none"}, penthouse ${pen ? `${pen.x},${pen.z}` : "none"}`);
