import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499678";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 24, H = 33, D = 29;
const g = new Voxels([W, H, D]);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const c of cells) map.set(key(c[0], c[1]), c);
const has = (x, z) => map.has(key(x, z));

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Building-level lidar roof: median of cell roofs keeps the tiers flat.
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const roofMed = roofs[Math.floor(roofs.length / 2)];
// Lowest ground sets the shared storey datum.
const fl = Math.min(...cells.map(c => Math.round(c[2])));
const top = clamp(Math.round(roofMed), fl + 18, H - 2);

// Storey datums: four storeys of 5 blocks, attic under the slate roof.
const floors = [0, 5, 10, 15].map(o => fl + o);

// Entrance: south-facing perimeter cell nearest the centre line.
let doorCell = null;
for (const c of cells) {
  const [x, z] = c;
  if (!has(x, z + 1)) {
    if (!doorCell || Math.abs(x - W / 2) < Math.abs(doorCell[0] - W / 2)) doorCell = c;
  }
}
const doorX = doorCell ? doorCell[0] : -1;
const doorZ = doorCell ? doorCell[1] : -1;

// Perimeter side classification; corners return null.
function sideOf(x, z) {
  const mW = !has(x - 1, z), mE = !has(x + 1, z), mN = !has(x, z - 1), mS = !has(x, z + 1);
  if ((mW && mE) || (mN && mS)) return null;
  if (mW && !mN && !mS) return { kind: "x", inX: 1, inZ: 0, edge: z };
  if (mE && !mN && !mS) return { kind: "x", inX: -1, inZ: 0, edge: z };
  if (mN && !mW && !mE) return { kind: "z", inX: 0, inZ: 1, edge: x };
  if (mS && !mW && !mE) return { kind: "z", inX: 0, inZ: -1, edge: x };
  return null;
}

for (const c of cells) {
  const [x, z, gr0] = c;
  const ground = clamp(Math.round(gr0), 0, top - 3);
  const perim = !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));
  const side = perim ? sideOf(x, z) : null;

  // Foundation: granite from y0 up to this cell's ground.
  for (let y = 0; y < ground; y++) put(x, y, z, "granite");

  // Walls on the perimeter, open air inside.
  for (let y = ground; y < top; y++) {
    if (perim) put(x, y, z, "stone_bricks");
  }

  // Base course.
  if (perim) put(x, ground, z, "polished_andesite");

  // Storey floors, string courses, cornices.
  for (const Y of floors) {
    if (Y < ground || Y >= top) continue;
    put(x, Y, z, "smooth_stone");
    if (perim && Y + 4 < top) put(x, Y + 4, z, "chiseled_stone_bricks");
  }

  // Parapet: raised rim on the perimeter, sitting on the roof cap.
  if (perim) put(x, top + 1, z, "stone_brick_wall");

  // Windows on alternate bays; pilasters of polished andesite between them.
  if (side) {
    const isWin = side.edge % 2 === 1;
    if (isWin) {
      floors.forEach((Y, k) => {
        if (Y < ground || Y + 3 >= top) return;
        if (c[0] === doorX && c[1] === doorZ && k === 0) return;
        for (let dy = 1; dy <= 3; dy++) put(x, Y + dy, z, "glass_pane");
        // Warm light behind some panes.
        if (((x * 5 + z * 3 + k) % 3) === 0) {
          const ix = x + side.inX, iz = z + side.inZ;
          if (has(ix, iz)) put(ix, Y + 2, iz, "lantern", { hanging: "false" });
        }
      });
    } else {
      // Pilaster: a column of polished andesite in the wall bay between windows.
      for (let y = ground + 1; y < top - 1; y++) {
        if (y % 5 !== 0) put(x, y, z, "polished_andesite");
      }
    }
  }

  // Attic: small dormer glazing on the perimeter.
  if (perim && side && top - 3 > floors[3] + 4) {
    const atticY = floors[3] + 5;
    if (atticY < top - 1 && side.edge % 4 === 1) put(x, atticY, z, "glass_pane");
  }

  // Slate roof cap.
  put(x, top, z, "deepslate_tiles");
}

// Entrance: door with a surround of chiseled stone and a dark canopy slab.
if (doorCell) {
  const [dx, dz, dg] = doorCell;
  const yg = clamp(Math.round(dg), 0, top - 5);
  put(dx, yg, dz, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, yg + 1, dz, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Portal surround: chiseled jambs either side of the door.
  for (const jx of [dx - 1, dx + 1]) {
    if (has(jx, dz)) {
      put(jx, yg, dz, "chiseled_stone_bricks");
      put(jx, yg + 1, dz, "chiseled_stone_bricks");
      put(jx, yg + 2, dz, "chiseled_stone_bricks");
    }
  }
  // Lintel and canopy line above the door.
  put(dx, yg + 2, dz, "chiseled_stone_bricks");
  put(dx, yg + 3, dz, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  // Canopy projecting outward over the entrance when the cell in front is outside the footprint.
  if (!has(dx, dz + 1)) {
    for (const cx of [dx - 1, dx, dx + 1]) put(cx, yg + 4, dz + 1, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
