// DC76820: 10 G St NE, a Commercial-Office-Large read from the lidar record as a 1970s glazed office block: three
// storeys of white precast spandrels and tinted glass ribbons on a dark stone base, a four-storey core rising two
// blocks above the wings, a stepped-down notch on the north side, and a one-bay portico on the south face (the only
// street-side opening the footprint has). Tiers are read from the raw lidar roof values (2 terrace, 8, 12, 14); the
// 13 cells on the west wing join the 12 wing. Storeys sit on an absolute 4-block rhythm (spandrel, two glass rows,
// floor line), so neighbouring columns line up where the ground steps. Each column fills from y 0 to its ground as
// foundation, then its storeys to its tier, capped by a light-gray cornice that is also the roof deck. Windows are
// reveals: the glass sits in the room one block behind the outer face, so the piers and spandrels stand proud of it.
// Rooms (two cells deep behind the glass) are air at the glass rows with a floor slab per storey; deeper cells are solid.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC76820.cells.json`, "utf8"));
const W = 50, D = 14, H = 18;

const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => byXZ.has(key(x, z));
const FACES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];

// Lidar roof -> flat tier: the raw values already come in clean steps (2, 8, 12, 13, 14); 13 joins the 12 wing.
const tierOf = (r) => (r <= 3 ? 2 : r <= 10 ? 8 : r <= 13 ? 12 : 14);

const faces = (x, z) => FACES.filter(([, dx, dz]) => !inside(x + dx, z + dz)).map(([f]) => f);
const DOOR_CELLS = [[24, 13], [25, 13]];                              // the south portico, two cells wide
const isDoor = (x, z) => DOOR_CELLS.some(([dx, dz]) => dx === x && dz === z);

const info = new Map();
for (const [x, z, G, R] of cells) {
  const fs = faces(x, z);
  const facade = fs.length > 0;
  const door = isDoor(x, z);
  // Piers every third cell along each face (by x on north and south, by z on east and west); corners always piers.
  const pier = facade && !door && (fs.length >= 2 || fs.some((f) => ((f === "N" || f === "S") ? x : z) % 3 === 0));
  info.set(key(x, z), { x, z, g: G, T: tierOf(R), facade, door, pier, fs });
}
const at = (x, z) => info.get(key(x, z));
// A bay is a glass facade cell (not pier, not door). Its window sits one block back: the bay's own cell is air at the
// glass rows and the glass is the room cell behind it, so the piers and spandrels stand proud of the glazing (reveals).
const isBay = (x, z) => { const c = at(x, z); return !!c && c.facade && !c.pier && !c.door; };
const inward = (c) => {
  const [dx, dz] = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }[c.fs[0]];
  return at(c.x + dx, c.z + dz);
};
// A bay is recessed at y when its inward cell is interior and still standing that high (the reveal has a room to sit in).
const recessed = (c, y) => {
  if (!c.facade || c.pier || c.door || c.fs.length !== 1 || (y % 4 !== 1 && y % 4 !== 2)) return false;
  const d = inward(c);
  return !!d && !d.facade && y >= d.g && d.T > y;
};
// The interior cell that carries a recessed bay's glass at y.
const receivesGlass = (d, y) => !d.facade && y >= d.g && y < d.T && FACES.some(([, dx, dz]) => {
  const n = at(d.x + dx, d.z + dz);
  return !!n && n.facade && recessed(n, y) && inward(n) === d;
});
// Rooms: interior cells behind a bay, and one cell further in, so the glass has air behind it.
for (const c of info.values()) {
  const nearBay = (k) => FACES.some(([, dx, dz]) => isBay(k.x + dx, k.z + dz));
  c.room = !c.facade && (nearBay(c) || FACES.some(([, dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !!n && !n.facade && nearBay(n); }));
}

const FOUND = "stone_bricks", BASE = "stone_bricks", SLAB = "smooth_stone", SPAN = "white_concrete";
const CORNICE = "light_gray_concrete", PIER = "white_concrete", GLASS = "gray_stained_glass_pane";
const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);
const DOOR = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
const CANOPY = { facing: "south", half: "top", shape: "straight", waterlogged: "false" };
const LANTERN = { hanging: "false", waterlogged: "false" };

// The block for one cell at height y: [id, state] or null for air. Glass is returned as GLASS and dressed later.
const blockAt = (c, y) => {
  const { x, z, g: G, T } = c;
  if (y < G) return [c.facade ? BASE : FOUND];                         // foundation under the lowest ground
  if (y === T - 1) return [CORNICE];                                    // cornice, and the roof deck over interiors
  if (!c.facade) {
    const rel = y % 4;
    if (rel === 0 || rel === 3) return [SLAB];                         // floor slab and ceiling
    if (receivesGlass(c, y)) return [GLASS];                           // the glass of a recessed window
    if (!c.room) return [SLAB];                                        // deep interior: solid
    if (rel === 1) {                                                   // a lamp needs a floor under it
      const h = hash(x, y, z) % 19;
      if (h === 0) return ["lantern", LANTERN];
      if (h === 1) return ["shroomlight"];
      if (h === 2) return ["glowstone"];
    }
    return null;                                                       // air behind the glass
  }
  if (c.door) {
    if (y === G) return ["iron_door", DOOR("lower")];
    if (y === G + 1) return ["iron_door", DOOR("upper")];
    if (y === 2) return [GLASS];                                       // transom glass over the doors
    if (y === 3) return [SLAB];                                        // solid lintel carrying the canopy
    if (y === 4) return ["stone_brick_stairs", CANOPY];                // canopy lip, top half
  }
  if (y === G) return [BASE];                                          // dark base course on the ground storey
  const rel = y % 4;
  if (c.pier) return [PIER];
  if (rel === 0 || rel === 3) return [SPAN];                           // spandrels and floor lines
  if (recessed(c, y)) return null;                                     // the reveal: glass one block back
  return [GLASS];
};

// Roof plant: two-high air-handling boxes on interior cells of the wings, and a set-back penthouse on the core.
const rooftop = (c) => {
  if (c.facade) return null;
  if (c.T === 14 && c.x >= 21 && c.x <= 28 && c.z >= 4 && c.z <= 6) return ["white_concrete", 2];
  if (c.room || c.T < 12) return null;
  return (c.x % 6 === 2 && c.z % 4 === 1) ? ["light_gray_concrete", 2] : null;
};

const g = new Voxels([W, H, D]);
const glass = [];
for (const c of info.values()) {
  for (let y = 0; y < c.T; y++) {
    const b = blockAt(c, y);
    if (!b) continue;
    if (b[0] === GLASS) { glass.push([c.x, y, c.z]); g.set(c.x, y, c.z, GLASS); continue; }
    g.set(c.x, y, c.z, b[0], b[1]);
  }
  const plant = rooftop(c);
  if (plant) for (let k = 0; k < plant[1]; k++) g.set(c.x, c.T + k, c.z, plant[0]);
}

// Panes join their neighbours and any solid, so the glazing reads as continuous ribbons with frames, not posts.
for (const [x, y, z] of glass) {
  const link = (dx, dz) => g.get(x + dx, y, z + dz) !== null;
  g.set(x, y, z, GLASS, {
    north: String(link(0, -1)), south: String(link(0, 1)), east: String(link(1, 0)), west: String(link(-1, 0)),
    waterlogged: "false",
  });
}

const out = `${DIR}/DC76820.nbt`;
const res = g.save(out);
console.log(`built ${out}: ${res.blocks} blocks, palette ${res.palette}`);
