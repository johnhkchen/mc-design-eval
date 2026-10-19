// DC70926: 600 E St NW, a 1920s-style brick apartment block with a limestone base, string courses and cornice.
// Massing follows the lidar roof: wings at 16, the main body at 18, and a lift-core penthouse at 19. The roof record is
// smoothed with a 3x3 median first, so single noisy cells do not become stray columns.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${dir}/DC70926.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, , r] of cells) raw.set(key(x, z), r);
const inFP = (x, z) => raw.has(key(x, z));

// Roof tiers: 3x3 median of the lidar roof within the footprint, then top row T = H - 1 and deck row D = T - 1.
const T = new Map();
for (const [kk] of raw) {
  const [x, z] = kk.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFP(x + dx, z + dz)) vals.push(raw.get(key(x + dx, z + dz)));
  vals.sort((a, b) => a - b);
  T.set(kk, vals[Math.floor(vals.length / 2)] - 1);
}
const top = (x, z) => (inFP(x, z) ? T.get(key(x, z)) : -1);
const deck = (x, z) => top(x, z) - 1;
const isBump = (x, z) => top(x, z) >= 18;

const W = 30, L = 21;
const g = new Voxels([W, 31, L]);
const occ = new Map();                                    // "x,y,z" -> block, so pane connections can be read back
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); occ.set(`${x},${y},${z}`, block); };
const has = (x, y, z) => occ.has(`${x},${y},${z}`);

const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
// The open side of a wall cell at height y: outside the footprint first, else a neighbour standing lower than y.
function exposure(x, z, y) {
  for (const [n, dx, dz] of DIRS) if (!inFP(x + dx, z + dz)) return n;
  for (const [n, dx, dz] of DIRS) if (top(x + dx, z + dz) < y) return n;
  return null;
}
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// Entrance: a door on the north face in the middle of the lower wing, a stone step, surround and lantern-lit vestibule.
const DOOR_X = 14;
const panes = [];                                          // glass cells with the face they sit in
const glowAt = [];

// Foundation and plinth: solid from y 0 up to the storey line at y 2 under every cell, so the base is level.
for (const [kk] of raw) {
  const [x, z] = kk.split(",").map(Number);
  for (let y = 0; y <= 1; y++) put(x, y, z, "stone_bricks");
}

for (const [kk] of raw) {
  const [x, z] = kk.split(",").map(Number);
  const t = top(x, z), d = deck(x, z);
  for (let y = 2; y <= t; y++) {
    const face = exposure(x, z, y);
    if (face) {
      // Entrance on the north face.
      if (face === "N" && z === 0 && Math.abs(x - DOOR_X) <= 2 && y <= 4) {
        if (x === DOOR_X && y === 2) { put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
        if (x === DOOR_X && y === 3) { put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
        if (y === 4) { put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }
        put(x, y, z, "calcite"); continue;
      }
      const rel = (y - 2) % 3;
      if (y === t || y === d || rel === 0) { put(x, y, z, "calcite"); continue; }   // cornice, deck ledge, string course
      const u = face === "N" || face === "S" ? x : z;
      const bay = ((u % 4) + 4) % 4;
      if (bay === 0) put(x, y, z, "bricks");
      else if (bay === 1) put(x, y, z, "white_concrete");
      else {
        put(x, y, z, "glass_pane");
        panes.push({ x, y, z, face });
        if (rel === 1 && (x + y + z) % 8 === 0) glowAt.push({ face, x, y, z });
      }
      continue;
    }
    // Interior: a floor slab per storey, the roof deck, and a solid lift core under the penthouse. The rest is air.
    if (isBump(x, z) && y >= 14 && y <= d) put(x, y, z, "stone_bricks");
    else if (y === d) put(x, y, z, "polished_blackstone");
    else if ((y - 2) % 3 === 0) put(x, y, z, "smooth_stone");
  }
}

// Stone steps in front of the door: a stair course on the plinth, rising into the entrance.
for (const x of [DOOR_X - 1, DOOR_X, DOOR_X + 1])
  put(x, 1, 0, "stone_brick_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });

// Warm light: glowstone just inside some window panes; lanterns hang in the vestibule.
for (const { face, x, y, z } of glowAt) {
  const [dx, dz] = inward[face];
  const ix = x + dx, iz = z + dz;
  if (inFP(ix, iz) && !exposure(ix, iz, y) && !has(ix, y, iz)) put(ix, y, iz, "glowstone");
}
for (const x of [DOOR_X - 1, DOOR_X + 1]) put(x, 4, 1, "lantern", { hanging: "true", waterlogged: "false" });

// Roof plant on the 18-tier roof: three small boxes set back from the walls.
for (const [x0, z0] of [[7, 6], [19, 9], [10, 12]])
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    const x = x0 + dx, z = z0 + dz;
    if (inFP(x, z) && top(x, z) === 17 && !exposure(x, z, 18)) put(x, 18, z, "gray_concrete");
  }

// Glass panes connect along their own wall only, to any solid neighbour (vanilla pane rules, as far as a wall reads).
for (const { x, y, z, face } of panes) {
  const [dx, dz] = face === "N" || face === "S" ? [1, 0] : [0, 1];
  const a = has(x + dx, y, z + dz), b = has(x - dx, y, z - dz);
  const state = face === "N" || face === "S"
    ? { east: String(a), west: String(b), north: "false", south: "false" }
    : { north: String(b), south: String(a), east: "false", west: "false" };
  put(x, y, z, "glass_pane", { ...state, waterlogged: "false" });
}

const out = `${dir}/DC70926.nbt`;
const info = g.save(out);
console.log(`wrote ${out}: ${info.blocks} blocks, ${info.palette} palette entries`);
