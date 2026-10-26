// THE PHILLIPS COLLECTION, 1600 21st St NW. Brick, Georgian-Revival house museum: red brick walls, limestone bands,
// cornice and entrance surround, glazed sash windows on a 3-block storey, and a skylit tier on the roof. Built on the
// footprint cells only: a stone plinth from y 0 to each cell's ground, then a shell (perimeter) or air (interior) with a
// floor slab per storey. Lidar roof heights are smoothed into four tiers (9 tower, 8 main, 6 wing, 4 low wing).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC62237.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC62237.nbt";

const key = (x, z) => `${x},${z}`;
const tierOf = (r) => (r >= 9 ? 9 : r >= 7 ? 8 : r >= 5 ? 6 : 4);

// footprint: per cell {g: ground, t: tier}
const at = new Map();
for (const [x, z, g, r] of JSON.parse(readFileSync(CELLS, "utf8"))) at.set(key(x, z), { x, z, g, t: tierOf(r) });
const has = (x, z) => at.has(key(x, z));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// one smoothing pass: a cell that disagrees with 3 or 4 of its footprint neighbours takes their tier
{
  const next = new Map();
  for (const [k, c] of at) {
    const n = NB.map(([dx, dz]) => at.get(key(c.x + dx, c.z + dz))).filter(Boolean);
    const count = {};
    for (const o of n) count[o.t] = (count[o.t] || 0) + 1;
    const [best, bn] = Object.entries(count).sort((a, b) => b[1] - a[1])[0] || [];
    next.set(k, bn >= 3 && Number(best) !== c.t ? { ...c, t: Number(best) } : c);
  }
  at.clear(); for (const [k, c] of next) at.set(k, c);
}

const perimeter = (x, z) => !NB.every(([dx, dz]) => has(x + dx, z + dz));

// which face a perimeter cell sits on: the index along the face (windows on odd cells, piers on even) and the
// direction into the building (for the lamp behind a window)
function faceOf(x, z) {
  const zOpen = !has(x, z - 1) || !has(x, z + 1);   // a north or south face: the wall runs along x
  const xOpen = !has(x - 1, z) || !has(x + 1, z);   // an east or west face: the wall runs along z
  if (zOpen && xOpen) return { kind: "corner" };
  if (zOpen) return { kind: "ns", i: x, inward: [0, !has(x, z - 1) ? 1 : -1] };
  return { kind: "ew", i: z, inward: [!has(x - 1, z) ? 1 : -1, 0] };
}

const ENTRANCE = new Set([key(13, 19), key(14, 19)]);   // the south front, on the low wing at grade

const vox = new Voxels([18, 10, 20]);
const put = (x, y, z, block, state) => vox.set(x, y, z, block, state);

// pass 1: the walls, floors, roofs and openings of every column
for (const c of at.values()) {
  const { x, z, g, t } = c;
  const top = t - 1;                                    // the cornice or roof cap
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");   // plinth down to grade
  const floors = [g, g + 3, g + 6].filter((f) => f <= t - 2); // storey lines, 3 blocks apart
  const edge = perimeter(x, z);
  const face = edge ? faceOf(x, z) : null;
  const skylit = !edge && t === 9 && NB.every(([dx, dz]) => at.get(key(x + dx, z + dz))?.t === 9 && !perimeter(x + dx, z + dz));

  for (let y = g; y <= top; y++) {
    if (y === top) {
      if (edge) put(x, y, z, "smooth_stone");           // limestone cornice
      else put(x, y, z, skylit ? "glass" : "stone_bricks"); // roof, skylit over the central tier
      continue;
    }
    if (floors.includes(y)) { put(x, y, z, "smooth_stone"); continue; }  // floor slab / string course
    if (!edge) continue;                                 // interior: air behind the glass
    const f = Math.max(...floors.filter((v) => v <= y));
    const row = y - f;                                   // 1 and 2 are the glazed rows of a storey
    if (row < 1 || row > 2) { put(x, y, z, "bricks"); continue; }
    if (face.kind === "corner" || face.i % 2 === 0) { put(x, y, z, "bricks"); continue; }  // piers
    const state = face.kind === "ns"
      ? { east: "true", west: "true", north: "false", south: "false" }
      : { east: "false", west: "false", north: "true", south: "true" };
    put(x, y, z, "glass_pane", state);
  }
}

// pass 2: the entrance, lamps behind some windows, and hanging lanterns in the entrance hall
for (const c of at.values()) {
  const { x, z, g, t } = c;
  if (!perimeter(x, z)) continue;
  const floors = [g, g + 3, g + 6].filter((f) => f <= t - 2);
  const face = faceOf(x, z);
  if (face.kind === "corner") continue;
  for (let y = g; y < t - 1; y++) {
    const f = Math.max(...floors.filter((v) => v <= y));
    const row = y - f;
    if (row < 1 || row > 2 || floors.includes(y)) continue;
    if (face.i % 2 === 0) continue;
    if (((x * 5 + z * 3 + y) % 12) !== 0) continue;  // about one window in twelve is lit
    const [dx, dz] = face.inward;
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz) && !perimeter(ix, iz)) put(ix, y, iz, "glowstone");
  }
}

const doorState = (hinge, half) => ({ facing: "south", half, hinge, open: "false", powered: "false" });
for (const k of ENTRANCE) {
  const [x, z] = k.split(",").map(Number);
  const hinge = x === 13 ? "left" : "right";
  put(x, 0, z, "dark_oak_door", doorState(hinge, "lower"));
  put(x, 1, z, "dark_oak_door", doorState(hinge, "upper"));
  put(x, 2, z, "smooth_stone");                          // lintel over the door
  put(x, 3, z - 1, "lantern", { hanging: "true", waterlogged: "false" }); // hanging in the entrance hall
}

const { blocks, palette } = vox.save(OUT);
console.log(`DC62237: ${blocks} blocks, palette ${palette}`);
