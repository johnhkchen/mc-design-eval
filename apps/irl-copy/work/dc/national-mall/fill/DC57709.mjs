// DC57709: Public Service, 45 E St NW, Washington DC 20001, as a 1.21.1 module.
// An early-20th-century federal office block in pale limestone: a plinth course, a two-storey body (6 blocks, the
// lidar's 5-6 cells), a lower SE wing (4), and a tower of 18 on the north edge, set back to 12 around its core.
// Every column is solid from y 0 up to its tier, so nothing floats. Storeys are 3 blocks: a string course, then
// two rows of glass in the bays (piers stay solid); the top row is a cornice. Interiors are air with floor slabs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC57709.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC57709.nbt";

const W = 18, D = 22, H_MAX = 21;
const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

// Tiers from the lidar roof. The 18-block cells are a thin diagonal strip (7 cells, lidar noise on a tower's edge),
// so they are grown into one clean tower: the core is every footprint cell within 1 of them (18 blocks), a setback
// ring within 2 steps down to 12, and the rest is the podium (6) or the SE wing (4).
const T18 = [...F.values()].filter((c) => c.r >= 14);
const near = (c, d) => T18.some((t) => Math.max(Math.abs(t.x - c.x), Math.abs(t.z - c.z)) <= d);
const tier = (c) => {
  if (near(c, 1)) return 18;
  if (near(c, 2)) return 12;
  return c.r >= 5 ? 6 : 4;
};
const H = new Map([...F.values()].map((c) => [key(c.x, c.z), tier(c)]));
const h = (x, z) => H.get(key(x, z)) ?? 0;

// Exposed faces: the directions whose outside neighbour is not in the footprint.
const exposed = (x, z) => Object.entries(DIRS).filter(([, [dx, dz]]) => !inF(x + dx, z + dz)).map(([n]) => n);
const isShell = (x, z) => exposed(x, z).length > 0;

// Palette: limestone walls, a darker granite-grey plinth and string courses, glass in iron-free bays.
const WALL = "quartz_block";
const STONE = "stone_bricks";
const CORNICE = "stone_brick_slab";
const GLASS = "glass_pane";
const FLOOR = "smooth_stone";
const LIGHT = "glowstone";
const DOOR = "dark_oak_door";
const LANTERN = "lantern";
const PLANT = "iron_block";

const FLOORS = [0, 3, 6, 9, 12, 15];   // interior floor slabs: one per storey
const out = new Map();                  // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => out.set(`${x},${y},${z}`, { block, state });
const get = (x, y, z) => out.get(`${x},${y},${z}`);

for (const c of F.values()) {
  const { x, z } = c, top = H.get(key(x, z));
  const ex = exposed(x, z);
  const corner = ex.length >= 2;
  const along = ex.some((n) => n === "north" || n === "south") ? x : z;  // index along the face the cell shows
  for (let y = 0; y < top; y++) {
    if (!isShell(x, z)) {                                       // interior: floor slabs and the roof deck only
      if (FLOORS.includes(y) || y === top - 1) put(x, y, z, FLOOR);
      continue;
    }
    if (y === 0) { put(x, y, z, STONE); continue; }             // plinth
    if (y === top - 1) { put(x, y, z, CORNICE, { type: "top" }); continue; }
    if (y % 3 === 0) { put(x, y, z, STONE); continue; }         // string course at each storey line
    if (corner || ex.length === 0 || along % 2 === 0) { put(x, y, z, WALL); continue; }  // piers and corners
    put(x, y, z, GLASS);                                        // bay: glass, connections set below
    // Warm light in some bays: glowstone in the interior cell behind the pane (if the building has one there).
    const [dx, dz] = DIRS[ex[0]];
    const back = [x - dx, z - dz];
    if (!isShell(...back) && inF(...back) && (x + z + y) % 4 === 0 && (y === 1 || y === 4)) {
      put(back[0], y, back[1], LIGHT);
    }
  }
  // Parapet on the low roofs (podium and wing): a wall course on the cornice, around the roof edge.
  if (top <= 6 && isShell(x, z)) put(x, top, z, "stone_brick_wall");
  // Roof equipment on the body's roof deck: a few plant boxes, standing on the deck.
  if (top === 6 && !isShell(x, z) && (x + 2 * z) % 9 === 0) put(x, 6, z, PLANT);
}

// Entrance: the south-facing body cell nearest x = 6, a two-high door on the plinth, lanterns either side on the plinth course.
const southBody = [...F.values()].filter((c) => !inF(c.x, c.z + 1) && h(c.x, c.z) === 6 && isShell(c.x, c.z));
const door = southBody.sort((a, b) => Math.abs(a.x - 6) - Math.abs(b.x - 6))[0];
if (door) {
  const { x, z } = door;
  put(x, 1, z, DOOR, { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, 2, z, DOOR, { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 1]) {
    if (inF(x + dx, z)) put(x + dx, 1, z, LANTERN, { hanging: "false", waterlogged: "false" });
  }
}

// Glass panes take their connections from the neighbours along the face (not out of it, not up or down).
const save = new Voxels([W, H_MAX, D]);
for (const [k, v] of out) {
  const [x, y, z] = k.split(",").map(Number);
  let state = v.state;
  if (v.block === GLASS) {
    const ex = exposed(x, z);
    const tangent = ex.some((n) => n === "north" || n === "south") ? ["west", "east"] : ["north", "south"];
    state = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
    for (const d of tangent) {
      const [dx, dz] = DIRS[d];
      if (get(x + dx, y, z + dz)) state[d] = "true";
    }
  }
  save.set(x, y, z, v.block, state);
}

// Tower crown: a lightning rod on the tower's central cell (8,1).
const crown = h(8, 1) === 18 ? [8, 18, 1] : null;
if (crown) save.set(...crown, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

const info = save.save(OUT);
console.log(JSON.stringify({ out: OUT, ...info, cells: F.size, door: door ? [door.x, door.z] : null }));
