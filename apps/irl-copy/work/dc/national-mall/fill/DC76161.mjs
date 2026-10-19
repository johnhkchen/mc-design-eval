// DC76161: 777 North Capitol Street NE, a commercial office read from the lidar record. A 15-block core with a
// 13-block podium ringing it (a stepped podium-and-tower), a 10-block three-storey annex on the south-east, and a
// 7-block two-storey wing and a 3-block low wing at the edges. Decided from that shape: a 1960s-70s precast office,
// so pale calcite piers and smooth-stone spandrels in a tinted-glass grid, a polished-granite base course, stone-brick
// cornices and roof decks, and roof plant on the podium and annex terraces. The slope falls to the south, so the
// south faces show their whole ground storey while the north sits on a one-block foundation.
//
// Storeys are 3 blocks on absolute rows: spandrel (y%3==0), two glass rows (y%3 in 1,2). Each cell fills from y 0 to
// its ground as foundation, then its tier from the 3x3 median of the lidar roof (kills single-cell noise). A tier's top
// course is a stone-brick cap that is also the roof deck. A face is exposed at height y when its neighbour is outside
// the footprint or stands lower there, so the tower's walls above the podium are facade, not blank interior.
// Interior cells behind a glass row are air (a floor slab under each storey, the cap above), and a few of them hold
// glowstone for warm light; cells deeper in are solid. The entrance is a dark-oak door on the north face, between
// piers, with glass above, and penthouse plant stands on the tower cap.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC76161.cells.json`, "utf8"));
const SIZE = [23, 27, 22];

const FOUND = "stone", BODY = "stone", BASE = "deepslate_tiles", SPANDREL = "smooth_stone", PIER = "calcite";
const GLASS = "gray_stained_glass_pane", CAP = "stone_bricks", DOOR = "dark_oak_door", LIGHT = "glowstone";
const PLANT = "light_gray_concrete", PENT = "stone_bricks", PENT_CAP = "smooth_stone";

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => raw.has(key(x, z));

// Lidar roof, 3x3 median inside the footprint, then flat tiers: 15 core, 13 podium, 10 annex, 7 wing, 3 low wing.
const tierOf = (v) => (v >= 14 ? 15 : v >= 12 ? 13 : v >= 9 ? 10 : v >= 5 ? 7 : 3);
const medianOf = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(raw.get(key(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
};
const C = new Map();
for (const [x, z, g] of cells) C.set(key(x, z), { x, z, g, T: tierOf(medianOf(x, z)) });
const cell = (x, z) => C.get(key(x, z));
const topAt = (x, z) => (cell(x, z) ? cell(x, z).T : 0);     // outside the footprint is open air from y 0

const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
// Faces of cell c that are open to the air at height y: the neighbour is outside or does not stand at y.
const exposed = (c, y) => DIRS.filter(([, dx, dz]) => topAt(c.x + dx, c.z + dz) <= y).map(([f]) => f);

// Piers every third cell along a face, so the corners and every third bay read as concrete.
const isPier = (c, faces) => faces.some((f) => ((f === "N" || f === "S") ? c.x : c.z) % 3 === 0);
const ENTRY = { x: 10, z: 0 };

// Pass 1: the wall and cap blocks, keyed "x,y,z". Glass and door cells are recorded so rooms can see through them.
const put = new Map();
const at = (x, y, z) => put.get(`${x},${y},${z}`);
const set = (x, y, z, id, state) => put.set(`${x},${y},${z}`, { id, state });
const isOpening = (b) => b && (b.id === GLASS || b.id === DOOR);

for (const c of C.values()) {
  const { x, z, g, T } = c;
  for (let y = 0; y < T; y++) {
    if (y < g) { set(x, y, z, FOUND); continue; }
    if (y === T - 1) { set(x, y, z, CAP); continue; }
    const faces = exposed(c, y);
    if (!faces.length) continue;                                         // interior: solid or room, decided in pass 2
    const pier = isPier(c, faces);
    if (x === ENTRY.x && z === ENTRY.z && y >= g && y <= g + 1 && y < 3) {
      set(x, y, z, DOOR, { facing: "north", half: y === g ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y === g) { set(x, y, z, BASE); continue; }                       // base course above the foundation
    if (y % 3 === 0) { set(x, y, z, pier ? PIER : SPANDREL); continue; }  // storey lines
    set(x, y, z, pier ? PIER : GLASS);
  }
}

// Penthouse plant on the core cap: a 4 x 4 block, two storeys high, with a stone cap.
for (let x = 5; x <= 8; x++) for (let z = 7; z <= 10; z++) {
  set(x, 15, z, PENT); set(x, 16, z, PENT); set(x, 17, z, PENT_CAP);
}
// Roof plant on the podium and annex terraces: boxes standing on the cap, scattered by a fixed pattern.
for (const c of C.values()) {
  if (c.T !== 13 && c.T !== 10) continue;
  if (c.T === 13 && c.x >= 2 && c.x <= 12 && c.z >= 2 && c.z <= 19) continue;   // the tower's own cap is not terrace
  if ((c.x * 5 + c.z * 3) % 11 !== 0) continue;
  set(c.x, c.T, c.z, PLANT);
}

// Pass 2: rooms. An interior cell that sits behind an opening at its height is air at the glass rows (y%3 != 0), with a
// slab under each storey; a few of those rooms hold a glowstone on the floor, warm behind the glass at dusk. Every
// other interior cell from its ground up to its cap is solid.
const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);
const NEXT = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const isRoom = (c, y) => {
  if (y <= c.g || y >= c.T - 1 || y % 3 === 0) return false;
  return NEXT.some(([dx, dz]) => isOpening(at(c.x + dx, y, c.z + dz)));
};
for (const c of C.values()) for (let y = c.g; y < c.T - 1; y++) {
  if (at(c.x, y, c.z) || exposed(c, y).length) continue;
  if (isRoom(c, y)) {
    if (y % 3 === 1 && hash(c.x, y, c.z) % 4 === 0) set(c.x, y, c.z, LIGHT);
  } else set(c.x, y, c.z, BODY);
}

// Pane connections: a glass pane joins its neighbours that are panes or solid blocks (not doors, not air).
const solid = (b) => b && b.id !== DOOR && !b.id.endsWith("_pane");
const connect = (x, y, z, dx, dz) => {
  const b = at(x + dx, y, z + dz);
  return b && (b.id === GLASS || solid(b)) ? "true" : "false";
};

const vox = new Voxels(SIZE);
for (const [k, b] of put) {
  const [x, y, z] = k.split(",").map(Number);
  if (b.id === GLASS) {
    vox.set(x, y, z, GLASS, { north: connect(x, y, z, 0, -1), south: connect(x, y, z, 0, 1), east: connect(x, y, z, 1, 0), west: connect(x, y, z, -1, 0), waterlogged: "false" });
  } else vox.set(x, y, z, b.id, b.state);
}

const out = `${DIR}/DC76161.nbt`;
const r = vox.save(out);
console.log(`wrote ${out}: ${r.blocks} blocks, palette ${r.palette}`);
