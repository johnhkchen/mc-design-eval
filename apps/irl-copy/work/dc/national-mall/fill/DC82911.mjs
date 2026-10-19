// DC82911: a vacant early-1900s red-brick commercial block at 853 New Jersey Avenue SE, read from the lidar record. The
// footprint is mostly open yard (no roof in the lidar), with one-storey wings, two- and three-storey blocks in the
// north-east, and a four-storey slice on the west edge. Red brick walls with a stone-brick base course, smooth limestone
// string courses at each storey line, a stone-brick cornice, glass panes in brick-pier bays, and one entrance under a
// stone hood on the tallest street-facing run.
//
// Storeys are two blocks (window row, then a limestone band) on the 0.42 scale; the roof is the smoothed lidar tier.
// Each column fills from y 0 to its ground as foundation, then its storeys up to its tier. Cells one step behind a
// window are air at the window row, with the band below and above as the floor and ceiling; a few of those rooms hold
// a glowstone behind the glass. Open yard cells are paved at their ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC82911.cells.json`, "utf8"));
const W = 33, D = 35, H = 20;

const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => byXZ.has(key(x, z));
const FACES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];

// Lidar roof: the median of the non-zero roofs in the 3x3 neighbourhood (kills single-cell noise, keeps the yard open).
const roofOf = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = byXZ.get(key(x + dx, z + dz)); if (c && c.r > 0) v.push(c.r);
  }
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
};

// Per cell: open yard, or a block of 2-block storeys on a one-block cornice course (top = ground + 2s + 1).
const info = new Map();
for (const [x, z, g] of cells) {
  const R = byXZ.get(key(x, z)).r > 0 ? roofOf(x, z) : 0;
  const open = R <= g;
  const s = open ? 0 : Math.max(1, Math.round((R - g - 1) / 2));
  info.set(key(x, z), { x, z, g, open, s, T: open ? g : g + 2 * s + 1 });
}
const at = (x, z) => info.get(key(x, z));
const building = (x, z) => { const c = at(x, z); return !!c && !c.open; };

// Outward faces: a building cell whose neighbour is outside the footprint or open yard faces the street.
for (const c of info.values()) {
  c.fs = c.open ? [] : FACES.filter(([, dx, dz]) => !building(c.x + dx, c.z + dz)).map(([f]) => f);
  c.facade = c.fs.length > 0;
  // Piers every third cell along each face (by x on the north and south faces, by z on the east and west).
  c.pier = c.facade && c.fs.some((f) => ((f === "N" || f === "S") ? c.x : c.z) % 3 === 0);
}

// The entrance: a north- or south-facing cell on the outside of the footprint (not onto the yard), with the most storeys,
// nearest the middle of the Mall face.
const onStreet = (c) => FACES.filter(([, dx, dz]) => !inside(c.x + dx, c.z + dz)).map(([f]) => f);
const cands = [...info.values()].filter((c) => c.facade && c.s >= 2 && (onStreet(c).includes("N") || onStreet(c).includes("S")));
cands.sort((a, b) => (b.s - a.s) || (Math.abs(a.x - 16) - Math.abs(b.x - 16)));
const DOOR = cands[0];
const DOOR_FACE = onStreet(DOOR).includes("N") ? "N" : "S";
for (const c of info.values()) c.door = c === DOOR;

// A window is a facade cell that is not a pier and not the door; a room is an interior cell one step behind a window.
// Only a window on the same ground opens onto a room, so storey rows line up across the step.
const isWindow = (c, g) => !!c && c.facade && !c.pier && !c.door && c.g === g;
for (const c of info.values()) c.room = !c.facade && !c.open && FACES.some(([, dx, dz]) => isWindow(at(c.x + dx, c.z + dz), c.g));

// Blocks by position, so the glass panes can take their connections from their neighbours.
const blocks = new Map();
const put = (x, y, z, id, state) => blocks.set(`${x},${y},${z}`, { id, state });
const get = (x, y, z) => blocks.get(`${x},${y},${z}`);
const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);
const OUT = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", W: "west", E: "east" };
const HOOD = { facing: FACING[DOOR_FACE], half: "top", shape: "straight", waterlogged: "false" };

for (const c of info.values()) {
  const { x, z, g } = c;
  if (c.open) {                                                        // yard: foundation and a paved surface at its ground
    for (let y = 0; y < g; y++) put(x, y, z, "stone");
    put(x, g, z, "smooth_stone");
    continue;
  }
  for (let y = 0; y < g; y++) put(x, y, z, "stone");                  // foundation, so nothing floats on a slope
  const top = 2 * c.s;                                                  // storey row index of the cornice (L = top)
  for (let L = 0; L <= top; L++) {
    const y = g + L;
    if (c.door && (L === 1 || L === 2)) { put(x, y, z, "dark_oak_door", { facing: FACING[DOOR_FACE], half: L === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    if (c.door && L === 3) { put(x, y, z, "stone_brick_stairs", HOOD); continue; }
    if (L === 0) { put(x, y, z, c.facade ? "stone_bricks" : "bricks"); continue; }          // base course
    if (L === top) { put(x, y, z, c.facade ? "stone_bricks" : "smooth_stone"); continue; } // cornice / roof deck
    if (L % 2 === 0) { put(x, y, z, "smooth_stone"); continue; }                           // limestone string course = floor slab
    // window row (odd L)
    if (!c.facade) {
      if (c.room) continue;                                              // air behind the glass
      put(x, y, z, "bricks"); continue;
    }
    if (c.pier) { put(x, y, z, "bricks"); continue; }
    put(x, y, z, "glass_pane");
  }
  // Rooftop: brick chimney stacks on the interior of the taller tiers.
  if (!c.facade && c.s >= 3 && (x * 5 + z * 3) % 13 === 0) { put(x, c.T, z, "bricks"); put(x, c.T + 1, z, "bricks"); }
}

// Warm glass: some rooms behind a window carry a glowstone on their floor at window height.
for (const c of info.values()) {
  if (!c.facade || c.pier || c.door || c.open) continue;
  for (const f of c.fs) {
    const [ox, oz] = OUT[f];
    const ix = c.x - ox, iz = c.z - oz;
    const room = at(ix, iz);
    if (!room || !room.room || room.g !== c.g) continue;
    for (let L = 1; L < 2 * Math.min(c.s, room.s); L += 2) {
      if (hash(c.x, c.g + L, c.z) % 4 === 0) put(ix, room.g + L, iz, "glowstone");
    }
    break;
  }
}

// Window panes take their connections from their neighbours (a pane or a solid block on that side).
const connects = (x, y, z, dx, dz) => !!get(x + dx, y, z + dz);
const g = new Voxels([W, H, D]);
for (const [k, b] of blocks) {
  const [x, y, z] = k.split(",").map(Number);
  let state = b.state;
  if (b.id === "glass_pane") {
    state = {
      north: String(connects(x, y, z, 0, -1)),
      south: String(connects(x, y, z, 0, 1)),
      west: String(connects(x, y, z, -1, 0)),
      east: String(connects(x, y, z, 1, 0)),
      waterlogged: "false",
    };
  }
  g.set(x, y, z, b.id, state);
}

const out = g.save(`${DIR}/DC82911.nbt`);
console.log(`DC82911: ${out.blocks} blocks, ${out.palette} palette entries, door at (${DOOR.x},${DOOR.z}) facing ${DOOR_FACE}`);
