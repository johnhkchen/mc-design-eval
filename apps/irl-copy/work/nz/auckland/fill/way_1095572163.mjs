// Way 1095572163: a two-storey brick shop-and-flat block of the 1910s (Eden Terrace / K Road type) on a flat site.
// Footprint from the cells (x 0..8, z 0..6); ground 0 everywhere; lidar roof 10 (cells with 0 are no-return, read as 10).
// Column: plinth y0, ground storey y1-3 (shopfront), string course y4, upper storey y5-8, cornice y9, parapet y10 (11 blocks).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572163.cells.json", "utf8"));

// roof heights: a 0 is a lidar no-return, not a roof; the flat roof is the median of the rest
const roofs = cells.map(([, , , r]) => r).filter((r) => r > 0).sort((a, b) => a - b);
const H = roofs[Math.floor(roofs.length / 2)];   // 10: parapet top, so the whole block stands 11 blocks

const key = (x, z) => `${x},${z}`;
const inside = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => inside.has(key(x, z));

// which sides of a footprint cell face the street (outside the footprint)
const faces = (x, z) => ({ N: !has(x, z - 1), S: !has(x, z + 1), W: !has(x - 1, z), E: !has(x + 1, z) });
const isWall = (x, z) => { const f = faces(x, z); return f.N || f.S || f.W || f.E; };
// a quoin only where the wall turns a convex corner (the diagonal outside too); the stepped outline's jogs stay brick
const isCorner = (x, z) => {
  const f = faces(x, z);
  if (!((f.N !== f.S) && (f.W !== f.E))) return false;   // one street side each way, not a cap or a run
  const dx = f.E ? 1 : -1, dz = f.S ? 1 : -1;
  return !has(x + dx, z + dz);
};
// along a wall: window on odd cells, brick pier on even, so the grid lines up on every face
const along = (x, z) => { const f = faces(x, z); return f.N || f.S ? x : z; };
const isWindow = (x, z) => along(x, z) % 2 === 1;
// the main entrance is on the south face, centre of its three cells
const isDoor = (x, z) => x === 5 && z === 6;
// the cell just inside the wall, for lights behind the glass
const inward = (x, z) => {
  const f = faces(x, z);
  if (f.N) return [x, z + 1];
  if (f.S) return [x, z - 1];
  if (f.W) return [x + 1, z];
  return [x - 1, z];
};

const g = new Voxels([9, 23, 7]);
const DOOR = { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UP = { ...DOOR, half: "upper" };

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const wall = isWall(x, z), corner = isCorner(x, z), win = isWindow(x, z);
  // floors: the ground slab, the first-floor slab and the roof deck, all solid across the footprint
  g.set(x, 0, z, wall ? "stone_bricks" : "smooth_stone");
  g.set(x, 4, z, wall ? "white_terracotta" : "smooth_stone");
  g.set(x, H - 1, z, wall ? "stone_bricks" : "smooth_stone");
  if (!wall) continue;
  // ground storey: shopfront glass in the windows, brick piers, dark timber bulkhead, entrance on the south face
  for (let y = 1; y <= 3; y++) {
    if (corner) g.set(x, y, z, "bricks");
    else if (isDoor(x, z) && y === 1) g.set(x, y, z, "dark_oak_door", DOOR);
    else if (isDoor(x, z) && y === 2) g.set(x, y, z, "dark_oak_door", DOOR_UP);
    else if (isDoor(x, z) && y === 3) g.set(x, y, z, "dark_oak_planks");
    else if (!win) g.set(x, y, z, "bricks");
    else if (y === 1) g.set(x, y, z, "dark_oak_planks");
    else g.set(x, y, z, "glass_pane");
  }
  // upper storey: sill, two rows of glass, lintel; piers in brick between
  for (let y = 5; y <= 8; y++) {
    if (corner) g.set(x, y, z, "bricks");
    else if (!win) g.set(x, y, z, "bricks");
    else if (y === 5) g.set(x, y, z, "stone_bricks");
    else if (y === 8) g.set(x, y, z, "white_terracotta");
    else g.set(x, y, z, "glass_pane");
  }
  g.set(x, H - 1, z, "stone_bricks");                          // cornice
  g.set(x, H, z, "stone_brick_wall");                          // parapet
}

// roof plant: a 2x2 stair-and-lift overrun and an HVAC unit, both on the roof deck inside the parapet
for (const [x, z] of [[3, 3], [4, 3], [3, 4], [4, 4]]) g.set(x, H, z, "stone_bricks");
g.set(6, H, 3, "iron_block");

// warm light: lanterns hang from the ceilings and glowstone sits on the upper floor, behind some windows
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (!isWall(x, z) || isCorner(x, z) || !isWindow(x, z) || isDoor(x, z)) continue;
  const [ix, iz] = inward(x, z);
  if (isWall(ix, iz) || !has(ix, iz)) continue;
  const n = along(x, z);
  if (n % 4 === 1) {
    g.set(ix, 3, iz, "lantern", { hanging: "true" });          // ground storey, hanging from the first-floor slab
    g.set(ix, 8, iz, "lantern", { hanging: "true" });         // upper storey, hanging from the roof deck
  } else if (n % 4 === 3) {
    g.set(ix, 5, iz, "glowstone");                            // upper storey, on the first-floor slab
  }
}

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572163.nbt");
console.log(JSON.stringify(info));
