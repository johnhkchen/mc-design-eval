// Geothermal House, Auckland: a 1930s concrete-and-plaster commercial block, two storeys on its
// eastern core and one-storey wings, with a shopfront on the south (street) face. Massing follows
// the lidar roof: roof <= 6 snaps to a one-storey wing (top 5), roof >= 7 to the two-storey core
// (top 8, parapet to 9). Every column stands on solid ground from y 0; floor slabs at y 4 and the
// core's roof deck at y 7 are held by the perimeter walls, so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_769194868.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..16, z 0..21

const foot = new Map();                                    // "x,z" -> { ground, top }
for (const [x, z, ground, roof] of cells) foot.set(`${x},${z}`, { ground, top: roof >= 7 ? 8 : 5 });
const inF = (x, z) => foot.has(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z) => Object.keys(DIRS).filter(d => !inF(x + DIRS[d][0], z + DIRS[d][1]));
const rowMin = {}, colMin = {};
for (const k of foot.keys()) { const [x, z] = k.split(",").map(Number); rowMin[z] = Math.min(rowMin[z] ?? x, x); colMin[x] = Math.min(colMin[x] ?? z, z); }

// along each face: a pier every 4th cell, two glazed bays, then a cream spandrel. Corners are piers.
const faceIndex = (x, z, face) => (face === "N" || face === "S") ? x - rowMin[z] : z - colMin[x];
const DOOR = "11,21";                                      // a 1-wide door on the south (street) face
const DOOR_STATE = { facing: "south", hinge: "left", open: "false", powered: "false" };

// each perimeter cell's role: pier, window, shopfront, or wall; the single-face cells say which way they look
const role = new Map();
for (const k of foot.keys()) {
  const [x, z] = k.split(",").map(Number), fs = exposed(x, z);
  if (!fs.length) continue;
  if (fs.length > 1) { role.set(k, { pier: true }); continue; }
  const face = fs[0], c = faceIndex(x, z, face);
  if (k === DOOR) { role.set(k, { face, door: true }); continue; }
  if (c % 4 === 0) role.set(k, { face, pier: true });
  else if (face === "S") role.set(k, { face, shop: true, win: true });   // the street face: shopfront glass
  else if (c % 4 === 1 || c % 4 === 2) role.set(k, { face, win: true });
  else role.set(k, { face, wall: true });
}

// interior light spots: behind an upper window (c % 4 == 1 on the core) and behind the shopfront
const glow = new Set(), lamp = new Set();
for (const [k, r] of role) {
  if (!r.win && !r.shop) continue;
  const [x, z] = k.split(",").map(Number), [dx, dz] = DIRS[r.face];
  const inward = `${x - dx},${z - dz}`;
  if (!foot.has(inward) || exposed(...inward.split(",").map(Number)).length) continue;   // the cell behind must be interior
  if (r.shop) lamp.add(inward);
  else if (foot.get(k).top === 8 && faceIndex(x, z, r.face) % 4 === 1) glow.add(inward);
}

const B = new Map();                                       // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });

for (const [k, { ground: gr, top }] of foot) {
  const [x, z] = k.split(",").map(Number), r = role.get(k) ?? {};
  if (!role.has(k)) {                                      // interior: plinth, floor slabs, roof deck, an air gap
    for (let y = 0; y < gr; y++) put(x, y, z, "stone");
    put(x, 4, z, "smooth_stone");
    if (top === 8) put(x, 7, z, "smooth_stone");
    if (glow.has(k) && top === 8) put(x, 5, z, "glowstone");
    if (lamp.has(k)) put(x, gr, z, "lantern", { hanging: "false", waterlogged: "false" });
    continue;
  }

  for (let y = 0; y < gr; y++) put(x, y, z, "polished_andesite");           // plinth up to the lidar ground
  const topY = top === 8 ? 8 : 4;                                          // parapet on the core, cornice on the wings
  for (let y = gr; y <= topY; y++) {
    if (y <= 2) {                                                          // the ground storey
      if (r.door) { put(x, y, z, "dark_oak_door", { ...DOOR_STATE, half: y === gr ? "lower" : "upper" }); continue; }
      if (y === gr && !r.shop) { put(x, y, z, "polished_andesite"); continue; }   // the base course
      if (r.pier) { put(x, y, z, "polished_andesite"); continue; }
      if (r.shop) { put(x, y, z, "glass"); continue; }                      // shopfront glass down to the pavement
      if (r.win) { put(x, y, z, "glass_pane"); continue; }
      put(x, y, z, "smooth_quartz"); continue;
    }
    if (y === 3) { put(x, y, z, r.door || r.pier ? "polished_andesite" : "smooth_quartz"); continue; }   // lintel; the door's hood
    if (y === 4) { put(x, y, z, "stone_bricks"); continue; }               // string course / cornice
    if (y === 8) { put(x, y, z, "polished_andesite"); continue; }          // parapet cap
    // the core's second storey (y 5-7): piers, glazed bays, and a head course at y 7
    if (r.pier) put(x, y, z, "polished_andesite");
    else if (y === 7 || !r.win) put(x, y, z, "smooth_quartz");
    else put(x, y, z, "glass_pane");
  }
}

// a plant box on the core's roof, two cells in from the edge
for (const k of ["9,13", "10,13", "9,14", "10,14"]) {
  const [x, z] = k.split(",").map(Number);
  put(x, 8, z, "stone_bricks"); put(x, 9, z, "stone_bricks"); put(x, 10, z, "iron_block");
}

// pane connections: a pane joins the wall or pane beside it along its face, never out of the face.
// A pane with nothing beside it on its face would stand as a bare post, so it becomes wall instead.
const SOLID = new Set(["smooth_quartz", "polished_andesite", "stone_bricks", "glass_pane", "glass"]);
for (const [key, v] of B) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number), face = role.get(`${x},${z}`).face;
  const solid = (dx, dz) => SOLID.has(B.get(`${x + dx},${y},${z + dz}`)?.block);
  const onNS = face === "N" || face === "S";
  if (!(onNS ? solid(1, 0) || solid(-1, 0) : solid(0, 1) || solid(0, -1))) { B.set(key, { block: "smooth_quartz", state: undefined }); continue; }
  v.state = { north: String(!onNS && solid(0, -1)), south: String(!onNS && solid(0, 1)),
    east: String(onNS && solid(1, 0)), west: String(onNS && solid(-1, 0)), waterlogged: "false" };
}

const g = new Voxels([17, 21, 22]);
for (const [key, { block, state }] of B) { const [x, y, z] = key.split(",").map(Number); g.set(x, y, z, block, state); }
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_769194868.nbt";
const { blocks, palette } = g.save(out);
console.log(`saved ${out}: ${blocks} blocks, palette ${palette}`);
