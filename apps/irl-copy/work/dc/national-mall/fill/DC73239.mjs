// 1315 14th St NW: a two-storey red-brick commercial row (c. 1910-1925 DC main-street, calcite trim, dark-wood
// shopfronts on the 14th St face) with a three-tier corner tower at its east end. Lidar roof: 4 at the west wing,
// 7 for the body, 18 for the tower; the tower's shoulder steps down to a 15 terrace (lidar reads 18 there, a setback
// taken for the tiers). Three cells deep: z0 is the street face, z1 the middle (floor slabs, an air gap behind the
// glass), z2 the back wall. The end columns (x0, x16) and any middle cell with an open side are solid, so no air
// touches the sky. Every block sits on the one below it; the check at the end asserts it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC73239.cells.json`, "utf8"));

const X = 17, Z = 3, Y = 30;
const g = new Voxels([X, Y, Z]);

const key = (x, y, z) => `${x},${y},${z}`;
const ground = new Map(), lidar = new Map();
for (const [x, z, gr, roof] of cells) { ground.set(`${x},${z}`, gr); lidar.set(`${x},${z}`, roof); }

// ---- massing: lidar roofs snapped to clean tiers ----
const tierRoof = (x, z) => {
  if (x === 15) return 18;                    // corner tower, lidar 18 across its cells
  if (x === 16) return z === 0 ? 7 : 15;      // tower shoulder: terrace at 15 on the back two cells
  if (x <= 1) return 4;                       // lower west wing (lidar 2-6)
  return 7;                                   // two-storey commercial body (lidar 5-8)
};
const roof = (x, z) => tierRoof(x, z);
const footprint = cells.map(([x, z]) => [x, z]);
const storeyLines = [3, 6, 9, 12, 15];       // storey floors above the ground floor
const WINDOW_X = new Set([2, 3, 6, 7, 10, 11, 14]);   // upper and back windows (x15 is the tower, glazed)
const PIERS_FRONT = new Set([1, 4, 7, 9, 12, 15]);    // dark-wood shopfront piers on the 14th St face
const DOOR_FRONT = 8, DOOR_BACK = 12;

const cellMap = new Map();                  // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => cellMap.set(key(x, y, z), { block, state });
const has = (x, y, z) => cellMap.has(key(x, y, z));

// a middle cell is air only when both x-neighbours are present and tall enough to close its side
const airMiddle = (x, y, z) => {
  if (z !== 1 || x < 1 || x > 15) return false;
  if (roof(x - 1, 1) <= y || roof(x + 1, 1) <= y) return false;
  return true;
};
const floorsOf = (R) => new Set([0, R - 1, ...storeyLines.filter((f) => f < R - 1)]);

// ---- massing and articulation, column by column ----
for (const [x, z] of footprint) {
  const R = roof(x, z), gr = ground.get(`${x},${z}`) ?? 0;
  const floors = floorsOf(R);
  for (let y = gr; y < R; y++) {
    if (z === 1) {
      if (floors.has(y)) put(x, y, z, "smooth_stone");        // floor slabs and the deck
      else if (airMiddle(x, y, z)) continue;                  // air gap behind the glass
      else put(x, y, z, "bricks");                            // closed side or party wall
      continue;
    }
    // street (z0) and back (z2) faces
    if (y === 0) { put(x, y, z, "smooth_stone"); continue; }                // base course
    if (y === R - 1) { put(x, y, z, "calcite"); continue; }                 // coping / cornice
    if (storeyLines.includes(y) && y < R - 1) { put(x, y, z, "calcite"); continue; }   // string course
    if (z === 0 && y <= 2) {                                                // shopfront, ground floor
      if (x >= 1 && x <= 15 && x === DOOR_FRONT) { put(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (x >= 1 && x <= 15 && PIERS_FRONT.has(x)) { put(x, y, z, "dark_oak_planks"); continue; }
      if (x >= 1 && x <= 15) { put(x, y, z, "glass_pane"); continue; }
      put(x, y, z, "bricks"); continue;
    }
    if (z === 2 && y <= 2) {                                                // rear, ground floor
      if (x === DOOR_BACK) { put(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "right", open: "false", powered: "false" }); continue; }
      if (WINDOW_X.has(x)) { put(x, y, z, "glass_pane"); continue; }
      put(x, y, z, "bricks"); continue;
    }
    // upper storeys: windows in the storey's middle rows (f+1, f+2), brick elsewhere
    const f = [...storeyLines].reverse().find((s) => s < y);
    const inWindow = f !== undefined && (y === f + 1 || y === f + 2) && (WINDOW_X.has(x) || x === 15);
    put(x, y, z, inWindow && y <= R - 2 ? "glass_pane" : "bricks");
  }
}

// the entrance awning over the street door (sits on the fascia row at y3)
for (const x of [7, 8, 9]) put(x, 3, 0, "dark_oak_planks");

// ---- warm light: lanterns in the shop, glowstone behind the upper windows, the tower's lightning rod ----
for (const x of [2, 6, 10, 14]) if (airMiddle(x, 1, 1)) put(x, 1, 1, "lantern", { hanging: "false", waterlogged: "false" });
for (const [x, y] of [[3, 4], [7, 4], [14, 4]]) if (airMiddle(x, y, 1)) put(x, y, 1, "glowstone");

// ---- roof equipment, standing on the decks ----
put(7, 7, 1, "iron_block"); put(12, 7, 1, "iron_block");
put(16, 15, 1, "iron_block");
put(15, 18, 1, "lightning_rod");

// ---- glass panes connect to their neighbours along the face ----
for (const [k, c] of cellMap) {
  if (c.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const side = (dx) => has(x + dx, y, z);
  c.state = { east: String(side(1)), west: String(side(-1)), north: "false", south: "false", waterlogged: "false" };
}

// ---- integrity: nothing floats, every upper block has something below it ----
let floating = 0;
for (const [k, c] of cellMap) {
  const [x, y, z] = k.split(",").map(Number);
  if (y === 0) continue;
  if (c.block === "dark_oak_door" && c.state.half === "upper") continue;   // sits on the lower half
  // a floor slab spans the air gap, carried by the street and back walls at its level
  const spans = c.block === "smooth_stone" && z === 1 && has(x, y, 0) && has(x, y, 2);
  if (!has(x, y - 1, z) && !spans) { floating++; console.error("floating", k, c.block); }
}
if (floating) throw new Error(`${floating} blocks float`);

for (const [k, c] of cellMap) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, c.block, c.state);
}
const out = `${DIR}/DC73239.nbt`;
const info = g.save(out);
console.log(`saved ${out}: ${info.blocks} blocks, ${info.palette} palette entries`);
