import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1361 Connecticut Ave NW, Commercial-Office-Large: a 1960s-70s brick office block on a stone plinth, the lidar roof
// record read as three flat tiers (one-storey wings at 3, a four-storey body at 12, a five-storey core at 15), with
// the stepped edges where a tier meets a lower one. Storeys are 3-block modules: a string course on each floor line,
// two rows of window between piers. Brick and white precast on the walls, dark-blue glass, lit offices behind the glass.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC55975.cells.json`, "utf8")); // [x, z, ground, roof] per footprint cell

const W = 32, D = 26, Y = 27;
const g = new Voxels([W, Y, D]);

// the lidar roof, snapped to the three tiers (14+ is the core, 9..13 the body, the rest the one-storey wings)
const tier = (v) => (v >= 14 ? 15 : v >= 9 ? 12 : 3);
const raw = new Array(W * D).fill(0); // 0 = outside the footprint
for (const [x, z, , roof] of cells) raw[z * W + x] = tier(roof);
// one majority pass over each cell's 3 x 3 neighbourhood: single-cell lidar spikes drop out, and the tier edges run straight
const rawAt = (x, z) => (x >= 0 && z >= 0 && x < W && z < D ? raw[z * W + x] : 0);
const top = new Array(W * D).fill(0);
for (const [x, z, , roof] of cells) {
  const votes = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const v = rawAt(x + dx, z + dz);
    if (v) votes.set(v, (votes.get(v) || 0) + (dx === 0 && dz === 0 ? 1.5 : 1));
  }
  let best = raw[z * W + x], bestN = 0;
  for (const [v, n] of votes) if (n > bestN) { best = v; bestN = n; }
  top[z * W + x] = best;
}
const at = (x, z) => (x >= 0 && z >= 0 && x < W && z < D ? top[z * W + x] : 0);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const STOREY = new Set([4, 7, 10, 13]); // the floor lines: a string course on the face, a slab inside
const LOW_ROWS = new Set([2, 5, 8, 11]); // the lower window row of each storey, where a light sits on a slab

// a face is exposed where the neighbour is outside the footprint or lower: the cell is then part of the outer shell
const exposed = (x, z, dx, dz) => at(x + dx, z + dz) < at(x, z);
const ringCell = (x, z) => DIRS.some(([dx, dz]) => exposed(x, z, dx, dz));

// the entrance: the body's south-facing shell (max z), the bay nearest its middle
const south = cells.filter(([x, z, , r]) => tier(r) >= 12 && exposed(x, z, 0, 1));
const maxZ = Math.max(...south.map((c) => c[1]));
const row = south.filter((c) => c[1] === maxZ);
const mid = row.reduce((s, c) => s + c[0], 0) / row.length;
const DOOR = row.reduce((b, c) => (Math.abs(c[0] - mid) < Math.abs(b[0] - mid) ? c : b));
const DX = DOOR[0], DZ = DOOR[1];

// structure: the outer shell is solid from y 0 to the top, the inside is solid only at the floor lines and the roof
function shell(x, z, y) {
  const r = at(x, z);
  if (!r || y >= r) return false;
  if (x === DX && z === DZ && (y === 2 || y === 3)) return false; // the doorway is open
  if (y <= 1 || y === r - 1 || STOREY.has(y)) return true;
  return ringCell(x, z);
}

// glass panes join the solid walls and other panes along the facade, as they would in the world
const pane = (x, z, y) => ({
  north: shell(x, z - 1, y) ? "true" : "false",
  south: shell(x, z + 1, y) ? "true" : "false",
  east: shell(x + 1, z, y) ? "true" : "false",
  west: shell(x - 1, z, y) ? "true" : "false",
  waterlogged: "false",
});

// on a facade, piers stand over the storey's bays: on an x face every third x, on a z face every third z, corners solid
function isPier(x, z) {
  const xFace = exposed(x, z, 0, 1) || exposed(x, z, 0, -1);
  const zFace = exposed(x, z, 1, 0) || exposed(x, z, -1, 0);
  return (xFace && zFace) || (xFace && x % 3 === 0) || (zFace && z % 3 === 0);
}

