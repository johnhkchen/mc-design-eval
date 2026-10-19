// DC81788: 1910s-20s red-brick commercial block, NJ Ave SE (Capitol side), vacant with a permit.
// Solid masonry from the lowest ground up to a lidar-quantised roof (13 / 17 / 19 blocks): a three-storey
// wing, a four-storey body and a five-storey core set back in the middle. Ground floor shopfronts (some
// boarded up, it is vacant), upper windows with stone sills and lintels, a corner quoin, a smooth-stone
// cornice, one entrance, rooftop plant on the 17 tier, and a few warm lights behind glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC81788.cells.json`, "utf8"));   // [x, z, ground, roof]

const W = 19, H = 31, D = 32;
const g = new Voxels([W, H, D]);

const at = new Map(cells.map(([x, z, gr, roof]) => [`${x},${z}`, { x, z, gr, roof }]));
const has = (x, z) => at.has(`${x},${z}`);

// Outward faces: N is -z (the street end, z = 0), S +z, W -x, E +x.
const FACES = [
  { name: "N", dx: 0, dz: -1, along: "x" },
  { name: "S", dx: 0, dz: 1, along: "x" },
  { name: "W", dx: -1, dz: 0, along: "z" },
  { name: "E", dx: 1, dz: 0, along: "z" },
];

// Lidar roof -> clean tiers: the lidar's 12-13 edges, 16-17 body, 18-19 core.
const tier = (R) => (R <= 13 ? 13 : R <= 17 ? 17 : 19);
for (const c of at.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = at.get(`${c.x + dx},${c.z + dz}`); if (n) vals.push(n.roof);
  }
  vals.sort((a, b) => a - b);
  c.top = tier(vals[Math.floor(vals.length / 2)]);
}

// Depth: 0 on the outside shell, growing inward (BFS through the footprint).
const depth = new Map(); const queue = [];
for (const c of at.values()) {
  if (FACES.some((f) => !has(c.x + f.dx, c.z + f.dz))) { depth.set(`${c.x},${c.z}`, 0); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i], dc = depth.get(`${c.x},${c.z}`);
  for (const f of FACES) {
    const k = `${c.x + f.dx},${c.z + f.dz}`;
    if (has(c.x + f.dx, c.z + f.dz) && !depth.has(k)) { depth.set(k, dc + 1); queue.push(at.get(k)); }
  }
}

// Deterministic pseudo-random 0..99 per position, so the facade pattern is the same on every run.
const roll = (x, y, z, salt = 0) => {
  let h = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263) ^ Math.imul(z + 1, 2246822519) ^ Math.imul(salt + 1, 97);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) % 100;
};

const B = new Map();                       // "x,y,z" -> [block, state]
const k3 = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => B.set(k3(x, y, z), [block, state]);
const carve = (x, y, z) => B.delete(k3(x, y, z));

// Facade block for a perimeter cell at height y (y < R).
function facade(c, faces, y, R, s, k) {
  if (y === 0) return ["stone_bricks"];                                   // plinth at street level
  if (y === R - 1) return faces.length > 1 ? ["smooth_stone"] : ["smooth_stone_slab", { type: "top" }];   // cornice
  if (faces.length > 1) return [y % 2 ? "stone_bricks" : "smooth_stone"];  // corner quoins
  const f = faces[0];
  const u = f.along === "x" ? c.x : c.z;
  const ground = s === 0;
  if (k === 0) return ["smooth_stone"];                                   // sill course = storey line
  if (k === 3) return ["bricks"];                                         // brick spandrel above the window head
  if (ground ? u % 4 === 0 : u % 3 === 0) return ["bricks"];              // piers
  const r = roll(c.x, y, c.z);
  if (ground ? r < 25 : r < 11) return ["spruce_planks"];                  // boarded up: vacant
  return ["glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" }];
}

