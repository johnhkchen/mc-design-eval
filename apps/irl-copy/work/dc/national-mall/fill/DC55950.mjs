// 2031 Florida Ave NW: a 1920s brick commercial block with a limestone (calcite) belt course and coping, a polished
// granite plinth, a shopfront band at street level, and a flat roof stepping up from a 6-block body to a 7-block
// tower spine. Walls are solid massing; windows are panes set in the outer face with an air gap behind them, floor
// slabs (belt courses and the roof membrane) close every storey, and the interior is never hollow.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC55950.cells.json`, "utf8"));

const [X, Y, Z] = [9, 19, 8];
const at = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
// lidar noise: (5,4) reads one block low inside the tower spine, so it joins the tower tier
at.get("5,4").roof = 7;
const inFp = (x, z) => at.has(`${x},${z}`);
const FACES = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
const outward = (x, z) => FACES.filter(([dx, dz]) => !inFp(x + dx, z + dz));

// plan[y][z][x]: { block, state } or null (air); written to the voxel volume at the end
const plan = Array.from({ length: Y }, () => Array.from({ length: Z }, () => Array(X).fill(null)));
const put = (x, y, z, block, state) => { plan[y][z][x] = { block, state }; };
const air = (x, y, z) => { plan[y][z][x] = null; };

const DOOR = [5, 5];                 // the one single-face cell on the south front: the entrance
const windows = [];                  // { x, y, z, dx, dz } for each pane, to carve its air gap
const litBy = (x, y, z) => (x + 2 * z + y) % 3 === 0;   // every third gap gets a warm light

for (const [key, { ground: gr, roof: r }] of at) {
  const [x, z] = key.split(",").map(Number);
  const out = outward(x, z);
  const [dx, dz] = out[0] ?? [0, 0];
  const idx = dz !== 0 ? x : z;      // position along the primary face (corners are piers)

  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");        // foundation, nothing floats on the slope
  put(x, gr, z, "polished_granite");                                 // plinth course

  for (let y = gr + 1; y < r; y++) {
    if (out.length === 0) {                                          // interior: solid, roof membrane on top
      put(x, y, z, y === r - 1 ? "smooth_stone" : "bricks");
      continue;
    }
    const shop = y <= 2;                                             // ground-floor shopfront band
    const belt = (y === 3 && r >= 6) || (y === 5 && r === 7);        // limestone storey lines
    const upperWin = (y === 4 && r >= 6) || (y === 3 && r === 5);
    if (y === r - 1) put(x, y, z, "calcite");                        // coping
    else if (belt) put(x, y, z, "calcite");
    else if (shop && x === DOOR[0] && z === DOOR[1]) {
      const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
      put(x, y, z, "dark_oak_door", { ...door, half: y === 1 ? "lower" : "upper" });
    } else if ((shop || upperWin) && idx % 2 === 1) {
      // a pane in the outer face: it joins its wall-plane neighbours, the air gap is carved behind it below
      const state = dz !== 0
        ? { east: "true", west: "true", north: "false", south: "false" }
        : { north: "true", south: "true", east: "false", west: "false" };
      put(x, y, z, "glass_pane", state);
      windows.push({ x, y, z, dx, dz });
    } else put(x, y, z, "bricks");
  }
}

// each window's air gap sits one cell in, in the same row; only interior cells are carved, so no facade opens
for (const { x, y, z, dx, dz } of windows) {
  const ix = x - dx, iz = z - dz;
  if (!inFp(ix, iz) || outward(ix, iz).length) continue;   // a facade cell stays solid, so no hole opens in the skin
  air(ix, y, iz);
  if (litBy(ix, y, iz)) put(ix, y, iz, "lantern", { hanging: "true", waterlogged: "false" }); // hangs from the slab above
}

// roof plant: condenser pairs sit on the membrane, clear of the coping
for (const [x, z, y] of [[1, 2, 6], [2, 2, 6], [6, 5, 6], [4, 4, 7]]) put(x, y, z, "light_gray_concrete");

// the plan is solid over a footprint cell from the foundation to the roof, so every tier stands on the one below
const g = new Voxels([X, Y, Z]);
for (let y = 0; y < Y; y++) for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const p = plan[y][z][x]; if (p) g.set(x, y, z, p.block, p.state);
}
const out = `${DIR}/DC55950.nbt`;
console.log(g.save(out));
