import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey mid-rise commercial block (c. 1990s), Xinyi district.
// Pale tiled concrete walls, granite plinth, quartz sill bands, glazed
// window bays, a stone cornice and parapet, and a flat roof with plant boxes.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540883637";
const W = 15, H = 23, D = 17;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
let gmin = Infinity;
for (const [x, z, gr] of cells) {
  const gg = Math.round(gr);
  ground.set(key(x, z), gg);
  gmin = Math.min(gmin, gg);
}
if (!Number.isFinite(gmin)) gmin = 0;
const has = (x, z) => ground.has(key(x, z));
const b = gmin; // absolute base row of the building

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const M = {
  found: "stone_bricks",
  base: "smooth_stone",
  wall: "white_concrete",
  pier: "quartz_pillar",
  sill: "smooth_quartz",
  cornice: "smooth_stone",
  parapet: "white_concrete",
  slab: "light_gray_concrete",
  roof: "gray_concrete",
  glass: "glass",
  pane: "light_blue_stained_glass_pane",
  light: "glowstone",
  lintel: "stone_brick_slab",
  lantern: "lantern",
};

const faces = [
  ["N", 0, -1],
  ["S", 0, 1],
  ["W", -1, 0],
  ["E", 1, 0],
];

// Classify cells
const info = [];
const perimSet = new Set();
for (const [x, z, gr] of cells) {
  const gc = Math.round(gr);
  const exposed = faces.filter(([, dx, dz]) => !has(x + dx, z + dz));
  const perim = exposed.length > 0;
  if (perim) perimSet.add(key(x, z));
  info.push({ x, z, gc, exposed, perim, corner: exposed.length >= 2 });
}

// 1. Foundations, interior floor slab and roof slab
for (const c of info) {
  for (let y = 0; y < c.gc; y++) put(c.x, y, c.z, M.found);
  if (!c.perim) {
    if (b + 5 >= c.gc) put(c.x, b + 5, c.z, M.slab);
    if (b + 10 >= c.gc) put(c.x, b + 10, c.z, M.roof);
  }
}

// 2. Perimeter shell, windows, bands, cornice, parapet
for (const c of info) {
  if (!c.perim) continue;
  const face = c.exposed.length === 1 ? c.exposed[0] : null;
  let isWin = false;
  let paneProps = null;
  if (face && !c.corner) {
    const [, dx, dz] = face;
    const idx = dz !== 0 ? c.x : c.z;
    isWin = idx % 3 === 1;
    paneProps = dz !== 0
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  }
  for (let y = c.gc; y <= b + 11; y++) {
    if (y === b + 11) {
      put(c.x, y, c.z, M.parapet);
    } else if (y === b + 10) {
      put(c.x, y, c.z, M.cornice);
    } else if (y === b) {
      put(c.x, y, c.z, M.base);
    } else if (y === b + 5) {
      put(c.x, y, c.z, M.sill);
    } else if (c.corner) {
      put(c.x, y, c.z, M.pier);
    } else if (isWin && (y >= b + 1 && y <= b + 4 || y >= b + 6 && y <= b + 9)) {
      put(c.x, y, c.z, M.pane, paneProps);
    } else {
      put(c.x, y, c.z, M.wall);
    }
  }
}

// 3. Entrance on the south face, near the middle of the frontage
const southCands = info
  .filter((c) => c.perim && !c.corner && c.exposed.some(([n]) => n === "S"))
  .sort((a, b2) => a.x - b2.x);
let entrance = null;
if (southCands.length) {
  const mid = (W - 1) / 2;
  entrance = southCands.reduce((best, c) =>
    Math.abs(c.x - mid) < Math.abs(best.x - mid) ? c : best
  );
  const ex = entrance.x, ez = entrance.z;
  for (let y = b + 1; y <= b + 3; y++) {
    if (y >= entrance.gc) put(ex, y, ez, M.glass);
  }
  put(ex, b + 4, ez, M.lintel, { type: "bottom", waterlogged: "false" });
  // lantern under the lintel, inside the entry bay
  if (has(ex, ez - 1) && !perimSet.has(key(ex, ez - 1))) {
    put(ex, b + 3, ez - 1, M.lantern, { hanging: "true", waterlogged: "false" });
  }
}

// 4. Warm lights behind some glazed bays (inner interior cell, only)
for (const c of info) {
  if (!c.perim || c.corner || c.exposed.length !== 1) continue;
  if (entrance && c.x === entrance.x && c.z === entrance.z) continue;
  const [, dx, dz] = c.exposed[0];
  const idx = dz !== 0 ? c.x : c.z;
  if (idx % 3 !== 1) continue;
  const ix = c.x - dx, iz = c.z - dz; // inward neighbour
  if (!has(ix, iz) || perimSet.has(key(ix, iz))) continue;
  if (idx % 2 === 0) {
    put(ix, b + 2, iz, M.light);
  } else if (idx % 4 === 1) {
    put(ix, b + 7, iz, M.light);
  }
}

// 5. Roof plant: a few light-grey boxes on the interior roof
for (const c of info) {
  if (c.perim) continue;
  if (c.x < 4 || c.x > 10 || c.z < 5 || c.z > 11) continue;
  if (((c.x + c.z) & 1) !== 0) continue;
  const top = b + 11;
  if (top + 1 >= H) continue;
  put(c.x, top, c.z, M.slab);
  put(c.x, top + 1, c.z, M.slab);
}

g.save(`${DIR}/${ID}.nbt`);
