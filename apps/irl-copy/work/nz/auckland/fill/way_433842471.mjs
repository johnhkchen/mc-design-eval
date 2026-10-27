// Way 433842471: a two-storey brick shop-top block (c.1920s-30s commercial, Eden Terrace / Mt Eden edge)
// with a 1950s-style lower rear wing. Stone plinth and cream stone bands, brick piers, sash-style glass,
// a shopfront with a timber bulkhead and a central door on the south (street) face. Mass follows the lidar
// roof heights, smoothed into clean tiers: tall core 9, mid 6 and 4, lower wings 3.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_433842471.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..6, z 0..7

const g = new Voxels([7, 21, 8]);

// --- massing: smooth lidar roof heights into tiers (top = absolute y of the roof surface) ---
// roof 0 is lidar nodata inside the lower wing; it reads as a 3-block wing like its neighbours
const C = new Map();
for (const [x, z, ground, roof] of cells) {
  const T = roof >= 7 ? 9 : roof >= 5 ? 6 : roof === 4 ? 4 : 3;
  C.set(`${x},${z}`, { x, z, g: ground, T });
}
const cellAt = (x, z) => C.get(`${x},${z}`);

// floors: slab rows (ground row, then a storey line for the 9-block core); cap = roof row (top - 1)
function plan(c) {
  const floors = [c.g];
  if (c.T === 9) floors.push(c.g === 0 ? 4 : 5);
  const marks = [...floors, c.T - 1];
  const storeys = floors.map((a, i) => [a + 1, marks[i + 1] - 1]);   // wall rows between slabs
  return { floors, cap: c.T - 1, storeys };
}

// shell = outward-facing cell (outside the footprint, or stepping down to a lower tier); interior cells stay air
// between their floor slabs so the glass has an air gap behind it
function exposedFaces(c) {
  const faces = [];
  const dirs = [["S", 0, 1], ["N", 0, -1], ["E", 1, 0], ["W", -1, 0]];
  for (const [d, dx, dz] of dirs) {
    const n = cellAt(c.x + dx, c.z + dz);
    if (!n) faces.push({ d, dx, dz, outside: true });
    else if (n.T < c.T) faces.push({ d, dx, dz, outside: false });
  }
  return faces;
}

// the cell's facade face: the street-side (outside) faces first, then setbacks
const faceOf = (c) => {
  const f = exposedFaces(c);
  return f.find((q) => q.outside) ?? f[0] ?? null;
};

const SHOP = (c) => c.z === 7 && c.g === 1 && c.T === 9;   // the raised south shopfront
const LIT = (x, y, z) => (x * 5 + z * 3 + y) % 7 === 0;   // a few warm glowstone windows

for (const c of C.values()) {
  const { floors, cap, storeys } = plan(c);
  const face = faceOf(c);
  const shell = face !== null;
  // foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < c.g; y++) g.set(c.x, y, c.z, "stone_bricks");
  for (let y = c.g; y <= cap; y++) {
    if (floors.includes(y)) {
      // base course on the shell, floor slab inside
      const base = y === c.g;
      g.set(c.x, y, c.z, shell ? (base ? "stone_bricks" : "smooth_quartz") : "smooth_stone");
      continue;
    }
    if (y === cap) { g.set(c.x, y, c.z, shell ? "smooth_quartz" : "smooth_stone"); continue; }
    if (!shell) continue;   // interior air
    // storey rows: window grid on the shell, piers on the alternate columns
    const u = face.d === "N" || face.d === "S" ? c.x : c.z;
    const win = u % 2 === 1;
    const st = storeys.find(([lo, hi]) => y >= lo && y <= hi);
    const sill = st && st[1] - st[0] >= 1 && y === st[0];
    if (SHOP(c) && c.x === 3 && y === 2) { g.set(c.x, y, c.z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
    if (SHOP(c) && c.x === 3 && y === 3) { g.set(c.x, y, c.z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    if (SHOP(c) && c.x === 3 && y === 4) { g.set(c.x, y, c.z, "dark_oak_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (SHOP(c)) {
      // shopfront: timber bulkhead, then a glass run to the lintel
      if (y === 2) g.set(c.x, y, c.z, "dark_oak_planks");
      else g.set(c.x, y, c.z, LIT(c.x, y, c.z) ? "glowstone" : "glass_pane");
      continue;
    }
    if (!win) { g.set(c.x, y, c.z, "bricks"); continue; }
    if (sill) { g.set(c.x, y, c.z, "smooth_quartz"); continue; }
    g.set(c.x, y, c.z, LIT(c.x, y, c.z) ? "glowstone" : "glass_pane");
  }
}

// roof plant on the mid tier's interior roof
g.set(4, 4, 5, "iron_block");

// pane connections: a pane joins its glass or solid neighbours, so the grid reads as sash windows, not posts
const SOLID = new Set(["bricks", "smooth_quartz", "stone_bricks", "smooth_stone", "glowstone", "dark_oak_planks", "iron_block"]);
const joins = (x, y, z) => {
  const b = g.get(x, y, z);
  if (!b) return false;
  const name = b.block.replace("minecraft:", "");
  return name === "glass_pane" || SOLID.has(name);
};
const panes = [];
for (const c of C.values()) {
  const { storeys } = plan(c);
  for (const [lo, hi] of storeys) for (let y = lo; y <= hi; y++) {
    const b = g.get(c.x, y, c.z);
    if (b && b.block === "minecraft:glass_pane") panes.push([c.x, y, c.z]);
  }
}
for (const [x, y, z] of panes) {
  const s = (v) => (v ? "true" : "false");
  g.set(x, y, z, "glass_pane", {
    north: s(joins(x, y, z - 1)), south: s(joins(x, y, z + 1)),
    east: s(joins(x + 1, y, z)), west: s(joins(x - 1, y, z)), waterlogged: "false",
  });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_433842471.nbt");
console.log(`way_433842471: ${g.count()} blocks, ${panes.length} panes, ${C.size} cells`);
