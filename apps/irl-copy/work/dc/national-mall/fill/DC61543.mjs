// DC61543: 395 E St SW, a 1960s-70s federal office block (precast piers, light-grey spandrels, blue-glass ribbon windows).
// Massing follows the lidar roof per cell: a 19-block core, 17-block wings, an 18 band and 16 step on the south and
// east, and a 2-block glazed lobby on the east. Every storey is a solid slab across the footprint, so nothing floats;
// the interior is air behind the glass, with a warm hanging lantern in some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC61543.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 19, H = 31, D = 28;

const roof = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));
const inFp = (x, z) => roof.has(`${x},${z}`);
const R = (x, z) => roof.get(`${x},${z}`) ?? -1;

// Outward faces of the voxel (x, y, z): a neighbour off the footprint, or one whose roof is at or below y.
const OUT = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const outward = (x, y, z) => OUT.filter(([dx, dz]) => !inFp(x + dx, z + dz) || R(x + dx, z + dz) <= y);

const grid = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => grid.set(key(x, y, z), { block, state });
const at = (x, y, z) => grid.get(key(x, y, z));

const PANE = "light_blue_stained_glass_pane";

// Shell: base course, ground-floor shopfront, window bands with piers every third bay, spandrel slabs, roof cap.
for (const [x, z, , r] of cells) {
  for (let y = 0; y < r; y++) {
    const out = outward(x, y, z);
    const ext = out.length > 0;
    if (y === r - 1) {                                    // roof: glazed lobby roof, parapet coping, or gravel-grey membrane
      put(x, y, z, r <= 2 ? "light_blue_stained_glass" : ext ? "smooth_stone" : "gray_concrete");
      continue;
    }
    if (y === 0) { put(x, y, z, ext ? "polished_andesite" : "smooth_stone"); continue; }   // base course and ground slab
    if (y >= 3 && y % 2 === 1) { put(x, y, z, "light_gray_concrete"); continue; }         // storey slab / spandrel
    if (!ext) continue;                                                                    // interior air behind the glass
    const [dx, dz] = out[0];
    const u = dz !== 0 ? x : z;                                                           // position along the facade
    if (out.length > 1 || u % 3 === 0) put(x, y, z, "white_concrete");                    // corners and piers
    else put(x, y, z, PANE);
  }
}

// Entrance: a pair of doors on the south face, a canopy band over them.
for (const x of [5, 6]) {
  const hinge = x === 5 ? "left" : "right";
  put(x, 1, 27, "iron_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
  put(x, 2, 27, "iron_door", { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
}
for (let x = 4; x <= 7; x++) put(x, 4, 27, "smooth_stone_slab", { type: "top", waterlogged: "false" });

// Tower penthouse on the 19 core: a 4 x 4 box, spandrel base, glass band, coping.
for (let x = 6; x <= 9; x++) for (let z = 7; z <= 10; z++) {
  const edge = x === 6 || x === 9 || z === 7 || z === 10;
  const corner = (x === 6 || x === 9) && (z === 7 || z === 10);
  put(x, 19, z, "light_gray_concrete");
  if (edge) put(x, 20, z, corner || (x + z) % 2 === 0 ? "white_concrete" : "gray_stained_glass_pane");
  put(x, 21, z, "smooth_stone");
}

// Roof plant: a 2 x 2 group of condensers on the 17 wing, standing on its roof cap.
for (let x = 12; x <= 13; x++) for (let z = 23; z <= 24; z++) put(x, 17, z, "iron_block");

// Warm light: a lantern hanging under the slab above, in the air behind some windows.
for (const [k, b] of [...grid]) {
  const [x, y, z] = k.split(",").map(Number);
  if (b.block !== PANE || y < 2 || y % 2 !== 0) continue;
  if ((x * 5 + y * 7 + z * 3) % 11 !== 0) continue;
  const out = outward(x, y, z);
  if (!out.length) continue;
  const [dx, dz] = out[0];
  const xi = x - dx, zi = z - dz;
  if (!inFp(xi, zi) || at(xi, y, zi) || !at(xi, y + 1, zi)) continue;   // air inside, solid slab above
  put(xi, y, zi, "lantern", { hanging: "true", waterlogged: "false" });
}

// Panes join their neighbours the way the game draws them: to piers, walls and other panes.
const isPane = (b) => b === PANE || b === "gray_stained_glass_pane";
const solid = (nb) => nb && !isPane(nb.block) && !/slab|lantern|door|stairs/.test(nb.block);
const joins = (nb) => isPane(nb?.block) || solid(nb);
for (const [k, b] of grid) {
  if (!isPane(b.block)) continue;
  const [x, y, z] = k.split(",").map(Number);
  const c = (n) => (n ? "true" : "false");
  b.state = {
    north: c(joins(at(x, y, z - 1))), south: c(joins(at(x, y, z + 1))),
    east: c(joins(at(x + 1, y, z))), west: c(joins(at(x - 1, y, z))), waterlogged: "false",
  };
}

const v = new Voxels([W, H, D]);
for (const [k, { block, state }] of grid) {
  const [x, y, z] = k.split(",").map(Number);
  v.set(x, y, z, block, state);
}
const stats = v.save(`${DIR}/DC61543.nbt`);
console.log("DC61543.nbt", stats);
