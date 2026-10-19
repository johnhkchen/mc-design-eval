// 587 Fifth Avenue, Commercial & Office, 1921: a 34 x 8 block Beaux-Arts office block, limestone shafts on a granite base,
// a shopfront ground floor with two doors, pilaster bays, storey lines, a stepped crown with a penthouse, and lanterns
// hung behind some windows. Floors are slabs at every storey line, so the walls stand on them and the windows have air behind.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035428.cells.json`, "utf8"));
const W = 34, D = 8, Y = 52;

// Lidar roof heights quantised to three flat tiers; 0 is no building (a gap or light court), left open.
const tier = (r) => (r <= 0 ? 0 : r <= 34 ? 33 : r <= 38 ? 37 : 40);
const H = Array.from({ length: D }, () => new Array(W).fill(0));
for (const [x, z, , roof] of cells) H[z][x] = tier(roof);

const h = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? 0 : H[z][x]);
// Faces of voxel (x,y,z) that look onto air: a neighbour column that is missing or shorter than y.
const exposed = (x, y, z) =>
  [["N", h(x, z - 1)], ["S", h(x, z + 1)], ["W", h(x - 1, z)], ["E", h(x + 1, z)]]
    .filter(([, n]) => n <= y).map(([d]) => d);

const K = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const B = (block, state) => ({ block, state });
const DOORS = [{ x: 12, z: 0, facing: "north" }, { x: 20, z: 7, facing: "south" }];
const lamps = [];

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const top = H[z][x];
  if (!top) continue;
  for (let y = 0; y < top; y++) {
    const ex = exposed(x, y, z);
    if (!ex.length) {
      // inside: a floor slab at each storey line (and at the ground), a roof deck under the cap, air between
      if (y === top - 1) K.set(key(x, y, z), B("smooth_stone"));
      else if (y % 3 === 0) K.set(key(x, y, z), B("stone"));
      continue;
    }
    const zFace = ex.includes("N") || ex.includes("S");
    const idx = zFace ? x : z;
    const pil = zFace ? x % 4 === 0 || x === W - 1 : z % 4 === 0;
    const door = DOORS.find((d) => d.x === x && d.z === z && y <= 2);
    let v;
    if (y === top - 1) v = B("chiseled_stone_bricks");                       // roof edge
    else if (y === top - 2) v = B("polished_diorite");                       // cornice band
    else if (y === 0) v = B("polished_granite");                             // base course
    else if (door) v = B("dark_oak_door", { facing: door.facing, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    else if (pil) v = B(y < 3 ? "polished_granite" : "polished_diorite");   // pilasters; granite piers at the shopfront
    else if (y % 3 === 0) v = B("smooth_stone");                             // storey line
    else v = B("glass_pane");                                                // window, or shopfront glass below y 3
    K.set(key(x, y, z), v);

    if (y === top - 1) K.set(key(x, top, z), B("stone_brick_wall"));         // parapet on the exposed roof edge

    // a warm lantern hung in the air behind some windows, under the floor slab above
    const lit = (y >= 5 && y % 3 === 2 && idx % 3 === 1 && !pil) || (y === 2 && idx % 6 === 2 && !pil);
    if (v.block === "glass_pane" && lit && y + 1 < top) {
      const d = ex.includes("N") ? [0, 1] : ex.includes("S") ? [0, -1] : ex.includes("W") ? [1, 0] : [-1, 0];
      lamps.push([x + d[0], y, z + d[1]]);
    }
  }
}

for (const [x, y, z] of lamps) {
  if (x < 0 || z < 0 || x >= W || z >= D || H[z][x] <= y || K.has(key(x, y, z))) continue;
  K.set(key(x, y, z), B("lantern", { hanging: "true", waterlogged: "false" }));
}

// Penthouse on the tallest middle of the crown: calcite walls with a glass band, a diorite cornice and a roof cap.
const P = new Set();
for (let z = 2; z <= 5; z++) for (let x = 9; x <= 16; x++) if (H[z][x] === 40) P.add(`${x},${z}`);
const inP = (x, z) => P.has(`${x},${z}`);
for (const k of P) {
  const [x, z] = k.split(",").map(Number);
  const edge = !inP(x - 1, z) || !inP(x + 1, z) || !inP(x, z - 1) || !inP(x, z + 1);
  for (let y = 40; y <= 42; y++) {
    if (!edge) { K.delete(key(x, y, z)); continue; }
    K.set(key(x, y, z), B(y === 41 ? "glass_pane" : y === 42 ? "polished_diorite" : "calcite"));
  }
  K.set(key(x, 43, z), B("smooth_stone"));
}

// Glass panes connect to neighbouring panes only; everything else is a plain post.
const isPane = (x, y, z) => K.get(key(x, y, z))?.block === "glass_pane";
const g = new Voxels([W, Y, D]);
for (const [k, v] of K) {
  const [x, y, z] = k.split(",").map(Number);
  let state = v.state;
  if (v.block === "glass_pane") state = {
    east: String(isPane(x + 1, y, z)), west: String(isPane(x - 1, y, z)),
    north: String(isPane(x, y, z - 1)), south: String(isPane(x, y, z + 1)), waterlogged: "false",
  };
  g.set(x, y, z, v.block, state);
}
const { blocks, palette } = g.save(`${DIR}/NYC1035428.nbt`);
console.log(`587 5 Avenue: ${blocks} blocks, ${palette} palette entries`);
