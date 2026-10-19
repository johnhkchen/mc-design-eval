// DC63650: Union Station, Washington DC. Daniel Burnham's Beaux-Arts terminal of 1907: Indiana limestone on a granite base,
// slate and copper roofs. The lidar record gives a stepped massing: an 18-block central pavilion (the Great Hall and its
// vault) falling in setbacks through 15, 12 and 9 to 6-block wings at the edges. The principal front is the side the
// grid's lower-left edge faces (low x, high z: the raised ground), and the portal sits on the middle of that side.
//
// A storey is 3 blocks: a floor line (granite base course at grade, quartz spandrels above) and two window rows.
// Every column fills solid from y 0 up to its roof, so each setback and wing stands on what is below it. Glass panes
// with arms along the wall, calcite piers every third cell, quartz pillars with a stone-brick balustrade on the parapet.
// Interiors are an air gap behind the glazed cells, with a stone floor per storey and lamps standing on the floors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC63650.cells.json`, "utf8"));
const [W, H, D] = [92, 30, 70];

const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => byXZ.has(key(x, z));
const FACES = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];

// Lidar roof: median of the 3x3 neighbourhood, then the nearest of five flat tiers (wings, then 9, 12, 15, 18 for the core).
const TIERS = [6, 9, 12, 15, 18];
const tierOf = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(byXZ.get(key(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  const r = v[v.length >> 1];
  return TIERS.reduce((best, t) => (Math.abs(t - r) < Math.abs(best - r) ? t : best));
};

// Exposed faces: the footprint edge, and any side that steps down a tier or more (a setback).
const info = new Map();
for (const [x, z, g] of cells) {
  const T = tierOf(x, z);
  const faces = FACES.filter(([, dx, dz]) => !inside(x + dx, z + dz) || tierOf(x + dx, z + dz) <= T - 3)
    .map(([name, dx, dz]) => ({ name, dx, dz }));
  info.set(key(x, z), { x, z, g, T, faces, facade: faces.length > 0 });
}
const at = (x, z) => info.get(key(x, z));

// The coordinate along the wall a face sits on: z for the west and east faces, x for the north and south ones.
const alongOf = (name, x, z) => (name === "west" || name === "east" ? z : x);
for (const c of info.values()) c.pier = c.facade && c.faces.some((f) => alongOf(f.name, c.x, c.z) % 3 === 0);

// Portal: the middle of the largest group of footprint-edge faces on the front (low x, high z: dz - dx > 0).
const front = {};
for (const c of info.values()) for (const f of c.faces) {
  if (inside(c.x + f.dx, c.z + f.dz) || f.dz - f.dx <= 0) continue;
  (front[f.name] ??= []).push(c);
}
const [portalFace, frontCells] = Object.entries(front).sort((a, b) => b[1].length - a[1].length)[0];
const sortedAlong = frontCells.map((c) => alongOf(portalFace, c.x, c.z)).sort((a, b) => a - b);
const mid = sortedAlong[sortedAlong.length >> 1];
const centre = frontCells.reduce((best, c) =>
  Math.abs(alongOf(portalFace, c.x, c.z) - mid) < Math.abs(alongOf(portalFace, best.x, best.z) - mid) ? c : best);
const pc = alongOf(portalFace, centre.x, centre.z);
for (const c of frontCells) {
  const off = alongOf(portalFace, c.x, c.z) - pc;
  if (Math.abs(off) <= 2) c.portal = off;                  // 0 = door, ±1 = glazed bay, ±2 = pilaster
}

// Glazed cells: window bays, and the glass beside or in the portal. Rooms are the interior cells behind them.
const glazed = (c) => c.facade && !c.pier && (c.portal === undefined || Math.abs(c.portal) <= 1);
for (const c of info.values()) {
  c.room = !c.facade && [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => at(c.x + dx, c.z + dz) && glazed(at(c.x + dx, c.z + dz)));
}

const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);
const door = (half, facing) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
const paneState = (c) => {
  const f = c.faces[0];
  const ew = f.dz !== 0;                                  // the wall runs east-west on a north or south face
  return { north: String(!ew), south: String(!ew), east: String(ew), west: String(ew) };
};
const LANTERN = { hanging: "false", waterlogged: "false" };
const PARAPET = { north: "low", south: "low", east: "low", west: "low" };

// The block for one cell at height y: [id, state] or null for air.
const blockAt = (c, y) => {
  const { x, z, g, T } = c;
  if (y < g) return c.facade ? ["polished_granite"] : ["stone"];                 // foundation to the cell's ground
  if (y === T - 1) {                                                              // parapet on the edges, roof deck inside
    if (!c.facade) return ["deepslate_tiles"];
    return c.pier ? ["quartz_pillar"] : ["stone_brick_wall", PARAPET];
  }
  const rel = (y - g) % 3;
  const storey = Math.floor((y - g) / 3);
  if (rel === 0) {                                                                // floor line
    if (!c.facade) return ["stone"];
    return storey === 0 ? ["polished_granite"] : ["smooth_quartz"];               // base course at grade, quartz spandrels
  }
  if (c.facade) {                                                                 // window rows
    if (c.pier) return ["calcite"];
    if (c.portal !== undefined && Math.abs(c.portal) === 2) return ["quartz_pillar"];
    if (c.portal === 0 && storey === 0) return ["iron_door", door(rel === 1 ? "lower" : "upper", portalFace)];
    if (c.portal !== undefined && Math.abs(c.portal) === 1 && storey === 0) return ["glass"];
    return ["glass_pane", paneState(c)];
  }
  if (!c.room) return ["stone"];
  if (rel === 1) {                                                                // lamps stand on the floor line
    const h = hash(x, y, z) % 19;
    if (h === 0) return ["lantern", LANTERN];
    if (h === 1) return ["shroomlight"];
    if (h === 2) return ["glowstone"];
  }
  return null;                                                                    // air behind the glass
};

const g = new Voxels([W, H, D]);
for (const c of info.values()) {
  for (let y = 0; y < c.T; y++) {
    const b = blockAt(c, y);
    if (b) g.set(c.x, y, c.z, b[0], b[1]);
  }
  // A few vents on the low interior roofs (sparse, so they read as plant rather than specks).
  if (!c.facade && c.T <= 12 && (c.x * 7 + c.z * 13) % 89 === 0) g.set(c.x, c.T, c.z, "copper_block");
}
console.log(g.save(`${DIR}/DC63650.nbt`), { portalFace, portalAt: [centre.x, centre.z] });
