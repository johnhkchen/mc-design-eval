// 26 West 54th Street, a 2003 public and institutional building in Midtown: a 70-block (about 78 m) glass curtain-wall tower
// with a 73-block mechanical penthouse, standing on a 31-block limestone mid wing and a 23-block limestone low wing with the
// street entrance (footprint 77 x 55; x across the frontage, low z = north = the 54th Street face). Lidar tiers, not cell by
// cell: 0-1 is open court or plaza, 17-25 the low wing, 26-34 the mid wing, 63-70 the tower, stepping down to 64 at its outer
// edge. Every storey is 3 blocks, with rows set by absolute y so neighbouring cells align on ground 0 or 1. A row at y%3 == 0
// is a floor-slab spandrel; the rows between are windows, with glass sitting on the face and an air pocket behind it (no
// interiors). Mullions every third column, a plinth at y 0, a calcite or quartz cap, a lobby with a granite portal on the street
// face, and glowstone in some pockets behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1087646.cells.json`, "utf8"));
const X = 77, Y = 76, Z = 55;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const groundAt = (x, z) => cell.get(`${x},${z}`).ground;

// Clean tiers (block heights above y 0). The penthouse sits on the tower core.
const PENT = (x, z) => x >= 13 && x <= 22 && z >= 24 && z <= 32;
const CORE = (x, z) => x >= 6 && x <= 30 && z >= 20 && z <= 36;
const roofAt = (x, z) => {
  if (!inFoot(x, z)) return 0;
  const r = cell.get(`${x},${z}`).roof;
  if (r <= 1) return 0;                                       // open court or plaza: no roof
  if (r >= 63) return PENT(x, z) ? 73 : CORE(x, z) ? 70 : 64;  // tower, setback to 64 at its outer edge
  return r < 26 ? 23 : 31;                                    // low wing, mid wing
};

const TOWER = { spandrel: "light_gray_concrete", mullion: "light_gray_concrete", corner: "light_gray_concrete", glass: "light_blue_stained_glass_pane", cap: "smooth_quartz", core: "light_gray_concrete" };
const STONE = { spandrel: "calcite", mullion: "calcite", corner: "calcite", glass: "light_blue_stained_glass_pane", cap: "calcite", core: "smooth_stone" };
const kindOf = (T) => (T >= 64 ? TOWER : STONE);

const DIRS = [[0, -1, "N"], [0, 1, "S"], [-1, 0, "W"], [1, 0, "E"]];
const open = (x, y, z) => roofAt(x, z) <= y;                  // outside the footprint roofAt is 0, so open
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => open(x + dx, y, z + dz)).map(([, , d]) => d);
const facadeNear = (x, y, z) => DIRS.some(([dx, dz]) => {
  const nx = x + dx, nz = z + dz;
  return roofAt(nx, nz) > y && exposed(nx, y, nz).length > 0;
});
const pane = (d) => (d === "N" || d === "S"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const lit = (x, y, z) => (x * 5 + y * 7 + z * 3) % 13 === 0;  // sparse, deterministic warm panes

const cols = [...cell.keys()].map((k) => k.split(",").map(Number));
const g = new Voxels([X, Y, Z]);

// 1. Foundations and open ground. Solid from y 0 up to each cell's ground; open court and plaza cells get paving on top.
for (const [x, z] of cols) {
  const G = groundAt(x, z), T = roofAt(x, z);
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");
  if (!T) g.set(x, G, z, "smooth_stone");
}

// 2. The building: a facade layer, a window pocket behind it, and a solid core. Caps close every tier.
const facade = (x, y, z, ex, K) => {
  if (y === 0) return g.set(x, y, z, "polished_granite");       // plinth
  if (ex.length > 1) return g.set(x, y, z, K.corner);             // corner columns stay solid
  if (y % 3 === 0) return g.set(x, y, z, K.spandrel);             // floor-slab row
  const along = ex[0] === "N" || ex[0] === "S" ? x : z;
  if (along % 3 === 0) return g.set(x, y, z, K.mullion);          // mullion every third column
  return g.set(x, y, z, K.glass, pane(ex[0]));
};
for (const [x, z] of cols) {
  const G = groundAt(x, z), T = roofAt(x, z);
  if (!T) continue;
  const K = kindOf(T);
  for (let y = G; y < T; y++) {
    if (y === T - 1) { g.set(x, y, z, K.cap); continue; }
    const ex = exposed(x, y, z);
    if (ex.length) { facade(x, y, z, ex, K); continue; }
    if (y % 3 !== 0 && facadeNear(x, y, z)) {                      // the air pocket behind a window
      if (lit(x, y, z)) g.set(x, y, z, "glowstone");
      continue;
    }
    g.set(x, y, z, K.core);
  }
}

// 3. Roof equipment on the low wing: a louvred unit here and there, clear of the edges.
for (const [x, z] of cols) {
  if (roofAt(x, z) !== 23 || x % 7 !== 3 || z % 5 !== 2) continue;
  if (DIRS.some(([dx, dz]) => roofAt(x + dx, z + dz) < 23)) continue;
  g.set(x, 23, z, "smooth_quartz");
  g.set(x, 24, z, "iron_block");
}

// 4. Street entrance: a granite portal with two doors on the 54th Street face (z = 0), in the low wing, nearest the east end.
let E0 = -1;
for (let x = X - 3; x >= 1 && E0 < 0; x--) {
  if ([x - 1, x, x + 1, x + 2].every((i) => roofAt(i, 0) === 23)) E0 = x;
}
if (E0 < 0) throw new Error("no low-wing run on the street face for the entrance");
for (let y = 1; y <= 2; y++) { g.set(E0 - 1, y, 0, "polished_granite"); g.set(E0 + 2, y, 0, "polished_granite"); }
for (let x = E0 - 1; x <= E0 + 2; x++) g.set(x, 3, 0, "polished_granite");
for (const x of [E0, E0 + 1]) {
  const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
  g.set(x, 1, 0, "dark_oak_door", { ...door, half: "lower" });
  g.set(x, 2, 0, "dark_oak_door", { ...door, half: "upper" });
}

const stats = g.save(`${DIR}/NYC1087646.nbt`);
console.log(`NYC1087646: ${stats.blocks} blocks, ${stats.palette} palette entries, entrance at x ${E0}-${E0 + 1}`);
