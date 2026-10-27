// Commerce A, Auckland (OSM way 23893825): a three-storey brick commercial block of the 1920s-30s, stripped-classical
// in its bands and parapet, with a basalt plinth, a timber shopfront at street level and a flat gray roof with plant.
// The lidar roof is flat at 13 everywhere (the 12s on the perimeter are noise), so the massing is one flat tier with
// no setbacks. Storeys are 4 blocks, counted from each cell's own ground so the downhill side gains its extra storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23893825.cells.json", "utf8"));
const TOP = 13;            // lidar roof, flattened: the deck sits at y 12, the parapet at y 13
const DECK = TOP - 1;

const F = new Map();       // "x,z" -> { g }
for (const [x, z, g] of cells) F.set(`${x},${z}`, { g });
const inF = (x, z) => F.has(`${x},${z}`);

// the envelope: a footprint cell with any of its eight neighbours outside the footprint
const ring = (x, z) => { for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if ((dx || dz) && !inF(x + dx, z + dz)) return true; return false; };
const isRing = new Map();
for (const k of F.keys()) { const [x, z] = k.split(",").map(Number); isRing.set(k, ring(x, z)); }
const onRing = (x, z) => isRing.get(`${x},${z}`) === true;

// depth from the outside (ring = 0), so roof plant can sit well in from the parapet
const depth = new Map();
const queue = [];
for (const [k, r] of isRing) if (r) { depth.set(k, 0); queue.push(k); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i].split(",").map(Number), d = depth.get(queue[i]);
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const k = `${x + dx},${z + dz}`;
    if (F.has(k) && !depth.has(k)) { depth.set(k, d + 1); queue.push(k); }
  }
}

// outward direction of an envelope cell: the sum of its outside neighbours, reduced to the dominant axis
function outward(x, z) {
  let sx = 0, sz = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if ((dx || dz) && !inF(x + dx, z + dz)) { sx += dx; sz += dz; }
  if (Math.abs(sx) >= Math.abs(sz)) return { dx: Math.sign(sx), dz: 0, facing: sx > 0 ? "east" : "west", axis: "x" };
  return { dx: 0, dz: Math.sign(sz), facing: sz > 0 ? "south" : "north", axis: "z" };
}

const v = new Voxels([62, 26, 63]);
const glass = (x, z, y, axis) => {
  // a pane joins the facade line: north-south on an east/west face, east-west on a north/south face
  const s = axis === "x" ? { north: "true", south: "true", east: "false", west: "false" } : { north: "false", south: "false", east: "true", west: "true" };
  v.set(x, y, z, "glass_pane", { ...s, waterlogged: "false" });
};
const door = (x, z, y, facing, half) => v.set(x, y, z, "dark_oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });

// 1. foundation: basalt plinth from y 0 up to each cell's ground
for (const [k, { g }] of F) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < g; y++) v.set(x, y, z, "stone_bricks");
}

// 2. storeys: a floor slab at each cell's ground and every 4 above it (up to y 11); the deck at y 12; parapet at 13
for (const [k, { g }] of F) {
  const [x, z] = k.split(",").map(Number);
  const env = onRing(x, z);
  const slabs = new Set();
  for (let s = g; s <= DECK - 1; s += 4) slabs.add(s);
  for (let y = g; y <= DECK; y++) {
    if (slabs.has(y)) {
      if (!env) v.set(x, y, z, "smooth_stone");                       // interior floor slab
      else v.set(x, y, z, y === g ? "stone_bricks" : "smooth_quartz"); // base course, then string courses
      continue;
    }
    if (y === DECK) { v.set(x, y, z, env ? "smooth_quartz" : "gray_concrete"); continue; }   // cornice and roof deck
    if (!env) continue;                                                 // interior air behind the envelope
    const s0 = Math.max(...[...slabs].filter((s) => s < y));              // the storey's floor slab
    const k3 = y - s0, ground = s0 === g, t = x + z, pier = t % 5 === 0, mullion = t % 5 === 2;
    const { axis, facing } = outward(x, z);
    if (pier) { v.set(x, y, z, ground ? "stone_bricks" : "bricks"); continue; }
    if (ground) {
      if (k3 === 3 || mullion) v.set(x, y, z, "dark_oak_planks");      // fascia and mullions of the shopfront
      else if (t % 23 === 7) door(x, z, y, facing, k3 === 1 ? "lower" : "upper");   // entrances, one bay in twenty-three
      else glass(x, z, y, axis);
      continue;
    }
    if (k3 === 3) v.set(x, y, z, "smooth_quartz");                        // lintel course
    else if (mullion) v.set(x, y, z, "white_concrete");
    else glass(x, z, y, axis);
  }
  if (env) v.set(x, TOP, z, "bricks");                                    // parapet on the envelope
}

// 3. warm light: a glowstone or shroomlight just behind some glazed bays, one block in from the glass (in the air gap)
for (const [k, { g }] of F) {
  const [x, z] = k.split(",").map(Number);
  if (!onRing(x, z)) continue;
  const t = x + z;
  if (t % 5 !== 1) continue;
  const { dx, dz } = outward(x, z);
  const ix = x - dx, iz = z - dz;                                         // one step inward
  if (!inF(ix, iz) || onRing(ix, iz)) continue;
  const floor = Math.floor(t / 5);
  let y = null, block = null;
  if (floor % 4 === 0) { y = g + 1; block = "glowstone"; }                 // shopfront
  else if ((floor + g) % 3 === 0 && g + 5 <= DECK) { y = g + 5; block = "glowstone"; }
  else if (floor % 5 === 2) { y = g + 5; block = "shroomlight"; }
  if (y === null || y > DECK - 1) continue;
  v.set(ix, y, iz, block);
}

// 4. roof plant: a few 3x2 plant boxes well in from the parapet, on the deck
for (let x0 = 4; x0 < 60; x0 += 9) for (let z0 = 4; z0 < 60; z0 += 9) {
  let ok = true;
  for (let dx = 0; dx < 3 && ok; dx++) for (let dz = 0; dz < 2 && ok; dz++) {
    const d = depth.get(`${x0 + dx},${z0 + dz}`);
    if (d === undefined || d < 4) ok = false;
  }
  if (!ok) continue;
  for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 2; dz++) for (let y = TOP; y <= TOP + 1; y++) v.set(x0 + dx, y, z0 + dz, "light_gray_concrete");
}

const counts = v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23893825.nbt");
console.log(`way_23893825: ${counts.blocks} blocks, ${counts.palette} palette entries, ${F.size} footprint cells, ${[...isRing.values()].filter(Boolean).length} envelope cells`);
