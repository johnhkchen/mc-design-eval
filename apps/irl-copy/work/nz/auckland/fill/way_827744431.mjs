// French House, Mt Eden Road side of the CBD fringe: a 1920s-30s reinforced-concrete block in cream plaster on a
// basalt plinth (Auckland's volcanic stone), a 4-storey core stepping down through 2-storey wings to 1-storey shops.
// Massing from the lidar roof: each cell's roof is snapped to a storey tier (1-4 storeys, floors every 4 blocks from
// y 2, parapet above the top storey so the tower tops out at y 19). Solid mass; windows are recessed glass panes with
// an air gap behind, floors are solid slabs, nothing sits without support below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_827744431.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_827744431.nbt";
const FIRST_FLOOR = 2;   // y of the ground storey's floor (the uphill ground); a storey is 4 blocks

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => `${x},${z}`;
const fp = new Map();
for (const [x, z, ground, roof] of cells) fp.set(key(x, z), { ground, roof });

// Storey tier from the lidar roof, then the median of the 3x3 footprint around each cell so the tiers come out flat.
const tierOf = (roof) => (roof <= 7 ? 1 : roof <= 13 ? 2 : roof <= 16 ? 3 : 4);
const around = (x, z) => [[-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]
  .map(([dx, dz]) => key(x + dx, z + dz)).filter((k) => fp.has(k));
const tier = new Map();
for (const [k, { roof }] of fp) {
  const [x, z] = k.split(",").map(Number);
  const t = around(x, z).map((n) => tierOf(fp.get(n).roof)).sort((a, b) => a - b);
  tier.set(k, t.length ? t[Math.floor(t.length / 2)] : tierOf(roof));
}

// Per column: S = roof surface (parapet top, 4n + 3), ring = on the outer edge of the footprint (parapet there only;
// the steps between tiers stay clean and the upper tiers' decks stay open for plant).
const col = new Map();
for (const [k, { ground }] of fp) {
  const [x, z] = k.split(",").map(Number);
  const n = tier.get(k), S = 4 * n + 3;
  const ring = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !fp.has(key(x + dx, z + dz)));
  col.set(k, { ground, n, S, ring, top: ring ? S - 1 : S - 2 });   // body is solid from y 0 up to top
}
const colAt = (x, z) => col.get(key(x, z));
const body = (x, y, z) => { const c = colAt(x, z); return !!c && y >= 0 && y <= c.top; };

