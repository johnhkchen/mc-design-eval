// FR241938052: a residential block, built 1695 (Ancien Régime Paris): six storeys of pale limestone over a
// rubble plinth, tall Mansart-style slate mansard with stepped eaves, 8 x 16 footprint, turned to the lidar.
// Walls are one block thick on the footprint's edge; the inside is air with a wood floor per storey, so the
// glass has an air gap behind it. Tiers follow the lidar roof: a 23-block body, a 12-block wing, an 8-block lean-to.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR241938052.cells.json", "utf8"));

const key = (x, z) => `${x},${z}`;
// [name, dx, dz]; a footprint cell's "exposed" side is one whose neighbour is outside the footprint
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const WALL = "calcite", PLINTH = "stone_bricks", FLOOR = "oak_planks", SLATE = "deepslate_tiles", SLATE_STEP = "deepslate_tile_stairs";
const DOOR_CELL = "1,0";

// lidar roof -> clean tiers (the noisy 8-11 notch on the north edge reads as a lower wing, not as a pit)
const tier = (R) => (R >= 17 ? 23 : R >= 10 ? 12 : 8);

const F = new Map();
for (const [x, z, ground, roof] of cells) F.set(key(x, z), { gr: ground, R: tier(roof) });
const inF = (x, z) => F.has(key(x, z));

// depth from the outside: 1 = edge cell, 2 = one in, ... (drives the mansard's stepped eaves)
const depth = new Map(), queue = [];
for (const [k] of F) {
  const [x, z] = k.split(",").map(Number);
  if (DIRS.some(([, dx, dz]) => !inF(x + dx, z + dz))) { depth.set(k, 1); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = depth.get(key(x, z));
  for (const [, dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz, k = key(nx, nz);
    if (inF(nx, nz) && !depth.has(k)) { depth.set(k, d + 1); queue.push([nx, nz]); }
  }
}

const g = new Voxels([8, 39, 16]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const stairState = (facing) => ({ facing, half: "bottom", shape: "straight", waterlogged: "false" });
const paneAxis = new Map();      // "x,y,z" -> "x" (panes on a north/south face) or "z" (on an east/west face)
const lamps = [];

for (const [k, info] of F) {
  const [x, z] = k.split(",").map(Number);
  const gr = info.gr, T = info.R - 3, d = depth.get(k);      // T = top of the cornice; the mansard rises above it
  const exposed = DIRS.filter(([, dx, dz]) => !inF(x + dx, z + dz));
  const outward = DIRS.find(([, dx, dz]) => depth.get(key(x + dx, z + dz)) === d - 1);

  // storey bands from the top down: each upper storey is 3 rows (string course, two rows of glass); the ground
  // storey takes what is left, so six storeys fit the lidar height from either ground level
  const avail = T - 1 - gr;
  const count = Math.max(0, Math.min(5, Math.floor((avail - 3) / 3)));
  const bands = [];
  for (let i = 0; i < count; i++) bands.push(T - 3 - 3 * i);
  const groundTop = bands.length ? bands[bands.length - 1] : T;
  const floors = new Set([gr + 1, T, ...bands]);
  const glassRow = (y) => (y > gr + 1 && y < groundTop - 1) || bands.some((b) => (y === b + 1 || y === b + 2) && y !== T - 1);

  // foundation and plinth, under every cell
  for (let y = 0; y <= gr; y++) put(x, y, z, PLINTH);

  if (d === 1) {
    const face = exposed[0];
    const alongFace = face[1] !== 0 ? z : x;      // along a north/south face the bays run in x; along an east/west face, in z
    const pillar = alongFace % 3 === 0;
    const isDoor = k === DOOR_CELL;
    for (let y = gr + 1; y <= T; y++) {
      if (isDoor && (y === gr + 1 || y === gr + 2)) { put(x, y, z, "dark_oak_door", { facing: face[0], half: y === gr + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y < T && glassRow(y) && !pillar && !isDoor) {
        const axis = face[1] !== 0 ? "x" : "z";
        paneAxis.set(`${x},${y},${z}`, axis);
        put(x, y, z, "glass_pane");
        // a warm light in the air behind every sixth bay (the room's side of the glass)
        const midGlass = y === gr + 2 || bands.some((b) => y === b + 1);
        if (alongFace % 6 === 2 && midGlass) {
          const ix = x - face[1], iz = z - face[2];           // the cell inside, opposite the exposed side
          if (depth.get(key(ix, iz)) >= 2) { put(ix, y, iz, "shroomlight"); lamps.push([ix, y, iz]); }
        }
        continue;
      }
      put(x, y, z, WALL);
    }
    put(x, T + 1, z, SLATE_STEP, stairState(face[0]));      // eave: low side outward
  } else {
    // interior: air, a wood floor per storey, the top floor's ceiling under the roof
    for (let y = gr + 1; y <= T; y++) if (floors.has(y)) put(x, y, z, FLOOR);
    if (d === 2) {
      put(x, T + 1, z, SLATE);
      put(x, T + 2, z, SLATE_STEP, stairState(outward[0]));
    } else {
      put(x, T + 1, z, SLATE);
      put(x, T + 2, z, SLATE);
    }
  }
}

// a pair of brick chimney stacks on the mansard's broad top
for (const [x, z] of [[3, 6], [3, 11]]) if ((depth.get(key(x, z)) ?? 0) >= 3) { put(x, 23, z, "bricks"); put(x, 24, z, "bricks"); }

// panes connect to the panes and solid walls beside them in their own face
for (const [k, axis] of paneAxis) {
  const [x, y, z] = k.split(",").map(Number);
  const [a, b] = axis === "x" ? [[x - 1, z], [x + 1, z]] : [[x, z - 1], [x, z + 1]];
  const conn = (p) => g.get(p[0], y, p[1]) != null;
  const st = { waterlogged: "false" };
  if (axis === "x") { st.west = String(conn(a)); st.east = String(conn(b)); st.north = "false"; st.south = "false"; }
  else { st.north = String(conn(a)); st.south = String(conn(b)); st.east = "false"; st.west = "false"; }
  put(x, y, z, "glass_pane", st);
}

const { blocks, palette } = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR241938052.nbt");
console.log(`FR241938052: ${blocks} blocks, ${palette} palette entries, ${lamps.length} lit bays`);
