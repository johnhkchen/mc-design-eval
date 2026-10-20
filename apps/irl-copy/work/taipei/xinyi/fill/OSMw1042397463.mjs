import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1042397463";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 22 x 38 x 17 volume. Roof at y 26 (about 26 blocks above lowest ground).
// Podium 0..5, then four office storeys of 5 blocks each (floor lines at 6, 11, 16, 21).
const W = 22, H = 38, D = 17;
const ROOF = 26;
const TOP_SLAB = 25;
const FLOOR_LINES = [6, 11, 16, 21];

const g = new Voxels([W, H, D]);

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Footprint lookup: key "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
const fp = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const perim = (x, z) => !fp(x - 1, z) || !fp(x + 1, z) || !fp(x, z - 1) || !fp(x, z + 1);

// Pick the entrance: a perimeter cell on the minimum-z edge, nearest to the middle in x.
let minZ = Infinity;
for (const [, z] of cells) minZ = Math.min(minZ, z);
const southEdge = cells.filter(([x, z]) => z === minZ && perim(x, z)).map(([x]) => x);
const midX = (W - 1) / 2;
const doorX = southEdge.length
  ? southEdge.reduce((best, x) => (Math.abs(x - midX) < Math.abs(best - midX) ? x : best), southEdge[0])
  : null;

for (const [x, z] of cells) {
  const gg = gnd(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gg; y++) put(x, y, z, "stone_bricks");

  if (perim(x, z)) {
    // Facade column, from the cell's ground up to the parapet.
    for (let y = gg; y <= ROOF; y++) {
      if (y === gg && y < 6) {
        put(x, y, z, "polished_granite"); // base course
      } else if (y === TOP_SLAB) {
        put(x, y, z, "smooth_quartz"); // cornice
      } else if (y === ROOF) {
        put(x, y, z, "white_concrete"); // parapet
      } else if (FLOOR_LINES.includes(y)) {
        put(x, y, z, "light_gray_concrete"); // storey line / spandrel
      } else if (y < 6) {
        // Ground-floor shopfront: glass with piers
        put(x, y, z, (x + z) % 3 === 0 ? "white_concrete" : "light_blue_stained_glass");
      } else {
        // Office storeys: window grid with frames
        put(x, y, z, (x + z) % 3 === 0 ? "white_concrete" : "light_blue_stained_glass");
      }
    }
  } else {
    // Interior: only floor slabs and an air gap behind the glass.
    const floors = [gg, ...FLOOR_LINES, TOP_SLAB];
    for (const f of floors) {
      if (f >= gg && f <= TOP_SLAB) put(x, f, z, "light_gray_concrete");
    }
    // Warm lights behind some windows.
    for (const f of [gg, ...FLOOR_LINES]) {
      if (f + 1 < TOP_SLAB && ((x * 5 + z * 7) % 13 === 0)) put(x, f + 1, z, "glowstone");
    }
    // Roof plant room on the roof slab.
    if (x >= 7 && x <= 14 && z >= 5 && z <= 11) {
      put(x, ROOF, z, "light_gray_concrete");
      put(x, ROOF + 1, z, "light_gray_concrete");
      if ((x + z) % 4 === 0) put(x, ROOF + 2, z, "iron_block");
    }
  }
}

// Entrance on the street-facing edge: door in the shopfront, granite lintel above.
if (doorX !== null) {
  const gg = gnd(doorX, minZ);
  if (gg < 6) {
    const doorProps = { facing: "north", hinge: "left", open: "false", powered: "false" };
    put(doorX, gg, minZ, "dark_oak_door", { ...doorProps, half: "lower" });
    put(doorX, gg + 1, minZ, "dark_oak_door", { ...doorProps, half: "upper" });
    put(doorX, gg + 2, minZ, "polished_granite");
    if (doorX - 1 >= 0) put(doorX - 1, gg + 2, minZ, "polished_granite");
    if (doorX + 1 < W) put(doorX + 1, gg + 2, minZ, "polished_granite");
  }
}

g.save(`${DIR}/${ID}.nbt`);
