import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499599";
const W = 60, H = 24, D = 23;

// ---- read footprint -------------------------------------------------------
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = new Map();
for (const c of raw) {
  const [x, z, g, r] = Array.isArray(c) ? c : [c.x, c.z, c.ground, c.roof];
  cells.set(`${x},${z}`, { x, z, g: Math.round(g), r: Number(r) });
}
const has = (x, z) => cells.has(`${x},${z}`);

// ---- smoothed roof tiers --------------------------------------------------
// Average the lidar roof over a 5x5 neighbourhood, then quantise to 3-block
// tiers so the massing reads as a few flat setbacks instead of lidar noise.
const topMap = new Map();
for (const c of cells.values()) {
  let sum = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const q = cells.get(`${c.x + dx},${c.z + dz}`);
    if (q) { sum += q.r; n++; }
  }
  const avg = sum / n;
  let t = Math.round(avg / 3) * 3;
  t = Math.max(c.g + 11, t);
  t = Math.min(H - 2, t);
  topMap.set(`${c.x},${c.z}`, t);
}
const topOf = (c) => topMap.get(`${c.x},${c.z}`);

// ---- facade helpers -------------------------------------------------------
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push({ name: "north", dx: 0, dz: -1, axis: "x" });
  if (!has(x, z + 1)) f.push({ name: "south", dx: 0, dz: 1, axis: "x" });
  if (!has(x - 1, z)) f.push({ name: "west", dx: -1, dz: 0, axis: "z" });
  if (!has(x + 1, z)) f.push({ name: "east", dx: 1, dz: 0, axis: "z" });
  return f;
}
const isPer = (x, z) => faces(x, z).length > 0;
const nearPer = (x, z) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => has(x + a, z + b) && isPer(x + a, z + b));

// Entrance: middle exterior cell of the south (max z) face
const maxZ = Math.max(...[...cells.values()].map((q) => q.z));
const southXs = [...cells.values()].filter((c) => c.z === maxZ && isPer(c.x, c.z)).map((c) => c.x).sort((a, b) => a - b);
const doorX = southXs.length ? southXs[Math.floor(southXs.length / 2)] : -1;

const g3 = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g3.set(x, y, z, id, props); else g3.set(x, y, z, id);
};

// ---- build ----------------------------------------------------------------
for (const c of cells.values()) {
  const { x, z, g } = c;
  const top = topOf(c);

  // foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < g; y++) put(x, y, z, "stone");

  if (isPer(x, z)) {
    const fs = faces(x, z);
    const corner = fs.length > 1;
    const face = fs[0];
    const idxAlong = face ? (face.axis === "x" ? x : z) : 0;

    // wall column: plinth, stone bricks, string courses at storey lines
    for (let y = g; y <= top - 1; y++) {
      let id = "stone_bricks";
      if (y === g) id = "stone";
      else if (y === g + 5 || y === g + 10) id = "chiseled_stone_bricks";
      put(x, y, z, id);
    }
    // pilasters: every 6th face cell is a stone column, plus all corners
    const pilaster = corner || (face && idxAlong % 6 === 0);
    if (pilaster) {
      for (let y = g + 1; y <= top - 2; y++) put(x, y, z, "polished_andesite");
    }
    // cornice / parapet cap
    put(x, top, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

    if (face && !corner && !pilaster) {
      const isDoorCell = face.name === "south" && x === doorX;
      const surround = face.name === "south" && Math.abs(x - doorX) === 1;

      if (isDoorCell) {
        // entrance: oak door under a stone lintel, framed by chiseled jambs
        put(x, g + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        put(x, g + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        put(x, g + 3, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
        put(x, g + 4, z, "chiseled_stone_bricks");
      } else if (surround) {
        put(x, g + 1, z, "chiseled_stone_bricks");
        put(x, g + 2, z, "chiseled_stone_bricks");
        put(x, g + 3, z, "chiseled_stone_bricks");
      } else {
        const winCol = idxAlong % 3 === 1;
        if (winCol) {
          const paneProps = face.axis === "x"
            ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
            : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
          for (const [sill, p1, p2, lintel] of [[g + 1, g + 2, g + 3, g + 4], [g + 6, g + 7, g + 8, g + 9]]) {
            put(x, sill, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
            put(x, p1, z, "glass_pane", paneProps);
            put(x, p2, z, "glass_pane", paneProps);
            put(x, lintel, z, "stone_bricks");
          }
          // warm light behind some windows, in the air gap
          const ix = x - face.dx, iz = z - face.dz;
          if (has(ix, iz) && !isPer(ix, iz)) {
            if (idxAlong % 6 === 1) put(ix, g + 2, iz, "glowstone");
            if (idxAlong % 6 === 4) put(ix, g + 7, iz, "glowstone");
          }
        }
      }
    }

    // deck under the parapet
    put(x, top - 1, z, "stone_bricks");
    continue;
  }

  if (nearPer(x, z)) {
    // ring: air pockets behind the windows, floors and roof solid
    put(x, g + 5, z, "stone_bricks");
    put(x, top - 1, z, "deepslate_tiles");
    continue;
  }

  // deep interior: solid to the roof
  for (let y = g; y <= top - 1; y++) put(x, y, z, "stone_bricks");
  put(x, top - 1, z, "deepslate_tiles");
}

// ---- rooftop chimney stacks (supported by the solid deep interior) -------
for (const c of cells.values()) {
  const { x, z } = c;
  if (isPer(x, z) || nearPer(x, z)) continue;
  if (x % 11 === 5 && z % 7 === 3) {
    const top = topOf(c);
    put(x, top, z, "stone_bricks");
    put(x, top + 1, z, "stone_brick_wall");
  }
}

g3.save(`${DIR}/${ID}.nbt`);
