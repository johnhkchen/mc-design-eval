// 1724 Massachusetts Ave NW: a 1920s-30s Beaux-Arts style office block. Limestone (calcite) piers and string courses on a
// stone-brick plinth, shopfront glass on the ground storey, glazed upper storeys, a stepped massing from the lidar roof
// (tower 12 / wing 10 / lower wing 8 / stub 4), a top-storey cornice and parapet, a roof deck with HVAC units.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC57101.cells.json`, "utf8"));

// lidar roof heights smoothed into flat tiers: the tower, a wing, a lower wing, a one-storey stub
const tier = (r) => (r >= 11 ? 12 : r === 10 ? 10 : r >= 8 ? 8 : 4);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const key = (x, z) => `${x},${z}`;
const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(key(x, z), { ground, top: tier(roof) });
// one majority pass: a cell takes the tier most of its footprint neighbours share, so single lidar-noise cells
// don't notch the tiers (ties keep the cell's own tier)
{
  const raw = new Map([...cell].map(([k, c]) => [k, c.top]));
  for (const [k, c] of cell) {
    const [x, z] = k.split(",").map(Number);
    const votes = [c.top, ...Object.values(DIRS).map(([dx, dz]) => raw.get(key(x + dx, z + dz))).filter((t) => t !== undefined)];
    const count = (t) => votes.filter((v) => v === t).length;
    const best = [...new Set(votes)].sort((a, b) => count(b) - count(a) || b - a)[0];
    if (count(best) >= 3 && count(best) > count(c.top)) c.top = best;
  }
}
const topAt = (x, z) => cell.get(key(x, z))?.top ?? 0;   // outside the footprint counts as no building

// the faces of a cell at height y that show to the outside air: the neighbour is absent or lower than y
const exposed = (x, z, y) => Object.keys(DIRS).filter((d) => { const [dx, dz] = DIRS[d]; return topAt(x + dx, z + dz) <= y; });

// storey floors (string courses / slabs) at absolute y; storeys 2-3 tall, glazed in the rows between
const LEVELS = [1, 4, 7, 10];
const GROUND_ROWS = [2, 3];              // shopfront storey

// the entrance: the south-facing cell at the storey-1 line nearest the middle of the front
const frontCells = cells.filter(([x, z]) => exposed(x, z, 2).includes("S") && topAt(x, z) > 4).map(([x, z]) => [x, z]);
const mid = frontCells.reduce((a, [x]) => a + x, 0) / Math.max(1, frontCells.length);
const door = frontCells.length ? frontCells.reduce((best, c) => (Math.abs(c[0] - mid) < Math.abs(best[0] - mid) ? c : best)) : null;
const doorKey = door ? key(...door) : null;

// a pane connects to a neighbour along its wall when that neighbour stands at the same height
const paneState = (x, z, y, d) => {
  const on = (nx, nz) => (topAt(nx, nz) > y ? "true" : "false");
  if (d === "N" || d === "S") return { north: "false", south: "false", east: on(x + 1, z), west: on(x - 1, z), waterlogged: "false" };
  return { north: on(x, z - 1), south: on(x, z + 1), east: "false", west: "false", waterlogged: "false" };
};

const g = new Voxels([13, 24, 14]);
const lit = [];   // warm lights in the air gap behind the glass

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const { top } = cell.get(key(x, z));
  // foundation and plinth: solid from the lowest ground up to the first storey line
  g.set(x, 0, z, "stone_bricks");
  for (let y = 1; y < top; y++) {
    const ex = exposed(x, z, y);
    // the roof: a parapet of cornice slabs on the outside, a flat roof deck inside
    if (y === top - 1) {
      if (ex.length) g.set(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
      else g.set(x, y, z, "smooth_stone");
      continue;
    }
    // storey floors: the limestone string course on the outside, a slab inside
    if (LEVELS.includes(y) && !(doorKey === key(x, z) && y === 4)) { g.set(x, y, z, ex.length ? "stone_bricks" : "smooth_stone"); continue; }
    // the rest of the outside wall: glazing, piers, and the entrance; inside is air (the room behind the glass)
    if (!ex.length) continue;
    const shop = GROUND_ROWS.includes(y);
    if (doorKey === key(x, z) && ex.includes("S") && (y === 2 || y === 3)) {
      g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    // canopy over the entrance: dark wood slab on the storey-1 line, and its outside neighbours
    if (doorKey === key(x, z) && ex.includes("S") && y === 4) {
      g.set(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" }); continue;
    }
    const d = ex;
    // corners and every third bay are piers; the rest is glass
    const t = d[0] === "N" || d[0] === "S" ? x : z;
    const pier = d.length >= 2 || t % 3 === 0;
    if (pier) { g.set(x, y, z, shop ? "polished_andesite" : "calcite"); continue; }
    if (shop) g.set(x, y, z, "glass");
    else g.set(x, y, z, "glass_pane", paneState(x, z, y, d[0]));
    // a light behind about one window in six, on the air side of the glass
    if ((x * 31 + z * 17 + y * 7) % 6 === 0) {
      const [dx, dz] = DIRS[d[0]];
      const ix = x - dx, iz = z - dz;
      if (topAt(ix, iz) > y && exposed(ix, iz, y).length === 0) lit.push([ix, y, iz]);
    }
  }
}

for (const [x, y, z] of lit) g.set(x, y, z, "glowstone");

// roof equipment: HVAC plant on the tower roof and the wing roofs, set on the roof deck
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const { top } = cell.get(key(x, z));
  if (exposed(x, z, top - 1).length) continue;
  if (top === 12 && (x * 5 + z * 3) % 13 === 0) g.set(x, 12, z, "iron_block");
  if (top === 10 && (x * 7 + z * 2) % 11 === 0) g.set(x, 10, z, "iron_block");
}

const counts = g.save(`${DIR}/DC57101.nbt`);
console.log(`DC57101.nbt: ${counts.blocks} blocks, ${counts.palette} palette entries, entrance at ${door}`);
