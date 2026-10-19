// 3550 Pacific Ave (Miscellaneous/Mixed-Use): a 1920s cream-stucco block, shopfront at grade over three residential
// storeys, flat roof behind a cornice. A ring of walls two cells thick follows the footprint, with an air cavity
// behind the glass, a floor slab per storey and a roof slab; no interiors. Foundation fill from y 0 to each cell's ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill";
const cells = JSON.parse(readFileSync(`${DIR}/201006.0001155.cells.json`, "utf8"));   // [x, z, ground]
const SIZE = [40, 23, 53];
const ROOF = 10, TOP = 11;                       // cornice row (top solid), roof equipment sits on the roof at TOP
const FLOORS = [4, 7];                           // floor slabs (and the stringcourses that run over them)

const key = (x, y, z) => `${x},${y},${z}`;
const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const inside = (x, z) => ground.has(`${x},${z}`);
const N8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
const N4 = [[0, -1], [0, 1], [1, 0], [-1, 0]];
const FACING = { "0,-1": "north", "0,1": "south", "1,0": "east", "-1,0": "west" };
const OPP = { north: "south", south: "north", east: "west", west: "east" };

// Depth: 0 = outside face (any 8-neighbour is outside the footprint), 1 = the next ring in, and so on.
const depth = new Map();
let frontier = [];
for (const [x, z] of cells) if (N8.some(([dx, dz]) => !inside(x + dx, z + dz))) { depth.set(`${x},${z}`, 0); frontier.push([x, z]); }
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const [x, z] of frontier) for (const [dx, dz] of N8) {
    const k = `${x + dx},${z + dz}`;
    if (ground.has(k) && !depth.has(k)) { depth.set(k, d); next.push([x + dx, z + dz]); }
  }
  frontier = next;
}
const D = (x, z) => depth.get(`${x},${z}`) ?? 99;

// Long axis of the footprint (principal direction): U runs along the block, bays are cut along U.
const n = cells.length;
const cx = cells.reduce((s, [x]) => s + x, 0) / n, cz = cells.reduce((s, [, z]) => s + z, 0) / n;
let sxx = 0, szz = 0, sxz = 0;
for (const [x, z] of cells) { const dx = x - cx, dz = z - cz; sxx += dx * dx; szz += dz * dz; sxz += dx * dz; }
const th = 0.5 * Math.atan2(2 * sxz, sxx - szz), ax = Math.cos(th), az = Math.sin(th);
const U = (x, z) => (x - cx) * ax + (z - cz) * az;
const bayOf = (x, z) => Math.round(U(x, z));
const isPier = (x, z) => ((bayOf(x, z) % 3) + 3) % 3 === 0;   // 1 pier, 2 glass, repeating

// Outward 4-neighbour of a facade cell (the way it faces), and which long side it sits on (+1 / -1).
const outward = (x, z) => N4.find(([dx, dz]) => !inside(x + dx, z + dz)) ?? null;
const sideOf = (x, z) => { const o = outward(x, z); return o ? Math.sign(o[0] * -az + o[1] * ax) : 0; };

// Entrances: the window-free bay nearest a target along U, on a chosen long side.
const facade = cells.filter(([x, z]) => D(x, z) === 0 && outward(x, z));
function pickDoor(side, uT) {
  const c = facade.filter(([x, z]) => sideOf(x, z) === side && !isPier(x, z));
  return c.reduce((best, p) => (Math.abs(U(p[0], p[1]) - uT) < Math.abs(U(best[0], best[1]) - uT) ? p : best));
}
const doors = [pickDoor(1, -8), pickDoor(-1, 8)].map(([x, z]) => ({ x, z, facing: OPP[FACING[outward(x, z).join(",")]] }));
const nearDoor = (x, z) => doors.some((d) => Math.max(Math.abs(d.x - x), Math.abs(d.z - z)) <= 1);
const doorAt = (x, z) => doors.find((d) => d.x === x && d.z === z);

// Roof spots: a square of interior roof (depth >= minDepth) nearest a target along U.
function roofSpot(uT, s, minDepth) {
  let best = null;
  for (const [x, z] of cells) {
    let ok = true;
    for (let i = 0; i < s && ok; i++) for (let j = 0; j < s && ok; j++) ok = inside(x + i, z + j) && D(x + i, z + j) >= minDepth;
    if (!ok) continue;
    const dU = Math.abs(U(x + (s - 1) / 2, z + (s - 1) / 2) - uT);
    if (!best || dU < best.dU) best = { x, z, dU };
  }
  return best;
}

