import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A two-storey Edwardian brick commercial block on the Mt Eden ridge: red brick walls, stone quoins and
// string courses, sash windows with cream lintels, a dark shopfront with a door on the street face, a
// cornice and parapet, and a brick chimney. Each cell is one block column: the perimeter is the shell, the
// rest is air behind it, with a floor slab per storey.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095570522.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell

const top = Math.max(...cells.map(([, , , r]) => r));           // roof at y = top (10 on this lot)
const g = new Voxels([8, Math.max(23, top + 3), 7]);

const key = (x, z) => `${x},${z}`;
const inside = new Set(cells.map(([x, z]) => key(x, z)));
const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const exposed = (x, z) => Object.entries(DIRS).filter(([, [dx, dz]]) => !inside.has(key(x + dx, z + dz))).map(([d]) => d);
const isEdge = (x, z) => exposed(x, z).length > 0;

const GLASS = (wallAxisX) => ({ north: wallAxisX ? "false" : "true", south: wallAxisX ? "false" : "true", east: wallAxisX ? "true" : "false", west: wallAxisX ? "true" : "false", waterlogged: "false" });
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };

// The windows on each exposed face: a bay every second block along the wall; piers between; corners are quoins.
// a convex corner: exposed on both axes and the diagonal outward cell is outside too (concave notches are not quoins)
const isCorner = (x, z, ex) => {
  const ns = ex.find((d) => d === "n" || d === "s"), we = ex.find((d) => d === "w" || d === "e");
  if (!ns || !we) return false;
  const dx = DIRS[we][0], dz = DIRS[ns][1];
  return !inside.has(key(x + dx, z + dz));
};
const isWindowBay = (x, z, ex) => {
  const dirs = ex;
  if (dirs.length === 0) return false;
  const along = dirs[0] === "n" || dirs[0] === "s" ? x : z;
  return along % 2 === 1;
};

const SHOP_DOOR = [1, 0], SHOP_GLASS = [2, 0];   // the street face (north, z = 0)
const glowBehind = [];                            // interior [x, y, z] cells that get a warm light behind a window

for (const [x, z] of cells) {
  if (!isEdge(x, z)) continue;
  const ex = exposed(x, z);
  const corner = isCorner(x, z, ex);
  const wallX = ex.some((d) => d === "n" || d === "s");     // a face on the north/south: the wall runs along x
  const window = isWindowBay(x, z, ex);
  const isDoor = x === SHOP_DOOR[0] && z === SHOP_DOOR[1];
  const isShop = x === SHOP_GLASS[0] && z === SHOP_GLASS[1];
  const h = cells.find(([cx, cz]) => cx === x && cz === z)[3];
  // quoins: stone on alternate courses at a convex corner, brick between; otherwise brick
  const wallAt = (y) => (corner && y % 2 === 1 ? "stone_bricks" : "bricks");

  // base course
  g.set(x, 0, z, "stone_bricks");
  // ground storey: y 1..3
  if (isDoor) {
    g.set(x, 1, z, "dark_oak_door", { ...DOOR, half: "lower" });
    g.set(x, 2, z, "dark_oak_door", { ...DOOR, half: "upper" });
    g.set(x, 3, z, "dark_oak_planks");
  } else if (isShop) {
    g.set(x, 1, z, "glass"); g.set(x, 2, z, "glass");
    g.set(x, 3, z, "dark_oak_planks");
  } else if (window && !corner) {
    g.set(x, 1, z, "glass_pane", GLASS(wallX)); g.set(x, 2, z, "glass_pane", GLASS(wallX));
    g.set(x, 3, z, "smooth_quartz");
  } else {
    g.set(x, 1, z, wallAt(1)); g.set(x, 2, z, wallAt(2)); g.set(x, 3, z, wallAt(3));
  }
  // string course at y 4
  g.set(x, 4, z, "smooth_stone");
  // upper storey: y 5..7
  if (window && !corner && !isDoor && !isShop) {
    g.set(x, 5, z, "glass_pane", GLASS(wallX)); g.set(x, 6, z, "glass_pane", GLASS(wallX));
    g.set(x, 7, z, "smooth_quartz");
    if ((x + z) % 3 === 0) for (const d of ex) { const [dx, dz] = DIRS[d]; const ix = x - dx, iz = z - dz; if (inside.has(key(ix, iz))) glowBehind.push([ix, 6, iz]); }
  } else {
    g.set(x, 5, z, wallAt(5)); g.set(x, 6, z, wallAt(6)); g.set(x, 7, z, wallAt(7));
  }
  // cornice course at y 8, parapet to the roof
  g.set(x, 8, z, "stone_bricks");
  for (let y = 9; y < h; y++) g.set(x, y, z, "bricks");
}

// interior: floor slabs at 0, 4, 8 and the roof deck; air between
for (const [x, z] of cells) {
  if (isEdge(x, z)) continue;
  g.set(x, 0, z, "smooth_stone");
  g.set(x, 4, z, "smooth_stone");
  g.set(x, 8, z, "smooth_stone");
  for (let y = 9; y < top; y++) g.set(x, y, z, "smooth_stone");
}

// the shopfront's interior lights, behind the street glass
g.set(2, 1, 1, "glowstone"); g.set(2, 2, 1, "glowstone");
// a few warm windows on the upper floor
for (const [x, y, z] of glowBehind) g.set(x, y, z, "glowstone");

// roof: a brick chimney stack and a rooftop unit, standing on the deck
g.set(3, 10, 3, "bricks"); g.set(3, 11, 3, "bricks"); g.set(3, 12, 3, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
g.set(5, 10, 2, "iron_block");

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095570522.nbt");
console.log("way_1095570522:", g.count(), "blocks");
