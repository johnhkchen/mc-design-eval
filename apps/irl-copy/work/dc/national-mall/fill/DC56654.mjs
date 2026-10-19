// 451 Indiana Ave NW: the District of Columbia's Old City Hall (begun 1820, finished 1849; now the DC Court of Appeals).
// Read from the lidar record: a 4-block north hall (the entrance front), a 6-block wing and a 7-block main body, round
// two courtyards. Inferred from the era and the city's stock rather than a survey: a load-bearing brick body in the
// Federal-to-early-Victorian manner, with sandstone base, string courses and cornice. Storeys are two blocks: a window
// row over a sandstone band. Behind each glass pane is one air cell (a lamp in a quarter of them), then solid core, so
// every block stands on or is held by something below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC56654.cells.json", "utf8"));
const W = 32, D = 31, H = 19;

const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => byXZ.has(key(x, z));
const NEIGH = [[-1, 0], [1, 0], [0, -1], [0, 1]];

// Lidar roof per cell: median of its 3x3 footprint neighbours (kills single-cell noise), then snapped to three flat tiers.
const snapTier = (s) => (s <= 4 ? 4 : s <= 6 ? 6 : 7);
const medianRoof = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(byXZ.get(key(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  return v[Math.floor(v.length / 2)];
};
const tops = new Map(cells.map(([x, z]) => [key(x, z), snapTier(medianRoof(x, z))]));
const R = (x, z) => tops.get(key(x, z)) ?? 0;               // roof height above y 0; 0 outside the footprint
const solid = (x, y, z) => y >= 0 && y < R(x, z);           // everything from y 0 up to the roof is solid (foundation included)
const exposed = (x, y, z) => NEIGH.filter(([dx, dz]) => !solid(x + dx, y, z + dz));   // faces open to air at this height

// Storey rows, counted from the bottom: sandstone base, window row, sandstone band, window row ... sandstone cornice.
const role = (y, r) => (y === 0 ? "base" : y === r - 1 ? "cornice" : y % 2 === 1 ? "window" : "band");
const lamp = (x, y, z) => (x * 7 + y * 13 + z * 5) % 4 === 0;   // a warm light behind about a quarter of the windows

const WALL = "bricks", STONE = "cut_sandstone", BAND = "smooth_sandstone", ROOF = "smooth_stone";
const g = new Voxels([W, H, D]);
const behind = new Map();    // inward air cells of the window rows: "x,y,z" -> lamp | air

for (const [x, z] of cells) {
  const r = R(x, z);
  for (let y = 0; y < r; y++) {
    const open = exposed(x, y, z);
    if (!open.length) { g.set(x, y, z, y === r - 1 ? ROOF : WALL); continue; }
    const rl = role(y, r);
    if (rl === "base" || rl === "cornice") { g.set(x, y, z, STONE); continue; }
    if (rl === "band") { g.set(x, y, z, BAND); continue; }
    // A window row: one exposed face, and a 2-wide pane every fourth block (2-wide piers between). Corners are piers.
    const [dx, dz] = open.length === 1 ? open[0] : [0, 0];
    const bay = dz !== 0 ? x % 4 : z % 4;
    if (open.length !== 1 || (bay !== 1 && bay !== 2)) { g.set(x, y, z, WALL); continue; }
    const state = dz !== 0
      ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    g.set(x, y, z, "glass_pane", state);
    const ix = x - dx, iz = z - dz;                          // the cell behind the glass
    if (solid(ix, y, iz) && !exposed(ix, y, iz).length) behind.set(`${ix},${y},${iz}`, lamp(x, y, z) ? "glowstone" : "air");
  }
}
for (const [k, b] of behind) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, b); }

// Main entrance on the north hall: a double dark-oak door at x 15-16, sandstone pilasters and a lintel over it.
for (const x of [14, 17]) for (const y of [1, 2]) g.set(x, y, 0, STONE);
for (let x = 14; x <= 17; x++) g.set(x, 3, 0, STONE);
const door = (x, half, hinge) => ({ facing: "north", half, hinge, open: "false", powered: "false" });
for (const [x, hinge] of [[15, "left"], [16, "right"]]) {
  g.set(x, 1, 0, "dark_oak_door", door(x, "lower", hinge));
  g.set(x, 2, 0, "dark_oak_door", door(x, "upper", hinge));
}

// Roof equipment: a plant box on the main body's flat roof, standing on the roof surface.
for (let x = 21; x <= 22; x++) for (let z = 9; z <= 10; z++) g.set(x, 7, z, "light_gray_concrete");

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC56654.nbt");
console.log(`DC56654: ${out.blocks} blocks, ${out.palette} palette entries`);
