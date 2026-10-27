// A Central Auckland office block, 1980s-90s: a six-storey concrete frame with a stone-based plinth, pale concrete
// piers and spandrels, tinted glass ribbons, a stepped seventh-storey core on the north-east of the roof, and low
// single-storey wings to the south-west. Built from the lidar's roof heights, smoothed into four tiers.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_269383011.cells.json`, "utf8"));

const X = 42, Y = 44, Z = 46;
const PLINTH = 4;                                     // ground floor line: the plinth runs up to y 4 under every cell
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];     // east, west, south (z+), north (z-)
const key = (x, z) => `${x},${z}`;

// ---- tiers: the lidar roof heights, smoothed (low wings to 8, the main body to 28, a tower to 32)
const C = new Map();
for (const [x, z, ground, roof] of cells) C.set(key(x, z), { x, z, ground, roof });

const towerKeys = new Set([...C.values()].filter((c) => c.roof >= 29).map((c) => key(c.x, c.z)));
const dist = new Map(), queue = [];                  // distance inside the tower from its outline: 1 = ring, 2+ = core
for (const k of towerKeys) {
  const [x, z] = k.split(",").map(Number);
  if (DIRS.some(([dx, dz]) => !towerKeys.has(key(x + dx, z + dz)))) { dist.set(k, 1); queue.push(k); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i].split(",").map(Number);
  for (const [dx, dz] of DIRS) {
    const nk = key(x + dx, z + dz);
    if (towerKeys.has(nk) && !dist.has(nk)) { dist.set(nk, dist.get(queue[i]) + 1); queue.push(nk); }
  }
}
for (const c of C.values()) {
  if (c.roof >= 29) c.top = dist.get(key(c.x, c.z)) >= 2 ? 32 : 28;   // the core steps up; its ring steps back to the main roof
  else if (c.roof >= 20) c.top = 28;
  else c.top = 8;
}
for (const c of C.values()) {
  c.dirs = DIRS.filter(([dx, dz]) => { const n = C.get(key(c.x + dx, c.z + dz)); return !n || n.top < c.top; });   // exposed faces
}

const g = new Voxels([X, Y, Z]);
const FLOOR = "light_gray_concrete", ROOF = "gray_concrete", CORNICE = "stone_bricks";
const GLASS = "light_blue_stained_glass", PIER = "white_concrete", BASE = "polished_andesite";

// ---- 1. solid plinth, floor slabs per storey, roof slab; interior left as air behind the shell
for (const c of C.values()) {
  for (let y = 0; y < PLINTH; y++) g.set(c.x, y, c.z, "stone_bricks");
  for (let y = PLINTH; y < c.top; y++) {
    if (y % 4 === 0) g.set(c.x, y, c.z, FLOOR);
    if (y === 27 && c.top >= 28) g.set(c.x, y, c.z, FLOOR);            // underside of the core's storey over the main roof
    if (y === c.top - 1) g.set(c.x, y, c.z, ROOF);
  }
}

// ---- 2. exposed walls: plinth band, storey lines, glass ribbons between concrete piers, a cornice to close the top
for (const c of C.values()) {
  if (!c.dirs.length) continue;
  const alongX = c.dirs.some(([, dz]) => dz !== 0);             // a north or south face runs along x, an east or west one along z
  const u = alongX ? c.x : c.z;
  const pier = c.dirs.length > 1 || u % 3 === 0;
  for (let y = PLINTH; y < c.top; y++) {
    let b;
    if (y === c.top - 1) b = CORNICE;
    else if (y < 8) b = y === 4 ? BASE : pier ? "stone_bricks" : GLASS;   // shopfront: the ground storey
    else {
      const r = y % 4;
      b = r === 0 || r === 3 ? FLOOR : pier ? PIER : GLASS;                // string course, glass, glass, spandrel
    }
    g.set(c.x, y, c.z, b);
  }
}

