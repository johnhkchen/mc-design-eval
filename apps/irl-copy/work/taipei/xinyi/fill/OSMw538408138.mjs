import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538408138";
const W = 16, H = 23, D = 18;

// Footprint: [x, z, ground] per cell
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map((c) =>
  Array.isArray(c)
    ? { x: c[0], z: c[1], g: Math.round(c[2] ?? 0) }
    : { x: c.x, z: c.z, g: Math.round(c.ground ?? c.g ?? c.y ?? 0) }
);

const ground = new Map();
for (const c of cells) ground.set(`${c.x},${c.z}`, c.g);
const has = (x, z) => ground.has(`${x},${z}`);

// Floor level of the ground storey = highest ground under the footprint,
// so the ground floor is one level all round; foundations fill below it.
const B = Math.max(...cells.map((c) => c.g));
const ROOF = B + 11;
if (ROOF > H - 1) console.warn(`roof y ${ROOF} exceeds grid height ${H}`);

const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (!has(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Classify perimeter cells: which outward faces are open
function facesOf(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("n");
  if (!has(x, z + 1)) f.push("s");
  if (!has(x - 1, z)) f.push("w");
  if (!has(x + 1, z)) f.push("e");
  return f;
}
const inward = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] };

// 1. Foundation / plinth: solid from y 0 up to the floor level B
for (const c of cells) {
  for (let y = 0; y < B; y++) put(c.x, y, c.z, "stone_bricks");
}

// 2. Floor slabs (storey lines) and roof deck across the whole footprint
for (const c of cells) {
  put(c.x, B + 5, c.z, "smooth_stone");   // first/second floor line
  put(c.x, B + 10, c.z, "smooth_stone");  // roof deck
}

// 3. Perimeter walls, shopfront, upper windows, cornice and parapet
const perim = [];
let doorCandidates = [];
for (const c of cells) {
  const f = facesOf(c.x, c.z);
  if (f.length === 0) continue;
  const corner = f.length >= 2;
  const face = f[0];
  const along = face === "n" || face === "s" ? c.x : c.z;
  const win = !corner && along % 3 !== 0;
  const pane = face === "n" || face === "s" ? PANE_NS : PANE_EW;
  perim.push({ ...c, f, corner, face, along, win, pane });
  if (face === "s") doorCandidates.push(c);
}

// Entrance: middle cell of the south face
doorCandidates.sort((a, b) => a.x - b.x);
const doorCell = doorCandidates.length
  ? doorCandidates[Math.floor(doorCandidates.length / 2)]
  : null;
const isDoor = (x, z) => doorCell && doorCell.x === x && doorCell.z === z;

for (const p of perim) {
  const { x, z, win, pane } = p;

  // Ground storey: base course, shopfront glazing between piers, dark fascia
  put(x, B, z, "stone_bricks");
  for (let y = B + 1; y <= B + 3; y++) {
    if (win) put(x, y, z, "glass_pane", pane);
    else put(x, y, z, "stone_bricks");
  }
  put(x, B + 4, z, "dark_oak_planks");

  // Upper storey: sill, glazing band, head
  if (win) {
    put(x, B + 6, z, "white_concrete");
    put(x, B + 7, z, "glass_pane", pane);
    put(x, B + 8, z, "glass_pane", pane);
    put(x, B + 9, z, "white_concrete");
  } else {
    for (let y = B + 6; y <= B + 9; y++) put(x, y, z, "white_concrete");
  }

  // Cornice band and parapet
  put(x, B + 5, z, "stone_bricks");
  put(x, B + 10, z, "stone_bricks");
  put(x, B + 11, z, "white_concrete");
}

// Entrance: double-height door in the middle of the south face, plus a
// concrete lintel above it so the fascia reads over the opening
if (doorCell) {
  const { x, z } = doorCell;
  put(x, B, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, B + 1, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, B + 2, z, "white_concrete");
  put(x, B + 3, z, "white_concrete");
}

// 4. Warm light behind some windows (inside the footprint, one block in)
for (const p of perim) {
  if (!p.win || p.along % 6 !== 1) continue;
  const [dx, dz] = inward[p.face];
  const ix = p.x + dx, iz = p.z + dz;
  if (!has(ix, iz)) continue;
  if (p.face === "s" && isDoor(p.x, p.z)) continue;
  // Ground storey: glowstone; upper storey: shroomlight
  put(ix, B + 2, iz, "glowstone");
  put(ix, B + 7, iz, "shroomlight");
}

// 5. Roof equipment: two condenser plant blocks on the roof deck
for (const c of cells) {
  const edge = facesOf(c.x, c.z).length > 0;
  if (edge) continue;
  const inPlant =
    ((c.x >= 4 && c.x <= 5) || (c.x >= 10 && c.x <= 11)) && c.z >= 6 && c.z <= 11;
  if (inPlant) put(c.x, B + 11, c.z, "gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
