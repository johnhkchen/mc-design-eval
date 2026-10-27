import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mt Eden, Edwardian brick shop-top: a one-storey wing under a hip roof, and a 2.5-storey brick core with a flat roof
// and a parapet at lidar height (10). Front = the north face, a shopfront with the door at (3,0).
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095570520.cells.json", "utf8"));
const [X, Y, Z] = [9, 23, 8];
const g = new Voxels([X, Y, Z]);

const F = new Map();                                    // "x,z" -> { ground, roof }
for (const [x, z, ground, roof] of cells) F.set(`${x},${z}`, { ground, roof });
const inF = (x, z) => F.has(`${x},${z}`);
const roofAt = (x, z) => F.get(`${x},${z}`)?.roof ?? -1;
const core = (x, z) => inF(x, z) && roofAt(x, z) >= 10;
const wing = (x, z) => inF(x, z) && roofAt(x, z) < 10;
// [name of the outward side, dx, dz]: the side of a cell that faces open air (not another footprint cell)
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const outward = (x, z) => DIRS.filter(([, dx, dz]) => !inF(x + dx, z + dz));
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const pane = (dx) => (dx ? { north: "true", south: "true", east: "false", west: "false" } : { east: "true", west: "true", north: "false", south: "false" });

// ground: a stone base course on the perimeter, a smooth-stone floor inside; the core's inner cells carry piers up to its floor
for (const k of F.keys()) {
  const [x, z] = k.split(",").map(Number);
  const out = outward(x, z);
  put(x, 0, z, out.length ? "stone_bricks" : "smooth_stone");
  if (!out.length && core(x, z)) for (let y = 1; y <= 3; y++) put(x, y, z, "bricks");   // piers under the core floor
}

// ground storey walls: brick, glass sashes with a lintel course, a shopfront and a door on the north face
for (const k of F.keys()) {
  const [x, z] = k.split(",").map(Number);
  const out = outward(x, z);
  if (!out.length) continue;
  const [face, dx, dz] = out[0];
  const front = face === "north" && z === 0;
  const door = front && x === 3;
  const win = door ? false : front ? true : (x + z) % 2 === 1;
  for (let y = 1; y <= 3; y++) put(x, y, z, "bricks");
  if (door) {
    const st = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
    put(x, 1, z, "dark_oak_door", st("lower"));
    put(x, 2, z, "dark_oak_door", st("upper"));
  } else if (win) {
    for (let y = 1; y <= 2; y++) put(x, y, z, "glass_pane", pane(dx));
  }
  // a lamp on the floor just inside a lit sash, in the air behind the glass
  const [ix, iz] = [x - dx, z - dz];
  if (win && (x + z) % 4 === 1 && wing(ix, iz) && !outward(ix, iz).length) put(ix, 1, iz, "lantern", { hanging: "false" });
}

// the wing's hip roof: a stair-stepped pitch from its eave (y4) to its ridge (y7), inset one block per course
const ins = new Map(), q = [];
for (const k of F.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (wing(x, z) && DIRS.some(([, dx, dz]) => !wing(x + dx, z + dz))) { ins.set(k, 0); q.push([x, z]); }
}
for (let i = 0; i < q.length; i++) {
  const [x, z] = q[i], d = ins.get(`${x},${z}`);
  for (const [, dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz, k = `${nx},${nz}`;
    if (wing(nx, nz) && !ins.has(k)) { ins.set(k, d + 1); q.push([nx, nz]); }
  }
}
const roofed = (x, z, y) => wing(x, z) && ins.get(`${x},${z}`) >= y - 4;
for (let y = 4; y <= 7; y++) {
  for (const k of ins.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (!roofed(x, z, y)) continue;
    const open = DIRS.find(([, dx, dz]) => !roofed(x + dx, z + dz, y));
    if (open) put(x, y, z, "deepslate_tile_stairs", { facing: open[0], half: "bottom", shape: "straight", waterlogged: "false" });
    else put(x, y, z, "deepslate_tiles");
  }
}

// the core: a floor course at y4, upper storey walls and sashes at y5-8, a flat roof at y9, a parapet at y10 (lidar 10)
for (const k of F.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!core(x, z)) continue;
  const out = outward(x, z);
  put(x, 4, z, "stone_bricks");
  put(x, 9, z, "smooth_stone");
  if (!out.length) continue;                       // inner cells: air gap under the roof, not walls
  const [, dx] = out[0];
  const win = (x + z) % 2 === 0;
  for (let y = 5; y <= 8; y++) put(x, y, z, "bricks");
  if (win) for (let y = 6; y <= 7; y++) put(x, y, z, "glass_pane", pane(dx));
  put(x, 10, z, "bricks");                         // parapet
}
put(2, 10, 5, "lightning_rod");                   // roof fixture on the core's inner roof

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095570520.nbt";
const info = g.save(out);
console.log(JSON.stringify(info));
