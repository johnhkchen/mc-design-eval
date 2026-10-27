// Number 3 Khyber Reservoir (OSM way 509405335): a covered concrete service reservoir with a grassed earth cover, not a
// commercial building, so no windows or shopfronts. Its read is a massive plinth-and-pilaster concrete mass with storey
// bands every 4 blocks, vent grilles in the bay middles, a parapet rim, grass on top, two valve chambers, one access door
// on the north face and warm lanterns. The footprint is a diagonal: a main tier at 11 blocks and a lower wing at 10.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_509405335.cells.json", "utf8"));
const W = 83, H = 24, D = 78;

const at = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const has = (x, z) => at.has(`${x},${z}`);
const faces = (x, z) => ({ n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) });
const edgeOf = (x, z) => { const f = faces(x, z); return f.n || f.s || f.w || f.e; };

// Lidar roof heights are noisy: median of the 3x3 footprint neighbourhood, then two flat tiers (11 main, 10 wing)
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];
const tier = new Map();
for (const key of at.keys()) {
  const [x, z] = key.split(",").map(Number), near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (has(x + dx, z + dz)) near.push(at.get(`${x + dx},${z + dz}`).roof);
  const m = median(near);
  tier.set(key, m >= 11 ? 11 : m >= 9 ? 10 : m);
}

const g = new Voxels([W, H, D]);
const set = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (const [key, { ground }] of at) {
  const [x, z] = key.split(",").map(Number);
  const R = tier.get(key), gr = ground;
  const f = faces(x, z), edge = edgeOf(x, z);
  const ns = f.n || f.s, ew = f.e || f.w;
  const pilaster = edge && ((ns && x % 6 === 0) || (ew && z % 6 === 0));
  const bayMid = edge && ((ns && x % 6 === 3) || (ew && z % 6 === 3));
  const topY = Math.max(R - 1, gr);                       // the grass surface row

  for (let y = 0; y < gr; y++) set(x, y, z, "stone");     // foundation under the ground
  for (let y = gr; y <= topY; y++) {
    if (y === topY) { set(x, y, z, "grass_block"); continue; }                       // earth cover
    if (y === topY - 1) { set(x, y, z, "dirt"); continue; }
    let block = "white_concrete";
    if (edge && y < gr + 2) block = "stone_bricks";                                  // base course
    else if (edge && pilaster) block = "light_gray_concrete";                        // pilaster bays
    else if (edge && y % 4 === 0) block = "smooth_stone";                            // storey lines
    else if (edge && bayMid && (y === 5 || y === 6)) block = "iron_bars";            // vent grille
    if (block === "iron_bars") set(x, y, z, block, { north: "true", south: "true", east: "true", west: "true" });
    else set(x, y, z, block);
  }
  if (edge) set(x, topY + 1, z, "stone_bricks");          // parapet rim on the earth cover
}

// Two valve chambers on the grassed top, 2x2 each, on interior cells
for (const [ax, az] of [[30, 40], [55, 58]]) {
  const sq = [[ax, az], [ax + 1, az], [ax, az + 1], [ax + 1, az + 1]];
  if (!sq.every(([x, z]) => has(x, z) && !edgeOf(x, z))) continue;
  for (const [x, z] of sq) {
    const R = tier.get(`${x},${z}`);
    set(x, R, z, "light_gray_concrete");
    set(x, R + 1, z, "light_gray_concrete");
  }
}

// Access door on the main tier's west face (the north edge's lowest cells are the lower wing's tip): a bay middle
// nearest the middle of that face (z 40)
let door = null;
for (const [key] of at) {
  const [x, z] = key.split(",").map(Number);
  if (tier.get(key) !== 11 || !faces(x, z).w || z % 6 !== 3) continue;
  if (!door || Math.abs(z - 40) < Math.abs(door.z - 40)) door = { x, z, gr: at.get(key).ground };
}
if (door) {
  const { x, z, gr } = door;
  set(x, gr, z, "iron_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
  set(x, gr + 1, z, "iron_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
  set(x, gr + 2, z, "lantern", { hanging: "true" });   // hangs from the wall above the door
}

// Warm lanterns standing on the parapet rim at intervals around the edge
for (const [key] of at) {
  const [x, z] = key.split(",").map(Number);
  if (!edgeOf(x, z) || (x + z) % 16 !== 0) continue;
  set(x, tier.get(key) + 1, z, "lantern", { hanging: "false" });
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_509405335.nbt";
const info = g.save(out);
console.log(`way_509405335: ${info.blocks} blocks, palette ${info.palette}, door ${door ? `west at x${door.x} z${door.z}` : "none"}`);
