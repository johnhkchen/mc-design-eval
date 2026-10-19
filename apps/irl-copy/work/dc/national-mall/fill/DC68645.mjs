// DC68645: a 1970s Commercial-Office on Virginia Avenue SW, read from the lidar record. A 12-block precast-concrete podium
// with a 15-block tower stepping up from its centre, lidar 13 spurs on the podium deck as plant. Light-gray spandrels and
// white piers frame blue-tinted glass in every storey, a stone base course, a stone hood and bronze-coloured door on the
// south front, a parapet cap on each tier and lantern-lit rooms behind the glass.
//
// Storeys sit on absolute 3-block rhythms (floor line, two glass rows) so neighbouring columns line up where the ground
// steps. Each column fills from y 0 to its ground as foundation; a face counts as exposed at height y when it has no
// neighbour rising above y, so the tower's walls glaze down onto the podium roof. Exposed cells carry the facade; cells
// one step behind a glass bay are air at the glass rows with a floor slab per storey; deeper cells are solid.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC68645.cells.json`, "utf8"));
const W = 26, D = 23, H = 18;

const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => byXZ.has(key(x, z));
const FACES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];

// Lidar roof: median of the 3x3 neighbourhood (kills single-cell noise). Two masses: the podium at 12, the tower at 15.
const medianRoof = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(byXZ.get(key(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
};

const info = new Map();
for (const [x, z, G] of cells) {
  const m = medianRoof(x, z);
  const tower = m >= 14;
  info.set(key(x, z), { x, z, g: G, T: tower ? 15 : 12, plant: !tower && m >= 13, door: false });
}
const at = (x, z) => info.get(key(x, z));

// Entrance: the south front, the cell nearest the middle of the front row.
const front = cells.filter(([x, z]) => !inside(x, z + 1)).sort((a, b) => b[1] - a[1] || Math.abs(a[0] - 12) - Math.abs(b[0] - 12));
const ENTRY = { x: front[0][0], z: front[0][1] };
at(ENTRY.x, ENTRY.z).door = true;
const nearDoor = (c) => c.z === ENTRY.z && Math.abs(c.x - ENTRY.x) === 1;
const inHood = (c) => c.z === ENTRY.z && Math.abs(c.x - ENTRY.x) <= 1;

// Exposed faces at height y: outside the footprint, or the neighbour's top is at or below y.
const shell = (c, y) => FACES.filter(([, dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.T <= y; }).map(([f]) => f);
// Piers every third cell along each exposed face (by x on the north and south faces, by z on the east and west).
const isPier = (c, fs) => fs.some((f) => ((f === "N" || f === "S") ? c.x : c.z) % 3 === 0);

const FOUND = "stone", BASE = "stone_bricks", SPAN = "light_gray_concrete", PIER = "white_concrete", SLAB = "smooth_stone", CAP = "smooth_stone", CORE = "stone";
const GLASS = "light_blue_stained_glass_pane";
const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);
const DOOR = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
const HOOD = { facing: "south", half: "top", shape: "straight", waterlogged: "false" };
const LANTERN = { hanging: "false", waterlogged: "false" };

// Whether the cell at y is a glazed bay (exposed, not a spandrel, pier, door, hood or entrance surround).
const isGlass = (c, y) => {
  if (c.door || nearDoor(c) || inHood(c)) return false;
  if (y < c.g || y === 0 || y === c.T - 1 || y % 3 === 0) return false;
  const fs = shell(c, y);
  return fs.length > 0 && !isPier(c, fs);
};

// What fills the cell at height y: a kind name, or null for air.
const kindAt = (c, y) => {
  const fs = shell(c, y);
  if (y < c.g) return fs.length ? "base" : "core";
  if (c.door && (y === 1 || y === 2)) return "door";
  if (fs.length && y === 0) return "base";
  if (y === c.T - 1) return "cap";
  if (fs.length) {
    if (inHood(c) && y === 3) return "hood";
    if (inHood(c) && y === 4) return "header";
    if (y % 3 === 0) return "span";
    if (nearDoor(c) || isPier(c, fs)) return "pier";
    return "glass";
  }
  if (y % 3 === 0) return "slab";
  const room = FACES.some(([, dx, dz]) => { const n = at(c.x + dx, c.z + dz); return n && isGlass(n, y); });
  return room ? "room" : "core";
};

const blockFor = (c, y, kind) => {
  switch (kind) {
    case "base": return [BASE];
    case "core": return [CORE];
    case "door": return ["iron_door", DOOR(y === 1 ? "lower" : "upper")];
    case "hood": return ["stone_brick_stairs", HOOD];
    case "header": return [SLAB];
    case "cap": return [CAP];
    case "span": return [SPAN];
    case "pier": return [PIER];
    case "slab": return [SLAB];
    case "glass": return [GLASS];
    default: return null;
  }
};

const g = new Voxels([W, H, D]);
const glass = [];
for (const c of info.values()) {
  for (let y = 0; y < c.T; y++) {
    const kind = kindAt(c, y);
    if (kind === "room") {                                           // lamps in some rooms, standing on a floor, behind the glass
      if (y % 3 === 1) {
        const h = hash(c.x, y, c.z) % 37;
        if (h === 0) g.set(c.x, y, c.z, "lantern", LANTERN);
        else if (h === 1) g.set(c.x, y, c.z, "shroomlight");
        else if (h === 2) g.set(c.x, y, c.z, "glowstone");
      }
      continue;
    }
    if (kind === null) continue;
    const b = blockFor(c, y, kind);
    if (!b) continue;
    if (kind === "glass") { glass.push([c.x, y, c.z]); g.set(c.x, y, c.z, GLASS); continue; }
    g.set(c.x, y, c.z, b[0], b[1]);
  }
  // Rooftop plant: the 13-block lidar spurs on the podium deck, as one plant box each.
  if (c.plant) g.set(c.x, c.T, c.z, SPAN);
}

// Panes join their neighbours and any solid, so the glazing reads as continuous bays with frames, not posts.
for (const [x, y, z] of glass) {
  const link = (dx, dz) => g.get(x + dx, y, z + dz) !== null;
  g.set(x, y, z, GLASS, {
    north: String(link(0, -1)), south: String(link(0, 1)), east: String(link(1, 0)), west: String(link(-1, 0)),
    waterlogged: "false",
  });
}

const out = `${DIR}/DC68645.nbt`;
const res = g.save(out);
console.log(`built ${out}: ${res.blocks} blocks, palette ${res.palette}, entry ${ENTRY.x},${ENTRY.z}`);
