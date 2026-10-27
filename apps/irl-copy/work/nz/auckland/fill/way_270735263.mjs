// Way 270735263, Mt Eden / Newton frontage: a two-storey 1920s-30s brick shop block with a flat roof and parapet.
// Stone plinth on the sloping ground, dark-oak shopfronts with a recessed entrance on the low north-west side,
// white plaster string and lintel bands, recessed sash-style glass with an air pocket behind each pane, lanterns and
// glowstone behind some panes, a stone-brick roof plant room. Storeys are 4 blocks: 0-3 ground, 4-7 upper, 8 cornice, 9 parapet.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const WORK = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${WORK}/way_270735263.cells.json`, "utf8"));   // [x, z, ground, roof]
const SIZE = [19, 23, 17];

const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, r: Math.round(r) });
const inFp = (x, z) => fp.has(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const outward = (x, z) => Object.keys(DIRS).filter((k) => !inFp(x + DIRS[k][0], z + DIRS[k][1]));
const tangent = (f, x, z) => (f === "N" || f === "S" ? x : z);   // position along a face

// desired block per cell: key "x,y,z" -> [name, state] or null for air
const put = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const set = (x, y, z, block, state) => put.set(key(x, y, z), block ? [block, state] : null);
const get = (x, y, z) => put.get(key(x, y, z));

// 1. massing: solid masonry from the ground up to the roof, with storey bands and the parapet
const perimeter = new Set();
for (const [k, { g, r }] of fp) {
  const [x, z] = k.split(",").map(Number);
  const faces = outward(x, z);
  const perim = faces.length > 0;
  if (perim) perimeter.add(k);
  for (let y = 0; y < r; y++) {
    let b;
    if (y < g) b = perim ? "stone_bricks" : "stone";                 // foundation fill under the ground
    else if (y === g) b = perim ? "stone_bricks" : "smooth_stone";     // plinth course / ground-floor slab
    else if (y === r - 1) b = perim ? "bricks" : null;                 // parapet ring; roof inside stays open
    else if (y === r - 2) b = perim ? "smooth_stone" : "stone";        // cornice / roof membrane
    else if (y === 4) b = perim ? "white_concrete" : "smooth_stone";   // string course / upper floor slab
    else if (y === 7 && perim) b = "white_concrete";                   // upper lintel band
    else if (y === 3 && perim && g <= 2) b = "dark_oak_planks";        // shopfront fascia
    else b = "bricks";
    set(x, y, z, b);
  }
}

// 2. windows: recessed glass with an air pocket behind; piers stay solid; shopfront stiles in dark oak
const panes = [];
let windowIndex = 0;
const lightCells = [];
const windowCells = [];
for (const k of perimeter) {
  const [x, z] = k.split(",").map(Number);
  const faces = outward(x, z);
  // the footprint is a staircase, so most edge cells touch two faces: glaze the first face (street side first)
  // whose two inner cells are footprint cells, so the air gap behind the pane is real
  const { g, r } = fp.get(k);
  const f = ["N", "W", "E", "S"].find((d) => faces.includes(d) && inFp(x - DIRS[d][0], z - DIRS[d][1]) && inFp(x - 2 * DIRS[d][0], z - 2 * DIRS[d][1]));
  if (!f) continue;
  const [ox, oz] = DIRS[f];
  const t = tangent(f, x, z);
  const d1 = [x - ox, z - oz], d2 = [x - 2 * ox, z - 2 * oz];
  const upper = g <= 5 ? [Math.max(5, g + 1), 6] : null;               // upper storey glazing
  const ground = g <= 1 ? [g + 1, 2] : null;                           // shopfront glazing
  const band = t % 4 === 0 || t % 4 === 3;                             // stiles / piers
  for (const zone of [ground, upper]) {
    if (!zone) continue;
    const [lo, hi] = zone;
    if (band) {
      if (zone === ground) for (let y = lo; y <= hi; y++) set(x, y, z, "dark_oak_planks");
      continue;
    }
    windowCells.push({ x, z, f, d1, d2, lo, hi, idx: windowIndex++ });
    for (let y = lo; y <= hi; y++) {
      set(x, y, z, null);                                              // recess: air in front of the glass
      set(d1[0], y, d1[1], "glass_pane");                              // the pane, one block in
      set(d2[0], y, d2[1], null);                                      // air gap behind the glass
      panes.push({ x: d1[0], y, z: d1[1], f });
    }
  }
}

// 3. a warm light behind some panes (lantern on the pocket floor, glowstone in a few)
for (const w of windowCells) {
  if (w.idx % 3 === 0) set(w.d2[0], w.lo, w.d2[1], "lantern", { hanging: "false", waterlogged: "false" });
  else if (w.idx % 5 === 2) set(w.d2[0], w.lo, w.d2[1], "glowstone");
}

// 4. the entrance: recessed dark-oak door on the low north side, lintel above
const entrances = [];
for (const k of perimeter) {
  const [x, z] = k.split(",").map(Number);
  if (!outward(x, z).includes("N")) continue;
  if (fp.get(k).g !== 0) continue;
  if (!inFp(x, z + 1) || !inFp(x, z + 2)) continue;
  entrances.push({ x, z });
}
entrances.sort((a, b) => a.x - b.x);
const door = entrances[Math.floor(entrances.length / 2)];
for (const y of [1, 2]) {
  set(door.x, y, door.z, null);
  set(door.x, y, door.z + 1, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
  set(door.x, y, door.z + 2, null);
}

// 5. roof plant room: a 3x3 box of stone brick on the roof membrane, lit by a single iron block lid
let plant = null;
for (const k of fp.keys()) {
  const [x0, z0] = k.split(",").map(Number);
  let ok = true;
  for (let dx = -1; dx <= 1 && ok; dx++) for (let dz = -1; dz <= 1 && ok; dz++) {
    const x = x0 + dx, z = z0 + dz;
    if (!inFp(x, z) || perimeter.has(`${x},${z}`) || fp.get(`${x},${z}`).g > 3) ok = false;
  }
  if (ok && (!plant || Math.hypot(x0 - 9, z0 - 8) < Math.hypot(plant.x - 9, plant.z - 8))) plant = { x: x0, z: z0 };
}
if (plant) {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    set(plant.x + dx, 9, plant.z + dz, "stone_bricks");
    set(plant.x + dx, 10, plant.z + dz, "stone_bricks");
  }
  set(plant.x, 11, plant.z, "iron_block");
}

// 6. glass panes connect to whatever stands beside them in the wall's plane
for (const p of panes) {
  const conn = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  const solid = (x, y, z) => !!get(x, y, z);
  if (p.f === "N" || p.f === "S") { conn.east = solid(p.x + 1, p.y, p.z) ? "true" : "false"; conn.west = solid(p.x - 1, p.y, p.z) ? "true" : "false"; }
  else { conn.north = solid(p.x, p.y, p.z - 1) ? "true" : "false"; conn.south = solid(p.x, p.y, p.z + 1) ? "true" : "false"; }
  set(p.x, p.y, p.z, "glass_pane", conn);
}

// 7. write the volume
const g = new Voxels(SIZE);
for (const [k, v] of put) {
  if (!v) continue;
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v[0], v[1]);
}
const out = `${WORK}/way_270735263.nbt`;
const stats = g.save(out);
console.log(`way_270735263: ${cells.length} footprint cells, ${stats.blocks} blocks, ${stats.palette} palette entries, ${windowCells.length} window bays, door at ${door.x},${door.z}, plant room at ${plant ? `${plant.x},${plant.z}` : "none"}`);
