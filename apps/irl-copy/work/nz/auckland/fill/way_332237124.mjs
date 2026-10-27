// Building 621 (way 332237124): a two-storey brick commercial block with a shopfront on the ground floor, a
// setback to a single-storey wing, and a flat roof with plant. Massing follows the lidar roof cells, quantised
// into three flat tiers (9, 7, 5 blocks); the shell is solid, with an air gap behind every glazed opening.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_332237124.cells.json`, "utf8"));
const g = new Voxels([17, 23, 37]);

// lidar roof heights (above y 0) -> flat tiers: 8-9 is the main block, 6-7 a setback, 4-5 a low wing
const tier = (r) => (r >= 8 ? 9 : r >= 6 ? 7 : 5);
const col = new Map();                       // "x,z" -> tier height
const cellList = [];
for (const [x, z, , roof] of cells) { col.set(`${x},${z}`, tier(roof)); cellList.push([x, z]); }
const H = (x, z) => col.get(`${x},${z}`);
const inS = (x, z) => col.has(`${x},${z}`);
const key = (x, y, z) => `${x},${y},${z}`;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// a wall cell faces outside the footprint or stands beside a lower tier (the setback's side face)
const exposed = (x, z) => DIRS.filter(([dx, dz]) => !inS(x + dx, z + dz));
const isWall = (x, z) => exposed(x, z).length > 0 || DIRS.some(([dx, dz]) => inS(x + dx, z + dz) && H(x + dx, z + dz) < H(x, z));

// the plan: solid cells only; anything not in it inside a column is air
const plan = new Map();
const put = (x, y, z, block, state) => plan.set(key(x, y, z), { block, state });
const storeyFloor = (h) => (h >= 7 ? 4 : null);      // the upper storey's slab; the single-storey wing has none

for (const [x, z] of cellList) {
  const h = H(x, z), wall = isWall(x, z), fl = storeyFloor(h);
  for (let y = 0; y < h; y++) {
    if (wall) {
      const b = y === 0 ? "stone_bricks" : y === h - 1 ? "smooth_stone" : y === fl ? "stone_bricks" : "bricks";
      put(x, y, z, b);
    } else if (y === 0) put(x, y, z, "smooth_stone");              // ground slab
    else if (y === h - 1) put(x, y, z, "stone");                   // roof deck (does not fall)
    else if (y === fl) put(x, y, z, "oak_planks");                 // upper floor
  }
}

// facade: ground floor is a shopfront (glass in two of every three bays), upper storeys one window per three bays
const ground = [1, 2], lintelG = 3;
const upperRows = (h) => (h >= 9 ? [5, 6] : h >= 7 ? [5] : []);
const upperLintel = (h) => (h >= 9 ? 7 : null);
const bayOpen = (y, t) => (y <= 3 ? t % 3 !== 0 : t % 3 === 1);
const glazed = [];                                     // [x, y, z, inward x, inward z]
for (const [x, z] of cellList) {
  if (!isWall(x, z)) continue;
  const h = H(x, z);
  for (const [dx, dz] of exposed(x, z)) {
    const t = dx !== 0 ? z : x, ix = x - dx, iz = z - dz;
    if (!inS(ix, iz)) continue;
    const rows = [...ground, ...upperRows(h)].filter((y) => y < h);
    for (const y of rows) {
      if (!bayOpen(y, t) || y >= H(ix, iz) || plan.has(key(ix, y, iz))) continue;   // air must be behind the glass
      put(x, y, z, "glass_pane");
      glazed.push([x, y, z, ix, iz]);
    }
    // painted head course over each glazed bay
    for (const y of [lintelG, upperLintel(h)].filter((v) => v !== null && v < h)) {
      if (bayOpen(y, t) && plan.get(key(x, y - 1, z))?.block === "glass_pane") put(x, y, z, "white_concrete");
    }
  }
}

// the entrance: the north face of the tip row, a dark oak door under the head course
const [DX, DZ] = [11, 1];
put(DX, 1, DZ, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(DX, 2, DZ, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });

// warm lamps standing on the floor just behind some glazing (ground and upper storeys)
for (const [x, y, z, ix, iz] of glazed) {
  if (y !== 1 && y !== 5) continue;
  if ((x * 2 + z) % 5 !== 0) continue;
  const ly = y;
  if (plan.has(key(ix, ly, iz))) continue;
  put(ix, ly, iz, "lantern", { hanging: "false" });
}

// roof plant on the main block: small iron units standing on the deck, away from the parapet
for (const [x, z] of cellList) {
  if (H(x, z) !== 9 || isWall(x, z) || (x * 3 + z * 7) % 11 !== 0) continue;
  if (!DIRS.every(([dx, dz]) => inS(x + dx, z + dz) && H(x + dx, z + dz) === 9 && !isWall(x + dx, z + dz))) continue;
  put(x, 9, z, "iron_block");
}

for (const [k, v] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const out = g.save(`${DIR}/way_332237124.nbt`);
console.log(`way_332237124: ${out.blocks} blocks, ${out.palette} palette entries, ${glazed.length} glazed bays`);
