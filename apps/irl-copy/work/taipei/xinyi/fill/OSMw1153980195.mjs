import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1153980195";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 43, D = 25;
const ROOF_SLAB = 30;   // roof deck top sits at y=30, roof cap/parapet at y=31 (~31 above lowest ground)
const vox = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const foot = new Map();
for (const [x, z, gr] of cells) foot.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => foot.has(`${x},${z}`);

// Perimeter: any side open to outside the footprint
const perim = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
const nearPerim = (x, z) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => has(x + dx, z + dz) && perim(x + dx, z + dz));

// Facade run direction: runsX = wall runs along x (north/south faces)
const runsX = (x, z) => !has(x, z - 1) || !has(x, z + 1);
const runsZ = (x, z) => !has(x - 1, z) || !has(x + 1, z);

// Pier (mullion) columns every 3 blocks, corners always piers
const isPier = (x, z) => {
  const rx = runsX(x, z), rz = runsZ(x, z);
  return (rx && rz) || (rx && x % 3 === 0) || (rz && z % 3 === 0);
};

// Pane connection props so glass joins along the facade
const paneProps = (x, z) => runsX(x, z)
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const GLASS = "light_blue_stained_glass_pane";
const PIER = "white_concrete";
const BAND = "light_gray_concrete";
const MINZ = 0;

for (const [x, z, g] of cells) {
  const per = perim(x, z);

  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < g; y++) vox.set(x, y, z, "stone_bricks");

  // Storeys from ground up to the roof deck
  for (let y = g; y < ROOF_SLAB; y++) {
    const dy = y - g;
    const k = Math.floor(dy / 5);
    const p = dy % 5;

    if (p === 0) {
      // Storey line / slab: base course at grade on the perimeter, white bands above, grey slab inside
      if (per) vox.set(x, y, z, k === 0 ? "stone_bricks" : PIER);
      else vox.set(x, y, z, BAND);
      continue;
    }

    if (!per) {
      // Interior: floor-standing warm lights just behind the glass, otherwise air
      if (p === 1 && k >= 0 && nearPerim(x, z) && ((x * 5 + z * 7 + k * 3) % 11 === 0)) {
        vox.set(x, y, z, "glowstone");
      }
      continue;
    }

    if (p === 4) {
      // Lintel band; entrance canopy on the ground storey
      if (k === 0 && z === MINZ && x >= 8 && x <= 12) {
        vox.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      } else {
        vox.set(x, y, z, BAND);
      }
      continue;
    }

    // p = 1..3: the glazed/pier zone of the storey
    if (k === 0 && z === MINZ && x >= 9 && x <= 11) {
      if (x === 10 && p === 1) {
        vox.set(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (x === 10 && p === 2) {
        vox.set(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else {
        vox.set(x, y, z, GLASS, paneProps(x, z));
      }
      continue;
    }

    if (isPier(x, z)) {
      vox.set(x, y, z, PIER);
    } else {
      vox.set(x, y, z, GLASS, paneProps(x, z));
    }
  }

  // Roof deck and cornice / parapet
  if (g < ROOF_SLAB) {
    vox.set(x, ROOF_SLAB, z, per ? PIER : BAND);
  }
  if (per) vox.set(x, ROOF_SLAB + 1, z, PIER); // parapet to y=31

  // Roof plant screen: solid box with a ring cap, sitting on the roof deck
  if (x >= 7 && x <= 13 && z >= 9 && z <= 15) {
    for (let y = ROOF_SLAB + 1; y <= 33; y++) vox.set(x, y, z, BAND);
    if (x === 7 || x === 13 || z === 9 || z === 15) vox.set(x, 34, z, BAND);
  }
}

// Mast on the plant screen
if (foot.has("10,12")) {
  for (let y = 34; y <= 36; y++) vox.set(10, y, 12, "lightning_rod", { facing: "up", powered: "false" });
}

vox.save(`${DIR}/${ID}.nbt`);
