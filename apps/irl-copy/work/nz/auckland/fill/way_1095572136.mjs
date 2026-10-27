// Way 1095572136, Mt Eden / Eden Terrace: a three-storey 1920s brick shop-and-flats block with a cream
// plaster cornice, a two-storey wing and a one-storey lean-to on its west edge, a shopfront and street door
// on the south face. The lidar roof heights are quantised to the storey tiers (4 / 8 / 12), so every
// floor, band and roof stands on the solid course beneath it; the air gap sits only behind the window rows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572136.cells.json", "utf8"));

// lidar roof height -> storey tier (4 blocks a storey): 1, 2 or 3 storeys
const tier = (h) => (h <= 5 ? 4 : h <= 9 ? 8 : 12);
const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(`${x},${z}`, { ground, roof: tier(roof) });
const at = (x, z) => cell.get(`${x},${z}`);

const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };

// the faces of a cell at height y that look onto air: outside the footprint, or onto a lower tier
const exposed = (x, z, y) => Object.keys(DIRS).filter((d) => {
  const n = at(x + DIRS[d][0], z + DIRS[d][1]);
  return !n || n.roof <= y;
});

const g = new Voxels([13, 25, 10]);
const glass = [];
const shop = new Set(["9,9", "10,9"]);
const door = "10,9";

// the window rows of an exposed cell: piers at the corners and every third bay, glass between
const pier = (x, z, ex) => ex.length >= 2 || (ex[0] === "N" || ex[0] === "S" ? x : z) % 3 === 0;

for (const [x, z] of cells) {
  const c = at(x, z);
  for (let y = 0; y < c.roof; y++) {
    const ex = exposed(x, z, y), outer = ex.length > 0, top = y === c.roof - 1, m = y % 4;
    if (y < c.ground) { g.set(x, y, z, "stone_bricks"); continue; }
    let block = null, state;
    if (top) block = outer ? "smooth_quartz" : "smooth_stone";              // cornice cap / roof deck
    else if (m === 0) block = y === 0 ? (outer ? "stone_bricks" : "smooth_stone") : (outer ? "bricks" : "smooth_stone"); // plinth, then brick floor edge under the cream string course
    else if (m === 3) block = outer ? "smooth_quartz" : "smooth_stone";     // cream string course over each storey
    else if (outer) {                                                         // window rows
      if (pier(x, z, ex)) block = "bricks";                                  // brick piers between the bays
      else { block = "glass_pane"; glass.push([x, y, z]); }
    }
    if (block) g.set(x, y, z, block, state);
  }
}

// the shopfront glass, and the street door in the south face
for (const k of shop) {
  const [x, z] = k.split(",").map(Number);
  if (k === door) continue;
  for (const y of [1, 2]) { g.set(x, y, z, "glass_pane"); glass.push([x, y, z]); }
}
const [dx, dz] = door.split(",").map(Number);
g.set(dx, 1, dz, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(dx, 2, dz, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });

// warm light: glowstone in the air gap just behind some panes, and the shop interior lit
for (const [x, y, z] of glass) {
  const ex = exposed(x, z, y);
  if (ex.length !== 1) continue;
  const [ix, iz] = [x - DIRS[ex[0]][0], z - DIRS[ex[0]][1]];
  const inner = at(ix, iz);
  if (!inner || exposed(ix, iz, y).length || inner.roof <= y) continue;
  if (shop.has(`${x},${z}`) || (x * 3 + z * 5 + y) % 5 === 0) g.set(ix, y, iz, "glowstone");
}

// glass panes join their neighbours on the same wall (the door cells are not glass)
for (const [x, y, z] of glass.filter(([x, , z]) => `${x},${z}` !== door)) {
  const state = {};
  for (const [d, [ox, oz]] of Object.entries(DIRS)) {
    const n = g.get(x + ox, y, z + oz);
    state[{ N: "north", S: "south", E: "east", W: "west" }[d]] = n ? "true" : "false";
  }
  g.set(x, y, z, "glass_pane", state);
}

// two plant units on the roof of the tower
g.set(5, 12, 4, "iron_block");
g.set(6, 12, 4, "iron_block");

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572136.nbt");
