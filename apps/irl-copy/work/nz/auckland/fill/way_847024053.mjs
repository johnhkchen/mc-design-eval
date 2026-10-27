// Way 847024053, Mt Eden / CBD ridge, Auckland. Decided from the record: a five-storey, flat-roofed 1970s concrete office
// block, the commercial stock Auckland built in that decade. Stone-base plinth and foundation down to the lidar ground,
// cream precast piers and spandrels, blue-tinted glazing in 3-block bays, a dark shopfront on the ground floor, a
// parapet cap, a plant room with a lift overrun on the roof, and warm lamps in the rooms behind some windows.
// Storeys are 4 blocks from y 0 (the lowest ground); the roof lidar gives 21 blocks, a lower wing gives 12.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_847024053.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_847024053.nbt";

const FLOORS = [4, 8, 12, 16];                       // storey slabs; storey s runs from 4s to 4s+3
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const at = (x, z) => F.get(key(x, z));

// Lidar clean-up: a roof a few blocks above its own ground is noise (one 3-high sliver on a 21-high tower): take the
// neighbours' roof. Then snap to two clean tiers: the tower (21) and the lower wing (12).
const near = (c) => {
  const out = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = at(c.x + dx, c.z + dz); if (n && n !== c) out.push(n); }
  return out;
};
for (const c of F.values()) {
  let r = c.r;
  if (r - c.g < 6) {
    const ok = near(c).filter((n) => n.r - n.g >= 6).map((n) => n.r).sort((a, b) => a - b);
    r = ok.length ? ok[ok.length >> 1] : 21;
  }
  c.R = r >= 17 ? 21 : r >= 9 ? 12 : r;
}

// Walls: a cell with a neighbour outside the footprint is the facade ring; its face is the first outward direction.
for (const c of F.values()) {
  c.faces = DIRS.filter(([dx, dz]) => !at(c.x + dx, c.z + dz));
  c.ring = c.faces.length > 0;
  c.face = c.faces[0];
}

// Entrance: the middle bay of the widest street-level face on the uphill (lowest ground) side.
const front = [...F.values()].filter((c) => c.ring && c.R === 21 && c.g <= 1);
const groups = new Map();
for (const c of front) groups.set(c.face[2], [...(groups.get(c.face[2]) ?? []), c]);
const weight = (list) => list.filter((c) => c.g === 0).length * 2 + list.length;
const [, faceCells] = [...groups].sort((a, b) => weight(b[1]) - weight(a[1]))[0];
const along = (c) => (c.face[0] ? c.z : c.x);
faceCells.sort((a, b) => along(a) - along(b));
const doorC = faceCells[faceCells.length >> 1];
const [dx, dz] = doorC.face;
const [ax, az] = dx ? [0, 1] : [1, 0];                       // along the entrance wall
const outAt = (k, m) => [doorC.x + dx * m + ax * k, doorC.z + dz * m + az * k];   // m blocks out from the wall, k along it
const inward = dx ? (dx > 0 ? "west" : "east") : dz > 0 ? "north" : "south";

const pierAt = (c) => along(c) % 3 === 0;                    // every third column is a precast pier
const plant = (c) => !c.ring && c.R === 21 && c.x >= 26 && c.x <= 34 && c.z >= 9 && c.z <= 15;
const overrun = (c) => plant(c) && c.x >= 28 && c.x <= 31 && c.z >= 10 && c.z <= 12;

function facade(c, y) {
  const s = y >> 2, o = y & 3;
  if (c === doorC && s === 0 && (o === 1 || o === 2)) {
    return ["dark_oak_door", { facing: c.face[2], half: o === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  }
  if (s === 0) return o === 3 ? ["white_concrete"] : pierAt(c) ? ["black_concrete"] : ["glass"];   // shopfront: dark frames, clear glass, pale fascia
  if (o === 3) return pierAt(c) ? ["light_gray_concrete"] : ["white_concrete"];      // spandrel under each window band
  return pierAt(c) ? ["light_gray_concrete"] : ["light_blue_stained_glass"];        // tinted glazing between piers
}

// Warm lamps standing in the room just inside a lit window (on the storey's floor slab, behind the glass).
const lit = new Set();
for (const c of F.values()) {
  if (!c.ring) continue;
  const inner = at(c.x - c.face[0], c.z - c.face[1]);
  if (!inner || inner.ring) continue;
  const bay = Math.floor(along(c) / 3);
  for (let s = 0; s < 5; s++) {
    const y = 4 * s + 1;
    if (y < c.g || y >= c.R - 1 || inner.R <= y) continue;
    const [name] = facade(c, y);
    if (name !== "glass" && name !== "light_blue_stained_glass") continue;
    if (s === 0 ? bay % 2 === 0 : (s + bay) % 3 === 0) lit.add(`${inner.x},${y},${inner.z}`);
  }
}

function block(c, y) {
  if (y < c.g) return ["stone_bricks"];                                       // foundation down to the lidar ground
  if (y === 0) return ["stone_bricks"];                                       // base course and ground floor slab
  if (y === c.R - 1) return c.ring ? ["smooth_stone"] : ["gray_concrete"];    // parapet cap and roof membrane
  if (FLOORS.includes(y)) return ["light_gray_concrete"];                     // floor slab, and the string course on the facade
  if (c.ring) return facade(c, y);
  if (lit.has(`${c.x},${y},${c.z}`)) return ["glowstone"];
  return null;                                                                // room air behind the glass
}

// Roof equipment above the 21-block roof: a plant room, and a lift overrun on top of it.
function topper(c, y) {
  if (!plant(c)) return null;
  if (y < 24) return y < 23 ? ["white_concrete"] : ["smooth_stone"];
  if (!overrun(c)) return null;
  return y < 27 ? ["light_gray_concrete"] : ["smooth_stone"];
}

const V = new Voxels([44, 34, 35]);
for (const c of F.values()) {
  for (let y = 0; y < c.R; y++) {
    const b = block(c, y);
    if (b) V.set(c.x, y, c.z, b[0], b[1]);
  }
  for (let y = c.R; y <= 27; y++) {
    const b = topper(c, y);
    if (b) V.set(c.x, y, c.z, b[0], b[1]);
  }
}

// Entrance approach: a stone step up from the pavement to the threshold, a black canopy on two posts, a lantern under it.
const stair = { facing: inward, half: "bottom", shape: "straight", waterlogged: "false" };
for (const k of [-1, 0, 1]) {
  const [x1, z1] = outAt(k, 1), [x2, z2] = outAt(k, 2);
  V.set(x1, 0, z1, "stone_brick_stairs", stair);
  V.set(x1, 3, z1, "black_concrete");
  V.set(x2, 3, z2, "black_concrete");
  if (k !== 0) for (let y = 0; y <= 2; y++) V.set(x2, y, z2, "iron_block");
}
const [lx, lz] = outAt(0, 1);
V.set(lx, 2, lz, "lantern", { hanging: "true", waterlogged: "false" });

const info = V.save(OUT);
const ys = [...F.values()].map((c) => c.R);
console.log(`way_847024053: ${info.blocks} blocks, ${info.palette} palette, footprint ${F.size} cells, roof ${Math.min(...ys)}..${Math.max(...ys)}, ${lit.size} lamps, door at x${doorC.x} z${doorC.z} (${doorC.face[2]})`);
