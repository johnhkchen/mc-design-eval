// Way 326736327: a 1930s brick-faced reinforced-concrete commercial block (three storeys on a core, two on a ring,
// one on the wings), built from the lidar roof heights: a 3x3 median smooths the noise, then each cell snaps to a
// storey top (5 = one storey, 9 = two, 13 = three). Storeys are 4 blocks: a slab row at each floor (y % 4 == 0, the
// base course at y 0), a sill, a glass band and a lintel per bay, with air behind the glass and lanterns in some bays.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${dir}/way_326736327.cells.json`, "utf8"));   // [x, z, ground, roof]
const g = new Voxels([38, 25, 36]);

const key = (x, z) => `${x},${z}`;
const roof = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
const ground = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));

const median = (vals) => { const s = [...vals].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const tops = new Map();
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const vs = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const r = roof.get(key(x + dx, z + dz)); if (r !== undefined) vs.push(r); }
  const m = median(vs);
  tops.set(key(x, z), m >= 12 ? 13 : m >= 8 ? 9 : 5);
}
const top = (x, z) => tops.get(key(x, z));

// the four neighbours, with the direction of each from the cell
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
// the faces of a cell at height y that look out: outside the footprint, or onto a neighbour with nothing at y
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => { const t = top(x + dx, z + dz); return t === undefined || t <= y; });

// foundation: solid from y 0 up to the cell's ground (all flat here, so nothing is added)
for (const [x, z] of cells.map((c) => [c[0], c[1]])) for (let y = 0; y < ground.get(key(x, z)); y++) g.set(x, y, z, "stone");

// the entrance: the south-facing wall cell nearest the middle of the footprint, on the ground storey
const midX = (Math.min(...cells.map((c) => c[0])) + Math.max(...cells.map((c) => c[0]))) / 2;
const doorCandidates = cells.map((c) => [c[0], c[1]]).filter(([x, z]) => {
  const ex = exposed(x, z, 1); return ex.length === 1 && ex[0][2] === "south" && [1, 2].includes(((x % 4) + 4) % 4);
});
const door = doorCandidates.sort((a, b) => Math.abs(a[0] - midX) - Math.abs(b[0] - midX))[0];

const lamps = [];
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const t = top(x, z);
  for (let y = 0; y < t; y++) {
    if (y < ground.get(key(x, z))) continue;
    const ex = exposed(x, z, y);

    // floor slab rows: the base course and the string courses outside, a plain slab inside
    if (y % 4 === 0) {
      if (ex.length) g.set(x, y, z, y === 0 ? "smooth_stone" : "white_concrete");
      else g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (!ex.length) continue;                                  // air behind the glass
    if (door && door[0] === x && door[1] === z && y <= 2) {    // the door, with its step at y 0
      if (y === 1) g.set(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      else g.set(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (ex.length >= 2) { g.set(x, y, z, "stone_bricks"); continue; }   // corner pilasters
    const [dx, dz] = ex[0];
    const along = dz !== 0 ? x : z;
    const col = ((along % 4) + 4) % 4;
    const row = y % 4;                                          // 1 sill, 2 glass, 3 lintel
    if (col === 0) { g.set(x, y, z, "stone_bricks"); continue; }   // stone pilasters between brick piers
    if (col === 3) { g.set(x, y, z, "bricks"); continue; }
    // a two-cell window: glass between a sill and a lintel (the ground storey is all shopfront glass)
    const ground0 = y < 4;
    if (row === 3 || (!ground0 && row === 1)) { g.set(x, y, z, "white_concrete"); continue; }
    const conn = dz !== 0 ? { east: "true", west: "true", north: "false", south: "false" } : { north: "true", south: "true", east: "false", west: "false" };
    g.set(x, y, z, "glass_pane", conn);
    if (row === 2 && ((along >> 2) + (y >> 2)) % 2 === 0) lamps.push([x - dx, y - 1, z - dz]);   // a lantern behind alternate bays
  }
  // the parapet: a cap on the cells that front outside or a lower roof
  const ex = DIRS.filter(([dx, dz]) => { const n = top(x + dx, z + dz); return n === undefined || n < t; });
  if (ex.length) g.set(x, t, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// lamps stand on their storey's floor slab, one block in from the glass
for (const [x, y, z] of lamps) if (top(x, z) !== undefined && exposed(x, z, y).length === 0) g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });

// the lantern over the door, hung from the cornice
if (door) g.set(door[0], 3, door[1], "lantern", { hanging: "true", waterlogged: "false" });

// the step: a stair in the wall's base course, low toward the street
if (door) g.set(door[0], 0, door[1], "stone_brick_stairs", { facing: "south", half: "bottom", shape: "straight", waterlogged: "false" });

// roof plant: a two-by-two plant box on the core, away from the parapet
const core = cells.map((c) => [c[0], c[1]]).filter(([x, z]) => [-1, 0, 1].every((dx) => [-1, 0, 1].every((dz) => top(x + dx, z + dz) === 13)));
if (core.length) {
  const cx = core.reduce((s, c) => s + c[0], 0) / core.length, cz = core.reduce((s, c) => s + c[1], 0) / core.length;
  const [bx, bz] = core.sort((a, b) => Math.hypot(a[0] - cx, a[1] - cz) - Math.hypot(b[0] - cx, b[1] - cz))[0];
  for (let dx = 0; dx <= 1; dx++) for (let dz = 0; dz <= 1; dz++) for (let y = 13; y <= 14; y++) g.set(bx + dx, y, bz + dz, "light_gray_concrete");
}

const counts = g.save(`${dir}/way_326736327.nbt`);
console.log(JSON.stringify({ footprint: cells.length, tiers: { 5: [...tops.values()].filter((t) => t === 5).length, 9: [...tops.values()].filter((t) => t === 9).length, 13: [...tops.values()].filter((t) => t === 13).length }, door, lamps: lamps.length, ...counts }));
