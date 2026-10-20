import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded low-rise commercial block, c. 1970s-80s Taipei: two storeys of
// white concrete with light-grey storey lines, blue glass window bays on
// concrete piers, a stone plinth, a flat roof with a parapet, a rooftop
// stair bulkhead and mechanical units. Warm glowstone sits behind some
// second-storey windows.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw831857629";
const W = 23, H = 23, D = 19;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---------- footprint bookkeeping ----------
const key = (x, z) => `${x},${z}`;
const cellG = new Map();
for (const [x, z, gr] of cells) cellG.set(key(x, z), Math.round(gr));

const has = (x, z) => cellG.has(key(x, z));
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const exposed = (x, z) =>
  Object.entries(DIRS)
    .filter(([, [dx, dz]]) => !has(x + dx, z + dz))
    .map(([n]) => n);

const foot = [...cellG].map(([k, gr]) => {
  const [x, z] = k.split(",").map(Number);
  return { x, z, gr };
});
const perim = foot.filter((c) => exposed(c.x, c.z).length > 0);
const cx = foot.reduce((s, c) => s + c.x, 0) / foot.length;
const cz = foot.reduce((s, c) => s + c.z, 0) / foot.length;

const B = Math.min(...foot.map((c) => c.gr));   // lowest ground = y 0 reference
const FL = B + 5;     // second-storey floor / storey line
const CORN = B + 9;   // cornice course, top of walls
const ROOF = B + 10;  // roof deck
const PARA = B + 11;  // parapet (roof about 11 blocks above lowest ground)

const inside = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, b, p) => {
  if (!inside(x, y, z)) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// ---------- 1. foundation: solid from y 0 up to each cell's ground ----------
for (const c of foot) {
  for (let y = 0; y < c.gr; y++) put(c.x, y, c.z, "stone_bricks");
}

// ---------- 2. second-storey floor slab (interior and perimeter) ----------
for (const c of foot) {
  if (c.gr <= FL) put(c.x, FL, c.z, "smooth_stone");
}

// ---------- 3. roof deck: stands on the foundation or the walls below ----------
const deckY = (c) => Math.max(c.gr, ROOF);
for (const c of foot) put(c.x, deckY(c), c.z, "smooth_stone");

// ---------- 4. perimeter walls with storey lines, windows and piers ----------
for (const c of perim) {
  const ex = exposed(c.x, c.z);
  const corner = ex.length > 1;
  const face = ex[0];
  const along = face === "north" || face === "south" ? c.x : c.z;

  for (let y = c.gr; y <= Math.min(CORN, H - 1); y++) {
    let b = "white_concrete";
    const winRow = (y >= B + 1 && y <= B + 3) || (y >= B + 6 && y <= B + 8);
    if (y === c.gr) b = "stone_bricks";                       // plinth
    else if (y === B + 4 || y === FL || y === CORN) b = "light_gray_concrete"; // storey lines, cornice
    else if (winRow && !corner && along % 3 !== 0) b = "light_blue_stained_glass";
    put(c.x, y, c.z, b);
  }
}

// ---------- 5. warm glowstone behind some second-storey windows ----------
// Air gap (inner cell) between the glass and the lamp; the lamp sits two cells in.
for (const c of perim) {
  const ex = exposed(c.x, c.z);
  if (ex.length !== 1) continue;
  const face = ex[0];
  const along = face === "north" || face === "south" ? c.x : c.z;
  if (along % 3 === 0 || along % 6 !== 1) continue;
  const yL = B + 7;
  if (c.gr > yL) continue;
  const [dx, dz] = DIRS[face];
  const i1 = { x: c.x - dx, z: c.z - dz };
  const i2 = { x: c.x - 2 * dx, z: c.z - 2 * dz };
  if (!has(i1.x, i1.z) || !has(i2.x, i2.z)) continue;
  if (cellG.get(key(i1.x, i1.z)) > yL || cellG.get(key(i2.x, i2.z)) > yL) continue;
  put(i2.x, yL, i2.z, "glowstone");
}

// ---------- 6. entrance on the street (south) face, centred ----------
const fronts = perim.filter((c) => {
  const ex = exposed(c.x, c.z);
  return ex.length === 1 && ex[0] === "south";
});
if (fronts.length) {
  const door = fronts.reduce((best, c) =>
    Math.abs(c.x - cx) < Math.abs(best.x - cx) ? c : best
  );
  const props = (half) => ({
    facing: "south", half, hinge: "left", open: "false", powered: "false",
  });
  put(door.x, door.gr, door.z, "dark_oak_door", props("lower"));
  put(door.x, door.gr + 1, door.z, "dark_oak_door", props("upper"));
  if (door.gr + 2 <= B + 4) put(door.x, door.gr + 2, door.z, "light_gray_concrete");
}

// ---------- 7. parapet on the roof edge ----------
for (const c of perim) {
  if (deckY(c) === ROOF) put(c.x, PARA, c.z, "white_concrete");
}

// ---------- 8. rooftop stair bulkhead (3x3, all on one roof level) ----------
const footSet = new Set(foot.map((c) => key(c.x, c.z)));
const bulkCandidates = foot.filter((c) => {
  if (exposed(c.x, c.z).length) return false;
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      const n = cellG.get(key(c.x + dx, c.z + dz));
      if (n === undefined) return false;
      if (Math.max(n, ROOF) !== deckY(c)) return false;
    }
  return true;
});
const bulkKeys = new Set();
if (bulkCandidates.length) {
  const bc = bulkCandidates.reduce((best, c) =>
    Math.hypot(c.x - cx, c.z - cz) < Math.hypot(best.x - cx, best.z - cz) ? c : best
  );
  const dY = deckY(bc);
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      const x = bc.x + dx, z = bc.z + dz;
      bulkKeys.add(key(x, z));
      for (let y = dY + 1; y <= dY + 3; y++) put(x, y, z, "white_concrete");
      put(x, dY + 4, z, "light_gray_concrete");
    }
}

// ---------- 9. mechanical units on the roof ----------
for (const c of foot) {
  if (exposed(c.x, c.z).length) continue;
  if (bulkKeys.has(key(c.x, c.z))) continue;
  if (c.x % 5 !== 2 || c.z % 5 !== 2) continue;
  put(c.x, deckY(c) + 1, c.z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
