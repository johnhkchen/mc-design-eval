// 503 Madison Avenue, 1929: a Midtown office tower in the setback manner. A granite base to y 8 (three storeys of
// shopfront and banking hall), then cream limestone spandrels between quartz piers, a yellow-terracotta crown on the
// tallest block, dark roof covering with granite cornices and quartz parapets. Madison frontage is the east face (x 18):
// a dark-oak entrance under a black canopy. Windows are glass panes in quartz frames, one block out from air and a solid
// core, with a floor slab in each storey; some glow. The lidar roof is read as clean flat tiers, and the open court
// to the north (the forecourt, lidar 0) is paved at ground level.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035711.cells.json`, "utf8"));
const X = 19, Y = 119, Z = 28;

const foot = new Set(cells.map(([x, z]) => `${x},${z}`));
const inFoot = (x, z) => foot.has(`${x},${z}`);

// Roof tiers (block heights above y 0), smoothed from the lidar roof per cell.
const tierOf = (x, z) => {
  if (z === 27) return 44;                                          // low pavilion at the south-east corner
  if (x <= 1) return 50;                                            // west wing, two cells wide
  if (x === 3 && z <= 1) return 0;                                  // court corner, open
  if (x === 2 || x === 3) return z <= 24 ? 58 : 56;
  if (x >= 4 && x <= 6 && z <= 10) return 0;                        // forecourt, open to the street
  if (x >= 4 && x <= 6) return z === 11 ? 64 : z <= 22 ? (x === 4 ? 62 : 68) : z <= 24 ? 61 : 56;
  if (z <= 12) return x === 7 ? 99 : (x >= 10 && x <= 15 && z >= 2 && z <= 7) ? 106 : 104;   // tower, crown centred
  if (z === 13) return x >= 9 ? 96 : 75;                            // setback terrace
  if (z <= 22) return x >= 9 && z <= 19 ? 82 : 74;
  if (z <= 24) return x <= 8 ? 61 : 64;
  return 56;
};

const top = new Map(cells.map(([x, z]) => [`${x},${z}`, tierOf(x, z)]));
const topAt = (x, z) => top.get(`${x},${z}`) ?? 0;
const solid = (x, y, z) => y >= 0 && y < topAt(x, z);
const DIRS = { E: [1, 0], W: [-1, 0], N: [0, -1], S: [0, 1] };
const exposed = (x, y, z) => Object.keys(DIRS).filter((d) => !solid(x + DIRS[d][0], y, z + DIRS[d][1]));

// Storey rows: a granite or limestone sill at 3s, glass at 3s+1 (storey 0 glazes rows 1-2 as shopfront), a head at 3s+2.
const winRow = (y) => y === 1 || y === 2 || (y >= 4 && y % 3 === 1);
const lit = (x, y, z) => (x * 5 + y * 7 + z * 3) % 11 === 0;   // sparse, deterministic warm windows

const out = new Map();                                          // "x,y,z" -> [block, state]
const put = (x, y, z, block, state) => out.set(`${x},${y},${z}`, [block, state]);
const windows = [];

for (const key of top.keys()) {
  const [x, z] = key.split(",").map(Number);
  const t = topAt(x, z);
  if (!t) { put(x, 0, z, "smooth_stone"); continue; }             // open ground, paved
  for (let y = 0; y < t; y++) {
    const ex = exposed(x, y, z);
    if (y === t - 1) { put(x, y, z, ex.length ? "polished_granite" : "polished_blackstone"); continue; }   // cornice or roof
    if (!ex.length) { put(x, y, z, "stone"); continue; }          // core
    const d = ex.find((e) => e === "E" || e === "W") ?? ex[0];   // facade: the avenue faces first
    const [ax, az] = d === "E" || d === "W" ? [0, 1] : [1, 0];   // along the face
    const corner = ex.length > 1 || !solid(x + ax, y, z + az) || !solid(x - ax, y, z - az);
    const u = az ? z : x;                                         // position along the face
    if (winRow(y) && !corner && (y <= 2 || u % 3 !== 0)) { windows.push({ x, y, z, d }); continue; }
    if (y < 9) put(x, y, z, "polished_granite");                  // base course
    else if (winRow(y)) put(x, y, z, t >= 104 && y >= 96 ? "yellow_terracotta" : "quartz_pillar");   // piers
    else put(x, y, z, "smooth_quartz");                           // spandrels
  }
}

// Parapets on the roof edge.
for (const key of top.keys()) {
  const [x, z] = key.split(",").map(Number);
  const t = topAt(x, z);
  if (t && exposed(x, t - 1, z).length) put(x, t, z, "smooth_quartz");
}

// Glass: panes connect to the solid frame along the face; the cell behind a window is air, or a warm lamp, and the
// floor slab and head stay solid (they were left as core).
for (const { x, y, z, d } of windows) {
  const along = d === "E" || d === "W";
  const conn = (a, b) => (solid(x + a, y, z + b) ? "true" : "false");
  const pane = along
    ? { east: "false", west: "false", north: conn(0, -1), south: conn(0, 1) }
    : { north: "false", south: "false", east: conn(1, 0), west: conn(-1, 0) };
  if (y <= 2) put(x, y, z, "glass");
  else put(x, y, z, "glass_pane", { ...pane, waterlogged: "false" });
  const [dx, dz] = DIRS[d];
  const [ix, iz] = [x - dx, z - dz];
  if (inFoot(ix, iz) && y < topAt(ix, iz) && !exposed(ix, y, iz).length) {
    if (lit(x, y, z)) put(ix, y, iz, "glowstone");
    else out.delete(`${ix},${y},${iz}`);
  }
}

// Madison entrance: a dark-oak door in a granite surround, a vestibule behind, a black canopy over it.
for (const y of [1, 2]) {
  put(18, y, 15, "dark_oak_door", { facing: "east", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
  put(18, y, 14, "polished_granite");
  put(18, y, 16, "polished_granite");
  out.delete(`17,${y},15`);
}
for (let z = 14; z <= 16; z++) put(18, 3, z, "black_concrete");

// Roof plant: a timber water tank on the tower roof, a penthouse box on the 82 tier.
for (let x = 16; x <= 17; x++) for (let z = 2; z <= 3; z++) {
  for (let y = 104; y <= 106; y++) put(x, y, z, "spruce_planks");
  put(x, 107, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}
for (let x = 12; x <= 14; x++) for (let z = 15; z <= 17; z++) for (let y = 82; y <= 84; y++) {
  put(x, y, z, y === 84 ? "polished_blackstone" : "light_gray_concrete");
}

const g = new Voxels([X, Y, Z]);
for (const [key, [block, state]] of out) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const { blocks, palette } = g.save(`${DIR}/NYC1035711.nbt`);
console.log(`NYC1035711.nbt: ${blocks} blocks, ${palette} palette entries, ${windows.length} window cells`);
