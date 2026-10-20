import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE92-0236-18F-4";
const W = 23, H = 100, D = 19;
const ROOF = 88;            // roof top (exclusive) above the lowest ground
const STOREY = 5;           // blocks per storey

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, g] of cells) ground.set(key(x, z), g);
const has = (x, z) => ground.has(key(x, z));

// Base level of the storey stack: the highest ground under the footprint.
const B = Math.max(...cells.map(c => c[2]));
// Storeys above B, leaving at least 3 blocks for the roof zone.
const N = Math.floor((ROOF - B - 3) / STOREY);
const topS = B + STOREY * N;

// Depth from the perimeter (0 = edge cell).
const depth = new Map();
const queue = [];
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const edge = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  if (edge) { depth.set(key(x, z), 0); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = depth.get(key(x, z));
  for (const [nx, nz] of [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]]) {
    if (has(nx, nz) && !depth.has(key(nx, nz))) {
      depth.set(key(nx, nz), d + 1);
      queue.push([nx, nz]);
    }
  }
}

// Which outward sides a cell faces.
function sidesOf(x, z) {
  const s = [];
  if (!has(x, z - 1)) s.push("N");
  if (!has(x, z + 1)) s.push("S");
  if (!has(x - 1, z)) s.push("W");
  if (!has(x + 1, z)) s.push("E");
  return s;
}
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// Entrance: south-facing edge cell nearest the middle of the frontage.
const southEdges = cells
  .map(c => [c[0], c[1]])
  .filter(([x, z]) => sidesOf(x, z).includes("S"));
southEdges.sort((a, b) => Math.abs(a[0] - 11) - Math.abs(b[0] - 11));
const [dx, dz] = southEdges[0];

// Plan of blocks: key "x,y,z" -> { x, y, z, id, props }. Missing = air.
const plan = new Map();
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  plan.set(`${x},${y},${z}`, { x, y, z, id, props });
};

// 1. Foundation and plinth: everything solid from y 0 up to the base level B.
for (const [x, z, g] of cells) {
  const edge = depth.get(key(x, z)) === 0;
  for (let y = 0; y < B; y++) {
    put(x, y, z, edge || y < g ? "stone_bricks" : "light_gray_concrete");
  }
}

// 2. Storeys.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const d = depth.get(key(x, z));
  const sides = sidesOf(x, z);

  if (d >= 2) {
    // Service core: solid through the storeys.
    for (let y = B; y < topS; y++) put(x, y, z, "light_gray_concrete");
    continue;
  }

  for (let k = 0; k < N; k++) {
    const s = B + STOREY * k;
    if (d === 1) {
      // Interior ring: floor and ceiling slabs, air gap behind the glass.
      put(x, s, z, "light_gray_concrete");
      put(x, s + 4, z, "light_gray_concrete");
      continue;
    }
    // Edge cell: facade.
    const onNS = sides.includes("N") || sides.includes("S");
    const u = onNS ? x : z;
    const corner = sides.length >= 2;
    const mullion = corner || u % 3 === 0;
    // Base course at the bottom of each storey, dark spandrel bands between windows.
    put(x, s, z, k === 0 ? "polished_granite" : "gray_concrete");
    for (let y = s + 1; y <= s + 3; y++) {
      if (mullion) put(x, y, z, "smooth_quartz");
      else put(x, y, z, "light_blue_stained_glass_pane", {});
    }
    put(x, s + 4, z, "gray_concrete");

    // Warm light behind some windows (single-side cells only).
    if (!mullion && sides.length === 1 && (u + k) % 4 === 1) {
      const [ix, iz] = [x + INWARD[sides[0]][0], z + INWARD[sides[0]][1]];
      if (depth.get(key(ix, iz)) === 1) put(ix, s + 2, iz, "glowstone");
    }
  }
}

// 3. Roof zone: attic solid, cornice band, parapet, penthouse on the inner core.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const d = depth.get(key(x, z));
  for (let y = topS; y <= ROOF - 1; y++) {
    if (d === 0) put(x, y, z, "smooth_quartz");
    else put(x, y, z, "light_gray_concrete");
  }
  if (d === 0) put(x, topS, z, "polished_andesite");   // cornice band
  if (d === 0) put(x, ROOF - 2, z, "polished_andesite"); // parapet cap line
  if (d === 6) put(x, topS + 1, z, "iron_bars");       // penthouse louvres
  put(x, ROOF - 1, z, "smooth_quartz");                 // roof cap
}

// 4. Entrance: granite frame around a dark oak door, lantern above.
const doorEdgeCells = [[dx, dz]];
for (const [fx, fz] of [[dx - 1, dz], [dx + 1, dz]]) {
  if (has(fx, fz)) {
    for (let y = B + 1; y <= B + 3; y++) put(fx, y, fz, "polished_granite");
  }
}
const doorBase = { facing: "south", hinge: "left", open: "false", powered: "false" };
put(dx, B + 1, dz, "dark_oak_door", { ...doorBase, half: "lower" });
put(dx, B + 2, dz, "dark_oak_door", { ...doorBase, half: "upper" });
put(dx, B + 3, dz, "lantern", { hanging: "true", waterlogged: "false" });

// 5. Pane connections: connect to any neighbouring block in the same layer.
for (const e of plan.values()) {
  if (e.id !== "light_blue_stained_glass_pane") continue;
  const nb = (xx, zz) => plan.has(`${xx},${e.y},${zz}`);
  e.props = {
    north: String(nb(e.x, e.z - 1)),
    south: String(nb(e.x, e.z + 1)),
    west: String(nb(e.x - 1, e.z)),
    east: String(nb(e.x + 1, e.z)),
    waterlogged: "false",
  };
}

// 6. Write the voxels.
const g = new Voxels([W, H, D]);
for (const e of plan.values()) {
  if (e.props) g.set(e.x, e.y, e.z, e.id, e.props);
  else g.set(e.x, e.y, e.z, e.id);
}
g.save(`${DIR}/${ID}.nbt`);
