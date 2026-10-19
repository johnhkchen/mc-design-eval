// NYC1034321: 41 West 46th Street, 1920, mixed residential and commercial. A three-storey street front (z 0 to 9)
// rising to a six-storey rear (z 10 to 25), on a granite plinth, buff-red brick with calcite string courses, stone-brick
// piers, glass panes in every storey, a shopfront with a door on the 46th Street front, a water tower and a lightning rod.
// Built as a shell: a one-block exterior skin, air behind the glass, a floor slab per storey, warm light in some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const W = 6, L = 26, H = 30;
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034321.cells.json`, "utf8"));

// Direction of each face: north is low z, the 46th Street front; the rear is south.
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const grid = (fill) => Array.from({ length: W }, () => Array.from({ length: L }, fill));
const foot = grid(() => false), gnd = grid(() => 0), raw = grid(() => 0);
for (const [x, z, g, r] of cells) { foot[x][z] = true; gnd[x][z] = g; raw[x][z] = r; }
const inFoot = (x, z) => x >= 0 && x < W && z >= 0 && z < L && foot[x][z];

// Lidar roof. A zero return takes the mean of its built neighbours; each roof snaps to whole storeys (3 blocks);
// a majority filter removes single-cell specks, so the massing reads as flat tiers.
const roof = grid(() => 0);
for (let x = 0; x < W; x++) for (let z = 0; z < L; z++) {
  if (!foot[x][z]) continue;
  let r = raw[x][z];
  if (!r) {
    const n = Object.values(DIRS).map(([dx, dz]) => [x + dx, z + dz]).filter(([a, b]) => inFoot(a, b) && raw[a][b] > 0).map(([a, b]) => raw[a][b]);
    r = n.length ? Math.round(n.reduce((s, v) => s + v, 0) / n.length) : 0;
  }
  roof[x][z] = r ? Math.max(3, Math.round(r / 3) * 3) : 0;
}
const top = grid(() => 0);
for (let x = 0; x < W; x++) for (let z = 0; z < L; z++) {
  if (!foot[x][z]) continue;
  const counts = new Map();
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if ((!dx && !dz) || !inFoot(x + dx, z + dz)) continue;
    const v = roof[x + dx][z + dz]; counts.set(v, (counts.get(v) || 0) + 1);
  }
  let best = roof[x][z], bestN = 0;
  for (const [v, n] of counts) if (n > bestN) { best = v; bestN = n; }
  top[x][z] = bestN >= 5 && (counts.get(roof[x][z]) || 0) <= 1 ? best : roof[x][z];
}
for (let z = 0; z < L; z++) {
  let row = "";
  for (let x = 0; x < W; x++) row += foot[x][z] ? String(top[x][z] / 3) : ".";
  console.log(`z${String(z).padStart(2)} ${row}`);
}

// Envelope voxel: the column of a footprint cell from y 0 up to its roof. Outward faces are the neighbours that are not.
const occ = (x, y, z) => inFoot(x, z) && y < top[x][z];
const out = (x, y, z) => Object.entries(DIRS).filter(([, [dx, dz]]) => !occ(x + dx, y, z + dz)).map(([n]) => n);

const vox = new Map();
const put = (x, y, z, block, state) => vox.set(`${x},${y},${z}`, { block, state });
const has = (x, y, z) => vox.has(`${x},${y},${z}`);
const panes = [];

for (let x = 0; x < W; x++) for (let z = 0; z < L; z++) {
  if (!foot[x][z]) continue;
  const T = top[x][z], G = gnd[x][z];
  for (let y = 0; y < T; y++) {
    const ex = out(x, y, z);
    // Foundation below the cell's ground, solid; the granite face shows on the outside.
    if (y < G) { put(x, y, z, ex.length ? "polished_granite" : "stone"); continue; }
    // Roof: stone-brick coping on the edge, smooth-stone deck inside.
    if (y === T - 1) { put(x, y, z, ex.length ? "stone_bricks" : "smooth_stone"); continue; }
    // Interior: a floor slab at the ground and each storey line, air between.
    if (!ex.length) { if (y === G || y % 3 === 0) put(x, y, z, "smooth_stone"); continue; }
    // Exterior skin: granite plinth, then a calcite string course every storey, windows between.
    if (y === G) { put(x, y, z, "polished_granite"); continue; }
    if (y % 3 === 0) {
      // A dark wooden canopy over the 46th Street entrance, calcite string course everywhere else.
      if (ex.includes("north") && y === G + 3 && (x === 1 || x === 2)) put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
      else put(x, y, z, "calcite");
      continue;
    }
    const onFront = ex.includes("north");
    if (onFront && y <= G + 2) {
      // Shopfront on 46th Street: a door in the centre, glass either side of the piers.
      if (x === 2) { put(x, y, z, "dark_oak_door", { facing: "south", half: y === G + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    }
    // Window band: brick piers every third block along the face, stone-brick pilasters at the corners, glass panes between.
    const u = ex.includes("north") || ex.includes("south") ? x : z;
    if (ex.length > 1) put(x, y, z, "stone_bricks");
    else if (u % 3 === 0) put(x, y, z, "bricks");
    else { put(x, y, z, "glass_pane"); panes.push([x, y, z]); }
  }
}

// Rooftop: a wooden water tank on the rear roof and a lightning rod on the rear corner.
for (const [x, z] of [[0, 20], [1, 20], [0, 21], [1, 21]]) {
  const b = top[x][z];
  for (let y = b; y < b + 3; y++) put(x, y, z, "spruce_planks");
  put(x, b + 3, z, "spruce_slab", { type: "bottom", waterlogged: "false" });
}
put(5, top[5][25], 25, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

// Pane connections: a pane joins the neighbouring pane or pier on its own face, so the band reads as a grid, not posts.
for (const [x, y, z] of panes) {
  const [outward] = out(x, y, z);
  const state = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  const sides = outward === "north" || outward === "south" ? ["west", "east"] : ["north", "south"];
  for (const s of sides) { const [dx, dz] = DIRS[s]; if (has(x + dx, y, z + dz)) state[s] = "true"; }
  vox.get(`${x},${y},${z}`).state = state;
}

// Warm light: glowstone just inside some sill-height windows, on the interior side of the glass.
for (const [x, y, z] of panes) {
  if (y % 3 !== 1 || (x * 5 + y * 3 + z * 7) % 9 !== 0) continue;
  const [dx, dz] = DIRS[out(x, y, z)[0]];
  const ix = x - dx, iz = z - dz;
  if (inFoot(ix, iz) && !has(ix, y, iz)) put(ix, y, iz, "glowstone");
}

const g = new Voxels([W, H, L]);
for (const [key, { block, state }] of vox) { const [x, y, z] = key.split(",").map(Number); g.set(x, y, z, block, state); }
const out_ = g.save(`${DIR}/NYC1034321.nbt`);
console.log(`saved NYC1034321.nbt: ${out_.blocks} blocks, ${out_.palette} palette entries`);
