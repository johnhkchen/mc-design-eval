import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// S Street NW, Dupont / Kalorama, DC 20009: a 1920s Renaissance Revival apartment block with an elevator.
// Red brick walls on a stone base, pale stone (smooth quartz) floor belts, a coping, and window bays with brick
// piers. An L-shaped plan: the street bar (z 0-3) is tallest on its frontage, with a 10-11 block front strip
// stepping down to 9, 7 and 6 behind it, and a lower rear wing (z 4-5) at 6 and 2-4. An elevator bulkhead
// sits on the top tier, and mechanical boxes on the 6-block roofs. Every storey is a 2-block pitch: a floor
// belt (stone, slab per storey inside) and a window row, five storeys on the top tier.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC62104.cells.json`, "utf8"));

const W = 15, H = 23, D = 6;

// The lidar roof per footprint cell, smoothed into flat tiers (null = off the footprint). Lidar noise of +-1 is
// taken out; the rear row's roof of 1 (a garden wall) is raised to 2, the lowest a storey-less wing can be.
const TIER = [
  [6, 9, 9, 10, 10, 10, 10, 10, 10, 10, 11, 11, 11, 11, 11],
  [6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 6, 6, 6, 6, 6],
  [6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 6, 6, 6, 6, 6],
  [6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 6, 6, 6, 6, 6],
  [null, null, null, null, null, null, null, null, null, null, 6, 6, 6, 6, 6],
  [null, null, null, null, null, null, null, null, null, null, 2, 2, 2, 4, 4],
];

const raw = new Map();
for (const [x, z, ground, roof] of cells) raw.set(`${x},${z}`, { ground, roof });
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const t = TIER[z][x];
  if (t == null) throw new Error(`footprint cell ${x},${z} has no tier`);
  if (Math.abs(t - raw.get(`${x},${z}`).roof) > 2) throw new Error(`tier ${t} strays from lidar ${raw.get(`${x},${z}`).roof} at ${x},${z}`);
}
const onFoot = (x, z) => x >= 0 && x < W && z >= 0 && z < D && TIER[z][x] != null;
const roofAt = (x, z) => TIER[z][x];
const NB = [[0, -1], [0, 1], [-1, 0], [1, 0]];

// a cell's wall is exterior on a side where the neighbour is off the footprint or stands lower than this height
const exposed = (x, y, z) => NB.filter(([dx, dz]) => !onFoot(x + dx, z + dz) || roofAt(x + dx, z + dz) <= y);

const v = new Voxels([W, H, D]);
const set = (x, y, z, block, state) => v.set(x, y, z, block, state);
const PIER = (u) => u % 3 === 0;

// Structure: foundation and plinth, belts and windows on the exterior, slabs and air inside.
for (const [x, z, ground] of cells) {
  const top = roofAt(x, z);
  for (let y = 0; y < ground; y++) set(x, y, z, "stone_bricks");
  for (let y = 0; y < top; y++) {
    if (y === 0) { set(x, y, z, "stone_bricks"); continue; }
    const ex = exposed(x, y, z);
    if (y === top - 1) { set(x, y, z, ex.length ? "smooth_quartz" : "stone"); continue; }   // coping or roof deck
    if (ex.length) {
      if (y % 2 === 1) { set(x, y, z, "smooth_quartz"); continue; }                      // floor belt
      const alongX = ex.some(([, dz]) => dz !== 0);                                        // a street or rear face
      const u = alongX ? x : z;
      set(x, y, z, PIER(u) ? "bricks" : "glass_pane", PIER(u) ? undefined : { north: "false", south: "false", east: "false", west: "false" });
    } else if (y % 2 === 1) set(x, y, z, "stone");                                         // floor slab, inside
    // else: air behind the glass
  }
}

// Main entrance on the street front (z 0), a little off the middle of the bar.
const DOOR_X = 6;
for (const x of [DOOR_X - 1, DOOR_X + 1]) for (const y of [1, 2]) set(x, y, 0, "smooth_quartz");   // pilasters either side
set(DOOR_X, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
set(DOOR_X, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
set(DOOR_X, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });                 // lobby lamp, hung from the floor slab

// Warm light behind some glass: the air cell just inside a window
set(2, 2, 1, "glowstone");
set(8, 4, 1, "glowstone");
set(13, 2, 1, "shroomlight");

// Elevator bulkhead on the top tier's street bar, with its own window and stone cap.
for (let x = 11; x <= 13; x++) {
  set(x, 11, 0, x === 12 ? "glass_pane" : "bricks", x === 12 ? { north: "false", south: "false", east: "false", west: "false" } : undefined);
  set(x, 12, 0, "smooth_quartz");
}

// Mechanical boxes on the rear roofs (the 6-block tier's deck is at y 5, so they stand at y 6)
for (const [x, z] of [[1, 2], [12, 2]]) set(x, 6, z, "light_gray_concrete");

// Pane connections: a window in an x-face joins its neighbours north-south, one in a z-face east-west.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) {
  const cell = v.get(x, y, z);
  if (!cell || cell.block !== "minecraft:glass_pane") continue;
  const link = (dx, dz) => (v.get(x + dx, y, z + dz) ? "true" : "false");
  const xFace = x === 0 || x === W - 1;
  const st = xFace
    ? { north: link(0, -1), south: link(0, 1), east: "false", west: "false" }
    : { north: "false", south: "false", east: link(1, 0), west: link(-1, 0) };
  set(x, y, z, "glass_pane", st);
}

v.save(`${DIR}/DC62104.nbt`);
console.log(`DC62104: ${v.count()} blocks, ${v.palette.length - 1} block states, tallest roof ${Math.max(...cells.map((c) => roofAt(c[0], c[1])))} + penthouse`);