const windows = [];                        // glass cells that need an air gap behind them
for (const c of at.values()) {
  const R = c.top, dd = depth.get(`${c.x},${c.z}`);
  const faces = FACES.filter((f) => !has(c.x + f.dx, c.z + f.dz));
  for (let y = 0; y < R; y++) {
    if (y < c.gr) { put(c.x, y, c.z, "stone_bricks"); continue; }
    if (dd > 0) { put(c.x, y, c.z, y === R - 1 ? "stone" : "bricks"); continue; }   // solid core, tar roof
    const s = Math.floor((y - 1) / 4), k = (y - 1) % 4;
    const [block, state] = facade(c, faces, y, R, s, k);
    put(c.x, y, c.z, block, state);
    if (block === "glass_pane") windows.push({ c, y, k, face: faces[0] });
  }
}

// Air gap behind each glass pane (one block into the core), with a warm light in some of them.
for (const w of windows) {
  const ix = w.c.x - w.face.dx, iz = w.c.z - w.face.dz;
  if (!has(ix, iz) || depth.get(`${ix},${iz}`) < 1) continue;
  carve(ix, w.y, iz);
  if (w.k !== 1) continue;                 // lights stand on the sill course, so only the lower pane row
  const r = roll(w.c.x, w.y, w.c.z, 7);
  if (r < 8) put(ix, w.y, iz, "glowstone");
  else if (r < 14) put(ix, w.y, iz, "lantern", { hanging: "false", waterlogged: "false" });
  else if (r < 18) put(ix, w.y, iz, "shroomlight");
}

// The entrance: the single-face north cell nearest the middle of the street front, lowest z first.
const north = [...at.values()].filter((c) => {
  const faces = FACES.filter((f) => !has(c.x + f.dx, c.z + f.dz));
  return faces.length === 1 && faces[0].name === "N";
});
const minZ = Math.min(...north.map((c) => c.z));
const door = north.filter((c) => c.z === minZ).sort((a, b) => Math.abs(a.x - 9) - Math.abs(b.x - 9))[0];
const doorBase = { facing: "north", hinge: "left", open: "false", powered: "false" };
put(door.x, 1, door.z, "dark_oak_door", { ...doorBase, half: "lower" });
put(door.x, 2, door.z, "dark_oak_door", { ...doorBase, half: "upper" });
put(door.x, 3, door.z, "stone_bricks");                                   // hood over the door
carve(door.x, 1, door.z + 1); carve(door.x, 2, door.z + 1);             // vestibule behind the door
put(door.x - 1, 1, door.z, "smooth_stone");                               // door surround
put(door.x + 1, 1, door.z, "smooth_stone");

// Rooftop plant on the 17 tier: two 3x2 mechanical boxes on cells well inside the shell.
const plant = [];
for (const c of at.values()) {
  const ok = [0, 1, 2].every((dx) => [0, 1].every((dz) => {
    const n = at.get(`${c.x + dx},${c.z + dz}`);
    return n && n.top === 17 && depth.get(`${n.x},${n.z}`) >= 2;
  }));
  if (ok) plant.push(c);
}
const used = new Set();
for (const c of plant.sort((a, b) => (a.z - b.z) || (a.x - b.x))) {
  const keys = [0, 1, 2].flatMap((dx) => [0, 1].map((dz) => `${c.x + dx},${c.z + dz}`));
  if (keys.some((k) => used.has(k))) continue;
  keys.forEach((k) => used.add(k));
  for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 2; dz++) {
    put(c.x + dx, 17, c.z + dz, "light_gray_concrete");
    put(c.x + dx, 18, c.z + dz, dx === 1 ? "iron_bars" : "light_gray_concrete", dx === 1 ? { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" } : undefined);
  }
  if (used.size >= 4) break;
}

// Glass panes connect to their neighbours, as in the game.
for (const [key, [block, state]] of B) {
  if (block !== "glass_pane" && block !== "iron_bars") continue;
  const [x, y, z] = key.split(",").map(Number);
  const on = (dx, dz) => B.has(k3(x + dx, y, z + dz));
  B.set(key, [block, { north: String(on(0, -1)), south: String(on(0, 1)), east: String(on(1, 0)), west: String(on(-1, 0)), waterlogged: "false" }]);
}

for (const [key, [block, state]] of B) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}

const out = g.save(`${DIR}/DC81788.nbt`);
console.log(`DC81788: ${cells.length} cells, ${windows.length} glass panes, door at x=${door.x} z=${door.z}, ${out.blocks} blocks, ${out.palette} palette entries`);
