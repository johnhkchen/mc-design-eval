import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A two-tier Edwardian red-brick shop-top block (c.1905-1920, the Mt Eden / Eden Terrace street type): stone plinth,
// shopfront with a timber door, stone sill and lintel courses, sash-style glass in brick piers, and a parapet.
// The lidar roof (cell[3]) is smoothed into two flat tiers: 9 for the main block, 7 for the lower wing.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170818.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170818.nbt";
const X = 9, Y = 22, Z = 10;
const TIER_HI = 9, TIER_LO = 7;

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const OPP = { N: "S", S: "N", W: "E", E: "W" };
const NAME = { N: "north", S: "south", W: "west", E: "east" };
const key = (x, z) => `${x},${z}`;

const fp = new Map();                                    // "x,z" -> { ground, top }
for (const [x, z, ground, roof] of cells) fp.set(key(x, z), { ground, top: roof >= 8 ? TIER_HI : TIER_LO });
const top = (x, z) => fp.get(key(x, z))?.top ?? 0;      // outside the footprint: 0, so every outside face is exposed
// faces of cell (x, z) that stand against air or a lower tier at height y
const exposed = (x, z, y) => Object.keys(DIRS).filter((d) => top(x + DIRS[d][0], z + DIRS[d][1]) <= y);

const plan = new Map();                                  // "x,y,z" -> [block, state]
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, [block, state]);
const at = (x, y, z) => plan.get(`${x},${y},${z}`);

// the entrance: a street-side wall cell with one exposed face, at the southern edge where possible
const door = [...fp.keys()].map((k) => k.split(",").map(Number))
  .filter(([x, z]) => top(x, z) > 2 && exposed(x, z, 1).length === 1)
  .sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
const doorFace = door ? exposed(door[0], door[1], 1)[0] : null;
const isDoor = (x, z) => door && door[0] === x && door[1] === z;

for (const [k, { top: T }] of fp) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < T; y++) {
    const ex = exposed(x, z, y);
    if (!ex.length) {                                    // inside: floors, a roof slab, and air between
      if (y === 0) put(x, y, z, "polished_andesite");
      else if (y === 4) put(x, y, z, "oak_planks");
      else if (y === T - 1) put(x, y, z, "smooth_stone");
      continue;
    }
    const corner = ex.length >= 2;                       // quoins at the corners
    const face = ex[0];
    const idx = face === "N" || face === "S" ? x : z;     // bays alternate along each face
    const bay = !corner && idx % 2 === 1;
    if (y === T - 1) { put(x, y, z, "bricks"); continue; }           // parapet / eave course
    if (y === 0) { put(x, y, z, "stone_bricks"); continue; }         // plinth
    if (y === 3) { put(x, y, z, "smooth_quartz"); continue; }       // shopfront fascia / cream string course
    if (y === 4) { put(x, y, z, "smooth_quartz"); continue; }       // sill course
    if (y <= 2) {                                                    // shopfront
      if (isDoor(x, z)) {
        put(x, y, z, "oak_door", { facing: NAME[OPP[doorFace]], half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      put(x, y, z, bay ? "glass_pane" : "stone_bricks");
      continue;
    }
    if (y === 7) { put(x, y, z, "smooth_quartz"); continue; }       // lintel course under the parapet
    put(x, y, z, bay ? "glass_pane" : corner ? "stone_bricks" : "bricks");   // upper window rows (5, 6)
  }
}

// canopy: a dark timber hood over the door and its two neighbours on the same face (where they are street wall)
if (door && doorFace) {
  const along = doorFace === "N" || doorFace === "S" ? [1, 0] : [0, 1];
  for (const s of [-1, 0, 1]) {
    const x = door[0] + along[0] * s, z = door[1] + along[1] * s;
    if (top(x, z) > 3 && exposed(x, z, 3).length) put(x, 3, z, "dark_oak_planks");
  }
}

// warm light: lanterns standing on the shop floor, glowstone behind some upper windows (air behind the glass)
for (const [k, { top: T }] of fp) {
  const [x, z] = k.split(",").map(Number);
  if (!exposed(x, z, 1).length && (x + z) % 3 === 0 && !at(x, 1, z)) put(x, 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  const ex = exposed(x, z, 5);
  if (ex.length === 1 && T > 5 && (x * 2 + z) % 3 === 0 && at(x, 5, z)?.[0] === "glass_pane") {
    const [dx, dz] = DIRS[OPP[ex[0]]];                   // the room side of the window
    const ix = x + dx, iz = z + dz;
    if (fp.has(key(ix, iz)) && !exposed(ix, iz, 5).length && !at(ix, 5, iz)) put(ix, 5, iz, "glowstone");
  }
}

// roof plant: an air-conditioning unit and one brick flue, both on the main tier's interior roof
const roofCells = [...fp.keys()].map((k) => k.split(",").map(Number))
  .filter(([x, z]) => top(x, z) === TIER_HI && !exposed(x, z, TIER_HI - 1).length);
if (roofCells[0]) put(roofCells[0][0], TIER_HI, roofCells[0][1], "iron_block");
const flue = roofCells[roofCells.length - 1];
if (flue && (!roofCells[0] || flue[0] !== roofCells[0][0] || flue[1] !== roofCells[0][1])) {
  put(flue[0], TIER_HI, flue[1], "bricks");
  put(flue[0], TIER_HI + 1, flue[1], "bricks");
  put(flue[0], TIER_HI + 2, flue[1], "stone_bricks");
}

// glass panes connect to their neighbours in the plan (other panes and solid blocks), as in the game
const NOT_SOLID = new Set(["oak_door", "lantern", "air"]);
const connects = (x, y, z) => { const b = at(x, y, z); return !!b && (b[0] === "glass_pane" || !NOT_SOLID.has(b[0])); };
for (const [k, [b]] of plan) {
  if (b !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  plan.set(k, [b, {
    north: String(connects(x, y, z - 1)), south: String(connects(x, y, z + 1)),
    east: String(connects(x + 1, y, z)), west: String(connects(x - 1, y, z)),
  }]);
}

const g = new Voxels([X, Y, Z]);
for (const [k, [block, state]] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const stats = g.save(OUT);
console.log(`way_912170818: ${stats.blocks} blocks, palette ${stats.palette}, door ${door ? door.join(",") : "none"} facing ${doorFace}`);
