import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1910s-30s Federal-style commercial block on the Mall edge: Indiana-limestone-look walls, granite plinth,
// a stone string course per storey, a 4-storey west tower (the 9-block lidar roof) stepping down to a 2-storey
// wing and a lower wing, with a shopfront and a central door on the street (north, z = 0) face.
// Storeys are 2 blocks (about 4.8 m): ground row, string course, window row, string course, ...

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC54444.cells.json`, "utf8"));

const W = 11, H = 21, D = 3;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const foot = new Map(cells.map(([x, z, gr, roof]) => [key(x, z), { gr, roof }]));
const has = (x, z) => foot.has(key(x, z));
const isEdge = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

// Lidar roof heights smoothed into flat tiers (lidar in brackets): west tower 9 (9), its step 8 (8), the
// 2-storey wing 5 (5/6), the lower wing 4 (4/5), the east wing 5 (5/6).
const TIER = [9, 8, 5, 4, 4, 5, 5, 5, 5, 5, 5];
for (const [x, z, , roof] of cells) {
  if (Math.abs(TIER[x] - roof) > 1) throw new Error(`tier ${TIER[x]} far from lidar ${roof} at ${x},${z}`);
}

const WALL = "calcite", BAND = "smooth_stone", BASE = "polished_granite", GLASS = "glass_pane";
const GROUND_GLASS = new Set([1, 2, 3, 4, 6, 8, 9, 10]);
const DOOR_X = 7;                       // the central entrance on the street face
const LIGHTS = [[6, 1, 1, "glowstone"], [9, 3, 1, "glowstone"], [7, 3, 1, "shroomlight"]];

// Storey row of a column of height h: 0 base, 1 ground (shopfront), then belt / window alternating, cap on top.
function kindOf(y, h) {
  if (y === 0) return "base";
  if (y === h - 1) return "cap";
  if (y === 1) return "ground";
  if (y % 2 === 0) return "belt";
  return "window";
}

const glass = [], parapet = [];

for (const [x, z, , roof] of cells) {
  const h = TIER[x];
  const perimeter = isEdge(x, z);
  for (let y = 0; y < h; y++) {
    const k = kindOf(y, h);
    const face = z === 0 || (z === 2 && x >= 6);           // the street face (z 0) and the back of the 3-deep part
    // interior air: the 3-deep block's middle row behind the glass, between floor slabs (x 6..9)
    if (x >= 6 && x <= 9 && z === 1 && (k === "ground" || k === "window")) continue;
    if (x === 10 && z === 1) { g.set(x, y, z, WALL); continue; }   // east end wall
    if (!face) { g.set(x, y, z, k === "base" ? BASE : k === "belt" || k === "cap" ? BAND : WALL); continue; }
    if (k === "base") { g.set(x, y, z, BASE); continue; }
    if (k === "belt" || k === "cap") {
      if (z === 0 && x === DOOR_X && y === 2) g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      else g.set(x, y, z, BAND);
      continue;
    }
    if (k === "ground") {
      if (z === 0 && x === DOOR_X) { g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (GROUND_GLASS.has(x)) { g.set(x, y, z, GLASS); glass.push([x, y, z]); } else g.set(x, y, z, WALL);
      continue;
    }
    // upper window row: glass in every other bay, piers between
    if (x % 2 === 1) { g.set(x, y, z, GLASS); glass.push([x, y, z]); } else g.set(x, y, z, WALL);
  }
  // Solid roof parapet on every perimeter cell of the massing (the cap is at h-1; parapet sits on it)
  if (perimeter) { g.set(x, h, z, "stone_brick_wall"); parapet.push([x, h, z]); }
}

// Warm lights behind the glass, inside the air gap
for (const [x, y, z, b] of LIGHTS) g.set(x, y, z, b);

// Rooftop chimney on an interior roof cell (x 8, z 1), a brick stack with a stone cap
g.set(8, 5, 1, "bricks"); g.set(8, 6, 1, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

// Glass pane arms: connect east/west to any filled neighbour in the same row
for (const [x, y, z] of glass) {
  const filled = (dx) => g.val(x + dx, y, z) !== 0;
  g.set(x, y, z, GLASS, { east: String(filled(1)), west: String(filled(-1)), north: "false", south: "false", waterlogged: "false" });
}

// Parapet walls: low arms toward neighbouring parapet cells along the same roof edge
const pset = new Set(parapet.map(([x, y, z]) => `${x},${y},${z}`));
for (const [x, y, z] of parapet) {
  const link = (dx, dz) => (pset.has(`${x + dx},${y},${z + dz}`) ? "low" : "none");
  g.set(x, y, z, "stone_brick_wall", { east: link(1, 0), west: link(-1, 0), north: link(0, -1), south: link(0, 1), up: "true", waterlogged: "false" });
}

const info = g.save(`${DIR}/DC54444.nbt`);
console.log(JSON.stringify(info));