const out = new Map();
const put = (x, y, z, block, state) => out.set(key(x, y, z), { block, state });

for (const [x, z, gr] of cells) {
  const d = D(x, z);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");                               // foundation fill up to the ground
  for (let y = gr; y < 2; y++) put(x, y, z, d === 0 ? "polished_andesite" : "stone_bricks");  // base course on the downhill side
  // Interior (depth >= 2): air, with a floor slab per storey and the roof slab.
  if (d >= 2) {
    for (const y of FLOORS) put(x, y, z, "smooth_stone");
    put(x, ROOF, z, "stone");
    continue;
  }
  // Ring (depth 0 and 1): the walls.
  const pier = isPier(x, z), door = doorAt(x, z);
  for (let y = 2; y <= ROOF; y++) {
    if (y === ROOF) { put(x, y, z, "smooth_quartz"); continue; }                       // cornice, both skins
    if (FLOORS.includes(y)) {                                                          // stringcourse, both skins
      put(x, y, z, d === 0 && nearDoor(x, z) ? "dark_oak_slab" : "smooth_quartz", d === 0 && nearDoor(x, z) ? { type: "bottom", waterlogged: "false" } : undefined);
      continue;
    }
    if (y <= 3) {                                                                     // shopfront: bulkhead, glass, piers, doors
      if (pier) { put(x, y, z, "polished_andesite"); continue; }
      if (door) {
        if (d === 0) put(x, y, z, "dark_oak_door", { facing: door.facing, half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (d === 0) {
        if (y === 2) put(x, y, z, "dark_oak_planks"); else put(x, y, z, "glass_pane");
      } else if ((bayOf(x, z) >> 0) % 2 === 0 && y === 2) {
        put(x, y, z, "lantern", { hanging: "false" });                                 // shop lamp, in the cavity behind the glass
      }
      continue;
    }
    // Residential storeys (rows 5-6 and 8-9): piers in quartz, windows with an air cavity behind.
    if (pier) { put(x, y, z, "quartz_bricks"); continue; }
    if (d === 0) { put(x, y, z, "glass_pane"); continue; }
    const k = Math.floor(bayOf(x, z) / 3);
    const lit = (y === 5 && ((k % 4) + 4) % 4 === 1) || (y === 8 && ((k % 4) + 4) % 4 === 3);
    if (lit) put(x, y, z, "glowstone");                                               // warm glow at the back of the glass
  }
}

// Roof: the ring is capped, interior roof slab at ROOF; HVAC boxes, a planted bed and a few azaleas on top.
for (const [s, uT, block] of [[2, -12, "light_gray_concrete"], [2, 10, "light_gray_concrete"]]) {
  const sp = roofSpot(uT, s, 3);
  if (!sp) continue;
  for (let i = 0; i < s; i++) for (let j = 0; j < s; j++) { put(sp.x + i, TOP, sp.z + j, block); put(sp.x + i, TOP + 1, sp.z + j, block); }
}
const bed = roofSpot(0, 3, 3);
if (bed) {
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) put(bed.x + i, TOP, bed.z + j, "moss_block");
  put(bed.x + 1, TOP + 1, bed.z + 1, "azalea");
  put(bed.x, TOP + 1, bed.z, "flowering_azalea");
}

// Glass panes connect to their neighbours in the wall plane (the way vanilla draws them).
const NOCONNECT = /lantern|door|slab|air/;
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const g = new Voxels(SIZE);
for (const [k, v] of out) {
  const [x, y, z] = k.split(",").map(Number);
  let { block, state } = v;
  if (block === "glass_pane") {
    state = { waterlogged: "false" };
    for (const [dir, [dx, dz]] of Object.entries(DIRS)) {
      const nb = out.get(key(x + dx, y, z + dz));
      state[dir] = String(!!nb && !NOCONNECT.test(nb.block));
    }
  }
  g.set(x, y, z, block, state);
}

const stats = g.save(`${DIR}/201006.0001155.nbt`);
console.log(JSON.stringify({ cells: cells.length, depthMax: Math.max(...depth.values()), doors, ...stats }));
