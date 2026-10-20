import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1960s-70s Taipei commercial block: stone plinth, shopfront ground storey,
// two upper storeys of white-painted walls with glass-and-mullion window bays,
// flat red-tile roof behind a smooth parapet, and a small central roof housing.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1241584057";
const W = 24, H = 23, D = 28;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map(([x, z, g]) => [x, z, Math.round(g)]);
const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, g]) => [key(x, z), g]));

const L = Math.min(...cells.map(c => c[2]));          // lowest ground: storey datum
const minX = Math.min(...cells.map(c => c[0]));
const maxX = Math.max(...cells.map(c => c[0]));
const minZ = Math.min(...cells.map(c => c[1]));
const maxZ = Math.max(...cells.map(c => c[1]));
const doorX = Math.floor((minX + maxX) / 2);          // front door on the north face

const FACE = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

function facings(x, z) {
  const out = [];
  for (const [name, [dx, dz]] of Object.entries(FACE)) {
    if (!ground.has(key(x + dx, z + dz))) out.push(name);
  }
  return out;
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Wall (ring) content by height above datum r = y - L
function wallBlock(r, door, mull) {
  if (r < 0) return null;
  if (r === 0) return ["stone_bricks"];                       // base course
  if (r === 1) return ["smooth_quartz"];                      // ground storey band
  if (r >= 2 && r <= 4) {                                     // shopfront storey
    if (door && r === 2) return ["oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }];
    if (door && r === 3) return ["oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }];
    if (mull) return ["white_concrete"];
    return ["glass_pane"];
  }
  if (r === 5) return ["smooth_quartz"];                      // lintel
  if (r === 6) return ["smooth_quartz"];                      // floor-2 string course
  if (r >= 7 && r <= 9) return mull ? ["white_concrete"] : ["glass_pane"];
  if (r === 10) return ["smooth_quartz"];                     // cornice
  if (r === 11) return ["smooth_quartz"];                     // parapet
  if (r === 12) return ["stone_brick_slab", { type: "bottom", waterlogged: "false" }]; // cap
  return null;
}

// Interior / roof content for non-wall footprint cells
function roofBlock(x, z, r) {
  if (r === 1) return ["smooth_stone"];                       // ground floor slab
  if (r === 6) return ["smooth_stone"];                       // floor-2 slab
  if (r === 11) return ["red_terracotta"];                    // flat red-tile roof
  const inPent = x >= minX + 7 && x <= maxX - 7 && z >= minZ + 9 && z <= maxZ - 9;
  if (inPent) {
    if (r === 12 || r === 13) return ["smooth_quartz"];       // roof housing
    if (r === 14) return ["stone_brick_slab", { type: "bottom", waterlogged: "false" }];
  }
  return null;
}

const TOP = Math.min(L + 14, H - 1);

for (const [x, z, gc] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gc && y < H; y++) put(x, y, z, "stone_bricks");

  const outs = facings(x, z);
  const ring = outs.length > 0;
  const corner = outs.length >= 2;
  const face = outs.includes("north") ? "north" : outs[0];
  const idx = (face === "north" || face === "south") ? x - minX : z - minZ;
  const mull = ring && (corner || idx % 3 === 0);
  const door = ring && outs.includes("north") && x === doorX;

  for (let y = Math.max(gc, 0); y <= TOP; y++) {
    const r = y - L;
    const c = ring ? wallBlock(r, door, mull) : roofBlock(x, z, r);
    if (c) put(x, y, z, c[0], c[1]);
  }
}

// Warm lanterns just inside selected window bays (dusk read from the street)
for (const [x, z, gc] of cells) {
  const outs = facings(x, z);
  if (outs.length === 0) continue;
  const face = outs.includes("north") ? "north" : outs[0];
  const idx = (face === "north" || face === "south") ? x - minX : z - minZ;
  const corner = outs.length >= 2;
  const mull = corner || idx % 3 === 0;
  const door = outs.includes("north") && x === doorX;
  if (mull || door || idx % 6 !== 2) continue;

  const [dx, dz] = FACE[face];
  const ix = x - dx, iz = z - dz;
  if (!ground.has(key(ix, iz))) continue;
  if (facings(ix, iz).length > 0) continue;                  // must be interior
  const igr = ground.get(key(ix, iz));

  // shopfront lantern (ground storey) and upper-storey lantern
  for (const yy of [L + 2, L + 7]) {
    if (yy >= igr && yy < H) put(ix, yy, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
