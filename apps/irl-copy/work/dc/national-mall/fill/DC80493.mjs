// DC80493: a limestone civic office block (Federal-style, 1930s) on a granite plinth, 12 blocks to its cornice,
// with a one-storey wing at the west edge. Three storeys of 3 blocks: a stone band course, then two window rows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC80493.cells.json`, "utf8"));

// Lidar roofs read 11-12 across the body, so they smooth to one flat tier at 12; the west edge's 4-6 is a one-storey wing at 6.
const top = new Map();
for (const [x, z, , r] of cells) top.set(`${x},${z}`, r <= 7 ? 6 : 12);
const inV = (x, y, z) => y >= 0 && y < (top.get(`${x},${z}`) ?? 0);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// the horizontal face of a column cell that looks onto air (off the footprint, or beside a lower column), or null
const openFace = (x, y, z) => DIRS.find(([dx, dz]) => !inV(x + dx, y, z + dz)) ?? null;

const BASE_TOP = 1;                       // y 0..1 granite plinth, whole footprint
const BAND = new Set([2, 5, 8]);          // stone string courses = storey floors (solid slabs, the air gap sits between)
const WINDOW_ROWS = new Set([3, 4, 6, 7, 9, 10]);
const LOWER_PANE_ROWS = new Set([3, 6, 9]);
const ENTRY = { x: 5, z: 10 };            // recessed portal in the south face (the street side in the sheet)

const g = new Voxels([11, 24, 11]);

for (const [x, z] of cells) {
  const t = top.get(`${x},${z}`);
  for (let y = 0; y < t; y++) {
    if (y <= BASE_TOP) { g.set(x, y, z, "polished_granite"); continue; }
    if (BAND.has(y)) { g.set(x, y, z, "stone_bricks"); continue; }
    const f = openFace(x, y, z);
    if (y === t - 1) {                    // cornice: dentils on the edge, smooth roof inside
      g.set(x, y, z, f ? ((x + z) % 2 === 0 ? "chiseled_stone_bricks" : "stone_bricks") : "smooth_stone");
      continue;
    }
    if (!WINDOW_ROWS.has(y) || !f) continue;   // interior air gap, nothing on the inside of the skin
    if (x === ENTRY.x && z === ENTRY.z) continue;   // portal opening; door set below
    // bays: piers every third cell along the face and at its corners, a pair of panes between them
    const along = f[0] ? [0, 1] : [1, 0];
    const onFace = (cx, cz) => inV(cx, y, cz) && !inV(cx + f[0], y, cz + f[1]);
    const corner = !onFace(x + along[0], z + along[1]) || !onFace(x - along[0], z - along[1]);
    const s = f[0] ? z : x;
    const pier = corner || s % 3 === 0 || (z === ENTRY.z && (x === ENTRY.x - 1 || x === ENTRY.x + 1) && (y === 3 || y === 4));
    if (pier) { g.set(x, y, z, "calcite"); continue; }
    const pane = f[0] ? { north: "true", south: "true", east: "false", west: "false" } : { east: "true", west: "true", north: "false", south: "false" };
    g.set(x, y, z, "glass_pane", pane);
    // some lower panes show a warm lamp in the air gap behind them
    if (LOWER_PANE_ROWS.has(y) && (x * 5 + z * 3 + y) % 4 === 0) g.set(x - f[0], y, z - f[1], "glowstone");
  }
}

// the portal: a door set back in the recess, facing north (entered from the south face)
const door = (y, half) => g.set(ENTRY.x, y, ENTRY.z - 1, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
door(3, "lower"); door(4, "upper");

// roof plant on the one-storey wing's terrace
g.set(0, 6, 9, "iron_block"); g.set(0, 6, 10, "iron_block");

const stats = g.save(`${DIR}/DC80493.nbt`);
console.log(JSON.stringify({ ...stats, cells: g.count() }));