const v = new Voxels([22, 31, 15]);
const AIR = null;
const plan = new Map();                       // "x,y,z" -> { block, state } or AIR
const P = (x, y, z) => `${x},${y},${z}`;
const exposed = (x, y, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => !body(x + dx, y, z + dz));
const paneState = (dx) => (dx !== 0
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

// 1. the solid mass and its articulation
for (const [k] of fp) {
  const [x, z] = k.split(",").map(Number), c = colAt(x, z);
  for (let y = 0; y <= c.top; y++) {
    let block = "smooth_quartz";
    const r = y >= FIRST_FLOOR ? (y - FIRST_FLOOR) % 4 : -1;
    const storey = y >= FIRST_FLOOR ? Math.floor((y - FIRST_FLOOR) / 4) : -1;
    const ext = exposed(x, y, z);
    if (y < FIRST_FLOOR) block = "stone_bricks";                       // foundation and the lower (downhill) storey
    else if (y === c.S - 1) block = "smooth_quartz";                    // parapet ring
    else if (r === 0) block = "stone_bricks";                           // storey string course
    else if (r === 3) block = (y === c.S - 2 && c.ring) ? "chiseled_quartz_block" : "smooth_quartz";
    else if (!c.ring && y === c.top) block = "smooth_stone";            // flat roof deck inside the parapet
    else if (ext.length > 1) block = "quartz_pillar";                   // corner pier
    else if (ext.length === 1) {
      const [dx, dz] = ext[0], along = dx !== 0 ? z : x;
      if (along % 3 === 0) block = storey === 0 ? "dark_oak_planks" : "quartz_pillar";
    }
    plan.set(P(x, y, z), { block, state: block === "quartz_pillar" ? { axis: "y" } : undefined });
  }
}

// 2. recessed windows: outer cell air, pane one in, air gap behind the pane (where the wall is thick enough)
let windows = 0, lanterns = 0;
for (const [k] of fp) {
  const [x, z] = k.split(",").map(Number), c = colAt(x, z);
  for (let y = FIRST_FLOOR; y <= c.top; y++) {
    const r = (y - FIRST_FLOOR) % 4;
    if (r !== 1 && r !== 2) continue;
    const ext = exposed(x, y, z);
    if (ext.length !== 1) continue;
    const [dx, dz] = ext[0], along = dx !== 0 ? z : x;
    if (along % 3 === 0) continue;                                       // a pier
    if (!body(x - dx, y, z - dz)) continue;                              // no wall behind it to recess into
    plan.set(P(x, y, z), AIR);
    plan.set(P(x - dx, y, z - dz), { block: "glass_pane", state: paneState(dx) });
    if (body(x - 2 * dx, y, z - 2 * dz)) {
      plan.set(P(x - 2 * dx, y, z - 2 * dz), AIR);
      // warm light: a lantern standing on the room's floor, in some bays
      if (r === 1 && (x * 7 + z * 3 + 5 * Math.floor((y - FIRST_FLOOR) / 4)) % 5 === 0) {
        plan.set(P(x - 2 * dx, y, z - 2 * dz), { block: "lantern", state: { hanging: "false", waterlogged: "false" } });
        lanterns++;
      }
    }
    windows++;
  }
}

// 3. entrance on the south-facing ground storey: doorway, dark timber hood over it, a passage through the wall
const door = [...fp.keys()].map((k) => k.split(",").map(Number))
  .filter(([x, z]) => {
    const ext = exposed(x, FIRST_FLOOR, z);
    return ext.some(([dx, dz]) => dz === 1 && dx === 0) && body(x, FIRST_FLOOR, z - 1);
  })
  .sort((a, b) => b[1] - a[1] || a[0] - b[0]);
if (door.length) {
  const [x, z] = door[Math.floor(door.length / 2)];
  const facing = "south";
  plan.set(P(x, FIRST_FLOOR, z), { block: "dark_oak_door", state: { facing, half: "lower", hinge: "left", open: "false", powered: "false" } });
  plan.set(P(x, FIRST_FLOOR + 1, z), { block: "dark_oak_door", state: { facing, half: "upper", hinge: "left", open: "false", powered: "false" } });
  plan.set(P(x, FIRST_FLOOR + 2, z), { block: "dark_oak_planks" });   // hood
  for (const y of [FIRST_FLOOR, FIRST_FLOOR + 1]) {
    plan.set(P(x, y, z - 1), AIR);
    if (body(x, y, z - 2)) plan.set(P(x, y, z - 2), AIR);
  }
}

// 4. roof plant on the tower's flat deck (lift-motor boxes, a few)
let plant = 0;
for (const [k, c] of col) {
  const [x, z] = k.split(",").map(Number);
  if (c.n === 4 && !c.ring && (x * 2 + z * 3) % 7 === 0 && plant < 4) {
    plan.set(P(x, c.top + 1, z), { block: "iron_block" });
    plant++;
  }
}

// 5. write it out
for (const [k, spec] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  if (!spec) v.set(x, y, z, "air");
  else v.set(x, y, z, spec.block, spec.state);
}

// 6. every block has a block under it or beside it (no floating courses)
const solid = (x, y, z) => { const s = v.get(x, y, z); return !!s; };
let floating = 0;
for (let x = 0; x < 22; x++) for (let y = 0; y < 31; y++) for (let z = 0; z < 15; z++) {
  if (!solid(x, y, z)) continue;
  const supported = y === 0 || solid(x, y - 1, z) || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => solid(x + dx, y, z + dz));
  if (!supported) floating++;
}

const stats = v.save(OUT);
console.log(JSON.stringify({ ...stats, windows, lanterns, door: door.length, roofPlant: plant, floating }));
