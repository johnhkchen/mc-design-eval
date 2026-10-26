import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const W = 16, H = 30, D = 5;

// Early-20th-century brick office block: red brick, limestone storey lines and
// cornice, glazed bays on the long street facades, a stone-framed entrance at
// grade with a hood, and warm lamps behind the upper glazing.
const cells = JSON.parse(readFileSync(`${DIR}/DC87222.cells.json`, "utf8"));
const S = new Set(cells.map(c => c[0] + "," + c[1]));
const has = (x, z) => S.has(x + "," + z);

const g = new Voxels([W, H, D]);
const DOOR_X = 7;

for (const [x, z, gr0, roof0] of cells) {
  const gr = Math.max(0, Math.min(H - 4, Math.round(gr0)));
  const rt = Math.max(gr + 4, Math.min(H - 1, Math.round(roof0)));

  // Foundation up to each cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const n = !has(x, z - 1);   // z = 0 street face
  const s = !has(x, z + 1);   // z = D-1 face
  const w = !has(x - 1, z);
  const e = !has(x + 1, z);
  const edge = n || s || w || e;
  const front = n || s;
  const endCol = x === 0 || x === W - 1;
  const winCol = front && !endCol && x % 2 === 1;
  const bayCol = front && !endCol;
  const doorCell = n && x === DOOR_X;
  const doorSurround = n && (x === DOOR_X - 1 || x === DOOR_X + 1);
  const behindZ = (n && z === 1) || (s && z === D - 2);
  const behind = behindZ && winCol;

  for (let y = gr; y < rt; y++) {
    const rel = y - gr;
    let b = "bricks";

    if (y === rt - 1) {
      b = "stone_bricks";                                   // roof deck
    } else if (rel % 3 === 0) {
      b = "stone_bricks";                                   // storey line
    } else if (rel === 1 || rel === 2) {
      if (bayCol && !doorCell && !doorSurround) b = "glass_pane";  // shopfront glazing at grade
      if (doorSurround && rel <= 2) b = "stone_bricks";            // door jambs
    }

    // ground-floor glazing on upper storeys
    if (rel > 2 && rel % 3 === 1 && winCol) b = "glass_pane";

    // stone corner piers on the street faces
    if (front && endCol && rel > 0) b = "stone_bricks";

    if (y === rt - 2 && edge) b = "stone_bricks";              // cornice course

    // door hood over the entrance
    if (doorCell && rel === 3) b = "stone_brick_slab";
    if (n && (x === DOOR_X - 1 || x === DOOR_X + 1) && rel === 3) b = "stone_brick_slab";

    if (doorCell && (rel === 1 || rel === 2)) {
      if (rel === 1) g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      else g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }

    if (behind && rel % 3 === 1) {
      if (x % 4 === 1) g.set(x, y, z, "glowstone");   // warm lamp behind glass
      continue;                                        // otherwise air gap
    }

    g.set(x, y, z, b);
  }

  if (edge && rt < H) g.set(x, rt, z, "stone_brick_wall");  // parapet
}

g.save(`${DIR}/DC87222.nbt`);
