// A 1960s concrete-framed office block on a stone base: three storeys of ribbon windows in a light concrete grid, the
// ground storey brick-piered with a glazed shopfront and a door on the south front, a plant room on the roof, and a
// single-storey wing on the east where the lidar shows the roof low. Built from the footprint cells only: [x, z, ground, roof].
// Storey lines sit on absolute rows (every fourth row), so the tiers and the wings line up across the slope.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const raw = JSON.parse(readFileSync(`${DIR}/way_269385746.cells.json`, "utf8"));

// the lidar roof is noisy: snap it to three flat tiers (12 = three storeys and a cap, 8 = two, 4 = one). A tier never
// sits below its own ground plus one storey, so every cell stands on its foundation with walls above it.
const tierOf = (r) => (r >= 9 ? 12 : r >= 6 ? 8 : 4);
const cells = raw.map(([x, z, ground, roof]) => ({ x, z, ground, top: Math.max(tierOf(roof), ground + 4) }));
const byXZ = new Map(cells.map((c) => [`${c.x},${c.z}`, c]));
const at = (x, z) => byXZ.get(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// the sides of a cell at height y that face open air: the neighbour is off the footprint or stands lower than y
const outward = (c, y) =>
  Object.entries(DIRS).filter(([, [dx, dz]]) => { const n = at(c.x + dx, c.z + dz); return !n || n.top <= y; }).map(([d]) => d);
const inside = (c) => Object.values(DIRS).every(([dx, dz]) => at(c.x + dx, c.z + dz));

const g = new Voxels([37, 24, 28]);
const panes = [];
const lightSpots = [];

// the entrance: the ground-level cell on the south face with the longest run of south-facing neighbours, at its middle
const southRuns = new Map();
for (const c of cells) if (c.ground === 0 && outward(c, 1).includes("S")) southRuns.set(c.z, [...(southRuns.get(c.z) ?? []), c]);
const [, frontRun] = [...southRuns].sort((a, b) => b[1].length - a[1].length)[0];
const door = frontRun[Math.floor(frontRun.length / 2)];

for (const c of cells) {
  const { x, z, ground, top: T } = c;
  // foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y <= ground; y++) g.set(x, y, z, "stone_bricks");

  for (let y = ground + 1; y < T; y++) {
    const out = outward(c, y);
    if (!out.length) {
      // inside the building: a floor slab on each storey line and the roof deck at the cap, air between
      if (y === T - 1 || y % 4 === 3) g.set(x, y, z, "smooth_stone");
      continue;
    }
    const northSouth = out.some((d) => d === "N" || d === "S");
    const eastWest = out.some((d) => d === "E" || d === "W");
    const corner = northSouth && eastWest;
    const pier = northSouth ? x % 3 === 0 : z % 3 === 0;   // a concrete pier every third cell along the face
    const row = y % 4;                                       // 0 sill, 1 window, 2 head, 3 storey line (string course)
    const lowerFloor = y <= 3;                               // the ground storey: brick piers, glazed shopfront

    let b;
    if (y === T - 1) b = "smooth_quartz";                    // cornice / parapet cap
    else if (row === 3) b = "smooth_quartz";                 // string course
    else if (row !== 1) b = corner ? "white_concrete" : "light_gray_concrete";  // spandrels
    else if (corner) b = "white_concrete";                   // quoins
    else if (pier) b = lowerFloor ? "bricks" : "light_gray_concrete";
    else if (lowerFloor && door && x === door.x && z === door.z) b = null;     // the door, set below
    else if (lowerFloor && frontRun.includes(c)) b = "glass";                  // clear shopfront glazing
    else b = "gray_stained_glass_pane";                      // upper ribbon windows, dark tinted

    if (b) g.set(x, y, z, b);
    if (b === "gray_stained_glass_pane") panes.push([x, y, z]);
    // a warm lantern in some windows, hung from the storey line on the inside air
    if (b === "gray_stained_glass_pane" || b === "glass") {
      if (row === 1 && (x * 3 + z * 5 + y) % 7 === 0) {
        const [dx, dz] = out.includes("S") ? [0, -1] : out.includes("N") ? [0, 1] : out.includes("E") ? [-1, 0] : [1, 0];
        lightSpots.push([x + dx, y + 1, z + dz]);
      }
    }
  }
}

// the door: two blocks high on the front, with a hanging lantern on the inside air behind it
const doorState = { facing: "south", hinge: "left", open: "false", powered: "false" };
g.set(door.x, 1, door.z, "oak_door", { ...doorState, half: "lower" });
g.set(door.x, 2, door.z, "oak_door", { ...doorState, half: "upper" });
lightSpots.push([door.x, 2, door.z - 1]);

// a lantern is set only where the air above it is the storey line (solid), so nothing hangs
for (const [x, y, z] of lightSpots) {
  if (g.get(x, y + 1, z)) g.set(x, y, z, "lantern", { hanging: "true" });
}

// the plant room: a 4 x 3 box on the top tier's interior, nearest the middle of the block
const topCells = cells.filter((c) => c.top === 12 && inside(c));
const cx = cells.reduce((s, c) => s + c.x, 0) / cells.length, cz = cells.reduce((s, c) => s + c.z, 0) / cells.length;
let best = null;
for (const c of topCells) {
  const box = [];
  for (let dx = 0; dx < 4; dx++) for (let dz = 0; dz < 3; dz++) box.push(at(c.x + dx, c.z + dz));
  if (box.some((n) => !n || n.top !== 12 || !inside(n))) continue;
  const d = Math.hypot(c.x + 1.5 - cx, c.z + 1 - cz);
  if (!best || d < best.d) best = { d, c };
}
if (best) {
  const { x0, z0 } = { x0: best.c.x, z0: best.c.z };
  for (let x = x0; x < x0 + 4; x++) for (let z = z0; z < z0 + 3; z++) {
    for (let y = 12; y <= 13; y++) {
      const edge = x === x0 || x === x0 + 3 || z === z0 || z === z0 + 2;
      if (edge) g.set(x, y, z, y === 13 && (x === x0 + 1 || x === x0 + 2) ? "smooth_stone" : "light_gray_concrete");
    }
    g.set(x, 14, z, "smooth_stone");
  }
}

// glass panes connect to their neighbours and to any solid block beside them, so a ribbon reads as one band
for (const [x, y, z] of panes) {
  const link = (dx, dz) => { const n = g.get(x + dx, y, z + dz); return n && n.block !== "minecraft:air" ? "true" : "false"; };
  g.set(x, y, z, "gray_stained_glass_pane", { north: link(0, -1), south: link(0, 1), east: link(1, 0), west: link(-1, 0), waterlogged: "false" });
}

g.save(`${DIR}/way_269385746.nbt`);
console.log("blocks", g.count(), "palette", g.palette.length - 1, "door", door.x, door.z, "plant room", best && [best.c.x, best.c.z]);
