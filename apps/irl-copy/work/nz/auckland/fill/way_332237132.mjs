// A two-storey 1930s Mt Eden shop-top block: stone plinth, cream rendered plaster above a dark-timber shopfront on the
// downhill (south and east) faces, stone piers, a stone cornice and a flat roof with plant and a brick flue.
// Hollow: exterior shell, a floor slab per storey, air behind the glass, warm lanterns in some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_332237132.cells.json`, "utf8"));

// Massing from the lidar: the roof is flat at 7 over most of the footprint. A roof less than 3 blocks above its ground
// is lidar noise (the (5,11) cell at 1), so it takes the main roof; the single (9,12) cell at 4 is a real lower wing.
const MAIN_ROOF = 7, FLOOR2 = 4, FASCIA = 3, DOOR = [7, 11];
const plan = new Map();
for (const [x, z, g, r] of cells) plan.set(`${x},${z}`, { g, roof: r < g + 3 ? MAIN_ROOF : r });
const at = (x, z) => plan.get(`${x},${z}`);
const open = (x, z) => ({ N: !at(x, z - 1), S: !at(x, z + 1), W: !at(x - 1, z), E: !at(x + 1, z) });

// What fills cell (x, z) at height y: null (air) or a block. Panes carry their wall direction; their connections come later.
function spec(x, z, y) {
  const c = at(x, z); if (!c) return null;
  const { g, roof } = c, e = open(x, z);
  const ring = e.N || e.S || e.W || e.E;
  if (y < g) return { name: "stone_bricks" };                                  // foundation under the lower ground
  if (y === roof) return { name: ring ? "stone_bricks" : "smooth_stone" };      // cornice ring, flat roof deck
  if (!ring) return y === g || (y === FLOOR2 && roof > FLOOR2) ? { name: "smooth_stone" } : null;   // floor slabs, air between
  if (y > roof) return null;
  if (y === g) return { name: "stone_bricks" };                               // plinth course
  // The footprint steps like a stair, so most cells are corners of a sort: a corner takes its shop face (south, then east) if it has one.
  const dir = e.S ? "S" : e.E ? "E" : e.N ? "N" : "W";
  const u = dir === "N" || dir === "S" ? x : z;                                 // position along the face
  const shop = g === 0 && (dir === "S" || dir === "E");
  if (y < FASCIA) {
    if (!shop) return { name: "smooth_quartz" };
    if (x === DOOR[0] && z === DOOR[1] && dir === "S") return { name: "dark_oak_door", half: y === 1 ? "lower" : "upper", facing: "south" };
    return u % 3 === 0 ? { name: "dark_oak_planks" } : { name: "glass_pane", dir };
  }
  if (y === FASCIA) return { name: shop ? "dark_oak_planks" : "smooth_quartz" };
  if (y === FLOOR2) return { name: "smooth_stone" };                            // sill course
  const m = u % 3;                                                              // upper storey: pier, window, plaster
  if (m === 0) return { name: "stone_bricks" };
  if (m === 1) return { name: "glass_pane", dir };
  return { name: "smooth_quartz" };
}

// A pane joins the wall it sits in: along the face, to glass or to any solid block beside it.
function paneState(x, z, y, dir) {
  const join = (nx, nz) => (spec(nx, nz, y) ? "true" : "false");
  if (dir === "N" || dir === "S") return { north: "false", south: "false", east: join(x + 1, z), west: join(x - 1, z), waterlogged: "false" };
  return { east: "false", west: "false", north: join(x, z - 1), south: join(x, z + 1), waterlogged: "false" };
}

const v = new Voxels([13, 20, 13]);
const put = (x, y, z, b, state) => v.set(x, y, z, b, state);
const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

for (const key of plan.keys()) {
  const [x, z] = key.split(",").map(Number), { roof } = at(x, z);
  for (let y = 0; y <= roof; y++) {
    const s = spec(x, z, y); if (!s) continue;
    if (s.name === "glass_pane") put(x, y, z, "glass_pane", paneState(x, z, y, s.dir));
    else if (s.name === "dark_oak_door") put(x, y, z, "dark_oak_door", doorState(s.half));
    else put(x, y, z, s.name);
  }
}

// Warm light behind some windows: a lantern standing on the floor slab in the air cell behind the glass.
const behind = (x, z, dir) => ({ N: [x, z + 1], S: [x, z - 1], W: [x + 1, z], E: [x - 1, z] })[dir];
for (const key of plan.keys()) {
  const [x, z] = key.split(",").map(Number), { g, roof } = at(x, z);
  for (const y of [1, 2, 5, 6]) {
    if (y > roof) continue;
    const s = spec(x, z, y); if (!s || s.name !== "glass_pane") continue;
    const lit = y >= FLOOR2 ? (x * 5 + z * 3) % 4 === 0 && y === 5 : (x + z) % 3 === 0 && y === 1;
    if (!lit) continue;
    const [ix, iz] = behind(x, z, s.dir), ly = y >= FLOOR2 ? 5 : g + 1;
    if (!at(ix, iz) || spec(ix, iz, ly)) continue;                                // only into an empty interior cell
    put(ix, ly, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Roof plant: two 2x2 units and a brick flue, all standing on the roof deck.
for (const [x0, z0] of [[5, 4], [2, 8]]) for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) put(x0 + dx, 8, z0 + dz, "light_gray_concrete");
for (let y = 8; y <= 10; y++) put(9, y, 3, "bricks");

const stats = v.save(`${DIR}/way_332237132.nbt`);
console.log(JSON.stringify(stats));
