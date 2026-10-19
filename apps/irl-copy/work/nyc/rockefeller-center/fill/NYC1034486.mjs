// 592 Fifth Avenue, 1911 commercial and office building: a 33 x 12 block limestone-and-brick office block of about 14
// storeys (the roof is 48 blocks, about 53 m). x runs along the block; z = 0 is the Fifth Avenue front (north), z = 11
// the rear. A granite plinth and shopfronts on the ground floor, a calcite base to the fourth storey, brick piers above
// it, storey lines of calcite every 3 blocks, a calcite cornice and a parapet. Windows are glass panes in an iron-bar
// mullion grid, with air behind the glass and a floor slab per storey; some panes have glowstone behind them. Massing
// follows the lidar as flat tiers: the lower wing (37) at x 30-32, the east block (44) at x 21-29, the west block (48),
// and a 50 attic pavilion at x 4-11, z 3-9. Light courts (lidar roof 0) stay open ground. Roof kit: a penthouse on the
// east roof and a water tower on legs on the west roof. The entrance is a recessed bay with an iron door and a canopy.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const OUT = `${DIR}/NYC1034486.nbt`;
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034486.cells.json`, "utf8"));
const X = 33, Z = 12, Y = 54;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const groundAt = (x, z) => cell.get(`${x},${z}`).ground;

// Roof tiers (block heights above y 0), smoothed from the lidar. A roof of 0 inside the footprint is a light court.
const roofAt = (x, z) => {
  if (!inFoot(x, z) || cell.get(`${x},${z}`).roof === 0) return 0;
  if (x >= 30) return 37;
  if (x >= 21) return 44;
  if (x >= 4 && x <= 11 && z >= 3 && z <= 9) return 50;
  return 48;
};
// Open at height y: outside the footprint, or the roof there is at or below y.
const open = (x, y, z) => roofAt(x, z) <= y;

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };   // outward from the building
const facesAt = (x, y, z) => Object.entries(DIRS).filter(([, [dx, dz]]) => open(x + dx, y, z + dz)).map(([d]) => d);

// Pane and bar connections: a face along x joins its neighbours east and west, a face along z north and south.
const connect = (d) => (d === "N" || d === "S"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// The facade block at a cell on outward face d (null at a corner). u is the position along the face, on a 4-block
// module: a pier at u % 4 = 0, an iron mullion at u % 4 = 2, glass in between.
const skin = (y, d, u, T, corner) => {
  if (y === T - 1) return { block: "smooth_stone" };            // parapet cap
  if (y === T - 2) return { block: "calcite" };                 // cornice
  if (y === 0) return { block: "polished_granite" };            // base course
  const pier = corner || u % 4 === 0;
  if (y < 3) return pier ? { block: "polished_granite" } : { block: "glass_pane", state: connect(d) };   // shopfronts
  if (y % 3 === 0) return { block: "calcite" };                 // storey lines
  if (pier) return { block: y < 12 ? "calcite" : "bricks" };    // limestone base to the fourth storey, brick above
  if (u % 4 === 2) return { block: "iron_bars", state: connect(d) };
  return { block: "glass_pane", state: connect(d) };
};

const g = new Voxels([X, Y, Z]);
const facades = [];

// 1. Foundation and core. Each cell is solid from y 0 to its ground (a granite plinth where it shows), the core is
// solid to its roof, a light court gets a paved floor at its ground.
for (const [key, { ground: G }] of cell) {
  const [x, z] = key.split(",").map(Number);
  const T = roofAt(x, z);
  if (T === 0) { for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks"); g.set(x, G, z, "smooth_stone"); continue; }
  for (let y = 0; y < G; y++) g.set(x, y, z, facesAt(x, y, z).length ? "polished_granite" : "stone_bricks");
  for (let y = G; y < T; y++) g.set(x, y, z, y === T - 1 ? "smooth_stone" : "stone");
}

// 2. Facades: every built cell at height y with an open neighbour on a face gets its skin.
for (const [key, { ground: G }] of cell) {
  const [x, z] = key.split(",").map(Number);
  const T = roofAt(x, z);
  if (!T) continue;
  for (let y = G; y < T; y++) {
    const fd = facesAt(x, y, z);
    if (!fd.length) continue;
    const corner = fd.length > 1, d = fd[0];
    const u = d === "N" || d === "S" ? x : z;
    const spec = skin(y, corner ? null : d, u, T, corner);
    g.set(x, y, z, spec.block, spec.state);
    facades.push({ x, y, z, d: corner ? null : d, u, spec, corner });
  }
}

// 3. Window cavities: behind each glass or bar in a window row sits one block of air (the cell inside it, if that cell
// is part of the building and is not itself exposed). Floor slabs stay solid at storey lines. A few panes have
// glowstone in the cavity, set on the lower sill row so it stands on the slab below.
const lit = [];
for (const f of facades) {
  if (f.corner || !f.d || f.y % 3 === 0 || f.y < 1) continue;
  if (f.spec.block !== "glass_pane" && f.spec.block !== "iron_bars") continue;
  const [dx, dz] = DIRS[f.d];
  const qx = f.x - dx, qz = f.z - dz;
  if (!inFoot(qx, qz) || roofAt(qx, qz) <= f.y || facesAt(qx, f.y, qz).length) continue;
  g.set(qx, f.y, qz, "air");
  if (f.y % 3 === 1 && (f.x * 3 + f.z * 5 + f.y) % 9 === 0) lit.push([qx, f.y, qz]);
}
for (const [x, y, z] of lit) g.set(x, y, z, "glowstone");

// 4. Entrance: a recessed bay on the Fifth Avenue front at x 10-12, granite jambs, an iron door, and a canopy over
// the bay at the fourth row (a slab on the storey line, so nothing hangs).
for (const x of [10, 12]) for (const y of [1, 2]) g.set(x, y, 0, "polished_granite");
const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
g.set(11, 1, 0, "iron_door", door("lower"));
g.set(11, 2, 0, "iron_door", door("upper"));
for (const x of [10, 11, 12]) g.set(x, 4, 0, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

// 5. Roof kit. A penthouse on the east roof (44) and a water tower on nine oak legs on the west roof (48).
for (let x = 23; x <= 26; x++) for (let z = 3; z <= 7; z++) {
  for (const y of [44, 45]) g.set(x, y, z, "stone_bricks");
  g.set(x, 46, z, "smooth_stone");
}
for (let x = 14; x <= 16; x++) for (let z = 6; z <= 8; z++) {
  for (const y of [48, 49]) g.set(x, y, z, "oak_log", { axis: "y" });
  for (let y = 50; y <= 52; y++) g.set(x, y, z, "spruce_planks");
}
for (let x = 14; x <= 16; x++) for (let z = 6; z <= 8; z++) g.set(x, 53, z, "dark_oak_slab", { type: "top", waterlogged: "false" });

// 6. Check: every block stands on a block or is held by one beside it (a floor slab rests on the walls), or is a
// door's upper half.
const hanging = [];
for (let x = 0; x < X; x++) for (let y = 1; y < Y; y++) for (let z = 0; z < Z; z++) {
  const b = g.get(x, y, z);
  if (!b || b.block === "minecraft:iron_door" && b.state?.half === "upper") continue;
  const held = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => g.get(x + dx, y, z + dz));
  if (!g.get(x, y - 1, z) && !held) hanging.push([x, y, z, b.block]);
}
if (hanging.length) console.warn(`hanging blocks: ${hanging.length}`, hanging.slice(0, 12));

const { blocks, palette } = g.save(OUT);
console.log(`NYC1034486: ${blocks} blocks, ${palette} palette entries, ${facades.length} facade cells, ${lit.length} lit panes -> ${OUT}`);
