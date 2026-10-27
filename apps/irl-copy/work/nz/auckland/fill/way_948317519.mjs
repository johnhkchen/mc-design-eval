// way 948317519: a two-storey 1930s brick commercial block on the Mt Eden slope. Footprint from OSM, heights from LINZ
// lidar: the roof is 8 blocks above y 0 at its high (west) end and steps down to 4-7 on the lower east wing.
// Solid massing (no interiors): a brick skin, one block of air behind each window, stone plinth on the foundation rule,
// a smooth-quartz storey line, a stone-slab cornice, shopfront with a door on the street face, warm lights behind glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317519.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317519.nbt";

const key = (x, z) => `${x},${z}`;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// the lidar roof is noisy cell to cell: a 3x3 majority (ties keep the cell's own value) makes flat tiers of it.
// Ground is kept as measured, so the foundation rule still matches the terrain.
const raw = new Map(cells.map(([x, z, g, R]) => [key(x, z), { g, R }]));
const mode = (vals, self) => {
  const n = new Map(); for (const v of vals) n.set(v, (n.get(v) || 0) + 1);
  let best = self; for (const [v, c] of n) if (c > (n.get(best) || 0)) best = v;
  return best;
};
const C = new Map();
for (const [k, c] of raw) {
  const [x, z] = k.split(",").map(Number);
  const nb = [-1, 0, 1].flatMap((dx) => [-1, 0, 1].map((dz) => raw.get(key(x + dx, z + dz)))).filter(Boolean);
  const faces = DIRS.filter(([dx, dz]) => !raw.has(key(x + dx, z + dz)));
  C.set(k, { x, z, g: c.g, R: mode(nb.map((n) => n.R), c.R), faces, perim: faces.length > 0 });
}

// the street face is the outward face with the most cells (a long run of the building's edge)
const faceCount = new Map();
for (const c of C.values()) for (const f of c.faces) faceCount.set(f.join(), (faceCount.get(f.join()) || 0) + 1);
const front = [...faceCount].sort((a, b) => b[1] - a[1])[0][0].split(",").map(Number);
const isFront = (f) => f[0] === front[0] && f[1] === front[1];

const g = new Voxels([26, 21, 17]);
const GLASS_X = { north: "true", south: "true", east: "false", west: "false" };
const GLASS_Z = { north: "false", south: "false", east: "true", west: "true" };

// per perimeter cell: the face it stands on (street face first), its along-wall index, and its window rows
const faceOf = (c) => (c.faces.some(isFront) ? front : c.faces[0]);
const along = (c, f) => (f[0] !== 0 ? c.z : c.x);
const windowRow = (c, y) => {
  if (y === c.R - 1 || y === c.g + 3 || y === c.g) return false;   // cornice, storey line, base course keep their own rows
  return (y === c.g + 1 || y === c.g + 2) || (y >= c.g + 4 && y <= Math.min(c.g + 5, c.R - 2));
};

// 1. solid massing: plinth to the cell's ground, body to the roof, roof surface on the interior
for (const c of C.values()) {
  for (let y = 0; y < c.R; y++) {
    if (y < c.g) g.set(c.x, y, c.z, "stone_bricks");
    else if (y === c.R - 1) c.perim ? g.set(c.x, y, c.z, "stone_brick_slab", { type: "top", waterlogged: "false" }) : g.set(c.x, y, c.z, "smooth_stone");
    else g.set(c.x, y, c.z, "bricks");
  }
}

// 2. the facade on the skin: base course, storey line (awning on the street face), window bays of glass between frames
const holes = [];   // [x, y, z] of the air gap behind each glass pane
for (const c of C.values()) {
  if (!c.perim) continue;
  const f = faceOf(c), a = along(c, f), axisState = f[0] !== 0 ? GLASS_Z : GLASS_X;
  const inward = [c.x - f[0], c.z - f[1]];
  for (let y = c.g; y < c.R - 1; y++) {
    if (y === c.g) { g.set(c.x, y, c.z, "stone_bricks"); continue; }
    if (y === c.g + 3) { isFront(f) ? g.set(c.x, y, c.z, "dark_oak_slab", { type: "top", waterlogged: "false" }) : g.set(c.x, y, c.z, "smooth_quartz"); continue; }
    if (!windowRow(c, y)) { g.set(c.x, y, c.z, "bricks"); continue; }
    if (a % 3 === 0) { g.set(c.x, y, c.z, "white_concrete"); continue; }   // frame between bays
    g.set(c.x, y, c.z, "glass_pane", axisState);
    if (raw.has(key(inward[0], inward[1])) && !C.get(key(inward[0], inward[1])).perim) holes.push([inward[0], y, inward[1], c.x, c.z]);
  }
  // the cornice is a stone slab on top of the wall, and sits over the roof's edge
  g.set(c.x, c.R - 1, c.z, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

// 3. the air gap behind each pane; some hold a warm light (glowstone or shroomlight) behind the glass
for (const [ix, y, iz, px, pz] of holes) {
  g.set(ix, y, iz, "air");
  if ((px * 7 + pz * 3 + y) % 4 === 0) g.set(ix, y, iz, "glowstone");
  else if ((px * 5 + pz * 11 + y) % 9 === 0) g.set(ix, y, iz, "shroomlight");
}

// 4. the street door: on the lowest street-face bay with a glass column, lower and upper halves, air behind to the shop
const streetCells = [...C.values()].filter((c) => c.perim && isFront(faceOf(c)) && along(c, front) % 3 === 1);
streetCells.sort((p, q) => p.g - q.g || Math.abs(along(p, front) - 8) - Math.abs(along(q, front) - 8));
const door = streetCells[0];
const doorState = (half) => ({ facing: FACING[front.join()], half, hinge: "left", open: "false", powered: "false" });
g.set(door.x, door.g, door.z, "dark_oak_door", doorState("lower"));
g.set(door.x, door.g + 1, door.z, "dark_oak_door", doorState("upper"));
const dIn = [door.x - front[0], door.z - front[1]];
g.set(dIn[0], door.g, dIn[1], "air");
g.set(dIn[0], door.g + 1, dIn[1], "air");
g.set(dIn[0], door.g + 2, dIn[1], "lantern", { hanging: "false", waterlogged: "false" });   // a lamp inside the shop, on the foundation

// 5. roof plant on the flat upper roofs: 2x2 iron units set on the roof surface, well inside the parapet
for (const c of C.values()) {
  if (c.perim || c.R !== 8) continue;
  if (Math.floor(c.x / 2) % 3 !== 1 || Math.floor(c.z / 2) % 2 !== 0) continue;
  g.set(c.x, c.R, c.z, "iron_block");
}

// check: every block above y 0 has something under it or beside it at its own height (nothing floats)
let floating = 0;
g.forEachCell((i) => {
  const X = 26, Y = 21, x = i % X, y = Math.floor(i / X) % Y, z = Math.floor(i / (X * Y));
  if (y === 0) return;
  const solid = (a, b, c) => g.val(a, b, c) !== 0;
  if (!solid(x, y - 1, z) && ![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => solid(x + dx, y, z + dz))) floating++;
});
const stats = g.save(OUT);
console.log(`way_948317519: ${stats.blocks} blocks, palette ${stats.palette}, floating ${floating}, street face ${FACING[front.join()]}, door at x${door.x} z${door.z}`);
