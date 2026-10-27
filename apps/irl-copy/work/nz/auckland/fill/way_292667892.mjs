// Hobson Towers East: a 1980s concrete-frame office tower (nine storeys of 4 blocks on a two-block plinth, about 3.3 m
// a storey) with a glazed ground floor, a setback terrace on the north and east, a lower wing on the south-west, and a
// plant room on the roof. Cells come from the lidar: [x, z, ground, roof]. North is -z.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_292667892.cells.json`, "utf8"));
const g = new Voxels([23, 56, 30]);

const fp = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { x, z, ground, roof }]));
const inFp = (x, z) => fp.has(`${x},${z}`);
const minZ = Math.min(...cells.map((c) => c[1]));
const maxX = Math.max(...cells.map((c) => c[0]));

const M = {
  plinth: "polished_andesite",
  slab: "smooth_stone",
  band: "white_concrete",
  pier: "light_gray_concrete",
  glass: "light_blue_stained_glass_pane",
  roof: "gray_concrete",
  parapet: "stone_brick_wall",
  canopy: "black_concrete",
  lit: "glowstone",
};

// Lidar roof, median of the 3x3 neighbourhood to drop noise, then quantised to 4-block storeys; capped at the 44-block roof.
const roofSmooth = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFp(x + dx, z + dz)) v.push(fp.get(`${x + dx},${z + dz}`).roof);
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
};
const topOf = (x, z) => Math.min(44, Math.max(8, 4 * Math.round(roofSmooth(x, z) / 4)));

// Setback: the north two rows and east two columns of the main tower step back at storey 7 (y 28) up.
const SETBACK_Y = 28;
const ringed = (x, z) => z <= minZ + 1 || x >= maxX - 1;
const setback = (x, z, y) => y >= SETBACK_Y && topOf(x, z) === 44 && ringed(x, z);
const solid = (x, z, y) => inFp(x, z) && y < topOf(x, z) && !setback(x, z, y);

const DIRS = { S: [0, 1], E: [1, 0], N: [0, -1], W: [-1, 0] };
const ORDER = ["S", "E", "N", "W"];
const exposed = (x, z, y) => ORDER.filter((d) => !solid(x + DIRS[d][0], z + DIRS[d][1], y));
const outside = (x, z) => ORDER.some((d) => !inFp(x + DIRS[d][0], z + DIRS[d][1]));

// Floor slabs at y 2 and every 4 from 7; walls read base (y 2), ground glazing (3-5), lintel (6), then band-glass-glass-band.
const isFloor = (y) => y === 2 || (y >= 7 && (y - 7) % 4 === 0);
const rowKind = (y) => {
  if (y === 2) return "base";
  if (y <= 5) return "win";
  if (y === 6) return "band";
  const r = (y - 7) % 4;
  return r === 0 || r === 3 ? "band" : "win";
};

// Entrance: the south-edge cell nearest the middle of the front, on a main-tower column.
const southEdge = new Map();
for (const [x, z] of cells) southEdge.set(x, Math.max(southEdge.get(x) ?? -1, z));
const xd = [...southEdge.keys()]
  .filter((x) => topOf(x, southEdge.get(x)) === 44)
  .sort((a, b) => Math.abs(a - 11) - Math.abs(b - 11))[0];
const zd = southEdge.get(xd);

const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (const [x, z] of cells) {
  const T = topOf(x, z);
  for (let y = 0; y < T; y++) {
    if (!solid(x, z, y)) continue;
    if (y < 2) { put(x, y, z, M.plinth); continue; }
    if (y === T - 1) { put(x, y, z, M.roof); continue; }
    const faces = exposed(x, z, y);
    if (!faces.length) { if (isFloor(y)) put(x, y, z, M.slab); continue; }

    if (x === xd && z === zd && y >= 2 && y <= 5) {
      // doorway: a two-leaf door under a transom, with a hanging lantern under the lintel
      if (y === 2) put(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (y === 3) put(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      else if (y === 4) put(x, y, z, M.glass);
      else put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }

    const kind = rowKind(y);
    if (kind === "base") put(x, y, z, M.plinth);
    else if (kind === "band") put(x, y, z, M.band);
    else {
      // glazing: piers every third block along the face; panes between, some lit from a room behind
      const f = faces[0];
      const along = f === "S" || f === "N" ? x : z;
      if (along % 3 === 0) { put(x, y, z, M.pier); continue; }
      put(x, y, z, M.glass);
      const ix = x - DIRS[f][0], iz = z - DIRS[f][1];
      if ((along + y) % 7 === 0 && inFp(ix, iz) && solid(ix, iz, y) && !exposed(ix, iz, y).length) put(ix, y, iz, M.lit);
    }
  }
}

// Canopy band over the entrance, a balustrade on the setback terrace edge, planting on the rest of the terrace.
for (let dx = -1; dx <= 1; dx++) {
  const x = xd + dx, z = southEdge.get(x);
  if (z !== undefined && solid(x, z, 6)) put(x, 6, z, M.canopy);
}
for (const [x, z] of cells) {
  if (topOf(x, z) !== 44 || !ringed(x, z) || !solid(x, SETBACK_Y - 1, z)) continue;
  if (outside(x, z)) put(x, SETBACK_Y, z, M.parapet);
  else if ((x + z) % 2 === 0) put(x, SETBACK_Y, z, "oak_leaves", { distance: "1", persistent: "true", waterlogged: "false" });
}

// Parapet on the outer edge of every roof, and a plant room with a lightning rod on the main roof.
for (const [x, z] of cells) {
  const T = topOf(x, z);
  if (solid(x, T - 1, z) && outside(x, z)) put(x, T, z, M.parapet);
}
for (let z = 12; z <= 16; z++) for (let x = 9; x <= 13; x++) {
  if (!inFp(x, z) || topOf(x, z) !== 44) continue;
  put(x, 44, z, M.pier); put(x, 45, z, M.pier);
  if (x === 11 && z === 14) put(x, 46, z, "lightning_rod", { facing: "up", powered: "false" });
}

const stats = g.save(`${DIR}/way_292667892.nbt`);
console.log(`way_292667892: ${cells.length} cells, ${stats.blocks} blocks, ${stats.palette} palette entries; door at x=${xd} z=${zd}`);
