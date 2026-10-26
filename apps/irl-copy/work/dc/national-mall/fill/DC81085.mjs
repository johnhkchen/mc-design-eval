// DC81085: 602 Emmanuel Ct NW, a 1920s red-brick walk-up apartment. A 3-bay centre at lidar roof 4 (three storeys
// and a stone cornice) on two-storey wings at roof 3. One block per storey: the wall is a one-cell shell of brick with
// stone trim, the windows sit in the front cell with a one-cell air pocket behind (lit with glowstone in a few), and the
// interior is solid so nothing hangs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC81085.cells.json", "utf8"));
const roof = new Map();
for (const [x, z, , rf] of cells) roof.set(`${x},${z}`, rf);
const R = (x, z) => roof.get(`${x},${z}`);
const cellsXZ = () => Array.from(roof.keys(), (k) => k.split(",").map(Number));

// Codes: P brick pier, S smooth stone trim, B stone bricks plinth, G glass window, T hanging lantern in the opening,
// D / Du dark oak door (lower / upper half).
const FRONT = [
  ["B", "G", "S", "D", "G", "B"],     // y0: plinth, ground-floor windows, door
  ["P", "G", "S", "Du", "G", "P"],    // y1: storey 2
  [null, null, "G", "T", "G", null],  // y2: storey 3 (centre only)
];
const EAST = [                        // x5, indexed by z
  [null, "G", "B", "G", "B"],
  [null, "G", "P", "G", "P"],
];
const WEST = [                        // x0, indexed by z (z0 is the front corner)
  [null, "G", "B", "G"],
  [null, "G", "P", "G"],
];
const BACK = [                        // z4, indexed by x
  [null, "B", "G", "B", "G", "B"],
  [null, "P", "G", "P", "G", "P"],
  [null, null, "G", "P", "G", null],
];
// windows whose air pocket is lit (the cell behind the glass, inside the building)
const LIT = new Set(["1,0,1", "4,1,1", "2,2,1", "4,0,3", "4,2,3"]);

const g = new Voxels([6, 16, 5]);
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };
const CODE = {
  P: ["bricks"], B: ["stone_bricks"], S: ["smooth_stone"], G: ["glass"],
  T: ["lantern", { hanging: "true", waterlogged: "false" }],
  D: ["dark_oak_door", { ...DOOR, half: "lower" }],
  Du: ["dark_oak_door", { ...DOOR, half: "upper" }],
};

// The decor code for a shell cell, by the face it sits on (front first, then east, back, west).
function codeAt(x, y, z) {
  if (z === 0) return FRONT[y]?.[x] ?? null;
  if (x === 5) return EAST[y]?.[z] ?? null;
  if (z === 4) return BACK[y]?.[x] ?? null;
  if (x === 0) return WEST[y]?.[z] ?? null;
  return null;
}
// the interior cell behind a window, one step in from its face
function pocketOf(x, y, z) {
  if (z === 0) return [x, y, 1];
  if (x === 5 || x === 0) return [x === 5 ? 4 : 1, y, z];
  if (z === 4) return [x, y, 3];
  return null;
}

for (const [x, z] of cellsXZ()) {
  const top = R(x, z) - 1;
  const perimeter = !(x >= 1 && x <= 4 && z >= 1 && z <= 3);
  for (let y = 0; y <= top; y++) {
    if (y === top) {                  // cornice on the shell, roof deck inside
      g.set(x, y, z, perimeter ? "smooth_stone" : "stone");
      continue;
    }
    if (!perimeter) { g.set(x, y, z, "bricks"); continue; }
    const c = codeAt(x, y, z);
    if (c === null) { g.set(x, y, z, "bricks"); continue; }     // a pier with no opening
    if (c === "G") { g.set(x, y, z, "glass"); continue; }
    if (c === "T") { g.set(x, y, z, "lantern", CODE.T[1]); continue; }
    const [block, state] = CODE[c] ?? ["bricks"];
    g.set(x, y, z, block, state);
  }
}

// air pockets and lamps behind the glass, after the interior is solid
for (const [x, z] of cellsXZ()) {
  for (let y = 0; y < R(x, z) - 1; y++) {
    const c = codeAt(x, y, z);
    if (c !== "G" && c !== "T") continue;
    const p = pocketOf(x, y, z);
    if (!p) continue;
    if (LIT.has(`${p[0]},${p[1]},${p[2]}`)) g.set(p[0], p[1], p[2], "glowstone");
    else g.set(p[0], p[1], p[2], "air");
  }
}

// roof plant on the centre: an air-handling unit and a brick flue
g.set(2, 4, 1, "iron_block");
g.set(4, 4, 3, "bricks");
g.set(4, 5, 3, "bricks");

console.log(g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC81085.nbt"));
