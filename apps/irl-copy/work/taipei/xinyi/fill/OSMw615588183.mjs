import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw615588183: no record beyond footprint and roof height (~11 blocks above lowest ground).
// Read as a two-storey mid-century commercial block in Xinyi: cream tiled concrete walls,
// grey concrete piers, a stone base course, shopfronts at ground level, a band at the
// storey line, blue-tinted glazing above, a smooth cornice and a flat roof with plant units.
// Warm lanterns sit in some bays behind the glass.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw615588183";
const W = 34, H = 23, D = 16;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const isInterior = (x, z) => has(x, z) && has(x + 1, z) && has(x - 1, z) && has(x, z + 1) && has(x, z - 1);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const TOP = 10;      // roof deck / cornice offset above the cell's ground
const WALL = "white_concrete";
const PIER = "light_gray_concrete";
const GLASS = "light_blue_stained_glass_pane";
const BASE = "polished_andesite";
const CORNICE = "smooth_stone";
const SLAB = "smooth_stone";

// Pass 1: foundations, floor slabs, walls, glazing, roof deck.
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const b = gr;
  const top = Math.min(b + TOP, H - 1);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < b; y++) put(x, y, z, "stone");

  // Floor slab at the storey line, across the whole footprint.
  put(x, b + 5, z, SLAB);

  const exposed = {
    N: !has(x, z - 1),
    S: !has(x, z + 1),
    W: !has(x - 1, z),
    E: !has(x + 1, z),
  };
  const anyExposed = exposed.N || exposed.S || exposed.W || exposed.E;

  if (!anyExposed) {
    // Interior: roof deck only, air gap otherwise.
    put(x, top, z, "gray_concrete");
    continue;
  }

  const corner = (exposed.N || exposed.S) && (exposed.E || exposed.W);
  const along = (exposed.N || exposed.S) ? x : z;
  const windowBay = !corner && (along % 3 === 1);

  // Base course.
  put(x, b, z, BASE);

  if (corner) {
    for (let y = b + 1; y <= b + 9; y++) put(x, y, z, PIER);
  } else if (windowBay) {
    // Ground-floor shopfront glass, transom wall above.
    for (let y = b + 1; y <= b + 3; y++) put(x, y, z, GLASS);
    put(x, b + 4, z, WALL);
    // Upper glazing with frame wall above and below.
    for (let y = b + 6; y <= b + 8; y++) put(x, y, z, GLASS);
    put(x, b + 9, z, WALL);
  } else {
    for (let y = b + 1; y <= b + 4; y++) put(x, y, z, WALL);
    for (let y = b + 6; y <= b + 9; y++) put(x, y, z, WALL);
    // Piers for the bays between windows.
    for (let y = b + 1; y <= b + 3; y++) put(x, y, z, PIER);
    for (let y = b + 6; y <= b + 8; y++) put(x, y, z, PIER);
    put(x, b + 4, z, PIER);
    put(x, b + 9, z, PIER);
  }

  // Cornice / parapet cap.
  put(x, top, z, CORNICE);
}

// Pass 2: warm lanterns in the air gap behind some window bays.
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const exposed = {
    N: !has(x, z - 1), S: !has(x, z + 1),
    W: !has(x - 1, z), E: !has(x + 1, z),
  };
  const corner = (exposed.N || exposed.S) && (exposed.E || exposed.W);
  if (corner || !(exposed.N || exposed.S || exposed.W || exposed.E)) continue;
  const along = (exposed.N || exposed.S) ? x : z;
  if (along % 3 !== 1) continue;

  let dx = 0, dz = 0;
  if (exposed.N) dz = 1;
  else if (exposed.S) dz = -1;
  else if (exposed.W) dx = 1;
  else if (exposed.E) dx = -1;

  const ix = x + dx, iz = z + dz;
  if (!isInterior(ix, iz)) continue;
  const b = gr;
  if (along % 6 === 1) {
    put(ix, b + 7, iz, "lantern", { hanging: "false" });
  }
  if (along % 6 === 4) {
    put(ix, b + 2, iz, "lantern", { hanging: "false" });
  }
}

// Pass 3: rooftop plant units standing on the interior roof deck.
for (const [x, z, gr] of cells) {
  if (!isInterior(x, z)) continue;
  if ((x * 3 + z * 5) % 7 === 0) {
    put(x, gr + TOP + 1, z, "iron_block");
  }
}

// Pass 4: entrance on the longest exposed street-side run (prefer south, then north).
const runs = { N: [], S: [], E: [], W: [] };
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const ex = { N: !has(x, z - 1), S: !has(x, z + 1), W: !has(x - 1, z), E: !has(x + 1, z) };
  const corner = (ex.N || ex.S) && (ex.E || ex.W);
  if (corner) continue;
  if (ex.N) runs.N.push([x, z]);
  if (ex.S) runs.S.push([x, z]);
  if (ex.W) runs.W.push([x, z]);
  if (ex.E) runs.E.push([x, z]);
}
let face = "S";
for (const f of ["S", "N", "E", "W"]) {
  if (runs[f].length > runs[face].length) face = f;
}
const candidates = runs[face].filter(([x, z]) => {
  const along = (face === "N" || face === "S") ? x : z;
  return along % 3 === 1;
});
if (candidates.length) {
  candidates.sort((a, b) => {
    const aa = (face === "N" || face === "S") ? a[0] : a[1];
    const bb = (face === "N" || face === "S") ? b[0] : b[1];
    return Math.abs(aa - 0) - Math.abs(bb - 0);
  });
  const mid = candidates[Math.floor(candidates.length / 2)];
  const [ex, ez] = mid;
  const b = ground.get(`${ex},${ez}`);
  const facing = { N: "north", S: "south", E: "east", W: "west" }[face];
  // Clear the glazing and place the door (lower and upper halves).
  put(ex, b + 1, ez, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ex, b + 2, ez, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  put(ex, b + 3, ez, GLASS);
  // Canopy over the entrance, resting on the wall at storey height.
  put(ex, b + 4, ez, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
