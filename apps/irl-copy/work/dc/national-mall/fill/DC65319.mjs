// 1625 14th St NW: a vacant early-1900s brick commercial block. Three flat tiers (6, 8, 10 blocks) from the lidar roof
// heights; storeys are 3 blocks (floor slabs at y 3 and 6), a sandstone band at each floor line and a cornice on top.
// The street front is the south face (z 7): a shopfront with one boarded bay, a central door and lit upper windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC65319.cells.json`, "utf8"));
const OUT = `${DIR}/DC65319.nbt`;

const key = (x, z) => `${x},${z}`;
const inside = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => inside.has(key(x, z));
// lidar roof height -> one of three flat tiers
const tier = (roof) => (roof >= 9 ? 10 : roof >= 7 ? 8 : 6);
// outward directions: s is z+1 (the street front), e is x+1
const OUT_DIRS = { s: [0, 1], e: [1, 0], n: [0, -1], w: [-1, 0] };
const FLOOR_LINES = [3, 6];
const SOLID = new Set(["bricks", "smooth_sandstone", "stone_bricks", "stone", "smooth_stone", "oak_planks", "iron_block"]);

const plan = new Map();
const k3 = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => {
  if (plan.has(k3(x, y, z))) throw new Error(`double placement at ${x},${y},${z}`);
  plan.set(k3(x, y, z), { block, state });
};

const top = new Map(cells.map(([x, z, , roof]) => [key(x, z), tier(roof)]));
for (const [x, z, ground, roof] of cells) {
  const H = tier(roof);
  // foundation below the lidar ground (zero here: the footprint is level)
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  for (let y = ground; y < H; y++) {
    // a cell is wall where its side is open at this height: outside the footprint, or beside a shorter tier
    const exits = Object.keys(OUT_DIRS).filter((d) => {
      const nx = x + OUT_DIRS[d][0], nz = z + OUT_DIRS[d][1];
      return !has(nx, nz) || top.get(key(nx, nz)) <= y;
    });
    const wall = exits.length > 0;
    const corner = exits.length > 1 && exits.some((d) => !has(x + OUT_DIRS[d][0], z + OUT_DIRS[d][1]));
    // the face a wall cell belongs to: street front first, then east, north, west
    const face = ["s", "e", "n", "w"].find((d) => exits.includes(d));
    const u = face === "s" || face === "n" ? x : z;   // position along the face

    if (y === H - 1) {
      put(x, y, z, wall ? "smooth_sandstone" : "stone");            // cornice on the wall, roof deck inside
      continue;
    }
    if (!wall) {
      if (y === 0 || FLOOR_LINES.includes(y)) put(x, y, z, "smooth_stone");   // base and floor slabs; the rest is air
      continue;
    }
    if (y === 0) { put(x, y, z, "stone_bricks"); continue; }                 // plinth
    if (corner) { put(x, y, z, "smooth_sandstone"); continue; }             // quoined corners
    if (FLOOR_LINES.includes(y)) { put(x, y, z, "smooth_sandstone"); continue; }   // storey lines
    // window rows 1-2, 4-5, 7-8
    if (face === "s" && y < 3 && u === 5) continue;                          // the door, placed below
    const bay = face === "s" || face === "n" ? [2, 3, 5, 6, 8, 9].includes(u) : [1, 2, 4, 5].includes(u);
    if (face === "s" && y < 3 && (u === 8 || u === 9)) { put(x, y, z, "oak_planks"); continue; }   // boarded shop bay
    put(x, y, z, bay ? "glass_pane" : "bricks");
  }
}

// entrance: a dark oak door on the street front, bay 5
put(5, 1, 7, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(5, 2, 7, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });

// warm lights in the air behind some glass (floor slabs below them)
const lights = [
  [3, 4, 6, "glowstone"],
  [9, 7, 6, "shroomlight"],
  [6, 1, 6, "lantern", { hanging: "false" }],
  [2, 4, 1, "glowstone"],
];
for (const [x, y, z, b, s] of lights) put(x, y, z, b, s);

// roof plant on the main tier, and a brick flue
for (const [x, z] of [[7, 2], [8, 2], [7, 3], [8, 3]]) put(x, 10, z, "iron_block");
put(10, 10, 5, "bricks"); put(10, 11, 5, "bricks");

// glass panes connect to what they touch along x or z, as a pane run does
const PANE_SIDES = { east: [1, 0], west: [-1, 0], north: [0, -1], south: [0, 1] };
for (const [id, { block }] of plan) {
  if (block !== "glass_pane") continue;
  const [x, y, z] = id.split(",").map(Number);
  const state = {};
  for (const [side, [dx, dz]] of Object.entries(PANE_SIDES)) {
    const n = plan.get(k3(x + dx, y, z + dz));
    state[side] = String(!!n && (n.block === "glass_pane" || SOLID.has(n.block)));
  }
  state.waterlogged = "false";
  plan.get(id).state = state;
}

const g = new Voxels([12, 22, 8]);
for (const [id, { block, state }] of plan) {
  const [x, y, z] = id.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const { blocks, palette } = g.save(OUT);
console.log(`DC65319: ${blocks} blocks, ${palette} palette entries -> ${OUT}`);