// what one cell holds, or null for air
function block(x, z, y) {
  if (x === DX && z === DZ && (y === 2 || y === 3)) {
    return { id: "oak_door", state: { facing: "south", half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
  }
  if (!shell(x, z, y)) return null;
  const r = at(x, z), ring = ringCell(x, z), T = r - 1;
  if (y === 0) return { id: "stone_bricks" }; // foundation
  if (y === 1) return { id: ring ? "stone_bricks" : "gray_concrete" }; // base course, ground-floor slab
  if (y === 4 && ring && z === DZ && Math.abs(x - DX) <= 1) return { id: "black_concrete" }; // the entrance canopy band
  if (y === T && !(ring && r === 3)) return { id: ring ? "white_concrete" : "stone" }; // cornice, roof deck
  if (STOREY.has(y)) return { id: ring ? "white_concrete" : "gray_concrete" }; // string course, floor slab
  if (!ring) return null; // air: the gap behind the glass
  if (isPier(x, z)) return { id: y <= 3 ? "stone_bricks" : "bricks" };
  return { id: "light_blue_stained_glass_pane", state: pane(x, z, y) };
}

const put = (x, y, z, id, state) => g.set(x, y, z, id, state);

// the building, cell by cell, from y 0 to its own roof
const cellsList = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (at(x, z)) cellsList.push([x, z]);
for (const [x, z] of cellsList) for (let y = 0; y < at(x, z); y++) {
  const b = block(x, z, y);
  if (b) put(x, y, z, b.id, b.state);
}

// warm light in some windows: glowstone (or shroomlight) on the inside of the glass, in the air gap, on a floor slab
const isWindow = (x, z, y) => {
  const r = at(x, z);
  return ringCell(x, z) && !isPier(x, z) && y !== 1 && !STOREY.has(y) && (y !== r - 1 || r === 3) && !(x === DX && z === DZ);
};
for (const [x, z] of cellsList) for (const y of [2, 5, 8, 11]) {
  if (!isWindow(x, z, y) || (x * 2 + z * 3 + y) % 5 !== 0) continue;
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (!at(nx, nz) || ringCell(nx, nz) || g.get(nx, y, nz)) continue;
    put(nx, y, nz, (x + z) % 3 === 0 ? "shroomlight" : "glowstone");
    break;
  }
}

// roof plant on the core and the body's roof decks, each box standing on the roof
for (const [x, z] of cellsList) {
  const r = at(x, z);
  if (ringCell(x, z)) continue;
  if (r === 15 && (x * 7 + z * 3) % 11 === 0) put(x, r, z, "light_gray_concrete");
  if (r === 12 && (x * 5 + z) % 9 === 0) put(x, r, z, "light_gray_concrete");
}

// checks: nothing hangs in the air, and the shell has no holes. A floor slab or roof deck spans the inside and is held
// by the perimeter wall at its own level, so only other blocks (walls, glass, plant) must stand on a block below
const hanging = [];
for (const [x, z] of cellsList) for (let y = 1; y < at(x, z) + 1; y++) {
  if (g.get(x, y, z) && !g.get(x, y - 1, z) && !STOREY.has(y) && y !== at(x, z) - 1) hanging.push([x, y, z]);
}
const holes = [];
for (const [x, z] of cellsList) for (let y = 0; y < at(x, z) - 1; y++) if (ringCell(x, z) && !g.get(x, y, z)) holes.push([x, y, z]);
const count = g.count();
console.log(`cells ${cellsList.length}, blocks ${count}, door at x ${DX} z ${DZ}, hanging ${hanging.length}, holes ${holes.length}`);
if (hanging.length) console.log("hanging", hanging.slice(0, 10));

g.save(`${DIR}/DC55975.nbt`);
