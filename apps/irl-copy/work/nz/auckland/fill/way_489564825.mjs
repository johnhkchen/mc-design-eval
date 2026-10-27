// Silo Apartments, Mt Eden-side Auckland (OSM way 489564825): a 2000s residential tower on a stone podium.
// White concrete piers and spandrels, glazed bays between, pale string courses every storey (4 blocks), a stepped
// massing from the lidar roof (tiers 32/36/40/44/48), a glazed-entrance canopy, and warm lamps behind some glass.
// Solid only where it must be: foundation under the ground, one floor slab per storey across the footprint, and a
// shell of perimeter columns. Everything inside is air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_489564825.cells.json`, "utf8"));
const W = 40, D = 36, H = 62;

// lidar roof height -> flat 4-block tiers (a tier is a storey multiple, so the setbacks land on storey lines)
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const plan = new Map();
for (const [x, z, g, r] of cells) plan.set(`${x},${z}`, { x, z, g, top: 4 * Math.floor((r + 2) / 4) });
const at = (x, z) => plan.get(`${x},${z}`);
for (const c of plan.values()) if (c.top - c.g < 4) throw new Error(`tier too short at ${c.x},${c.z}`);
for (const c of plan.values()) {
  // out: faces onto the open air beyond the footprint; ex: faces that are exposed (outside, or a lower tier's roof)
  c.out = DIRS.filter(([dx, dz]) => !at(c.x + dx, c.z + dz));
  c.ex = DIRS.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.top < c.top; });
  c.perim = c.ex.length > 0;
}

const b = new Voxels([W, H, D]);
const set = (x, y, z, block, state) => b.set(x, y, z, block, state);
const GLASS = "light_blue_stained_glass";                  // full panes: a thin pane vanishes at street scale

for (const c of plan.values()) {
  const { x, z, g, top: T, ex, perim } = c;
  const L0 = 4 * Math.ceil((g + 3) / 4);            // ground storey ends on the first storey line at least 3 up

  // foundation under the ground, then the floor (plinth on the shell, floor slab inside)
  for (let y = 0; y < g; y++) set(x, y, z, "stone_bricks");
  set(x, g, z, perim ? "stone_bricks" : "smooth_stone");
  // one floor slab per storey line, across the whole footprint: each tier stands on the one below
  for (let L = L0; L <= T - 4; L += 4) set(x, L, z, "light_gray_concrete");
  // roof: cornice on the shell, roof deck on the interior tiers (terraces where a taller tier rises beside them)
  set(x, T - 1, z, perim ? "light_gray_concrete" : "smooth_stone");
  if (c.out.length) set(x, T, z, "white_concrete");           // parapet on the open edge

  if (!perim) continue;
  const runsX = ex.some(([, dz]) => dz);                    // a face with a z normal runs along x
  const corner = ex.some(([dx]) => dx) && ex.some(([, dz]) => dz);
  const mullion = corner || (runsX ? x : z) % 3 === 0;
  const [inx, inz] = [-ex[0][0], -ex[0][1]];                // inward, toward the storey behind the glass

  for (let y = g + 1; y <= T - 2; y++) {
    if (y >= L0 && y % 4 === 0) continue;                   // floor slab, already set
    let block;
    if (y < L0) block = (y <= g + 2 && !mullion) ? GLASS : "stone_bricks";
    else if (y % 4 === 3 || mullion) block = "white_concrete";  // spandrel row and piers
    else block = GLASS;
    if (block === GLASS && (x * 7 + z * 5 + y) % 6 === 0) {
      // some bays lit: glowstone just behind the glass, in the air of the room
      const n = at(x + inx, z + inz);
      if (n && !n.perim && n.top > y && y > n.g) set(x + inx, y, z + inz, "glowstone");
    }
    set(x, y, z, block);
  }
  if (corner && c.out.length) set(x, T + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// the entrance: the lowest open-facing shell cell, with a lobby of glass, an iron door and a canopy on posts
const e = [...plan.values()].filter(c => c.perim && c.out.length && c.ex.length === 1)
  .sort((a, b2) => a.g - b2.g || a.top - b2.top)[0];
const [dx, dz] = e.out[0];
const [tx, tz] = [Math.abs(dz), Math.abs(dx)];            // along the wall
const door = (half) => ({ facing: FACING[`${dx},${dz}`], half, hinge: "left", open: "false", powered: "false" });
set(e.x, e.g + 1, e.z, "iron_door", door("lower"));
set(e.x, e.g + 2, e.z, "iron_door", door("upper"));
for (const t of [-1, 1]) {
  const lx = e.x + t * tx, lz = e.z + t * tz, n = at(lx, lz);
  if (n && n.perim) for (const y of [e.g + 1, e.g + 2]) set(lx, y, lz, GLASS);
}
for (const t of [-1, 0, 1]) for (const k of [1, 2]) {
  const cx = e.x + k * dx + t * tx, cz = e.z + k * dz + t * tz;
  if (!at(cx, cz)) set(cx, e.g + 3, cz, "light_gray_concrete");       // canopy slab
}
for (const t of [-1, 1]) {
  const px = e.x + 2 * dx + t * tx, pz = e.z + 2 * dz + t * tz;
  if (!at(px, pz)) for (let y = e.g; y <= e.g + 2; y++) set(px, y, pz, "stone_bricks");   // posts carry the canopy
}

// roof plant: a solid 4 x 3 housing on the tallest tier, standing on its roof deck, with a stone lid
const tallest = (x, z) => { const c = at(x, z); return c && c.top === 48 && !c.perim && !c.out.length; };
let plant = null;
for (let x0 = 0; x0 + 3 < W && !plant; x0++) for (let z0 = 0; z0 + 2 < D && !plant; z0++) {
  const ok = [...Array(4)].every((_, i) => [...Array(3)].every((__, j) => tallest(x0 + i, z0 + j)));
  if (ok) plant = { x0, z0 };
}
if (plant) for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
  const x = plant.x0 + i, z = plant.z0 + j;
  set(x, 48, z, "light_gray_concrete"); set(x, 49, z, "light_gray_concrete"); set(x, 50, z, "smooth_stone");
}

// terrace planting on the low roofs: moss carpet, a few spots
for (const c of plan.values()) if (!c.perim && (c.top === 32 || c.top === 36) && (c.x + 2 * c.z) % 7 === 0)
  set(c.x, c.top, c.z, "moss_carpet");

const out = `${DIR}/way_489564825.nbt`;
const stats = b.save(out);

// support check: a block with air straight below must have a solid neighbour beside it (a cantilever), or be a
// lamp, a lantern on the parapet, or sit on the ground
let loose = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) for (let y = 1; y < H; y++) {
  if (!b.val(x, y, z) || b.val(x, y - 1, z)) continue;
  const beside = DIRS.some(([ax, az]) => b.val(x + ax, y, z + az));
  if (!beside) loose.push(`${x},${y},${z}`);
}
console.log(`wrote ${out}: ${stats.blocks} blocks, ${stats.palette} palette entries`);
console.log(`entrance at ${e.x},${e.z} (ground ${e.g}), plant room ${plant ? "placed" : "not placed"}`);
console.log(`unsupported cells (no solid below, none beside): ${loose.length}${loose.length ? " e.g. " + loose.slice(0, 8).join(" ") : ""}`);
