// 1703 New Hampshire Ave NW (Dupont Circle): a 1920s red-brick commercial block, three storeys with a stone
// string course at every floor, a four-storey stone-and-brick corner tower, a three-storey rear wing and a
// one-storey lobby. Massing comes from the lidar roof heights, smoothed into four tiers.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC78871.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell
const W = 13, D = 10, H = 20;

const F = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => F.has(`${x},${z}`);

// lidar roof height -> one of four clean tiers (top surface, in blocks above y 0)
function tierOf(x, z) {
  const { roof } = F.get(`${x},${z}`);
  if (roof <= 2) return 2;             // one-storey lobby, flat roof
  if (roof >= 8) return 8;             // corner tower: four storeys
  if (roof <= 6 && z >= 6) return 6;   // rear wing: three storeys, no parapet
  return 7;                            // main block: three storeys and a cornice course
}
const top = (x, z) => (inF(x, z) ? tierOf(x, z) : 0);

const WALL = "bricks", BAND = "stone_bricks", FLOOR = "smooth_stone";
const SOLID = new Set([WALL, BAND, FLOOR, "glass", "glowstone", "glass_pane", "iron_block"]);
const blocks = new Map();                                  // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => blocks.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => blocks.get(`${x},${y},${z}`);

for (const key of F.keys()) {
  const [x, z] = key.split(",").map(Number);
  const { ground } = F.get(key);
  const T = tierOf(x, z);
  const corner = (!inF(x - 1, z) || !inF(x + 1, z)) && (!inF(x, z - 1) || !inF(x, z + 1));
  for (let y = 0; y < T; y++) {
    if (y < ground) { put(x, y, z, BAND); continue; }                              // foundation up to the ground
    const roofRow = y === T - 1;
    const windowRow = !roofRow && (T === 2 ? y === 0 : y % 2 === 1);              // lobby: its one row is glass
    const exposed = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => y >= top(x + dx, z + dz));

    if (!exposed) { if (y % 2 === 0 || roofRow) put(x, y, z, FLOOR); continue; }  // interior: floor slab per storey, no air-filled rooms
    if (z === 0 && x === 3 && y <= 1) { put(x, y, z, "dark_oak_door", { facing: "north", half: y ? "upper" : "lower", hinge: "left", open: "false", powered: "false" }); continue; }
    if (z === 0 && x >= 2 && x <= 4 && y === 2 && T > 2) { put(x, y, z, "dark_oak_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" }); continue; }
    if (roofRow) { put(x, y, z, BAND); continue; }                                 // cornice / parapet
    if (windowRow && z === 0 && T > 2 && y === 1) { put(x, y, z, "glass", null); continue; }   // shopfront glass
    if (windowRow && z === 0 && T === 2) { put(x, y, z, "glass", null); continue; }
    if (windowRow && !corner && (x + z) % 2 === 1) {                               // window grid: panes between brick piers
      if ((x * 3 + z * 5 + y) % 9 === 4) put(x, y, z, "glowstone", null);          // a few lit windows
      else put(x, y, z, "glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
      continue;
    }
    put(x, y, z, windowRow ? WALL : BAND);                                         // piers, and spandrels between storeys
  }
}

// rooftop plant on the tower, with a lightning rod on top
put(8, 8, 4, "iron_block");
put(9, 8, 4, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

// glass panes join the solid faces beside them, as a real pane does
for (const [k, b] of blocks) {
  if (b.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const joins = (dx, dz) => { const n = at(x + dx, y, z + dz); return !!n && (SOLID.has(n.block)); };
  b.state = { north: String(joins(0, -1)), south: String(joins(0, 1)), east: String(joins(1, 0)), west: String(joins(-1, 0)), waterlogged: "false" };
}

const g = new Voxels([W, H, D]);
for (const [k, { block, state }] of blocks) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, block, state ?? undefined); }
const out = g.save(`${DIR}/DC78871.nbt`);
console.log(JSON.stringify(out));
