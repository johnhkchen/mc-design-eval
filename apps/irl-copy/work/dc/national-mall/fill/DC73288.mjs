// DC73288: 1111 Constitution Avenue NW, a 1930s Stripped-Classical limestone office in the Federal Triangle manner: a
// large perimeter block with four open light courts on its south half, the lidar roof at 13, 16 and 17 blocks, the
// highest mass in the centre. Limestone walls (smooth stone spandrels, calcite piers), a stone-brick base course on the
// ground storey, glass in each storey, a bronze-doored entrance pavilion on the south face and a side door on the west
// face under stone hoods, and roof plant on the 16-block deck.
//
// Storeys sit on absolute 4-block rhythms (spandrel, two glass rows, head spandrel), so neighbouring columns line up
// where the ground steps. Each column fills from y 0 to its ground as foundation, then its storeys up to its lidar tier,
// capped by a parapet and a cornice course on the facade. Interior cells one step behind a glass bay are air at the glass
// rows, with a floor slab and ceiling per storey and a lamp standing on the floor where the glass shows it; cells deeper
// inside are solid.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC73288.cells.json`, "utf8"));
const SIZE = [65, 29, 95];

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => raw.has(key(x, z));
const FACES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const faces = (x, z) => FACES.filter(([, dx, dz]) => !inside(x + dx, z + dz)).map(([f]) => f);

// Lidar roof: median of the 3x3 footprint neighbourhood (kills single-cell noise), then four flat tiers:
// 4 for the one-storey edges, 13 for the three-storey wings, 16 for the four-storey mass, 17 for the central crown.
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(raw.get(key(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
};
const snap = (s) => (s <= 3 ? 4 : s <= 14 ? 13 : s <= 16 ? 16 : 17);

// Piers every third cell along each face (by x on the north and south faces, by z on the east and west).
const isPier = (x, z, fs) => fs.some((f) => ((f === "N" || f === "S") ? x : z) % 3 === 0);

// Entrances: the pavilion on the long south face, and a side door on the west face. Each has a stone hood over it.
const westmost = (z) => Math.min(...cells.filter(([, cz]) => cz === z).map(([x]) => x));
const DOORS = [
  { x: 33, z: 94, facing: "south", hood: [[32, 94], [33, 94], [34, 94]] },
  { x: westmost(80), z: 80, facing: "west", hood: [79, 80, 81].map((z) => [westmost(z), z]) },
];

const info = new Map();
for (const [x, z, G] of cells) {
  const fs = faces(x, z);
  info.set(key(x, z), { x, z, g: G, T: snap(median(x, z)), facade: fs.length > 0, pier: fs.length > 0 && isPier(x, z, fs), door: false, hood: false, facing: null });
}
for (const d of DOORS) {
  const c = info.get(key(d.x, d.z));
  if (!c) throw new Error(`no footprint cell for the door at ${d.x},${d.z}`);
  c.door = true; c.pier = false; c.facing = d.facing;
  for (const [hx, hz] of d.hood) {
    const h = info.get(key(hx, hz));
    if (!h) throw new Error(`no footprint cell for the hood at ${hx},${hz}`);
    h.hood = true; h.pier = false; h.facing = d.facing;
  }
}

const at = (x, z) => info.get(key(x, z));
// A bay is a glass facade cell (not pier, door or hood); a room is an interior cell one step behind a bay.
const isBay = (x, z) => { const c = at(x, z); return !!c && c.facade && !c.pier && !c.door && !c.hood; };
for (const c of info.values()) {
  c.room = !c.facade && FACES.some(([, dx, dz]) => isBay(c.x + dx, c.z + dz));
  // Roof plant: 2x2 boxes on a grid on the interior of the 16- and 17-block tiers, set off the glass by two cells.
  c.plant = !c.facade && !c.room && c.T >= 16 && (c.x % 8 === 3 || c.x % 8 === 4) && (c.z % 8 === 3 || c.z % 8 === 4);
}

const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);
const DOOR = (facing, half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
const LANTERN = { hanging: "false", waterlogged: "false" };

// The lamp in a room cell at rel 1 (standing on the floor slab below), or null.
const lampAt = (c, y) => {
  const h = hash(c.x, y, c.z) % 14;
  if (h === 0) return ["lantern", LANTERN];
  if (h === 1) return ["shroomlight"];
  if (h === 2) return ["glowstone"];
  return null;
};

// The block for one cell at height y: [id, state] or null for air.
const blockAt = (c, y) => {
  const { x, z, g: G, T } = c;
  if (y < G) return [c.facade ? "stone_bricks" : "stone"];           // foundation: the plinth, so nothing floats on a slope
  if (c.door && y === G) return ["iron_door", DOOR(c.facing, "lower")];
  if (c.door && y === G + 1) return ["iron_door", DOOR(c.facing, "upper")];
  if (c.hood && y === G + 2) return ["stone_brick_stairs", { facing: c.facing, half: "top", shape: "straight", waterlogged: "false" }];
  if (c.hood && y === G + 3) return ["smooth_stone"];                // solid header, so the hood is held from above
  if (c.facade && y === T) return ["smooth_stone_slab", { type: "bottom", waterlogged: "false" }];   // cornice course
  if (y === T - 1) return ["smooth_stone"];                           // parapet course and roof deck
  if (y >= T) {                                                        // above the roof: plant on the interior, else air
    if (c.plant && y <= T + 1) return ["stone_bricks"];
    if (c.plant && y === T + 2) return ["stone_brick_slab", { type: "bottom", waterlogged: "false" }];
    return null;
  }
  const rel = y % 4;
  if (c.facade) {
    if (c.pier) return ["calcite"];                                    // full-height limestone piers
    if (rel === 0 || rel === 3) return [y < 4 ? "stone_bricks" : "smooth_stone"];   // spandrels; the base course on the ground storey
    return ["glass_pane"];
  }
  if (rel === 0 || rel === 3) return ["smooth_stone"];                // floor slab and ceiling
  if (!c.room) return ["smooth_stone"];
  if (rel === 1) return lampAt(c, y);                                 // a lamp needs a floor under it
  return null;                                                        // air behind the glass
};

// Glass panes join the neighbours that solid or pane blocks sit in: that's what makes a continuous window band.
const PANE_LINK = new Set(["glass_pane", "calcite", "stone", "smooth_stone", "stone_bricks"]);
const linked = (x, z, y) => {
  const n = at(x, z);
  const b = n && blockAt(n, y);
  return !!b && PANE_LINK.has(b[0]);
};
const paneState = (c, y) => ({
  north: linked(c.x, c.z - 1, y), south: linked(c.x, c.z + 1, y),
  east: linked(c.x + 1, c.z, y), west: linked(c.x - 1, c.z, y), waterlogged: "false",
});

const g = new Voxels(SIZE);
for (const c of info.values()) {
  for (let y = 0; y < SIZE[1]; y++) {
    const b = blockAt(c, y);
    if (!b) continue;
    const [id, state] = b;
    g.set(c.x, y, c.z, id, id === "glass_pane" ? paneState(c, y) : state);
  }
}

const out = `${DIR}/DC73288.nbt`;
const { blocks, palette } = g.save(out);
console.log(`wrote ${out}: ${blocks} blocks, palette ${palette}`);
