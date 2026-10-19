// DC69279: a 1960s brick-and-concrete apartment block in Southwest DC, read from the lidar record. Two long slabs
// (a four-storey south range at 12 blocks, a 15-block tower core on its east third) joined by a narrow north-south
// spine, with a two-block podium across the north range, a one-storey pavilion on the west, and a plaza strip at grade.
// Red brick walls with pier bays, white precast spandrels, a stone-brick base course, glass in each bay, one
// iron-doored entrance on the south face, and roof plant on the tower and the south range.
//
// Storeys sit on one absolute 3-block rhythm (spandrel at y % 3 == 0, glass rows above it), so neighbouring columns
// line up where the ground steps. Each column fills from y 0 to its ground as foundation, then its storeys up to its
// lidar tier, capped by a solid parapet. Interior cells one step behind a glass bay are air at the glass rows, with a
// floor slab per storey and a lamp standing on the floor where the glass shows it; cells deeper inside are solid
// slab only (no rooms), so nothing floats and no storey stands on air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC69279.cells.json`, "utf8"));
const W = 72, D = 28, H = 18;

const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => byXZ.has(key(x, z));
const FACES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];

// Lidar roof, snapped to flat building tiers (solid to T-1, cap at T-1): 3-block storeys over a 2-block parapet
// give T = 5, 8, 11 or 14 (1 to 4 storeys). A building cell under 4 blocks above ground is a podium, not a building.
const TIERS = [5, 8, 11, 14];
const tierOf = (r) => TIERS.reduce((best, t) => (Math.abs(t - r) < Math.abs(best - r) ? t : best));

const info = new Map();
for (const [x, z, g, r] of cells) {
  const H_ = r - g;
  const kind = H_ <= 1 ? "plaza" : H_ <= 3 ? "podium" : "building";
  const T = kind === "building" ? tierOf(r) : r;
  info.set(key(x, z), { x, z, g, r, kind, T });
}
const at = (x, z) => info.get(key(x, z));

// A face is exposed where the neighbour is off the footprint or stands lower (a setback or a podium beside it).
const exposed = (c, dx, dz) => { const n = at(c.x + dx, c.z + dz); return !n || n.T < c.T; };
for (const c of info.values()) {
  c.faces = c.kind === "building" ? FACES.filter(([, dx, dz]) => exposed(c, dx, dz)).map(([f]) => f) : [];
  c.shell = c.faces.length > 0;
}
// Piers every third cell along each face (by x on the north and south faces, by z on the east and west).
const isPier = (c) => c.faces.some((f) => ((f === "N" || f === "S") ? c.x : c.z) % 3 === 0);
const isBay = (x, z) => { const c = at(x, z); return !!c && c.shell && !isPier(c) && c.x !== ENTRY.x; };

const ENTRY = { x: 30, z: 27 };       // the south-face entrance on the south range
for (const c of info.values()) {
  c.room = !c.shell && c.kind === "building" && [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => isBay(c.x + dx, c.z + dz));
}

const FOUND = "stone_bricks", FLOOR = "smooth_stone", BASE = "stone_bricks", BRICK = "bricks", SPANDREL = "white_concrete";
const GLASS = "light_blue_stained_glass", LIT = "glowstone", ROOF = "stone", PARAPET = "stone_bricks", PLANT = "light_gray_concrete";
const DOOR = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
const LANTERN = { hanging: "false", waterlogged: "false" };
const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);
const onMech = (c, y) => c.kind === "building" && c.T === 14 && (c.x === 30 || c.x === 31) && (c.z === 21 || c.z === 22) && (y === 14 || y === 15);
const onPlant = (c, y) => c.kind === "building" && c.T === 11 && (c.x === 10 || c.x === 11) && (c.z === 23 || c.z === 24) && (y === 11 || y === 12);

// The block for one cell at height y: [id, state] or null for air.
const blockAt = (c, y) => {
  const { x, z, g, T } = c;
  if (y < g) return [FOUND];
  if (c.kind === "plaza") return y === g ? [FLOOR] : null;
  if (y >= T) return onMech(c, y) || onPlant(c, y) ? [PLANT] : null;
  if (c.kind === "podium") return y === T - 1 ? [FLOOR] : [BASE];       // podium solid to its terrace
  if (c.shell) {
    if (y >= T - 2) return [PARAPET];                                   // parapet course over the roof deck, and cap
    if (y === 0) return [BASE];
  }
  const spandrel = y % 3 === 0;                                         // floor line on the storey rhythm
  if (ENTRY.x === x && ENTRY.z === z && c.shell) {
    if (y === g) return ["iron_door", DOOR("lower")];
    if (y === g + 1) return ["iron_door", DOOR("upper")];
    if (y === g + 2) return [BRICK];
  }
  if (!c.shell) {
    if (spandrel) return [FLOOR];                                       // floor slab and ceiling per storey
    if (c.room && y % 3 === 1 && hash(x, y, z) % 9 === 0) return ["lantern", LANTERN];
    return null;                                                        // air behind the glass
  }
  if (spandrel) return [SPANDREL];
  if (isPier(c)) return [BRICK];                                        // brick pier between bays
  const lit = hash(x, y, z) % 29 === 0;
  return [lit ? LIT : GLASS];
};

const vox = new Voxels([W, H, D]);
for (const c of info.values()) {
  for (let y = 0; y < H; y++) {
    const b = blockAt(c, y);
    if (b) vox.set(c.x, y, c.z, ...b);
  }
}
// Roof deck: the building's top layer under the parapet is solid, so the roof stands on the storey below.
for (const c of info.values()) {
  if (c.kind === "building" && !c.shell) vox.set(c.x, c.T - 2, c.z, ROOF);
}

const out = `${DIR}/DC69279.nbt`;
const s = vox.save(out);
console.log(`wrote ${out}: ${s.blocks} blocks, ${s.palette} palette entries`);
