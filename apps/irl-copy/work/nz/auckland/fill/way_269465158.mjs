// Way 269465158: a three-storey Edwardian brick commercial block (c. 1910s), the kind Karangahape Road and Newton
// are full of. Brick piers, cream stone string courses and parapet, timber shopfront fascia, and sash-style glass in
// quartz frames. The roof is flat (lidar 11 everywhere) with a gravel membrane behind the parapet and a plant room.
// The footprint falls west to east, so the uphill (west) side has two storeys and the downhill side shows a rusticated
// basement. Storey lines are absolute: string course at y 3 (street floor), y 7 (first floor), coping at y 10.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269465158.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269465158.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

const W = 36, D = 22, H = 24;
const roofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const TOP = roofs[roofs.length >> 1];          // lidar roof height above y0, smoothed to one flat tier
const PARA = TOP - 1;                          // top layer of the parapet; the roof surface is at TOP
const STRING = [3, 7];                         // storey string courses (street floor and first floor)

const foot = new Map();
for (const [x, z, g0] of cells) foot.set(`${x},${z}`, g0);
const has = (x, z) => foot.has(`${x},${z}`);
const gr = (x, z) => foot.get(`${x},${z}`);
const outside = (x, z) => {                    // which sides of this cell face out of the footprint
  const o = [];
  if (!has(x, z - 1)) o.push("N");
  if (!has(x, z + 1)) o.push("S");
  if (!has(x + 1, z)) o.push("E");
  if (!has(x - 1, z)) o.push("W");
  return o;
};
const ring = (x, z) => outside(x, z).length > 0;
const faceOf = (o) => ["N", "S", "E", "W"].find((d) => o.includes(d)) ?? null;
// bay phase along a face: 0 pier, 1 and 4 frame, 2 and 3 glass (a five-block bay)
const phase = (x, z, f) => ((((f === "N" || f === "S") ? x : z) % 5) + 5) % 5;
const INWARD = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0] };
const FACING = { N: "south", S: "north", E: "west", W: "east" };   // a door faces out of its wall

const g = new Voxels([W, H, D]);
const B = (name, state) => ({ name, state });
const put = (x, y, z, b) => g.set(x, y, z, b.name, b.state);

// the front door: a north-facing wall cell in a glass bay, on the low side, nearest the middle of the face
let door = null, best = Infinity;
for (const k of foot.keys()) {
  const [x, z] = k.split(",").map(Number);
  const o = outside(x, z);
  if (!o.includes("N") || gr(x, z) > 2) continue;
  const p = phase(x, z, "N");
  if (p !== 2 && p !== 3) continue;
  if (Math.abs(x - 20) < best) { best = Math.abs(x - 20); door = { x, z }; }
}

function wallAt(y, f, p) {
  if (STRING.includes(y) || y === PARA) return B("smooth_stone");
  if (y < 3) return y === 1 && (p === 2 || p === 3) ? B("glass_pane") : B("stone_bricks");   // rusticated basement
  if (y === 6) return B("dark_oak_planks");                                                  // shopfront fascia
  if (p === 0) return B("bricks");
  if (p === 1 || p === 4) return B("quartz_block");
  return B("glass_pane");
}

// 1. foundation: solid from y 0 up to each cell's ground
for (const [k, g0] of foot) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < g0; y++) put(x, y, z, B("stone_bricks"));
}

// 2. the walls on the footprint's edge, storey by storey, each standing on the one below
for (const k of foot.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!ring(x, z)) continue;
  const o = outside(x, z), f = faceOf(o), p = phase(x, z, f);
  for (let y = gr(x, z); y <= PARA; y++) put(x, y, z, wallAt(y, f, p));
  if (door && x === door.x && z === door.z) {
    const st = { facing: FACING.N, hinge: "left", open: "false", powered: "false" };
    put(x, 4, z, B("dark_oak_door", { ...st, half: "lower" }));
    put(x, 5, z, B("dark_oak_door", { ...st, half: "upper" }));
  }
}

// 3. the entrance: a hanging lantern beside the door, under the fascia that carries it
if (door) {
  for (const dx of [1, -1]) {
    const x = door.x + dx, z = door.z;
    if (has(x, z) && outside(x, z).includes("N")) { put(x, 5, z, B("lantern", { hanging: "true", waterlogged: "false" })); break; }
  }
}

// 4. warm light: glowstone two blocks behind some glass (one block of air between glass and light)
for (const k of foot.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!ring(x, z)) continue;
  const o = outside(x, z), f = faceOf(o), p = phase(x, z, f);
  if (p !== 2 && p !== 3) continue;
  for (const y of [4, 5, 8, 9]) {
    if (y < gr(x, z)) continue;
    if ((x * 13 + z * 7 + y * 5) % 5 !== 0) continue;
    const [ix, iz] = INWARD[f];
    const bx = x + 2 * ix, bz = z + 2 * iz;
    if (has(bx, bz) && !ring(bx, bz)) put(bx, y, bz, B("glowstone"));
  }
}

// 5. the interior: floor slabs at each storey and a gravel roof membrane; air between, so the glass has a gap behind it
for (const k of foot.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (ring(x, z)) continue;
  const g0 = gr(x, z);
  for (const y of [g0, ...STRING]) if (y >= g0) put(x, y, z, B("oak_planks"));
  put(x, PARA, z, B("gravel"));
}

// 6. roof plant: a small plant room on the gravel, centred on the footprint, plus two condenser units
const deep = (x, z) => has(x, z) && !ring(x, z);
let cx = 0, cz = 0, n = 0;
for (const k of foot.keys()) { const [x, z] = k.split(",").map(Number); cx += x; cz += z; n++; }
cx /= n; cz /= n;
let box = null, boxD = Infinity;
for (let x0 = 0; x0 + 5 <= W; x0++) for (let z0 = 0; z0 + 3 <= D; z0++) {
  let ok = true;
  for (let x = x0; x < x0 + 5 && ok; x++) for (let z = z0; z < z0 + 3 && ok; z++) ok = deep(x, z);
  if (!ok) continue;
  const d = Math.hypot(x0 + 2 - cx, z0 + 1 - cz);
  if (d < boxD) { boxD = d; box = { x0, z0 }; }
}
if (box) {
  const { x0, z0 } = box;
  for (let x = x0; x < x0 + 5; x++) for (let z = z0; z < z0 + 3; z++) {
    const edge = x === x0 || x === x0 + 4 || z === z0 || z === z0 + 2;
    for (let y = PARA + 1; y <= PARA + 2; y++) {
      const win = edge && (z === z0 || z === z0 + 2) && x === x0 + 2;
      put(x, y, z, win ? B("glass_pane") : edge ? B("bricks") : B("air"));
    }
    put(x, PARA + 3, z, B("smooth_stone"));
  }
  for (const [x, z] of [[x0 - 2, z0 + 1], [x0 + 6, z0 + 1]]) {
    if (deep(x, z)) put(x, PARA + 1, z, B("light_gray_concrete"));
  }
}

const info = g.save(OUT);
console.log(`way_269465158: ${cells.length} footprint cells, roof ${TOP}, door ${JSON.stringify(door)}, plant ${JSON.stringify(box)}, ${info.blocks} blocks, ${info.palette} palette`);
