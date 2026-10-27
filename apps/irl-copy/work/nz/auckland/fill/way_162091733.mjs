import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 162091733: a 1930s stripped-classical brick-and-stone commercial block. Three storeys over a shopfront ground
// floor, a stone cornice, a brick parapet, and a plant room on the flat roof. The lidar roof runs 11 to 13 blocks above
// y 0 and is smoothed to one tier: the roof deck is solid through y 12 and the parapet takes it to 14 blocks.

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_162091733.cells.json`, "utf8"));
const SIZE = [31, 26, 30];
const FLOORS = [4, 8];   // storey lines: the floor slab under the 2nd and 3rd storeys
const DECK = 12;         // roof deck, solid through y 12
const PARAPET = 13;      // one parapet course on the wall ring

const key = (x, y, z) => `${x},${y},${z}`;
const col = (x, z) => `${x},${z}`;
const plan = new Map();  // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => plan.set(key(x, y, z), { block, state });
const at = (x, y, z) => plan.get(key(x, y, z));

const ground = new Map(cells.map(([x, z, g]) => [col(x, z), g]));
const inF = (x, z) => ground.has(col(x, z));
const DIR = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
// the outward faces a footprint cell is exposed on (a neighbour outside the footprint)
const exposed = (x, z) => Object.keys(DIR).filter((d) => !inF(x + DIR[d][0], z + DIR[d][1]));
const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;

// the door: a ground-floor wall cell on the south face (else any face), mid-bay, nearest the middle of the front
const doorCands = cells.filter(([x, z, g]) => g === 0 && exposed(x, z).length === 1 && x % 3 === 1 && exposed(x, z)[0] !== "north" && exposed(x, z)[0] !== "west");
const southDoors = doorCands.filter(([x, z]) => exposed(x, z)[0] === "south");
const doorPool = (southDoors.length ? southDoors : doorCands).sort((a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx));
const door = doorPool[0] ? { x: doorPool[0][0], z: doorPool[0][1], face: exposed(doorPool[0][0], doorPool[0][1])[0] } : null;

// 1. massing: foundation, floor slabs, the wall ring and the windows, storey by storey
for (const [x, z, g] of cells) {
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");            // foundation under the raised cells
  const ex = exposed(x, z);
  if (!ex.length) {                                                    // interior: air behind the glass, slabs between
    put(x, g, z, "smooth_stone");
    for (const f of FLOORS) put(x, f, z, "smooth_stone");
    put(x, DECK, z, "light_gray_concrete");
    continue;
  }
  const corner = ex.length > 1;
  const bay = ex.includes("north") || ex.includes("south") ? x : z;   // position along the face
  const pier = corner || bay % 3 === 0;                                // 1-wide brick piers, 2-wide windows
  const onDoor = door && door.x === x && door.z === z;
  put(x, g, z, "stone_bricks");                                        // base course
  for (let y = g + 1; y <= PARAPET; y++) {
    let block;
    if (corner) block = (x + z) % 2 === 0 ? "stone_bricks" : "bricks";  // quoins alternate on the stepped edges, not solid stone
    else if (y === PARAPET) block = "bricks";
    else if (y === 12) block = bay % 2 === 0 ? "chiseled_stone_bricks" : "smooth_stone";   // cornice dentils
    else if (y === 11 || y === 8 || y === 7 || y === 4) block = "smooth_stone";             // lintels, string courses
    else if (y === 3) block = onDoor ? "stone_bricks" : "dark_oak_planks";                 // fascia over the shopfront
    else block = pier ? "bricks" : "glass_pane";                                           // window rows 1-2, 5-6, 9-10
    put(x, y, z, block);
  }
  if (onDoor) {                                                        // the doorway: two door blocks, a stone portico
    put(x, 1, z, "dark_oak_door", { facing: door.face, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, 2, z, "dark_oak_door", { facing: door.face, half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// the portico: stone pilasters either side of the door on the same face, the lintel above it (fascia row 3)
if (door) {
  const [ax, az] = door.face === "north" || door.face === "south" ? [1, 0] : [0, 1];
  for (const sgn of [-1, 1]) for (const y of [1, 2]) put(door.x + sgn * ax, y, door.z + sgn * az, "stone_bricks");
}

// 2. panes join their neighbours along the face, as a wall does
const s = (b) => (b ? "true" : "false");
for (const [k, v] of plan) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const ex = exposed(x, z);
  const joins = (dx, dz) => { const n = at(x + dx, y, z + dz); return !!n && !/door|lantern/.test(n.block); };
  if (ex.includes("north") || ex.includes("south")) {
    v.state = { north: "false", south: "false", east: s(joins(1, 0)), west: s(joins(-1, 0)) };
  } else {
    v.state = { north: s(joins(0, -1)), south: s(joins(0, 1)), east: "false", west: "false" };
  }
}

// 3. warm lights: a lantern on the floor two cells back from some lowest window rows (an air gap behind the glass)
let lamps = 0;
for (const [x, z, g] of cells) {
  const ex = exposed(x, z);
  if (ex.length !== 1) continue;
  const bay = ex[0] === "north" || ex[0] === "south" ? x : z;
  if (bay % 3 === 0) continue;
  for (const f of [g, FLOORS[0], FLOORS[1]]) {
    const y = f + 1;
    if (!at(x, y, z) || at(x, y, z).block !== "glass_pane") continue;
    if (((x * 5 + z * 3 + y) % 7) !== 0) continue;
    const [ox, oz] = DIR[ex[0]];
    const lx = x - 2 * ox, lz = z - 2 * oz;
    if (!inF(lx, lz) || exposed(lx, lz).length || at(lx, y, lz)) continue;
    put(lx, y, lz, "lantern", { hanging: "false" });
    lamps++;
  }
}

// 4. roof equipment: a plant room, 5 by 4 on the interior of the roof, brick walls, a flat stone lid
let plant = null;
for (let x0 = 0; x0 + 5 <= SIZE[0]; x0++) {
  for (let z0 = 0; z0 + 4 <= SIZE[2]; z0++) {
    let ok = true;
    for (let x = x0; x < x0 + 5 && ok; x++) for (let z = z0; z < z0 + 4 && ok; z++) ok = inF(x, z) && !exposed(x, z).length;
    if (!ok) continue;
    const d = Math.hypot(x0 + 2 - cx, z0 + 1.5 - cells.reduce((s2, c) => s2 + c[1], 0) / cells.length);
    if (!plant || d < plant.d) plant = { x0, z0, d };
  }
}
if (plant) {
  for (let x = plant.x0; x < plant.x0 + 5; x++) {
    for (let z = plant.z0; z < plant.z0 + 4; z++) {
      const edge = x === plant.x0 || x === plant.x0 + 4 || z === plant.z0 || z === plant.z0 + 3;
      const corner = (x === plant.x0 || x === plant.x0 + 4) && (z === plant.z0 || z === plant.z0 + 3);
      for (let y = DECK + 1; y <= DECK + 3; y++) if (edge) put(x, y, z, corner ? "stone_bricks" : "bricks");
      put(x, DECK + 4, z, "smooth_stone");
    }
  }
}

// 5. write the volume
const g = new Voxels(SIZE);
for (const [k, v] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const out = `${HERE}/way_162091733.nbt`;
const res = g.save(out);
console.log(`way_162091733: ${res.blocks} blocks, ${res.palette} palette entries, ${lamps} lanterns, plant room ${plant ? "yes" : "no"} -> ${out}`);
