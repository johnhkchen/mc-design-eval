// Way 948317517, Eden Terrace-side commercial block: a red-brick Edwardian shopfront terrace with a stone base,
// string courses and parapet, a podium with a stepped corner tower (14 high) on the south-east corner.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(DIR + "way_948317517.cells.json", "utf8"));

// Massing: the lidar roof snapped to four flat tiers (wing 6, podium 8, setback 11, tower 14), each at least one storey above its ground.
const TIERS = [6, 8, 11, 14];
const snap = (r) => TIERS.reduce((best, t) => (Math.abs(t - r) < Math.abs(best - r) || (Math.abs(t - r) === Math.abs(best - r) && t > best) ? t : best));
const col = new Map();   // "x,z" -> { g: ground, t: top (exclusive y) }
for (const [x, z, g, r] of cells) col.set(`${x},${z}`, { g, t: Math.max(g + 4, snap(r)) });
const top = (x, z) => col.get(`${x},${z}`)?.t ?? 0;   // outside the footprint: 0, so every face there is open to the air

const FACES = [[-1, 0], [1, 0], [0, -1], [0, 1]];       // west, east, north (street side, z = 0), south
const FACE_ID = { "-1,0": 0, "1,0": 1, "0,-1": 2, "0,1": 3 };

const B = new Map();                                     // "x,y,z" -> [block, state], or null for an air gap
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, [block, state]);
const carve = (x, y, z) => B.set(`${x},${y},${z}`, null);
const windows = [];

// Pass 1: each cell is a solid column from its ground to its top; exposed faces get the facade, the top course the parapet.
for (const [key, { g, t }] of col) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");          // foundation up to this cell's ground
  for (let y = g; y < t; y++) {
    const rel = y - g, storey = Math.floor(rel / 4), ground = rel < 4;
    const out = FACES.filter(([dx, dz]) => top(x + dx, z + dz) <= y);  // faces with nothing built against them at this height
    if (!out.length) { put(x, y, z, y === t - 1 ? "light_gray_concrete" : "bricks"); continue; }   // interior mass / roof deck
    if (y === t - 1) { put(x, y, z, "smooth_stone"); continue; }        // parapet cornice
    if (rel === 0) { put(x, y, z, "stone_bricks"); continue; }          // base course
    if (out.length > 1) { put(x, y, z, "smooth_stone"); continue; }     // quoin at a corner
    const [dx, dz] = out[0], face = FACE_ID[`${dx},${dz}`];
    const coord = dx ? z : x, bay = coord % 4;                           // bays of 4: pier, 2 glass, pier, all along the face
    if (ground && rel === 3) { put(x, y, z, "dark_oak_planks"); continue; }   // shop fascia
    if (!ground && rel % 4 === 0) { put(x, y, z, "smooth_stone"); continue; } // sill course of each storey
    if (!ground && rel % 4 === 3) { put(x, y, z, "bricks"); continue; }       // brick spandrel under the window head
    if (bay === 0 || bay === 3) { put(x, y, z, "bricks"); continue; }
    put(x, y, z, "glass_pane");
    windows.push({ x, y, z, inX: x - dx, inZ: z - dz, storey, face, lit: (Math.floor(coord / 4) + storey * 2 + face) % 3 === 0 });
  }
}

// Pass 2: each glass pane has an air gap behind it (glowstone in the lit ones), so the window sits in a recess.
for (const w of windows) {
  if (top(w.inX, w.inZ) <= w.y) continue;
  if (w.lit) put(w.inX, w.y, w.inZ, "glowstone"); else carve(w.inX, w.y, w.inZ);
}

// Street entrance on the north face at x = 2: a dark oak door in the recess, a hood over it, and the air behind.
const doorG = col.get("2,0").g;
for (const dy of [1, 2]) {
  const y = doorG + dy;
  put(2, y, 0, "dark_oak_door", { facing: "north", half: dy === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
  carve(2, y, 1);                                                   // the air gap behind the door
}
for (const x of [1, 2, 3]) put(x, doorG + 3, 0, "dark_oak_slab", { type: "bottom", waterlogged: "false" });

// Roof plant on the podium, and a stepped crown with a lantern on the tower.
for (const [x, z] of [[6, 5], [7, 5]]) put(x, top(x, z), z, "iron_block");
for (const [x, z] of [[16, 11], [17, 11], [16, 12], [17, 12]]) {
  const t = top(x, z);
  put(x, t, z, "smooth_stone"); put(x, t + 1, z, "smooth_stone");
}
put(16, top(16, 11) + 2, 11, "lantern", { hanging: "false", waterlogged: "false" });

// Panes join their neighbours along the facade, so a bay of two reads as one window.
const isPane = (x, y, z) => B.get(`${x},${y},${z}`)?.[0] === "glass_pane";
for (const [key, v] of B) {
  if (!v || v[0] !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  v[1] = { north: isPane(x, y, z - 1), south: isPane(x, y, z + 1), east: isPane(x + 1, y, z), west: isPane(x - 1, y, z) };
}

const g = new Voxels([21, 27, 14]);
for (const [key, v] of B) {
  if (!v) continue;
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, v[0], v[1]);
}
const out = g.save(DIR + "way_948317517.nbt");
console.log(`way_948317517: ${out.blocks} blocks, ${out.palette} palette entries`);
