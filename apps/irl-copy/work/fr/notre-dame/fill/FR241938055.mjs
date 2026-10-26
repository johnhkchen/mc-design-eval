// FR241938055: an 1729 Parisian residential block, seven storeys (4 blocks each, 28 to the lidar's top), built from
// its footprint cells. Pale limestone walls, a stone plinth, smooth storey bands, glass in every second bay, a
// mansard of deepslate tiles over the main block, flat-roofed wings and an annex, and two brick chimney stacks.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR241938055.cells.json`, "utf8"));

const W = 17, D = 23, H = 44;
const MAIN_TOP = 28, MANSARD = 24, STOREY = 4;
const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// 1. The lidar roof, smoothed into three clean tiers: the main block (7 storeys), the wings (4), the annex (2).
const col = new Map();
for (const [x, z, g, r] of cells) {
  const top = r >= 22 ? MAIN_TOP : r >= 12 ? 16 : 8;
  col.set(`${x},${z}`, { x, z, g, top, main: top === MAIN_TOP, d: 0 });
}
const at = (x, z) => col.get(`${x},${z}`);

// 2. Depth of each main cell in from the main block's edge (1 = on its edge): the mansard steps in one cell a level.
let frontier = [];
for (const c of col.values()) {
  if (c.main && nb.some(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || !n.main; })) { c.d = 1; frontier.push(c); }
}
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const c of frontier) for (const [dx, dz] of nb) {
    const n = at(c.x + dx, c.z + dz);
    if (n && n.main && !n.d) { n.d = d + 1; next.push(n); }
  }
  frontier = next;
}
for (const c of col.values()) if (c.main && !c.d) c.d = 1;

// 3. Solid cells: the plinth and ground below each column; the walls up to each tier; the mansard as a stepped core.
function solid(x, y, z) {
  const c = at(x, z);
  if (!c || y < 0) return false;
  if (y < c.g) return true;
  if (c.main && y >= MANSARD) return y < MAIN_TOP && c.d >= y - MANSARD + 1;
  return y < c.top;
}

// 4. The entrance: the main block's north face at door height, nearest the middle of the front.
const doorCands = [...col.values()].filter((c) => c.main && !solid(c.x, c.g, c.z - 1));
doorCands.sort((a, b) => a.z - b.z || Math.abs(a.x - 7) - Math.abs(b.x - 7));
const door = doorCands[0];

// 5. Walls, floors and the lit windows. Interior cells stay air (an air gap behind the glass), with a floor slab per storey.
const g = new Voxels([W, H, D]);
const lit = [];
for (const c of col.values()) {
  for (let y = 0; y < c.top; y++) {
    if (!solid(c.x, y, c.z)) continue;
    if (y < c.g) { g.set(c.x, y, c.z, "stone_bricks"); continue; }

    const open = nb.filter(([dx, dz]) => !solid(c.x + dx, y, c.z + dz));

    if (c.main && y >= MANSARD) {
      // the mansard: the ring of each level's edge is a stair facing outward, the rest deepslate tiles
      if (y < c.top - 1 && c.d === y - MANSARD + 1) {
        const out = nb.find(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || !n.main || n.d < c.d; });
        if (out) { g.set(c.x, y, c.z, "deepslate_tile_stairs", { facing: FACING[out.join(",")], half: "bottom", shape: "straight", waterlogged: "false" }); continue; }
      }
      g.set(c.x, y, c.z, "deepslate_tiles");
      continue;
    }

    if (y === c.top - 1) { g.set(c.x, y, c.z, "stone_bricks"); continue; }      // a flat roof on a wing or the annex, capped in stone
    if (!open.length) {                                                          // interior: a floor slab, else air
      if (y % STOREY === 0 || y === c.g) g.set(c.x, y, c.z, "oak_planks");
      continue;
    }

    if (door && c.x === door.x && c.z === door.z && (y === c.g || y === c.g + 1)) {
      const state = { facing: "north", hinge: "left", open: "false", powered: "false", half: y === c.g ? "lower" : "upper" };
      g.set(c.x, y, c.z, "dark_oak_door", state);
      continue;
    }
    if (y === c.g) { g.set(c.x, y, c.z, "stone_bricks"); continue; }            // the plinth course
    if (y % STOREY === 0) { g.set(c.x, y, c.z, "smooth_stone"); continue; }     // storey bands

    // bays: a window on every second column of each face, two blocks tall in each storey
    const bay = open.some(([dx, dz]) => (dz !== 0 ? c.x : c.z) % 2 === 1);
    const row = y % STOREY;
    if (bay && (row === 1 || row === 2)) {
      g.set(c.x, y, c.z, "glass");
      if (row === 1 && (c.x * 3 + c.z * 5) % 4 === 0) {
        const [dx, dz] = open[0];
        lit.push([c.x - dx, y, c.z - dz]);                                       // a lamp behind the pane
      }
      continue;
    }
    g.set(c.x, y, c.z, "calcite");
  }
}
for (const [x, y, z] of lit) if (!solid(x, y, z)) g.set(x, y, z, "glowstone");

// 6. Parapets on the low roofs' edges, where they meet open air or a lower roof.
for (const c of col.values()) {
  if (c.main) continue;
  if (nb.some(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.top < c.top; }))
    g.set(c.x, c.top, c.z, "stone_brick_wall");
}

// 7. Two brick chimney stacks on the mansard's top.
for (const [tx, tz] of [[5, 7], [11, 15]]) {
  const c = [...col.values()].filter((q) => q.main && q.d >= 4)
    .sort((a, b) => Math.abs(a.x - tx) + Math.abs(a.z - tz) - Math.abs(b.x - tx) - Math.abs(b.z - tz))[0];
  if (!c) continue;
  g.set(c.x, MAIN_TOP, c.z, "bricks");
  g.set(c.x, MAIN_TOP + 1, c.z, "bricks");
  g.set(c.x, MAIN_TOP + 2, c.z, "smooth_stone");
}

const out = `${DIR}/FR241938055.nbt`;
const info = g.save(out);
console.log(`FR241938055: ${info.blocks} blocks, ${info.palette} palette entries -> ${out}`);