// ---- 3. the entrance: on the south face of the main body, a non-pier bay nearest the middle of that face
const south = [...C.values()].filter((c) => c.dirs.some(([dx, dz]) => dz === 1 && dx === 0) && c.top >= 28 && c.x % 3 !== 0);
const midX = south.map((c) => c.x).sort((a, b) => a - b)[Math.floor(south.length / 2)];
const door = south.sort((a, b) => Math.abs(a.x - midX) - Math.abs(b.x - midX))[0];
const doorState = { facing: "south", hinge: "left", open: "false", powered: "false" };
g.set(door.x, 5, door.z, "iron_door", { ...doorState, half: "lower" });
g.set(door.x, 6, door.z, "iron_door", { ...doorState, half: "upper" });

// ---- 4. warm light behind some windows: a glowstone (shroomlight at the shopfront) in the room behind the glass
for (const c of C.values()) {
  if (c.dirs.length !== 1) continue;
  const [dx, dz] = c.dirs[0];
  const pier = (dz !== 0 ? c.x : c.z) % 3 === 0;
  if (pier) continue;
  for (let y = 5; y < c.top - 1; y++) {
    if (y % 4 === 0 || y % 4 === 3) continue;                     // windows only
    if ((c.x * 7 + c.z * 11 + y * 5) % 17 !== 0) continue;
    const inner = C.get(key(c.x - dx, c.z - dz));
    if (!inner || inner.dirs.length || inner.top <= y) continue;
    g.set(inner.x, y, inner.z, y < 8 ? "shroomlight" : "glowstone");
  }
}

// ---- 5. roof plant: two 3 x 2 plant boxes on the main roof, set in from the edges and clear of the tower
const roofOK = (x, z) => {
  const c = C.get(key(x, z));
  return c && c.top === 28 && !c.dirs.length && DIRS.every(([dx, dz]) => {
    const n = C.get(key(x + dx, z + dz)); return n && n.top === 28 && !n.dirs.length;
  });
};
const boxes = [];
for (let z = 0; z < Z && boxes.length < 2; z++) for (let x = 0; x < X && boxes.length < 2; x++) {
  const box = [];
  for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 3; dx++) box.push([x + dx, z + dz]);
  if (!box.every(([bx, bz]) => roofOK(bx, bz))) continue;
  if (boxes.some((o) => o.some(([ox, oz]) => box.some(([bx, bz]) => Math.abs(ox - bx) <= 1 && Math.abs(oz - bz) <= 1)))) continue;
  boxes.push(box);
}
for (const box of boxes) for (const [bx, bz] of box) for (const y of [28, 29]) g.set(bx, y, bz, FLOOR);

// ---- 6. the tower crown: a 2 x 2 lift overrun on the core, and a mast of iron bars rising from it
const core = [...C.values()].filter((c) => c.top === 32);
const cx = core.reduce((s, c) => s + c.x, 0) / core.length, cz = core.reduce((s, c) => s + c.z, 0) / core.length;
let best = null;
for (const c of core) {
  const quad = [[c.x, c.z], [c.x + 1, c.z], [c.x, c.z + 1], [c.x + 1, c.z + 1]];
  if (!quad.every(([qx, qz]) => C.get(key(qx, qz))?.top === 32)) continue;
  const d = Math.hypot(c.x + 0.5 - cx, c.z + 0.5 - cz);
  if (!best || d < best.d) best = { d, quad };
}
if (best) {
  for (const [qx, qz] of best.quad) for (const y of [32, 33]) g.set(qx, y, qz, FLOOR);
  const [mx, mz] = best.quad[0];
  for (let y = 34; y <= 37; y++) g.set(mx, y, mz, "iron_bars");
}

const info = g.save(`${DIR}/way_269383011.nbt`);
console.log(JSON.stringify({ size: [X, Y, Z], ...info, door: [door.x, door.z], boxes: boxes.length, crown: !!best }));
