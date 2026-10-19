// DC66804: 1 Columbus Circle SE, a Commercial-Office-Large read from the lidar record. Most of the 31 x 52 footprint
// rises 10 to 14 blocks above its ground, with two small 19-block towers and a paved court where the roof sits on the
// ground. Chosen for the record: a 1920s Commercial Classical office in red brick with limestone piers and head bands,
// a dark stone base course, plate glass across the ground storey as shopfronts, and a bronze-framed entrance on the north face.
//
// Storeys sit on an absolute 4-block rhythm from y 3 (a ground storey below it), so every tier top is a head course and
// neighbouring tiers line up. Each column fills from y 0 to its ground, then its storeys up to its tier top, capped by a
// stone parapet on the open edge; the court is paved at ground level. A cell with an open face (to the outside or to a
// lower neighbour) carries the facade: piers in calcite, glass bays, brick spandrels. An interior cell one step behind a
// glass bay is air at the glass rows, with a floor and a ceiling per storey, and a glowstone or lantern standing on the floor
// in some of them. Everything else is solid, so nothing hangs in the air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC66804.cells.json`, "utf8"));
const W = 31, H = 22, D = 52;

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];

// Court: where the lidar roof is within 2 blocks of the ground, there is no building, only paving at ground level.
const isCourt = (c) => c.r - c.g <= 2;
const isBuilding = (x, z) => raw.has(key(x, z)) && !isCourt(raw.get(key(x, z)));

// Tier: the median of the lidar roof over building cells (kills single-cell noise), quantised to three flat tops.
// Head courses fall on the 4-block rhythm, so the tops are 11 (two storeys), 15 (three) and 19 (four). A 19 needs a
// 5x5 patch that is that tall: the two-cell spikes in the lidar read as antennae, not towers.
const medianOf = (x, z, R) => {
  const v = [];
  for (let dx = -R; dx <= R; dx++) for (let dz = -R; dz <= R; dz++) if (isBuilding(x + dx, z + dz)) v.push(raw.get(key(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
};
const tierOf = (x, z) => {
  const m = medianOf(x, z, 1);
  if (m <= 11) return 11;
  if (m <= 14) return 15;
  return medianOf(x, z, 2) >= 15 ? 19 : 15;
};

const info = new Map();
for (const c of raw.values()) {
  const court = isCourt(c);
  info.set(key(c.x, c.z), {
    ...c, court, T: court ? c.g : tierOf(c.x, c.z),
    door: c.x === 18 && c.z === 0,                                     // entrance on the north face, mid-face
    surround: c.z === 0 && (c.x === 17 || c.x === 19),                 // calcite jambs either side, lanterns above
  });
}
const at = (x, z) => info.get(key(x, z));

// The faces of a cell that look onto air at row y: outside the footprint, or onto a neighbour whose top is at or below y.
const exposed = (c, y) => DIRS.filter(([, dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.T <= y; }).map(([f]) => f);
// A face on a column that is a multiple of 3 (north and south faces) or a row (east and west faces) is a pier.
const onPier = (f, c) => ((f === "N" || f === "S") ? c.x : c.z) % 3 === 0;
// Wall kind at row y: inner (no open face), pier (limestone pilaster), or bay (glazed).
const wallAt = (c, y) => {
  const fs = exposed(c, y);
  if (!fs.length) return "inner";
  return fs.every((f) => onPier(f, c)) ? "pier" : "bay";
};
// Row kind on the storey rhythm: base course, ground-floor glass, or from y 3 a floor spandrel, two glass rows and a head.
const kindOf = (y, G) => {
  if (y < G) return "found";
  if (y === G) return "base";
  if (y < 3) return "glass";
  const r = (y - 3) % 4;
  return r === 0 ? "spand" : r === 3 ? "head" : "glass";
};
// Interior cell at a glass row, one step behind a bay: air (or a lamp standing on the floor).
const isRoom = (c, y) => {
  if (c.T <= y || wallAt(c, y) !== "inner") return false;
  return DIRS.some(([, dx, dz]) => { const n = at(c.x + dx, c.z + dz); return n && n.T > y && wallAt(n, y) === "bay"; });
};
const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);

// The block for one cell at height y: [id, state] or null for air.
const blockAt = (c, y) => {
  const { x, z, g: G, T } = c;
  if (c.court) return y === G - 1 ? ["smooth_stone"] : y < G - 1 ? ["stone"] : null;
  if (y < G) return ["stone"];
  if (y === T) {
    if (exposed(c, T - 1).length) return ["stone_brick_wall"];        // parapet on the open edge
    return hash(x, y, z) % 41 === 0 ? ["iron_block"] : null;           // roof plant on the deck, now and then
  }
  if (y > T) return null;
  const kind = kindOf(y, G);
  if (c.door && (y === G || y === G + 1)) return ["iron_door", { facing: "north", half: y === G ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  if (c.surround && y === 3) return ["lantern", { hanging: "false", waterlogged: "false" }];
  if (kind === "base") return [wallAt(c, y) === "inner" ? "stone" : "stone_bricks"];
  if (kind === "glass") {
    if (c.surround) return ["calcite"];
    const w = wallAt(c, y);
    if (w === "pier") return ["calcite"];
    if (w === "bay") return ["glass_pane"];                              // connections are set on save
    if (isRoom(c, y)) {
      const h = hash(x, y, z) % 7;
      if (h === 0) return ["glowstone"];
      if (h === 1) return ["lantern", { hanging: "false", waterlogged: "false" }];
      return null;
    }
    return ["bricks"];
  }
  if (kind === "spand") return [wallAt(c, y) === "pier" ? "calcite" : "bricks"];
  if (kind === "head") {
    const w = wallAt(c, y);
    if (w === "pier") return ["calcite"];
    if (w === "bay") return ["smooth_stone"];                            // limestone head band on the open face
    return [y === T - 1 ? "stone" : "bricks"];                            // roof deck, or interior brick
  }
  return ["bricks"];
};

// Lay everything out first, so panes can see what they touch.
const placed = new Map();
for (const c of info.values()) for (let y = 0; y < H; y++) {
  const b = blockAt(c, y);
  if (b) placed.set(`${c.x},${y},${c.z}`, b);
}
if (!placed.has(`18,1,0`) || placed.get("18,1,0")[0] !== "iron_door") throw new Error("entrance cell is not a building door");

// A pane joins a neighbour that is another pane or any solid block, on each of the four horizontal sides.
const paneState = (x, y, z) => {
  const joins = (dx, dz) => { const n = placed.get(`${x + dx},${y},${z + dz}`); return !!n && n[0] !== "iron_door" && n[0] !== "lantern" && n[0] !== "glowstone"; };
  return { north: joins(0, -1), south: joins(0, 1), west: joins(-1, 0), east: joins(1, 0), waterlogged: false };
};

const g = new Voxels([W, H, D]);
for (const [k, [block, state]] of placed) {
  const [x, y, z] = k.split(",").map(Number);
  if (block === "glass_pane") g.set(x, y, z, block, paneState(x, y, z));
  else g.set(x, y, z, block, state);
}
const { blocks, palette } = g.save(`${DIR}/DC66804.nbt`);
console.log(`DC66804.nbt: ${blocks} blocks, ${palette} palette entries`);
