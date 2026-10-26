import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1726 5th St NW (Shaw): a three-storey red-brick Victorian rowhouse conversion with a flat tar roof, a stone plinth,
// stone storey lines and a parapet. The street front is the tall row (z 0, north); the rear steps down to two-storey
// wings on the downhill east side, and one brick chimney stands on the roof of the body.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC64069.cells.json`, "utf8"));   // [x, z, ground, roof]

const ground = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));
const has = (x, z) => ground.has(`${x},${z}`);
// the lidar roof, smoothed into three flat tiers: the street row at 5, the body at 4, the east wings at 3
const roofOf = (x, z) => (z === 0 ? 5 : x >= 4 ? 3 : 4);
// storey roles by height above the cell's ground: plinth, window rows, storey line, cornice
const ROLES = { 5: ["base", "win", "band", "win", "cap"], 4: ["base", "win", "win", "cap"], 3: ["base", "win", "cap"], 2: ["win", "cap"] };
const FACE = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const IN = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };   // the cell behind a wall face
const exposed = (x, z) => Object.keys(FACE).filter((f) => !has(x + FACE[f][0], z + FACE[f][1]));

const B = new Map();   // "x,y,z" -> { block, state }: the whole model, written out once every rule has run
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => B.set(key(x, y, z), { block, state });
const drop = (x, y, z) => B.delete(key(x, y, z));
const at = (x, y, z) => B.get(key(x, y, z)) ?? null;

const windows = [];
for (const [x, z, gr] of cells) {
  const R = roofOf(x, z), H = R - gr, faces = exposed(x, z), outside = faces.length > 0;
  // a building corner is an outer corner of the footprint (not a notch); a notch cell is brick, with no window
  const corner = faces.length > 1 && (x === 0 || x === 5) && (z === 0 || z === 4);
  for (let y = 0; y < gr; y++) put(x, y, z, outside ? "stone_bricks" : "bricks");   // foundation up to the ground
  for (let k = 0; k < H; k++) {
    const y = gr + k, role = ROLES[H][k];
    if (!outside) { put(x, y, z, role === "cap" ? "stone" : "bricks"); continue; }   // solid core, roof deck on top
    if (role === "base" || corner) { put(x, y, z, "stone_bricks"); continue; }   // plinth, quoins
    if (role === "cap" || role === "band") { put(x, y, z, "smooth_stone"); continue; }   // storey line, cornice
    if (faces.length > 1) { put(x, y, z, "bricks"); continue; }
    // window rows: a glass pane on alternate cells of the wall, brick piers between
    const face = faces[0];
    const wins = face === "north" || face === "south" ? x % 2 === 0 : z % 2 === 1;
    if (wins) { put(x, y, z, "glass_pane"); windows.push({ x, y, z, face }); }
    else put(x, y, z, "bricks");
  }
  if (outside) put(x, R, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });   // coping on the roof edge
}

// entrance: a dark-oak door in the street front at x 1 under a stone lintel; its vestibule is two air cells
put(1, 0, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(1, 1, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
drop(1, 0, 1); drop(1, 1, 1);

// each window has an air gap behind its glass; every third one holds a glowstone lamp instead
for (const { x, y, z, face } of windows) {
  const [dx, dz] = IN[face], px = x + dx, pz = z + dz;
  if ((x * 7 + y * 3 + z) % 3 === 0) put(px, y, pz, "glowstone"); else drop(px, y, pz);
}

// a brick chimney on the roof of the body, capped with a stone slab
put(1, 4, 3, "bricks"); put(1, 5, 3, "bricks");
put(1, 6, 3, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

const g = new Voxels([6, 17, 5]);
for (const [k, c] of B) {
  const [x, y, z] = k.split(",").map(Number);
  let state = c.state;
  if (c.block === "glass_pane") {
    // a pane joins any solid neighbour in its plane (but not the door): the frame reads as a window in the wall
    state = { waterlogged: "false" };
    for (const [d, [dx, dz]] of Object.entries(FACE)) {
      const nb = at(x + dx, y, z + dz);
      state[d] = nb && nb.block !== "dark_oak_door" ? "true" : "false";
    }
  }
  g.set(x, y, z, c.block, state);
}
const { blocks, palette } = g.save(`${DIR}/DC64069.nbt`);
console.log(`DC64069.nbt: ${blocks} blocks, ${palette} palette entries, ${windows.length} window cells`);
